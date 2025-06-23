/**
 * @module layout/ui/app-rating/src/box-strategy
 */
jn.define('layout/ui/app-rating/src/box-strategy', (require, exports, module) => {
	const AppTheme = require('apptheme');
	const { Area } = require('ui-system/layout/area');
	const { AreaList } = require('ui-system/layout/area-list');
	const { BottomSheet } = require('bottom-sheet');
	const { Box } = require('ui-system/layout/box');
	const { BoxFooter } = require('ui-system/layout/dialog-footer');
	const { Button, ButtonDesign, ButtonSize } = require('ui-system/form/buttons/button');
	const { Color, Indent, Component } = require('tokens');
	const { H3, H4 } = require('ui-system/typography/heading');
	const { Loc } = require('loc');
	const { Text4 } = require('ui-system/typography/text');
	const { store } = require('native/store') || {};
	const { SupportChatStrategy } = require('layout/ui/app-rating/src/support-chat-strategy');
	const { RunActionExecutor } = require('rest/run-action-executor');
	const {
		HighestRate,
		BackdropHeight,
	} = require('layout/ui/app-rating/src/rating-constants');

	const hiddenFields = encodeURIComponent(JSON.stringify({
		from_domain: currentDomain,
		back_version: Application.getAppVersion(),
		os_phone: Application.getPlatform(),
		app_version: Application.getApiVersion(),
		region_model: env.languageId,
		sender_page: 'mobile_rating_drawer',
		phone_model: device.model,
		os_version: device.version,
	}));

	class BoxStrategy extends LayoutComponent
	{
		constructor(props)
		{
			super(props);
			this.state = {
				strategy: null,
				botId: null,
				text: '',
			};

			this.sendAnalytics = false;
		}

		componentWillUnmount()
		{
			this.sendAnalytics = false;
		}

		async componentDidMount()
		{
			const botId = await this.#getBotId();
			const strategy = this.#getContentStrategy(botId);

			this.setState({ strategy, botId });
		}

		async #getBotId()
		{
			try
			{
				const response = await new RunActionExecutor(
					'mobile.Support.getBotId',
					{},
				)
					.setSkipRequestIfCacheExists()
					.call(true);

				return response.data?.botId || null;
			}
			catch (error)
			{
				console.error(error);

				return null;
			}
		}

		/**
		 * @param props
		 * @param {LayoutWidget} props.parentWidget
		 * @param {Number} props.userRate
		 * @param {Function} props.onGoToStoreButtonClick
		 */
		static openBox(props)
		{
			const parentWidget = props.parentWidget ?? PageManager;

			new BottomSheet({
				component: (layoutWidget) => new BoxStrategy({
					...props,
					layoutWidget,
				}),
			})
				.setParentWidget(parentWidget)
				.setBackgroundColor(Color.bgSecondary.toHex())
				.setNavigationBarColor(Color.bgSecondary.toHex())
				.setMediumPositionHeight(BackdropHeight, true)
				.open()
				.catch(console.error)
			;
		}

		get testId()
		{
			return 'app-rating-additional-drawer';
		}

		render()
		{
			if (!this.state.strategy)
			{
				return View({});
			}

			return Box(
				{
					footer: this.renderFooter(),
				},
				this.state.strategy.renderConfetti(),
				this.renderAreaList(),
			);
		}

		renderAreaList()
		{
			return AreaList(
				{
					withScroll: false,
				},
				Area(
					{
						isFirst: true,
					},
					this.renderTitle(),
					this.renderContent(),
				),
			);
		}

		renderTitle()
		{
			return H4({
				text: this.props.title ?? Loc.getMessage('M_UI_APP_RATING_GRATEFUL_TITLE'),
				color: Color.base1,
				style: {
					alignSelf: 'center',
					marginBottom: Indent.XL.toNumber(),
				},
			});
		}

		renderContent()
		{
			return View(
				{
					style: {
						marginTop: Component.areaPaddingTFirst.toNumber(),
						flexDirection: 'column',
						alignItems: 'center',
						justifyContent: 'space-between',
						padding: Indent.XL3.toNumber(),
					},
				},
				this.renderImage(),
				this.renderDescription(),
				this.renderSubtitle(),
			);
		}

		renderImage()
		{
			return View(
				{
					style: {
						width: '100%',
					},
				},
				this.state.strategy.renderContent(),
			);
		}

		renderDescription()
		{
			return H3({
				text: this.state.strategy.getDescription(),
				color: Color.base1,
				style: {
					textAlign: 'center',
					marginTop: Indent.XL2.toNumber(),
				},
			});
		}

		renderSubtitle()
		{
			return Text4({
				text: this.state.strategy.getSubtitle(),
				color: Color.base2,
				style: {
					textAlign: 'center',
					marginTop: Indent.M.toNumber(),
				},
			});
		}

		renderFooter()
		{
			const { strategy } = this.state;
			const { triggerEvent } = this.props;

			return BoxFooter(
				{},
				Button(
					{
						testId: `${this.testId}-button`,
						text: strategy.getButtonText(),
						design: strategy.isFilledButton() ? ButtonDesign.FILLED : ButtonDesign.OUTLINE_ACCENT_2,
						size: ButtonSize.L,
						stretched: true,
						style: {
							alignSelf: 'center',
							paddingVertical: Indent.XL.toNumber(),
						},
						onClick: () => {
							if (!this.sendAnalytics)
							{
								this.sendAnalytics = true;
								strategy.buttonHandler(triggerEvent, this.sendAnalytics);
							}
						},
					},
				),
			);
		}

		#getContentStrategy(botId)
		{
			const { userRate, parentWidget, onGoToStoreButtonClick } = this.props;

			if (userRate >= HighestRate)
			{
				parentWidget.close(() => {
					store?.requestReview();

					onGoToStoreButtonClick?.();
				});

				return null;
			}

			if (botId)
			{
				return new SupportChatStrategy({ botId, parentWidget });
			}

			parentWidget.close(() => {
				return BoxStrategy.openAppFeedbackForm();
			});

			return null;
		}

		static openAppFeedbackForm()
		{
			const formId = AppTheme.id === 'dark' ? 'appFeedbackDark' : 'appFeedbackLight';
			PageManager.openPage({
				backgroundColor: Color.bgSecondary.toHex(),
				url: `${env.siteDir}mobile/settings?formId=${formId}&hiddenFields=${hiddenFields}`,
				modal: true,
				backdrop: {
					mediumPositionHeight: BackdropHeight,
					hideNavigationBar: true,
					swipeAllowed: true,
					forceDismissOnSwipeDown: false,
					showOnTop: false,
					adoptHeightByKeyboard: true,
					shouldResizeContent: true,
				},
			});
		}
	}

	module.exports = {
		BoxStrategy: (props) => new BoxStrategy(props),
		BoxStrategyClass: BoxStrategy,
	};
});
