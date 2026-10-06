/**
 * @module im/messenger/controller/sidebar-v2/ui/sharing-link/src/view
 */
jn.define('im/messenger/controller/sidebar-v2/ui/sharing-link/src/view', (require, exports, module) => {
	const { Type } = require('type');
	const { Haptics } = require('haptics');
	const { isOnline } = require('device/connection');

	const { Loc } = require('im/messenger/controller/sidebar-v2/loc');
	const { ActionByUserType } = require('im/messenger/const');
	const { Feature } = require('im/messenger/lib/feature');
	const { DialogHelper } = require('im/messenger/lib/helper');
	const { ChatPermission, UserPermission } = require('im/messenger/lib/permission-manager');
	const { serviceLocator } = require('im/messenger/lib/di/service-locator');
	const { LoggerManager } = require('im/messenger/lib/logger');
	const { Notification, ToastType } = require('im/messenger/lib/ui/notification');
	const { showRegenerateSharingLinkAlert } = require('im/messenger/lib/ui/alert');
	const { SharingLinkService } = require('im/messenger/provider/services/sharing-link');
	const { DialogTextHelper } = require('im/messenger/controller/dialog/lib/helper/text');
	const { SIDEBAR_DEFAULT_TOAST_OFFSET } = require('im/messenger/controller/sidebar-v2/const');

	const { Text4 } = require('ui-system/typography');
	const { Indent, Color } = require('tokens');
	const { IconView, Icon } = require('ui-system/blocks/icon');
	const { PopupMenu } = require('ui-system/popups/popup-menu');

	const logger = LoggerManager.getInstance().getLogger('sidebar-sharing-link');

	/**
	 * @typedef {'employee' | 'guest'} LinkKind
	 */
	const LinkKind = {
		employee: 'employee',
		guest: 'guest',
	};

	const SectionCode = {
		employee: 'sharing-link-employee',
		guest: 'sharing-link-guest',
	};

	const MenuItemId = {
		copy: 'copy',
		regenerate: 'regenerate',
		copyEmployee: 'copy-employee',
		regenerateEmployee: 'regenerate-employee',
		copyGuest: 'copy-guest',
		regenerateGuest: 'regenerate-guest',
	};

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

			this.rowRef = null;
			this.moreButtonRef = null;
			this.employeeLoadPromise = null;
			this.guestLoadPromise = null;
			this.copyInProgress = {
				[LinkKind.employee]: false,
				[LinkKind.guest]: false,
			};
		}

		/**
		 * @return {boolean}
		 */
		get canInviteGuests()
		{
			if (!Feature.isChatWithGuestsAvailable)
			{
				return false;
			}

			return ChatPermission.canInviteGuests(this.dialogId);
		}

		componentDidMount()
		{
			if (!SharingLinkService.isFetched(this.dialogId))
			{
				this.#ensureLinkLoaded(LinkKind.employee).catch((error) => {
					logger.error('SharingLinkSection.preloadEmployee error', error);
				});
			}

			if (this.canInviteGuests && !SharingLinkService.isGuestFetched(this.dialogId))
			{
				this.#ensureLinkLoaded(LinkKind.guest).catch((error) => {
					logger.error('SharingLinkSection.preloadGuest error', error);
				});
			}
		}

		/**
		 * @param {LinkKind} kind
		 * @return {Promise<Object|null>}
		 */
		#ensureLinkLoaded(kind)
		{
			if (kind === LinkKind.guest)
			{
				if (!this.guestLoadPromise)
				{
					this.guestLoadPromise = this.service.getGuest(this.dialogId)
						.finally(() => { this.guestLoadPromise = null; });
				}

				return this.guestLoadPromise;
			}

			if (!this.employeeLoadPromise)
			{
				this.employeeLoadPromise = this.service.getIndividual(this.dialogId)
					.finally(() => { this.employeeLoadPromise = null; });
			}

			return this.employeeLoadPromise;
		}

		/**
		 * @param {LinkKind} kind
		 * @return {Object|null}
		 */
		#getLink(kind)
		{
			const dialogHelper = DialogHelper.createByDialogId(this.dialogId);
			const chatId = dialogHelper?.dialogModel?.chatId;
			if (!chatId)
			{
				return null;
			}

			const getterName = kind === LinkKind.guest
				? 'sidebarModel/sidebarSharedLinkModel/getChatGuestInviteLink'
				: 'sidebarModel/sidebarSharedLinkModel/getChatInviteLink';

			return this.store.getters[getterName](chatId);
		}

		onRowClick()
		{
			if (!this.canInviteGuests)
			{
				this.#copyOrSchedule(LinkKind.employee);

				return;
			}

			this.#showSelectMenu();
		}

		onMoreClick()
		{
			if (!this.canInviteGuests)
			{
				this.#showEmployeeMoreMenu();

				return;
			}

			this.#showFullMoreMenu();
		}

		#showSelectMenu()
		{
			const menu = new PopupMenu([
				this.#createCopyEmployeeItem(),
				this.#createCopyGuestItem(),
			]);

			menu.show({ target: this.rowRef });
		}

		#showEmployeeMoreMenu()
		{
			const items = [this.#createCopyItem()];
			if (this.#canRegenerate())
			{
				items.push(this.#createRegenerateItem());
			}

			const menu = new PopupMenu(items);

			menu.show({ target: this.moreButtonRef });
		}

		#showFullMoreMenu()
		{
			const items = [this.#createCopyEmployeeItem()];
			if (this.#canRegenerate())
			{
				items.push(this.#createRegenerateEmployeeItem());
			}

			items.push(this.#createCopyGuestItem());
			if (this.#canRegenerate())
			{
				items.push(this.#createRegenerateGuestItem());
			}

			const menu = new PopupMenu(items);

			menu.show({ target: this.moreButtonRef });
		}

		#createCopyItem()
		{
			return {
				id: MenuItemId.copy,
				testId: this.getTestId(MenuItemId.copy),
				title: Loc.getMessage('IMMOBILE_SIDEBAR_V2_SHARING_LINK_MENU_COPY'),
				iconName: Icon.COPY,
				onItemSelected: () => this.#copyOrSchedule(LinkKind.employee),
			};
		}

		#createRegenerateItem()
		{
			return {
				id: MenuItemId.regenerate,
				testId: this.getTestId(MenuItemId.regenerate),
				title: Loc.getMessage('IMMOBILE_SIDEBAR_V2_SHARING_LINK_MENU_REGENERATE'),
				iconName: Icon.REFRESH,
				onItemSelected: () => this.#confirmRegenerate(LinkKind.employee),
			};
		}

		#createCopyEmployeeItem()
		{
			return {
				id: MenuItemId.copyEmployee,
				testId: this.getTestId(MenuItemId.copyEmployee),
				title: Loc.getMessage('IMMOBILE_SIDEBAR_V2_SHARING_LINK_MENU_EMPLOYEE_LINK'),
				iconName: Icon.LINK,
				sectionCode: SectionCode.employee,
				onItemSelected: () => this.#copyOrSchedule(LinkKind.employee),
			};
		}

		#createCopyGuestItem()
		{
			return {
				id: MenuItemId.copyGuest,
				testId: this.getTestId(MenuItemId.copyGuest),
				title: Loc.getMessage('IMMOBILE_SIDEBAR_V2_SHARING_LINK_MENU_GUEST_LINK'),
				iconName: Icon.LINK,
				sectionCode: SectionCode.guest,
				onItemSelected: () => this.#copyOrSchedule(LinkKind.guest),
			};
		}

		#createRegenerateEmployeeItem()
		{
			return {
				id: MenuItemId.regenerateEmployee,
				testId: this.getTestId(MenuItemId.regenerateEmployee),
				title: Loc.getMessage('IMMOBILE_SIDEBAR_V2_SHARING_LINK_MENU_CHANGE'),
				iconName: Icon.REFRESH,
				destructive: true,
				sectionCode: SectionCode.employee,
				onItemSelected: () => this.#confirmRegenerate(LinkKind.employee),
			};
		}

		#createRegenerateGuestItem()
		{
			return {
				id: MenuItemId.regenerateGuest,
				testId: this.getTestId(MenuItemId.regenerateGuest),
				title: Loc.getMessage('IMMOBILE_SIDEBAR_V2_SHARING_LINK_MENU_CHANGE'),
				iconName: Icon.REFRESH,
				destructive: true,
				sectionCode: SectionCode.guest,
				onItemSelected: () => this.#confirmRegenerate(LinkKind.guest),
			};
		}

		async #copyOrSchedule(kind)
		{
			if (!isOnline())
			{
				Notification.showOfflineToast();

				return;
			}

			const link = this.#getLink(kind);
			if (Type.isStringFilled(link?.url))
			{
				this.#doCopy(link.url);

				return;
			}

			if (this.copyInProgress[kind])
			{
				return;
			}
			this.copyInProgress[kind] = true;

			try
			{
				await this.#ensureLinkLoaded(kind);
				const freshLink = this.#getLink(kind);
				if (Type.isStringFilled(freshLink?.url))
				{
					this.#doCopy(freshLink.url);
				}
			}
			catch (error)
			{
				logger.error('SharingLinkSection.copyOrSchedule load error', { kind, error });
			}
			finally
			{
				this.copyInProgress[kind] = false;
			}
		}

		#doCopy(url)
		{
			DialogTextHelper.copyToClipboard(
				url,
				{
					notificationText: Loc.getMessage('IMMOBILE_SIDEBAR_V2_COMMON_COPY_LINK_SUCCESS'),
					notificationIcon: Icon.COPY,
					toastOffset: SIDEBAR_DEFAULT_TOAST_OFFSET,
				},
				true,
			);
			Haptics.notifySuccess();
		}

		#confirmRegenerate(kind)
		{
			if (!isOnline())
			{
				Notification.showOfflineToast();

				return;
			}

			showRegenerateSharingLinkAlert({
				forGuests: kind === LinkKind.guest,
				onConfirm: () => this.#regenerate(kind),
			});
		}

		async #regenerate(kind)
		{
			try
			{
				if (kind === LinkKind.guest)
				{
					await this.service.regenerateGuest(this.dialogId);
				}
				else
				{
					let link = this.#getLink(LinkKind.employee);
					if (!Type.isStringFilled(link?.code))
					{
						await this.#ensureLinkLoaded(LinkKind.employee);
						link = this.#getLink(LinkKind.employee);
					}

					if (!Type.isStringFilled(link?.code))
					{
						Notification.showToast(ToastType.sharingLinkRegenerateError);

						return;
					}

					await this.service.regenerateIndividual(link.code);
				}

				Notification.showToast(ToastType.sharingLinkRegenerated);
			}
			catch (error)
			{
				logger.error('SharingLinkSection.regenerate error', { kind, error });

				Notification.showToast(ToastType.sharingLinkRegenerateError);
			}
		}

		/**
		 * Owner check uses chat owner; main project chat owner currently equals project owner.
		 * @return {boolean}
		 */
		#canRegenerate()
		{
			const dialogHelper = this.#getDialogHelper();
			if (!dialogHelper)
			{
				return true;
			}

			if (dialogHelper.isCollab && !dialogHelper.isNested)
			{
				return dialogHelper.isCurrentUserOwner;
			}

			return true;
		}

		/**
		 * @return {string}
		 */
		#getRowTextMessageKey()
		{
			const dialogHelper = this.#getDialogHelper();
			if (dialogHelper && dialogHelper.isCollab && !dialogHelper.isNested)
			{
				return 'IMMOBILE_SIDEBAR_V2_SHARING_LINK_ROW_TEXT_PROJECT';
			}

			return 'IMMOBILE_SIDEBAR_V2_SHARING_LINK_ROW_TEXT';
		}

		/**
		 * @return {?DialogHelper}
		 */
		#getDialogHelper()
		{
			if (!this._dialogHelper)
			{
				this._dialogHelper = DialogHelper.createByDialogId(this.dialogId);
			}

			return this._dialogHelper;
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
						ref: (ref) => {
							this.rowRef = ref;
						},
						style: {
							flex: 1,
							flexDirection: 'row',
							alignItems: 'center',
						},
						onClick: () => this.onRowClick(),
					},
					IconView({
						testId: 'invite-link-icon',
						icon: Icon.COPY,
						size: 24,
						color: Color.accentMainPrimary,
					}),
					Text4({
						testId: 'invite-link-text',
						text: Loc.getMessage(this.#getRowTextMessageKey()),
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
						onClick: () => this.onMoreClick(),
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
		 * @param {string} itemId
		 * @return {string}
		 */
		getTestId(itemId)
		{
			return `invite-menu-${itemId}-item`;
		}

		/**
		 * @param {string} dialogId
		 * @return {boolean}
		 */
		static shouldShow(dialogId)
		{
			if (
				!Feature.isChatSharingLinkAvailable
				|| !UserPermission.canPerformActionByUserType(ActionByUserType.joinChat)
			)
			{
				return false;
			}

			const dialogHelper = DialogHelper.createByDialogId(dialogId);
			if (!dialogHelper)
			{
				return false;
			}

			// main project chat (collab && !nested): allowed by chat-side permission, skip the type blacklist below
			if (dialogHelper.isCollab && !dialogHelper.isNested)
			{
				return ChatPermission.canAddParticipants(dialogId);
			}

			if (dialogHelper.isDirect || dialogHelper.isTaskComment || dialogHelper.isOpenlines)
			{
				return false;
			}

			return ChatPermission.canAddParticipants(dialogId);
		}
	}

	module.exports = { SharingLinkSection };
});
