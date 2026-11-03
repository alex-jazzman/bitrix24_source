/* eslint-disable */
type RunAction = (action: string, options: AjaxActionOptions) => Promise<AjaxActionResponse>;

type AjaxActionOptions = {
	data: Record<string, unknown>;
};

type AjaxActionResponse = {
	data?: unknown;
};

/**
 * The draft the letter was written in is named by both of its fields or by neither: the portal closes the
 * draft only when the revision it is asked for is still the one it holds. A letter written without a draft —
 * an answer, a screen that keeps none — schedules without these fields.
 */
type ScheduleScheduledMessageRequest = ScheduledMessageSnapshot & {
	mailboxId: number;
	draftId?: number;
	draftRevision?: number;
	/** Asks the portal to keep the letter as a personal template of its author. */
	saveAsTemplate?: boolean;
};

type ScheduledMessageSnapshot = {
	inReplyTo: string | null;
	sender: ScheduledMessageSender;
	recipients: ScheduledMessageRecipients;
	subject: string;
	body: string;
	attachments: ScheduledMessageAttachmentInput[];
	scheduledAt: string;
	timezoneId: string;
};

type ScheduledMessageSender = {
	email: string;
	name?: string;
	avatar?: string;
};

type ScheduledMessageRecipients = {
	to: ScheduledMessageRecipient[];
	cc?: ScheduledMessageRecipient[];
	bcc?: ScheduledMessageRecipient[];
};

/** Stored as it was sent, so an entry written before a key was named keeps the keys it came with. */
type ScheduledMessageRecipient = {
	email: string;
	name?: string;
	avatar?: string;
	[key: string]: unknown;
};

/** A Disk object of the author: the copy the letter is sent with is made by the portal and named `fileId`. */
type ScheduledMessageAttachmentInput = {
	objectId: number;
	fileName: string;
	contentId?: string | null;
	isInline?: boolean;
};

type ScheduledMessageDto = {
	id: number;
	revision: number;
	status: ScheduledMessageStatus;
	mailboxId: number;
	authorId: number;
	sender: ScheduledMessageSender;
	recipients: ScheduledMessageRecipients;
	subject: string;
	body: string;
	inReplyTo: string | null;
	attachments: ScheduledMessageAttachment[];
	scheduledAt: string;
	authorTimezoneId: string;
	lastError: ScheduledMessageLastError | null;
	errorReason: string | null;
	permissions: ScheduledMessagePermissions;
	actions: ScheduledMessageAction[];
};

type ScheduledMessageStatus = 'scheduled' | 'sending' | 'error' | 'sent' | 'cancelled';

type ScheduledMessageAttachment = {
	id: number;
	fileId: number;
	objectId: number | null;
	fileName: string;
	contentId: string | null;
	isInline: boolean;
};

type ScheduledMessageLastError = {
	code: string;
	message: string;
	retryable: boolean;
};

type ScheduledMessagePermissions = {
	canView: boolean;
	canManage: boolean;
};

type ScheduledMessageAction = 'update' | 'cancel' | 'retry';

type ListScheduledMessagesRequest = {
	mailboxId: number;
	offset?: number;
	limit?: number;
	statuses?: ScheduledMessageStatus[];
};

type ScheduledMessageListResponse = {
	items: ScheduledMessageListItemDto[];
	total: number;
	hasMore: boolean;
};

/** The list answers without the body of the letter: only the screen of a single message renders it. */
type ScheduledMessageListItemDto = Omit<ScheduledMessageDto, 'body'>;

type GetScheduledMessageRequest = {
	id: number;
};

type UpdateScheduledMessageRequest = ScheduledMessageSnapshot & {
	id: number;
	revision: number;
	existingAttachmentIds?: number[];
};

type ChangeScheduledMessageStateRequest = {
	id: number;
	revision: number;
};

type CancelScheduledMessageResponse = ScheduledMessageResponse & {
	draftId: number;
	draft: {
		id: number;
		revision: number;
		[key: string]: unknown;
	};
};

type ScheduledMessageResponse = {
	scheduledMessage: ScheduledMessageDto;
};

type ScheduledMessageApiError = Error & {
	code: string;
	retryable: boolean;
};

type ScheduledTimePresetValue = typeof BX.Mail.Client.ScheduledMessage.ScheduledTimePreset[keyof typeof BX.Mail.Client.ScheduledMessage.ScheduledTimePreset];

type ScheduledTimePresetOptions = {
	now?: Date;
	selectedLocalDateTime?: LocalDateTime;
};

type LocalDateTime = {
	year: number;
	month: number;
	day: number;
	hour: number;
	minute: number;
	second?: number;
};

