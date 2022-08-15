# How to build a smart interactive voice response (IVR) call routing system

Interactive Voice Response (IVR) systems gather information from customers, help them find information quickly, and route callers to the right destination. An intelligent IVR system can help customers avoid frustration and complete tasks quickly. Using the [Amazon Chime SDK](https://aws.amazon.com/chime/chime-sdk), builders can easily create smart call routing IVR solutions to deliver a seamless end user experience using Amazon Chime Voice Connector SIP trunking or the Public Switched Telephone Network (PSTN).

## What is IVR Call Routing?

Interactive Voice Response (IVR) systems are phone routing tools that allow callers to hear specific information they ask for and gather information from a caller. IVRs work by providing prompts to callers and allowing them to respond using their own voice or via dual-tone multi frequency (DTMF) input on their phones. IVRs are commonly used in automated, self-service use cases to reduce the dependency on human interaction to obtain information or take specific actions. There is a high probability that you have interacted with an IVR if you have ever called a number to check your bank account balance, pay a bill, or get the status of a recent order. A second common IVR use case is to allow callers to be routed to destinations such as departments or external vendors that are on different telephone systems or contact centers (e.g. “speak to an agent”). The service supports bridging calls to PSTN phone numbers and SIP trunks using [Amazon Chime Voice Connectors](https://aws.amazon.com/chime/chime-sdk/features/#SIP_Trunking). In this blog post, we will show you how you can use these capabilities to create a simple IVR with Amazon Lex that can intelligently route calls between multiple telephone systems using the Amazon Chime SDK PSTN Audio service.

![Call Routing with Amazon Chime SDK PSTN Audio](https://d2908q01vomqb2.cloudfront.net/98fbc42faedc02492397cb5962ea3a3ffc0a9243/2022/08/13/CallRouting.png)

## What is Intelligent IVR?

Intelligent IVRs use artificial intelligence to route calls, rather than utilizing a customer service representative. In the architecture below, [Amazon Lex](https://aws.amazon.com/lex/) uses natural language processing to understand spoken commands, then routes a caller to the right destination. The [Amazon Chime SDK PSTN Audio service](https://aws.amazon.com/chime/chime-sdk/features/#Public_Switched_Telephone_Network_.28PSTN.29_Audio) integrates with Amazon Lex, and enables builders to create serverless applications that provide conversational interfaces for calls to or from the public switched telephone network (PSTN).

## How to Build an IVR: Solution Overview

Amazon Chime SDK PSTN Audio service works with an [AWS Lambda](https://aws.amazon.com/lambda/) function to provide programmable telephony and can be built to route calls based on a wide range of conditions. In this demo we will be using an Amazon Lex bot to capture information from a caller and use it to make a routing decision. Other conditions could be used such as the time of day, calling number, called number, or DTMF input. External data sources or services like [Amazon DynamoDB](https://aws.amazon.com/dynamodb/) can be accessed by the AWS Lambda function to inform the routing decision. ![Amazon Chime SDK PSTN Audio with Amazon Lex IVR](https://d2908q01vomqb2.cloudfront.net/98fbc42faedc02492397cb5962ea3a3ffc0a9243/2022/08/13/Overview.png)

### Prerequisites

Before getting started, you must have the following prerequisites:

- [Node JS v12+](https://nodejs.org/en/download/) and [npm](https://www.npmjs.com/get-npm) installed
- [yarn](https://classic.yarnpkg.com/en/docs/install) installed
- [AWS Command Line Interface](https://docs.aws.amazon.com/cli/latest/userguide/cli-chap-welcome.html) (AWS CLI) [installed](https://docs.aws.amazon.com/cli/latest/userguide/install-cliv2.html)
- AWS Account with appropriate permissions
- [AWS Service Quota](https://us-east-1.console.aws.amazon.com/servicequotas/home/services/chime/quotas) allowance for Amazon Chime SDK Phone Numbers

This demo also assumes intermediate knowledge of the Amazon Chime SDK PSTN Audio service and Amazon Lex. As a primer, we recommend completing the AWS workshop: [Building Telephony-Powered Applications with the Amazon Chime SDK PSTN Audio Service](https://catalog.us-east-1.prod.workshops.aws/workshops/30bd753c-9563-4c7c-8d1a-75460642550c/en-US). For background information on Amazon Lex and the terminology and features used in this demo, please see [Amazon Lex: How It Works](https://docs.aws.amazon.com/lex/latest/dg/how-it-works.html).

## Walkthrough

The [sample code](https://github.com/aws-samples/amazon-chime-pstn-audio-with-amazon-lex-ivr) referenced in this blog post will deploy a functional IVR demo that you can configure to route calls to either a Public Switched Telephone Network (PSTN) number or directly to an Amazon Chime SDK Voice Connector. This routing decision will be made based on the information passed from the Amazon Lex bot to the Amazon Chime SDK SIP media application. Calls routed to an Amazon Chime Voice Connector will contain additional Session Initiation Protocol (SIP) headers to pass information to the SIP user agent. At a high level, the demo consists of two components:

- Back-end resources that include:
  - AWS Lambda functions
  - Amazon Chime Voice Connectors and SIP media applications
  - Amazon DynamoDB Table
  - Amazon S3 Bucket
  - Amazon Lex bot
  - Amazon EC2 Instance and AWS Networking components used for the Asterisk Private Branch Exchange (PBX) phone system.
- Web-based SIP client that is deployed locally and can be used to answer the incoming call.

### Deploy Back-end Resources

Clone the demo repository and run yarn launch to deploy:

```bash
git clone https://github.com/aws-samples/amazon-chime-pstn-audio-with-amazon-lex-ivr
cd amazon-chime-pstn-audio-with-amazon-lex-ivr
yarn launch
```

### Deploy Web-based SIP Client

Change to the site directory and launch the web-based SIP client locally:

```
cd site
yarn
yarn run start
```

This will start a local server that can be accessed at `http://localhost:8080` Note: Deploying this demo and receiving traffic from the demo created in this post can incur AWS charges. Be sure to deprovision unused components when complete to avoid excess charges.

## How It Works

After deploying the CDK, a phone number will be provided to you as one of the outputs:

```
Outputs:
ChimeLexIVR.pstnPhoneNumber = +1NPANXXXXXX
```

## Pre-loading session information to the Amazon Lex bot using Amazon Chime SDK PSTN Audio

When this number is called, it will be delivered to an Amazon Chime SDK PSTN Audio SIP media application. When the SIP media application answers, we will preload information into the Amazon Lex session, then the [startBotConversation](https://docs.aws.amazon.com/chime-sdk/latest/dg/start-bot-conversation.html) action will connect the call to an Amazon Lex bot.

```javascript
async function startSessions(event) {
  const putSessionCommandParams = {
    botAliasId: lexBotAliasId,
    botId: lexBotId,
    localeId: 'en_US',
    sessionId: event.CallDetails.Participants[0].CallId,
    sessionState: {
      SessionAttributes: {
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
    return True;
  } catch (err) {
    console.log(`Error: ${err}`);
  }
}
```

When the Amazon Chime SDK PSTN Audio SIP media application starts the Lex bot conversation, it will use the `CallId` of the caller as the `sessionId` within the Lex bot. We will use this to prepopulate the slot to be used when the conversation actually starts. In this case, we will use [`putSession`](https://docs.aws.amazon.com/lex/latest/dg/how-session-api.html) to tell the Lex bot to elicit a specific [`slot`](https://docs.aws.amazon.com/lexv2/latest/dg/build-slot-types.html) on a specific [`intent`](https://docs.aws.amazon.com/lexv2/latest/dg/build-intents.html) when the caller joins the conversation. This will allow us to immediately capture the department name from the caller.

```javascript
    exports.handler = async (event, context, callback) =>{
      console.log('Lambda is invoked with calldetails:' + JSON.stringify(event));
      let actions;
      switch (event.InvocationEventType) {
        case 'NEW_INBOUND_CALL':
         console.log('NEW INBOUND CALL');
         await startSessions(event);
         speakAction.Parameters.CallId = event.CallDetails.Participants[0].CallId;
         startBotConversationAction.Parameters.Configuration.SessionState.SessionAttributes.phoneNumber = event.CallDetails.Participants[0].From;
         actions = [speakAction, startBotConversationAction];
         break;
```

## Amazon Lex Bot Processing

The Amazon Lex bot built in the demo contains two intents: ![Amazon Lex Bot Intents](https://d2908q01vomqb2.cloudfront.net/98fbc42faedc02492397cb5962ea3a3ffc0a9243/2022/08/13/Intents-1024x285.png)Because we used putSession to elicit the `Department` slot on the `RouteCall` intent, we will be using that slot and looking for values within that slot.

![Amazon Lex Departments Slot](https://d2908q01vomqb2.cloudfront.net/98fbc42faedc02492397cb5962ea3a3ffc0a9243/2022/08/13/DepartmentsSlot-1024x835.png)

Once the Amazon Lex Bot captures the slot, we will need to verify that the Department spoken is a valid department. In order to do this, an optional code hook is used to perform validation. This code hook is an associated AWS Lambda function that will be executed at every turn of the conversation. ![Amazon Lex Code Hook Enabled](https://d2908q01vomqb2.cloudfront.net/98fbc42faedc02492397cb5962ea3a3ffc0a9243/2022/08/13/CodeHooks.png)

### Slot Validation

Once the Slot has been captured, validation will occur using a AWS Lambda [function](https://github.com/aws-samples/amazon-chime-pstn-audio-with-amazon-lex-ivr/blob/main/resources/lexHandler/index.py) associated to the Amazon Lex bot.

```python
    def RouteCall(intent_request):
        session_attributes = get_session_attributes(intent_request)
        slots = get_slots(intent_request)
        department = get_slot(intent_request, "Department")
        query_department = get_department(department)
        if query_department:
            print('querying department')
            text = "Connecting you to " + department + " department."
            message = {"contentType": "PlainText", "content": text}
            fulfillment_state = "Fulfilled"
            return close(session_attributes, "RouteCall", fulfillment_state, message)
        else:
            if 'failure_count' in session_attributes:
                print(f"Failure Count: {session_attributes['failure_count']}")
                if int(session_attributes['failure_count']) >= 2:
                    text = "Sorry, I couldn't find that department.  Let me connect you to an operator."
                    message = {"contentType": "PlainText", "content": text}
                    fulfillment_state = "Fulfilled"
                    return close(session_attributes, "RouteCall", fulfillment_state, message)
                else:
                    session_attributes['failure_count'] = int(session_attributes['failure_count']) +  1
                    try_ex(lambda: slots.pop("Department"))
                    text = "Sorry, I couldn't find that department.  Can you try again?"
                    message = {"contentType": "PlainText", "content": text}
                    return elicit_slot(session_attributes, intent_request["sessionState"]["intent"]["name"],slots,"Department",message)
            else:
                session_attributes['failure_count'] = 1
                try_ex(lambda: slots.pop("Department"))
                text = "Sorry, I couldn't find that department.  Can you try again?"
                message = {"contentType": "PlainText", "content": text}
                return elicit_slot(session_attributes, intent_request["sessionState"]["intent"]["name"],slots,"Department",message)
```

This AWS Lambda function will get the department spoken from the slot and compare that to a list of department names stored in an Amazon DynamoDB table pre-populated with sample department names (deployed as part of the CDK). The Amazon Lex CodeHook function is invoked with a JSON event that will be parsed. Below is a truncated example of the event. If a `department` is not found in slots, a failure will be recorded and tracked using the [session attributes](https://docs.aws.amazon.com/lex/latest/dg/context-mgmt-session-attribs.html) of the Amazon Lex bot. A failure will result in a retry of the slot. When the `failure_count` exceeds 2, the call will be completed as closed with a default route.

```json
{
  "sessionState": {
    "sessionAttributes": {},
    "activeContexts": [],
    "intent": {
      "slots": {
        "Department": {
          "shape": "Scalar",
          "value": {
            "originalValue": "history",
            "resolvedValues": ["history"],
            "interpretedValue": "history"
          }
        }
      },
      "confirmationState": "None",
      "name": "RouteCall",
      "state": "InProgress"
    },
    "originatingRequestId": "7be9976e-50df-4e07-9d99-670445c55102"
  }
}
```

`department` will be set to the `interpretatedValue` here. In this case, `department` will be `history`. This value is then queried against the Amazon DynamoDB table to see if it is a valid department. ![Amazon DynamoDB Departments Table](https://d2908q01vomqb2.cloudfront.net/98fbc42faedc02492397cb5962ea3a3ffc0a9243/2022/08/13/DynamoTable.png)

```python
    def get_department(department_name):
      try:
        response = dynamodb_client.get_item(
          Key={
            "department_name": {
              "S": str(department_name),
            },
          },
          TableName=department_table,
        )
        if "Item" in response:
          return True
        else:
          return False
      except Exception as err:
        logger.error("DynamoDB Query error: failed to fetch data from table. Error: ", exc_info=err)
        return None
```

When `history` is queried in the Amazon DynamoDB table, it returns a `True` value which will cause the AWS Lambda function to return the following to the Lex bot:

```json
{
  "messages": [
    {
      "contentType": "PlainText",
      "content": "Connecting you to history department."
    }
  ],
  "sessionState": {
    "dialogAction": { "type": "Close" },
    "sessionAttributes": {},
    "intent": { "name": "RouteCall", "state": "Fulfilled" }
  }
}
```

This JSON will tell the Amazon Lex bot the intent has been fulfilled and should be closed and play the `Connecting you to history department` message.

### Return to SIP media application

Once the RouteCall intent has been closed in the Amazon Lex bot, the information will be returned to the Amazon Chime SDK SIP media application and the associated AWS Lambda function will be invoked with an InvocationEventType: ACTION_SUCCESSFUL with Type: StartBotConversation indicating that the Amazon Lex processing was completed successfully. The AWS Lambda function associated with the Amazon Chime SDK SIP media application will then use the information it received to determine how to route the call:

```javascript
    case 'ACTION_SUCCESSFUL':
    console.log('ACTION SUCCESSFUL');
    switch (event.ActionData.Type) {
      case 'StartBotConversation':
      console.log('StartBotConversation Success');
      const callerIdNumber = event.CallDetails.Participants[0].From;
      let lexDepartment;
      let route = {};
      if ('Department' in event.ActionData.IntentResult.SessionState.Intent.Slots ) {
        lexDepartment = event.ActionData.IntentResult.SessionState.Intent.Slots.Department.Value.InterpretedValue;
        route = await getRoute(lexDepartment);
        console.log(`Route from DynamoDB: ${route}`);
        console.log(`lexDepartment from event: ${lexDepartment}`);
      } else {
        lexDepartment = 'Unknown';
        route.service = 'voiceConnector';
        route.number = '000000';
      }
      switch (route.service) {
        case 'voiceConnector':
          console.log('Using Amazon Chime Voice Connector Routing');
          vcCallAndBridgeAction.Parameters.CallerIdNumber = callerIdNumber;
          vcCallAndBridgeAction.Parameters.SipHeaders['X-LexInfo'] = lexDepartment;
          vcCallAndBridgeAction.Parameters.Endpoints[0].Uri = route.number;
          actions = [vcCallAndBridgeAction];
          break;
        case 'pstnNumber':
          console.log('Using PSTN Routing');
          pstnCallAndBridgeAction.Parameters.CallerIdNumber = callerIdNumber;
          pstnCallAndBridgeAction.Parameters.Endpoints[0].Uri = route.number;
          actions = [pstnCallAndBridgeAction];
          break;
        default:
          break;
        }
      break;
```

When the SIP media application determines that the `ACTION_SUCCESSFUL` is for a `StartBotConversation` ActionData Type, the AWS Lambda function will extract the `lexDepartment` from the json in the event if it exists.

```json
    "SessionState": {
      "SessionAttributes": {},
      "Intent": {
        "Name": "RouteCall",
        "Slots": {
          "Department": {
            "Value": {
              "OriginalValue": "history",
              "InterpretedValue": "history",
              "ResolvedValues": ["history"]
            },
            "Values": []
          }
        },
        "State": "Fulfilled",
        "ConfirmationState": "None"
      }
    },
```

It will then query the associated Department Amazon DynamoDB table to determine which service to use to route the call and the number to use as the Uri when making this call. In the above Table example, all of the calls will be routed to the Amazon Chime Voice Connector.

### Using CallAndBridgeAction to a Voice Connector

The `vcCallAndBridgeAction` and `pstnCallAndBridgeAction` will both bridge calls, however, the `vcCallAndBridgeAction` will allow you to send calls to an Amazon Chime Voice Connector instead of a PSTN number. This will allow you to send additional SIP headers in the INVITE.

```json
{
  "SchemaVersion": "1.0",
  "Actions": [
    {
      "Type": "CallAndBridge",
      "Parameters": {
        "CallTimeoutSeconds": 30,
        "CallerIdNumber": "+1NPANXXXXXX",
        "Endpoints": [
          {
            "Uri": "600300",
            "BridgeEndpointType": "AWS",
            "Arn": "arn:aws:chime:us-east-1:104621577074:vc/ehwryzdm9hy4u6rrud7jym"
          }
        ],
        "SipHeaders": {
          "X-LexInfo": "history"
        }
      }
    }
  ]
}
```

In this example, the call is placed with a URI containing `600300` and delivered to an Amazon Chime Voice Connector which will deliver the call to the associated host. ![](https://d2908q01vomqb2.cloudfront.net/98fbc42faedc02492397cb5962ea3a3ffc0a9243/2022/08/13/VoiceConnector.png) As shown in this example, the department captured in the Amazon Lex bot will be delivered as a SIP header to the Asterisk server that is built as part of this deployment. The Request URI will contain the URI defined in the `CallAndBridge` action combined with the Inbound route of the Amazon Chime Voice Connector.

```
INVITE sip:600300@192.0.2.31:5060;transport=UDP SIP/2.0
From: <sip:+1NPANXXXXXX@10.0.174.226:5060>;tag=56Htvc9UXX7Ug
To: <sip:600300@192.0.2.31:5060>;transport=UDP
X-Lexinfo: history
X-SMA-Max-Forwards: 4
X-VoiceConnector-ID: ehwryzdm9hy4u6rrud7jym
X-Amzn-TargetArn: arn:aws:chime:us-east-1:104621577074:vc/ehwryzdm9hy4u6rrud7jym
```

### SIP Client

Also included in this demo is a web-based SIP client that can optionally be used to answer the incoming call. This SIP client can be used to answer the call and establish two-way audio. ![](https://d2908q01vomqb2.cloudfront.net/98fbc42faedc02492397cb5962ea3a3ffc0a9243/2022/08/13/Client.png)

#### Audio Playback

If the included SIP client is not used, the Asterisk server will answer the call and play back a wav file to the caller based on the department captured in the Amazon Lex bot. During the EC2 instance deployment, a [Python script](https://github.com/aws-samples/amazon-chime-pstn-audio-with-amazon-lex-ivr/blob/main/resources/asteriskConfig/createWav.py) is executed as part of the [user-data](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/user-data.html) passed to the instance. This Python script will create wav files by calling Polly using [Boto3](https://boto3.amazonaws.com/v1/documentation/api/latest/index.html).

```python
    def createPolly(pollyText, fileName):
      response = polly.synthesize_speech(
        OutputFormat='pcm',
        Text=pollyText,
        SampleRate='8000',
        VoiceId='Joanna'
      )
```

### Using CallAndBridgeAction to a Phone Number

To route a call to a PSTN number, in the Amazon DynamoDB Table, change the service to pstnNumber and change the number to an E.164 number. For example: ![](https://d2908q01vomqb2.cloudfront.net/98fbc42faedc02492397cb5962ea3a3ffc0a9243/2022/08/13/EditTable.png)

## Cleaning up

To avoid incurring future charges, please clean up resources by running the following command from your terminal window:

    yarn destroy

## Conclusion

This blog post has demonstrated the benefits of integrating the programmatic telephony routing capabilities of Amazon Chime SDK PSTN Audio service with conversational interfaces powered by Amazon Lex. We’ve shown how these services can be used to build an IVR that can help intelligently route callers to multiple telephone systems, like a contact center, over Amazon Chime Voice Connector SIP trunking or the PSTN. The Amazon Chime SDK PSTN audio is available in US-East-1 and US-West-2 AWS regions. To learn more about the PSTN Audio conversational voice experience and call bridging, refer to the Amazon Chime SDK PSTN Audio Developer Guide and visit the GitHub Repository for the sample code.
