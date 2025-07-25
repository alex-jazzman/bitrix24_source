import { DialogId } from "../../../types/common";
import { MessengerModel, PayloadData } from "../../base";

export enum DialogType {
	user = 'user',
	chat = 'chat',
	open = 'open',
	general = 'general',
	videoconf = 'videoconf',
	announcement = 'announcement',
	call = 'call',
	support24Notifier = 'support24Notifier',
	support24Question = 'support24Question',
	crm = 'crm',
	sonetGroup = 'sonetGroup',
	calendar = 'calendar',
	tasks = 'tasks',
	thread = 'thread',
	mail = 'mail',
	copilot = 'copilot',
	channel = 'channel',
	openChannel = 'openChannel',
	comment = 'comment',
	generalChannel = 'generalChannel',
	collab = 'collab',
}

export type DialoguesModelState = {
	dialogId: DialogId,
	chatId: number,
	type: DialogType,
	name: string,
	description: string,
	avatar: string,
	color: string,
	extranet: boolean,
	counter: number,
	userCounter: number,
	participants: Array<any>,
	lastLoadParticipantId: number,
	lastReadId: number,
	markedId: number,
	lastMessageId: number,
	lastMessageViews: LastMessageViews,
	savedPositionMessageId: number,
	managerList: Array<any>, //todo concrete type
	readList: Array<any>, // FIXME remove this field from model and table
	inputActions: Array<InputActionNotify>,
	muteList: Array<any>, //todo concrete type
	textareaMessage: string,
	quoteId: number,
	owner: number,
	entityType: string,
	entityId: string,
	dateCreate: Date | null,
	public: {
		code: string,
		link: string
	},
	inited: boolean,
	loading: boolean,
	hasPrevPage: boolean,
	hasNextPage: boolean,
	diskFolderId: number,
	tariffRestrictions: TariffRestrictions,
	role: string,
	permissions: DialogPermissions,
	aiProvider: string,
	parentChatId: number,
	parentMessageId: number,
	messageCount: number,
	messagesAutoDeleteDelay: number,
	textFieldEnabled: boolean,
	backgroundId: string,
	recentConfig: {
		chatId: number,
		sections: Array<string>,
	} | null,
	containsCollaber: boolean,
};

export type LastMessageViews = {
	lastMessageViews: {
		countOfViewers: number,
		firstViewer: {
			date: string
			userId: number
			userName: string
		} | null,
		messageId: number,
	}
	isGroupDialog?: boolean,
}

export type InputActionNotify = {
	userId: number
	userFirstName: string
	actions: InputActionNotifyType[]
}

export type InputActionNotifyType = 'writing' | 'recordingVoice' | 'sendingPhoto' | 'sendingFile'

export type DialogPermissions = {
	manageUsersAdd: PermissionRoles,
	manageUsersDelete: PermissionRoles,
	manageUi: PermissionRoles,
	manageSettings: PermissionRoles,
	manageMessages: PermissionRoles,
}

export type TariffRestrictions = {
	isHistoryLimitExceeded: boolean,
}

declare type PermissionRoles = 'guest' | 'member' | 'manager' | 'owner' | 'none';

declare type DialoguesModelCollection = {
	collection: Record<DialogId, DialoguesModelState>,
};

export type DialoguesMessengerModel = MessengerModel<DialoguesModelCollection>;


export type DialoguesModelActions =
	'dialoguesModel/setState'
	| 'dialoguesModel/set'
	| 'dialoguesModel/setFromLocalDatabase'
	| 'dialoguesModel/setCollectionFromLocalDatabase'
	| 'dialoguesModel/setFromPush'
	| 'dialoguesModel/add'
	| 'dialoguesModel/update'
	| 'dialoguesModel/delete'
	| 'dialoguesModel/deleteFromModel'
	| 'dialoguesModel/setInputAction'
	| 'dialoguesModel/removeInputAction'
	| 'dialoguesModel/decreaseCounter'
	| 'dialoguesModel/updateUserCounter'
	| 'dialoguesModel/updateManagerList'
	| 'dialoguesModel/updatePermissions'
	| 'dialoguesModel/updateType'
	| 'dialoguesModel/updateTariffRestrictions'
	| 'dialoguesModel/clearLastMessageViews'
	| 'dialoguesModel/incrementLastMessageViews'
	| 'dialoguesModel/setLastMessageViews'
	| 'dialoguesModel/clearAllCounters'
	| 'dialoguesModel/addParticipants'
	| 'dialoguesModel/removeParticipants'
	| 'dialoguesModel/unmute'
	| 'dialoguesModel/mute'

export type DialoguesModelMutation =
	'dialoguesModel/add'
	| 'dialoguesModel/setFromPush'
	| 'dialoguesModel/update'
	| 'dialoguesModel/delete'
	| 'dialoguesModel/clearAllCounters'


export type DialoguesSetStateActions = 'setState';

export interface DialoguesSetStateData extends PayloadData {
	collection: Record<DialogId, DialoguesModelState>,
}

export type DialoguesAddActions =
	'set'
	| 'add'
	| 'addCollection'
	;

export interface DialoguesAddData extends PayloadData {
	dialogId: DialogId;
	fields: DialoguesModelState;
}

export type DialoguesUpdateActions =
	'set'
	| 'update'
	| 'updateCollection'
	| 'updateType'
	| 'updateTariffRestrictions'
	| 'updateInputAction'
	| 'decreaseCounter'
	| 'updateUserCounter'
	| 'mute'
	| 'unmute'
	| 'addParticipants'
	| 'removeParticipants'
	| 'clearLastMessageViews'
	| 'incrementLastMessageViews'
	| 'setLastMessageViews'
	| 'clearAllCounters'
	;

export interface DialoguesUpdateData extends PayloadData {
	dialogId: DialogId,
	fields: Partial<DialoguesModelState>,
}

export interface DialoguesUpdateCollectionData extends PayloadData {
	updateItems: Array<DialogPayloadDataItem>
}

export interface DialoguesAddCollectionData extends PayloadData {
	addItems: Array<DialogPayloadDataItem>
}

export type DialoguesDeleteActions = 'delete' | 'deleteFromModel';

export interface DialoguesDeleteData extends PayloadData {
	dialogId: DialogId,
}

export interface DialogPayloadDataItem {
	dialogId: DialogId,
	fields: Partial<DialoguesModelState>,
}

export interface DialogUpdateTariffRestrictionsPayload {
	dialogId: DialogId,
	tariffRestrictions: TariffRestrictions,
	isForceUpdate?: boolean,
}


export type DialoguesSetFromPushActions = 'setFromPush';
export interface DialoguesSetFromPushData extends PayloadData
{
	dialogList: Array<DialoguesModelState>,
}

export interface DialogPayloadDataItem
{
	dialogId: DialogId,
	fields: Partial<DialoguesModelState>,
}

export type DialoguesClearAllCountersActions = 'clearAllCounters';

export interface DialoguesClearAllCountersData
{
	affectedDialogs: Array<DialogId>,
}

