import { type Store } from 'ui.vue3.vuex';
import { EventEmitter } from 'main.core.events';

import { Messenger } from 'im.public';
import { Core } from 'im.v2.application.core';
import { ChatType, UserRole, type Relation, EventType } from 'im.v2.const';
import { Analytics } from 'im.v2.lib.analytics';
import { CallManager } from 'im.v2.lib.call';
import { InputActionListener } from 'im.v2.lib.input-action';
import { Logger } from 'im.v2.lib.logger';
import { Notifier } from 'im.v2.lib.notifier';
import { getChatRoleForUser } from 'im.v2.lib.role-manager';
import { UserManager } from 'im.v2.lib.user';
import { type ImModelChat } from 'im.v2.model';

import {
	type ChatOwnerParams,
	type ChatManagersParams,
	type ChatUserAddParams,
	type ChatUserLeaveParams,
	type InputActionNotifyParams,
	type ChatUnreadParams,
	type ChatMuteNotifyParams,
	type ChatRenameParams,
	type ChatAvatarParams,
	type ChatConvertParams,
	type ChatDeleteParams,
	type MessagesAutoDeleteDelayParams,
} from '../../types/chat';
import { type RawUser, type RawChat } from '../../types/common';

export class ChatPullHandler
{
	#store: Store;

	constructor()
	{
		this.#store = Core.getStore();
	}

