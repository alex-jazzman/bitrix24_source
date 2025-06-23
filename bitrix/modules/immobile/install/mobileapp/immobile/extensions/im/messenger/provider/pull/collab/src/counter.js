/**
 * @module im/messenger/provider/pull/collab/counter
 */
jn.define('im/messenger/provider/pull/collab/counter', (require, exports, module) => {
	const { CounterType } = require('im/messenger/const');
	const { TabCounters } = require('im/messenger/lib/counters/tab-counters');
	const { BaseCounterPullHandler } = require('im/messenger/provider/pull/base/counter');
	const { LoggerManager } = require('im/messenger/lib/logger');
	const logger = LoggerManager.getInstance().getLogger('pull-handler--collab-counter');

	/**
	 * @deprecated
	 * @class CollabCounterPullHandler
	 */
	class CollabCounterPullHandler extends BaseCounterPullHandler
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

			if (counterType === CounterType.collab)
			{
				TabCounters.collabCounter.detail[dialogId] = counter;
				TabCounters.update();
			}
		}
	}

	module.exports = {
		CollabCounterPullHandler,
	};
});
