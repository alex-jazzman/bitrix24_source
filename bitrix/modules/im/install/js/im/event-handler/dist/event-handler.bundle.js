/* eslint-disable */
this.BX = this.BX || {};
this.BX.Messenger = this.BX.Messenger || {};
(function (exports, main_core_events, im_const, im_lib_logger, im_lib_utils, im_lib_clipboard, im_lib_timer, im_lib_uploader, main_core) {
	'use strict';

	class SendMessageHandler {
		messagesToSend = [];
		store = null;
		restClient = null;
		loc = null;
		constructor($Bitrix) {
			this.controller = $Bitrix.Data.get('controller');
			this.store = this.controller.store;
			this.restClient = $Bitrix.RestClient.get();
			this.loc = $Bitrix.Loc.messages;
			this.onSendMessageHandler = this.onSendMessage.bind(this);
			this.onClickOnMessageRetryHandler = this.onClickOnMessageRetry.bind(this);
			this.onClickOnCommandHandler = this.onClickOnCommand.bind(this);
			this.onClickOnKeyboardHandler = this.onClickOnKeyboard.bind(this);
			main_core_events.EventEmitter.subscribe(im_const.EventType.textarea.sendMessage, this.onSendMessageHandler);
			main_core_events.EventEmitter.subscribe(im_const.EventType.dialog.clickOnMessageRetry, this.onClickOnMessageRetryHandler);
			main_core_events.EventEmitter.subscribe(im_const.EventType.dialog.clickOnCommand, this.onClickOnCommandHandler);
			main_core_events.EventEmitter.subscribe(im_const.EventType.dialog.clickOnKeyboardButton, this.onClickOnKeyboardHandler);
		}
		onSendMessage({
			data
		}) {
			if (!data.text && !data.file) {
				return false;
			}
			this.sendMessage(data.text, data.file);
		}
		//endregion events

		// entry point for sending message
		sendMessage(text = '', file = null) {
			if (!text && !file) {
				return false;
			}

			// quote handling
			const quoteId = this.store.getters['dialogues/getQuoteId'](this.getDialogId());
			if (quoteId) {
				const quoteMessage = this.store.getters['messages/getMessage'](this.getChatId(), quoteId);
				if (quoteMessage) {
					text = this.getMessageTextWithQuote(quoteMessage, text);
					main_core_events.EventEmitter.emit(im_const.EventType.dialog.quotePanelClose);
				}
			}
			if (!this.controller.application.isUnreadMessagesLoaded()) {
				// not all messages are loaded, adding message only on server
				this.sendMessageToServer({
					id: 0,
					chatId: this.getChatId(),
					dialogId: this.getDialogId(),
					text,
					file
				});
				this.processQueue();
				return true;
			}
			const params = {};
			if (file) {
				params.FILE_ID = [file.id];
			}
			this.addMessageToModel({
				text,
				params,
				sending: !file
			}).then(messageId => {
				main_core_events.EventEmitter.emit(im_const.EventType.dialog.scrollToBottom, {
					chatId: this.getChatId(),
					cancelIfScrollChange: true
				});
				this.addMessageToQueue({
					messageId,
					text,
					file
				});
				this.processQueue();
			});
		}

		/**
		 * Goes through messages queue:
		 * - For messages with file sends event to uploader
		 * - For common messages sends them to server
		 */
		processQueue() {
			this.messagesToSend.filter(element => !element.sending).forEach(element => {
				this.deleteFromQueue(element.id);
				element.sending = true;
				if (element.file) {
					main_core_events.EventEmitter.emit(im_const.EventType.textarea.stopWriting);
					main_core_events.EventEmitter.emit(im_const.EventType.uploader.addMessageWithFile, element);
				} else {
					this.sendMessageToServer(element);
				}
			});
		}
		addMessageToModel({
			text,
			params,
			sending
		}) {
			return this.store.dispatch('messages/add', {
				chatId: this.getChatId(),
				authorId: this.getUserId(),
				text,
				params,
				sending
			});
		}
		addMessageToQueue({
			messageId,
			text,
			file
		}) {
			this.messagesToSend.push({
				id: messageId,
				chatId: this.getChatId(),
				dialogId: this.getDialogId(),
				text,
				file,
				sending: false
			});
		}
		sendMessageToServer(element) {
			main_core_events.EventEmitter.emit(im_const.EventType.textarea.stopWriting);
			this.restClient.callMethod(im_const.RestMethod.imMessageAdd, {
				'TEMPLATE_ID': element.id,
				'DIALOG_ID': element.dialogId,
				'MESSAGE': element.text
			}, null, null).then(response => {
				this.controller.executeRestAnswer(im_const.RestMethodHandler.imMessageAdd, response, element);
			}).catch(error => {
				this.controller.executeRestAnswer(im_const.RestMethodHandler.imMessageAdd, error, element);
				im_lib_logger.Logger.warn('SendMessageHandler: error during adding message', error);
			});
		}
		onClickOnMessageRetry({
			data: event
		}) {
			this.retrySendMessage(event.message);
		}
		retrySendMessage(message) {
			this.addMessageToQueue({
				messageId: message.id,
				text: message.text,
				file: null
			});
			this.setSendingMessageFlag(message.id);
			this.processQueue();
		}
		setSendingMessageFlag(messageId) {
			this.store.dispatch('messages/actionStart', {
				id: messageId,
				chatId: this.getChatId()
			});
		}
		deleteFromQueue(messageId) {
			this.messagesToSend = this.messagesToSend.filter(element => element.id !== messageId);
		}
		onClickOnCommand({
			data: event
		}) {
			if (event.type === 'put') {
				this.handlePutAction(event.value);
			} else if (event.type === 'send') {
				this.handleSendAction(event.value);
			} else {
				im_lib_logger.Logger.warn('SendMessageHandler: Unprocessed command', event);
			}
		}
		onClickOnKeyboard({
			data: event
		}) {
			if (event.action === 'ACTION') {
				const {
					action,
					value
				} = event.params;
				this.handleKeyboardAction(action, value);
			}
			if (event.action === 'COMMAND') {
				const {
					dialogId,
					messageId,
					botId,
					command,
					params
				} = event.params;
				this.restClient.callMethod(im_const.RestMethod.imMessageCommand, {
					'MESSAGE_ID': messageId,
					'DIALOG_ID': dialogId,
					'BOT_ID': botId,
					'COMMAND': command,
					'COMMAND_PARAMS': params
				}).catch(error => console.error('SendMessageHandler: command processing error', error));
			}
		}
		handleKeyboardAction(action, value) {
			switch (action) {
				case 'SEND':
					{
						this.handleSendAction(value);
						break;
					}
				case 'PUT':
					{
						this.handlePutAction(value);
						break;
					}
				case 'CALL':
					{
						//this.openPhoneMenu(value);
						break;
					}
				case 'COPY':
					{
						im_lib_clipboard.Clipboard.copy(value);
						BX.UI.Notification.Center.notify({
							content: this.loc['IM_DIALOG_CLIPBOARD_COPY_SUCCESS'],
							autoHideDelay: 4000
						});
						break;
					}
				case 'DIALOG':
					{
						//this.openDialog(value);
						break;
					}
				default:
					{
						console.error('SendMessageHandler: unknown keyboard action');
					}
			}
		}
		handlePutAction(text) {
			main_core_events.EventEmitter.emit(im_const.EventType.textarea.insertText, {
				text: `${text} `
			});
		}
		handleSendAction(text) {
			this.sendMessage(text);
			setTimeout(() => {
				main_core_events.EventEmitter.emit(im_const.EventType.dialog.scrollToBottom, {
					chatId: this.getChatId(),
					duration: 300,
					cancelIfScrollChange: false
				});
			}, 300);
		}

		// region helpers
		getMessageTextWithQuote(quoteMessage, text) {
			let user = null;
			if (quoteMessage.authorId) {
				user = this.store.getters['users/get'](quoteMessage.authorId);
			}
			const files = this.store.getters['files/getList'](this.getChatId());
			const quoteDelimiter = '-'.repeat(54);
			const quoteTitle = user && user.name ? user.name : this.loc['IM_QUOTE_PANEL_DEFAULT_TITLE'];
			const quoteDate = im_lib_utils.Utils.date.format(quoteMessage.date, null, this.loc);
			const quoteContent = im_lib_utils.Utils.text.quote(quoteMessage.text, quoteMessage.params, files, this.loc);
			const message = [];
			message.push(quoteDelimiter);
			message.push(`${quoteTitle} [${quoteDate}]`);
			message.push(quoteContent);
			message.push(quoteDelimiter);
			message.push(text);
			return message.join("\n");
		}
		getChatId() {
			return this.store.state.application.dialog.chatId;
		}
		getDialogId() {
			return this.store.state.application.dialog.dialogId;
		}
		getUserId() {
			return this.store.state.application.common.userId;
		}
		// endregion helpers

		destroy() {
			main_core_events.EventEmitter.unsubscribe(im_const.EventType.textarea.sendMessage, this.onSendMessageHandler);
			main_core_events.EventEmitter.unsubscribe(im_const.EventType.dialog.clickOnMessageRetry, this.onClickOnMessageRetryHandler);
			main_core_events.EventEmitter.unsubscribe(im_const.EventType.dialog.clickOnCommand, this.onClickOnCommandHandler);
			main_core_events.EventEmitter.unsubscribe(im_const.EventType.dialog.clickOnKeyboardButton, this.onClickOnKeyboardHandler);
		}
	}

	class ReadingHandler {
		messagesToRead = {}; // {<chatId>: [<messageId>]}
		timer = null;
		store = null;
		restClient = null;
		constructor($Bitrix) {
			this.store = $Bitrix.Data.get('controller').store;
			this.restClient = $Bitrix.RestClient.get();
			this.timer = new im_lib_timer.Timer();
			this.onReadMessageHandler = this.onReadMessage.bind(this);
			main_core_events.EventEmitter.subscribe(im_const.EventType.dialog.readMessage, this.onReadMessageHandler);
		}
		onReadMessage({
			data: {
				id = null,
				skipTimer = false,
				skipAjax = false
			}
		}) {
			return this.readMessage(id, skipTimer, skipAjax);
		}
		readMessage(messageId, skipTimer = false, skipAjax = false) {
			const chatId = this.getChatId();
			if (messageId) {
				if (!this.messagesToRead[chatId]) {
					this.messagesToRead[chatId] = [];
				}
				this.messagesToRead[chatId].push(Number.parseInt(messageId, 10));
			}
			this.timer.stop('readMessage', chatId, true);
			this.timer.stop('readMessageServer', chatId, true);
			if (skipTimer) {
				return this.processMessagesToRead(chatId, skipAjax);
			}
			return new Promise((resolve, reject) => {
				this.timer.start('readMessage', chatId, 0.1, () => {
					this.processMessagesToRead(chatId, skipAjax).then(result => resolve(result)).catch(reject);
				});
			});
		}
		processMessagesToRead(chatId, skipAjax = false) {
			const lastMessageToRead = this.getMaxMessageIdFromQueue(chatId);
			delete this.messagesToRead[chatId];
			if (lastMessageToRead <= 0) {
				return Promise.resolve();
			}
			return new Promise((resolve, reject) => {
				this.readMessageOnClient(chatId, lastMessageToRead).then(readResult => {
					return this.decreaseChatCounter(chatId, readResult.count);
				}).then(() => {
					if (skipAjax) {
						return resolve({
							chatId,
							lastId: lastMessageToRead
						});
					}
					this.timer.start('readMessageServer', chatId, 0.5, () => {
						this.readMessageOnServer(chatId, lastMessageToRead).then(() => {
							resolve({
								chatId,
								lastId: lastMessageToRead
							});
						}).catch(reject);
					});
				}).catch(error => {
					im_lib_logger.Logger.error('Reading messages error', error);
					reject();
				});
			});
		}
		getMaxMessageIdFromQueue(chatId) {
			let maxMessageId = 0;
			if (!this.messagesToRead[chatId]) {
				return maxMessageId;
			}
			this.messagesToRead[chatId].forEach(messageId => {
				if (maxMessageId < messageId) {
					maxMessageId = messageId;
				}
			});
			return maxMessageId;
		}
		readMessageOnClient(chatId, lastMessageToRead) {
			return this.store.dispatch('messages/readMessages', {
				chatId: chatId,
				readId: lastMessageToRead
			});
		}
		readMessageOnServer(chatId, lastMessageToRead) {
			return this.restClient.callMethod(im_const.RestMethod.imDialogRead, {
				'DIALOG_ID': this.getDialogIdByChatId(chatId),
				'MESSAGE_ID': lastMessageToRead
			});
		}
		decreaseChatCounter(chatId, counter) {
			return this.store.dispatch('dialogues/decreaseCounter', {
				dialogId: this.getDialogIdByChatId(chatId),
				count: counter
			});
		}
		getChatId() {
			return this.store.state.application.dialog.chatId;
		}
		getDialogIdByChatId(chatId) {
			const dialog = this.store.getters['dialogues/getByChatId'](chatId);
			if (!dialog) {
				return 0;
			}
			return dialog.dialogId;
		}
		getDialogId() {
			return this.store.state.application.dialog.dialogId;
		}
		destroy() {
			main_core_events.EventEmitter.unsubscribe(im_const.EventType.dialog.readMessage, this.onReadMessageHandler);
		}
	}

	class ReactionHandler {
		static types = {
			none: 'none',
			like: 'like',
			kiss: 'kiss',
			laugh: 'laugh',
			wonder: 'wonder',
			cry: 'cry',
			angry: 'angry'
		};
		static actions = {
			auto: 'auto',
			plus: 'plus',
			minus: 'minus',
			set: 'set'
		};
		constructor($Bitrix) {
			this.store = $Bitrix.Data.get('controller').store;
			this.restClient = $Bitrix.RestClient.get();
			this.onSetMessageReactionHandler = this.onSetMessageReaction.bind(this);
			this.onOpenMessageReactionListHandler = this.onOpenMessageReactionList.bind(this);
			main_core_events.EventEmitter.subscribe(im_const.EventType.dialog.setMessageReaction, this.onSetMessageReactionHandler);
			main_core_events.EventEmitter.subscribe(im_const.EventType.dialog.openMessageReactionList, this.onOpenMessageReactionListHandler);
		}
		onSetMessageReaction({
			data
		}) {
			this.reactToMessage(data.message.id, data.reaction);
		}
		onOpenMessageReactionList({
			data
		}) {
			this.openMessageReactionList(data.message.id, data.values);
		}
		reactToMessage(messageId, reaction) {
			// let type = reaction.type || ReactionHandler.types.like;
			let action = reaction.action || ReactionHandler.actions.auto;
			if (action !== ReactionHandler.actions.auto) {
				action = action === ReactionHandler.actions.set ? ReactionHandler.actions.plus : ReactionHandler.actions.minus;
			}
			this.restClient.callMethod(im_const.RestMethod.imMessageLike, {
				'MESSAGE_ID': messageId,
				'ACTION': action
			});
		}
		openMessageReactionList(messageId, values) {
			im_lib_logger.Logger.warn('Message reaction list not implemented yet!', messageId, values);
		}
		destroy() {
			main_core_events.EventEmitter.unsubscribe(im_const.EventType.dialog.setMessageReaction, this.onSetMessageReactionHandler);
			main_core_events.EventEmitter.unsubscribe(im_const.EventType.dialog.openMessageReactionList, this.onOpenMessageReactionListHandler);
		}
	}

	class QuoteHandler {
		constructor($Bitrix) {
			this.store = $Bitrix.Data.get('controller').store;
			this.onQuoteMessageHandler = this.onQuoteMessage.bind(this);
			this.onQuotePanelCloseHandler = this.onQuotePanelClose.bind(this);
			main_core_events.EventEmitter.subscribe(im_const.EventType.dialog.quoteMessage, this.onQuoteMessageHandler);
			main_core_events.EventEmitter.subscribe(im_const.EventType.dialog.quotePanelClose, this.onQuotePanelCloseHandler);
		}
		onQuoteMessage({
			data
		}) {
			this.quoteMessage(data.message.id);
		}
		onQuotePanelClose() {
			this.clearQuote();
		}
		quoteMessage(messageId) {
			this.store.dispatch('dialogues/update', {
				dialogId: this.getDialogId(),
				fields: {
					quoteId: messageId
				}
			});
		}
		clearQuote() {
			this.store.dispatch('dialogues/update', {
				dialogId: this.getDialogId(),
				fields: {
					quoteId: 0
				}
			});
		}
		getDialogId() {
			return this.store.state.application.dialog.dialogId;
		}
		destroy() {
			main_core_events.EventEmitter.unsubscribe(im_const.EventType.dialog.quoteMessage, this.onQuoteMessageHandler);
			main_core_events.EventEmitter.unsubscribe(im_const.EventType.dialog.quotePanelClose, this.onQuotePanelCloseHandler);
		}
	}

	class TextareaHandler {
		store = null;
		restClient = null;
		timer = null;
		constructor($Bitrix) {
			this.store = $Bitrix.Data.get('controller').store;
			this.restClient = $Bitrix.RestClient.get();
			this.timer = new im_lib_timer.Timer();
			this.subscribeToEvents();
		}

		// region events
		subscribeToEvents() {
			this.onStartWritingHandler = this.onStartWriting.bind(this);
			this.onStopWritingHandler = this.onStopWriting.bind(this);
			this.onAppButtonClickHandler = this.onAppButtonClick.bind(this);
			this.onFocusHandler = this.onFocus.bind(this);
			this.onBlurHandler = this.onBlur.bind(this);
			this.onKeyUpHandler = this.onKeyUp.bind(this);
			this.onEditHandler = this.onEdit.bind(this);
			main_core_events.EventEmitter.subscribe(im_const.EventType.textarea.startWriting, this.onStartWritingHandler);
			main_core_events.EventEmitter.subscribe(im_const.EventType.textarea.stopWriting, this.onStopWritingHandler);
			main_core_events.EventEmitter.subscribe(im_const.EventType.textarea.appButtonClick, this.onAppButtonClickHandler);
			main_core_events.EventEmitter.subscribe(im_const.EventType.textarea.focus, this.onFocusHandler);
			main_core_events.EventEmitter.subscribe(im_const.EventType.textarea.blur, this.onBlurHandler);
			main_core_events.EventEmitter.subscribe(im_const.EventType.textarea.keyUp, this.onKeyUpHandler);
			main_core_events.EventEmitter.subscribe(im_const.EventType.textarea.edit, this.onEditHandler);
		}
		onStartWriting() {
			this.startWriting();
		}
		onStopWriting() {
			this.stopWriting();
		}
		onAppButtonClick() {
			//
		}
		onFocus() {
			//
		}
		onBlur() {
			//
		}
		onKeyUp() {
			//
		}
		onEdit() {
			//
		}
		//endregion events

		// region writing
		startWriting(dialogId = this.getDialogId()) {
			if (im_lib_utils.Utils.dialog.isEmptyDialogId(dialogId) || this.timer.has('writes', dialogId)) {
				return false;
			}
			this.timer.start('writes', dialogId, 28);
			this.timer.start('writesSend', dialogId, 5, () => {
				this.restClient.callMethod(im_const.RestMethod.imDialogWriting, {
					'DIALOG_ID': dialogId
				}).catch(() => {
					this.timer.stop('writes', dialogId);
				});
			});
		}
		stopWriting(dialogId = this.getDialogId()) {
			this.timer.stop('writes', dialogId, true);
			this.timer.stop('writesSend', dialogId, true);
		}
		// endregion writing

		// region helpers
		getChatId() {
			return this.store.state.application.dialog.chatId;
		}
		getDialogId() {
			return this.store.state.application.dialog.dialogId;
		}
		getUserId() {
			return this.store.state.application.common.userId;
		}
		getDiskFolderId() {
			return this.store.state.application.dialog.diskFolderId;
		}
		// endregion helpers

		destroy() {
			main_core_events.EventEmitter.unsubscribe(im_const.EventType.textarea.startWriting, this.onStartWritingHandler);
			main_core_events.EventEmitter.unsubscribe(im_const.EventType.textarea.stopWriting, this.onStopWritingHandler);
			main_core_events.EventEmitter.unsubscribe(im_const.EventType.textarea.appButtonClick, this.onAppButtonClickHandler);
			main_core_events.EventEmitter.unsubscribe(im_const.EventType.textarea.focus, this.onFocusHandler);
			main_core_events.EventEmitter.unsubscribe(im_const.EventType.textarea.blur, this.onBlurHandler);
			main_core_events.EventEmitter.unsubscribe(im_const.EventType.textarea.keyUp, this.onKeyUpHandler);
			main_core_events.EventEmitter.unsubscribe(im_const.EventType.textarea.edit, this.onEditHandler);
		}
	}

	/**
	 * @notice define getActionUploadChunk and getActionCommitFile methods for custom upload methods (e.g. videoconference)
	 * @notice redefine addMessageWithFile for custom headers (e.g. videoconference)
	 */
	class TextareaUploadHandler {
		controller = null;
		restClient = null;
		uploader = null;
		isRequestingDiskFolderId = false;
		constructor($Bitrix) {
			this.controller = $Bitrix.Data.get('controller');
			this.restClient = $Bitrix.RestClient.get();
			this.initUploader();
			this.onTextareaFileSelectedHandler = this.onTextareaFileSelected.bind(this);
			this.addMessageWithFileHandler = this.addMessageWithFile.bind(this);
			this.onClickOnUploadCancelHandler = this.onClickOnUploadCancel.bind(this);
			main_core_events.EventEmitter.subscribe(im_const.EventType.textarea.fileSelected, this.onTextareaFileSelectedHandler);
			main_core_events.EventEmitter.subscribe(im_const.EventType.uploader.addMessageWithFile, this.addMessageWithFileHandler);
			main_core_events.EventEmitter.subscribe(im_const.EventType.dialog.clickOnUploadCancel, this.onClickOnUploadCancelHandler);
		}
		initUploader() {
			this.uploader = new im_lib_uploader.Uploader({
				generatePreview: true,
				sender: this.getUploaderSenderOptions()
			});
			this.uploader.subscribe('onStartUpload', this.onStartUploadHandler.bind(this));
			this.uploader.subscribe('onProgress', this.onProgressHandler.bind(this));
			this.uploader.subscribe('onSelectFile', this.onSelectFileHandler.bind(this));
			this.uploader.subscribe('onComplete', this.onCompleteHandler.bind(this));
			this.uploader.subscribe('onUploadFileError', this.onUploadFileErrorHandler.bind(this));
			this.uploader.subscribe('onCreateFileError', this.onCreateFileErrorHandler.bind(this));
		}
		commitFile(params, message) {
			this.restClient.callMethod(im_const.RestMethod.imDiskFileCommit, {
				chat_id: params.chatId,
				upload_id: params.uploadId,
				message: params.messageText,
				template_id: params.messageId,
				file_template_id: params.fileId
			}, null, null).then(response => {
				this.controller.executeRestAnswer(im_const.RestMethodHandler.imDiskFileCommit, response, message);
			}).catch(error => {
				this.controller.executeRestAnswer(im_const.RestMethodHandler.imDiskFileCommit, error, message);
			});
			return true;
		}
		setUploadError(chatId, fileId, messageId = 0) {
			this.controller.store.dispatch('files/update', {
				chatId: chatId,
				id: fileId,
				fields: {
					status: im_const.FileStatus.error,
					progress: 0
				}
			});
			if (messageId) {
				this.controller.store.dispatch('messages/actionError', {
					chatId: chatId,
					id: messageId,
					retry: false
				});
			}
		}
		onTextareaFileSelected({
			data: event
		}) {
			const fileInput = event && event.fileChangeEvent && event.fileChangeEvent.target.files.length > 0 ? event.fileChangeEvent : '';
			if (!fileInput) {
				return false;
			}
			this.uploadFile(fileInput);
		}
		addMessageWithFile(event) {
			const message = event.getData();
			if (!this.getDiskFolderId()) {
				this.requestDiskFolderId(message.chatId).then(() => {
					this.addMessageWithFile(event);
				}).catch(error => {
					im_lib_logger.Logger.error('addMessageWithFile error', error);
					return false;
				});
				return false;
			}
			this.uploader.addTask({
				taskId: message.file.id,
				fileData: message.file.source.file,
				fileName: message.file.source.file.name,
				generateUniqueName: true,
				diskFolderId: this.getDiskFolderId(),
				previewBlob: message.file.previewBlob
			});
		}
		uploadFile(event) {
			if (!event) {
				return false;
			}
			this.uploader.addFilesFromEvent(event);
		}
		destroy() {
			if (this.uploader) {
				this.uploader.unsubscribeAll();
			}
			main_core_events.EventEmitter.unsubscribe(im_const.EventType.textarea.fileSelected, this.onTextareaFileSelectedHandler);
			main_core_events.EventEmitter.unsubscribe(im_const.EventType.uploader.addMessageWithFile, this.addMessageWithFileHandler);
			main_core_events.EventEmitter.unsubscribe(im_const.EventType.dialog.clickOnUploadCancel, this.onClickOnUploadCancelHandler);
		}
		getChatId() {
			return this.controller.store.state.application.dialog.chatId;
		}
		getDialogId() {
			return this.controller.store.state.application.dialog.dialogId;
		}
		getDiskFolderId() {
			return this.controller.store.state.application.dialog.diskFolderId;
		}
		getCurrentUser() {
			return this.controller.store.getters['users/get'](this.controller.store.state.application.common.userId, true);
		}
		getMessageByFileId(fileId, eventData) {
			const chatMessages = this.controller.store.getters['messages/get'](this.getChatId());
			const messageWithFile = chatMessages.find(message => {
				if (main_core.Type.isArray(message.params?.FILE_ID)) {
					return message.params.FILE_ID.includes(fileId);
				}
				return false;
			});
			if (!messageWithFile) {
				return;
			}
			return {
				id: messageWithFile.id,
				chatId: messageWithFile.chatId,
				dialogId: this.getDialogId(),
				text: messageWithFile.text,
				file: {
					id: fileId,
					source: eventData,
					previewBlob: eventData.previewData
				},
				sending: true
			};
		}
		requestDiskFolderId(chatId) {
			return new Promise((resolve, reject) => {
				if (this.isRequestingDiskFolderId || this.getDiskFolderId()) {
					this.isRequestingDiskFolderId = false;
					resolve();
					return;
				}
				this.isRequestingDiskFolderId = true;
				this.restClient.callMethod(im_const.RestMethod.imDiskFolderGet, {
					chat_id: chatId
				}).then(response => {
					this.isRequestingDiskFolderId = false;
					this.controller.executeRestAnswer(im_const.RestMethodHandler.imDiskFolderGet, response);
					resolve();
				}).catch(error => {
					this.isRequestingDiskFolderId = false;
					this.controller.executeRestAnswer(im_const.RestMethodHandler.imDiskFolderGet, error);
					reject(error);
				});
			});
		}

		// Uploader handlers
		onStartUploadHandler(event) {
			const eventData = event.getData();
			im_lib_logger.Logger.log('Uploader: onStartUpload', eventData);
			this.controller.store.dispatch('files/update', {
				chatId: this.getChatId(),
				id: eventData.id,
				fields: {
					status: im_const.FileStatus.upload,
					progress: 0
				}
			});
		}
		onProgressHandler(event) {
			const eventData = event.getData();
			im_lib_logger.Logger.log('Uploader: onProgress', eventData);
			this.controller.store.dispatch('files/update', {
				chatId: this.getChatId(),
				id: eventData.id,
				fields: {
					status: im_const.FileStatus.upload,
					progress: eventData.progress === 100 ? 99 : eventData.progress
				}
			});
		}
		onSelectFileHandler(event) {
			const eventData = event.getData();
			const file = eventData.file;
			im_lib_logger.Logger.log('Uploader: onSelectFile', eventData);
			let fileType = 'file';
			if (file.type.toString().startsWith('image')) {
				fileType = 'image';
			} else if (file.type.toString().startsWith('video')) {
				fileType = 'video';
			}
			this.controller.store.dispatch('files/add', {
				chatId: this.getChatId(),
				authorId: this.getCurrentUser().id,
				name: file.name,
				type: fileType,
				extension: file.name.split('.').splice(-1)[0],
				size: file.size,
				image: !eventData.previewData ? false : {
					width: eventData.previewDataWidth,
					height: eventData.previewDataHeight
				},
				status: im_const.FileStatus.progress,
				progress: 0,
				authorName: this.getCurrentUser().name,
				urlPreview: eventData.previewData ? URL.createObjectURL(eventData.previewData) : ''
			}).then(fileId => {
				main_core_events.EventEmitter.emit(im_const.EventType.textarea.sendMessage, {
					text: '',
					file: {
						id: fileId,
						source: eventData,
						previewBlob: eventData.previewData
					}
				});
			});
		}
		onCompleteHandler(event) {
			const eventData = event.getData();
			im_lib_logger.Logger.log('Uploader: onComplete', eventData);
			this.controller.store.dispatch('files/update', {
				chatId: this.getChatId(),
				id: eventData.id,
				fields: {
					status: im_const.FileStatus.wait,
					progress: 100
				}
			});
			const messageWithFile = this.getMessageByFileId(eventData.id, eventData);
			const fileType = this.controller.store.getters['files/get'](this.getChatId(), messageWithFile.file.id, true).type;
			this.commitFile({
				chatId: this.getChatId(),
				uploadId: eventData.result.data.file.id,
				messageText: messageWithFile.text,
				messageId: messageWithFile.id,
				fileId: messageWithFile.file.id,
				fileType
			}, messageWithFile);
		}
		onUploadFileErrorHandler(event) {
			const eventData = event.getData();
			im_lib_logger.Logger.log('Uploader: onUploadFileError', eventData);
			const messageWithFile = this.getMessageByFileId(eventData.id, eventData);
			if (messageWithFile) {
				this.setUploadError(this.getChatId(), messageWithFile.file.id, messageWithFile.id);
			}
		}
		onCreateFileErrorHandler(event) {
			const eventData = event.getData();
			im_lib_logger.Logger.log('Uploader: onCreateFileError', eventData);
			const messageWithFile = this.getMessageByFileId(eventData.id, eventData);
			if (messageWithFile) {
				this.setUploadError(this.getChatId(), messageWithFile.file.id, messageWithFile.id);
			}
		}
		onClickOnUploadCancel({
			data: event
		}) {
			const fileId = event.file.id;
			const fileData = event.file;
			const messageWithFile = this.getMessageByFileId(fileId, fileData);
			if (!messageWithFile) {
				return;
			}
			this.uploader.deleteTask(fileId);
			this.controller.store.dispatch('messages/delete', {
				chatId: this.getChatId(),
				id: messageWithFile.id
			}).then(() => {
				this.controller.store.dispatch('files/delete', {
					chatId: this.getChatId(),
					id: messageWithFile.file.id
				});
			});
		}
		getActionCommitFile() {
			return null;
		}
		getActionUploadChunk() {
			return null;
		}
		getUploaderSenderOptions() {
			return {
				actionUploadChunk: this.getActionUploadChunk(),
				actionCommitFile: this.getActionCommitFile()
			};
		}
	}

	class TextareaDragHandler extends main_core_events.EventEmitter {
		static events = {
			onHeightChange: 'onHeightChange',
			onStopDrag: 'onStopDrag'
		};
		isDragging = false;
		minimumHeight = 120;
		maximumHeight = 400;
		constructor(events) {
			super();
			this.setEventNamespace('BX.IM.TextareaDragHandler');
			this.subscribeToEvents(events);
			if (im_lib_utils.Utils.device.isMobile()) {
				this.maximumHeight = 200;
			}
		}
		subscribeToEvents(configEvents) {
			const events = main_core.Type.isObject(configEvents) ? configEvents : {};
			Object.entries(events).forEach(([name, callback]) => {
				if (main_core.Type.isFunction(callback)) {
					this.subscribe(name, callback);
				}
			});
		}
		onStartDrag(event, currentHeight) {
			if (this.isDragging) {
				return;
			}
			this.isDragging = true;
			event = event.changedTouches ? event.changedTouches[0] : event;
			this.textareaDragCursorStartPoint = event.clientY;
			this.textareaDragHeightStartPoint = currentHeight;
			this.addTextareaDragEvents();
		}
		onTextareaContinueDrag(event) {
			if (!this.isDragging) {
				return;
			}
			event = event.changedTouches ? event.changedTouches[0] : event;
			this.textareaDragCursorControlPoint = event.clientY;
			const maxPoint = Math.min(this.textareaDragHeightStartPoint + this.textareaDragCursorStartPoint - this.textareaDragCursorControlPoint, this.maximumHeight);
			const newTextareaHeight = Math.max(maxPoint, this.minimumHeight);
			this.emit(TextareaDragHandler.events.onHeightChange, {
				newHeight: newTextareaHeight
			});
		}
		onTextareaStopDrag() {
			if (!this.isDragging) {
				return;
			}
			this.isDragging = false;
			this.removeTextareaDragEvents();
			this.emit(TextareaDragHandler.events.onStopDrag);
		}
		addTextareaDragEvents() {
			this.onContinueDragHandler = this.onTextareaContinueDrag.bind(this);
			this.onStopDragHandler = this.onTextareaStopDrag.bind(this);
			document.addEventListener('mousemove', this.onContinueDragHandler);
			document.addEventListener('touchmove', this.onContinueDragHandler);
			document.addEventListener('touchend', this.onStopDragHandler);
			document.addEventListener('mouseup', this.onStopDragHandler);
			document.addEventListener('mouseleave', this.onStopDragHandler);
		}
		removeTextareaDragEvents() {
			document.removeEventListener('mousemove', this.onContinueDragHandler);
			document.removeEventListener('touchmove', this.onContinueDragHandler);
			document.removeEventListener('touchend', this.onStopDragHandler);
			document.removeEventListener('mouseup', this.onStopDragHandler);
			document.removeEventListener('mouseleave', this.onStopDragHandler);
		}
		destroy() {
			this.removeTextareaDragEvents();
		}
	}

	class DialogActionHandler {
		restClient = null;
		constructor($Bitrix) {
			this.restClient = $Bitrix.RestClient.get();
			this.subscribeToEvents();
		}
		subscribeToEvents() {
			this.clickOnMentionHandler = this.onClickOnMention.bind(this);
			this.clickOnUserNameHandler = this.onClickOnUserName.bind(this);
			this.clickOnMessageMenuHandler = this.onClickOnMessageMenu.bind(this);
			this.clickOnReadListHandler = this.onClickOnReadList.bind(this);
			this.clickOnChatTeaserHandler = this.onClickOnChatTeaser.bind(this);
			this.clickOnDialogHandler = this.onClickOnDialog.bind(this);
			main_core_events.EventEmitter.subscribe(im_const.EventType.dialog.clickOnMention, this.clickOnMentionHandler);
			main_core_events.EventEmitter.subscribe(im_const.EventType.dialog.clickOnUserName, this.clickOnUserNameHandler);
			main_core_events.EventEmitter.subscribe(im_const.EventType.dialog.clickOnMessageMenu, this.clickOnMessageMenuHandler);
			main_core_events.EventEmitter.subscribe(im_const.EventType.dialog.clickOnReadList, this.clickOnReadListHandler);
			main_core_events.EventEmitter.subscribe(im_const.EventType.dialog.clickOnChatTeaser, this.clickOnChatTeaserHandler);
			main_core_events.EventEmitter.subscribe(im_const.EventType.dialog.clickOnDialog, this.clickOnDialogHandler);
		}
		onClickOnMention({
			data: event
		}) {
			if (event.type === 'USER') {
				im_lib_logger.Logger.warn('DialogActionHandler: open user profile', event);
			} else if (event.type === 'CHAT') {
				im_lib_logger.Logger.warn('DialogActionHandler: open dialog from mention click', event);
			} else if (event.type === 'CALL') {
				im_lib_logger.Logger.warn('DialogActionHandler: open phone menu', event);
			}
		}
		onClickOnUserName({
			data: event
		}) {
			main_core_events.EventEmitter.emit(im_const.EventType.textarea.insertText, {
				text: `${event.user.name}, `
			});
		}
		onClickOnMessageMenu({
			data: event
		}) {
			im_lib_logger.Logger.warn('DialogActionHandler: open message menu', event);
		}
		onClickOnReadList({
			data: event
		}) {
			im_lib_logger.Logger.warn('DialogActionHandler: open read list', event);
		}
		onClickOnChatTeaser({
			data: event
		}) {
			this.joinParentChat(event.message.id, `chat${event.message.params.CHAT_ID}`).then(dialogId => {
				im_lib_logger.Logger.warn('DialogActionHandler: open dialog from teaser click', dialogId);
			}).catch(error => {
				console.error('DialogActionHandler: error joining parent chat', error);
			});
		}
		onClickOnDialog() {
			im_lib_logger.Logger.warn('DialogActionHandler: click on dialog');
		}
		joinParentChat(messageId, dialogId) {
			return new Promise((resolve, reject) => {
				if (!messageId || !dialogId) {
					return reject();
				}

				// TODO: what is this for
				if (typeof this.tempJoinChat === 'undefined') {
					this.tempJoinChat = {};
				} else if (this.tempJoinChat['wait']) {
					return reject();
				}
				this.tempJoinChat['wait'] = true;
				this.restClient.callMethod(im_const.RestMethod.imChatParentJoin, {
					'DIALOG_ID': dialogId,
					'MESSAGE_ID': messageId
				}).then(() => {
					this.tempJoinChat['wait'] = false;
					this.tempJoinChat[dialogId] = true;
					return resolve(dialogId);
				}).catch(() => {
					this.tempJoinChat['wait'] = false;
					return reject();
				});
			});
		}
		unsubscribeEvents() {
			main_core_events.EventEmitter.unsubscribe(im_const.EventType.dialog.clickOnMention, this.clickOnMentionHandler);
			main_core_events.EventEmitter.unsubscribe(im_const.EventType.dialog.clickOnUserName, this.clickOnUserNameHandler);
			main_core_events.EventEmitter.unsubscribe(im_const.EventType.dialog.clickOnMessageMenu, this.clickOnMessageMenuHandler);
			main_core_events.EventEmitter.unsubscribe(im_const.EventType.dialog.clickOnReadList, this.clickOnReadListHandler);
			main_core_events.EventEmitter.unsubscribe(im_const.EventType.dialog.clickOnChatTeaser, this.clickOnChatTeaserHandler);
			main_core_events.EventEmitter.unsubscribe(im_const.EventType.dialog.clickOnDialog, this.clickOnDialogHandler);
		}
		destroy() {
			this.unsubscribeEvents();
		}
	}

	// fix for compatible with mobile, bug #169468
	const namespace = main_core.Reflection.getClass('BX.Messenger');
	if (namespace) {
		namespace.ReadingHandler = ReadingHandler;
		namespace.ReactionHandler = ReactionHandler;
		namespace.QuoteHandler = QuoteHandler;
	}

	exports.DialogActionHandler = DialogActionHandler;
	exports.QuoteHandler = QuoteHandler;
	exports.ReactionHandler = ReactionHandler;
	exports.ReadingHandler = ReadingHandler;
	exports.SendMessageHandler = SendMessageHandler;
	exports.TextareaDragHandler = TextareaDragHandler;
	exports.TextareaHandler = TextareaHandler;
	exports.TextareaUploadHandler = TextareaUploadHandler;

})(this.BX.Messenger.EventHandler = this.BX.Messenger.EventHandler || {}, BX.Event, BX.Messenger.Const, BX.Messenger.Lib, BX.Messenger.Lib, BX.Messenger.Lib, BX.Messenger.Lib, BX.Messenger.Lib, BX);
//# sourceMappingURL=event-handler.bundle.js.map
