import { type ScheduleScheduledMessageRequest } from 'mail.client.scheduled-message';

export const UndoSendErrorCode = Object.freeze({
	Unknown: 'unknown',
	FeatureUnavailable: 'feature_unavailable',
	PreferenceDisabled: 'preference_disabled',
	AccessDenied: 'access_denied',
	CancelWindowExpired: 'cancel_window_expired',
	AlreadySending: 'already_sending',
	InvalidDelay: 'invalid_delay',
} as const);

export type UndoSendStatus = 'scheduled' | 'cancelled' | 'sending' | 'sent' | 'error';

export type UndoSendDelay = 0 | 5 | 10 | 20;

export type UndoSendOperationDto = {
	operationId: number,
	revision: number,
	status: UndoSendStatus,
	cancelUntil: string,
	serverNow: string,
	subject?: string,
	restoreUrl: string | null,
	restoreSliderWidth: number,
	cancelToken: string | null,
	/** The letter was asked to be kept as a template and the portal could not keep it. */
	templateSaveWarning?: boolean,
};

export type UndoSendLargeAttachment = {
	token: string,
	publicUrl: string,
	fileIds: number[],
	sourceFileIds: number[],
	tokenFileIds?: number[],
};

export type CreateUndoSendRequest = Omit<ScheduleScheduledMessageRequest, 'scheduledAt'> & {
	idempotencyKey: string,
	largeAttachments?: UndoSendLargeAttachment[],
};

export type CancelUndoSendRequest = {
	token: string,
};

export type UndoSendPreference = {
	delaySeconds: UndoSendDelay,
};

export type SetUndoSendPreferenceRequest = UndoSendPreference;

export type UndoSendApiError = Error & {
	code: string,
	retryable: boolean,
};
