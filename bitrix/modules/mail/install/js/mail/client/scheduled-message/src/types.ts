/**
 * Every code the portal names on this surface. The first group is what a request of the api is refused with
 * (`Bitrix\Mail\Controller\ScheduledMessage`, the services behind it and the draft gateway a cancellation goes
 * through), the second one is what the sending of a letter writes into `lastError` (`ScheduledMessageDispatcher`
 * and `SendMessageService`): both reach the browser through this extension, so both belong to its contract.
 */
export const ScheduledMessageErrorCode = Object.freeze({
	FeatureUnavailable: 'feature_unavailable',
	InvalidTime: 'invalid_time',
	AccessDenied: 'access_denied',
	NotFound: 'not_found',
	RevisionConflict: 'revision_conflict',
	AlreadySending: 'already_sending',
	AlreadySent: 'already_sent',
	AlreadyCancelled: 'already_cancelled',
	MailboxAccessDenied: 'mailbox_access_denied',
	RecipientLimit: 'recipient_limit',
	AttachmentLimit: 'attachment_limit',
	InvalidHeader: 'invalid_header',
	AttachmentAccessDenied: 'attachment_access_denied',
	AttachmentInvalid: 'attachment_invalid',
	AttachmentCopyFailed: 'attachment_copy_failed',
	AttachmentSizeLimit: 'attachment_size_limit',
	SaveFailed: 'save_failed',
	SendLimit: 'send_limit',
	// a cancellation returns the letter to the drafts, and the gateway of the drafts refuses it by its own codes
	DraftUnavailable: 'draft_unavailable',
	DraftSaveFailed: 'draft_save_failed',
	// from here on the codes of the sending; `send_limit` is answered by both the api and the sending
	SenderUnavailable: 'sender_unavailable',
	AttachmentUnavailable: 'attachment_unavailable',
	MailboxUnavailable: 'mailbox_unavailable',
	InvalidAuthor: 'invalid_author',
	RecipientRequired: 'recipient_required',
	SendFailed: 'send_failed',
	SendException: 'send_exception',
} as const);

export type ScheduledMessageErrorCodeValue = (
	typeof ScheduledMessageErrorCode[keyof typeof ScheduledMessageErrorCode]
);

export type ScheduledMessageStatus = 'scheduled' | 'sending' | 'error' | 'sent' | 'cancelled';

export type ScheduledMessageAction = 'update' | 'cancel' | 'retry';

export type ScheduledMessageSender = {
	email: string,
	name?: string,
	avatar?: string,
};

/** Stored as it was sent, so an entry written before a key was named keeps the keys it came with. */
export type ScheduledMessageRecipient = {
	email: string,
	name?: string,
	avatar?: string,
	[key: string]: unknown,
};

export type ScheduledMessageRecipients = {
	to: ScheduledMessageRecipient[],
	cc?: ScheduledMessageRecipient[],
	bcc?: ScheduledMessageRecipient[],
};

/** A Disk object of the author: the copy the letter is sent with is made by the portal and named `fileId`. */
export type ScheduledMessageAttachmentInput = {
	objectId: number,
	fileName: string,
	contentId?: string | null,
	isInline?: boolean,
};

export type ScheduledMessageAttachment = {
	id: number,
	fileId: number,
	objectId: number | null,
	fileName: string,
	contentId: string | null,
	isInline: boolean,
};

export type ScheduledMessageLastError = {
	code: string,
	message: string,
	retryable: boolean,
};

export type ScheduledMessagePermissions = {
	canView: boolean,
	canManage: boolean,
};

export type ScheduledMessageDto = {
	id: number,
	revision: number,
	status: ScheduledMessageStatus,
	mailboxId: number,
	authorId: number,
	sender: ScheduledMessageSender,
	recipients: ScheduledMessageRecipients,
	subject: string,
	body: string,
	inReplyTo: string | null,
	attachments: ScheduledMessageAttachment[],
	scheduledAt: string,
	authorTimezoneId: string,
	lastError: ScheduledMessageLastError | null,
	errorReason: string | null,
	permissions: ScheduledMessagePermissions,
	actions: ScheduledMessageAction[],
};

/** The list answers without the body of the letter: only the screen of a single message renders it. */
export type ScheduledMessageListItemDto = Omit<ScheduledMessageDto, 'body'>;

export type ScheduledMessageSnapshot = {
	inReplyTo: string | null,
	sender: ScheduledMessageSender,
	recipients: ScheduledMessageRecipients,
	subject: string,
	body: string,
	attachments: ScheduledMessageAttachmentInput[],
	scheduledAt: string,
	timezoneId: string,
};

/**
 * The draft the letter was written in is named by both of its fields or by neither: the portal closes the
 * draft only when the revision it is asked for is still the one it holds. A letter written without a draft —
 * an answer, a screen that keeps none — schedules without these fields.
 */
export type ScheduleScheduledMessageRequest = ScheduledMessageSnapshot & {
	mailboxId: number,
	draftId?: number,
	draftRevision?: number,
	/** Asks the portal to keep the letter as a personal template of its author. */
	saveAsTemplate?: boolean,
};

export type ListScheduledMessagesRequest = {
	mailboxId: number,
	offset?: number,
	limit?: number,
	statuses?: ScheduledMessageStatus[],
};

export type GetScheduledMessageRequest = {
	id: number,
};

export type UpdateScheduledMessageRequest = ScheduledMessageSnapshot & {
	id: number,
	revision: number,
	existingAttachmentIds?: number[],
};

export type ChangeScheduledMessageStateRequest = {
	id: number,
	revision: number,
};

export type ScheduledMessageResponse = {
	scheduledMessage: ScheduledMessageDto,
};

export type CancelScheduledMessageResponse = ScheduledMessageResponse & {
	draftId: number,
	draft: {
		id: number,
		revision: number,
		[key: string]: unknown,
	},
};

export type ScheduledMessageListResponse = {
	items: ScheduledMessageListItemDto[],
	total: number,
	hasMore: boolean,
};
