/**
 * @module im/messenger/provider/services/analytics/image-picker
 */
jn.define('im/messenger/provider/services/analytics/image-picker', (require, exports, module) => {
	const { AnalyticsEvent } = require('analytics');

	const { Analytics } = require('im/messenger/const');
	const { serviceLocator } = require('im/messenger/lib/di/service-locator');
	const { AnalyticsHelper } = require('im/messenger/provider/services/analytics/helper');

	/**
	 * @class ImagePicker
	 */
	class ImagePicker
	{
		constructor()
		{
			this.store = serviceLocator.get('core').getStore();
		}

		/**
		 * @param {DialogId} dialogId
		 */
		sendShowImagePicker(dialogId)
		{
			const dialog = serviceLocator.get('core').getStore().getters['dialoguesModel/getById'](dialogId);

			new AnalyticsEvent()
				.setTool(Analytics.Tool.im)
				.setCategory(AnalyticsHelper.getCategoryByChat(dialog))
				.setEvent(Analytics.Event.clickAttach)
				.setSection(Analytics.Section.chatTextarea)
				.setP1(AnalyticsHelper.getP1ByDialog(dialog))
				.setP2(AnalyticsHelper.getP2ByUserType())
				.send();
		}
	}

	module.exports = { ImagePicker };
});
