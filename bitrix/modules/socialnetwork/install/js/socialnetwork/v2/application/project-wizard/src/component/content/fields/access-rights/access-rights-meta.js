import { Loc } from 'main.core';

const fieldItemsBinary = [
	{
		id: 'Y',
		title: Loc.getMessage('SONET_EXT_PROJECT_WIZARD_ACCESS_RIGHT_PERMISSION_Y'),
	},
	{
		id: 'N',
		title: Loc.getMessage('SONET_EXT_PROJECT_WIZARD_ACCESS_RIGHT_PERMISSION_N'),
	},
];

const permissions = {
	A: {
		id: 'A',
		title: Loc.getMessage('SONET_EXT_PROJECT_WIZARD_ACCESS_RIGHT_PERMISSION_A'),
	},
	E: {
		id: 'E',
		title: Loc.getMessage('SONET_EXT_PROJECT_WIZARD_ACCESS_RIGHT_PERMISSION_E'),
	},
	K: {
		id: 'K',
		title: Loc.getMessage('SONET_EXT_PROJECT_WIZARD_ACCESS_RIGHT_PERMISSION_K'),
	},
	J: {
		id: 'J',
		title: Loc.getMessage('SONET_EXT_PROJECT_WIZARD_ACCESS_RIGHT_PERMISSION_J'),
	},
	L: {
		id: 'L',
		title: Loc.getMessage('SONET_EXT_PROJECT_WIZARD_ACCESS_RIGHT_PERMISSION_L'),
	},
};

const fieldItemsPermissionsRole = [
	permissions.A,
	permissions.E,
	permissions.K,
];

const fieldItemsPermissionsRoleFull = [
	permissions.A,
	permissions.E,
	permissions.K,
	permissions.J,
	permissions.L,
];

