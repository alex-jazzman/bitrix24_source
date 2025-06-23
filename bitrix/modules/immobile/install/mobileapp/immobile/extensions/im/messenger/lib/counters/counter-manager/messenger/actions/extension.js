/**
 * @module im/messenger/lib/counters/counter-manager/messenger/actions
 */
jn.define('im/messenger/lib/counters/counter-manager/messenger/actions', (require, exports, module) => {
	const { TabCounters } = require('im/messenger/lib/counters/tab-counters');
	const { MessengerCounterSender } = require('im/messenger/lib/counters/counter-manager/messenger/sender');
	const { ChatDataProvider } = require('im/messenger/provider/data');

	async function readAllCountersOnClient()
	{
		const chatDataProvider = new ChatDataProvider();

		await chatDataProvider.clearCounters();

		MessengerCounterSender.getInstance().sendReadAll();
		TabCounters.clearAll();
	}

	module.exports = {
		readAllCountersOnClient,
	};
});
