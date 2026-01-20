/**
 * @module intranet/results-year/story/src/slides/winner-feature
 */
jn.define('intranet/results-year/story/src/slides/winner-feature', (require, exports, module) => {
	const { FeatureSlider } = require('intranet/results-year/story/src/slides/feature');

	/**
	 * @class WinnerFeatureSlider
	 * @extends {FeatureSlider}
	 */
	class WinnerFeatureSlider extends FeatureSlider
	{
		renderContent()
		{
			return View(
				{
					style: {},
				},
				Text({
					style: {
						fontSize: this.isAndroid ? 16 : 18,
						weight: '500',
						color: this.getThemeColor(),
					},
					text: this.getTitle(),
				}),
				View(
					{
						style: {
							marginTop: 20,
							marginBottom: this.getHorizontalPosition(),
						},
					},
					this.renderTitle(),
					this.renderDescription(),
				),
			);
		}

		renderTitle()
		{
			return Text({
				style: {
					fontSize: this.isAndroid ? 36 : 44,
					fontWeight: '700',
					width: '100%',
					lineHeightMultiple: 0.8,
					marginBottom: 10,
					color: this.getThemeColor(),
				},
				text: this.getName(),
			});
		}

		renderDescription()
		{
			const description = this.getDescription();

			if (description && typeof description !== 'string')
			{
				return description;
			}

			return Text({
				style: {
					fontSize: this.isAndroid ? 16 : 18,
					fontWeight: '500',
					width: '100%',
					paddingTop: 10,
					color: this.getThemeColor(),
				},
				text: description,
			});
		}

		getName()
		{
			return this.getMessage('name');
		}
	}

	module.exports = {
		WinnerFeatureSlider,
	};
});
