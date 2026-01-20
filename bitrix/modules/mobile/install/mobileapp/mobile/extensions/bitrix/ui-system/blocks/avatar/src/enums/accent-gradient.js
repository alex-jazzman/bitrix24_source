/**
 * @module ui-system/blocks/avatar/src/enums/accent-gradient
 */
jn.define('ui-system/blocks/avatar/src/enums/accent-gradient', (require, exports, module) => {
	const { Color } = require('tokens');
	const { BaseEnum } = require('utils/enums/base');

	/**
	 * @class AvatarAccentGradient
	 * @template TAvatarAccentGradient
	 * @extends {BaseEnum<AvatarAccentGradient>}
	 */
	class AvatarAccentGradient extends BaseEnum
	{
		static GREEN = new AvatarAccentGradient('GREEN', [Color.collabAccentPrimary.toHex()]);

		static BLUE = new AvatarAccentGradient('BLUE', [Color.accentMainPrimary.toHex()]);

		static ORANGE = new AvatarAccentGradient('ORANGE', [Color.accentMainWarning.toHex()]);
	}

	module.exports = {
		AvatarAccentGradient: AvatarAccentGradient.export(),
	};
});
