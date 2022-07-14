import { App } from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { ChimeLexIVR } from '../src/amazon-chime-pstn-audio-lex-ivr';

test('Snapshot', () => {
  const app = new App();
  const stack = new ChimeLexIVR(app, 'test');

  const template = Template.fromStack(stack);
  expect(template.toJSON()).toMatchSnapshot();
});
