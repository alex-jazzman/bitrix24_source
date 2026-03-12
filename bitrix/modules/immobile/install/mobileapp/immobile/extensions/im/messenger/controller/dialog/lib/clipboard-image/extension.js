/**
 * @module im/messenger/controller/dialog/lib/clipboard-image
 */
jn.define('im/messenger/controller/dialog/lib/clipboard-image', (require, exports, module) => {
	const { Type } = require('type');
	const { Uuid } = require('utils/uuid');
	const { confirmDestructiveAction } = require('alert');

	const { Loc } = require('im/messenger/loc');
	const { EventType } = require('im/messenger/const');
	const { DialogHelper } = require('im/messenger/lib/helper');
	const { serviceLocator } = require('im/messenger/lib/di/service-locator');
	const { getLoggerWithContext } = require('im/messenger/lib/logger');
	const {
		DateSeparatorMessage,
		ImageMessage,
		MediaGalleryMessage,
	} = require('im/messenger/lib/element/dialog');

	const logger = getLoggerWithContext('dialog--clipboard-image', 'ClipboardImageManager');

	/**
	 * @class ClipboardImageManager
	 */
	class ClipboardImageManager
	{
		/** @type {LayoutWidget} */
		#widget;

		/** @type {ClipboardImages} */
		#images;

		/**
		 * @private
		 * @return {MessengerCoreStore}
		 */
		get store()
		{
			return serviceLocator.get('core').getStore();
		}

		/**
		 * @private
		 * @return {Dialog|null}
		 */
		get dialog()
		{
			return serviceLocator.get('dialog-manager')?.getLastOpenDialog() ?? null;
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
		 * @private
		 * @return {ReplyManager}
		 */
		get replyManager()
		{
			return this.dialogLocator.get('reply-manager');
		}

		/**
		 * @private
		 * @return {DraftManager}
		 */
		get draftManager()
		{
			return this.dialogLocator.get('draft-manager');
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
			this.view.on(EventType.dialog.clipboardMediaSend, this.#clipboardMediaSendHandler);
		}

		unsubscribeViewEvents()
		{
			this.view.off(EventType.dialog.clipboardMediaSend, this.#clipboardMediaSendHandler);
		}

		/**
		 * @param {ClipboardImages} items
		 * @return {Promise<void>}
		 */
		#clipboardMediaSendHandler = async ({ items }) => {
			if (!this.#canClipboardMediaSend())
			{
				return;
			}

			const images = items.filter((item) => item.type.includes('image/'));
			if (!Type.isArrayFilled(images))
			{
				return;
			}

			await this.#openWidget(images);
		};

		/**
		 * @param {ClipboardImages} images
		 * @returns {Promise<void>}
		 */
		async #openWidget(images)
		{
			try
			{
				this.#images = images;

				const widgetParams = this.#getWidgetParams();
				this.#widget = await PageManager.openWidget(
					'chat.dialog',
					widgetParams,
				);

				this.#widgetReadyHandler();
			}
			catch (error)
			{
				logger.error('#openWidget error: ', error);
			}
		}

		#subscribeWidgetEvents()
		{
			this.#widget.textField.on(EventType.dialog.textField.submit, this.#textFieldSubmitHandler);
			this.#widget.on(EventType.view.preventDismiss, this.#widgetPreventDismissHandler);
			this.#widget.on(EventType.view.removed, this.#widgetRemovedHandler);
		}

		#textFieldSubmitHandler = () => {
			const text = this.#widget.textField.getText();
			this.#sendFiles(this.#images, text);

			const { isEditInProcess } = this.replyManager;
			if (!isEditInProcess)
			{
				this.view.clearInput();
				this.draftManager.clearDraft(this.dialog.getDialogId());
			}

			this.#widget.close();
		};

		#widgetPreventDismissHandler = () => {
			this.#showConfirm();
		};

		#widgetRemovedHandler = () => {
			this.#images = null;
			this.#widget = null;
		};

		#widgetReadyHandler = () => {
			this.#widget.textField.setPlaceholder(Loc.getMessage('IMMOBILE_DIALOG_CLIPBOARD_IMAGE_PREVIEW_INPUT_PLACEHOLDER'));
			this.#widget.textField.enableAlwaysSendButtonMode(true);
			this.#widget.preventBottomSheetDismiss(true);

			const { isEditInProcess } = this.replyManager;
			const currentInputText = this.view.getInput();
			if (Type.isStringFilled(currentInputText) && !isEditInProcess)
			{
				this.#widget.textField.setText(currentInputText);
			}

			this.#subscribeWidgetEvents();

			const messages = [
				this.#createPreviewImagesMessage(this.#images),
				this.#createPreviewTextMessage(),
			];
			this.#widget.setMessages(messages);
		};

		/**
		 * @return {BaseDialogWidgetItem}
		 */
		#createPreviewTextMessage()
		{
			const previewMessage = new DateSeparatorMessage('preview', new Date());
			previewMessage.message = [{
				type: 'text',
				text: Loc.getMessage('IMMOBILE_DIALOG_CLIPBOARD_IMAGE_PREVIEW_MESSAGE_CAPTION'),
			}];

			return previewMessage.toDialogWidgetItem();
		}

		/**
		 * @param {ClipboardImages} images
		 * @returns {ImageDialogWidgetItem | MediaGalleryDialogWidgetItem | null}
		 */
		#createPreviewImagesMessage(images)
		{
			if (!Type.isArrayFilled(images))
			{
				logger.error('#createPreviewImagesMessage error: images is not array or empty');

				return null;
			}

			const fallbackMessageModel = { text: '', id: 0 };
			let imagesPreviewMessage = {};

			if (images.length > 1)
			{
				imagesPreviewMessage = new MediaGalleryMessage(fallbackMessageModel);
				imagesPreviewMessage.mediaList = images.map((image) => this.#prepareImageProps(image));
			}
			else
			{
				imagesPreviewMessage = new ImageMessage(fallbackMessageModel);
				imagesPreviewMessage.image = this.#prepareImageProps(images[0]);
			}

			imagesPreviewMessage.align = 'center';
			delete imagesPreviewMessage.status;
			delete imagesPreviewMessage.time;

			return {
				...imagesPreviewMessage.toDialogWidgetItem(),
				me: true,
			};
		}

		#canClipboardMediaSend()
		{
			const dialogHelper = DialogHelper.createByDialogId(this.dialog.getDialogId());

			return !dialogHelper.isCopilot && !dialogHelper.isAiAssistant;
		}

		/**
		 * @returns {object}
		 */
		#getWidgetParams()
		{
			return {
				dialogType: this.dialog.getDialogType(),
				backdrop: {
					swipeAllowed: true,
					swipeContentAllowed: false,
					mediumPositionPercent: 70,
					adoptHeightByKeyboard: true,
				},
				titleParams: {
					text: Loc.getMessage('IMMOBILE_DIALOG_CLIPBOARD_IMAGE_PREVIEW_TITLE'),
					type: 'dialog',
				},
				canHaveAttachments: false,
				canRecordAudio: false,
				canRecordVideo: false,
			};
		}

		/**
		 * @param {ClipboardImage} image
		 * @returns {object}
		 */
		#prepareImageProps(image) {
			return {
				id: Uuid.getV4(),
				type: 'image',
				url: image.url,
				previewParams: {
					height: image.previewHeight,
					width: image.previewWidth,
				},
			};
		}

		/**
		 * @param {ClipboardImages} files
		 * @param {string} text
		 */
		#sendFiles(files = [], text = '')
		{
			if (Type.isNull(this.dialog))
			{
				return;
			}

			logger.log('#sendFiles: ', files);

			void this.dialog.sendingService.sendFiles(this.dialog.dialogId, files, text);
		}

		#showConfirm()
		{
			confirmDestructiveAction({
				title: Loc.getMessage('IMMOBILE_DIALOG_CLIPBOARD_IMAGE_PREVIEW_CONFIRM_TITLE'),
				destructionText: Loc.getMessage('IMMOBILE_DIALOG_CLIPBOARD_IMAGE_PREVIEW_CONFIRM_DESTRUCTION_TEXT'),
				onDestruct: () => this.#widget.close(),
			});
		}
	}

	module.exports = { ClipboardImageManager };
});
