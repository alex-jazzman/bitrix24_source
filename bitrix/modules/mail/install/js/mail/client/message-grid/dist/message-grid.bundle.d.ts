/* eslint-disable */
/** Everything the screen gives one grid: where to mount, which list it draws and its first page. */
type MessageGridOptions = {
	containerId: string;
	mode: GridModeValue;
	screen: GridScreen;
	/** The first page comes with the markup of the screen, so the list draws without a request. */
	page: GridPagePayload;
	/**
	 * Where a row of this grid opens a message, with the identifier left to fill in
	 * (`message-href.ts`). Only the page of the mail section knows the address, so it is said here
	 * and never asked of the server again.
	 */
	messageHrefTemplate?: string;
	/**
	 * Where a row of this grid leads outside the mail section - the task, the post and the event
	 * (`row-href.ts`). Said here for the same reason and never asked of the server again.
	 */
	hrefTemplates?: Partial<RowHrefTemplates>;
	/** Words the screen asks the grid to pass on once, before anything else. */
	messages?: GridMessage[];
	/**
	 * Folder tree of the submenu "move to folder": the transport carries the action with an empty
	 * submenu on purpose, since one tree serves every row of a mailbox.
	 */
	folders?: FolderMenuItem[];
	/** What the panel of mass actions of this grid is built of; without it the grid leads none. */
	panel?: GridPanel;
};

type GridModeValue = (typeof BX.Mail.Client.MessageGrid.GridMode)[keyof typeof BX.Mail.Client.MessageGrid.GridMode];

/**
 * What a page of the list is asked for by. The screen resolves the values once and hands them over;
 * `mail.api.messagelist.*` takes the same set for every page after the first one.
 */
type GridScreen = {
	gridId: string;
	filterId: string;
	mailboxId: number;
	/** Filled in the all mail mode only. */
	virtual?: string | null;
	/** Filled when the screen stands on a section of its own rather than on a folder. */
	listSection?: string | null;
};

/**
 * A page of either list, in the one shape both entry points give it: the screen ships the first page
 * with its markup, `mail.api.messagelist.*` answers with every page after it. `hrefIds` belongs to
 * the messages alone and `total` to the drafts alone.
 */
type GridPagePayload = {
	rows: GridRow[];
	enableNextPage: boolean;
	page: number;
	/**
	 * Letters follow this page and the list has no page left to reach them with. Absent from the first
	 * page, which is never at the ceiling.
	 */
	pageLimitReached?: boolean;
	/**
	 * The messages of the page in the order the slider of a message walks them, one element longer than
	 * the rows while a next page is left. Identifiers rather than addresses: the address is the
	 * template of the screen filled in with one of them.
	 */
	hrefIds?: number[];
	total?: number;
	/**
	 * The list is narrowed by something the reader chose rather than by the folder they walked into.
	 * Read anew on every page: applying a filter and dropping it both reload the list without
	 * reloading the screen. Absent from the page of the drafts, which says its own word about an
	 * empty list.
	 */
	filterApplied?: boolean;
	/**
	 * The letters being sent: they belong to the messages alone and to their first page alone, since
	 * they stand in front of the whole list rather than inside the page that carries them.
	 */
	projections?: ProjectionRow[];
};

type GridRow = MessageRow | DraftRow;

/** Row of the list of messages, as the server answers with it. */
type MessageRow = {
	/** Composite key of the row, `{uidId}-{mailboxId}`. */
	id: string;
	messageId: number;
	mailboxId: number;
	dirMd5: string;
	unseen: boolean;
	/** An old message may not be marked unread again. */
	isOld: boolean;
	isNew: boolean;
	isSpam: boolean;
	isFavorite: boolean;
	/** False in spam and in the bin, where the star has no place. */
	favoriteAvailable: boolean;
	sender: RowSender;
	subject: string;
	date: MessageDate;
	attachments: AttachmentsSummary;
	hasAttachments: boolean;
	bindings: RowBinding[];
	href: MessageRowHref;
	actions: RowAction[];
};

type RowSender = {
	addresses: SenderAddress[];
	avatar: SenderAvatar;
};

/** An address the parser could not read stays plain text and keeps `valid: false`. */
type SenderAddress = {
	text: string;
	title: string;
	valid: boolean;
};

type SenderAvatar = SenderAvatarFallback & {
	protected?: true;
	cacheIdentity?: string;
	fallback?: SenderAvatarFallback;
};

/** Which of the three kinds the server chose for the sender. */
type SenderAvatarFallback = {
	kind: 'image' | 'initials' | 'default';
	size: number;
	/** Already resized by the server; only the image kind carries it. */
	src?: string;
	color?: string;
	initials?: string;
};

type MessageDate = {
	short: string;
	title: string;
	timestamp: number;
};

/** `null` while the summary is not ready, `count: 0` once it is and no live file is left. */
type AttachmentsSummary = {
	count: number;
	icons: AttachmentIcon[];
} | null;

type AttachmentIcon = {
	name: string;
	/** Formatted by the server for the chip; nothing here counts bytes. */
	size: string;
	url: string | null;
	viewerAttrs: Record<string, unknown> | null;
	icon: string;
};

