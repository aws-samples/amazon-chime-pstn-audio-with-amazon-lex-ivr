/* eslint-disable @typescript-eslint/indent */
export enum SchemaVersion {
  VERSION_1_0 = '1.0',
}
export enum InvocationEventType {
  NEW_INBOUND_CALL = 'NEW_INBOUND_CALL',
  NEW_OUTBOUND_CALL = 'NEW_OUTBOUND_CALL',
  ACTION_SUCCESSFUL = 'ACTION_SUCCESSFUL',
  ACTION_FAILED = 'ACTION_FAILED',
  ACTION_INTERRUPTED = 'ACTION_INTERRUPTED',
  HANGUP = 'HANGUP',
  CALL_ANSWERED = 'CALL_ANSWERED',
  INVALID_LAMBDA_RESPONSE = 'INVALID_LAMBDA_RESPONSE',
  DIGITS_RECEIVED = 'DIGITS_RECEIVED',
  CALL_UPDATE_REQUESTED = 'CALL_UPDATE_REQUESTED',
  RINGING = 'RINGING',
}

export enum ActionTypes {
  CALL_AND_BRIDGE = 'CallAndBridge',
  HANGUP = 'Hangup',
  JOIN_CHIME_MEETING = 'JoinChimeMeeting',
  MODIFY_CHIME_MEETING_ATTENDEES = 'ModifyChimeMeetingAttendees',
  PAUSE = 'Pause',
  PLAY_AUDIO = 'PlayAudio',
  PLAY_AUDIO_AND_GET_DIGITS = 'PlayAudioAndGetDigits',
  RECEIVE_DIGITS = 'ReceiveDigits',
  RECORD_AUDIO = 'RecordAudio',
  SEND_DIGITS = 'SendDigits',
  SPEAK = 'Speak',
  SPEAK_AND_GET_DIGITS = 'SpeakAndGetDigits',
  START_BOT_CONVERSATION = 'StartBotConversation',
  VOICE_FOCUS = 'VoiceFocus',
  START_CALL_RECORDING = 'StartCallRecording',
  STOP_CALL_RECORDING = 'StopCallRecording',
  PAUSE_CALL_RECORDING = 'PauseCallRecording',
  RESUME_CALL_RECORDING = 'ResumeCallRecording',
}

export enum BridgeEndpointType {
  AWS = 'AWS',
  PSTN = 'PSTN',
}

export enum DialogActionTypes {
  DELEGATE = 'Delegate',
  ELICIT_INTENT = 'ElicitIntent',
}

export enum PollyVoiceIds {
  LOTTE = 'Lotte',
  MAXIM = 'Maxim',
  AYANDA = 'Ayanda',
  SALLI = 'Salli',
  OLA = 'Ola',
  ARTHUR = 'Arthur',
  IDA = 'Ida',
  TOMOKO = 'Tomoko',
  REMI = 'Remi',
  GERAINT = 'Geraint',
  MIGUEL = 'Miguel',
  ELIN = 'Elin',
  LISA = 'Lisa',
  GIORGIO = 'Giorgio',
  MARLENE = 'Marlene',
  INES = 'Ines',
  KAJAL = 'Kajal',
  ZHIYU = 'Zhiyu',
  ZEINA = 'Zeina',
  SUVII = 'Suvi',
  KARL = 'Karl',
  GWYNETH = 'Gwyneth',
  JOANNA = 'Joanna',
  LUCIA = 'Lucia',
  CRISTIANO = 'Cristiano',
  ASTRID = 'Astrid',
  ANDRES = 'Andres',
  VICKI = 'Vicki',
  MIA = 'Mia',
  VITORIA = 'Vitoria',
  BIANCA = 'Bianca',
  CHANTAL = 'Chantal',
  RAVEENA = 'Raveena',
  DANIEL = 'Daniel',
  AMY = 'Amy',
  LIAM = 'Liam',
  RUTH = 'Ruth',
  KEVIN = 'Kevin',
  BRIAN = 'Brian',
  RUSSELL = 'Russell',
  ARIA = 'Aria',
  MATTHEW = 'Matthew',
  ADITI = 'Aditi',
  ZAYD = 'Zayd',
  DORA = 'Dora',
  ENRIQUE = 'Enrique',
  HANS = 'Hans',
  HIUJIN = 'Hiujin',
  CARMEN = 'Carmen',
  SOFIE = 'Sofie',
  IVY = 'Ivy',
  EWA = 'Ewa',
  MAJA = 'Maja',
  GABRIELLE = 'Gabrielle',
  NICOLE = 'Nicole',
  FILIZ = 'Filiz',
  CAMILA = 'Camila',
  JACEK = 'Jacek',
  THIAGO = 'Thiago',
  JUSTIN = 'Justin',
  CELINE = 'Celine',
  KAZUHA = 'Kazuha',
  KENDRA = 'Kendra',
  ARLET = 'Arlet',
  RICARDO = 'Ricardo',
  MADS = 'Mads',
  HANNAH = 'Hannah',
  MATHIEU = 'Mathieu',
  LEA = 'Lea',
  SERGIO = 'Sergio',
  HALA = 'Hala',
  TATYANA = 'Tatyana',
  PENELOPE = 'Penelope',
  NAJA = 'Naja',
  OLIVIA = 'Olivia',
  RUBEN = 'Ruben',
  LAURA = 'Laura',
  TAKUMI = 'Takumi',
  MIZUKI = 'Mizuki',
  CARLA = 'Carla',
  CONCHITA = 'Conchita',
  JAN = 'Jan',
  KIMBERLY = 'Kimberly',
  LIV = 'Liv',
  ADRIANO = 'Adriano',
  LUPE = 'Lupe',
  JOEY = 'Joey',
  PEDRO = 'Pedro',
  SEOYEON = 'Seoyeon',
  EMMA = 'Emma',
  NIAMH = 'Niamh',
  STEPHEN = 'Stephen',
}

