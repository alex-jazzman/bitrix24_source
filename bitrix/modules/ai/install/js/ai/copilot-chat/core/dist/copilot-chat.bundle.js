/* eslint-disable */
this.BX = this.BX || {};
this.BX.AI = this.BX.AI || {};
this.BX.AI.CopilotChat = this.BX.AI.CopilotChat || {};
(function (exports, main_core, main_core_events, ai_copilotChat_ui, pull_client) {
	'use strict';

	class CopilotChatApi extends main_core_events.EventEmitter {
		#scenarioCode;
		#entityType;
		#entityId;
		#chatId;
		#initChatExtraOptions;
		constructor(options) {
			super(options);
			this.setEventNamespace('AI.CopilotChatAPI');
			this.#scenarioCode = options.scenarioCode;
			this.#entityType = options.entityType;
			this.#entityId = options.entityId;
			this.#chatId = options.chatId;
			this.#initChatExtraOptions = options.initChatExtraOptions ?? {};
			this.#initPull();
		}
		async #initPull() {
			try {
				await pull_client.PULL.start();
				pull_client.PULL.subscribe({
					type: pull_client.PullClient.SubscriptionType.Server,
					moduleId: 'ai',
					callback: data => {
						if (data.command === CopilotChatApiPullEvents.NEW_MESSAGE) {
							this.#handleNewMessageEvent(data.params);
						} else if (data.command === CopilotChatApiPullEvents.INPUT_STATUS_CHANGED) {
							this.#handleInputStatusChangedEvent(data.params);
						}
					}
				});
			} catch (e) {
				console.error(e);
			}
		}
		#handleNewMessageEvent(data) {
			if (data.message.chatId !== this.#chatId) {
				return;
			}
			this.emit(CopilotChatApiEvents.NEW_MESSAGE, data);
		}
		#handleInputStatusChangedEvent(data) {
			this.emit(CopilotChatApiEvents.INPUT_STATUS_CHANGED, data);
		}
		async initChatData() {
			const data = {
				scenarioCode: this.#scenarioCode,
				entityType: this.#entityType,
				entityId: this.#entityId,
				parameters: this.#initChatExtraOptions
			};
			if (this.#chatId) {
				data.chatId = this.#chatId;
			}
			const result = await main_core.ajax.runAction('ai.chat.init', {
				data
			});
			data.chatId = result.data.chat.id;
			this.emit(CopilotChatApiEvents.INIT_CHAT, data);
			this.#chatId = result.data.chat.id;
			return result.data;
		}
		async sendMessage(messageData) {
			const data = {
				messageData,
				scenarioCode: this.#scenarioCode,
				chatId: this.#chatId
			};
			const result = await main_core.ajax.runAction('ai.chat.sendMessage', {
				data
			});
			return result.data;
		}
		async loadMessages(offsetMessageId) {
			const result = await main_core.ajax.runAction('ai.chat.getMessages', {
				data: {
					chatId: this.#chatId,
					offsetMessageId,
					limit: 20
				}
			});
			return result.data.messages ?? [];
		}
	}
	const CopilotChatApiEvents = {
		INIT_CHAT: 'initChat',
		NEW_MESSAGE: 'newMessage',
		INPUT_STATUS_CHANGED: 'InputStatusChangedEvent'
	};
	const CopilotChatApiPullEvents = Object.freeze({
		NEW_MESSAGE: 'newMessage',
		INPUT_STATUS_CHANGED: 'InputStatusChanged'
	});

	class CopilotChat extends main_core_events.EventEmitter {
		#chatInstance;
		#scenarioCode;
		#entityType;
		#entityId;
		#chatOptions;
		#chatAPI;
		#isHistoryFetched = false;
		#isLoadAllMessages = false;
		constructor(options) {
			super(options);
			this.setEventNamespace('AI.CopilotChat');
			this.#validateOptions(options);
			this.#scenarioCode = options.scenarioCode;
			this.#entityType = options.entityType;
			this.#entityId = options.entityId;
			this.#chatOptions = options.chatOptions;
			this.#chatAPI = new CopilotChatApi({
				chatId: options.chatId || null,
				scenarioCode: this.#scenarioCode,
				entityType: this.#entityType,
				entityId: this.#entityId,
				initChatExtraOptions: options.initChatExtraOptions ?? {}
			});
			this.#initChatInstance();
		}
		show() {
			this.#chatInstance.show();
			if (this.#isHistoryFetched === false) {
				this.#initChat();
			}
		}
		hide() {
			this.#chatInstance?.hide();
		}
		isShown() {
			return Boolean(this.#chatInstance?.isShown());
		}
		#initChatInstance() {
			this.#chatInstance = new ai_copilotChat_ui.CopilotChat({
				showCopilotWarningMessage: true,
				useChatStatus: true,
				scrollToTheEndAfterFirstShow: true,
				...this.#chatOptions
			});
			this.#chatInstance.subscribe(ai_copilotChat_ui.CopilotChatEvents.ADD_USER_MESSAGE, async event => {
				const message = event.getData().message;
				this.#sendMessage(message);
			});
			this.#chatInstance.subscribe(ai_copilotChat_ui.CopilotChatEvents.RETRY_LOAD_HISTORY, async event => {
				this.#initChat();
			});
			this.#chatInstance.subscribe(ai_copilotChat_ui.CopilotChatEvents.MESSAGES_SCROLL_TOP, async () => {
				if (this.#chatInstance.isOldMessagesLoading() || this.#isLoadAllMessages) {
					return;
				}
				await this.#loadOldMessages();
			});
			this.#chatInstance.subscribe(ai_copilotChat_ui.CopilotChatEvents.RETRY_SEND_MESSAGE, async event => {
				const message = this.#chatInstance.getMessageById(event.getData().messageId);
				this.#sendMessage(message);
			});
			this.#chatInstance.subscribe(ai_copilotChat_ui.CopilotChatEvents.REMOVE_MESSAGE, event => {
				const messageId = event.getData().messageId;
				this.#chatInstance.removeMessage(messageId);
			});
			this.#chatInstance.subscribe(ai_copilotChat_ui.CopilotChatEvents.CLICK_ON_MESSAGE_BUTTON, async event => {
				const messageId = event.getData().messageId;
				const button = event.getData().button;
				this.#chatInstance.addUserMessage({
					id: -parseInt(Math.random() * 1000, 10),
					content: button.text,
					type: 'ButtonClicked',
					params: {
						messageId,
						buttonId: button.id
					}
				});
			});
			this.#chatAPI.subscribe(CopilotChatApiEvents.INIT_CHAT, event => {
				this.emit(CopilotChatEvents.INIT_CHAT, event);
			});
			this.#chatAPI.subscribe(CopilotChatApiEvents.NEW_MESSAGE, event => {
				this.emit(CopilotChatEvents.NEW_MESSAGE, event);
			});
			this.#chatAPI.subscribe(CopilotChatApiEvents.NEW_MESSAGE, event => {
				const message = event.getData().message;
				if (this.#chatInstance.isMessageInList(message.id)) {
					return;
				}
				this.#addChatMessage(message);
			});
			this.#chatAPI.subscribe(CopilotChatApiEvents.INPUT_STATUS_CHANGED, event => {
				const {
					status
				} = event.getData();
				switch (status) {
					case 'Lock':
						{
							this.#chatInstance.disableInput();
							this.#chatInstance.setCopilotWritingStatus(false);
							break;
						}
					case 'Unlock':
						{
							this.#chatInstance.enableInput();
							this.#chatInstance.setCopilotWritingStatus(false);
							break;
						}
					case 'Writing':
						{
							this.#chatInstance.setCopilotWritingStatus(true);
							this.#chatInstance.disableInput();
							break;
						}
					default:
						{
							console.warn('AI.CopilotChat.Core: Unknown input status', status);
						}
				}
			});
			this.#chatInstance.subscribe(ai_copilotChat_ui.CopilotChatEvents.MESSAGES_SCROLL_TOP, () => {
				// todo make loading messages
			});
			return this.#chatInstance;
		}
		async #loadOldMessages() {
			this.#chatInstance.startLoadingOldMessages();
			const messages = await this.#chatAPI.loadMessages(this.#chatInstance.getFirstMessageId());
			if (messages.length === 0) {
				this.#isLoadAllMessages = true;
			}
			this.#chatInstance.finishLoadingOldMessages();
			this.#chatInstance.unshiftMessages(messages);
		}
		async #initChat() {
			try {
				if (this.#chatInstance.isShown()) {
					this.#chatInstance.hideLoadHistoryError();
					this.#chatInstance.showLoader();
				}
				const data = await this.#chatAPI.initChatData();
				this.#chatInstance.setUserAvatar(data.userPhoto);
				const messages = data.messages;
				messages.forEach(message => {
					this.#addChatMessage(message, false);
				});
				this.#isHistoryFetched = true;
			} catch (e) {
				this.#chatInstance.showLoadHistoryError();
				console.error(e);
			} finally {
				this.#chatInstance.hideLoader();
			}
		}
		#addChatMessage(message) {
			const chatMessage = {
				authorId: message.authorId,
				content: message.content,
				type: message.type,
				status: message.status ?? ai_copilotChat_ui.CopilotChatMessageStatus.DELIVERED,
				id: message.id,
				params: message.params ?? []
			};
			if (message.isSystem === true) {
				this.#chatInstance.addSystemMessage(chatMessage, false);
			} else if (message.authorId === 0) {
				this.#chatInstance.addBotMessage(chatMessage, false);
			} else if (message.authorId > 0) {
				this.#chatInstance.addUserMessage(chatMessage, false);
			}
		}
		async #sendMessage(message) {
			this.#chatInstance.setMessageStatusDepart(message.id);
			this.#chatInstance.disableInput();
			try {
				const data = await this.#chatAPI.sendMessage({
					content: message.content,
					messageId: message.params?.messageId ?? null,
					buttonId: message.params?.buttonId ?? null
				});
				this.#chatInstance.setMessageId(message.id, data.message.id);
				this.#chatInstance.setMessageDate(data.message.id, data.message.dateCreate);
				this.#chatInstance.setMessageStatusDelivered(data.message.id);
			} catch {
				this.#chatInstance.setMessageStatusError(message.id);
				this.#chatInstance.enableInput();
			}
		}
		#validateOptions(options = {}) {
			const scenarioCode = options.scenarioCode;
			const entityType = options.entityType;
			const entityId = options.entityId;
			if (main_core.Type.isStringFilled(scenarioCode) === false) {
				throw new TypeError('scenarioCode option is required and must be the string');
			}
			if (main_core.Type.isStringFilled(entityType) === false) {
				throw new TypeError('entityType option is required and must be the string');
			}
			if (main_core.Type.isStringFilled(entityId) === false) {
				throw new TypeError('entityId option is required and must be the string');
			}
		}
	}
	const CopilotChatEvents = {
		INIT_CHAT: 'initChat',
		NEW_MESSAGE: 'newMessage'
	};

	exports.CopilotChat = CopilotChat;
	exports.CopilotChatEvents = CopilotChatEvents;

})(this.BX.AI.CopilotChat.Core = this.BX.AI.CopilotChat.Core || {}, BX, BX.Event, BX.AI.CopilotChat.UI, BX);
//# sourceMappingURL=copilot-chat.bundle.js.map
