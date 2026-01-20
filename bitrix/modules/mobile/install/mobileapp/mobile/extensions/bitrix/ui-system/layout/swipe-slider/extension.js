/**
 * @module ui-system/layout/swipe-slider
 */
jn.define('ui-system/layout/swipe-slider', (require, exports, module) => {
	const { Color, Indent } = require('tokens');
	const { Animated } = require('animation/animated');
	const { createTestIdGenerator } = require('utils/test');
	const { SliderNavigationMode } = require('ui-system/layout/swipe-slider/src/navigation-mode-enum');
	const { IconView, Icon } = require('ui-system/blocks/icon');
	const { PropTypes } = require('utils/validation');

	const PAGE_INDICATOR_HEIGHT = 38;

	/**
	 * @typedef {Object} SwipeSliderProps
	 * @property {string} testId
	 * @property {Function} [forwardRef]
	 * @property {Array<LayoutComponent>} children
	 * @property {number} [contentHeight = 520]
	 * @property {function} [onPageChange]
	 * @property {function} [onPageWillChange]
	 * @property {number} [width]
	 * @property {number} [pageIndex=0]
	 * @property {Object} [style={}]
	 * @property {SliderNavigationMode} [navigationMode]

	 * @class SwipeSlider
	 */
	class SwipeSlider extends LayoutComponent
	{
		#sliderRef = null;
		#containerHeight = null;
		#navigationMode = null;

		constructor(props)
		{
			super(props);

			this.scrollOffset = Animated.newCalculatedValue2D(0, 0);
			this.scrollOffsetX = this.scrollOffset.getValue1();

			this.getTestId = createTestIdGenerator({
				context: this,
			});

			this.#initState(props);
		}

		componentWillReceiveProps(props)
		{
			this.#initState(props);
			this.#goToPage(this.state.pageIndex, false);
		}

		componentDidMount()
		{
			this.#goToPage(this.state.pageIndex, false);
		}

		#initState(props)
		{
			this.state = {
				pageIndex: props.pageIndex ?? 0,
			};

			this.#navigationMode = this.#getNavigationMode(props);
			this.#containerHeight = this.#getContainerHeight(props);

			const calculatedPageHeight = this.#getCalculatedPageHeight(props);
			this.height = Animated.newCalculatedValue(calculatedPageHeight);
		}

		#getContainerHeight(props)
		{
			if (!this.#hasNavigationMode())
			{
				return null;
			}

			const calculatedPageHeight = this.#getCalculatedPageHeight(props);

			return Animated.newCalculatedValue(calculatedPageHeight);
		}

		render()
		{
			const { children = [], style } = this.props;

			const containerStyle = style || {};

			if (this.#containerHeight)
			{
				containerStyle.height = this.#containerHeight;
			}

			return View(
				{
					testId: this.getTestId('swipe-slider'),
					style: containerStyle,
				},
				Slider(
					{
						ref: this.#bindSliderRef,
						style: {
							flex: 1,
						},
						onScrollCalculated: {
							contentOffset: this.scrollOffset,
						},
						swipeEnabled: this.#isSwipeEnabled(),
						onPageChange: this.#onPageChange,
						onPageWillChange: this.#onPageWillChange,
					},
					...children,
				),
				this.#renderBottomNavigation(),
			);
		}

		#isSwipeEnabled()
		{
			return !this.#isButtonNavigationMode();
		}

		#renderBottomNavigation()
		{
			if (!this.#navigationMode)
			{
				return null;
			}

			if (this.#navigationMode.equal(SliderNavigationMode.SWIPE))
			{
				return this.#renderPageIndicator();
			}

			if (this.#isButtonNavigationMode())
			{
				return this.#renderNavigationButtons();
			}

			return null;
		}

		#isButtonNavigationMode()
		{
			return Boolean(this.#navigationMode?.equal(SliderNavigationMode.BUTTON));
		}

		/**
		 * @returns {SliderNavigationMode}
		 */
		#getNavigationMode(props)
		{
			const { navigationMode } = props;

			return SliderNavigationMode.has(navigationMode) ? navigationMode : null;
		}

		#hasNavigationMode()
		{
			return Boolean(this.#navigationMode);
		}

		#getCalculatedPageHeight(props)
		{
			const { contentHeight = 520 } = props;

			return contentHeight + PAGE_INDICATOR_HEIGHT;
		}

		#onPageWillChange = () => {
			const { onPageWillChange } = this.props;

			onPageWillChange?.();
		};

		#onPageChange = async (pageIndex) => {
			this.setState({
				pageIndex,
			});

			const { onPageChange } = this.props;

			onPageChange?.(pageIndex);
		};

		#bindSliderRef = (ref) => {
			this.#sliderRef = ref;

			this.#handleOnForwardRef(ref);
		};

		#goToPage = (pageIndex, withAnimation = true) => {
			this.#sliderRef?.scrollToPage(pageIndex, withAnimation);
		};

		#renderNavigationButtons()
		{
			return View(
				{
					style: {
						flexDirection: 'row',
						alignItems: 'center',
						justifyContent: 'center',
					},
				},
				this.#renderNavigationButton(true),
				this.#renderNavigationButton(false),
			);
		}

		#renderNavigationButton(isLeft = true)
		{
			const icon = isLeft ? Icon.CHEVRON_TO_THE_LEFT : Icon.CHEVRON_TO_THE_RIGHT;
			const testId = isLeft ? this.getTestId('left-button') : this.getTestId('right-button');

			return IconView({
				testId,
				icon,
				size: 28,
				color: this.#getButtonColor(isLeft),
				style: {
					paddingHorizontal: Indent.S.toNumber(),
					paddingTop: Indent.L.toNumber(),
					paddingBottom: Indent.XS.toNumber(),
					marginRight: isLeft ? Indent.XL.toNumber() : 0,
				},
				onClick: this.#onButtonClick.bind(this, isLeft),
			});
		}

		#getButtonColor(isLeft)
		{
			const isDisabled = isLeft ? this.#isFirstPage() : this.#isLastPage();

			return isDisabled ? Color.base5 : Color.accentMainPrimaryalt;
		}

		#isLastPage = () => {
			return this.state.pageIndex === (this.props.children.length - 1);
		};

		#isFirstPage = () => {
			return this.state.pageIndex === 0;
		};

		#onButtonClick = (isLeft) => {
			if (isLeft)
			{
				this.#sliderRef?.prevSlide();

				return;
			}

			this.#sliderRef?.nextSlide();
		};

		#renderPageIndicator()
		{
			const renderDot = (index) => {
				const { width } = this.props;

				const sliderWidth = width ?? device.screen.width;
				const widthOffset = index * sliderWidth;

				return View(
					{
						style: {
							width: this.scrollOffsetX.interpolate({
								inputRange: [
									widthOffset - sliderWidth - 1,
									widthOffset - sliderWidth,
									widthOffset,
									widthOffset + sliderWidth,
									widthOffset + sliderWidth + 1,
								],
								outputRange: [6, 6, 20, 6, 6],
							}),
							height: 6,
							marginLeft: 4,
							borderRadius: 3,
							backgroundColor: Color.accentSoftBlue1.toHex(),
						},
					},
				);
			};

			const renderDots = () => {
				const length = this.props.children.length;
				const dots = Array.from({ length }).fill(1);

				return dots.map((dot, index) => renderDot(index));
			};

			return View(
				{
					style: {
						flexDirection: 'row',
						alignItems: 'center',
						justifyContent: 'center',
						paddingVertical: 16,
					},
				},
				...renderDots(),
			);
		}

		#handleOnForwardRef = (ref) => {
			const { forwardRef } = this.props;

			if (forwardRef)
			{
				forwardRef(ref);
			}
		};
	}

	SwipeSlider.propTypes = {
		testId: PropTypes.string.isRequired,
		children: PropTypes.array.isRequired,
		forwardRef: PropTypes.func,
		onPageChange: PropTypes.func,
		onPageWillChange: PropTypes.func,
		width: PropTypes.number,
		pageIndex: PropTypes.number,
		style: PropTypes.object,
		navigationMode: PropTypes.instanceOf(SliderNavigationMode),
		contentHeight: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
	};

	module.exports = {
		/**
		 * @param {SwipeSliderProps} props
		 * @returns {SwipeSlider}
		 */
		SwipeSlider: (props) => new SwipeSlider(props),
		SliderNavigationMode,
	};
});
