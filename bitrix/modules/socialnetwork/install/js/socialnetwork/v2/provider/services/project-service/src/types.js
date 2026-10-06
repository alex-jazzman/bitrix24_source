export type ProjectNotificationTypeDto = {
	id: string,
	counterEnabled: boolean,
}

export type ProjectNotificationGroupDto = {
	id: string,
	label: string,
	types: ProjectNotificationTypeDto[],
}

export type ProjectNotificationCatalogDto = {
	groups: ProjectNotificationGroupDto[],
}

export type ProjectNotificationPayloadDto = {
	types: ProjectNotificationTypeDto[],
}

export type ProjectDto = {
	id: number,
	avatar?: {
		id?: number,
		url?: string,
		encodedFile?: string,
	},
	archived: boolean,
	chatId: number,
	dates: {
		startTs: number,
		finishTs: number,
	} | null,
	description: string,
	features?: ProjectFeaturesDto | null,
	baseFeatureId?: string,
	availableFeatures?: ProjectFeatureDto[] | null,
	toggleableFeatures?: string[] | null,
	goal: string;
	hasCollabers: boolean,
	name: string,
	numberOfMembers?: number | null,
	members: UserEntityType[],
	moderatorMembers: UserEntityType[],
	notificationCatalog?: ProjectNotificationCatalogDto | null,   // вход: каталог из чтения проекта (DTO-01)
	notifications?: ProjectNotificationPayloadDto | null,          // выход: payload настройки в create/update (DTO-02)
	options?: {
		whoCanInvite: string,
		manageMessages: string,
		manageMessagesAutoDelete: string,
		messagesAutoDeleteDelay: string,
		showHistory: string,
		canGuestCopyText: string,
		canGuestScreenshot: string,
		allowGuestsInvitation: string,
	},
	ownerId: number,
	permissions: ProjectPermissionItemDto[],
	privacyType: 'open' | 'closed',
	publication?: boolean | null,
	tags: string[],
	updatedTs?: number | null,
}

export type ProjectFeaturesDto = {
	tasks?: boolean;
	chat?: boolean;
	calendar?: boolean;
	files?: boolean;
	'landing_knowledge'?: boolean;
	blog?: boolean;
	forum?: boolean;
	photo?: boolean;
	search?: boolean;
	marketplace?: boolean;
	'group_lists'?: boolean;
	wiki?: boolean;
}

export type ProjectFeatureDto = {
	id: string,
	name: string,
	customName: string,
	url: string,
	urlTemplate: string,
}

export type ProjectPermissionsTasksValuesDto = {
	create_tasks: string;
	delete_tasks: string;
	edit_tasks: string;
	sort: string;
	view_all: string;
	view: string;
}

export type ProjectPermissionsBlogValuesDto = {
	view_post: string;
	premoderate_post: string;
	write_post: string;
	moderate_post: string;
	full_post: string;
	view_comment: string;
	premoderate_comment: string;
	write_comment: string;
	moderate_comment: string;
	full_comment: string;
}

export type ProjectPermissionsLandingKnowledgeValuesDto = {
	read: string;
	edit: string;
	sett: string;
	delete: string;
}

export type ProjectPermissionItemDto =
	| { feature: "calendar" | "chat" | "files" | "marketplace", permissions: [] }
	| { feature: "landing_knowledge", permissions: ProjectPermissionsLandingKnowledgeValuesDto }
	| { feature: "tasks", permissions: ProjectPermissionsTasksValuesDto }
	| { feature: "blog", permissions: ProjectPermissionsBlogValuesDto }
;

type UserEntityType = {
	id?: number;
	type?: string;
	withChildNodes?: boolean;
	name?: string;
	image?: null;
}
