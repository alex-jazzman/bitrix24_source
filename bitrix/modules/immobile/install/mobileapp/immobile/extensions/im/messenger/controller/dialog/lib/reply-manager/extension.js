/* eslint-disable flowtype/require-return-type */
/* eslint-disable bitrix-rules/no-bx */

/**
 * @module im/messenger/controller/dialog/lib/reply-manager
 */
jn.define('im/messenger/controller/dialog/lib/reply-manager', (require, exports, module) => {
	const { Loc } = require('im/messenger/loc');
	const { Type } = require('type');
	const { Color } = require('tokens');
	const { Icon } = require('assets/icons');
	const { clone } = require('utils/object');
	const {
		MessageType,
		DialogType,
		FileType,
		AttachFileStatus,
	} = require('im/messenger/const');
	const {
		InputQuoteType,
	} = require('im/messenger/view/dialog');
	const { getFileTypeByExtension, getFileExtension } = require('im/messenger/lib/helper');
	const { parser } = require('im/messenger/lib/parser');
	const { buildQuotePreview } = require('im/messenger/lib/parser/functions/quote');
	const { Feature } = require('im/messenger/lib/feature');
	const { MessengerParams } = require('im/messenger/lib/params');
	const { DateFormatter } = require('im/messenger/lib/date-formatter');
	const { getLogger } = require('im/messenger/lib/logger');

	const logger = getLogger('dialog--reply-manager');

	const QUOTE_DELIMITER = '-'.repeat(54);
	const SHORT_NAME_SYMBOLS_LIMIT = 12;
	const LONG_NAME_SYMBOLS_LIMIT = 8;
	const TEXT_SYMBOLS_LIMIT = 35;
	const NAME_SYMBOLS_LIMIT_ELLIPSIS = '...';

	/**
	 * @class ReplyManager
	 */
	class ReplyManager
	{
		#isQuoteInProcess;
		#isQuoteInBackground;
		#isForwardInBackground;
		#isEditInProcess;
		#isForwardInProcess;
		#isAttachInProcess;
		/** @type {?string} */
		#inputTextBuffer;

		constructor({ store, dialogView, dialogLocator })
		{
			this.store = store;
			/** @type {DialogView} */
			this.dialogView = dialogView;

			/** @type {DialogLocator} */
			this.dialogLocator = dialogLocator;

			this.quoteMessage = null;
			this.#inputTextBuffer = null;
			this.#isQuoteInProcess = false;
			this.#isQuoteInBackground = false;
			this.#isForwardInBackground = false;
			this.#isEditInProcess = false;
			this.#isForwardInProcess = false;
			this.#isAttachInProcess = false;
			/** @type {DraftManager} */
			this.draftManager = null;

			this.editMessage = null;
			/** @type {Array<DeviceFile> | null} */
			this.attachFiles = null;
		}

		get isQuoteInProcess()
		{
			return this.#isQuoteInProcess;
		}

		get isQuoteInBackground()
		{
			return this.#isQuoteInBackground;
		}

		get isForwardInBackground()
		{
			return this.#isForwardInBackground;
		}

		get isEditInProcess()
		{
			return this.#isEditInProcess;
		}

		get isForwardInProcess()
		{
			return this.#isForwardInProcess;
		}

		get isAttachInProcess()
		{
			return this.#isAttachInProcess;
		}

		/**
		 * @desc Text that was in the input field before the edit mode took the field over, or null when
		 *   the user entered the edit mode from an empty field. Part of the interface on purpose: the send
		 *   flow compares the field against this buffer to tell the text returned by finishEditingMessage()
		 *   from text the user typed himself.
		 * @return {?string}
		 */
		get inputTextBuffer()
		{
			return this.#inputTextBuffer;
		}

		/**
		 * @param {DraftManager} draftManager
		 */
		setDraftManager(draftManager)
		{
			this.draftManager = draftManager;
		}

		setQuoteMessage(message)
		{
			const modelMessage = this.store.getters['messagesModel/getById'](message.id);

			const quoteMessage = this.dialogLocator.get('message-ui-converter').createMessage(modelMessage);
			const isSystemMessage = modelMessage.authorId === 0;

			if (isSystemMessage)
			{
				quoteMessage.username = Loc.getMessage('IMMOBILE_MESSENGER_DIALOG_REPLY_MANAGER_QUOTE_DEFAULT_TITLE');
			}

			quoteMessage.message = [
				{
					type: 'text',
					text: parser.simplifyMessage(modelMessage),
				},
			];

			// Media preview for the reply plaque, consistent with the in-bubble quote (buildQuotePreview).
			// Additive: native draws it only in reply-with-media builds; otherwise the text above stays as fallback.
			this.#attachMediaPreview(quoteMessage, message.id);

			this.quoteMessage = quoteMessage;
		}

		/**
		 * @param {Object} quoteMessage
		 * @param {number} messageId
		 */
		#attachMediaPreview(quoteMessage, messageId)
		{
			if (!Feature.isReplyWithMediaAvailable)
			{
				return;
			}

			const preview = buildQuotePreview(messageId);
			// 'deleted_sticker' is an internal marker, not a contract type: don't attach it to the plaque.
			// The text fallback set in setQuoteMessage stays (native would ignore the out-of-enum type anyway).
			if (preview && preview.type !== 'deleted_sticker')
			{
				quoteMessage.preview = preview;
			}
		}

		getQuoteMessage()
		{
			return this.quoteMessage;
		}

		/**
		 * Rebuilds reply plaque media preview after chat history hydration.
		 * Draft restore runs in initManagers before messages/files are in the store.
		 */
		refreshQuoteMediaPreviewIfNeeded()
		{
			if (!this.isQuoteInProcess || !this.quoteMessage?.id || this.quoteMessage.preview)
			{
				return Promise.resolve();
			}

			const quoteMessage = { ...this.quoteMessage };
			this.#attachMediaPreview(quoteMessage, quoteMessage.id);
			if (!quoteMessage.preview)
			{
				return Promise.resolve();
			}

			this.quoteMessage = quoteMessage;

			return this.dialogView.setInputQuote(quoteMessage, {
				type: InputQuoteType.reply,
				openKeyboard: false,
			});
		}

		/**
		 * @return {ForwardMessage}
		 */
		getForwardMessage()
		{
			return this.forwardMessage;
		}

		/**
		 * @return {ForwardMessageIds}
		 */
		getForwardMessageIds()
		{
			return this.forwardMessageIds;
		}

		getQuoteText(message = this.getQuoteMessage())
		{
			const modelMessage = this.store.getters['messagesModel/getById'](message.id);
			if (
				Type.isUndefined(modelMessage)
				|| (Type.isObject(modelMessage) && !('id' in modelMessage))
			)
			{
				return '';
			}

			let quoteTitle = Loc.getMessage('IMMOBILE_MESSENGER_DIALOG_REPLY_MANAGER_QUOTE_DEFAULT_TITLE');
			const isSystemMessage = modelMessage.authorId === 0;
			if (!isSystemMessage && modelMessage.authorId)
			{
				const user = this.store.getters['usersModel/getById'](modelMessage.authorId);
				quoteTitle = user.name || user.firstName;
			}

			const quoteDate = DateFormatter.getQuoteFormat(modelMessage.date);
			const quoteText = parser.prepareQuote(modelMessage);

			let quoteContext = '';
			const dialog = this.store.getters['dialoguesModel/getByChatId'](modelMessage.chatId);
			if (dialog && (dialog.type === DialogType.user || dialog.type === DialogType.private))
			{
				quoteContext = `#${dialog.dialogId}:${MessengerParams.getUserId()}/${modelMessage.id}`;
			}
			else if (dialog && dialog.dialogId)
			{
				quoteContext = `#${dialog.dialogId}/${modelMessage.id}`;
			}
			else
			{
				quoteContext = '';
			}

			return (
				`${QUOTE_DELIMITER}\n`
				+ `${quoteTitle} [${quoteDate}] ${quoteContext}\n`
				+ `${quoteText}\n`
				+ `${QUOTE_DELIMITER}\n`
			);
		}

		setEditMessage(message)
		{
			const modelMessage = this.store.getters['messagesModel/getById'](message.id);
			const editMessage = this.dialogLocator.get('message-ui-converter').createMessage(modelMessage);
			editMessage.username = Loc.getMessage('IMMOBILE_MESSENGER_DIALOG_REPLY_MANAGER_MESSAGE_EDIT_FIELD');

			editMessage.message = [
				{
					type: 'text',
					text: parser.simplifyMessage(modelMessage),
				},
			];

			this.editMessage = editMessage;
		}

		/**
		 *
		 * @param {Message | MessageId} message
		 */
		setForwardMessage(message)
		{
			if (!Type.isObject(message) && !Type.isNumber(message) && !Type.isStringFilled(message))
			{
				logger.error(`${this.constructor.name}.setForwardMessage message is not valid`, message);

				return;
			}

			const messageId = message?.id ?? message;
			const messageModel = this.store.getters['messagesModel/getById'](Number(messageId));
			const messageProps = Type.isObject(message)
				? message
				: this.dialogLocator.get('message-ui-converter').createMessage(messageModel);

			const forwardMessage = {
				id: messageModel.id,
			};

			forwardMessage.username = messageProps.username;
			if (messageProps.type === MessageType.systemText)
			{
				forwardMessage.username = Loc.getMessage('IMMOBILE_MESSENGER_DIALOG_REPLY_MANAGER_FORWARD_DEFAULT_TITLE');
			}

			forwardMessage.message = [
				{
					type: 'text',
					text: parser.simplifyMessage(messageModel),
				},
			];

			this.forwardMessage = forwardMessage;
			this.forwardMessageIds = [messageModel.id];
		}

		/**
		 *
		 * @param {Array<string|number>} messageIds
		 */
		setForwardMessageFromIdList(messageIds)
		{
			const currentUserId = MessengerParams.getUserId();
			const authorIdsSet = new Set();
			const authorNames = [];
			const sortedMessageIds = [];
			const messagesModelCollection = this.store.getters['messagesModel/getListByIds'](messageIds);

			messagesModelCollection.forEach((messageModel) => {
				authorIdsSet.add(messageModel.authorId);
				sortedMessageIds.push(messageModel.id);
			});

			const isHaveCurrentUser = authorIdsSet.has(currentUserId);
			if (isHaveCurrentUser)
			{
				authorNames.push(Loc.getMessage('IMMOBILE_MESSENGER_DIALOG_REPLAY_MANAGER_FORWARDS_TEXT_CURRENT_USER'));
			}

			const filteredAuthorIds = [...authorIdsSet].filter((authorId) => authorId !== currentUserId && authorId !== 0);
			const userModels = this.store.getters['usersModel/getByIdList'](filteredAuthorIds);
			userModels.forEach((user) => {
				if (user)
				{
					authorNames.push(user.firstName || user.name);
				}
			});

			const usersName = this.truncateAuthorNames(authorNames);
			const text = this.getForwardNamesText(usersName, filteredAuthorIds, isHaveCurrentUser);

			const title = Loc.getMessagePlural(
				'IMMOBILE_MESSENGER_DIALOG_REPLAY_MANAGER_FORWARDS_TITLE',
				sortedMessageIds.length,
				{
					'#COUNT#': sortedMessageIds.length,
				},
			);

			this.forwardMessage = {
				id: sortedMessageIds[0],
				username: title,
				message: [
					{
						type: 'text',
						text,
					},
				],
			};

			this.forwardMessageIds = sortedMessageIds;
		}

		/**
		 * @param {Array<MessageId | Message>} messageIds
		 */
		setForwardMessages(messageIds)
		{
			if (messageIds.length === 1)
			{
				this.setForwardMessage(messageIds[0]);
			}
			else
			{
				this.setForwardMessageFromIdList(messageIds);
			}
		}

		/**
		 * @desc truncate string with names depending on two conditions:
		 * 1 - there are more than 3 names, then slice according to the limit.
		 * 2 - there are less than 3 names, then the native slice
		 * @param {Array<string>} authorNames
		 * @return {string}
		 */
		truncateAuthorNames(authorNames)
		{
			if (authorNames.length === 1)
			{
				return authorNames[0];
			}

			// this length truncation will make native
			if (authorNames.length === 2)
			{
				return [authorNames[0], authorNames[1]].join(', ');
			}

			// this length truncation for text: 'and more'
			if (authorNames.length > 2)
			{
				const stringNamesMaxLength = [authorNames[0], authorNames[1]].join(', ')?.length;
				const limit = stringNamesMaxLength > TEXT_SYMBOLS_LIMIT
					? LONG_NAME_SYMBOLS_LIMIT
					: SHORT_NAME_SYMBOLS_LIMIT
				;

				const preparedNames = [authorNames[0], authorNames[1]].map((name) => {
					if (name && name.length > limit)
					{
						return `${name.slice(0, limit)}${NAME_SYMBOLS_LIMIT_ELLIPSIS}`;
					}

					return name;
				});

				return preparedNames.join(', ');
			}

			return authorNames[0];
		}

		/**
		 * @param {Array<string>} usersName
		 * @param {Array<number>} filteredAuthorIds
		 * @param {boolean} isHaveCurrentUser
		 * @return {string}
		 */
		getForwardNamesText(usersName, filteredAuthorIds, isHaveCurrentUser)
		{
			let text = '';
			if (isHaveCurrentUser && filteredAuthorIds.length > 1)
			{
				text = Loc.getMessage('IMMOBILE_MESSENGER_DIALOG_REPLAY_MANAGER_FORWARDS_TEXT_MORE', {
					'#USERS_NAME#': usersName,
					'#USERS_COUNT#': filteredAuthorIds.length - 1,
				});
			}
			else if (!isHaveCurrentUser && filteredAuthorIds.length > 2)
			{
				text = Loc.getMessage('IMMOBILE_MESSENGER_DIALOG_REPLAY_MANAGER_FORWARDS_TEXT_MORE', {
					'#USERS_NAME#': usersName,
					'#USERS_COUNT#': filteredAuthorIds.length - 2,
				});
			}
			else if (isHaveCurrentUser && filteredAuthorIds.length === 0)
			{
				const currentUserId = MessengerParams.getUserId();
				const currentUserModels = this.store.getters['usersModel/getById'](currentUserId);
				text = Loc.getMessage('IMMOBILE_MESSENGER_DIALOG_REPLAY_MANAGER_FORWARDS_TEXT', {
					'#USER_NAME#': currentUserModels.firstName || currentUserModels.name,
				});
			}
			else
			{
				text = Loc.getMessage('IMMOBILE_MESSENGER_DIALOG_REPLAY_MANAGER_FORWARDS_TEXT', {
					'#USER_NAME#': usersName,
				});
			}

			return text;
		}

		getEditMessage()
		{
			return this.editMessage;
		}

		startQuotingMessage(message, openKeyboard = true)
		{
			if (this.isAttachInProcess)
			{
				this.#resetAttachingFilesProcess();
			}

			this.setQuoteMessage(message);
			if (this.isEditInProcess)
			{
				this.#isQuoteInBackground = true;

				return;
			}

			if (this.isForwardInProcess)
			{
				this.#isForwardInProcess = false;
				this.#isForwardInBackground = false;
				this.dialogView.enableAlwaysSendButtonMode(false);
			}

			// the buffer will be filled if we replied to the message, but did not send it,
			// but opened the message editing on top.
			if (this.#inputTextBuffer !== null)
			{
				this.dialogView.setInput(this.#inputTextBuffer);
				this.#inputTextBuffer = null;
			}

			if (this.isQuoteInProcess)
			{
				this.finishQuotingMessage().then(() => {
					this.#startQuotingMessage(openKeyboard);
				});

				return;
			}

			this.#startQuotingMessage(openKeyboard);
		}

		#startQuotingMessage(openKeyboard = true)
		{
			this.#isQuoteInProcess = true;
			this.#isQuoteInBackground = false;

			const quoteMessage = this.getQuoteMessage();

			const params = {
				type: InputQuoteType.reply,
				openKeyboard,
			};
			this.dialogView.setInputQuote(quoteMessage, params);
			if (this.draftManager)
			{
				this.draftManager.setQuotMessageInStore(quoteMessage, InputQuoteType.reply, this.dialogView.getInput());
			}
		}

		startEditingMessage(message)
		{
			if (this.isAttachInProcess)
			{
				this.#resetAttachingFilesProcess();
			}

			const inputText = this.dialogView.getInput();
			if (!this.isEditInProcess && inputText !== '')
			{
				this.#inputTextBuffer = inputText;
			}

			if (this.isForwardInProcess)
			{
				this.#isForwardInProcess = false;
				this.#isForwardInBackground = false;
				this.dialogView.enableAlwaysSendButtonMode(false);
			}

			if (this.isQuoteInProcess)
			{
				this.#isQuoteInBackground = true;
			}

			this.setEditMessage(message);
			this.#isEditInProcess = true;

			const modelMessage = clone(this.store.getters['messagesModel/getById'](Number(message.id)));
			const editMessage = this.getEditMessage();

			this.dialogView.setInputQuote(editMessage, { type: InputQuoteType.edit });

			const editMessageText = modelMessage.text || '';
			this.dialogView.setInput(editMessageText);
			if (this.draftManager)
			{
				this.draftManager.setQuotMessageInStore(editMessage, InputQuoteType.edit, editMessageText);
			}
		}

		/**
		 *
		 * @param {Array<number || string || Message>} messageIds
		 * @param {boolean} useInput
		 */
		startForwardingMessages(messageIds, useInput = true)
		{
			if (this.isAttachInProcess && useInput)
			{
				this.#resetAttachingFilesProcess();
			}

			if (this.isEditInProcess && useInput)
			{
				this.#isForwardInBackground = true;

				return;
			}

			this.#isForwardInProcess = true;
			this.setForwardMessages(messageIds);

			if (!useInput)
			{
				return;
			}

			const message = this.getForwardMessage();
			const title = message.username;
			const text = message.message[0]?.text;
			const params = {
				type: InputQuoteType.forward,
				openKeyboard: false,
				title,
				text,
			};
			this.dialogView.setInputQuote(message, params);
			this.dialogView.enableAlwaysSendButtonMode(true);
		}

		/**
		 * @param {Array<DeviceFile>} files
		 */
		startAttachingFiles(files)
		{
			const count = files.length;
			if (count === 0)
			{
				return;
			}

			if (this.isEditInProcess)
			{
				this.#resetEditingMessageProcess();
			}

			// Push active quote to background so it survives while attach is shown (AC-003/023/024).
			// If quote is already in background (e.g. behind edit), keep it there.
			if (this.isQuoteInProcess)
			{
				this.#isQuoteInProcess = false;
				this.#isQuoteInBackground = true;
			}

			if (this.isForwardInProcess)
			{
				this.#isForwardInProcess = false;
				this.#isForwardInBackground = false;
			}

			this.#isAttachInProcess = true;

			const params = {
				type: InputQuoteType.forward,
				title: this.#getAttachFileTitle(files),
				text: Loc.getMessagePlural('IMMOBILE_MESSENGER_DIALOG_REPLAY_MANAGER_ATTACHING_FILES_SUBTITLE', count, { '#COUNT#': count }),
				icon: {
					name: Icon.IMAGE.getIconName(),
					tintColor: Color.accentMainPrimaryalt.toHex(),
				},
			};

			this.attachFiles = files;
			this.dialogView.setInputQuote({}, params);
			this.dialogView.enableAlwaysSendButtonMode(true);
		}

		#resetAttachingFilesProcess()
		{
			this.attachFiles = null;
			this.#isAttachInProcess = false;
		}

		/**
		 * @desc Stable key of an attach file: disk id / url, name and size.
		 * @param {DeviceFile} file
		 * @return {string}
		 */
		#getAttachFileKey(file)
		{
			const id = file?.dataAttributes?.ID ?? file?.url ?? '';
			const name = file?.name ?? '';
			const size = file?.size ?? file?.dataAttributes?.SIZE ?? '';

			return `${id}:${name}:${size}`;
		}

		/**
		 * @desc Updates the client validation status of an attach file. Files without a status are
		 * treated as valid, so non-copilot chats are unaffected.
		 * @param {DeviceFile} file
		 * @param {string} status — one of AttachFileStatus
		 */
		setAttachFileStatus(file, status)
		{
			if (!Type.isArrayFilled(this.attachFiles))
			{
				return;
			}

			const key = this.#getAttachFileKey(file);
			const target = this.attachFiles.find((item) => this.#getAttachFileKey(item) === key);
			if (target)
			{
				target.status = status;
			}
		}

		/**
		 * @desc True when any attach file is still being checked or has failed client validation.
		 * Deliberate safety net: the copilot attach flow currently assigns only the valid status
		 * (files are filtered before attaching), so this gate is a no-op until a flow sets
		 * checking/error again.
		 * @return {boolean}
		 */
		hasBlockingAttachFiles()
		{
			if (!Type.isArrayFilled(this.attachFiles))
			{
				return false;
			}

			return this.attachFiles.some(
				(file) => file.status === AttachFileStatus.checking || file.status === AttachFileStatus.error,
			);
		}

		/**
		 * @param {boolean} restoreQuote — when true (default), restores a background quote after attach
		 *   completes (cancel-reply path). When false (send path), discards the background quote so the
		 *   next message is NOT accidentally sent as a reply to the same original message.
		 */
		finishAttachingFiles(restoreQuote = true)
		{
			this.#resetAttachingFilesProcess();
			this.dialogView.enableAlwaysSendButtonMode(false);

			return this.dialogView.removeInputQuote().then(() => {
				// Restore quote from background after attach completes (mirrors finishEditingMessage pattern).
				// When restoreQuote=false (send path), background quote is discarded instead of restored.
				if (this.isQuoteInBackground)
				{
					if (restoreQuote)
					{
						this.startQuotingMessage(this.getQuoteMessage());
					}
					else
					{
						this.#isQuoteInBackground = false;
						this.quoteMessage = null;
					}
				}
			});
		}

		finishQuotingMessage()
		{
			this.#isQuoteInProcess = false;
			this.draftManager.cancelReply(
				this.dialogView.getInput(),
			);

			return this.dialogView.removeInputQuote();
		}

		#resetEditingMessageProcess()
		{
			this.#inputTextBuffer = null;
			this.#isEditInProcess = false;
		}

		finishEditingMessage()
		{
			this.#isEditInProcess = false;
			this.dialogView.clearInput();
			this.draftManager.cancelEditingMessage();
			// the buffer is deliberately NOT reset here, unlike #resetEditingMessageProcess() and the quote
			// path above: MessageSender#isInputFieldBusy() tells the text returned into the field from text
			// the user typed by comparing the field against inputTextBuffer. Resetting it here requires a
			// paired change of that check, otherwise a failed edit loses the caption silently — the test
			// double repeats this behaviour, so the suite would stay green
			if (this.#inputTextBuffer !== null)
			{
				this.dialogView.setInput(this.#inputTextBuffer);
				this.draftManager.saveDraft(this.#inputTextBuffer);
			}

			this.dialogView.removeInputQuote().then(() => {
				if (this.isQuoteInBackground)
				{
					this.startQuotingMessage(this.getQuoteMessage());

					return;
				}

				if (this.isForwardInBackground)
				{
					this.startForwardingMessages(this.getForwardMessage());
				}
			});
		}

		/**
		 * @param {boolean} shouldClearInputActions
		 */
		finishForwardingMessage(shouldClearInputActions = true)
		{
			this.#isForwardInProcess = false;
			this.#isForwardInBackground = false;
			if (this.isQuoteInBackground)
			{
				this.#isQuoteInBackground = false;
			}

			this.dialogView.enableAlwaysSendButtonMode(false);

			if (!shouldClearInputActions)
			{
				return;
			}

			this.dialogView.clearInput();
			this.draftManager.clearDraft();
			this.dialogView.removeInputQuote();
		}

		initializeEditingMessage(message, initWithForward)
		{
			this.editMessage = message;

			this.#isEditInProcess = true;
			const params = {
				type: InputQuoteType.edit,
				openKeyboard: false,
			};
			this.dialogView.setInputQuote(message, params);
		}

		initializeQuotingMessage(message, initWithForward)
		{
			const quoteMessage = { ...message };
			this.#attachMediaPreview(quoteMessage, quoteMessage.id);
			this.quoteMessage = quoteMessage;
			if (initWithForward)
			{
				this.#isQuoteInBackground = true;

				return;
			}
			this.#isQuoteInProcess = true;
			const params = {
				type: InputQuoteType.reply,
				openKeyboard: false,
			};
			this.dialogView.setInputQuote(quoteMessage, params);
		}

		/**
		 * @desc Check is having reply id in the message
		 * @param {MessagesModelState} message
		 * @return {boolean}
		 */
		isHasQuote(message)
		{
			return Boolean(message.params?.replyId);
		}

		/**
		 * @param {Array<DeviceFile>} files
		 * @return {string}
		 */
		#getAttachFileTitle(files)
		{
			const extensions = files.map((file) => {
				const extension = getFileExtension(file.name).toLowerCase();

				return getFileTypeByExtension(extension);
			});

			const isSingleFile = extensions.length === 1;
			if (isSingleFile)
			{
				if (extensions[0] === FileType.video)
				{
					return Loc.getMessage('IMMOBILE_MESSENGER_DIALOG_REPLAY_MANAGER_ATTACHING_FILES_VIDEO_TITLE');
				}

				if (extensions[0] === FileType.image)
				{
					return Loc.getMessage('IMMOBILE_MESSENGER_DIALOG_REPLAY_MANAGER_ATTACHING_FILES_IMAGE_TITLE');
				}

				return Loc.getMessage('IMMOBILE_MESSENGER_DIALOG_REPLAY_MANAGER_ATTACHING_FILES_SINGLE_FILE_TITLE', {
					'#FILE_NAME#': files[0].name,
				});
			}

			const isMediaGallery = extensions.every((extension) => {
				return extension === FileType.image || extension === FileType.video;
			});

			if (isMediaGallery)
			{
				return Loc.getMessage('IMMOBILE_MESSENGER_DIALOG_REPLAY_MANAGER_ATTACHING_FILES_GALLERY_TITLE');
			}

			return Loc.getMessage('IMMOBILE_MESSENGER_DIALOG_REPLAY_MANAGER_ATTACHING_FILES_TITLE');
		}
	}

	module.exports = {
		ReplyManager,
	};
});
