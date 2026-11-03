import { type InjectionKey } from 'ui.vue3';

/** Which of the two lists of the screen a grid draws. Each list is an application of its own. */
export const GridMode = Object.freeze({
	Message: 'message',
	Draft: 'draft',
} as const);

export type GridModeValue = (typeof GridMode)[keyof typeof GridMode];

/**
 * Service marks the end-to-end scenarios hold on to, named `{entity}-{component}-{element}`. The
 * marks of the legacy grid are a contract of their own and are reproduced letter for letter; the
 * names below belong to what the new grid brings of its own.
 */
export const TestId = Object.freeze({
	Root: 'mail-grid-root',
	DraftRoot: 'mail-draft-grid-root',
	Table: 'mail-grid-table',
	RowCheckbox: 'mail-grid-row-checkbox',
	RowActions: 'mail-grid-row-actions',
	CheckAll: 'mail-grid-check-all',
	MoreButton: 'mail-grid-more-button',
	PageError: 'mail-grid-page-error',
	SyncLoader: 'mail-grid-sync-loader',
	EmptyRow: 'mail-grid-empty-row',
	EmptyStub: 'mail-grid-empty-stub',
	TariffStub: 'mail-grid-tariff-stub',
	TariffButton: 'mail-grid-tariff-button',
	/** The window of the words the screen handed the grid to pass on. */
	ScreenNotice: 'mail-grid-notice',
	ScreenNoticeItem: 'mail-grid-notice-item',
	/** The row of a letter that is being sent and can still be called back. */
	ProjectionRow: 'mail-grid-projection-row',
	/** The two links a row of the drafts opens its draft by; the legacy row carries a mark on neither. */
	DraftRecipientsLink: 'mail-draft-list-recipients-link',
	DraftSubjectLink: 'mail-draft-list-subject-link',

	// Inherited names. Renaming one of them breaks the scenarios of the screen, not the interface.
	DraftEmpty: 'mail-draft-list-empty',
	UnseenDot: 'mail-list-unseen-dot',
	FavoriteButton: 'mail-list-favorite-btn',
	SenderLink: 'mail-list-sender-link',
	SubjectLink: 'mail-list-subject-link',
	AttachIcon: 'mail-list-attach-icon',
	Attachments: 'mail-list-attachments',
	AttachmentChip: 'mail-list-attachment-chip',
	AttachmentChipLoading: 'mail-list-attachment-chip-loading',
	AttachmentChipOpen: 'mail-list-attachment-chip-open',
	AttachmentChipType: 'mail-list-attachment-chip-type',
	AttachmentChipDownload: 'mail-list-attachment-chip-download',
	AttachmentsStack: 'mail-list-attachments-stack',
	AttachmentsMenu: 'mail-list-attachments-menu',
	AttachmentsMenuStatus: 'mail-list-attachments-menu-status',
	AttachmentsMenuList: 'mail-list-attachments-menu-list',
	AttachmentsMenuItemView: 'mail-list-attachments-menu-item-view',
	AttachmentsMenuItemIcon: 'mail-list-attachments-menu-item-icon',
	AttachmentsMenuItemDownload: 'mail-list-attachments-menu-item-download',
	AttachmentsMenuArchive: 'mail-list-attachments-menu-archive',
	AttachmentsMenuArchiveStatus: 'mail-list-attachments-menu-archive-status',
} as const);

/** The mark of one row of the list of drafts, plus the identifier of the draft (`class.php:1073`). */
export const DraftRowTestIdPrefix = 'mail-draft-list-item-';

/**
 * Roles the delegated listeners of the screen and of this extension find their nodes by, inherited
 * from the old grid letter for letter.
 */
export const DataRole = Object.freeze({
	/** The wrapper the template of the screen draws around the grid on both paths. */
	GridContainer: 'mail-msg-list-grid',
	Favorite: 'mail-list-favorite',
	AttachmentChip: 'mail-list-attachment-chip',
	AttachmentsStack: 'mail-list-attachments-stack',
} as const);

