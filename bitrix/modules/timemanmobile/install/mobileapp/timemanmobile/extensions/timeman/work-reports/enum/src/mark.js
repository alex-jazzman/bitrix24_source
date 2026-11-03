/**
 * @module timeman/work-reports/enum/src/mark
 */
jn.define('timeman/work-reports/enum/src/mark', (require, exports, module) => {
	const { BaseEnum } = require('utils/enums/base');

	/**
	 * @template TMarkEnum
	 * @extends {BaseEnum<MarkEnum>}
	 */
	class MarkEnum extends BaseEnum
	{
		static POSITIVE = new MarkEnum('POSITIVE', 'G');

		static NEGATIVE = new MarkEnum('NEGATIVE', 'B');

		static NEUTRAL = new MarkEnum('NEUTRAL', 'N');

		static UNCONFIRMED = new MarkEnum('UNCONFIRMED', 'X');

		/**
		 * Rating control states. NEUTRAL and UNCONFIRMED marks look the same for the user.
		 */
		static State = Object.freeze({
			APPROVED: 'APPROVED',
			DISAPPROVED: 'DISAPPROVED',
			NONE: 'NONE',
		});

		/**
		 * @param {unknown} value
		 * @returns {MarkStateValue}
		 */
		static toState(value)
		{
			if (value === this.POSITIVE.getValue())
			{
				return this.State.APPROVED;
			}

			if (value === this.NEGATIVE.getValue())
			{
				return this.State.DISAPPROVED;
			}

			return this.State.NONE;
		}

		/**
		 * @param {MarkStateValue} state
		 * @returns {string}
		 */
		static fromState(state)
		{
			if (state === this.State.APPROVED)
			{
				return this.POSITIVE.getValue();
			}

			if (state === this.State.DISAPPROVED)
			{
				return this.NEGATIVE.getValue();
			}

			return this.NEUTRAL.getValue();
		}
	}

	module.exports = { MarkEnum };
});
