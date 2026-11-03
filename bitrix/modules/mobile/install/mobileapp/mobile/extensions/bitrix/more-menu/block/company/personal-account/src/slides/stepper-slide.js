/**
 * @module more-menu/block/company/personal-account/src/slides/stepper-slide
 */
jn.define('more-menu/block/company/personal-account/src/slides/stepper-slide', (require, exports, module) => {
	const { Color, Indent } = require('tokens');
	const { createTestIdGenerator } = require('utils/test');
	const { Box } = require('ui-system/layout/box');
	const { BoxFooter } = require('ui-system/layout/dialog-footer');
	const { Button, ButtonSize } = require('ui-system/form/buttons/button');
	const { StepProgressBar } = require('layout/ui/step-progress-bar');
	const { FormStep } = require('more-menu/block/company/personal-account/src/steps/form-step');
	const { PinStep } = require('more-menu/block/company/personal-account/src/steps/pin-step');
	const { ResendButton } = require('more-menu/block/company/personal-account/src/steps/resend-button');

	const StepType = {
		FORM: 'form',
		PIN: 'pin',
	};

	/**
	 * First slide of the personal account sheet: the step-by-step form. It shows a
	 * progress indicator (when there is more than one step) and the active sub-step
	 * (company/period form or PIN input). The footer carries one control per step: the
	 * primary action on the form step, and the "request again" control on the PIN step,
	 * where a complete code confirms itself and needs no button. Labels and enabled state
	 * are computed by the flow, which owns the form/PIN state - this slide only renders what
	 * it receives. The shell collapses the footer to a single control while the keyboard is
	 * up, so each step hands its own control to keyboardButton as well.
	 *
	 * @class StepperSlide
	 */
	class StepperSlide extends LayoutComponent
	{
		/**
		 * @param {object} props
		 * @param {string} props.testId
		 * @param {{ type: string, company?: boolean, period?: boolean }} props.step
		 * @param {boolean} props.showProgress
		 * @param {number} props.currentStepIndex
		 * @param {Array<{ label: string }>} props.progressSteps
		 * @param {Array<object>} props.companies
		 * @param {?number} props.companyId
		 * @param {?number} props.employeeId
		 * @param {?{ month: number, year: number }} props.period
		 * @param {string} props.pin
		 * @param {boolean} props.pinFailed
		 * @param {boolean} props.pinAccepted
		 * @param {?number} props.requestPinAt
		 * @param {?{ text: string, testId: string, disabled: boolean, loading?: boolean, onClick: function(): void }} props.primaryButton - absent on the PIN step
		 * @param {function({ companyId?: number, employeeId?: number, period?: object }): void} props.onFormChange
		 * @param {function(string): void} props.onPinChange
		 * @param {function(string): void} props.onPinComplete
		 * @param {function(): void} props.onPinResend
		 */
		constructor(props)
		{
			super(props);

			this.getTestId = createTestIdGenerator({ prefix: props.testId });
		}

		render()
		{
			return Box(
				{
					testId: this.getTestId('stepper'),
					backgroundColor: Color.bgContentPrimary,
					safeArea: { bottom: true },
					withPaddingHorizontal: true,
					resizableByKeyboard: true,
					footer: this.#renderFooter(),
				},
				View(
					{
						testId: this.getTestId('stepper-body'),
						style: {
							flex: 1,
						},
						// Tap outside the input drops the keyboard, so the footer restores the resend control.
						onClick: () => Keyboard.dismiss(),
					},
					this.#renderProgress(),
					this.#renderStepContent(),
				),
			);
		}

		#renderFooter()
		{
			return this.props.step.type === StepType.FORM
				? this.#renderPrimaryFooter()
				: this.#renderPinFooter();
		}

		#renderPinFooter()
		{
			const { requestPinAt, onPinResend } = this.props;

			// A factory, not a ready instance: the footer drops what it holds while the keyboard is up
			// and asks again when it restores it, so the countdown comes back as a freshly mounted
			// component and its per-second tick starts again. keyboardButton takes a factory too, so
			// the very same control is what shows above the keyboard - only one of the two is on
			// screen at a time, which is why both carry one locator.
			const renderResend = () => new ResendButton({
				testId: this.getTestId('pin-resend'),
				requestPinAt,
				onResend: onPinResend,
			});

			return BoxFooter(
				{
					testId: this.getTestId('stepper-footer'),
					keyboardButton: renderResend,
				},
				renderResend,
			);
		}

		#renderPrimaryFooter()
		{
			const { primaryButton } = this.props;

			return BoxFooter(
				{
					testId: this.getTestId('stepper-footer'),
					keyboardButton: {
						testId: this.getTestId('stepper-footer-keyboard'),
						text: primaryButton.text,
						disabled: primaryButton.disabled,
						loading: primaryButton.loading,
						onClick: primaryButton.onClick,
					},
				},
				Button({
					testId: primaryButton.testId,
					text: primaryButton.text,
					size: ButtonSize.L,
					stretched: true,
					disabled: primaryButton.disabled,
					loading: primaryButton.loading,
					onClick: primaryButton.onClick,
				}),
			);
		}

		#renderProgress()
		{
			const { showProgress, currentStepIndex, progressSteps } = this.props;

			if (!showProgress)
			{
				return null;
			}

			return new StepProgressBar({
				testId: this.getTestId(),
				steps: progressSteps,
				currentStepIndex,
				style: {
					marginTop: Indent.XL.toNumber(),
					marginBottom: Indent.XL2.toNumber(),
				},
			});
		}

		#renderStepContent()
		{
			return this.props.step.type === StepType.FORM
				? this.#renderForm()
				: this.#renderPin();
		}

		#renderForm()
		{
			const { step, companies, companyId, period, onFormChange } = this.props;

			return new FormStep({
				testId: this.getTestId('form'),
				needCompany: Boolean(step.company),
				needPeriod: Boolean(step.period),
				companies,
				companyId,
				period,
				onChange: onFormChange,
			});
		}

		#renderPin()
		{
			const { pin, pinFailed, pinAccepted, onPinChange, onPinComplete } = this.props;

			return new PinStep({
				testId: this.getTestId('pin'),
				pin,
				hasFailed: pinFailed,
				isAccepted: pinAccepted,
				onPinChange,
				onPinComplete,
			});
		}
	}

	module.exports = { StepperSlide };
});
