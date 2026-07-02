/**
 * @module layout/socialnetwork/project-v2/create
 */
jn.define('layout/socialnetwork/project-v2/create', (require, exports, module) => {
	const { checkFeatureFlag, FeatureFlagType } = require('feature-flag');
	const { ProjectCreateMode } = require('layout/socialnetwork/project-v2/create/src/enum/project-create-mode');
	const { ProjectCreateCreateManager } = require('layout/socialnetwork/project-v2/create/src/manager/project-create-create-manager');
	const { ProjectCreateEditManager } = require('layout/socialnetwork/project-v2/create/src/manager/project-create-edit-manager');

	/**
	 * All `props` fields are optional.
	 * Manager resolves missing values from defaults or loads them from backend.
	 *
	 * @typedef {'A' | 'E' | 'K'} ProjectPermissionValue
	 */

	/**
	 * @typedef {'Y' | 'N'} ProjectBooleanPermissionValue
	 */

	/**
	 * @typedef {'public' | 'private'} ProjectTypeValue
	 */

	/**
	 * @typedef {'create' | 'edit'} ProjectCreateModeValue
	 */

	/**
	 * @typedef {'intro' | 'editing'} ProjectCreateStageValue
	 */

	/**
	 * @typedef {'unchanged' | 'upload' | 'remove'} ProjectAvatarModeValue
	 */

	/**
	 * @typedef {0 | 1 | 24 | 168 | 720} ProjectMessagesAutoDeleteDelay
	 */

	/**
	 * @typedef {Object} ProjectCreateImage
	 * @property {number | null} [id]
	 * @property {string | null} [previewUrl]
	 * @property {string | null} [base64]
	 */

	/**
	 * @typedef {Object} ProjectCreateAvatar
	 * @property {ProjectAvatarModeValue} [mode]
	 * @property {number | null} [id]
	 * @property {string | null} [previewUrl]
	 * @property {string | null} [base64]
	 */

	/**
	 * @typedef {Object} ProjectCreateUserItem
	 * @property {number} id
	 * @property {string} title
	 * @property {string} [imageUrl]
	 */

	/**
	 * @typedef {Object} ProjectCreateDepartmentItem
	 * @property {number} id
	 * @property {string} title
	 */

	/**
	 * @typedef {Object} ProjectCreateParticipants
	 * @property {ProjectCreateUserItem[]} user
	 * @property {ProjectCreateDepartmentItem[]} department
	 */

	/**
	 * @typedef {Object} ProjectCreateSettings
	 * @property {string} [name]
	 * @property {string} [description]
	 * @property {ProjectCreateAvatar} [avatar]
	 * @property {ProjectCreateImage} [image]
	 * @property {ProjectCreateUserItem} [ownerData]
	 * @property {ProjectCreateUserItem[]} [moderatorsData]
	 * @property {ProjectCreateParticipants} [participants]
	 * @property {ProjectTypeValue} [type]
	 * @property {ProjectPermissionValue} [initiatePerms]
	 * @property {ProjectPermissionValue} [messageWriters]
	 * @property {ProjectBooleanPermissionValue} [showHistory]
	 * @property {ProjectPermissionValue} [taskViewPerms]
	 * @property {ProjectPermissionValue} [taskSortPerms]
	 * @property {ProjectPermissionValue} [taskCreatePerms]
	 * @property {ProjectPermissionValue} [taskEditPerms]
	 * @property {ProjectPermissionValue} [taskDeletePerms]
	 * @property {ProjectPermissionValue} [knowledgeViewPerms]
	 * @property {ProjectPermissionValue} [knowledgeEditPerms]
	 * @property {ProjectPermissionValue} [knowledgeSettingsPerms]
	 * @property {ProjectPermissionValue} [knowledgeDeletePerms]
	 * @property {number} [dateStart]
	 * @property {number} [dateFinish]
	 * @property {string[]} [tags]
	 * @property {ProjectMessagesAutoDeleteDelay} [messagesAutoDeleteDelay]
	 * @property {boolean} [autoDeleteEnabledInPortalSettings]
	 */

	/**
	 * @typedef {Object} ProjectCreateOpenProps
	 * @property {ProjectCreateModeValue} [mode]
	 * @property {ProjectCreateStageValue} [stage]
	 * @property {number} [userId]
	 * @property {number} [projectId] Project id for edit mode.
	 * @property {boolean} [settingsLoaded]
	 * @property {ProjectCreateSettings} [settings]
	 * @property {(response: Object) => void} [onCreate]
	 * @property {(response: Object) => void} [onUpdate]
	 * @property {*} [rootLayoutWidget]
	 */

	const ProjectCreateManager = {
		/**
		 * @param {ProjectCreateOpenProps} [props={}]
		 * @param {*} [parentWidget=PageManager]
		 * @returns {*}
		 */
		async open(props = {}, parentWidget = PageManager)
		{
			if (!ProjectCreateMode.EDIT.equal(props.mode))
			{
				let isProjectsV2Enabled = false;

				try
				{
					isProjectsV2Enabled = await checkFeatureFlag(FeatureFlagType.PROJECTS_V2);
				}
				catch (error)
				{
					console.error(error);
				}

				if (!isProjectsV2Enabled)
				{
					return window.ProjectCreateManager.open(props, parentWidget);
				}
			}

			const Manager = ProjectCreateMode.EDIT.equal(props.mode)
				? ProjectCreateEditManager
				: ProjectCreateCreateManager;

			return Manager.open(props, parentWidget);
		},
	};

	module.exports = {
		ProjectCreateManager,
		ProjectCreateMode,
		openProjectCreate: ProjectCreateManager.open,
	};
});
