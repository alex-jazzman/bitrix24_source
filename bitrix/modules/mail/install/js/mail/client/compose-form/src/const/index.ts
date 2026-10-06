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
	/** Phrases of the schedule and document controls that remain under `unfinishedElements`. */
	CreateDocumentButton: 'MAIL_COMPOSE_FORM_CREATE_DOCUMENT_BUTTON',
	ScheduleButton: 'MAIL_COMPOSE_FORM_SCHEDULE_BUTTON',
	SchedulePresetToday: 'MAIL_COMPOSE_FORM_SCHEDULE_PRESET_TODAY',
	SchedulePresetTomorrow: 'MAIL_COMPOSE_FORM_SCHEDULE_PRESET_TOMORROW',
	SchedulePresetWeekEnd: 'MAIL_COMPOSE_FORM_SCHEDULE_PRESET_WEEK_END',
	SchedulePresetNextWeek: 'MAIL_COMPOSE_FORM_SCHEDULE_PRESET_NEXT_WEEK',
	SchedulePresetMonthEnd: 'MAIL_COMPOSE_FORM_SCHEDULE_PRESET_MONTH_END',
	/** Templates are a working capability independent from the unfinished controls. */
	TemplatesButton: 'MAIL_COMPOSE_FORM_TEMPLATES_BUTTON',
	TemplatesNewLabel: 'MAIL_COMPOSE_FORM_TEMPLATES_NEW_LABEL',
	TemplatesMenuTitle: 'MAIL_COMPOSE_FORM_TEMPLATES_MENU_TITLE',
	TemplatesRemember: 'MAIL_COMPOSE_FORM_TEMPLATES_REMEMBER',
	TemplatesAllButton: 'MAIL_COMPOSE_FORM_TEMPLATES_ALL_BUTTON',
	TemplatesConfigureButton: 'MAIL_COMPOSE_FORM_TEMPLATES_CONFIGURE_BUTTON',
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
