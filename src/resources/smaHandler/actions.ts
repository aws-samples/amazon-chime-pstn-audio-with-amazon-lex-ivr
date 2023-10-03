/* eslint-disable @typescript-eslint/indent */
import {
  ActionTypes,
  BridgeEndpointType,
  DialogActionTypes,
  PollyVoiceIds,
  TextType,
  PollyLanguageCodes,
  Engine,
  ModifyChimeMeetingAttendeesOperation,
  ParticipantTag,
  SipResponseCode,
  AudioSource,
  TerminatorDigits,
  SpeechParameters,
} from './definitions';

export interface Actions
  extends Array<
    | CallAndBridgeAction
    | HangupAction
    | JoinChimeMeetingAction
    | ModifyChimeMeetingAttendeesAction
    | PauseAction
    | PlayAudioAction
    | PlayAudioAndGetDigitsAction
    | ReceiveDigitsAction
    | RecordAudioAction
    | SendDigitsAction
    | SpeakAction
    | SpeakAndGetDigitsAction
    | StartBotConversationAction
    | VoiceFocusAction
  > {}

export interface CommonActionParameters {
  CallId?: string;
  ParticipantTag?: ParticipantTag;
}

export interface CallAndBridgeActionParameters {
  CallTimeoutSeconds?: number;
  CallerIdNumber: string;
  RingbackTone?: {
    Type: string;
    BucketName: string;
    Key: string;
  };
  Endpoints: [
    { BridgeEndpointType: BridgeEndpointType; Arn?: string; Uri: string },
  ];
  SipHeaders?: { [key: string]: string };
}

export interface HangupActionParameters {
  SipResponseCode: SipResponseCode;
}

export interface JoinChimeMeetingActionParameters {
  JoinToken: string;
  MeetingId: string;
}

export interface ModifyChimeMeetingAttendeesActionParameters {
  Operation: ModifyChimeMeetingAttendeesOperation;
  MeetingId: string;
  AttendeeList: Array<string>;
}

export interface PauseActionParameters {
  DurationInMilliseconds: number;
}

export interface PlayAudioActionParameters {
  PlaybackTerminators?: TerminatorDigits;
  Repeat?: number;
  AudioSource: AudioSource;
}

export interface PlayAudioAndGetDigitsActionParameters {
  InputDigitsRegex?: string;
  AudioSource: AudioSource;
  FailureAudioSource: AudioSource;
  MinNumberOfDigits?: number;
  MaxNumberOfDigits?: number;
  TerminatorDigits?: TerminatorDigits;
  InBetweenDigitsDurationInMilliseconds?: number;
  Repeat?: number;
  RepeatDurationInMilliseconds: number;
}

export interface ReceiveDigitsActionParameters {
  InputDigitRegex: string;
  InBetweenDigitsDurationInMilliseconds: number;
  FlushDigitsDurationInMilliseconds: number;
}

export interface RecordAudioActionParameters {
  DurationInSeconds?: number;
  SilenceDurationInSeconds?: number;
  SilenceThreshold?: number;
  RecordingTerminators: TerminatorDigits;
  RecordingDestination: { Type: 'S3'; BucketName: string; Prefix?: string };
}

export interface SendDigitsActionParameters {
  CallId: string;
  Digits: string;
  ToneDurationInMilliseconds?: number;
}

export interface SpeakActionParameters {
  CallId: string;
  Text: string;
  Engine?: Engine;
  LanguageCode?: PollyLanguageCodes;
  TextType?: TextType;
  VoiceId?: PollyVoiceIds;
}

export interface SpeakAndGetDigitsActionParameters {
  CallId: string;
  InputDigitsRegex?: string;
  SpeechParameters: SpeechParameters;
  FailureSpeechParameters: SpeechParameters;
  MinNumberOfDigits?: number;
  MaxNumberOfDigits?: number;
  TerminatorDigits?: TerminatorDigits;
  InBetweenDigitsDurationInMilliseconds?: number;
  Repeat?: number;
  RepeatDurationInMilliseconds: number;
}

export interface StartBotConversationActionParameters {
  BotAliasArn: string;
  LocalId?: string;
  Configuration?: {
    SessionState?: {
      SessionAttributes?: { [key: string]: string };
      DialogAction?: {
        Type: DialogActionTypes;
      };
    };
    WelcomeMessages?: [
      {
        Content?: string;
        ContentType: string;
      },
    ];
  };
}

export interface VoiceFocusActionParameters {
  CallId: string;
  Enable: boolean;
}

export interface CallAndBridgeAction {
  Type: ActionTypes.CALL_AND_BRIDGE;
  Parameters: CallAndBridgeActionParameters;
}

export interface HangupAction {
  Type: ActionTypes.HANGUP;
  Parameters: CommonActionParameters & HangupActionParameters;
}

export interface JoinChimeMeetingAction {
  Type: ActionTypes.JOIN_CHIME_MEETING;
  Parameters: CommonActionParameters & JoinChimeMeetingActionParameters;
}

export interface ModifyChimeMeetingAttendeesAction {
  Type: ActionTypes.MODIFY_CHIME_MEETING_ATTENDEES;
  Parameters: CommonActionParameters &
    ModifyChimeMeetingAttendeesActionParameters;
}

export interface PauseAction {
  Type: ActionTypes.PAUSE;
  Parameters: CommonActionParameters & PauseActionParameters;
}

export interface PlayAudioAction {
  Type: ActionTypes.PLAY_AUDIO;
  Parameters: CommonActionParameters & PlayAudioActionParameters;
}

export interface PlayAudioAndGetDigitsAction {
  Type: ActionTypes.PLAY_AUDIO_AND_GET_DIGITS;
  Parameters: CommonActionParameters & PlayAudioAndGetDigitsActionParameters;
}

export interface ReceiveDigitsAction {
  Type: ActionTypes.RECEIVE_DIGITS;
  Parameters: CommonActionParameters & ReceiveDigitsActionParameters;
}

export interface RecordAudioAction {
  Type: ActionTypes.RECORD_AUDIO;
  Parameters: CommonActionParameters & RecordAudioActionParameters;
}

export interface SendDigitsAction {
  Type: ActionTypes.SEND_DIGITS;
  Parameters: SendDigitsActionParameters;
}

export interface SpeakAction {
  Type: ActionTypes.SPEAK;
  Parameters: SpeakActionParameters;
}

export interface SpeakAndGetDigitsAction {
  Type: ActionTypes.SPEAK_AND_GET_DIGITS;
  Parameters: SpeakAndGetDigitsActionParameters;
}

export interface StartBotConversationAction {
  Type: ActionTypes.START_BOT_CONVERSATION;
  Parameters: CommonActionParameters & StartBotConversationActionParameters;
}

export interface VoiceFocusAction {
  Type: ActionTypes.VOICE_FOCUS;
  Parameters: VoiceFocusActionParameters;
}
