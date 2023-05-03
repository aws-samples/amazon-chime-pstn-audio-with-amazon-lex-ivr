const { awscdk } = require('projen');
const project = new awscdk.AwsCdkTypeScriptApp({
  cdkVersion: '2.37.1',
  license: 'MIT-0',
  author: 'Court Schuett',
  copyrightOwner: 'Amazon.com, Inc.',
  authorAddress: 'https://aws.amazon.com',
  defaultReleaseBranch: 'main',
  name: 'amazon-chime-pstn-audio-lex-ivr',
  appEntrypoint: 'amazon-chime-pstn-audio-lex-ivr.ts',
  depsUpgradeOptions: {
    ignoreProjen: false,
    workflowOptions: {
      labels: ['auto-approve', 'auto-merge'],
    },
  },
  autoApproveOptions: {
    secret: 'GITHUB_TOKEN',
    allowedUsernames: ['schuettc'],
  },
  autoApproveUpgrades: true,
  deps: [
    'cdk-amazon-chime-resources',
    '@aws-sdk/client-lex-runtime-v2',
    '@aws-sdk/lib-dynamodb',
    '@aws-sdk/client-dynamodb',
  ],
  projenUpgradeSecret: 'PROJEN_GITHUB_TOKEN',
  defaultReleaseBranch: 'main',
  scripts: {
    launch:
      'yarn && yarn projen && yarn build && yarn cdk bootstrap && yarn cdk deploy -O site/src/cdk-outputs.json',
  },
});

const common_exclude = [
  'cdk.out',
  'cdk.context.json',
  'yarn-error.log',
  'dependabot.yml',
  '.DS_Store',
];

project.gitignore.exclude(...common_exclude);
project.synth();
