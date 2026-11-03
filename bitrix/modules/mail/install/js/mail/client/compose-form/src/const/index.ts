/** The scenario comes from the server payload and is never derived on the client. */
export const Scenario = Object.freeze({
	New: 'new',
	Reply: 'reply',
	ReplyAll: 'replyAll',
	Forward: 'forward',
} as const);

export type ComposeScenario = (typeof Scenario)[keyof typeof Scenario];

/** Value the server sends when the tariff sets no recipient limit per field. */
export const RecipientsPerFieldUnlimited = -1;

/** Fallback for old payloads: the server used this total ceiling before it became tariff-based. */
export const RecipientsTotalLimitDefault = 10;

/**
 * The icon the address book provider draws in the entity selector
 * (`mail/lib/integration/ui/entityselector/addressbookprovider.php`), so the empty-search stub matches the
 * tab it stands in.
 */
export const AddressBookIcon = '/bitrix/images/mail/entity_provider_icons/addressbook.svg';

export const AddressBookHelpArticle = '24146582';

/**
 * Prefixes of the blocks the form inserts into the body; they live inside the editor document, next to the
 * markup of a quoted message, which may carry identifiers of its own. The adapter of the editor turns them
 * into identifiers unique to the instance of the form.
 */
export const BodyNodePrefix = Object.freeze({
	Signature: 'mail-compose-signature',
	Quote: 'mail-compose-quote',
} as const);

/** Shared by the slots control and the onboarding tour that anchors on it. */
export const SlotsControlTestId = 'mail-compose-slots-action';

/** Kept on both the plain and the split send control, so the send e2e spec matches either one. */
export const SendControlTestId = 'mail-compose-send';

export const SaveTemplateContainerTestId = 'mail-compose-save-template';
export const SaveTemplateControlTestId = 'mail-compose-save-template-control';

/**
 * Anchor of the large attachment hint. The node is rendered even when the message has no attachments,
 * otherwise the hint has nothing to point at.
 */
export const AttachmentAnchorTestId = 'mail-compose-attachment-list';

/** Filled by the large attachment adapter, not by a form component. */
export const NoticesTestId = 'mail-compose-form-notices';

