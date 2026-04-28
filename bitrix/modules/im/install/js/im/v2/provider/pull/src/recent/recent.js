import { Core } from 'im.v2.application.core';
import { Logger } from 'im.v2.lib.logger';
import { Utils } from 'im.v2.lib.utils';
import { RecentType } from 'im.v2.const';

import { NewMessageManager } from '../classes/new-message-manager';
import { RecentUpdateManager } from './classes/recent-update-manager';
import { buildRecentItem } from './helpers/helpers';

import type { ImModelRecentItem, ImModelMessage } from 'im.v2.model';
import type { RecentTypeItem } from 'im.v2.const';
import type { PullExtraParams, RawMessage } from '../types/common';
import type {
	MessageAddParams,
	AddReactionParams,
	MessageDeleteCompleteParams,
	MultipleMessageDeleteParams,
} from '../types/message';
import type { UserInviteParams } from '../types/user';
import type { ChatUserLeaveParams } from '../types/chat';
import type {
	RecentHideParams,
	RecentUpdateParams,
	UserShowInRecentParams,
	RecentPinChatParams,
} from '../types/recent';

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

		recentConfig.sections.forEach((section: RecentTypeItem) => {
			void Core.getStore().dispatch('recent/setCollection', {
				type: section,
				items: [newRecentItem],
			});
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

	handleAddReaction(params: AddReactionParams)
	{
		const { dialogId, userId, actualReactions } = params;
		Logger.warn('RecentPullHandler: handleAddReaction', params);
		const recentItem: ?ImModelRecentItem = Core.getStore().getters['recent/get'](dialogId);
		if (!recentItem)
		{
			return;
		}

		const chatIsOpened = Core.getStore().getters['application/isChatOpen'](dialogId);
		if (chatIsOpened)
		{
			return;
		}

		const message: ?ImModelMessage = Core.getStore().getters['recent/getMessage'](dialogId);
		const isOwnLike = Core.getUserId() === userId;
		const isOwnLastMessage = Core.getUserId() === message.authorId;
		if (isOwnLike || !isOwnLastMessage)
		{
			return;
		}

		Core.getStore().dispatch('recent/like', {
			dialogId,
			messageId: actualReactions.reaction.messageId,
			liked: true,
		});
	}

	handleChatPin(params: RecentPinChatParams)
	{
		const { dialogId, active } = params;
		Logger.warn('RecentPullHandler: handleChatPin', params);

		const manager = new RecentUpdateManager(params);
		manager.updateRecent();

		Core.getStore().dispatch('recent/pin', { dialogId, action: active });
	}

	handleChatHide(params: RecentHideParams)
	{
		const { dialogId } = params;
		Logger.warn('RecentPullHandler: handleChatHide', params);
		const recentItem: ?ImModelRecentItem = Core.getStore().getters['recent/get'](dialogId);
		if (!recentItem)
		{
			return;
		}

		void Core.getStore().dispatch('recent/hide', { dialogId });
	}

	handleChatUserLeave(params: ChatUserLeaveParams)
	{
		const { dialogId, userId } = params;
		Logger.warn('RecentPullHandler: handleChatUserLeave', params);
		const recentItem: ?ImModelRecentItem = Core.getStore().getters['recent/get'](dialogId);
		if (!recentItem || userId !== Core.getUserId())
		{
			return;
		}

		void Core.getStore().dispatch('recent/hide', { dialogId });
	}

	handleUserInvite(params: UserInviteParams)
	{
		Logger.warn('RecentPullHandler: handleUserInvite', params);

		const messageId = Utils.text.getUuidV4();
		void Core.getStore().dispatch('messages/store', {
			id: messageId,
			date: params.date,
		});

		const recentItem = {
			id: params.user.id,
			invited: params.invited ?? false,
			isFakeElement: true,
			messageId,
		};
		void Core.getStore().dispatch('recent/setCollection', {
			type: RecentType.default,
			items: [recentItem],
		});
	}

	handleUserShowInRecent(params: UserShowInRecentParams)
	{
		Logger.warn('RecentPullHandler: handleUserShowInRecent', params);
		const { items } = params;

		items.forEach((item) => {
			const messageId = Utils.text.getUuidV4();
			void Core.getStore().dispatch('messages/store', {
				id: messageId,
				date: item.date,
			});

			const recentItem = { id: item.user.id, messageId };
			void Core.getStore().dispatch('recent/setCollection', {
				type: RecentType.default,
				items: [recentItem],
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
			void Core.getStore().dispatch('recent/hide', { dialogId });

			return;
		}

		void Core.getStore().dispatch('recent/update', {
			dialogId,
			fields: { messageId: newLastMessageId },
		});
	}
}
