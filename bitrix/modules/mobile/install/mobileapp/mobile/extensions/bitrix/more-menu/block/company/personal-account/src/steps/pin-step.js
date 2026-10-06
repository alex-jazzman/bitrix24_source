/**
 * @module more-menu/block/company/personal-account/src/steps/pin-step
 */
jn.define('more-menu/block/company/personal-account/src/steps/pin-step', (require, exports, module) => {
	const { Loc } = require('loc');
	const { Color, Indent } = require('tokens');
	const { createTestIdGenerator } = require('utils/test');
	const { Text5 } = require('ui-system/typography/text');
	const { SpinnerLoader } = require('layout/ui/loaders/spinner');
	const { StringInput } = require('ui-system/form/inputs/string');
	const { IconView, Icon } = require('ui-system/blocks/icon');

	// Generous bound so a realistic numeric PIN is never truncated.
	const PIN_MAX_LENGTH = 16;
	// Reserved height for the hint line so the layout does not jump between states.
	const HINT_MIN_HEIGHT = 34;

	/**
	 * PIN step: a numeric password input whose title sits above it (like the form-step
	 * fields). While the PIN is being fetched a spinner rides inside the input; a single
	 * hint line below states the code arrives on its own. Failure paints the field's own
	 * error border (no errorText - it would add a line and cost height); the brief
	 * auto-filled state disables the field. Resend lives in the sheet footer (ResendButton),
	 * not here. The PIN is a short-lived secret owned by the flow - never log or persist it.
	 *
	 * @class PinStep
	 */
	class PinStep extends LayoutComponent
	{
		/**
		 * @param {object} props
		 * @param {string} props.testId
		 * @param {string} props.pin
		 * @param {boolean} props.isWaiting - waiting for an auto-delivered PIN
		 * @param {boolean} props.hasFailed - the code could not be obtained
		 * @param {boolean} props.isAutoFilled - the PIN just arrived and is shown briefly before advancing
		 * @param {function(string): void} props.onPinChange
		 */
		constructor(props)
		{
			super(props);

			this.getTestId = createTestIdGenerator({ prefix: props.testId });

			this.handlePinChange = this.handlePinChange.bind(this);
		}

		render()
		{
			return View(
				{
					testId: this.getTestId(),
					style: {
						width: '100%',
					},
				},
				this.#renderField(),
			);
		}

		// The field title sits above the input (Text5 / base3), like the form-step fields.
		#renderField()
		{
			return View(
				{
					testId: this.getTestId('field'),
				},
				Text5({
					testId: this.getTestId('label'),
					text: Loc.getMessage('MORE_MENU_COMPANY_PERSONAL_ACCOUNT_PIN_LABEL'),
					color: Color.base3,
				}),
				this.#renderInput(),
				this.#renderHint(),
			);
		}

		#renderInput()
		{
			const { pin, isWaiting, hasFailed, isAutoFilled } = this.props;

			return StringInput({
				testId: this.getTestId('input'),
				value: pin,
				isPassword: true,
				keyboardType: 'number-pad',
				maxLength: PIN_MAX_LENGTH,
				// Only the border reddens on failure - the message lives in the hint line below.
				error: hasFailed,
				// Freeze the field while the just-arrived PIN is shown before advancing.
				disabled: isAutoFilled,
				readOnly: isAutoFilled,
				// Spinner rides inside the field while the code is being auto-delivered.
				rightContent: isWaiting ? SpinnerLoader({ size: 18 }) : null,
				onChange: this.handlePinChange,
			});
		}

		#renderHint()
		{
			const hint = this.#getHint();

			return View(
				{
					testId: this.getTestId('hint'),
					style: {
						minHeight: HINT_MIN_HEIGHT,
						flexDirection: 'row',
						alignItems: 'center',
					},
				},
				hint.icon && IconView({
					testId: this.getTestId('hint-icon'),
					icon: hint.icon,
					size: 18,
					color: hint.color,
					style: {
						marginRight: Indent.XS2.toNumber(),
					},
				}),
				Text5({
					testId: this.getTestId('hint-text'),
					text: hint.text,
					color: hint.color,
				}),
			);
		}

		#getHint()
		{
			const { hasFailed, isAutoFilled } = this.props;

			if (hasFailed)
			{
				return {
					text: Loc.getMessage('MORE_MENU_COMPANY_PERSONAL_ACCOUNT_PIN_FAILED'),
					color: Color.accentMainAlert,
				};
			}

			if (isAutoFilled)
			{
				return {
					text: Loc.getMessage('MORE_MENU_COMPANY_PERSONAL_ACCOUNT_PIN_AUTOFILLED'),
					color: Color.accentMainSuccess,
					icon: Icon.CHECK,
				};
			}

			return {
				text: Loc.getMessage('MORE_MENU_COMPANY_PERSONAL_ACCOUNT_PIN_HINT'),
				color: Color.base3,
			};
		}

		handlePinChange(value)
		{
			this.props.onPinChange(value);
		}
	}

	module.exports = { PinStep };
});
