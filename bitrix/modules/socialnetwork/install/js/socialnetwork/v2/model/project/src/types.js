import { type IPrivacyType } from 'socialnetwork.v2.const';

export type NotificationType = {
	id: string;
	label: string;
	counterEnabled: boolean;
}

export type NotificationGroup = {
	id: string;
	label: string;
	types: NotificationType[];
}

export type NotificationCatalog = {
	groups: NotificationGroup[];
}

export type ProjectFeatures = {
	tasks: boolean,
	chat: boolean,
	calendar: boolean,
	files: boolean,
	landingKnowledge: boolean,
	blog: boolean,
	forum: boolean,
	photo: boolean,
	search: boolean,
	marketplace: boolean,
	groupLists: boolean,
	wiki: boolean,
}

export type ProjectModel = {
	id?: number | null;
	avatar?: ProjectAvatar | null;
	goal: string;
	title: string;
	description: string;
	ownerId: number | null;
	chatId: number | null;
	members: ProjectMember[];
	moderators: ProjectMember[];
	privacyType: IPrivacyType;
	tags: string[];
	publication: boolean;
	dates: ProjectDates | null;
	features: ProjectFeatures;
	baseFeatureId: string;
	availableFeatures: ProjectFeature[];
	toggleableFeatures: string[];
	defaultPermissions: ProjectPermissions | null;
	permissions: ProjectPermissions;
	notifications: NotificationCatalog | null;
	notificationsInitial: NotificationCatalog | null;
}

type ProjectAvatar = {
	id?: number;
	url?: string;
	fileEncoded?: string;
}

export type ProjectCopyData = {
	sourceProjectId: number,
	project: ProjectModel,
	copyOptions: any,
}

export type ProjectDates = {
	startTs: number;
	finishTs: number;
}

export type ProjectMember = {
	id: number;
	type: string;
	withChildNodes: boolean | null;
}

export type ProjectPermissions = {
	project: ProjectProjectPermissions;
	tasks: ProjectTasksPermissions;
	blog: ProjectBlogPermissions;
	landingKnowledge: LandingKnowledgePermissions;
}

export type ProjectProjectPermissions = {
	whoCanInvite: PermissionTypeRole;
	manageMessages: PermissionTypeRole;
	manageMessagesAutoDelete: PermissionTypeRole;
	messagesAutoDeleteDelay: number | '';
	showHistory: PermissionTypeBinary;
	canGuestCopyText: PermissionTypeBinary;
	canGuestScreenshot: PermissionTypeBinary;
	allowGuestsInvitation: PermissionTypeBinary;
}

export type ProjectTasksPermissions = {
	view: PermissionTypeRoleExtended;
	view_all: PermissionTypeRoleExtended;
	sort: PermissionTypeRoleExtended;
	createTasks: PermissionTypeRoleExtended;
	editTasks: PermissionTypeRoleExtended;
	deleteTasks: PermissionTypeRoleExtended;
}

export type ProjectBlogPermissions = {
	view_post: PermissionTypeRoleExtended;
	premoderate_post: PermissionTypeRoleExtended;
	write_post: PermissionTypeRoleExtended;
	moderate_post: PermissionTypeRoleExtended;
	full_post: PermissionTypeRoleExtended;
	view_comment: PermissionTypeRoleExtended;
	premoderate_comment: PermissionTypeRoleExtended;
	write_comment: PermissionTypeRoleExtended;
	moderate_comment: PermissionTypeRoleExtended;
	full_comment: PermissionTypeRoleExtended;
}

export type LandingKnowledgePermissions = {
	read: PermissionTypeRoleExtended;
	edit: PermissionTypeRoleExtended;
	sett: PermissionTypeRoleExtended;
	delete: PermissionTypeRoleExtended;
}

export type PermissionTypeBinary = 'Y' | 'N';

export type PermissionTypeRole = 'A' | 'E' | 'K';

export type PermissionTypeRoleExtended = PermissionTypeRole | 'J' | 'L';

export type ProjectFeature = {
	id: string,
	name: string,
	customName: string,
	url: string,
	urlTemplate: string,
}
