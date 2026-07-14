import { Loc } from 'main.core';
import { MenuItemDesign, type MenuItemOptions, type MenuOptions } from 'ui.system.menu';

import { ActionByRole, ActionByUserType, Layout, type ApplicationContext } from 'im.v2.const';
import { Analytics } from 'im.v2.lib.analytics';
import { ChatManager } from 'im.v2.lib.chat';
import { showDeleteChatConfirm } from 'im.v2.lib.confirm';
import { CopilotManager } from 'im.v2.lib.copilot';
import { Feature, FeatureManager, TariffManager } from 'im.v2.lib.feature';
import { LayoutManager } from 'im.v2.lib.layout';
import { RecentMenu } from 'im.v2.lib.menu';
import { Notifier } from 'im.v2.lib.notifier';
import { PermissionManager } from 'im.v2.lib.permission';
import { Utils } from 'im.v2.lib.utils';
import { ChatService } from 'im.v2.provider.service.chat';

export class MainMenu extends RecentMenu
{
	permissionManager: PermissionManager;

	static events = {
		onAddToChatShow: 'onAddToChatShow',
	};

	constructor(applicationContext: ApplicationContext)
	{
		super(applicationContext);

		this.id = 'im-sidebar-context-menu';
		this.permissionManager = PermissionManager.getInstance();
	}

	getMenuOptions(): MenuOptions
	{
		return {
			...super.getMenuOptions(),
			className: this.getMenuClassName(),
			angle: false,
		};
	}

	getMenuItems(): MenuItemOptions[]
	{
		return [
			this.getPinMessageItem(),
			this.getEditItem(),
			this.getCopyItem(),
			this.getAddMembersToChatItem(),
			this.getOpenProfileItem(),
			this.getOpenUserCalendarItem(),
			this.getChatsWithUserItem(),
			this.getCopyInviteLinkItem(),
			this.getCopyDialogIdItem(),
			this.getHideItem(),
			this.getLeaveItem(),
			this.getDeleteItem(),
		];
	}

	getCopyDialogIdItem(): ?MenuItemOptions
	{
		if (!FeatureManager.isFeatureAvailable(Feature.chatSharedLinkAvailable))
		{
			return null;
		}

		return {
			title: Loc.getMessage('IM_SIDEBAR_MENU_COPY_DIALOG_ID'),
			onClick: async () => {
				await Utils.text.copyToClipboard(this.context.dialogId);

				Notifier.chat.onCopyIdComplete();
			},
		};
	}

	getCopyInviteLinkItem(): ?MenuItemOptions
	{
		if (FeatureManager.isFeatureAvailable(Feature.chatSharedLinkAvailable))
		{
			return null;
		}

		if (!BX.clipboard.isCopySupported())
		{
			return null;
		}

		if (this.isUser() || this.isCollabChat())
		{
			return null;
		}

		const isGroupCopilotChat = (new CopilotManager()).isGroupCopilotChat(this.context.dialogId);
		const isCopilotChat = (new CopilotManager()).isCopilotChat(this.context.dialogId);
		if (isCopilotChat && !isGroupCopilotChat)
		{
			return null;
		}

		return {
			title: Loc.getMessage('IM_SIDEBAR_MENU_COPY_INVITE_LINK'),
			onClick: () => {
				const chatLink = ChatManager.buildChatLink(this.context.dialogId);
				if (BX.clipboard.copy(chatLink))
				{
					Notifier.onCopyLinkComplete();
				}

				Analytics.getInstance().chatInviteLink.onCopyContextMenu(this.context.dialogId);
			},
		};
	}

