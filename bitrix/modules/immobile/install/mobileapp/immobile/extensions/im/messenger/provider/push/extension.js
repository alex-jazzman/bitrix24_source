/**
 * @module im/messenger/provider/push
 */
jn.define('im/messenger/provider/push', (require, exports, module) => {
	/* @global ChatDataConverter */
	const { Type } = require('type');
	const { serviceLocator } = require('im/messenger/lib/di/service-locator');
	const { MessengerEmitter } = require('im/messenger/lib/emitter');
	const { MessengerParams } = require('im/messenger/lib/params');
	const {
		EventType,
		ComponentCode,
		OpenDialogContextType,
		NavigationTabId,
		DialogType,
	} = require('im/messenger/const');
	const { Feature } = require('im/messenger/lib/feature');
	const { getLoggerWithContext } = require('im/messenger/lib/logger');
	const logger = getLoggerWithContext('push-handler', 'PushHandler');

	class PushHandler
	{
		constructor()
		{
			this.store = serviceLocator.get('core').getStore();
			this.manager = Application.getNotificationHistory('im_message');
			this.openlineManager = Application.getNotificationHistory('im_lines_message');

			this.storedPullEvents = [];
		}

		get className()
		{
			return this.constructor.name;
		}

		getStoredPullEvents()
		{
			const list = [...this.storedPullEvents];

			this.storedPullEvents = [];

			return list;
		}

		async getRawPushEvents()
		{
			if (!Feature.isInstantPushEnabled)
			{
				const pushEvents = this.manager.get();
				logger.log('get push sync', pushEvents);

				return pushEvents;
			}

			const pushMessageEvents = await this.manager.getAsync();
			const openlinePushEvents = await this.openlineManager.getAsync();

			logger.log('get push async, pushMessageEvents: ', pushMessageEvents, ' openlinePushEvents: ', openlinePushEvents);
			let eventList = [];
			if (Type.isArrayFilled(pushMessageEvents?.IM_MESS))
			{
				eventList = pushMessageEvents?.IM_MESS;
			}

			if (Feature.isOpenlinesInMessengerAvailable && Type.isArrayFilled(openlinePushEvents?.IM_MESS))
			{
				eventList = [...eventList, ...openlinePushEvents.IM_MESS];
			}

			return eventList;
		}

		/**
		 * @return {Promise<Array<MessengerPushEvent>>}
		 */
		async getPushEventList()
		{
			const list = await this.getRawPushEvents();
			/** @type {Array<MessengerPushEvent>} */
			const eventList = [];

			if (!Type.isArrayFilled(list))
			{
				logger.info('getPushEventList: list is empty');

				return eventList;
			}

			logger.info('getPushEventList: parse push messages', list);

			list.forEach((push) => {
				if (push?.data?.cmd !== 'message' && push?.data?.cmd !== 'messageChat')
				{
					return;
				}

				let senderMessage = '';
				if (!Type.isUndefined(push.senderMessage))
				{
					senderMessage = push.senderMessage;
				}
				else if (!Type.isUndefined(push.aps) && push.aps.alert.body)
				{
					senderMessage = push.aps.alert.body;
				}

				if (!senderMessage)
				{
					return;
				}

				const event = {
					module_id: 'im',
					command: push.data.cmd,
					params: ChatDataConverter.preparePushFormat(push.data),
				};

				event.params.userInChat[event.params.chatId] = [MessengerParams.getUserId()];

				event.params.message.text = this.#sanitizeMessageText(senderMessage);
				event.params.message.text = this.#removeAttachmentSuffixFromMessageText(
					event.params.message.text,
					push.attachmentSuffix,
				);

				if (push.senderCut)
				{
					event.params.message.text = event.params.message.text.slice(Math.max(0, push.senderCut));
				}

				if (!event.params.message.textOriginal)
				{
					event.params.message.textOriginal = event.params.message.text;
				}

				eventList.push({
					command: event.command,
					params: event.params,
					extra: push.extra,
				});
			});
			eventList.sort((event1, event2) => {
				return event1.params.message.id - event2.params.message.id;
			});

			return eventList;
		}

		async executeAction()
		{
			if (Application.isBackground())
			{
				return false;
			}

			const push = Application.getLastNotification();
			if (Type.isPlainObject(push) && Object.keys(push).length === 0)
			{
				return false;
			}

			logger.info('executeAction: execute push-notification', push);

			const pushParams = ChatDataConverter.getPushFormat(push);

			if (pushParams.ACTION && pushParams.ACTION.slice(0, 8) === 'IM_MESS_')
			{
				const userId = parseInt(pushParams.ACTION.slice(8), 10);
				if (userId > 0)
				{
					const openDialogParams = {
						dialogId: userId,
						context: OpenDialogContextType.push,
					};

					if (Feature.isInstantPushEnabled)
					{
						openDialogParams.messageId = pushParams.PARAMS.MESSAGE_ID;
					}

					this.#openDialog(openDialogParams);
				}

				return true;
			}

			if (pushParams.ACTION && pushParams.ACTION.slice(0, 8) === 'IM_CHAT_')
			{
				if (MessengerParams.isOpenlinesOperator() && pushParams.CHAT_TYPE === 'L')
				{
					if (Feature.isOpenlinesInMessengerAvailable)
					{
						const dialogId = pushParams.PARAMS?.RECIPIENT_ID;

						if (Type.isStringFilled(dialogId))
						{
							const openDialogParams = {
								dialogId,
								dialogTitleParams: {
									chatType: DialogType.lines,
								},
							};

							this.#openDialog(openDialogParams);
						}

						return true;
					}

					const navigationController = serviceLocator.get('navigation-controller');
					void navigationController.makeMessengerTabActive();
					void navigationController.setActiveTab(NavigationTabId.openlines);

					return false;
				}

				const chatId = parseInt(pushParams.ACTION.slice(8), 10);
				if (chatId === 0)
				{
					return false;
				}

				const openDialogParams = {
					dialogId: `chat${chatId}`,
					context: OpenDialogContextType.push,
				};

				if (Feature.isInstantPushEnabled)
				{
					openDialogParams.messageId = pushParams.PARAMS.MESSAGE_ID;
				}

				MessengerEmitter.emit(EventType.messenger.openDialog, openDialogParams, ComponentCode.imMessenger);

				return true;
			}

			if (pushParams.ACTION && pushParams.ACTION === 'IM_NOTIFY')
			{
				MessengerEmitter.emit(EventType.messenger.openNotifications, {}, ComponentCode.imMessenger);
			}

			return true;
		}

		clearHistory()
		{
			this.manager.clear();
			this.openlineManager.clear();
		}

		/**
		 * @param {string} text
		 * @return {string}
		 */
		#sanitizeMessageText(text)
		{
			return text.toString()
				.replaceAll('&', '&amp;')
				.replaceAll('"', '&quot;')
				.replaceAll('<', '&lt;')
				.replaceAll('>', '&gt;')
			;
		}

		/**
		 * @param {string} text
		 * @param {string} attachmentSuffix
		 * @returns {string}
		 */
		#removeAttachmentSuffixFromMessageText(text, attachmentSuffix)
		{
			return text.replaceAll(attachmentSuffix, '');
		}

		#openDialog(openDialogParams)
		{
			serviceLocator.get('dialog-manager').openDialog(openDialogParams).catch((error) => {
				logger.error('openDialog error', error);
			});
		}
	}

	module.exports = {
		PushHandler,
	};
});
