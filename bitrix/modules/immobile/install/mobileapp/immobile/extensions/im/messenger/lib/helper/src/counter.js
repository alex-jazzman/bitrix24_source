/**
 * @module im/messenger/lib/helper/counter
 */
jn.define('im/messenger/lib/helper/counter', (require, exports, module) => {
	const { Type } = require('type');
	const { RecentTab, COUNTER_OVERFLOW_LIMIT } = require('im/messenger/const');
	const { serviceLocator } = require('im/messenger/lib/di/service-locator');
	const { getLoggerWithContext } = require('im/messenger/lib/logger');

	const logger = getLoggerWithContext('helpers--counter', 'CounterHelper');

	/**
	 * @class CounterHelper
	 */
	class CounterHelper
	{
		#tabs = new Set();

		static getMutedByMuteList(muteList)
		{
			const currentUserId = serviceLocator.get('core').getUserId();

			if (Type.isPlainObject(muteList))
			{
				return muteList[currentUserId] === true;
			}

			if (Type.isArrayFilled(muteList))
			{
				return muteList.includes(currentUserId);
			}

			return false;
		}

		/**
		 * @param {CounterModelState} counterModelState
		 * @return {CounterHelper|null}
		 */
		static createByModel(counterModelState)
		{
			if (!Type.isPlainObject(counterModelState))
			{
				logger.error('createByModel error: counterModelState is not an object', counterModelState);

				return null;
			}

			return new CounterHelper(counterModelState);
		}

		/**
		 * @param {number} chatId
		 * @return {CounterHelper|null}
		 */
		static createByChatId(chatId)
		{
			if (!Type.isNumber(chatId))
			{
				logger.warn('DialogHelper.getByDialogId error: dialogId is not a number or string filled', chatId);

				return null;
			}

			const counterModelState = serviceLocator.get('core').getStore()
				.getters['counterModel/getByChatId'](chatId)
			;
			if (Type.isNil(counterModelState))
			{
				logger.warn('DialogHelper.getByDialogId: dialog not found', chatId);

				return null;
			}

			return CounterHelper.createByModel(counterModelState);
		}

		/**
		 * @param {CounterModelState} counterModelState
		 */
		constructor(counterModelState)
		{
			this.state = counterModelState;

			this.#tabs = new Set(counterModelState.recentSections);
		}

		get isTabsEmpty()
		{
			return this.#tabs.size === 0;
		}

		get hasChatTab()
		{
			return this.#tabs.has(RecentTab.chat);
		}

		get hasCopilotTab()
		{
			return this.#tabs.has(RecentTab.copilot);
		}

		get hasCollabTab()
		{
			return this.#tabs.has(RecentTab.collab);
		}

		get hasOpenlinesTab()
		{
			return this.#tabs.has(RecentTab.openlines);
		}

		get hasTasksTab()
		{
			return this.#tabs.has(RecentTab.tasksTask);
		}

		get isMuted()
		{
			return this.state.isMuted;
		}

		get isMarkedAsUnread()
		{
			return this.state.isMarkedAsUnread;
		}

		get isOverflow()
		{
			return this.state.counter >= COUNTER_OVERFLOW_LIMIT;
		}

		/**
		 * @return {number}
		 */
		get tabCounter()
		{
			return this.isMarkedAsUnread && this.state.counter === 0 ? 1 : this.state.counter;
		}
	}

	module.exports = { CounterHelper };
});
