/**
 * @module im/messenger/lib/helper/message
 */
jn.define('im/messenger/lib/helper/message', (require, exports, module) => {
	const { Type } = require('type');
	const { FileType } = require('im/messenger/const');
	const { serviceLocator } = require('im/messenger/lib/di/service-locator');
	const { LoggerManager } = require('im/messenger/lib/logger');
	const { emojiRegex } = require('im/messenger/lib/utils');
	const { SmileManager } = require('im/messenger/lib/smile-manager');

	const logger = LoggerManager.getInstance().getLogger('helpers--message');

	/**
	 * @class MessageHelper
	 */
	class MessageHelper
	{
		/** @type {MessagesModelState} */
		messageModel;
		/** @type {Array<FilesModelState>} */
		filesModel;

		/**
		 * @param {MessagesModelState} messagesModel
		 * @param {Array<FilesModelState> | FilesModelState} filesModel
		 * @return {MessageHelper|null}
		 */
		static createByModel(messagesModel, filesModel)
		{
			if (!Type.isPlainObject(messagesModel))
			{
				logger.error('MessageHelper.getByModel error: dialogModel is not an object', messagesModel);

				return null;
			}

			if (!Type.isArray(filesModel))
			{
				if (!Type.isPlainObject(filesModel))
				{
					logger.error('MessageHelper.getByModel error: filesModel must be an array of filesModel', filesModel);

					return null;
				}
				// eslint-disable-next-line no-param-reassign
				filesModel = [filesModel];
			}

			return new MessageHelper(messagesModel, filesModel);
		}

		/**
		 * @param {string | number} messageId
		 * @return {MessageHelper|null}
		 */
		static createById(messageId)
		{
			if (!Type.isNumber(messageId) && !Type.isStringFilled(messageId))
			{
				logger.error('MessageHelper.getById error: messageId is not a number or string filled', messageId);

				return null;
			}

			const messagesModel = serviceLocator.get('core').getStore().getters['messagesModel/getById'](messageId);
			if (!('id' in messagesModel))
			{
				logger.warn('MessageHelper.getById: message not found', messageId);

				return null;
			}

			let filesModel = [];
			if (Type.isArrayFilled(messagesModel.files))
			{
				filesModel = serviceLocator.get('core').getStore()
					.getters['filesModel/getListByMessageId'](messageId)
				;
			}

			return MessageHelper.createByModel(messagesModel, filesModel);
		}

		/**
		 * @param {MessagesModelState} messageModel
		 * @param {Array<FilesModelState>} filesModel
		 */
		constructor(messageModel, filesModel)
		{
			this.messageModel = messageModel;
			this.filesModel = filesModel;
		}

		get isSystem()
		{
			return this.messageModel.authorId === 0;
		}

		get isText()
		{
			return this.messageModel.text !== '';
		}

		get isYour()
		{
			return Number(this.messageModel.authorId) === serviceLocator.get('core').getUserId();
		}

		get isDeleted()
		{
			return this.messageModel.params?.IS_DELETED === 'Y';
		}

		get isForward()
		{
			return !Type.isUndefined(this.messageModel?.forward.id);
		}

		get isWithAttach()
		{
			return Type.isArrayFilled(this.messageModel?.params?.ATTACH);
		}

		get isWithFile()
		{
			return Type.isArrayFilled(this.messageModel.files);
		}

		get isGallery()
		{
			if (!this.isWithFile)
			{
				return false;
			}

			return this.messageModel.files?.length > 1;
		}

		get isVideo()
		{
			if (!this.isWithFile)
			{
				return false;
			}

			if (this.filesModel.length === 0 || this.filesModel.length > 1)
			{
				return false;
			}

			return this.filesModel[0].type === FileType.video;
		}

		get isImage()
		{
			if (!this.isWithFile)
			{
				return false;
			}

			if (this.filesModel.length === 0 || this.filesModel.length > 1)
			{
				return false;
			}

			return this.filesModel[0].type === FileType.image;
		}

		get isAudio()
		{
			if (!this.isWithFile)
			{
				return false;
			}

			if (this.filesModel.length === 0 || this.filesModel.length > 1)
			{
				return false;
			}

			return this.filesModel[0].type === FileType.audio;
		}

		get isFile()
		{
			if (!this.isWithFile)
			{
				return false;
			}

			if (this.filesModel.length === 0 || this.filesModel.length > 1)
			{
				return false;
			}

			return this.filesModel[0].type === FileType.file;
		}

		get isEmojiOnly()
		{
			if (!this.isText)
			{
				return false;
			}

			const messageText = this.messageModel.text;
			const text = messageText.replaceAll(emojiRegex, '');

			return text.replaceAll(/\s/g, '').length === 0;
		}

		get isSmileOnly()
		{
			if (!this.isText)
			{
				return false;
			}

			const messageText = this.messageModel.text;
			const smileManager = SmileManager.getInstance();
			if (Object.values(smileManager.getSmiles()).length === 0)
			{
				return false;
			}

			const pattern = smileManager.getPattern();
			const regExp = new RegExp(`(?:(?:${pattern})(?=(?:(?:${pattern})|\\s|&quot;|<|$)))`, 'g');
			const text = messageText.replaceAll(regExp, '');

			return text.replaceAll(/\s/g, '').length === 0;
		}

		get isInitialPostForComment()
		{
			this.dialogModel ??= this.#getDialoguesModel();

			return String(this.dialogModel?.parentMessageId) === String(this.messageModel.id);
		}

		/**
		 * @return {?DialoguesModelState}
		 */
		#getDialoguesModel()
		{
			return serviceLocator.get('core').getStore()
				.getters['dialoguesModel/getByChatId'](this.messageModel.chatId)
			;
		}
	}

	module.exports = { MessageHelper };
});
