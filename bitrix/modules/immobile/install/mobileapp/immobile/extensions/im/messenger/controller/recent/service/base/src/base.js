/**
 * @module im/messenger/controller/recent/service/base/base
 */
jn.define('im/messenger/controller/recent/service/base/base', (require, exports, module) => {
	const { getLoggerWithContext } = require('im/messenger/lib/logger');
	const { RecentEventType } = require('im/messenger/controller/recent/const');

	/**
	 * @implements Unsubscribable
	 * @template Tprops
	 * @abstract
	 * @class BaseRecentService
	 */
	class BaseRecentService
	{
		/**
		 * @param {RecentLocator} recentLocator
		 * @param {string} serviceId
		 * @param {object} props
		 */
		constructor(recentLocator, serviceId, props)
		{
			/**
			 * @type {RecentLocator}
			 */
			this.recentLocator = recentLocator;
			/** @type {Tprops} */
			this.props = props;
			this.logger = getLoggerWithContext(`recent-service--${serviceId}`, `${recentLocator.get('id')}-${recentLocator.get('parentChatId')} ${this.constructor.name}`);

			recentLocator.get('emitter')
				.once(RecentEventType.onInit, () => {
					this.logger.info('start init');
					this.onInit();
				})
			;
		}

		/**
		 * @abstract
		 */
		unsubscribeEvents()
		{}

		/**
		 * @abstract
		 */
		subscribeEvents()
		{}

		/**
		 * @abstract
		 */
		onInit()
		{}
	}

	module.exports = { BaseRecentService };
});
