/**
 * @module im/messenger/provider/services/read/service
 */
jn.define('im/messenger/provider/services/read/service', (require, exports, module) => {
	const { Type } = require('type');
	const {
		EventType,
		AppStatus,
		RestMethod,
	} = require('im/messenger/const');
	const { serviceLocator } = require('im/messenger/lib/di/service-locator');
	const { runAction, callMethod } = require('im/messenger/lib/rest');
	const { UuidManager } = require('im/messenger/lib/uuid-manager');
	const { CounterStorageWriter } = require('im/messenger/lib/counters/counter-manager/storage/writer');
	const { getLoggerWithContext } = require('im/messenger/lib/logger');
	const { Feature } = require('im/messenger/lib/feature');
	const { CounterHelper } = require('im/messenger/lib/helper');

	const { ReadMessageQueue } = require('im/messenger/provider/services/read/read-message-queue');
	const { CounterStoreWriter } = require('im/messenger/provider/services/read/store-writer');

	/**
	 * @class ReadMessageService
	 */
	class ReadMessageService
	{
		#storeManager = serviceLocator.get('core').getStoreManager();
		#core = serviceLocator.get('core');
		#queue = new ReadMessageQueue();
		#isProcessing = false;
		#counterStorageWriter = null;
		#isActive = false;

		constructor()
		{
			this.logger = getLoggerWithContext('counters--read-message-service', this);
			this.#subscribeEvents();

			if (!Feature.isMessengerV2Enabled)
			{
				this.#subscribeStoreEvents();
				this.readMessagesFromQueue().catch((error) => {
					this.logger.error('initializing readMessagesFromQueue error', error);
				});
			}
		}

		/**
		 * @return {CounterStorageWriter|CounterStoreWriter}
		 */
		get counterStorageWriter()
		{
			if (this.#counterStorageWriter)
			{
				return this.#counterStorageWriter;
			}

			if (Feature.isMessengerV2Enabled)
			{
				this.#counterStorageWriter = new CounterStoreWriter();

				return this.#counterStorageWriter;
			}
			this.#counterStorageWriter = CounterStorageWriter.getInstance();

			return this.#counterStorageWriter;
		}

		get className()
		{
			return this.constructor.name;
		}

		async readMessagesFromQueue()
		{
			this.enableReading();

			return this.#readMessagesFromQueue(true);
		}

		async readAllMessages()
		{
			await this.#core.getStore().dispatch('counterModel/clear').catch((error) => {
				this.logger.error('readAllMessages counterModel/clear error: ', error);
			});

			await this.#core.getStore().dispatch('anchorModel/clear').catch((error) => {
				this.logger.error('readAllMessages anchorModel/clear error: ', error);
			});

			await callMethod(RestMethod.imDialogReadAll).catch((error) => {
				this.logger.error('readAllMessages imDialogReadAll error: ', error);
			});
		}

		async readAllMessagesByDialogType(dialogType)
		{
			const counterType = CounterHelper.getCounterTypeByDialogType(dialogType);
			await this.#core.getStore().dispatch('counterModel/clearByType', {
				type: counterType,
			}).catch((error) => {
				this.logger.error('readAllMessagesByDialogType anchorModel/clearByType error: ', error);
			});

			await this.#core.getStore().dispatch('anchorModel/clearByDialogType', {
				dialogType,
			}).catch((error) => {
				this.logger.error('readAllMessagesByDialogType anchorModel/clearByDialogType error: ', error);
			});

			await runAction(RestMethod.imV2ChatReadAllByType, {
				data: {
					type: dialogType,
				},
			}).catch((error) => {
				this.logger.error('readAllMessagesByDialogType imV2ChatReadAllByType error: ', error);
			});
		}

		/**
		 * @param {number} chatId
		 * @param {Array<number>} messageIdList
		 * @param {number} lastReadId
		 * @param {Array<number>} unreadMessageList
		 * @return {Promise<void>}
		 */
		async readMessages({
			chatId,
			messageIdList,
			lastReadId,
			unreadMessageList = null,
		})
		{
			return this.#readMessagesHandler({
				chatId,
				messageIdList,
				lastReadId,
				unreadMessageList,
			});
		}

		disableReading()
		{
			this.#isActive = false;
		}

		enableReading()
		{
			this.#isActive = true;
		}

		#subscribeStoreEvents()
		{
			this.#storeManager.on('applicationModel/setStatus', this.#applicationSetStatusHandler);
		}

		#subscribeEvents()
		{
			BX.addCustomEvent(EventType.dialog.internal.readMessages, this.#readMessagesHandler);
		}

		#applicationSetStatusHandler = async () => {
			if (this.#core.getAppStatus() !== AppStatus.networkWaiting)
			{
				this.#readMessagesFromQueue();
			}
		};

		/**
		 * @param {number} chatId
		 * @param {Array<Number>} messageIdList
		 * @param {number} lastReadId
		 * @param {Array<Number>} unreadMessageList
		 * @returns {Promise<void>}
		 */
		#readMessagesHandler = async ({
			chatId,
			messageIdList,
			lastReadId,
			unreadMessageList = null,
		}) => {
			this.logger.log('readMessagesHandler', chatId, messageIdList, lastReadId, unreadMessageList);

			const deductibleCounter = messageIdList.reduce((counter, messageId) => {
				if (Type.isNull(unreadMessageList))
				{
					return messageId > lastReadId ? counter + 1 : counter;
				}

				if (Type.isArrayFilled(unreadMessageList) && unreadMessageList.includes(messageId))
				{
					return counter + 1;
				}

				return counter;
			}, 0);

			this.logger.log('readMessagesHandler deductibleCounter', deductibleCounter);

			await this.counterStorageWriter.decreaseCounter(chatId, deductibleCounter);

			await this.#queue.addMessagesToQueue({
				messageList: messageIdList,
				chatId,
			});

			if (this.#isProcessing)
			{
				return;
			}

			this.#readMessagesFromQueue()
				.catch((error) => {
					this.logger.error('readMessagesHandler error', error);
				});
		};

		async #readMessagesFromQueue(ignoreAppStatus = false)
		{
			this.logger.log('readMessagesFromQueue');
			if (!this.#isActive)
			{
				this.logger.warn('readMessagesFromQueue queue is not active. skip');

				return;
			}

			if (this.#isProcessing)
			{
				this.logger.warn('readMessagesFromQueue read is processing. skip');

				return;
			}
			this.#isProcessing = true;

			if (!ignoreAppStatus && this.#core.getAppStatus() === AppStatus.networkWaiting)
			{
				this.logger.warn('readMessagesFromQueue offline status. skip');
				this.#isProcessing = false;

				return;
			}

			const isQueueEmpty = await this.#queue.isEmpty();
			if (isQueueEmpty)
			{
				this.logger.warn('readMessagesFromQueue queue is empty. skip');
				this.#isProcessing = false;

				return;
			}

			const messageChunkToRead = await this.#queue.getMessageChunk();
			this.logger.log('readMessagesFromQueue messageChunkToRead', messageChunkToRead);

			const messageReadData = {
				chatId: messageChunkToRead.chatId,
				ids: messageChunkToRead.messageList,
				actionUuid: UuidManager.getInstance().getActionUuid(),
			};

			try
			{
				const result = await runAction(RestMethod.imV2ChatMessageRead, { data: messageReadData });
				this.logger.log('readMessagesFromQueue readMessages result', result);

				const {
					chatId,
					counter,
					lastId,
				} = result;

				await this.#syncLocalCountersWithServerResponse(
					chatId,
					lastId,
					counter,
					messageChunkToRead.hasMoreForChat,
				);

				await this.#queue.deleteMessages(messageChunkToRead);
			}
			catch (readMessagesError)
			{
				if (!Type.isArray(readMessagesError))
				{
					// eslint-disable-next-line no-ex-assign
					readMessagesError = [readMessagesError];
				}
				await this.#handleReadMessagesError(readMessagesError, messageReadData);
			}
			finally
			{
				this.#isProcessing = false;
				void this.#readMessagesFromQueue(ignoreAppStatus);
			}
		}

		async #syncLocalCountersWithServerResponse(chatId, lastId, counter, locked)
		{
			const counterState = await this.#getCounterState(chatId);
			if (!Type.isPlainObject(counterState))
			{
				return;
			}

			if (counter !== counterState.counter || !locked)
			{
				await this.counterStorageWriter.set({
					...counterState,
					counter,
					locked,
				});
			}
		}

		/**
		 * @param {Array<{message: string, code: string}>} readMessagesErrorList
		 * @param {{chatId: number}}messageReadData
		 * @returns {Promise<void>}
		 */
		async #handleReadMessagesError(readMessagesErrorList, messageReadData)
		{
			const networkError = readMessagesErrorList
				.find((error) => error?.code === 'NETWORK_ERROR')
			;

			if (!networkError)
			{
				this.logger.error('handleReadMessagesError errors without NETWORK_ERROR. delete from queue', messageReadData.chatId);
				await this.#queue.deleteChats([messageReadData.chatId]);
			}
		}

		/**
		 * @param chatId
		 * @returns {Promise<?CounterState>}
		 */
		async #getCounterState(chatId)
		{
			return this.counterStorageWriter.findById(chatId);
		}
	}

	module.exports = { ReadMessageService };
});
