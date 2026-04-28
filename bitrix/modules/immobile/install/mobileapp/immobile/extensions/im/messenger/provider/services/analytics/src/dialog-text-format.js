/**
 * @module im/messenger/provider/services/analytics/src/dialog-text-format
 */
jn.define('im/messenger/provider/services/analytics/src/dialog-text-format', (require, exports, module) => {
	const { Type } = require('type');
	const { AnalyticsEvent } = require('analytics');

	const { Analytics } = require('im/messenger/const');
	const { serviceLocator } = require('im/messenger/lib/di/service-locator');
	const { getLoggerWithContext } = require('im/messenger/lib/logger');

	const { AnalyticsHelper } = require('im/messenger/provider/services/analytics/helper');

	/**
	 * @class DialogTextFormatAnalytics
	 */
	class DialogTextFormatAnalytics
	{
		constructor()
		{
			/**
			 * @private
			 * @type {MessengerCoreStore}
			 */
			this.store = serviceLocator.get('core').getStore();
			/** @private */
			this.logger = getLoggerWithContext('analytics-service', this);
		}

		/**
		 * @param {DialogId} dialogId
		 * @param {string} actionId
		 */
		sendUseTextFormatting(dialogId, actionId)
		{
			try
			{
				const dialog = this.store.getters['dialoguesModel/getById'](dialogId);
				if (Type.isNil(dialog))
				{
					return;
				}

				const dialogType = dialog.type;
				const analytics = new AnalyticsEvent()
					.setTool(Analytics.Tool.im)
					.setCategory(AnalyticsHelper.getCategoryByChatType(dialogType))
					.setEvent(Analytics.Event.useTextFormatting)
					.setType(actionId)
					.setP1(AnalyticsHelper.getP1ByDialog(dialog));

				analytics.send();
			}
			catch (error)
			{
				this.logger.error('sendUseTextFormatting error', error);
			}
		}
	}

	module.exports = { DialogTextFormatAnalytics };
});