export const AccessRightsMeta = Object.freeze([
	{
		id: 'project',
		title: Loc.getMessage('SONET_EXT_PROJECT_WIZARD_ACCESS_RIGHTS_PROJECT_LABEL'),
		fields: [
			{
				id: 'whoCanInvite',
				label: Loc.getMessage('SONET_EXT_PROJECT_WIZARD_ACCESS_RIGHTS_WHO_CAN_INVITE_FIELD'),
				items: [...fieldItemsPermissionsRole],
			},
			{
				id: 'manageMessages',
				label: Loc.getMessage('SONET_EXT_PROJECT_WIZARD_ACCESS_RIGHTS_MANAGE_MESSAGES_FIELD'),
				items: [...fieldItemsPermissionsRole],
			},
			{
				id: 'showHistory',
				label: Loc.getMessage('SONET_EXT_PROJECT_WIZARD_ACCESS_RIGHTS_SHOW_HISTORY_FIELD'),
				items: [...fieldItemsBinary],
			},
			{
				id: 'allowGuestsInvitation',
				label: Loc.getMessage('SONET_EXT_PROJECT_WIZARD_ACCESS_RIGHTS_ALLOW_GUESTS_INVITATION_FIELD'),
				items: [...fieldItemsBinary],
			},
		],
	},
	{
		id: 'tasks',
		title: Loc.getMessage('SONET_EXT_PROJECT_WIZARD_ACCESS_RIGHTS_TASKS_LABEL'),
		fields: [
			{
				id: 'view',
				label: Loc.getMessage('SONET_EXT_PROJECT_WIZARD_ACCESS_RIGHTS_TASKS_VIEW_SELF_FIELD'),
				items: [...fieldItemsPermissionsRoleFull],
			},
			{
				id: 'view_all',
				label: Loc.getMessage('SONET_EXT_PROJECT_WIZARD_ACCESS_RIGHTS_TASKS_VIEW_FIELD'),
				items: [...fieldItemsPermissionsRoleFull],
			},
			{
				id: 'sort',
				label: Loc.getMessage('SONET_EXT_PROJECT_WIZARD_ACCESS_RIGHTS_TASKS_SORT_FIELD'),
				items: [...fieldItemsPermissionsRoleFull],
			},
			{
				id: 'createTasks',
				label: Loc.getMessage('SONET_EXT_PROJECT_WIZARD_ACCESS_RIGHTS_TASKS_CREATE_TASKS_FIELD'),
				items: [...fieldItemsPermissionsRoleFull],
			},
			{
				id: 'editTasks',
				label: Loc.getMessage('SONET_EXT_PROJECT_WIZARD_ACCESS_RIGHTS_TASKS_EDIT_TASKS_FIELD'),
				items: [...fieldItemsPermissionsRoleFull],
			},
			{
				id: 'deleteTasks',
				label: Loc.getMessage('SONET_EXT_PROJECT_WIZARD_ACCESS_RIGHTS_TASKS_DELETE_TASKS_FIELD'),
				items: [...fieldItemsPermissionsRoleFull],
			},
		],
	},
	{
		id: 'blog',
		title: Loc.getMessage('SONET_EXT_PROJECT_WIZARD_ACCESS_RIGHTS_BLOG_LABEL'),
		fields: [
			{
				id: 'view_post',
				label: Loc.getMessage('SONET_EXT_PROJECT_WIZARD_ACCESS_RIGHTS_BLOG_VIEW_FIELD'),
				items: [...fieldItemsPermissionsRoleFull],
			},
			{
				id: 'premoderate_post',
				label: Loc.getMessage('SONET_EXT_PROJECT_WIZARD_ACCESS_RIGHTS_BLOG_PRE_MODERATE_FIELD'),
				items: [...fieldItemsPermissionsRoleFull],
			},
			{
				id: 'write_post',
				label: Loc.getMessage('SONET_EXT_PROJECT_WIZARD_ACCESS_RIGHTS_BLOG_CREATE_FIELD'),
				items: [...fieldItemsPermissionsRoleFull],
			},
			{
				id: 'moderate_post',
				label: Loc.getMessage('SONET_EXT_PROJECT_WIZARD_ACCESS_RIGHTS_BLOG_MODERATE_FIELD'),
				items: [...fieldItemsPermissionsRoleFull],
			},
			{
				id: 'full_post',
				label: Loc.getMessage('SONET_EXT_PROJECT_WIZARD_ACCESS_RIGHTS_BLOG_EDIT_FIELD'),
				items: [...fieldItemsPermissionsRoleFull],
			},
			{
				id: 'view_comment',
				label: Loc.getMessage('SONET_EXT_PROJECT_WIZARD_ACCESS_RIGHTS_BLOG_VIEW_COMMENT_FIELD'),
				items: [...fieldItemsPermissionsRoleFull],
			},
			{
				id: 'premoderate_comment',
				label: Loc.getMessage('SONET_EXT_PROJECT_WIZARD_ACCESS_RIGHTS_BLOG_PRE_MODERATE_COMMENT_FIELD'),
				items: [...fieldItemsPermissionsRoleFull],
			},
			{
				id: 'write_comment',
				label: Loc.getMessage('SONET_EXT_PROJECT_WIZARD_ACCESS_RIGHTS_BLOG_CREATE_COMMENT_FIELD'),
				items: [...fieldItemsPermissionsRoleFull],
			},
			{
				id: 'moderate_comment',
				label: Loc.getMessage('SONET_EXT_PROJECT_WIZARD_ACCESS_RIGHTS_BLOG_MODERATE_COMMENT_FIELD'),
				items: [...fieldItemsPermissionsRoleFull],
			},
			{
				id: 'full_comment',
				label: Loc.getMessage('SONET_EXT_PROJECT_WIZARD_ACCESS_RIGHTS_BLOG_EDIT_COMMENT_FIELD'),
				items: [...fieldItemsPermissionsRoleFull],
			},
		],
	},
]);
