/**
 * @module layout/ui/field-filter/filter/src/enums/pseudo-preset
 */
jn.define('layout/ui/field-filter/filter/src/enums/pseudo-preset', (require, exports, module) => {
	const { BaseEnum } = require('utils/enums/base');
	// the "no preset" id is named before the drawer graph exists, so it lives with the stand-in
	const { NO_PRESET_ID } = require('layout/ui/field-filter/values');

	/**
	 * Pseudo presets shared with the web filter: they never appear in the list and are
	 * rejected on write. `DEFAULT` also means "no preset selected" and is the value
	 * `pinFilter` takes to remove the pinning.
	 * @extends {BaseEnum<PseudoPreset>}
	 */
	class PseudoPreset extends BaseEnum
	{
		static DEFAULT = new PseudoPreset('DEFAULT', NO_PRESET_ID);

		static TMP = new PseudoPreset('TMP', 'tmp_filter');
	}

	module.exports = {
		PseudoPreset: PseudoPreset.export(),
	};
});
