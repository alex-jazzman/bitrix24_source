/**
 * @module im/messenger/provider/services/analytics/src/reaction
 */
jn.define('im/messenger/provider/services/analytics/src/reaction', (require, exports, module) => {
	const { Type } = require('type');
	const { AnalyticsEvent } = require('analytics');

	const { Analytics } = require('im/messenger/const');
	const { serviceLocator } = require('im/messenger/lib/di/service-locator');
	const { AnalyticsHelper } = require('im/messenger/provider/services/analytics/helper');

	/**
	 * @class Reactions
	 */
	class Reactions
	{
		constructor()
		{
			this.store = serviceLocator.get('core').getStore();
		}

		/**
		 * @param {string|number} dialogId
		 */
		sendExpandReactionList(dialogId)
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
					.setEvent(Analytics.Event.expandReactionList)
					.setP1(AnalyticsHelper.getP1ByDialog(dialog));

				analytics.send();
			}
			catch (error)
			{
				console.error(`${this.constructor.name}.sendExpandReactionList.catch:`, error);
			}
		}
	}

	module.exports = { Reactions };
});