export enum TextType {
  SSML = 'ssml',
  TEXT = 'text',
}
export enum ContentType {
  SSML = 'SSML',
  PLAIN_TEXT = 'PlainText',
}
export enum PollyLanguageCodes {
  AR_AE = 'ar-AE',
  EN_US = 'en-US',
  EN_IN = 'en-IN',
  ES_MX = 'es-MX',
  EN_ZA = 'en-ZA',
  TR_TR = 'tr-TR',
  RU_RU = 'ru-RU',
  RO_RO = 'ro-RO',
  PT_PT = 'pt-PT',
  PL_PL = 'pl-PL',
  NL_NL = 'nl-NL',
  IT_IT = 'it-IT',
  IS_IS = 'is-IS',
  FR_FR = 'fr-FR',
  FI_FI = 'fi-FI',
  ES_ES = 'es-ES',
  DE_DE = 'de-DE',
  YUE_CN = 'yue-CN',
  KO_KR = 'ko-KR',
  EN_NZ = 'en-NZ',
  EN_GB_WLS = 'en-GB-WLS',
  HI_IN = 'hi-IN',
  ARB = 'arb',
  CY_GB = 'cy-GB',
  CMN_CN = 'cmn-CN',
  DA_DK = 'da-DK',
  EN_AU = 'en-AU',
  PT_BR = 'pt-BR',
  NB_NO = 'nb-NO',
  SV_SE = 'sv-SE',
  JA_JP = 'ja-JP',
  ES_US = 'es-US',
  CA_ES = 'ca-ES',
  FR_CA = 'fr-CA',
  EN_GB = 'en-GB',
  DE_AT = 'de-AT',
}

export enum Engine {
  STANDARD = 'standard',
  NEURAL = 'neural',
}

export enum ModifyChimeMeetingAttendeesOperation {
  MUTE = 'Mute',
  UNMUTE = 'Unmute',
}

export enum ParticipantTag {
  LEG_B = 'LEG-B',
  LEG_A = 'LEG-A',
}

export enum CallDetailParticipantDirection {
  OUTBOUND = 'Outbound',
  INBOUND = 'Inbound',
}

export enum CallDetailParticipantStatus {
  CONNECTED = 'Connected',
  DISCONNECTED = 'Disconnected',
}

export enum CallDetailAwsRegion {
  US_EAST_1 = 'us-east-1',
  US_WEST_2 = 'us-west-2',
}

export enum SipResponseCode {
  UNAVAILABLE = '480',
  BUSY = '486',
  NORMAL = '0',
}

export interface AudioSource {
  Type: 'S3';
  BucketName: string;
  Key: string;
}

export type TerminatorDigits = Array<
  '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '#' | '*'
>;

export interface SpeechParameters {
  Text: string;
  Engine?: Engine;
  LanguageCode?: PollyLanguageCodes;
  TextType?: TextType;
  VoiceId?: PollyVoiceIds;
}

export interface CallDetailParticipants {
  CallId: string;
  ParticipantTag: ParticipantTag;
  To: string;
  From: string;
  Direction: CallDetailParticipantDirection;
  StartTimeInMilliseconds: string;
  Status: CallDetailParticipantStatus;
}

export interface CallDetails {
  TransactionId: string;
  AwsAccountId: string;
  AwsRegion: CallDetailAwsRegion;
  SipRuleId: string;
  SipMediaApplicationId: string;
  Participants: CallDetailParticipants[];
  TransactionAttributes?: { [key: string]: string };
}

export interface Intent {
  Name: string;
  Slots: {
    [key: string]: {
      Value: {
        OriginalValue: string;
        InterpretedValue: string;
        ResolvedValues: { [key: string]: string };
      };
      Values: [];
    };
  };
  State: string;
  ConfirmationState: string;
}
