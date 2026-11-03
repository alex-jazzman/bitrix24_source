import { type GridModeValue, type GridScreen } from '../../const';
import { type RowHrefTemplateName, type RowHrefTemplates } from '../../lib/row-href/row-href';

/** The address of a message in the keys `BX.UI.SidePanel.PageSwapper` of the message slider reads. */
export type PageSwapperHref = {
	ID: number,
	HREF: string,
};

/** Which of the three kinds the server chose for the sender. */
export type SenderAvatarFallback = {
	kind: 'image' | 'initials' | 'default',
	size: number,
	/** Already resized by the server; only the image kind carries it. */
	src?: string,
	color?: string,
	initials?: string,
};

export type SenderAvatar = SenderAvatarFallback & {
	protected?: true,
	cacheIdentity?: string,
	fallback?: SenderAvatarFallback,
};

/** An address the parser could not read stays plain text and keeps `valid: false`. */
export type SenderAddress = {
	text: string,
	title: string,
	valid: boolean,
};

export type RowSender = {
	addresses: SenderAddress[],
	avatar: SenderAvatar,
};

export type MessageDate = {
	short: string,
	title: string,
	timestamp: number,
};

/** A draft compares its date with nothing, so it travels without the stamp behind it. */
export type DraftDate = {
	short: string,
	title: string,
};

export type AttachmentIcon = {
	name: string,
	/** Formatted by the server for the chip; nothing here counts bytes. */
	size: string,
	url: string | null,
	viewerAttrs: Record<string, unknown> | null,
	icon: string,
};

/** `null` while the summary is not ready, `count: 0` once it is and no live file is left. */
export type AttachmentsSummary = {
	count: number,
	icons: AttachmentIcon[],
} | null;

/**
 * Values of one placeholder of the bindings, hung on the node as attributes and never redrawn: the
 * subtree belongs to `mail.client.binding`. A `null` value is not written at all - that extension
 * tells a missing attribute from an empty one.
 *
 * Neither address is a value of the transport: both are built as the page is read into the state,
 * out of the templates the screen gave once (`row-href.ts`). The CRM is the one exception - the
 * address of its entity is no setting of the screen and comes ready.
 */
export type RowBinding = {
	column: string,
	kind: 'binding' | 'action',
	type: string | null,
	actionId: string | null,
	bindId: string | null,
	bindHref: string | null,
	/** What a new task or post out of this message is opened with; no other kind offers one. */
	createParams: Record<string, unknown> | null,
	createHref: string | null,
	errorType: string | null,
};

