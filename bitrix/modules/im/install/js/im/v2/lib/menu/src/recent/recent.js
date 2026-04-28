import { Loc, Type } from 'main.core';
import { type EventEmitter } from 'main.core.events';
import { MessageBox, MessageBoxButtons } from 'ui.dialogs.messagebox';
import { type MenuItemOptions, type MenuSectionOptions, type MenuOptions } from 'ui.system.menu';

import { Messenger } from 'im.public';
import { Core } from 'im.v2.application.core';
import {
	ActionByRole,
	EventType,
	SidebarDetailBlock,
	ChatType,
	UserType,
	ActionByUserType,
	UserRole,
	type ApplicationContext,
} from 'im.v2.const';
import { Analytics } from 'im.v2.lib.analytics';
import { CallManager } from 'im.v2.lib.call';
import { ChannelManager } from 'im.v2.lib.channel';
import { showLeaveChatConfirm } from 'im.v2.lib.confirm';
import { InviteManager } from 'im.v2.lib.invite';
import { PermissionManager } from 'im.v2.lib.permission';
import { Utils } from 'im.v2.lib.utils';
import { type ImModelRecentItem, type ImModelUser, type ImModelChat } from 'im.v2.model';
import { ChatService } from 'im.v2.provider.service.chat';
import { LegacyRecentService } from 'im.v2.provider.service.recent';

import { BaseMenu } from '../base/base';

type MenuItemContext = {
	dialogId: string,
	compactMode?: boolean,
	recentItem?: ImModelRecentItem
}

const MenuSectionCode = {
	first: 'first',
	second: 'second',
	third: 'third',
};

export class RecentMenu extends BaseMenu
{
	emitter: EventEmitter;
	context: MenuItemContext;
	callManager: CallManager;
	permissionManager: PermissionManager;
	chatService: ChatService;

	constructor(applicationContext: ApplicationContext)
	{
		super();

		this.id = 'im-recent-context-menu';
		this.chatService = new ChatService();
		this.callManager = CallManager.getInstance();
		this.permissionManager = PermissionManager.getInstance();

		const { emitter } = applicationContext;
		this.emitter = emitter;
	}

	getMenuOptions(): MenuOptions
	{
		return {
			...super.getMenuOptions(),
			className: this.getMenuClassName(),
		};
	}

	getMenuClassName(): string
	{
		return this.context.compactMode ? '' : super.getMenuClassName();
	}

