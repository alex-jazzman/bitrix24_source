/* eslint-disable */
this.BX = this.BX || {};
this.BX.Messenger = this.BX.Messenger || {};
(function (exports, ui_vue, immobile_chat_application_core, main_date, main_core_events, mobile_pull_client, im_model, im_const, im_lib_utils, im_lib_localstorage, im_provider_rest, im_lib_timer, pull_component_status, ui_fonts_opensans, ui_vue_vuex, im_lib_logger, im_component_dialog, im_view_quotepanel, ui_vue_components_smiles, im_eventHandler) {
	'use strict';

	/**
	 * Bitrix Mobile Dialog
	 * Dialog Pull commands (Pull Command Handler)
	 *
	 * @package bitrix
	 * @subpackage mobile
	 * @copyright 2001-2020 Bitrix
	 */

	class MobileImCommandHandler {
		static create(params = {}) {
			return new this(params);
		}
		constructor(params = {}) {
			this.controller = params.controller;
			this.store = params.store;
			this.dialog = params.dialog;
		}
		getModuleId() {
			return 'im';
		}
		handleUserInvite(params, extra, command) {
			if (!params.invited) {
				setTimeout(() => {
					this.dialog.redrawHeader();
				}, 100);
			}
		}
		handleMessage(params, extra, command) {
			let currentHeaderName = BXMobileApp.UI.Page.TopBar.title.params.text;
			let senderId = params.message.senderId;
			if (params.users[senderId].name !== currentHeaderName) {
				this.dialog.redrawHeader();
			}
		}
		handleGeneralChatAccess() {
			app.closeController();
		}
		handleChatUserLeave(params) {
			if (params.userId === this.controller.application.getUserId() && params.dialogId === this.controller.application.getDialogId()) {
				app.closeController();
			}
		}
	}

	/**
	 * Bitrix Mobile Dialog
	 * Dialog Rest answers (Rest Answer Handler)
	 *
	 * @package bitrix
	 * @subpackage mobile
	 * @copyright 2001-2019 Bitrix
	 */

	class MobileRestAnswerHandler extends im_provider_rest.BaseRestHandler {
		constructor(params) {
			super(params);
			if (typeof params.context === 'object' && params.context) {
				this.context = params.context;
			}
		}
		handleImCallGetCallLimitsSuccess(data) {
			this.store.commit('application/set', {
				call: {
					serverEnabled: data.callServerEnabled,
					maxParticipants: data.maxParticipants
				}
			});
		}
		handleImChatGetSuccess(data) {
			this.store.commit('application/set', {
				dialog: {
					chatId: data.id,
					dialogId: data.dialog_id,
					diskFolderId: data.disk_folder_id
				}
			});
			if (data.restrictions) {
				this.store.dispatch('dialogues/update', {
					dialogId: data.dialog_id,
					fields: data.restrictions
				});
			}
		}
		handleImChatGetError(error) {
			if (error.ex.error === 'ACCESS_ERROR') {
				BXMobileApp.Events.postToComponent('chatdialog::access::error', [], 'im.messenger');
				app.closeController();
			}
		}
		handleMobileBrowserConstGetSuccess(data) {
			this.store.commit('application/set', {
				disk: {
					enabled: true,
					maxFileSize: data.phpUploadMaxFilesize
				}
			});
			this.context.addLocalize(data);
			BX.message(data);
			im_lib_localstorage.LocalStorage.set(this.controller.getSiteId(), 0, 'serverVariables', data || {});
		}
		handleImDialogMessagesGetInitSuccess() {
			// EventEmitter.emit(EventType.dialog.readVisibleMessages, {chatId: this.controller.application.getChatId()});
		}
		handleImMessageAddSuccess(messageId, message) {
			this.context.messagesQueue = this.context.messagesQueue.filter(el => el.id !== message.id);
		}
		handleImMessageAddError(error, message) {
			this.context.messagesQueue = this.context.messagesQueue.filter(el => el.id !== message.id);
		}
		handleImDiskFileCommitSuccess(result, message) {
			this.context.messagesQueue = this.context.messagesQueue.filter(el => el.id !== message.id);
		}
	}

	const LoadingStatus = {
		template: `
		<div class="bx-mobilechat-loading-window">
			<svg class="bx-mobilechat-loading-circular" viewBox="25 25 50 50">
				<circle class="bx-mobilechat-loading-path" cx="50" cy="50" r="20" fill="none" stroke-miterlimit="10"/>
				<circle class="bx-mobilechat-loading-inner-path" cx="50" cy="50" r="20" fill="none" stroke-miterlimit="10"/>
			</svg>
			<h3 class="bx-mobilechat-help-title bx-mobilechat-help-title-md bx-mobilechat-loading-msg">{{$Bitrix.Loc.getMessage('MOBILE_CHAT_LOADING')}}</h3>
		</div>
	`
	};

	const ErrorStatus = {
		computed: {
			...ui_vue_vuex.Vuex.mapState({
				application: state => state.application
			})
		},
		template: `
		<div class="bx-mobilechat-body" key="error-body">
			<div class="bx-mobilechat-warning-window">
				<div class="bx-mobilechat-warning-icon"></div>
				<template v-if="application.error.description"> 
					<div class="bx-mobilechat-help-title bx-mobilechat-help-title-sm bx-mobilechat-warning-msg" v-html="application.error.description"></div>
				</template> 
				<template v-else>
					<div class="bx-mobilechat-help-title bx-mobilechat-help-title-md bx-mobilechat-warning-msg">{{$Bitrix.Loc.getMessage('MOBILE_CHAT_ERROR_TITLE')}}</div>
					<div class="bx-mobilechat-help-title bx-mobilechat-help-title-sm bx-mobilechat-warning-msg">{{$Bitrix.Loc.getMessage('MOBILE_CHAT_ERROR_DESC')}}</div>
				</template> 
			</div>
		</div>
	`
	};

	const EmptyStatus = {
		template: `
		<div class="bx-mobilechat-loading-window">
			<h3 class="bx-mobilechat-help-title bx-mobilechat-help-title-md bx-mobilechat-loading-msg">{{$Bitrix.Loc.getMessage('MOBILE_CHAT_EMPTY')}}</h3>
		</div>
	`
	};

	const MobileSmiles = {
		methods: {
			onSelectSmile(event) {
				this.$emit('selectSmile', event);
			},
			onSelectSet(event) {
				this.$emit('selectSet', event);
			},
			hideSmiles() {
				this.$emit('hideSmiles');
			}
		},
		template: `
		<transition enter-active-class="bx-livechat-consent-window-show" leave-active-class="bx-livechat-form-close">
			<div class="bx-messenger-alert-box bx-livechat-alert-box-zero-padding bx-livechat-form-show" key="vote">
				<div class="bx-livechat-alert-close" @click="hideSmiles"></div>
				<div class="bx-messenger-smiles-box">
					<bx-smiles
						@selectSmile="onSelectSmile"
						@selectSet="onSelectSet"
					/>
				</div>
			</div>
		</transition>
	`
	};

	class MobileQuoteHandler extends im_eventHandler.QuoteHandler {
		quoteMessage(messageId) {
			this.store.dispatch('dialogues/update', {
				dialogId: this.getDialogId(),
				fields: {
					quoteId: messageId
				}
			}).then(() => {
				if (this.store.state.application.mobile.keyboardShow) {
					return;
				}
				main_core_events.EventEmitter.emit(im_const.EventType.mobile.textarea.setFocus);
				setTimeout(() => {
					main_core_events.EventEmitter.emit(im_const.EventType.dialog.scrollToBottom, {
						chatId: this.getChatId(),
						duration: 300,
						cancelIfScrollChange: false,
						force: true
					});
				}, 300);
			});
		}
		clearQuote() {
			main_core_events.EventEmitter.emit(im_const.EventType.mobile.textarea.setText, {
				text: ''
			});
			this.store.dispatch('dialogues/update', {
				dialogId: this.getDialogId(),
				fields: {
					quoteId: 0,
					editId: 0
				}
			});
		}
		getChatId() {
			return this.store.state.application.dialog.chatId;
		}
	}

	class MobileReactionHandler extends im_eventHandler.ReactionHandler {
		constructor($Bitrix) {
			super($Bitrix);
			this.loc = $Bitrix.Loc.messages;
		}
		reactToMessage(messageId, reaction) {
			let action = reaction.action || im_eventHandler.ReactionHandler.actions.auto;
			if (action !== im_eventHandler.ReactionHandler.actions.auto) {
				action = action === im_eventHandler.ReactionHandler.actions.set ? im_eventHandler.ReactionHandler.actions.plus : im_eventHandler.ReactionHandler.actions.minus;
			}
			const eventParameters = ['reactMessage', `reactMessage|${messageId}`, {
				messageId,
				action
			}, false, 1000];
			BXMobileApp.Events.postToComponent('chatbackground::task::action', eventParameters, 'background');
			if (reaction.action === im_eventHandler.ReactionHandler.actions.set) {
				setTimeout(() => app.exec('callVibration'), 200);
			}
		}
		openMessageReactionList(id, reactions) {
			if (!im_lib_utils.Utils.dialog.isChatId(this.getDialogId())) {
				return;
			}
			let users = [];
			Object.keys(reactions).forEach(reaction => {
				users = [...users, ...reactions[reaction]];
			});
			main_core_events.EventEmitter.emit(im_const.EventType.mobile.openUserList, {
				users: users,
				title: this.loc['MOBILE_MESSAGE_LIST_LIKE']
			});
		}
		onSetMessageReaction({
			data
		}) {
			this.reactToMessage(data.message.id, data.reaction);
		}
		getDialogId() {
			return this.store.state.application.dialog.dialogId;
		}
	}

	class MobileReadingHandler extends im_eventHandler.ReadingHandler {
		onReadMessage({
			data: {
				id = null,
				skipAjax = false
			}
		}) {
			return this.readMessage(id, true, true).then(messageData => {
				if (messageData.lastId <= 0 || skipAjax) {
					return;
				}
				this.addTaskToReadMessage(messageData);
			});
		}
		processMessagesToRead(chatId, skipAjax = false) {
			const lastMessageToRead = this.getMaxMessageIdFromQueue(chatId);
			const dialogId = this.getDialogId();
			delete this.messagesToRead[chatId];
			if (lastMessageToRead <= 0) {
				return Promise.resolve({
					dialogId,
					lastId: lastMessageToRead
				});
			}
			return new Promise((resolve, reject) => {
				this.readMessageOnClient(chatId, lastMessageToRead).then(readResult => {
					return this.decreaseChatCounter(chatId, readResult.count);
				}).then(() => {
					resolve({
						dialogId,
						lastId: lastMessageToRead
					});
				}).catch(error => {
					im_lib_logger.Logger.error('Reading messages error', error);
					reject();
				});
			});
		}
		addTaskToReadMessage(messageData) {
			BXMobileApp.Events.postToComponent('chatbackground::task::action', ['readMessage', `readMessage|${messageData.dialogId}`, messageData, false, 200], 'background');
		}
	}

	/**
	 * Bitrix im dialog mobile
	 * Dialog vue component
	 *
	 * @package bitrix
	 * @subpackage mobile
	 * @copyright 2001-2019 Bitrix
	 */


	/**
	 * @notice Do not clone this component! It is under development.
	 */
	ui_vue.BitrixVue.component('bx-mobile-im-component-dialog', {
		components: {
			LoadingStatus,
			ErrorStatus,
			EmptyStatus,
			MobileSmiles
		},
		data: function () {
			return {
				dialogState: 'none'
			};
		},
		computed: {
			EventType: () => im_const.EventType,
			localize() {
				return ui_vue.BitrixVue.getFilteredPhrases(['MOBILE_CHAT_', 'IM_UTILS_'], this.$root.$bitrixMessages);
			},
			widgetClassName() {
				let className = [];
				className.push('bx-mobile');
				if (im_lib_utils.Utils.platform.isIos()) {
					className.push('bx-mobile-ios');
				} else {
					className.push('bx-mobile-android');
				}
				return className.join(' ');
			},
			quotePanelData() {
				let result = {
					id: 0,
					title: '',
					description: '',
					color: ''
				};
				if (!this.isMessageLoaded || !this.dialog.quoteId) {
					return result;
				}
				let message = this.$store.getters['messages/getMessage'](this.dialog.chatId, this.dialog.quoteId);
				if (!message) {
					return result;
				}
				let user = this.$store.getters['users/get'](message.authorId);
				let files = this.$store.getters['files/getList'](this.dialog.chatId);
				let editId = this.$store.getters['dialogues/getEditId'](this.dialog.dialogId);
				return {
					id: this.dialog.quoteId,
					title: editId ? this.$Bitrix.Loc.getMessage('MOBILE_CHAT_EDIT_TITLE') : message.params.NAME ? message.params.NAME : user ? user.name : '',
					color: user ? user.color : '',
					description: im_lib_utils.Utils.text.purify(message.text, message.params, files, this.$Bitrix.Loc.getMessages())
				};
			},
			isDialog() {
				return im_lib_utils.Utils.dialog.isChatId(this.dialog.dialogId);
			},
			isGestureQuoteSupported() {
				if (this.dialog && this.dialog.type === 'announcement' && !this.dialog.managerList.includes(this.application.common.userId)) {
					return false;
				}
				return ChatPerformance.isGestureQuoteSupported();
			},
			isDarkBackground() {
				return this.application.options.darkBackground;
			},
			isMessageLoaded() {
				let timeout = ChatPerformance.getDialogShowTimeout();
				let result = this.messageCollection && this.messageCollection.length > 0;
				if (result) {
					if (timeout > 0) {
						clearTimeout(this.dialogStateTimeout);
						this.dialogStateTimeout = setTimeout(() => {
							this.dialogState = 'show';
						}, timeout);
					} else {
						this.dialogState = 'show';
					}
				} else if (this.dialog && this.dialog.init) {
					if (timeout > 0) {
						clearTimeout(this.dialogStateTimeout);
						this.dialogStateTimeout = setTimeout(() => {
							this.dialogState = 'empty';
						}, timeout);
					} else {
						this.dialogState = 'empty';
					}
				} else {
					this.dialogState = 'loading';
				}
				return result;
			},
			dialog() {
				const dialog = this.$store.getters['dialogues/get'](this.application.dialog.dialogId);
				return dialog || this.$store.getters['dialogues/getBlank']();
			},
			chatId() {
				if (this.application) {
					return this.application.dialog.chatId;
				}
			},
			diskFolderId() {
				return this.application.dialog.diskFolderId;
			},
			isDialogShowingMessages() {
				const messagesNotEmpty = this.messageCollection && this.messageCollection.length > 0;
				if (messagesNotEmpty) {
					this.dialogState = im_const.DialogState.show;
				} else if (this.dialog && this.dialog.init) {
					this.dialogState = im_const.DialogState.empty;
				} else {
					this.dialogState = im_const.DialogState.loading;
				}
				return messagesNotEmpty;
			},
			...ui_vue_vuex.Vuex.mapState({
				application: state => state.application,
				messageCollection: state => state.messages.collection[state.application.dialog.chatId]
			})
		},
		created() {
			this.timer = new im_lib_timer.Timer();
			this.initEventHandlers();
			this.subscribeToEvents();
		},
		beforeDestroy() {
			this.unsubscribeEvents();
			this.destroyHandlers();
		},
		methods: {
			initEventHandlers() {
				this.quoteHandler = new MobileQuoteHandler(this.$Bitrix);
				this.reactionHandler = new MobileReactionHandler(this.$Bitrix);
				this.readingHandler = new MobileReadingHandler(this.$Bitrix);
			},
			destroyHandlers() {
				this.quoteHandler.destroy();
				this.reactionHandler.destroy();
				this.readingHandler.destroy();
			},
			subscribeToEvents() {
				main_core_events.EventEmitter.subscribe(im_const.EventType.mobile.textarea.setText, this.onSetText);
				main_core_events.EventEmitter.subscribe(im_const.EventType.mobile.textarea.setFocus, this.onSetFocus);
				main_core_events.EventEmitter.subscribe(im_const.EventType.mobile.openUserList, this.onOpenUserList);
				main_core_events.EventEmitter.subscribe(im_const.EventType.dialog.clickOnUploadCancel, this.onClickOnUploadCancel);
				main_core_events.EventEmitter.subscribe(im_const.EventType.dialog.clickOnMessageRetry, this.onClickOnMessageRetry);
				main_core_events.EventEmitter.subscribe(im_const.EventType.dialog.clickOnDialog, this.onClickOnDialog);
				main_core_events.EventEmitter.subscribe(im_const.EventType.dialog.clickOnChatTeaser, this.onClickOnChatTeaser);
				main_core_events.EventEmitter.subscribe(im_const.EventType.dialog.clickOnKeyboardButton, this.onClickOnKeyboardButton);
				main_core_events.EventEmitter.subscribe(im_const.EventType.dialog.clickOnReadList, this.onClickOnReadList);
				main_core_events.EventEmitter.subscribe(im_const.EventType.dialog.clickOnMessageMenu, this.onClickOnMessageMenu);
				main_core_events.EventEmitter.subscribe(im_const.EventType.dialog.doubleClickOnMessage, this.onDoubleClickOnMessage);
				main_core_events.EventEmitter.subscribe(im_const.EventType.dialog.clickOnUserName, this.onClickOnUserName);
				main_core_events.EventEmitter.subscribe(im_const.EventType.dialog.clickOnMention, this.onClickOnMention);
				main_core_events.EventEmitter.subscribe(im_const.EventType.dialog.clickOnCommand, this.onClickOnCommand);
			},
			unsubscribeEvents() {
				main_core_events.EventEmitter.unsubscribe(im_const.EventType.mobile.textarea.setText, this.onSetText);
				main_core_events.EventEmitter.unsubscribe(im_const.EventType.mobile.textarea.setFocus, this.onSetFocus);
				main_core_events.EventEmitter.unsubscribe(im_const.EventType.mobile.openUserList, this.onOpenUserList);
				main_core_events.EventEmitter.unsubscribe(im_const.EventType.dialog.clickOnUploadCancel, this.onClickOnUploadCancel);
				main_core_events.EventEmitter.unsubscribe(im_const.EventType.dialog.clickOnMessageRetry, this.onClickOnMessageRetry);
				main_core_events.EventEmitter.unsubscribe(im_const.EventType.dialog.clickOnDialog, this.onClickOnDialog);
				main_core_events.EventEmitter.unsubscribe(im_const.EventType.dialog.clickOnChatTeaser, this.onClickOnChatTeaser);
				main_core_events.EventEmitter.unsubscribe(im_const.EventType.dialog.clickOnKeyboardButton, this.onClickOnKeyboardButton);
				main_core_events.EventEmitter.unsubscribe(im_const.EventType.dialog.clickOnReadList, this.onClickOnReadList);
				main_core_events.EventEmitter.unsubscribe(im_const.EventType.dialog.clickOnMessageMenu, this.onClickOnMessageMenu);
				main_core_events.EventEmitter.unsubscribe(im_const.EventType.dialog.doubleClickOnMessage, this.onDoubleClickOnMessage);
				main_core_events.EventEmitter.unsubscribe(im_const.EventType.dialog.clickOnUserName, this.onClickOnUserName);
				main_core_events.EventEmitter.unsubscribe(im_const.EventType.dialog.clickOnMention, this.onClickOnMention);
				main_core_events.EventEmitter.unsubscribe(im_const.EventType.dialog.clickOnCommand, this.onClickOnCommand);
			},
			getApplication() {
				return this.$Bitrix.Application.get();
			},
			logEvent(name, ...params) {
				im_lib_logger.Logger.info(name, ...params);
			},
			onDialogRequestHistory(event) {
				this.getApplication().getDialogHistory(event.lastId);
			},
			onDialogRequestUnread(event) {
				this.getApplication().getDialogUnread(event.lastId);
			},
			onClickOnUserName({
				data: event
			}) {
				this.getApplication().replyToUser(event.user.id, event.user);
			},
			onClickOnUploadCancel({
				data: event
			}) {
				this.getApplication().cancelUploadFile(event.file.id);
			},
			onClickOnCommand({
				data: event
			}) {
				if (event.type === 'put') {
					this.getApplication().insertText({
						text: event.value + ' '
					});
				} else if (event.type === 'send') {
					this.getApplication().addMessage(event.value);
				} else {
					im_lib_logger.Logger.warn('Unprocessed command', event);
				}
			},
			onClickOnMention({
				data: event
			}) {
				if (event.type === 'USER') {
					this.getApplication().openDialog(event.value);
				} else if (event.type === 'CHAT') {
					this.getApplication().openDialog(event.value);
				} else if (event.type === 'CALL') {
					this.getApplication().openPhoneMenu(event.value);
				}
			},
			onClickOnMessageMenu({
				data: event
			}) {
				im_lib_logger.Logger.warn('Message menu:', event);
				this.getApplication().openMessageMenu(event.message);
			},
			onClickOnMessageRetry({
				data: event
			}) {
				im_lib_logger.Logger.warn('Message retry:', event);
				this.getApplication().retrySendMessage(event.message);
			},
			onDoubleClickOnMessage({
				data: event
			}) {
				im_lib_logger.Logger.warn('Message double click:', event);
				main_core_events.EventEmitter.emit('ui:reaction:press', {
					id: 'message' + event.message.id
				});
			},
			onClickOnReadList({
				data: event
			}) {
				this.getApplication().openReadedList(event.list);
			},
			onSetFocus() {
				this.getApplication().setTextFocus();
			},
			onSetText({
				data: event
			}) {
				this.getApplication().setText(event.text);
			},
			onClickOnKeyboardButton({
				data: event
			}) {
				if (event.action === 'ACTION') {
					let {
						dialogId,
						messageId,
						botId,
						action,
						value
					} = event.params;
					if (action === 'SEND') {
						this.getApplication().addMessage(value);
						setTimeout(() => main_core_events.EventEmitter.emit(im_const.EventType.dialog.scrollToBottom, {
							chatId: this.chatId,
							duration: 300,
							cancelIfScrollChange: false
						}), 300);
					} else if (action === 'PUT') {
						this.getApplication().insertText({
							text: value + ' '
						});
					} else if (action === 'CALL') {
						this.getApplication().openPhoneMenu(value);
					} else if (action === 'COPY') {
						app.exec("copyToClipboard", {
							text: value
						});
						new BXMobileApp.UI.NotificationBar({
							message: BX.message("MOBILE_MESSAGE_MENU_COPY_SUCCESS"),
							color: "#af000000",
							textColor: "#ffffff",
							groupId: "clipboard",
							maxLines: 1,
							align: "center",
							isGlobal: true,
							useCloseButton: true,
							autoHideTimeout: 1500,
							hideOnTap: true
						}, "copy").show();
					} else if (action === 'DIALOG') {
						this.getApplication().openDialog(value);
					}
					return true;
				}
				if (event.action === 'COMMAND') {
					let {
						dialogId,
						messageId,
						botId,
						command,
						params
					} = event.params;
					this.$Bitrix.RestClient.get().callMethod(im_const.RestMethod.imMessageCommand, {
						'MESSAGE_ID': messageId,
						'DIALOG_ID': dialogId,
						'BOT_ID': botId,
						'COMMAND': command,
						'COMMAND_PARAMS': params
					});
					return true;
				}
				return false;
			},
			onClickOnChatTeaser({
				data: event
			}) {
				this.$Bitrix.Data.get('controller').application.joinParentChat(event.message.id, 'chat' + event.message.params.CHAT_ID).then(dialogId => {
					this.getApplication().openDialog(dialogId);
				}).catch(() => {});
			},
			onClickOnDialog({
				data: event
			}) {
				//this.getApplication().controller.hideSmiles();
			},
			onSmilesSelectSmile(event) {
				console.warn('Smile selected:', event);
				this.getApplication().insertText({
					text: event.text
				});
			},
			onSmilesSelectSet() {
				console.warn('Set selected');
				this.getApplication().setTextFocus();
			},
			onHideSmiles() {
				//this.getApplication().controller.hideSmiles();
				this.getApplication().setTextFocus();
			},
			onOpenUserList({
				data: event
			}) {
				this.getApplication().openUserList(event);
			},
			getController() {
				return this.$Bitrix.Data.get('controller');
			},
			getApplicationController() {
				return this.getController().application;
			},
			getRestClient() {
				return this.$Bitrix.RestClient.get();
			},
			getCurrentUser() {
				return this.$store.getters['users/get'](this.application.common.userId, true);
			},
			executeRestAnswer(method, queryResult, extra) {
				this.getController().executeRestAnswer(method, queryResult, extra);
			},
			isUnreadMessagesLoaded() {
				if (!this.dialog) {
					return true;
				}
				if (this.dialog.lastMessageId <= 0) {
					return true;
				}
				if (!this.messageCollection || this.messageCollection.length <= 0) {
					return true;
				}
				let lastElementId = 0;
				for (let index = this.messageCollection.length - 1; index >= 0; index--) {
					const lastElement = this.messageCollection[index];
					if (typeof lastElement.id === "number") {
						lastElementId = lastElement.id;
						break;
					}
				}
				return lastElementId >= this.dialog.lastMessageId;
			}
		},
		watch: {
			dialogState(state) {
				this.getApplication().changeDialogState(state);
			}
		},
		// language=Vue
		template: `
		<div :class="widgetClassName" :data-message-loaded="isMessageLoaded">
			<bx-im-component-dialog
				:userId="application.common.userId"
				:dialogId="application.dialog.dialogId"
				:enableReadMessages="application.dialog.enableReadMessages"
				:enableReactions="true"
				:enableDateActions="false"
				:enableCreateContent="false"
				:enableGestureQuote="application.options.quoteEnable"
				:enableGestureQuoteFromRight="application.options.quoteFromRight"
				:enableGestureMenu="true"
				:showMessageUserName="isDialog"
				:showMessageAvatar="isDialog"
				:showMessageMenu="false"
				:skipDataRequest="true"
			 />
			<template v-if="application.options.showSmiles">
				<MobileSmiles @selectSmile="onSmilesSelectSmile" @selectSet="onSmilesSelectSet" @hideSmiles="onHideSmiles" />
			</template>
		</div>
	`
	}, {
		immutable: true
	});

	/**
	 * Bitrix Im mobile
	 * Dialog application
	 *
	 * @package bitrix
	 * @subpackage mobile
	 * @copyright 2001-2020 Bitrix
	 */

	const STORAGE_PREFIX = 'chatBackgroundQueue';
	const FILES_STORAGE_NAME = 'uploadTasks';
	const MESSAGES_STORAGE_NAME = 'tasks';
	const NO_INTERNET_CONNECTION_ERROR_CODE = -2;
	const HTTP_OK_STATUS_CODE = 200;
	class MobileDialogApplication {
		/* region 01. Initialize and store data */

		constructor(params = {}) {
			this.inited = false;
			this.initPromise = new BX.Promise();
			this.params = params;
			this.template = null;
			this.rootNode = this.params.node || document.createElement('div');
			this.eventBus = new ui_vue.VueVendorV2();
			this.timer = new im_lib_timer.Timer();
			this.messagesQueue = [];
			this.windowFocused = true;
			window.imDialogUploadTasks = [];
			window.imDialogMessagesTasks = [];
			this.messagesSet = false;

			// alert('Pause: open console for debug');

			this.initCore().then(() => this.subscribeToEvents()).then(() => this.initComponentParams()).then(result => this.initLangAdditional(result)).then(result => this.initMobileEntity(result)).then(result => this.initMobileSettings(result)).then(() => this.initComponent()).then(() => this.initEnvironment()).then(() => this.initMobileEnvironment()).then(() => this.initUnsentStorage()).then(() => this.initPullClient()).then(() => this.initComplete());
		}
		initCore() {
			return new Promise((resolve, reject) => {
				immobile_chat_application_core.Core.ready().then(controller => {
					this.controller = controller;
					resolve();
				});
			});
		}
		subscribeToEvents() {
			main_core_events.EventEmitter.subscribe(im_const.EventType.dialog.messagesSet, this.onMessagesSet.bind(this));
		}
		initComponentParams() {
			return BX.componentParameters.init();
		}
		initLangAdditional(data) {
			const langAdditional = data.LANG_ADDITIONAL || {};
			console.log('0. initLangAdditional', langAdditional);
			return new Promise((resolve, reject) => {
				if (data.LANG_ADDITIONAL) {
					Object.keys(langAdditional).forEach(code => {
						if (typeof langAdditional[code] !== 'string') {
							return;
						}
						BX.message[code] = langAdditional[code];
					});
				}
				resolve(data);
			});
		}
		initMobileEntity(data) {
			console.log('1. initMobileEntity');
			return new Promise((resolve, reject) => {
				if (data.DIALOG_ENTITY) {
					data.DIALOG_ENTITY = JSON.parse(data.DIALOG_ENTITY);
					if (data.DIALOG_TYPE === 'user') {
						this.controller.getStore().dispatch('users/set', data.DIALOG_ENTITY).then(() => {
							resolve(data);
						});
					} else if (data.DIALOG_TYPE === 'chat') {
						this.controller.getStore().dispatch('dialogues/set', data.DIALOG_ENTITY).then(() => {
							resolve(data);
						});
					}
				} else {
					resolve(data);
				}
			});
		}
		initMobileSettings(data) {
			console.log('2. initMobileSettings');

			// todo change to dynamic storage (LocalStorage web, PageParams for mobile)
			const serverVariables = im_lib_localstorage.LocalStorage.get(this.controller.getSiteId(), 0, 'serverVariables', false);
			if (serverVariables) {
				this.addLocalize(serverVariables);
			}
			this.storedEvents = data.STORED_EVENTS || [];
			return new Promise((resolve, reject) => {
				ApplicationStorage.getObject('settings.chat', {
					quoteEnable: ChatPerformance.isGestureQuoteSupported(),
					quoteFromRight: false,
					autoplayVideo: ChatPerformance.isAutoPlayVideoSupported(),
					backgroundType: 'LIGHT_GRAY'
				}).then(options => {
					this.controller.getStore().dispatch('application/set', {
						dialog: {
							dialogId: data.DIALOG_ID
						},
						options: {
							quoteEnable: options.quoteEnable,
							quoteFromRight: options.quoteFromRight,
							autoplayVideo: options.autoplayVideo,
							darkBackground: ChatDialogBackground && ChatDialogBackground[options.backgroundType] && ChatDialogBackground[options.backgroundType].dark
						}
					}).then(() => resolve());
				});
			});
		}
		initComponent() {
			console.log('3. initComponent');
			this.controller.application.setPrepareFilesBeforeSaveFunction(this.prepareFileData.bind(this));
			this.controller.addRestAnswerHandler(MobileRestAnswerHandler.create({
				store: this.controller.getStore(),
				controller: this.controller,
				context: this
			}));
			const dialog = this.controller.getStore().getters['dialogues/get'](this.controller.application.getDialogId());
			if (dialog) {
				this.controller.getStore().commit('application/set', {
					dialog: {
						chatId: dialog.chatId,
						diskFolderId: dialog.diskFolderId || 0
					}
				});
			}
			return this.controller.createVue(this, {
				el: this.rootNode,
				template: '<bx-mobile-im-component-dialog/>'
			}).then(vue => {
				this.template = vue;
				return new Promise((resolve, reject) => resolve());
			});
		}
		initEnvironment() {
			console.log('4. initEnvironment');
			this.setTextareaMessage = im_lib_utils.Utils.debounce(this.controller.application.setTextareaMessage, 300, this.controller.application);
			return new Promise((resolve, reject) => resolve());
		}
		initMobileEnvironment() {
			console.log('5. initMobileEnvironment');
			BXMobileApp.UI.Page.Scroll.setEnabled(false);
			BXMobileApp.UI.Page.captureKeyboardEvents(true);
			BX.addCustomEvent('onKeyboardWillShow', () => {
				// EventEmitter.emit(EventType.dialog.beforeMobileKeyboard);
				this.controller.getStore().dispatch('application/set', {
					mobile: {
						keyboardShow: true
					}
				});
			});
			BX.addCustomEvent('onKeyboardDidShow', () => {
				console.log('Keyboard was showed');
				main_core_events.EventEmitter.emit(im_const.EventType.dialog.scrollToBottom, {
					chatId: this.controller.application.getChatId(),
					duration: 300,
					cancelIfScrollChange: true
				});
			});
			BX.addCustomEvent('onKeyboardWillHide', () => {
				clearInterval(this.keyboardOpeningInterval);
				this.controller.getStore().dispatch('application/set', {
					mobile: {
						keyboardShow: false
					}
				});
			});
			const checkWindowFocused = () => {
				BXMobileApp.UI.Page.isVisible({
					callback: data => {
						this.windowFocused = data.status === 'visible';
						if (this.windowFocused) {
							ui_vue.Vue.event.$emit('bitrixmobile:controller:focus');
						} else {
							ui_vue.Vue.event.$emit('bitrixmobile:controller:blur');
						}
					}
				});
			};
			BXMobileApp.addCustomEvent('CallEvents::viewOpened', () => {
				console.warn('CallView show - disable read message');
				ui_vue.Vue.event.$emit('bitrixmobile:controller:blur');
			});
			BXMobileApp.addCustomEvent('CallEvents::viewClosed', () => {
				console.warn('CallView hide - enable read message');
				checkWindowFocused();
			});
			BX.addCustomEvent('onAppActive', () => {
				checkWindowFocused();
				BXMobileApp.UI.Page.isVisible({
					callback: data => {
						if (data.status !== 'visible') {
							return false;
						}
						this.getDialogUnread().then(() => {
							this.processSendMessages();
							main_core_events.EventEmitter.emit(im_const.EventType.dialog.readVisibleMessages, {
								chatId: this.controller.application.getChatId()
							});
							main_core_events.EventEmitter.emit(im_const.EventType.dialog.scrollOnStart, {
								chatId: this.controller.application.getChatId()
							});
						}).catch(() => {
							this.processSendMessages();
						});
					}
				});
			});
			BX.addCustomEvent('onAppPaused', () => {
				this.windowFocused = false;
				ui_vue.Vue.event.$emit('bitrixmobile:controller:blur');
				// app.closeController();z
			});
			BX.addCustomEvent('onOpenPageAfter', checkWindowFocused);
			BX.addCustomEvent('onHidePageBefore', () => {
				this.windowFocused = false;
				ui_vue.Vue.event.$emit('bitrixmobile:controller:blur');
			});
			BXMobileApp.addCustomEvent('chatbackground::task::status::success', params => {
				const action = params.taskId.toString().split('|')[0];
				this.executeBackgroundTaskSuccess(action, params);
			});
			BXMobileApp.addCustomEvent('chatbackground::task::status::failure', params => {
				const action = params.taskId.toString().split('|')[0];
				this.executeBackgroundTaskFailure(action, params);
			});
			BXMobileApp.addCustomEvent('chatrecent::push::get', params => {
				mobile_pull_client.PULL.emit({
					type: mobile_pull_client.PullClient.SubscriptionType.Server,
					moduleId: this.pullMobileHandler.getModuleId(),
					data: {
						command: 'messageAdd',
						params: {
							...params,
							optionImportant: true
						}
					}
				});
			});
			BXMobileApp.UI.Page.TextPanel.getText(initialText => {
				BXMobileApp.UI.Page.TextPanel.setParams(this.getKeyboardParams({
					text: initialText
				}));
			});
			this.changeChatKeyboardStatus();
			BX.MobileUploadProvider.setListener(this.executeUploaderEvent.bind(this));
			this.fileUpdateProgress = im_lib_utils.Utils.throttle((chatId, fileId, progress, size) => {
				this.controller.getStore().dispatch('files/update', {
					chatId: chatId,
					id: fileId,
					fields: {
						status: im_const.FileStatus.upload,
						size: size,
						progress: progress
					}
				});
			}, 500);
			if (im_lib_utils.Utils.dialog.isChatId(this.controller.application.getDialogId())) {
				this.chatShowUserCounter = false;
				setTimeout(() => {
					this.chatShowUserCounter = true;
					this.redrawHeader();
				}, 1500);
			} else {
				this.userShowWorkPosition = true;
				setTimeout(() => {
					this.userShowWorkPosition = false;
					this.redrawHeader();
				}, 1500);
				setInterval(() => {
					this.redrawHeader();
				}, 60000);
			}
			this.redrawHeader();
			this.widgetCache = new ChatWidgetCache(this.controller.getUserId(), this.controller.getLanguageId());
			return new Promise((resolve, reject) => resolve());
		}
		initPullClient() {
			console.log('7. initPullClient');
			if (this.storedEvents && this.storedEvents.length > 0 && this.controller.application.isUnreadMessagesLoaded()) {
				// sort events and get first 50 (to match unread messages cache size)
				this.storedEvents = this.storedEvents.sort((a, b) => {
					return a.message.id - b.message.id;
				});
				this.storedEvents = this.storedEvents.slice(0, 50);
				setTimeout(() => {
					this.storedEvents = this.storedEvents.filter(event => {
						BX.onCustomEvent('chatrecent::push::get', [event]);
						return false;
					});
					// scroll to first push message in dialog before load all messages from server
					main_core_events.EventEmitter.emit(im_const.EventType.dialog.scrollToBottom, {
						chatId: this.controller.application.getChatId(),
						duration: 300,
						cancelIfScrollChange: true
					});
				}, 50);
			}
			mobile_pull_client.PULL.subscribe(this.pullMobileHandler = new MobileImCommandHandler({
				store: this.controller.getStore(),
				controller: this.controller,
				dialog: this
			}));
			mobile_pull_client.PULL.subscribe({
				type: mobile_pull_client.PullClient.SubscriptionType.Status,
				callback: this.eventStatusInteraction.bind(this)
			});
			if (!im_lib_utils.Utils.dialog.isChatId(this.controller.application.getDialogId())) {
				mobile_pull_client.PULL.subscribe({
					type: mobile_pull_client.PullClient.SubscriptionType.Online,
					callback: this.eventOnlineInteraction.bind(this)
				});
			}
			return new Promise((resolve, reject) => resolve());
		}
		initComplete() {
			console.log('8. initComplete');
			this.controller.getStore().subscribe(mutation => this.eventStoreInteraction(mutation));
			this.inited = true;
			this.initPromise.resolve(this);
			BXMobileApp.Events.postToComponent('chatdialog::init::complete', [{
				dialogId: this.controller.application.getDialogId()
			}, true], 'im.recent');
			BXMobileApp.Events.postToComponent('chatdialog::init::complete', [{
				dialogId: this.controller.application.getDialogId()
			}, true], 'im.messenger');
			return this.requestData();
		}
		cancelUnsentFile(fileId) {
			const taskId = `imDialogFileUpload|${fileId}`;
			BX.MobileUploadProvider.cancelTasks([taskId]);
			window.imDialogUploadTasks = window.imDialogUploadTasks.filter(entry => {
				return taskId !== entry.taskId;
			});
		}
		initUnsentStorage() {
			console.log('6. initUnsentStorage');
			return new Promise(resolve => {
				const filesPromise = this.loadUnsentFiles();
				const messagesPromise = this.loadUnsentMessages();
				Promise.all([filesPromise, messagesPromise]).then(resolve);
			});
		}
		loadUnsentMessages() {
			const userId = this.controller.application.getUserId();
			const dialogId = this.controller.application.getDialogId();
			const storageId = `${STORAGE_PREFIX}_${userId}`;
			return ApplicationStorage.getObject(MESSAGES_STORAGE_NAME, {}, storageId).then(tasks => {
				for (const queueType in tasks) {
					if (queueType === dialogId) {
						tasks[queueType].forEach(task => {
							if (dialogId === task.extra.dialogId) {
								window.imDialogMessagesTasks.push(task);
							}
						});
					}
				}
			});
		}
		loadUnsentFiles() {
			const userId = this.controller.application.getUserId();
			const dialogId = this.controller.application.getDialogId();
			const storageId = `${STORAGE_PREFIX}_${userId}`;
			return ApplicationStorage.getObject(FILES_STORAGE_NAME, {}, storageId).then(result => {
				Object.values(result).forEach(task => {
					if (typeof task.eventData.file !== 'undefined' && dialogId === task.eventData.file.params.dialogId) {
						window.imDialogUploadTasks.push(task);
					}
				});

				// we need it to show a progress bar for the uploading
				if (window.imDialogUploadTasks.length > 0) {
					BX.MobileUploadProvider.registerTaskLoaders(window.imDialogUploadTasks);
				}
			});
		}
		ready() {
			if (this.inited) {
				const promise = new BX.Promise();
				promise.resolve(this);
				return promise;
			}
			return this.initPromise;
		}
		requestData() {
			console.log('-> requestData');
			if (this.requestDataSend) {
				return this.requestDataSend;
			}
			this.timer.start('data', 'load', 0.5, () => {
				console.warn('ChatDialog.requestData: slow connection show progress icon');
				app.titleAction('setParams', {
					useProgress: true,
					useLetterImage: false
				});
			});
			this.requestDataSend = new Promise((resolve, reject) => {
				const query = {
					[im_const.RestMethodHandler.mobileBrowserConstGet]: [im_const.RestMethod.mobileBrowserConstGet, {}],
					[im_const.RestMethodHandler.imChatGet]: [im_const.RestMethod.imChatGet, {
						dialog_id: this.controller.application.getDialogId()
					}],
					[im_const.RestMethodHandler.imDialogMessagesGetInit]: [im_const.RestMethod.imDialogMessagesGet, {
						dialog_id: this.controller.application.getDialogId(),
						limit: this.controller.application.getRequestMessageLimit(),
						convert_text: 'Y'
					}],
					[im_const.RestMethodHandler.imRecentUnread]: [im_const.RestMethod.imRecentUnread, {
						dialog_id: this.controller.application.getDialogId(),
						action: 'N'
					}],
					[im_const.RestMethodHandler.imCallGetCallLimits]: [im_const.RestMethod.imCallGetCallLimits, {}]
				};
				if (im_lib_utils.Utils.dialog.isChatId(this.controller.application.getDialogId())) {
					query[im_const.RestMethodHandler.imUserGet] = [im_const.RestMethod.imUserGet, {}];
				} else {
					query[im_const.RestMethodHandler.imUserListGet] = [im_const.RestMethod.imUserListGet, {
						id: [this.controller.application.getUserId(), this.controller.application.getDialogId()]
					}];
				}
				this.controller.restClient.callBatch(query, response => {
					if (!response) {
						this.requestDataSend = null;
						this.setError('EMPTY_RESPONSE', 'Server returned an empty response.');
						resolve();
						return false;
					}
					console.log('<-- requestData', response);
					const constGet = response[im_const.RestMethodHandler.mobileBrowserConstGet];
					if (constGet.error()) {
						console.warn('Error load dialog', constGet.error().ex.error, constGet.error().ex.error_description);
						console.warn('Try connect...');
						setTimeout(() => this.requestData(), 5000);
					} else {
						this.controller.executeRestAnswer(im_const.RestMethodHandler.mobileBrowserConstGet, constGet);
					}
					const callLimits = response[im_const.RestMethodHandler.imCallGetCallLimits];
					if (callLimits && !callLimits.error()) {
						this.controller.executeRestAnswer(im_const.RestMethodHandler.imCallGetCallLimits, callLimits);
					}
					const userGet = response[im_const.RestMethodHandler.imUserGet];
					if (userGet && !userGet.error()) {
						this.controller.executeRestAnswer(im_const.RestMethodHandler.imUserGet, userGet);
					}
					const userListGet = response[im_const.RestMethodHandler.imUserListGet];
					if (userListGet && !userListGet.error()) {
						this.controller.executeRestAnswer(im_const.RestMethodHandler.imUserListGet, userListGet);
					}
					const chatGetResult = response[im_const.RestMethodHandler.imChatGet];
					this.controller.executeRestAnswer(im_const.RestMethodHandler.imChatGet, chatGetResult);
					this.redrawHeader();
					const dialogMessagesGetResult = response[im_const.RestMethodHandler.imDialogMessagesGetInit];
					if (dialogMessagesGetResult.error()) ; else {
						app.titleAction('setParams', {
							useProgress: false,
							useLetterImage: true
						});
						this.timer.stop('data', 'load', true);
						this.controller.getStore().dispatch('dialogues/saveDialog', {
							dialogId: this.controller.application.getDialogId(),
							chatId: this.controller.application.getChatId()
						});
						if (this.controller.pullBaseHandler) {
							this.controller.pullBaseHandler.option.skip = false;
						}
						this.controller.getStore().dispatch('application/set', {
							dialog: {
								enableReadMessages: true
							}
						}).then(() => {
							this.controller.executeRestAnswer(im_const.RestMethodHandler.imDialogMessagesGetInit, dialogMessagesGetResult);
						});
						this.processSendMessages();
					}
					this.requestDataSend = null;
					resolve();
				}, false, false, im_lib_utils.Utils.getLogTrackingParams({
					name: 'mobile.im.dialog',
					dialog: this.controller.application.getDialogData()
				}));
			});
			return this.requestDataSend;
		}
		executeUploaderEvent(eventName, eventData, taskId) {
			if (eventName !== BX.MobileUploaderConst.FILE_UPLOAD_PROGRESS) {
				console.log('ChatDialog.disk.eventRouter:', eventName, taskId, eventData);
			}
			switch (eventName) {
				case BX.MobileUploaderConst.FILE_UPLOAD_PROGRESS:
					{
						if (eventData.percent > 95) {
							eventData.percent = 95;
						}
						this.fileUpdateProgress(eventData.file.params.chatId, eventData.file.params.file.id, eventData.percent, eventData.byteTotal);
						break;
					}
				case BX.MobileUploaderConst.FILE_CREATED:
					{
						if (eventData.result.status === 'error') {
							this.fileError(eventData.file.params.chatId, eventData.file.params.file.id, eventData.file.params.id);
							console.error('File upload error', eventData.result.errors[0].message);
						} else {
							this.controller.getStore().dispatch('files/update', {
								chatId: eventData.file.params.chatId,
								id: eventData.file.params.file.id,
								fields: {
									status: im_const.FileStatus.wait,
									progress: 95
								}
							});
						}
						break;
					}
				case 'onimdiskmessageaddsuccess':
					{
						console.info('ChatDialog.disk.eventRouter: DISK_MESSAGE_ADD_SUCCESS:', eventData, taskId);
						const file = eventData.result.FILES[`upload${eventData.result.DISK_ID[0]}`];
						this.controller.getStore().dispatch('files/update', {
							chatId: eventData.file.params.chatId,
							id: eventData.file.params.file.id,
							fields: {
								status: im_const.FileStatus.upload,
								progress: 100,
								id: file.id,
								size: file.size,
								urlDownload: file.urlDownload,
								urlPreview: file.urlPreview,
								urlShow: file.urlShow
							}
						});
						break;
					}
				case 'onimdiskmessageaddfail':
					{
						console.error('ChatDialog.disk.eventRouter: DISK_MESSAGE_ADD_FAIL:', eventData, taskId);
						this.fileError(eventData.file.params.chatId, eventData.file.params.file.id, eventData.file.params.id);
						break;
					}
				case BX.MobileUploaderConst.TASK_CANCELLED:
				case BX.MobileUploaderConst.TASK_NOT_FOUND:
					{
						this.cancelUploadFile(eventData.file.params.file.id);
						break;
					}
				case BX.MobileUploaderConst.FILE_CREATED_FAILED:
				case BX.MobileUploaderConst.FILE_UPLOAD_FAILED:
				case BX.MobileUploaderConst.FILE_READ_ERROR:
				case BX.MobileUploaderConst.TASK_STARTED_FAILED:
					{
						console.error('ChatDialog.disk.eventRouter:', eventName, eventData, taskId);
						// show file error only if it is not internet connection error
						if (eventData?.error?.error?.code !== NO_INTERNET_CONNECTION_ERROR_CODE) {
							this.fileError(eventData.file.params.chatId, eventData.file.params.file.id, eventData.file.params.id);
						}
						break;
					}
				// No default
			}
			return true;
		}
		prepareFileData(files) {
			const prepareFunction = file => {
				if (file.urlPreview && file.urlPreview.startsWith('file://')) {
					file.urlPreview = `bx${file.urlPreview}`;
				}
				if (file.urlShow && file.urlShow.startsWith('file://')) {
					file.urlShow = `bx${file.urlShow}`;
				}
				if (file.type !== im_const.FileType.image) {
					return file;
				}
				if (file.urlPreview) {
					if (file.urlPreview.startsWith('/')) {
						file.urlPreview = currentDomain + file.urlPreview;
					}
					file.urlPreview = file.urlPreview.replace('http://', 'bxhttp://').replace('https://', 'bxhttps://');
				}
				if (file.urlShow) {
					if (file.urlShow.startsWith('/')) {
						file.urlShow = currentDomain + file.urlShow;
					}
					file.urlShow = file.urlShow.replace('http://', 'bxhttp://').replace('https://', 'bxhttps://');
				}
				return file;
			};
			return Array.isArray(files) ? files.map(file => prepareFunction(file)) : prepareFunction(files);
		}

		/* endregion 01. Initialize and store data */

		/* region 02. Mobile environment methods */
		redrawHeader() {
			let headerProperties;
			if (im_lib_utils.Utils.dialog.isChatId(this.controller.application.getDialogId())) {
				headerProperties = this.getChatHeaderParams();
				this.changeChatKeyboardStatus();
			} else {
				headerProperties = this.getUserHeaderParams();
			}
			if (!headerProperties) {
				return false;
			}
			this.setHeaderButtons();
			if (!this.headerMenuInited) {
				BXMobileApp.UI.Page.TopBar.title.params.useLetterImage = true;
				BXMobileApp.UI.Page.TopBar.title.setCallback(() => this.openHeaderMenu());
				this.headerMenuInited = true;
			}
			if (headerProperties.name) {
				BXMobileApp.UI.Page.TopBar.title.setText(headerProperties.name);
			}
			if (headerProperties.desc) {
				BXMobileApp.UI.Page.TopBar.title.setDetailText(headerProperties.desc);
			}
			if (headerProperties.avatar) {
				BXMobileApp.UI.Page.TopBar.title.setImage(headerProperties.avatar);
			} else if (headerProperties.color) {
				// BXMobileApp.UI.Page.TopBar.title.setImageColor(dialog.color);
				BXMobileApp.UI.Page.TopBar.title.params.imageColor = headerProperties.color;
			}
			return true;
		}
		setIosInset() {
			if (!im_lib_utils.Utils.platform.isIos()) {
				return false;
			}
			const getScrollElement = () => {
				return document.getElementsByClassName('bx-im-dialog-list')[0];
			};
			const setTopInset = scrollElement => {
				scrollElement.style.paddingTop = `${window.safeAreaInsets.top}px`;
			};
			const onScrollChange = () => {
				const scrollElement = getScrollElement();
				if (!scrollElement) {
					return false;
				}
				if (scrollElement.scrollTop <= window.safeAreaInsets.top) {
					setTopInset(scrollElement);
					scrollElement.removeEventListener('scroll', onScrollChange);
				}
			};
			if (this.iosInsetEventSetted) {
				return true;
			}
			this.iosInsetEventSetted = true;
			const onInsetsChanged = im_lib_utils.Utils.debounce(() => {
				const scrollElement = getScrollElement();
				if (!scrollElement) {
					return false;
				}
				if (window.safeAreaInsets && scrollElement.scrollTop <= window.safeAreaInsets.top) {
					setTopInset(scrollElement);
				} else {
					scrollElement.removeEventListener('scroll', onScrollChange);
					scrollElement.addEventListener('scroll', onScrollChange);
				}
			}, 100);
			BXMobileApp.addCustomEvent('onInsetsChanged', onInsetsChanged);
			setTimeout(onInsetsChanged, 1000);
			return true;
		}
		getUserHeaderParams() {
			const user = this.controller.getStore().getters['users/get'](this.controller.application.getDialogId());
			if (!user || !user.init) {
				return false;
			}
			const result = {
				name: null,
				desc: null,
				avatar: null,
				color: null
			};
			if (user.avatar) {
				result.avatar = user.avatar;
			} else {
				result.color = user.color;
			}
			result.name = user.name;
			let showLastDate = false;
			if (!this.userShowWorkPosition && user.lastActivityDate) {
				showLastDate = im_lib_utils.Utils.user.getLastDateText(user, this.getLocalize());
			}
			if (showLastDate) {
				result.desc = showLastDate;
			} else if (user.extranet) {
				result.desc = this.getLocalize('IM_LIST_EXTRANET');
			} else if (user.workPosition) {
				result.desc = user.workPosition;
			} else {
				result.desc = this.getLocalize('MOBILE_HEADER_MENU_CHAT_TYPE_USER');
			}
			return result;
		}
		getChatHeaderParams() {
			const dialog = this.controller.getStore().getters['dialogues/get'](this.controller.application.getDialogId());
			if (!dialog || !dialog.init) {
				return false;
			}
			const result = {
				name: null,
				desc: null,
				avatar: null,
				color: null
			};
			if (dialog.avatar) {
				result.avatar = dialog.avatar;
			} else {
				result.color = dialog.color;
			}
			if (dialog.entityType === 'GENERAL') {
				result.avatar = encodeURI(`${this.controller.getHost()}/bitrix/mobileapp/immobile/components/im/messenger/images/avatar_general_x3.png`);
			}
			result.name = dialog.name;
			let chatTypeTitle = this.getLocalize('MOBILE_HEADER_MENU_CHAT_TYPE_CHAT_NEW_MSGVER_1');
			if (this.chatShowUserCounter && this.getLocalize().MOBILE_HEADER_MENU_CHAT_USER_COUNT) {
				chatTypeTitle = this.getLocalize('MOBILE_HEADER_MENU_CHAT_USER_COUNT').replace('#COUNT#', dialog.userCounter);
			} else if (this.getLocalize()[`MOBILE_HEADER_MENU_CHAT_TYPE_${dialog.type.toUpperCase()}_NEW`]) {
				chatTypeTitle = this.getLocalize(`MOBILE_HEADER_MENU_CHAT_TYPE_${dialog.type.toUpperCase()}_NEW`);
			} else if (this.getLocalize()[`MOBILE_HEADER_MENU_CHAT_TYPE_${dialog.type.toUpperCase()}_NEW_MSGVER_1`]) {
				chatTypeTitle = this.getLocalize(`MOBILE_HEADER_MENU_CHAT_TYPE_${dialog.type.toUpperCase()}_NEW_MSGVER_1`);
			}
			result.desc = chatTypeTitle;
			if (dialog.entityType === 'SUPPORT24_QUESTION') {
				result.avatar = encodeURI(`${this.controller.getHost()}/bitrix/mobileapp/immobile/components/im/messenger/images/avatar_24_question_x3.png`);
				result.desc = '';
			}
			console.warn(result);
			return result;
		}
		changeChatKeyboardStatus() {
			const dialog = this.controller.getStore().getters['dialogues/get'](this.controller.application.getDialogId());
			if (!dialog || !dialog.init) {
				BXMobileApp.UI.Page.TextPanel.show();
				return true;
			}
			let keyboardShow = true;
			if (dialog.type === 'announcement' && !dialog.managerList.includes(this.controller.application.getUserId())) {
				keyboardShow = false;
			} else if (dialog.restrictions.send === false) {
				keyboardShow = false;
			}
			if (typeof this.keyboardShowFlag !== 'undefined' && (this.keyboardShowFlag && keyboardShow || !this.keyboardShowFlag && !keyboardShow)) {
				return this.keyboardShowFlag;
			}
			if (keyboardShow) {
				BXMobileApp.UI.Page.TextPanel.show();
				this.keyboardShowFlag = true;
			} else {
				BXMobileApp.UI.Page.TextPanel.hide();
				this.keyboardShowFlag = false;
			}
			return this.keyboardShowFlag;
		}
		setHeaderButtons() {
			if (this.callMenuSetted) {
				return true;
			}
			if (im_lib_utils.Utils.dialog.isChatId(this.controller.application.getDialogId())) {
				const dialogData = this.controller.application.getDialogData();
				if (!dialogData.init) {
					return false;
				}
				const maxParticipants = this.controller.application.getData().call.maxParticipants;
				if (dialogData.userCounter > maxParticipants || dialogData.entityType === 'VIDEOCONF' && dialogData.entityData1 === 'BROADCAST') {
					if (dialogData.type !== im_const.DialogType.call && dialogData.restrictions.extend) {
						app.exec('setRightButtons', {
							items: [{
								type: 'user_plus',
								callback: () => {
									fabric.Answers.sendCustomEvent('vueChatAddUserButton', {});
									this.openAddUserDialog();
								}
							}]
						});
					} else {
						app.exec('setRightButtons', {
							items: []
						});
					}
					this.callMenuSetted = true;
					return true;
				}
				if (!dialogData.restrictions.call) {
					app.exec('setRightButtons', {
						items: []
					});
					this.callMenuSetted = true;
					return true;
				}
			} else {
				const userData = this.controller.getStore().getters['users/get'](this.controller.application.getDialogId(), true);
				if (!userData.init) {
					return false;
				}
				if (!userData || userData.bot || userData.network || this.controller.application.getUserId() === parseInt(this.controller.application.getDialogId())) {
					app.exec('setRightButtons', {
						items: []
					});
					this.callMenuSetted = true;
					return true;
				}
			}
			app.exec('setRightButtons', {
				items: [{
					type: 'call_audio',
					callback: () => {
						if (im_lib_utils.Utils.dialog.isChatId(this.controller.application.getDialogId())) {
							BXMobileApp.Events.postToComponent('onCallInvite', {
								dialogId: this.controller.application.getDialogId(),
								video: false,
								chatData: this.controller.application.getDialogData()
							}, 'calls');
						} else {
							const userData = this.controller.getStore().getters['users/get'](this.controller.application.getDialogId(), true);
							BXMobileApp.Events.postToComponent('onCallInvite', {
								userId: this.controller.application.getDialogId(),
								video: false,
								userData: {
									[userData.id]: userData
								}
							}, 'calls');
						}
					}
				}, {
					type: 'call_video',
					badgeCode: 'call_video',
					callback: () => {
						fabric.Answers.sendCustomEvent('vueChatCallVideoButton', {});
						if (im_lib_utils.Utils.dialog.isChatId(this.controller.application.getDialogId())) {
							BXMobileApp.Events.postToComponent('onCallInvite', {
								dialogId: this.controller.application.getDialogId(),
								video: true,
								chatData: this.controller.application.getDialogData()
							}, 'calls');
						} else {
							BXMobileApp.Events.postToComponent('onCallInvite', {
								dialogId: this.controller.application.getDialogId(),
								video: true,
								userData: {
									[this.controller.application.getDialogId()]: this.controller.getStore().getters['users/get'](this.controller.application.getDialogId(), true)
								}
							}, 'calls');
						}
					}
				}]
			});
			this.callMenuSetted = true;
			return true;
		}
		openUserList(params = {}) {
			const {
				users = false,
				title = '',
				listType = 'LIST',
				backdrop = true
			} = params;
			const settings = {
				title,
				objectName: 'ChatUserListInterface'
			};
			if (backdrop) {
				settings.backdrop = {};
			}
			app.exec('openComponent', {
				name: 'JSStackComponent',
				componentCode: 'im.dialog.list',
				scriptPath: `/mobileapp/jn/im:im.chat.user.list/?version=${BX.componentParameters.get('WIDGET_CHAT_USERS_VERSION', '1.0.0')}`,
				params: {
					DIALOG_ID: this.controller.application.getDialogId(),
					DIALOG_OWNER_ID: this.controller.application.getDialogData().ownerId,
					USER_ID: this.controller.application.getUserId(),
					LIST_TYPE: listType,
					USERS: users,
					IS_BACKDROP: true
				},
				rootWidget: {
					name: 'list',
					settings
				}
			}, false);
		}
		openCallMenu() {
			fabric.Answers.sendCustomEvent('vueChatCallAudioButton', {});
			const userData = this.controller.getStore().getters['users/get'](this.controller.application.getDialogId(), true);
			if (userData.phones.personalMobile || userData.phones.workPhone || userData.phones.personalPhone || userData.phones.innerPhone) {
				BackdropMenu.create(`im.dialog.menu.call|${this.controller.application.getDialogId()}`).setItems([BackdropMenuItem.create('audio').setTitle(this.getLocalize('MOBILE_HEADER_MENU_AUDIO_CALL')), BackdropMenuItem.create('personalMobile').setTitle(userData.phones.personalMobile).setSubTitle(this.getLocalize('MOBILE_MENU_CALL_MOBILE')).skip(!userData.phones.personalMobile), BackdropMenuItem.create('workPhone').setTitle(userData.phones.workPhone).setSubTitle(this.getLocalize('MOBILE_MENU_CALL_WORK')).skip(!userData.phones.workPhone), BackdropMenuItem.create('personalPhone').setTitle(userData.phones.personalPhone).setSubTitle(this.getLocalize('MOBILE_MENU_CALL_PHONE')).skip(!userData.phones.personalPhone), BackdropMenuItem.create('innerPhone').setTitle(userData.phones.innerPhone).setSubTitle(this.getLocalize('MOBILE_MENU_CALL_PHONE')).skip(!userData.phones.innerPhone)]).setVersion(BX.componentParameters.get('WIDGET_BACKDROP_MENU_VERSION', '1.0.0')).setEventListener((name, params, user, backdrop) => {
					if (name !== 'selected') {
						return false;
					}
					if (params.id === 'audio') {
						BXMobileApp.Events.postToComponent('onCallInvite', {
							userId: this.controller.application.getDialogId(),
							video: false,
							userData: {
								[user.id]: user
							}
						}, 'calls');
					} else if (params.id === 'innerPhone') {
						BX.MobileTools.phoneTo(user.phones[params.id], {
							callMethod: 'telephony'
						});
					} else {
						BX.MobileTools.phoneTo(user.phones[params.id], {
							callMethod: 'device'
						});

						// items options
						// .setType(BackdropMenuItemType.menu)
						// .disableClose(BX.MobileTools.canUseTelephony())
						// if (!BX.MobileTools.canUseTelephony())
						// {
						// 	BX.MobileTools.phoneTo(user.phones[params.id], {callMethod: 'device'});
						// 	return false
						// }
						//
						// let subMenu = BackdropMenu
						// 	.create('im.dialog.menu.call.submenu|'+this.controller.application.getDialogId())
						// 	.setItems([
						// 		BackdropMenuItem.create('number')
						// 			.setType(BackdropMenuItemType.info)
						// 			.setTitle(this.getLocalize("MOBILE_MENU_CALL_TO")
						// 			.replace('#PHONE_NUMBER#', user.phones[params.id]))
						// 			.setHeight(50)
						// 			.setStyles(BackdropMenuStyle.create().setFont(WidgetListItemFont.create().setFontStyle('bold')))
						// 			.setDisabled(),
						// 		BackdropMenuItem.create('telephony').setTitle(this.getLocalize("MOBILE_CALL_BY_B24")),
						// 		BackdropMenuItem.create('device').setTitle(this.getLocalize("MOBILE_CALL_BY_MOBILE")),
						// 	])
						// 	.setEventListener((name, params, options, backdrop) =>
						// 	{
						// 		if (name !== 'selected')
						// 		{
						// 			return false;
						// 		}
						// 		BX.MobileTools.phoneTo(options.phone, {callMethod: params.id});
						// 	})
						// 	.setCustomParams({phone: user.phones[params.id]})
						// ;
						// backdrop.showSubMenu(subMenu);
					}
				}).setCustomParams(userData).show();
			} else {
				BXMobileApp.Events.postToComponent('onCallInvite', {
					userId: this.controller.application.getDialogId(),
					video: false,
					userData: {
						[this.controller.application.getDialogId()]: userData
					}
				}, 'calls');
			}
		}
		leaveChat(confirm = false) {
			if (!confirm) {
				app.confirm({
					title: this.getLocalize('MOBILE_HEADER_MENU_LEAVE_CONFIRM'),
					text: '',
					buttons: [this.getLocalize('MOBILE_HEADER_MENU_LEAVE_YES'), this.getLocalize('MOBILE_HEADER_MENU_LEAVE_NO')],
					callback: button => {
						if (button === 1) {
							this.leaveChat(true);
						}
					}
				});
				return true;
			}
			const dialogId = this.controller.application.getDialogId();
			this.controller.restClient.callMethod(im_const.RestMethod.imChatLeave, {
				DIALOG_ID: dialogId
			}, null, null, im_lib_utils.Utils.getLogTrackingParams({
				name: im_const.RestMethod.imChatLeave,
				dialog: this.controller.application.getDialogData(dialogId)
			})).then(response => {
				app.closeController();
			});
		}
		openAddUserDialog() {
			const listUsers = this.getItemsForAddUserDialog();
			app.exec('openComponent', {
				name: 'JSStackComponent',
				componentCode: 'im.chat.user.selector',
				scriptPath: `/mobileapp/jn/im:im.chat.user.selector/?version=${BX.componentParameters.get('WIDGET_CHAT_RECIPIENTS_VERSION', '1.0.0')}`,
				params: {
					DIALOG_ID: this.controller.application.getDialogId(),
					USER_ID: this.controller.application.getUserId(),
					LIST_USERS: listUsers,
					LIST_DEPARTMENTS: [],
					SKIP_LIST: [],
					SEARCH_MIN_SIZE: BX.componentParameters.get('SEARCH_MIN_TOKEN_SIZE', 3)
				},
				rootWidget: {
					name: 'chat.recipients',
					settings: {
						objectName: 'ChatUserSelectorInterface',
						title: BX.message('MOBILE_HEADER_MENU_USER_ADD'),
						limit: 100,
						items: listUsers.map(element => ChatDataConverter.getListElementByUser(element)),
						scopes: [{
							title: BX.message('MOBILE_SCOPE_USERS'),
							id: 'user'
						}, {
							title: BX.message('MOBILE_SCOPE_DEPARTMENTS'),
							id: 'department'
						}],
						backdrop: {
							showOnTop: true
						}
					}
				}
			}, false);
		}
		getItemsForAddUserDialog() {
			const items = [];
			const itemsIndex = {};
			if (this.widgetCache.recentList.length > 0) {
				this.widgetCache.recentList.map(element => {
					if (!element || itemsIndex[element.id]) {
						return false;
					}
					if (element.type !== 'user') {
						return false;
					}
					if (element.user.network || element.user.connector) {
						return false;
					}
					items.push(element.user);
					itemsIndex[element.id] = true;
					return true;
				});
			}
			this.widgetCache.colleaguesList.map(element => {
				if (!element || itemsIndex[element.id]) {
					return false;
				}
				if (element.network || element.connector) {
					return false;
				}
				items.push(element);
				itemsIndex[element.id] = true;
			});
			this.widgetCache.lastSearchList.map(element => {
				if (!element || itemsIndex[element.id]) {
					return false;
				}
				if (!element) {
					return false;
				}
				if (element.type !== 'user') {
					return false;
				}
				if (element.user.network || element.user.connector) {
					return false;
				}
				items.push(element.user);
				itemsIndex[element.id] = true;
				return true;
			});

			/*
			let skipList = ChatMessengerCommon.getChatUsers();
			if (skipList.indexOf(this.base.userId) === -1)
			{
				skipList.push(this.base.userId)
			}
			items = items.filter((element) => skipList.indexOf(element.id) === -1);
			*/

			return items;
		}

		/* endregion 02. Mobile environment methods */

		/* region 02. Push & Pull */

		eventStoreInteraction(data) {
			if (data.type === 'dialogues/update' && data.payload && data.payload.fields) {
				if (data.payload.dialogId !== this.controller.application.getDialogId()) {
					return;
				}
				if (typeof data.payload.fields.name !== 'undefined' || typeof data.payload.fields.userCounter !== 'undefined') {
					if (typeof data.payload.fields.userCounter !== 'undefined') {
						this.callMenuSetted = false;
					}
					this.redrawHeader();
				}
				if (typeof data.payload.fields.counter !== 'undefined' && typeof data.payload.dialogId !== 'undefined') {
					BXMobileApp.Events.postToComponent('chatdialog::counter::change', [{
						dialogId: data.payload.dialogId,
						counter: data.payload.fields.counter
					}, true], 'im.recent');
					BXMobileApp.Events.postToComponent('chatdialog::counter::change', [{
						dialogId: data.payload.dialogId,
						counter: data.payload.fields.counter
					}, true], 'im.messenger');
				}
			} else if (data.type === 'dialogues/set') {
				data.payload.forEach(dialog => {
					if (dialog.dialogId !== this.controller.application.getDialogId()) {
						return;
					}
					BXMobileApp.Events.postToComponent('chatdialog::counter::change', [{
						dialogId: dialog.dialogId,
						counter: dialog.counter
					}, true], 'im.recent');
					BXMobileApp.Events.postToComponent('chatdialog::counter::change', [{
						dialogId: dialog.dialogId,
						counter: dialog.counter
					}, true], 'im.messenger');
				});
			}
		}
		eventStatusInteraction(data) {
			if (data.status === mobile_pull_client.PullClient.PullStatus.Online) {
				// restart background tasks (messages and files) to resend files after we got connection again
				if (this.messagesSet) {
					BXMobileApp.Events.postToComponent('chatbackground::task::restart', [], 'background');
					BXMobileApp.Events.postToComponent('chatuploader::task::restart', [], 'background');
				}
				if (this.pullRequestMessage) {
					this.controller.pullBaseHandler.option.skip = true;
					this.getDialogUnread().then(() => {
						this.controller.pullBaseHandler.option.skip = false;
						this.processSendMessages();
						main_core_events.EventEmitter.emit(im_const.EventType.dialog.readVisibleMessages, {
							chatId: this.controller.application.getChatId()
						});
						main_core_events.EventEmitter.emit(im_const.EventType.dialog.scrollOnStart, {
							chatId: this.controller.application.getChatId()
						});
					}).catch(() => {
						this.controller.pullBaseHandler.option.skip = false;
						this.processSendMessages();
					});
					this.pullRequestMessage = false;
				} else {
					main_core_events.EventEmitter.emit(im_const.EventType.dialog.readMessage);
					this.processSendMessages();
				}
			} else if (data.status === mobile_pull_client.PullClient.PullStatus.Offline) {
				this.pullRequestMessage = true;
			}
		}
		eventOnlineInteraction(data) {
			if (data.command === 'list' || data.command === 'userStatus') {
				for (const userId in data.params.users) {
					if (!data.params.users.hasOwnProperty(userId)) {
						continue;
					}
					this.controller.getStore().dispatch('users/update', {
						id: data.params.users[userId].id,
						fields: data.params.users[userId]
					});
					if (userId.toString() === this.controller.application.getDialogId()) {
						this.redrawHeader();
					}
				}
			}
		}

		/* endregion 02. Push & Pull */

		getKeyboardParams(params = {}) {
			const dialogData = this.controller.application.getDialogData();
			let initialText = dialogData ? dialogData.textareaMessage : '';
			initialText = initialText || params.text;
			const siteDir = this.getLocalize('SITE_DIR');
			return {
				text: initialText,
				placeholder: this.getLocalize('MOBILE_CHAT_PANEL_PLACEHOLDER'),
				smileButton: {},
				useImageButton: true,
				useAudioMessages: true,
				mentionDataSource: {
					outsection: 'NO',
					url: `${siteDir}mobile/index.php?mobile_action=get_user_list&use_name_format=Y&with_bots`
				},
				attachFileSettings: {
					previewMaxWidth: 640,
					previewMaxHeight: 640,
					resize: {
						targetWidth: -1,
						targetHeight: -1,
						sourceType: 1,
						encodingType: 0,
						mediaType: 2,
						allowsEdit: false,
						saveToPhotoAlbum: true,
						popoverOptions: false,
						cameraDirection: 0
					},
					sendFileSeparately: true,
					showAttachedFiles: true,
					editingMediaFiles: false,
					maxAttachedFilesCount: 100
				},
				attachButton: {
					items: [{
						id: 'disk',
						name: this.getLocalize('MOBILE_CHAT_PANEL_UPLOAD_DISK_V2'),
						dataSource: {
							multiple: false,
							url: `${siteDir}mobile/?mobile_action=disk_folder_list&type=user&path=%2F&entityId=${this.controller.application.getUserId()}`,
							TABLE_SETTINGS: {
								searchField: true,
								showtitle: true,
								modal: true,
								name: this.getLocalize('MOBILE_CHAT_PANEL_UPLOAD_DISK_FILES')
							}
						}
					}, {
						id: 'mediateka',
						name: this.getLocalize('MOBILE_CHAT_PANEL_UPLOAD_GALLERY')
					}, {
						id: 'camera',
						name: this.getLocalize('MOBILE_CHAT_PANEL_UPLOAD_CAMERA')
					}]
				},
				action: data => {
					if (typeof data === 'string') {
						data = {
							text: data,
							attachedFiles: []
						};
					}
					const text = data.text.toString().trim();
					const attachedFiles = Array.isArray(data.attachedFiles) ? data.attachedFiles : [];
					if (attachedFiles.length <= 0) {
						this.clearText();
						this.hideSmiles();
						const editId = this.controller.getStore().getters['dialogues/getEditId'](this.controller.application.getDialogId());
						if (editId) {
							this.updateMessage(editId, text);
						} else {
							this.addMessage(text);
						}
					} else {
						attachedFiles.forEach(file => {
							// disk
							if (typeof file.dataAttributes !== 'undefined') {
								fabric.Answers.sendCustomEvent('vueChatFileDisk', {});
								return this.uploadFile({
									source: 'disk',
									name: file.name,
									type: file.type.toString().toLowerCase(),
									preview: !file.dataAttributes.URL || !file.dataAttributes.URL.PREVIEW ? null : {
										url: file.dataAttributes.URL.PREVIEW,
										width: file.dataAttributes.URL.PREVIEW.match(/(width=(\d+))/i)[2],
										height: file.dataAttributes.URL.PREVIEW.match(/(height=(\d+))/i)[2]
									},
									uploadLink: parseInt(file.dataAttributes.ID)
								});
							}

							// audio
							if (file.type === 'audio/mp4') {
								fabric.Answers.sendCustomEvent('vueChatFileAudio', {});
								return this.uploadFile({
									source: 'audio',
									name: `mobile_audio_${new Date().toJSON().slice(0, 19).replace('T', '_').split(':').join('-')}.mp3`,
									type: 'mp3',
									preview: null,
									uploadLink: file.url
								});
							}
							let filename = file.name;
							const fileType = im_model.FilesModel.getType(file.name);
							if (fileType === im_const.FileType.video) {
								fabric.Answers.sendCustomEvent('vueChatFileVideo', {});
							} else if (fileType === im_const.FileType.image) {
								fabric.Answers.sendCustomEvent('vueChatFileImage', {});
							} else {
								fabric.Answers.sendCustomEvent('vueChatFileOther', {});
							}
							if (fileType === im_const.FileType.image || fileType === im_const.FileType.video) {
								let extension = file.name.split('.').slice(-1)[0].toLowerCase();
								if (file.type === 'image/heic') {
									extension = 'jpg';
								}
								filename = `mobile_file_${new Date().toJSON().slice(0, 19).replace('T', '_').split(':').join('-')}.${extension}`;
							}

							// file
							return this.uploadFile({
								source: 'gallery',
								name: filename,
								type: file.type.toString().toLowerCase(),
								preview: file.previewUrl ? {
									url: file.previewUrl,
									width: file.previewWidth,
									height: file.previewHeight
								} : null,
								uploadLink: file.url
							});
						});
					}
				},
				callback: data => {
					console.log('Textpanel callback', data);
					if (!data.event) {
						return false;
					}
					if (data.event === 'onKeyPress') {
						const text = data.text.toString();
						if (text.trim().length > 2) {
							this.controller.application.startWriting();
						}
						if (text.length === 0) {
							this.setTextareaMessage({
								message: ''
							});
							this.controller.application.stopWriting();
						} else {
							this.setTextareaMessage({
								message: text
							});
						}
					} else if (data.event === 'onSmileSelect') {
						this.controller.showSmiles();
					} else if (Application.getPlatform() !== 'android') {
						if (data.event === 'getFocus') {
							if (im_lib_utils.Utils.platform.isIos() && im_lib_utils.Utils.platform.getIosVersion() > 12) {
								main_core_events.EventEmitter.emit(im_const.EventType.dialog.scrollToBottom, {
									chatId: this.controller.application.getChatId(),
									duration: 300,
									cancelIfScrollChange: true
								});
							}
						} else if (data.event === 'removeFocus') ;
					}
				}
			};
		}

		/* region 04. Rest methods */

		addMessage(text, file = null, messageUuid = null) {
			if (!text && !file) {
				return false;
			}
			const uuid = messageUuid || ChatUtils.getUuidv4();
			const quoteId = this.controller.getStore().getters['dialogues/getQuoteId'](this.controller.application.getDialogId());
			if (quoteId) {
				const quoteMessage = this.controller.getStore().getters['messages/getMessage'](this.controller.application.getChatId(), quoteId);
				if (quoteMessage) {
					let user = null;
					if (quoteMessage.authorId) {
						user = this.controller.getStore().getters['users/get'](quoteMessage.authorId);
					}
					const files = this.controller.getStore().getters['files/getList'](this.controller.application.getChatId());
					const message = [];
					message.push('-'.repeat(54));
					message.push(`${user && user.name ? user.name : this.getLocalize('MOBILE_CHAT_SYSTEM_MESSAGE')} [${im_lib_utils.Utils.date.format(quoteMessage.date, null, this.getLocalize())}]`);
					message.push(im_lib_utils.Utils.text.quote(quoteMessage.text, quoteMessage.params, files, this.getLocalize()));
					message.push('-'.repeat(54), text);
					text = message.join('\n');
					this.quoteMessageClear();
				}
			}
			console.warn('addMessage', text, file, uuid);
			if (!this.controller.application.isUnreadMessagesLoaded()) {
				this.sendMessage({
					id: uuid,
					chatId: this.controller.application.getChatId(),
					dialogId: this.controller.application.getDialogId(),
					text,
					file
				});
				this.processSendMessages();
				return true;
			}
			this.controller.getStore().commit('application/increaseDialogExtraCount');
			const params = {};
			if (file) {
				params.FILE_ID = [file.id];
			}
			this.controller.getStore().dispatch('messages/add', {
				id: uuid,
				chatId: this.controller.application.getChatId(),
				authorId: this.controller.application.getUserId(),
				text: text,
				params,
				sending: !file
			}).then(messageId => {
				main_core_events.EventEmitter.emit(im_const.EventType.dialog.scrollToBottom, {
					chatId: this.controller.application.getChatId(),
					cancelIfScrollChange: true
				});
				this.messagesQueue.push({
					id: messageId,
					chatId: this.controller.application.getChatId(),
					dialogId: this.controller.application.getDialogId(),
					text,
					file,
					sending: false
				});
				if (this.controller.application.getChatId()) {
					this.processSendMessages();
				} else {
					this.requestData();
				}
			});
			return true;
		}
		uploadFile(file, text = '') {
			if (!file) {
				return false;
			}
			const fileMessageUuid = ChatUtils.getUuidv4();
			console.warn('addFile', file, text, fileMessageUuid);
			if (!this.controller.application.isUnreadMessagesLoaded()) {
				this.addMessage(text, {
					id: 0,
					source: file
				}, fileMessageUuid);
				return true;
			}
			this.controller.getStore().dispatch('files/add', this.controller.application.prepareFilesBeforeSave({
				chatId: this.controller.application.getChatId(),
				authorId: this.controller.application.getUserId(),
				name: file.name,
				type: im_model.FilesModel.getType(file.name),
				extension: file.name.split('.').splice(-1)[0],
				size: 0,
				image: file.preview ? {
					width: file.preview.width,
					height: file.preview.height
				} : false,
				status: file.source === 'disk' ? im_const.FileStatus.wait : im_const.FileStatus.upload,
				progress: 0,
				authorName: this.controller.application.getCurrentUser().name,
				urlPreview: file.preview ? file.preview.url : ''
			})).then(fileId => this.addMessage(text, {
				id: fileId,
				...file
			}, fileMessageUuid));
			return true;
		}
		cancelUploadFile(fileId) {
			this.cancelUnsentFile(fileId);
			let element = this.messagesQueue.find(element => element.file && element.file.id === fileId);
			if (!element) {
				const messages = this.controller.getStore().getters['messages/get'](this.controller.application.getChatId());
				const messageToDelete = messages.find(element => element.params.FILE_ID && element.params.FILE_ID.includes(fileId));
				if (messageToDelete) {
					element = {
						id: messageToDelete.id,
						chatId: messageToDelete.chatId,
						file: {
							id: messageToDelete.params.FILE_ID[0]
						}
					};
				}
			}
			if (element) {
				BX.MobileUploadProvider.cancelTasks([`imDialogFileUpload|${fileId}`]);
				this.controller.getStore().dispatch('messages/delete', {
					chatId: element.chatId,
					id: element.id
				}).then(() => {
					this.controller.getStore().dispatch('files/delete', {
						chatId: element.chatId,
						id: element.file.id
					});
					this.messagesQueue = this.messagesQueue.filter(el => el.id !== element.id);
				});
			}
		}
		retryUploadFile(fileId) {
			const element = this.messagesQueue.find(element => element.file && element.file.id === fileId);
			if (!element) {
				return false;
			}
			this.controller.getStore().dispatch('messages/actionStart', {
				chatId: element.chatId,
				id: element.id
			}).then(() => {
				this.controller.getStore().dispatch('files/update', {
					chatId: element.chatId,
					id: element.file.id,
					fields: {
						status: im_const.FileStatus.upload,
						progress: 0
					}
				});
			});
			element.sending = false;
			this.processSendMessages();
			return true;
		}
		processSendMessages() {
			this.messagesQueue.filter(element => !element.sending).forEach(element => {
				element.sending = true;
				if (element.file) {
					if (element.file.source === 'disk') {
						this.fileCommit({
							chatId: element.chatId,
							dialogId: element.dialogId,
							diskId: element.file.uploadLink,
							messageText: element.text,
							messageId: element.id,
							fileId: element.file.id,
							fileType: im_model.FilesModel.getType(element.file.name)
						}, element);
					} else if (this.controller.application.getDiskFolderId()) {
						this.sendMessageWithFile(element);
					} else {
						element.sending = false;
						this.requestDiskFolderId();
					}
				} else {
					element.sending = true;
					this.sendMessage(element);
				}
			});
			return true;
		}
		processMarkReadMessages() {
			this.controller.application.readMessageExecute(this.controller.application.getChatId(), true);
			return true;
		}
		sendMessage(message) {
			message.text = message.text.replace(/^(-{21}\n)/gm, `${'-'.repeat(54)}\n`);
			this.controller.application.stopWriting(message.dialogId);
			window.imDialogMessagesTasks.push({
				taskId: `sendMessage|${message.id}`
			});
			BXMobileApp.Events.postToComponent('chatbackground::task::add', [`sendMessage|${message.id}`, [im_const.RestMethod.imMessageAdd, {
				TEMPLATE_ID: message.id,
				DIALOG_ID: message.dialogId,
				MESSAGE: message.text
			}], message], 'background');
		}
		sendMessageWithFile(message) {
			const fileType = im_model.FilesModel.getType(message.file.name);
			const fileExtension = message.file.name.toString().toLowerCase().split('.').splice(-1)[0];
			const attachPreviewFile = fileType !== im_const.FileType.image && message.file.preview;
			const needConvert = fileType === im_const.FileType.image && message.file.type !== 'image/gif' || fileType === im_const.FileType.video;
			window.imDialogUploadTasks.push({
				taskId: `imDialogFileUpload|${message.file.id}`
			});
			BX.MobileUploadProvider.addTasks([{
				url: message.file.uploadLink,
				params: message,
				name: message.file.name,
				type: fileExtension,
				mimeType: fileType === im_const.FileType.audio ? 'audio/mp4' : null,
				resize: needConvert ? {
					quality: 80,
					width: 1920,
					height: 1080
				} : null,
				previewUrl: attachPreviewFile ? message.file.preview.url : '',
				folderId: this.controller.application.getDiskFolderId(),
				taskId: `imDialogFileUpload|${message.file.id}`,
				onDestroyEventName: 'onimdiskmessageaddsuccess'
			}]);
		}
		fileError(chatId, fileId, messageId = 0) {
			this.controller.getStore().dispatch('files/update', {
				chatId: chatId,
				id: fileId,
				fields: {
					status: im_const.FileStatus.error,
					progress: 0
				}
			});
			if (messageId) {
				this.controller.getStore().dispatch('messages/actionError', {
					chatId: chatId,
					id: messageId,
					retry: true
				});
			}
		}
		fileCommit(params, message) {
			const queryParams = {
				chat_id: params.chatId,
				message: params.messageText,
				template_id: params.messageId ? params.messageId : 0,
				file_template_id: params.fileId ? params.fileId : 0
			};
			if (params.uploadId) {
				queryParams.upload_id = params.uploadId;
			} else if (params.diskId) {
				queryParams.disk_id = params.diskId;
			}
			BXMobileApp.Events.postToComponent('chatbackground::task::add', [`uploadFileFromDisk|${message.id}`, [im_const.RestMethod.imDiskFileCommit, queryParams], message], 'background');
		}
		requestDiskFolderId() {
			if (this.flagRequestDiskFolderIdSended || this.controller.application.getDiskFolderId()) {
				return true;
			}
			this.flagRequestDiskFolderIdSended = true;
			this.controller.restClient.callMethod(im_const.RestMethod.imDiskFolderGet, {
				chat_id: this.controller.application.getChatId()
			}).then(response => {
				this.controller.executeRestAnswer(im_const.RestMethodHandler.imDiskFolderGet, response);
				this.flagRequestDiskFolderIdSended = false;
				this.processSendMessages();
			}).catch(error => {
				this.flagRequestDiskFolderIdSended = false;
				this.controller.executeRestAnswer(im_const.RestMethodHandler.imDiskFolderGet, error);
			});
			return true;
		}
		getDialogHistory(lastId, limit = this.controller.application.getRequestMessageLimit()) {
			this.controller.restClient.callMethod(im_const.RestMethod.imDialogMessagesGet, {
				CHAT_ID: this.controller.application.getChatId(),
				LAST_ID: lastId,
				LIMIT: limit,
				CONVERT_TEXT: 'Y'
			}).then(result => {
				this.controller.executeRestAnswer(im_const.RestMethodHandler.imDialogMessagesGet, result);
				// this.controller.application.emit(EventType.dialog.requestHistoryResult, {count: result.data().messages.length});
			}).catch(result => {
				// this.controller.emit(EventType.dialog.requestHistoryResult, {error: result.error().ex});
			});
		}
		getDialogUnread(lastId, limit = this.controller.application.getRequestMessageLimit()) {
			if (this.promiseGetDialogUnreadWait) {
				return this.promiseGetDialogUnread;
			}
			this.promiseGetDialogUnread = new BX.Promise();
			this.promiseGetDialogUnreadWait = true;
			if (!lastId) {
				lastId = this.controller.getStore().getters['messages/getLastId'](this.controller.application.getChatId());
			}
			if (!lastId) {
				// this.controller.application.emit(EventType.dialog.requestUnreadResult, {error: {error: 'LAST_ID_EMPTY', error_description: 'LastId is empty.'}});

				this.promiseGetDialogUnread.reject();
				this.promiseGetDialogUnreadWait = false;
				return this.promiseGetDialogUnread;
			}
			main_core_events.EventEmitter.emitAsync(im_const.EventType.dialog.readMessage, {
				id: lastId,
				skipAjax: true
			}).then(() => {
				this.timer.start('data', 'load', 0.5, () => {
					console.warn('ChatDialog.requestData: slow connection show progress icon');
					app.titleAction('setParams', {
						useProgress: true,
						useLetterImage: false
					});
				});
				const query = {
					[im_const.RestMethodHandler.imDialogRead]: [im_const.RestMethod.imDialogRead, {
						dialog_id: this.controller.application.getDialogId(),
						message_id: lastId
					}],
					[im_const.RestMethodHandler.imChatGet]: [im_const.RestMethod.imChatGet, {
						dialog_id: this.controller.application.getDialogId()
					}],
					[im_const.RestMethodHandler.imDialogMessagesGetUnread]: [im_const.RestMethod.imDialogMessagesGet, {
						chat_id: this.controller.application.getChatId(),
						first_id: lastId,
						limit: limit,
						convert_text: 'Y'
					}]
				};
				this.controller.restClient.callBatch(query, response => {
					if (!response) {
						this.promiseGetDialogUnread.reject();
						this.promiseGetDialogUnreadWait = false;
						return false;
					}
					const chatGetResult = response[im_const.RestMethodHandler.imChatGet];
					if (!chatGetResult.error()) {
						this.controller.executeRestAnswer(im_const.RestMethodHandler.imChatGet, chatGetResult);
					}
					let dialogMessageUnread = response[im_const.RestMethodHandler.imDialogMessagesGetUnread];
					if (dialogMessageUnread.error()) {
						this.promiseGetDialogUnread.reject();
						this.promiseGetDialogUnreadWait = false;
						return false;
					}
					dialogMessageUnread = dialogMessageUnread.data();
					this.controller.getStore().dispatch('users/set', dialogMessageUnread.users);
					this.controller.getStore().dispatch('files/set', this.controller.application.prepareFilesBeforeSave(dialogMessageUnread.files));
					this.controller.getStore().dispatch('messages/setAfter', dialogMessageUnread.messages).then(() => {
						app.titleAction('setParams', {
							useProgress: false,
							useLetterImage: true
						});
						this.timer.stop('data', 'load', true);
						this.promiseGetDialogUnread.fulfill(response);
						this.promiseGetDialogUnreadWait = false;
						return true;
					});
				}, false, false, im_lib_utils.Utils.getLogTrackingParams({
					name: im_const.RestMethodHandler.imDialogMessagesGetUnread,
					dialog: this.controller.application.getDialogData()
				}));
			});
			return this.promiseGetDialogUnread;
		}
		retrySendMessage(message) {
			const element = this.messagesQueue.find(el => el.id === message.id);
			if (element) {
				if (element.file && element.file.id) {
					this.retryUploadFile(element.file.id);
				}
				return false;
			}
			this.messagesQueue.push({
				id: message.id,
				chatId: this.controller.application.getChatId(),
				dialogId: this.controller.application.getDialogId(),
				text: message.text,
				sending: false
			});
			this.controller.application.setSendingMessageFlag(message.id);
			this.processSendMessages();
		}
		openProfile(userId) {
			BXMobileApp.Events.postToComponent('onUserProfileOpen', [userId, {
				backdrop: true
			}], 'communication');
		}
		openDialog(dialogId) {
			BXMobileApp.Events.postToComponent('onOpenDialog', [{
				dialogId
			}, true], 'im.recent');
			BXMobileApp.Events.postToComponent('ImMobile.Messenger.Dialog:open', [{
				dialogId
			}], 'im.messenger');
		}
		openPhoneMenu(number) {
			BX.MobileTools.phoneTo(number);
		}
		openMessageMenu(message) {
			if (this.messagesQueue.find(el => el.id === message.id)) {
				return false;
			}
			this.controller.getStore().dispatch('messages/update', {
				id: message.id,
				chatId: message.chatId,
				fields: {
					blink: true
				}
			});
			const currentUser = this.controller.application.getCurrentUser();
			const dialog = this.controller.application.getDialogData();
			const messageUser = message.authorId > 0 ? this.controller.getStore().getters['users/get'](message.authorId, true) : null;
			this.messageMenuInstance = BackdropMenu.create(`im.dialog.menu.mess|${this.controller.application.getDialogId()}`).setTestId('im-dialog-menu-mess').setItems([BackdropMenuItem.create('reply').setTitle(this.getLocalize('MOBILE_MESSAGE_MENU_REPLY')).setIcon(BackdropMenuIcon.reply).skip(message => {
				const dialog = this.controller.application.getDialogData();
				if (dialog.type === 'announcement' && !dialog.managerList.includes(this.controller.application.getUserId())) {
					return true;
				}
				return !message.authorId || message.authorId === this.controller.application.getUserId();
			}), BackdropMenuItem.create('copy').setTitle(this.getLocalize('MOBILE_MESSAGE_MENU_COPY')).setIcon(BackdropMenuIcon.copy).skip(message => message.params.IS_DELETED === 'Y'), BackdropMenuItem.create('quote').setTitle(this.getLocalize('MOBILE_MESSAGE_MENU_QUOTE')).setIcon(BackdropMenuIcon.quote).skip(message => {
				const dialog = this.controller.application.getDialogData();
				if (dialog.type === 'announcement' && !dialog.managerList.includes(this.controller.application.getUserId())) {
					return true;
				}
				return message.params.IS_DELETED === 'Y';
			}), BackdropMenuItem.create('unread').setTitle(this.getLocalize('MOBILE_MESSAGE_MENU_UNREAD')).setIcon(BackdropMenuIcon.unread).skip(message => message.authorId === this.controller.application.getUserId() || message.unread), BackdropMenuItem.create('read').setTitle(this.getLocalize('MOBILE_MESSAGE_MENU_READ')).setIcon(BackdropMenuIcon.checked).skip(message => !message.unread), BackdropMenuItem.create('edit').setTitle(this.getLocalize('MOBILE_MESSAGE_MENU_EDIT')).setIcon(BackdropMenuIcon.edit).skip(message => message.authorId !== this.controller.application.getUserId() || message.params.IS_DELETED === 'Y'), BackdropMenuItem.create('share').setType(BackdropMenuItemType.menu).setIcon(BackdropMenuIcon.circle_plus).setTitle(this.getLocalize('MOBILE_MESSAGE_MENU_SHARE_MENU')).disableClose().skip(currentUser.extranet || dialog.type === 'announcement'), BackdropMenuItem.create('profile').setTitle(this.getLocalize('MOBILE_MESSAGE_MENU_PROFILE')).setIcon(BackdropMenuIcon.user).skip(message => {
				if (message.authorId <= 0 || !messageUser) {
					return true;
				}
				if (!im_lib_utils.Utils.dialog.isChatId(this.controller.application.getDialogId())) {
					return true;
				}
				if (message.authorId === this.controller.application.getUserId()) {
					return true;
				}
				if (messageUser.externalAuthId === 'imconnector' || messageUser.externalAuthId === 'call') {
					return true;
				}
				return false;
			}), BackdropMenuItem.create('delete').setTitle(this.getLocalize('MOBILE_MESSAGE_MENU_DELETE')).setStyles(BackdropMenuStyle.create().setFont(WidgetListItemFont.create().setColor('#c50000'))).setIcon(BackdropMenuIcon.trash).skip(message => message.authorId !== this.controller.application.getUserId() || message.params.IS_DELETED === 'Y')]).setVersion(BX.componentParameters.get('WIDGET_BACKDROP_MENU_VERSION', '1.0.0')).setEventListener((name, params, message, backdrop) => {
				if (name === 'destroyed') {
					ui_vue.Vue.event.$emit('bitrixmobile:controller:focus');
				}
				if (name !== 'selected') {
					return false;
				}
				switch (params.id) {
					case 'reply':
						{
							this.replyToUser(message.authorId);
							break;
						}
					case 'copy':
						{
							this.copyMessage(message.id);
							break;
						}
					case 'quote':
						{
							this.quoteMessageClear();
							this.quoteMessage(message.id);
							break;
						}
					case 'edit':
						{
							this.quoteMessageClear();
							this.editMessage(message.id);
							break;
						}
					case 'delete':
						{
							this.deleteMessage(message.id);
							break;
						}
					case 'unread':
						{
							this.unreadMessage(message.id);
							break;
						}
					case 'read':
						{
							main_core_events.EventEmitter.emit(im_const.EventType.dialog.readMessage, {
								id: message.id
							});
							break;
						}
					case 'share':
						{
							this.controller.application.getDialogData();
							const subMenu = BackdropMenu.create(`im.dialog.menu.mess.submenu|${this.controller.application.getDialogId()}`).setTestId('im-dialog-menu-mess-submenu-share').setItems([BackdropMenuItem.create('share_task').setIcon(BackdropMenuIcon.task).setTitle(this.getLocalize('MOBILE_MESSAGE_MENU_SHARE_TASK')), BackdropMenuItem.create('share_post').setIcon(BackdropMenuIcon.lifefeed).setTitle(this.getLocalize('MOBILE_MESSAGE_MENU_SHARE_POST_NEWS')), BackdropMenuItem.create('share_chat').setIcon(BackdropMenuIcon.chat).setTitle(this.getLocalize('MOBILE_MESSAGE_MENU_SHARE_CHAT'))]).setEventListener((name, params, options, backdrop) => {
								if (name !== 'selected') {
									return false;
								}
								switch (params.id) {
									case 'share_task':
										{
											this.shareMessage(message.id, 'TASK');
											break;
										}
									case 'share_post':
										{
											this.shareMessage(message.id, 'POST');
											break;
										}
									case 'share_chat':
										{
											this.shareMessage(message.id, 'CHAT');
											break;
										}
									// No default
								}
							});
							backdrop.showSubMenu(subMenu);
							break;
						}
					case 'profile':
						{
							this.openProfile(message.authorId);
							break;
						}
					default:
						{
							console.warn('BackdropMenuItem is not implemented', params);
						}
				}
			});
			this.messageMenuInstance.setCustomParams(message).show();
			fabric.Answers.sendCustomEvent('vueChatOpenDropdown', {});
		}
		openHeaderMenu() {
			fabric.Answers.sendCustomEvent('vueChatOpenHeaderMenu', {});
			if (!this.headerMenu) {
				this.headerMenu = HeaderMenu.create().setUseNavigationBarColor().setEventListener((name, params, customParams) => {
					if (name !== 'selected') {
						return false;
					}
					switch (params.id) {
						case 'profile':
							{
								this.openProfile(this.controller.application.getDialogId());
								break;
							}
						case 'user_list':
							{
								this.openUserList({
									listType: 'USERS',
									title: this.getLocalize('MOBILE_HEADER_MENU_USER_LIST'),
									backdrop: true
								});
								break;
							}
						case 'user_add':
							{
								this.openAddUserDialog();
								break;
							}
						case 'leave':
							{
								this.leaveChat();
								break;
							}
						case 'notify':
							{
								this.controller.application.muteDialog();
								break;
							}
						case 'call_chat_call':
							{
								BX.MobileTools.phoneTo(this.controller.application.getDialogData().entityId);
								break;
							}
						case 'goto_crm':
							{
								const crmData = this.controller.application.getDialogCrmData();
								const openWidget = BX.MobileTools.resolveOpenFunction(`/crm/${crmData.entityType}/details/${crmData.entityId}/`);
								if (openWidget) {
									openWidget();
								}
								break;
							}
						case 'reload':
							{
								new BXMobileApp.UI.NotificationBar({
									message: this.getLocalize('MOBILE_HEADER_MENU_RELOAD_WAIT'),
									color: '#d920b0ff',
									textColor: '#ffffff',
									groupId: 'refresh',
									useLoader: true,
									maxLines: 1,
									align: 'center',
									hideOnTap: true
								}, 'copy').show();
								this.controller.getStoreBuilder().clearDatabase();
								reload();
								break;
							}
						// No default
					}
				});
			}
			if (im_lib_utils.Utils.dialog.isChatId(this.controller.application.getDialogId())) {
				const dialogData = this.controller.application.getDialogData();
				const notifyToggleText = this.controller.application.isDialogMuted() ? this.getLocalize('MOBILE_HEADER_MENU_NOTIFY_ENABLE') : this.getLocalize('MOBILE_HEADER_MENU_NOTIFY_DISABLE');
				const notifyToggleIcon = this.controller.application.isDialogMuted() ? HeaderMenuIcon.notify_off : HeaderMenuIcon.notify;
				let gotoCrmLocalize = '';
				if (dialogData.type === im_const.DialogType.call || dialogData.type === im_const.DialogType.crm) {
					const crmData = this.controller.application.getDialogCrmData();
					if (crmData.enabled) {
						switch (crmData.entityType) {
							case im_const.DialogCrmType.lead:
								{
									gotoCrmLocalize = this.getLocalize('MOBILE_GOTO_CRM_LEAD');
									break;
								}
							case im_const.DialogCrmType.company:
								{
									gotoCrmLocalize = this.getLocalize('MOBILE_GOTO_CRM_COMPANY');
									break;
								}
							case im_const.DialogCrmType.contact:
								{
									gotoCrmLocalize = this.getLocalize('MOBILE_GOTO_CRM_CONTACT');
									break;
								}
							case im_const.DialogCrmType.deal:
								{
									gotoCrmLocalize = this.getLocalize('MOBILE_GOTO_CRM_DEAL');
									break;
								}
							default:
								{
									gotoCrmLocalize = this.getLocalize('MOBILE_GOTO_CRM');
								}
						}
					}
				}
				if (dialogData.type === im_const.DialogType.call) {
					this.headerMenu.setItems([HeaderMenuItem.create('call_chat_call').setTitle(this.getLocalize('MOBILE_HEADER_MENU_AUDIO_CALL')).setIcon(HeaderMenuIcon.phone).skip(dialogData.entityId === 'UNIFY_CALL_CHAT'), HeaderMenuItem.create('goto_crm').setTitle(gotoCrmLocalize).setIcon(HeaderMenuIcon.lifefeed).skip(dialogData.entityId === 'UNIFY_CALL_CHAT' || !gotoCrmLocalize), HeaderMenuItem.create('reload').setTitle(this.getLocalize('MOBILE_HEADER_MENU_RELOAD')).setIcon(HeaderMenuIcon.reload)]);
				} else {
					const items = [HeaderMenuItem.create('notify').setTitle(notifyToggleText).setIcon(notifyToggleIcon).skip(!dialogData.restrictions.mute), HeaderMenuItem.create('user_list').setTitle(this.getLocalize('MOBILE_HEADER_MENU_USER_LIST')).setIcon(HeaderMenuIcon.user).skip(!dialogData.restrictions.userList), HeaderMenuItem.create('user_add').setTitle(this.getLocalize('MOBILE_HEADER_MENU_USER_ADD')).setIcon(HeaderMenuIcon.user_plus).skip(!dialogData.restrictions.extend), HeaderMenuItem.create('leave').setTitle(this.getLocalize('MOBILE_HEADER_MENU_LEAVE')).setIcon(HeaderMenuIcon.cross).skip(!dialogData.restrictions.leave), HeaderMenuItem.create('reload').setTitle(this.getLocalize('MOBILE_HEADER_MENU_RELOAD')).setIcon(HeaderMenuIcon.reload)];
					items.push(HeaderMenuItem.create('reload').setTitle(this.getLocalize('MOBILE_HEADER_MENU_RELOAD')).setIcon(HeaderMenuIcon.reload));
					if (dialogData.type === im_const.DialogType.crm && gotoCrmLocalize) {
						items.unshift(HeaderMenuItem.create('goto_crm').setTitle(gotoCrmLocalize).setIcon(HeaderMenuIcon.lifefeed));
					}
					this.headerMenu.setItems(items);
				}
			} else {
				let shouldSkipUserAdd = false;
				const userData = this.controller.getStore().getters['users/get'](this.controller.application.getDialogId(), true);
				if (userData.bot && userData.externalAuthId === 'support24') {
					shouldSkipUserAdd = true;
				}
				this.headerMenu.setItems([HeaderMenuItem.create('profile').setTitle(this.getLocalize('MOBILE_HEADER_MENU_PROFILE')).setIcon('user').skip(() => {
					if (im_lib_utils.Utils.dialog.isChatId(this.controller.application.getDialogId())) {
						return true;
					}
					const userData = this.controller.getStore().getters['users/get'](this.controller.application.getDialogId(), true);
					if (userData.bot) {
						return true;
					}
					return false;
				}), HeaderMenuItem.create('user_add').setTitle(this.getLocalize('MOBILE_HEADER_MENU_USER_ADD')).setIcon(HeaderMenuIcon.user_plus).skip(shouldSkipUserAdd), HeaderMenuItem.create('reload').setTitle(this.getLocalize('MOBILE_HEADER_MENU_RELOAD')).setIcon(HeaderMenuIcon.reload)]);
			}
			this.headerMenu.show(true);
		}
		shareMessage(messageId, type) {
			if (!this.controller.isOnline()) {
				return false;
			}
			return this.controller.application.shareMessage(messageId, type);
		}
		unreadMessage(messageId) {
			if (!this.controller.isOnline()) {
				return false;
			}
			return this.controller.application.unreadMessage(messageId);
		}
		openReadedList(list) {
			if (!im_lib_utils.Utils.dialog.isChatId(this.controller.application.getDialogId())) {
				return false;
			}
			if (!list || list.length <= 1) {
				return false;
			}
			this.openUserList({
				users: list.map(element => element.userId),
				title: this.getLocalize('MOBILE_MESSAGE_LIST_VIEW')
			});
		}
		replyToUser(userId, userData = null) {
			if (!this.controller.isOnline()) {
				return false;
			}
			if (!userData) {
				userData = this.controller.getStore().getters['users/get'](userId);
			}
			return this.insertText({
				text: `[USER=${userId}]${userData.firstName}[/USER] `
			});
		}
		copyMessage(id) {
			const quoteMessage = this.controller.getStore().getters['messages/getMessage'](this.controller.application.getChatId(), id);
			let text = '';
			if (quoteMessage.params.FILE_ID && quoteMessage.params.FILE_ID.length > 0) {
				text = quoteMessage.params.FILE_ID.map(fileId => `[DISK=${fileId}]`).join(' ');
			}
			if (quoteMessage.text) {
				if (text) {
					text += '\n';
				}
				text += quoteMessage.text.replace(/^(-{54}\n)/gm, `${'-'.repeat(21)}\n`);
			}
			text = text.replace(/\[url](.*?)\[\/url]/gi, (whole, link) => link);
			app.exec('copyToClipboard', {
				text
			});
			new BXMobileApp.UI.NotificationBar({
				message: BX.message('MOBILE_MESSAGE_MENU_COPY_SUCCESS'),
				color: '#af000000',
				textColor: '#ffffff',
				groupId: 'clipboard',
				maxLines: 1,
				align: 'center',
				isGlobal: true,
				useCloseButton: true,
				autoHideTimeout: 1500,
				hideOnTap: true
			}, 'copy').show();
		}
		quoteMessage(id) {
			this.controller.getStore().dispatch('dialogues/update', {
				dialogId: this.controller.application.getDialogId(),
				fields: {
					quoteId: id
				}
			}).then(() => {
				if (!this.controller.getStore().state.application.mobile.keyboardShow) {
					this.setTextFocus();
					setTimeout(() => {
						main_core_events.EventEmitter.emit(im_const.EventType.dialog.scrollToBottom, {
							chatId: this.controller.application.getChatId(),
							duration: 300,
							cancelIfScrollChange: false,
							force: true
						});
					}, 300);
				}
			});
		}
		quoteMessageClear() {
			this.setText('');
			this.controller.getStore().dispatch('dialogues/update', {
				dialogId: this.controller.application.getDialogId(),
				fields: {
					quoteId: 0,
					editId: 0
				}
			});
		}
		editMessage(id) {
			const message = this.controller.getStore().getters['messages/getMessage'](this.controller.application.getChatId(), id);
			this.controller.getStore().dispatch('dialogues/update', {
				dialogId: this.controller.application.getDialogId(),
				fields: {
					quoteId: id,
					editId: id
				}
			}).then(() => {
				setTimeout(() => main_core_events.EventEmitter.emit(im_const.EventType.dialog.scrollToBottom, {
					chatId: this.controller.application.getChatId(),
					duration: 300,
					cancelIfScrollChange: false,
					force: true
				}), 300);
				this.setTextFocus();
			});
			this.setText(message.text);
		}
		updateMessage(id, text) {
			this.quoteMessageClear();
			this.controller.getStore().dispatch('dialogues/update', {
				dialogId: this.controller.application.getDialogId(),
				fields: {
					editId: 0
				}
			});
			this.editMessageSend(id, text);
		}
		editMessageSend(id, text) {
			this.controller.restClient.callMethod(im_const.RestMethod.imMessageUpdate, {
				MESSAGE_ID: id,
				MESSAGE: text
			}, null, null, im_lib_utils.Utils.getLogTrackingParams({
				name: im_const.RestMethod.imMessageUpdate,
				data: {
					timMessageType: 'text'
				},
				dialog: this.controller.application.getDialogData()
			}));
		}
		deleteMessage(id) {
			const message = this.controller.getStore().getters['messages/getMessage'](this.controller.application.getChatId(), id);
			const files = this.controller.getStore().getters['files/getList'](this.controller.application.getChatId());
			let messageText = im_lib_utils.Utils.text.purify(message.text, message.params, files, this.getLocalize());
			messageText = messageText.length > 50 ? `${messageText.slice(0, 47)}...` : messageText;
			app.confirm({
				title: this.getLocalize('MOBILE_MESSAGE_MENU_DELETE_CONFIRM'),
				text: messageText ? `"${messageText}"` : '',
				buttons: [this.getLocalize('MOBILE_MESSAGE_MENU_DELETE_YES'), this.getLocalize('MOBILE_MESSAGE_MENU_DELETE_NO')],
				callback: button => {
					if (button === 1) {
						this.quoteMessageClear();
						this.deleteMessageSend(id);
					}
				}
			});
		}
		deleteMessageSend(id) {
			this.controller.restClient.callMethod(im_const.RestMethod.imMessageDelete, {
				MESSAGE_ID: id
			}, null, null, im_lib_utils.Utils.getLogTrackingParams({
				name: im_const.RestMethod.imMessageDelete,
				data: {},
				dialog: this.controller.application.getDialogData(this.controller.application.getDialogId())
			}));
		}
		insertText(params) {
			BXMobileApp.UI.Page.TextPanel.getText(text => {
				text = text.toString().trim();
				text = text ? `${text} ${params.text}` : params.text;
				this.setText(text);
				this.setTextFocus();
			});
		}
		setText(text = '') {
			text = text.toString();
			if (text) {
				BXMobileApp.UI.Page.TextPanel.setText(text);
			} else {
				BXMobileApp.UI.Page.TextPanel.clear();
			}
			this.setTextareaMessage({
				message: text
			});
			console.log('Set new text in textarea', text || '-- empty --');
		}
		clearText() {
			this.setText();
		}
		setTextFocus() {
			if (!this.controller.getStore().state.application.mobile.keyboardShow) {
				BXMobileApp.UI.Page.TextPanel.focus();
			}
		}
		isBackground() {
			if (typeof BXMobileAppContext !== 'object') {
				return false;
			}
			if (typeof BXMobileAppContext.isAppActive === 'function' && !BXMobileAppContext.isAppActive()) {
				return true;
			}
			if (typeof BXMobileAppContext.isBackground === 'function') {
				return BXMobileAppContext.isBackground();
			}
			return false;
		}
		hideSmiles() {
			// this.controller.hideSmiles();
		}
		changeDialogState(state) {
			console.log(`changeDialogState -> ${state}`);
			if (state === 'show') {
				this.setIosInset();
			}
		}

		/* endregion 05. Templates and template interaction */

		/* region 05. Interaction and utils */

		executeBackgroundTaskSuccess(action, data) {
			const successObject = {
				error: () => false,
				data: () => data.result
			};
			console.log('Dialog.executeBackgroundTaskSuccess', action, data);
			switch (action) {
				case 'sendMessage':
					{
						this.controller.executeRestAnswer(im_const.RestMethodHandler.imMessageAdd, successObject, data.extra);
						break;
					}
				case 'readMessage':
					{
						this.processMarkReadMessages();
						break;
					}
				case 'uploadFileFromDisk':
					{
						this.controller.executeRestAnswer(im_const.RestMethodHandler.imMessageAdd, successObject, data.extra);
						break;
					}
				// No default
			}
		}
		executeBackgroundTaskFailure(action, data) {
			const errorObject = {
				error: () => {
					return {
						error: data.code,
						error_description: data.text,
						ex: {
							status: data.status
						}
					};
				},
				data: () => false
			};
			console.log('Dialog.executeBackgroundTaskFailure', action, data);

			// Handle an error only for API error when server status is 200.
			// Otherwise we don't want to draw errors, because background queue will resend messages.
			if (data.status === HTTP_OK_STATUS_CODE && (action === 'sendMessage' || action === 'uploadFileFromDisk')) {
				this.controller.executeRestAnswer(im_const.RestMethodHandler.imMessageAdd, errorObject, data.extra);
			}
		}

		/* endregion 05. Interaction and utils */

		/* region 06. Interaction and utils */

		setError(code = '', description = '') {
			console.error(`MobileChat.error: ${code} (${description})`);
			let localizeDescription = '';
			if (code.endsWith('LOCALIZED')) {
				localizeDescription = description;
			}
			this.controller.getStore().commit('application/set', {
				error: {
					active: true,
					code,
					description: localizeDescription
				}
			});
		}
		clearError() {
			this.controller.getStore().commit('application/set', {
				error: {
					active: false,
					code: '',
					description: ''
				}
			});
		}
		addLocalize(phrases) {
			return this.controller.addLocalize(phrases);
		}
		getLocalize(name) {
			return this.controller.getLocalize(name);
		}

		/* endregion 06. Interaction and utils */
		/* region 07. Event handlers */
		onMessagesSet() {
			this.messagesSet = true;
			BXMobileApp.Events.postToComponent('chatbackground::task::restart', [], 'background');
			BXMobileApp.Events.postToComponent('chatuploader::task::restart', [], 'background');
		}
		/* endregion 07. Event handlers */
	}

	exports.MobileDialogApplication = MobileDialogApplication;

})(this.BX.Messenger.Application = this.BX.Messenger.Application || {}, BX, BX.Messenger.Application, BX.Main, BX.Event, BX, BX.Messenger.Model, BX.Messenger.Const, BX.Messenger.Lib, BX.Messenger.Lib, BX.Messenger.Provider.Rest, BX.Messenger.Lib, window, BX, BX, BX.Messenger.Lib, BX.Messenger, BX, window, BX.Messenger.EventHandler);
//# sourceMappingURL=dialog.bundle.js.map
