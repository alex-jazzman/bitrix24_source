/**
 * @module demo-activation/description
 */
jn.define('demo-activation/description', (require, exports, module) => {
	const { BottomSheet } = require('bottom-sheet');
	const { Color, Indent } = require('tokens');
	const { Loc } = require('loc');
	const { makeLibraryImagePath } = require('asset-manager');
	const { Box } = require('ui-system/layout/box');
	const { BoxFooter } = require('ui-system/layout/dialog-footer');
	const { Icon } = require('ui-system/blocks/icon');
	const { StatusBlock } = require('ui-system/blocks/status-block');
	const { Text5 } = require('ui-system/typography/text');
	const { Button, ButtonSize, ButtonDesign } = require('ui-system/form/buttons');
	const { showErrorToast } = require('toast');
	const { checkFeatureFlag, FeatureFlagType } = require('feature-flag');
	const { activateDemo } = require('demo-activation/api');
	const { DemoActivationSuccess } = require('demo-activation/success');
	const { openTariffPlanTable } = require('tariff-plan-table');
	const { createTestIdGenerator } = require('utils/test');
	const { PropTypes } = require('utils/validation');

	/**
	 * @extends {LayoutComponent<DemoActivationDescriptionProps, DemoActivationDescriptionState>}
	 */
	class DemoActivationDescription extends LayoutComponent
	{
		/**
		 * @param {PageManager} parentWidget
		 * @param {DemoActivationDescriptionOptions} options
		 * @return {Promise<PageManager>}
		 */
		static open(parentWidget = PageManager, options = {})
		{
			void new BottomSheet({
				component: (layout) => new DemoActivationDescription({ layout, parentWidget, ...options }),
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
		 * @param {DemoActivationDescriptionProps} props
		 */
		constructor(props)
		{
			super(props);

			this.getTestId = createTestIdGenerator({
				prefix: 'demo-activation-description',
				context: this,
			});

			this.state = {
				isActivating: false,
			};
		}

		render()
		{
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
							text: Loc.getMessage('DEMO_ACTIVATION_DESCRIPTION_FOOTNOTE'),
							color: Color.base3,
							style: {
								textAlign: 'center',
								marginBottom: Indent.M.toNumber(),
							},
						}),
						Button({
							testId: this.getTestId('enable-btn'),
							text: Loc.getMessage('DEMO_ACTIVATION_DESCRIPTION_ENABLE_BTN'),
							size: ButtonSize.L,
							stretched: true,
							loading: this.state.isActivating,
							onClick: () => this.#onEnableDemoClick(),
						}),
						this.props.showPurchaseCta && Button({
							style: {
								marginTop: Indent.L.toNumber(),
							},
							testId: this.getTestId('choose-tariff-btn'),
							text: Loc.getMessage('DEMO_ACTIVATION_DESCRIPTION_CHOOSE_TARIFF_BTN'),
							size: ButtonSize.L,
							design: ButtonDesign.PLAN_ACCENT,
							stretched: true,
							onClick: () => this.#onChooseTariffClick(),
						}),
					),
				},
				StatusBlock({
					testId: this.getTestId('status'),
					title: Loc.getMessage('DEMO_ACTIVATION_DESCRIPTION_TITLE'),
					image: Image({
						testId: this.getTestId('graphic'),
						style: {
							width: 180,
							height: 180,
						},
						resizeMode: 'contain',
						uri: makeLibraryImagePath('demo-description.png', 'volumetric'),
					}),
					list: [
						{
							icon: Icon.GROUP,
							text: Loc.getMessage('DEMO_ACTIVATION_DESCRIPTION_FEATURE_1'),
						},
						{
							icon: Icon.FOLDER,
							text: Loc.getMessage('DEMO_ACTIVATION_DESCRIPTION_FEATURE_2'),
						},
						{
							icon: Icon.CRM,
							text: Loc.getMessage('DEMO_ACTIVATION_DESCRIPTION_FEATURE_3'),
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
								layout.close?.(
									() => DemoActivationSuccess?.open(parentWidget, { skipRelogin: true }),
								);

								return;
							}

							this.#activateDemoOnServer();
						})
						.catch((error) => {
							console.error(error);
							this.#activateDemoOnServer();
						})
					;
				},
			);
		}

		#activateDemoOnServer()
		{
			const { layout, parentWidget } = this.props;

			activateDemo()
				.then((isDemoAvailable) => {
					if (isDemoAvailable === false)
					{
						layout.close?.(() => DemoActivationSuccess?.open(parentWidget));
					}
					else
					{
						showErrorToast(
							{ message: Loc.getMessage('DEMO_ACTIVATION_DESCRIPTION_ACTIVATION_ERROR') },
							layout,
						);
					}
				})
				.catch((error) => {
					console.error(error);
					showErrorToast(
						{ message: Loc.getMessage('DEMO_ACTIVATION_DESCRIPTION_ACTIVATION_ERROR') },
						layout,
					);
				})
				.finally(() => this.setState({ isActivating: false }))
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

	DemoActivationDescription.propTypes = {
		layout: PropTypes.object.isRequired,
		parentWidget: PropTypes.object.isRequired,
		showPurchaseCta: PropTypes.bool,
		testId: PropTypes.string,
	};

	module.exports = { DemoActivationDescription };
});
