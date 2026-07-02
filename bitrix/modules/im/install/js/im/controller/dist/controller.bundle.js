/* eslint-disable */
this.BX = this.BX || {};
(function (exports, pull_client, rest_client, ui_vue, ui_vue_vuex, im_model, im_const, im_lib_utils, im_provider_pull, im_provider_rest, im_lib_timer, im_lib_logger) {
	'use strict';

	/**
	 * Bitrix Messenger
	 * Application controller
	 *
	 * @package bitrix
	 * @subpackage im
	 * @copyright 2001-2020 Bitrix
	 */

	class ApplicationController {
		constructor() {
			this.controller = null;
			this.timer = new im_lib_timer.Timer();
			this._prepareFilesBeforeSave = params => {
				return params;
			};
			this.defaultMessageLimit = 50;
			this.requestMessageLimit = this.getDefaultMessageLimit();
			this.messageLastReadId = {};
			this.messageReadQueue = {};
		}
		setCoreController(controller) {
			this.controller = controller;
		}
		getSiteId() {
			return this.controller.getStore().state.application.common.siteId;
		}
		getUserId() {
			return this.controller.getStore().state.application.common.userId;
		}
		getLanguageId() {
			return this.controller.getStore().state.application.common.languageId;
		}
		getCurrentUser() {
			return this.controller.getStore().getters['users/get'](this.controller.getStore().state.application.common.userId, true);
		}
		getChatId() {
			return this.controller.getStore().state.application.dialog.chatId;
		}
		getDialogId() {
			return this.controller.getStore().state.application.dialog.dialogId;
		}
		getData() {
			return this.controller.getStore().state.application;
		}
		getDialogData(dialogId = this.getDialogId()) {
			if (this.controller.getStore().state.dialogues.collection[dialogId]) {
				return this.controller.getStore().state.dialogues.collection[dialogId];
			}
			return this.controller.getStore().getters['dialogues/getBlank']();
		}
		getDialogCrmData(dialogId = this.getDialogId()) {
			let result = {
				enabled: false,
				entityType: im_const.DialogCrmType.none,
				entityId: 0
			};
			let dialogData = this.getDialogData(dialogId);
			if (dialogData.type === im_const.DialogType.call) {
				if (dialogData.entityData1 && typeof dialogData.entityData1 === 'string') {
					let [enabled, entityType, entityId] = dialogData.entityData1.split('|');
					if (enabled) {
						entityType = entityType ? entityType.toString().toLowerCase() : im_const.DialogCrmType.none;
						result = {
							enabled,
							entityType,
							entityId
						};
					}
				}
			} else if (dialogData.type === im_const.DialogType.crm) {
				let [entityType, entityId] = dialogData.entityId.split('|');
				entityType = entityType ? entityType.toString().toLowerCase() : im_const.DialogCrmType.none;
				result = {
					enabled: true,
					entityType,
					entityId
				};
			}
			return result;
		}
		getDialogIdByChatId(chatId) {
			if (this.getDialogId() === 'chat' + chatId) {
				return this.getDialogId();
			}
			let dialog = this.controller.getStore().getters['dialogues/getByChatId'](chatId);
			if (!dialog) {
				return 0;
			}
			return dialog.dialogId;
		}
		getDiskFolderId() {
			return this.controller.getStore().state.application.dialog.diskFolderId;
		}
		getDefaultMessageLimit() {
			return this.defaultMessageLimit;
		}
		getRequestMessageLimit() {
			return this.requestMessageLimit;
		}
		muteDialog(action = null, dialogId = this.getDialogId()) {
			if (im_lib_utils.Utils.dialog.isEmptyDialogId(dialogId)) {
				return false;
			}
			if (action === null) {
				action = !this.isDialogMuted();
			}
			this.timer.start('muteDialog', dialogId, .3, id => {
				this.controller.restClient.callMethod(im_const.RestMethod.imChatMute, {
					'DIALOG_ID': dialogId,
					'ACTION': action ? 'Y' : 'N'
				});
			});
			let muteList = [];
			if (action) {
				muteList = this.getDialogData().muteList;
				muteList.push(this.getUserId());
			} else {
				muteList = this.getDialogData().muteList.filter(userId => userId !== this.getUserId());
			}
			this.controller.getStore().dispatch('dialogues/update', {
				dialogId,
				fields: {
					muteList
				}
			});
			return true;
		}
		isDialogMuted(dialogId = this.getDialogId()) {
			return this.getDialogData().muteList.includes(this.getUserId());
		}
		isUnreadMessagesLoaded() {
			let dialog = this.controller.getStore().state.dialogues.collection[this.getDialogId()];
			if (!dialog) {
				return true;
			}
			if (dialog.lastMessageId <= 0) {
				return true;
			}
			let collection = this.controller.getStore().state.messages.collection[this.getChatId()];
			if (!collection || collection.length <= 0) {
				return true;
			}
			let lastElementId = 0;
			for (let index = collection.length - 1; index >= 0; index--) {
				let lastElement = collection[index];
				if (typeof lastElement.id === "number") {
					lastElementId = lastElement.id;
					break;
				}
			}
			return lastElementId >= dialog.lastMessageId;
		}
		prepareFilesBeforeSave(files) {
			return this._prepareFilesBeforeSave(files);
		}
		setPrepareFilesBeforeSaveFunction(func) {
			this._prepareFilesBeforeSave = func.bind(this);
		}
		showSmiles() {
			this.store.dispatch('application/showSmiles');
		}
		hideSmiles() {
			this.store.dispatch('application/hideSmiles');
		}
		startOpponentWriting(params) {
			let {
				dialogId,
				userId,
				userName
			} = params;
			this.controller.getStore().dispatch('dialogues/updateWriting', {
				dialogId,
				userId,
				userName,
				action: true
			});
			this.timer.start('writingEnd', dialogId + '|' + userId, 35, (id, params) => {
				let {
					dialogId,
					userId
				} = params;
				this.controller.getStore().dispatch('dialogues/updateWriting', {
					dialogId,
					userId,
					action: false
				});
			}, {
				dialogId,
				userId
			});
			return true;
		}
		stopOpponentWriting(params = {}) {
			let {
				dialogId,
				userId,
				userName
			} = params;
			this.timer.stop('writingStart', dialogId + '|' + userId, true);
			this.timer.stop('writingEnd', dialogId + '|' + userId);
			return true;
		}
		startWriting(dialogId = this.getDialogId()) {
			if (im_lib_utils.Utils.dialog.isEmptyDialogId(dialogId) || this.timer.has('writes', dialogId)) {
				return false;
			}
			this.timer.start('writes', dialogId, 28);
			this.timer.start('writesSend', dialogId, 5, id => {
				this.controller.restClient.callMethod(im_const.RestMethod.imDialogWriting, {
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
		joinParentChat(messageId, dialogId) {
			return new Promise((resolve, reject) => {
				if (!messageId || !dialogId) {
					return reject();
				}
				if (typeof this.tempJoinChat === 'undefined') {
					this.tempJoinChat = {};
				} else if (this.tempJoinChat['wait']) {
					return reject();
				}
				this.tempJoinChat['wait'] = true;
				this.controller.restClient.callMethod(im_const.RestMethod.imChatParentJoin, {
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
		setTextareaMessage(params) {
			let {
				message = '',
				dialogId = this.getDialogId()
			} = params;
			this.controller.getStore().dispatch('dialogues/update', {
				dialogId,
				fields: {
					textareaMessage: message
				}
			});
		}
		setSendingMessageFlag(messageId) {
			this.controller.getStore().dispatch('messages/actionStart', {
				id: messageId,
				chatId: this.getChatId()
			});
		}
		reactMessage(messageId, type = 'like', action = 'auto') {
			this.controller.restClient.callMethod(im_const.RestMethod.imMessageLike, {
				'MESSAGE_ID': messageId,
				'ACTION': action === 'auto' ? 'auto' : action === 'set' ? 'plus' : 'minus'
			});
		}
		readMessage(messageId = null, force = false, skipAjax = false) {
			let chatId = this.getChatId();
			if (typeof this.messageLastReadId[chatId] === 'undefined') {
				this.messageLastReadId[chatId] = null;
			}
			if (typeof this.messageReadQueue[chatId] === 'undefined') {
				this.messageReadQueue[chatId] = [];
			}
			if (messageId) {
				this.messageReadQueue[chatId].push(parseInt(messageId));
			}
			this.timer.stop('readMessage', chatId, true);
			this.timer.stop('readMessageServer', chatId, true);
			if (force) {
				return this.readMessageExecute(chatId, skipAjax);
			}
			return new Promise((resolve, reject) => {
				this.timer.start('readMessage', chatId, .1, (chatId, params) => this.readMessageExecute(chatId, skipAjax).then(result => resolve(result)));
			});
		}
		readMessageExecute(chatId, skipAjax = false) {
			return new Promise((resolve, reject) => {
				if (this.messageReadQueue[chatId]) {
					this.messageReadQueue[chatId] = this.messageReadQueue[chatId].filter(elementId => {
						if (!this.messageLastReadId[chatId]) {
							this.messageLastReadId[chatId] = elementId;
						} else if (this.messageLastReadId[chatId] < elementId) {
							this.messageLastReadId[chatId] = elementId;
						}
					});
				}
				let dialogId = this.getDialogIdByChatId(chatId);
				let lastId = this.messageLastReadId[chatId] || 0;
				if (lastId <= 0) {
					resolve({
						dialogId,
						lastId: 0
					});
					return true;
				}
				this.controller.getStore().dispatch('messages/readMessages', {
					chatId: chatId,
					readId: lastId
				}).then(result => {
					this.controller.getStore().dispatch('dialogues/decreaseCounter', {
						dialogId,
						count: result.count
					});
					if (this.getChatId() === chatId && this.controller.getStore().getters['dialogues/canSaveChat']) {
						let dialog = this.controller.getStore().getters['dialogues/get'](dialogId);
						if (dialog.counter <= 0) {
							this.controller.getStore().commit('application/clearDialogExtraCount');
						}
					}
					if (skipAjax) {
						resolve({
							dialogId,
							lastId
						});
					} else {
						this.timer.start('readMessageServer', chatId, .5, () => {
							this.controller.restClient.callMethod(im_const.RestMethod.imDialogRead, {
								'DIALOG_ID': dialogId,
								'MESSAGE_ID': lastId
							}).then(() => resolve({
								dialogId,
								lastId
							})).catch(() => resolve({
								dialogId,
								lastId
							}));
						});
					}
				}).catch(() => {
					resolve();
				});
			});
		}
		unreadMessage(messageId = null, skipAjax = false) {
			let chatId = this.getChatId();
			if (typeof this.messageLastReadId[chatId] === 'undefined') {
				this.messageLastReadId[chatId] = null;
			}
			if (typeof this.messageReadQueue[chatId] === 'undefined') {
				this.messageReadQueue[chatId] = [];
			}
			if (messageId) {
				this.messageReadQueue[chatId] = this.messageReadQueue[chatId].filter(id => id < messageId);
			}
			this.timer.stop('readMessage', chatId, true);
			this.timer.stop('readMessageServer', chatId, true);
			this.messageLastReadId[chatId] = messageId;
			this.controller.getStore().dispatch('messages/unreadMessages', {
				chatId: chatId,
				unreadId: this.messageLastReadId[chatId]
			}).then(result => {
				let dialogId = this.getDialogIdByChatId(chatId);
				this.controller.getStore().dispatch('dialogues/update', {
					dialogId,
					fields: {
						unreadId: messageId
					}
				});
				this.controller.getStore().dispatch('dialogues/increaseCounter', {
					dialogId,
					count: result.count
				});
				if (!skipAjax) {
					this.controller.restClient.callMethod(im_const.RestMethod.imDialogUnread, {
						'DIALOG_ID': dialogId,
						'MESSAGE_ID': this.messageLastReadId[chatId]
					});
				}
			}).catch(() => {});
		}
		shareMessage(messageId, type, date = null) {
			this.controller.restClient.callMethod(im_const.RestMethod.imMessageShare, {
				'DIALOG_ID': this.getDialogId(),
				'MESSAGE_ID': messageId,
				'TYPE': type
			});
			return true;
		}
		replyToUser(userId, user) {
			return true;
		}
		openMessageReactionList(messageId, values) {
			return true;
		}
		emit(eventName, ...args) {
			ui_vue.Vue.event.$emit(eventName, ...args);
		}
		listen(event, callback) {
			ui_vue.Vue.event.$on(event, callback);
		}
	}

	/**
	 * Bitrix im
	 * Core controller class
	 *
	 * @package bitrix
	 * @subpackage mobile
	 * @copyright 2001-2020 Bitrix
	 */

	class Controller {
		/* region 01. Initialize and store data */

		constructor(params = {}) {
			this.inited = false;
			this.initPromise = new Promise((resolve, reject) => {
				this.initPromiseResolver = resolve;
			});
			this.offline = false;
			this.restAnswerHandler = [];
			this.vuexAdditionalModel = [];
			this.store = null;
			this.storeBuilder = null;
			this.init().then(() => this.prepareParams(params)).then(() => this.initController()).then(() => this.initLocalStorage()).then(() => this.initStorage()).then(() => this.initRestClient()).then(() => this.initPullClient()).then(() => this.initEnvironment()).then(() => this.initComplete()).catch(error => {
				im_lib_logger.Logger.error('error initializing core controller', error);
			});
		}
		init() {
			return Promise.resolve();
		}
		prepareParams(params) {
			if (typeof params.localize !== 'undefined') {
				this.localize = params.localize;
			} else {
				if (typeof BX !== 'undefined') {
					this.localize = {
						...BX.message
					};
				} else {
					this.localize = {};
				}
			}
			if (typeof params.host !== 'undefined') {
				this.host = params.host;
			} else {
				this.host = location.origin;
			}
			if (typeof params.userId !== 'undefined') {
				const parsedUserId = parseInt(params.userId);
				if (!isNaN(parsedUserId)) {
					this.userId = parsedUserId;
				} else {
					this.userId = 0;
				}
			} else {
				let userId = this.getLocalize('USER_ID');
				this.userId = userId ? parseInt(userId) : 0;
			}
			if (typeof params.siteId !== 'undefined') {
				if (typeof params.siteId === 'string' && params.siteId !== '') {
					this.siteId = params.siteId;
				} else {
					this.siteId = 's1';
				}
			} else {
				this.siteId = this.getLocalize('SITE_ID') || 's1';
			}
			if (typeof params.siteDir !== 'undefined') {
				if (typeof params.siteDir === 'string' && params.siteDir !== '') {
					this.siteDir = params.siteDir;
				} else {
					this.siteDir = 's1';
				}
			} else {
				this.siteDir = this.getLocalize('SITE_DIR') || 's1';
			}
			if (typeof params.languageId !== 'undefined') {
				if (typeof params.languageId === 'string' && params.languageId !== '') {
					this.languageId = params.languageId;
				} else {
					this.languageId = 'en';
				}
			} else {
				this.languageId = this.getLocalize('LANGUAGE_ID') || 'en';
			}
			this.pullInstance = pull_client.PullClient;
			this.pullClient = pull_client.PULL;
			if (typeof params.pull !== 'undefined') {
				if (typeof params.pull.instance !== 'undefined') {
					this.pullInstance = params.pull.instance;
				}
				if (typeof params.pull.client !== 'undefined') {
					this.pullClient = params.pull.client;
				}
			}
			this.restInstance = rest_client.RestClient;
			this.restClient = rest_client.rest;
			if (typeof params.rest !== 'undefined') {
				if (typeof params.rest.instance !== 'undefined') {
					this.restInstance = params.rest.instance;
				}
				if (typeof params.rest.client !== 'undefined') {
					this.restClient = params.rest.client;
				}
			}
			this.vuexBuilder = {
				database: false,
				databaseName: 'desktop/im',
				databaseType: ui_vue_vuex.VuexBuilder.DatabaseType.indexedDb
			};
			if (typeof params.vuexBuilder !== 'undefined') {
				if (typeof params.vuexBuilder.database !== 'undefined') {
					this.vuexBuilder.database = params.vuexBuilder.database;
				}
				if (typeof params.vuexBuilder.databaseName !== 'undefined') {
					this.vuexBuilder.databaseName = params.vuexBuilder.databaseName;
				}
				if (typeof params.vuexBuilder.databaseType !== 'undefined') {
					this.vuexBuilder.databaseType = params.vuexBuilder.databaseType;
				}
				if (typeof params.vuexBuilder.models !== 'undefined') {
					params.vuexBuilder.models.forEach(model => {
						this.addVuexModel(model);
					});
				}
			}
			return Promise.resolve();
		}
		initController() {
			this.application = new ApplicationController();
			this.application.setCoreController(this);
			return new Promise((resolve, reject) => resolve());
		}
		initLocalStorage() {
			return new Promise((resolve, reject) => resolve());
		}
		initStorage() {
			let applicationVariables = {
				common: {
					host: this.getHost(),
					userId: this.getUserId(),
					siteId: this.getSiteId(),
					languageId: this.getLanguageId()
				},
				dialog: {
					messageLimit: this.application.getDefaultMessageLimit(),
					enableReadMessages: true
				},
				device: {
					type: im_lib_utils.Utils.device.isMobile() ? im_const.DeviceType.mobile : im_const.DeviceType.desktop,
					orientation: im_lib_utils.Utils.device.getOrientation()
				}
			};
			let builder = new ui_vue_vuex.VuexBuilder().addModel(im_model.ApplicationModel.create().useDatabase(false).setVariables(applicationVariables)).addModel(im_model.MessagesModel.create().useDatabase(this.vuexBuilder.database).setVariables({
				host: this.getHost()
			})).addModel(im_model.DialoguesModel.create().useDatabase(this.vuexBuilder.database).setVariables({
				host: this.getHost()
			})).addModel(im_model.FilesModel.create().useDatabase(this.vuexBuilder.database).setVariables({
				host: this.getHost(),
				default: {
					name: 'File is deleted'
				}
			})).addModel(im_model.UsersModel.create().useDatabase(this.vuexBuilder.database).setVariables({
				host: this.getHost(),
				default: {
					name: 'Anonymous'
				}
			})).addModel(im_model.RecentModel.create().useDatabase(false).setVariables({
				host: this.getHost()
			})).addModel(im_model.NotificationsModel.create().useDatabase(false).setVariables({
				host: this.getHost()
			}));
			this.vuexAdditionalModel.forEach(model => {
				builder.addModel(model);
			});
			builder.setDatabaseConfig({
				name: this.vuexBuilder.databaseName,
				type: this.vuexBuilder.databaseType,
				siteId: this.getSiteId(),
				userId: this.getUserId()
			});
			return builder.build().then(result => {
				this.store = result.store;
				this.storeBuilder = result.builder;
				return new Promise((resolve, reject) => resolve());
			});
		}
		initRestClient(result) {
			this.addRestAnswerHandler(im_provider_rest.CoreRestHandler.create({
				store: this.store,
				controller: this
			}));
			return new Promise((resolve, reject) => resolve());
		}
		initPullClient() {
			if (!this.pullClient) {
				return false;
			}
			this.pullClient.subscribe(this.pullBaseHandler = new im_provider_pull.ImBasePullHandler({
				store: this.store,
				controller: this
			}));
			this.pullClient.subscribe({
				type: this.pullInstance.SubscriptionType.Status,
				callback: this.eventStatusInteraction.bind(this)
			});
			this.pullClient.subscribe({
				type: this.pullInstance.SubscriptionType.Online,
				callback: this.eventOnlineInteraction.bind(this)
			});
			return new Promise((resolve, reject) => resolve());
		}
		initEnvironment(result) {
			window.addEventListener('orientationchange', () => {
				if (!this.store) {
					return;
				}
				this.store.commit('application/set', {
					device: {
						orientation: im_lib_utils.Utils.device.getOrientation()
					}
				});
				if (this.store.state.application.device.type === im_const.DeviceType.mobile && this.store.state.application.device.orientation === im_const.DeviceOrientation.horizontal) {
					document.activeElement.blur();
				}
			});
			return new Promise((resolve, reject) => resolve());
		}
		initComplete() {
			this.inited = true;
			this.initPromiseResolver(this);
		}

		/* endregion 01. Initialize and store data */

		/* region 02. Push & Pull */

		eventStatusInteraction(data) {
			if (data.status === this.pullInstance.PullStatus.Online) {
				this.offline = false;

				//this.pullBaseHandler.option.skip = true;
				// this.getDialogUnread().then(() => {
				// 	this.pullBaseHandler.option.skip = false;
				// 	this.processSendMessages();
				// 	this.emit(EventType.dialog.sendReadMessages);
				// }).catch(() => {
				// 	this.pullBaseHandler.option.skip = false;
				// 	this.processSendMessages();
				// });
			} else if (data.status === this.pullInstance.PullStatus.Offline) {
				this.offline = true;
			}
		}
		eventOnlineInteraction(data) {
			if (data.command === 'list' || data.command === 'userStatus') {
				for (let userId in data.params.users) {
					if (!data.params.users.hasOwnProperty(userId)) {
						continue;
					}
					this.store.dispatch('users/update', {
						id: data.params.users[userId].id,
						fields: data.params.users[userId]
					});
				}
			}
		}

		/* endregion 02. Push & Pull */

		/* region 03. Rest */

		executeRestAnswer(command, result, extra) {
			im_lib_logger.Logger.warn('Core.controller.executeRestAnswer', command, result, extra);
			this.restAnswerHandler.forEach(handler => {
				handler.execute(command, result, extra);
			});
		}

		/* endregion 03. Rest */

		/* region 04. Template engine */

		createVue(application, config = {}) {
			const controller = this;
			let beforeCreateFunction = () => {};
			if (config.beforeCreate) {
				beforeCreateFunction = config.beforeCreate;
			}
			let destroyedFunction = () => {};
			if (config.destroyed) {
				destroyedFunction = config.destroyed;
			}
			let createdFunction = () => {};
			if (config.created) {
				createdFunction = config.created;
			}
			let initConfig = {
				store: this.store,
				beforeCreate() {
					this.$bitrix.Data.set('controller', controller);
					this.$bitrix.Application.set(application);
					this.$bitrix.Loc.setMessage(controller.localize);
					if (controller.restClient) {
						this.$bitrix.RestClient.set(controller.restClient);
					}
					if (controller.pullClient) {
						this.$bitrix.PullClient.set(controller.pullClient);
					}
					beforeCreateFunction.bind(this)();
				},
				created() {
					createdFunction.bind(this)();
				},
				destroyed() {
					destroyedFunction.bind(this)();
				}
			};
			if (config.el) {
				initConfig.el = config.el;
			}
			if (config.template) {
				initConfig.template = config.template;
			}
			if (config.computed) {
				initConfig.computed = config.computed;
			}
			if (config.data) {
				initConfig.data = config.data;
			}
			const initConfigCreatedFunction = initConfig.created;
			return new Promise((resolve, reject) => {
				initConfig.created = function () {
					initConfigCreatedFunction.bind(this)();
					resolve(this);
				};
				ui_vue.BitrixVue.createApp(initConfig);
			});
		}

		/* endregion 04. Template engine */

		/* region 05. Core methods */
		getHost() {
			return this.host;
		}
		setHost(host) {
			this.host = host;
			this.store.commit('application/set', {
				common: {
					host
				}
			});
		}
		getUserId() {
			return this.userId;
		}
		setUserId(userId) {
			const parsedUserId = parseInt(userId);
			if (!isNaN(parsedUserId)) {
				this.userId = parsedUserId;
			} else {
				this.userId = 0;
			}
			this.store.commit('application/set', {
				common: {
					userId
				}
			});
		}
		getSiteId() {
			return this.siteId;
		}
		setSiteId(siteId) {
			if (typeof siteId === 'string' && siteId !== '') {
				this.siteId = siteId;
			} else {
				this.siteId = 's1';
			}
			this.store.commit('application/set', {
				common: {
					siteId: this.siteId
				}
			});
		}
		getLanguageId() {
			return this.languageId;
		}
		setLanguageId(languageId) {
			if (typeof languageId === 'string' && languageId !== '') {
				this.languageId = languageId;
			} else {
				this.languageId = 'en';
			}
			this.store.commit('application/set', {
				common: {
					languageId: this.languageId
				}
			});
		}
		getStore() {
			return this.store;
		}
		getStoreBuilder() {
			return this.storeBuilder;
		}
		addRestAnswerHandler(handler) {
			this.restAnswerHandler.push(handler);
		}
		addVuexModel(model) {
			this.vuexAdditionalModel.push(model);
		}
		isOnline() {
			return !this.offline;
		}
		ready() {
			if (this.inited) {
				return Promise.resolve(this);
			}
			return this.initPromise;
		}

		/* endregion 05. Methods */

		/* region 06. Interaction and utils */

		setError(code = '', description = '') {
			im_lib_logger.Logger.error(`Messenger.Application.error: ${code} (${description})`);
			let localizeDescription = '';
			if (code.endsWith('LOCALIZED')) {
				localizeDescription = description;
			}
			this.store.commit('application/set', {
				error: {
					active: true,
					code,
					description: localizeDescription
				}
			});
		}
		clearError() {
			this.store.commit('application/set', {
				error: {
					active: false,
					code: '',
					description: ''
				}
			});
		}
		addLocalize(phrases) {
			if (typeof phrases !== "object" || !phrases) {
				return false;
			}
			for (let name in phrases) {
				if (phrases.hasOwnProperty(name)) {
					this.localize[name] = phrases[name];
				}
			}
			return true;
		}
		getLocalize(name) {
			let phrase = '';
			if (typeof name === 'undefined') {
				return this.localize;
			} else if (typeof this.localize[name.toString()] === 'undefined') {
				im_lib_logger.Logger.warn(`Controller.Core.getLocalize: message with code '${name.toString()}' is undefined.`);
				//Logger.trace();
			} else {
				phrase = this.localize[name];
			}
			return phrase;
		}

		/* endregion 06. Interaction and utils */
	}

	exports.Controller = Controller;

})(this.BX.Messenger = this.BX.Messenger || {}, BX, BX, BX, BX, BX.Messenger.Model, BX.Messenger.Const, BX.Messenger.Lib, BX.Messenger.Provider.Pull, BX.Messenger.Provider.Rest, BX.Messenger.Lib, BX.Messenger.Lib);
//# sourceMappingURL=controller.bundle.js.map
