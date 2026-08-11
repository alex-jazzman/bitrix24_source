/**
 * @module bitrix-gpt-onboarding/banner
 */
jn.define('bitrix-gpt-onboarding/banner', (require, exports, module) => {
	const { Loc } = require('loc');
	const { WidgetLayer } = require('widget-layer');
	const { Button, ButtonSize, ButtonDesign } = require('ui-system/form/buttons/button');
	const { IconView, Icon } = require('ui-system/blocks/icon');
	const { Color, Indent, Component } = require('tokens');
	const { createCopilotChat } = require('bitrix-gpt-onboarding/api');
	const { makeLibraryImagePath, downloadImages } = require('asset-manager');
	const { AnalyticsEvent } = require('analytics');

	const BACKGROUND_WIDTH = 1398;
	const BACKGROUND_HEIGHT = 2097;

	const LARGE_SCREEN_MIN_WIDTH = 768;
	const LARGE_SCREEN_REFERENCE_HEIGHT = 1024;

	const TOP_SHADOW_LARGE_HEIGHT = 150;

	const LOGO_WRAPPER_DEFAULT_SIZE = 268;
	const LOGO_WRAPPER_LARGE_SIZE = 360;
	const LOGO_DEFAULT_SIZE = 258;
	const LOGO_LARGE_SIZE = 272;
	const PILL_TEXT_DEFAULT_SIZE = 19;
	const PILL_TEXT_LARGE_SIZE = 22;
	const TITLE_TEXT_DEFAULT_SIZE = 32;
	const TITLE_TEXT_LARGE_SIZE = 42;
	const DESCRIPTION_TEXT_DEFAULT_SIZE = 17;
	const DESCRIPTION_TEXT_LARGE_SIZE = 20;

	const BOTTOM_SHADOW_LARGE_HEIGHT = 300;

	/**
	 * @class BitrixGptOnboardingBanner
	 */
	class BitrixGptOnboardingBanner extends LayoutComponent
	{
		#widgetLayer = null;
		#closeNotified = false;
		#creating = false;
		#dialogId = null;

		constructor(props)
		{
			super(props);

			this.state = {
				loading: false,
			};
		}

		#isLargeScreen()
		{
			return device?.screen?.width >= LARGE_SCREEN_MIN_WIDTH;
		}

		#getShadowLargeHeight(minHeight)
		{
			const screenHeight = device?.screen?.height ?? LARGE_SCREEN_REFERENCE_HEIGHT;

			return Math.max(
				minHeight,
				Math.round((screenHeight * minHeight) / LARGE_SCREEN_REFERENCE_HEIGHT),
			);
		}

		/**
		 * Opens the banner as a fullscreen widget layer.
		 *
		 * @param {object} [props]
		 * @param {function} [props.onClose] called once when the banner is dismissed
		 * @returns {Promise<BitrixGptOnboardingBanner>}
		 */
		static async show(props = {})
		{
			const banner = new BitrixGptOnboardingBanner(props);

			try
			{
				await downloadImages([
					makeLibraryImagePath('background.jpg', 'bitrix-gpt-onboarding', 'mobile', false),
					makeLibraryImagePath('logo.png', 'bitrix-gpt-onboarding', 'mobile', false),
				]).catch(() => {});

				banner.#widgetLayer = await WidgetLayer.open({ component: banner });
			}
			catch (error)
			{
				console.error('BitrixGptOnboardingBanner.show:', error);
			}

			return banner;
		}

		componentDidMount()
		{
			this.#sendAnalytics('banner_view');
		}

		componentWillUnmount()
		{
			this.#notifyClose();
		}

		#createAndOpenChat = async () => {
			if (this.#creating)
			{
				return;
			}

			this.#sendAnalytics('button_click');

			this.#creating = true;
			this.setState({ loading: true });

			try
			{
				this.#dialogId = await createCopilotChat();
				this.#close();
			}
			catch (error)
			{
				console.error('BitrixGptOnboardingBanner: failed to start chat', error);

				this.#creating = false;
				this.setState({ loading: false });

				this.#close();
			}
		};

		#close = () => {
			this.#notifyClose();
			void this.#widgetLayer?.close();
		};

		#notifyClose()
		{
			if (this.#closeNotified)
			{
				return;
			}

			this.#closeNotified = true;
			this.props.onClose?.({ dialogId: this.#dialogId });
		}

		#onCloseButtonClick = () => {
			this.#sendAnalytics('banner_close');
			this.#close();
		};

		#sendAnalytics(event)
		{
			new AnalyticsEvent({
				tool: 'ai',
				category: 'banners',
				event,
				type: 'springrelease2026/ahaspringrelease2026',
			}).send();
		}

		render()
		{
			const content = this.#isLargeScreen() ? this.#renderLargeScreenContent() : this.#renderDefaultContent();

			return View(
				{
					style: {
						flex: 1,
						flexDirection: 'column',
						overflow: 'hidden',
						backgroundColor: Color.baseBlackFixed.toHex(),
					},
				},
				...this.#renderBackground(),
				content,
				this.#renderFooter(),
				this.#renderCloseButton(),
			);
		}

		#renderBackground()
		{
			return [
				this.#renderBackgroundImage(),
				this.#renderBackgroundGradient(),
				this.#renderBackgroundHueGradient(),
				this.#renderDarkOverlay(),
			];
		}

		#renderDefaultContent()
		{
			return View(
				{
					style: {
						flex: 1,
					},
				},
				this.#renderTopShadow(),
				this.#renderLogo(),
				this.#renderBottomShadow(),
			);
		}

		#renderLargeScreenContent()
		{
			return View(
				{
					style: {
						flex: 1,
						justifyContent: 'center',
						alignItems: 'center',
						alignContent: 'center',
					},
				},
				View(
					{
						style: {
							backgroundColorGradient: {
								colors: ['#000000', '#000000', '#00000000'],
								positions: [0, 0.05, 1],
								angle: 180,
							},
							height: this.#getShadowLargeHeight(TOP_SHADOW_LARGE_HEIGHT),
							flexBasis: 0,
							position: 'absolute',
							top: 0,
							left: 0,
							right: 0,
						},
					},
				),
				View(
					{
						style: {
							backgroundColorGradient: {
								colors: ['#00000000', '#00000000', '#000000', '#000000'],
								positions: [0, 0.05, 0.25, 1],
								angle: 180,
							},
							height: this.#getShadowLargeHeight(BOTTOM_SHADOW_LARGE_HEIGHT),
							flexBasis: 0,
							position: 'absolute',
							bottom: 0,
							left: 0,
							right: 0,
						},
					},
				),
				this.#renderLogo(),
				this.#renderContent(),
			);
		}

		#renderBackgroundImage()
		{
			return Image(
				{
					style: {
						position: 'absolute',
						width: BACKGROUND_WIDTH,
						height: BACKGROUND_HEIGHT,
						left: (device.screen.width - BACKGROUND_WIDTH) / 2,
						top: (device.screen.height - BACKGROUND_HEIGHT) / 2,
					},
					resizeMode: 'cover',
					uri: makeLibraryImagePath('background.jpg', 'bitrix-gpt-onboarding', 'mobile', false),
				},
			);
		}

		#renderBackgroundGradient()
		{
			return View(
				{
					style: {
						backgroundColorGradient: {
							colors: ['#271400', '#F96269', '#F046B7', '#C695FF', '#3F68FF', '#0098EA', '#000000'],
							positions: [0, 0.177_885, 0.375, 0.567_308, 0.740_385, 0.875, 1],
							angle: 266,
						},
						opacity: 0.19,
						position: 'absolute',
						top: 0,
						left: 0,
						right: 0,
						bottom: 0,
					},
				},
			);
		}

		#renderBackgroundHueGradient()
		{
			return View(
				{
					style: {
						backgroundColorGradient: {
							colors: ['#FF9D00', '#F96269', '#F046B7', '#C695FF', '#3F68FF', '#0098EA', '#00A6FF'],
							positions: [0, 0.177_885, 0.375, 0.567_308, 0.740_385, 0.875, 1],
							angle: 266,
						},
						opacity: 0.1,
						position: 'absolute',
						top: 0,
						left: 0,
						right: 0,
						bottom: 0,
					},
				},
			);
		}

		#renderDarkOverlay()
		{
			return View(
				{
					style: {
						backgroundColor: '#000000',
						opacity: 0.45,
						position: 'absolute',
						top: 0,
						left: 0,
						right: 0,
						bottom: 0,
					},
				},
			);
		}

		#renderTopShadow()
		{
			return View(
				{
					style: {
						backgroundColorGradient: {
							colors: ['#000000', '#000000', '#00000000'],
							positions: [0, 0.05, 1],
							angle: 180,
						},
						flexGrow: 1,
						flexBasis: 0,
					},
				},
			);
		}

		#renderBottomShadow()
		{
			return View(
				{
					style: {
						backgroundColorGradient: {
							colors: ['#00000000', '#00000000', '#000000', '#000000'],
							positions: [0, 0.05, 0.25, 1],
							angle: 180,
						},
						flexGrow: 2,
						flexBasis: 0,
					},
				},
				this.#renderContent(),
			);
		}

		#renderContent()
		{
			const isLarge = this.#isLargeScreen();

			return View(
				{
					style: {
						flexDirection: 'column',
						alignItems: 'center',
						paddingTop: isLarge ? 100 : 35,
						paddingHorizontal: Indent.XL2.toNumber(),
					},
				},
				View(
					{
						testId: 'bitrix-gpt-onboarding-new-chip',
						style: {
							borderRadius: 18,
							paddingHorizontal: 13,
							paddingVertical: 6,
							backgroundColor: Color.baseWhiteFixed.toHex(0.05),
							borderWidth: 1,
							borderColor: Color.baseWhiteFixed.toHex(0.1),
						},
					},
					Text({
						testId: 'bitrix-gpt-onboarding-new-chip-text',
						text: Loc.getMessage('BITRIX_GPT_ONBOARDING_NEW_CHIP'),
						style: {
							color: Color.baseWhiteFixed.toHex(),
							fontSize: isLarge ? PILL_TEXT_LARGE_SIZE : PILL_TEXT_DEFAULT_SIZE,
						},
					}),
				),
				View(
					{
						testId: 'bitrix-gpt-onboarding-title-container',
						style: {
							alignItems: 'center',
							justifyContent: 'center',
						},
					},
					Text({
						testId: 'bitrix-gpt-onboarding-title',
						text: env.modulesData?.mobile?.aiAgentName ?? 'CoPilot Agent',
						style: {
							marginTop: isLarge ? Indent.XL3.toNumber() : Indent.XL2.toNumber(),
							fontSize: isLarge ? TITLE_TEXT_LARGE_SIZE : TITLE_TEXT_DEFAULT_SIZE,
							fontWeight: '600',
							colorGradient: {
								colors: [
									Color.bgBitrixGptGradient6.toHex(),
									Color.bgBitrixGptGradient5.toHex(),
									Color.bgBitrixGptGradient4.toHex(),
									Color.bgBitrixGptLineGradient3.toHex(),
									Color.bgBitrixGptGradient2.toHex(),
									Color.bgBitrixGptGradient1.toHex(),
								],
								angle: 267,
							},
						},
					}),
				),
				Text({
					testId: 'bitrix-gpt-onboarding-description',
					text: Loc.getMessage('BITRIX_GPT_ONBOARDING_DESCRIPTION'),
					style: {
						marginTop: isLarge ? Indent.XL4.toNumber() : Indent.XL2.toNumber(),
						textAlign: 'center',
						maxWidth: isLarge ? 540 : 339,
						color: Color.baseWhiteFixed.toHex(),
						fontSize: isLarge ? DESCRIPTION_TEXT_LARGE_SIZE : DESCRIPTION_TEXT_DEFAULT_SIZE,
					},
				}),
			);
		}

		#renderFooter()
		{
			return View(
				{
					testId: 'bitrix-gpt-onboarding-footer',
					safeArea: {
						bottom: true,
					},
					style: {
						position: 'absolute',
						left: 0,
						right: 0,
						bottom: 0,
						paddingVertical: Indent.XL.toNumber(),
						paddingHorizontal: Component.paddingLrMore.toNumber(),
					},
				},
				Button({
					testId: 'bitrix-gpt-onboarding-assign-button',
					text: Loc.getMessage('BITRIX_GPT_ONBOARDING_ASSIGN_BUTTON'),
					design: ButtonDesign.FILLED_BITRIX_GPT,
					leftIcon: Icon.BITRIX_GPT,
					size: ButtonSize.XL,
					stretched: true,
					loading: this.state.loading,
					onClick: this.#createAndOpenChat,
				}),
			);
		}

		#renderCloseButton()
		{
			return View(
				{
					style: {
						position: 'absolute',
						top: 62 + Indent.XL.toNumber(),
						right: Indent.XL.toNumber(),
					},
				},
				IconView({
					testId: 'bitrix-gpt-onboarding-close',
					icon: Icon.CROSS,
					size: 28,
					style: { alignSelf: 'center' },
					color: Color.baseWhiteFixed,
					onClick: this.#onCloseButtonClick,
				}),
			);
		}

		#renderLogo()
		{
			const isLarge = this.#isLargeScreen();
			const logoWrapperSize = isLarge ? LOGO_WRAPPER_LARGE_SIZE : LOGO_WRAPPER_DEFAULT_SIZE;
			const logoSize = isLarge ? LOGO_LARGE_SIZE : LOGO_DEFAULT_SIZE;

			return View(
				{
					style: {
						width: logoWrapperSize,
						height: logoWrapperSize,
						alignSelf: 'center',
						alignItems: 'center',
						justifyContent: 'center',
						borderRadius: logoWrapperSize / 2,
						backgroundColor: Color.baseWhiteFixed.toHex(0.02),
						borderWidth: 1,
						borderColor: Color.baseWhiteFixed.toHex(0.2),
					},
				},
				Image(
					{
						style: {
							height: logoSize,
							width: logoSize,
						},
						resizeMode: 'contain',
						uri: makeLibraryImagePath('logo.png', 'bitrix-gpt-onboarding', 'mobile', false),
					},
				),
			);
		}
	}

	module.exports = {
		BitrixGptOnboardingBanner,
	};
});
