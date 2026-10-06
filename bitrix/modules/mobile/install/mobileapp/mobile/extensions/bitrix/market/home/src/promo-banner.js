/**
 * @module market/home/src/promo-banner
 */
jn.define('market/home/src/promo-banner', (require, exports, module) => {
	const { makeLibraryImagePath } = require('asset-manager');
	const { Loc } = require('loc/ai');
	const { PureComponent } = require('layout/pure-component');
	const { Color, Component, Indent } = require('tokens');
	const { Button, ButtonDesign, ButtonSize } = require('ui-system/form/buttons/button');
	const { Text3, Text6 } = require('ui-system/typography/text');

	const PROMO_ASSET_FOLDER = 'market/home';

	const HEADER_SIDE_PADDING = Component.paddingLr.toNumber();
	const CONTENT_BOTTOM_PADDING = Indent.XL3.toNumber();
	const PROMO_CORNER_RADIUS = Indent.XL4.toNumber();
	const PROMO_BADGE_SIDE_PADDING = HEADER_SIDE_PADDING - Indent.XS2.toNumber();
	const PROMO_CONTENT_SIDE_PADDING = Component.paddingLr.toNumber();
	const PROMO_CONTENT_RIGHT_PADDING = 136;
	const PROMO_MARGIN_BOTTOM = Indent.XL2.toNumber();
	const PROMO_BADGE_WIDTH = 140;
	const PROMO_BADGE_HEIGHT = 23;
	const PROMO_BACKGROUND_HEIGHT = 69;
	const PROMO_ICON_WIDTH = 125;
	const PROMO_ICON_HEIGHT = 156;
	const PROMO_ICON_RIGHT_OFFSET = 14;
	const PROMO_ICON_TOP_OFFSET = 18;

	class MarketHomePromoBanner extends PureComponent
	{
		getTestId(suffix)
		{
			return this.props.getTestId(suffix);
		}

		getPromo()
		{
			return this.props.promo ?? null;
		}

		getFreeDays()
		{
			return Number(this.getPromo()?.freeDays ?? 0);
		}

		getButtonClickHandler()
		{
			return this.props.onButtonClick ?? null;
		}

		isButtonLoading()
		{
			return Boolean(this.props.isButtonLoading);
		}

		render()
		{
			const promo = this.getPromo();
			const freeDays = this.getFreeDays();

			if (!promo || freeDays <= 0)
			{
				return null;
			}

			return View(
				{
					testId: this.getTestId('promo'),
					style: {
						position: 'relative',
						overflow: 'hidden',
						paddingTop: Indent.XS.toNumber(),
						paddingBottom: CONTENT_BOTTOM_PADDING,
						marginBottom: PROMO_MARGIN_BOTTOM,
						borderBottomLeftRadius: PROMO_CORNER_RADIUS,
						borderBottomRightRadius: PROMO_CORNER_RADIUS,
					},
				},
				this.renderBackgroundImage(),
				View(
					{
						style: {
							paddingHorizontal: PROMO_BADGE_SIDE_PADDING,
							zIndex: 1,
						},
					},
					View(
						{
							style: {
								position: 'relative',
								width: PROMO_BADGE_WIDTH,
								height: PROMO_BADGE_HEIGHT,
								justifyContent: 'center',
							},
						},
						Image({
							style: {
								position: 'absolute',
								top: 0,
								left: 0,
								width: PROMO_BADGE_WIDTH,
								height: PROMO_BADGE_HEIGHT,
							},
							svg: {
								uri: makeLibraryImagePath('promo-brush.svg', PROMO_ASSET_FOLDER),
							},
						}),
						Text6({
							testId: this.getTestId('promo-badge'),
							text: Loc.getMessagePlural('MOBILE_MARKET_HOME_PROMO_FREE_DAYS', freeDays, {
								'#COUNT#': freeDays,
							}),
							accent: true,
							color: Color.base0,
							style: {
								paddingHorizontal: Indent.M.toNumber(),
								textAlign: 'center',
							},
						}),
					),
				),
				View(
					{
						style: {
							paddingHorizontal: PROMO_CONTENT_SIDE_PADDING,
							paddingRight: PROMO_CONTENT_RIGHT_PADDING,
							marginTop: Indent.XL.toNumber(),
							zIndex: 1,
						},
					},
					Text3({
						testId: this.getTestId('promo-title'),
						text: Loc.getMessage('MOBILE_MARKET_HOME_PROMO_TITLE'),
						accent: true,
						color: Color.base0,
					}),
					Button({
						testId: this.getTestId('promo-button'),
						text: Loc.getMessage('MOBILE_MARKET_HOME_PROMO_BUTTON'),
						size: ButtonSize.S,
						design: ButtonDesign.FILLED,
						onClick: this.getButtonClickHandler(),
						loading: this.isButtonLoading(),
						style: {
							marginTop: Indent.XL.toNumber(),
						},
					}),
					Text6({
						testId: this.getTestId('promo-description'),
						text: Loc.getMessage('MOBILE_MARKET_HOME_PROMO_DESCRIPTION'),
						accent: true,
						color: Color.base3,
						style: {
							marginTop: Indent.XL.toNumber(),
						},
					}),
				),
				this.renderIconImage(),
			);
		}

		renderBackgroundImage()
		{
			return Image({
				style: {
					position: 'absolute',
					left: 0,
					right: 0,
					bottom: 0,
					height: PROMO_BACKGROUND_HEIGHT,
					backgroundResizeMode: 'contain',
				},
				uri: makeLibraryImagePath('promo-background.png', PROMO_ASSET_FOLDER),
			});
		}

		renderIconImage()
		{
			return Image({
				testId: this.getTestId('promo-graphic'),
				uri: makeLibraryImagePath('promo-icon.png', PROMO_ASSET_FOLDER, undefined, false),
				resizeMode: 'contain',
				style: {
					position: 'absolute',
					right: PROMO_ICON_RIGHT_OFFSET,
					top: PROMO_ICON_TOP_OFFSET,
					width: PROMO_ICON_WIDTH,
					height: PROMO_ICON_HEIGHT,
					zIndex: 1,
				},
			});
		}
	}

	module.exports = {
		MarketHomePromoBanner: (props) => new MarketHomePromoBanner(props),
	};
});
