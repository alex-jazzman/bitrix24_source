import { ajax } from 'main.core';
import { Provider, CallType } from 'call.mapping';

// Call shape returned by call.Call.tryJoinCall — only the fields the guest-join flow reads.
export type TryJoinRawCall = {
	ID?: unknown,
	UUID?: string,
	PROVIDER?: string,
	SCHEME?: unknown,
};

export type TryJoinCallResponse = {
	data?: {
		success?: boolean,
		call?: TryJoinRawCall,
		users?: unknown,
		logToken?: unknown,
		connectionData?: unknown,
		userData?: Object,
		callToken?: unknown,
	},
};

export function tryJoinCall(dialogId: string): Promise<TryJoinCallResponse>
{
	// @ts-ignore [call-ts] main.core ajax response type is untyped for runAction
	return ajax.runAction('call.Call.tryJoinCall', {
		data: {
			entityType: 'chat',
			entityId: dialogId,
			provider: Provider.Bitrix,
			callType: CallType.Instant,
		},
	});
}
