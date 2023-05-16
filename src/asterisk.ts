/* eslint-disable @typescript-eslint/indent */
import { Duration, Stack } from 'aws-cdk-lib';
import {
  CfnEIP,
  Vpc,
  SubnetType,
  SecurityGroup,
  Peer,
  Port,
  MachineImage,
  Instance,
  InstanceType,
  InstanceClass,
  InstanceSize,
  CloudFormationInit,
  InitConfig,
  InitFile,
  InitCommand,
  CfnEIPAssociation,
  UserData,
} from 'aws-cdk-lib/aws-ec2';
import {
  Role,
  ServicePrincipal,
  PolicyDocument,
  PolicyStatement,
  ManagedPolicy,
} from 'aws-cdk-lib/aws-iam';
import { StringParameter } from 'aws-cdk-lib/aws-ssm';
import { ChimeVoiceConnector, Protocol } from 'cdk-amazon-chime-resources';

import { Construct } from 'constructs';

export class Asterisk extends Construct {
  public readonly smaVoiceConnectorArn: string;
  public readonly smaVoiceConnectorHostname: string;
  public readonly instanceId: string;
  public readonly asteriskEip: CfnEIP;

  constructor(scope: Construct, id: string) {
    super(scope, id);

    this.asteriskEip = new CfnEIP(this, 'asteriskEip');

    const vpc = new Vpc(this, 'VPC', {
      natGateways: 0,
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'AsteriskPublic',
          subnetType: SubnetType.PUBLIC,
        },
      ],
    });

    const securityGroup = new SecurityGroup(this, 'AsteriskSecurityGroup', {
      vpc,
      description: 'Security Group for Asterisk Instance',
      allowAllOutbound: true,
    });
    securityGroup.addIngressRule(
      Peer.ipv4('3.80.16.0/23'),
      Port.udp(5060),
      'Allow Chime Voice Connector Signaling Access',
    );
    securityGroup.addIngressRule(
      Peer.ipv4('3.80.16.0/23'),
      Port.tcpRange(5060, 5061),
      'Allow Chime Voice Connector Signaling Access',
    );
    securityGroup.addIngressRule(
      Peer.ipv4('99.77.253.0/24'),
      Port.udp(5060),
      'Allow Chime Voice Connector Signaling Access',
    );
    securityGroup.addIngressRule(
      Peer.ipv4('99.77.253.0/24'),
      Port.tcpRange(5060, 5061),
      'Allow Chime Voice Connector Signaling Access',
    );
    securityGroup.addIngressRule(
      Peer.ipv4('99.77.253.0/24'),
      Port.udpRange(5000, 65000),
      'Allow Chime Voice Connector Signaling Access',
    );
    securityGroup.addIngressRule(
      Peer.ipv4('3.80.16.0/23'),
      Port.udpRange(5000, 65000),
      'Allow Chime Voice Connector Media Access',
    );
    securityGroup.addIngressRule(
      Peer.ipv4('99.77.253.0/24'),
      Port.udpRange(5000, 65000),
      'Allow Chime Voice Connector Media Access',
    );
    securityGroup.addIngressRule(
      Peer.ipv4('52.55.62.128/25'),
      Port.udpRange(1024, 65535),
      'Allow Chime Voice Connector Media Access',
    );
    securityGroup.addIngressRule(
      Peer.ipv4('52.55.63.0/25'),
      Port.udpRange(1024, 65535),
      'Allow Chime Voice Connector Media Access',
    );
    securityGroup.addIngressRule(
      Peer.ipv4('34.212.95.128/25'),
      Port.udpRange(1024, 65535),
      'Allow Chime Voice Connector Media Access',
    );
    securityGroup.addIngressRule(
      Peer.ipv4('34.223.21.0/25'),
      Port.udpRange(1024, 65535),
      'Allow Chime Voice Connector Media Access',
    );
    securityGroup.addIngressRule(
      Peer.anyIpv4(),
      Port.tcp(8088),
      'Allow Websocket Access',
    );

    const asteriskEc2Role = new Role(this, 'asteriskEc2Role', {
      assumedBy: new ServicePrincipal('ec2.amazonaws.com'),
      inlinePolicies: {
        ['pollyPolicy']: new PolicyDocument({
          statements: [
            new PolicyStatement({
              resources: ['*'],
              actions: ['polly:SynthesizeSpeech'],
            }),
          ],
        }),
        ['cloudformationPolicy']: new PolicyDocument({
          statements: [
            new PolicyStatement({
              resources: ['*'],
              actions: [
                'cloudformation:SignalResource',
                'cloudformation:DescribeStackResource',
              ],
            }),
          ],
        }),
      },
      managedPolicies: [
        ManagedPolicy.fromAwsManagedPolicyName('AmazonSSMManagedInstanceCore'),
      ],
    });

    const smaVoiceConnector = new ChimeVoiceConnector(
      this,
      'smaVoiceConnector',
      {
        origination: [
          {
            host: this.asteriskEip.ref,
            port: 5060,
            protocol: Protocol.UDP,
            priority: 1,
            weight: 1,
          },
        ],
        encryption: false,
      },
    );

    const parameterName =
      '/aws/service/canonical/ubuntu/server/jammy/stable/current/arm64/hvm/ebs-gp2/ami-id';
    const ubuntuAmiId = StringParameter.valueForStringParameter(
      this,
      parameterName,
    );

    const ubuntuAmi = MachineImage.genericLinux({
      'us-east-1': ubuntuAmiId,
    });

    const userData = UserData.forLinux();
    userData.addCommands(
      'apt-get update',
      'while fuser /var/lib/dpkg/lock >/dev/null 2>&1 ; do sleep 1 ; done',
      'mkdir -p /opt/aws/bin',
      'mkdir -p /var/lib/asterisk/sounds/en/',
      'apt-get install -y python3-pip unzip jq asterisk',
      'pip3 install https://s3.amazonaws.com/cloudformation-examples/aws-cfn-bootstrap-py3-latest.tar.gz',
      'ln -s /root/aws-cfn-bootstrap-latest/init/ubuntu/cfn-hup /etc/init.d/cfn-hup',
      'ln -s /usr/local/bin/cfn-* /opt/aws/bin/',
      'curl "https://awscli.amazonaws.com/awscli-exe-linux-aarch64.zip" -o "awscliv2.zip"',
      'unzip -q awscliv2.zip',
      './aws/install',
    );

    const ec2Instance = new Instance(this, 'Instance', {
      vpc,
      instanceType: InstanceType.of(InstanceClass.C6G, InstanceSize.MEDIUM),
      machineImage: ubuntuAmi,
      userData: userData,
      init: CloudFormationInit.fromConfigSets({
        configSets: {
          default: ['config'],
        },
        configs: {
          config: new InitConfig([
            InitFile.fromObject('/etc/config.json', {
              SMAVoiceConnector: `${smaVoiceConnector.voiceConnectorId}.voiceconnector.chime.aws`,
              IP: this.asteriskEip.ref,
              REGION: Stack.of(this).region,
            }),
            InitFile.fromFileInline(
              '/etc/asterisk/pjsip.conf',
              'src/resources/asteriskConfig/pjsip.conf',
            ),
            InitFile.fromFileInline(
              '/etc/asterisk/asterisk.conf',
              'src/resources/asteriskConfig/asterisk.conf',
            ),
            InitFile.fromFileInline(
              '/etc/asterisk/http.conf',
              'src/resources/asteriskConfig/http.conf',
            ),
            InitFile.fromFileInline(
              '/etc/asterisk/rtp.conf',
              'src/resources/asteriskConfig/rtp.conf',
            ),
            InitFile.fromFileInline(
              '/etc/asterisk/logger.conf',
              'src/resources/asteriskConfig/logger.conf',
            ),
            InitFile.fromFileInline(
              '/etc/asterisk/extensions.conf',
              'src/resources/asteriskConfig/extensions.conf',
            ),
            InitFile.fromFileInline(
              '/etc/asterisk/modules.conf',
              'src/resources/asteriskConfig/modules.conf',
            ),
            InitFile.fromFileInline(
              '/etc/config_asterisk.sh',
              'src/resources/asteriskConfig/config_asterisk.sh',
            ),
            InitFile.fromFileInline(
              '/etc/polly/createWav.py',
              'src/resources/asteriskConfig/createWav.py',
            ),
            InitCommand.shellCommand('chmod +x /etc/config_asterisk.sh'),
            InitCommand.shellCommand(
              '/etc/config_asterisk.sh 2>&1 | tee /var/log/asterisk_config.log',
            ),
          ]),
        },
      }),
      initOptions: {
        timeout: Duration.minutes(5),
        includeUrl: true,
        includeRole: true,
        printLog: true,
      },
      securityGroup: securityGroup,
      role: asteriskEc2Role,
    });

    new CfnEIPAssociation(this, 'EIP Association', {
      eip: this.asteriskEip.ref,
      instanceId: ec2Instance.instanceId,
    });

    this.smaVoiceConnectorArn = `arn:aws:chime:${Stack.of(this).region}:${
      Stack.of(this).account
    }:vc/${smaVoiceConnector.voiceConnectorId}`;
    this.smaVoiceConnectorHostname = smaVoiceConnector.voiceConnectorId;
    this.instanceId = ec2Instance.instanceId;
  }
}
