/**
 * @module im/messenger/provider/pull/copilot/counter
 */
jn.define('im/messenger/provider/pull/copilot/counter', (require, exports, module) => {
	const { CounterType } = require('im/messenger/const');
	const { TabCounters } = require('im/messenger/lib/counters/tab-counters');
	const { BaseCounterPullHandler } = require('im/messenger/provider/pull/base/counter');
	const { LoggerManager } = require('im/messenger/lib/logger');
	const logger = LoggerManager.getInstance().getLogger('pull-handler--collab-counter');

	/**
	 * @deprecated
	 * @class CopilotCounterPullHandler
	 */
	class CopilotCounterPullHandler extends BaseCounterPullHandler
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

			if (counterType === CounterType.copilot)
			{
				TabCounters.copilotCounter.detail[dialogId] = counter;
				TabCounters.update();
			}
		}
	}

	module.exports = {
		CopilotCounterPullHandler,
	};
});
