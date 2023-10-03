import {
  DynamoDBClient,
  GetItemCommand,
  GetItemCommandInput,
  AttributeValue,
} from '@aws-sdk/client-dynamodb';
import {
  LexRuntimeV2Client,
  PutSessionCommand,
  PutSessionCommandInput,
} from '@aws-sdk/client-lex-runtime-v2';

import {
  ActionTypes,
  SipMediaApplicationEvent,
  SipMediaApplicationResponse,
  SpeakAction,
  PollyVoiceIds,
  PollyLanguageCodes,
  TextType,
  Engine,
  StartBotConversationAction,
  Actions,
  SchemaVersion,
  CallAndBridgeAction,
  HangupAction,
  BridgeEndpointType,
  SipResponseCode,
} from './sip-media-application';

const lexBotId = process.env.LEX_BOT_ID;
const lexBotAliasId = process.env.LEX_BOT_ALIAS_ID;
const accountId = process.env.ACCOUNT_ID;
const voiceConnectorArn = process.env.VOICE_CONNECTOR_ARN;
const departmentDirectory = process.env.DEPARTMENT_DIRECTORY;
const lambdaRegion = process.env.REGION;

const lexClient = new LexRuntimeV2Client({ region: lambdaRegion });
const dynamoDBClient = new DynamoDBClient({ region: process.env.AWS_REGION });

async function getRoute(department: string) {
  const params: GetItemCommandInput = {
    TableName: departmentDirectory,
    Key: {
      department_name: { S: department },
    },
  };

  try {
    console.log(
      `Getting department: ${department} from ${departmentDirectory}`,
    );
    const data = await dynamoDBClient.send(new GetItemCommand(params));
    console.log(`Success - ${JSON.stringify(data)}`);
    return deserializeDynamoDBItem(data.Item);
  } catch (err) {
    console.log(`Error: ${err}`);
    return false;
  }
}

async function startSessions(event: any) {
  const putSessionCommandParams: PutSessionCommandInput = {
    botAliasId: lexBotAliasId,
    botId: lexBotId,
    localeId: 'en_US',
    sessionId: event.CallDetails.Participants[0].CallId,
    sessionState: {
      sessionAttributes: {
        phoneNumber: event.CallDetails.Participants[0].From,
      },
      intent: {
        name: 'RouteCall',
      },
      dialogAction: { type: 'ElicitSlot', slotToElicit: 'Department' },
    },
  };

  try {
    console.log(JSON.stringify(putSessionCommandParams, null, 3));
    await lexClient.send(new PutSessionCommand(putSessionCommandParams));
    return true;
  } catch (err) {
    console.log(`Error: ${err}`);
    return false;
  }
}

