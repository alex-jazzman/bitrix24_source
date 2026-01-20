/**
 * @module intranet/results-year/story
 */

jn.define('intranet/results-year/story', (require, exports, module) => {
	const { Corner } = require('tokens');
	const { isEmpty, mergeImmutable } = require('utils/object');
	const { sendAnalytics } = require('intranet/results-year/story/src/analytics');
	const { StorySlider, sliderInternalPosition } = require('layout/ui/story-slider');
	const { StartSlider } = require('intranet/results-year/story/src/slides/start');
	const { FeatureSlider } = require('intranet/results-year/story/src/slides/feature');
	const { WinnerFeatureSlider } = require('intranet/results-year/story/src/slides/winner-feature');
	const { loadFeaturedResultsYearData } = require('intranet/results-year/rest');
	const { ASSET_PATH } = require('intranet/results-year/story/src/constants');

	const FOOTER_BUTTON_ZONE_HEIGHT = 120;
	const MAX_WIDTH = 440;
	const MAX_HEIGHT = 956;
	const TEST_ID = 'intranet-results-year-story-slider';

	/**
	 * @class ResultsYear
	 */
	class ResultsYear extends LayoutComponent
	{
		#parentWidget = null;
		#storySliderRef = null;
		#swiperSliderRef = null;

		static createSlide(slideData)
		{
			const { id } = slideData;
			const isWinner = id.startsWith('winner_');

			return isWinner
				? new WinnerFeatureSlider(slideData)
				: new FeatureSlider(slideData);
		}

		static async show(params)
		{
			const resultsYear = new ResultsYear(params);

			try
			{
				const slides = await resultsYear.getSlides();
				await resultsYear.#showSlider(slides);
			}
			catch (e)
			{
				console.error('Error showing Results Year Story Slider:', e);
			}
		}

		/**
		 * @param {Array<FeatureSlider>} slides
		 */
		async #showSlider(slides)
		{
			let changeSlideType = null;
			const { onClose } = this.props;

			const storySliderProps = {
				testId: TEST_ID,
				ref: (ref) => {
					this.#storySliderRef = ref;
				},
				forwardRef: (ref) => {
					this.#swiperSliderRef = ref;
				},
				slides,
				slideDuration: 7,
				clickableInsets: {
					bottom: FOOTER_BUTTON_ZONE_HEIGHT,
				},
				onSlideViewed: (index) => {
					if (!changeSlideType)
					{
						return;
					}

					const sliderType = slides[index]?.getSlideType();
					sendAnalytics({
						event: `${changeSlideType}_click`,
						type: sliderType,
					});
				},
				onClose: () => {
					onClose?.();
					sendAnalytics({ event: 'close_click' });
				},
				onClick: (type) => {
					changeSlideType = type;
				},
			};

			if (this.#shouldUseFixedSize())
			{
				const { width, height } = this.#getSliderSize();
				storySliderProps.container = this.#renderContainer;
				storySliderProps.style = {
					width,
					height,
					borderRadius: Corner.XL.toNumber(),
				};
			}

			const storySlider = new StorySlider(storySliderProps);
			this.#parentWidget = await storySlider.show();

			sendAnalytics({ event: 'popup_show' });
		}

		#renderContainer = (bodyView, props) => {
			const containerProps = mergeImmutable(props, {
				style: {
					alignItems: 'center',
					justifyContent: 'center',
				},
			});

			return View(
				containerProps,
				...this.#renderBottomImages(),
				bodyView,
			);
		};

		#renderBottomImages = () => {
			return [
				Image({
					style: {
						position: 'absolute',
						width: 143,
						height: 143,
						left: -40,
						bottom: 60,
					},
					uri: `${ASSET_PATH}/images/background/spiral.png`,
				}),
				Image({
					style: {
						position: 'absolute',
						width: 141,
						height: 141,
						top: 54,
						right: 0,
					},
					uri: `${ASSET_PATH}/images/background/star_plastik_violet.png`,
				}),
				Image({
					style: {
						position: 'absolute',
						width: 171,
						height: 171,
						top: -10,
						left: -5,
					},
					uri: `${ASSET_PATH}/images/background/bell_plastik.png`,
				}),
				Image({
					style: {
						position: 'absolute',
						width: 200,
						height: 149,
						bottom: 0,
						right: 45,
					},
					uri: `${ASSET_PATH}/images/background/green.png`,
				}),
				Application.getPlatform() === 'ios' ? Image({
					style: {
						position: 'absolute',
						width: '100%',
						height: '100%',
						left: 0,
						bottom: 0,
					},
					svg: {
						uri: `${ASSET_PATH}/images/background/bottom_vector.svg`,
					},
				}) : null,
			];
		};

		#shouldUseFixedSize()
		{
			return device.screen.width >= MAX_WIDTH || device.screen.height >= MAX_HEIGHT;
		}

		#getSliderSize()
		{
			return {
				width: device.screen.width >= MAX_WIDTH ? MAX_WIDTH : device.screen.width,
				height: device.screen.height >= MAX_HEIGHT ? MAX_HEIGHT : device.screen.height,
			};
		}

		/**
		 * @returns {Promise<FeatureSlider[]>}
		 */
		async getSlides()
		{
			const resultsYearData = await loadFeaturedResultsYearData().catch(console.error);
			if (isEmpty(resultsYearData?.errors) && !isEmpty(resultsYearData?.data))
			{
				const { data } = resultsYearData;

				const featureSlides = data?.topFeatures.map((feature) => ResultsYear.createSlide({
					...feature,
					shouldUseFixedSize: this.#shouldUseFixedSize(),
					getParentWidget: () => this.#parentWidget,
					onBeforeSharing: () => {
						this.#storySliderRef?.pauseAutoProgress?.();
					},
					onAfterSharing: () => {
						this.#storySliderRef?.resumeAutoProgress?.();
					},
					signedUserId: data?.options?.signedUserId,
					position: sliderInternalPosition,
				}));

				return [
					new StartSlider({
						shouldUseFixedSize: this.#shouldUseFixedSize(),
						getParentWidget: () => this.#parentWidget,
						position: sliderInternalPosition,
						onNextSlide: () => {
							this.#swiperSliderRef?.nextSlide();
						},
					}),
					...featureSlides,
				];
			}

			return [];
		}
	}

	module.exports = {
		ResultsYear,
	};
});
