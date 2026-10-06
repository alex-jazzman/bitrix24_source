/**
 * @module im/messenger/controller/chat-invite/tabs/guests/view
 */
jn.define('im/messenger/controller/chat-invite/tabs/guests/view', (require, exports, module) => {
	const { Loc } = require('loc');
	const { Color, Indent, Component } = require('tokens');
	const { makeLibraryImagePath } = require('im/messenger/assets');
	const { GuestInviteImage } = require('im/messenger/controller/chat-invite/const');
	const { Box } = require('ui-system/layout/box');
	const { AreaList } = require('ui-system/layout/area-list');
	const { Area } = require('ui-system/layout/area');
	const { BoxFooter } = require('ui-system/layout/dialog-footer');
	const { H4 } = require('ui-system/typography/heading');
	const { Text3 } = require('ui-system/typography/text');
	const { Button, ButtonSize, ButtonDesign } = require('ui-system/form/buttons');
	const { Link4, LinkMode, Ellipsize } = require('ui-system/blocks/link');
	const { Icon } = require('ui-system/blocks/icon');

	const guestInviteHelpArticleCode = '28506782';

	/**
	 * @class GuestsTabView
	 * @typedef {LayoutComponent<GuestsTabViewProps>} GuestsTabView
	 */
	class GuestsTabView extends LayoutComponent
	{
		/**
		 * @param {GuestsTabViewProps} props
		 */
		constructor(props)
		{
			super(props);

			this.getTestId = props.getTestId;
		}

		/**
		 * @return {LayoutComponent}
		 */
		render()
		{
			return Box(
				{
					testId: this.getTestId(),
					safeArea: { bottom: true },
					footer: this.#renderButtons(),
				},
				AreaList(
					{ testId: this.getTestId('area-list') },
					this.#renderGraphicsWithDescription(),
				),
			);
		}

		/**
		 * @return {LayoutComponent} BoxFooter with "by-link", "regenerate-link" and "by-other" action buttons.
		 */
		#renderButtons()
		{
			return BoxFooter(
				{
					safeArea: true,
					testId: this.getTestId('buttons'),
				},
				Button(
					{
						testId: this.getTestId('by-link-button'),
						text: Loc.getMessage('IMMOBILE_CHAT_INVITE_TAB_GUESTS_BY_LINK_BUTTON'),
						size: ButtonSize.L,
						design: ButtonDesign.PRIMARY,
						leftIcon: Icon.LINK,
						stretched: true,
						style: { marginBottom: Indent.L.toNumber() },
						onClick: async () => {
							await this.props.onInviteByLink();
						},
					},
				),
				Button(
					{
						testId: this.getTestId('regenerate-link-button'),
						text: Loc.getMessage('IMMOBILE_CHAT_INVITE_TAB_GUESTS_REGENERATE_LINK_BUTTON'),
						size: ButtonSize.L,
						design: ButtonDesign.OUTLINE,
						leftIcon: Icon.REFRESH,
						stretched: true,
						style: { marginBottom: Indent.L.toNumber() },
						onClick: async () => {
							await this.props.onRegenerateLink();
						},
					},
				),
				Button(
					{
						testId: this.getTestId('by-other-button'),
						forwardRef: (ref) => {
							this.inviteCasesButtonRef = ref;
						},
						text: Loc.getMessage('IMMOBILE_CHAT_INVITE_TAB_GUESTS_BY_OTHER_BUTTON'),
						size: ButtonSize.S,
						design: ButtonDesign.PLAN_ACCENT,
						stretched: true,
						onClick: async () => {
							await this.props.onOpenCasesMenu(this.inviteCasesButtonRef);
						},
					},
				),
			);
		}

		/**
		 * @return {LayoutComponent}
		 */
		#renderGraphicsWithDescription()
		{
			return Area(
				{},
				View(
					{ style: { paddingHorizontal: Component.paddingLr.toNumber() } },
					this.#renderGraphics(),
					this.#renderHeader(),
					this.#renderText(),
					this.#renderDetailsLink(),
				),
			);
		}

		/**
		 * @return {LayoutComponent}
		 */
		#renderGraphics()
		{
			const uri = makeLibraryImagePath(GuestInviteImage.name, GuestInviteImage.library);

			return View(
				{
					style: {
						width: '100%',
						alignItems: 'center',
						paddingHorizontal: Component.paddingLr.toNumber(),
						marginBottom: Indent.XL3.toNumber(),
					},
				},
				Image({
					style: { width: 162, height: 162 },
					svg: { resizeMode: 'contain', uri },
				}),
			);
		}

		/**
		 * @return {LayoutComponent}
		 */
		#renderHeader()
		{
			return H4({
				testId: this.getTestId('header'),
				text: Loc.getMessage('IMMOBILE_CHAT_INVITE_TAB_GUESTS_TEXT_HEADER'),
				color: Color.base1,
				style: {
					textAlign: 'center',
					marginBottom: Indent.M.toNumber(),
				},
			});
		}

		/**
		 * @return {LayoutComponent}
		 */
		#renderText()
		{
			return Text3({
				testId: this.getTestId('text'),
				text: Loc.getMessage('IMMOBILE_CHAT_INVITE_TAB_GUESTS_TEXT'),
				color: Color.base2,
				numberOfLines: 0,
				ellipsize: 'end',
				style: { textAlign: 'center' },
			});
		}

		/**
		 * @return {LayoutComponent} "Подробнее" link opening help article.
		 */
		#renderDetailsLink()
		{
			return View(
				{
					style: {
						paddingTop: Indent.M.toNumber(),
						paddingBottom: Indent.XL4.toNumber(),
						width: '100%',
						alignContent: 'center',
						alignItems: 'center',
					},
				},
				Link4({
					testId: this.getTestId('details-link'),
					text: Loc.getMessage('IMMOBILE_CHAT_INVITE_DETAILS_LINK_TEXT'),
					ellipsize: Ellipsize.END,
					mode: LinkMode.SOLID,
					color: Color.base3,
					numberOfLines: 1,
					textDecorationLine: 'underline',
					onClick: this.#onDetailLinkClick,
				}),
			);
		}

		/**
		 * @desc Opens the help-article about guest chats.
		 */
		#onDetailLinkClick = () => {
			helpdesk.openHelpArticle(guestInviteHelpArticleCode, 'helpdesk');
		};
	}

	module.exports = { GuestsTabView };
});
