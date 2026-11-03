/* eslint-disable */
this.BX = this.BX || {};
this.BX.Tasks = this.BX.Tasks || {};
this.BX.Tasks.V2 = this.BX.Tasks.V2 || {};
(function (exports, main_core, tasks_v2_const, main_core_events, tasks_v2_provider_service_resultMessageService, ui_iconSet_api_vue) {
	'use strict';

	const StateStatus = Object.freeze({
		Idle: 'idle',
		Loading: 'loading',
		Loaded: 'loaded',
		Error: 'error'
	});
	const RegistrationPriority = Object.freeze({
		Normal: 0,
		High: 100
	});

	class StateController {
		#cache = new Map();
		#subscriptions = new Map();
		#retainCount = 0;
		retain() {
			this.#retainCount++;
			this.#subscribe();
		}
		release() {
			if (this.#retainCount === 0) {
				return;
			}
			this.#retainCount--;
			if (this.#retainCount === 0) {
				this.#unsubscribe();
			}
		}
		hydrate(taskId, options = {}) {
			const normalizedTaskId = main_core.Text.toInteger(taskId);
			const entry = this.#getOrCreateEntry(normalizedTaskId);
			if (!options.force) {
				if (entry.status === StateStatus.Loading && entry.promise) {
					return entry.promise;
				}
				if (entry.status === StateStatus.Loaded) {
					return Promise.resolve(entry.map);
				}
			}
			return this.#load(normalizedTaskId, entry, options.force ? ++entry.revision : entry.revision);
		}
		#load(taskId, entry, revision) {
			const stateEntry = entry;
			stateEntry.status = StateStatus.Loading;
			const promise = tasks_v2_provider_service_resultMessageService.resultMessageService.getCurrentUserMap(taskId).then(data => {
				if (revision !== stateEntry.revision) {
					return stateEntry.map;
				}
				stateEntry.map = this.#normalizeMap(data);
				stateEntry.status = StateStatus.Loaded;
				stateEntry.promise = null;
				return stateEntry.map;
			}).catch(error => {
				console.error('ResultMessageMenu.StateController.hydrate error', error);
				if (revision !== stateEntry.revision) {
					return stateEntry.map;
				}
				stateEntry.map = {};
				stateEntry.status = StateStatus.Error;
				stateEntry.promise = null;
				return stateEntry.map;
			});
			stateEntry.promise = promise;
			return promise;
		}
		getStatus(taskId) {
			return this.#cache.get(main_core.Text.toInteger(taskId))?.status ?? StateStatus.Idle;
		}
		isTracked(taskId) {
			return this.#cache.has(main_core.Text.toInteger(taskId));
		}
		getMessageResultId(taskId, messageId) {
			const entry = this.#cache.get(main_core.Text.toInteger(taskId));
			if (!entry) {
				return 0;
			}
			return main_core.Text.toInteger(entry.map[main_core.Text.toInteger(messageId)]);
		}
		setMessageResultId(taskId, messageId, resultId) {
			const entry = this.#getOrCreateEntry(main_core.Text.toInteger(taskId));
			entry.status = StateStatus.Loaded;
			entry.promise = null;
			const normalizedMessageId = main_core.Text.toInteger(messageId);
			const normalizedResultId = main_core.Text.toInteger(resultId);
			if (normalizedResultId > 0) {
				entry.map[normalizedMessageId] = normalizedResultId;
				return;
			}
			delete entry.map[normalizedMessageId];
		}
		removeResultId(taskId, resultId) {
			const entry = this.#cache.get(main_core.Text.toInteger(taskId));
			if (!entry) {
				return;
			}
			const normalizedResultId = main_core.Text.toInteger(resultId);
			Object.entries(entry.map).forEach(([messageId, messageResultId]) => {
				if (main_core.Text.toInteger(messageResultId) === normalizedResultId) {
					delete entry.map[messageId];
				}
			});
		}
		evict(taskId) {
			this.#cache.delete(main_core.Text.toInteger(taskId));
		}
		dispose() {
			this.#unsubscribe();
			this.#cache.clear();
			this.#retainCount = 0;
		}
		#getOrCreateEntry(taskId) {
			if (!this.#cache.has(taskId)) {
				this.#cache.set(taskId, {
					status: StateStatus.Idle,
					map: {},
					promise: null,
					revision: 0
				});
			}
			return this.#cache.get(taskId);
		}
		#normalizeMap(data) {
			if (!main_core.Type.isPlainObject(data)) {
				return {};
			}
			const map = {};
			Object.entries(data).forEach(([messageId, resultId]) => {
				const normalizedMessageId = main_core.Text.toInteger(messageId);
				const normalizedResultId = main_core.Text.toInteger(resultId);
				if (normalizedMessageId > 0 && normalizedResultId > 0) {
					map[normalizedMessageId] = normalizedResultId;
				}
			});
			return map;
		}
		#subscribe() {
			if (this.#subscriptions.size > 0) {
				return;
			}
			[tasks_v2_const.EventName.ResultFromMessageAdded, tasks_v2_const.EventName.ResultSuccessfulDeleted].forEach(eventName => {
				this.#subscriptions.set(eventName, this.#handleResultEvent);
				main_core_events.EventEmitter.subscribe(eventName, this.#handleResultEvent);
			});
		}
		#unsubscribe() {
			this.#subscriptions.forEach((handler, eventName) => {
				main_core_events.EventEmitter.unsubscribe(eventName, handler);
			});
			this.#subscriptions.clear();
		}
		#handleResultEvent = event => {
			const taskId = main_core.Text.toInteger(event.getData()?.taskId);
			if (taskId <= 0 || !this.#cache.has(taskId)) {
				return;
			}
			void this.hydrate(taskId, {
				force: true
			});
		};
	}
	const stateController = new StateController();

	class LightTransport {
		async add(taskId, messageContext) {
			const service = await this.#getService();
			const response = await service.add(taskId, messageContext.id);
			this.#applyAddedResult(taskId, messageContext.id, response);
			return true;
		}
		async remove(taskId, messageId, resultId) {
			stateController.removeResultId(taskId, resultId);
			try {
				const service = await this.#getService();
				await service.delete(taskId, resultId);
			} catch (error) {
				stateController.setMessageResultId(taskId, messageId, resultId);
				throw error;
			}
		}
		async #getService() {
			const extension = await main_core.Runtime.loadExtension('tasks.v2.provider.service.result-message-service');
			return extension.resultMessageService;
		}
		#applyAddedResult(taskId, messageId, response) {
			const resultId = main_core.Text.toInteger(response?.id);
			if (resultId > 0) {
				stateController.setMessageResultId(taskId, messageId, resultId);
			}
		}
	}

	class StoreTransport {
		async add(taskId, messageContext) {
			const [payload, service] = await Promise.all([this.#createPayload(taskId, messageContext), this.#getService()]);
			return service.addResultFromMessage(taskId, messageContext.id, payload);
		}
		async remove(taskId, messageId, resultId) {
			const service = await this.#getService();
			await service.delete(resultId, taskId);
		}
		async #getService() {
			const extension = await main_core.Runtime.loadExtension('tasks.v2.provider.service.result-service');
			return extension.resultService;
		}
		async #createPayload(taskId, messageContext) {
			const timestamp = Date.now() / 1000;
			return {
				text: main_core.Type.isStringFilled(messageContext.text) ? messageContext.text : main_core.Loc.getMessage('TASKS_V2_RESULT_DEFAULT_TITLE_FROM_MESSAGE') ?? '',
				author: await this.#createAuthor(messageContext.authorId),
				id: main_core.Text.getRandom(),
				taskId,
				createdAtTs: timestamp,
				updatedAtTs: timestamp,
				rights: {
					edit: true,
					remove: true
				},
				fileIds: [],
				previewId: null,
				files: [],
				status: tasks_v2_const.ResultStatus.Open
			};
		}
		async #createAuthor(authorId) {
			const author = {
				id: main_core.Text.toInteger(authorId),
				name: '',
				image: {
					src: ''
				},
				type: '',
				gender: '',
				role: ''
			};
			const user = await this.#getStoreUser(author.id);
			if (!user) {
				return author;
			}
			return {
				...author,
				name: main_core.Type.isStringFilled(user.name) ? user.name : '',
				image: {
					src: main_core.Type.isStringFilled(user.image) ? user.image : ''
				},
				type: main_core.Type.isStringFilled(user.type) ? user.type : ''
			};
		}
		async #getStoreUser(userId) {
			try {
				const extension = await main_core.Runtime.loadExtension('tasks.v2.core');
				const store = extension?.Core?.getStore?.();
				return store?.getters[`${tasks_v2_const.Model.Users}/getById`]?.(userId) ?? null;
			} catch {
				return null;
			}
		}
	}

	class Executor {
		#transport;
		#operations = new Set();
		constructor(transport) {
			this.#transport = transport;
		}
		async addFromMessage(taskId, messageContext, analyticsContext = null) {
			const operationKey = this.#getOperationKey(taskId, messageContext.id);
			if (this.#operations.has(operationKey)) {
				return false;
			}
			this.#operations.add(operationKey);
			let isSuccess = false;
			try {
				isSuccess = await this.#transport.add(taskId, messageContext);
			} catch (error) {
				console.error('ResultMessageMenu.Executor.addFromMessage error', error);
			} finally {
				this.#operations.delete(operationKey);
			}
			this.#sendAnalytics(taskId, isSuccess, analyticsContext);
			return isSuccess;
		}
		async removeFromMessage(taskId, messageId, resultId) {
			const operationKey = this.#getOperationKey(taskId, messageId);
			if (this.#operations.has(operationKey)) {
				return false;
			}
			this.#operations.add(operationKey);
			let isSuccess = false;
			try {
				await this.#transport.remove(taskId, messageId, resultId);
				isSuccess = true;
			} catch (error) {
				console.error('ResultMessageMenu.Executor.removeFromMessage error', error);
			} finally {
				this.#operations.delete(operationKey);
			}
			return isSuccess;
		}
		#getOperationKey(taskId, messageId) {
			return `${main_core.Text.toInteger(taskId)}:${main_core.Text.toInteger(messageId)}`;
		}
		#sendAnalytics(taskId, isSuccess, analyticsContext) {
			if (!analyticsContext?.cardType) {
				return;
			}
			const {
				cardType,
				context,
				additionalContext
			} = analyticsContext;
			main_core.Runtime.loadExtension('tasks.v2.lib.analytics').then(extension => {
				const {
					analytics
				} = extension;
				analytics.sendStatusSummaryAdd({
					context: context ?? '',
					additionalContext: additionalContext ?? '',
					element: tasks_v2_const.Analytics.Element.ChatContextMenu
				}, {
					isSuccess,
					cardType,
					taskId,
					element: tasks_v2_const.Analytics.Element.ChatContextMenu,
					subSection: tasks_v2_const.Analytics.SubSection.Chat
				});
			}).catch(error => {
				console.error('ResultMessageMenu.Executor.sendAnalytics error', error);
			});
		}
	}
	const executor = new Executor(new LightTransport());
	const storeExecutor = new Executor(new StoreTransport());

	const ResultMessageMenu = (baseMenu, dependencies) => class extends baseMenu {
		getAddResultItem() {
			if (this.#shouldHideResultItem()) {
				return null;
			}
			const taskId = dependencies.getTaskId();
			if (this.#isMapUnavailable(taskId)) {
				return null;
			}
			const resultId = dependencies.stateController.getMessageResultId(taskId, this.context.id);
			if (resultId > 0) {
				return null;
			}
			return {
				title: main_core.Loc.getMessage('TASKS_V2_TASK_FULL_CARD_MESSAGE_ADD_RESULT') ?? '',
				icon: ui_iconSet_api_vue.Outline.FLAG,
				onClick: () => {
					void dependencies.executor.addFromMessage(taskId, this.context, dependencies.getAnalytics?.() ?? null);
					this.close();
				}
			};
		}
		getRemoveResultItem() {
			if (this.#shouldHideResultItem()) {
				return null;
			}
			const taskId = dependencies.getTaskId();
			if (this.#isMapUnavailable(taskId)) {
				return null;
			}
			const resultId = dependencies.stateController.getMessageResultId(taskId, this.context.id);
			if (resultId <= 0) {
				return null;
			}
			return {
				title: main_core.Loc.getMessage('TASKS_V2_TASK_FULL_CARD_MESSAGE_DELETE_RESULT') ?? '',
				icon: ui_iconSet_api_vue.Outline.FLAG_WITH_CROSS,
				onClick: () => {
					void dependencies.executor.removeFromMessage(taskId, this.context.id, resultId, dependencies.getAnalytics?.() ?? null);
					this.close();
				}
			};
		}
		#shouldHideResultItem() {
			return this.isDeletedMessage() || this.context.authorId === 0;
		}
		#isMapUnavailable(taskId) {
			const status = dependencies.stateController.getStatus(taskId);
			if (status === StateStatus.Error || status === StateStatus.Idle) {
				void dependencies.stateController.hydrate?.(taskId);
				return true;
			}
			return status === StateStatus.Loading;
		}
	};

	class RegistrationManager {
		#registry = new Map();
		async register(options) {
			const taskId = main_core.Text.toInteger(options.taskId);
			const chatId = main_core.Text.toInteger(options.chatId);
			const priority = main_core.Text.toInteger(options.priority);
			const owner = Symbol('result-message-menu-registration');
			this.#removeSamePriorityEntry(chatId, priority);
			const entry = {
				owner,
				taskId,
				priority,
				managesSharedState: !options.stateController,
				callback: null,
				menuClass: null,
				messageMenuManager: null,
				isRegistered: false,
				isRetained: false
			};
			this.#getEntries(chatId).push(entry);
			const registration = {
				teardown: () => {
					this.#teardownEntry(chatId, owner);
				}
			};
			try {
				const {
					TaskCommentsMessageMenu,
					MessageMenuManager
				} = await main_core.Runtime.loadExtension('im.v2.lib.menu');
				if (this.#findEntry(chatId, owner) !== entry) {
					return registration;
				}
				entry.callback = context => {
					return main_core.Text.toInteger(context.chatId) === chatId;
				};
				const defaults = {
					getTaskId: () => taskId,
					getAnalytics: () => options.analytics ?? null,
					stateController: options.stateController ?? stateController,
					executor
				};
				entry.menuClass = options.createMenuClass?.(TaskCommentsMessageMenu, defaults) ?? ResultMessageMenu(TaskCommentsMessageMenu, defaults);
				entry.messageMenuManager = MessageMenuManager.getInstance();
				if (entry.managesSharedState) {
					entry.isRetained = true;
					stateController.retain();
				}
				this.#activateTopEntry(chatId);
				if (this.#findEntry(chatId, owner) !== entry) {
					this.#disposeEntry(entry);
					this.#restoreTopEntry(chatId);
					return registration;
				}
				if (entry.managesSharedState) {
					void stateController.hydrate(taskId);
				}
				return registration;
			} catch (error) {
				this.#teardownEntry(chatId, owner);
				throw error;
			}
		}
		#getEntries(chatId) {
			let entries = this.#registry.get(chatId);
			if (!entries) {
				entries = [];
				this.#registry.set(chatId, entries);
			}
			return entries;
		}
		#findEntry(chatId, owner) {
			return (this.#registry.get(chatId) ?? []).find(entry => entry.owner === owner) ?? null;
		}
		#removeEntry(chatId, entry) {
			const entries = this.#registry.get(chatId);
			if (!entries) {
				return;
			}
			const index = entries.indexOf(entry);
			if (index >= 0) {
				entries.splice(index, 1);
			}
			if (entries.length === 0) {
				this.#registry.delete(chatId);
			}
		}
		#removeSamePriorityEntry(chatId, priority) {
			const entry = (this.#registry.get(chatId) ?? []).find(item => item.priority === priority);
			if (!entry) {
				return;
			}
			this.#removeEntry(chatId, entry);
			this.#disposeEntry(entry);
			this.#restoreTopEntry(chatId);
		}
		#teardownEntry(chatId, owner) {
			const entry = this.#findEntry(chatId, owner);
			if (!entry) {
				return;
			}
			this.#removeEntry(chatId, entry);
			this.#disposeEntry(entry);
			this.#restoreTopEntry(chatId);
		}
		#restoreTopEntry(chatId) {
			const restored = this.#activateTopEntry(chatId);
			if (restored && restored.managesSharedState) {
				void stateController.hydrate(restored.taskId);
			}
		}
		#isTaskRetained(taskId) {
			for (const entries of this.#registry.values()) {
				if (entries.some(entry => entry.isRetained && entry.taskId === taskId)) {
					return true;
				}
			}
			return false;
		}
		#activateTopEntry(chatId) {
			const entries = this.#registry.get(chatId) ?? [];
			const top = entries.reduce((best, entry) => {
				if (!this.#isLoaded(entry)) {
					return best;
				}
				return best && best.priority > entry.priority ? best : entry;
			}, null);
			if (!top || top.isRegistered) {
				return null;
			}
			const {
				callback,
				menuClass,
				messageMenuManager
			} = top;
			if (!callback || !menuClass || !messageMenuManager) {
				return null;
			}
			entries.forEach(entry => {
				if (entry !== top) {
					this.#deactivateEntry(entry);
				}
			});
			top.isRegistered = true;
			messageMenuManager.registerMenuByCallback(callback, menuClass);
			return top;
		}
		#isLoaded(entry) {
			return Boolean(entry.callback && entry.menuClass && entry.messageMenuManager);
		}
		#deactivateEntry(entry) {
			const registryEntry = entry;
			if (!registryEntry.isRegistered) {
				return;
			}
			registryEntry.isRegistered = false;
			if (registryEntry.callback && registryEntry.messageMenuManager) {
				registryEntry.messageMenuManager.unregisterMenuByCallback(registryEntry.callback);
			}
		}
		#disposeEntry(entry) {
			const registryEntry = entry;
			try {
				this.#deactivateEntry(registryEntry);
			} finally {
				registryEntry.callback = null;
				registryEntry.menuClass = null;
				registryEntry.messageMenuManager = null;
				if (registryEntry.isRetained) {
					try {
						if (!this.#isTaskRetained(registryEntry.taskId)) {
							stateController.evict(registryEntry.taskId);
						}
					} finally {
						registryEntry.isRetained = false;
						stateController.release();
					}
				}
			}
		}
	}
	const resultMessageMenu = new RegistrationManager();

	exports.RegistrationPriority = RegistrationPriority;
	exports.ResultMessageMenu = ResultMessageMenu;
	exports.executor = executor;
	exports.resultMessageMenu = resultMessageMenu;
	exports.storeExecutor = storeExecutor;

})(this.BX.Tasks.V2.Lib = this.BX.Tasks.V2.Lib || {}, BX, BX.Tasks.V2.Const, BX.Event, BX.Tasks.V2.Provider.Service, BX.UI.IconSet);
//# sourceMappingURL=result-message-menu.bundle.js.map
