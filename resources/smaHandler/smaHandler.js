// resources/smaHandler/smaHandler.js
var lexBotId = process.env['LEX_BOT_ID'];
var lexBotAliasId = process.env['LEX_BOT_ALIAS_ID'];
var accountId = process.env['ACCOUNT_ID'];
var voiceConnectorArn = process.env['VOICE_CONNECTOR_ARN'];
var art = process.env['ART_DEPARTMENT'];
var math = process.env['MATH_DEPARTMENT'];
var science = process.env['SCIENCE_DEPARTMENT'];
var history = process.env['HISTORY_DEPARTMENT'];

const departments = {};
art && (departments.art = art);
math && (departments.math = math);
science && (departments.science = science);
history && (departments.history = history);

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
      if (event.ActionData.Type == 'StartBotConversation') {
        const callerIdNumber = event.CallDetails.Participants[0].From;
        const lexDepartment =
          event.ActionData.IntentResult.SessionState.Intent.Slots.Department
            .Value.InterpretedValue;
        if (lexDepartment in departments) {
          pstnCallAndBridgeAction.Parameters.CallerIdNumber = callerIdNumber;
          pstnCallAndBridgeAction.Parameters.Endpoints[0].Uri =
            departments[lexDepartment];
          actions = [pstnCallAndBridgeAction];
        } else {
          vcCallAndBridgeAction.Parameters.CallerIdNumber = callerIdNumber;
          vcCallAndBridgeAction.Parameters.SipHeaders['X-Lexinfo'] =
            lexDepartment;
          actions = [vcCallAndBridgeAction];
        }
        break;
      } else if (event.ActionData.Type == 'CallAndBridge') {
        break;
      } else {
        break;
      }
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
        Uri: '+18155551212',
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
