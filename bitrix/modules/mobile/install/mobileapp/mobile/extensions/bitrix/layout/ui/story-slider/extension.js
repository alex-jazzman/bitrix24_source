/**
 * @module layout/ui/story-slider
 */
jn.define('layout/ui/story-slider', (require, exports, module) => {
	const { WidgetLayer } = require('widget-layer');
	const { PropTypes } = require('utils/validation');
	const { Slider, sliderInternalPosition } = require('layout/ui/story-slider/src/slider');

	const testId = 'story-slider';

	/**
	 * @typedef {Object} StorySliderProps
	 * @property {Array<LayoutComponent>} slides
	 * @property {number} [slideDuration=10]
	 * @property {string} [testId]
	 * @property {Function} [onSlideViewed]
	 * @property {Object} [clickableInsets]
	 * @property {Function} [onClose]
	 * @property {number} [clickableInsets.top]
	 * @property {number} [clickableInsets.right]
	 * @property {number} [clickableInsets.bottom]
	 * @property {number} [clickableInsets.left]
	 *
	 * @class StorySlider
	 */
	class StorySlider extends LayoutComponent
	{
		#widgetLayer = null;

		static create()
		{
			return new StorySlider();
		}

		/**
		 * @returns {Promise<LayoutWidget>}
		 */
		async show()
		{
			const { slides } = this.props;

			if (!Array.isArray(slides) || slides.length === 0)
			{
				console.warn('StorySlider: no slides to show');

				return null;
			}

			this.#widgetLayer = await WidgetLayer.open({
				component: new Slider({
					testId,
					...this.props,
					onClose: this.close,
				}),
			});

			return this.#widgetLayer.getLayoutManager();
		}

		close = () => {
			const { onClose } = this.props;

			onClose?.();
			this.#widgetLayer.close();
		};
	}

	StorySlider.defaultProps = {
		slideDuration: 10,
	};

	StorySlider.propTypes = {
		testId: PropTypes.string.isRequired,
		slides: PropTypes.array.isRequired,
		slideDuration: PropTypes.number,
		onSlideViewed: PropTypes.func,
		onClose: PropTypes.func,
		clickableInsets: PropTypes.object,
	};

	module.exports = {
		StorySlider,
		sliderInternalPosition,
	};
});
