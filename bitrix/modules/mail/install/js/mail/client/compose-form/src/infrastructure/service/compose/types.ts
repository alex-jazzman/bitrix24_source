import {
	type CreateUndoSendRequest,
	type UndoSendOperationDto,
} from 'mail.client.undo-send';

import { type SignatureItemDto } from '../../../model/compose/types';

export type AjaxError = {
	code?: string | number,
	message: string,
	customData?: unknown,
};

/** A failed request rejects with an envelope of the same shape, so the errors are read in one place. */
export type AjaxResponse<T> = {
	data: T,
	errors: AjaxError[],
	status: 'success' | 'error',
};

export type SendMessageResponseData = {
	templateSaveWarning: boolean,
};

/** The shape of the signatures block of the initial data, minus the settings path that data alone carries. */
export type SignaturesResponse = {
	bySender?: Record<string, SignatureItemDto[]>,
	choices?: Record<string, string>,
};

/** The address comes with the flag turned on alone, so the flag is what the form checks. */
export type CalendarSharingLinkResponse = {
	isSharingFeatureEnabled?: boolean,
	sharingUrl?: string,
};

export type UndoSendGateway = {
	create(request: CreateUndoSendRequest): Promise<UndoSendOperationDto>,
	show(operation: UndoSendOperationDto): Promise<void> | void,
};

/**
 * Composition mode of `mail.api.composeform.generateSubject`; the values are the `MODE_*` constants of
 * `Bitrix\Mail\Integration\AI\SubjectGenerator`.
 */
export const SubjectGenerationMode = Object.freeze({
	New: 'new',
	Reply: 'reply',
	Forward: 'forward',
} as const);

export type SubjectGenerationModeValue = (typeof SubjectGenerationMode)[keyof typeof SubjectGenerationMode];

/**
 * Request of `mail.api.composeform.generateSubject`. The CRM pair of the action is not sent: the redesigned
 * form opens from the mail route alone and has no entity to compose for.
 */
export type GenerateSubjectRequest = {
	/** Plain text of the body, signature and quote already cut off. */
	body: string,
	mode: SubjectGenerationModeValue,
	/** Subject to improve; an empty string asks for generation from scratch. */
	currentSubject: string,
	/** Sent for a positive id alone, so a new letter carries no key at all. */
	originalMessageId?: number,
};

/** Exactly one of the two comes back: a ready subject for a synchronous engine, a hash for a deferred job. */
export type GenerateSubjectResponse = {
	queueHash?: string,
	subject?: string,
};
