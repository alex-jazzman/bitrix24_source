/**
 * @module ui-system/form/inputs/input/src/design-enum
 */
jn.define('ui-system/form/inputs/input/src/design-enum', (require, exports, module) => {
	const { Color } = require('tokens');
	const { BaseEnum } = require('utils/enums/base');

	/**
	 * @class InputDesign
	 * @template TInputDesign
	 * @extends {BaseEnum<InputDesign>}
	 */
	class InputDesign extends BaseEnum
	{
		static PRIMARY = new InputDesign('PRIMARY', {
			borderColor: Color.accentMainPrimary,
		});

		static GREY = new InputDesign('GREY', {
			borderColor: Color.base5,
		});

		static LIGHT_GREY = new InputDesign('LIGHT_GREY', {
			borderColor: Color.bgSeparatorPrimary,
		});

		static #DISABLED = new InputDesign('DISABLED', {
			backgroundColor: Color.base7,
		});

		getDisabled()
		{
			return InputDesign.#DISABLED;
		}

		getStyle()
		{
			return this.getValue();
		}
	}

	module.exports = { InputDesign };
});