/** Phrases the row draws itself now that the server sends it text instead of markup. */
export const Phrase = Object.freeze({
	ColumnFavorite: 'MAIL_CLIENT_MESSAGE_GRID_COLUMN_FAVORITE',
	ColumnFrom: 'MAIL_CLIENT_MESSAGE_GRID_COLUMN_FROM',
	ColumnSubject: 'MAIL_CLIENT_MESSAGE_GRID_COLUMN_SUBJECT',
	ColumnDate: 'MAIL_CLIENT_MESSAGE_GRID_COLUMN_DATE',
	ColumnCrmBind: 'MAIL_CLIENT_MESSAGE_GRID_COLUMN_CRM_BIND',
	ColumnTaskBind: 'MAIL_CLIENT_MESSAGE_GRID_COLUMN_TASK_BIND',
	ColumnChatBind: 'MAIL_CLIENT_MESSAGE_GRID_COLUMN_CHAT_BIND',
	ColumnPostBind: 'MAIL_CLIENT_MESSAGE_GRID_COLUMN_POST_BIND',
	ColumnMeetingBind: 'MAIL_CLIENT_MESSAGE_GRID_COLUMN_MEETING_BIND',

	/** Stands between the names the cell of the sender lists. */
	AddressSeparator: 'MAIL_CLIENT_MESSAGE_GRID_ADDRESS_SEPARATOR',
	RowSelect: 'MAIL_CLIENT_MESSAGE_GRID_ROW_SELECT',
	RowActions: 'MAIL_CLIENT_MESSAGE_GRID_ROW_ACTIONS',
	DraftSelect: 'MAIL_CLIENT_MESSAGE_GRID_DRAFT_SELECT',
	DraftActions: 'MAIL_CLIENT_MESSAGE_GRID_DRAFT_ACTIONS',
	/** Stands in the cell of the recipients of a draft that names none. */
	DraftNoRecipients: 'MAIL_CLIENT_MESSAGE_GRID_DRAFT_NO_RECIPIENTS',
	UnseenDotLabel: 'MAIL_CLIENT_MESSAGE_GRID_UNSEEN_DOT_LABEL',
	FavoriteLabel: 'MAIL_CLIENT_MESSAGE_GRID_FAVORITE_LABEL',
	FavoriteAdded: 'MAIL_CLIENT_MESSAGE_GRID_FAVORITE_ADDED',
	FavoriteRemoved: 'MAIL_CLIENT_MESSAGE_GRID_FAVORITE_REMOVED',
	FavoriteError: 'MAIL_CLIENT_MESSAGE_GRID_FAVORITE_ERROR',
	/** Said out loud when the list of the section of the favorites has been drawn. */
	FavoritesShown: 'MAIL_CLIENT_MESSAGE_GRID_FAVORITES_SHOWN',
	FavoritesEmpty: 'MAIL_CLIENT_MESSAGE_GRID_FAVORITES_EMPTY',

	More: 'MAIL_CLIENT_MESSAGE_GRID_MORE',
	MoreLoading: 'MAIL_CLIENT_MESSAGE_GRID_MORE_LOADING',
	PageError: 'MAIL_CLIENT_MESSAGE_GRID_PAGE_ERROR',
	PageLimit: 'MAIL_CLIENT_MESSAGE_GRID_PAGE_LIMIT',

	NoData: 'MAIL_CLIENT_MESSAGE_GRID_NO_DATA',
	NoDataFiltered: 'MAIL_CLIENT_MESSAGE_GRID_NO_DATA_FILTERED',
	DraftEmpty: 'MAIL_CLIENT_MESSAGE_GRID_DRAFT_EMPTY',
	EmptyTitle: 'MAIL_CLIENT_MESSAGE_GRID_EMPTY_TITLE',
	EmptyTextFirst: 'MAIL_CLIENT_MESSAGE_GRID_EMPTY_TEXT_1',
	EmptyTextSecond: 'MAIL_CLIENT_MESSAGE_GRID_EMPTY_TEXT_2',
	TariffTitle: 'MAIL_CLIENT_MESSAGE_GRID_TARIFF_TITLE',
	TariffTextFirst: 'MAIL_CLIENT_MESSAGE_GRID_TARIFF_TEXT_1',
	TariffTextSecond: 'MAIL_CLIENT_MESSAGE_GRID_TARIFF_TEXT_2',
	TariffButton: 'MAIL_CLIENT_MESSAGE_GRID_TARIFF_BUTTON',
	SyncLoaderLabel: 'MAIL_CLIENT_MESSAGE_GRID_SYNC_LOADER_LABEL',

	AttachIconHint: 'MAIL_CLIENT_MESSAGE_GRID_ATTACH_ICON_HINT',
	AttachmentLoading: 'MAIL_CLIENT_MESSAGE_GRID_ATTACHMENT_LOADING',
	AttachmentsMore: 'MAIL_CLIENT_MESSAGE_GRID_ATTACHMENTS_MORE',
	/** Extends the visible text of the "+N" chip instead of replacing it. */
	AttachmentsMoreLabel: 'MAIL_CLIENT_MESSAGE_GRID_ATTACHMENTS_MORE_LABEL',
	AttachmentsDownload: 'MAIL_CLIENT_MESSAGE_GRID_ATTACHMENTS_DOWNLOAD',
	AttachmentsDownloadFile: 'MAIL_CLIENT_MESSAGE_GRID_ATTACHMENTS_DOWNLOAD_FILE',
	AttachmentsListLoading: 'MAIL_CLIENT_MESSAGE_GRID_ATTACHMENTS_LIST_LOADING',
	AttachmentsListEmpty: 'MAIL_CLIENT_MESSAGE_GRID_ATTACHMENTS_LIST_EMPTY',
	AttachmentsListError: 'MAIL_CLIENT_MESSAGE_GRID_ATTACHMENTS_LIST_ERROR',
	ArchiveDownload: 'MAIL_CLIENT_MESSAGE_GRID_ARCHIVE_DOWNLOAD',
	ArchivePreparing: 'MAIL_CLIENT_MESSAGE_GRID_ARCHIVE_PREPARING',
	ArchiveError: 'MAIL_CLIENT_MESSAGE_GRID_ARCHIVE_ERROR',
} as const);

