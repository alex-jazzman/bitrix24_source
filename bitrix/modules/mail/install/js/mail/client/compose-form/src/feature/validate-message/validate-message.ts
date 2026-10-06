import { Phrase, RecipientsPerFieldUnlimited } from '../../const';
import { type EditorAttachment } from '../../infrastructure/adapter/editor/types';
import { formatSize } from '../../lib/format-size/format-size';
import { loc } from '../../lib/loc/loc';
import {
	getRecipientCounts,
	getRecipientsTotalCount,
	isLargeAttachmentEnabled,
	isRecipientsTotalLimitExceeded,
} from '../../model/compose/compose';
import { type ComposeState } from '../../model/compose/types';

/** Codes of the checks made on the client; the errors of the send come from the server without one. */
export const ValidationError = Object.freeze({
	RecipientsLimit: 'recipientsLimit',
	RecipientsTotalLimit: 'recipientsTotalLimit',
	RecipientsEmpty: 'recipientsEmpty',
	AttachmentsUploading: 'attachmentsUploading',
	AttachmentsSize: 'attachmentsSize',
} as const);

export type ValidationErrorCode = (typeof ValidationError)[keyof typeof ValidationError];

export type MessageValidationError = {
	code: ValidationErrorCode,
	message: string,
};

export type ValidateMessageParams = {
	state: ComposeState,
	/** The Disk uploader control owns the whole file set; the checks read it and never touch the page. */
	files: EditorAttachment[],
};

type MessageCheck = MessageValidationError | null;

/**
 * Every check runs and every refusal is kept, not the first one alone: the errors are shown as one list, so
 * a user who left the recipients out and is still uploading a file learns both at once.
 */
export function validateMessage(params: ValidateMessageParams): MessageValidationError[]
{
	const checks: MessageCheck[] = [
		checkRecipientsLimit(params),
		getRecipientsTotalLimitError(params.state),
		checkRecipientsFilled(params),
		checkUploadFinished(params),
		checkAttachmentsSize(params),
	];

	return checks.filter((error: MessageCheck): error is MessageValidationError => error !== null);
}

/**
 * The limit stands for one field and not for the message as a whole, and the message names the number it
 * allows. The total ceiling is checked separately, so both messages can be shown when both limits fail.
 */
function checkRecipientsLimit(params: ValidateMessageParams): MessageCheck
{
	const limit = params.state.limits.recipientsPerField;
	if (limit === RecipientsPerFieldUnlimited)
	{
		return null;
	}

	const counts = Object.values(getRecipientCounts(params.state));
	if (!counts.some((count: number): boolean => count > limit))
	{
		return null;
	}

	return {
		code: ValidationError.RecipientsLimit,
		message: loc(Phrase.ErrorRecipientsLimit, { '#COUNT#': String(limit) }),
	};
}

export function getRecipientsTotalLimitError(state: ComposeState): MessageValidationError | null
{
	if (!isRecipientsTotalLimitExceeded(state))
	{
		return null;
	}

	const message = loc(Phrase.ErrorRecipientsTotalLimit, {
		'#COUNT#': String(state.limits.recipientsTotal),
	});

	return {
		code: ValidationError.RecipientsTotalLimit,
		message: message || `${getRecipientsTotalCount(state)} / ${state.limits.recipientsTotal}`,
	};
}

/** Only `to` counts: a message addressed by `cc` or `bcc` alone does not pass. */
function checkRecipientsFilled(params: ValidateMessageParams): MessageCheck
{
	if (getRecipientCounts(params.state).to > 0)
	{
		return null;
	}

	return {
		code: ValidationError.RecipientsEmpty,
		message: loc(Phrase.ErrorRecipientsEmpty),
	};
}

/** The id of the Disk object appears when the upload is over, so a file without one is still on its way. */
function checkUploadFinished(params: ValidateMessageParams): MessageCheck
{
	if (!params.files.some((file: EditorAttachment): boolean => file.id === null))
	{
		return null;
	}

	return {
		code: ValidationError.AttachmentsUploading,
		message: loc(Phrase.ErrorAttachmentsUploading),
	};
}

/**
 * With large attachments on, a set over the limit is taken to the Disk by their core instead of being
 * refused, so the check belongs to the form only while they are off. The message names the limit before the
 * encoding, the value the user may spend on files.
 */
function checkAttachmentsSize(params: ValidateMessageParams): MessageCheck
{
	const { limits } = params.state;
	if (isLargeAttachmentEnabled(params.state) || limits.maxAttachmentsSize <= 0)
	{
		return null;
	}

	const totalSize = params.files.reduce(
		(sum: number, file: EditorAttachment): number => sum + file.size,
		0,
	);
	if (limits.maxAttachmentsSize > encodedSize(totalSize))
	{
		return null;
	}

	return {
		code: ValidationError.AttachmentsSize,
		message: loc(Phrase.ErrorAttachmentsSize, {
			'#SIZE#': formatSize(limits.maxAttachmentsSizeAfterEncoding, loc(Phrase.SizeUnits).split('|')),
		}),
	};
}

/**
 * base64 spends four bytes of the body on every three bytes of a file. The expression repeats the one of the
 * server, so the client refuses exactly what the server refuses.
 */
function encodedSize(totalSize: number): number
{
	return Math.ceil(totalSize / 3) * 4;
}
