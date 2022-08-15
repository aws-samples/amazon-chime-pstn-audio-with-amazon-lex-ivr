const { awscdk } = require('projen');
const project = new awscdk.AwsCdkTypeScriptApp({
<<<<<<< HEAD
  cdkVersion: '2.37.1',
=======
  cdkVersion: '2.31.0',
>>>>>>> 4eba3666644fef062d0b3b063ad6b2c070000441
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
<<<<<<< HEAD
  devDeps: ['@types/prettier@2.6.0', 'esbuild'],
=======
  devDeps: ['@types/prettier@2.6.0', 'esbuild', 'got@11.8.5', 'ts-node@^10'],
>>>>>>> 4eba3666644fef062d0b3b063ad6b2c070000441
  deps: ['cdk-amazon-chime-resources'],
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
