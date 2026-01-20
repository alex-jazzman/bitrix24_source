/**
 * @module im/messenger/controller/dialog/lib/sticker/src/manager
 */
jn.define('im/messenger/controller/dialog/lib/sticker/src/manager', (require, exports, module) => {
	const { EventType } = require('im/messenger/const');
	const { MessageHelper } = require('im/messenger/lib/helper');
	const { serviceLocator } = require('im/messenger/lib/di/service-locator');
	const { getLoggerWithContext } = require('im/messenger/lib/logger');
	const { Feature } = require('im/messenger/lib/feature');
	const { StickerSelector } = require('im/messenger/controller/dialog/lib/sticker/src/selector');
	const { StickerPackViewer } = require('im/messenger/controller/dialog/lib/sticker/src/pack-viewer');

	const logger = getLoggerWithContext('dialog--sticker', 'StickerManager');

	/**
	 * @class StickerManager
	 */
	class StickerManager
	{
		/**
		 * @return {MessengerCoreStore}
		 */
		get store()
		{
			return serviceLocator.get('core').getStore();
		}

		get view()
		{
			return this.dialogLocator.get('view');
		}

		/**
		 * @param {DialogLocator} dialogLocator
		 */
		constructor(dialogLocator)
		{
			/** @type {DialogLocator} */
			this.dialogLocator = dialogLocator;
		}

		subscribeViewEvents()
		{
			if (!Feature.isStickersEnabled)
			{
				return;
			}
			this.view.textField.on(EventType.dialog.textField.stickerButtonTap, this.stickerButtonTapHandler);
			this.view.on(EventType.dialog.messageTap, this.messageTapHandler);
		}

		stickerButtonTapHandler = () => {
			this.openSelector();
		};

		messageTapHandler = async (index, message) => {
			const messageId = message.id;

			const helper = MessageHelper.createById(messageId);
			if (!helper?.isSticker)
			{
				return;
			}

			const stickerData = helper.messageModel.stickerParams;

			try
			{
				const widget = await PageManager.openWidget('layout', {
					backdrop: {
						mediumPositionPercent: 50,
						horizontalSwipeAllowed: false,
						hideNavigationBar: true,
						swipeAllowed: false,
						swipeContentAllowed: false,
					},
				});

				widget.showComponent(new StickerPackViewer({
					dialogId: this.dialogLocator.get('dialogId'),
					dialogLocator: this.dialogLocator,
					packId: stickerData.packId,
					packType: stickerData.packType,
					close: () => {
						widget.close();
					},
				}));
			}
			catch (error)
			{
				logger.error('messageTapHandler error', error);
			}
		};

		async openSelector()
		{
			try
			{
				const widget = await PageManager.openWidget('layout', {
					backdrop: {
						mediumPositionPercent: 50,
						horizontalSwipeAllowed: false,
						onlyMediumPosition: true,
						hideNavigationBar: true,
						swipeAllowed: false,
						swipeContentAllowed: false,
					},
				});

				widget.showComponent(new StickerSelector({
					dialogId: this.dialogLocator.get('dialogId'),
					dialogLocator: this.dialogLocator,
					close: () => {
						widget.close();
					},
				}));
			}
			catch (error)
			{
				logger.error('openSelector error', error);
			}
		}
	}

	module.exports = { StickerManager };
});
