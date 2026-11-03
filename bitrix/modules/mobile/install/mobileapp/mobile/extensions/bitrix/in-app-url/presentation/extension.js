/**
 * @module in-app-url/presentation
 */
jn.define('in-app-url/presentation', (require, exports, module) => {
	const { BaseEnum } = require('utils/enums/base');
	const { Icon } = require('assets/icons');
	const { Color } = require('tokens');

	/**
	 * @extends {BaseEnum<Presentation>}
	 */
	class Presentation extends BaseEnum
	{
		// Opens in a separate modal navigation stack (close button + swipe-to-close).
		static MODAL = new Presentation('MODAL', 'modal');

		// Opens in the current navigation stack.
		static LAYOUT = new Presentation('LAYOUT', 'layout');

		/**
		 * @returns {boolean}
		 */
		isModal()
		{
			return this.equal(Presentation.MODAL);
		}

		/**
		 * @returns {{ modal: boolean, leftButtons: object[] }}
		 */
		getModalSettings()
		{
			return {
				modal: true,
				leftButtons: [
					{
						type: Icon.CHEVRON_DOWN.getIconName(),
						color: Color.base4.toHex(),
						isCloseButton: true,
					},
				],
			};
		}
	}

	module.exports = { Presentation };
});
