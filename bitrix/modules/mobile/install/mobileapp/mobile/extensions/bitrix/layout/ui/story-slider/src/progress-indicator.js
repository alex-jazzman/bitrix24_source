/**
 * @module layout/ui/story-slider/src/progress-indicator
 */
jn.define('layout/ui/story-slider/src/progress-indicator', (require, exports, module) => {
	const { Color } = require('tokens');
	const { Animated } = require('animation/animated');
	const { PropTypes } = require('utils/validation');

	const INDICATOR_GAP = 8;
	const INDICATOR_HEIGHT = 3;
	const INDICATOR_INACTIVE_OPACITY = 0.3;

	/**
	 * @class ProgressIndicator
	 */
	class ProgressIndicator extends LayoutComponent
	{
		#animatedValues = [];
		#animations = [];
		#isPaused = false;
		#pausedValue = 0;

		constructor(props)
		{
			super(props);

			this.#initAnimations();
		}

		get slideCount()
		{
			const { slideCount } = this.props;

			return slideCount;
		}

		get currentSlideIndex()
		{
			const { currentSlideIndex } = this.props;

			return currentSlideIndex || 0;
		}

		get position()
		{
			const { position } = this.props;

			return {
				top: position?.top || 0,
				horizontal: position?.horizontal || 0,
			};
		}

		#initAnimations()
		{
			for (let i = 0; i < this.slideCount; i++)
			{
				this.#initAnimationAtIndex(i);
			}
		}

		#initAnimationAtIndex(index)
		{
			this.#animatedValues[index] = Animated.newCalculatedValue(0);
			this.#animations[index] = this.#createAnimation(index);
		}

		#createAnimation(index)
		{
			const { slideDuration } = this.props;

			return Animated.timing(this.#animatedValues[index], {
				toValue: 1,
				duration: slideDuration,
			});
		}

		componentWillReceiveProps(newProps)
		{
			const { currentSlideIndex } = this.props;

			const oldIndex = currentSlideIndex || 0;
			const newIndex = newProps.currentSlideIndex || 0;

			if (oldIndex !== newIndex)
			{
				this.#isPaused = false;
				this.#pausedValue = 0;

				const isBackwardNavigation = newIndex < oldIndex;

				if (isBackwardNavigation)
				{
					this.#resetAnimationsAfterIndex(newIndex);
					this.#startAnimation(newIndex);
				}
				else
				{
					this.#completeAnimationsBeforeIndex(newIndex);
					this.#stopAnimationAtIndex(oldIndex);
					this.#startAnimation(newIndex);
				}
			}
		}

		startAutoProgress()
		{
			this.#startAnimation(this.currentSlideIndex);
		}

		stopAutoProgress()
		{
			this.#stopAnimationAtIndex(this.currentSlideIndex);
		}

		pauseAutoProgress()
		{
			if (this.#isPaused)
			{
				return;
			}

			this.#isPaused = true;
			const currentIndex = this.currentSlideIndex;
			const animation = this.#animations[currentIndex];
			const animatedValue = this.#animatedValues[currentIndex];

			if (animation && animatedValue)
			{
				animation.stop();
				this.#pausedValue = animatedValue.getValue();
			}
		}

		resumeAutoProgress()
		{
			if (!this.#isPaused)
			{
				return;
			}

			this.#isPaused = false;
			const currentIndex = this.currentSlideIndex;

			const { slideDuration, onSlideComplete } = this.props;
			const remainingProgress = 1 - this.#pausedValue;
			const remainingDuration = slideDuration * remainingProgress;

			if (remainingDuration > 0)
			{
				this.#animations[currentIndex] = Animated.timing(
					this.#animatedValues[currentIndex],
					{
						toValue: 1,
						duration: remainingDuration,
					},
				);

				this.#animations[currentIndex].start(
					() => {
						onSlideComplete?.();
					},
				);
			}
			else
			{
				onSlideComplete?.();
			}
		}

		#completeAnimationsBeforeIndex(index)
		{
			for (let i = 0; i < index; i++)
			{
				const animation = this.#animations[i];
				if (animation)
				{
					animation.stop();
					this.#animatedValues[i].setValue(1);
				}
			}
		}

		#stopAnimationAtIndex(index)
		{
			const animation = this.#animations[index];
			if (animation)
			{
				animation.stop();
			}
		}

		#resetAnimationsAfterIndex(index)
		{
			for (let i = index; i < this.slideCount; i++)
			{
				const animation = this.#animations[i];
				if (animation)
				{
					animation.stop();
				}

				this.#initAnimationAtIndex(i);
			}
		}

		#startAnimation(index)
		{
			const animation = this.#animations[index];
			if (animation)
			{
				const { onSlideComplete } = this.props;
				animation.start(() => {
					onSlideComplete?.();
				});
			}
		}

		render()
		{
			const { testId } = this.props;
			const { top, horizontal } = this.position;
			const indicatorWidth = this.getIndicatorWidth();
			const baseTestId = `${testId}-progress-indicator`;

			return View(
				{
					testId: baseTestId,
					style: {
						position: 'absolute',
						top,
						left: horizontal,
						right: horizontal,
						flexDirection: 'row',
					},
				},
				...Array.from({
					length: this.slideCount,
				}).map((_, index) => View(
					{
						testId: `${baseTestId}-item-${index}-container`,
						style: {
							width: indicatorWidth,
							height: INDICATOR_HEIGHT,
							backgroundColor: Color.baseWhiteFixed.toHex(INDICATOR_INACTIVE_OPACITY),
							marginRight: index < this.slideCount - 1 ? INDICATOR_GAP : 0,
							overflow: 'hidden',
						},
					},
					View({
						testId: `${baseTestId}-item-${index}-progress`,
						style: {
							width: index < this.currentSlideIndex
								? indicatorWidth
								: this.#animatedValues[index].interpolate(
									{
										inputRange: [0, 1],
										outputRange: [0, indicatorWidth],
									},
								),
							height: INDICATOR_HEIGHT,
							backgroundColor: Color.baseWhiteFixed.toHex(),
						},
					}),
				)),
			);
		}

		getIndicatorWidth()
		{
			const { width } = this.props;
			const { horizontal } = this.position;

			const baseWidth = width || device.screen.width;
			const totalHorizontalOffset = horizontal * 2;
			const totalGaps = (this.slideCount - 1) * INDICATOR_GAP;

			return (baseWidth - totalHorizontalOffset - totalGaps) / this.slideCount;
		}
	}

	ProgressIndicator.propTypes = {
		width: PropTypes.number,
		testId: PropTypes.string.isRequired,
		position: PropTypes.shape({
			top: PropTypes.number.isRequired,
			horizontal: PropTypes.number.isRequired,
		}).isRequired,
		slideCount: PropTypes.number.isRequired,
		currentSlideIndex: PropTypes.number,
		slideDuration: PropTypes.number,
		onSlideComplete: PropTypes.func,
	};

	ProgressIndicator.defaultProps = {
		currentSlideIndex: 0,
		slideDuration: 10,
	};

	module.exports = {
		ProgressIndicator,
	};
});
