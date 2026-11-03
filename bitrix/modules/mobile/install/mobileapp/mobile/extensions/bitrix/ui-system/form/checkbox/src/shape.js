/**
 * @module ui-system/form/checkbox/src/shape
 */
jn.define('ui-system/form/checkbox/src/shape', (require, exports, module) => {
	const { Component, Corner } = require('tokens');
	const { BaseEnum } = require('utils/enums/base');

	/**
	 * @extends {BaseEnum<CheckboxShape>}
	 */
	class CheckboxShape extends BaseEnum
	{
		static SQUARE = new CheckboxShape('SQUARE', Corner.XS);

		static CIRCLE = new CheckboxShape('CIRCLE', Component.elementAccentCorner);

		/**
		 * @return {number}
		 */
		getBorderRadius()
		{
			return this.getValue().toNumber();
		}
	}

	module.exports = {
		CheckboxShape: CheckboxShape.export(),
	};
});
