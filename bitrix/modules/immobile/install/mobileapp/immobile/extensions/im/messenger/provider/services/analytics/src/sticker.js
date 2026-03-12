/**
 * @module im/messenger/provider/services/analytics/src/sticker
 */
jn.define('im/messenger/provider/services/analytics/src/sticker', (require, exports, module) => {
	const { Type } = require('type');
	const { AnalyticsEvent } = require('analytics');

	const { Analytics } = require('im/messenger/const');
	const { serviceLocator } = require('im/messenger/lib/di/service-locator');
	const { getLoggerWithContext } = require('im/messenger/lib/logger');

	const { AnalyticsHelper } = require('im/messenger/provider/services/analytics/helper');

	/**
	 * @class StickerAnalytics
	 */
	class StickerAnalytics
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
		 */
		sendOpenStickerSelector(dialogId)
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
					.setEvent(Analytics.Event.openStickerTab)
					.setP1(AnalyticsHelper.getP1ByDialog(dialog));

				analytics.send();
			}
			catch (error)
			{
				this.logger.error('sendOpenStickerSelector error', error);
			}
		}

		sendCreateStickerPack()
		{
			try
			{
				const analytics = new AnalyticsEvent()
					.setTool(Analytics.Tool.im)
					.setCategory(Analytics.Category.stickers)
					.setEvent(Analytics.Event.clickCreateStickerPack)
				;

				analytics.send();
			}
			catch (error)
			{
				this.logger.error('sendCreateStickerPack error', error);
			}
		}

		sendAddStickerPack()
		{
			try
			{
				const analytics = new AnalyticsEvent()
					.setTool(Analytics.Tool.im)
					.setCategory(Analytics.Category.stickers)
					.setEvent(Analytics.Event.addStickerPack)
					.setSection(Analytics.Section.stickerPackPopup)
				;

				analytics.send();
			}
			catch (error)
			{
				this.logger.error('sendAddStickerPack error', error);
			}
		}
	}

	module.exports = { StickerAnalytics };
});
