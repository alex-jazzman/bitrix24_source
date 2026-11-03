/**
 * @module im/messenger/lib/promotion/src/hint/onboarding-hint-view
 */
jn.define('im/messenger/lib/promotion/src/hint/onboarding-hint-view', (require, exports, module) => {
	const { Color, Component, Indent } = require('tokens');
	const { PureComponent } = require('layout/pure-component');
	const { H4 } = require('ui-system/typography/heading');
	const { Text4 } = require('ui-system/typography/text');
	const { Icon, IconView } = require('ui-system/blocks/icon');
	const { Button, ButtonDesign, ButtonSize } = require('ui-system/form/buttons/button');
	const { createTestIdGenerator } = require('utils/test');
	const { getLoggerWithContext } = require('im/messenger/lib/logger');

	const logger = getLoggerWithContext('promotion', 'OnboardingHintView');

	const EAR_SIZE = {
		width: 24,
		height: 10,
	};
	// the ear stands one point inside the bubble, so the seam of the two shapes is not drawn
	const EAR_OVERLAP = 1;
	// the edge of the popup the ear stands on, as the native side reports it with the measured target
	const EarPosition = Object.freeze({
		TOP: 'top',
		BOTTOM: 'bottom',
	});
	const EAR_SVG = {
		[EarPosition.TOP]: (color) => `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="10" viewBox="0 0 24 10" fill="none"><path d="M-3.8147e-06 10L7.75736 2.24264C10.1005 -0.100503 13.8995 -0.100506 16.2426 2.24264L24 10L-3.8147e-06 10Z" fill="${color}"/></svg>`,
		[EarPosition.BOTTOM]: (color) => `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="10" viewBox="0 0 24 10" fill="none"><path d="M24 0L16.2426 7.75736C13.8995 10.1005 10.1005 10.1005 7.75736 7.75736L0 0H24Z" fill="${color}"/></svg>`,
	};

	// the illustrations keep the 3:4 aspect of the mock, and the column is the image itself: no
	// padding and no backing of its own
	const IMAGE_SIZE = {
		width: 78,
		height: 104,
	};

	const CLOSE_SIZE = 28;
	const CLOSE_OPACITY = 0.6;
	const DESCRIPTION_OPACITY = 0.82;
	const POPUP_SHADOW = {
		radius: 24,
		offsetY: 20,
		opacity: 0.12,
	};

	// the spotlight puts the popup into the window only after its fade-in, and again after every re-show
	const MEASURE_ATTEMPTS = 30;
	const MEASURE_RETRY_DELAY = 100;

	/**
	 * Body of the multi-step onboarding hint: the popup with the ear pointing at the target. The step
	 * lives in the state, so moving between the steps only redraws the content - the popup itself
	 * stays on the screen.
	 *
	 * @extends {PureComponent<OnboardingHintViewProps, OnboardingHintViewState>}
	 */
	class OnboardingHintView extends PureComponent
	{
		#ref = null;

		#bubbleRef = null;

		// the wrapper reports its layout without the size of the bubble, and by then the state may not hold
		// the height the bubble has just reported
		#bubbleHeight = null;

		#measureTimer = null;

		/**
		 * @param {OnboardingHintViewProps} props
		 */
		constructor(props)
		{
			super(props);

			this.getTestId = createTestIdGenerator({ context: this });
			this.state = {
				step: 1,
				popupX: null,
				bubbleTop: null,
				bubbleHeight: null,
				targetRect: props.targetRect,
			};
		}

		/**
		 * The content of the step and the target its ear points at arrive together, in ONE update: the
		 * native side re-shows the popup whenever its geometry changes, and two updates per step read as
		 * a blink. The popup itself is nearly the width of the screen and stays where it stands - what
		 * moves is the ear.
		 *
		 * @param {number} step
		 * @param {?MeasuredTargetRect} [targetRect] the target of the step; the current one by default
		 */
		showStep(step, targetRect = null)
		{
			this.setState(targetRect ? { step, targetRect } : { step });
		}

		componentWillUnmount()
		{
			this.#clearMeasureTimer();
		}

		render()
		{
			const earRoom = EAR_SIZE.height - EAR_OVERLAP;
			const isEarAtBottom = this.#isEarAtBottom();

			return View(
				{
					ref: (ref) => {
						if (ref)
						{
							this.#ref = ref;
						}
					},
					onLayout: this.#handleLayout,
					style: {
						width: this.#getPopupWidth(),
						paddingTop: isEarAtBottom ? 0 : earRoom,
						paddingBottom: isEarAtBottom ? earRoom : 0,
						// until the popup is measured the ear has nothing to point at, and a hint whose
						// ear jumps into place is worse than one that appears whole
						opacity: this.#isMeasured() ? 1 : 0,
					},
				},
				this.#renderPopup(),
				this.#renderEar(),
			);
		}

		#renderEar()
		{
			const color = this.#getBackgroundColor();

			return Image({
				testId: this.getTestId('ear'),
				style: {
					position: 'absolute',
					top: this.#getEarTop(),
					left: this.#getEarLeft(),
					...EAR_SIZE,
				},
				resizeMode: 'contain',
				tintColor: color,
				svg: {
					content: EAR_SVG[this.#getEarPosition()](color),
				},
			});
		}

		#renderPopup()
		{
			const cornerRadius = Component.popupCorner.toNumber();

			return Shadow(
				{
					radius: POPUP_SHADOW.radius,
					color: Color.baseBlackFixed.toHex(POPUP_SHADOW.opacity),
					offset: {
						x: 0,
						y: POPUP_SHADOW.offsetY,
					},
					inset: {
						top: 0,
						right: 0,
						bottom: 0,
						left: 0,
					},
					style: {
						borderRadius: cornerRadius,
					},
				},
				View(
					{
						ref: (ref) => {
							if (ref)
							{
								this.#bubbleRef = ref;
							}
						},
						onLayout: this.#handleBubbleLayout,
						testId: this.getTestId(),
						style: {
							position: 'relative',
							padding: Indent.XL.toNumber(),
							borderRadius: cornerRadius,
							backgroundColor: this.#getBackgroundColor(),
						},
					},
					View(
						{
							style: {
								flexDirection: 'row',
								alignItems: 'flex-start',
							},
						},
						this.#renderImage(),
						this.#renderBody(),
					),
					this.#renderCloseButton(),
				),
			);
		}

		#renderImage()
		{
			const { imageUrl } = this.#getStep();

			return Image({
				uri: imageUrl,
				style: {
					...IMAGE_SIZE,
					marginRight: Indent.L.toNumber(),
				},
				resizeMode: 'contain',
				onFailure: (error) => logger.error('renderImage:', error),
			});
		}

		#renderBody()
		{
			const { title, description } = this.#getStep();

			return View(
				{
					style: {
						flex: 1,
						alignItems: 'flex-start',
						paddingRight: Indent.L.toNumber(),
					},
				},
				H4({
					testId: this.getTestId('title'),
					text: title,
					color: Color.baseWhiteFixed,
				}),
				Text4({
					testId: this.getTestId('description'),
					text: description,
					style: {
						// the mock dims the description, and the opacity belongs to the colour rather
						// than to the view - a token carries it only through a style
						color: Color.baseWhiteFixed.toHex(DESCRIPTION_OPACITY),
						marginTop: Indent.S.toNumber(),
					},
				}),
				this.#renderActionButton(),
			);
		}

		#renderActionButton()
		{
			const { step } = this.state;
			const { buttonText } = this.#getStep();

			return Button({
				testId: this.getTestId('action-button'),
				text: buttonText,
				size: ButtonSize.S,
				design: ButtonDesign.OUTLINE,
				color: Color.baseWhiteFixed,
				borderColor: Color.baseWhiteFixed,
				stretched: false,
				// the handler carries the step it was drawn for, not the one the state holds now: the
				// second tap of a double tap reaches a button the native side has not redrawn yet, and
				// answering it with the current step would hand two steps over at once
				onClick: () => this.props.onAction(step),
				style: {
					marginTop: Indent.S.toNumber() + Indent.XS.toNumber(),
				},
			});
		}

		#renderCloseButton()
		{
			return IconView({
				testId: this.getTestId('close'),
				icon: Icon.CROSS,
				color: Color.baseWhiteFixed,
				opacity: CLOSE_OPACITY,
				size: CLOSE_SIZE,
				style: {
					position: 'absolute',
					top: Indent.S.toNumber(),
					right: Indent.S.toNumber(),
				},
				onClick: () => this.props.onClose(),
			});
		}

		#handleBubbleLayout = (layout) => {
			this.#bubbleHeight = layout?.height ?? null;
			this.#handleLayout();
		};

		#handleLayout = () => {
			this.#clearMeasureTimer();
			this.#measure(MEASURE_ATTEMPTS);
		};

		/**
		 * The layout is reported before the popup reaches the window, and a view out of the window has no
		 * absolute position. An unchanged layout is not reported again, so the popup is measured once more
		 * a moment later: an unmeasured popup stays transparent, and one that never gets measured is
		 * reported upwards.
		 *
		 * @param {number} attemptsLeft
		 */
		#measure(attemptsLeft)
		{
			const popupRect = this.#ref?.getAbsolutePosition();
			const bubbleRect = this.#bubbleRef?.getAbsolutePosition();

			if (!popupRect || !bubbleRect)
			{
				if (attemptsLeft > 1)
				{
					this.#measureTimer = setTimeout(() => {
						this.#measureTimer = null;
						this.#measure(attemptsLeft - 1);
					}, MEASURE_RETRY_DELAY);
				}
				else if (!this.#isMeasured())
				{
					this.props.onMeasureFailed?.();
				}

				return;
			}

			const bubbleTop = bubbleRect.y - popupRect.y;
			const bubbleHeight = this.#bubbleHeight;
			const { popupX, bubbleTop: currentBubbleTop, bubbleHeight: currentBubbleHeight } = this.state;

			if (popupRect.x === popupX && bubbleTop === currentBubbleTop && bubbleHeight === currentBubbleHeight)
			{
				return;
			}

			this.setState({ popupX: popupRect.x, bubbleTop, bubbleHeight });
		}

		#clearMeasureTimer()
		{
			if (this.#measureTimer)
			{
				clearTimeout(this.#measureTimer);
				this.#measureTimer = null;
			}
		}

		/**
		 * The shadow reserves room of its own around the bubble, so the bubble starts lower than the
		 * padding of the wrapper says. The ear is measured against the bubble itself: the native side clips
		 * whatever sticks out of the bubble box, so the ear cannot live inside it. An ear at the bottom hangs
		 * from the lower edge of the bubble, hence the height of the bubble.
		 *
		 * @return {number}
		 */
		#getEarTop()
		{
			if (this.#isEarAtBottom())
			{
				return (this.state.bubbleTop ?? 0) + (this.state.bubbleHeight ?? 0) - EAR_OVERLAP;
			}

			const bubbleTop = this.state.bubbleTop ?? (EAR_SIZE.height - EAR_OVERLAP);

			return bubbleTop - EAR_SIZE.height + EAR_OVERLAP;
		}

		/**
		 * @return {'top'|'bottom'}
		 */
		#getEarPosition()
		{
			return this.state.targetRect?.position === EarPosition.BOTTOM ? EarPosition.BOTTOM : EarPosition.TOP;
		}

		#isEarAtBottom()
		{
			return this.#getEarPosition() === EarPosition.BOTTOM;
		}

		#getEarLeft()
		{
			const targetRect = this.state.targetRect ?? {};
			const { x: targetX = 0, width: targetWidth = 0 } = targetRect;
			const popupX = this.state.popupX ?? 0;

			return this.#clampEarLeft(
				Math.round(targetX - popupX + (targetWidth / 2) - (EAR_SIZE.width / 2)),
			);
		}

		/**
		 * The ear has to stand on the straight part of the popup edge: beyond the corner radius its base
		 * lies on the rounding. Only a target close to the screen edge gets clamped - for the rest the
		 * centered position already fits.
		 *
		 * @param {number} left
		 * @return {number}
		 */
		#clampEarLeft(left)
		{
			const minLeft = Component.popupCorner.toNumber();
			const maxLeft = this.#getPopupWidth() - minLeft - EAR_SIZE.width;

			return Math.min(Math.max(left, minLeft), maxLeft);
		}

		#getPopupWidth()
		{
			return device.screen.width - (2 * Indent.XL3.toNumber());
		}

		#isMeasured()
		{
			const { popupX, bubbleTop, bubbleHeight } = this.state;
			const isBubbleEdgeMeasured = bubbleTop !== null && (!this.#isEarAtBottom() || bubbleHeight !== null);

			return popupX !== null && isBubbleEdgeMeasured;
		}

		/**
		 * @return {OnboardingHintStep}
		 */
		#getStep()
		{
			const { steps } = this.props;

			return steps[this.state.step - 1];
		}

		#getBackgroundColor()
		{
			return Color.bgContentInapp.toHex();
		}
	}

	module.exports = {
		OnboardingHintView,
	};
});
