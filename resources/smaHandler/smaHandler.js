var lexBotId = process.env['LEX_BOT_ID'];
var lexBotAliasId = process.env['LEX_BOT_ALIAS_ID'];
var accountId = process.env['ACCOUNT_ID'];
var voiceConnectorArn = process.env['VOICE_CONNECTOR_ARN'];
var departmentDirectory = process.env['DEPARTMENT_DIRECTORY'];
var REGION = process.env['REGION'];

import { GetCommand, DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';

const ddbClient = new DynamoDBClient({ region: REGION });
const marshallOptions = {
  convertEmptyValues: false,
  removeUndefinedValues: true,
  convertClassInstanceToMap: false,
};

const unmarshallOptions = { wrapNumbers: false };
const translateConfig = { marshallOptions, unmarshallOptions };
const ddbDocClient = DynamoDBDocumentClient.from(ddbClient, translateConfig);

async function getRoute(department) {
  const params = {
    TableName: departmentDirectory,
    Key: {
      department_name: department,
    },
  };
  try {
    console.log(
      `Getting department: ${department} from ${departmentDirectory}`,
    );
    const data = await ddbDocClient.send(new GetCommand(params));
    console.log(`Success - ${JSON.stringify(data)}`);
    return data.Item;
  } catch (err) {
    console.log(`Error: ${err}`);
  }
}
exports.handler = async (event, context, callback) => {
  console.log('Lambda is invoked with calldetails:' + JSON.stringify(event));
  let actions;
  switch (event.InvocationEventType) {
    case 'NEW_INBOUND_CALL':
      console.log('NEW INBOUND CALL');
      startBotConversationAction.Parameters.Configuration.SessionState.SessionAttributes.phoneNumber =
        event.CallDetails.Participants[0].From;
      actions = [startBotConversationAction];
      break;
    case 'RINGING':
      console.log('RINGING');
      actions = [];
      break;
    case 'ACTION_SUCCESSFUL':
      console.log('ACTION SUCCESSFUL');
      switch (event.ActionData.Type) {
        case 'StartBotConversation':
          console.log('StartBotConversation Success');
          const callerIdNumber = event.CallDetails.Participants[0].From;
          const lexDepartment =
            event.ActionData.IntentResult.SessionState.Intent.Slots.Department
              .Value.InterpretedValue;
          const route = await getRoute(lexDepartment);
          console.log(`Route from DynamoDB: ${route}`);
          console.log(`lexDepartment from event: ${lexDepartment}`);
          switch (route.service) {
            case 'voiceConnector':
              console.log('Using Amazon Chime Voice Connector Routing');
              vcCallAndBridgeAction.Parameters.CallerIdNumber = callerIdNumber;
              vcCallAndBridgeAction.Parameters.SipHeaders['X-LexInfo'] =
                lexDepartment;
              vcCallAndBridgeAction.Parameters.Endpoints[0].Uri = route.number;
              actions = [vcCallAndBridgeAction];
              break;
            case 'pstnNumber':
              console.log('Using PSTN Routing');
              pstnCallAndBridgeAction.Parameters.CallerIdNumber =
                callerIdNumber;
              pstnCallAndBridgeAction.Parameters.Endpoints[0].Uri =
                route.number;
              actions = [pstnCallAndBridgeAction];
              break;
            default:
              break;
          }
          break;
        case 'CallAndBridge':
          console.log('NoOp for CallAndBridge ACTION SUCCESSFUL');
          actions = [];
          break;
        default:
          console.log('NoOp for default');
          actions = [];
          break;
      }
      break;
    case 'HANGUP':
      console.log('HANGUP ACTION');
      if (event.CallDetails.Participants[1]) {
        hangupAction.Parameters.CallId =
          event.CallDetails.Participants[1].CallId;
        actions = [hangupAction];
      }
      break;
    default:
      console.log('FAILED ACTION');
      actions = [];
  }
  const response = {
    SchemaVersion: '1.0',
    Actions: actions,
  };
  console.log('Sending response:' + JSON.stringify(response));
  callback(null, response);
};
var startBotConversationAction = {
  Type: 'StartBotConversation',
  Parameters: {
    BotAliasArn:
      'arn:aws:lex:us-east-1:' +
      accountId +
      ':bot-alias/' +
      lexBotId +
      '/' +
      lexBotAliasId,
    LocaleId: 'en_US',
    Configuration: {
      SessionState: {
        SessionAttributes: {
          phoneNumber: '',
        },
        DialogAction: {
          Type: 'ElicitIntent',
        },
      },
      WelcomeMessages: [
        {
          Content: 'What department would you like to be connected to?',
          ContentType: 'PlainText',
        },
      ],
    },
  },
};
var pstnCallAndBridgeAction = {
  Type: 'CallAndBridge',
  Parameters: {
    CallTimeoutSeconds: 30,
    CallerIdNumber: '',
    Endpoints: [
      {
        Uri: '',
        BridgeEndpointType: 'PSTN',
      },
    ],
  },
};
var vcCallAndBridgeAction = {
  Type: 'CallAndBridge',
  Parameters: {
    CallTimeoutSeconds: 30,
    CallerIdNumber: '',
    Endpoints: [
      {
        Uri: '',
        BridgeEndpointType: 'AWS',
        Arn: voiceConnectorArn,
      },
    ],
    SipHeaders: {
      'X-LexInfo': '',
    },
  },
};
var hangupAction = {
  Type: 'Hangup',
  Parameters: {
    SipResponseCode: '0',
    ParticipantTag: '',
  },
};
