/**
 * @module layout/ui/story-slider/src/slider
 */
jn.define('layout/ui/story-slider/src/slider', (require, exports, module) => {
	const { Type } = require('type');
	const { Component, Color } = require('tokens');
	const { IconView, Icon } = require('ui-system/blocks/icon');
	const { SwipeSlider } = require('ui-system/layout/swipe-slider');
	const { ProgressIndicator } = require('layout/ui/story-slider/src/progress-indicator');
	const { PropTypes } = require('utils/validation');

	const INTERNAL_POSITION = {
		top: 62,
		horizontal: 30,
	};

	const CLICK_ZONE = {
		PREV: 'prev',
		NEXT: 'next',
	};

	const DEFAULT_CLICKABLE_INSETS = {
		top: 0,
		right: 0,
		bottom: 0,
		left: 0,
	};

	const TOUCH_PAUSE_THRESHOLD = 200;
	const SWIPE_DOWN_THRESHOLD = 100;
	const SWIPE_VELOCITY_THRESHOLD = 0.3;

	/**
	 * @class Slider
	 * @property {string} testId
	 * @property {Array} slides
	 * @property {ElementStyle} style
	 * @property {number} [slideDuration]
	 * @property {boolean} [swipeToClose]
	 * @property {Function} [forwardRef]
	 * @property {Function} [onClose]
	 * @property {Function} [onClick]
	 * @property {Function} [onSlideViewed]
	 * @property {Object} [position]
	 * @property {Object} [clickableInsets]
	 * @property {number} [clickableInsets.top]
	 * @property {number} [clickableInsets.right]
	 * @property {number} [clickableInsets.bottom]
	 * @property {number} [clickableInsets.left]
	 */
	class Slider extends LayoutComponent
	{
		#swipeSliderRef = null;
		#progressIndicatorRef = null;
		#touchStartTime = 0;
		#touchStartY = 0;
		#isDragging = false;

		constructor(props)
		{
			super(props);

			this.state = {
				currentSlideIndex: 0,
			};
		}

		get testId()
		{
			const { testId } = this.props;

			return testId;
		}

		get currentSlideIndex()
		{
			return this.state.currentSlideIndex;
		}

		#isSwipeToCloseEnabled()
		{
			const { swipeToClose } = this.props;

			return swipeToClose ?? true;
		}

		componentDidMount()
		{
			this.#handleOnSlideViewed(this.currentSlideIndex);
			this.#progressIndicatorRef?.startAutoProgress();
		}

		componentWillUnmount()
		{
			this.#progressIndicatorRef?.stopAutoProgress();
		}

		pauseAutoProgress()
		{
			this.#progressIndicatorRef?.pauseAutoProgress();
		}

		resumeAutoProgress()
		{
			this.#progressIndicatorRef?.resumeAutoProgress();
		}

		render()
		{
			const { container } = this.props;

			const containerProps = {
				testId: `${this.testId}-container`,
				style: {
					flex: 1,
				},
			};

			if (container)
			{
				return container(this.#renderBody(), containerProps);
			}

			return View(
				containerProps,
				this.#renderBody(),
			);
		}

		#renderBody()
		{
			const { style } = this.props;

			return View(
				{
					style,
				},
				this.#renderSwipeSlider(),
				this.#renderClickableOverlay(),
				this.#renderCloseButton(),
				this.#renderProgressIndicator(),
			);
		}

		#renderClickableOverlay()
		{
			const insets = this.#getClickableInsets();

			return View(
				{
					testId: `${this.testId}-clickable-overlay`,
					style: {
						position: 'absolute',
						top: insets.top,
						left: insets.left,
						right: insets.right,
						bottom: insets.bottom,
						flexDirection: 'row',
						zIndex: 1,
					},
				},
				View({
					testId: `${this.testId}-left-zone`,
					style: {
						flex: 1,
					},
					onClick: () => this.#handleZoneClick(CLICK_ZONE.PREV),
					onTouchesBegan: this.#handleTouchStart,
					onTouchesMoved: this.#handleTouchMove,
					onTouchesEnded: this.#handleTouchEnd,
				}),
				View({
					testId: `${this.testId}-right-zone`,
					style: {
						flex: 1,
					},
					onClick: () => this.#handleZoneClick(CLICK_ZONE.NEXT),
					onTouchesBegan: this.#handleTouchStart,
					onTouchesMoved: this.#handleTouchMove,
					onTouchesEnded: this.#handleTouchEnd,
				}),
			);
		}

		#renderCloseButton()
		{
			const { horizontal, top } = this.#getPositionOffset();

			return View(
				{
					testId: `${this.testId}-close-button`,
					style: {
						width: 32,
						height: 32,
						position: 'absolute',
						top: top + 20,
						right: horizontal,
						justifyContent: 'center',
						backgroundColor: Color.base6.toHex(0.4),
						borderRadius: Component.elementAccentCorner.toNumber(),
						zIndex: 3,
					},
				},
				IconView({
					icon: Icon.CROSS,
					size: 22,
					style: {
						alignSelf: 'center',
					},
					color: Color.baseWhiteFixed,
					onClick: this.#closeSlider,
				}),
			);
		}

		#renderProgressIndicator()
		{
			const { style } = this.props;
			const width = style?.width || style?.maxWidth;

			return new ProgressIndicator({
				ref: (ref) => {
					this.#progressIndicatorRef = ref;
				},
				width,
				position: this.#getPositionOffset(),
				currentSlideIndex: this.currentSlideIndex,
				testId: this.testId,
				slideCount: this.#getSlideCount(),
				slideDuration: this.#getSlideDuration(),
				onSlideComplete: this.#onSlideComplete,
			});
		}

		#renderSwipeSlider()
		{
			return SwipeSlider({
				forwardRef: (ref) => {
					this.#handleOnForwardRef(ref);

					this.#swipeSliderRef = ref;
				},
				style: {
					height: '100%',
				},
				pageIndex: this.currentSlideIndex,
				testId: this.testId,
				children: this.#getSlides(),
				onPageChange: this.#onPageChange,
			});
		}

		#handleOnForwardRef = (ref) => {
			const { forwardRef } = this.props;

			if (forwardRef)
			{
				forwardRef(ref);
			}
		};

		#onPageChange = (index) => {
			this.setState(
				{ currentSlideIndex: index },
				() => {
					this.#handleOnSlideViewed(index);
				},
			);
		};

		#onSlideComplete = () => {
			const isLastSlide = this.currentSlideIndex >= this.#getSlideCount() - 1;

			if (isLastSlide)
			{
				this.#closeSlider();
			}
			else if (this.#swipeSliderRef)
			{
				this.#swipeSliderRef.nextSlide();
			}
		};

		#handleZoneClick = (type) => {
			if (this.#wasTouchPaused())
			{
				this.#touchStartTime = 0;

				return;
			}

			const { onClick } = this.props;

			onClick?.(type);

			if (this.#swipeSliderRef)
			{
				if (type === CLICK_ZONE.PREV)
				{
					this.#swipeSliderRef.prevSlide();
				}
				else if (type === CLICK_ZONE.NEXT)
				{
					this.#swipeSliderRef.nextSlide();
				}
			}
		};

		#handleTouchStart = ({ y }) => {
			this.#touchStartTime = Date.now();
			this.#touchStartY = y;
			this.#isDragging = false;
			this.pauseAutoProgress();
		};

		#handleTouchMove = ({ y }) => {
			if (!this.#isSwipeToCloseEnabled())
			{
				return;
			}

			const deltaY = y - this.#touchStartY;

			if (deltaY > SWIPE_DOWN_THRESHOLD)
			{
				this.#isDragging = true;
			}
		};

		#handleTouchEnd = ({ y }) => {
			if (!this.#isSwipeToCloseEnabled())
			{
				this.resumeAutoProgress();

				return;
			}

			const deltaY = y - this.#touchStartY;
			const touchDuration = Date.now() - this.#touchStartTime;
			const velocity = touchDuration > 0 ? deltaY / touchDuration : 0;
			const hasEnoughDistance = deltaY > SWIPE_DOWN_THRESHOLD;
			const hasEnoughVelocity = deltaY > 0 && velocity > SWIPE_VELOCITY_THRESHOLD;
			const isSwipeDown = hasEnoughDistance || hasEnoughVelocity;

			if (isSwipeDown && this.#isDragging)
			{
				this.#closeSlider();

				return;
			}

			this.resumeAutoProgress();
		};

		#wasTouchPaused()
		{
			const touchDuration = Date.now() - this.#touchStartTime;

			return touchDuration > TOUCH_PAUSE_THRESHOLD;
		}

		#closeSlider = () => {
			const { onClose } = this.props;

			onClose?.();
		};

		#getSlides()
		{
			const { slides } = this.props;

			return Array.isArray(slides) ? slides : [];
		}

		#getSlideDuration()
		{
			const { slideDuration } = this.props;

			return Type.isNumber(slideDuration) ? slideDuration : 10;
		}

		#getSlideCount()
		{
			return this.#getSlides().length;
		}

		#handleOnSlideViewed(index)
		{
			const { onSlideViewed } = this.props;

			onSlideViewed?.(index);
		}

		#getPositionOffset()
		{
			const { position } = this.props;

			return {
				top: position?.top ?? INTERNAL_POSITION.top,
				horizontal: position?.horizontal ?? INTERNAL_POSITION.horizontal,
			};
		}

		#getClickableInsets()
		{
			const { clickableInsets } = this.props;

			return {
				top: clickableInsets?.top ?? DEFAULT_CLICKABLE_INSETS.top,
				right: clickableInsets?.right ?? DEFAULT_CLICKABLE_INSETS.right,
				bottom: clickableInsets?.bottom ?? DEFAULT_CLICKABLE_INSETS.bottom,
				left: clickableInsets?.left ?? DEFAULT_CLICKABLE_INSETS.left,
			};
		}
	}

	Slider.propTypes = {
		testId: PropTypes.string.isRequired,
		slides: PropTypes.array.isRequired,
		slideDuration: PropTypes.number,
		swipeToClose: PropTypes.bool,
		close: PropTypes.func,
		onClick: PropTypes.func,
		onSlideViewed: PropTypes.func,
		position: PropTypes.object,
		clickableInsets: PropTypes.object,
	};

	Slider.defaultProps = {
		slideDuration: 10,
		swipeToClose: true,
	};

	module.exports = {
		Slider,
		sliderInternalPosition: INTERNAL_POSITION,
	};
});