/**
 * Values of one placeholder of the bindings, hung on the node as attributes and never redrawn: the
 * subtree belongs to `mail.client.binding`. A `null` value is not written at all - that extension
 * tells a missing attribute from an empty one.
 *
 * Neither address is a value of the transport: both are built as the page is read into the state,
 * out of the templates the screen gave once (`row-href.ts`). The CRM is the one exception - the
 * address of its entity is no setting of the screen and comes ready.
 */
type RowBinding = {
	column: string;
	kind: 'binding' | 'action';
	type: string | null;
	actionId: string | null;
	bindId: string | null;
	bindHref: string | null;
	/** What a new task or post out of this message is opened with; no other kind offers one. */
	createParams: Record<string, unknown> | null;
	createHref: string | null;
	errorType: string | null;
};

type MessageRowHref = {
	/**
	 * Built as the page is read into the state, out of the template of the screen and the identifier
	 * of the row (`message-href.ts`): the transport gives this record with `sliderData` alone.
	 */
	url: string;
	sliderData: Record<string, unknown>;
};

/**
 * An item of the menu of a row, carried over exactly as the screen gives it - the handler strings
 * and their escaping included. Only the identifier is on every item.
 *
 * The two items that lead outside the mail section are the exception: their address is a setting of
 * the page of the screen, so the page names a template and the parameters of the row and `href` is
 * written as the page is read into the state (`row-href.ts`). The handler of such an item reads the
 * address back off the node at the moment of the press.
 */
type RowAction = {
	id: string;
	hrefTemplate?: RowHrefTemplateName;
	hrefParams?: Record<string, unknown>;
	icon?: string;
	text?: string;
	title?: string;
	html?: string;
	className?: string;
	onclick?: string;
	href?: string;
	items?: RowAction[];
	gridRowId?: string;
	dataset?: Record<string, unknown>;
	additionalClassForPanel?: string;
	hideInActionPanel?: boolean;
	hiddenInPanel?: boolean;
	disabled?: boolean;
};

type RowHrefTemplateName = typeof BX.Mail.Client.MessageGrid.RowHrefTemplate[keyof typeof BX.Mail.Client.MessageGrid.RowHrefTemplate];

/** Row of the list of drafts, as the server answers with it. */
type DraftRow = {
	/** `draft-{draftId}` */
	id: string;
	draftId: number;
	recipients: {
		names: string[];
		isEmpty: boolean;
	};
	subject: string;
	preview: string;
	hasAttachments: boolean;
	date: DraftDate;
	actions: RowAction[];
};

/** A draft compares its date with nothing, so it travels without the stamp behind it. */
type DraftDate = {
	short: string;
	title: string;
};

/**
 * A letter that is being sent and can still be called back, standing in front of the loaded rows.
 *
 * The record reaches the grid two ways - with the page of the list, out of
 * `b_mail_scheduled_message`, and from the screen the moment the letter leaves the compose form
 * (`list.es6.js:214`). Both fill the same fields, so the row draws one kind of record rather than two.
 */
type ProjectionRow = {
	/** `undo-send-{operationId}`, built the same way on both sides so one send makes one row. */
	id: string;
	operationId: number;
	/** Everybody the letter goes to, already in one line, or the word standing for none of them. */
	sender: string;
	subject: string;
	/** That the letter is on its way, in the words of whoever handed the record over. */
	status: string;
	date: DraftDate;
	/**
	 * When the screen is to ask for the list again, in milliseconds. The screen reads it off the drawn
	 * row and plans nothing without it (`list.es6.js:328`).
	 */
	refreshAt: number;
};

type RowHrefTemplates = Record<RowHrefTemplateName, string>;

/**
 * A word the screen asks the grid to pass on before anything else - today the error of an action
 * that came back with the request (`class.php:511`), in the keys the platform grid took it in.
 */
type GridMessage = {
	TYPE: string;
	TITLE?: string;
	TEXT?: string;
};

/**
 * One folder of the submenu "move to folder", in the shape the screen builds it (`class.php:2449`).
 * One tree serves every row of a mailbox, so it travels with the screen rather than with a row.
 * Carried over untouched, the values of its dataset included: the screen reads them both from the
 * options of the item and from its node.
 */
type FolderMenuItem = {
	id: string;
	/** The name of the folder comes as markup, built by the server with its escaping. */
	html?: string;
	text?: string;
	disabled?: boolean;
	onclick?: string;
	dataset?: Record<string, unknown>;
	items?: FolderMenuItem[];
};

/**
 * What the screen hands the grid to lead the panel of mass actions with. The folder of spam comes
 * with the descriptions because the pair of spam buttons is chosen by the folder rather than by the
 * rows.
 */
type GridPanel = {
	containerId: string;
	groupActions: unknown;
	spamDir: string;
};

declare namespace BX.Mail.Client.MessageGrid {
	class MessageGrid {
		constructor(options: MessageGridOptions);
		start(): void;
	}

	/** Which of the two lists of the screen a grid draws. Each list is an application of its own. */
	const GridMode: Readonly<{
		readonly Message: "message";
		readonly Draft: "draft";
	}>;

	const RowHrefTemplate: Readonly<{
		readonly TaskCreate: "taskCreate";
		readonly TaskView: "taskView";
		readonly PostCreate: "postCreate";
		readonly PostView: "postView";
		readonly CalendarEvent: "calendarEvent";
	}>;
}
