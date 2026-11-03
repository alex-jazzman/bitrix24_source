/**
 * @module tab-presets/managed/src/model/preset-item
 */
jn.define('tab-presets/managed/src/model/preset-item', (require, exports, module) => {
	const ITEM_KEY_MANUAL = 'manual';
	const SOURCE_BUILTIN = 'builtin';
	const SOURCE_MANUAL = 'manual';
	const SOURCE_MANAGED = 'managed';

	const PresetItem = {
		/**
		 * @param {TabPresetsData} presets
		 * @return {TabPresetItem[]}
		 */
		createList: (presets) => {
			const current = presets?.current;
			const list = presets?.list ?? {};

			return Object.keys(list).map((presetId, index) => PresetItem.create(presetId, list[presetId], current, index));
		},

		/**
		 * @param {string} presetId
		 * @param {TabPreset} preset
		 * @param {string} current
		 * @param {number} [index]
		 * @return {TabPresetItem}
		 */
		create: (presetId, preset, current, index = 0) => {
			const source = PresetItem.getSource(presetId, preset);
			const capabilities = preset?.capabilities ?? {};

			return {
				...preset,
				key: presetId,
				type: presetId,
				source,
				isFirst: index === 0,
				isSelected: presetId === current,
				isManual: source === SOURCE_MANUAL,
				isManaged: source === SOURCE_MANAGED,
				isBuiltin: source === SOURCE_BUILTIN,
				isOwner: Boolean(preset?.isOwner),
				isEditable: Boolean(preset?.canEdit ?? capabilities.canEdit),
				isAssignable: Boolean(preset?.canAssign ?? capabilities.canAssign),
				canDelete: Boolean(preset?.canDelete ?? capabilities.canDelete),
				canSelfInstall: Boolean(preset?.canSelfInstall ?? capabilities.canSelfInstall),
				canSetMainTool: Boolean(preset?.canSetMainTool ?? capabilities.canSetMainTool),
				canCustomizeBuiltin: Boolean(preset?.canCustomizeBuiltin ?? capabilities.canCustomizeBuiltin),
				isPortalDefault: Boolean(preset?.isPortalDefault),
				isLastAssigned: Boolean(preset?.isLastAssigned),
			};
		},

		/**
		 * @param {string} presetId
		 * @param {TabPreset} preset
		 * @return {string}
		 */
		getSource: (presetId, preset) => {
			if (preset?.source)
			{
				return preset.source;
			}

			if (presetId === ITEM_KEY_MANUAL)
			{
				return SOURCE_MANUAL;
			}

			if (String(presetId).startsWith(`${SOURCE_MANAGED}:`))
			{
				return SOURCE_MANAGED;
			}

			return SOURCE_BUILTIN;
		},
	};

	module.exports = { PresetItem };
});
