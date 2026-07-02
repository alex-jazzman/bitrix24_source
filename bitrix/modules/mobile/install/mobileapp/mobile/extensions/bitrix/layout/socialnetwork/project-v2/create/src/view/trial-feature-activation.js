/**
 * @module layout/socialnetwork/project-v2/create/src/view/trial-feature-activation
 */
jn.define('layout/socialnetwork/project-v2/create/src/view/trial-feature-activation', (require, exports, module) => {
	const { BottomSheet } = require('bottom-sheet');
	const { Color } = require('tokens');
	const { Loc } = require('loc');
	const { Box } = require('ui-system/layout/box');
	const { BoxFooter } = require('ui-system/layout/dialog-footer');
	const { StatusBlock } = require('ui-system/blocks/status-block');
	const { Button, ButtonSize } = require('ui-system/form/buttons');
	const { makeLibraryImagePath } = require('asset-manager');
	const { createTestIdGenerator } = require('utils/test');

	class ProjectTrialFeatureActivation extends LayoutComponent
	{
		static open(parentWidget = PageManager)
		{
			void new BottomSheet({
				titleParams: {
					type: 'dialog',
					text: Loc.getMessage('MOBILE_LAYOUT_PROJECT_V2_CREATE_TRIAL_FEATURE_ACTIVATION_TITLE'),
				},
				component: (layout) => new ProjectTrialFeatureActivation({ layout }),
			})
				.setParentWidget(parentWidget)
				.setMediumPositionHeight(420)
				.setNavigationBarColor(Color.bgNavigation.toHex())
				.open()
			;
		}

		render()
		{
			const getTestId = createTestIdGenerator({
				prefix: 'project-create-trial-feature-activation',
				context: this,
			});

			return Box(
				{
					backgroundColor: Color.bgContentPrimary,
					testId: getTestId(),
					footer: BoxFooter(
						{
							testId: getTestId('footer'),
							safeArea: true,
						},
						Button({
							testId: getTestId('ok-btn'),
							text: Loc.getMessage('MOBILE_LAYOUT_PROJECT_V2_CREATE_TRIAL_FEATURE_ACTIVATION_BUTTON_OK'),
							size: ButtonSize.L,
							stretched: true,
							onClick: () => this.props.layout.close(),
						}),
					),
				},
				StatusBlock({
					image: Image({
						style: {
							width: 108,
							height: 108,
						},
						svg: {
							uri: makeLibraryImagePath('project-trial-activation-success.svg', 'graphic'),
						},
					}),
					description: Loc.getMessage('MOBILE_LAYOUT_PROJECT_V2_CREATE_TRIAL_FEATURE_ACTIVATION_DESCRIPTION'),
					descriptionColor: Color.base1,
					testId: getTestId('status-block'),
				}),
			);
		}
	}

	module.exports = { ProjectTrialFeatureActivation };
});
