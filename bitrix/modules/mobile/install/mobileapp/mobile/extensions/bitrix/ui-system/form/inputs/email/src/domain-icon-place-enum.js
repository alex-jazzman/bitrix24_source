/**
 * @module ui-system/form/inputs/email/src/domain-icon-place-enum
 */
jn.define('ui-system/form/inputs/email/src/domain-icon-place-enum', (require, exports, module) => {
	const { BaseEnum } = require('utils/enums/base');

	/**
	 * @class InputDomainIconPlace
	 * @template TInputDomainIconPlace
	 * @extends {BaseEnum<InputDomainIconPlace>}
	 */
	class InputDomainIconPlace extends BaseEnum
	{
		static RIGHT = new InputDomainIconPlace('RIGHT', 'right');

		static LEFT = new InputDomainIconPlace('LEFT', 'left');

		static RIGHT_STICK = new InputDomainIconPlace('RIGHT_STICK', 'right_stick');

		isRight()
		{
			return this.equal(InputDomainIconPlace.RIGHT);
		}

		isLeft()
		{
			return this.equal(InputDomainIconPlace.LEFT);
		}

		isRightStick()
		{
			return this.equal(InputDomainIconPlace.RIGHT_STICK);
		}
	}

	module.exports = { InputDomainIconPlace };
});
