/* eslint-disable @typescript-eslint/indent */
import {
  PlayAudioAndGetDigitsActionParameters,
  StartBotConversationActionParameters,
  RecordAudioActionParameters,
  SendDigitsActionParameters,
  SpeakActionParameters,
  SpeakAndGetDigitsActionParameters,
  ReceiveDigitsAction,
} from './actions';
import {
  ActionTypes,
  BridgeEndpointType,
  ModifyChimeMeetingAttendeesOperation,
  ParticipantTag,
  SipResponseCode,
  AudioSource,
  CallDetails,
  Intent,
} from './definitions';

export type ActionData =
  | CallAndBridgeActionData
  | HangupActionData
  | JoinChimeMeetingActionData
  | ModifyChimeMeetingAttendeesActionData
  | PlayAudioAndGetDigitsActionData
  | PlayAudioActionData
  | PlayAudioAndGetDigitsActionData
  | ReceiveDigitsAction
  | RecordAudioActionData
  | SendDigitsActionData
  | SpeakActionData
  | SpeakAndGetDigitsActionData
  | StartBotConversationActionData;

export interface CallAndBridgeActionData {
  Type: ActionTypes.CALL_AND_BRIDGE;
  Parameters: {
    CallTimeoutSeconds: number;
    CallerIdNumber: string;
    Endpoints: [
      { BridgeEndpointType: BridgeEndpointType; BridgeEndpoint: string },
    ];
    CallId: string;
  };
  ErrorType?: string;
  ErrorMessage?: string;
}

export interface JoinChimeMeetingActionData {
  Type: ActionTypes.JOIN_CHIME_MEETING;
  Parameters: {
    JoinToken: string;
    CallId: string;
    ParticipantTag: ParticipantTag;
  };
  Error?: string;
}

export interface ModifyChimeMeetingAttendeesActionData {
  Type: ActionTypes.MODIFY_CHIME_MEETING_ATTENDEES;
  Parameters: {
    Operation: ModifyChimeMeetingAttendeesOperation;
    MeetingId: string;
    CallId: string;
    ParticipantTag: ParticipantTag;
    AttendeeList: string[];
  };
  ErrorType?: string;
  ErrorMessage?: string;
  ErrorList?: string[];
}

export interface PlayAudioActionData {
  Type: ActionTypes.PLAY_AUDIO;
  Parameters: {
    CallId: string;
    AudioSource: AudioSource;
  };
  ErrorType?: string;
  ErrorMessage?: string;
}

export interface PlayAudioAndGetDigitsActionData {
  Type: ActionTypes.PLAY_AUDIO_AND_GET_DIGITS;
  Parameters: PlayAudioAndGetDigitsActionParameters;
  ErrorType?: string;
  ErrorMessage?: string;
}

export interface RecordAudioActionData {
  Type: ActionTypes.RECORD_AUDIO;
  Parameters: RecordAudioActionParameters;
  RecordingDestination: AudioSource;
  RecordingTerminatorUsed: string;
  ErrorType?: string;
  ErrorMessage?: string;
}

export interface SendDigitsActionData {
  Type: ActionTypes.SEND_DIGITS;
  Parameters: SendDigitsActionParameters;
  ErrorType?: string;
  ErrorMessage?: string;
}

export interface SpeakActionData {
  Type: ActionTypes.SPEAK;
  Parameters: SpeakActionParameters;
  ErrorType?: string;
  ErrorMessage?: string;
}

export interface SpeakAndGetDigitsActionData {
  Type: ActionTypes.SPEAK_AND_GET_DIGITS;
  Parameters: SpeakAndGetDigitsActionParameters;
  ReceivedDigits?: string;
  ErrorType?: string;
  ErrorMessage?: string;
}

export interface StartBotConversationActionData {
  Type: ActionTypes.START_BOT_CONVERSATION;
  CallId: string;
  Parameters: StartBotConversationActionParameters;
  CallDetails: CallDetails;
  IntentResult: {
    SessionId: string;
    SessionState: {
      SessionAttributes: { [key: string]: string };
      Intent: Intent;
    };
    Interpretations: [
      {
        NluConfidence: { Score: number };
        Intent: Intent;
      },
    ];
  };
}

export interface CallUpdateRequestedActionData {
  Type: 'CallUpdateRequest';
  Parameters: {
    Arguments: { [key: string]: string };
  };
}

export interface DigitsReceivedActionData {
  Type: 'DigitsReceived';
  ReceivedDigits: string;
}

export interface HangupActionData {
  Type: 'Hangup';
  Parameters: {
    SipResponseCode: SipResponseCode;
    CallId: string;
    ParticipantTag: ParticipantTag;
  };
}
