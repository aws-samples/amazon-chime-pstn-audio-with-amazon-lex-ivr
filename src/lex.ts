import * as path from 'path';
import { Stack, Duration, RemovalPolicy, aws_lex as lex } from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';

interface LexProps {
  departmentDirectory: dynamodb.Table;
}

export class Lex extends Construct {
  public readonly lexBotId: string;
  public readonly lexBotAliasId: string;

  constructor(scope: Construct, id: string, props: LexProps) {
    super(scope, id);

    const lexCodeHook = new lambda.Function(this, 'lexCodeHook', {
      runtime: lambda.Runtime.PYTHON_3_9,
      code: lambda.Code.fromAsset(
        path.join(__dirname, '../resources/lexHandler'),
      ),
      handler: 'index.lambda_handler',
      architecture: lambda.Architecture.ARM_64,
      timeout: Duration.minutes(1),
      environment: {
        DEPARTMENT_TABLE: props.departmentDirectory.tableName,
      },
    });

    props.departmentDirectory.grantReadWriteData(lexCodeHook);

    const lexLogGroup = new logs.LogGroup(this, 'lexLogGroup', {
      retention: logs.RetentionDays.ONE_WEEK,
    });

    const lexAudioBucket = new s3.Bucket(this, 'lexAudioBucket', {
      publicReadAccess: false,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    const lexRole = new iam.Role(this, 'lexRole', {
      assumedBy: new iam.ServicePrincipal('lex.amazonaws.com'),
      inlinePolicies: {
        ['lexPolicy']: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              resources: ['*'],
              actions: ['polly:SynthesizeSpeech'],
            }),
            new iam.PolicyStatement({
              resources: [lexLogGroup.logGroupArn],
              actions: [
                'logs:CreateLogGroup',
                'logs:CreateLogStream',
                'logs:PutLogEvents',
              ],
            }),
          ],
        }),
      },
    });

    lexAudioBucket.grantReadWrite(lexRole);

    const chimeLexBot = new lex.CfnBot(this, 'chimeLexBot', {
      dataPrivacy: { ChildDirected: false },
      idleSessionTtlInSeconds: 300,
      name: 'CallRoutingDemo',
      roleArn: lexRole.roleArn,
      autoBuildBotLocales: true,
      botLocales: [
        {
          localeId: 'en_US',
          nluConfidenceThreshold: 0.4,
          voiceSettings: {
            voiceId: 'Kimberly',
          },
          description: 'English_US',
          slotTypes: [
            {
              name: 'Departments',
              description: 'Possible Departments',
              valueSelectionSetting: {
                resolutionStrategy: 'ORIGINAL_VALUE',
              },
              slotTypeValues: [
                {
                  sampleValue: {
                    value: 'art',
                  },
                },
                {
                  sampleValue: {
                    value: 'history',
                  },
                },
                {
                  sampleValue: {
                    value: 'math',
                  },
                },
                {
                  sampleValue: {
                    value: 'science',
                  },
                },
              ],
            },
          ],
          intents: [
            {
              name: 'RouteCall',
              description: 'Simple Call Routing',
              sampleUtterances: [
                { utterance: 'Call {Department} department' },
                { utterance: '{Department} department' },
                { utterance: 'Dial {Department} department' },
                { utterance: 'Talk to {Department} department' },
                { utterance: 'I need {Department} department' },
                { utterance: "It's {Department} department" },
                { utterance: 'I want {Department} department' },
                { utterance: 'Call {Department}' },
                { utterance: '{Department}' },
                { utterance: 'Dial {Department}' },
                { utterance: 'Talk to {Department}' },
                { utterance: 'I need {Department}' },
                { utterance: "It's {Department}" },
                { utterance: 'I want {Department}' },
                { utterance: 'Call {Department} office' },
                { utterance: '{Department} office' },
                { utterance: 'Dial {Department} office' },
                { utterance: 'Talk to {Department} office' },
                { utterance: 'I need {Department} office' },
                { utterance: "It's {Department} office" },
                { utterance: 'I want {Department} office' },
              ],
              fulfillmentCodeHook: { enabled: true },
              dialogCodeHook: {
                enabled: true,
              },
              outputContexts: [
                {
                  name: 'departmentToCall',
                  timeToLiveInSeconds: 90,
                  turnsToLive: 5,
                },
              ],
              slots: [
                {
                  name: 'Department',
                  slotTypeName: 'Departments',
                  valueElicitationSetting: {
                    slotConstraint: 'Required',
                    promptSpecification: {
                      maxRetries: 2,
                      messageGroupsList: [
                        {
                          message: {
                            plainTextMessage: {
                              value: 'What department do you want?',
                            },
                          },
                        },
                      ],
                    },
                  },
                },
              ],
              slotPriorities: [{ priority: 1, slotName: 'Department' }],
            },
            {
              name: 'FallbackIntent',
              parentIntentSignature: 'AMAZON.FallbackIntent',
              dialogCodeHook: {
                enabled: true,
              },
            },
          ],
        },
      ],
    });

    const chimeLexBotVersion = new lex.CfnBotVersion(
      this,
      'chimeLexBotVersion',
      {
        botId: chimeLexBot.ref,
        botVersionLocaleSpecification: [
          {
            botVersionLocaleDetails: {
              sourceBotVersion: 'DRAFT',
            },
            localeId: 'en_US',
          },
        ],
      },
    );

    const chimeLexBotAlias = new lex.CfnBotAlias(this, 'chimeLexBotAlias', {
      botAliasName: 'DialDepartmentBot',
      botId: chimeLexBot.ref,
      botAliasLocaleSettings: [
        {
          botAliasLocaleSetting: {
            enabled: true,
            codeHookSpecification: {
              lambdaCodeHook: {
                codeHookInterfaceVersion: '1.0',
                lambdaArn: lexCodeHook.functionArn,
              },
            },
          },
          localeId: 'en_US',
        },
      ],
      conversationLogSettings: {
        audioLogSettings: [
          {
            destination: {
              s3Bucket: {
                logPrefix: 'chimeLexBot',
                s3BucketArn: lexAudioBucket.bucketArn,
              },
            },
            enabled: true,
          },
        ],
        textLogSettings: [
          {
            destination: {
              cloudWatch: {
                cloudWatchLogGroupArn: lexLogGroup.logGroupArn.toString(),
                logPrefix: 'chimeLexBot',
              },
            },
            enabled: true,
          },
        ],
      },
      botVersion: chimeLexBotVersion.getAtt('BotVersion').toString(),
      sentimentAnalysisSettings: { DetectSentiment: false },
    });

    const lexArn = `arn:aws:lex:${Stack.of(this).region}:${
      Stack.of(this).account
    }:bot-alias/${chimeLexBot.attrId}/${chimeLexBotAlias.attrBotAliasId}`;

    const lexPolicy = {
      Version: '2012-10-17',
      Statement: [
        {
          Sid: 'AllowChimePstnAudioUseBot',
          Effect: 'Allow',
          Principal: {
            Service: 'voiceconnector.chime.amazonaws.com',
          },
          Action: 'lex:StartConversation',
          Resource: lexArn,
          Condition: {
            StringEquals: {
              'AWS:SourceAccount': `${Stack.of(this).account}`,
            },
            ArnEquals: {
              'AWS:SourceArn': `arn:aws:voiceconnector:${
                Stack.of(this).region
              }:${Stack.of(this).account}:*`,
            },
          },
        },
      ],
    };

    new lex.CfnResourcePolicy(this, 'LexResourcePolicy', {
      policy: lexPolicy,
      resourceArn: lexArn,
    });

    lexCodeHook.addPermission('Lex Invocation', {
      principal: new iam.ServicePrincipal('lexv2.amazonaws.com'),
      sourceArn: `arn:aws:lex:${Stack.of(this).region}:${
        Stack.of(this).account
      }:bot-alias/*`,
    });

    this.lexBotId = chimeLexBot.attrId;
    this.lexBotAliasId = chimeLexBotAlias.attrBotAliasId;
  }
}