export type MessageRowHref = {
	/**
	 * Built as the page is read into the state, out of the template of the screen and the identifier
	 * of the row (`message-href.ts`): the transport gives this record with `sliderData` alone.
	 */
	url: string,
	sliderData: Record<string, unknown>,
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
export type RowAction = {
	id: string,
	hrefTemplate?: RowHrefTemplateName,
	hrefParams?: Record<string, unknown>,
	icon?: string,
	text?: string,
	title?: string,
	html?: string,
	className?: string,
	onclick?: string,
	href?: string,
	items?: RowAction[],
	gridRowId?: string,
	dataset?: Record<string, unknown>,
	additionalClassForPanel?: string,
	hideInActionPanel?: boolean,
	hiddenInPanel?: boolean,
	disabled?: boolean,
};

/** Row of the list of messages, as the server answers with it. */
export type MessageRow = {
	/** Composite key of the row, `{uidId}-{mailboxId}`. */
	id: string,
	messageId: number,
	mailboxId: number,
	dirMd5: string,
	unseen: boolean,
	/** An old message may not be marked unread again. */
	isOld: boolean,
	isNew: boolean,
	isSpam: boolean,
	isFavorite: boolean,
	/** False in spam and in the bin, where the star has no place. */
	favoriteAvailable: boolean,
	sender: RowSender,
	subject: string,
	date: MessageDate,
	attachments: AttachmentsSummary,
	hasAttachments: boolean,
	bindings: RowBinding[],
	href: MessageRowHref,
	actions: RowAction[],
};

/** Row of the list of drafts, as the server answers with it. */
export type DraftRow = {
	/** `draft-{draftId}` */
	id: string,
	draftId: number,
	recipients: {
		names: string[],
		isEmpty: boolean,
	},
	subject: string,
	preview: string,
	hasAttachments: boolean,
	date: DraftDate,
	actions: RowAction[],
};

export type GridRow = MessageRow | DraftRow;

/**
 * A letter that is being sent and can still be called back, standing in front of the loaded rows.
 *
 * The record reaches the grid two ways - with the page of the list, out of
 * `b_mail_scheduled_message`, and from the screen the moment the letter leaves the compose form
 * (`list.es6.js:214`). Both fill the same fields, so the row draws one kind of record rather than two.
 */
export type ProjectionRow = {
	/** `undo-send-{operationId}`, built the same way on both sides so one send makes one row. */
	id: string,
	operationId: number,
	/** Everybody the letter goes to, already in one line, or the word standing for none of them. */
	sender: string,
	subject: string,
	/** That the letter is on its way, in the words of whoever handed the record over. */
	status: string,
	date: DraftDate,
	/**
	 * When the screen is to ask for the list again, in milliseconds. The screen reads it off the drawn
	 * row and plans nothing without it (`list.es6.js:328`).
	 */
	refreshAt: number,
};

/**
 * A page of either list, in the one shape both entry points give it: the screen ships the first page
 * with its markup, `mail.api.messagelist.*` answers with every page after it. `hrefIds` belongs to
 * the messages alone and `total` to the drafts alone.
 */
export type GridPagePayload = {
	rows: GridRow[],
	enableNextPage: boolean,
	page: number,
	/**
	 * Letters follow this page and the list has no page left to reach them with. Absent from the first
	 * page, which is never at the ceiling.
	 */
	pageLimitReached?: boolean,
	/**
	 * The messages of the page in the order the slider of a message walks them, one element longer than
	 * the rows while a next page is left. Identifiers rather than addresses: the address is the
	 * template of the screen filled in with one of them.
	 */
	hrefIds?: number[],
	total?: number,
	/**
	 * The list is narrowed by something the reader chose rather than by the folder they walked into.
	 * Read anew on every page: applying a filter and dropping it both reload the list without
	 * reloading the screen. Absent from the page of the drafts, which says its own word about an
	 * empty list.
	 */
	filterApplied?: boolean,
	/**
	 * The letters being sent: they belong to the messages alone and to their first page alone, since
	 * they stand in front of the whole list rather than inside the page that carries them.
	 */
	projections?: ProjectionRow[],
};

/**
 * One folder of the submenu "move to folder", in the shape the screen builds it (`class.php:2449`).
 * One tree serves every row of a mailbox, so it travels with the screen rather than with a row.
 * Carried over untouched, the values of its dataset included: the screen reads them both from the
 * options of the item and from its node.
 */
export type FolderMenuItem = {
	id: string,
	/** The name of the folder comes as markup, built by the server with its escaping. */
	html?: string,
	text?: string,
	disabled?: boolean,
	onclick?: string,
	dataset?: Record<string, unknown>,
	items?: FolderMenuItem[],
};

/** Everything one grid holds between pages. */
export type GridState = {
	mode: GridModeValue,
	/** `null` until the screen seeds it; nothing may be asked of the server before that. */
	screen: GridScreen | null,
	/** Empty in the all mail mode and in the list of drafts, where the action has no place. */
	folders: FolderMenuItem[],
	rows: GridRow[],
	/**
	 * The letters being sent. The page is the source of truth about them as it is about the messages:
	 * a page that brings none leaves none.
	 */
	projections: ProjectionRow[],
	/** Identifiers of the marked rows; a row that is not in the list is not marked. */
	selectedIds: string[],
	/**
	 * Rows the screen has acted on and is waiting for the server about: they are drawn and not shown
	 * until the answer arrives as a reload of the table.
	 */
	hiddenIds: string[],
	/**
	 * "Select all" holds: a page loaded after it is marked too, and the mark survives a reload.
	 * Dropped by the reset of the selection, by a change of folder and by any single row.
	 */
	stickyAll: boolean,
	/** What was marked before the table was reloaded; rows that came back keep their mark. */
	restoreIds: string[],
	page: number,
	enableNextPage: boolean,
	hrefIds: number[],
	/** What the empty table says: the word of an empty folder, or the word of a search that found none. */
	filterApplied: boolean,
	/**
	 * The template the addresses of the rows are built out of, given once by the screen. Empty in a
	 * grid that draws the drafts, where no row opens a message.
	 */
	messageHrefTemplate: string,
	/**
	 * The templates the addresses outside the mail section are built out of, given once by the screen
	 * for the same reason (`row-href.ts`).
	 */
	hrefTemplates: RowHrefTemplates,
	/** Known for the drafts only; `null` says the list does not count itself. */
	total: number | null,
	/** A page after the first one is on its way; the button of the list says so and asks for nothing more. */
	loadingPage: boolean,
	/** The last page asked for came back with an error and the list offers another try. */
	pageFailed: boolean,
	/**
	 * The failure was the plan rather than the network: the mailbox may not be fetched at all.
	 * Meaningless while `pageFailed` is off.
	 */
	pageSyncBlocked: boolean,
	/**
	 * The list ends at the ceiling of its pages with letters left behind it. Unlike the two flags
	 * above this one does not wait on `pageFailed`: the page says so itself, and so does a refusal of
	 * a page asked for past the ceiling. The ordinary end of a folder is not this and says nothing.
	 */
	pageLimitReached: boolean,
	/**
	 * The screen asked for the list again while a page was on its way. A flag rather than a queue:
	 * several asks answer one and the same list.
	 */
	reloadPending: boolean,
	/** The screen opened on a first synchronization and the list stands behind a loader for now. */
	syncing: boolean,
	/**
	 * Mailboxes the screen says are being moved right now. Their rows refuse every action that would
	 * change a message on the server: the move owns the mailbox until it is done.
	 */
	migrationLockedMailboxIds: number[],
	/**
	 * The rows are dimmed and answer nothing. Taken off by the reload the screen answers itself with,
	 * and by any page written over the dimmed rows.
	 */
	faded: boolean,
	/**
	 * The screen offered the grid its own stub of an empty list. The old grid took that offer only on
	 * a first synchronization (`template.php:1383`, `messagegrid.js:153`), so outside that branch an
	 * empty folder keeps the plain empty row of the platform.
	 */
	stubArmed: boolean,
};