/** Columns of the screen, by the identifiers the head, the cells and the bindings name them with. */
export const GridColumn = Object.freeze({
	Favorite: 'FAVORITE',
	From: 'FROM',
	Subject: 'SUBJECT',
	Date: 'DATE',
	CrmBind: 'CRM_BIND',
	TaskBind: 'TASK_BIND',
	ChatBind: 'CHAT_BIND',
	PostBind: 'POST_BIND',
	MeetingBind: 'MEETING_BIND',
} as const);

export type GridColumnId = (typeof GridColumn)[keyof typeof GridColumn];

/**
 * Head of one column. The class is what the widths of the screen are written against; the name is
 * drawn for the star alone, and even there the screen clips it.
 */
export type ColumnHead = {
	id: GridColumnId,
	headClass: string,
	phrase: string,
	showName: boolean,
};

/**
 * Handed down by the application rather than resolved: two grids share the screen, and a component
 * that reached for a global one would page the wrong list.
 */
export type GridPaging = {
	loadNextPage(): Promise<void>,
};

export const gridPagingKey: InjectionKey<GridPaging> = Symbol('mailMessageGridPaging');

/**
 * Handed down by the application rather than resolved: a row that asked for a global one would mark
 * a message in the other list.
 */
export type GridSelection = {
	toggleRow(rowId: string): void,
};

export const gridSelectionKey: InjectionKey<GridSelection> = Symbol('mailMessageGridSelection');

/**
 * Names the screen and the neighbouring extensions listen to the grid by. Inherited letter for letter:
 * every one of them has a listener outside this extension today.
 */
