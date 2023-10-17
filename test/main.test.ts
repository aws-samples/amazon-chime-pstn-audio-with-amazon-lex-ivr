import { App } from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { AmazonChimeLexIVR } from '../src/amazon-chime-pstn-audio-lex-ivr';

const stackProps = {
  logLevel: process.env.LOG_LEVEL || 'INFO',
  sshPubKey: process.env.SSH_PUB_KEY || ' ',
  allowedDomain: process.env.ALLOWED_DOMAIN || ' ',
};

const devEnv = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: 'us-east-1',
};

test('Snapshot', () => {
  const app = new App();
  const stack = new AmazonChimeLexIVR(app, 'test', {
    ...stackProps,
    env: devEnv,
  });

  const template = Template.fromStack(stack);
  expect(template.toJSON()).toMatchSnapshot();
});
