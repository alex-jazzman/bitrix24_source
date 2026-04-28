/**
 * @module layout/ui/plan-restriction
 */
jn.define('layout/ui/plan-restriction', (require, exports, module) => {
	const { Color, Indent } = require('tokens');
	const { Type } = require('type');
	const { Loc } = require('loc');
	const { BottomSheet } = require('bottom-sheet');
	const { qrauth } = require('qrauth/utils');
	const { Box } = require('ui-system/layout/box');
	const { BoxFooter } = require('ui-system/layout/dialog-footer');
	const { StatusBlock } = require('ui-system/blocks/status-block');
	const { Button, ButtonSize, ButtonDesign } = require('ui-system/form/buttons');
	const { getIsDemoAvailable, activateDemo } = require('layout/ui/plan-restriction/src/provider');
	const { LoadingScreenComponent } = require('layout/ui/loading-screen');
	const { AnalyticsEvent } = require('analytics');
	const { getMediumHeight } = require('utils/page-manager');
	const { makeLibraryImagePath } = require('asset-manager');
	const PlanId = {
		PRO: 'PRO',
	};

	const safeAreaBottom = true;
	const BACKDROP_HEIGHT = 434;
	const REDIRECT_URL = '/settings/license_all.php?utm_medium=b24_slider_mobile';

	/**
	 * @class PlanRestriction
	 */
	class PlanRestriction extends LayoutComponent
	{
		static getWidgetParams(props)
		{
			return {
				modal: true,
				titleParams: {
					type: 'dialog',
					text: props.title || '',
				},
				backdrop: {
					mediumPositionHeight: getMediumHeight({ height: BACKDROP_HEIGHT }),
					onlyMediumPosition: true,
					forceDismissOnSwipeDown: true,
					horizontalSwipeAllowed: false,
				},
				enableNavigationBarBorder: false,
			};
		}

		static async open(props, parentWidget = PageManager)
		{
			const widgetParams = PlanRestriction.getWidgetParams(props);
			const component = new PlanRestriction({ ...props, parentWidget });
			const entityBottomSheet = new BottomSheet({
				component,
				titleParams: widgetParams.titleParams,
			});

			const bottomLayout = await entityBottomSheet
				.setParentWidget(parentWidget)
				.setMediumPositionHeight(BACKDROP_HEIGHT, true)
				.enableOnlyMediumPosition()
				.enableForceDismissOnSwipeDown()
				.disableHorizontalSwipe()
				.setNavigationBarColor(Color.bgContentPrimary.toHex())
				.open()
				.catch(console.error);

			component.setParentWidget(bottomLayout);

			return bottomLayout;
		}

		static openComponent(props, parentWidget = PageManager)
		{
			const {
				text = Loc.getMessage('PLAN_RESTRICTION_TEXT'),
				isPromo = false,
				planId = PlanId.PRO,
				featureId = '',
				analyticsData = {},
			} = props;

			// eslint-disable-next-line no-undef
			ComponentHelper.openLayout(
				{
					name: 'tariff-plan-restriction',
					object: 'layout',
					canOpenInDefault: true,
					componentParams: {
						text,
						isPromo,
						planId,
						featureId,
						analyticsData,
					},
					widgetParams: PlanRestriction.getWidgetParams(props),
				},
				parentWidget,
			);
		}

		constructor(props)
		{
			super(props);

			this.setParentWidget(props.parentWidget);

			this.state = {
				isLoading: true,
				isDemoAvailable: false,
				isDemoActivating: false,
			};
		}

		componentDidMount()
		{
			getIsDemoAvailable()
				.then((isDemoAvailable) => this.setState({ isDemoAvailable, isLoading: false }))
				.catch(console.error)
			;

			this.sendAnalyticsEvent('show');
		}

		render()
		{
			const { isPromo = false, planId = PlanId.PRO } = this.props;
			const { isLoading, isDemoAvailable } = this.state;

			if (isLoading)
			{
				return new LoadingScreenComponent({ showAirStyle: true });
			}

			let imageUri = null;
			if (isDemoAvailable)
			{
				imageUri = makeLibraryImagePath('demo-lock.png', 'volumetric');
			}
			else
			{
				imageUri = makeLibraryImagePath('tariff1.png', 'volumetric');
			}

			return Box(
				{
					safeArea: {
						bottom: safeAreaBottom,
					},
					backgroundColor: Color.bgContentPrimary,
					footer: BoxFooter(
						{},
						...this.getButtons(),
					),
				},
				StatusBlock({
					image: Image({
						style: {
							width: 132,
							height: 132,
						},
						uri: imageUri,
					}),
					title: isDemoAvailable && Loc.getMessage('PLAN_RESTRICTION_TITLE_DEMO'),
					description: this.getText(),
					descriptionColor: Color.base1,
					testId: (isPromo ? `PLAN_RESTRICTION_PROMO_${planId}` : 'PLAN_RESTRICTION'),
				}),
			);
		}

		getText()
		{
			const {
				text = Loc.getMessage('PLAN_RESTRICTION_TEXT'),
				isPromo = false,
				planId = PlanId.PRO,
			} = this.props;

			if (isPromo)
			{
				return Loc.getMessage(`PLAN_RESTRICTION_PROMO_TEXT_${planId}`);
			}

			const { isDemoAvailable } = this.state;

			if (isDemoAvailable)
			{
				return Loc.getMessage('PLAN_RESTRICTION_TEXT_DEMO_MSGVER_1');
			}

			return text;
		}

		getButtons()
		{
			const {
				isPromo = false,
				planId = PlanId.PRO,
				featureId = '',
			} = this.props;

			const layout = this.getParentWidget();

			if (isPromo)
			{
				const promoButton = Button({
					testId: `BUTTON_PROMO_${planId}`,
					text: Loc.getMessage('PLAN_RESTRICTION_PROMO_BUTTON'),
					size: ButtonSize.L,
					stretched: true,
					onClick: () => {
						qrauth.open({
							layout,
							showHint: true,
							redirectUrl: `/?feature_promoter_by_id=${featureId}&utm_medium=b24_slider_mobile&utm_source=${featureId}`,
							analyticsSection: 'tariff_slider',
						});
						this.sendAnalyticsEvent('button_gift_click');
					},
				});

				return [promoButton];
			}

			const activateDemoButton = Button({
				testId: 'BUTTON_ENABLE_DEMO',
				text: Loc.getMessage('PLAN_RESTRICTION_ENABLE_DEMO_BUTTON'),
				size: ButtonSize.L,
				loading: this.state.isDemoActivating,
				stretched: true,
				style: {
					marginBottom: Indent.L.toNumber(),
				},
				onClick: async () => {
					this.setState({ isDemoActivating: true });
					this.sendAnalyticsEvent('demo_activated');

					const isDemoAvailable = await activateDemo();
					if (isDemoAvailable === false)
					{
						const { DemoActivationSuccess } = await requireLazy(
							'layout/ui/plan-restriction/demo-activation-success',
						);
						DemoActivationSuccess.open(layout);
					}
				},
			});

			const { isDemoAvailable } = this.state;

			const choosePlanButton = Button({
				testId: 'BUTTON_CHOOSE_PLAN',
				text: Loc.getMessage('PLAN_RESTRICTION_CHOOSE_PLAN_BUTTON'),
				size: ButtonSize.L,
				design: isDemoAvailable ? ButtonDesign.PLAN_ACCENT : ButtonDesign.FILLED,
				stretched: true,
				onClick: () => {
					qrauth.open({
						layout,
						showHint: true,
						redirectUrl: (
							Type.isStringFilled(featureId)
								? `${REDIRECT_URL}&utm_source=${featureId}`
								: REDIRECT_URL
						),
						analyticsSection: 'tariff_slider',
					});
					this.sendAnalyticsEvent('button_buy_click');
				},
			});

			return [
				isDemoAvailable && activateDemoButton,
				choosePlanButton,
			];
		}

		sendAnalyticsEvent(action)
		{
			const { featureId = '', analyticsData = {} } = this.props;

			new AnalyticsEvent({
				...analyticsData,
				tool: 'infoHelper',
				category: 'drawer',
				event: action,
				type: (Type.isStringFilled(featureId) ? featureId : null),
			}).send();
		}

		getParentWidget()
		{
			return this.parentWidget;
		}

		setParentWidget(parentWidget)
		{
			this.parentWidget = parentWidget;
		}
	}

	setTimeout(() => getIsDemoAvailable(), 2000);

	module.exports = { PlanRestriction, PlanId };
});
