import { type ComposeScenario } from '../../const';

/**
 * Passed through as `Sender::prepareUserMailboxes()` returns it: the order is kept and nothing is
 * rewritten. Only the fields every sender kind carries are required, the rest belong to mailbox senders.
 */
export type SenderDto = {
	id: number | string,
	name: string,
	email: string,
	formated: string,
	type: string,
	showEditHint?: boolean,
	can_delete?: boolean,
	mailboxId?: number | string,
	userId?: number | string,
	canEdit?: boolean,
	isOwner?: boolean,
	editHref?: string | null,
	avatar?: string | null,
	userUrl?: string | null,
};

/**
 * Item of the entity selector, sent back to the server as it came, so nothing is normalised here. Only the
 * identifying pair is named: the remaining values are not plain strings, `title` of a typed node arrives as
 * `{ text, type }` (`ui/lib/entityselector/textnode.php`).
 */
export type RecipientItemDto = {
	id: number | string,
	entityId: string,
	[key: string]: unknown,
};

export type SignatureItemDto = {
	full?: string,
	preview?: string,
	menuPreview?: string,
	signatureId?: number | string,
	isShared?: boolean,
	/** Timestamp of the latest assignment of a shared signature; personal ones have none. */
	assignedAt?: number | string | null,
};

export type SignaturesDto = {
	/** Key is the 'formated' value of a sender, its bare address or an empty string. */
	bySender?: Record<string, SignatureItemDto[]>,
	/** Remembered choice of the user, "<signatureId>:<unixtime>", kept in the storage shape. */
	choices?: Record<string, string>,
	settingsPath?: string,
};

/**
 * Carries no address of the file: the cards of the attachments are drawn from the control of the Disk
 * uploader, and the id is what the template of the form mounts that control with.
 */
export type AttachmentFileDto = {
	id: string,
	name: string,
	/** Size as the server formatted it for the card; `bytes` is the one to count with. */
	size: string,
	bytes: number,
};

/** CoPilot parameters are passed to the editor as they come; only the switch itself is read. */
export type CopilotDto = {
	isCopilotEnabled?: boolean,
	[key: string]: unknown,
};

export type ComposeLimitsDto = {
	/** `-1` means the tariff sets no limit per field. */
	recipientsPerField?: number,
	/** Ceiling over all the recipient fields; the server owns it and the form repeats it for feedback. */
	recipientsTotal?: number,
	maxAttachmentsSize?: number,
	maxAttachmentsSizeAfterEncoding?: number,
};

export type CalendarSharingDto = {
	available?: boolean,
	featureEnabled?: boolean,
	crmFeatureEnabled?: boolean,
	showTour?: boolean,
	/**
	 * Built by the server for its site; an empty value leaves the disabled-sharing popup without a link to
	 * the calendar.
	 */
	userCalendarPath?: string,
};

export type LargeAttachmentDto = {
	localFeatureAvailable?: boolean,
	featureAvailable?: boolean,
	showAha?: boolean,
	ahaOptionName?: string,
	postSendPromptSuppressed?: boolean,
	postSendPromptOptionName?: string,
	folderName?: string,
};

export type SendDto = {
	actionUrl?: string,
	/** Both fields are filled for an answer alone. */
	inReplyTo?: string | null,
	mailboxId?: number | null,
};

/** Entry point reported in the analytics event; the server validates the value. */
export type AnalyticsElement = 'compose_button' | 'reply' | 'reply_all' | 'fast_reply' | 'forward';

export type AnalyticsDto = {
	section?: string,
	element?: AnalyticsElement,
};

export type PathsDto = {
	/** `null` when the mailbox is undefined or the router passed no template: the form closes to `home`. */
	messageList?: string | null,
	home?: string,
	/**
	 * Section the templates are managed in. It belongs to CRM, so the server leaves it empty whenever
	 * the user cannot be led there, and the form then offers no entry.
	 */
	templatesManage?: string,
};

/**
 * Built by `Bitrix\Mail\Service\Compose\ComposeFormDataProvider` and serialised into the compose template.
 * Every field is optional on purpose: `createComposeState()` fills in what a payload does not carry.
 */
