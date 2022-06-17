// resources/smaHandler/smaHandler.js
var lexBotId = process.env['LEX_BOT_ID'];
var lexBotAliasId = process.env['LEX_BOT_ALIAS_ID'];
var accountId = process.env['ACCOUNT_ID'];
var voiceConnectorArn = process.env['VOICE_CONNECTOR_ARN'];
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
        callAndBridgeAction.Parameters.CallerIdNumber =
          event.CallDetails.Participants[0].From;
        callAndBridgeAction.Parameters.SipHeaders['X-LexInfo'] =
          event.ActionData.IntentResult.SessionState.Intent.Slots.Department.Value.InterpretedValue;
        actions = [callAndBridgeAction];
        break;
      } else if (event.ActionData.Type == 'CallAndBridge') {
        break;
      } else {
        break;
      }
    case 'HANGUP':
      console.log('HANGUP ACTION');
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
var callAndBridgeAction = {
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
