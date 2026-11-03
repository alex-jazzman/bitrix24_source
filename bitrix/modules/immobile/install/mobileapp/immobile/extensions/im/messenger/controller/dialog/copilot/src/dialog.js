/* eslint-disable es/no-nullish-coalescing-operators */

/**
 * @module im/messenger/controller/dialog/copilot/dialog
 */
jn.define('im/messenger/controller/dialog/copilot/dialog', (require, exports, module) => {
	/* global include, MediaConverter */
	include('MediaConverter');

	const { Type } = require('type');
	const { Uuid } = require('utils/uuid');
	const { Color } = require('tokens');
	const { Filesystem } = require('native/filesystem');

	const {
		BotCode,
		DialogWidgetType,
		OpenDialogContextType,
		AttachPickerId,
		AttachFileStatus,
	} = require('im/messenger/const');
	const { MessageService } = require('im/messenger/provider/services/message');
	const { AnalyticsService } = require('im/messenger/provider/services/analytics');

	const { Feature } = require('im/messenger/lib/feature');
	const { getLogger } = require('im/messenger/lib/logger');
	const { MessengerParams } = require('im/messenger/lib/params');
	const { Notification } = require('im/messenger/lib/ui/notification');
	const {
		selectAttachFiles,
		getFileName,
		getFileSize,
		isDeviceFile,
		matchFormat,
		getEffectivePolicy,
		isPhotoCaptureAllowed,
		isVideoCaptureAllowed,
		getAttachPickerHint,
		getPickerErrorMessages,
		getAttachSelectionNotification,
	} = require('im/messenger/lib/copilot/file-validator');

	const { ChatTitle } = require('im/messenger/lib/element/chat-title');
	const { MessageUiConverter } = require('im/messenger/lib/converter/ui/message');

	const { Dialog } = require('im/messenger/controller/dialog/chat');
	const { DialogConfigurator, configs } = require('im/messenger/controller/dialog/lib/configurator');

	const { BackgroundManager } = require('im/messenger/controller/dialog/lib/background');
	const { CopilotMentionManager } = require('im/messenger/controller/dialog/copilot/component/mention/manager');

	const logger = getLogger('dialog--dialog');

	const FILE_METADATA_TIMEOUT = 30000;

	/**
	 * @class CopilotDialog
	 */
	class CopilotDialog extends Dialog
	{
		getDialogWidgetType()
		{
			return DialogWidgetType.copilot;
		}

		checkCanHaveAttachments()
		{
			return Feature.isAttachPickerForBitrixGPTAvailable;
		}

		/**
		 * @returns {Array<string>}
		 */
		visibleAttachItems()
		{
			return [AttachPickerId.disk];
		}

		/**
		 * @override
		 * @return {?AttachPickerRestrictions}
		 */
		getAttachPickerRestrictions()
		{
			const policy = MessengerParams.getCopilotFileUploadPolicy();
			if (!Type.isPlainObject(policy))
			{
				return null;
			}

			const effectivePolicy = getEffectivePolicy(policy);

			return {
				maxAttachedFilesCount: policy.maxFilesPerMessage,
				fileRestrictions: {
					hint: getAttachPickerHint(policy),
					allowedExtensions: effectivePolicy.allowedExtensions,
					maxFileSize: policy.maxFileSize,
					allowPhotoCapture: isPhotoCaptureAllowed(policy.allowedExtensions),
					allowVideoCapture: isVideoCaptureAllowed(policy.allowedExtensions),
					errorMessages: getPickerErrorMessages(policy),
				},
				diskFileFilter: {
					allowedExtensions: policy.allowedExtensions,
					maxFileSize: policy.maxFileSize,
				},
			};
		}

		/**
		 * @override
		 * @private
		 */
		attachTapHandler()
		{
			const policy = MessengerParams.getCopilotFileUploadPolicy();
			if (!Type.isPlainObject(policy))
			{
				super.attachTapHandler();

				return;
			}

			const selectedFilesHandler = (fileList) => {
				void this.handleCopilotSelectedFiles(fileList, policy);
			};

			this.view.showAttachPicker(selectedFilesHandler);
		}

		/**
		 * @private
		 * @desc Files are filtered by format and size before the first maxFilesPerMessage of them
		 * are attached, so unsupported files never occupy attach slots. The attach panel therefore
		 * appears only after device-file sizes are read (usually instant; an iCloud file can delay
		 * it up to the 30s metadata timeout). If the delay ever becomes noticeable, fall back to
		 * showing the panel immediately with "checking" statuses and replacing the set afterwards.
		 * @param {Array<AttachFile>} fileList
		 * @param {CopilotFileUploadPolicy} policy
		 * @return {Promise<void>}
		 */
		async handleCopilotSelectedFiles(fileList, policy)
		{
			const attachPolicy = getEffectivePolicy(policy);

			const sizes = await this.readAttachFileSizes(fileList, attachPolicy);

			// The size read can take up to the 30s metadata timeout (iCloud);
			// the dialog may have been closed meanwhile.
			if (!this.store.getters['applicationModel/isDialogOpen'](this.dialogId))
			{
				return;
			}

			const selection = selectAttachFiles(fileList, sizes, attachPolicy);

			this.showAttachSelectionNotification(selection, policy);

			if (!Type.isArrayFilled(selection.selected))
			{
				return;
			}

			this.replyManager.startAttachingFiles(selection.selected);

			selection.selected.forEach((file) => {
				this.replyManager.setAttachFileStatus(file, AttachFileStatus.valid);
			});
		}

		/**
		 * @private
		 * @desc Resolves sizes for the selected files before selection: disk-file sizes come from
		 * dataAttributes, device-file sizes are read from the filesystem (only for files passing
		 * the format check, to avoid useless reads). Null means the size is unknown: a read
		 * failure for a device file, a legitimate absence for a disk file.
		 * @param {Array<AttachFile>} fileList
		 * @param {CopilotFileUploadPolicy} policy
		 * @return {Promise<Array<?number>>}
		 */
		async readAttachFileSizes(fileList, policy)
		{
			return Promise.all(fileList.map(async (file) => {
				const knownSize = getFileSize(file);
				if (Type.isNumber(knownSize))
				{
					return knownSize;
				}

				if (!isDeviceFile(file) || !matchFormat(file, policy.allowedExtensions))
				{
					return null;
				}

				try
				{
					return await this.readDeviceFileSize(file.url);
				}
				catch (error)
				{
					logger.error(`${this.constructor.name}.readAttachFileSizes error:`, error);

					return null;
				}
			}));
		}

		/**
		 * @private
		 * @desc Reads a device file size for validation. iCloud urls are converted first (same as
		 * upload-manager) to avoid a blocking iCloud fetch on the raw url, and the whole read is
		 * guarded by a timeout so the promise always settles and the attach status never stays in
		 * "checking".
		 * @param {string} url
		 * @return {Promise<?number>}
		 */
		async readDeviceFileSize(url)
		{
			let timer = null;
			try
			{
				const fileInfo = await Promise.race([
					this.resolveDeviceFileInfo(url),
					new Promise((resolve, reject) => {
						timer = setTimeout(
							() => reject(new Error('device file metadata timeout')),
							FILE_METADATA_TIMEOUT,
						);
					}),
				]);

				return fileInfo?.size ?? null;
			}
			finally
			{
				if (timer)
				{
					clearTimeout(timer);
				}
			}
		}

		/**
		 * @private
		 * @param {string} url
		 * @return {Promise<JNFile>}
		 */
		async resolveDeviceFileInfo(url)
		{
			let fileUrl = url;
			const isiCloudFile = url.startsWith('icloudvideo://') || url.startsWith('icloudimage://');
			if (
				Application.getPlatform() === 'ios'
				&& isiCloudFile
				&& Type.isFunction(MediaConverter.getUrliCloudFile)
			)
			{
				const iCloudFile = await MediaConverter.getUrliCloudFile(url);
				fileUrl = iCloudFile?.url ?? url;
			}

			return Filesystem.getFile(fileUrl);
		}

		/**
		 * @private
		 * @desc Shows one in-app notification for the first selection violation by priority.
		 * The picker restrictions make an invalid pick an edge case, so a single notification
		 * is enough even when several violations are present.
		 * @param {AttachFileSelectionResult} selection
		 * @param {CopilotFileUploadPolicy} policy
		 */
		showAttachSelectionNotification(selection, policy)
		{
			const notification = getAttachSelectionNotification(selection, policy);
			if (!notification)
			{
				return;
			}

			const params = {
				title: notification.title,
				backgroundColor: Color.accentMainWarningSolid.toHex(),
				time: 3,
			};

			if (Type.isStringFilled(notification.text))
			{
				params.message = notification.text;
			}

			Notification.showNotifier(params);
		}

		/**
		 * @returns {boolean}
		 */
		checkCanRecordVideo() {
			return false;
		}

		/**
		 * @returns {boolean}
		 */
		checkNeedKeyboardOverContent()
		{
			return Feature.isCopilotAnimatedScrollSupported;
		}

		/**
		 * @returns {boolean}
		 */
		checkCanShowStickerButton()
		{
			return false;
		}

		subscribeViewEvents()
		{
			super.subscribeViewEvents();
			this.disableParentClassViewEvents();
		}

		disableParentClassViewEvents()
		{}

		subscribeStoreEvents()
		{
			super.subscribeStoreEvents();
			this.subscribeCopilotStoreEvents();
		}

		subscribeCopilotStoreEvents()
		{
			this.storeManager
				.on('dialoguesModel/copilotModel/update', this.dialogUpdateHandlerRouter)
				.on('dialoguesModel/copilotModel/updateCollection', this.copilotCollectionUpdateHandler)
				.on('dialoguesModel/copilotModel/addCollection', this.copilotCollectionUpdateHandler)
			;
		}

		unsubscribeStoreEvents()
		{
			super.unsubscribeStoreEvents();
			this.unsubscribeCopilotStoreEvents();
		}

		unsubscribeCopilotStoreEvents()
		{
			this.storeManager
				.off('dialoguesModel/copilotModel/update', this.dialogUpdateHandlerRouter)
				.off('dialoguesModel/copilotModel/updateCollection', this.copilotCollectionUpdateHandler)
				.off('dialoguesModel/copilotModel/addCollection', this.copilotCollectionUpdateHandler)
			;
		}

		bindMethods()
		{
			super.bindMethods();
			/** @private */
			this.copilotCollectionUpdateHandler = this.copilotCollectionUpdateHandler.bind(this);
		}

		/**
		 * @desc setCollection commits addCollection/updateCollection mutations, not update,
		 * so the header title must be redrawn here as well (e.g. after loadChatWithMessages).
		 * @param {object} mutation
		 * @param {MutationPayload<CopilotUpdateCollectionData|CopilotAddCollectionData, CopilotUpdateActions|CopilotAddActions>} mutation.payload
		 */
		copilotCollectionUpdateHandler(mutation)
		{
			const { updateItems = [], addItems = [] } = mutation.payload.data;
			const currentDialogId = String(this.getDialogId());
			const hasCurrentDialogChanges = [...updateItems, ...addItems]
				.some((item) => String(item.dialogId) === currentDialogId)
			;

			if (!hasCurrentDialogChanges)
			{
				return;
			}

			void this.headerTitle.renderTitle();
		}

		/**
		 * @param {?ChatIntegrationSettings} integrationSettings
		 */
		initConfigurator(integrationSettings)
		{
			this.configurator = new DialogConfigurator({ ...configs?.copilotDialogConfig, ...integrationSettings });
			this.locator.add('configurator', this.configurator);
		}

		async initManagers()
		{
			await super.initManagers();
		}

		initMentionManager()
		{
			const dialogModelState = this.store.getters['dialoguesModel/getById'](this.dialogId);
			const hasMoreThanTwoUsers = dialogModelState?.userCounter > 2;
			if (hasMoreThanTwoUsers || Feature.isBitrixGptV2Available)
			{
				this.mentionManager = new CopilotMentionManager({
					view: this.view,
					dialogId: this.dialogId,
				});
			}
		}

		async open(options, parentWidget = PageManager, openPerfPoint = null)
		{
			const {
				dialogId,
				messageId,
				withMessageHighlight,
				dialogTitleParams,
				forwardMessageIds,
				integrationSettings,
				onClose = () => {},
			} = options;

			this.openPerfPoint = openPerfPoint;

			this.onClose = onClose;
			this.initConfigurator(integrationSettings);
			this.headerTitleControllerClassLoadPromise = this.configurator.getHeaderTitleControllerClass();
			this.headerButtonsControllerClassLoadPromise = this.configurator.getHeaderButtonsControllerClass();

			this.dialogId = dialogId;
			this.dialogCode = `im.dialog-${this.getDialogId()}-${Uuid.getV4()}`;
			this.locator.add('dialogId', this.dialogId);
			this.messageUiConverter = new MessageUiConverter({ dialogId, dialogCode: this.dialogCode });
			this.locator.add('message-ui-converter', this.messageUiConverter);
			this.contextMessageId = messageId ?? null;
			this.withMessageHighlight = withMessageHighlight ?? false;
			void this.store.dispatch('applicationModel/openDialogId', dialogId);

			// read by the inherited initManagers() to start the forward flow in the text field
			if (forwardMessageIds)
			{
				this.forwardMessageIds = forwardMessageIds;
			}

			this.openPerfPoint?.startPoint('load-messages-from-db');
			const hasDialog = await this.loadDialogFromDb();
			if (hasDialog)
			{
				this.messageService = new MessageService({
					store: this.store,
					chatId: this.getChatId(),
					dialogId: this.getDialogId(),
				});
			}

			this.backgroundManager = new BackgroundManager({
				dialogId: this.dialogId,
				dialogLocator: this.locator,
			});

			this.firstDbPagePromise = this.loadHistoryMessagesFromDb();
			this.openPerfPoint?.endPoint('load-messages-from-db');

			let titleParams = null;
			if (dialogTitleParams)
			{
				titleParams = {
					text: dialogTitleParams.name,
					detailText: dialogTitleParams.description,
					imageUrl: dialogTitleParams.avatar,
					useLetterImage: true,
				};

				if (!dialogTitleParams.avatar || dialogTitleParams.avatar === '')
				{
					titleParams.imageColor = dialogTitleParams.color;
				}
			}

			this.openPerfPoint?.startPoint('create-widget');
			await this.createWidget(titleParams)
				.catch((error) => {
					logger.error(`${this.constructor.name}.createWidget error:`, error);
				})
			;
			this.openPerfPoint?.endPoint('create-widget');
		}

		/**
		 * @override
		 * @return {DialogHeaderTitleParams}
		 */
		getOptimisticTitleParams()
		{
			return ChatTitle.createOptimisticCopilotTitleParams();
		}


		/**
		 *
		 * @param index
		 * @param {Message} message
		 */
		messageAvatarLongTapHandler(index, message)
		{
			const messageModel = this.store.getters['messagesModel/getById'](message.id);
			const dialogModel = this.store.getters['usersModel/getById'](messageModel.authorId);

			if (dialogModel.botData?.code === BotCode.copilot)
			{
				return;
			}

			super.messageAvatarLongTapHandler(index, message);
		}

		/**
		 * @override
		 * @param {Object} mutation
		 * @void
		 */
		checkAvailableMention(mutation)
		{
			if (!mutation.type.includes('dialoguesModel'))
			{
				return;
			}

			// eslint-disable-next-line es/no-optional-chaining
			if (mutation.payload.data?.fields?.userCounter > 2)
			{
				this.mentionManager ??= new CopilotMentionManager({
					view: this.view,
					dialogId: this.dialogId,
				});
				this.view.setKeyboardOverContent(true);
			}
			else
			{
				if (!Feature.isBitrixGptV2Available)
				{
					this.mentionManager?.unsubscribeEvents();
					this.mentionManager = null;
				}

				this.view.setKeyboardOverContent(false);
			}
		}

		sendAnalyticsOpenDialog()
		{
			super.sendAnalyticsOpenDialog();
			if (this.openingContext === OpenDialogContextType.chatCreation)
			{
				return;
			}

			AnalyticsService.getInstance().sendOpenCopilotDialog({
				dialogId: this.dialogId,
				context: this.openingContext,
				modesState: this.locator.get('assistant-button-manager')?.getSettingsSnapshot() ?? null,
			});
		}
	}

	module.exports = { CopilotDialog };
});