	getEditItem(): ?MenuItemOptions
	{
		if (!this.#canUpdateChat())
		{
			return null;
		}

		return {
			title: Loc.getMessage('IM_SIDEBAR_MENU_UPDATE_CHAT'),
			onClick: () => {
				Analytics.getInstance().chatEdit.onOpenForm(this.context.dialogId);

				void LayoutManager.getInstance().setLayout({
					name: Layout.updateChat,
					entityId: this.context.dialogId,
				});
			},
		};
	}

	getCopyItem(): ?MenuItemOptions
	{
		if (!this.#canUpdateChat() || !this.#isCollabV2())
		{
			return null;
		}

		const isCollabV2CopyAvailable = TariffManager.collabV2.isCopyAvailable();

		return {
			isLocked: !isCollabV2CopyAvailable,
			title: Loc.getMessage('IM_SIDEBAR_MENU_COPY_CHAT'),
			onClick: () => {
				if (!isCollabV2CopyAvailable)
				{
					TariffManager.collabV2.openCopyFeatureSlider();

					return;
				}

				void LayoutManager.getInstance().setLayout({
					name: Layout.copyCollab,
					entityId: this.context.dialogId,
				});
			},
		};
	}

	getDeleteItem(): ?MenuItemOptions
	{
		const canDelete = this.permissionManager.canPerformActionByRole(ActionByRole.delete, this.context.dialogId);
		if (!canDelete || this.#isCollabV2())
		{
			return null;
		}

		return {
			title: Loc.getMessage('IM_SIDEBAR_MENU_DELETE_CHAT'),
			design: MenuItemDesign.Alert,
			onClick: async () => {
				Analytics.getInstance().chatDelete.onClick(this.context.dialogId);
				if (await this.#isDeletionCancelled())
				{
					return;
				}
				Analytics.getInstance().chatDelete.onConfirm(this.context.dialogId);

				if (this.isCollabChat())
				{
					this.#deleteCollab();

					return;
				}

				this.#deleteChat();
			},
		};
	}

	getOpenUserCalendarItem(): ?MenuItemOptions
	{
		if (!this.isUser())
		{
			return null;
		}

		if (this.isBot())
		{
			return null;
		}

		const profileUri = Utils.user.getCalendarLink(this.context.dialogId);

		return {
			title: Loc.getMessage('IM_LIB_MENU_OPEN_CALENDAR_V2'),
			onClick: () => {
				BX.SidePanel.Instance.open(profileUri);
				this.menuInstance.close();
			},
		};
	}

	getAddMembersToChatItem(): ?MenuItemOptions
	{
		if (this.isBot() || this.isChatWithCurrentUser())
		{
			return null;
		}

		const hasCreateChatAccess = this.permissionManager.canPerformActionByUserType(ActionByUserType.createChat);
		if (this.isUser() && !hasCreateChatAccess)
		{
			return null;
		}

		const hasAccessByRole = this.permissionManager.canPerformActionByRole(ActionByRole.extend, this.context.dialogId);
		if (!hasAccessByRole)
		{
			return null;
		}

		const title = this.isChannel()
			? Loc.getMessage('IM_SIDEBAR_MENU_INVITE_SUBSCRIBERS')
			: Loc.getMessage('IM_SIDEBAR_MENU_INVITE_MEMBERS_V2');

		return {
			title,
			onClick: () => {
				Analytics.getInstance().userAdd.onChatSidebarClick(this.context.dialogId);
				this.emit(MainMenu.events.onAddToChatShow);
				this.menuInstance.close();
			},
		};
	}

	async #deleteChat(): Promise<void>
	{
		await (new ChatService()).deleteChat(this.context.dialogId);
		void LayoutManager.getInstance().clearCurrentLayoutEntityId();
	}

	async #deleteCollab(): Promise<void>
	{
		Notifier.collab.onBeforeDelete();
		await (new ChatService()).deleteCollab(this.context.dialogId);
		void LayoutManager.getInstance().clearCurrentLayoutEntityId();
		void LayoutManager.getInstance().deleteLastOpenedElementById(this.context.dialogId);
	}

	async #isDeletionCancelled(): Promise<boolean>
	{
		const confirmResult = await showDeleteChatConfirm(this.context.dialogId);
		if (!confirmResult)
		{
			Analytics.getInstance().chatDelete.onCancel(this.context.dialogId);

			return true;
		}

		return false;
	}

	#canUpdateChat(): boolean
	{
		return this.permissionManager.canPerformActionByRole(ActionByRole.update, this.context.dialogId);
	}

	#isCollabV2(): boolean
	{
		return this.isCollabChat() && FeatureManager.isFeatureAvailable(Feature.isCollabV2Available);
	}
}
