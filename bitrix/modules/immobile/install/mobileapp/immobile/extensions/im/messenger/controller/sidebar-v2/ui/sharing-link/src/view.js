/**
 * @module im/messenger/controller/sidebar-v2/ui/sharing-link/src/view
 */
jn.define('im/messenger/controller/sidebar-v2/ui/sharing-link/src/view', (require, exports, module) => {
	const { Type } = require('type');
	const { Haptics } = require('haptics');
	const { isOnline } = require('device/connection');

	const { Loc } = require('im/messenger/controller/sidebar-v2/loc');
	const { Feature } = require('im/messenger/lib/feature');
	const { DialogHelper } = require('im/messenger/lib/helper');
	const { ChatPermission } = require('im/messenger/lib/permission-manager');
	const { serviceLocator } = require('im/messenger/lib/di/service-locator');
	const { LoggerManager } = require('im/messenger/lib/logger');
	const { Notification, ToastType } = require('im/messenger/lib/ui/notification');
	const { SharingLinkService } = require('im/messenger/provider/services/sharing-link');

	const { Text4 } = require('ui-system/typography');
	const { Indent, Color } = require('tokens');
	const { IconView, Icon } = require('ui-system/blocks/icon');
	const { PopupMenu } = require('ui-system/popups/popup-menu');

	const logger = LoggerManager.getInstance().getLogger('sidebar-sharing-link');

	/**
	 * @class SharingLinkSection
	 */
	class SharingLinkSection extends LayoutComponent
	{
		/**
		 * @param {object} props
		 * @param {string} props.dialogId
		 */
		constructor(props)
		{
			super(props);

			this.dialogId = props.dialogId;
			this.store = serviceLocator.get('core').getStore();
			this.service = new SharingLinkService();
			this.menuRef = null;
			this.moreButtonRef = null;
			this.loadPromise = null;
			this.pendingCopy = false;
		}

		componentDidMount()
		{
			if (!SharingLinkService.isFetched(this.dialogId))
			{
				void this.loadLink();
			}
		}

		async loadLink()
		{
			this.loadPromise = this.service.getIndividual(this.dialogId);

			try
			{
				await this.loadPromise;

				if (this.pendingCopy)
				{
					this.pendingCopy = false;
					const link = this.getChatInviteLink();
					if (link?.url)
					{
						this.#doCopy(link.url);
					}
				}
			}
			catch (error)
			{
				logger.error('SharingLinkSection.loadLink error', error);
				this.pendingCopy = false;
			}
			finally
			{
				this.loadPromise = null;
			}
		}

		/**
		 * @return {Object|undefined}
		 */
		getChatInviteLink()
		{
			const dialogHelper = DialogHelper.createByDialogId(this.dialogId);
			const chatId = dialogHelper?.dialogModel?.chatId;
			if (!chatId)
			{
				return null;
			}

			return this.store.getters['sidebarModel/sidebarSharedLinkModel/getChatInviteLink'](chatId);
		}

		onCopy()
		{
			if (!isOnline())
			{
				Notification.showOfflineToast();

				return;
			}

			const link = this.getChatInviteLink();

			if (Type.isStringFilled(link?.url))
			{
				this.#doCopy(link.url);

				return;
			}

			// Link not loaded yet — wait for it
			this.pendingCopy = true;

			if (!this.loadPromise)
			{
				this.loadLink();
			}
		}

		#doCopy(url)
		{
			Application.copyToClipboard(url);
			Haptics.notifySuccess();

			Notification.showToast(ToastType.sharingLinkCopied);
		}

		async onRegenerate()
		{
			if (!isOnline())
			{
				Notification.showOfflineToast();

				return;
			}

			const link = this.getChatInviteLink();
			if (!Type.isStringFilled(link?.code))
			{
				return;
			}

			try
			{
				await this.service.regenerateIndividual(link.code);

				Notification.showToast(ToastType.sharingLinkRegenerated);
			}
			catch (error)
			{
				logger.error('SharingLinkSection.onRegenerate error', error);

				Notification.showToast(ToastType.sharingLinkRegenerateError);
			}
		}

		showMenu()
		{
			if (!this.menuRef)
			{
				this.menuRef = new PopupMenu([
					{
						id: 'copy',
						testId: 'invite-menu-copy-item',
						title: Loc.getMessage('IMMOBILE_SIDEBAR_V2_SHARING_LINK_MENU_COPY'),
						iconName: Icon.COPY,
						onItemSelected: () => this.onCopy(),
					},
					{
						id: 'regenerate',
						testId: 'invite-menu-regenerate-item',
						title: Loc.getMessage('IMMOBILE_SIDEBAR_V2_SHARING_LINK_MENU_REGENERATE'),
						iconName: Icon.REFRESH,
						onItemSelected: () => this.onRegenerate(),
					},
				]);
			}

			this.menuRef.show({ target: this.moreButtonRef });
		}

		render()
		{
			return View(
				{
					testId: 'invite-link-container',
					style: {
						flexDirection: 'row',
						alignItems: 'center',
						paddingHorizontal: Indent.XL3.toNumber(),
						paddingTop: Indent.XL.toNumber(),
						paddingBottom: Indent.XS.toNumber(),
					},
				},
				View(
					{
						testId: 'invite-link-copy-container',
						style: {
							flex: 1,
							flexDirection: 'row',
							alignItems: 'center',
						},
						onClick: () => this.onCopy(),
					},
					IconView({
						testId: 'invite-link-icon',
						icon: Icon.COPY,
						size: 24,
						color: Color.accentMainPrimary,
					}),
					Text4({
						testId: 'invite-link-text',
						text: Loc.getMessage('IMMOBILE_SIDEBAR_V2_SHARING_LINK_ROW_TEXT'),
						color: Color.accentMainPrimary,
						numberOfLines: 1,
						ellipsize: 'end',
						style: {
							marginLeft: Indent.XL.toNumber(),
						},
					}),
				),
				View(
					{
						testId: 'invite-link-button-menu',
						ref: (ref) => {
							this.moreButtonRef = ref;
						},
						style: {
							padding: Indent.XS.toNumber(),
						},
						onClick: () => this.showMenu(),
					},
					IconView({
						icon: Icon.MORE,
						size: 24,
						color: Color.base3,
					}),
				),
			);
		}

		/**
		 * @param {string} dialogId
		 * @return {boolean}
		 */
		static shouldShow(dialogId)
		{
			if (!Feature.isChatSharingLinkAvailable)
			{
				return false;
			}

			const dialogHelper = DialogHelper.createByDialogId(dialogId);
			if (!dialogHelper)
			{
				return false;
			}

			if (dialogHelper.isDirect || dialogHelper.isNested || dialogHelper.isTaskComment || dialogHelper.isCollab || dialogHelper.isOpenlines)
			{
				return false;
			}

			return ChatPermission.canAddParticipants(dialogId);
		}
	}

	module.exports = { SharingLinkSection };
});
