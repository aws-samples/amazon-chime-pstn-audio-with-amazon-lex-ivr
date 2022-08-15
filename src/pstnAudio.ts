import { Duration, Stack } from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Architecture, Runtime } from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import * as chime from 'cdk-amazon-chime-resources';
import { Construct } from 'constructs';

interface PSTNAudioProps {
  readonly smaVoiceConnectorArn: string;
  readonly lexBotId: string;
  readonly lexBotAliasId: string;
  departmentDirectory: dynamodb.Table;
}

export class PSTNAudio extends Construct {
  public readonly smaId: string;
  public readonly smaHandlerLambda: NodejsFunction;
  public readonly pstnPhoneNumber: chime.ChimePhoneNumber;

  constructor(scope: Construct, id: string, props: PSTNAudioProps) {
    super(scope, id);

    const smaHandlerRole = new iam.Role(this, 'smaHandlerRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      inlinePolicies: {
        ['chimePolicy']: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              resources: ['*'],
              actions: ['chime:*'],
            }),
          ],
        }),
      },
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'service-role/AWSLambdaBasicExecutionRole',
        ),
      ],
    });

    this.smaHandlerLambda = new NodejsFunction(this, 'smaHandlerLambda', {
      entry: './resources/smaHandler/smaHandler.js',
      bundling: {
        nodeModules: [
          '@aws-sdk/client-dynamodb',
          '@aws-sdk/lib-dynamodb',
          '@aws-sdk/client-lex-runtime-v2',
        ],
      },
      runtime: Runtime.NODEJS_16_X,
      role: smaHandlerRole,
      architecture: Architecture.ARM_64,
      timeout: Duration.seconds(60),
      environment: {
        VOICE_CONNECTOR_ARN: props.smaVoiceConnectorArn,
        LEX_BOT_ID: props.lexBotId,
        LEX_BOT_ALIAS_ID: props.lexBotAliasId,
        ACCOUNT_ID: Stack.of(this).account,
        REGION: Stack.of(this).region,
        DEPARTMENT_DIRECTORY: props.departmentDirectory.tableName,
      },
    });
    props.departmentDirectory.grantReadData(this.smaHandlerLambda);

    this.pstnPhoneNumber = new chime.ChimePhoneNumber(this, 'pstnPhoneNumber', {
      phoneState: 'IL',
      phoneCountry: chime.PhoneCountry.US,
      phoneProductType: chime.PhoneProductType.SMA,
      phoneNumberType: chime.PhoneNumberType.LOCAL,
    });

    const sipMediaApp = new chime.ChimeSipMediaApp(this, 'sipMediaApp', {
      region: Stack.of(this).region,
      endpoint: this.smaHandlerLambda.functionArn,
    });

    new chime.ChimeSipRule(this, 'sipRule', {
      triggerType: chime.TriggerType.TO_PHONE_NUMBER,
      triggerValue: this.pstnPhoneNumber.phoneNumber,
      targetApplications: [
        {
          region: Stack.of(this).region,
          priority: 1,
          sipMediaApplicationId: sipMediaApp.sipMediaAppId,
        },
      ],
    });

    this.smaId = sipMediaApp.sipMediaAppId;
  }
}
