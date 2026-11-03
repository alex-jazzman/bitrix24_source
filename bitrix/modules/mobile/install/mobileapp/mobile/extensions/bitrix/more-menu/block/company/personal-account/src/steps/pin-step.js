/**
 * @module more-menu/block/company/personal-account/src/steps/pin-step
 */
jn.define('more-menu/block/company/personal-account/src/steps/pin-step', (require, exports, module) => {
	const { Loc } = require('loc');
	const { Color, Indent } = require('tokens');
	const { createTestIdGenerator } = require('utils/test');
	const { Text5 } = require('ui-system/typography/text');
	const { OtpInput } = require('ui-system/form/inputs/otp');

	// The PIN 1C issues is a six-digit code.
	const PIN_LENGTH = 6;

	/**
	 * PIN step: a line stating that the code arrives on its own, and a row of OTP cells centered in
	 * what is left of the step. A failed request reddens the cells and puts a message under them; an
	 * accepted code freezes them while the flow advances. A complete code confirms itself, so the
	 * footer carries only the resend control (ResendButton), not a primary action. The PIN is a
	 * short-lived secret owned by the flow - never log or persist it.
	 *
	 * @class PinStep
	 */
	class PinStep extends LayoutComponent
	{
		/**
		 * @param {object} props
		 * @param {string} props.testId
		 * @param {string} props.pin
		 * @param {boolean} props.hasFailed - the code could not be obtained
		 * @param {boolean} props.isAccepted - the code is complete and the flow is advancing
		 * @param {function(string): void} props.onPinChange
		 * @param {function(string): void} props.onPinComplete
		 */
		constructor(props)
		{
			super(props);

			this.getTestId = createTestIdGenerator({ prefix: props.testId });

			this.handlePinChange = this.handlePinChange.bind(this);
		}

		render()
		{
			const { pin, hasFailed, isAccepted, onPinComplete } = this.props;

			return View(
				{
					testId: this.getTestId(),
					style: {
						flex: 1,
					},
				},
				Text5({
					testId: this.getTestId('hint-text'),
					text: Loc.getMessage('MORE_MENU_COMPANY_PERSONAL_ACCOUNT_PIN_HINT'),
					color: Color.base3,
				}),
				View(
					{
						style: {
							flex: 1,
							justifyContent: 'center',
							alignItems: 'center',
						},
					},
					OtpInput({
						testId: this.getTestId('input'),
						length: PIN_LENGTH,
						value: pin,
						error: hasFailed,
						disabled: isAccepted,
						readOnly: isAccepted,
						onChange: this.handlePinChange,
						onComplete: onPinComplete,
					}),
					hasFailed && Text5({
						style: {
							marginTop: Indent.L.toNumber(),
						},
						testId: this.getTestId('error-text'),
						text: Loc.getMessage('MORE_MENU_COMPANY_PERSONAL_ACCOUNT_PIN_FAILED'),
						color: Color.accentMainAlert,
					}),
				),
			);
		}

		handlePinChange(value)
		{
			this.props.onPinChange(value);
		}
	}

	module.exports = { PinStep };
});
