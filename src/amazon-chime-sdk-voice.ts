/* eslint-disable @typescript-eslint/indent */
import { Stack } from 'aws-cdk-lib';
import { Table } from 'aws-cdk-lib/aws-dynamodb';
import { CfnEIP } from 'aws-cdk-lib/aws-ec2';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import {
  ChimePhoneNumber,
  PhoneCountry,
  PhoneNumberType,
  PhoneProductType,
  ChimeSipMediaApp,
  ChimeSipRule,
  TriggerType,
  ChimeVoiceConnector,
  Protocol,
} from 'cdk-amazon-chime-resources';
import { Construct } from 'constructs';

interface VoiceConnectorProps {
  serverIp: CfnEIP;
}

export class VoiceConnector extends Construct {
  smaVoiceConnector: ChimeVoiceConnector;

  constructor(scope: Construct, id: string, props: VoiceConnectorProps) {
    super(scope, id);

    this.smaVoiceConnector = new ChimeVoiceConnector(
      this,
      'smaVoiceConnector',
      {
        origination: [
          {
            host: props.serverIp.ref,
            port: 5060,
            protocol: Protocol.UDP,
            priority: 1,
            weight: 1,
          },
        ],
        encryption: false,
      },
    );
  }
}

interface PSTNAudioProps {
  smaVoiceConnector: ChimeVoiceConnector;
  lexBotId: string;
  lexBotAliasId: string;
  departmentDirectory: Table;
  smaHandlerLambda: NodejsFunction;
}

export class PSTNAudio extends Construct {
  public readonly smaId: string;
  public readonly pstnPhoneNumber: ChimePhoneNumber;

  constructor(scope: Construct, id: string, props: PSTNAudioProps) {
    super(scope, id);

    this.pstnPhoneNumber = new ChimePhoneNumber(this, 'pstnPhoneNumber', {
      phoneState: 'IL',
      phoneCountry: PhoneCountry.US,
      phoneProductType: PhoneProductType.SMA,
      phoneNumberType: PhoneNumberType.LOCAL,
    });

    const sipMediaApp = new ChimeSipMediaApp(this, 'sipMediaApp', {
      region: Stack.of(this).region,
      endpoint: props.smaHandlerLambda.functionArn,
    });

    new ChimeSipRule(this, 'sipRule', {
      triggerType: TriggerType.TO_PHONE_NUMBER,
      triggerValue: this.pstnPhoneNumber.phoneNumber,
      targetApplications: [
        {
          region: Stack.of(this).region,
          priority: 1,
          sipMediaApplicationId: sipMediaApp.sipMediaAppId,
        },
      ],
    });

    this.smaId = sipMediaApp.sipMediaAppId;
  }
}
