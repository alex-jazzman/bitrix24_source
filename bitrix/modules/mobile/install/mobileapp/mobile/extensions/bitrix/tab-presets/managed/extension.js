/**
 * @module tab-presets/managed
 */
jn.define('tab-presets/managed', (require, exports, module) => {
	const { TabPresetsComponent } = require('tab-presets/managed/src/managed/tab-presets-component');
	const {
		assignPreset,
		getApplyErrorMessage,
		getIcon,
		getManagedPresetId,
		getPresetDescription,
		getPresetInfoImagePath,
		isManagedPresetId,
		isRecipientNotAllowedError,
		preloadPresetInfoImage,
		saveManagedPreset,
		updatePresetInCache,
	} = require('tab-presets/managed/src/managed/utils');

	module.exports = {
		TabPresetsComponent,
		assignPreset,
		getApplyErrorMessage,
		getIcon,
		getManagedPresetId,
		getPresetDescription,
		getPresetInfoImagePath,
		isManagedPresetId,
		isRecipientNotAllowedError,
		preloadPresetInfoImage,
		saveManagedPreset,
		updatePresetInCache,
	};
});
