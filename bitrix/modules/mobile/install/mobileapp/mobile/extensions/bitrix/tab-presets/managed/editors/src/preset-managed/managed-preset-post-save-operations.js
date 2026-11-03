/**
 * @module tab-presets/managed/editors/src/preset-managed/managed-preset-post-save-operations
 */
jn.define('tab-presets/managed/editors/src/preset-managed/managed-preset-post-save-operations', (require, exports, module) => {
	/**
	 * @type {Readonly<{
	 *   SET_MAIN_TOOL: 'setMainTool',
	 *   INSTALL_SELF: 'installSelf',
	 *   ASSIGN_RECIPIENTS: 'assignRecipients',
	 * }>}
	 */
	const ManagedPresetPostSaveOperationType = Object.freeze({
		SET_MAIN_TOOL: 'setMainTool',
		INSTALL_SELF: 'installSelf',
		ASSIGN_RECIPIENTS: 'assignRecipients',
	});

	/**
	 * @param {ManagedPresetPostSaveOperationParams} params
	 * @return {ManagedPresetPostSaveOperation[]}
	 */
	function createManagedPresetPostSaveOperations({
		presetId,
		tabs,
		mainTool = false,
		canSetMainTool = false,
		isPortalDefault = false,
		selfAssign = false,
		canAssign = false,
		recipientsChanged = false,
		selectedRecipientTargets = [],
	})
	{
		/** @type {ManagedPresetPostSaveOperation[]} */
		const operations = [];
		const recipients = Array.isArray(selectedRecipientTargets) ? selectedRecipientTargets : [];

		if (mainTool === true && canSetMainTool === true && isPortalDefault !== true)
		{
			operations.push({
				type: ManagedPresetPostSaveOperationType.SET_MAIN_TOOL,
				presetId,
			});
		}

		if (selfAssign === true)
		{
			operations.push({
				type: ManagedPresetPostSaveOperationType.INSTALL_SELF,
				presetId,
			});
		}

		if (canAssign === true && recipientsChanged === true)
		{
			operations.push({
				type: ManagedPresetPostSaveOperationType.ASSIGN_RECIPIENTS,
				presetId,
				recipients,
				tabs,
			});
		}

		return operations;
	}

	module.exports = {
		createManagedPresetPostSaveOperations,
		ManagedPresetPostSaveOperationType,
	};
});
