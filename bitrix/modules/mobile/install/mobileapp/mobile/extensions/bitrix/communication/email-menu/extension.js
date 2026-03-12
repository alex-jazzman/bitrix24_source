/**
 * @module communication/email-menu
 */
jn.define('communication/email-menu', (require, exports, module) => {
	const { Icon } = require('assets/icons');
	const { ContextMenu } = require('layout/ui/context-menu');
	const { Loc } = require('loc');
	const { copyToClipboard } = require('utils/copy');
	const { stringify } = require('utils/string');
	const { isModuleInstalled } = require('module');
	const { MailDialog } = require('mail/dialog');
	const { Type } = require('type');

	class EmailMenu
	{
		/**
		 * @param {Object} props
		 * @param {string} props.email
		 * @param {PageManager} props.layoutWidget
		 */
		constructor(props)
		{
			this.props = props;
			this.preparedEmail = stringify(this.props.email).trim();
			this.mailOpenerData = null;
			this.canSendEmailByB24 = null;
			this.menu = null;
		}

		/**
		 * @public
		 * @returns {Promise<void>}
		 */
		async open()
		{
			if (!this.preparedEmail || this.preparedEmail === '')
			{
				return;
			}

			this.menu = new ContextMenu(this.#getContextMenuProps());

			await this.menu.show(this.props?.layoutWidget ?? PageManager);

			this.mailOpenerData = await this.#getMailOpenerData();
			this.canSendEmailByB24 = await this.#isMailSendAvailable();

			this.menu.rerender(this.#getContextMenuProps());
		}

		#getContextMenuProps()
		{
			return {
				actions: this.getMenuActions(),
				params: {
					title: this.preparedEmail,
				},
			};
		}

		#isMailSendAvailable()
		{
			return isModuleInstalled('mail') && this.#hasUserConnectedMail();
		}

		async #getMailOpenerData()
		{
			try
			{
				const { MailOpener } = require('mail/opener');
				if (!MailOpener)
				{
					return null;
				}

				return MailOpener.preloadInfo(this.#getMailOpenerComponentParams());
			}
			catch (error)
			{
				console.error(error);

				return null;
			}
		}

		#hasUserConnectedMail()
		{
			return Type.isArrayFilled(this?.mailOpenerData?.senders);
		}

		#openMailSendForm({ parentWidget })
		{
			const { MailOpener } = require('mail/opener');
			MailOpener?.openSend(this.#getMailOpenerComponentParams(), {}, parentWidget);
		}

		#getMailOpenerComponentParams()
		{
			return {
				showLoadingIndicator: false,
				preloadedInfo: this.mailOpenerData,
				isCrmMessage: false,
				contacts: [{
					customData: {
						email: this.preparedEmail,
						isEmailHidden: false,
					},
				}],
			};
		}

		getMenuActions()
		{
			const isShimmerEnabled = this.canSendEmailByB24 === null;

			return [
				{
					title: Loc.getMessage('EMAIL_MENU_B24'),
					code: 'sendB24Email',
					isShimmerEnabled,
					subtitle: !this.canSendEmailByB24 && !isShimmerEnabled && Loc.getMessage('EMAIL_MENU_B24_DISABLED'),
					subtitleType: !this.canSendEmailByB24 && !isShimmerEnabled && 'warning',
					icon: Icon.SEND_VIA_BITRIX,
					onClickCallback: async (action, itemId, { parentWidget }) => {
						const { layoutWidget = PageManager } = this.props;

						this.menu.close(() => {
							if (this.canSendEmailByB24)
							{
								this.#openMailSendForm({ parentWidget: layoutWidget });

								return;
							}

							MailDialog.show({
								type: MailDialog.CONNECTING_MAIL_TYPE,
								parentWidget: layoutWidget,
								successCallback: async () => {
									this.mailOpenerData = null;
									this.canSendEmailByB24 = null;
									this.mailOpenerData = await this.#getMailOpenerData();
									this.canSendEmailByB24 = await this.#isMailSendAvailable();
									this.#openMailSendForm({ parentWidget: layoutWidget });
								},
							});
						});
					},
				},
				{
					title: Loc.getMessage('EMAIL_MENU_NATIVE'),
					code: 'sendNativeEmail',
					isShimmerEnabled,
					icon: Icon.MAIL,
					onClickCallback: () => {
						const closeCallback = () => Application.openUrl(`mailto:${this.preparedEmail}`);

						return Promise.resolve({ closeCallback });
					},
				},
				{
					title: Loc.getMessage('EMAIL_MENU_COPY'),
					code: 'copy',
					isShimmerEnabled,
					icon: Icon.COPY,
					onClickCallback: () => {
						const closeCallback = () => copyToClipboard(this.preparedEmail, Loc.getMessage('EMAIL_MENU_COPY_DONE'));

						return Promise.resolve({ closeCallback });
					},
				},
			];
		}
	}

	/**
	 * @public
	 * @function openEmailMenu
	 * @param {Object} params
	 * @param {string} params.email
	 * @param {PageManager} params.layoutWidget
	 */
	const openEmailMenu = async ({ email, layoutWidget }) => {
		return (new EmailMenu({ email, layoutWidget })).open();
	};

	module.exports = { openEmailMenu };
});
