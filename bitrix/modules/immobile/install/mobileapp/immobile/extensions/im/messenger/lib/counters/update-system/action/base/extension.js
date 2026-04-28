/**
 * @module im/messenger/lib/counters/update-system/action/base
 */
jn.define('im/messenger/lib/counters/update-system/action/base', (require, exports, module) => {
	const { serviceLocator } = require('im/messenger/lib/di/service-locator');
	const { UuidManager } = require('im/messenger/lib/uuid-manager');
	const { getLoggerWithContext } = require('im/messenger/lib/logger');
	/**
	 * @abstract
	 * @class CounterAction
	 */
	class CounterAction
	{
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
	}

	module.exports = { CounterAction };
});
