/**
 * @module mail/dialog/banners/providerrestriction
 */
jn.define('mail/dialog/banners/providerrestriction', (require, exports, module) => {
	const { Loc } = require('loc');
	const { Type } = require('type');
	const { Indent } = require('tokens');
	const { requireLazy } = require('require-lazy');
	const {
		ButtonSize,
		ButtonDesign,
		Button,
	} = require('ui-system/form/buttons/button');
	const { BannerTemplate } = require('mail/dialog/banners/template');
	const {
		MigrationNotice,
		MigrationNoticeSurface,
		openMigrationNoticeTarget,
	} = require('mail/dialog/banners/migrationnotice');
	const { AnalyticsEvent } = require('analytics');

	const PROVIDER_NAMES = {
		yandex: 'Яндекс',
		mailru: 'Mail.ru',
	};

	/** ERR-1. The one decision code this message draws beside itself; the rest belong to other messages. */
	const OFFER_CODE = 'err_1_offer';

	class ProviderRestriction extends LayoutComponent
	{
		/**
		 * ERR-1. Whether Bitrix24 Mail is offered beside this message the server says, and it says it
		 * about this very mailbox: a mailbox a migration message is due about gets no offer, because
		 * that message carries a way out and this one only a new address (ERR-008).
		 *
		 * The message list brings no decision to this message - it is opened from the response of a
		 * mailbox that has nothing to show a list of - so the decision is asked for here (API-01).
		 *
		 * @param {{ mailboxId?: number }} props
		 * @return {Promise<{ offer: MigrationNoticeDecision|null }>}
		 */
		static async preFetch(props)
		{
			const decision = await MigrationNotice.request(
				MigrationNoticeSurface.mobileList,
				Number(props?.mailboxId ?? 0),
			);

			return { offer: decision?.code === OFFER_CODE ? decision : null };
		}

		constructor(props)
		{
			super(props);

			const {
				layoutWidget,
				parentWidget,
				provider = '',
				mailboxId = 0,
				offer = null,
			} = props;

			this.layoutWidget = layoutWidget;
			this.parentWidget = parentWidget;
			this.provider = provider;
			this.mailboxId = mailboxId;
			this.offer = offer;
		}

		componentDidMount()
		{
			this.sendAnalytics('banner_view');
		}

		getProviderName()
		{
			return PROVIDER_NAMES[this.provider] || this.provider;
		}

		sendAnalytics(element)
		{
			new AnalyticsEvent({
				tool: 'mail',
				category: 'mail_general_ops',
				event: 'provider_restriction_notice',
				type: this.provider,
				c_section: 'mail_list',
				c_element: element,
			}).send();
		}

		async openOnDesktop()
		{
			this.sendAnalytics('open_desktop_button');

			try
			{
				const { qrauth } = await requireLazy('qrauth/utils');

				qrauth.open({
					title: Loc.getMessage('MAIL_BANNER_PROVIDER_RESTRICTION_BUTTON'),
					hintText: Loc.getMessage('MAIL_BANNER_PROVIDER_RESTRICTION_QR_HINT'),
					redirectUrl: `/mail/config/edit?id=${this.mailboxId}`,
					showHint: true,
				});
			}
			catch (error)
			{
				console.error('mail:providerRestriction:openOnDesktop error', error);
			}
		}

		/**
		 * The way to the mailbox settings stays and comes first (AC-030): a person is here to get their
		 * own mailbox working again, not only to be led to another one. What the server offered goes
		 * after it, and nothing at all goes there when it offered nothing.
		 */
		renderButtons()
		{
			return View(
				{},
				Button({
					testId: 'mail-provider-restriction-open-desktop',
					text: Loc.getMessage('MAIL_BANNER_PROVIDER_RESTRICTION_BUTTON'),
					size: ButtonSize.XL,
					design: ButtonDesign.FILLED,
					stretched: true,
					onClick: () => this.openOnDesktop(),
				}),
				...this.renderOfferButtons(),
			);
		}

		/** Every button of the offer as the decision named it; none of them is invented here. */
		renderOfferButtons()
		{
			return (this.offer?.buttons ?? []).map((button, index) => View(
				{
					style: {
						marginTop: Indent.M.toNumber(),
					},
				},
				Button({
					testId: `mail-provider-restriction-offer-${index}`,
					text: button.label,
					size: ButtonSize.XL,
					design: ButtonDesign.OUTLINE,
					stretched: true,
					onClick: () => this.handleOfferButton(button),
				}),
			));
		}

		/**
		 * DTO-02. Every button of the offer is followed where its address leads, the offer of Bitrix24
		 * Mail (AC-031) included. Creating such a mailbox inside the application belongs to another
		 * feature, and that one keeps a switch of its own, off on an ordinary portal: were this button
		 * to open that wizard, a portal carrying this feature and not the other would answer the tap
		 * with a screen that is not there. So the offer goes the way the transfer of the mail of the
		 * company already goes - out to the web, where the way to a mailbox of Bitrix24 is whole.
		 *
		 * This takes the one button out of the rule that an identifier the application knows is
		 * followed before an address; it does not take the rule down, and the other messages of the
		 * feature keep it.
		 *
		 * Where an address leads is settled in one place for every message of the feature
		 * ({@see openMigrationNoticeTarget}) - for a page of the portal, the same «open on a computer»
		 * screen this message offers beside it. AC-032: the message has no cross and is not the
		 * person's to close, so whatever opens stands over it.
		 *
		 * @param {MigrationNoticeButton} button
		 */
		handleOfferButton(button)
		{
			if (Type.isStringFilled(button.url))
			{
				void openMigrationNoticeTarget(button, this.layoutWidget ?? this.parentWidget);
			}
		}

		render()
		{
			return BannerTemplate({
				iconPathName: 'mailbox-error.png',
				iconWidth: '171',
				iconHeight: '163',
				title: Loc.getMessage('MAIL_BANNER_PROVIDER_RESTRICTION_TITLE', {
					'#PROVIDER#': this.getProviderName(),
				}),
				description: Loc.getMessage('MAIL_BANNER_PROVIDER_RESTRICTION_DESCRIPTION'),
				buttonsView: this.renderButtons(),
			});
		}
	}

	module.exports = { ProviderRestriction };
});
