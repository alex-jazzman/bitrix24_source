/**
 * @module im/messenger/provider/services/analytics/video-note
 */
jn.define('im/messenger/provider/services/analytics/video-note', (require, exports, module) => {
	const { AnalyticsEvent } = require('analytics');
	const { Analytics } = require('im/messenger/const');
	const { serviceLocator } = require('im/messenger/lib/di/service-locator');
	const { AnalyticsHelper } = require('im/messenger/provider/services/analytics/helper');

	/**
	 * @class VideoNoteAnalytics
	 */
	class VideoNoteAnalytics
	{
		constructor()
		{
			this.store = serviceLocator.get('core').getStore();
		}

		/**
		 * @param {DialogId} dialogId
		 */
		sendTapToPlay(dialogId)
		{
			/** @type {DialoguesModelState} */
			const dialog = this.store.getters['dialoguesModel/getById'](dialogId);

			new AnalyticsEvent()
				.setTool(Analytics.Tool.im)
				.setCategory(Analytics.Category.videomessage)
				.setEvent(Analytics.Event.play)
				.setP1(AnalyticsHelper.getP1ByDialog(dialog))
				.send()
			;
		}

		/**
		 * @param {DialogId} dialogId
		 */
		sendTapToPause(dialogId)
		{
			/** @type {DialoguesModelState} */
			const dialog = this.store.getters['dialoguesModel/getById'](dialogId);

			new AnalyticsEvent()
				.setTool(Analytics.Tool.im)
				.setCategory(Analytics.Category.videomessage)
				.setEvent(Analytics.Event.pause)
				.setP1(AnalyticsHelper.getP1ByDialog(dialog))
				.send()
			;
		}

		/**
		 * @param {DialogId} dialogId
		 * @param {number} duration
		 */
		sendRecord(dialogId, duration)
		{
			/** @type {DialoguesModelState} */
			const dialog = this.store.getters['dialoguesModel/getById'](dialogId);
			const recordLength = `recordLength_${Math.round(duration / 1000)}`;

			new AnalyticsEvent()
				.setTool(Analytics.Tool.im)
				.setCategory(Analytics.Category.videomessage)
				.setEvent(Analytics.Event.record)
				.setP1(AnalyticsHelper.getP1ByDialog(dialog))
				.setP2(recordLength)
				.send()
			;
		}
	}

	module.exports = { VideoNoteAnalytics };
});
