/**
 * @module im/messenger/application/lib/dialog-manager/manager
 */
jn.define('im/messenger/application/lib/dialog-manager/manager', (require, exports, module) => {
	const { Type } = require('type');
	const {
		DialogType,
		ErrorType,
	} = require('im/messenger/const');
	const { DialogHelper } = require('im/messenger/lib/helper');
	const { VisibilityManager } = require('im/messenger/lib/visibility-manager');
	const { createOpenTaskCommentsOptions } = require('im/messenger/lib/integration/tasksmobile/comments/opener');
	const {
		Notification,
		ToastType,
	} = require('im/messenger/lib/ui/notification');
	const { DialogManagerService } = require('im/messenger/application/lib/dialog-manager/service');
	const { normalizeOpenDialogOptions } = require('im/messenger/application/lib/dialog-manager/normalizer');
	const {
		createDialogByChatType,
		createDialogByModel,
	} = require('im/messenger/application/lib/dialog-manager/resolver');
	const { getLoggerWithContext } = require('im/messenger/lib/logger');

	/**
	 * @class DialogManager
	 */
	class DialogManager
	{
		static #instance;
		/** @type {Array<Dialog>} */
		#dialogList = [];

		/**
		 * @return {DialogManager}
		 */
		static getInstance()
		{
			if (!this.#instance)
			{
				this.#instance = new this();
			}

			return this.#instance;
		}

		constructor()
		{
			this.logger = getLoggerWithContext('messenger--dialog-manager', this);
		}

		/**
		 * @return {Dialog|null}
		 */
		getFirstOpenDialog()
		{
			return this.getOpenDialogByIndex(0);
		}

		/**
		 * @return {Dialog|null}
		 */
		getLastOpenDialog()
		{
			return this.getOpenDialogByIndex(this.#dialogList.length - 1);
		}

		/**
		 * @return {Dialog|null}
		 */
		getOpenDialogByIndex(index)
		{
			return (Type.isArrayFilled(this.#dialogList) && this.#dialogList[index]) ? this.#dialogList[index] : null;
		}

		/**
		 * @param {DialogOpenOptions} options
		 * @param {PageManager} parentWidget
		 * @return {Promise<boolean>}
		 */
		async openDialog(options, parentWidget = PageManager)
		{
			let normalizedOptions = normalizeOpenDialogOptions(options);
			const dialogId = normalizedOptions.dialogId;
			if (!Type.isStringFilled(dialogId))
			{
				return false;
			}

			const isVisible = await VisibilityManager.getInstance().checkIsDialogVisible({
				dialogId,
				currentContextOnly: true,
			});

			if (isVisible)
			{
				return false;
			}

			if (normalizedOptions.makeTabActive)
			{
				PageManager.getNavigator().makeTabActive();
			}

			let dialog = await createDialogByChatType(normalizedOptions.chatType);
			this.logger.log('openDialog: dialog by chatType', dialog);
			if (!dialog)
			{
				const dialogManagerService = DialogManagerService.getInstance();
				let dialogModel;
				try
				{
					dialogModel = await dialogManagerService.getDialogByDialogId(dialogId);
				}
				catch (error)
				{
					DialogManager.showToastByOpenDialogError(error);

					return false;
				}

				if (!Type.isPlainObject(dialogModel))
				{
					return false;
				}

				dialog = await createDialogByModel(dialogModel);

				// TODO: MessengerV2 generalize the processing of chat integrations
				if (
					!Type.isPlainObject(options.integrationSettings)
					&& dialogModel.type === DialogType.tasksTask
					&& Type.isStringFilled(dialogModel.entityId)
				)
				{
					normalizedOptions = {
						...normalizedOptions,
						...createOpenTaskCommentsOptions(
							dialogModel.chatId,
							Number(dialogModel.entityId),
							normalizedOptions.messageId,
						),
					};
				}

				this.logger.log('openDialog: dialog by model', dialog);
			}

			this.#dialogList.push(dialog);

			const originalCloseHandler = normalizedOptions.onClose;
			normalizedOptions.onClose = () => {
				this.#dialogList = this.#dialogList.filter((openDialog) => openDialog !== dialog);
				originalCloseHandler();
			};

			this.logger.log('openDialog: options: ', normalizedOptions);

			const dialogHelper = DialogHelper.createByDialogId(dialogId);
			if (dialogHelper?.isOpenlines)
			{
				const openLineOptions = {
					dialogId,
					dialogTitleParams: {
						chatType: DialogType.lines,
					},
				};

				dialog.openLine(openLineOptions);

				return true;
			}

			await dialog.open(normalizedOptions, parentWidget);

			return true;
		}

		static showToastByOpenDialogError(error)
		{
			const errorCode = error[0]?.code;
			switch (errorCode)
			{
				case ErrorType.dialog.accessDenied:
					Notification.showToast(ToastType.chatAccessDenied);
					break;

				case ErrorType.dialog.chatNotFound:
					Notification.showToast(ToastType.chatAccessDenied);
					break;

				case ErrorType.networkError:
					Notification.showOfflineToast();
					break;

				default:
					break;
			}
		}
	}

	module.exports = {
		DialogManager,
	};
});
