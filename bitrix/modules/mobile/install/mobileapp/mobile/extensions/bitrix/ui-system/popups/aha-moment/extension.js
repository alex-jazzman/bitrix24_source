/**
 * @module ui-system/popups/aha-moment
 */
jn.define('ui-system/popups/aha-moment', (require, exports, module) => {
	const { Hint } = require('ui-system/popups/aha-moment/src/hint');
	const { Icon } = require('ui-system/blocks/icon');
	const { PropTypes } = require('utils/validation');
	const { AnalyticsEvent } = require('analytics');
	const { Spotlight } = require('ui-system/popups/aha-moment/src/spotlight');

	const ButtonType = {
		CLOSE: 'close',
		GO_TO_FEATURE: 'go_to_feature',
	};

	const extensionData = jnExtensionData.get('ui-system/popups/aha-moment');
	const momentsEnabled = extensionData?.momentsEnabled;

	/**
	 * Handle over a moment that has already been asked for. Returned by AhaMoment.show(),
	 * so that a consumer can take the popup down on its own — a moment normally closes
	 * itself, through its own buttons, an outside click or autoCloseDelay.
	 *
	 * @typedef {object} AhaMomentController
	 * @property {function(): void} hide closes the spotlight; with a not yet elapsed delay
	 *   cancels the pending show instead
	 */

	/**
	 * @class AhaMoment
	 * @param {object} props
	 * @return AhaMoment
	 */
	class AhaMoment
	{
		static isShown = false;

		#autoCloseTimer = null;

		#showTimer = null;

		#component = null;

		#isDismissed = false;

		/**
		 * @public
		 * @param {object} props
		 * @param {number} props.testId
		 * @param {object} props.targetRef
		 * @param {boolean} [props.disableHideByOutsideClick=true]
		 * @param {object} [props.analyticsLabel] without it no analytics is sent at all
		 * @param {string} [props.bottomButtonType]
		 * @param {object} [props.targetParams] native target options, see Spotlight.setTargetAsync()
		 * @param {object} [props.spotlightParams]
		 * @param {string} [props.title]
		 * @param {string} [props.description]
		 * @param {string} [props.buttonText] renders the action button; the two props below apply only with it
		 * @param {Icon} [props.buttonIcon]
		 * @param {boolean} [props.buttonStretched=true]
		 * @param {boolean} [props.closeButton=true]
		 * @param {boolean} [props.closeOnClick=true] whether a tap on the action button closes the popup;
		 *   with false closing is up to the consumer, through the returned controller
		 * @param {boolean} [props.skipShownCheck=false] keeps the moment out of the AhaMoment.isShown
		 *   semaphore: it is neither read before the show nor raised by it. Meant for a functional popup
		 *   that must not block a real aha-moment from appearing over it. Such a consumer is expected
		 *   to read AhaMoment.isShown itself if it wants to yield to a moment already on screen.
		 * @param {function} [props.onClose]
		 * @param {function} [props.onClick]
		 * @param {function} [props.onTargetClick] called when the highlighted target is tapped
		 * @param {function} [props.onHide]
		 * @param {function} [props.onShow]
		 * @param {function} [props.onShowSkipped] called when the moment did not reach the screen:
		 *   without an argument when the show was declined up front — no target, moments disabled,
		 *   canShow said no, or another moment already holds the screen — and with an Error when the
		 *   native spotlight could not be created, measuring the target failed or the show itself threw.
		 *   Without this callback a moment blocked by the semaphore still burns: its analytics and
		 *   onShow fire while the native show() is dropped
		 * @param {function} [props.canShow] asked again right before the show, so a delayed moment
		 *   can still be declined
		 * @param {number} [props.fadeInDuration=10]
		 * @param {object} [props.image]
		 * @param {number} [props.image.size=78]
		 * @param {delay} [props.delay = 0]
		 * @param {number} [props.autoCloseDelay = 0]
		 * @return {AhaMomentController|null} null when there is nothing to show at all. The show
		 *   itself completes later — the target is measured by the native side — so its own
		 *   failure is reported through onShowSkipped rather than by this value
		 */
		static show(props)
		{
			const {
				targetRef,
				delay = 0,
				canShow,
			} = props;

			if (!targetRef || !momentsEnabled || (canShow && !canShow()))
			{
				props.onShowSkipped?.();

				return null;
			}

			const controller = new AhaMoment({});

			if (delay > 0)
			{
				controller.#scheduleShow(props, delay);
			}
			else
			{
				void controller.#showSpotlight(props);
			}

			return controller.#createController();
		}

		#scheduleShow(props, delay)
		{
			this.#showTimer = setTimeout(() => {
				this.#showTimer = null;
				void this.#showSpotlight(props);
			}, delay);
		}

		/**
		 * @return {AhaMomentController}
		 */
		#createController()
		{
			return {
				hide: () => {
					this.#isDismissed = true;
					this.#clearShowTimer();
					this.#component?.closeSpotlight();
				},
			};
		}

		#clearShowTimer()
		{
			if (this.#showTimer)
			{
				clearTimeout(this.#showTimer);
				this.#showTimer = null;
			}
		}

		/**
		 * Measuring the target is up to the native side, and the hint is laid out against the
		 * measured rect, so everything past that point happens a tick later — late enough for the
		 * controller to have hidden the moment before it ever reached the screen.
		 */
		async #showSpotlight(props)
		{
			const {
				targetRef,
				targetParams,
				skipShownCheck = false,
				canShow,
				onShow,
				onShowSkipped,
			} = props;

			if (canShow && !canShow())
			{
				onShowSkipped?.();

				return;
			}

			if (!skipShownCheck && AhaMoment.isShown && onShowSkipped)
			{
				onShowSkipped();

				return;
			}

			const spotlight = new Spotlight(targetRef, props);

			// A wrapper without a native instance throws on every call, so nothing of it is kept:
			// neither the component nor a semaphore raised for a popup that never appeared.
			if (!spotlight.isCreated)
			{
				onShowSkipped?.(new Error('AhaMoment: unable to create spotlight'));

				return;
			}

			let measuredTargetParams = null;

			try
			{
				measuredTargetParams = await spotlight.setTargetAsync(targetParams);
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

			let isShowStarted = false;

			try
			{
				this.#component = this.#createAhaMoment(props, spotlight, measuredTargetParams);

				if (skipShownCheck || !AhaMoment.isShown)
				{
					if (!skipShownCheck)
					{
						AhaMoment.isShown = true;
						isShowStarted = true;
					}

					spotlight.show();
				}
			}
			catch (error)
			{
				if (isShowStarted)
				{
					AhaMoment.isShown = false;
				}

				if (onShowSkipped)
				{
					onShowSkipped(error);

					return;
				}

				throw error;
			}

			this.#component.sendAnalytics({
				event: 'show',
			});

			onShow?.();
		}

		#createAhaMoment(props, spotlight, targetParams)
		{
			const {
				targetRef,
				spotlightParams = {},
				closeButton = true,
				buttonText,
				...restProps
			} = props;

			const component = new AhaMoment({
				...restProps,
				targetParams,
				closeButton,
				buttonText,
				spotlightRef: spotlight,
			});
			const hintComponent = Hint({
				...restProps,
				targetParams,
				closeButton,
				buttonText,
				onClose: component.handleOnClose,
				onClick: component.handleOnClick,
				progress: restProps.progress ?? null,
			});

			spotlight.setHandler(component.#eventHandler);
			spotlight.setComponent(hintComponent, {
				showPointer: false,
				pointerMargin: spotlightParams?.pointerMargin ?? 2,
				...spotlightParams,
			});

			return component;
		}

		constructor(props)
		{
			this.props = props;
			this.#setupAutoClose();
		}

		#setupAutoClose()
		{
			const { autoCloseDelay = 0 } = this.props;
			this.#clearAutoCloseTimer();

			if (autoCloseDelay > 0)
			{
				this.#autoCloseTimer = setTimeout(() => {
					this.closeSpotlight();
				}, autoCloseDelay);
			}
		}

		#clearAutoCloseTimer()
		{
			if (this.#autoCloseTimer)
			{
				clearTimeout(this.#autoCloseTimer);
				this.#autoCloseTimer = null;
			}
		}

		/**
		 * Analytics is opt-in: without analyticsLabel there is nothing to report it under,
		 * so nothing is sent.
		 */
		sendAnalytics(params)
		{
			const { analyticsLabel } = this.props;

			if (!analyticsLabel)
			{
				return;
			}

			new AnalyticsEvent({
				tool: 'intranet',
				category: 'aha',
				c_section: analyticsLabel.c_section,
				c_sub_section: analyticsLabel.c_sub_section,
				p1: analyticsLabel.p1,
				...params,
			}).send();
		}

		#sendButtonClickAnalytics(type)
		{
			this.sendAnalytics({
				event: 'click_button',
				type,
			});
		}

		/**
		 * @param {SpotlightHandlersType} eventName
		 */
		#eventHandler = (eventName) => {
			this[eventName]?.();
		};

		onHide()
		{
			if (!this.props.skipShownCheck)
			{
				AhaMoment.isShown = false;
			}

			this.#clearAutoCloseTimer();

			this.props.onHide?.();
		}

		onOutsideClick = () => {
			if (this.props.disableHideByOutsideClick)
			{
				return;
			}

			this.#sendButtonClickAnalytics(ButtonType.CLOSE);
		};

		onTargetClick = () => {
			const { onTargetClick } = this.props;
			if (!onTargetClick)
			{
				return;
			}

			this.closeSpotlight();
			onTargetClick();
		};

		closeSpotlight()
		{
			const { spotlightRef } = this.props;

			if (spotlightRef)
			{
				spotlightRef.hide();
			}
		}

		handleOnClose = () => {
			const { spotlightRef, onClose } = this.props;

			if (spotlightRef)
			{
				this.closeSpotlight();

				if (onClose)
				{
					onClose();
				}

				this.#sendButtonClickAnalytics(ButtonType.CLOSE);
			}
		};

		handleOnClick = () => {
			const { spotlightRef, onClick, bottomButtonType, closeOnClick = true } = this.props;

			if (!spotlightRef)
			{
				return;
			}

			if (closeOnClick)
			{
				this.closeSpotlight();
			}

			onClick?.();

			if (bottomButtonType)
			{
				this.#sendButtonClickAnalytics(bottomButtonType);
			}
		};
	}

	AhaMoment.defaultProps = {
		title: null,
		description: null,
		buttonText: null,
		buttonIcon: null,
		buttonStretched: true,
		closeButton: true,
		closeOnClick: true,
		skipShownCheck: false,
		onClick: null,
		onTargetClick: null,
		onClose: null,
		onHide: null,
		onShow: null,
		onShowSkipped: null,
		canShow: null,
		image: null,
		delay: 0,
		autoCloseDelay: 0,
		spotlightParams: {},
		progress: null,
	};

	AhaMoment.propTypes = {
		testId: PropTypes.string.isRequired,
		title: PropTypes.string,
		description: PropTypes.string,
		buttonText: PropTypes.string,
		buttonIcon: PropTypes.instanceOf(Icon),
		buttonStretched: PropTypes.bool,
		image: PropTypes.object,
		closeButton: PropTypes.bool,
		closeOnClick: PropTypes.bool,
		skipShownCheck: PropTypes.bool,
		disableHideByOutsideClick: PropTypes.bool,
		onClick: PropTypes.func,
		onTargetClick: PropTypes.func,
		onClose: PropTypes.func,
		onHide: PropTypes.func,
		onShow: PropTypes.func,
		onShowSkipped: PropTypes.func,
		canShow: PropTypes.func,
		delay: PropTypes.number,
		autoCloseDelay: PropTypes.number,
		spotlightParams: PropTypes.object,
		progress: PropTypes.object,
	};

	module.exports = {
		AhaMoment,
		ButtonType,
	};
});