	getMenuItems(): MenuItemOptions | null[]
	{
		if (this.#isInvitationActive())
		{
			const firstGroupItems = [
				this.getSendMessageItem(),
				this.getOpenProfileItem(),
			];

			return [
				...this.groupItems(firstGroupItems, MenuSectionCode.first),
				...this.groupItems(this.getInviteItems(), MenuSectionCode.second),
			];
		}

		return [
			this.getUnreadMessageItem(),
			this.getPinMessageItem(),
			this.getMuteItem(),
			this.getOpenProfileItem(),
			this.getChatsWithUserItem(),
			this.getHideItem(),
			this.getLeaveItem(),
		];
	}

	getMenuGroups(): MenuSectionOptions[]
	{
		if (this.#isInvitationActive())
		{
			return [
				{ code: MenuSectionCode.first },
				{ code: MenuSectionCode.second },
			];
		}

		return [];
	}

	getSendMessageItem(): MenuItemOptions
	{
		return {
			title: Loc.getMessage('IM_LIB_MENU_WRITE_V2'),
			onClick: () => {
				void Messenger.openChat(this.context.dialogId);
			},
		};
	}

	getOpenItem(): MenuItemOptions
	{
		return {
			title: Loc.getMessage('IM_LIB_MENU_OPEN'),
			onClick: () => {
				void Messenger.openChat(this.context.dialogId);
			},
		};
	}

	getUnreadMessageItem(): ?MenuItemOptions
	{
		const { recentItem, dialogId } = this.context;
		if (!recentItem)
		{
			return null;
		}

		const { chatId }: ImModelChat = this.store.getters['chats/get'](dialogId, true);
		const chatCounter = this.store.getters['counters/getCounterByChatId'](chatId);
		const childrenCounter = this.store.getters['counters/getChildrenTotalCounter'](chatId);
		const isChatMarkedUnread = this.store.getters['counters/getUnreadStatus'](chatId);
		const showReadOption = isChatMarkedUnread || chatCounter > 0 || childrenCounter > 0;

		return {
			title: showReadOption ? Loc.getMessage('IM_LIB_MENU_READ') : Loc.getMessage('IM_LIB_MENU_UNREAD'),
			onClick: () => {
				if (showReadOption)
				{
					this.chatService.readDialog(dialogId);
					Analytics.getInstance().recentContextMenu.onRead(dialogId);
				}
				else
				{
					this.chatService.unreadDialog(dialogId);
					Analytics.getInstance().recentContextMenu.onUnread(dialogId);
				}
			},
		};
	}

	getPinMessageItem(): ?MenuItemOptions
	{
		const { dialogId } = this.context;
		if (this.isGuestRole())
		{
			return null;
		}

		const recentItem = this.#getRecentItem();
		const isPinned = recentItem ? recentItem.pinned : false;

		return {
			title: isPinned
				? Loc.getMessage('IM_LIB_MENU_UNPIN_MSGVER_1')
				: Loc.getMessage('IM_LIB_MENU_PIN_MSGVER_1'),
			onClick: () => {
				if (isPinned)
				{
					this.chatService.unpinChat(dialogId);
					Analytics.getInstance().recentContextMenu.onUnpin(dialogId);
				}
				else
				{
					this.chatService.pinChat(dialogId);
					Analytics.getInstance().recentContextMenu.onPin(dialogId);
				}
			},
		};
	}

	getMuteItem(): ?MenuItemOptions
	{
		const { dialogId } = this.context;
		const canMute = this.permissionManager.canPerformActionByRole(ActionByRole.mute, dialogId);
		if (!canMute)
		{
			return null;
		}

		const { isMuted }: ImModelChat = this.store.getters['chats/get'](dialogId, true);

		return {
			title: isMuted ? Loc.getMessage('IM_LIB_MENU_UNMUTE_2') : Loc.getMessage('IM_LIB_MENU_MUTE_2'),
			onClick: () => {
				if (isMuted)
				{
					this.chatService.unmuteChat(dialogId);
					Analytics.getInstance().recentContextMenu.onUnmute(dialogId);
				}
				else
				{
					this.chatService.muteChat(dialogId);
					Analytics.getInstance().recentContextMenu.onMute(dialogId);
				}
			},
		};
	}

	getOpenProfileItem(): ?MenuItemOptions
	{
		if (!this.isUser() || this.isBot())
		{
			return null;
		}

		const profileUri = Utils.user.getProfileLink(this.context.dialogId);

		return {
			title: Loc.getMessage('IM_LIB_MENU_OPEN_PROFILE_V2'),
			onClick: () => {
				BX.SidePanel.Instance.open(profileUri);
				Analytics.getInstance().recentContextMenu.onOpenProfile(this.context.dialogId);
			},
		};
	}

	getHideItem(): ?MenuItemOptions
	{
		if (!this.#canHideChat())
		{
			return null;
		}

		return {
			title: Loc.getMessage('IM_LIB_MENU_HIDE_MSGVER_1'),
			onClick: () => {
				LegacyRecentService.getInstance().hideChat(this.context.dialogId);
				Analytics.getInstance().recentContextMenu.onHide(this.context.dialogId);
			},
		};
	}

	getLeaveItem(): ?MenuItemOptions
	{
		if (this.isCollabChat())
		{
			return this.#leaveCollab();
		}

		return this.#leaveChat();
	}

	getChatsWithUserItem(): ?MenuItemOptions
	{
		if (!this.isUser() || this.isBot() || this.isChatWithCurrentUser())
		{
			return null;
		}

		const isAnyChatOpened = this.store.getters['application/getLayout'].entityId.length > 0;

		return {
			title: Loc.getMessage('IM_LIB_MENU_FIND_SHARED_CHATS'),
			onClick: async () => {
				if (!isAnyChatOpened)
				{
					await Messenger.openChat(this.context.dialogId);
				}

				this.emitter.emit(EventType.sidebar.open, {
					panel: SidebarDetailBlock.chatsWithUser,
					standalone: true,
					dialogId: this.context.dialogId,
				});
				Analytics.getInstance().recentContextMenu.onFindChatsWithUser(this.context.dialogId);
			},
		};
	}

	// region invitation
	getInviteItems(): MenuItemOptions[]
	{
		const { recentItem } = this.context;
		if (!recentItem)
		{
			return [];
		}

		const items = [];

		let canInvite; // TODO change to APPLICATION variable
		if (Type.isUndefined(BX.MessengerProxy))
		{
			canInvite = true;
			console.error('BX.MessengerProxy.canInvite() method not found in v2 version!');
		}
		else
		{
			canInvite = BX.MessengerProxy.canInvite();
		}

		const canManageInvite = canInvite && Core.getUserId() === recentItem.invitation.originator;
		if (canManageInvite)
		{
			items.push(
				this.getResendInviteItem(),
				this.getCancelInviteItem(),
			);
		}

		return items;
	}

	getResendInviteItem(): ?MenuItemOptions
	{
		const { recentItem, dialogId } = this.context;
		if (!recentItem || !this.#canResendInvitation())
		{
			return null;
		}

		return {
			title: Loc.getMessage('IM_LIB_INVITE_RESEND'),
			onClick: () => {
				InviteManager.resendInvite(dialogId);
			},
		};
	}

	getCancelInviteItem(): MenuItemOptions
	{
		return {
			title: Loc.getMessage('IM_LIB_INVITE_CANCEL'),
			onClick: () => {
				MessageBox.show({
					message: Loc.getMessage('IM_LIB_INVITE_CANCEL_CONFIRM'),
					modal: true,
					buttons: MessageBoxButtons.OK_CANCEL,
					onOk: (messageBox) => {
						InviteManager.cancelInvite(this.context.dialogId);
						messageBox.close();
					},
					onCancel: (messageBox) => {
						messageBox.close();
					},
				});
			},
		};
	}
	// endregion

	getChat(): ImModelChat
	{
		return this.store.getters['chats/get'](this.context.dialogId, true);
	}

	isUser(): boolean
	{
		return this.store.getters['chats/isUser'](this.context.dialogId);
	}

	isBot(): boolean
	{
		if (!this.isUser())
		{
			return false;
		}

		const user: ImModelUser = this.store.getters['users/get'](this.context.dialogId);

		return user.type === UserType.bot;
	}

	isChannel(): boolean
	{
		return ChannelManager.isChannel(this.context.dialogId);
	}

	isCollabChat(): boolean
	{
		const { type }: ImModelChat = this.store.getters['chats/get'](this.context.dialogId, true);

		return type === ChatType.collab;
	}

	isOpenChat(): boolean
	{
		const { type }: ImModelChat = this.store.getters['chats/get'](this.context.dialogId, true);

		return type === ChatType.open;
	}

	isGuestRole(): boolean
	{
		const { role }: ImModelChat = this.store.getters['chats/get'](this.context.dialogId, true);

		return role === UserRole.guest;
	}

	isChatWithCurrentUser(): boolean
	{
		return this.getCurrentUserId() === Number.parseInt(this.context.dialogId, 10);
	}

	#leaveChat(): ?MenuItemOptions
	{
		const canLeaveChat = this.permissionManager.canPerformActionByRole(ActionByRole.leave, this.context.dialogId);
		if (!canLeaveChat)
		{
			return null;
		}

		const title = this.isChannel()
			? Loc.getMessage('IM_LIB_MENU_LEAVE_CHANNEL')
			: Loc.getMessage('IM_LIB_MENU_LEAVE_MSGVER_1')
		;

		return {
			title,
			onClick: async () => {
				const userChoice = await showLeaveChatConfirm(this.context.dialogId);
				if (userChoice === true)
				{
					this.chatService.leaveChat(this.context.dialogId);
					Analytics.getInstance().recentContextMenu.onLeave(this.context.dialogId);
				}
			},
		};
	}

	#leaveCollab(): ?MenuItemOptions
	{
		const canLeaveChat = this.permissionManager.canPerformActionByRole(ActionByRole.leave, this.context.dialogId);
		const canLeaveCollab = this.permissionManager.canPerformActionByUserType(ActionByUserType.leaveCollab);
		if (!canLeaveChat || !canLeaveCollab)
		{
			return null;
		}

		return {
			title: Loc.getMessage('IM_LIB_MENU_LEAVE_MSGVER_1'),
			onClick: async () => {
				const userChoice = await showLeaveChatConfirm(this.context.dialogId);
				if (!userChoice)
				{
					return;
				}

				this.chatService.leaveCollab(this.context.dialogId);
			},
		};
	}

	#canHideChat(): ?boolean
	{
		const { dialogId } = this.context;
		const recentItem = this.#getRecentItem();
		if (!recentItem)
		{
			return null;
		}

		const isInvitation = this.#isInvitationActive();
		const isFakeUser = recentItem.isFakeElement;
		const isAiAssistantBot = this.store.getters['users/bots/isAiAssistant'](dialogId);

		return !isInvitation && !isFakeUser && !isAiAssistantBot;
	}

	#getRecentItem(): ?ImModelRecentItem
	{
		return this.context.recentItem || this.store.getters['recent/get'](this.context.dialogId);
	}

	#isInvitationActive(): boolean
	{
		const { recentItem } = this.context;
		if (!recentItem || !recentItem.invitation)
		{
			return false;
		}

		return recentItem.invitation.isActive;
	}

	#canResendInvitation(): boolean
	{
		const { recentItem } = this.context;
		if (!recentItem || !recentItem.invitation)
		{
			return false;
		}

		return recentItem.invitation.canResend;
	}
}
