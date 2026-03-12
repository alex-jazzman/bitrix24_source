/**
 * @module im/messenger/controller/dialog/lib/sticker/src/manager
 */
jn.define('im/messenger/controller/dialog/lib/sticker/src/manager', (require, exports, module) => {
	const { EventType, ActionByUserType } = require('im/messenger/const');
	const { MessageHelper } = require('im/messenger/lib/helper');
	const { serviceLocator } = require('im/messenger/lib/di/service-locator');
	const { getLoggerWithContext } = require('im/messenger/lib/logger');
	const { Feature } = require('im/messenger/lib/feature');
	const { UserPermission } = require('im/messenger/lib/permission-manager');
	const { StickerEventType } = require('im/messenger/controller/dialog/lib/sticker/src/const');
	const { StickerSelector } = require('im/messenger/controller/dialog/lib/sticker/src/widget/selector');
	const { StickerPackViewer } = require('im/messenger/controller/dialog/lib/sticker/src/widget/pack-viewer');
	const { StickerPackCreator } = require('im/messenger/controller/dialog/lib/sticker/src/widget/creator');
	const { StickerPackEditor } = require('im/messenger/controller/dialog/lib/sticker/src/widget/editor');
	const { StickerService } = require('im/messenger/controller/dialog/lib/sticker/src/service/service');
	const { emitter } = require('im/messenger/controller/dialog/lib/sticker/src/utils/emitter');

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

			this.service = new StickerService({ dialogLocator });
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
			await this.#clearStoreIfNeeded();

			try
			{
				const widget = await PageManager.openWidget('layout', {
					backdrop: {
						mediumPositionPercent: 50,
						horizontalSwipeAllowed: false,
						onlyMediumPosition: true,
						hideNavigationBar: true,
						swipeAllowed: true,
						swipeContentAllowed: true,
					},
				});

				widget.showComponent(new StickerPackViewer({
					dialogId: this.dialogLocator.get('dialogId'),
					dialogLocator: this.dialogLocator,
					packId: stickerData.packId,
					packType: stickerData.packType,
					canEditPack: this.#canEditPack(),
					close: () => {
						this.#clearStoreIfNeeded();
						widget.close();
					},
					onEdit: (packId, packType) => {
						this.#openEditor(widget, packId, packType);
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
			await this.#clearStoreIfNeeded();
			const widget = await PageManager.openWidget('layout', {
				backdrop: {
					mediumPositionPercent: 50,
					horizontalSwipeAllowed: false,
					onlyMediumPosition: true,
					hideNavigationBar: true,
					swipeAllowed: true,
					swipeContentAllowed: true,
				},
			});

			widget.showComponent(new StickerSelector({
				dialogId: this.dialogLocator.get('dialogId'),
				dialogLocator: this.dialogLocator,
				canEditPack: this.#canEditPack(),
				canCreatePack: this.#canCreatePack(),
				close: () => {
					this.#clearStoreIfNeeded();
					widget.close();
				},
				onCreate: (creationParams) => {
					this.#openCreator(widget, creationParams);
				},
				onEdit: (packId, packType) => {
					this.#openEditor(widget, packId, packType);
				},
			}));
		}

		/**
		 * @param {LayoutWidget} widget
		 * @param {{title: string, files: Array<DeviceFile>}} creationParams
		 */
		#openCreator(widget, creationParams)
		{
			widget.openWidget('layout', {
				backdrop: {
					mediumPositionPercent: 60,
					horizontalSwipeAllowed: false,
					hideNavigationBar: true,
					swipeAllowed: false,
					swipeContentAllowed: false,
				},
			}).then((creationWidget) => {
				creationWidget.preventBottomSheetDismiss(true);
				creationWidget.on(EventType.view.preventDismiss, () => {
					emitter.emit(StickerEventType.widget.preventDismiss, []);
				});
				creationWidget.showComponent(new StickerPackCreator({
					title: creationParams.title,
					files: creationParams.files,
					dialogLocator: this.dialogLocator,
					onClose: () => {
						creationWidget.close();
					},
				}));
			})
				.catch((error) => {
					logger.error('onCreate error', error);
				});
		}

		/**
		 * @param {LayoutWidget} widget
		 * @param {StickerPackId} packId
		 * @param {StickerPackType} packType
		 */
		#openEditor(widget, packId, packType)
		{
			const pack = this.service.getPack(packId, packType);
			const stickers = this.service.getPackStickers(packId, packType);

			widget.openWidget('layout', {
				backdrop: {
					mediumPositionPercent: 60,
					horizontalSwipeAllowed: false,
					hideNavigationBar: true,
					swipeAllowed: false,
					swipeContentAllowed: false,
				},
			}).then((creationWidget) => {
				creationWidget.preventBottomSheetDismiss(true);
				creationWidget.on(EventType.view.preventDismiss, () => {
					emitter.emit(StickerEventType.widget.preventDismiss, []);
				});
				creationWidget.showComponent(new StickerPackEditor({
					pack,
					stickers,
					dialogLocator: this.dialogLocator,
					onClose: () => {
						creationWidget.close();
					},
				}));
			})
				.catch((error) => {
					logger.error('onCreate error', error);
				});
		}

		async #clearStoreIfNeeded()
		{
			if (this.store.getters['stickerPackModel/shouldClearState']())
			{
				await this.store.dispatch('stickerPackModel/clearCurrentState');
			}
		}

		#canEditPack()
		{
			return UserPermission.canPerformActionByUserType(
				ActionByUserType.changeStickerPack,
				this.store.getters['usersModel/getCurrent'](),
			);
		}

		#canCreatePack()
		{
			return UserPermission.canPerformActionByUserType(
				ActionByUserType.createStickerPack,
				this.store.getters['usersModel/getCurrent'](),
			);
		}
	}

	module.exports = { StickerManager };
});
