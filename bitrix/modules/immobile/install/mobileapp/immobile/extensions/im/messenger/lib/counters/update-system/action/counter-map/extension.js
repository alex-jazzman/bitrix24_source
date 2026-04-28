/**
 * @module im/messenger/lib/counters/update-system/action/сounter-map
 */
jn.define('im/messenger/lib/counters/update-system/action/counter-map', (require, exports, module) => {
	const { Type } = require('type');
	const { PendingOperationType } = require('im/messenger/lib/counters/update-system/const');
	const { CounterAction } = require('im/messenger/lib/counters/update-system/action/base');
	const { getLoggerWithContext } = require('im/messenger/lib/logger');

	const logger = getLoggerWithContext('counters--update-system', 'SetCounterMapAction');

	/**
	 * @class SetCounterMapAction
	 */
	class SetCounterMapAction extends CounterAction
	{
		/**
		 * @param {Array<CounterModelState>} counterList
		 */
		constructor(counterList)
		{
			super();
			this.counterList = counterList;
		}

		getType()
		{
			return PendingOperationType.counterMap;
		}

		/**
		 * @param {ChatCounterRepository} repository
		 * @return {Promise<void>}
		 */
		async execute(repository)
		{
			const counterListToSaveWithoutResolveConflict = [];
			for (const counterModelState of this.counterList)
			{
				if (!repository.hasPendingOperations(counterModelState.chatId))
				{
					counterListToSaveWithoutResolveConflict.push(counterModelState);
				}
			}

			if (Type.isArrayFilled(counterListToSaveWithoutResolveConflict))
			{
				await repository.saveCounterStateList(counterListToSaveWithoutResolveConflict);
			}

			const missingChatIdList = this.#getMissingChatIdList(repository);
			if (Type.isArrayFilled(missingChatIdList))
			{
				logger.log('execute: missing chatIdList', missingChatIdList);
				await this.updateSystem.deleteCountersByChatIdList(missingChatIdList);
			}
		}

		/**
		 * @param {ChatCounterRepository} repository
		 * @return {Array<number>}
		 */
		#getMissingChatIdList(repository)
		{
			const incomingChatIds = this.counterList
				.map((item) => item.chatId);
			const incomingSet = new Set(incomingChatIds);

			const storedCollection = repository.getCounterCollection();

			return Object.keys(storedCollection)
				.map(Number)
				.filter((id) => !incomingSet.has(id))
			;
		}
	}

	module.exports = { SetCounterMapAction };
});
