/**
 * @module im/messenger/provider/pull/chat/counter
 */
jn.define('im/messenger/provider/pull/chat/counter', (require, exports, module) => {
	const { CounterType } = require('im/messenger/const');
	const { TabCounters } = require('im/messenger/lib/counters/tab-counters');
	const { BaseCounterPullHandler } = require('im/messenger/provider/pull/base/counter');
	const { LoggerManager } = require('im/messenger/lib/logger');
	const { Feature } = require('im/messenger/lib/feature');
	const logger = LoggerManager.getInstance().getLogger('pull-handler--chat-counter');

	/**
	 * @deprecated
	 * @class ChatCounterPullHandler
	 */
	class ChatCounterPullHandler extends BaseCounterPullHandler
	{
		constructor()
		{
			super({ logger });
		}

		/**
		 * @protected
		 * @param params
		 */
		updateCounter(params)
		{
			const {
				dialogId,
				counter,
				counterType,
			} = params;

			const types = [CounterType.chat, CounterType.collab];
			if (Feature.isCopilotInDefaultTabAvailable)
			{
				types.push(CounterType.copilot);
			}

			if (types.includes(counterType))
			{
				TabCounters.chatCounter.detail[dialogId] = counter;
				TabCounters.update();
			}

			if (!Feature.isCopilotInDefaultTabAvailable && counterType === CounterType.copilot)
			{
				TabCounters.copilotCounter.detail[dialogId] = counter;
				TabCounters.update();
			}
		}
	}

	module.exports = {
		ChatCounterPullHandler,
	};
});
