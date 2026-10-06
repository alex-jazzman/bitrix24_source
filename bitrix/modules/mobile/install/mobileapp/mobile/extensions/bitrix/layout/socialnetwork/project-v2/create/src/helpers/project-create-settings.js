/**
 * @module layout/socialnetwork/project-v2/create/src/helpers/project-create-settings
 */
jn.define('layout/socialnetwork/project-v2/create/src/helpers/project-create-settings', (require, exports, module) => {
	const { Loc } = require('loc');
	const { PermissionValueType, PermissionBooleanValueType } = require('layout/socialnetwork/permission-menu');
	const { ProjectCreateMode } = require('layout/socialnetwork/project-v2/create/src/enum/project-create-mode');
	const { ProjectType } = require('layout/socialnetwork/project-v2/create/src/enum/project-type');
	const { normalizeProjectSettings } = require('layout/socialnetwork/project-v2/create/src/helpers/settings-normalizer');
	const {
		normalizeAvatar,
		buildAvatarPayload,
	} = require('layout/socialnetwork/project-v2/create/src/helpers/project-avatar');
	const SETTING_FIELD_NAMES = [
		'name',
		'description',
		'avatar',
		'image',
		'ownerData',
		'moderatorsData',
		'participants',
		'type',
		'initiatePerms',
		'messageWriters',
		'showHistory',
		'taskViewPerms',
		'taskSortPerms',
		'taskCreatePerms',
		'taskEditPerms',
		'taskDeletePerms',
		'knowledgeViewPerms',
		'knowledgeEditPerms',
		'knowledgeSettingsPerms',
		'knowledgeDeletePerms',
		'dateStart',
		'dateFinish',
		'tags',
		'messagesAutoDeleteDelay',
		'isLegacyProject',
		'notifications',
	];

	const isValidNotificationCatalog = (catalog) => {
		return catalog !== null
			&& typeof catalog === 'object'
			&& !Array.isArray(catalog)
			&& Array.isArray(catalog.groups)
			&& catalog.groups.length > 0
			&& catalog.groups.every((group) => group && Array.isArray(group.types));
	};

	const normalizeNotificationCatalog = (catalog) => {
		if (!isValidNotificationCatalog(catalog))
		{
			return null;
		}

		const groups = catalog.groups
			.map((group) => ({
				id: String(group.id ?? ''),
				label: String(group.label ?? ''),
				types: group.types
					.filter((type) => type && type.id)
					.map((type) => ({
						id: String(type.id),
						label: String(type.label ?? ''),
						counterEnabled: type.counterEnabled === true,
					})),
			}))
			.filter((group) => group.id && group.types.length > 0);

		return groups.length > 0 ? { groups } : null;
	};

	const buildNotificationsPayload = (catalog) => {
		const normalizedCatalog = normalizeNotificationCatalog(catalog);
		if (!normalizedCatalog)
		{
			return null;
		}

		const types = normalizedCatalog.groups.flatMap((group) => group.types)
			.map((type) => ({
				id: type.id,
				counterEnabled: type.counterEnabled,
			}));

		return types.length > 0 ? { types } : null;
	};

	const normalizeSettings = (settings = {}) => {
		const normalizedSettings = normalizeProjectSettings(settings);

		return {
			...normalizedSettings,
			avatar: normalizeAvatar(normalizedSettings.avatar, normalizedSettings.image),
			notifications: normalizeNotificationCatalog(normalizedSettings.notifications),
		};
	};

	const getDefaultSettings = (userId = 0) => ({
		name: '',
		description: '',
		avatar: normalizeAvatar(),
		ownerData: {
			id: userId,
			title: '',
			imageUrl: '',
		},
		moderatorsData: [],
		participants: {
			user: [],
			department: [],
		},
		type: ProjectType.PUBLIC.getValue(),
		initiatePerms: PermissionValueType.ALL,
		dateStart: 0,
		dateFinish: 0,
		tags: [],
		messageWriters: PermissionValueType.ALL,
		showHistory: PermissionBooleanValueType.TRUE,
		taskViewPerms: PermissionValueType.ALL,
		taskSortPerms: PermissionValueType.ALL,
		taskCreatePerms: PermissionValueType.ALL,
		taskEditPerms: PermissionValueType.ALL,
		taskDeletePerms: PermissionValueType.ALL,
		knowledgeViewPerms: PermissionValueType.ALL,
		knowledgeEditPerms: PermissionValueType.ALL,
		knowledgeSettingsPerms: PermissionValueType.ALL,
		knowledgeDeletePerms: PermissionValueType.ALL,
		messagesAutoDeleteDelay: 0,
		autoDeleteEnabledInPortalSettings: false,
		isLegacyProject: false,
		notifications: null,
	});

	const getNormalizedSettings = (settings = {}, userId = 0) => normalizeSettings({
		...getDefaultSettings(userId),
		...settings,
	});

	const extractSettings = (props = {}) => {
		return SETTING_FIELD_NAMES.reduce((settings, fieldName) => {
			const value = props[fieldName];
			if (value !== undefined && value !== null)
			{
				settings[fieldName] = value;
			}

			return settings;
		}, {});
	};

	const buildProjectPayload = (fields, isEditMode = false) => {
		const tags = Array.isArray(fields.tags) ? fields.tags : [];
		const notifications = buildNotificationsPayload(fields.notifications);
		const payload = {
			name: fields.name,
			description: fields.description,
			avatar: buildAvatarPayload(fields.avatar, fields.image, isEditMode),
			type: fields.type,
			initiatePerms: fields.initiatePerms,
			dateStart: fields.dateStart ? new Date(fields.dateStart * 1000).toISOString() : null,
			dateFinish: fields.dateFinish ? new Date(fields.dateFinish * 1000).toISOString() : null,
			tags,
			ownerId: Number(fields.ownerData?.id ?? 0),
			moderatorIds: (fields.moderatorsData ?? []).map((item) => Number(item.id)),
			participantUserIds: (fields.participants?.user ?? []).map((item) => Number(item.id)),
			participantDepartmentIds: (fields.participants?.department ?? []).map((item) => Number(item.id)),
			messageWriters: fields.messageWriters ?? PermissionValueType.ALL,
			showHistory: fields.showHistory ?? PermissionBooleanValueType.TRUE,
			messagesAutoDeleteDelay: fields.messagesAutoDeleteDelay ?? 0,
			taskPermissions: {
				viewAll: fields.taskViewPerms ?? PermissionValueType.ALL,
				sort: fields.taskSortPerms ?? PermissionValueType.ALL,
				createTasks: fields.taskCreatePerms ?? PermissionValueType.ALL,
				editTasks: fields.taskEditPerms ?? PermissionValueType.ALL,
				deleteTasks: fields.taskDeletePerms ?? PermissionValueType.ALL,
			},
			knowledgePermissions: {
				read: fields.knowledgeViewPerms ?? PermissionValueType.ALL,
				edit: fields.knowledgeEditPerms ?? PermissionValueType.ALL,
				settings: fields.knowledgeSettingsPerms ?? PermissionValueType.ALL,
				delete: fields.knowledgeDeletePerms ?? PermissionValueType.ALL,
			},
		};

		if (notifications)
		{
			payload.notifications = notifications;
		}

		return payload;
	};

	const getSubmitErrorMessage = (response, mode = ProjectCreateMode.CREATE) => {
		const message = response?.errors?.[0]?.message
			?? response?.error?.description
			?? response?.answer?.error_description
			?? response?.data?.errorMessage;

		if (message)
		{
			return message;
		}

		return Loc.getMessage(
			ProjectCreateMode.EDIT.equal(mode)
				? 'MOBILE_LAYOUT_PROJECT_V2_CREATE_SAVE_ERROR'
				: 'MOBILE_LAYOUT_PROJECT_V2_CREATE_ERROR',
		);
	};

	const getCreatedProjectId = (response) => Number(response?.data?.projectId ?? 0);

	const getCreatedProjectChatId = (response) => Number(response?.data?.chatId ?? 0);

	module.exports = {
		extractSettings,
		normalizeSettings,
		getDefaultSettings,
		getNormalizedSettings,
		buildProjectPayload,
		buildNotificationsPayload,
		isValidNotificationCatalog,
		normalizeNotificationCatalog,
		getSubmitErrorMessage,
		getCreatedProjectId,
		getCreatedProjectChatId,
	};
});
