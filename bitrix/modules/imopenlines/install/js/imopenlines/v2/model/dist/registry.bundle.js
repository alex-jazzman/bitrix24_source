/* eslint-disable */
this.BX = this.BX || {};
this.BX.OpenLines = this.BX.OpenLines || {};
this.BX.OpenLines.v2 = this.BX.OpenLines.v2 || {};
(function (exports, main_core, ui_vue3_vuex, im_v2_model, im_v2_application_core) {
	'use strict';

	const sessionsFieldsConfig = [{
		fieldName: ['id', 'sessionId'],
		targetFieldName: 'id',
		checkFunction: main_core.Type.isNumber,
		formatFunction: im_v2_model.convertToNumber
	}, {
		fieldName: 'chatId',
		targetFieldName: 'chatId',
		checkFunction: main_core.Type.isNumber,
		formatFunction: im_v2_model.convertToNumber
	}, {
		fieldName: 'operatorId',
		targetFieldName: 'operatorId',
		checkFunction: main_core.Type.isNumber,
		formatFunction: im_v2_model.convertToNumber
	}, {
		fieldName: 'status',
		targetFieldName: 'status',
		checkFunction: main_core.Type.isString,
		formatFunction: im_v2_model.convertToString
	}, {
		fieldName: 'queueId',
		targetFieldName: 'queueId',
		checkFunction: main_core.Type.isNumber,
		formatFunction: im_v2_model.convertToNumber
	}, {
		fieldName: 'pinned',
		targetFieldName: 'pinned',
		checkFunction: main_core.Type.isBoolean
	}, {
		fieldName: 'isClosed',
		targetFieldName: 'isClosed',
		checkFunction: main_core.Type.isBoolean
	}];

	class SessionsModel extends ui_vue3_vuex.BuilderModel {
		getName() {
			return 'sessions';
		}
		getState() {
			return {
				collection: {}
			};
		}
		getElementState() {
			return {
				id: 0,
				chatId: 0,
				operatorId: 0,
				status: '',
				queueId: 0,
				pinned: false,
				isClosed: false
			};
		}
		getGetters() {
			return {
				/** @function openLines/sessions/getById */
				getById: state => (id, getBlank = false) => {
					if (!state.collection[id] && getBlank) {
						return this.getElementState();
					}
					if (!state.collection[id] && !getBlank) {
						return null;
					}
					return state.collection[id];
				},
				/** @function openLines/sessions/getByChatId */
				getByChatId: state => (chatId, getBlank = false) => {
					const session = Object.values(state.collection).find(item => item.chatId === chatId);
					if (!session && getBlank) {
						return this.getElementState();
					}
					if (!session && !getBlank) {
						return null;
					}
					return session;
				}
			};
		}
		getActions() {
			return {
				/** @function openLines/sessions/set */
				set: (store, payload) => {
					let sessions = payload;
					if (main_core.Type.isNil(sessions)) {
						return;
					}
					if (!Array.isArray(sessions) && main_core.Type.isPlainObject(sessions)) {
						sessions = [sessions];
					}
					const itemsToAdd = [];
					sessions.map(element => {
						return this.#formatFields(element);
					}).forEach(element => {
						const existingItem = store.state.collection[element.id];
						if (existingItem) {
							store.commit('update', {
								id: existingItem.id,
								fields: {
									...element
								}
							});
						} else {
							itemsToAdd.push({
								...this.getElementState(),
								...element
							});
						}
					});
					if (itemsToAdd.length > 0) {
						store.commit('add', itemsToAdd);
					}
				},
				/** @function openLines/sessions/pin */
				pin: (store, payload) => {
					const existingItem = store.state.collection[payload.id];
					if (!existingItem) {
						return;
					}
					store.commit('update', {
						id: existingItem.id,
						fields: {
							pinned: payload.action
						}
					});
				}
			};
		}
		getMutations() {
			return {
				add: (state, payload) => {
					const sessions = payload;
					const sessionsState = state;
					const sessionChatId = sessions[0].chatId;
					const result = Object.values(sessionsState.collection).find(item => item.chatId === sessionChatId);
					if (result) {
						delete sessionsState.collection[result.id];
					}
					sessions.forEach(item => {
						sessionsState.collection[item.id] = item;
					});
				},
				update: (state, payload) => {
					const sessionsState = state;
					const currentElement = state.collection[payload.id];
					sessionsState.collection[payload.id] = {
						...currentElement,
						...payload.fields
					};
				}
			};
		}
		#formatFields(rawFields) {
			return im_v2_model.formatFieldsWithConfig(rawFields, sessionsFieldsConfig);
		}
	}

	const recentFieldsConfig = [{
		fieldName: ['id', 'dialogId'],
		targetFieldName: 'dialogId',
		checkFunction: im_v2_model.isNumberOrString,
		formatFunction: im_v2_model.convertToString
	}, {
		fieldName: ['chatId'],
		targetFieldName: 'chatId',
		checkFunction: main_core.Type.isNumber,
		formatFunction: im_v2_model.convertToNumber
	}, {
		fieldName: 'messageId',
		targetFieldName: 'messageId',
		checkFunction: im_v2_model.isNumberOrString
	}, {
		fieldName: 'sessionId',
		targetFieldName: 'sessionId',
		checkFunction: main_core.Type.isNumber,
		formatFunction: im_v2_model.convertToNumber
	}, {
		fieldName: 'draft',
		targetFieldName: 'draft',
		checkFunction: main_core.Type.isPlainObject,
		formatFunction: im_v2_model.prepareDraft
	}, {
		fieldName: 'pinned',
		targetFieldName: 'pinned',
		checkFunction: main_core.Type.isBoolean
	}, {
		fieldName: 'liked',
		targetFieldName: 'liked',
		checkFunction: main_core.Type.isBoolean
	}];

	/* eslint-disable no-param-reassign */
	class RecentModel extends ui_vue3_vuex.BuilderModel {
		getName() {
			return 'recent';
		}
		getState() {
			return {
				collection: {}
			};
		}
		getElementState() {
			return {
				dialogId: '0',
				chatId: 0,
				messageId: 0,
				sessionId: 0,
				draft: {
					text: '',
					date: null
				},
				pinned: false,
				liked: false
			};
		}
		getGetters() {
			return {
				/** @function openLines/recent/getOpenLinesCollection */
				getOpenLinesCollection: state => {
					const openLinesItems = [];
					Object.keys(state.collection).forEach(dialogId => {
						const dialog = im_v2_application_core.Core.getStore().getters['chats/get'](dialogId);
						if (dialog) {
							openLinesItems.push(state.collection[dialogId]);
						}
					});
					return openLinesItems;
				},
				/** @function openLines/recent/getSession */
				getSession: state => (dialogId, getBlank = false) => {
					const session = state.collection[dialogId];
					if (!session && getBlank) {
						return this.getElementState();
					}
					if (!session && !getBlank) {
						return null;
					}
					const sessionId = session.sessionId;
					return im_v2_application_core.Core.getStore().getters['openLines/sessions/getById'](sessionId);
				},
				/** @function recent/get */
				get: state => dialogId => {
					if (!state.collection[dialogId]) {
						return null;
					}
					return state.collection[dialogId];
				},
				/** @function recent/getChatIdByDialogId */
				getChatIdByDialogId: state => dialogId => {
					if (!state.collection[dialogId]) {
						return null;
					}
					return state.collection[dialogId].chatId;
				}
			};
		}
		getActions() {
			return {
				/** @function openLines/recent/set */
				set: (store, payload) => {
					let openLines = payload;
					if (!Array.isArray(openLines) && main_core.Type.isPlainObject(openLines)) {
						openLines = [openLines];
					}
					const itemsToAdd = [];
					const itemsToUpdate = [];
					openLines.map(element => {
						return this.#formatFields(element);
					}).forEach(element => {
						const existingItem = store.state.collection[element.dialogId];
						if (existingItem) {
							itemsToUpdate.push({
								dialogId: existingItem.dialogId,
								fields: {
									...element
								}
							});
						} else {
							itemsToAdd.push({
								...this.getElementState(),
								...element
							});
						}
					});
					if (itemsToAdd.length > 0) {
						store.commit('add', itemsToAdd);
					}
					if (itemsToUpdate.length > 0) {
						store.commit('update', itemsToUpdate);
					}
				},
				/** @function openLines/recent/delete */
				delete: (store, payload) => {
					const existingItem = store.state.collection[payload.id];
					if (!existingItem) {
						return;
					}
					store.commit('delete', {
						id: existingItem.dialogId
					});
				}
			};
		}
		getMutations() {
			return {
				add: (state, payload) => {
					let openLines = payload;
					const openLinesState = state;
					if (!Array.isArray(openLines) && main_core.Type.isPlainObject(openLines)) {
						openLines = [openLines];
					}
					openLines.forEach(item => {
						openLinesState.collection[item.dialogId] = item;
					});
				},
				update: (state, payload) => {
					let openLines = payload;
					const openLinesState = state;
					if (!Array.isArray(openLines) && main_core.Type.isPlainObject(openLines)) {
						openLines = [openLines];
					}
					openLines.forEach(({
						dialogId,
						fields
					}) => {
						const currentElement = state.collection[dialogId];
						openLinesState.collection[dialogId] = {
							...currentElement,
							...fields
						};
					});
				},
				delete: (state, payload) => {
					delete state.collection[payload.id];
				}
			};
		}
		#formatFields(rawFields) {
			return im_v2_model.formatFieldsWithConfig(rawFields, recentFieldsConfig);
		}
	}

	const queueFieldsConfig = [{
		fieldName: ['id', 'queueId'],
		targetFieldName: 'id',
		formatFunction: im_v2_model.convertToNumber
	}, {
		fieldName: ['lineName', 'name'],
		targetFieldName: 'lineName',
		checkFunction: main_core.Type.isString,
		formatFunction: im_v2_model.convertToString
	}, {
		fieldName: ['type', 'queueType'],
		targetFieldName: 'type',
		checkFunction: main_core.Type.isString,
		formatFunction: im_v2_model.convertToString
	}, {
		fieldName: ['isActive'],
		targetFieldName: 'isActive',
		checkFunction: main_core.Type.isBoolean
	}, {
		fieldName: ['color'],
		targetFieldName: 'color',
		checkFunction: main_core.Type.isString,
		formatFunction: im_v2_model.convertToString
	}];

	/* eslint-disable no-param-reassign */
	class QueueModel extends ui_vue3_vuex.BuilderModel {
		getName() {
			return 'queue';
		}
		getState() {
			return {
				collection: {},
				isLinesOperator: false
			};
		}
		getElementState() {
			return {
				id: 0,
				lineName: '',
				type: '',
				isActive: true,
				color: ''
			};
		}
		getGetters() {
			return {
				/** @function openLines/queue/getList */
				getList: state => () => {
					return Object.values(state.collection);
				},
				/** @function openLines/queue/getListOfActive */
				getListOfActive: state => () => {
					return Object.values(state.collection).filter(queue => queue.isActive);
				},
				/** @function openLines/queue/getById */
				getById: state => id => {
					return state.collection[id] ?? null;
				},
				/** @function openLines/queue/isLinesOperator */
				isLinesOperator: state => {
					return state.isLinesOperator;
				}
			};
		}
		getActions() {
			return {
				/** @function openLines/queue/set */
				set: (store, payload) => {
					let queues = payload;
					if (!Array.isArray(queues) && main_core.Type.isPlainObject(queues)) {
						queues = [queues];
					}
					const itemsToAdd = [];
					queues.map(element => {
						return this.#formatFields(element);
					}).forEach(element => {
						const existingItem = store.state.collection[element.id];
						if (existingItem) {
							store.commit('update', {
								id: existingItem.id,
								fields: {
									...element
								}
							});
						} else {
							itemsToAdd.push({
								...this.getElementState(),
								...element
							});
						}
					});
					if (itemsToAdd.length > 0) {
						store.commit('add', itemsToAdd);
					}
				},
				/** @function openLines/queue/setIsLinesOperator */
				setIsLinesOperator: (store, payload) => {
					store.commit('setIsLinesOperator', payload === true);
				},
				/** @function openLines/queue/delete */
				delete: (store, payload) => {
					const existingItem = store.state.collection[payload.id];
					if (!existingItem) {
						return;
					}
					store.commit('delete', {
						id: existingItem.dialogId
					});
				}
			};
		}
		getMutations() {
			return {
				add: (state, payload) => {
					const queues = payload;
					const queueState = state;
					queues.forEach(item => {
						queueState.collection[item.id] = item;
					});
				},
				update: (state, payload) => {
					const queueState = state;
					const currentElement = state.collection[payload.id];
					queueState.collection[payload.id] = {
						...currentElement,
						...payload.fields
					};
				},
				delete: (state, payload) => {
					delete state.collection[payload.id];
				},
				setIsLinesOperator: (state, payload) => {
					state.isLinesOperator = payload;
				}
			};
		}
		#formatFields(rawFields) {
			return im_v2_model.formatFieldsWithConfig(rawFields, queueFieldsConfig);
		}
	}

	/* eslint-disable no-param-reassign */
	class CurrentSessionModel extends ui_vue3_vuex.BuilderModel {
		getName() {
			return 'currentSession';
		}
		getState() {
			return {
				collection: {}
			};
		}
		getElementState() {
			return {
				sessionId: 0,
				pause: false,
				waitAction: false,
				blockDate: '',
				blockReason: '',
				silentMode: false,
				dateCreate: '',
				multidialog: false
			};
		}
		getGetters() {
			return {
				/** @function openLines/currentSession/getByDialogId */
				getByDialogId: state => dialogId => {
					return state.collection[dialogId] || null;
				},
				/** @function openlines/currentSession/getSilentModeByDialogId */
				getSilentModeByDialogId: state => dialogId => {
					return state.collection[dialogId]?.silentMode || false;
				}
			};
		}
		getActions() {
			return {
				/** @function openLines/currentSession/set */
				set: (store, payload) => {
					if (!payload.data) {
						return;
					}
					store.commit('set', payload);
				}
			};
		}
		getMutations() {
			return {
				set: (state, payload) => {
					const {
						dialogId,
						data
					} = payload;
					const currentElement = state.collection[dialogId] ?? this.getElementState();
					state.collection[dialogId] = {
						...currentElement,
						...data
					};
				}
			};
		}
	}

	/* eslint-disable no-param-reassign */
	class ConnectorModel extends ui_vue3_vuex.BuilderModel {
		getName() {
			return 'connector';
		}
		getState() {
			return {
				collection: {}
			};
		}
		getElementState() {
			return {
				connectorId: '',
				lineId: 0,
				connectorChatId: 0,
				connectorUserId: 0
			};
		}
		getGetters() {
			return {
				/** @function openLines/connector/getByDialogId */
				getByDialogId: state => dialogId => {
					return state.collection[dialogId] || null;
				}
			};
		}
		getActions() {
			return {
				/** @function openLines/connector/set */
				set: (store, payload) => {
					if (!payload.data) {
						return;
					}
					store.commit('set', payload);
				}
			};
		}
		getMutations() {
			return {
				set: (state, payload) => {
					const {
						dialogId,
						data
					} = payload;
					const currentElement = state.collection[dialogId] ?? this.getElementState();
					state.collection[dialogId] = {
						...currentElement,
						...data
					};
				}
			};
		}
	}

	/* eslint-disable no-param-reassign */
	class CrmModel extends ui_vue3_vuex.BuilderModel {
		getName() {
			return 'crm';
		}
		getState() {
			return {
				collection: {}
			};
		}
		getElementState() {
			return {
				crmEnabled: false,
				crmEntityType: '',
				crmEntityId: 0,
				leadId: null,
				companyId: null,
				contactId: null,
				dealId: null
			};
		}
		getGetters() {
			return {
				/** @function openLines/crm/getByDialogId */
				getByDialogId: state => dialogId => {
					return state.collection[dialogId] || null;
				}
			};
		}
		getActions() {
			return {
				/** @function openLines/crm/set */
				set: (store, payload) => {
					if (!payload.data) {
						return;
					}
					store.commit('set', payload);
				}
			};
		}
		getMutations() {
			return {
				set: (state, payload) => {
					const {
						dialogId,
						data
					} = payload;
					const currentElement = state.collection[dialogId] ?? this.getElementState();
					state.collection[dialogId] = {
						...currentElement,
						...data
					};
				}
			};
		}
	}

	/* eslint-disable no-param-reassign */
	class CrmFormModel extends ui_vue3_vuex.BuilderModel {
		getName() {
			return 'crmForm';
		}
		getState() {
			return {
				collection: {}
			};
		}
		getElementState() {
			return {
				id: 0,
				name: '',
				code: '',
				sec: ''
			};
		}
		getGetters() {
			return {
				/** @function openLines/crmForm/getList */
				getList: state => () => {
					return Object.values(state.collection);
				}
			};
		}
		getActions() {
			return {
				/** @function openLines/crmForm/set */
				set: (store, payload) => {
					store.commit('set', payload);
				}
			};
		}
		getMutations() {
			return {
				set: (state, payload) => {
					const collection = {};
					payload.forEach(item => {
						collection[item.id] = {
							...this.getElementState(),
							...item
						};
					});
					state.collection = collection;
				}
			};
		}
	}

	/* eslint-disable no-param-reassign */
	class QuickReplyModel extends ui_vue3_vuex.BuilderModel {
		getName() {
			return 'quickReply';
		}
		getState() {
			return {
				collection: {},
				hasNextPage: false,
				sections: [],
				manageUrl: '',
				permissions: {
					canView: true,
					canCreate: false
				}
			};
		}
		getElementState() {
			return {
				id: 0,
				name: '',
				text: '',
				sectionId: 0,
				canEdit: false,
				rating: 0
			};
		}
		getGetters() {
			return {
				/** @function openLines/quickReply/getList */
				getList: state => () => {
					return Object.values(state.collection).sort((a, b) => b.rating - a.rating);
				},
				/** @function openLines/quickReply/hasNextPage */
				hasNextPage: state => () => {
					return state.hasNextPage;
				},
				/** @function openLines/quickReply/getSections */
				getSections: state => () => {
					return state.sections;
				},
				/** @function openLines/quickReply/getManageUrl */
				getManageUrl: state => () => {
					return state.manageUrl;
				},
				/** @function openLines/quickReply/getPermissions */
				getPermissions: state => () => {
					return state.permissions;
				}
			};
		}
		getActions() {
			return {
				/** @function openLines/quickReply/set */
				set: (store, payload) => {
					store.commit('set', payload);
				},
				/** @function openLines/quickReply/update */
				update: (store, payload) => {
					store.commit('update', payload);
				},
				/** @function openLines/quickReply/clear */
				clear: store => {
					store.commit('clear');
				}
			};
		}
		getMutations() {
			return {
				set: (state, payload) => {
					payload.replies.forEach(item => {
						state.collection[item.id] = {
							...this.getElementState(),
							...item
						};
					});
					state.sections = payload.sections;
					state.hasNextPage = payload.hasNextPage;
					state.manageUrl = payload.manageUrl;
					state.permissions = payload.permissions;
				},
				update: (state, payload) => {
					const existing = state.collection[payload.id];
					state.collection[payload.id] = {
						...this.getElementState(),
						...existing,
						...payload
					};
				},
				clear: state => {
					state.collection = {};
					state.sections = [];
					state.hasNextPage = false;
					state.manageUrl = '';
					state.permissions = {
						canView: true,
						canCreate: false
					};
				}
			};
		}
	}

	class OpenLinesModel extends ui_vue3_vuex.BuilderModel {
		getName() {
			return 'openLines';
		}
		getNestedModules() {
			return {
				sessions: SessionsModel,
				recent: RecentModel,
				queue: QueueModel,
				connector: ConnectorModel,
				crm: CrmModel,
				crmForm: CrmFormModel,
				currentSession: CurrentSessionModel,
				quickReply: QuickReplyModel
			};
		}
	}

	exports.ConnectorModel = ConnectorModel;
	exports.CrmFormModel = CrmFormModel;
	exports.CrmModel = CrmModel;
	exports.CurrentSessionModel = CurrentSessionModel;
	exports.OpenLinesModel = OpenLinesModel;
	exports.QueueModel = QueueModel;
	exports.QuickReplyModel = QuickReplyModel;
	exports.RecentModel = RecentModel;
	exports.SessionsModel = SessionsModel;

})(this.BX.OpenLines.v2.Model = this.BX.OpenLines.v2.Model || {}, BX, BX.Vue3.Vuex, BX.Messenger.v2.Model, BX.Messenger.v2.Application);
//# sourceMappingURL=registry.bundle.js.map
