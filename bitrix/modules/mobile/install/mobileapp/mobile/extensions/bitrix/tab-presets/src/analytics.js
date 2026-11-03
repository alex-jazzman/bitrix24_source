/**
 * @module tab-presets/src/analytics
 */
jn.define('tab-presets/src/analytics', (require, exports, module) => {
	const { AnalyticsEvent } = require('analytics');

	/** @type {Record<string, PresetBottomMenuAnalyticsEventValue>} */
	const PresetBottomMenuAnalyticsEvent = {
		OPEN_SECTION: 'open_section',
		ADD_PRESET: 'add_preset',
		SAVE_PRESET: 'save_preset',
		ASSIGN_PRESET: 'assign_preset',
		UNASSIGN_PRESET: 'unassign_preset',
		DELETE_PRESET: 'delete_preset',
		SET_DEFAULT_PRESET: 'set_default_preset',
		EDIT_PRESET: 'edit_preset',
		CHANGE_PRESET: 'change_preset',
	};

	/** @type {Record<string, PresetBottomMenuAnalyticsTypeValue>} */
	const PresetBottomMenuAnalyticsType = {
		BUILTIN: 'builtin',
		PORTAL_DEFAULT: 'portal_default',
		CUSTOM_EMPLOYEE: 'custom_employee',
		CUSTOM_MANAGER: 'custom_manager',
	};

	/** @type {Record<string, PresetBottomMenuAnalyticsRoleValue>} */
	const PresetBottomMenuAnalyticsRole = {
		ADMIN: 'admin',
		MANAGER: 'manager',
		EMPLOYEE: 'employee',
	};

	/** @type {Record<string, PresetBottomMenuAnalyticsTargetValue>} */
	const PresetBottomMenuAnalyticsTarget = {
		NONE: 'target_none',
		SELF: 'target_self',
		USERS: 'target_users',
		DEPARTMENTS: 'target_departments',
		MIXED: 'target_mixed',
	};

	const PresetBottomMenuAnalytics = {
		/**
		 * @param {PresetBottomMenuAnalyticsParams} params
		 * @return {void}
		 */
		send: ({
			event,
			type = '',
			role = '',
			target = '',
			cSection = '',
			cElement = '',
		}) => {
			const analyticsData = PresetBottomMenuAnalytics.buildData({
				event,
				type,
				role,
				target,
				cSection,
				cElement,
			});

			if (!analyticsData)
			{
				return;
			}

			new AnalyticsEvent(analyticsData).send();
		},

		/**
		 * @param {PresetBottomMenuAnalyticsParams} params
		 * @return {PresetBottomMenuAnalyticsData|null}
		 */
		buildData: ({
			event,
			type = '',
			role = '',
			target = '',
			cSection = '',
			cElement = '',
		}) => {
			if (!event)
			{
				return null;
			}

			const analyticsData = {
				tool: 'intranet',
				category: 'preset_bottom_menu',
				event,
				c_section: cSection || PresetBottomMenuAnalytics.getDefaultSection(event),
				c_element: cElement || PresetBottomMenuAnalytics.getDefaultElement(event),
			};

			if (type)
			{
				analyticsData.type = type;
			}

			const userRole = PresetBottomMenuAnalytics.getUserRoleParam(role);
			if (userRole)
			{
				analyticsData.p1 = userRole;
			}

			if (target)
			{
				analyticsData.p2 = target;
			}

			return analyticsData;
		},

		/**
		 * @param {PresetBottomMenuAnalyticsEventValue} event
		 * @return {string}
		 */
		getDefaultSection: (event) => {
			return event === PresetBottomMenuAnalyticsEvent.OPEN_SECTION ? 'ava_menu' : 'settings';
		},

		/**
		 * @param {PresetBottomMenuAnalyticsEventValue} event
		 * @return {string}
		 */
		getDefaultElement: (event) => {
			return event === PresetBottomMenuAnalyticsEvent.OPEN_SECTION ? 'settings' : 'bottom_menu';
		},

		/**
		 * @param {PresetBottomMenuAnalyticsRoleValue|''} role
		 * @return {string}
		 */
		getUserRoleParam: (role) => {
			return role ? `userRole_${role}` : '';
		},

		/**
		 * @param {PresetBottomMenuCapabilities} capabilities
		 * @return {PresetBottomMenuAnalyticsRoleValue}
		 */
		getRole: (capabilities = {}) => {
			if (capabilities?.canSetPortalDefault === true)
			{
				return PresetBottomMenuAnalyticsRole.ADMIN;
			}

			if (capabilities?.canManage === true || capabilities?.canCreateManagedPreset === true)
			{
				return PresetBottomMenuAnalyticsRole.MANAGER;
			}

			return PresetBottomMenuAnalyticsRole.EMPLOYEE;
		},

		/**
		 * @param {TabPresetId|null|undefined} presetId
		 * @param {PresetBottomMenuAnalyticsPreset|null} preset
		 * @return {PresetBottomMenuAnalyticsTypeValue}
		 */
		getPresetType: (presetId, preset = null) => {
			if (preset?.isPortalDefault === true)
			{
				return PresetBottomMenuAnalyticsType.PORTAL_DEFAULT;
			}

			const source = String(preset?.source ?? '');
			const id = String(presetId ?? preset?.key ?? preset?.id ?? '');

			if (id === 'manual' || source === 'manual')
			{
				return PresetBottomMenuAnalyticsType.CUSTOM_EMPLOYEE;
			}

			if (id.startsWith('managed:') || source === 'managed')
			{
				return PresetBottomMenuAnalyticsType.CUSTOM_MANAGER;
			}

			return PresetBottomMenuAnalyticsType.BUILTIN;
		},

		/**
		 * @param {PresetBottomMenuTargetParams} params
		 * @return {PresetBottomMenuAnalyticsTargetValue}
		 */
		getTargetType: ({ recipients = [], selfAssign = false } = {}) => {
			const hasSelf = selfAssign === true;
			const hasUsers = recipients.some((recipient) => recipient?.type === 'user');
			const hasDepartments = recipients.some((recipient) => recipient?.type === 'department');
			const targetKindsCount = [hasSelf, hasUsers, hasDepartments].filter(Boolean).length;

			if (targetKindsCount === 0)
			{
				return PresetBottomMenuAnalyticsTarget.NONE;
			}

			if (targetKindsCount > 1)
			{
				return PresetBottomMenuAnalyticsTarget.MIXED;
			}

			if (hasSelf)
			{
				return PresetBottomMenuAnalyticsTarget.SELF;
			}

			if (hasUsers)
			{
				return PresetBottomMenuAnalyticsTarget.USERS;
			}

			return PresetBottomMenuAnalyticsTarget.DEPARTMENTS;
		},
	};

	module.exports = {
		PresetBottomMenuAnalytics,
		PresetBottomMenuAnalyticsEvent,
		PresetBottomMenuAnalyticsType,
		PresetBottomMenuAnalyticsRole,
		PresetBottomMenuAnalyticsTarget,
	};
});
