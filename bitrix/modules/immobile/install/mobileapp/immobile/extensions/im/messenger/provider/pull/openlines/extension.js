/**
 * @module im/messenger/provider/pull/openlines
 */
jn.define('im/messenger/provider/pull/openlines', (require, exports, module) => {
	const { getLoggerWithContext } = require('im/messenger/lib/logger');
	const { Feature } = require('im/messenger/lib/feature');
	const { BasePullHandler } = require('im/messenger/provider/pull/base');

	/**
	 * @class OpenlinesPullHandler
	 */
	class OpenlinesPullHandler extends BasePullHandler
	{
		constructor()
		{
			super({ logger: getLoggerWithContext('pull-handler--openlines', OpenlinesPullHandler) });
		}

		getModuleId()
		{
			return 'imopenlines';
		}

		/**
		 * @param {UpdateSessionStatusPullHandlerParams} params
		 * @param {PullExtraParams} extra
		 */
		handleUpdateSessionStatus(params, extra)
		{
			if (this.interceptEvent(extra))
			{
				return;
			}

			if (!Feature.isOpenlinesInMessengerAvailable)
			{
				return;
			}

			this.logger.info('handleUpdateSessionStatus params:', params, extra);

			const { session } = params;
			this.store.dispatch('dialoguesModel/openlinesModel/set', [session]);
		}
	}

	module.exports = {
		OpenlinesPullHandler,
	};
});