export const handler = async (
  event: SipMediaApplicationEvent,
): Promise<SipMediaApplicationResponse> => {
  console.log('Lambda is invoked with call details:' + JSON.stringify(event));
  let actions: Actions = [];

  switch (event.InvocationEventType) {
    case 'NEW_INBOUND_CALL':
      console.log('NEW INBOUND CALL');
      await startSessions(event);
      actions = [
        speak(
          event.CallDetails.Participants[0].CallId,
          'What department would you like to be connected to?',
        ),
        startBotConversation(event.CallDetails.Participants[0].From),
      ];
      break;
    case 'RINGING':
      console.log('RINGING');
      actions = [];
      break;
    case 'ACTION_SUCCESSFUL':
      console.log('ACTION SUCCESSFUL');
      switch (event.ActionData!.Type) {
        case ActionTypes.START_BOT_CONVERSATION:
          console.log('StartBotConversation Success');
          const callerIdNumber = event.CallDetails.Participants[0].From;
          let lexDepartment;
          let route: any = {};

          if (
            'Department' in
            event.ActionData!.IntentResult.SessionState.Intent.Slots
          ) {
            lexDepartment =
              event.ActionData!.IntentResult.SessionState.Intent.Slots
                .Department.Value.ResolvedValues[0];
            console.log('Found Department:' + lexDepartment);
            route = await getRoute(lexDepartment);
            if (route === 'undefined') {
              console.log('No route found');
              lexDepartment = 'unknown';
              route.service = 'voiceConnector';
              route.number = '000000';
            }
          } else {
            console.log('No Department found');
            lexDepartment = 'unknown';
            route.service = 'voiceConnector';
            route.number = '000000';
          }
          console.log(`LexDepartment: ${lexDepartment}`);
          console.log(`Route: ${JSON.stringify(route)}`);
          switch (route.service) {
            case 'voiceConnector':
              console.log('Using Amazon Chime Voice Connector Routing');
              actions = [
                callAndBridgeVC(callerIdNumber, lexDepartment, route.number),
              ];
              break;
            case 'pstnNumber':
              console.log('Using PSTN Routing');
              actions = [callAndBridgePSTN(callerIdNumber, route.number)];
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
        actions = [hangup(event.CallDetails.Participants[1].CallId)];
      }
      break;
    default:
      console.log('FAILED ACTION');
      actions = [];
  }

  const response = {
    SchemaVersion: SchemaVersion.VERSION_1_0,
    Actions: actions,
  };

  console.log('Sending response:' + JSON.stringify(response));
  return response;
};

const hangup = (callId: string) => {
  const hangupAction: HangupAction = {
    Type: ActionTypes.HANGUP,
    Parameters: {
      CallId: callId,
      SipResponseCode: SipResponseCode.NORMAL,
    },
  };
  return hangupAction;
};

const callAndBridgePSTN = (callerIdNumber: string, uri: string) => {
  const callAndBridgePSTNAction: CallAndBridgeAction = {
    Type: ActionTypes.CALL_AND_BRIDGE,
    Parameters: {
      CallTimeoutSeconds: 30,
      CallerIdNumber: callerIdNumber,
      Endpoints: [
        {
          Uri: uri,
          BridgeEndpointType: BridgeEndpointType.PSTN,
        },
      ],
    },
  };
  return callAndBridgePSTNAction;
};

const callAndBridgeVC = (
  callerIdNumber: string,
  lexInfo: string,
  uri: string,
) => {
  const callAndBridgeVCAction: CallAndBridgeAction = {
    Type: ActionTypes.CALL_AND_BRIDGE,
    Parameters: {
      CallTimeoutSeconds: 30,
      CallerIdNumber: callerIdNumber,
      Endpoints: [
        {
          Uri: uri,
          BridgeEndpointType: BridgeEndpointType.AWS,
          Arn: voiceConnectorArn!,
        },
      ],
      SipHeaders: {
        'X-LexInfo': lexInfo,
      },
    },
  };
  return callAndBridgeVCAction;
};

const speak = (callId: string, text: string) => {
  const speakAction: SpeakAction = {
    Type: ActionTypes.SPEAK,
    Parameters: {
      CallId: callId,
      LanguageCode: PollyLanguageCodes.EN_US,
      Text: text,
      TextType: TextType.TEXT,
      VoiceId: PollyVoiceIds.JOANNA,
      Engine: Engine.NEURAL,
    },
  };
  return speakAction;
};

const startBotConversation = (phoneNumber: string) => {
  const startBotConversationAction: StartBotConversationAction = {
    Type: ActionTypes.START_BOT_CONVERSATION,
    Parameters: {
      BotAliasArn: `arn:aws:lex:${lambdaRegion}:${accountId}:bot-alias/${lexBotId}/${lexBotAliasId}`,
      Configuration: {
        SessionState: {
          SessionAttributes: {
            phoneNumber: phoneNumber,
          },
        },
      },
    },
  };
  return startBotConversationAction;
};

function deserializeDynamoDBItem(
  item?: Record<string, AttributeValue>,
): Record<string, any> | undefined {
  if (!item) {
    return undefined;
  }

  const deserializedItem: Record<string, any> = {};

  for (const key in item) {
    if (item.hasOwnProperty(key)) {
      const dynamoDBValue = item[key];

      if (dynamoDBValue) {
        // Check the type of the DynamoDB attribute and convert it to a JavaScript value
        switch (true) {
          case typeof dynamoDBValue.S !== 'undefined':
            deserializedItem[key] = dynamoDBValue.S;
            break;
          case typeof dynamoDBValue.N !== 'undefined':
            deserializedItem[key] = parseFloat(dynamoDBValue.N!);
            break;
          case typeof dynamoDBValue.M !== 'undefined':
            // Handle nested objects recursively
            deserializedItem[key] = deserializeDynamoDBItem(dynamoDBValue.M);
            break;
          // Add more cases for other data types as needed
          default:
            deserializedItem[key] = dynamoDBValue;
        }
      }
    }
  }

  return deserializedItem;
}
