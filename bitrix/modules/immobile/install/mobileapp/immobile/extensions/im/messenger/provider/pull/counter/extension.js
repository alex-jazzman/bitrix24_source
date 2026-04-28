/**
 * @module im/messenger/provider/pull/counter
 */
jn.define('im/messenger/provider/pull/counter', (require, exports, module) => {
	const { Type } = require('type');
	const { DialogType, RecentTab } = require('im/messenger/const');
	const { UuidManager } = require('im/messenger/lib/uuid-manager');
	const { BasePullHandler } = require('im/messenger/provider/pull/base');
	const { serviceLocator } = require('im/messenger/lib/di/service-locator');
	const { UserHelper, CounterHelper } = require('im/messenger/lib/helper');
	const {
		NewOwnPullMessageAction,
		NewParticipantPullMessageAction,
	} = require('im/messenger/lib/counters/update-system/action/new-message/pull');
	const { DeleteMessagePullAction } = require('im/messenger/lib/counters/update-system/action/delete-message/pull');
	const { ConfirmationReadMessageAction } = require('im/messenger/lib/counters/update-system/action/read-message/server');
	const { ReadMessagePullAction } = require('im/messenger/lib/counters/update-system/action/read-message/pull');

	const { getLoggerWithContext } = require('im/messenger/lib/logger');

	const logger = getLoggerWithContext('pull-handler--counters', 'CounterPullHandler');

	/**
	 * @class CounterPullHandler
	 */
	class CounterPullHandler extends BasePullHandler
	{
		/** @type {UuidManager} */
		#uuidManager;

		constructor()
		{
			super({});

			this.#uuidManager = UuidManager.getInstance();
		}

		/**
		 * @param {MessageAddParams} params
		 * @param {PullExtraParams} extra
		 */
		handleMessage(params, extra, command)
		{
			logger.log('handleMessage', params, extra, command);

			const {
				chatId,
				counter,
				parentChatId = 0,
				message,
				recentConfig,
				userBlockChat,
			} = params;

			/** @type {CounterModelState} */
			const counterState = {
				chatId,
				counter,
				parentChatId,
				recentSections: recentConfig.sections,
				isMuted: CounterHelper.getMutedByMuteList(userBlockChat[chatId]),
			};

			const currentUserId = serviceLocator.get('core').getUserId();

			const action = message.senderId === currentUserId
				? new NewOwnPullMessageAction({ chatId, counterState })
				: new NewParticipantPullMessageAction({
					chatId,
					incomingCounterState: counterState,
					previousMessageId: message.prevId,
					messageId: message.id,
					templateId: message.templateId,
				});

			serviceLocator.get('counters-update-system').dispatch(action)
				.catch((error) => {
					logger.error('handleMessage: dispatch action error', error);
				})
			;
		}

		/**
		 * @param {MessageAddParams} params
		 * @param {PullExtraParams} extra
		 */
		handleMessageChat(params, extra, command)
		{
			logger.log('handleMessageChat', params, extra, command);

			if (this.#isSharedEvent(extra))
			{
				logger.log('event is shared. skip event');

				return;
			}

			const {
				chatId,
				counter,
				message,
				recentConfig,
			} = params;

			const chat = params.chat[chatId];

			/** @type {CounterModelState} */
			const counterState = {
				chatId,
				counter,
				parentChatId: chat.parent_chat_id,
				isMuted: CounterHelper.getMutedByMuteList(chat.mute_list),
				recentSections: recentConfig.sections,
			};

			const currentUserId = serviceLocator.get('core').getUserId();

			const action = message.senderId === currentUserId
				? new NewOwnPullMessageAction({ chatId, counterState })
				: new NewParticipantPullMessageAction({
					chatId,
					incomingCounterState: counterState,
					previousMessageId: message.prevId,
					messageId: message.id,
					templateId: message.templateId,
				});

			serviceLocator.get('counters-update-system').dispatch(action)
				.catch((error) => {
					logger.error('handleMessage: dispatch action error', error);
				})
			;
		}

		/**
		 * @param {MessagePullHandlerMessageDeleteV2Params} params
		 */
		handleMessageDeleteV2(params, extra, command)
		{
			logger.log('handleMessageDeleteV2', params, extra, command);

			if (this.#isSharedEvent(extra))
			{
				return;
			}

			const {
				chatId,
				counter,
				parentChatId = 0,
				recentConfig,
				muted,
				unread,
				messages,
			} = params;

			const action = new DeleteMessagePullAction({
				chatId,
				incomingCounterState: {
					chatId,
					counter,
					parentChatId,
					recentSections: recentConfig.sections,
					isMuted: muted,
					isMarkedAsUnread: unread,
				},
				deletedMessageIds: messages.map((message) => message.id),
			});

			serviceLocator.get('counters-update-system').dispatch(action)
				.catch((error) => {
					logger.error('handleMessageDeleteV2: dispatch action error', error);
				});
		}

		async handleReadMessage(params, extra, command)
		{
			if (this.#isSharedEvent(extra))
			{
				return;
			}
			logger.log('handleReadMessage', params, extra, command);

			const {
				chatId,
				counter,
				lastId,
				recentConfig,
				muted,
				unread,
				parentChatId,
			} = params;

			// If actionUuid is registered, this is confirmation of our local action
			if (this.#isLocalActionUuid(extra))
			{
				const action = new ConfirmationReadMessageAction({
					chatId,
					actionUuid: extra.action_uuid,
					lastReadId: lastId,
					counter,
				});

				serviceLocator.get('counters-update-system').dispatch(action)
					.catch((error) => {
						logger.error('handleReadMessage: dispatch confirmation error', error);
					});

				this.#uuidManager.removeActionUuid(extra.action_uuid);

				return;
			}

			const counterState = {
				chatId,
				counter,
				parentChatId,
				recentSections: recentConfig.sections,
				isMuted: muted,
				isMarkedAsUnread: unread,
			};

			const repository = serviceLocator.get('counters-update-system').getChatCounterRepository();
			if (repository.hasPendingOperations(chatId))
			{
				const action = new ReadMessagePullAction({
					chatId,
					incomingCounterState: counterState,
					lastReadId: lastId,
				});

				serviceLocator.get('counters-update-system').dispatch(action)
					.catch((error) => {
						logger.error('handleReadMessage: dispatch pull action error', error);
					});

				return;
			}

			this.#setCounter(counterState)
				.catch((error) => {
					logger.error('handleReadMessage: setCounter error', error);
				});
		}

		handleReadMessageChat(params, extra, command)
		{
			if (this.#isSharedEvent(extra))
			{
				return;
			}
			logger.log('handleReadMessageChat', params, extra, command);

			const {
				chatId,
				counter,
				lastId,
				recentConfig,
				muted,
				unread,
				parentChatId,
			} = params;

			// If actionUuid is registered, this is confirmation of our local action
			if (this.#isLocalActionUuid(extra))
			{
				const action = new ConfirmationReadMessageAction({
					chatId,
					actionUuid: extra.action_uuid,
					lastReadId: lastId,
					counter,
				});

				serviceLocator.get('counters-update-system').dispatch(action)
					.catch((error) => {
						logger.error('handleReadMessageChat: dispatch confirmation error', error);
					});

				this.#uuidManager.removeActionUuid(extra.action_uuid);

				return;
			}

			// PULL from another device
			const counterState = {
				chatId,
				counter,
				parentChatId,
				recentSections: recentConfig.sections,
				isMuted: muted,
				isMarkedAsUnread: unread,
			};

			// Check if we have pending operations - if yes, resolve conflict
			const repository = serviceLocator.get('counters-update-system').getChatCounterRepository();
			if (repository.hasPendingOperations(chatId))
			{
				const action = new ReadMessagePullAction({
					chatId,
					incomingCounterState: counterState,
					lastReadId: lastId,
				});

				serviceLocator.get('counters-update-system').dispatch(action)
					.catch((error) => {
						logger.error('handleReadMessageChat: dispatch pull action error', error);
					});

				return;
			}

			// No pending operations - simple counter update
			this.#setCounter(counterState)
				.catch((error) => {
					logger.error('handleReadMessageChat: setCounter error', error);
				});
		}

		async handleReadAllChats(params, extra, command)
		{
			logger.info('handleReadAllChats', params, extra, command);

			// Use system to clear counters (Vuex + database, except openlines)
			await serviceLocator.get('counters-update-system').readAllChats()
				.catch((error) => {
					logger.error('handleReadAllChats: readAllChats error', error);
				});

			// Unregister action if it was ours
			if (extra.action_uuid && this.#isLocalActionUuid(extra))
			{
				this.#uuidManager.removeActionUuid(extra.action_uuid);
			}
		}

		/**
		 * @param {ReadAllChatsByTypeParams} params
		 * @param {PullExtraParams} extra
		 * @param {string} command
		 */
		handleReadAllChatsByType(params, extra, command)
		{
			logger.info('handleReadAllChatsByType', params);

			const { type } = params;

			if (type !== DialogType.tasksTask)
			{
				logger.warn('handleReadAllChatsByType: unsupported type', type);

				return;
			}

			serviceLocator.get('counters-update-system').readByRecentSection(RecentTab.tasksTask)
				.catch((error) => {
					logger.error('handleReadAllChatsByType error', error);
				});
		}

		handleReadChildren(params, extra, command)
		{
			if (this.#isSharedEvent(extra))
			{
				return;
			}

			logger.log(`${this.constructor.name}.handleReadAllChannelComments`, params, extra, command);

			const { chatId } = params;
			serviceLocator.get('counters-update-system').readChildren(chatId)
				.catch((error) => {
					logger.error('handleReadChildren error', error);
				})
			;
		}

		handleUnreadMessage(params, extra, command)
		{
			logger.log(`${this.constructor.name}.handleUnreadMessage`, params, extra, command);

			if (this.#isLocalActionUuid(extra))
			{
				logger.log('handleUnreadMessage. This event sent by current device. Skip event');

				return;
			}

			const {
				chatId,
				counter,
				parentChatId = 0,
			} = params;

			this.#setCounter({
				chatId,
				counter,
				parentChatId,
			})
				.catch((error) => {
					logger.error('handleUnreadMessage error', error);
				});
		}

		handleUnreadMessageChat(params, extra, command)
		{
			logger.log(`${this.constructor.name}.handleUnreadMessageChat`, params, extra, command);

			if (this.#isLocalActionUuid(extra))
			{
				logger.log('handleUnreadMessageChat. This event sent by current device. Skip event');

				return;
			}

			const {
				chatId,
				counter,
			} = params;

			const storedEvent = this.#getStoredState(chatId);

			this.#setCounter({
				chatId,
				counter,
				parentChatId: storedEvent?.parentChatId ?? 0,
			})
				.catch((error) => {
					logger.error('handleUnreadMessageChat error', error);
				});
		}

		/**
		 * @param {ChatUnreadPullHandlerParams} params
		 * @param {PullExtraData} extra
		 */
		handleChatUnread(params, extra)
		{
			if (this.#isSharedEvent(extra))
			{
				return;
			}
			logger.log(`${this.constructor.name}.handleChatUnread`, params, extra);

			const {
				active: isMarkedAsUnread,
				chatId,
				counter,
				muted: isMuted,
				parentChatId,
				recentConfig,
			} = params;

			this.#setCounter({
				chatId,
				counter,
				parentChatId,
				isMarkedAsUnread,
				isMuted,
				recentSections: recentConfig.sections,
			})
				.catch((error) => {
					logger.error('handleChatUnread error', error);
				});
		}

		async handleChatDelete(params, extra, command)
		{
			logger.log(`${this.constructor.name}.handleChatDelete`, params, extra, command);

			if (this.#isSharedEvent(extra))
			{
				return;
			}

			const { chatId } = params;

			await serviceLocator.get('counters-update-system').deleteCountersByChatIdList([chatId])
				.catch((error) => {
					logger.error('handleChatDelete: deleteCountersByChatIdList error', error);
				});
		}

		async handleChatHide(params, extra, command)
		{
			logger.log(`${this.constructor.name}.handleChatHide`, params, extra, command);

			if (this.#isSharedEvent(extra))
			{
				return;
			}

			const { chatId, recentConfigToHide } = params;

			const currentCounterState = this.#getStoredState(chatId);

			if (!currentCounterState)
			{
				logger.warn('handleChatHide: counter state not found for chatId', chatId);

				return;
			}

			const sectionsToHide = recentConfigToHide?.sections || [];
			if (!Type.isArrayFilled(sectionsToHide))
			{
				logger.warn('handleChatHide: no sections to hide', chatId);

				return;
			}

			const updatedRecentSections = (currentCounterState.recentSections || [])
				.filter((section) => !sectionsToHide.includes(section));

			if (!Type.isArrayFilled(updatedRecentSections))
			{
				await serviceLocator.get('counters-update-system').deleteCountersByChatIdList([chatId])
					.catch((error) => {
						logger.error('handleChatHide: deleteCountersByChatIdList error', error);
					});

				return;
			}

			const updatedCounterState = {
				...currentCounterState,
				recentSections: updatedRecentSections,
			};

			await this.#setCounter(updatedCounterState);
		}

		async handleChatUserLeave(params, extra, command)
		{
			logger.log(`${this.constructor.name}.handleChatUserLeave`, params, extra, command);

			if (this.#isSharedEvent(extra))
			{
				return;
			}

			const {
				chatId,
				userId,
			} = params;

			if (!UserHelper.isCurrentUser(userId))
			{
				return;
			}

			await serviceLocator.get('counters-update-system').deleteCountersByChatIdList([chatId])
				.catch((error) => {
					logger.error('handleChatUserLeave: deleteCountersByChatIdList error', error);
				});
		}

		handleChatMuteNotify(params, extra, command)
		{
			logger.log(`${this.constructor.name}.handleChatMuteNotify`, params, extra, command);

			const {
				chatId,
				counter,
				muted,
				parentChatId = 0,
				recentConfig,
				unread,
			} = params;

			this.#setCounter({
				chatId,
				counter,
				parentChatId,
				isMuted: muted,
				recentSections: recentConfig.sections,
				isMarkedAsUnread: unread,
			})
				.catch((error) => {
					logger.error('handleChatMuteNotify error', error);
				});
		}

		/**
		 * @param {RecentUpdateParams} params
		 * @param {PullExtraParams} extra
		 */
		handleRecentUpdate(params, extra, command)
		{
			logger.log(`${this.constructor.name}.handleRecentUpdate`, params, extra, command);

			const {
				counter,
				chat,
				recentConfig,
			} = params;

			const {
				id: chatId,
				parent_chat_Id: parentChatId = 0,
				mute_list: muteList,
			} = chat;

			const isMuted = CounterHelper.getMutedByMuteList(muteList);

			this.#setCounter({
				chatId,
				counter,
				parentChatId,
				isMuted,
				recentSections: recentConfig.sections,
			});
		}

		/**
		 * @param chatId
		 * @return {?CounterModelState}
		 */
		#getStoredState(chatId)
		{
			return this.store.getters['counterModel/getByChatId'](chatId);
		}

		/**
		 * @param {CounterModelState} counterState
		 */
		async #setCounter(counterState)
		{
			logger.log(`${this.constructor.name}.setCounter`, counterState);

			return serviceLocator.get('counters-update-system').updateCounterState(counterState);
		}

		/**
		 * @param {PullExtraParams} extra
		 * @return {boolean}
		 */
		#isSharedEvent(extra)
		{
			return extra.is_shared_event === true;
		}

		/**
		 * @param {PullExtraParams} extra
		 * @return {boolean}
		 */
		#isLocalActionUuid(extra)
		{
			if (Type.isNil(extra.action_uuid))
			{
				return false;
			}

			return this.#uuidManager.hasActionUuid(extra.action_uuid);
		}
	}

	module.exports = { CounterPullHandler };
});
