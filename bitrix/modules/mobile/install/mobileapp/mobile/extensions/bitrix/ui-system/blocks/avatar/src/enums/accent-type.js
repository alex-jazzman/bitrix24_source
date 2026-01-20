/**
 * @module ui-system/blocks/avatar/src/enums/accent-type
 */
jn.define('ui-system/blocks/avatar/src/enums/accent-type', (require, exports, module) => {
	const { BaseEnum } = require('utils/enums/base');

	/**
	 * @class AvatarAccentType
	 * @template TAvatarAccentType
	 * @extends {BaseEnum<AvatarAccentType>}
	 */
	class AvatarAccentType extends BaseEnum
	{
		static GREEN = new AvatarAccentType('GREEN', 'green');

		static BLUE = new AvatarAccentType('BLUE', 'blue');

		static ORANGE = new AvatarAccentType('ORANGE', 'orange');
	}

	module.exports = {
		AvatarAccentType: AvatarAccentType.export(),
	};
});
