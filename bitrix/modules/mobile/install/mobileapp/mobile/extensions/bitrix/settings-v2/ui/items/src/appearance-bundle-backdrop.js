/**
 * @module settings-v2/ui/items/src/appearance-bundle-backdrop
 */
jn.define('settings-v2/ui/items/src/appearance-bundle-backdrop', (require, exports, module) => {
	const { createTestIdGenerator } = require('utils/test');
	const { BottomSheet } = require('bottom-sheet');
	const { Box } = require('ui-system/layout/box');
	const { BoxFooter } = require('ui-system/layout/dialog-footer');
	const { Button, ButtonSize } = require('ui-system/form/buttons/button');
	const { IconView, Icon } = require('ui-system/blocks/icon');
	const { Text4 } = require('ui-system/typography/text');
	const { Color, Component, Indent } = require('tokens');
	const { Loc } = require('loc');
	const { ASSET_PATH } = require('settings-v2/const');

	const IMAGE_MAX_WIDTH = 118;
	const IMAGE_MAX_HEIGHT = 226;
	const IMAGE_ASPECT_RATIO = IMAGE_MAX_HEIGHT / IMAGE_MAX_WIDTH;
	const IMAGE_GAP = Indent.M.toNumber();
	const IMAGE_CORNER = Component.cardCornerL.toNumber();
	const IMAGE_FILL_STYLE = {
		position: 'absolute',
		top: 0,
		left: 0,
		right: 0,
		bottom: 0,
	};
	const IMAGE_KEYS = ['splash', 'mood', 'background'];
	const SPLASH_INDEX = 0;
	const LOGO_URI = `${ASSET_PATH}appearance-bundle/bitrix24-logo.png`;
	const LOGO_WIDTH_RATIO = 0.6;
	const LOGO_ASPECT_RATIO = 67 / 240;
	const LOGO_LAYER_STYLE = {
		...IMAGE_FILL_STYLE,
		alignItems: 'center',
		justifyContent: 'center',
	};
	const HINT_ICON_SIZE = 22;
	const HINT_HEIGHT = 76;
	const BLOCK_INDENT = Indent.XL3.toNumber();
	const HINT_FOOTER_INDENT = 22;
	const CLOSE_DELAY = 200;
	const FOOTER_HEIGHT = (Indent.XL.toNumber() * 2) + ButtonSize.XL.getHeight();

	/**
	 * @return {{width: number, height: number}}
	 */
	const getImageSize = () => {
		const contentWidth = device.screen.width - (Component.paddingLr.toNumber() * 2);
		const availableWidth = contentWidth - (IMAGE_GAP * (IMAGE_KEYS.length - 1));
		const width = Math.min(Math.floor(availableWidth / IMAGE_KEYS.length), IMAGE_MAX_WIDTH);

		return {
			width,
			height: Math.round(width * IMAGE_ASPECT_RATIO),
		};
	};

	/**
	 * @return {number}
	 */
	const getBackdropHeight = () => (
		(BLOCK_INDENT * 2)
		+ getImageSize().height
		+ HINT_HEIGHT
		+ HINT_FOOTER_INDENT
		+ FOOTER_HEIGHT
	);

	class AppearanceBundleBackdrop extends LayoutComponent
	{
		/**
		 * @param {Object} props
		 * @param {string} props.bundleId
		 * @param {string} props.title
		 * @param {Object} [props.bundleData]
		 * @param {boolean} [props.selected]
		 * @param {Function} [props.onApply]
		 * @param {PageManager} [props.parentWidget]
		 * @return {Promise}
		 */
		static open(props)
		{
			const { bundleId, title, bundleData, selected = false, onApply, parentWidget = PageManager } = props;

			return new BottomSheet({
				titleParams: {
					text: title,
					type: 'dialog',
				},
				component: (layoutWidget) => new AppearanceBundleBackdrop({ bundleId, bundleData, selected, onApply, layoutWidget }),
			})
				.setParentWidget(parentWidget)
				.setBackgroundColor(Color.bgContentPrimary)
				.setMediumPositionHeight(getBackdropHeight(), true)
				.allowBottomSheetDismiss()
				.open();
		}

		/**
		 * @param {Object} props
		 */
		constructor(props)
		{
			super(props);

			this.getTestId = createTestIdGenerator({
				prefix: 'settings-appearance-bundle-backdrop',
				context: this,
			});

			this.state = {
				selected: Boolean(props.selected),
			};
		}

		render()
		{
			return Box(
				{
					testId: this.getTestId('content'),
					withPaddingHorizontal: true,
					footer: this.renderFooter(),
				},
				this.renderImages(),
				this.renderHint(),
			);
		}

		renderImages()
		{
			const { bundleData } = this.props;

			const images = IMAGE_KEYS
				.map((key) => bundleData?.[key])
				.filter(Boolean);
			const { width, height } = getImageSize();

			return View(
				{
					testId: this.getTestId('images'),
					style: {
						flexDirection: 'row',
						justifyContent: 'center',
						marginTop: BLOCK_INDENT,
					},
				},
				...images.map((named, index) => View(
					{
						style: {
							width,
							height,
							overflow: 'hidden',
							borderRadius: IMAGE_CORNER,
							marginLeft: index === 0 ? 0 : IMAGE_GAP,
						},
					},
					Image({
						testId: this.getTestId(`image-${index}`),
						named,
						resizeMode: 'cover',
						style: IMAGE_FILL_STYLE,
					}),
					index === SPLASH_INDEX ? this.renderSplashLogo(width) : null,
				)),
			);
		}

		renderSplashLogo(imageWidth)
		{
			const width = Math.round(imageWidth * LOGO_WIDTH_RATIO);

			return View(
				{
					style: LOGO_LAYER_STYLE,
				},
				Image({
					testId: this.getTestId('splash-logo'),
					uri: LOGO_URI,
					resizeMode: 'contain',
					style: {
						width,
						height: Math.round(width * LOGO_ASPECT_RATIO),
					},
				}),
			);
		}

		renderFooter()
		{
			const { selected } = this.state;

			return BoxFooter(
				{
					testId: this.getTestId('footer'),
				},
				Button({
					testId: this.getTestId('apply-button'),
					text: selected
						? Loc.getMessage('SETTINGS_V2_STRUCTURE_UI_ITEMS_APPEARANCE_BUNDLE_APPLIED')
						: Loc.getMessage('SETTINGS_V2_STRUCTURE_UI_ITEMS_APPEARANCE_BUNDLE_APPLY'),
					stretched: true,
					backgroundColor: selected ? Color.accentMainSuccess : Color.accentMainPrimary,
					onClick: this.onApplyClick,
				}),
			);
		}

		onApplyClick = () => {
			const { onApply, layoutWidget } = this.props;

			if (this.state.selected)
			{
				layoutWidget?.close?.();

				return;
			}

			onApply?.();

			this.setState({ selected: true }, () => {
				setTimeout(() => layoutWidget?.close?.(), CLOSE_DELAY);
			});
		};

		renderHint()
		{
			return View(
				{
					testId: this.getTestId('hint'),
					style: {
						flexDirection: 'row',
						marginTop: BLOCK_INDENT,
					},
				},
				IconView({
					testId: this.getTestId('hint-icon'),
					icon: Icon.PRODUCT,
					solid: true,
					size: HINT_ICON_SIZE,
					color: Color.base3,
				}),
				Text4({
					testId: this.getTestId('hint-text'),
					text: Loc.getMessage('SETTINGS_V2_STRUCTURE_UI_ITEMS_APPEARANCE_BUNDLE_HINT'),
					color: Color.base3,
					style: {
						flex: 1,
						marginLeft: Indent.M.toNumber(),
					},
				}),
			);
		}
	}

	module.exports = { AppearanceBundleBackdrop };
});
