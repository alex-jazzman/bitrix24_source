import { type RawFile, type RawMessage, type RawUser, type RawChat } from 'im.v2.provider.service.types';
import { type StatusGroupName } from 'imopenlines.v2.const';

export type RawSession = {
	chatId: number,
	id: number,
	operatorId: number,
	status: StatusGroupName,
	queueId: number,
	pinned: boolean,
	isClosed: boolean,
}

export type RawRecentItem = {
	chatId: number,
	dialogId: string,
	messageId: number,
	sessionId: number
}

export type RawQueue = {
	id: number,
	lineName: string,
	type: string,
	isActive: boolean,
}

export type RawCrmForm = {
	id: number,
	name: string,
	code: string,
	sec: string,
};

export type RecentRestResult = {
	users: RawUser[],
	chats: RawChat[],
	messages: RawMessage[],
	files: RawFile[],
	recentItems: RawRecentItem[],
	sessions: RawSession[],
	additionalMessages: RawMessage[],
}

export type RawOpenLinesMeta = {
	openlines: {
		connector: RawConnector,
		crm: RawCrm,
		currentSession: RawCurrentSession,
	},
};

export type RawConnector = {
	connectorId: string,
	lineId: number,
	connectorChatId: number,
	connectorUserId: number,
}

export type RawCrm = {
	crmEnabled: boolean,
	crmEntityType: string,
	crmEntityId: number,
	leadId: ?number,
	companyId: ?number,
	contactId: ?number,
	dealId: ?number,
}

export type RawCrmEntity = {
	id: number,
}

export type RawDialogCrm = {
	lead: ?RawCrmEntity,
	contact: ?RawCrmEntity,
	deal: ?RawCrmEntity,
	company: ?RawCrmEntity,
}

export type DialogCrmSaveResult = {
	dialogCrm: RawDialogCrm,
}

export type RawCurrentSession = {
	sessionId: number,
	pause: boolean,
	waitAction: boolean,
	blockDate: string,
	blockReason: string,
	silentMode: boolean,
	dateCreate: string,
	multidialog: boolean,
}

export type RawQuickReply = {
	id: number,
	name: string,
	text: string,
	sectionId: number,
	canEdit: boolean,
	rating: number,
};

export type RawQuickReplySection = {
	id: number,
	name: string,
	code: string,
};

export type QuickReplyLoadListParams = {
	lineId: number,
	search?: string,
	sectionId?: number,
	offset?: number,
	limit?: number,
};

export type QuickReplyPermissions = {
	canView: boolean,
	canCreate: boolean,
};

export type QuickReplyLoadListResult = {
	replies: RawQuickReply[],
	sections: RawQuickReplySection[],
	totalCount: number,
	manageUrl: string,
	permissions: QuickReplyPermissions,
};

export type QuickReplySaveParams = {
	lineId: number,
	id?: number,
	text: string,
	sectionId?: number,
};

export type QuickReplySaveFormData = {
	id?: number,
	text: string,
	sectionId: number,
};
