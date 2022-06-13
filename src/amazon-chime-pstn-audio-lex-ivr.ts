import { App, Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { Lex, Database } from '.';

export class ChimeLexIVR extends Stack {
  constructor(scope: Construct, id: string, props: StackProps = {}) {
    super(scope, id, props);
    const database = new Database(this, 'Database');
    new Lex(this, 'Lex', { userDirectory: database.userDirectory });
  }
}

const devEnv = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION,
};

const app = new App();

new ChimeLexIVR(app, 'ChimeLexIVR', { env: devEnv });

app.synth();
