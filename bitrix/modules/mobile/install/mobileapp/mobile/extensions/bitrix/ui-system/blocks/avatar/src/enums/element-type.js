/**
 * @module ui-system/blocks/avatar/src/enums/element-type
 */
jn.define('ui-system/blocks/avatar/src/enums/element-type', (require, exports, module) => {
	const { BaseEnum } = require('utils/enums/base');

	/**
	 * @class AvatarElementType
	 * @template TAvatarElementType
	 * @extends {BaseEnum<AvatarElementType>}
	 */
	class AvatarElementType extends BaseEnum
	{
		static LAYOUT = new AvatarElementType('LAYOUT', 'layout');

		static NATIVE = new AvatarElementType('NATIVE', 'native');
	}

	module.exports = { AvatarElementType };
});
