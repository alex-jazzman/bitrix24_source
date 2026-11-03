/**
 * @module intranet/self-delete/src/screen/base-screen
 */
jn.define('intranet/self-delete/src/screen/base-screen', (require, exports, module) => {
	const { Loc } = require('loc');
	const { Color, Indent } = require('tokens');
	const { BottomSheet } = require('bottom-sheet');
	const { Box } = require('ui-system/layout/box');
	const { BoxFooter } = require('ui-system/layout/dialog-footer');
	const { Button, ButtonDesign, ButtonSize } = require('ui-system/form/buttons/button');
	const { StatusBlock } = require('ui-system/blocks/status-block');
	const { makeLibraryImagePath } = require('asset-manager');
	const { openQRAuth } = require('qrauth/utils');
	const { PropTypes } = require('utils/validation');
	const { createTestIdGenerator } = require('utils/test');

	// Uniform height for every scenario (the tallest content); content is centered.
	const BACKDROP_HEIGHT = 560;

	/**
	 * @abstract
	 * @extends {LayoutComponent<BaseScreenProps, {}>}
	 */
	class BaseScreen extends LayoutComponent
	{
		constructor(props)
		{
			super(props);

			this.getTestId = createTestIdGenerator({
				prefix: this.getTestIdPrefix(),
				context: this,
			});
		}

		/**
		 * Opens this screen in a bottom sheet. Inherited by every subclass —
		 * `this` is the concrete subclass, so `new this(...)` builds the right one.
		 *
		 * @param {SelfDeleteOptions} data
		 * @param {PageManager} parentWidget
		 */
		static open(data, parentWidget)
		{
			void new BottomSheet({
				titleParams: {
					text: Loc.getMessage('M_INTRANET_SELF_DELETE_SCREEN_TITLE'),
					type: 'dialog',
				},
				component: (widget) => new this({ data, layoutWidget: widget }),
			})
				.setParentWidget(parentWidget ?? PageManager)
				.setBackgroundColor(Color.bgSecondary.toHex())
				.setNavigationBarColor(Color.bgSecondary.toHex())
				.setMediumPositionHeight(BACKDROP_HEIGHT)
				.open()
			;
		}

		get data()
		{
			return this.props.data;
		}

		get layoutWidget()
		{
			return this.props.layoutWidget;
		}

		// --- Hooks (overridden by subclasses) ---

		/** @returns {string} */
		getTestIdPrefix()
		{
			return 'self-delete';
		}

		/** @returns {?string} */
		getTitle()
		{
			return null;
		}

		/** @returns {string} */
		getDescription()
		{
			return '';
		}

		/** @returns {(() => void)} */
		getDescriptionLinkClick()
		{
			return () => {};
		}

		/** @returns {{ text: string, onClick: () => void }} */
		getPrimaryButton()
		{
			throw new Error('BaseScreen: getPrimaryButton() must be implemented');
		}

		/** @returns {{ text: string, onClick: () => void }} */
		getSecondaryButton()
		{
			return {
				text: Loc.getMessage('M_INTRANET_SELF_DELETE_BTN_CANCEL'),
				onClick: () => this.layoutWidget?.close(),
			};
		}

		// --- Shared button actions (used by subclasses) ---

		/**
		 * Go-to-web: the portal-settings section is desktop-only, so the user is
		 * sent to the desktop via QR. Used by the portal-delete and transfer-rights-free screens.
		 */
		openGoToWeb()
		{
			this.layoutWidget?.close(() => {
				openQRAuth({
					title: Loc.getMessage('M_INTRANET_SELF_DELETE_GO_TO_WEB_TITLE'),
					redirectUrl: this.data.portalDeleteUrl,
					showHint: true,
					analyticsSection: 'self_delete',
				});
			});
		}

		/**
		 * Opens the "how to transfer rights" helpdesk article. Used by the transfer-rights-free and
		 * transfer-rights-paid screens.
		 */
		openTransferRightsHelp()
		{
			if (this.data.transferRightsHelpdeskCode)
			{
				helpdesk.openHelpArticle(String(this.data.transferRightsHelpdeskCode), 'helpdesk');
			}
		}

		// --- Shared rendering ---

		#renderImage()
		{
			return Image({
				testId: this.getTestId('image'),
				resizeMode: 'contain',
				uri: makeLibraryImagePath('delete_profile.png', 'self-delete', 'intranet'),
				style: {
					width: 186,
					height: 153,
				},
			});
		}

		#renderFooter()
		{
			const primary = this.getPrimaryButton();
			const secondary = this.getSecondaryButton();

			return BoxFooter(
				{
					testId: this.getTestId('footer'),
					safeArea: true,
				},
				Button({
					testId: this.getTestId('btn-primary'),
					text: primary.text,
					design: ButtonDesign.FILLED,
					size: ButtonSize.L,
					stretched: true,
					onClick: primary.onClick,
				}),
				Button({
					testId: this.getTestId('btn-secondary'),
					text: secondary.text,
					design: ButtonDesign.PLAIN,
					size: ButtonSize.L,
					stretched: true,
					style: {
						marginTop: Indent.L.toNumber(),
					},
					onClick: secondary.onClick,
				}),
			);
		}

		render()
		{
			return Box(
				{
					testId: this.getTestId('screen'),
					safeArea: {
						bottom: true,
					},
					footer: this.#renderFooter(),
				},
				StatusBlock({
					testId: this.getTestId('status'),
					image: this.#renderImage(),
					title: this.getTitle(),
					description: this.getDescription(),
					onDescriptionLinkClick: this.getDescriptionLinkClick(),
				}),
			);
		}
	}

	// Shared by every self-delete screen (subclasses inherit these props).
	BaseScreen.propTypes = {
		data: PropTypes.shape({
			scenario: PropTypes.string,
			adminIds: PropTypes.array,
			supportEmail: PropTypes.string,
			transferRightsHelpdeskCode: PropTypes.number,
			portalDeleteUrl: PropTypes.string,
		}).isRequired,
		layoutWidget: PropTypes.object,
	};

	module.exports = { BaseScreen };
});
