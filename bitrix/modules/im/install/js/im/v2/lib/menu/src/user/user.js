import { Loc } from 'main.core';
import { type EventEmitter } from 'main.core.events';
import { type MenuItemOptions } from 'ui.system.menu';

import { Messenger } from 'im.public';
import { ActionByRole, ChatType, EventType, UserType, type ApplicationContext } from 'im.v2.const';
import { showKickUserConfirm } from 'im.v2.lib.confirm';
import { PermissionManager } from 'im.v2.lib.permission';
import { Utils } from 'im.v2.lib.utils';
import { type ImModelUser, type ImModelChat } from 'im.v2.model';
import { ChatService } from 'im.v2.provider.service.chat';

import { BaseMenu } from '../base/base';

type UserMenuContext = {
	user: ImModelUser,
	dialog: ImModelChat
};

export class UserMenu extends BaseMenu
{
	emitter: EventEmitter;
	context: UserMenuContext;
	permissionManager: PermissionManager;

	constructor(applicationContext: ApplicationContext)
	{
		super();

		this.id = 'bx-im-user-context-menu';
		this.permissionManager = PermissionManager.getInstance();

		const { emitter } = applicationContext;
		this.emitter = emitter;
	}

	getKickItem(): ?MenuItemOptions
	{
		const canKick = this.permissionManager.canPerformActionByRole(ActionByRole.kick, this.context.dialog.dialogId);
		if (!canKick)
		{
			return null;
		}

		return {
			title: this.#getKickItemText(),
			onClick: async () => {
				const userChoice = await showKickUserConfirm(this.context.dialog.dialogId);
				if (userChoice !== true)
				{
					return;
				}

				void this.#kickUser();
			},
		};
	}

	getMentionItem(): MenuItemOptions
	{
		return {
			title: Loc.getMessage('IM_LIB_MENU_USER_MENTION'),
			onClick: () => {
				this.emitter.emit(EventType.textarea.insertMention, {
					mentionText: this.context.user.name,
					mentionReplacement: Utils.text.getMentionBbCode(this.context.user.id, this.context.user.name),
					dialogId: this.context.dialog.dialogId,
					isMentionSymbol: false,
				});
			},
		};
	}

	getSendItem(): ?MenuItemOptions
	{
		if (this.context.dialog.type === ChatType.user)
		{
			return null;
		}

		return {
			title: Loc.getMessage('IM_LIB_MENU_USER_WRITE'),
			onClick: () => {
				void Messenger.openChat(this.context.user.id);
			},
		};
	}

	getProfileItem(): ?MenuItemOptions
	{
		if (this.isBot())
		{
			return null;
		}

		const profileUri = Utils.user.getProfileLink(this.context.user.id);

		return {
			title: Loc.getMessage('IM_LIB_MENU_OPEN_PROFILE_V2'),
			onClick: () => {
				BX.SidePanel.Instance.open(profileUri);
			},
		};
	}

	isCollabChat(): boolean
	{
		const { type }: ImModelChat = this.store.getters['chats/get'](this.context.dialog.dialogId, true);

		return type === ChatType.collab;
	}

	isBot(): boolean
	{
		return this.context.user.type === UserType.bot;
	}

	#getKickItemText(): string
	{
		if (this.isCollabChat())
		{
			return Loc.getMessage('IM_LIB_MENU_USER_KICK_FROM_COLLAB');
		}

		return Loc.getMessage('IM_LIB_MENU_USER_KICK_FROM_CHAT');
	}

	#kickUser(): Promise
	{
		if (this.isCollabChat())
		{
			return (new ChatService()).kickUserFromCollab(this.context.dialog.dialogId, this.context.user.id);
		}

		return (new ChatService()).kickUserFromChat(this.context.dialog.dialogId, this.context.user.id);
	}
}
