import { Duration, Stack } from 'aws-cdk-lib';
import { Table } from 'aws-cdk-lib/aws-dynamodb';
import {
  Role,
  ServicePrincipal,
  PolicyDocument,
  PolicyStatement,
  ManagedPolicy,
} from 'aws-cdk-lib/aws-iam';
import { Architecture, Runtime } from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import {
  ChimePhoneNumber,
  PhoneCountry,
  PhoneNumberType,
  PhoneProductType,
  ChimeSipMediaApp,
  ChimeSipRule,
  TriggerType,
} from 'cdk-amazon-chime-resources';
import { Construct } from 'constructs';

interface PSTNAudioProps {
  readonly smaVoiceConnectorArn: string;
  readonly lexBotId: string;
  readonly lexBotAliasId: string;
  departmentDirectory: Table;
}

export class PSTNAudio extends Construct {
  public readonly smaId: string;
  public readonly smaHandlerLambda: NodejsFunction;
  public readonly pstnPhoneNumber: ChimePhoneNumber;

  constructor(scope: Construct, id: string, props: PSTNAudioProps) {
    super(scope, id);

    const smaHandlerRole = new Role(this, 'smaHandlerRole', {
      assumedBy: new ServicePrincipal('lambda.amazonaws.com'),
      inlinePolicies: {
        ['chimePolicy']: new PolicyDocument({
          statements: [
            new PolicyStatement({
              resources: ['*'],
              actions: ['chime:*', 'lex:putSession'],
            }),
          ],
        }),
      },
      managedPolicies: [
        ManagedPolicy.fromAwsManagedPolicyName(
          'service-role/AWSLambdaBasicExecutionRole',
        ),
      ],
    });

    this.smaHandlerLambda = new NodejsFunction(this, 'smaHandlerLambda', {
      entry: 'src/resources/smaHandler/smaHandler.js',
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

    this.pstnPhoneNumber = new ChimePhoneNumber(this, 'pstnPhoneNumber', {
      phoneState: 'IL',
      phoneCountry: PhoneCountry.US,
      phoneProductType: PhoneProductType.SMA,
      phoneNumberType: PhoneNumberType.LOCAL,
    });

    const sipMediaApp = new ChimeSipMediaApp(this, 'sipMediaApp', {
      region: Stack.of(this).region,
      endpoint: this.smaHandlerLambda.functionArn,
    });

    new ChimeSipRule(this, 'sipRule', {
      triggerType: TriggerType.TO_PHONE_NUMBER,
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