export type ComposeInitialData = {
	scenario?: ComposeScenario,
	title?: string,
	messageId?: number,
	/** The server answers the source message by it; the form reads what it derived, not the id itself. */
	parentMessageId?: number | null,
	mailbox?: {
		id?: number | null,
		email?: string,
	},
	senders?: SenderDto[],
	/** 'formated' value of the sender the form starts on. */
	selectedSender?: string | null,
	signatures?: SignaturesDto,
	recipients?: {
		to?: RecipientItemDto[],
		cc?: RecipientItemDto[],
		bcc?: RecipientItemDto[],
	},
	subject?: string,
	body?: {
		quote?: string,
		quoteFolded?: boolean,
	},
	attachments?: {
		files?: AttachmentFileDto[],
		folded?: boolean,
	},
	limits?: ComposeLimitsDto,
	calendarSharing?: CalendarSharingDto,
	copilot?: CopilotDto,
	largeAttachment?: LargeAttachmentDto,
	attachmentReminder?: {
		enabled?: boolean,
	},
	send?: SendDto,
	analytics?: AnalyticsDto,
	features?: {
		unfinishedElements?: boolean,
		templates?: boolean,
	},
	draft?: {
		id?: number,
		revision?: number,
		clientId?: string,
	},
	paths?: PathsDto,
};

export type ComposeMailboxState = {
	id: number | null,
	email: string,
};

export type SignatureItem = {
	full: string,
	preview: string,
	menuPreview?: string,
	signatureId: number,
	isShared: boolean,
	assignedAt: number | null,
};

/**
 * Keeps the payload shape of `signatures`, so the response of `mail.api.composeform.getSignatures` is
 * written into it key by key.
 */
export type SignaturesState = {
	bySender: Record<string, SignatureItem[]>,
	choices: Record<string, string>,
	settingsPath: string,
};

export type RecipientsState = {
	to: RecipientItemDto[],
	cc: RecipientItemDto[],
	bcc: RecipientItemDto[],
};

export type BodyState = {
	quote: string,
	quoteFolded: boolean,
};

export type AttachmentsState = {
	files: AttachmentFileDto[],
	folded: boolean,
};

export type ComposeLimitsState = {
	recipientsPerField: number,
	recipientsTotal: number,
	maxAttachmentsSize: number,
	maxAttachmentsSizeAfterEncoding: number,
};

export type CalendarSharingState = Required<CalendarSharingDto>;

export type LargeAttachmentState = Required<LargeAttachmentDto>;

export type SendState = {
	actionUrl: string,
	inReplyTo: string | null,
	mailboxId: number | null,
};

export type AnalyticsState = {
	section: string,
	element: AnalyticsElement | '',
};

export type PathsState = {
	messageList: string | null,
	home: string,
	templatesManage: string,
};

export type ComposeError = {
	message: string,
	/** Error code of the send contract, when the server named one. */
	code: string | null,
};

export type TemplateReference = {
	source: string,
	id: number,
};

export type TemplateListItem = {
	reference: TemplateReference,
	title: string,
	subject: string,
	canApply: boolean,
	disabledReason: string | null,
};

export type PreparedTemplate = {
	reference: TemplateReference,
	subject: string,
	bodyHtml: string,
};

export type TemplateAutoApplyStatus = 'idle' | 'pending' | 'applied' | 'skipped' | 'failed';

export type TemplatesState = {
	recent: TemplateListItem[],
	isLoaded: boolean,
	isLoading: boolean,
	error: string | null,
	selected: TemplateListItem | null,
	prepared: PreparedTemplate | null,
	rememberLast: boolean,
	autoApply: {
		candidate: TemplateReference | null,
		status: TemplateAutoApplyStatus,
	},
};

/** One reactive object for the whole form, provided by `ComposeForm` and read via `useComposeState()`. */
export type ComposeState = {
	scenario: ComposeScenario,
	title: string,
	messageId: number,
	parentMessageId: number | null,

	mailbox: ComposeMailboxState,
	senders: SenderDto[],
	selectedSender: string | null,

	recipients: RecipientsState,
	/** The row of `bcc` is shown once it carries an address or the user opens it; `cc` is always shown. */
	bccExpanded: boolean,

	subject: string,

	signatures: SignaturesState,
	selectedSignatureId: number | null,

	body: BodyState,
	attachments: AttachmentsState,

	limits: ComposeLimitsState,
	calendarSharing: CalendarSharingState,
	copilot: CopilotDto,
	largeAttachment: LargeAttachmentState,
	attachmentReminder: {
		enabled: boolean,
	},
	send: SendState,
	analytics: AnalyticsState,
	features: {
		unfinishedElements: boolean,
		templates: boolean,
	},
	draft: {
		id: number,
		revision: number,
		clientId: string,
		isLoading: boolean,
		restoreFailed: boolean,
	},
	templates: TemplatesState,
	paths: PathsState,

	migrationActiveByMailboxId: Record<number, boolean>,
	isSending: boolean,
	errors: ComposeError[],
};
