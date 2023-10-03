/* eslint-disable import/no-extraneous-dependencies */
import { App, CfnOutput, Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { config } from 'dotenv';
import {
  Lex,
  Database,
  VoiceConnector,
  PSTNAudio,
  CognitoResources,
  LambdaResources,
  VPCResources,
  DistributionResources,
  ServerResources,
} from '.';

config();

interface AmazonChimeLexIVRProps extends StackProps {
  logLevel: string;
  sshPubKey: string;
  allowedDomain?: string;
}

export class AmazonChimeLexIVR extends Stack {
  constructor(scope: Construct, id: string, props: AmazonChimeLexIVRProps) {
    super(scope, id, props);

    const database = new Database(this, 'Database');

    const lex = new Lex(this, 'Lex', {
      departmentDirectory: database.departmentDirectory,
    });

    const vpcResources = new VPCResources(this, 'VPCResources');
    const voiceConnector = new VoiceConnector(this, 'VoiceConnector', {
      serverIp: vpcResources.serverEip,
    });

    const lambdaResources = new LambdaResources(this, 'LambdaResources', {
      smaVoiceConnector: voiceConnector.smaVoiceConnector,
      lexBotId: lex.lexBotId,
      lexBotAliasId: lex.lexBotAliasId,
      departmentDirectory: database.departmentDirectory,
    });

    const pstnAudio = new PSTNAudio(this, 'PSTNAudio', {
      smaVoiceConnector: voiceConnector.smaVoiceConnector,
      lexBotId: lex.lexBotId,
      lexBotAliasId: lex.lexBotAliasId,
      departmentDirectory: database.departmentDirectory,
      smaHandlerLambda: lambdaResources.smaHandlerLambda,
    });

    const cognitoResources = new CognitoResources(this, 'CognitoResources', {
      allowedDomain: props.allowedDomain || '',
    });

    const distributionResources = new DistributionResources(
      this,
      'DistributionResources',
      {
        applicationLoadBalancer: vpcResources.applicationLoadBalancer,
      },
    );

    const serverResources = new ServerResources(this, 'Server', {
      serverEip: vpcResources.serverEip,
      voiceConnector: voiceConnector.smaVoiceConnector,
      phoneNumber: pstnAudio.pstnPhoneNumber,
      vpc: vpcResources.vpc,
      voiceSecurityGroup: vpcResources.voiceSecurityGroup,
      albSecurityGroup: vpcResources.albSecurityGroup,
      sshSecurityGroup: vpcResources.sshSecurityGroup,
      logLevel: props.logLevel,
      sshPubKey: props.sshPubKey,
      applicationLoadBalancer: vpcResources.applicationLoadBalancer,
      distribution: distributionResources.distribution,
      userPool: cognitoResources.userPool,
      userPoolClient: cognitoResources.userPoolClient,
      userPoolRegion: cognitoResources.userPoolRegion,
      identityPool: cognitoResources.identityPool,
    });

    new CfnOutput(this, 'DistributionUrl', {
      value: `https://${distributionResources.distribution.domainName}/`,
    });

    new CfnOutput(this, 'ssmCommand', {
      value: `aws ssm start-session --target ${serverResources.instanceId}`,
    });

    new CfnOutput(this, 'sshCommand', {
      value: `ssh ubuntu@${vpcResources.serverEip.ref}`,
    });
    new CfnOutput(this, 'pstnPhoneNumber', {
      value: pstnAudio.pstnPhoneNumber.phoneNumber,
    });
  }
}

const stackProps = {
  logLevel: process.env.LOG_LEVEL || 'INFO',
  sshPubKey: process.env.SSH_PUB_KEY || ' ',
  allowedDomain: process.env.ALLOWED_DOMAIN || ' ',
};

const devEnv = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: 'us-east-1',
};

const app = new App();

new AmazonChimeLexIVR(app, 'AmazonChimeLexIVR', { ...stackProps, env: devEnv });

app.synth();
