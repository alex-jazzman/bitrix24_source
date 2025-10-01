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
	const { runAction } = require('im/messenger/lib/rest');
	const { UuidManager } = require('im/messenger/lib/uuid-manager');
	const { CounterStorageWriter } = require('im/messenger/lib/counters/counter-manager/storage/writer');
	const { getLogger } = require('im/messenger/lib/logger');

	const { ReadMessageQueue } = require('im/messenger/provider/services/read/read-message-queue');

	const logger = getLogger('counters--read-message-service');

	/**
	 * @class ReadMessageService
	 */
	class ReadMessageService
	{
		#storeManager = serviceLocator.get('core').getStoreManager();
		#core = serviceLocator.get('core');
		#queue = new ReadMessageQueue();
		#isProcessing = false;
		#counterStorageWriter = CounterStorageWriter.getInstance();

		constructor()
		{
			this.#subscribeStoreEvents();
			this.#subscribeEvents();

			this.#readMessagesFromQueue();
		}

		get className()
		{
			return this.constructor.name;
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
			logger.log(`${this.className}.readMessagesHandler`, chatId, messageIdList, lastReadId, unreadMessageList);

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

			logger.log(`${this.className}.readMessagesHandler deductibleCounter`, deductibleCounter);

			this.#counterStorageWriter.decreaseCounter(chatId, deductibleCounter);

			await this.#queue.addMessagesToQueue({
				messageList: messageIdList,
				chatId,
			});

			this.#readMessagesFromQueue();
		};

		async #readMessagesFromQueue()
		{
			logger.log(`${this.className}.readMessagesFromQueue`);
			if (this.#isProcessing)
			{
				logger.warn(`${this.className}.readMessagesFromQueue read is processing. skip`);

				return;
			}
			this.#isProcessing = true;

			if (this.#core.getAppStatus() === AppStatus.networkWaiting)
			{
				logger.warn(`${this.className}.readMessagesFromQueue offline status. skip`);
				this.#isProcessing = false;

				return;
			}

			const isQueueEmpty = await this.#queue.isEmpty();
			if (isQueueEmpty)
			{
				logger.warn(`${this.className}.readMessagesFromQueue queue is empty. skip`);
				this.#isProcessing = false;

				return;
			}

			const messageChunkToRead = await this.#queue.getMessageChunk();
			logger.log(`${this.className}.readMessagesFromQueue messageChunkToRead`, messageChunkToRead);

			const messageReadData = {
				chatId: messageChunkToRead.chatId,
				ids: messageChunkToRead.messageList,
				actionUuid: UuidManager.getInstance().getActionUuid(),
			};

			try
			{
				const result = await runAction(RestMethod.imV2ChatMessageRead, { data: messageReadData });
				logger.log(`${this.className}.readMessagesFromQueue readMessages result`, result);

				const {
					chatId,
					counter,
					lastId,
				} = result;

				await this.#syncLocalCountersWithServerResponse(chatId, lastId, counter);

				await this.#queue.deleteMessages(messageChunkToRead);
			}
			catch (readMessagesError)
			{
				logger.error(`${this.className}.readMessagesFromQueue readMessageOnServer error`, readMessagesError);
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
				void this.#readMessagesFromQueue();
			}
		}

		async #syncLocalCountersWithServerResponse(chatId, lastId, counter)
		{
			const counterState = await this.#getCounterState(chatId);
			if (!Type.isPlainObject(counterState))
			{
				return;
			}

			if (counter !== counterState.counter)
			{
				this.#counterStorageWriter.set({
					...counterState,
					counter,
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
				logger.error(`${this.className}.handleReadMessagesError errors without NETWORK_ERROR. delete from queue`, messageReadData.chatId);
				await this.#queue.deleteChats([messageReadData.chatId]);
			}
		}

		/**
		 * @param chatId
		 * @returns {Promise<?CounterState>}
		 */
		async #getCounterState(chatId)
		{
			return (await this.#counterStorageWriter.getCollection()).findById(chatId);
		}
	}

	module.exports = { ReadMessageService };
});
