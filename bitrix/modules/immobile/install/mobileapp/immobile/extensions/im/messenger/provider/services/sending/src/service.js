/**
 * @module im/messenger/provider/services/sending/service
 */
jn.define('im/messenger/provider/services/sending/service', (require, exports, module) => {
	const { Type } = require('type');
	const { Uuid } = require('utils/uuid');
	const { clone } = require('utils/object');

	const {
		EventType,
		SubTitleIconType,
		ErrorCode,
	} = require('im/messenger/const');
	const { AfterScrollMessagePosition } = require('im/messenger/view/dialog');
	const { serviceLocator } = require('im/messenger/lib/di/service-locator');
	const { Notification, ToastType } = require('im/messenger/lib/ui/notification');
	const { LoggerManager } = require('im/messenger/lib/logger');
	const { AnalyticsService } = require('im/messenger/provider/services/analytics');
	const { FileUploadService } = require('im/messenger/provider/services/sending/file');
	const { FilesUploadService } = require('im/messenger/provider/services/sending/files');

	const logger = LoggerManager.getInstance().getLogger('service--sending');

	const UPLOAD_FILES_CHUNK_SIZE = 10;
	const UPLOAD_FILES_LIMIT = 100;

	/**
	 * @class SendingService
	 */
	class SendingService
	{
		#fileUploadService = null;
		#filesUploadService = null;

		/**
		 * @return {SendingService}
		 */
		static getInstance()
		{
			if (!this.instance)
			{
				this.instance = new this();
			}

			return this.instance;
		}

		constructor()
		{
			/**
			 * @private
			 * @type {MessengerCoreStore}
			 */
			this.store = serviceLocator.get('core').getStore();
		}

		/**
		 * @deprecated
		 * @return {FileUploadService}
		 */
		get fileUploadService()
		{
			this.#fileUploadService = this.#fileUploadService ?? new FileUploadService();

			return this.#fileUploadService;
		}

		/**
		 * @return {FilesUploadService}
		 */
		get filesUploadService()
		{
			this.#filesUploadService = this.#filesUploadService ?? new FilesUploadService();

			return this.#filesUploadService;
		}

		/**
		 * @param {DialogId} dialogId
		 * @param {Array} fileList
		 * @param {string?} text
		 * @param {Object?} params
		 * @param {(string) => Promise<string>} params.prepareFile
		 * @return {Promise}
		 */
		async sendFiles(dialogId, fileList, text = '', params = {})
		{
			logger.log(`${this.constructor.name}.sendFiles:`, dialogId, fileList, text, params);

			if (!dialogId)
			{
				return new Error(`${this.constructor.name}.sendFiles: dialogId not found`);
			}

			if (fileList.length === 0)
			{
				return new Error(`${this.constructor.name}.sendFiles fileList is empty`);
			}

			if (fileList.length > UPLOAD_FILES_LIMIT)
			{
				// eslint-disable-next-line no-param-reassign
				fileList = fileList.slice(0, UPLOAD_FILES_LIMIT);
				Notification.showToast(ToastType.sendFilesGalleryLimitExceeded);

				AnalyticsService.getInstance().sendToastShownGalleryLimitExceeded({
					dialogId,
					filesCount: fileList.length,
				});
			}

			const deviceFileList = [];
			const diskFileList = [];
			fileList.forEach((file) => {
				if (file.dataAttributes)
				{
					diskFileList.push(file);

					return;
				}

				deviceFileList.push(file);
			});

			if (Type.isArrayFilled(deviceFileList))
			{
				return this.#sendFilesFromDevice(dialogId, deviceFileList, text, params);
			}

			if (Type.isArrayFilled(diskFileList))
			{
				return this.#sendFilesFromDisk(dialogId, diskFileList, text);
			}

			return new Error(`${this.constructor.name}.sendFiles: no files to upload`);
		}

		/**
		 * @param {DialogId} dialogId
		 * @param {string} temporaryMessageId
		 * @param {Array<object>} fileList
		 * @returns {Promise<*>}
		 */
		async resendMessageWithFiles({ dialogId, temporaryMessageId, fileList })
		{
			logger.log(`${this.constructor.name}.resendMessage`, { dialogId, temporaryMessageId, fileList });

			const cancelTasksPromiseList = fileList.map((file) => this.filesUploadService.cancelTask(file.id));

			await Promise.all(cancelTasksPromiseList);

			const firstFile = fileList[0];
			if (Type.isNumber(Number(firstFile.id)))
			{
				await this.#resendFileFromDisk(dialogId, temporaryMessageId, fileList);
			}
			else
			{
				await this.#resendFileFromDevice(dialogId, temporaryMessageId, fileList);
			}
		}

		/**
		 * @param {string} temporaryMessageId
		 * @param {Array<string>} temporaryFileIds
		 * @param {string} mediaId
		 * @return {Promise}
		 */
		async cancelFileUpload(temporaryMessageId, temporaryFileIds, mediaId)
		{
			logger.log(`${this.constructor.name}.cancelFileUpload:`, temporaryMessageId, temporaryFileIds, mediaId);
			const fileId = mediaId || temporaryFileIds[0];
			await this.#cancelTask(fileId);
			await this.#sendAnalyticsFileUploadCancel(temporaryMessageId, fileId);
			const isUpdateMessage = Boolean(mediaId);
			await this.#processMessage(temporaryMessageId, fileId, isUpdateMessage);
		}

		/**
		 * @desc Send files from device by FileUploadService
		 * @param {DialogId} dialogId
		 * @param {Array<DeviceFile>} deviceFileList
		 * @param {string?} text
		 * @param {Object?} params
		 * @param {(string) => Promise<string>} params.prepareFile
		 * @return {Promise}
		 */
		async #sendFilesFromDevice(dialogId, deviceFileList, text, params)
		{
			logger.log(`${this.constructor.name}.sendFilesFromDevice:`, dialogId, deviceFileList, text, params);

			if (deviceFileList.length > UPLOAD_FILES_CHUNK_SIZE)
			{
				const chunkFilesArray = this.#getChunkArray(deviceFileList);

				return this.#chunkUploadFiles(dialogId, chunkFilesArray, text, params);
			}

			return this.#uploadFiles(dialogId, deviceFileList, text, params);
		}

		/**
		 * @param {DialogId} dialogId
		 * @param {Array<Array<DeviceFile>>} chunkFilesArray
		 * @param {string?} text
		 * @param {Object?} params
		 * @param {(string) => Promise<string>} params.prepareFile
		 */
		async #chunkUploadFiles(dialogId, chunkFilesArray, text, params) {
			const [firstChunk, ...otherChunks] = chunkFilesArray;
			await this.#uploadFiles(dialogId, firstChunk, text, params);

			for (const chunk of otherChunks)
			{
				// this rule is disabled according to the clause in the official documentation eslint:
				// 'loops may be used to prevent your code from sending an excessive amount of requests in parallel.'
				// eslint-disable-next-line no-await-in-loop
				await this.#uploadFiles(dialogId, chunk, '', params);
			}
		}

		/**
		 * @param {DialogId} dialogId
		 * @param {Array<DeviceFile>} deviceFileList
		 * @param {string?} text
		 * @param {Object?} params
		 * @param {(string) => Promise<string>} params.prepareFile
		 */
		async #uploadFiles(dialogId, deviceFileList, text, params)
		{
			let diskFolderId = 0;
			try
			{
				diskFolderId = await this.filesUploadService.getDiskFolderId(dialogId);
			}
			catch (error)
			{
				logger.error(`${this.constructor.name}.#uploadFiles.getDiskFolderId`, error);
			}

			const temporaryMessageId = Uuid.getV4();

			const prepareFiles = deviceFileList.map((deviceFile) => this.#prepareFileFromDevice({
				dialogId,
				deviceFile,
				diskFolderId,
				temporaryMessageId,
			}));

			const temporaryFileIds = prepareFiles.map((file) => file.temporaryFileId);
			await this.filesUploadService.addFilesToStore(prepareFiles);
			await this.#sendMessage({
				dialogId,
				temporaryMessageId,
				fileIds: temporaryFileIds,
				text,
				diskFolderId,
			});

			if (diskFolderId)
			{
				await this.#prepareAndStartUploadTasks(temporaryMessageId, prepareFiles, params);
			}
		}

		/**
		 * @param {string} temporaryMessageId
		 * @param {Array<PreparedUploadFile>} prepareFiles
		 * @param {Object?} params
		 * @param {(string) => Promise<string>} params.prepareFile
		 * return {DeviceFile}
		 */
		async #prepareAndStartUploadTasks(temporaryMessageId, prepareFiles, params)
		{
			let prepareFilesToUpload = null;
			try
			{
				prepareFilesToUpload = await Promise.all(
					prepareFiles.map(async (data) => {
						const preparedUploadFile = clone(data);
						if (params?.prepareFile)
						{
							preparedUploadFile.deviceFile = await params.prepareFile(preparedUploadFile.deviceFile);
						}

						return preparedUploadFile;
					}),
				);
			}
			catch (error)
			{
				const temporaryFileIds = prepareFiles.map((file) => file.temporaryFileId);
				this.#deleteMessage(temporaryMessageId, temporaryFileIds);
				Notification.showToast(ToastType.errorConvertRoundVideo);

				logger.error(error);

				return;
			}

			const preparedUploadTasks = await this.filesUploadService.prepareTasks(prepareFilesToUpload);
			await this.filesUploadService.startUploadFiles(preparedUploadTasks);

			if (params?.prepareFile)
			{
				await this.filesUploadService.addFilesToStore(prepareFilesToUpload);
			}
		}

		/**
		 * @param {string} fileId
		 * @return {boolean|Promise<boolean>}
		 */
		#cancelTask(fileId)
		{
			return this.filesUploadService.cancelTask(fileId);
		}

		/**
		 * @param {string} temporaryMessageId
		 * @param {string} fileId
		 * @return {Promise<boolean>}
		 */
		async #sendAnalyticsFileUploadCancel(temporaryMessageId, fileId)
		{
			return AnalyticsService.getInstance().sendFileUploadCancel({ temporaryMessageId, fileId });
		}

		/**
		 * @param {string} temporaryMessageId
		 * @param {string} fileId
		 * @param {boolean} isUpdateMessage
		 * @return {Promise}
		 */
		#processMessage(temporaryMessageId, fileId, isUpdateMessage)
		{
			if (isUpdateMessage)
			{
				return this.#updateMessage(temporaryMessageId, fileId);
			}

			return this.#deleteMessage(temporaryMessageId, fileId);
		}

		/**
		 * @param {string} temporaryMessageId
		 * @param {Array<string>} temporaryFileIds
		 * @return {Promise}
		 */
		#deleteMessage(temporaryMessageId, temporaryFileIds)
		{
			const dialog = this.#getDialogByTemporaryMessageId(temporaryMessageId);

			return this.store.dispatch('messagesModel/delete', { id: temporaryMessageId })
				.then(() => {
					const recentItem = this.store.getters['recentModel/getById'](dialog?.dialogId);
					if (!recentItem)
					{
						return;
					}

					this.store.dispatch('recentModel/set', [{
						...recentItem,
						uploadingState: null,
					}]);
				})
				.then(() => {
					this.store.dispatch('filesModel/delete', { id: temporaryFileIds[0] });
				})
				.catch((error) => logger.error(error))
				;
		}

		/**
		 * @param {string} temporaryMessageId
		 * @param {Array<string>} mediaId
		 * @return {Promise}
		 */
		#updateMessage(temporaryMessageId, mediaId)
		{
			const messageModel = this.store.getters['messagesModel/getById'](temporaryMessageId);
			const newFiles = messageModel?.files?.filter((fileId) => fileId !== mediaId);

			return this.store.dispatch('messagesModel/update', {
					id: temporaryMessageId,
					fields: {
						files: newFiles,
					},
				})
				.then(() => {
					this.store.dispatch('filesModel/delete', { id: mediaId });
				})
				.catch((error) => logger.error(error));
		}

		/**
		 * @desc Send files from disk
		 * @param {DialogId} dialogId
		 * @param {string?} text
		 * @param {Array<Object>} diskFileList
		 * @return {Promise}
		 */
		async #sendFilesFromDisk(dialogId, diskFileList, text)
		{
			logger.log(`${this.constructor.name}.sendFilesFromDisk:`, dialogId, diskFileList, text);
			const temporaryMessageId = Uuid.getV4();
			const filesData = Object.values(diskFileList).map((diskFile) => {
				return this.#prepareFileFromDisk({ file: diskFile, dialogId, temporaryMessageId });
			});

			const addFileToModelPromiseCollection = filesData.map(
				(fileData) => this.filesUploadService.addFileToModelFromDisk(fileData),
			);
			await Promise.all(addFileToModelPromiseCollection);

			await this.#sendMessage({
				temporaryMessageId,
				dialogId,
				fileIds: filesData.map((fileData) => fileData.temporaryFileId),
				text,
			});
			const filesIdsCollection = filesData.map((fileData) => {
				return { realFileIdInt: fileData.realFileIdInt, temporaryFileId: fileData.temporaryFileId };
			});

			this.filesUploadService.commitFromDisk(
				filesData[0]?.chatId,
				temporaryMessageId,
				filesIdsCollection,
			);
		}

		/**
		 * @param {DialogId} dialogId
		 * @param {string} temporaryMessageId
		 * @param {Array<DeviceFile>} deviceFileList
		 * @return {Promise}
		 */
		async #resendFileFromDevice(dialogId, temporaryMessageId, deviceFileList)
		{
			this.#updateRecentStatusByResend({ dialogId, temporaryMessageId });
			const diskFolderId = await this.filesUploadService.getDiskFolderId(dialogId);

			const prepareFiles = deviceFileList.map((deviceFile) => this.#prepareFileFromDevice({
				dialogId,
				deviceFile,
				diskFolderId,
				temporaryMessageId,
			}));

			const temporaryFileIds = prepareFiles.map((file) => file.deviceFile.id);

			const preparedUploadTasks = await this.filesUploadService.prepareTasks(prepareFiles);
			this.filesUploadService.addFilesToStore(prepareFiles);
			await this.#resendMessage({
				dialogId,
				temporaryMessageId,
				fileIds: temporaryFileIds,
			});

			await this.filesUploadService.startUploadFiles(preparedUploadTasks);
		}

		/**
		 * @param {DialogId} dialogId
		 * @param {string} temporaryMessageId
		 * @param {Array<{ id: string }>} fileList
		 * @return {Promise}
		 */
		async #resendFileFromDisk(dialogId, temporaryMessageId, fileList)
		{
			const filesIdsCollection = fileList.map((file) => {
				return { realFileIdInt: file.id, temporaryFileId: temporaryMessageId };
			});

			const { chatId } = this.#getDialog(dialogId);
			const temporaryFileIds = fileList.map((file) => file.id);

			await this.#resendMessage({
				dialogId,
				temporaryMessageId,
				fileIds: temporaryFileIds,
			});

			this.filesUploadService.commitFromDisk(
				chatId,
				temporaryMessageId,
				filesIdsCollection,
			);
		}

		/**
		 * @param {SendMessageParams} params
		 * @return {Promise}
		 */
		#sendMessage(params)
		{
			const { text = '', fileIds = [], temporaryMessageId, dialogId, diskFolderId } = params;
			if (!Type.isStringFilled(text) && !Type.isArrayFilled(fileIds))
			{
				return Promise.resolve();
			}

			logger.warn(`${this.constructor.name}: sendMessage`, params);

			const message = this.#prepareMessage({ text, fileIds, temporaryMessageId, dialogId, diskFolderId });

			return this.#handlePagination(dialogId).then(() => {
				return this.#addMessageToModels(message);
			}).then(() => {
				this.#sendScrollEvent({ dialogId });
			});
		}

		/**
		 * @param {SendMessageParams} params
		 * @return {Promise}
		 */
		#resendMessage(params)
		{
			const { text = '', fileIds = [], temporaryMessageId, dialogId } = params;
			if (!Type.isStringFilled(text) && !Type.isArrayFilled(fileIds))
			{
				return Promise.resolve();
			}

			logger.warn(`${this.constructor.name}.resendMessage`, params);

			const messageData = this.store.getters['messagesModel/getByTemplateId'](temporaryMessageId);

			const message = this.#prepareMessage({
				text,
				fileIds,
				temporaryMessageId,
				dialogId,
				previousId: messageData?.previousId,
			});

			return this.store.dispatch('messagesModel/update', {
				id: temporaryMessageId,
				fields: { ...message },
			});
		}

		#prepareFileFromDevice({
			dialogId,
			deviceFile,
			diskFolderId,
			temporaryMessageId = Uuid.getV4(),
		})
		{
			return {
				dialogId,
				deviceFile,
				diskFolderId,
				temporaryMessageId,
				temporaryFileId: Uuid.getV4(),
			};
		}

		#prepareFileFromDisk({
			file,
			dialogId,
			temporaryMessageId = Uuid.getV4(),
		})
		{
			const realFileIdInt = file.dataAttributes.ID;
			const temporaryFileId = `${temporaryMessageId}|${realFileIdInt}`;

			return {
				temporaryMessageId,
				temporaryFileId,
				realFileIdInt,
				dialogId,
				file,
				chatId: this.#getDialog(dialogId).chatId,
			};
		}

		/**
		 * @param {PreparedMessage} params
		 * @return {MessagesModelState}
		 */
		#prepareMessage(params)
		{
			let {
				text,
			} = params;

			const {
				fileIds,
				temporaryMessageId,
				dialogId,
				diskFolderId,
			} = params;

			if (Type.isStringFilled(text))
			{
				// eslint-disable-next-line no-param-reassign
				text = text.trim();
			}

			const previousId = params.previousId
				?? this.store.getters['messagesModel/getLastId'](this.#getDialog(dialogId).chatId)
			;

			const messageParams = {};
			if (fileIds)
			{
				messageParams.FILE_ID = fileIds;
			}

			const temporaryId = temporaryMessageId || Uuid.getV4();
			const chatId = this.#getDialog(dialogId).chatId;
			const fields = {
				templateId: temporaryId,
				chatId,
				dialogId,
				authorId: serviceLocator.get('core').getUserId(),
				text,
				date: new Date(),
				params: messageParams,
				withFile: fileIds.length > 0,
				unread: false,
				sending: true,
				error: false,
				previousId,
			};

			if (diskFolderId === 0)
			{
				Object.assign(fields, { error: true, errorReason: ErrorCode.NO_INTERNET_CONNECTION, loadText: '' });
			}

			return fields;
		}

		async #handlePagination(dialogId)
		{
			if (!this.#getDialog(dialogId).hasNextPage)
			{
				return;
			}

			logger.warn(`${this.constructor.name}.handlePagination: there are unread pages, move to chat end`);

			// TODO: refactor this
			// Unfortunately, there is currently no more correct way to go to the context
			// because context manager works directly with the dialog widget
			/**
			 * @type {ContextManager|null}
			 */
			const contextManager = serviceLocator.get(dialogId)?.locator?.get('context-manager');
			if (contextManager)
			{
				await contextManager.goToBottomMessageContext();
			}
		}

		#addMessageToModels(message)
		{
			return this.store.dispatch('messagesModel/add', message);
		}

		#sendScrollEvent(options = {})
		{
			const { dialogId } = options;

			/** @type {ScrollToBottomEvent} */
			const scrollToBottomEventData = {
				dialogId,
				withAnimation: true,
				force: true,
				position: AfterScrollMessagePosition.bottom,
			};

			BX.postComponentEvent(EventType.dialog.external.scrollToBottom, [scrollToBottomEventData]);
		}

		/**
		 * @param dialogId
		 * @returns {DialoguesModelState|{}}
		 */
		#getDialog(dialogId)
		{
			return this.store.getters['dialoguesModel/getById'](dialogId) || {};
		}

		/**
		 * @param {string} temporaryMessageId
		 * @return {DialoguesModelState | null}
		 */
		#getDialogByTemporaryMessageId(temporaryMessageId)
		{
			const modelMessage = this.store.getters['messagesModel/getByTemplateId'](temporaryMessageId);

			return this.store.getters['dialoguesModel/getByChatId'](modelMessage?.chatId);
		}

		/**
		 * @param {Array<*>} array
		 * @param {number} [chunkSize=UPLOAD_FILES_CHUNK_SIZE]
		 * @return {Array<Array<*>>}
		 */
		#getChunkArray(array, chunkSize = UPLOAD_FILES_CHUNK_SIZE)
		{
			return array.reduce((result, item, index) => {
				const chunkIndex = Math.floor(index / chunkSize);
				if (!result[chunkIndex])
				{
					// eslint-disable-next-line no-param-reassign
					result[chunkIndex] = [];
				}
				result[chunkIndex].push(item);

				return result;
			}, []);
		}

		async #updateRecentStatusByResend({ dialogId, temporaryMessageId })
		{
			const recentItem = this.store.getters['recentModel/getById'](dialogId);
			if (!recentItem)
			{
				return;
			}

			if (recentItem.uploadingState?.message?.id !== temporaryMessageId)
			{
				return;
			}

			recentItem.uploadingState.message.subTitleIcon = SubTitleIconType.wait;

			await this.store.dispatch('recentModel/set', [recentItem]);
		}
	}

	module.exports = {
		SendingService,
	};
});