export const Phrase = Object.freeze({
	TitleNew: 'MAIL_COMPOSE_FORM_TITLE_NEW',
	TitleReply: 'MAIL_COMPOSE_FORM_TITLE_REPLY',
	TitleForward: 'MAIL_COMPOSE_FORM_TITLE_FORWARD',
	SenderMenuTitle: 'MAIL_COMPOSE_FORM_SENDER_MENU_TITLE',
	SenderLabel: 'MAIL_COMPOSE_FORM_SENDER_LABEL',
	FieldTo: 'MAIL_COMPOSE_FORM_FIELD_TO',
	FieldCc: 'MAIL_COMPOSE_FORM_FIELD_CC',
	FieldBcc: 'MAIL_COMPOSE_FORM_FIELD_BCC',
	FieldAdd: 'MAIL_COMPOSE_FORM_FIELD_ADD',
	/** Carries the number of hidden recipients: "+10" alone says nothing to a screen reader. */
	RecipientsShowAll: 'MAIL_COMPOSE_FORM_RECIPIENTS_SHOW_ALL',
	AddressBookAdd: 'MAIL_COMPOSE_FORM_ADDRESS_BOOK_ADD',
	AddressBookAddFromSearch: 'MAIL_COMPOSE_FORM_ADDRESS_BOOK_ADD_FROM_SEARCH',
	AddressBookEmptyTitle: 'MAIL_COMPOSE_FORM_ADDRESS_BOOK_EMPTY_TITLE',
	AddressBookEmptyText: 'MAIL_COMPOSE_FORM_ADDRESS_BOOK_EMPTY_TEXT',
	AddressBookEmptyHelp: 'MAIL_COMPOSE_FORM_ADDRESS_BOOK_EMPTY_HELP',
	/** The name of the same control for a screen reader: "Подробнее" alone says nothing out of context. */
	AddressBookEmptyHelpLabel: 'MAIL_COMPOSE_FORM_ADDRESS_BOOK_EMPTY_HELP_LABEL',
	SubjectLabel: 'MAIL_COMPOSE_FORM_SUBJECT_LABEL',
	SubjectPlaceholder: 'MAIL_COMPOSE_FORM_SUBJECT_PLACEHOLDER',
	BodyPlaceholder: 'MAIL_COMPOSE_FORM_BODY_PLACEHOLDER',
	SignatureButton: 'MAIL_COMPOSE_FORM_SIGNATURE_BUTTON',
	SignatureMenuTitle: 'MAIL_COMPOSE_FORM_SIGNATURE_MENU_TITLE',
	SignatureShared: 'MAIL_COMPOSE_FORM_SIGNATURE_SHARED',
	SignaturePersonal: 'MAIL_COMPOSE_FORM_SIGNATURE_PERSONAL',
	SignatureNone: 'MAIL_COMPOSE_FORM_SIGNATURE_NONE',
	SignatureConfigure: 'MAIL_COMPOSE_FORM_SIGNATURE_CONFIGURE',
	QuoteShow: 'MAIL_COMPOSE_FORM_QUOTE_SHOW',
	AttachmentsShow: 'MAIL_COMPOSE_FORM_ATTACHMENTS_SHOW',
	/** Carries the name of the file: the cards of a set differ by nothing else. */
	AttachmentRemoveFile: 'MAIL_COMPOSE_FORM_ATTACHMENT_REMOVE_FILE',
	/**
	 * Dictionaries of the forgotten attachment reminder: word roots separated by "|". They are phrases
	 * because the words depend on the portal language.
	 */
	AttachmentMentionPatterns: 'MAIL_COMPOSE_FORM_ATTACHMENT_MENTION_PATTERNS',
	AttachmentMentionVerbs: 'MAIL_COMPOSE_FORM_ATTACHMENT_MENTION_VERBS',
	AttachmentMentionObjects: 'MAIL_COMPOSE_FORM_ATTACHMENT_MENTION_OBJECTS',
	AttachmentReminderTitle: 'MAIL_COMPOSE_FORM_ATTACHMENT_REMINDER_TITLE',
	AttachmentReminderText: 'MAIL_COMPOSE_FORM_ATTACHMENT_REMINDER_TEXT',
	AttachmentReminderAttach: 'MAIL_COMPOSE_FORM_ATTACHMENT_REMINDER_ATTACH',
	AttachmentReminderSend: 'MAIL_COMPOSE_FORM_ATTACHMENT_REMINDER_SEND',
	CopilotButton: 'MAIL_COMPOSE_FORM_COPILOT_BUTTON',
	AttachButton: 'MAIL_COMPOSE_FORM_ATTACH_BUTTON',
	SlotsButton: 'MAIL_COMPOSE_FORM_SLOTS_BUTTON',
	SendButton: 'MAIL_COMPOSE_FORM_SEND_BUTTON',
	CancelButton: 'MAIL_COMPOSE_FORM_CANCEL_BUTTON',
	SaveAsTemplate: 'MAIL_COMPOSE_FORM_SAVE_AS_TEMPLATE',
	/** Phrases of the schedule and document controls that remain under `unfinishedElements`. */
	CreateDocumentButton: 'MAIL_COMPOSE_FORM_CREATE_DOCUMENT_BUTTON',
	ScheduleButton: 'MAIL_COMPOSE_FORM_SCHEDULE_BUTTON',
	/** Sends the moment picked in the calendar of the popup, unlike the presets next to it. */
	ScheduleConfirm: 'MAIL_COMPOSE_FORM_SCHEDULE_CONFIRM',
	SchedulePresetInOneHour: 'MAIL_COMPOSE_FORM_SCHEDULE_PRESET_IN_ONE_HOUR',
	SchedulePresetTomorrow: 'MAIL_COMPOSE_FORM_SCHEDULE_PRESET_TOMORROW',
	SchedulePresetWeekEnd: 'MAIL_COMPOSE_FORM_SCHEDULE_PRESET_WEEK_END',
	SchedulePresetNextWeek: 'MAIL_COMPOSE_FORM_SCHEDULE_PRESET_NEXT_WEEK',
	SchedulePresetMonthEnd: 'MAIL_COMPOSE_FORM_SCHEDULE_PRESET_MONTH_END',
	ScheduleErrorPastTime: 'MAIL_COMPOSE_FORM_SCHEDULE_ERROR_PAST_TIME',
	ScheduleErrorTime: 'MAIL_COMPOSE_FORM_SCHEDULE_ERROR_TIME',
	ScheduleErrorFeatureUnavailable: 'MAIL_COMPOSE_FORM_SCHEDULE_ERROR_FEATURE_UNAVAILABLE',
	ScheduleErrorAccessDenied: 'MAIL_COMPOSE_FORM_SCHEDULE_ERROR_ACCESS_DENIED',
	ScheduleErrorNotFound: 'MAIL_COMPOSE_FORM_SCHEDULE_ERROR_NOT_FOUND',
	ScheduleErrorRevisionConflict: 'MAIL_COMPOSE_FORM_SCHEDULE_ERROR_REVISION_CONFLICT',
	ScheduleErrorAlreadySending: 'MAIL_COMPOSE_FORM_SCHEDULE_ERROR_ALREADY_SENDING',
	ScheduleErrorAlreadySent: 'MAIL_COMPOSE_FORM_SCHEDULE_ERROR_ALREADY_SENT',
	ScheduleErrorAlreadyCancelled: 'MAIL_COMPOSE_FORM_SCHEDULE_ERROR_ALREADY_CANCELLED',
	ScheduleErrorMailboxUnavailable: 'MAIL_COMPOSE_FORM_SCHEDULE_ERROR_MAILBOX_UNAVAILABLE',
	ScheduleErrorMailboxAccess: 'MAIL_COMPOSE_FORM_SCHEDULE_ERROR_MAILBOX_ACCESS',
	ScheduleErrorSenderUnavailable: 'MAIL_COMPOSE_FORM_SCHEDULE_ERROR_SENDER_UNAVAILABLE',
	ScheduleErrorRecipients: 'MAIL_COMPOSE_FORM_SCHEDULE_ERROR_RECIPIENTS',
	ScheduleErrorSendLimit: 'MAIL_COMPOSE_FORM_SCHEDULE_ERROR_SEND_LIMIT',
	ScheduleErrorAttachmentLimit: 'MAIL_COMPOSE_FORM_SCHEDULE_ERROR_ATTACHMENT_LIMIT',
	ScheduleErrorInvalidHeader: 'MAIL_COMPOSE_FORM_SCHEDULE_ERROR_INVALID_HEADER',
	ScheduleErrorAttachmentAccess: 'MAIL_COMPOSE_FORM_SCHEDULE_ERROR_ATTACHMENT_ACCESS',
	ScheduleErrorAttachmentInvalid: 'MAIL_COMPOSE_FORM_SCHEDULE_ERROR_ATTACHMENT_INVALID',
	ScheduleErrorAttachmentCopy: 'MAIL_COMPOSE_FORM_SCHEDULE_ERROR_ATTACHMENT_COPY',
	ScheduleErrorAttachmentSize: 'MAIL_COMPOSE_FORM_SCHEDULE_ERROR_ATTACHMENT_SIZE',
	ScheduleErrorSaveFailed: 'MAIL_COMPOSE_FORM_SCHEDULE_ERROR_SAVE_FAILED',
	ScheduleErrorUnknown: 'MAIL_COMPOSE_FORM_SCHEDULE_ERROR_UNKNOWN',
	ScheduleSuccess: 'MAIL_COMPOSE_FORM_SCHEDULE_SUCCESS',
	/** Templates are a working capability independent from the unfinished controls. */
	TemplatesButton: 'MAIL_COMPOSE_FORM_TEMPLATES_BUTTON',
	TemplatesNewLabel: 'MAIL_COMPOSE_FORM_TEMPLATES_NEW_LABEL',
	TemplatesMenuTitle: 'MAIL_COMPOSE_FORM_TEMPLATES_MENU_TITLE',
	TemplatesAllButton: 'MAIL_COMPOSE_FORM_TEMPLATES_ALL_BUTTON',
	TemplatesConfigureButton: 'MAIL_COMPOSE_FORM_TEMPLATES_CONFIGURE_BUTTON',
	TemplatesCreateButton: 'MAIL_COMPOSE_FORM_TEMPLATES_CREATE_BUTTON',
	TemplatePreviewButton: 'MAIL_COMPOSE_FORM_TEMPLATE_PREVIEW_BUTTON',
	TemplatePreviewTitle: 'MAIL_COMPOSE_FORM_TEMPLATE_PREVIEW_TITLE',
	TemplatePreviewClose: 'MAIL_COMPOSE_FORM_TEMPLATE_PREVIEW_CLOSE',
	TemplatePreviewError: 'MAIL_COMPOSE_FORM_TEMPLATE_PREVIEW_ERROR',
	TemplatesSearch: 'MAIL_COMPOSE_FORM_TEMPLATES_SEARCH',
	TemplatesLoading: 'MAIL_COMPOSE_FORM_TEMPLATES_LOADING',
	TemplatesEmpty: 'MAIL_COMPOSE_FORM_TEMPLATES_EMPTY',
	TemplatesLoadError: 'MAIL_COMPOSE_FORM_TEMPLATES_LOAD_ERROR',
	TemplatesRetry: 'MAIL_COMPOSE_FORM_TEMPLATES_RETRY',
	TemplatesLoadMore: 'MAIL_COMPOSE_FORM_TEMPLATES_LOAD_MORE',
	TemplatesFoundCount: 'MAIL_COMPOSE_FORM_TEMPLATES_FOUND_COUNT',
	TemplateUnavailable: 'MAIL_COMPOSE_FORM_TEMPLATE_UNAVAILABLE',
	TemplateUnavailableCrmContext: 'MAIL_COMPOSE_FORM_TEMPLATE_UNAVAILABLE_CRM_CONTEXT',
	TemplateApplyTitle: 'MAIL_COMPOSE_FORM_TEMPLATE_APPLY_TITLE',
	TemplateApplyCancel: 'MAIL_COMPOSE_FORM_TEMPLATE_APPLY_CANCEL',
	TemplateApplyInsert: 'MAIL_COMPOSE_FORM_TEMPLATE_APPLY_INSERT',
	TemplateApplyReplace: 'MAIL_COMPOSE_FORM_TEMPLATE_APPLY_REPLACE',
	TemplateApplyError: 'MAIL_COMPOSE_FORM_TEMPLATE_APPLY_ERROR',
	SubjectGenerationButton: 'MAIL_COMPOSE_FORM_SUBJECT_GENERATION_BUTTON',
	/** Shown over the locked subject field while the generation runs, and announced at its start. */
	SubjectGenerationRunning: 'MAIL_COMPOSE_FORM_SUBJECT_GENERATION_RUNNING',
	/** Notices of the subject generation; the wording repeats the mobile application. */
	SubjectGenerationEmptyBody: 'MAIL_COMPOSE_FORM_SUBJECT_GENERATION_EMPTY_BODY',
	SubjectGenerationError: 'MAIL_COMPOSE_FORM_SUBJECT_GENERATION_ERROR',
	SubjectGenerationLimit: 'MAIL_COMPOSE_FORM_SUBJECT_GENERATION_LIMIT',
	/** Spoken to a screen reader when the ready subject lands in the field; nothing else reports it. */
	SubjectGenerationDone: 'MAIL_COMPOSE_FORM_SUBJECT_GENERATION_DONE',
	SlotsText: 'MAIL_COMPOSE_FORM_SLOTS_TEXT',
	SlotsCalendarTitle: 'MAIL_COMPOSE_FORM_SLOTS_CALENDAR_TITLE',
	SlotsCalendarText: 'MAIL_COMPOSE_FORM_SLOTS_CALENDAR_TEXT',
	SlotsCalendarOpen: 'MAIL_COMPOSE_FORM_SLOTS_CALENDAR_OPEN',
	SlotsTourTitle: 'MAIL_COMPOSE_FORM_SLOTS_TOUR_TITLE',
	SlotsTourTextEnabled: 'MAIL_COMPOSE_FORM_SLOTS_TOUR_TEXT_ENABLED',
	SlotsTourTextDisabled: 'MAIL_COMPOSE_FORM_SLOTS_TOUR_TEXT_DISABLED',
	LargeAttachmentUploading: 'MAIL_COMPOSE_FORM_LARGE_ATTACHMENT_UPLOADING',
	LargeAttachmentLinkLost: 'MAIL_COMPOSE_FORM_LARGE_ATTACHMENT_LINK_LOST',
	/** File size units in ascending order of 1024 steps, separated by "|". */
	SizeUnits: 'MAIL_COMPOSE_FORM_SIZE_UNITS',
	ErrorRecipientsLimit: 'MAIL_COMPOSE_FORM_ERROR_RECIPIENTS_LIMIT',
	ErrorRecipientsTotalLimit: 'MAIL_COMPOSE_FORM_ERROR_RECIPIENTS_TOTAL_LIMIT',
	ErrorRecipientsEmpty: 'MAIL_COMPOSE_FORM_ERROR_RECIPIENTS_EMPTY',
	ErrorAttachmentsUploading: 'MAIL_COMPOSE_FORM_ERROR_ATTACHMENTS_UPLOADING',
	ErrorAttachmentsSize: 'MAIL_COMPOSE_FORM_ERROR_ATTACHMENTS_SIZE',
	/** Shown instead of sending an answer whose folded quote the editor could no longer serialise. */
	ErrorQuoteLost: 'MAIL_COMPOSE_FORM_ERROR_QUOTE_LOST',
	/** Fallback shown when the response carries no server errors of its own. */
	ErrorSendFailed: 'MAIL_COMPOSE_FORM_ERROR_SEND_FAILED',
	SendSuccess: 'MAIL_COMPOSE_FORM_SEND_SUCCESS',
} as const);

