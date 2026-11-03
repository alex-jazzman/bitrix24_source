import {
	UserRole,
	ChatActionGroup,
	type FolderTypeItem,
	type ChatTypeItem,
	type ParentChatIdType,
	type RecentTypeItem,
	type SystemFolderCodeItem,
} from 'im.v2.const';

type ActionGroupItem = $Keys<typeof ChatActionGroup>;
type RoleItem = $Keys<typeof UserRole>;

export type Chat = {
	dialogId: string,
	chatId: number,
	type: ChatTypeItem,
	name: string,
	description: string,
	avatar: string,
	color: string,
	extranet: boolean,
	containsCollaber: boolean,
	userCounter: number,
	guestCount: number,
	lastReadId: number,
	markedId: number,
	lastMessageId: number,
	lastMessageViews: {
		countOfViewers: number,
		firstViewer?: {
			userId: number,
			userName: string,
			date: Date
		},
		messageId: number
	},
	savedPositionMessageId: number,
	managerList: number[],
	isMuted: boolean,
	quoteId: number,
	ownerId: number,
	entityLink: {
		id: string,
		type: string,
		url: string,
	},
	dateCreate: Date | null,
	public: {
		code: string,
		link: string
	},
	inited: boolean,
	loading: boolean,
	hasPrevPage: boolean,
	hasNextPage: boolean,
	isHistoryLimitExceeded: boolean,
	diskFolderId: number,
	role: RoleItem,
	permissions: Object<ActionGroupItem, RoleItem>,
	// Phase 0 (task 718250): superadmin project chat access
	hasManageCapability: boolean,
	tariffRestrictions: {
		isHistoryLimitExceeded: boolean,
	},
	parentChatId: number,
	backgroundId: string,
	isTextareaEnabled: boolean,
};

export type CollabInfo = {
	collabId: number,
	guestCount: number,
	entities: {
		tasks: CollabEntityInfo,
		files: CollabEntityInfo,
		calendar: CollabEntityInfo,
	};
};

export type CollabEntityInfo = {
	counter: number,
	url: string,
};

export type FolderChat = {
	chatId: number,
	dialogId: string,
};

// What the folder is made of. A folder carries the part that fits its kind: a section, a chat list or
// the codes of the folders it unites. parentChatId is the nesting frame of the section:
// 0 - root chats only, null - every nesting level.
export type FolderDefinition = {
	recentSection?: RecentTypeItem,
	chats?: FolderChat[],
	sourceFolders?: SystemFolderCodeItem[],
	parentChatId?: ParentChatIdType,
};

export type Folder = {
	id: number,
	sort: number,
	type: FolderTypeItem,
	title: string,
	displaysNestedInRoot: boolean,
	visible?: boolean,
	description?: string,
	definition: FolderDefinition,
	code?: SystemFolderCodeItem,
};
