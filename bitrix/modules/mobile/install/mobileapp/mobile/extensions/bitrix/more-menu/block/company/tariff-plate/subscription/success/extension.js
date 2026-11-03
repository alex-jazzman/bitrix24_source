/**
 * @module more-menu/block/company/tariff-plate/subscription/success
 */
jn.define('more-menu/block/company/tariff-plate/subscription/success', (require, exports, module) => {
	const { BottomSheet } = require('bottom-sheet');
	const { Color, Indent } = require('tokens');
	const { Loc } = require('loc/ai');
	const { makeLibraryImagePath } = require('asset-manager');
	const { Box } = require('ui-system/layout/box');
	const { BoxFooter } = require('ui-system/layout/dialog-footer');
	const { StatusBlock } = require('ui-system/blocks/status-block');
	const { Text5 } = require('ui-system/typography/text');
	const { Button, ButtonSize, ButtonDesign } = require('ui-system/form/buttons');
	const { createTestIdGenerator } = require('utils/test');
	const { PropTypes } = require('utils/validation');

	const SUBSCRIPTION_SUCCESS_HEIGHT = 470;

	/**
	 * @extends {LayoutComponent<SubscriptionSuccessProps>}
	 */
	class SubscriptionSuccess extends LayoutComponent
	{
		/**
		 * @param {LayoutWidget} parentWidget
		 * @return {void}
		 */
		static open(parentWidget = PageManager)
		{
			void new BottomSheet({
				component: (layout) => new SubscriptionSuccess({ layout }),
			})
				.setParentWidget(parentWidget)
				.setMediumPositionHeight(SUBSCRIPTION_SUCCESS_HEIGHT)
				.disableSwipe()
				.open()
			;
		}

		/**
		 * @param {SubscriptionSuccessProps} props
		 */
		constructor(props)
		{
			super(props);

			this.getTestId = createTestIdGenerator({ context: this });
		}

		render()
		{
			return Box(
				{
					testId: this.getTestId(),
					backgroundColor: Color.bgContentPrimary,
					footer: BoxFooter(
						{
							testId: this.getTestId('footer'),
							safeArea: true,
						},
						Text5({
							testId: this.getTestId('footnote'),
							text: Loc.getMessage('M_SUBSCRIPTION_SUCCESS_FOOTNOTE'),
							color: Color.base3,
							style: {
								textAlign: 'center',
								marginBottom: Indent.M.toNumber(),
							},
						}),
						Button({
							testId: this.getTestId('ok-btn'),
							text: Loc.getMessage('M_SUBSCRIPTION_SUCCESS_OK'),
							size: ButtonSize.L,
							stretched: true,
							style: {
								marginBottom: Indent.L.toNumber(),
							},
							onClick: () => this.props.layout.close?.(),
						}),
						Button({
							testId: this.getTestId('more-btn'),
							text: Loc.getMessage('M_SUBSCRIPTION_SUCCESS_MORE'),
							size: ButtonSize.L,
							design: ButtonDesign.PLAN_ACCENT,
							stretched: true,
							onClick: () => helpdesk.openHelpArticle('19411366', 'helpdesk'),
						}),
					),
				},
				StatusBlock({
					testId: this.getTestId('status'),
					title: Loc.getMessage('M_SUBSCRIPTION_SUCCESS_TITLE'),
					description: Loc.getMessage('M_SUBSCRIPTION_SUCCESS_DESCRIPTION'),
					descriptionColor: Color.base1,
					image: Image({
						testId: this.getTestId('graphic'),
						style: {
							width: 128,
							height: 128,
						},
						resizeMode: 'contain',
						uri: makeLibraryImagePath('subscription-demo-activation-success.png', 'volumetric'),
					}),
				}),
			);
		}
	}

	SubscriptionSuccess.propTypes = {
		layout: PropTypes.object.isRequired,
	};

	module.exports = { SubscriptionSuccess };
});
