/**
 * @module intranet/results-year/story/src/slides/start
 */
jn.define('intranet/results-year/story/src/slides/start', (require, exports, module) => {
	const { Loc } = require('loc');
	const { BaseSlider } = require('intranet/results-year/story/src/slides/base');

	/**
	 * @class StartSlider
	 */
	class StartSlider extends BaseSlider
	{
		getDescription()
		{
			return View(
				{},
				Text({
					style: {
						fontSize: this.isAndroid ? 23 : 27,
						fontWeight: '500',
						width: '100%',
						color: this.getThemeColor(),
						paddingBottom: this.getHorizontalPosition(),
					},
					text: Loc.getMessage('M_INTRANET_RESULTS_YEAR_START_SLIDER_DESCRIPTION'),
				}),
				Text({
					style: {
						fontSize: this.isAndroid ? 23 : 27,
						fontWeight: '500',
						width: '100%',
						color: this.getThemeColor(),
					},
					text: Loc.getMessage('M_INTRANET_RESULTS_YEAR_START_SLIDER_SUB_DESCRIPTION'),
				}),
			);
		}

		getTitle()
		{
			return Loc.getMessage('M_INTRANET_RESULTS_YEAR_START_SLIDER_TITLE');
		}

		getFootnote()
		{
			return Loc.getMessage('M_INTRANET_RESULTS_YEAR_START_SLIDER_FOOTNOTE');
		}

		getButtonText()
		{
			return Loc.getMessage('M_INTRANET_RESULTS_YEAR_START_SLIDER_BUTTON_TEXT');
		}

		getSlideType()
		{
			return 'start';
		}

		getImage()
		{
			return Image({
				style: {
					width: 391,
					height: 391,
					position: 'absolute',
					right: -269,
					top: 34,
				},
				uri: this.getSlideImage(),
			});
		}

		getColorGradient()
		{
			return {
				start: '#6732ff',
				middle: '#08a6ff',
				end: '#2fec6f',
				angle: 135,
			};
		}

		handleOnButtonClick()
		{
			const { onNextSlide } = this.props;

			onNextSlide?.();
		}
	}

	module.exports = {
		StartSlider,
	};
});
