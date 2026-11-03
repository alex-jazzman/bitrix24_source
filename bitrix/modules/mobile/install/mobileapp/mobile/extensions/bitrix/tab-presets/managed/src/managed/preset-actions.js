/**
 * @module tab-presets/managed/src/managed/preset-actions
 */
jn.define('tab-presets/managed/src/managed/preset-actions', (require, exports, module) => {
	const PRESET_ACTION_ID = {
		INSTALL_SELF: 'installSelf',
		SET_PORTAL_DEFAULT: 'setPortalDefault',
		EDIT: 'edit',
		DELETE: 'delete',
	};

	const SOURCE_MANAGED = 'managed';
	const MANAGEMENT_SECTION = 'management';
	/**
	 * @param {unknown} value
	 * @return {string}
	 */
	const normalizeTestIdPart = (value) => String(value)
		.replace(/([a-z0-9])([A-Z])/g, '$1-$2')
		.replace(/[^a-zA-Z0-9]+/g, '-')
		.replace(/^-|-$/g, '')
		.toLowerCase()
	;

	/**
	 * @param {TabPreset} preset
	 * @return {boolean}
	 */
	const isManagedPreset = (preset) => {
		return (
			preset?.isManaged === true
			|| preset?.source === SOURCE_MANAGED
			|| String(preset?.key ?? '').startsWith(`${SOURCE_MANAGED}:`)
		);
	};

	/**
	 * @param {TabPreset} [preset]
	 * @param {TabPresetsCapabilities} [capabilities]
	 * @return {TabPresetActionDescriptor[]}
	 */
	const getPresetActionDescriptors = (preset = {}, capabilities = {}) => {
		const actions = [];
		const managedPreset = isManagedPreset(preset);
		const canManageManagedPreset = managedPreset && (
			preset.isEditable === true
			|| preset.isOwner === true
		);

		if (preset.canSelfInstall === true)
		{
			actions.push({ id: PRESET_ACTION_ID.INSTALL_SELF });
		}

		if (preset.canSetMainTool === true && preset.isPortalDefault !== true)
		{
			actions.push({ id: PRESET_ACTION_ID.SET_PORTAL_DEFAULT });
		}

		if (managedPreset && canManageManagedPreset)
		{
			actions.push({
				id: PRESET_ACTION_ID.EDIT,
				sectionCode: MANAGEMENT_SECTION,
			});
		}

		if (managedPreset && (preset.canDelete === true || canManageManagedPreset))
		{
			actions.push({
				id: PRESET_ACTION_ID.DELETE,
				sectionCode: MANAGEMENT_SECTION,
				destructive: true,
			});
		}

		return actions;
	};

	/**
	 * @param {string} presetId
	 * @param {TabPresetActionId} actionId
	 * @return {string}
	 */
	const getPresetActionTestId = (presetId, actionId) => (
		`tab-presets-preset-${normalizeTestIdPart(presetId)}-action-${normalizeTestIdPart(actionId)}`
	);

	module.exports = {
		PRESET_ACTION_ID,
		getPresetActionDescriptors,
		getPresetActionTestId,
	};
});
