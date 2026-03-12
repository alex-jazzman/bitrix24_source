/**
 * @module im/messenger/controller/dialog/lib/input-record
 */
jn.define('im/messenger/controller/dialog/lib/input-record', (require, exports, module) => {
	const { EventType, RecordMediaType } = require('im/messenger/const');

	/**
	 * @desc Must be initialized inside Dialog.createWidget.
	 * Otherwise, the recordMediaType will not be available
	 * @class InputRecordManager
	 */
	class InputRecordManager
	{
		/**
		 * @param {DialogLocator} dialogLocator
		 */
		constructor(dialogLocator)
		{
			/** @type {DialogLocator} */
			this.dialogLocator = dialogLocator;
		}

		/**
		 * @private
		 * @return {MessengerCoreStore}
		 */
		get store()
		{
			return this.dialogLocator.get('store');
		}

		/**
		 * @private
		 * @return {DialogView}
		 */
		get view()
		{
			return this.dialogLocator.get('view');
		}

		/**
		 * @return {RecordMediaType}
		 */
		get recordMediaType()
		{
			const appSettings = this.store.getters['applicationModel/getSettings']();

			return appSettings.recordMediaType;
		}

		subscribeViewEvents()
		{
			this.view
				.on(EventType.dialog.audioRecordLongTap, this.audioRecordLongTapHandler)
				.on(EventType.dialog.videoRecordLongTap, this.videoRecordLongTapHandler);
		}

		unsubscribeViewEvents()
		{
			this.view
				.off(EventType.dialog.audioRecordLongTap, this.audioRecordLongTapHandler)
				.off(EventType.dialog.videoRecordLongTap, this.videoRecordLongTapHandler);
		}

		/**
		 * @returns {Promise}
		 */
		audioRecordLongTapHandler = () => {
			return this.store.dispatch('applicationModel/setRecordMediaType', RecordMediaType.audio);
		};

		/**
		 * @returns {Promise}
		 */
		videoRecordLongTapHandler = () => {
			return this.store.dispatch('applicationModel/setRecordMediaType', RecordMediaType.video);
		};
	}

	module.exports = { InputRecordManager };
});
