/**
 * @module tab-presets/managed/editors
 */
jn.define('tab-presets/managed/editors', (require, exports, module) => {
	const { ManagedPresetEditor } = require('tab-presets/managed/editors/src/preset-managed/managed-preset-editor');
	const { StockPresetEditor } = require('tab-presets/managed/editors/src/preset-managed/stock-preset-editor');
	const { RecipientPicker } = require('tab-presets/managed/editors/src/preset-managed/recipient-picker');
	const {
		createManagedPresetFormState,
		getCurrentPresetTabsConfig,
		getManagedPresetId,
		getPresetTabsConfig,
	} = require('tab-presets/managed/editors/src/preset-managed/managed-preset-form-state');
	const {
		createManagedPresetPostSaveOperations,
		ManagedPresetPostSaveOperationType,
	} = require('tab-presets/managed/editors/src/preset-managed/managed-preset-post-save-operations');
	const {
		RecipientPickerState,
		RecipientEntityId,
		DepartmentScope,
	} = require('tab-presets/managed/editors/src/preset-managed/recipient-picker-state');

	module.exports = {
		ManagedPresetEditor,
		StockPresetEditor,
		RecipientPicker,
		createManagedPresetFormState,
		getCurrentPresetTabsConfig,
		getManagedPresetId,
		getPresetTabsConfig,
		createManagedPresetPostSaveOperations,
		ManagedPresetPostSaveOperationType,
		RecipientPickerState,
		RecipientEntityId,
		DepartmentScope,
	};
});
