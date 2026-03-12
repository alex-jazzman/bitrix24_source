/**
 * @module im/messenger/controller/dialog/lib/sticker/src/dialogs
 */
jn.define('im/messenger/controller/dialog/lib/sticker/src/dialogs', (require, exports, module) => {
	const { Type } = require('type');
	const { Loc } = require('im/messenger/loc');
	const { createPromiseWithResolvers } = require('im/messenger/lib/utils');
	const { ButtonType, ConfirmNavigator } = require('alert');

	const { MAX_STICKER_PACK_SIZE } = require('im/messenger/controller/dialog/lib/sticker/src/const');

	/**
	 * @class StickerDialogs
	 */
	class StickerDialogs
	{
		/**
		 * @param {(data: {title: string, files: Array<DeviceFile>} | null) => void} onComplete
		 */
		createPack(onComplete)
		{
			this.#selectFiles({
				maxSelectedItems: MAX_STICKER_PACK_SIZE,
				onFilesSelected: async (files) => {
					const title = await this.#createTitle();
					if (Type.isNil(title))
					{
						onComplete(null);

						return;
					}
					onComplete({ title, files });
				},
			});
		}

		/**
		 * @param {number} maxSelectedItems
		 * @param {(data: {files: Array<DeviceFile>}) => void} onComplete
		 */
		createStickers(maxSelectedItems, onComplete)
		{
			this.#selectFiles({
				maxSelectedItems,
				onFilesSelected: (files) => {
					onComplete({ files });
				},
			});
		}

		async renamePack(previousTitle)
		{
			const title = await this.#renameTitle(previousTitle);
			if (Type.isNil(title))
			{
				return null;
			}

			return {
				title,
			};
		}

		closeCreationWidget(onClose)
		{
			const confirm = new ConfirmNavigator({
				title: Loc.getMessage('IMMOBILE_MESSENGER_DIALOG_STICKER_CLOSE_CREATE_CONFIRM_TITLE'),
				description: Loc.getMessage('IMMOBILE_MESSENGER_DIALOG_STICKER_CLOSE_CREATE_CONFIRM_DESCRIPTION'),
				buttons: [
					{
						text: Loc.getMessage('IMMOBILE_MESSENGER_DIALOG_STICKER_CONFIRM_CLOSE_BUTTON'),
						type: ButtonType.DESTRUCTIVE,
						onPress: onClose,
					},
					{
						text: Loc.getMessage('IMMOBILE_MESSENGER_DIALOG_STICKER_CONFIRM_CANCEL_BUTTON'),
						type: ButtonType.CANCEL,
						onPress: () => {},
					},
				],
			});

			confirm.open();
		}

		deletePack(onDelete)
		{
			const confirm = new ConfirmNavigator({
				title: Loc.getMessage('IMMOBILE_MESSENGER_DIALOG_STICKER_DELETE_PACK_CONFIRM_TITLE'),
				description: Loc.getMessage('IMMOBILE_MESSENGER_DIALOG_STICKER_DELETE_PACK_CONFIRM_DESCRIPTION'),
				buttons: [
					{
						text: Loc.getMessage('IMMOBILE_MESSENGER_DIALOG_STICKER_CONFIRM_DELETE_BUTTON'),
						type: ButtonType.DESTRUCTIVE,
						onPress: onDelete,
					},
					{
						text: Loc.getMessage('IMMOBILE_MESSENGER_DIALOG_STICKER_CONFIRM_CANCEL_BUTTON'),
						type: ButtonType.CANCEL,
						onPress: () => {},
					},
				],
			});

			confirm.open();
		}

		unlinkPack(onUnlink)
		{
			const confirm = new ConfirmNavigator({
				title: Loc.getMessage('IMMOBILE_MESSENGER_DIALOG_STICKER_UNLINK_PACK_CONFIRM_TITLE'),
				description: Loc.getMessage('IMMOBILE_MESSENGER_DIALOG_STICKER_UNLINK_PACK_CONFIRM_DESCRIPTION'),
				buttons: [
					{
						text: Loc.getMessage('IMMOBILE_MESSENGER_DIALOG_STICKER_CONFIRM_DELETE_BUTTON'),
						type: ButtonType.DESTRUCTIVE,
						onPress: onUnlink,
					},
					{
						text: Loc.getMessage('IMMOBILE_MESSENGER_DIALOG_STICKER_CONFIRM_CANCEL_BUTTON'),
						type: ButtonType.CANCEL,
						onPress: () => {},
					},
				],
			});

			confirm.open();
		}

		/**
		 * @return {Promise<string | null>}
		 */
		async #createTitle()
		{
			const { promise, resolve } = createPromiseWithResolvers();

			const buttons = [
				{
					type: ButtonType.DEFAULT,
					text: Loc.getMessage('IMMOBILE_MESSENGER_DIALOG_STICKER_PROMPT_CANCEL_BUTTON'),
				},
				{
					type: ButtonType.DEFAULT,
					text: Loc.getMessage('IMMOBILE_MESSENGER_DIALOG_STICKER_PROMPT_CONTINUE_BUTTON'),
				},
			];

			navigator.notification.prompt(
				Loc.getMessage('IMMOBILE_MESSENGER_DIALOG_STICKER_PROMPT_DESCRIPTION'),
				({ input1: input, buttonIndex }) => {
					resolve(buttonIndex === 2 ? input ?? '' : null);
				},
				Loc.getMessage('IMMOBILE_MESSENGER_DIALOG_STICKER_PROMPT_TITLE'),
				buttons,
			);

			return promise;
		}

		async #renameTitle(previousTitle)
		{
			const { promise, resolve } = createPromiseWithResolvers();

			const buttons = [
				{
					type: ButtonType.CANCEL,
					text: Loc.getMessage('IMMOBILE_MESSENGER_DIALOG_STICKER_PROMPT_CANCEL_BUTTON'),
				},
				{
					type: ButtonType.DEFAULT,
					text: Loc.getMessage('IMMOBILE_MESSENGER_DIALOG_STICKER_PROMPT_RENAME_BUTTON'),
				},
			];

			navigator.notification.prompt(
				'',
				({ input1: input, buttonIndex }) => {
					if (buttonIndex !== 2 || input === previousTitle)
					{
						resolve(null);
					}

					resolve(input ?? '');
				},
				Loc.getMessage('IMMOBILE_MESSENGER_DIALOG_STICKER_PROMPT_RENAME_TITLE'),
				buttons,
				previousTitle,
			);

			return promise;
		}

		/**
		 * @param {(files: Array<DeviceFile>) => void} onFilesSelected
		 * @param {number} maxSelectedItems
		 */
		#selectFiles({ onFilesSelected, maxSelectedItems = 10 })
		{
			const items = [
				{ id: 'mediateka' },
				{ id: 'camera' },
			];

			const settings = {
				resize: {
					targetWidth: 512,
					targetHeight: 512,
					sourceType: 1,
					encodingType: 1,
					mediaType: 0,
					allowsEdit: true,
					saveToPhotoAlbum: 0,
					cameraDirection: 0,
					quality: 100,
				},
				maxAttachedFilesCount: maxSelectedItems,
				previewMaxWidth: 512,
				previewMaxHeight: 512,
				attachButton: { items },
				destinationType: 0,
			};

			dialogs.showImagePicker({ settings }, onFilesSelected, () => {});
		}
	}

	module.exports = { StickerDialogs };
});