export const GridEvent = Object.freeze({
	Updated: 'Grid::updated',
	ThereSelectedRows: 'Grid::thereSelectedRows',
	NoSelectedRows: 'Grid::noSelectedRows',
	AllRowsSelected: 'Grid::allRowsSelected',
	AllRowsUnselected: 'Grid::allRowsUnselected',
	/** The one point the selection is dropped through, and a public contract of the screen. */
	ResetSelection: 'Mail::resetGridSelection',
	DirectoryChanged: 'Mail::directoryChanged',
	UndoSendCancelled: 'Mail.UndoSend:onCancelled',
	/** Said once the server has stored a star; the screen counts the favorites of its left menu by it. */
	FavoritesChanged: 'BX.Mail.Favorites:onChange',
	FilterApplied: 'BX.Main.Filter:apply',
	PanelHidden: 'BX.UI.ActionPanel:hidePanel',
} as const);

/**
 * The mark the screen finds the checkbox of "select all" of a grid by
 * (`user-interface-manager.js:145`, `list.es6.js:290`). The checkbox belongs to the panel rather
 * than to the table, and the screen looks for it by this attribute alone.
 */
export const CheckAllAttribute = 'data-mail-grid-check-all';

/**
 * The name the menu of a row is registered under, plus the identifier of the row. Inherited: the
 * screen catches that popup by `menu-popup-` plus this name (`user-interface-manager.js:101`).
 */
export const RowActionsMenuIdPrefix = 'main-grid-actions-menu-';

/**
 * The name the screen publishes its list manager under (`ScreenContext::LIST_MANAGER_ID`). The
 * descriptions of the actions of a row arrive as calls into that object, so the grid only asks.
 */
export const ScreenListManagerPath = 'BX.Mail.Client.Message.List.mail-client-list-manager';

/**
 * The identifier the action of moving to a folder is built from; the row adds its own to it
 * (`GridActionsCatalog.php:105`). The submenu of that one item is the only one the client fills.
 */
export const MoveActionIdPrefix = ':move:';

/**
 * The name the screen gives the row of a letter it is sending (`list.es6.js:263`). The word about a
 * send called off carries the number of the operation alone, and the page of the list builds the
 * name the same way (`UndoSendProjectionBuilder.php`) - which is what makes one send one row.
 */
export const UndoSendRowIdPrefix = 'undo-send-';

/** The mark on the cell of the subject of that row, plus the number of the send (`class.php:1142`). */
export const UndoSendPendingRowTestIdPrefix = 'mail-undo-send-pending-row-';

/**
 * A word the screen asks the grid to pass on before anything else - today the error of an action
 * that came back with the request (`class.php:511`), in the keys the platform grid took it in.
 */
export type GridMessage = {
	TYPE: string,
	TITLE?: string,
	TEXT?: string,
};

/** Which of the two kinds of placeholder of the bindings a cell carries. */
export const BindingKind = Object.freeze({
	Binding: 'binding',
	Action: 'action',
} as const);

/**
 * Three states rather than a flag: a summary still on its way and a summary without a single live
 * file are different answers.
 */
export const AttachmentsView = Object.freeze({
	/** The message carries no files at all. */
	None: 'none',
	/** The paperclip alone: the improvements are off, or the summary came back with nothing live. */
	Paperclip: 'paperclip',
	/** The message carries files and the summary of them has not arrived yet. */
	Loading: 'loading',
	Chips: 'chips',
} as const);

export type AttachmentsViewValue = (typeof AttachmentsView)[keyof typeof AttachmentsView];

/**
 * What the screen hands the grid to lead the panel of mass actions with. The folder of spam comes
 * with the descriptions because the pair of spam buttons is chosen by the folder rather than by the
 * rows.
 */
export type GridPanel = {
	containerId: string,
	groupActions: unknown,
	spamDir: string,
};

/**
 * What a page of the list is asked for by. The screen resolves the values once and hands them over;
 * `mail.api.messagelist.*` takes the same set for every page after the first one.
 */
export type GridScreen = {
	gridId: string,
	filterId: string,
	mailboxId: number,
	/** Filled in the all mail mode only. */
	virtual?: string | null,
	/** Filled when the screen stands on a section of its own rather than on a folder. */
	listSection?: string | null,
};
