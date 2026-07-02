/* eslint-disable */
this.BX = this.BX || {};
this.BX.Messenger = this.BX.Messenger || {};
(function (exports, im_const, ui_vue_vuex, ui_vue, im_lib_utils, im_lib_logger, main_core_events, main_core) {
	'use strict';

	/**
	 * Bitrix Messenger
	 * Application model (Vuex Builder model)
	 *
	 * @package bitrix
	 * @subpackage im
	 * @copyright 2001-2020 Bitrix
	 */

	class ApplicationModel extends ui_vue_vuex.VuexBuilderModel {
		getName() {
			return 'application';
		}
		getState() {
			return {
				common: {
					host: this.getVariable('common.host', location.protocol + '//' + location.host),
					siteId: this.getVariable('common.siteId', 'default'),
					userId: this.getVariable('common.userId', 0),
					languageId: this.getVariable('common.languageId', 'en')
				},
				dialog: {
					dialogId: this.getVariable('dialog.dialogId', '0'),
					chatId: this.getVariable('dialog.chatId', 0),
					diskFolderId: this.getVariable('dialog.diskFolderId', 0),
					messageLimit: this.getVariable('dialog.messageLimit', 20),
					enableReadMessages: this.getVariable('dialog.enableReadMessages', true),
					messageExtraCount: 0
				},
				disk: {
					enabled: false,
					maxFileSize: 5242880
				},
				call: {
					serverEnabled: false,
					maxParticipants: 24
				},
				mobile: {
					keyboardShow: false
				},
				device: {
					type: this.getVariable('device.type', im_const.DeviceType.desktop),
					orientation: this.getVariable('device.orientation', im_const.DeviceOrientation.portrait)
				},
				options: {
					quoteEnable: this.getVariable('options.quoteEnable', true),
					quoteFromRight: this.getVariable('options.quoteFromRight', true),
					autoplayVideo: this.getVariable('options.autoplayVideo', true),
					darkBackground: this.getVariable('options.darkBackground', false),
					showSmiles: false
				},
				error: {
					active: false,
					code: '',
					description: ''
				}
			};
		}
		getStateSaveException() {
			return Object.assign({
				common: this.getVariable('saveException.common', null),
				dialog: this.getVariable('saveException.dialog', null),
				mobile: this.getVariable('saveException.mobile', null),
				device: this.getVariable('saveException.device', null),
				error: this.getVariable('saveException.error', null)
			});
		}
		getActions() {
			return {
				set: (store, payload) => {
					store.commit('set', this.validate(payload));
				},
				showSmiles: (store, payload) => {
					store.commit('showSmiles');
				},
				hideSmiles: (store, payload) => {
					store.commit('hideSmiles');
				}
			};
		}
		getMutations() {
			return {
				set: (state, payload) => {
					let hasChange = false;
					for (let group in payload) {
						if (!payload.hasOwnProperty(group)) {
							continue;
						}
						for (let field in payload[group]) {
							if (!payload[group].hasOwnProperty(field)) {
								continue;
							}
							state[group][field] = payload[group][field];
							hasChange = true;
						}
					}
					if (hasChange && this.isSaveNeeded(payload)) {
						this.saveState(state);
					}
				},
				increaseDialogExtraCount(state, payload = {}) {
					let {
						count = 1
					} = payload;
					state.dialog.messageExtraCount += count;
				},
				decreaseDialogExtraCount(state, payload = {}) {
					let {
						count = 1
					} = payload;
					let newCounter = state.dialog.messageExtraCount - count;
					if (newCounter <= 0) {
						newCounter = 0;
					}
					state.dialog.messageExtraCount = newCounter;
				},
				clearDialogExtraCount(state) {
					state.dialog.messageExtraCount = 0;
				},
				showSmiles(state) {
					state.options.showSmiles = true;
				},
				hideSmiles(state) {
					state.options.showSmiles = false;
				}
			};
		}
		validate(fields) {
			const result = {};
			if (typeof fields.common === 'object' && fields.common) {
				result.common = {};
				if (typeof fields.common.userId === 'number') {
					result.common.userId = fields.common.userId;
				}
				if (typeof fields.common.languageId === 'string') {
					result.common.languageId = fields.common.languageId;
				}
			}
			if (typeof fields.dialog === 'object' && fields.dialog) {
				result.dialog = {};
				if (typeof fields.dialog.dialogId === 'number') {
					result.dialog.dialogId = fields.dialog.dialogId.toString();
					result.dialog.chatId = 0;
				} else if (typeof fields.dialog.dialogId === 'string') {
					result.dialog.dialogId = fields.dialog.dialogId;
					if (typeof fields.dialog.chatId !== 'number') {
						let chatId = fields.dialog.dialogId;
						if (chatId.startsWith('chat')) {
							chatId = fields.dialog.dialogId.substr(4);
						}
						chatId = parseInt(chatId);
						result.dialog.chatId = !isNaN(chatId) ? chatId : 0;
						fields.dialog.chatId = result.dialog.chatId;
					}
				}
				if (typeof fields.dialog.chatId === 'number') {
					result.dialog.chatId = fields.dialog.chatId;
				}
				if (typeof fields.dialog.diskFolderId === 'number') {
					result.dialog.diskFolderId = fields.dialog.diskFolderId;
				}
				if (typeof fields.dialog.messageLimit === 'number') {
					result.dialog.messageLimit = fields.dialog.messageLimit;
				}
				if (typeof fields.dialog.messageExtraCount === 'number') {
					result.dialog.messageExtraCount = fields.dialog.messageExtraCount;
				}
				if (typeof fields.dialog.enableReadMessages === 'boolean') {
					result.dialog.enableReadMessages = fields.dialog.enableReadMessages;
				}
			}
			if (typeof fields.disk === 'object' && fields.disk) {
				result.disk = {};
				if (typeof fields.disk.enabled === 'boolean') {
					result.disk.enabled = fields.disk.enabled;
				}
				if (typeof fields.disk.maxFileSize === 'number') {
					result.disk.maxFileSize = fields.disk.maxFileSize;
				}
			}
			if (typeof fields.call === 'object' && fields.call) {
				result.call = {};
				if (typeof fields.call.serverEnabled === 'boolean') {
					result.call.serverEnabled = fields.call.serverEnabled;
				}
				if (typeof fields.call.maxParticipants === 'number') {
					result.call.maxParticipants = fields.call.maxParticipants;
				}
			}
			if (typeof fields.mobile === 'object' && fields.mobile) {
				result.mobile = {};
				if (typeof fields.mobile.keyboardShow === 'boolean') {
					result.mobile.keyboardShow = fields.mobile.keyboardShow;
				}
			}
			if (typeof fields.device === 'object' && fields.device) {
				result.device = {};
				if (typeof fields.device.type === 'string' && typeof im_const.DeviceType[fields.device.type] !== 'undefined') {
					result.device.type = fields.device.type;
				}
				if (typeof fields.device.orientation === 'string' && typeof im_const.DeviceOrientation[fields.device.orientation] !== 'undefined') {
					result.device.orientation = fields.device.orientation;
				}
			}
			if (typeof fields.error === 'object' && fields.error) {
				if (typeof fields.error.active === 'boolean') {
					result.error = {
						active: fields.error.active,
						code: fields.error.code.toString() || '',
						description: fields.error.description.toString() || ''
					};
				}
			}
			return result;
		}
	}

	/**
	 * Bitrix Messenger
	 * Messages model (Vuex Builder model)
	 *
	 * @package bitrix
	 * @subpackage im
	 * @copyright 2001-2020 Bitrix
	 */

	const IntersectionType = {
		empty: 'empty',
		equal: 'equal',
		none: 'none',
		found: 'found',
		foundReverse: 'foundReverse'
	};
	class MessagesModel extends ui_vue_vuex.VuexBuilderModel {
		getName() {
			return 'messages';
		}
		getState() {
			return {
				created: 0,
				collection: {},
				mutationType: {},
				saveMessageList: {},
				saveFileList: {},
				saveUserList: {},
				host: this.getVariable('host', location.protocol + '//' + location.host)
			};
		}
		getElementState() {
			return {
				templateId: 0,
				templateType: 'message',
				placeholderType: 0,
				id: 0,
				chatId: 0,
				authorId: 0,
				date: new Date(),
				text: "",
				textConverted: "",
				params: {
					TYPE: 'default',
					COMPONENT_ID: 'bx-im-view-message'
				},
				push: false,
				unread: false,
				sending: false,
				error: false,
				retry: false,
				blink: false
			};
		}
		getGetters() {
			return {
				getMutationType: state => chatId => {
					if (!state.mutationType[chatId]) {
						return {
							initialType: im_const.MutationType.none,
							appliedType: im_const.MutationType.none
						};
					}
					return state.mutationType[chatId];
				},
				getLastId: state => chatId => {
					if (!state.collection[chatId] || state.collection[chatId].length <= 0) {
						return null;
					}
					let lastId = 0;
					for (let i = 0; i < state.collection[chatId].length; i++) {
						let element = state.collection[chatId][i];
						if (element.push || element.sending || element.id.toString().startsWith('temporary')) {
							continue;
						}
						if (lastId < element.id) {
							lastId = element.id;
						}
					}
					return lastId ? lastId : null;
				},
				getMessage: state => (chatId, messageId) => {
					if (!state.collection[chatId] || state.collection[chatId].length <= 0) {
						return null;
					}
					for (let index = state.collection[chatId].length - 1; index >= 0; index--) {
						if (state.collection[chatId][index].id === messageId) {
							return state.collection[chatId][index];
						}
					}
					return null;
				},
				get: state => chatId => {
					if (!state.collection[chatId] || state.collection[chatId].length <= 0) {
						return [];
					}
					return state.collection[chatId];
				},
				getBlank: state => params => {
					return this.getElementState();
				},
				getSaveFileList: state => params => {
					return state.saveFileList;
				},
				getSaveUserList: state => params => {
					return state.saveUserList;
				}
			};
		}
		getActions() {
			return {
				add: (store, payload) => {
					let result = this.validate(Object.assign({}, payload));
					result.params = Object.assign({}, this.getElementState().params, result.params);
					if (payload.id) {
						if (store.state.collection[payload.chatId]) {
							const countMessages = store.state.collection[payload.chatId].length - 1;
							for (let index = countMessages; index >= 0; index--) {
								const message = store.state.collection[payload.chatId][index];
								if (message.templateId === payload.id) {
									return;
								}
							}
						}
						result.id = payload.id;
					} else {
						result.id = 'temporary' + new Date().getTime() + store.state.created;
					}
					result.templateId = result.id;
					result.unread = false;
					store.commit('add', Object.assign({}, this.getElementState(), result));
					if (payload.sending !== false) {
						store.dispatch('actionStart', {
							id: result.id,
							chatId: result.chatId
						});
					}
					return result.id;
				},
				actionStart: (store, payload) => {
					if (/^\d+$/.test(payload.id)) {
						payload.id = parseInt(payload.id);
					}
					payload.chatId = parseInt(payload.chatId);
					ui_vue.Vue.nextTick(() => {
						store.commit('update', {
							id: payload.id,
							chatId: payload.chatId,
							fields: {
								sending: true
							}
						});
					});
				},
				actionError: (store, payload) => {
					if (/^\d+$/.test(payload.id)) {
						payload.id = parseInt(payload.id);
					}
					payload.chatId = parseInt(payload.chatId);
					ui_vue.Vue.nextTick(() => {
						store.commit('update', {
							id: payload.id,
							chatId: payload.chatId,
							fields: {
								sending: false,
								error: true,
								retry: payload.retry !== false
							}
						});
					});
				},
				actionFinish: (store, payload) => {
					if (/^\d+$/.test(payload.id)) {
						payload.id = parseInt(payload.id);
					}
					payload.chatId = parseInt(payload.chatId);
					ui_vue.Vue.nextTick(() => {
						store.commit('update', {
							id: payload.id,
							chatId: payload.chatId,
							fields: {
								sending: false,
								error: false,
								retry: false
							}
						});
					});
				},
				set: (store, payload) => {
					if (payload instanceof Array) {
						payload = payload.map(message => this.prepareMessage(message, {
							host: store.state.host
						}));
					} else {
						let result = this.prepareMessage(payload, {
							host: store.state.host
						});
						(payload = []).push(result);
					}
					store.commit('set', {
						insertType: im_const.MutationType.set,
						data: payload
					});
					return 'set is done';
				},
				addPlaceholders: (store, payload) => {
					if (payload.placeholders instanceof Array) {
						payload.placeholders = payload.placeholders.map(message => this.prepareMessage(message, {
							host: store.state.host
						}));
					} else {
						return false;
					}
					const insertType = payload.requestMode === 'history' ? im_const.MutationType.setBefore : im_const.MutationType.setAfter;
					if (insertType === im_const.MutationType.setBefore) {
						payload.placeholders = payload.placeholders.reverse();
					}
					store.commit('set', {
						insertType,
						data: payload.placeholders
					});
					return payload.placeholders[0].id;
				},
				clearPlaceholders: (store, payload) => {
					store.commit('clearPlaceholders', payload);
				},
				updatePlaceholders: (store, payload) => {
					if (payload.data instanceof Array) {
						payload.data = payload.data.map(message => this.prepareMessage(message, {
							host: store.state.host
						}));
					} else {
						return false;
					}
					store.commit('updatePlaceholders', payload);
					return true;
				},
				setAfter: (store, payload) => {
					if (payload instanceof Array) {
						payload = payload.map(message => this.prepareMessage(message));
					} else {
						let result = this.prepareMessage(payload);
						(payload = []).push(result);
					}
					store.commit('set', {
						insertType: im_const.MutationType.setAfter,
						data: payload
					});
				},
				setBefore: (store, payload) => {
					if (payload instanceof Array) {
						payload = payload.map(message => this.prepareMessage(message));
					} else {
						let result = this.prepareMessage(payload);
						(payload = []).push(result);
					}
					store.commit('set', {
						insertType: im_const.MutationType.setBefore,
						data: payload
					});
				},
				update: (store, payload) => {
					if (/^\d+$/.test(payload.id)) {
						payload.id = parseInt(payload.id);
					}
					if (/^\d+$/.test(payload.chatId)) {
						payload.chatId = parseInt(payload.chatId);
					}
					store.commit('initCollection', {
						chatId: payload.chatId
					});
					if (!store.state.collection[payload.chatId]) {
						return false;
					}
					let index = store.state.collection[payload.chatId].findIndex(el => el.id === payload.id);
					if (index < 0) {
						return false;
					}
					let result = this.validate(Object.assign({}, payload.fields));
					if (result.params) {
						result.params = Object.assign({}, this.getElementState().params, store.state.collection[payload.chatId][index].params, result.params);
					}
					store.commit('update', {
						id: payload.id,
						chatId: payload.chatId,
						index: index,
						fields: result
					});
					if (payload.fields.blink) {
						setTimeout(() => {
							store.commit('update', {
								id: payload.id,
								chatId: payload.chatId,
								fields: {
									blink: false
								}
							});
						}, 1000);
					}
					return true;
				},
				delete: (store, payload) => {
					if (!(payload.id instanceof Array)) {
						payload.id = [payload.id];
					}
					payload.id = payload.id.map(id => {
						if (/^\d+$/.test(id)) {
							id = parseInt(id);
						}
						return id;
					});
					store.commit('delete', {
						chatId: payload.chatId,
						elements: payload.id
					});
					return true;
				},
				clear: (store, payload) => {
					payload.chatId = parseInt(payload.chatId);
					if (payload.keepPlaceholders) {
						store.commit('clearMessages', {
							chatId: payload.chatId
						});
					} else {
						store.commit('clear', {
							chatId: payload.chatId
						});
					}
					return true;
				},
				applyMutationType: (store, payload) => {
					payload.chatId = parseInt(payload.chatId);
					store.commit('applyMutationType', {
						chatId: payload.chatId
					});
					return true;
				},
				readMessages: (store, payload) => {
					payload.readId = parseInt(payload.readId) || 0;
					payload.chatId = parseInt(payload.chatId);
					if (typeof store.state.collection[payload.chatId] === 'undefined') {
						return {
							count: 0
						};
					}
					let count = 0;
					for (let index = store.state.collection[payload.chatId].length - 1; index >= 0; index--) {
						let element = store.state.collection[payload.chatId][index];
						if (!element.unread) continue;
						if (payload.readId === 0 || element.id <= payload.readId) {
							count++;
						}
					}
					store.commit('readMessages', {
						chatId: payload.chatId,
						readId: payload.readId
					});
					return {
						count
					};
				},
				unreadMessages: (store, payload) => {
					payload.unreadId = parseInt(payload.unreadId) || 0;
					payload.chatId = parseInt(payload.chatId);
					if (typeof store.state.collection[payload.chatId] === 'undefined' || !payload.unreadId) {
						return {
							count: 0
						};
					}
					let count = 0;
					for (let index = store.state.collection[payload.chatId].length - 1; index >= 0; index--) {
						let element = store.state.collection[payload.chatId][index];
						if (element.unread) continue;
						if (element.id >= payload.unreadId) {
							count++;
						}
					}
					store.commit('unreadMessages', {
						chatId: payload.chatId,
						unreadId: payload.unreadId
					});
					return {
						count
					};
				}
			};
		}
		getMutations() {
			return {
				initCollection: (state, payload) => {
					return this.initCollection(state, payload);
				},
				add: (state, payload) => {
					this.initCollection(state, {
						chatId: payload.chatId
					});
					state.collection[payload.chatId].push(payload);
					state.saveMessageList[payload.chatId].push(payload.id);
					state.created += 1;
					state.collection[payload.chatId].sort((a, b) => a.id - b.id);
					this.saveState(state, payload.chatId);
					im_lib_logger.Logger.warn('Messages model: saving state after add');
				},
				clearPlaceholders: (state, payload) => {
					if (!state.collection[payload.chatId]) {
						return false;
					}
					state.collection[payload.chatId] = state.collection[payload.chatId].filter(element => {
						return !element.id.toString().startsWith('placeholder');
					});
				},
				updatePlaceholders: (state, payload) => {
					const firstPlaceholderId = `placeholder${payload.firstMessage}`;
					const firstPlaceholderIndex = state.collection[payload.chatId].findIndex(message => {
						return message.id === firstPlaceholderId;
					});
					// Logger.warn('firstPlaceholderIndex', firstPlaceholderIndex);
					if (firstPlaceholderIndex >= 0) {
						// Logger.warn('before delete', state.collection[payload.chatId].length, [...state.collection[payload.chatId]]);
						state.collection[payload.chatId].splice(firstPlaceholderIndex, payload.amount);
						// Logger.warn('after delete', state.collection[payload.chatId].length, [...state.collection[payload.chatId]]);
						state.collection[payload.chatId].splice(firstPlaceholderIndex, 0, ...payload.data);
						// Logger.warn('after add', state.collection[payload.chatId].length, [...state.collection[payload.chatId]]);
					}
					state.collection[payload.chatId].sort((a, b) => a.id - b.id);
					im_lib_logger.Logger.warn('Messages model: saving state after updating placeholders');
					this.saveState(state, payload.chatId);
				},
				set: (state, payload) => {
					im_lib_logger.Logger.warn('Messages model: set mutation', payload);
					let chats = [];
					let chatsSave = [];
					let isPush = false;
					payload.data = MessagesModel.getPayloadWithTempMessages(state, payload);
					const initialType = payload.insertType;
					if (payload.insertType === im_const.MutationType.set) {
						payload.insertType = im_const.MutationType.setAfter;
						let elements = {};
						payload.data.forEach(element => {
							if (!elements[element.chatId]) {
								elements[element.chatId] = [];
							}
							elements[element.chatId].push(element.id);
						});
						for (let chatId in elements) {
							if (!elements.hasOwnProperty(chatId)) continue;
							this.initCollection(state, {
								chatId
							});
							im_lib_logger.Logger.warn('Messages model: messages before adding from request - ', state.collection[chatId].length);
							if (state.saveMessageList[chatId].length > elements[chatId].length || elements[chatId].length < im_const.StorageLimit.messages) {
								state.collection[chatId] = state.collection[chatId].filter(element => elements[chatId].includes(element.id));
								state.saveMessageList[chatId] = state.saveMessageList[chatId].filter(id => elements[chatId].includes(id));
							}
							im_lib_logger.Logger.warn('Messages model: cache length', state.saveMessageList[chatId].length);
							let intersection = this.manageCacheBeforeSet([...state.saveMessageList[chatId].reverse()], elements[chatId]);
							im_lib_logger.Logger.warn('Messages model: set intersection with cache', intersection);
							if (intersection.type === IntersectionType.none) {
								if (intersection.foundElements.length > 0) {
									state.collection[chatId] = state.collection[chatId].filter(element => !intersection.foundElements.includes(element.id));
									state.saveMessageList[chatId] = state.saveMessageList[chatId].filter(id => !intersection.foundElements.includes(id));
								}
								im_lib_logger.Logger.warn('Messages model: no intersection - removing cache');
								this.removeIntersectionCacheElements = state.collection[chatId].map(element => element.id);
								state.collection[chatId] = state.collection[chatId].filter(element => !this.removeIntersectionCacheElements.includes(element.id));
								state.saveMessageList[chatId] = state.saveMessageList[chatId].filter(id => !this.removeIntersectionCacheElements.includes(id));
								this.removeIntersectionCacheElements = [];
							} else if (intersection.type === IntersectionType.foundReverse) {
								im_lib_logger.Logger.warn('Messages model: found reverse intersection');
								payload.insertType = im_const.MutationType.setBefore;
								payload.data = payload.data.reverse();
							}
						}
					}
					im_lib_logger.Logger.warn('Messages model: adding messages to model', payload.data);
					for (let element of payload.data) {
						this.initCollection(state, {
							chatId: element.chatId
						});
						let index = state.collection[element.chatId].findIndex(localMessage => {
							if (MessagesModel.isTemporaryMessage(localMessage)) {
								return localMessage.templateId === element.templateId;
							}
							return localMessage.id === element.id;
						});
						if (index > -1) {
							state.collection[element.chatId][index] = Object.assign(state.collection[element.chatId][index], element);
						} else if (payload.insertType === im_const.MutationType.setBefore) {
							state.collection[element.chatId].unshift(element);
						} else if (payload.insertType === im_const.MutationType.setAfter) {
							state.collection[element.chatId].push(element);
						}
						chats.push(element.chatId);
						if (this.store.getters['dialogues/canSaveChat'] && this.store.getters['dialogues/canSaveChat'](element.chatId)) {
							chatsSave.push(element.chatId);
						}
					}
					chats = [...new Set(chats)];
					chatsSave = [...new Set(chatsSave)];
					isPush = payload.data.every(element => element.push === true);
					im_lib_logger.Logger.warn('Is it fake push message?', isPush);
					chats.forEach(chatId => {
						state.collection[chatId].sort((a, b) => a.id - b.id);
						if (!isPush) {
							//send event that messages are ready and we can start reading etc
							im_lib_logger.Logger.warn('setting messagesSet = true for chatId = ', chatId);
							setTimeout(() => {
								main_core_events.EventEmitter.emit(im_const.EventType.dialog.messagesSet, {
									chatId
								});
								main_core_events.EventEmitter.emit(im_const.EventType.dialog.readVisibleMessages, {
									chatId
								});
							}, 100);
						}
					});
					if (initialType !== im_const.MutationType.setBefore) {
						chatsSave.forEach(chatId => {
							im_lib_logger.Logger.warn('Messages model: saving state after set');
							this.saveState(state, chatId);
						});
					}
				},
				update: (state, payload) => {
					this.initCollection(state, {
						chatId: payload.chatId
					});
					let index = -1;
					if (typeof payload.index !== 'undefined' && state.collection[payload.chatId][payload.index]) {
						index = payload.index;
					} else {
						index = state.collection[payload.chatId].findIndex(el => el.id === payload.id);
					}
					if (index >= 0) {
						let isSaveState = state.saveMessageList[payload.chatId].includes(state.collection[payload.chatId][index].id) || payload.fields.id && !payload.fields.id.toString().startsWith('temporary') && state.collection[payload.chatId][index].id.toString().startsWith('temporary');
						state.collection[payload.chatId][index] = Object.assign(state.collection[payload.chatId][index], payload.fields);
						if (isSaveState) {
							im_lib_logger.Logger.warn('Messages model: saving state after update');
							this.saveState(state, payload.chatId);
						}
					}
				},
				delete: (state, payload) => {
					this.initCollection(state, {
						chatId: payload.chatId
					});
					state.collection[payload.chatId] = state.collection[payload.chatId].filter(element => !payload.elements.includes(element.id));
					if (state.saveMessageList[payload.chatId].length > 0) {
						for (let id of payload.elements) {
							if (state.saveMessageList[payload.chatId].includes(id)) {
								im_lib_logger.Logger.warn('Messages model: saving state after delete');
								this.saveState(state, payload.chatId);
								break;
							}
						}
					}
				},
				clear: (state, payload) => {
					this.initCollection(state, {
						chatId: payload.chatId
					});
					state.collection[payload.chatId] = [];
					state.saveMessageList[payload.chatId] = [];
				},
				clearMessages: (state, payload) => {
					this.initCollection(state, {
						chatId: payload.chatId
					});
					state.collection[payload.chatId] = state.collection[payload.chatId].filter(element => {
						return element.id.toString().startsWith('placeholder');
					});
					state.saveMessageList[payload.chatId] = [];
				},
				applyMutationType: (state, payload) => {
					if (typeof state.mutationType[payload.chatId] === 'undefined') {
						ui_vue.Vue.set(state.mutationType, payload.chatId, {
							applied: false,
							initialType: im_const.MutationType.none,
							appliedType: im_const.MutationType.none,
							scrollStickToTop: 0,
							scrollMessageId: 0
						});
					}
					state.mutationType[payload.chatId].applied = true;
				},
				readMessages: (state, payload) => {
					this.initCollection(state, {
						chatId: payload.chatId
					});
					let saveNeeded = false;
					for (let index = state.collection[payload.chatId].length - 1; index >= 0; index--) {
						let element = state.collection[payload.chatId][index];
						if (!element.unread) continue;
						if (payload.readId === 0 || element.id <= payload.readId) {
							state.collection[payload.chatId][index] = Object.assign(state.collection[payload.chatId][index], {
								unread: false
							});
							saveNeeded = true;
						}
					}
					if (saveNeeded) {
						im_lib_logger.Logger.warn('Messages model: saving state after reading');
						this.saveState(state, payload.chatId);
					}
				},
				unreadMessages: (state, payload) => {
					this.initCollection(state, {
						chatId: payload.chatId
					});
					let saveNeeded = false;
					for (let index = state.collection[payload.chatId].length - 1; index >= 0; index--) {
						let element = state.collection[payload.chatId][index];
						if (element.unread) continue;
						if (element.id >= payload.unreadId) {
							state.collection[payload.chatId][index] = Object.assign(state.collection[payload.chatId][index], {
								unread: true
							});
							saveNeeded = true;
						}
					}
					if (saveNeeded) {
						im_lib_logger.Logger.warn('Messages model: saving state after unreading');
						this.saveState(state, payload.chatId);
						this.updateSubordinateStates();
					}
				}
			};
		}
		initCollection(state, payload) {
			if (typeof payload.chatId === 'undefined') {
				return false;
			}
			if (typeof payload.chatId === 'undefined' || typeof state.collection[payload.chatId] !== 'undefined') {
				return true;
			}
			ui_vue.Vue.set(state.collection, payload.chatId, payload.messages ? [].concat(payload.messages) : []);
			ui_vue.Vue.set(state.saveMessageList, payload.chatId, []);
			ui_vue.Vue.set(state.saveFileList, payload.chatId, []);
			ui_vue.Vue.set(state.saveUserList, payload.chatId, []);
			return true;
		}
		prepareMessage(message, options = {}) {
			let result = this.validate(Object.assign({}, message), options);
			result.params = Object.assign({}, this.getElementState().params, result.params);
			if (!result.templateId) {
				result.templateId = result.id;
			}
			return Object.assign({}, this.getElementState(), result);
		}
		manageCacheBeforeSet(cache, elements, recursive = false) {
			im_lib_logger.Logger.warn('manageCacheBeforeSet', cache, elements);
			let result = {
				type: IntersectionType.empty,
				foundElements: [],
				noneElements: []
			};
			if (!cache || cache.length <= 0) {
				return result;
			}
			for (let id of elements) {
				if (cache.includes(id)) {
					if (result.type === IntersectionType.empty) {
						result.type = IntersectionType.found;
					}
					result.foundElements.push(id);
				} else {
					if (result.type === IntersectionType.empty) {
						result.type = IntersectionType.none;
					}
					result.noneElements.push(id);
				}
			}
			if (result.type === IntersectionType.found && cache.length === elements.length && result.foundElements.length === elements.length) {
				result.type = IntersectionType.equal;
			} else if (result.type === IntersectionType.none && !recursive && result.foundElements.length > 0) {
				let reverseResult = this.manageCacheBeforeSet(cache.reverse(), elements.reverse(), true);
				if (reverseResult.type === IntersectionType.found) {
					reverseResult.type = IntersectionType.foundReverse;
					return reverseResult;
				}
			}
			return result;
		}
		updateSaveLists(state, chatId) {
			if (!this.isSaveAvailable()) {
				return true;
			}
			if (!chatId || !this.store.getters['dialogues/canSaveChat'] || !this.store.getters['dialogues/canSaveChat'](chatId)) {
				return false;
			}
			this.initCollection(state, {
				chatId: chatId
			});
			let count = 0;
			let saveMessageList = [];
			let saveFileList = [];
			let saveUserList = [];
			let dialog = this.store.getters['dialogues/getByChatId'](chatId);
			if (dialog && dialog.type === 'private') {
				saveUserList.push(parseInt(dialog.dialogId));
			}
			let readCounter = 0;
			for (let index = state.collection[chatId].length - 1; index >= 0; index--) {
				if (state.collection[chatId][index].id.toString().startsWith('temporary')) {
					continue;
				}
				if (!state.collection[chatId][index].unread) {
					readCounter++;
				}
				if (count >= im_const.StorageLimit.messages && readCounter >= 50) {
					break;
				}
				saveMessageList.unshift(state.collection[chatId][index].id);
				count++;
			}
			saveMessageList = saveMessageList.slice(0, im_const.StorageLimit.messages);
			state.collection[chatId].filter(element => saveMessageList.includes(element.id)).forEach(element => {
				if (element.authorId > 0) {
					saveUserList.push(element.authorId);
				}
				if (element.params.FILE_ID instanceof Array) {
					saveFileList = element.params.FILE_ID.concat(saveFileList);
				}
			});
			state.saveMessageList[chatId] = saveMessageList;
			state.saveFileList[chatId] = [...new Set(saveFileList)];
			state.saveUserList[chatId] = [...new Set(saveUserList)];
			return true;
		}
		getSaveTimeout() {
			return 150;
		}
		saveState(state, chatId) {
			if (!this.updateSaveLists(state, chatId)) {
				return false;
			}
			super.saveState(() => {
				let storedState = {
					collection: {},
					saveMessageList: {},
					saveUserList: {},
					saveFileList: {}
				};
				for (let chatId in state.saveMessageList) {
					if (!state.saveMessageList.hasOwnProperty(chatId)) {
						continue;
					}
					if (!state.collection[chatId]) {
						continue;
					}
					if (!storedState.collection[chatId]) {
						storedState.collection[chatId] = [];
					}
					state.collection[chatId].filter(element => state.saveMessageList[chatId].includes(element.id)).forEach(element => {
						if (element.templateType !== 'placeholder') {
							storedState.collection[chatId].push(element);
						}
					});
					im_lib_logger.Logger.warn('Cache after updating', storedState.collection[chatId]);
					storedState.saveMessageList[chatId] = state.saveMessageList[chatId];
					storedState.saveFileList[chatId] = state.saveFileList[chatId];
					storedState.saveUserList[chatId] = state.saveUserList[chatId];
				}
				return storedState;
			});
		}
		updateSubordinateStates() {
			this.store.dispatch('users/saveState');
			this.store.dispatch('files/saveState');
		}
		validate(fields, options) {
			const result = {};
			if (typeof fields.id === "number") {
				result.id = fields.id;
			} else if (typeof fields.id === "string") {
				if (fields.id.startsWith('temporary') || fields.id.startsWith('placeholder') || im_lib_utils.Utils.types.isUuidV4(fields.id)) {
					result.id = fields.id;
				} else {
					result.id = parseInt(fields.id);
				}
			}
			if (typeof fields.uuid === "string") {
				result.templateId = fields.uuid;
			} else if (typeof fields.templateId === "number") {
				result.templateId = fields.templateId;
			} else if (typeof fields.templateId === "string") {
				if (fields.templateId.startsWith('temporary') || im_lib_utils.Utils.types.isUuidV4(fields.templateId)) {
					result.templateId = fields.templateId;
				} else {
					result.templateId = parseInt(fields.templateId);
				}
			}
			if (typeof fields.templateType === "string") {
				result.templateType = fields.templateType;
			}
			if (typeof fields.placeholderType === "number") {
				result.placeholderType = fields.placeholderType;
			}
			if (typeof fields.chat_id !== 'undefined') {
				fields.chatId = fields.chat_id;
			}
			if (typeof fields.chatId === "number" || typeof fields.chatId === "string") {
				result.chatId = parseInt(fields.chatId);
			}
			if (typeof fields.date !== "undefined") {
				result.date = im_lib_utils.Utils.date.cast(fields.date);
			}

			// previous P&P format
			if (typeof fields.textLegacy === "string" || typeof fields.textLegacy === "number") {
				if (typeof fields.text === "string" || typeof fields.text === "number") {
					result.text = fields.text.toString();
				}
				result.textConverted = this.convertToHtml({
					text: fields.textLegacy.toString(),
					isConverted: true
				});
				if (typeof fields.text === "string" || typeof fields.text === "number") {
					result.text = fields.text;
				}
			} else
				// modern format
				{
					if (typeof fields.text_converted !== 'undefined') {
						fields.textConverted = fields.text_converted;
					}
					if (typeof fields.textConverted === "string" || typeof fields.textConverted === "number") {
						result.textConverted = fields.textConverted.toString();
					}
					if (typeof fields.text === "string" || typeof fields.text === "number") {
						result.text = fields.text.toString();
						let isConverted = typeof result.textConverted !== 'undefined';
						result.textConverted = this.convertToHtml({
							text: isConverted ? result.textConverted : result.text,
							isConverted
						});
					}
				}
			if (typeof fields.senderId !== 'undefined') {
				fields.authorId = fields.senderId;
			} else if (typeof fields.author_id !== 'undefined') {
				fields.authorId = fields.author_id;
			}
			if (typeof fields.authorId === "number" || typeof fields.authorId === "string") {
				if (fields.system === true || fields.system === 'Y') {
					result.authorId = 0;
				} else {
					result.authorId = parseInt(fields.authorId);
				}
			}
			if (typeof fields.params === "object" && fields.params !== null) {
				const params = this.validateParams(fields.params, options);
				if (params) {
					result.params = params;
				}
			}
			if (typeof fields.push === "boolean") {
				result.push = fields.push;
			}
			if (typeof fields.sending === "boolean") {
				result.sending = fields.sending;
			}
			if (typeof fields.unread === "boolean") {
				result.unread = fields.unread;
			}
			if (typeof fields.blink === "boolean") {
				result.blink = fields.blink;
			}
			if (typeof fields.error === "boolean" || typeof fields.error === "string") {
				result.error = fields.error;
			}
			if (typeof fields.retry === "boolean") {
				result.retry = fields.retry;
			}
			return result;
		}
		validateParams(params, options) {
			const result = {};
			try {
				for (let field in params) {
					if (!params.hasOwnProperty(field)) {
						continue;
					}
					if (field === 'COMPONENT_ID') {
						if (typeof params[field] === "string" && BX.Vue.isComponent(params[field])) {
							result[field] = params[field];
						}
					} else if (field === 'LIKE') {
						if (params[field] instanceof Array) {
							result['REACTION'] = {
								like: params[field].map(element => parseInt(element))
							};
						}
					} else if (field === 'CHAT_LAST_DATE') {
						result[field] = im_lib_utils.Utils.date.cast(params[field]);
					} else if (field === 'AVATAR') {
						if (params[field]) {
							result[field] = params[field].startsWith('http') ? params[field] : options.host + params[field];
						}
					} else if (field === 'NAME') {
						if (params[field]) {
							result[field] = params[field];
						}
					} else if (field === 'LINK_ACTIVE') {
						if (params[field]) {
							result[field] = params[field].map(function (userId) {
								return parseInt(userId);
							});
						}
					} else if (field === 'ATTACH') {
						result[field] = params[field];
					} else {
						result[field] = params[field];
					}
				}
			} catch (e) {}
			let hasResultElements = false;
			for (let field in result) {
				if (!result.hasOwnProperty(field)) {
					continue;
				}
				hasResultElements = true;
				break;
			}
			return hasResultElements ? result : null;
		}
		convertToHtml(params = {}) {
			let {
				quote = true,
				image = true,
				text = '',
				isConverted = false,
				enableBigSmile = true
			} = params;
			text = text.trim();
			if (!isConverted) {
				text = text.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
			}
			if (text.startsWith('/me')) {
				text = `<i>${text.substr(4)}</i>`;
			} else if (text.startsWith('/loud')) {
				text = `<b>${text.substr(6)}</b>`;
			}
			const quoteSign = "&gt;&gt;";
			if (quote && text.indexOf(quoteSign) >= 0) {
				let textPrepare = text.split(isConverted ? "<br />" : "\n");
				for (let i = 0; i < textPrepare.length; i++) {
					if (textPrepare[i].startsWith(quoteSign)) {
						textPrepare[i] = textPrepare[i].replace(quoteSign, '<div class="bx-im-message-content-quote"><div class="bx-im-message-content-quote-wrap">');
						while (++i < textPrepare.length && textPrepare[i].startsWith(quoteSign)) {
							textPrepare[i] = textPrepare[i].replace(quoteSign, '');
						}
						textPrepare[i - 1] += '</div></div><br>';
					}
				}
				text = textPrepare.join("<br />");
			}
			text = text.replace(/\n/gi, '<br />');
			text = text.replace(/\t/gi, '&nbsp;&nbsp;&nbsp;&nbsp;');

			//text = this.decodeBbCode(text, false, enableBigSmile);
			text = im_lib_utils.Utils.text.decodeBbCode(text, enableBigSmile);
			if (quote) {
				text = text.replace(/------------------------------------------------------<br \/>(.*?)\[(.*?)\](?: #(?:(?:chat)?\d+|\d+:\d+)\/\d+)?<br \/>(.*?)------------------------------------------------------(<br \/>)?/g, function (whole, p1, p2, p3, p4, offset) {
					return (offset > 0 ? '<br>' : '') + "<div class=\"bx-im-message-content-quote\"><div class=\"bx-im-message-content-quote-wrap\"><div class=\"bx-im-message-content-quote-name\"><span class=\"bx-im-message-content-quote-name-text\">" + p1 + "</span><span class=\"bx-im-message-content-quote-name-time\">" + p2 + "</span></div>" + p3 + "</div></div><br />";
				});
				text = text.replace(/------------------------------------------------------<br \/>(.*?)------------------------------------------------------(<br \/>)?/g, function (whole, p1, p2, p3, offset) {
					return (offset > 0 ? '<br>' : '') + "<div class=\"bx-im-message-content-quote\"><div class=\"bx-im-message-content-quote-wrap\">" + p1 + "</div></div><br />";
				});
			}
			if (image) {
				let changed = false;
				text = text.replace(/<a(.*?)>(http[s]{0,1}:\/\/.*?)<\/a>/gi, function (whole, aInner, text, offset) {
					if (!text.match(/(\.(jpg|jpeg|png|gif|webp)\?|\.(jpg|jpeg|png|gif|webp)$)/i) || text.indexOf("/docs/pub/") > 0 || text.indexOf("logout=yes") > 0) {
						return whole;
					} else {
						changed = true;
						return (offset > 0 ? '<br />' : '') + '<a' + aInner + ' target="_blank" class="bx-im-element-file-image"><img src="' + text + '" class="bx-im-element-file-image-source-text" onerror="BX.Messenger.Model.MessagesModel.hideErrorImage(this)"></a></span>';
					}
				});
				if (changed) {
					text = text.replace(/<\/span>(\n?)<br(\s\/?)>/gi, '</span>').replace(/<br(\s\/?)>(\n?)<br(\s\/?)>(\n?)<span/gi, '<br /><span');
				}
			}
			if (enableBigSmile) {
				text = text.replace(/^(\s*<img\s+src=[^>]+?data-code=[^>]+?data-definition="UHD"[^>]+?style="width:)(\d+)(px[^>]+?height:)(\d+)(px[^>]+?class="bx-smile"\s*\/?>\s*)$/, function doubleSmileSize(match, start, width, middle, height, end) {
					return start + parseInt(width, 10) * 1.7 + middle + parseInt(height, 10) * 1.7 + end;
				});
			}
			if (text.substr(-6) == '<br />') {
				text = text.substr(0, text.length - 6);
			}
			text = text.replace(/<br><br \/>/gi, '<br />');
			text = text.replace(/<br \/><br>/gi, '<br />');
			return text;
		}
		decodeBbCode(text, textOnly = false, enableBigSmile = true) {
			return MessagesModel.decodeBbCode({
				text,
				textOnly,
				enableBigSmile
			});
		}
		decodeAttach(item) {
			if (Array.isArray(item)) {
				item.forEach(arrayElement => {
					arrayElement = this.decodeAttach(arrayElement);
				});
			} else if (typeof item === 'object' && item !== null) {
				for (const prop in item) {
					if (item.hasOwnProperty(prop)) {
						item[prop] = this.decodeAttach(item[prop]);
					}
				}
			} else {
				if (typeof item === 'string') {
					item = im_lib_utils.Utils.text.htmlspecialcharsback(item);
				}
			}
			return item;
		}
		static decodeBbCode(params = {}) {
			let {
				text,
				textOnly = false,
				enableBigSmile = true
			} = params;
			let putReplacement = [];
			text = text.replace(/\[PUT(?:=(.+?))?\](.+?)?\[\/PUT\]/gi, function (whole) {
				var id = putReplacement.length;
				putReplacement.push(whole);
				return '####REPLACEMENT_PUT_' + id + '####';
			});
			let sendReplacement = [];
			text = text.replace(/\[SEND(?:=(.+?))?\](.+?)?\[\/SEND\]/gi, function (whole) {
				var id = sendReplacement.length;
				sendReplacement.push(whole);
				return '####REPLACEMENT_SEND_' + id + '####';
			});
			let codeReplacement = [];
			text = text.replace(/\[CODE\]\n?(.*?)\[\/CODE\]/sig, function (whole, text) {
				let id = codeReplacement.length;
				codeReplacement.push(text);
				return '####REPLACEMENT_CODE_' + id + '####';
			});
			text = text.replace(/\[url=([^\]]+)\](.*?)\[\/url\]/gis, function (whole, link, text) {
				let tag = document.createElement('a');
				tag.href = im_lib_utils.Utils.text.htmlspecialcharsback(link);
				tag.target = '_blank';
				tag.text = im_lib_utils.Utils.text.htmlspecialcharsback(text);
				let allowList = ["http:", "https:", "ftp:", "file:", "tel:", "callto:", "mailto:", "skype:", "viber:"];
				if (allowList.indexOf(tag.protocol) <= -1) {
					return whole;
				}
				return tag.outerHTML;
			});
			text = text.replace(/\[url\]([^\]]+)\[\/url\]/gis, function (whole, link) {
				link = im_lib_utils.Utils.text.htmlspecialcharsback(link);
				let tag = document.createElement('a');
				tag.href = link;
				tag.target = '_blank';
				tag.text = link;
				let allowList = ["http:", "https:", "ftp:", "file:", "tel:", "callto:", "mailto:", "skype:", "viber:"];
				if (allowList.indexOf(tag.protocol) <= -1) {
					return whole;
				}
				return tag.outerHTML;
			});
			text = text.replace(/\[LIKE\]/gi, '<span class="bx-smile bx-im-smile-like"></span>');
			text = text.replace(/\[DISLIKE\]/gi, '<span class="bx-smile bx-im-smile-dislike"></span>');
			text = text.replace(/\[BR\]/gi, '<br/>');
			text = text.replace(/\[([buis])\](.*?)\[(\/[buis])\]/gi, (whole, open, inner, close) => '<' + open + '>' + inner + '<' + close + '>'); // TODO tag USER

			// this code needs to be ported to im/install/js/im/view/message/body/src/body.js:229
			text = text.replace(/\[CHAT=(imol\|)?([0-9]{1,})\](.*?)\[\/CHAT\]/gi, (whole, openlines, chatId, inner) => openlines ? inner : '<span class="bx-im-mention" data-type="CHAT" data-value="chat' + chatId + '">' + inner + '</span>'); // TODO tag CHAT
			text = text.replace(/\[CALL(?:=(.+?))?\](.+?)?\[\/CALL\]/gi, (whole, number, text) => '<span class="bx-im-mention" data-type="CALL" data-value="' + im_lib_utils.Utils.text.htmlspecialchars(number) + '">' + text + '</span>'); // TODO tag CHAT

			text = text.replace(/\[PCH=([0-9]{1,})\](.*?)\[\/PCH\]/gi, (whole, historyId, text) => text); // TODO tag PCH

			let textElementSize = 0;
			if (enableBigSmile) {
				textElementSize = text.replace(/\[icon\=([^\]]*)\]/gi, '').trim().length;
			}
			text = text.replace(/\[icon\=([^\]]*)\]/gi, whole => {
				let url = whole.match(/icon\=(\S+[^\s.,> )\];\'\"!?])/i);
				if (url && url[1]) {
					url = url[1];
				} else {
					return '';
				}
				let attrs = {
					'src': url,
					'border': 0
				};
				let size = whole.match(/size\=(\d+)/i);
				if (size && size[1]) {
					attrs['width'] = size[1];
					attrs['height'] = size[1];
				} else {
					let width = whole.match(/width\=(\d+)/i);
					if (width && width[1]) {
						attrs['width'] = width[1];
					}
					let height = whole.match(/height\=(\d+)/i);
					if (height && height[1]) {
						attrs['height'] = height[1];
					}
					if (attrs['width'] && !attrs['height']) {
						attrs['height'] = attrs['width'];
					} else if (attrs['height'] && !attrs['width']) {
						attrs['width'] = attrs['height'];
					} else if (attrs['height'] && attrs['width']) ; else {
						attrs['width'] = 20;
						attrs['height'] = 20;
					}
				}
				attrs['width'] = attrs['width'] > 100 ? 100 : attrs['width'];
				attrs['height'] = attrs['height'] > 100 ? 100 : attrs['height'];
				if (enableBigSmile && textElementSize === 0 && attrs['width'] === attrs['height'] && attrs['width'] === 20) {
					attrs['width'] = 40;
					attrs['height'] = 40;
				}
				let title = whole.match(/title\=(.*[^\s\]])/i);
				if (title && title[1]) {
					title = title[1];
					if (title.indexOf('width=') > -1) {
						title = title.substr(0, title.indexOf('width='));
					}
					if (title.indexOf('height=') > -1) {
						title = title.substr(0, title.indexOf('height='));
					}
					if (title.indexOf('size=') > -1) {
						title = title.substr(0, title.indexOf('size='));
					}
					if (title) {
						attrs['title'] = im_lib_utils.Utils.text.htmlspecialchars(title).trim();
						attrs['alt'] = attrs['title'];
					}
				}
				let attributes = '';
				for (let name in attrs) {
					if (attrs.hasOwnProperty(name)) {
						attributes += name + '="' + attrs[name] + '" ';
					}
				}
				return '<img class="bx-smile bx-icon" ' + attributes + '>';
			});
			sendReplacement.forEach((value, index) => {
				text = text.replace('####REPLACEMENT_SEND_' + index + '####', value);
			});
			text = text.replace(/\[SEND(?:=(?:.+?))?\](?:.+?)?\[\/SEND]/gi, match => {
				return match.replace(/\[SEND(?:=(.+))?\](.+?)?\[\/SEND]/gi, (whole, command, text) => {
					let html = '';
					text = text ? text : command;
					command = (command ? command : text).replace('<br />', '\n');
					if (!textOnly && text) {
						text = text.replace(/<([\w]+)[^>]*>(.*?)<\\1>/i, "$2", text);
						text = text.replace(/\[([\w]+)[^\]]*\](.*?)\[\/\1\]/i, "$2", text);
						command = command.split('####REPLACEMENT_PUT_').join('####REPLACEMENT_SP_');
						html = '<!--IM_COMMAND_START-->' + '<span class="bx-im-message-command-wrap">' + '<span class="bx-im-message-command" data-entity="send">' + text + '</span>' + '<span class="bx-im-message-command-data">' + command + '</span>' + '</span>' + '<!--IM_COMMAND_END-->';
					} else {
						html = text;
					}
					return html;
				});
			});
			putReplacement.forEach((value, index) => {
				text = text.replace('####REPLACEMENT_PUT_' + index + '####', value);
			});
			text = text.replace(/\[PUT(?:=(?:.+?))?\](?:.+?)?\[\/PUT]/gi, match => {
				return match.replace(/\[PUT(?:=(.+))?\](.+?)?\[\/PUT]/gi, (whole, command, text) => {
					let html = '';
					text = text ? text : command;
					command = (command ? command : text).replace('<br />', '\n');
					if (!textOnly && text) {
						text = text.replace(/<([\w]+)[^>]*>(.*?)<\/\1>/i, "$2", text);
						text = text.replace(/\[([\w]+)[^\]]*\](.*?)\[\/\1\]/i, "$2", text);
						html = '<!--IM_COMMAND_START-->' + '<span class="bx-im-message-command-wrap">' + '<span class="bx-im-message-command" data-entity="put">' + text + '</span>' + '<span class="bx-im-message-command-data">' + command + '</span>' + '</span>' + '<!--IM_COMMAND_END-->';
					} else {
						html = text;
					}
					return html;
				});
			});
			codeReplacement.forEach((code, index) => {
				text = text.replace('####REPLACEMENT_CODE_' + index + '####', !textOnly ? '<div class="bx-im-message-content-code">' + code + '</div>' : code);
			});
			if (sendReplacement.length > 0) {
				do {
					sendReplacement.forEach((value, index) => {
						text = text.replace('####REPLACEMENT_SEND_' + index + '####', value);
					});
				} while (text.includes('####REPLACEMENT_SEND_'));
			}
			text = text.split('####REPLACEMENT_SP_').join('####REPLACEMENT_PUT_');
			if (putReplacement.length > 0) {
				do {
					putReplacement.forEach((value, index) => {
						text = text.replace('####REPLACEMENT_PUT_' + index + '####', value);
					});
				} while (text.includes('####REPLACEMENT_PUT_'));
			}
			return text;
		}
		static hideErrorImage(element) {
			if (element.parentNode && element.parentNode) {
				element.parentNode.innerHTML = '<a href="' + element.src + '" target="_blank">' + element.src + '</a>';
			}
			return true;
		}
		static isTemporaryMessage(element) {
			return element.id && (im_lib_utils.Utils.types.isUuidV4(element.id) || element.id.toString().startsWith('temporary'));
		}
		static getPayloadWithTempMessages(state, payload) {
			const payloadData = [...payload.data];
			if (!im_lib_utils.Utils.platform.isBitrixMobile()) {
				return payloadData;
			}
			if (!payload.data || payload.data.length <= 0) {
				return payloadData;
			}

			// consider that in the payload we have messages only for one chat, so we get the value from the first message.
			const payloadChatId = payload.data[0].chatId;
			if (!state.collection[payloadChatId]) {
				return payloadData;
			}
			state.collection[payloadChatId].forEach(message => {
				if (MessagesModel.isTemporaryMessage(message) && !MessagesModel.existsInPayload(payload, message.templateId) && MessagesModel.doesTaskExist(message)) {
					payloadData.push(message);
				}
			});
			return payloadData;
		}
		static existsInPayload(payload, templateId) {
			return payload.data.find(payloadMessage => payloadMessage.templateId === templateId);
		}
		static doesTaskExist(message) {
			if (Array.isArray(message.params.FILE_ID)) {
				let foundUploadTasks = false;
				message.params.FILE_ID.forEach(fileId => {
					if (!foundUploadTasks) {
						foundUploadTasks = window.imDialogUploadTasks.find(task => task.taskId.split('|')[1] === fileId);
					}
				});
				return !!foundUploadTasks;
			}
			if (message.templateId) {
				const foundMessageTask = window.imDialogMessagesTasks.find(task => task.taskId.split('|')[1] === message.templateId);
				return !!foundMessageTask;
			}
			return false;
		}
	}

	/**
	 * Bitrix Messenger
	 * Dialogues model (Vuex Builder model)
	 *
	 * @package bitrix
	 * @subpackage im
	 * @copyright 2001-2020 Bitrix
	 */

	class DialoguesModel extends ui_vue_vuex.VuexBuilderModel {
		getName() {
			return 'dialogues';
		}
		getState() {
			return {
				host: this.getVariable('host', location.protocol + '//' + location.host),
				collection: {},
				saveDialogList: [],
				saveChatList: []
			};
		}
		getStateSaveException() {
			return {
				host: null
			};
		}
		getElementStateSaveException() {
			return {
				writingList: null,
				quoteId: null
			};
		}
		getElementState() {
			return {
				dialogId: '0',
				chatId: 0,
				counter: 0,
				userCounter: 0,
				messageCount: 0,
				unreadId: 0,
				lastMessageId: 0,
				managerList: [],
				readedList: [],
				writingList: [],
				muteList: [],
				textareaMessage: "",
				quoteId: 0,
				editId: 0,
				init: false,
				name: "",
				owner: 0,
				extranet: false,
				avatar: "",
				color: "#17A3EA",
				type: "chat",
				entityType: "",
				entityId: "",
				entityData1: "",
				entityData2: "",
				entityData3: "",
				dateCreate: new Date(),
				restrictions: {
					avatar: true,
					extend: true,
					leave: true,
					leaveOwner: true,
					rename: true,
					send: true,
					userList: true,
					mute: true,
					call: true
				},
				public: {
					code: '',
					link: ''
				}
			};
		}
		getGetters() {
			return {
				get: state => dialogId => {
					if (!state.collection[dialogId]) {
						return null;
					}
					return state.collection[dialogId];
				},
				getByChatId: state => chatId => {
					chatId = parseInt(chatId);
					for (let dialogId in state.collection) {
						if (!state.collection.hasOwnProperty(dialogId)) {
							continue;
						}
						if (state.collection[dialogId].chatId === chatId) {
							return state.collection[dialogId];
						}
					}
					return null;
				},
				getBlank: state => params => {
					return this.getElementState();
				},
				getQuoteId: state => dialogId => {
					if (!state.collection[dialogId]) {
						return 0;
					}
					return state.collection[dialogId].quoteId;
				},
				getEditId: state => dialogId => {
					if (!state.collection[dialogId]) {
						return 0;
					}
					return state.collection[dialogId].editId;
				},
				canSaveChat: state => chatId => {
					if (/^\d+$/.test(chatId)) {
						chatId = parseInt(chatId);
					}
					return state.saveChatList.includes(parseInt(chatId));
				},
				canSaveDialog: state => dialogId => {
					return state.saveDialogList.includes(dialogId.toString());
				},
				isPrivateDialog: state => dialogId => {
					dialogId = dialogId.toString();
					return state.collection[dialogId.toString()] && state.collection[dialogId].type === 'private';
				}
			};
		}
		getActions() {
			return {
				set: (store, payload) => {
					if (payload instanceof Array) {
						payload = payload.map(dialog => {
							return Object.assign({}, this.validate(Object.assign({}, dialog), {
								host: store.state.host
							}), {
								init: true
							});
						});
					} else {
						let result = [];
						result.push(Object.assign({}, this.validate(Object.assign({}, payload), {
							host: store.state.host
						}), {
							init: true
						}));
						payload = result;
					}
					store.commit('set', payload);
				},
				update: (store, payload) => {
					if (typeof store.state.collection[payload.dialogId] === 'undefined' || store.state.collection[payload.dialogId].init === false) {
						return true;
					}
					store.commit('update', {
						dialogId: payload.dialogId,
						fields: this.validate(Object.assign({}, payload.fields), {
							host: store.state.host
						})
					});
					return true;
				},
				delete: (store, payload) => {
					store.commit('delete', payload.dialogId);
					return true;
				},
				updateWriting: (store, payload) => {
					if (typeof store.state.collection[payload.dialogId] === 'undefined' || store.state.collection[payload.dialogId].init === false) {
						return true;
					}
					let index = store.state.collection[payload.dialogId].writingList.findIndex(el => el.userId === payload.userId);
					if (payload.action) {
						if (index >= 0) {
							return true;
						} else {
							let writingList = [].concat(store.state.collection[payload.dialogId].writingList);
							writingList.unshift({
								userId: payload.userId,
								userName: payload.userName
							});
							store.commit('update', {
								actionName: 'updateWriting/1',
								dialogId: payload.dialogId,
								fields: this.validate({
									writingList
								}, {
									host: store.state.host
								})
							});
						}
					} else {
						if (index >= 0) {
							let writingList = store.state.collection[payload.dialogId].writingList.filter(el => el.userId !== payload.userId);
							store.commit('update', {
								actionName: 'updateWriting/2',
								dialogId: payload.dialogId,
								fields: this.validate({
									writingList
								}, {
									host: store.state.host
								})
							});
							return true;
						} else {
							return true;
						}
					}
					return false;
				},
				updateReaded: (store, payload) => {
					if (typeof store.state.collection[payload.dialogId] === 'undefined' || store.state.collection[payload.dialogId].init === false) {
						return true;
					}
					let readedList = store.state.collection[payload.dialogId].readedList.filter(el => el.userId !== payload.userId);
					if (payload.action) {
						readedList.push({
							userId: payload.userId,
							userName: payload.userName || '',
							messageId: payload.messageId,
							date: payload.date || new Date()
						});
					}
					store.commit('update', {
						actionName: 'updateReaded',
						dialogId: payload.dialogId,
						fields: this.validate({
							readedList
						}, {
							host: store.state.host
						})
					});
					return false;
				},
				increaseCounter: (store, payload) => {
					if (typeof store.state.collection[payload.dialogId] === 'undefined' || store.state.collection[payload.dialogId].init === false) {
						return true;
					}
					let counter = store.state.collection[payload.dialogId].counter;
					if (counter === 100) {
						return true;
					}
					let increasedCounter = counter + payload.count;
					if (increasedCounter > 100) {
						increasedCounter = 100;
					}
					const userId = store.rootState.application?.common.userId;
					const dialogMuted = userId && store.state.collection[payload.dialogId].muteList.includes(userId);
					store.commit('update', {
						actionName: 'increaseCounter',
						dialogId: payload.dialogId,
						dialogMuted,
						fields: {
							counter: increasedCounter,
							previousCounter: counter
						}
					});
					return false;
				},
				decreaseCounter: (store, payload) => {
					if (typeof store.state.collection[payload.dialogId] === 'undefined' || store.state.collection[payload.dialogId].init === false) {
						return true;
					}
					let counter = store.state.collection[payload.dialogId].counter;
					if (counter === 100) {
						return true;
					}
					let decreasedCounter = counter - payload.count;
					if (decreasedCounter < 0) {
						decreasedCounter = 0;
					}
					let unreadId = payload.unreadId > store.state.collection[payload.dialogId].unreadId ? payload.unreadId : store.state.collection[payload.dialogId].unreadId;
					if (store.state.collection[payload.dialogId].unreadId !== unreadId || store.state.collection[payload.dialogId].counter !== decreasedCounter) {
						const previousCounter = store.state.collection[payload.dialogId].counter;
						if (decreasedCounter === 0) {
							unreadId = 0;
						}
						const userId = store.rootState.application?.common.userId;
						const dialogMuted = userId && store.state.collection[payload.dialogId].muteList.includes(userId);
						store.commit('update', {
							actionName: 'decreaseCounter',
							dialogId: payload.dialogId,
							dialogMuted,
							fields: {
								counter: decreasedCounter,
								previousCounter,
								unreadId
							}
						});
					}
					return false;
				},
				increaseMessageCounter: (store, payload) => {
					if (typeof store.state.collection[payload.dialogId] === 'undefined' || store.state.collection[payload.dialogId].init === false) {
						return true;
					}
					const currentCounter = store.state.collection[payload.dialogId].messageCount;
					store.commit('update', {
						actionName: 'increaseMessageCount',
						dialogId: payload.dialogId,
						fields: {
							messageCount: currentCounter + payload.count
						}
					});
				},
				saveDialog: (store, payload) => {
					if (typeof store.state.collection[payload.dialogId] === 'undefined' || store.state.collection[payload.dialogId].init === false) {
						return true;
					}
					store.commit('saveDialog', {
						dialogId: payload.dialogId,
						chatId: payload.chatId
					});
					return false;
				}
			};
		}
		getMutations() {
			return {
				initCollection: (state, payload) => {
					this.initCollection(state, payload);
				},
				saveDialog: (state, payload) => {
					// TODO if payload.dialogId is IMOL, skip update this flag
					if (!(payload.chatId > 0 && payload.dialogId.length > 0)) {
						return false;
					}
					let saveDialogList = state.saveDialogList.filter(function (element) {
						return element !== payload.dialogId;
					});
					saveDialogList.unshift(payload.dialogId);
					saveDialogList = saveDialogList.slice(0, im_const.StorageLimit.dialogues);
					if (state.saveDialogList.join(',') === saveDialogList.join(',')) {
						return true;
					}
					state.saveDialogList = saveDialogList;
					let saveChatList = state.saveChatList.filter(function (element) {
						return element !== payload.chatId;
					});
					saveChatList.unshift(payload.chatId);
					state.saveChatList = saveChatList.slice(0, im_const.StorageLimit.dialogues);
					this.saveState(state);
				},
				set: (state, payload) => {
					for (let element of payload) {
						this.initCollection(state, {
							dialogId: element.dialogId
						});
						state.collection[element.dialogId] = Object.assign(this.getElementState(), state.collection[element.dialogId], element);
					}

					// TODO if payload.dialogId is IMOL, skip update cache
					this.saveState(state);
				},
				update: (state, payload) => {
					this.initCollection(state, payload);
					state.collection[payload.dialogId] = Object.assign(state.collection[payload.dialogId], payload.fields);

					// TODO if payload.dialogId is IMOL, skip update cache
					this.saveState(state);
				},
				delete: (state, payload) => {
					delete state.collection[payload.dialogId];

					// TODO if payload.dialogId is IMOL, skip update cache
					this.saveState(state);
				}
			};
		}
		initCollection(state, payload) {
			if (typeof state.collection[payload.dialogId] !== 'undefined') {
				return true;
			}
			ui_vue.Vue.set(state.collection, payload.dialogId, this.getElementState());
			if (payload.fields) {
				state.collection[payload.dialogId] = Object.assign(state.collection[payload.dialogId], this.validate(Object.assign({}, payload.fields), {
					host: state.host
				}));
			}
			return true;
		}
		getSaveTimeout() {
			return 100;
		}
		saveState(state = {}) {
			if (!this.isSaveAvailable()) {
				return true;
			}
			super.saveState(() => {
				let storedState = {
					collection: {},
					saveDialogList: [].concat(state.saveDialogList),
					saveChatList: [].concat(state.saveChatList)
				};
				state.saveDialogList.forEach(dialogId => {
					if (!state.collection[dialogId]) return false;
					storedState.collection[dialogId] = Object.assign(this.getElementState(), this.cloneState(state.collection[dialogId], this.getElementStateSaveException()));
				});
				return storedState;
			});
		}
		validate(fields, options = {}) {
			const result = {};
			options.host = options.host || this.getState().host;
			if (typeof fields.dialog_id !== 'undefined') {
				fields.dialogId = fields.dialog_id;
			}
			if (typeof fields.dialogId === "number" || typeof fields.dialogId === "string") {
				result.dialogId = fields.dialogId.toString();
			}
			if (typeof fields.chat_id !== 'undefined') {
				fields.chatId = fields.chat_id;
			} else if (typeof fields.id !== 'undefined') {
				fields.chatId = fields.id;
			}
			if (typeof fields.chatId === "number" || typeof fields.chatId === "string") {
				result.chatId = parseInt(fields.chatId);
			}
			if (typeof fields.quoteId === "number") {
				result.quoteId = parseInt(fields.quoteId);
			}
			if (typeof fields.editId === "number") {
				result.editId = parseInt(fields.editId);
			}
			if (typeof fields.counter === "number" || typeof fields.counter === "string") {
				result.counter = parseInt(fields.counter);
			}
			if (typeof fields.user_counter === "number" || typeof fields.user_counter === "string") {
				result.userCounter = parseInt(fields.user_counter);
			}
			if (typeof fields.userCounter === "number" || typeof fields.userCounter === "string") {
				result.userCounter = parseInt(fields.userCounter);
			}
			if (typeof fields.message_count === "number" || typeof fields.message_count === "string") {
				result.messageCount = parseInt(fields.message_count);
			}
			if (typeof fields.messageCount === "number" || typeof fields.messageCount === "string") {
				result.messageCount = parseInt(fields.messageCount);
			}
			if (typeof fields.unread_id !== 'undefined') {
				fields.unreadId = fields.unread_id;
			}
			if (typeof fields.unreadId === "number" || typeof fields.unreadId === "string") {
				result.unreadId = parseInt(fields.unreadId);
			}
			if (typeof fields.last_message_id !== 'undefined') {
				fields.lastMessageId = fields.last_message_id;
			}
			if (typeof fields.lastMessageId === "number" || typeof fields.lastMessageId === "string") {
				result.lastMessageId = parseInt(fields.lastMessageId);
			}
			if (typeof fields.readed_list !== 'undefined') {
				fields.readedList = fields.readed_list;
			}
			if (typeof fields.readedList !== 'undefined') {
				result.readedList = [];
				if (fields.readedList instanceof Array) {
					fields.readedList.forEach(element => {
						let record = {};
						if (typeof element.user_id !== 'undefined') {
							element.userId = element.user_id;
						}
						if (typeof element.user_name !== 'undefined') {
							element.userName = element.user_name;
						}
						if (typeof element.message_id !== 'undefined') {
							element.messageId = element.message_id;
						}
						if (!element.userId || !element.userName || !element.messageId) {
							return false;
						}
						record.userId = parseInt(element.userId);
						record.userName = element.userName.toString();
						record.messageId = parseInt(element.messageId);
						record.date = im_lib_utils.Utils.date.cast(element.date);
						result.readedList.push(record);
					});
				}
			}
			if (typeof fields.writing_list !== 'undefined') {
				fields.writingList = fields.writing_list;
			}
			if (typeof fields.writingList !== 'undefined') {
				result.writingList = [];
				if (fields.writingList instanceof Array) {
					fields.writingList.forEach(element => {
						let record = {};
						if (!element.userId) {
							return false;
						}
						record.userId = parseInt(element.userId);
						record.userName = im_lib_utils.Utils.text.htmlspecialcharsback(element.userName);
						result.writingList.push(record);
					});
				}
			}
			if (typeof fields.manager_list !== 'undefined') {
				fields.managerList = fields.manager_list;
			}
			if (typeof fields.managerList !== 'undefined') {
				result.managerList = [];
				if (fields.managerList instanceof Array) {
					fields.managerList.forEach(userId => {
						userId = parseInt(userId);
						if (userId > 0) {
							result.managerList.push(userId);
						}
					});
				}
			}
			if (typeof fields.mute_list !== 'undefined') {
				fields.muteList = fields.mute_list;
			}
			if (typeof fields.muteList !== 'undefined') {
				result.muteList = [];
				if (fields.muteList instanceof Array) {
					fields.muteList.forEach(userId => {
						userId = parseInt(userId);
						if (userId > 0) {
							result.muteList.push(userId);
						}
					});
				} else if (typeof fields.muteList === 'object') {
					Object.entries(fields.muteList).forEach(entry => {
						if (entry[1] === true) {
							const userId = parseInt(entry[0]);
							if (userId > 0) {
								result.muteList.push(userId);
							}
						}
					});
				}
			}
			if (typeof fields.textareaMessage !== 'undefined') {
				result.textareaMessage = fields.textareaMessage.toString();
			}
			if (typeof fields.title !== 'undefined') {
				fields.name = fields.title;
			}
			if (typeof fields.name === "string" || typeof fields.name === "number") {
				result.name = im_lib_utils.Utils.text.htmlspecialcharsback(fields.name.toString());
			}
			if (typeof fields.owner !== 'undefined') {
				fields.ownerId = fields.owner;
			}
			if (typeof fields.ownerId === "number" || typeof fields.ownerId === "string") {
				result.ownerId = parseInt(fields.ownerId);
			}
			if (typeof fields.extranet === "boolean") {
				result.extranet = fields.extranet;
			}
			if (typeof fields.avatar === 'string') {
				let avatar;
				if (!fields.avatar || fields.avatar.endsWith('/js/im/images/blank.gif')) {
					avatar = '';
				} else if (fields.avatar.startsWith('http')) {
					avatar = fields.avatar;
				} else {
					avatar = options.host + fields.avatar;
				}
				if (avatar) {
					result.avatar = encodeURI(avatar);
				}
			}
			if (typeof fields.color === "string") {
				result.color = fields.color.toString();
			}
			if (typeof fields.type === "string") {
				result.type = fields.type.toString();
			}
			if (typeof fields.entity_type !== 'undefined') {
				fields.entityType = fields.entity_type;
			}
			if (typeof fields.entityType === "string") {
				result.entityType = fields.entityType.toString();
			}
			if (typeof fields.entity_id !== 'undefined') {
				fields.entityId = fields.entity_id;
			}
			if (typeof fields.entityId === "string" || typeof fields.entityId === "number") {
				result.entityId = fields.entityId.toString();
			}
			if (typeof fields.entity_data_1 !== 'undefined') {
				fields.entityData1 = fields.entity_data_1;
			}
			if (typeof fields.entityData1 === "string") {
				result.entityData1 = fields.entityData1.toString();
			}
			if (typeof fields.entity_data_2 !== 'undefined') {
				fields.entityData2 = fields.entity_data_2;
			}
			if (typeof fields.entityData2 === "string") {
				result.entityData2 = fields.entityData2.toString();
			}
			if (typeof fields.entity_data_3 !== 'undefined') {
				fields.entityData3 = fields.entity_data_3;
			}
			if (typeof fields.entityData3 === "string") {
				result.entityData3 = fields.entityData3.toString();
			}
			if (typeof fields.date_create !== 'undefined') {
				fields.dateCreate = fields.date_create;
			}
			if (typeof fields.dateCreate !== "undefined") {
				result.dateCreate = im_lib_utils.Utils.date.cast(fields.dateCreate);
			}
			if (typeof fields.dateLastOpen !== "undefined") {
				result.dateLastOpen = im_lib_utils.Utils.date.cast(fields.dateLastOpen);
			}
			if (typeof fields.restrictions === 'object' && fields.restrictions) {
				result.restrictions = {};
				if (typeof fields.restrictions.avatar === 'boolean') {
					result.restrictions.avatar = fields.restrictions.avatar;
				}
				if (typeof fields.restrictions.extend === 'boolean') {
					result.restrictions.extend = fields.restrictions.extend;
				}
				if (typeof fields.restrictions.leave === 'boolean') {
					result.restrictions.leave = fields.restrictions.leave;
				}
				if (typeof fields.restrictions.leave_owner === 'boolean') {
					result.restrictions.leaveOwner = fields.restrictions.leave_owner;
				}
				if (typeof fields.restrictions.rename === 'boolean') {
					result.restrictions.rename = fields.restrictions.rename;
				}
				if (typeof fields.restrictions.send === 'boolean') {
					result.restrictions.send = fields.restrictions.send;
				}
				if (typeof fields.restrictions.user_list === 'boolean') {
					result.restrictions.userList = fields.restrictions.user_list;
				}
				if (typeof fields.restrictions.mute === 'boolean') {
					result.restrictions.mute = fields.restrictions.mute;
				}
				if (typeof fields.restrictions.call === 'boolean') {
					result.restrictions.call = fields.restrictions.call;
				}
			}
			if (typeof fields.public === 'object' && fields.public) {
				result.public = {};
				if (typeof fields.public.code === 'string') {
					result.public.code = fields.public.code;
				}
				if (typeof fields.public.link === 'string') {
					result.public.link = fields.public.link;
				}
			}
			return result;
		}
	}

	/**
	 * Bitrix Messenger
	 * Users model (Vuex Builder model)
	 *
	 * @package bitrix
	 * @subpackage im
	 * @copyright 2001-2020 Bitrix
	 */

	class UsersModel extends ui_vue_vuex.VuexBuilderModel {
		getName() {
			return 'users';
		}
		getState() {
			this.startOnlineCheckInterval();
			return {
				host: this.getVariable('host', location.protocol + '//' + location.host),
				collection: {},
				onlineList: [],
				mobileOnlineList: [],
				absentList: []
			};
		}
		getElementState(params = {}) {
			let {
				id = 0,
				name = this.getVariable('default.name', ''),
				firstName = this.getVariable('default.name', ''),
				lastName = ''
			} = params;
			return {
				id,
				name,
				firstName,
				lastName,
				workPosition: "",
				color: "#048bd0",
				avatar: "",
				gender: "M",
				birthday: false,
				isBirthday: false,
				extranet: false,
				network: false,
				bot: false,
				connector: false,
				externalAuthId: "default",
				status: "online",
				idle: false,
				lastActivityDate: false,
				mobileLastDate: false,
				isOnline: false,
				isMobileOnline: false,
				absent: false,
				isAbsent: false,
				departments: [],
				phones: {
					workPhone: "",
					personalMobile: "",
					personalPhone: "",
					innerPhone: ""
				},
				init: false
			};
		}
		getGetters() {
			return {
				get: state => (userId, getTemporary = false) => {
					userId = parseInt(userId);
					if (userId <= 0) {
						if (getTemporary) {
							userId = 0;
						} else {
							return null;
						}
					}
					if (!getTemporary && (!state.collection[userId] || !state.collection[userId].init)) {
						return null;
					}
					if (!state.collection[userId]) {
						return this.getElementState({
							id: userId
						});
					}
					return state.collection[userId];
				},
				getBlank: state => params => {
					return this.getElementState(params);
				},
				getList: state => userList => {
					const result = [];
					if (!Array.isArray(userList)) {
						return null;
					}
					userList.forEach(id => {
						if (state.collection[id]) {
							result.push(state.collection[id]);
						} else {
							result.push(this.getElementState({
								id
							}));
						}
					});
					return result;
				}
			};
		}
		getActions() {
			return {
				set: (store, payload) => {
					if (payload instanceof Array) {
						payload = payload.map(user => {
							return Object.assign({}, this.getElementState(), this.validate(Object.assign({}, user), {
								host: store.state.host
							}), {
								init: true
							});
						});
					} else {
						let result = [];
						result.push(Object.assign({}, this.getElementState(), this.validate(Object.assign({}, payload), {
							host: store.state.host
						}), {
							init: true
						}));
						payload = result;
					}
					store.commit('set', payload);
				},
				update: (store, payload) => {
					payload.id = parseInt(payload.id);
					if (typeof store.state.collection[payload.id] === 'undefined' || store.state.collection[payload.id].init === false) {
						return true;
					}
					store.commit('update', {
						id: payload.id,
						fields: this.validate(Object.assign({}, payload.fields), {
							host: store.state.host
						})
					});
					return true;
				},
				delete: (store, payload) => {
					store.commit('delete', payload.id);
					return true;
				},
				saveState: (store, payload) => {
					store.commit('saveState', {});
					return true;
				}
			};
		}
		getMutations() {
			return {
				set: (state, payload) => {
					for (let element of payload) {
						this.initCollection(state, {
							id: element.id
						});
						state.collection[element.id] = Object.assign(state.collection[element.id], element);
						let status = im_lib_utils.Utils.user.getOnlineStatus(element);
						if (status.isOnline) {
							state.collection[element.id].isOnline = true;
							this.addToOnlineList(state, element.id);
						}
						let mobileStatus = im_lib_utils.Utils.user.isMobileActive(element);
						if (mobileStatus) {
							state.collection[element.id].isMobileOnline = true;
							this.addToMobileOnlineList(state, element.id);
						}
						if (element.birthday) {
							let today = im_lib_utils.Utils.date.format(new Date(), "d-m");
							if (element.birthday === today) {
								state.collection[element.id].isBirthday = true;
								let timeToNextMidnight = this.getTimeToNextMidnight();
								setTimeout(() => {
									state.collection[element.id].isBirthday = false;
								}, timeToNextMidnight);
							}
						}
						if (element.absent) {
							element.isAbsent = true;
							if (!state.absentList.includes(element.id)) {
								this.addToAbsentList(state, element.id);
								let timeToNextMidnight = this.getTimeToNextMidnight();
								let timeToNextDay = 1000 * 60 * 60 * 24;
								setTimeout(() => {
									setInterval(() => this.startAbsentCheckInterval(state), timeToNextDay);
								}, timeToNextMidnight);
							}
						}
						this.saveState(state);
					}
				},
				update: (state, payload) => {
					this.initCollection(state, payload);
					if (typeof payload.fields.lastActivityDate !== 'undefined' && state.collection[payload.id].lastActivityDate) {
						let lastActivityDate = state.collection[payload.id].lastActivityDate.getTime();
						let newActivityDate = payload.fields.lastActivityDate.getTime();
						if (newActivityDate > lastActivityDate) {
							let status = im_lib_utils.Utils.user.getOnlineStatus(payload.fields);
							if (status.isOnline) {
								state.collection[payload.id].isOnline = true;
								this.addToOnlineList(state, payload.fields.id);
							}
						}
					}
					if (typeof payload.fields.mobileLastDate !== 'undefined' && state.collection[payload.id].mobileLastDate !== payload.fields.mobileLastDate) {
						let mobileStatus = im_lib_utils.Utils.user.isMobileActive(payload.fields);
						if (mobileStatus) {
							state.collection[payload.id].isMobileOnline = true;
							this.addToMobileOnlineList(state, payload.fields.id);
						}
					}
					state.collection[payload.id] = Object.assign(state.collection[payload.id], payload.fields);
					this.saveState(state);
				},
				delete: (state, payload) => {
					delete state.collection[payload.id];
					this.saveState(state);
				},
				saveState: (state, payload) => {
					this.saveState(state);
				}
			};
		}
		initCollection(state, payload) {
			if (typeof state.collection[payload.id] !== 'undefined') {
				return true;
			}
			ui_vue.Vue.set(state.collection, payload.id, this.getElementState());
			return true;
		}
		getSaveUserList() {
			if (!this.db) {
				return [];
			}
			if (!this.store.getters['messages/getSaveUserList']) {
				return [];
			}
			let list = this.store.getters['messages/getSaveUserList']();
			if (!list) {
				return [];
			}
			return list;
		}
		getSaveTimeout() {
			return 250;
		}
		saveState(state) {
			if (!this.isSaveAvailable()) {
				return false;
			}
			super.saveState(() => {
				let list = this.getSaveUserList();
				if (!list) {
					return false;
				}
				let storedState = {
					collection: {}
				};
				let exceptionList = {
					absent: true,
					idle: true,
					mobileLastDate: true,
					lastActivityDate: true
				};
				for (let chatId in list) {
					if (!list.hasOwnProperty(chatId)) {
						continue;
					}
					list[chatId].forEach(userId => {
						if (!state.collection[userId]) {
							return false;
						}
						storedState.collection[userId] = this.cloneState(state.collection[userId], exceptionList);
					});
				}
				return storedState;
			});
		}
		validate(fields, options = {}) {
			const result = {};
			options.host = options.host || this.getState().host;
			if (typeof fields.id === "number" || typeof fields.id === "string") {
				result.id = parseInt(fields.id);
			}
			if (typeof fields.first_name !== "undefined") {
				fields.firstName = im_lib_utils.Utils.text.htmlspecialcharsback(fields.first_name);
			}
			if (typeof fields.last_name !== "undefined") {
				fields.lastName = im_lib_utils.Utils.text.htmlspecialcharsback(fields.last_name);
			}
			if (typeof fields.name === "string" || typeof fields.name === "number") {
				fields.name = im_lib_utils.Utils.text.htmlspecialcharsback(fields.name.toString());
				result.name = fields.name;
			}
			if (typeof fields.firstName === "string" || typeof fields.firstName === "number") {
				result.firstName = im_lib_utils.Utils.text.htmlspecialcharsback(fields.firstName.toString());
			}
			if (typeof fields.lastName === "string" || typeof fields.lastName === "number") {
				result.lastName = im_lib_utils.Utils.text.htmlspecialcharsback(fields.lastName.toString());
			}
			if (typeof fields.work_position !== "undefined") {
				fields.workPosition = fields.work_position;
			}
			if (typeof fields.workPosition === "string" || typeof fields.workPosition === "number") {
				result.workPosition = fields.workPosition.toString();
			}
			if (typeof fields.color === "string") {
				result.color = fields.color;
			}
			if (typeof fields.avatar === 'string') {
				let avatar;
				if (!fields.avatar || fields.avatar.endsWith('/js/im/images/blank.gif')) {
					avatar = '';
				} else if (fields.avatar.startsWith('http')) {
					avatar = fields.avatar;
				} else {
					avatar = options.host + fields.avatar;
				}
				if (avatar) {
					result.avatar = encodeURI(avatar);
				}
			}
			if (typeof fields.gender !== 'undefined') {
				result.gender = fields.gender === 'F' ? 'F' : 'M';
			}
			if (typeof fields.birthday === "string") {
				result.birthday = fields.birthday;
			}
			if (typeof fields.extranet === "boolean") {
				result.extranet = fields.extranet;
			}
			if (typeof fields.network === "boolean") {
				result.network = fields.network;
			}
			if (typeof fields.bot === "boolean") {
				result.bot = fields.bot;
			}
			if (typeof fields.connector === "boolean") {
				result.connector = fields.connector;
			}
			if (typeof fields.external_auth_id !== "undefined") {
				fields.externalAuthId = fields.external_auth_id;
			}
			if (typeof fields.externalAuthId === "string" && fields.externalAuthId) {
				result.externalAuthId = fields.externalAuthId;
			}
			if (typeof fields.status === "string") {
				result.status = fields.status;
			}
			if (typeof fields.idle !== "undefined") {
				result.idle = im_lib_utils.Utils.date.cast(fields.idle, false);
			}
			if (typeof fields.last_activity_date !== "undefined") {
				fields.lastActivityDate = fields.last_activity_date;
			}
			if (typeof fields.lastActivityDate !== "undefined") {
				result.lastActivityDate = im_lib_utils.Utils.date.cast(fields.lastActivityDate, false);
			}
			if (typeof fields.mobile_last_date !== "undefined") {
				fields.mobileLastDate = fields.mobile_last_date;
			}
			if (typeof fields.mobileLastDate !== "undefined") {
				result.mobileLastDate = im_lib_utils.Utils.date.cast(fields.mobileLastDate, false);
			}
			if (typeof fields.absent !== "undefined") {
				result.absent = im_lib_utils.Utils.date.cast(fields.absent, false);
			}
			if (typeof fields.departments !== 'undefined') {
				result.departments = [];
				if (fields.departments instanceof Array) {
					fields.departments.forEach(departmentId => {
						departmentId = parseInt(departmentId);
						if (departmentId > 0) {
							result.departments.push(departmentId);
						}
					});
				}
			}
			if (typeof fields.phones === 'object' && fields.phones) {
				result.phones = {};
				if (typeof fields.phones.work_phone !== "undefined") {
					fields.phones.workPhone = fields.phones.work_phone;
				}
				if (typeof fields.phones.workPhone === 'string' || typeof fields.phones.workPhone === 'number') {
					result.phones.workPhone = fields.phones.workPhone.toString();
				}
				if (typeof fields.phones.personal_mobile !== "undefined") {
					fields.phones.personalMobile = fields.phones.personal_mobile;
				}
				if (typeof fields.phones.personalMobile === 'string' || typeof fields.phones.personalMobile === 'number') {
					result.phones.personalMobile = fields.phones.personalMobile.toString();
				}
				if (typeof fields.phones.personal_phone !== "undefined") {
					fields.phones.personalPhone = fields.phones.personal_phone;
				}
				if (typeof fields.phones.personalPhone === 'string' || typeof fields.phones.personalPhone === 'number') {
					result.phones.personalPhone = fields.phones.personalPhone.toString();
				}
				if (typeof fields.phones.inner_phone !== "undefined") {
					fields.phones.innerPhone = fields.phones.inner_phone;
				}
				if (typeof fields.phones.innerPhone === 'string' || typeof fields.phones.innerPhone === 'number') {
					result.phones.innerPhone = fields.phones.innerPhone.toString();
				}
			}
			return result;
		}
		addToOnlineList(state, id) {
			if (!state.onlineList.includes(id)) {
				state.onlineList.push(id);
			}
		}
		addToMobileOnlineList(state, id) {
			if (!state.mobileOnlineList.includes(id)) {
				state.mobileOnlineList.push(id);
			}
		}
		addToAbsentList(state, id) {
			if (!state.absentList.includes(id)) {
				state.absentList.push(id);
			}
		}
		getTimeToNextMidnight() {
			let nextMidnight = new Date(new Date().setHours(24, 0, 0)).getTime();
			return nextMidnight - new Date();
		}
		startAbsentCheckInterval(state) {
			for (let userId of state.absentList) {
				let user = state.collection[userId];
				if (!user) {
					continue;
				}
				let currentTime = new Date().getTime();
				let absentEnd = new Date(state.collection[userId].absent).getTime();
				if (absentEnd <= currentTime) {
					state.absentList = state.absentList.filter(element => {
						return element !== userId;
					});
					user.isAbsent = false;
				}
			}
		}
		startOnlineCheckInterval() {
			const intervalTime = 60000;
			setInterval(() => {
				for (let userId of this.store.state.users.onlineList) {
					let user = this.store.state.users.collection[userId];
					if (!user) {
						continue;
					}
					let status = im_lib_utils.Utils.user.getOnlineStatus(user);
					if (status.isOnline) {
						user.isOnline = true;
					} else {
						user.isOnline = false;
						this.store.state.users.onlineList = this.store.state.users.onlineList.filter(element => {
							return element !== userId;
						});
					}
				}
				for (let userId of this.store.state.users.mobileOnlineList) {
					let user = this.store.state.users.collection[userId];
					if (!user) {
						continue;
					}
					let mobileStatus = im_lib_utils.Utils.user.isMobileActive(user);
					if (mobileStatus) {
						user.isMobileOnline = true;
					} else {
						user.isMobileOnline = false;
						this.store.state.users.mobileOnlineList = this.store.state.users.mobileOnlineList.filter(element => {
							return element !== userId;
						});
					}
				}
			}, intervalTime);
		}
	}

	/**
	 * Bitrix Messenger
	 * Files model (Vuex Builder model)
	 *
	 * @package bitrix
	 * @subpackage im
	 * @copyright 2001-2020 Bitrix
	 */

	class FilesModel extends ui_vue_vuex.VuexBuilderModel {
		static maxDiskFileSize = 5242880;
		getName() {
			return 'files';
		}
		getState() {
			return {
				created: 0,
				host: this.getVariable('host', location.protocol + '//' + location.host),
				collection: {},
				index: {}
			};
		}
		getElementState(params = {}) {
			let {
				id = 0,
				chatId = 0,
				name = this.getVariable('default.name', '')
			} = params;
			return {
				id,
				chatId,
				name,
				templateId: id,
				date: new Date(),
				type: 'file',
				extension: "",
				icon: "empty",
				size: 0,
				image: false,
				status: im_const.FileStatus.done,
				progress: 100,
				authorId: 0,
				authorName: "",
				urlPreview: "",
				urlShow: "",
				urlDownload: "",
				init: false,
				viewerAttrs: {}
			};
		}
		getGetters() {
			return {
				get: state => (chatId, fileId, getTemporary = false) => {
					if (!chatId || !fileId) {
						return null;
					}
					if (!state.index[chatId] || !state.index[chatId][fileId]) {
						return null;
					}
					if (!getTemporary && !state.index[chatId][fileId].init) {
						return null;
					}
					return state.index[chatId][fileId];
				},
				getList: state => chatId => {
					if (!state.index[chatId]) {
						return null;
					}
					return state.index[chatId];
				},
				getBlank: state => params => {
					return this.getElementState(params);
				}
			};
		}
		getActions() {
			return {
				add: (store, payload) => {
					let result = this.validate(Object.assign({}, payload), {
						host: store.state.host
					});
					if (payload.id) {
						result.id = payload.id;
					} else {
						result.id = 'temporary' + new Date().getTime() + store.state.created;
					}
					result.templateId = result.id;
					result.init = true;
					store.commit('add', Object.assign({}, this.getElementState(), result));
					return result.id;
				},
				set: (store, payload) => {
					if (payload instanceof Array) {
						payload = payload.map(file => {
							let result = this.validate(Object.assign({}, file), {
								host: store.state.host
							});
							result.templateId = result.id;
							return Object.assign({}, this.getElementState(), result, {
								init: true
							});
						});
					} else {
						let result = this.validate(Object.assign({}, payload), {
							host: store.state.host
						});
						result.templateId = result.id;
						payload = [];
						payload.push(Object.assign({}, this.getElementState(), result, {
							init: true
						}));
					}
					store.commit('set', {
						insertType: im_const.MutationType.setAfter,
						data: payload
					});
				},
				setBefore: (store, payload) => {
					if (payload instanceof Array) {
						payload = payload.map(file => {
							let result = this.validate(Object.assign({}, file), {
								host: store.state.host
							});
							result.templateId = result.id;
							return Object.assign({}, this.getElementState(), result, {
								init: true
							});
						});
					} else {
						let result = this.validate(Object.assign({}, payload), {
							host: store.state.host
						});
						result.templateId = result.id;
						payload = [];
						payload.push(Object.assign({}, this.getElementState(), result, {
							init: true
						}));
					}
					store.commit('set', {
						actionName: 'setBefore',
						insertType: im_const.MutationType.setBefore,
						data: payload
					});
				},
				update: (store, payload) => {
					let result = this.validate(Object.assign({}, payload.fields), {
						host: store.state.host
					});
					store.commit('initCollection', {
						chatId: payload.chatId
					});
					let index = store.state.collection[payload.chatId].findIndex(el => el.id === payload.id);
					if (index < 0) {
						return false;
					}
					store.commit('update', {
						id: payload.id,
						chatId: payload.chatId,
						index: index,
						fields: result
					});
					if (payload.fields.blink) {
						setTimeout(() => {
							store.commit('update', {
								id: payload.id,
								chatId: payload.chatId,
								fields: {
									blink: false
								}
							});
						}, 1000);
					}
					return true;
				},
				delete: (store, payload) => {
					store.commit('delete', {
						id: payload.id,
						chatId: payload.chatId
					});
					return true;
				},
				saveState: (store, payload) => {
					store.commit('saveState', {});
					return true;
				}
			};
		}
		getMutations() {
			return {
				initCollection: (state, payload) => {
					this.initCollection(state, payload);
				},
				add: (state, payload) => {
					this.initCollection(state, payload);
					state.collection[payload.chatId].push(payload);
					state.index[payload.chatId][payload.id] = payload;
					state.created += 1;
					this.saveState(state);
				},
				set: (state, payload) => {
					for (let element of payload.data) {
						this.initCollection(state, {
							chatId: element.chatId
						});
						let index = state.collection[element.chatId].findIndex(el => el.id === element.id);
						if (index > -1) {
							delete element.templateId;
							state.collection[element.chatId][index] = Object.assign(state.collection[element.chatId][index], element);
						} else if (payload.insertType === im_const.MutationType.setBefore) {
							state.collection[element.chatId].unshift(element);
						} else {
							state.collection[element.chatId].push(element);
						}
						state.index[element.chatId][element.id] = element;
						this.saveState(state);
					}
				},
				update: (state, payload) => {
					this.initCollection(state, payload);
					let index = -1;
					if (typeof payload.index !== 'undefined' && state.collection[payload.chatId][payload.index]) {
						index = payload.index;
					} else {
						index = state.collection[payload.chatId].findIndex(el => el.id === payload.id);
					}
					if (index >= 0) {
						delete payload.fields.templateId;
						let element = Object.assign(state.collection[payload.chatId][index], payload.fields);
						state.collection[payload.chatId][index] = element;
						state.index[payload.chatId][element.id] = element;
						this.saveState(state);
					}
				},
				delete: (state, payload) => {
					this.initCollection(state, payload);
					state.collection[payload.chatId] = state.collection[payload.chatId].filter(element => element.id !== payload.id);
					delete state.index[payload.chatId][payload.id];
					this.saveState(state);
				},
				saveState: (state, payload) => {
					this.saveState(state);
				}
			};
		}
		initCollection(state, payload) {
			if (typeof state.collection[payload.chatId] !== 'undefined') {
				return true;
			}
			ui_vue.Vue.set(state.collection, payload.chatId, []);
			ui_vue.Vue.set(state.index, payload.chatId, {});
			return true;
		}
		getLoadedState(state) {
			if (!state || typeof state !== 'object') {
				return state;
			}
			if (typeof state.collection !== 'object') {
				return state;
			}
			state.index = {};
			for (let chatId in state.collection) {
				if (!state.collection.hasOwnProperty(chatId)) {
					continue;
				}
				state.index[chatId] = {};
				state.collection[chatId].filter(file => file != null).forEach(file => {
					state.index[chatId][file.id] = file;
				});
			}
			return state;
		}
		getSaveFileList() {
			if (!this.db) {
				return [];
			}
			if (!this.store.getters['messages/getSaveFileList']) {
				return [];
			}
			let list = this.store.getters['messages/getSaveFileList']();
			if (!list) {
				return [];
			}
			return list;
		}
		getSaveTimeout() {
			return 250;
		}
		saveState(state) {
			if (!this.isSaveAvailable()) {
				return false;
			}
			super.saveState(() => {
				let list = this.getSaveFileList();
				if (!list) {
					return false;
				}
				let storedState = {
					collection: {}
				};
				for (let chatId in list) {
					if (!list.hasOwnProperty(chatId)) {
						continue;
					}
					list[chatId].forEach(fileId => {
						if (!state.index[chatId]) {
							return false;
						}
						if (!state.index[chatId][fileId]) {
							return false;
						}
						if (!storedState.collection[chatId]) {
							storedState.collection[chatId] = [];
						}
						storedState.collection[chatId].push(state.index[chatId][fileId]);
					});
				}
				return storedState;
			});
		}
		validate(fields, options = {}) {
			const result = {};
			options.host = options.host || this.getState().host;
			if (typeof fields.id === "number") {
				result.id = fields.id;
			} else if (typeof fields.id === "string") {
				if (fields.id.startsWith('temporary')) {
					result.id = fields.id;
				} else {
					result.id = parseInt(fields.id);
				}
			}
			if (typeof fields.templateId === "number") {
				result.templateId = fields.templateId;
			} else if (typeof fields.templateId === "string") {
				if (fields.templateId.startsWith('temporary')) {
					result.templateId = fields.templateId;
				} else {
					result.templateId = parseInt(fields.templateId);
				}
			}
			if (typeof fields.chatId === "number" || typeof fields.chatId === "string") {
				result.chatId = parseInt(fields.chatId);
			}
			if (typeof fields.date !== "undefined") {
				result.date = im_lib_utils.Utils.date.cast(fields.date);
			}
			if (typeof fields.type === "string") {
				result.type = fields.type;
			}
			if (typeof fields.extension === "string") {
				result.extension = fields.extension.toString();
				if (result.type === 'image') {
					result.icon = 'img';
				} else if (result.type === 'video') {
					result.icon = 'mov';
				} else {
					result.icon = FilesModel.getIconType(result.extension);
				}
			}
			if (typeof fields.name === "string" || typeof fields.name === "number") {
				result.name = fields.name.toString();
			}
			if (typeof fields.size === "number" || typeof fields.size === "string") {
				result.size = parseInt(fields.size);
			}
			if (typeof fields.image === 'boolean') {
				result.image = false;
			} else if (typeof fields.image === 'object' && fields.image) {
				result.image = {
					width: 0,
					height: 0
				};
				if (typeof fields.image.width === "string" || typeof fields.image.width === "number") {
					result.image.width = parseInt(fields.image.width);
				}
				if (typeof fields.image.height === "string" || typeof fields.image.height === "number") {
					result.image.height = parseInt(fields.image.height);
				}
				if (result.image.width <= 0 || result.image.height <= 0) {
					result.image = false;
				}
			}
			if (typeof fields.status === "string" && typeof im_const.FileStatus[fields.status] !== 'undefined') {
				result.status = fields.status;
			}
			if (typeof fields.progress === "number" || typeof fields.progress === "string") {
				result.progress = parseInt(fields.progress);
			}
			if (typeof fields.authorId === "number" || typeof fields.authorId === "string") {
				result.authorId = parseInt(fields.authorId);
			}
			if (typeof fields.authorName === "string" || typeof fields.authorName === "number") {
				result.authorName = fields.authorName.toString();
			}
			if (typeof fields.urlPreview === 'string') {
				if (!fields.urlPreview || fields.urlPreview.startsWith('http') || fields.urlPreview.startsWith('bx') || fields.urlPreview.startsWith('file') || fields.urlPreview.startsWith('blob')) {
					result.urlPreview = fields.urlPreview;
				} else {
					result.urlPreview = options.host + fields.urlPreview;
				}
			}
			if (typeof fields.urlDownload === 'string') {
				if (!fields.urlDownload || fields.urlDownload.startsWith('http') || fields.urlDownload.startsWith('bx') || fields.urlPreview.startsWith('file')) {
					result.urlDownload = fields.urlDownload;
				} else {
					result.urlDownload = options.host + fields.urlDownload;
				}
			}
			if (typeof fields.urlShow === 'string') {
				if (!fields.urlShow || fields.urlShow.startsWith('http') || fields.urlShow.startsWith('bx') || fields.urlShow.startsWith('file')) {
					result.urlShow = fields.urlShow;
				} else {
					result.urlShow = options.host + fields.urlShow;
				}
			}
			if (typeof fields.viewerAttrs === 'object') {
				if (result.type === 'image' && !im_lib_utils.Utils.platform.isBitrixMobile()) {
					result.viewerAttrs = fields.viewerAttrs;
				}
				if (result.type === 'video' && !im_lib_utils.Utils.platform.isBitrixMobile() && result.size > FilesModel.maxDiskFileSize) {
					result.viewerAttrs = fields.viewerAttrs;
				}
			}
			return result;
		}
		static getType(type) {
			type = type.toString().toLowerCase().split('.').splice(-1)[0];
			switch (type) {
				case 'png':
				case 'jpe':
				case 'jpg':
				case 'jpeg':
				case 'gif':
				case 'heic':
				case 'bmp':
				case 'webp':
					return im_const.FileType.image;
				case 'mp4':
				case 'mkv':
				case 'webm':
				case 'mpeg':
				case 'hevc':
				case 'avi':
				case '3gp':
				case 'flv':
				case 'm4v':
				case 'ogg':
				case 'wmv':
				case 'mov':
					return im_const.FileType.video;
				case 'mp3':
					return im_const.FileType.audio;
			}
			return im_const.FileType.file;
		}
		static getIconType(extension) {
			let icon = 'empty';
			switch (extension.toString()) {
				case 'png':
				case 'jpe':
				case 'jpg':
				case 'jpeg':
				case 'gif':
				case 'heic':
				case 'bmp':
				case 'webp':
					icon = 'img';
					break;
				case 'mp4':
				case 'mkv':
				case 'webm':
				case 'mpeg':
				case 'hevc':
				case 'avi':
				case '3gp':
				case 'flv':
				case 'm4v':
				case 'ogg':
				case 'wmv':
				case 'mov':
					icon = 'mov';
					break;
				case 'txt':
					icon = 'txt';
					break;
				case 'doc':
				case 'docx':
					icon = 'doc';
					break;
				case 'xls':
				case 'xlsx':
					icon = 'xls';
					break;
				case 'php':
					icon = 'php';
					break;
				case 'pdf':
					icon = 'pdf';
					break;
				case 'ppt':
				case 'pptx':
					icon = 'ppt';
					break;
				case 'rar':
					icon = 'rar';
					break;
				case 'zip':
				case '7z':
				case 'tar':
				case 'gz':
				case 'gzip':
					icon = 'zip';
					break;
				case 'set':
					icon = 'set';
					break;
				case 'conf':
				case 'ini':
				case 'plist':
					icon = 'set';
					break;
			}
			return icon;
		}
	}

	/**
	 * Bitrix Messenger
	 * Recent model (Vuex Builder model)
	 *
	 * @package bitrix
	 * @subpackage im
	 * @copyright 2001-2020 Bitrix
	 */

	class RecentModel extends ui_vue_vuex.VuexBuilderModel {
		getName() {
			return 'recent';
		}
		getState() {
			return {
				host: this.getVariable('host', location.protocol + '//' + location.host),
				collection: []
			};
		}
		getElementState() {
			return {
				id: 0,
				templateId: '',
				template: im_const.TemplateTypes.item,
				chatType: im_const.ChatTypes.chat,
				sectionCode: im_const.RecentSection.general,
				avatar: '',
				color: '#048bd0',
				title: '',
				lines: {
					id: 0,
					status: 0
				},
				message: {
					id: 0,
					text: '',
					date: new Date(),
					senderId: 0,
					status: im_const.MessageStatus.received
				},
				counter: 0,
				pinned: false,
				chatId: 0,
				userId: 0
			};
		}
		getGetters() {
			return {
				get: state => dialogId => {
					if (main_core.Type.isNumber(dialogId)) {
						dialogId = dialogId.toString();
					}
					let currentItem = this.findItem(dialogId);
					if (currentItem) {
						return currentItem;
					}
					return false;
				}
			};
		}
		getActions() {
			return {
				set: (store, payload) => {
					let result = [];
					if (payload instanceof Array) {
						result = payload.map(recentItem => this.prepareItem(recentItem, {
							host: store.state.host
						}));
					}
					if (result.length === 0) {
						return false;
					}
					result.forEach(element => {
						const existingItem = this.findItem(element.id);
						if (existingItem) {
							store.commit('update', {
								index: existingItem.index,
								fields: element
							});
						} else {
							store.commit('add', {
								fields: element
							});
						}
					});
					store.state.collection.sort(this.sortListByMessageDate);
				},
				addPlaceholders: (store, payload) => {
					payload.forEach(element => {
						store.commit('addPlaceholder', {
							fields: element
						});
					});
				},
				updatePlaceholders: (store, payload) => {
					payload.items = payload.items.map(element => this.prepareItem(element));
					payload.items.forEach((element, index) => {
						const placeholderId = 'placeholder' + (payload.firstMessage + index);
						const existingPlaceholder = this.findItem(placeholderId, 'templateId');
						const existingItem = this.findItem(element.id);
						if (existingItem) {
							store.commit('update', {
								index: existingItem.index,
								fields: element
							});
							store.commit('delete', {
								index: existingPlaceholder.index
							});
						} else {
							store.commit('update', {
								index: existingPlaceholder.index,
								fields: element
							});
						}
					});
				},
				update: (store, payload) => {
					if (typeof payload.id === 'string' && !payload.id.startsWith('chat') && payload.id !== 'notify') {
						payload.id = parseInt(payload.id);
					}
					const existingItem = this.findItem(payload.id);
					if (!existingItem) {
						return false;
					}
					payload.fields = this.validate(Object.assign({}, payload.fields));
					store.commit('update', {
						index: existingItem.index,
						fields: payload.fields
					});
					store.state.collection.sort(this.sortListByMessageDate);
				},
				pin: (store, payload) => {
					if (typeof payload.id === 'string' && !payload.id.startsWith('chat') && payload.id !== 'notify') {
						payload.id = parseInt(payload.id);
					}
					let existingItem = this.findItem(payload.id);
					if (!existingItem) {
						return false;
					}
					store.commit('update', {
						index: existingItem.index,
						fields: Object.assign({}, existingItem.element, {
							pinned: payload.action
						})
					});
					store.state.collection.sort(this.sortListByMessageDate);
				},
				clearPlaceholders: store => {
					store.commit('clearPlaceholders');
				},
				delete: (store, payload) => {
					if (typeof payload.id === 'string' && !payload.id.startsWith('chat') && payload.id !== 'notify') {
						payload.id = parseInt(payload.id);
					}
					const existingItem = this.findItem(payload.id);
					if (!existingItem) {
						return false;
					}
					store.commit('delete', {
						index: existingItem.index
					});
					store.state.collection.sort(this.sortListByMessageDate);
				}
			};
		}
		getMutations() {
			return {
				add: (state, payload) => {
					state.collection.push(Object.assign({}, this.getElementState(), payload.fields));
				},
				update: (state, payload) => {
					state.collection.splice(payload.index, 1, Object.assign({}, state.collection[payload.index], payload.fields));
				},
				delete: (state, payload) => {
					state.collection.splice(payload.index, 1);
				},
				addPlaceholder: (state, payload) => {
					state.collection.push(Object.assign({}, this.getElementState(), payload.fields));
				},
				clearPlaceholders: state => {
					state.collection = state.collection.filter(element => {
						return !element.id.toString().startsWith('placeholder');
					});
				}
			};
		}
		validate(fields, options = {}) {
			const result = {};
			if (main_core.Type.isNumber(fields.id)) {
				result.id = fields.id.toString();
			}
			if (main_core.Type.isStringFilled(fields.id)) {
				result.id = fields.id;
			}
			if (main_core.Type.isString(fields.templateId)) {
				result.templateId = fields.templateId;
			}
			if (main_core.Type.isString(fields.template)) {
				result.template = fields.template;
			}
			if (main_core.Type.isString(fields.type)) {
				if (fields.type === im_const.ChatTypes.chat) {
					if (fields.chat.type === im_const.ChatTypes.open) {
						result.chatType = im_const.ChatTypes.open;
					} else if (fields.chat.type === im_const.ChatTypes.chat) {
						result.chatType = im_const.ChatTypes.chat;
					}
				} else if (fields.type === im_const.ChatTypes.user) {
					result.chatType = im_const.ChatTypes.user;
				} else if (fields.type === im_const.ChatTypes.notification) {
					result.chatType = im_const.ChatTypes.notification;
					fields.title = 'Notifications';
				} else {
					result.chatType = im_const.ChatTypes.chat;
				}
			}
			if (main_core.Type.isString(fields.avatar)) {
				let avatar;
				if (!fields.avatar || fields.avatar.endsWith('/js/im/images/blank.gif')) {
					avatar = '';
				} else if (fields.avatar.startsWith('http')) {
					avatar = fields.avatar;
				} else {
					avatar = options.host + fields.avatar;
				}
				if (avatar) {
					result.avatar = encodeURI(avatar);
				}
			}
			if (main_core.Type.isString(fields.color)) {
				result.color = fields.color;
			}
			if (main_core.Type.isString(fields.title)) {
				result.title = fields.title;
			}
			if (main_core.Type.isPlainObject(fields.message)) {
				const message = {};
				if (main_core.Type.isNumber(fields.message.id)) {
					message.id = fields.message.id;
				}
				if (main_core.Type.isString(fields.message.text)) {
					const options = {};
					if (fields.message.withAttach) {
						options.WITH_ATTACH = true;
					} else if (fields.message.withFile) {
						options.WITH_FILE = true;
					}
					message.text = im_lib_utils.Utils.text.purify(fields.message.text, options);
				}
				if (main_core.Type.isDate(fields.message.date) || main_core.Type.isString(fields.message.date)) {
					message.date = fields.message.date;
				}
				if (main_core.Type.isNumber(fields.message.author_id)) {
					message.senderId = fields.message.author_id;
				}
				if (main_core.Type.isNumber(fields.message.senderId)) {
					message.senderId = fields.message.senderId;
				}
				if (main_core.Type.isStringFilled(fields.message.status)) {
					message.status = fields.message.status;
				}
				result.message = message;
			}
			if (main_core.Type.isNumber(fields.counter)) {
				result.counter = fields.counter;
			}
			if (main_core.Type.isBoolean(fields.pinned)) {
				result.pinned = fields.pinned;
			}
			if (main_core.Type.isNumber(fields.chatId)) {
				result.chatId = fields.chatId;
			}
			if (main_core.Type.isNumber(fields.userId)) {
				result.userId = fields.userId;
			}
			return result;
		}
		sortListByMessageDate(a, b) {
			if (a.message && b.message) {
				let timestampA = new Date(a.message.date).getTime();
				let timestampB = new Date(b.message.date).getTime();
				return timestampB - timestampA;
			}
		}
		prepareItem(item, options = {}) {
			let result = this.validate(Object.assign({}, item));
			return Object.assign({}, this.getElementState(), result, options);
		}
		findItem(value, key = 'id') {
			let result = {};
			if (key === 'id' && main_core.Type.isNumber(value)) {
				value = value.toString();
			}
			let elementIndex = this.store.state.recent.collection.findIndex((element, index) => {
				return element[key] === value;
			});
			if (elementIndex !== -1) {
				result.index = elementIndex;
				result.element = this.store.state.recent.collection[elementIndex];
				return result;
			}
			return false;
		}
	}

	//raw input object for validation

	//item in collection

	/**
	 * Bitrix Messenger
	 * Notifications model (Vuex Builder model)
	 *
	 * @package bitrix
	 * @subpackage im
	 * @copyright 2001-2021 Bitrix
	 */

	class NotificationsModel extends ui_vue_vuex.VuexBuilderModel {
		getName() {
			return 'notifications';
		}
		getState() {
			return {
				collection: [],
				searchCollection: [],
				chat_id: 0,
				total: 0,
				host: this.getVariable('host', location.protocol + '//' + location.host),
				unreadCounter: 0,
				schema: {}
			};
		}
		getElementState() {
			return {
				id: 0,
				authorId: 0,
				date: new Date(),
				text: '',
				sectionCode: im_const.NotificationTypesCodes.simple,
				textConverted: '',
				title: '',
				unread: false,
				display: true,
				settingName: 'im|default'
			};
		}
		getGetters() {
			return {
				get: state => () => {
					return state.collection;
				},
				getById: state => notificationId => {
					if (main_core.Type.isString(notificationId)) {
						notificationId = parseInt(notificationId);
					}
					const existingItem = this.findItemInArr(state.collection, notificationId);
					if (!existingItem.element) {
						return false;
					}
					return existingItem.element;
				},
				getSearchItemById: state => notificationId => {
					if (main_core.Type.isString(notificationId)) {
						notificationId = parseInt(notificationId);
					}
					const existingItem = this.findItemInArr(state.searchCollection, notificationId);
					if (!existingItem.element) {
						return false;
					}
					return existingItem.element;
				},
				getBlank: state => params => {
					return this.getElementState();
				}
			};
		}
		getActions() {
			return {
				set: (store, payload) => {
					const result = {
						notification: []
					};
					if (payload.notification instanceof Array) {
						result.notification = payload.notification.map(notification => this.prepareNotification(notification, {
							host: store.state.host
						}));
					}
					if (main_core.Type.isNumber(payload.total) || main_core.Type.isString(payload.total)) {
						result.total = parseInt(payload.total);
					}
					store.commit('set', result);
				},
				setSearchResults: (store, payload) => {
					const result = {
						notification: []
					};
					if (!(payload.notification instanceof Array)) {
						return false;
					}

					// we don't need validation for the local results
					if (payload.type === 'local') {
						result.notification = payload.notification;
					} else {
						result.notification = payload.notification.map(notification => this.prepareNotification(notification, {
							host: store.state.host
						}));
					}
					store.commit('setSearchResults', {
						data: result
					});
				},
				deleteSearchResults: (store, payload) => {
					store.commit('deleteSearchResults');
				},
				setCounter: (store, payload) => {
					if (main_core.Type.isNumber(payload.unreadTotal) || main_core.Type.isString(payload.unreadTotal)) {
						const unreadCounter = parseInt(payload.unreadTotal);
						store.commit('setCounter', unreadCounter);
					}
				},
				setTotal: (store, payload) => {
					if (main_core.Type.isNumber(payload.total) || main_core.Type.isString(payload.total)) {
						store.commit('setTotal', payload.total);
					}
				},
				add: (store, payload) => {
					const addItem = this.prepareNotification(payload.data, {
						host: store.state.host
					});
					addItem.unread = true;
					const existingItem = this.findItemInArr(store.state.collection, addItem.id);
					if (!existingItem.element) {
						store.commit('add', {
							data: addItem
						});
						store.commit('setTotal', store.state.total + 1);
					} else {
						store.commit('update', {
							index: existingItem.index,
							fields: Object.assign({}, payload.fields)
						});
					}
				},
				updatePlaceholders: (store, payload) => {
					if (payload.items instanceof Array) {
						payload.items = payload.items.map(notification => this.prepareNotification(notification));
					} else {
						return false;
					}
					store.commit('updatePlaceholders', payload);
					return true;
				},
				clearPlaceholders: (store, payload) => {
					store.commit('clearPlaceholders', payload);
				},
				update: (store, payload) => {
					const existingItem = this.findItemInArr(store.state.collection, payload.id);
					if (existingItem.element) {
						store.commit('update', {
							index: existingItem.index,
							fields: Object.assign({}, payload.fields)
						});
					}
					if (payload.searchMode) {
						const existingItemInSearchCollection = this.findItemInArr(store.state.searchCollection, payload.id);
						if (existingItemInSearchCollection.element) {
							store.commit('update', {
								searchCollection: true,
								index: existingItemInSearchCollection.index,
								fields: Object.assign({}, payload.fields)
							});
						}
					}
				},
				read: (store, payload) => {
					for (const notificationId of payload.ids) {
						const existingItem = this.findItemInArr(store.state.collection, notificationId);
						if (!existingItem.element) {
							return false;
						}
						store.commit('read', {
							index: existingItem.index,
							action: !payload.action
						});
					}
				},
				readAll: (store, payload) => {
					store.commit('readAll');
				},
				delete: (store, payload) => {
					const existingItem = this.findItemInArr(store.state.collection, payload.id);
					if (existingItem.element) {
						store.commit('delete', {
							searchCollection: false,
							index: existingItem.index
						});
						store.commit('setTotal', store.state.total - 1);
					}
					if (payload.searchMode) {
						const existingItemInSearchCollection = this.findItemInArr(store.state.searchCollection, payload.id);
						if (existingItemInSearchCollection.element) {
							store.commit('delete', {
								searchCollection: true,
								index: existingItemInSearchCollection.index
							});
						}
					}
				},
				deleteAll: (store, payload) => {
					store.commit('deleteAll');
				},
				setSchema: (store, payload) => {
					store.commit('setSchema', {
						data: payload.data
					});
				}
			};
		}
		getMutations() {
			return {
				set: (state, payload) => {
					state.total = payload.hasOwnProperty('total') ? payload.total : state.total;
					if (!payload.hasOwnProperty('notification') || !main_core.Type.isArray(payload.notification)) {
						return;
					}
					for (const element of payload.notification) {
						const existingItem = this.findItemInArr(state.collection, element.id);
						if (!existingItem.element) {
							state.collection.push(element);
						} else {
							// we trust unread status of existing item to prevent notifications blinking while init loading.
							if (element.unread !== state.collection[existingItem.index].unread) {
								element.unread = state.collection[existingItem.index].unread;
								state.unreadCounter = element.unread === true ? state.unreadCounter + 1 : state.unreadCounter - 1;
							}
							state.collection[existingItem.index] = Object.assign(state.collection[existingItem.index], element);
						}
					}
					state.collection.sort(this.sortByType);
				},
				setSearchResults: (state, payload) => {
					for (const element of payload.data.notification) {
						const existingItem = this.findItemInArr(state.searchCollection, element.id);
						if (!existingItem.element) {
							state.searchCollection.push(element);
						} else {
							state.searchCollection[existingItem.index] = Object.assign(state.searchCollection[existingItem.index], element);
						}
					}
				},
				deleteAll: (state, payload) => {
					state.collection = [];
				},
				deleteSearchResults: (state, payload) => {
					state.searchCollection = [];
				},
				add: (state, payload) => {
					let firstNotificationIndex = null;
					if (payload.data.sectionCode === im_const.NotificationTypesCodes.confirm) {
						//new confirms should always add to the beginning of the collection
						state.collection.unshift(payload.data);
					} else
						//if (payload.data.sectionCode === NotificationTypesCodes.simple)
						{
							for (let index = 0; state.collection.length > index; index++) {
								if (state.collection[index].sectionCode === im_const.NotificationTypesCodes.simple) {
									firstNotificationIndex = index;
									break;
								}
							}

							//if we didn't find any simple notification and its index, then add new one to the end.
							if (firstNotificationIndex === null) {
								state.collection.push(payload.data);
							} else
								//otherwise, put it right before first simple notification.
								{
									state.collection.splice(firstNotificationIndex, 0, payload.data);
								}
						}
					state.collection.sort(this.sortByType);
				},
				update: (state, payload) => {
					const collectionName = payload.searchCollection ? 'searchCollection' : 'collection';
					ui_vue.Vue.set(state[collectionName], payload.index, Object.assign({}, state[collectionName][payload.index], payload.fields));
				},
				delete: (state, payload) => {
					const collectionName = payload.searchCollection ? 'searchCollection' : 'collection';
					state[collectionName].splice(payload.index, 1);
				},
				read: (state, payload) => {
					state.collection[payload.index].unread = payload.action;
				},
				readAll: (state, payload) => {
					for (let index = 0; state.collection.length > index; index++) {
						state.collection[index].unread = false;
					}
				},
				updatePlaceholders: (state, payload) => {
					const collectionName = payload.searchCollection ? 'searchCollection' : 'collection';
					payload.items.forEach((element, index) => {
						const placeholderId = `placeholder${payload.firstItem + index}`;
						const existingPlaceholderIndex = state[collectionName].findIndex(notification => {
							return notification.id === placeholderId;
						});
						const existingMessageIndex = state[collectionName].findIndex(notification => {
							return notification.id === element.id;
						});
						if (existingMessageIndex >= 0) {
							state[collectionName][existingMessageIndex] = Object.assign(state[collectionName][existingMessageIndex], element);
							state[collectionName].splice(existingPlaceholderIndex, 1);
						} else {
							state[collectionName].splice(existingPlaceholderIndex, 1, Object.assign({}, element));
						}
					});
					state[collectionName].sort(this.sortByType);
				},
				clearPlaceholders: (state, payload) => {
					state.collection = state.collection.filter(element => {
						return !element.id.toString().startsWith('placeholder');
					});
					state.searchCollection = state.searchCollection.filter(element => {
						return !element.id.toString().startsWith('placeholder');
					});
				},
				setCounter: (state, payload) => {
					state.unreadCounter = payload;
				},
				setTotal: (state, payload) => {
					state.total = payload;
				},
				setSchema: (state, payload) => {
					state.schema = payload.data;
				}
			};
		}

		/* region Validation */
		validate(fields, options) {
			const result = {};
			if (main_core.Type.isString(fields.id) || main_core.Type.isNumber(fields.id)) {
				result.id = fields.id;
			}
			if (!main_core.Type.isNil(fields.date)) {
				result.date = im_lib_utils.Utils.date.cast(fields.date);
			}
			if (main_core.Type.isString(fields.text) || main_core.Type.isNumber(fields.text)) {
				result.text = fields.text.toString();
				result.textConverted = NotificationsModel.decodeText(result.text);
			}
			if (main_core.Type.isNumber(fields.author_id)) {
				if (fields.system === true || fields.system === 'Y') {
					result.authorId = 0;
				} else {
					result.authorId = fields.author_id;
				}
			}
			if (main_core.Type.isNumber(fields.userId)) {
				result.authorId = fields.userId;
			}
			if (main_core.Type.isObjectLike(fields.params)) {
				const params = this.validateParams(fields.params);
				if (params) {
					result.params = params;
				}
			}
			if (!main_core.Type.isNil(fields.notify_buttons)) {
				result.notifyButtons = JSON.parse(fields.notify_buttons);
			}

			//p&p format
			if (!main_core.Type.isNil(fields.buttons)) {
				result.notifyButtons = fields.buttons.map(button => {
					return {
						COMMAND: 'notifyConfirm',
						COMMAND_PARAMS: `${result.id}|${button.VALUE}`,
						TEXT: `${button.TITLE}`,
						TYPE: 'BUTTON',
						DISPLAY: 'LINE',
						BG_COLOR: button.VALUE === 'Y' ? '#8bc84b' : '#ef4b57',
						TEXT_COLOR: '#fff'
					};
				});
			}
			if (fields.notify_type === im_const.NotificationTypesCodes.confirm || fields.type === im_const.NotificationTypesCodes.confirm) {
				result.sectionCode = im_const.NotificationTypesCodes.confirm;
			} else if (fields.type === im_const.NotificationTypesCodes.placeholder) {
				result.sectionCode = im_const.NotificationTypesCodes.placeholder;
			}
			if (!main_core.Type.isNil(fields.notify_read)) {
				result.unread = fields.notify_read === 'N';
			}

			//p&p format
			if (!main_core.Type.isNil(fields.read)) {
				result.unread = fields.read === 'N'; //?
			}
			if (main_core.Type.isString(fields.setting_name)) {
				result.settingName = fields.setting_name;
			}

			// rest format
			if (main_core.Type.isString(fields.notify_title) && fields.notify_title.length > 0) {
				result.title = fields.notify_title;
			}

			// p&p format
			if (main_core.Type.isString(fields.title) && fields.title.length > 0) {
				result.title = fields.title;
			}
			return result;
		}
		validateParams(params) {
			const result = {};
			try {
				for (let field in params) {
					if (!params.hasOwnProperty(field)) {
						continue;
					}
					if (field === 'COMPONENT_ID') {
						if (main_core.Type.isString(params[field]) && BX.Vue.isComponent(params[field])) {
							result[field] = params[field];
						}
					} else if (field === 'LIKE') {
						if (params[field] instanceof Array) {
							result['REACTION'] = {
								like: params[field].map(element => parseInt(element))
							};
						}
					} else if (field === 'CHAT_LAST_DATE') {
						result[field] = im_lib_utils.Utils.date.cast(params[field]);
					} else if (field === 'AVATAR') {
						if (params[field]) {
							result[field] = params[field].startsWith('http') ? params[field] : options.host + params[field];
						}
					} else if (field === 'NAME') {
						if (params[field]) {
							result[field] = params[field];
						}
					} else {
						result[field] = params[field];
					}
				}
			} catch (e) {}
			let hasResultElements = false;
			for (let field in result) {
				if (!result.hasOwnProperty(field)) {
					continue;
				}
				hasResultElements = true;
				break;
			}
			return hasResultElements ? result : null;
		}
		/* endregion Validation */

		/* region Internal helpers */
		prepareNotification(notification, options = {}) {
			let result = this.validate(Object.assign({}, notification));
			return Object.assign({}, this.getElementState(), result, options);
		}
		findItemInArr(arr, value, key = 'id') {
			const result = {};
			const elementIndex = arr.findIndex((element, index) => {
				return element[key] === value;
			});
			if (elementIndex !== -1) {
				result.index = elementIndex;
				result.element = arr[elementIndex];
			}
			return result;
		}
		sortByType(a, b) {
			if (a.sectionCode === im_const.NotificationTypesCodes.confirm && b.sectionCode !== im_const.NotificationTypesCodes.confirm) {
				return -1;
			} else if (a.sectionCode !== im_const.NotificationTypesCodes.confirm && b.sectionCode === im_const.NotificationTypesCodes.confirm) {
				return 1;
			} else {
				return b.id - a.id;
			}
		}
		/* endregion Internal helpers */

		static decodeText(text) {
			text = main_core.Text.decode(text.toString());
			text = im_lib_utils.Utils.text.decode(text, {
				skipImages: true
			});
			const Parser = main_core.Reflection.getClass('BX.Messenger.v2.Lib.Parser');
			if (Parser) {
				text = Parser.decodeSmileForLegacyCore(text, {
					enableBigSmile: false
				});
			}
			if (!im_lib_utils.Utils.platform.isBitrixDesktop()) {
				text = text.replace(/<a(.*?)>(.*?)<\/a>/gi, (whole, anchor, innerText) => {
					return `<a ${anchor.replace('target="_blank"', 'target="_self"')} class="bx-im-notifications-item-link">${innerText}</a>`;
				});
			}
			return text;
		}
	}

	exports.ApplicationModel = ApplicationModel;
	exports.DialoguesModel = DialoguesModel;
	exports.FilesModel = FilesModel;
	exports.MessagesModel = MessagesModel;
	exports.NotificationsModel = NotificationsModel;
	exports.RecentModel = RecentModel;
	exports.UsersModel = UsersModel;

})(this.BX.Messenger.Model = this.BX.Messenger.Model || {}, BX.Messenger.Const, BX, BX, BX.Messenger.Lib, BX.Messenger.Lib, BX.Event, BX);
//# sourceMappingURL=registry.bundle.js.map
