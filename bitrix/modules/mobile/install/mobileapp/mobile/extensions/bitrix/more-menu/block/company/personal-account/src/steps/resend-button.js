/**
 * @module more-menu/block/company/personal-account/src/steps/resend-button
 */
jn.define('more-menu/block/company/personal-account/src/steps/resend-button', (require, exports, module) => {
	const { Loc } = require('loc');
	const { createTestIdGenerator } = require('utils/test');
	const { Button, ButtonDesign, ButtonSize } = require('ui-system/form/buttons/button');
	const { Indent } = require('tokens');

	// Matches server-side PIN_THROTTLE_SECONDS: a repeat within the window reuses the job.
	const PIN_THROTTLE_SECONDS = 60;

	/**
	 * Footer control that re-requests the PIN, gated by a countdown mirroring the server
	 * throttle window. The remainder is derived from `props.requestPinAt` on every render and
	 * never accumulated in state, so any instance - freshly built or long-lived - paints the
	 * real remainder instead of a value frozen when it was constructed. State holds only a tick
	 * that repaints this button once a second, never the PIN input or the sheet body. The tick
	 * is bound to the mount lifecycle, which is why the footer receives this control as a
	 * factory (see StepperSlide): every restore after the keyboard builds a new instance.
	 *
	 * @class ResendButton
	 */
	class ResendButton extends LayoutComponent
	{
		/**
		 * @param {object} props
		 * @param {string} props.testId
		 * @param {?number} props.requestPinAt - timestamp of the last requestPin (countdown anchor)
		 * @param {function(): void} props.onResend
		 */
		constructor(props)
		{
			super(props);

			this.getTestId = createTestIdGenerator({ prefix: props.testId });

			this.state = {
				tick: 0,
			};

			this.timer = null;

			this.handleClick = this.handleClick.bind(this);
		}

		componentDidMount()
		{
			this.#syncTimer();
		}

		componentWillReceiveProps(nextProps)
		{
			this.#syncTimer(nextProps.requestPinAt);
		}

		componentWillUnmount()
		{
			this.#stopTimer();
		}

		render()
		{
			const remainingSeconds = this.#getRemainingSeconds();

			return Button({
				testId: this.getTestId(),
				style: {
					marginBottom: Indent.XS.toNumber(),
				},
				text: this.#getText(remainingSeconds),
				design: ButtonDesign.PLAIN,
				size: ButtonSize.L,
				stretched: true,
				disabled: remainingSeconds > 0,
				onClick: this.handleClick,
			});
		}

		handleClick()
		{
			if (this.#getRemainingSeconds() > 0)
			{
				return;
			}

			this.props.onResend();
		}

		// Idempotent: keeps the tick alive exactly while the window is open, whatever the
		// mount path was (fresh mount, remount after the keyboard, new anchor).
		#syncTimer(requestPinAt = this.props.requestPinAt)
		{
			const isCountingDown = this.#getRemainingSeconds(requestPinAt) > 0;

			if (isCountingDown && !this.timer)
			{
				this.timer = setInterval(() => this.#tick(), 1000);
			}
			else if (!isCountingDown && this.timer)
			{
				this.#stopTimer();
			}
		}

		#tick()
		{
			if (this.#getRemainingSeconds() <= 0)
			{
				this.#stopTimer();
			}

			this.setState({ tick: this.state.tick + 1 });
		}

		#stopTimer()
		{
			if (this.timer)
			{
				clearInterval(this.timer);
				this.timer = null;
			}
		}

		#getText(remainingSeconds)
		{
			if (remainingSeconds > 0)
			{
				return Loc.getMessage('MORE_MENU_COMPANY_PERSONAL_ACCOUNT_PIN_RESEND_TIMER', {
					'#SECONDS#': remainingSeconds,
				});
			}

			return Loc.getMessage('MORE_MENU_COMPANY_PERSONAL_ACCOUNT_PIN_RESEND');
		}

		#getRemainingSeconds(requestPinAt = this.props.requestPinAt)
		{
			if (!requestPinAt)
			{
				return 0;
			}

			const elapsed = (Date.now() - requestPinAt) / 1000;

			return Math.max(0, Math.ceil(PIN_THROTTLE_SECONDS - elapsed));
		}
	}

	module.exports = { ResendButton };
});
