/**
 * @module im/messenger/lib/counters/update-system/action/base
 */
jn.define('im/messenger/lib/counters/update-system/action/base', (require, exports, module) => {
	const { Type } = require('type');
	const { serviceLocator } = require('im/messenger/lib/di/service-locator');
	const { UuidManager } = require('im/messenger/lib/uuid-manager');
	const { ChatDataProvider } = require('im/messenger/provider/data');
	const { getLoggerWithContext } = require('im/messenger/lib/logger');
	/**
	 * @abstract
	 * @class CounterAction
	 */
	class CounterAction
	{
		/** @type {?ChatDataProvider} */
		#chatDataProvider = null;

		/**
		 * @abstract
		 * @param {ChatCounterRepository} repository
		 */
		async execute(repository)
		{
			throw new Error('Method execute must be implemented');
		}

		/**
		 * @abstract
		 * @return {string}
		 */
		getType()
		{
			throw new Error('Method getType must be implemented');
		}

		/**
		 * @return {CountersUpdateSystem}
		 */
		get updateSystem()
		{
			return serviceLocator.get('counters-update-system');
		}

		get UuidManager()
		{
			return UuidManager.getInstance();
		}

		constructor()
		{
			/** @protected */
			this.logger = getLoggerWithContext('counters--update-system', this);
		}

		/**
		 * @protected
		 * @return {ChatDataProvider}
		 */
		get chatDataProvider()
		{
			this.#chatDataProvider ??= new ChatDataProvider();

			return this.#chatDataProvider;
		}

		/**
		 * @protected
		 * @param {number} chatId
		 * @return {Promise<?DialoguesModelState>}
		 */
		async getChatData(chatId)
		{
			const result = await this.chatDataProvider.get({ chatId });

			return result.hasData() ? result.getData() : null;
		}

		/**
		 * @desc Strict comparison: by the action's run time `dialoguesModel.lastMessageId`
		 * already contains this event's id (or a newer one), so only a lower id is stale.
		 * @protected
		 * @param {number} chatId
		 * @param {?number} messageId
		 * @return {Promise<boolean>}
		 */
		async isOutdatedByLastMessageId(chatId, messageId)
		{
			if (!Type.isInteger(messageId))
			{
				return false;
			}

			const chat = await this.getChatData(chatId);

			return messageId < (chat?.lastMessageId ?? 0);
		}

		/**
		 * @desc Whether a read pull event is stale — its `lastId` is not above the stored `lastReadId`.
		 * No pull handler writes `lastReadId` on read events, so `<=` is safe inside the queue.
		 * @protected
		 * @param {number} chatId
		 * @param {?number} lastId
		 * @return {Promise<boolean>}
		 */
		async isOutdatedByLastReadId(chatId, lastId)
		{
			if (!Type.isInteger(lastId))
			{
				return false;
			}

			const chat = await this.getChatData(chatId);

			return lastId <= (chat?.lastReadId ?? 0);
		}
	}

	module.exports = { CounterAction };
});
