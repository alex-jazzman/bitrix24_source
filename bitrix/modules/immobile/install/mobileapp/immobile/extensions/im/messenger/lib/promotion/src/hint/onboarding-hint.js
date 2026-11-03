/**
 * @module im/messenger/lib/promotion/src/hint/onboarding-hint
 */
jn.define('im/messenger/lib/promotion/src/hint/onboarding-hint', (require, exports, module) => {
	const { Type } = require('type');
	const { HintSpotlight } = require('im/messenger/lib/promotion/src/hint/spotlight');
	const { OnboardingHintView } = require('im/messenger/lib/promotion/src/hint/onboarding-hint-view');
	const { getLoggerWithContext } = require('im/messenger/lib/logger');

	const logger = getLoggerWithContext('promotion', 'OnboardingHint');

	const HIDE_EVENT = 'onHide';
	// Right after the rail has moved the native side hands out no spotlight to measure with for a
	// moment, and a tab mid-slide measures to where it is passing through - both answer with a rect the
	// ear cannot use, and both pass within a few hundred milliseconds.
	const MEASURE_ATTEMPTS = 3;
	const MEASURE_RETRY_DELAY = 250;

	/**
	 * Multi-step hint anchored to an element of the messenger: one live popup for the whole onboarding.
	 * The step is state of the body component, so showStep() only redraws the content - the spotlight
	 * is not recreated and the popup does not leave the screen between the steps.
	 *
	 * The show completes later than this class hands the hint over - the target is measured by the
	 * native side - so a show that did not happen is reported through onShowSkipped rather than thrown.
	 *
	 * @class OnboardingHint
	 */
	class OnboardingHint
	{
		#spotlight = null;

		#view = null;

		#showTimer = null;

		#isDismissed = false;

		#targetRef = null;

		/**
		 * @param {OnboardingHintProps} props
		 * @return {OnboardingHint}
		 */
		static show(props)
		{
			const hint = new OnboardingHint(props);

			hint.#start();

			return hint;
		}

		/**
		 * @param {OnboardingHintProps} props
		 */
		constructor(props)
		{
			this.props = props;
		}

		/**
		 * The step draws its own content and points at its own target: a step that speaks of another tab
		 * moves the ear onto it. The step brings its own target within reach first, and one that stayed
		 * out of reach is left unpointed at - then the ear stays where it stood, because a hint pointing
		 * at the wrong tab is worse than one that did not move. Content and ear reach the popup in one
		 * update: the native side re-shows the popup on every change of its geometry.
		 *
		 * @param {number} step
		 */
		showStep(step)
		{
			void this.#drawStep(step);
		}

		/**
		 * One update of the popup per step: the step brings its own target within reach, the target is
		 * measured, and the content and the ear reach the popup together. The native side re-shows the
		 * popup on every change of its geometry, so an ear that catches up a moment later is a second
		 * re-show - the blink seen between the steps.
		 *
		 * @param {number} step
		 */
		async #drawStep(step)
		{
			const stepProps = this.props.steps?.[step - 1];
			const targetRef = stepProps?.targetRef;

			if (!targetRef || targetRef === this.#targetRef || !this.#spotlight)
			{
				this.#view?.showStep(step);

				return;
			}

			let targetRect = null;

			try
			{
				// the step brings its own target within reach before anything is measured. Asking only
				// after a measurement said "off screen" made the move depend on millimetres: a tab with
				// a sliver on the screen counts as visible, and the ear went to its edge instead
				await stepProps.revealTarget?.();

				if (this.#isDismissed)
				{
					return;
				}

				targetRect = await OnboardingHint.#measureTarget(targetRef);
			}
			catch (error)
			{
				logger.error('drawStep:', error);
			}

			if (this.#isDismissed)
			{
				return;
			}

			// a target that cannot be pointed at leaves the ear where it stood, and the step is drawn all
			// the same: a hint pointing at the wrong tab is worse than one that did not move. The target of
			// the spotlight is never touched either - it positions the overlay, and the overlay is re-shown
			// on every change of it, which is a re-show of its own
			if (!OnboardingHint.#isTargetOnScreen(targetRect))
			{
				this.#view?.showStep(step);

				return;
			}

			this.#targetRef = targetRef;
			this.#view?.showStep(step, targetRect);
		}

		/**
		 * Measures a target without touching the popup: a spotlight of its own, which is never shown, so
		 * the answer costs the hint on the screen nothing. An answer the ear cannot use is asked again a
		 * moment later - the rail the target sits on has just moved, and both the missing spotlight and
		 * the rect of a tab mid-slide settle by themselves.
		 *
		 * @param {string} targetRef
		 * @param {number} [attemptsLeft]
		 * @return {Promise<MeasuredTargetRect>}
		 */
		static async #measureTarget(targetRef, attemptsLeft = MEASURE_ATTEMPTS)
		{
			const probe = new HintSpotlight(targetRef);
			const targetRect = probe.isCreated ? await probe.setTargetAsync() : {};

			if (OnboardingHint.#isTargetOnScreen(targetRect) || attemptsLeft <= 1)
			{
				return targetRect;
			}

			await OnboardingHint.#wait(MEASURE_RETRY_DELAY);

			return OnboardingHint.#measureTarget(targetRef, attemptsLeft - 1);
		}

		/**
		 * @param {number} ms
		 * @return {Promise<void>}
		 */
		static #wait(ms)
		{
			return new Promise((resolve) => {
				setTimeout(resolve, ms);
			});
		}

		/**
		 * The rail of tabs scrolls, and only what it shows can be pointed at. A tab it does not carry at
		 * all measures to nothing; a tab scrolled past the edge measures to a rect outside the screen,
		 * and the ear, clamped to the edge of the popup, would end up on whatever tab stands there. Both
		 * are «no target» for the hint.
		 *
		 * @param {?MeasuredTargetRect} targetRect
		 * @return {boolean}
		 */
		static #isTargetOnScreen(targetRect)
		{
			if (!Type.isNumber(targetRect?.x))
			{
				return false;
			}

			const width = Type.isNumber(targetRect.width) ? targetRect.width : 0;
			const center = targetRect.x + (width / 2);

			return center >= 0 && center <= device.screen.width;
		}

		hide()
		{
			this.#isDismissed = true;
			this.#clearShowTimer();
			this.#spotlight?.hide();
		}

		#start()
		{
			const { delay = 0 } = this.props;

			if (delay <= 0)
			{
				void this.#show();

				return;
			}

			this.#showTimer = setTimeout(() => {
				this.#showTimer = null;
				void this.#show();
			}, delay);
		}

		/**
		 * Measuring the target is up to the native side, and the ear is laid out against the measured
		 * rect, so everything past that point happens a tick later - late enough for the consumer to
		 * have taken the hint down before it ever reached the screen. The answer of canShow is awaited
		 * as well, and a hint taken down while waiting for it neither shows nor reports.
		 */
		async #show()
		{
			const { targetRef, canShow, onShowSkipped } = this.props;

			if (canShow)
			{
				let isAllowed = false;

				try
				{
					isAllowed = await canShow();
				}
				catch (error)
				{
					if (!this.#isDismissed)
					{
						onShowSkipped?.(error);
					}

					return;
				}

				if (this.#isDismissed)
				{
					return;
				}

				if (!isAllowed)
				{
					onShowSkipped?.();

					return;
				}
			}

			const spotlight = new HintSpotlight(targetRef);

			this.#targetRef = targetRef;

			// a wrapper without a native instance throws on every call, so nothing of it is kept
			if (!spotlight.isCreated)
			{
				onShowSkipped?.(new Error('OnboardingHint: unable to create spotlight'));

				return;
			}

			let targetRect = null;

			try
			{
				targetRect = await spotlight.setTargetAsync();
			}
			catch (error)
			{
				onShowSkipped?.(error);

				return;
			}

			if (this.#isDismissed)
			{
				return;
			}

			try
			{
				this.#view = this.#createView(targetRect);
				spotlight.setHandler(this.#handleSpotlightEvent);
				spotlight.setComponent(this.#view);
				this.#spotlight = spotlight;
				spotlight.show();
			}
			catch (error)
			{
				this.#view = null;
				this.#spotlight = null;
				onShowSkipped?.(error);
			}
		}

		/**
		 * @param {MeasuredTargetRect} targetRect
		 * @return {OnboardingHintView}
		 */
		#createView(targetRect)
		{
			const { testId, steps, onAction } = this.props;

			return new OnboardingHintView({
				testId,
				steps,
				targetRect,
				onAction,
				onClose: this.#handleClose,
				onMeasureFailed: this.#handleMeasureFailed,
			});
		}

		// the cross always takes the popup down, whatever the consumer makes of the report
		#handleClose = () => {
			this.hide();
			this.props.onClose?.();
		};

		// a popup that never got measured stays transparent while the overlay takes the touches: no show
		#handleMeasureFailed = () => {
			if (this.#isDismissed)
			{
				return;
			}

			this.hide();
			this.props.onShowSkipped?.(new Error('OnboardingHint: the popup was never measured on the screen'));
		};

		/**
		 * @param {SpotlightHandlersType} eventName
		 */
		#handleSpotlightEvent = (eventName) => {
			if (eventName === HIDE_EVENT)
			{
				this.props.onHide?.();
			}
		};

		#clearShowTimer()
		{
			if (this.#showTimer)
			{
				clearTimeout(this.#showTimer);
				this.#showTimer = null;
			}
		}
	}

	module.exports = {
		OnboardingHint,
	};
});
