import { App, CfnOutput, Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { Lex, Database, Asterisk, PSTNAudio } from '.';

export class ChimeLexIVR extends Stack {
  constructor(scope: Construct, id: string, props: StackProps = {}) {
    super(scope, id, props);
    const database = new Database(this, 'Database');
    const lex = new Lex(this, 'Lex', {
      departmentDirectory: database.departmentDirectory,
    });

    const asterisk = new Asterisk(this, 'Asterisk');

    const pstnAudio = new PSTNAudio(this, 'PSTNAudio', {
      smaVoiceConnectorArn: asterisk.smaVoiceConnectorArn,
      lexBotId: lex.lexBotId,
      lexBotAliasId: lex.lexBotAliasId,
      departmentDirectory: database.departmentDirectory,
    });

    new CfnOutput(this, 'pstnPhoneNumber', {
      value: pstnAudio.pstnPhoneNumber.phoneNumber,
    });
    new CfnOutput(this, 'ssmCommand', {
      value: `aws ssm start-session --target ${asterisk.instanceId}`,
    });
    new CfnOutput(this, 'sipuri', {
      value: 'agent@' + asterisk.asteriskEip.ref,
    });
    new CfnOutput(this, 'password', { value: asterisk.instanceId });
    new CfnOutput(this, 'websocket', {
      value: 'ws://' + asterisk.asteriskEip.ref + ':8088/ws',
    });
  }
}

const devEnv = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION,
};

const app = new App();

new ChimeLexIVR(app, 'ChimeLexIVR', { env: devEnv });

app.synth();