	handleChatOwner(params: ChatOwnerParams)
	{
		Logger.warn('ChatPullHandler: handleChatOwner', params);
		this.#store.dispatch('chats/update', {
			dialogId: params.dialogId,
			fields: {
				ownerId: params.userId,
			},
		});
	}

	handleChatManagers(params: ChatManagersParams)
	{
		Logger.warn('ChatPullHandler: handleChatManagers', params);
		this.#store.dispatch('chats/update', {
			dialogId: params.dialogId,
			fields: {
				managerList: params.list,
			},
		});

		const chat: ImModelChat = this.#store.getters['chats/get'](params.dialogId);
		if (!chat)
		{
			return;
		}

		const userInManagerList = params.list.includes(Core.getUserId());
		if (chat.role === UserRole.member && userInManagerList)
		{
			this.#store.dispatch('chats/update', {
				dialogId: params.dialogId,
				fields: {
					role: UserRole.manager,
				},
			});
		}

		if (chat.role === UserRole.manager && !userInManagerList)
		{
			this.#store.dispatch('chats/update', {
				dialogId: params.dialogId,
				fields: {
					role: UserRole.member,
				},
			});
		}
	}

	handleChatUserAdd(params: ChatUserAddParams)
	{
		Logger.warn('ChatPullHandler: handleChatUserAdd', params);
		this.#updateChatUsers(params);

		const { newUsers, dialogId, relations } = params;

		const currentUserId = Core.getUserId();
		if (newUsers.includes(currentUserId))
		{
			const currentUserRelation: Relation = relations.find((relation) => relation.userId === Core.getUserId());
			void this.#store.dispatch('chats/update', {
				dialogId,
				fields: { role: currentUserRelation.role },
			});
		}
	}

	handleChatUserLeave(params: ChatUserLeaveParams)
	{
		Logger.warn('ChatPullHandler: handleChatUserLeave', params);
		this.#updateChatUsers(params);

		// chatUserLeave is single user event, so we can safely use first (and only) relation from array
		const { userId, dialogId, chatId, relations: [relation] } = params;
		const currentUserIsKicked = userId === Core.getUserId();
		if (relation?.isHidden || !currentUserIsKicked)
		{
			return;
		}

		void this.#store.dispatch('chats/update', {
			dialogId,
			fields: { inited: false },
		});
		void this.#store.dispatch('messages/clearChatCollection', { chatId });
		void this.#store.dispatch('counters/clearByParentId', { parentChatId: chatId });

		this.#onChatAccessLost(dialogId);
	}

	handleInputActionNotify(params: InputActionNotifyParams)
	{
		Logger.warn('ChatPullHandler: handleInputActionNotify', params);
		InputActionListener.getInstance().startAction(params);
		this.#store.dispatch('users/update', {
			id: params.userId,
			fields: { lastActivityDate: new Date() },
		});
	}

	handleChatUnread(params: ChatUnreadParams)
	{
		Logger.warn('ChatPullHandler: handleChatUnread', params);
		let markedId = 0;
		if (params.active === true)
		{
			markedId = params.markedId;
		}
		this.#store.dispatch('chats/update', {
			dialogId: params.dialogId,
			fields: { markedId },
		});
	}

	handleChatMuteNotify(params: ChatMuteNotifyParams)
	{
		if (params.muted)
		{
			this.#store.dispatch('chats/mute', {
				dialogId: params.dialogId,
			});

			return;
		}

		this.#store.dispatch('chats/unmute', {
			dialogId: params.dialogId,
		});
	}

	handleChatRename(params: ChatRenameParams)
	{
		const dialog = this.#store.getters['chats/getByChatId'](params.chatId);
		if (!dialog)
		{
			return;
		}

		this.#store.dispatch('chats/update', {
			dialogId: dialog.dialogId,
			fields: {
				name: params.name,
			},
		});
	}

	handleChatAvatar(params: ChatAvatarParams)
	{
		const dialog = this.#store.getters['chats/getByChatId'](params.chatId);
		if (!dialog)
		{
			return;
		}

		this.#store.dispatch('chats/update', {
			dialogId: dialog.dialogId,
			fields: {
				avatar: params.avatar,
			},
		});
	}

	handleChatConvert(params: ChatConvertParams)
	{
		Logger.warn('ChatPullHandler: handleChatConvert', params);
		const { dialogId, oldType, newType, newPermissions, newTypeParams } = params;
		const fields = {
			type: newType,
			permissions: newPermissions,
		};

		if ([newType, oldType].includes(ChatType.collab))
		{
			fields.diskFolderId = 0;
		}

		this.#store.dispatch('chats/update', {
			dialogId,
			fields,
		});

		const dialog = this.#store.getters['chats/get'](dialogId);
		if (newType === ChatType.collab && dialog?.chatId > 0)
		{
			this.#store.dispatch('chats/collabs/set', {
				chatId: dialog.chatId,
				collabInfo: newTypeParams.collabInfo,
			});
		}
	}

	handleChatUpdate(params: {chat: RawChat})
	{
		const { dialogId, parent_chat_id: newParentChatId } = params.chat;
		const { parentChatId: lastParentChatId }: ImModelChat = this.#store.getters['chats/get'](dialogId);

		void this.#store.dispatch('chats/update', {
			dialogId,
			fields: {
				role: getChatRoleForUser(params.chat),
				...params.chat,
			},
		});

		if (lastParentChatId !== newParentChatId)
		{
			void this.#store.dispatch('recent/hide', { dialogId });
		}
	}

	handleChatFieldsUpdate(params: Partial<RawChat> & {dialogId: string, chatId: number})
	{
		void this.#store.dispatch('chats/update', {
			dialogId: params.dialogId,
			fields: {
				...params,
			},
		});
	}

	handleChatDelete(params: ChatDeleteParams)
	{
		Logger.warn('ChatPullHandler: handleChatDelete', params);
		const { userId, chatId, dialogId } = params;

		const currentUserId = Core.getUserId();
		if (userId === currentUserId)
		{
			return;
		}

		void this.#store.dispatch('chats/update', {
			dialogId,
			fields: { inited: false },
		});
		void this.#store.dispatch('recent/delete', { dialogId });
		void this.#store.dispatch('messages/clearChatCollection', { chatId });

		if (this.#isChatOpen(dialogId))
		{
			Analytics.getInstance().chatDelete.onChatDeletedNotification(dialogId);
			Notifier.chat.onNotFoundError();
		}

		this.#onChatAccessLost(dialogId);
	}

	handleMessagesAutoDeleteDelayChanged(params: MessagesAutoDeleteDelayParams)
	{
		Logger.warn('ChatPullHandler: handleMessagesAutoDeleteDelayChanged', params);

		const { chatId, delay } = params;

		void this.#store.dispatch('chats/autoDelete/set', {
			chatId,
			delay,
		});
	}

	#isChatOpen(dialogId: string): boolean
	{
		return this.#store.getters['application/isChatOpen'](dialogId);
	}

	#onChatAccessLost(dialogId: string)
	{
		if (this.#isChatOpen(dialogId))
		{
			void Messenger.openChat();
		}

		EventEmitter.emit(EventType.recent.closeNestedList, { dialogId });

		CallManager.getInstance().deleteRecentCall(dialogId);
		const chatHasCall = CallManager.getInstance().getCurrentCallDialogId() === dialogId;
		if (chatHasCall)
		{
			CallManager.getInstance().leaveCurrentCall();
		}
	}

	#updateChatUsers(params: {
		users?: {[userId: string]: RawUser},
		dialogId: string,
		userCount: number,
		guestCount: number,
		chatExtranet: boolean,
		containsCollaber: boolean,
	})
	{
		if (params.users)
		{
			const userManager = new UserManager();
			void userManager.setUsersToModel(Object.values(params.users));
		}

		void this.#store.dispatch('chats/update', {
			dialogId: params.dialogId,
			fields: {
				userCounter: params.userCount,
				guestCount: params.guestCount,
				extranet: params.chatExtranet,
				containsCollaber: params.containsCollaber,
			},
		});
	}
}
