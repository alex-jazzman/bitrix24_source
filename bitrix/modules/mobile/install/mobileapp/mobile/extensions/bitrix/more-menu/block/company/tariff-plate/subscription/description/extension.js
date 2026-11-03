/**
 * @module more-menu/block/company/tariff-plate/subscription/description
 */
jn.define('more-menu/block/company/tariff-plate/subscription/description', (require, exports, module) => {
	const { BottomSheet } = require('bottom-sheet');
	const { Color, Indent } = require('tokens');
	const { Loc } = require('loc/ai');
	const { makeLibraryImagePath } = require('asset-manager');
	const { Box } = require('ui-system/layout/box');
	const { BoxFooter } = require('ui-system/layout/dialog-footer');
	const { Icon } = require('ui-system/blocks/icon');
	const { StatusBlock } = require('ui-system/blocks/status-block');
	const { Text5 } = require('ui-system/typography/text');
	const { Button, ButtonSize, ButtonDesign } = require('ui-system/form/buttons');
	const { RunActionExecutor } = require('rest/run-action-executor');
	const { showErrorToast } = require('toast');
	const { checkFeatureFlag, FeatureFlagType } = require('feature-flag');
	const { SubscriptionSuccess } = require('more-menu/block/company/tariff-plate/subscription/success');
	const { openTariffPlanTable } = require('tariff-plan-table');
	const { createTestIdGenerator } = require('utils/test');
	const { PropTypes } = require('utils/validation');
	const { isPurchaseAllowed } = require('utils/store');

	/**
	 * @extends {LayoutComponent<SubscriptionDescriptionProps, SubscriptionDescriptionState>}
	 */
	class SubscriptionDescription extends LayoutComponent
	{
		/**
		 * @param {LayoutWidget} parentWidget
		 * @param {{ subscription: SubscriptionData }} options
		 * @return {void}
		 */
		static open(parentWidget = PageManager, options = {})
		{
			void new BottomSheet({
				component: (layout) => new SubscriptionDescription({ layout, parentWidget, ...options }),
			})
				.setParentWidget(parentWidget)
				// the content is a full page of its own: a fixed height of the medium position left
				// the list of the features cut off on a small screen
				.showOnTop()
				.setNavigationBarColor(Color.bgContentPrimary.toHex())
				.open()
			;
		}

		/**
		 * @param {SubscriptionDescriptionProps} props
		 */
		constructor(props)
		{
			super(props);

			this.getTestId = createTestIdGenerator({ context: this });

			this.state = {
				isActivating: false,
			};
		}

		render()
		{
			const { subscription } = this.props;

			return Box(
				{
					testId: this.getTestId(),
					// the box hands its background over to the footer as well: without it the footer
					// stays transparent and the scrolled content shows through under the footnote
					backgroundColor: Color.bgSecondary,
					withScroll: true,
					footer: BoxFooter(
						{
							testId: this.getTestId('footer'),
							safeArea: true,
						},
						Text5({
							testId: this.getTestId('footnote'),
							text: Loc.getMessage('M_SUBSCRIPTION_DRAWER_FOOTNOTE'),
							color: Color.base3,
							style: {
								textAlign: 'center',
								marginBottom: Indent.M.toNumber(),
							},
						}),
						subscription?.isDemoAvailable && Button({
							testId: this.getTestId('enable-btn'),
							text: Loc.getMessage('M_SUBSCRIPTION_DRAWER_ENABLE_BTN'),
							size: ButtonSize.L,
							stretched: true,
							loading: this.state.isActivating,
							onClick: () => this.#onEnableDemoClick(),
						}),
						subscription?.cta
						&& subscription?.canBuy
						&& isPurchaseAllowed(subscription?.ctaForced)
						&& Button({
							style: {
								marginTop: Indent.L.toNumber(),
							},
							testId: this.getTestId('choose-tariff-btn'),
							text: Loc.getMessage('M_SUBSCRIPTION_DRAWER_CHOOSE_TARIFF_BTN'),
							size: ButtonSize.L,
							design: ButtonDesign.PLAN_ACCENT,
							stretched: true,
							onClick: () => this.#onChooseTariffClick(),
						}),
					),
				},
				StatusBlock({
					testId: this.getTestId('status'),
					title: Loc.getMessage('M_SUBSCRIPTION_DRAWER_TITLE'),
					image: Image({
						testId: this.getTestId('graphic'),
						style: {
							width: 156,
							height: 156,
						},
						resizeMode: 'contain',
						uri: makeLibraryImagePath('gpt-market.png', 'more-menu/tariff'),
					}),
					list: [
						{
							icon: Icon.MOBILE_STARS,
							text: Loc.getMessage('M_SUBSCRIPTION_DRAWER_FEATURE_1'),
						},
						{
							icon: Icon.BITRIX_GPT,
							text: Loc.getMessage('M_SUBSCRIPTION_DRAWER_FEATURE_2'),
						},
						{
							icon: Icon.AI_PROCESS,
							text: Loc.getMessage('M_SUBSCRIPTION_DRAWER_FEATURE_3'),
						},
					],
				}),
			);
		}

		#onEnableDemoClick()
		{
			const { layout, parentWidget } = this.props;

			this.setState(
				{ isActivating: true },
				() => {
					checkFeatureFlag(FeatureFlagType.TARIFF_MENU_DEMO_MODE)
						.then((isDemoMode) => {
							if (isDemoMode)
							{
								this.setState({ isActivating: false });
								layout.close?.(() => SubscriptionSuccess.open(parentWidget));

								return;
							}

							this.#activateSubscriptionDemoOnServer();
						})
						.catch((error) => {
							console.error(error);
							this.#activateSubscriptionDemoOnServer();
						})
					;
				},
			);
		}

		#activateSubscriptionDemoOnServer()
		{
			const { layout, parentWidget } = this.props;

			new RunActionExecutor('mobile.MenuTariff.activateSubscriptionDemo')
				.setHandler(({ status, errors }) => {
					if (status === 'success')
					{
						layout.close?.(() => {
							BX.postComponentEvent('MoreMenu::Reload');
							SubscriptionSuccess.open(parentWidget);
						});
					}
					else
					{
						console.error('SubscriptionDescription: activateSubscriptionDemo failed', errors);
						showErrorToast(
							{
								message: errors?.[0]?.message
									|| Loc.getMessage('M_SUBSCRIPTION_DRAWER_ACTIVATION_ERROR'),
							},
							layout,
						);
					}

					this.setState({ isActivating: false });
				})
				.call(false)
				.catch((error) => {
					// call() rejects instead of calling the handler when the request never reached
					// the server, so the loading state has to be released here as well.
					console.error('SubscriptionDescription: activateSubscriptionDemo request failed', error);
					showErrorToast(
						{ message: Loc.getMessage('M_SUBSCRIPTION_DRAWER_ACTIVATION_ERROR') },
						layout,
					);

					this.setState({ isActivating: false });
				})
			;
		}

		#onChooseTariffClick()
		{
			const { layout, parentWidget } = this.props;

			// the sheet steps aside the way it does after the demo has been activated: the table is a
			// page of its own and opens from the widget this sheet was opened over
			layout.close?.(() => openTariffPlanTable({ parentWidget }));
		}
	}

	SubscriptionDescription.propTypes = {
		layout: PropTypes.object.isRequired,
		parentWidget: PropTypes.object.isRequired,
		subscription: PropTypes.object,
		testId: PropTypes.string,
	};

	module.exports = { SubscriptionDescription };
});
