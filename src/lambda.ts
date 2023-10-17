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
import { ChimeVoiceConnector } from 'cdk-amazon-chime-resources';
import { Construct } from 'constructs';

interface LambdaResourcesProps {
  smaVoiceConnector: ChimeVoiceConnector;
  lexBotId: string;
  lexBotAliasId: string;
  departmentDirectory: Table;
}

export class LambdaResources extends Construct {
  public smaHandlerLambda: NodejsFunction;

  constructor(scope: Construct, id: string, props: LambdaResourcesProps) {
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
      entry: 'src/resources/smaHandler/index.ts',
      runtime: Runtime.NODEJS_18_X,
      role: smaHandlerRole,
      architecture: Architecture.ARM_64,
      timeout: Duration.seconds(60),
      environment: {
        VOICE_CONNECTOR_ARN: `arn:aws:chime:${Stack.of(this).region}:${
          Stack.of(this).account
        }:vc/${props.smaVoiceConnector.voiceConnectorId}`,
        LEX_BOT_ID: props.lexBotId,
        LEX_BOT_ALIAS_ID: props.lexBotAliasId,
        ACCOUNT_ID: Stack.of(this).account,
        REGION: Stack.of(this).region,
        DEPARTMENT_DIRECTORY: props.departmentDirectory.tableName,
      },
    });
    props.departmentDirectory.grantReadData(this.smaHandlerLambda);
  }
}
