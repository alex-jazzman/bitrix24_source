/**
 * @module layout/ui/field-filter/filter/src/layout/footer
 */
jn.define('layout/ui/field-filter/filter/src/layout/footer', (require, exports, module) => {
	const { BoxFooter } = require('ui-system/layout/box');
	const { Button, ButtonDesign, ButtonSize } = require('ui-system/form/buttons/button');

	/**
	 * The single button a screen of the filter is closed by. Every screen of it holds fields that are
	 * filled in, and the keyboard that opens for one of them stands over the footer - so the very same
	 * button is declared as the `keyboardButton` of the footer and is drawn above the keyboard while it
	 * is up. Declaring it is also what makes `Box` give way to the keyboard, so no screen has to ask
	 * for that on its own.
	 *
	 * @param {FilterFooterProps} props
	 * @return {Function} the footer of a `Box`
	 */
	const FilterFooter = (props) => {
		const { testId, buttonTestId, text, design = ButtonDesign.FILLED, disabled = false, onClick } = props;

		const button = {
			testId: buttonTestId,
			text,
			design,
			size: ButtonSize.L,
			stretched: true,
			disabled,
			onClick,
		};

		return BoxFooter({ testId, keyboardButton: button }, Button(button));
	};

	module.exports = { FilterFooter };
});
