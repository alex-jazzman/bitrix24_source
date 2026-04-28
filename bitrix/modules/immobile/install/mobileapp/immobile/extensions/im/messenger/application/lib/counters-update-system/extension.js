/**
 * @module im/messenger/application/lib/counters-update-system
 */
jn.define('im/messenger/application/lib/counters-update-system', (require, exports, module) => {
	const { CountersUpdateSystem } = require('im/messenger/lib/counters/update-system/system');
	const { ChatCounterRepository } = require('im/messenger/lib/counters/update-system/repository');
	const { CounterRestorer } = require('im/messenger/lib/counters/update-system/restorer');
	const { ActionDispatcher } = require('im/messenger/lib/counters/update-system/dispatcher');
	const { ReadRequestQueue } = require('im/messenger/lib/counters/update-system/delivery/read-request-queue');

	/**
	 * @param {CoreApplication} core
	 * @return {CountersUpdateSystem}
	 */
	function initializeCountersUpdateSystem(core)
	{
		const chatCounterRepository = new ChatCounterRepository({
			dbRepository: core.getRepository().counter,
			store: core.getStore(),
		});

		const readRequestQueue = new ReadRequestQueue();

		const restorer = new CounterRestorer({
			dbRepository: core.getRepository().counter,
			chatCounterRepository,
			readRequestQueue,
		});

		const dispatcher = new ActionDispatcher({
			chatCounterRepository,
		});

		return new CountersUpdateSystem({
			dispatcher,
			chatCounterRepository,
			restorer,
			readRequestQueue,
			store: core.getStore(),
		});
	}

	module.exports = { initializeCountersUpdateSystem };
});
