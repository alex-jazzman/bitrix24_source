/**
 * @module intranet/results-year/more-menu-button
 */
jn.define('intranet/results-year/more-menu-button', (require, exports, module) => {
	const { Loc } = require('loc');
	const { Component, Color } = require('tokens');
	const { withCurrentDomain } = require('utils/url');
	const { Text } = require('ui-system/typography/text');
	const { ResultsYear } = require('intranet/results-year/story');
	const { canShowResultsYearButton } = require('intranet/results-year/rest');
	const { PropTypes } = require('utils/validation');

	const ASSET_PATH = withCurrentDomain(
		'/bitrix/mobileapp/intranetmobile/extensions/intranet/results-year/more-menu-button/images',
	);

	/**
	 * @class MoreMenuResultYearButton
	 */
	class MoreMenuResultYearButton extends LayoutComponent
	{
		constructor(props)
		{
			super(props);

			this.state = {
				visible: false,
			};
		}

		componentDidMount()
		{
			void this.#canShow();
		}

		#canShow()
		{
			canShowResultsYearButton().then((response) => {
				if (response?.data === true)
				{
					this.setState({ visible: true });
				}
			}).catch(console.error);
		}

		render()
		{
			const { visible } = this.state;

			if (!visible)
			{
				return View({});
			}

			const { testId } = this.props;

			return View(
				{
					testId,
					onClick: this.#openStory,
				},
				View(
					{
						style: {
							paddingTop: 20,
							paddingBottom: 17,
						},
					},
					this.#renderButton(),
				),
				Image({
					style: {
						position: 'absolute',
						width: 46,
						height: 54,
						left: 9,
						bottom: 2,
					},
					uri: `${ASSET_PATH}/arrow.png`,
				}),
				Image({
					style: {
						position: 'absolute',
						width: 48,
						height: 48,
						top: 9,
						right: 0,
					},
					uri: `${ASSET_PATH}/check.png`,
				}),
			);
		}

		#renderButton()
		{
			const { testId } = this.props;

			return View(
				{
					testId: `${testId}-button`,
					style: {
						height: 50,
						maxHeight: 404,
						backgroundColorGradient: {
							start: '#a5e4ff',
							middle: '#08a6ff',
							end: '#143aff',
							angle: 180,
						},
						borderRadius: Component.elementAccentCorner.toNumber(),
						paddingHorizontal: 16,
						paddingVertical: 12,
						alignItems: 'center',
						justifyContent: 'center',
					},
				},
				Image({
					style: {
						position: 'absolute',
						width: 185,
						height: 50,
						right: 15,
						top: 0,
					},
					uri: `${ASSET_PATH}/spiral.png`,
				}),
				Text({
					text: Loc.getMessage('M_INTRANET_RESULTS_YEAR_MORE_MENU_BUTTON_TEXT'),
					style: {
						fontSize: 18,
						fontWeight: '600',
					},
					color: Color.baseWhiteFixed,
				}),
			);
		}

		#openStory = () => {
			void ResultsYear.show();
		};
	}

	MoreMenuResultYearButton.propTypes = {
		testId: PropTypes.string.isRequired,
	};

	MoreMenuResultYearButton.defaultProps = {
		testId: 'more-menu-result-year-button',
	};

	module.exports = { MoreMenuResultYearButton };
});
