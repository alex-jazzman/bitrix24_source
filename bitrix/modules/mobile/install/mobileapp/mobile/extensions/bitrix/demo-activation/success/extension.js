/**
 * @module demo-activation/success
 */
jn.define('demo-activation/success', (require, exports, module) => {
	const { BottomSheet } = require('bottom-sheet');
	const { Color, Indent } = require('tokens');
	const { Loc } = require('loc');
	const { makeLibraryImagePath } = require('asset-manager');
	const { Box } = require('ui-system/layout/box');
	const { BoxFooter } = require('ui-system/layout/dialog-footer');
	const { StatusBlock } = require('ui-system/blocks/status-block');
	const { Text5 } = require('ui-system/typography/text');
	const { Button, ButtonSize, ButtonDesign } = require('ui-system/form/buttons');
	const { PropTypes } = require('utils/validation');

	/**
	 * @extends {LayoutComponent<DemoActivationSuccessProps>}
	 */
	class DemoActivationSuccess extends LayoutComponent
	{
		/**
		 * @param {PageManager} parentWidget
		 * @param {object} [options]
		 * @param {boolean} [options.skipRelogin] pass true when nothing was activated on the server
		 */
		static open(parentWidget = PageManager, { skipRelogin = false } = {})
		{
			void new BottomSheet({
				component: (layout) => new DemoActivationSuccess({ layout, skipRelogin }),
			})
				.setParentWidget(parentWidget)
				.setMediumPositionHeight(460)
				.disableSwipe()
				.open()
			;
		}

		componentDidMount()
		{
			this.props.layout.on('onViewHidden', () => this.#onDismiss());
		}

		render()
		{
			return Box(
				{
					backgroundColor: Color.bgContentPrimary,
					footer: BoxFooter(
						{
							safeArea: true,
						},
						Text5({
							testId: 'DEMO_ACTIVATION_SUCCESS_FOOTNOTE',
							text: Loc.getMessage('DEMO_ACTIVATION_SUCCESS_FOOTNOTE'),
							color: Color.base3,
							style: {
								textAlign: 'center',
								marginBottom: Indent.M.toNumber(),
							},
						}),
						Button({
							testId: 'DEMO_ACTIVATION_SUCCESS_BUTTON_OK',
							text: Loc.getMessage('DEMO_ACTIVATION_SUCCESS_BUTTON_OK'),
							size: ButtonSize.L,
							stretched: true,
							style: {
								marginBottom: Indent.L.toNumber(),
							},
							onClick: () => this.#onDismiss(),
						}),
						Button({
							testId: 'DEMO_ACTIVATION_SUCCESS_BUTTON_MORE',
							text: Loc.getMessage('DEMO_ACTIVATION_SUCCESS_BUTTON_MORE'),
							size: ButtonSize.L,
							design: ButtonDesign.PLAN_ACCENT,
							stretched: true,
							onClick: () => helpdesk.openHelpArticle('22476482', 'helpdesk'),
						}),
					),
				},
				StatusBlock({
					testId: 'DEMO_ACTIVATION_SUCCESS',
					title: Loc.getMessage('DEMO_ACTIVATION_SUCCESS_TITLE'),
					description: Loc.getMessage('DEMO_ACTIVATION_SUCCESS_DESCRIPTION_MSGVER_1'),
					descriptionColor: Color.base1,
					image: Image({
						style: {
							width: 128,
							height: 128,
						},
						resizeMode: 'contain',
						uri: makeLibraryImagePath('demo-activation-success.png', 'volumetric'),
					}),
				}),
			);
		}

		#onDismiss()
		{
			// Relogin is what picks up the new rights, so it is skipped only when the caller
			// knows nothing was activated — the flag of the caller's own demo mode is not
			// readable here: this screen is shared with the real activation in plan-restriction.
			if (this.props.skipRelogin)
			{
				this.props.layout.close?.();

				return;
			}

			this.relogin();
		}

		relogin()
		{
			Application.clearCache();
			Application.relogin();
		}
	}

	DemoActivationSuccess.propTypes = {
		layout: PropTypes.object.isRequired,
		skipRelogin: PropTypes.bool,
	};

	module.exports = { DemoActivationSuccess };
});
