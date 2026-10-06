import { Loc } from 'main.core';
import { Outline as OutlineIcons } from 'ui.icon-set.api.core';
import { MenuItemDesign, type MenuItemOptions, type MenuOptions, type MenuSectionOptions } from 'ui.system.menu';

import { ActionByRole, PopupType, ActionByUserType, type ChatTypeItem } from 'im.v2.const';
import { Analytics } from 'im.v2.lib.analytics';
import { showUpdateGuestLinkConfirm } from 'im.v2.lib.confirm';
import { Feature, FeatureManager } from 'im.v2.lib.feature';
import { BaseMenu } from 'im.v2.lib.menu';
import { PermissionManager } from 'im.v2.lib.permission';
import { Core } from 'im.v2.application.core';
import { type ImModelChat } from 'im.v2.model';

import { copySharedLink } from '../helpers/helpers';

export const MenuSectionCode = {
	first: 'first',
	second: 'second',
};

export const SharedLinkMenuMode = {
	full: 'full',
	compact: 'compact',
};

export const SharedLinkChangeType = {
	shared: 'shared',
	guest: 'guest',
};

export type SharedLinkMenuContext = {
	dialogId: string,
	chatId: number,
	mode: $Values<typeof SharedLinkMenuMode>,
	sharedLinkUrl?: string,
	sharedLinkCode?: string,
	guestLinkUrl?: string,
};

export class SharedLinkMenu extends BaseMenu
{
	context: SharedLinkMenuContext;

	static events = {
		onChangeLink: 'onChangeLink',
	};

	constructor()
	{
		super();

		this.id = PopupType.sharedLinkContextMenu;
	}

	getMenuOptions(): MenuOptions
	{
		return {
			...super.getMenuOptions(),
			maxWidth: 262,
			angle: false,
		};
	}

	getMenuItems(): MenuItemOptions[]
	{
		if (this.context.mode === SharedLinkMenuMode.compact)
		{
			return this.#getCompactMenuItems();
		}

		return this.#getFullMenuItems();
	}

	getMenuGroups(): MenuSectionOptions[]
	{
		return [
			{ code: MenuSectionCode.first },
			{ code: MenuSectionCode.second },
		];
	}

	#getCompactMenuItems(): MenuItemOptions[]
	{
		if (this.#shouldShowManageGuestItems())
		{
			return [
				this.#getCopySharedLinkItem(),
				this.#getCopyGuestLinkItem(),
			];
		}

		return [
			this.#getCopySharedLinkItem(),
		];
	}

	#getFullMenuItems(): MenuItemOptions[]
	{
		const firstGroupItems = [
			this.#getCopySharedLinkItem(),
			this.#getChangeSharedLinkItem(),
		];

		const secondGroupItems = [];
		if (this.#shouldShowManageGuestItems())
		{
			secondGroupItems.unshift(
				this.#getCopyGuestLinkItem(),
				this.#getChangeGuestLinkItem(),
			);
		}

		return [
			...this.groupItems(firstGroupItems, MenuSectionCode.first),
			...this.groupItems(secondGroupItems, MenuSectionCode.second),
		];
	}

	#getCopySharedLinkItem(): MenuItemOptions
	{
		return {
			title: Loc.getMessage('IM_SIDEBAR_SHARED_LINK_COPY_MENU_MSGVER_1'),
			icon: OutlineIcons.LINK,
			onClick: () => {
				void copySharedLink(this.context.sharedLinkUrl, this.#getChatType());

				if (this.context.mode === SharedLinkMenuMode.compact)
				{
					Analytics.getInstance().chatInviteLink.onCopySharedLinkCompactMenu(this.context.dialogId);

					return;
				}

				Analytics.getInstance().chatInviteLink.onCopySharedLinkMenu(this.context.dialogId);
			},
		};
	}

	#getChangeSharedLinkItem(): MenuItemOptions
	{
		return {
			title: Loc.getMessage('IM_SIDEBAR_SHARED_LINK_CHANGE_MENU'),
			icon: OutlineIcons.REFRESH,
			design: MenuItemDesign.Alert,
			onClick: () => {
				this.emit(SharedLinkMenu.events.onChangeLink, {
					type: SharedLinkChangeType.shared,
					code: this.context.sharedLinkCode,
				});
			},
		};
	}

	#getCopyGuestLinkItem(): MenuItemOptions
	{
		return {
			title: Loc.getMessage('IM_SIDEBAR_SHARED_GUEST_LINK_COPY_MENU'),
			icon: OutlineIcons.LINK,
			onClick: () => {
				Analytics.getInstance().guest.onCopyGuestInviteLink(this.context.dialogId);
				void copySharedLink(this.context.guestLinkUrl, this.#getChatType());

				if (this.context.mode === SharedLinkMenuMode.compact)
				{
					Analytics.getInstance().chatInviteLink.onCopySharedLinkCompactMenu(this.context.dialogId);

					return;
				}

				Analytics.getInstance().chatInviteLink.onCopySharedLinkMenu(this.context.dialogId);
			},
		};
	}

	#getChangeGuestLinkItem(): MenuItemOptions
	{
		return {
			title: Loc.getMessage('IM_SIDEBAR_SHARED_LINK_CHANGE_MENU'),
			icon: OutlineIcons.REFRESH,
			design: MenuItemDesign.Alert,
			onClick: async () => {
				const confirmResult = await showUpdateGuestLinkConfirm();
				if (!confirmResult)
				{
					return;
				}

				this.emit(SharedLinkMenu.events.onChangeLink, {
					type: SharedLinkChangeType.guest,
					chatId: this.context.chatId,
				});
			},
		};
	}

	#shouldShowManageGuestItems(): boolean
	{
		if (!FeatureManager.isFeatureAvailable(Feature.isChatWithGuestsAvailable))
		{
			return false;
		}

		const permissionManager = PermissionManager.getInstance();
		const canPerformActionByRole = permissionManager.canPerformActionByRole(
			ActionByRole.manageGuestLink,
			this.context.dialogId,
		);
		const canPerformActionByUserType = permissionManager.canPerformActionByUserType(ActionByUserType.manageGuestLink);

		return canPerformActionByRole && canPerformActionByUserType;
	}

	#getChatType(): ChatTypeItem
	{
		const { type }: ImModelChat = Core.getStore().getters['chats/get'](this.context.dialogId);

		return type;
	}
}