type AbsoluteScheduledTime = {
	iso: string;
	timezoneLabel: string;
};

type ScheduledTimeError = RangeError & {
	code: ScheduledTimeErrorCodeValue;
};

type ScheduledTimeErrorCodeValue = typeof BX.Mail.Client.ScheduledMessage.ScheduledTimeErrorCode[keyof typeof BX.Mail.Client.ScheduledMessage.ScheduledTimeErrorCode];

type ScheduledMessageErrorCodeValue = (typeof BX.Mail.Client.ScheduledMessage.ScheduledMessageErrorCode[keyof typeof BX.Mail.Client.ScheduledMessage.ScheduledMessageErrorCode]);

declare namespace BX.Mail.Client.ScheduledMessage {
	class ScheduledMessageApi {
		constructor(runAction?: RunAction);
		schedule(request: ScheduleScheduledMessageRequest): Promise<ScheduledMessageDto>;
		list(request: ListScheduledMessagesRequest): Promise<ScheduledMessageListResponse>;
		get(request: GetScheduledMessageRequest): Promise<ScheduledMessageDto>;
		update(request: UpdateScheduledMessageRequest): Promise<ScheduledMessageDto>;
		cancel(request: ChangeScheduledMessageStateRequest): Promise<CancelScheduledMessageResponse>;
		retry(request: ChangeScheduledMessageStateRequest): Promise<ScheduledMessageDto>;
	}

	const scheduledMessageApi: ScheduledMessageApi;

	/**
	 * Renders the moment the way the author scheduled it: "today, 18:00" / "tomorrow, 09:00", any other day
	 * in full. Both the moment and the reference are moved to the author wall clock beforehand, so the day is
	 * counted in the author timezone and a letter set for tonight does not read as tomorrow abroad.
	 */
	function formatRelativeScheduledDateTime(absoluteTime: string, timezoneId: string, now?: Date): string;

	function formatScheduledDateTime(absoluteTime: string, format?: string): string;

	function resolveScheduledTimePreset(preset: ScheduledTimePresetValue, timezoneId: string, options?: ScheduledTimePresetOptions): AbsoluteScheduledTime;

	const ScheduledTimePreset: Readonly<{
		readonly InOneHour: "inOneHour";
		readonly Tomorrow: "tomorrow";
		readonly WeekEnd: "weekEnd";
		readonly NextWeek: "nextWeek";
		readonly MonthEnd: "monthEnd";
		readonly Custom: "custom";
	}>;

	const ScheduledTimeErrorCode: Readonly<{
		readonly InvalidLocalTime: "invalid_local_time";
		readonly PastTime: "past_time";
	}>;

	function toAbsoluteScheduledTime(localDateTime: LocalDateTime, timezoneId: string): AbsoluteScheduledTime;

	/**
	 * Every code the portal names on this surface. The first group is what a request of the api is refused with
	 * (`Bitrix\Mail\Controller\ScheduledMessage`, the services behind it and the draft gateway a cancellation goes
	 * through), the second one is what the sending of a letter writes into `lastError` (`ScheduledMessageDispatcher`
	 * and `SendMessageService`): both reach the browser through this extension, so both belong to its contract.
	 */
	const ScheduledMessageErrorCode: Readonly<{
		readonly FeatureUnavailable: "feature_unavailable";
		readonly InvalidTime: "invalid_time";
		readonly AccessDenied: "access_denied";
		readonly NotFound: "not_found";
		readonly RevisionConflict: "revision_conflict";
		readonly AlreadySending: "already_sending";
		readonly AlreadySent: "already_sent";
		readonly AlreadyCancelled: "already_cancelled";
		readonly MailboxAccessDenied: "mailbox_access_denied";
		readonly RecipientLimit: "recipient_limit";
		readonly AttachmentLimit: "attachment_limit";
		readonly InvalidHeader: "invalid_header";
		readonly AttachmentAccessDenied: "attachment_access_denied";
		readonly AttachmentInvalid: "attachment_invalid";
		readonly AttachmentCopyFailed: "attachment_copy_failed";
		readonly AttachmentSizeLimit: "attachment_size_limit";
		readonly SaveFailed: "save_failed";
		readonly SendLimit: "send_limit";
		readonly DraftUnavailable: "draft_unavailable";
		readonly DraftSaveFailed: "draft_save_failed";
		readonly SenderUnavailable: "sender_unavailable";
		readonly AttachmentUnavailable: "attachment_unavailable";
		readonly MailboxUnavailable: "mailbox_unavailable";
		readonly InvalidAuthor: "invalid_author";
		readonly RecipientRequired: "recipient_required";
		readonly SendFailed: "send_failed";
		readonly SendException: "send_exception";
	}>;
}
