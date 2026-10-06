/**
 * @module mail/dialog/banners/providerrestriction
 */
jn.define('mail/dialog/banners/providerrestriction', (require, exports, module) => {
	const { Loc } = require('loc');
	const { requireLazy } = require('require-lazy');
	const {
		ButtonSize,
		ButtonDesign,
		Button,
	} = require('ui-system/form/buttons/button');
	const { BannerTemplate } = require('mail/dialog/banners/template');

	const PROVIDER_NAMES = {
		yandex: 'Яндекс',
		mailru: 'Mail.ru',
	};

	class ProviderRestriction extends LayoutComponent
	{
		constructor(props)
		{
			super(props);

			const {
				layoutWidget,
				parentWidget,
				provider = '',
				mailboxId = 0,
			} = props;

			this.layoutWidget = layoutWidget;
			this.parentWidget = parentWidget;
			this.provider = provider;
			this.mailboxId = mailboxId;
		}

		getProviderName()
		{
			return PROVIDER_NAMES[this.provider] || this.provider;
		}

		async openOnDesktop()
		{
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

		renderButton()
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
			);
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
				buttonsView: this.renderButton(),
			});
		}
	}

	module.exports = { ProviderRestriction };
});
