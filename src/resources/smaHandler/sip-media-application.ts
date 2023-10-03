/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable @typescript-eslint/indent */

import { Callback, Handler } from 'aws-lambda';
import { ActionData } from './actionData';
import { Actions } from './actions';
import { SchemaVersion, InvocationEventType, CallDetails } from './definitions';
export * from './actions';
export * from './actionData';
export * from './definitions';

export type SipMediaApplicationHandler = Handler<
  SipMediaApplicationEvent,
  SipMediaApplicationResponse
>;
export type SipMediaApplicationCallback = Callback<SipMediaApplicationResponse>;

export interface SipMediaApplicationResponse {
  SchemaVersion: SchemaVersion;
  Actions?: Actions | undefined | never | null;
  TransactionAttributes?: { [key: string]: string };
}

export interface SipMediaApplicationEvent {
  SchemaVersion: string;
  Sequence: number;
  InvocationEventType: InvocationEventType;
  ActionData?: ActionData;
  CallDetails: CallDetails;
}
