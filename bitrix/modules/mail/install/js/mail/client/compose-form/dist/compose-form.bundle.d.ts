/* eslint-disable */
/** Options passed by the compose screen template: ids of the server-rendered markup and initial data. */
type ComposeFormOptions = {
	containerId: string;
	formId: string;
	editorFormId: string;
	editorId: string;
	initialData: ComposeInitialData;
};

/**
 * Built by `Bitrix\Mail\Service\Compose\ComposeFormDataProvider` and serialised into the compose template.
 * Every field is optional on purpose: `createComposeState()` fills in what a payload does not carry.
 */
type ComposeInitialData = {
	scenario?: ComposeScenario;
	title?: string;
	messageId?: number;
	/** The server answers the source message by it; the form reads what it derived, not the id itself. */
	parentMessageId?: number | null;
	mailbox?: {
		id?: number | null;
		email?: string;
	};
	senders?: SenderDto[];
	/** 'formated' value of the sender the form starts on. */
	selectedSender?: string | null;
	signatures?: SignaturesDto;
	recipients?: {
		to?: RecipientItemDto[];
		cc?: RecipientItemDto[];
		bcc?: RecipientItemDto[];
	};
	subject?: string;
	body?: {
		quote?: string;
		quoteFolded?: boolean;
	};
	attachments?: {
		files?: AttachmentFileDto[];
		folded?: boolean;
	};
	limits?: ComposeLimitsDto;
	calendarSharing?: CalendarSharingDto;
	copilot?: CopilotDto;
	largeAttachment?: LargeAttachmentDto;
	attachmentReminder?: {
		enabled?: boolean;
	};
	send?: SendDto;
	analytics?: AnalyticsDto;
	features?: {
		unfinishedElements?: boolean;
		templates?: boolean;
	};
	draft?: {
		id?: number;
		revision?: number;
		clientId?: string;
	};
	paths?: PathsDto;
};

type ComposeScenario = (typeof BX.Mail.Client.ComposeForm.Scenario)[keyof typeof BX.Mail.Client.ComposeForm.Scenario];

/**
 * Passed through as `Sender::prepareUserMailboxes()` returns it: the order is kept and nothing is
 * rewritten. Only the fields every sender kind carries are required, the rest belong to mailbox senders.
 */
type SenderDto = {
	id: number | string;
	name: string;
	email: string;
	formated: string;
	type: string;
	showEditHint?: boolean;
	can_delete?: boolean;
	mailboxId?: number | string;
	userId?: number | string;
	canEdit?: boolean;
	isOwner?: boolean;
	editHref?: string | null;
	avatar?: string | null;
	userUrl?: string | null;
};

type SignaturesDto = {
	/** Key is the 'formated' value of a sender, its bare address or an empty string. */
	bySender?: Record<string, SignatureItemDto[]>;
	/** Remembered choice of the user, "<signatureId>:<unixtime>", kept in the storage shape. */
	choices?: Record<string, string>;
	settingsPath?: string;
};

type SignatureItemDto = {
	full?: string;
	preview?: string;
	menuPreview?: string;
	signatureId?: number | string;
	isShared?: boolean;
	/** Timestamp of the latest assignment of a shared signature; personal ones have none. */
	assignedAt?: number | string | null;
};

/**
 * Item of the entity selector, sent back to the server as it came, so nothing is normalised here. Only the
 * identifying pair is named: the remaining values are not plain strings, `title` of a typed node arrives as
 * `{ text, type }` (`ui/lib/entityselector/textnode.php`).
 */
type RecipientItemDto = {
	id: number | string;
	entityId: string;
	[key: string]: unknown;
};

/**
 * Carries no address of the file: the cards of the attachments are drawn from the control of the Disk
 * uploader, and the id is what the template of the form mounts that control with.
 */
type AttachmentFileDto = {
	id: string;
	name: string;
	/** Size as the server formatted it for the card; `bytes` is the one to count with. */
	size: string;
	bytes: number;
};

type ComposeLimitsDto = {
	/** `-1` means the tariff sets no limit per field. */
	recipientsPerField?: number;
	/** Ceiling over all the recipient fields; the server owns it and the form repeats it for feedback. */
	recipientsTotal?: number;
	maxAttachmentsSize?: number;
	maxAttachmentsSizeAfterEncoding?: number;
};

type CalendarSharingDto = {
	available?: boolean;
	featureEnabled?: boolean;
	crmFeatureEnabled?: boolean;
	showTour?: boolean;
	/**
	 * Built by the server for its site; an empty value leaves the disabled-sharing popup without a link to
	 * the calendar.
	 */
	userCalendarPath?: string;
};

/** CoPilot parameters are passed to the editor as they come; only the switch itself is read. */
type CopilotDto = {
	isCopilotEnabled?: boolean;
	[key: string]: unknown;
};

type LargeAttachmentDto = {
	localFeatureAvailable?: boolean;
	featureAvailable?: boolean;
	showAha?: boolean;
	ahaOptionName?: string;
	postSendPromptSuppressed?: boolean;
	postSendPromptOptionName?: string;
	folderName?: string;
};

type SendDto = {
	actionUrl?: string;
	/** Both fields are filled for an answer alone. */
	inReplyTo?: string | null;
	mailboxId?: number | null;
};

type AnalyticsDto = {
	section?: string;
	element?: AnalyticsElement;
};

/** Entry point reported in the analytics event; the server validates the value. */
type AnalyticsElement = 'compose_button' | 'reply' | 'reply_all' | 'fast_reply' | 'forward';

type PathsDto = {
	/** `null` when the mailbox is undefined or the router passed no template: the form closes to `home`. */
	messageList?: string | null;
	home?: string;
	/**
	 * Section the templates are managed in. It belongs to CRM, so the server leaves it empty whenever
	 * the user cannot be led there, and the form then offers no entry.
	 */
	templatesManage?: string;
};

declare namespace BX.Mail.Client.ComposeForm {
	class ComposeForm {
		constructor(options: ComposeFormOptions);
		start(): void;
		destroy(): void;
	}

	/** The scenario comes from the server payload and is never derived on the client. */
	const Scenario: Readonly<{
		readonly New: "new";
		readonly Reply: "reply";
		readonly ReplyAll: "replyAll";
		readonly Forward: "forward";
	}>;
}
