/**
 * @module ui-system/popups/aha-moment
 */
jn.define('ui-system/popups/aha-moment', (require, exports, module) => {
	const { Hint } = require('ui-system/popups/aha-moment/src/hint');
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
	 * @class AhaMoment
	 * @param {object} props
	 * @return AhaMoment
	 */
	class AhaMoment
	{
		static isShown = false;

		#autoCloseTimer = null;

		/**
		 * @public
		 * @param {object} props
		 * @param {number} props.testId
		 * @param {object} props.targetRef
		 * @param {boolean} [props.disableHideByOutsideClick=true]
		 * @param {object} [props.analyticsLabel]
		 * @param {string} [props.bottomButtonType]
		 * @param {object} [props.spotlightParams]
		 * @param {string} [props.title]
		 * @param {string} [props.description]
		 * @param {boolean} [props.closeButton=true]
		 * @param {function} [props.onClose]
		 * @param {function} [props.onClick]
		 * @param {function} [props.onHide]
		 * @param {number} [props.fadeInDuration=10]
		 * @param {object} [props.image]
		 * @param {number} [props.image.size=78]
		 * @param {delay} [props.delay = 0]
		 * @param {number} [props.autoCloseDelay = 0]
		 */
		static show(props)
		{
			const {
				targetRef,
				delay = 0,
			} = props;

			if (!targetRef || !momentsEnabled)
			{
				return;
			}

			const controller = new AhaMoment({});

			if (delay > 0)
			{
				setTimeout(() => {
					controller.#showSpotlight(props);
				}, delay);

				return;
			}

			controller.#showSpotlight(props);
		}

		#showSpotlight(props)
		{
			const spotlight = new Spotlight(props.targetRef, props);
			const targetParams = spotlight.setTarget(props.targetParams);

			const component = this.#createAhaMoment(props, spotlight, targetParams);

			if (!AhaMoment.isShown)
			{
				AhaMoment.isShown = true;
				spotlight.show();
			}

			component.sendAnalytics({
				event: 'show',
			});

			if (props.onShow)
			{
				props.onShow();
			}
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

		sendAnalytics(params)
		{
			const { analyticsLabel } = this.props;

			if (!analyticsLabel)
			{
				console.warn(
					'\'c_section\', \'c_sub_section\' and \'p1\' for analyticsLabel in AhaMoment is not provided');

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
				event: 'сlick_button',
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
			AhaMoment.isShown = false;
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
			const { spotlightRef, onClick, bottomButtonType } = this.props;

			if (spotlightRef)
			{
				this.closeSpotlight();

				if (onClick)
				{
					onClick();
				}

				if (!bottomButtonType)
				{
					console.warn('\'bottomButtonType\' for AhaMoment is not provided');
				}

				this.#sendButtonClickAnalytics(bottomButtonType);
			}
		};
	}

	AhaMoment.defaultProps = {
		title: null,
		description: null,
		buttonText: null,
		closeButton: true,
		onClick: null,
		onClose: null,
		onHide: null,
		image: null,
		delay: 0,
		autoCloseDelay: 0,
		spotlightParams: {},
	};

	AhaMoment.propTypes = {
		testId: PropTypes.string.isRequired,
		title: PropTypes.string,
		description: PropTypes.string,
		buttonText: PropTypes.string,
		image: PropTypes.object,
		closeButton: PropTypes.bool,
		disableHideByOutsideClick: PropTypes.bool,
		onClick: PropTypes.func,
		onClose: PropTypes.func,
		onHide: PropTypes.func,
		delay: PropTypes.number,
		autoCloseDelay: PropTypes.number,
		spotlightParams: PropTypes.object,
	};

	module.exports = {
		AhaMoment,
		ButtonType,
	};
});
