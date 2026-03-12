import { Core } from 'im.v2.application.core';
import { RecentType } from 'im.v2.const';
import { Logger } from 'im.v2.lib.logger';
import { Utils } from 'im.v2.lib.utils';

import { NewMessageManager } from './classes/new-message-manager';
import { RecentUpdateManager } from './classes/recent-update-manager';
import { buildRecentItem } from './helpers/helpers';

import type { ImModelRecentItem, ImModelMessage } from 'im.v2.model';
import type { PullExtraParams, RawMessage } from '../types/common';
import type {
	MessageAddParams,
	AddReactionParams,
	MessageDeleteCompleteParams,
	MultipleMessageDeleteParams,
} from '../types/message';
import type { ChatUnreadParams } from '../types/chat';
import type { UserInviteParams } from '../types/user';
import type {
	RecentHideParams,
	RecentUpdateParams,
	UserShowInRecentParams,
	RecentPinChatParams,
} from '../types/recent';

const ActionNameByRecentType = {
	[RecentType.default]: 'recent/setRecent',
	[RecentType.copilot]: 'recent/setCopilot',
	[RecentType.openChannel]: 'recent/setChannel',
	[RecentType.collab]: 'recent/setCollab',
	[RecentType.taskComments]: 'recent/setTask',
};

// noinspection JSUnusedGlobalSymbols
export class RecentPullHandler
{
	getModuleId(): string
	{
		return 'im';
	}

	handleMessage(params, extra)
	{
		this.handleMessageAdd(params, extra);
	}

	handleMessageChat(params, extra)
	{
		this.handleMessageAdd(params, extra);
	}

	handleMessageAdd(params: MessageAddParams, extra: PullExtraParams)
	{
		const { recentConfig } = params;

		const manager = new NewMessageManager(params, extra);

		if (!manager.isUserInChat())
		{
			return;
		}

		Logger.warn('RecentPullHandler: handleMessageAdd', params);

		const newRecentItem = buildRecentItem(params);

		recentConfig.sections.forEach((section) => {
			const actionName = ActionNameByRecentType[section];
			if (!actionName)
			{
				return;
			}

			void Core.getStore().dispatch(actionName, newRecentItem);
		});
	}

	handleMessageDeleteV2(params: MultipleMessageDeleteParams)
	{
		this.#deleteLastMessage(params.dialogId, params.newLastMessage);
	}

	handleMessageDeleteComplete(params: MessageDeleteCompleteParams)
	{
		this.#deleteLastMessage(params.dialogId, params.newLastMessage);
	}

	handleChatUnread(params: ChatUnreadParams)
	{
		Logger.warn('RecentPullHandler: handleChatUnread', params);
		Core.getStore().dispatch('recent/unread', {
			id: params.dialogId,
			action: params.active,
		});
	}

	handleAddReaction(params: AddReactionParams)
	{
		Logger.warn('RecentPullHandler: handleAddReaction', params);
		const recentItem: ?ImModelRecentItem = Core.getStore().getters['recent/get'](params.dialogId);
		if (!recentItem)
		{
			return;
		}

		const chatIsOpened = Core.getStore().getters['application/isChatOpen'](params.dialogId);
		if (chatIsOpened)
		{
			return;
		}

		const message: ?ImModelMessage = Core.getStore().getters['recent/getMessage'](params.dialogId);
		const isOwnLike = Core.getUserId() === params.userId;
		const isOwnLastMessage = Core.getUserId() === message.authorId;
		if (isOwnLike || !isOwnLastMessage)
		{
			return;
		}

		Core.getStore().dispatch('recent/like', {
			id: params.dialogId,
			messageId: params.actualReactions.reaction.messageId,
			liked: true,
		});
	}

	handleChatPin(params: RecentPinChatParams)
	{
		Logger.warn('RecentPullHandler: handleChatPin', params);

		const manager = new RecentUpdateManager(params);
		manager.updateRecent();

		Core.getStore().dispatch('recent/pin', { id: params.dialogId, action: params.active });
	}

	handleChatHide(params: RecentHideParams)
	{
		Logger.warn('RecentPullHandler: handleChatHide', params);
		const recentItem: ?ImModelRecentItem = Core.getStore().getters['recent/get'](params.dialogId);
		if (!recentItem)
		{
			return;
		}

		void Core.getStore().dispatch('recent/hide', {
			id: params.dialogId,
		});
	}

	handleChatUserLeave(params)
	{
		Logger.warn('RecentPullHandler: handleChatUserLeave', params);
		const recentItem: ?ImModelRecentItem = Core.getStore().getters['recent/get'](params.dialogId);
		if (!recentItem || params.userId !== Core.getUserId())
		{
			return;
		}

		Core.getStore().dispatch('recent/hide', {
			id: params.dialogId,
		});
	}

	handleUserInvite(params: UserInviteParams)
	{
		Logger.warn('RecentPullHandler: handleUserInvite', params);

		const messageId = Utils.text.getUuidV4();
		Core.getStore().dispatch('messages/store', {
			id: messageId,
			date: params.date,
		});

		Core.getStore().dispatch('recent/setRecent', {
			id: params.user.id,
			invited: params.invited ?? false,
			isFakeElement: true,
			messageId,
		});
	}

	handleUserShowInRecent(params: UserShowInRecentParams)
	{
		Logger.warn('RecentPullHandler: handleUserShowInRecent', params);
		const { items } = params;

		items.forEach((item) => {
			const messageId = Utils.text.getUuidV4();
			Core.getStore().dispatch('messages/store', {
				id: messageId,
				date: item.date,
			});

			Core.getStore().dispatch('recent/setRecent', {
				id: item.user.id,
				messageId,
			});
		});
	}

	handleRecentUpdate(params: RecentUpdateParams)
	{
		Logger.warn('RecentPullHandler: handleRecentUpdate', params);
		const manager = new RecentUpdateManager(params);
		manager.updateRecent();
	}

	#deleteLastMessage(dialogId: number, newLastMessage: RawMessage) {
		const lastMessageWasDeleted = Boolean(newLastMessage);

		if (lastMessageWasDeleted)
		{
			this.#updateRecentForMessageDelete(dialogId, newLastMessage.id);
		}
	}

	#updateRecentForMessageDelete(dialogId: string, newLastMessageId: number): void
	{
		if (!newLastMessageId)
		{
			Core.getStore().dispatch('recent/hide', { id: dialogId });

			return;
		}

		Core.getStore().dispatch('recent/update', {
			id: dialogId,
			fields: { messageId: newLastMessageId },
		});
	}
}