/**
 * Phrase for every refusal the schedule and the change of a scheduled letter answer with, by the error code
 * of the server. The messages of the service are English diagnostics and are shown to nobody: a code that is
 * missing here is answered with `Phrase.ScheduleErrorUnknown`. A new code of the server is one line more.
 */
export const ScheduleErrorPhrase: Readonly<Record<string, string>> = Object.freeze({
	feature_unavailable: Phrase.ScheduleErrorFeatureUnavailable,
	invalid_time: Phrase.ScheduleErrorPastTime,
	access_denied: Phrase.ScheduleErrorAccessDenied,
	not_found: Phrase.ScheduleErrorNotFound,
	revision_conflict: Phrase.ScheduleErrorRevisionConflict,
	already_sending: Phrase.ScheduleErrorAlreadySending,
	already_sent: Phrase.ScheduleErrorAlreadySent,
	already_cancelled: Phrase.ScheduleErrorAlreadyCancelled,
	mailbox_unavailable: Phrase.ScheduleErrorMailboxUnavailable,
	mailbox_access_denied: Phrase.ScheduleErrorMailboxAccess,
	sender_unavailable: Phrase.ScheduleErrorSenderUnavailable,
	recipient_limit: Phrase.ScheduleErrorRecipients,
	send_limit: Phrase.ScheduleErrorSendLimit,
	attachment_limit: Phrase.ScheduleErrorAttachmentLimit,
	invalid_header: Phrase.ScheduleErrorInvalidHeader,
	attachment_access_denied: Phrase.ScheduleErrorAttachmentAccess,
	attachment_invalid: Phrase.ScheduleErrorAttachmentInvalid,
	attachment_copy_failed: Phrase.ScheduleErrorAttachmentCopy,
	attachment_size_limit: Phrase.ScheduleErrorAttachmentSize,
	save_failed: Phrase.ScheduleErrorSaveFailed,
});
