/**
 * @module intranet/results-year/story/src/slides/base
 */
jn.define('intranet/results-year/story/src/slides/base', (require, exports, module) => {
	const { Color, Corner } = require('tokens');
	const { Text } = require('ui-system/typography/text');
	const { Button } = require('ui-system/form/buttons/button');
	const { sendAnalytics } = require('intranet/results-year/story/src/analytics');
	const { ASSET_PATH } = require('intranet/results-year/story/src/constants');

	/**
	 * @class BaseSlider
	 */
	class BaseSlider extends LayoutComponent
	{
		constructor(props)
		{
			super(props);

			this.state = {
				loadingButton: false,
			};

			this.rootViewRef = null;
			this.isAndroid = Application.getPlatform() === 'android';

			this.handleOnButtonClick = this.handleOnButtonClick.bind(this);
		}

		render()
		{
			const { position, shouldUseFixedSize } = this.props;

			return View(
				{
					style: {
						flex: 1,
						borderRadius: shouldUseFixedSize ? Corner.XL.toNumber() : 0,
					},
				},
				View(
					{
						ref: (ref) => {
							this.rootViewRef = ref;
						},
						style: {
							flex: 1,
							backgroundColorGradient: this.getColorGradient(),
						},
					},
					View(
						{
							style: {
								flex: 1,
								justifyContent: 'space-between',
								paddingTop: position.top,
								paddingBottom: this.getHorizontalPosition(),
							},
						},
						this.#renderImage(),
						this.renderBody(),
					),
				),
				this.#renderFooter(),
			);
		}

		renderBody()
		{
			return View(
				{
					style: {
						paddingHorizontal: this.getHorizontalPosition(),
					},
				},
				this.#renderLogo(),
				this.renderContent(),
				this.#renderFootnote(),
			);
		}

		#renderImage()
		{
			return this.getImage();
		}

		#renderLogo()
		{
			return Image({
				style: {
					width: 223,
					height: 40,
					marginVertical: 65,
					backgroundImageSvgUrl: this.#getLogoUri(), // for iOS SVG fix
				},
				tintColor: this.getThemeColor(),
				svg: {
					uri: this.#getLogoUri(),
				},
			});
		}

		#getLogoUri()
		{
			return `${ASSET_PATH}/logo/b24-light.svg`;
		}

		#renderFooter()
		{
			const { loadingButton } = this.state;

			return View(
				{
					style: {
						position: 'absolute',
						bottom: this.getHorizontalPosition(),
						paddingHorizontal: this.getHorizontalPosition(),
					},
				},
				Button({
					testId: `slide-button-${this.getSlideType}`,
					color: Color.baseBlackFixed,
					rounded: true,
					backgroundColor: new Color('custom', '#ccf31e'),
					stretched: true,
					loading: loadingButton,
					text: this.getButtonText(),
					onClick: this.handleOnButtonClick,
				}),
			);
		}

		renderContent()
		{
			return View(
				{
					style: {
						paddingVertical: this.getHorizontalPosition(),
					},
				},
				this.renderTitle(),
				this.renderDescription(),
			);
		}

		renderTitle()
		{
			return Text({
				style: {
					fontSize: this.isAndroid ? 34 : 40,
					fontWeight: '700',
					width: '100%',
					lineHeightMultiple: 0.8,
					color: this.getThemeColor(),
				},
				text: this.getTitle(),
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
					fontSize: 27,
					fontWeight: '500',
					width: '100%',
					paddingVertical: this.getHorizontalPosition(),
					color: this.getThemeColor(),
				},
				text: description,
			});
		}

		#renderFootnote()
		{
			const footnote = this.getFootnote();

			if (!footnote)
			{
				return null;
			}

			return Text({
				style: {
					fontSize: this.isAndroid ? 16 : 18,
					fontWeight: '400',
					color: this.getThemeColor(0.7),
				},
				text: footnote,
			});
		}

		getHorizontalPosition()
		{
			const { position } = this.props;

			return position.horizontal;
		}

		/**
		 * @abstract
		 * @returns {string|null}
		 */
		getTitle()
		{
			return null;
		}

		/**
		 * @returns {null}
		 */
		getFootnote()
		{
			return null;
		}

		/**
		 * @abstract
		 * @returns {string|View}
		 */
		getDescription()
		{
			return '';
		}

		/**
		 * @abstract
		 */
		getButtonText()
		{
			return '';
		}

		/**
		 * @abstract
		 */
		getSlideType()
		{
			return 'base';
		}

		/**
		 * @abstract
		 */
		getImage()
		{
			return null;
		}

		getSlideImage()
		{
			return `${ASSET_PATH}/images/${this.getSlideType()}.png`;
		}

		/**
		 * @abstract
		 */
		getColorGradient()
		{
			return null;
		}

		async handleOnButtonClick()
		{
		}

		/**
		 * @param {number} [opacity]
		 */
		getThemeColor(opacity)
		{
			return Color.baseWhiteFixed.toHex(opacity);
		}

		asyncSetState(newState)
		{
			return new Promise((resolve) => {
				this.setState(newState, resolve);
			});
		}

		sendAnalytics({ event })
		{
			sendAnalytics({
				event,
				type: this.getSlideType(),
			});
		}
	}

	module.exports = {
		BaseSlider,
	};
});
