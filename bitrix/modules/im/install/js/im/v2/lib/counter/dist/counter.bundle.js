/* eslint-disable */
this.BX = this.BX || {};
this.BX.Messenger = this.BX.Messenger || {};
this.BX.Messenger.v2 = this.BX.Messenger.v2 || {};
(function (exports, main_core_events, main_core, im_v2_application_core, im_v2_lib_desktop, im_v2_lib_logger, im_v2_const) {
	'use strict';

	const updateBrowserTitleCounter = newCounter => {
		const MAX_COUNTER_VALUE = 99;
		const MAX_COUNTER_TEXT = `${MAX_COUNTER_VALUE}+`;
		const regexp = /^\((?<currentCounter>\d+|\d+\+)\)\s(?<text>.*)/;
		const matchResult = document.title.match(regexp);
		const displayCounter = newCounter > MAX_COUNTER_VALUE ? MAX_COUNTER_TEXT : newCounter;
		if (matchResult?.groups.currentCounter) {
			const currentCounter = Number.parseInt(matchResult.groups.currentCounter, 10);
			if (newCounter !== currentCounter) {
				const counterPrefix = newCounter > 0 ? `(${displayCounter}) ` : '';
				document.title = `${counterPrefix}${matchResult.groups.text}`;
			}
		} else if (newCounter > 0) {
			document.title = `(${displayCounter}) ${document.title}`;
		}
	};

	const RecentTypeClearHandlers = [(recentType, parentChatId) => im_v2_application_core.Core.getStore().dispatch('chats/clearMarkedChatsByRecentType', {
		recentType,
		parentChatId
	}), (recentType, parentChatId) => im_v2_application_core.Core.getStore().dispatch('counters/clearByRecentType', {
		recentType,
		parentChatId
	}), (recentType, parentChatId) => im_v2_application_core.Core.getStore().dispatch('messages/anchors/removeAllAnchorsByRecentType', {
		recentType,
		parentChatId
	})];
	const CounterClearActions = [() => im_v2_application_core.Core.getStore().dispatch('counters/clear'), () => im_v2_application_core.Core.getStore().dispatch('chats/clearMarkedChats'), () => im_v2_application_core.Core.getStore().dispatch('messages/anchors/removeAllAnchors')];

	class CounterManager {
		static #instance;
		#store;
		#emitCountersUpdateWithDebounce;
		static getInstance() {
			if (!this.#instance) {
				this.#instance = new this();
			}
			return this.#instance;
		}
		constructor() {
			this.#store = im_v2_application_core.Core.getStore();
			this.#emitCountersUpdateWithDebounce = main_core.Runtime.debounce(this.#emitCountersUpdate, 0, this);
			void this.#init();
		}
		static init() {
			CounterManager.getInstance();
		}
		static getCounterDisplayLimit() {
			const settings = main_core.Extension.getSettings('im.v2.lib.counter');
			return settings.get('counterDisplayLimit');
		}
		static formatCounter(counter) {
			if (counter >= CounterManager.getCounterDisplayLimit()) {
				return '99+';
			}
			return String(counter);
		}
		static clearCountersByRecentType(recentType, parentChatId) {
			RecentTypeClearHandlers.forEach(handler => {
				void handler(recentType, parentChatId);
			});
		}
		static clearAllCounters() {
			CounterClearActions.forEach(actionHandler => {
				void actionHandler();
			});
		}
		emitCounters() {
			this.#emitCountersUpdate();
		}
		removeBrowserTitleCounter() {
			const regexp = /^(?<counterWithWhitespace>\(\d+\)\s).*/;
			const matchResult = document.title.match(regexp);
			if (!matchResult?.groups.counterWithWhitespace) {
				return;
			}
			const counterPrefixLength = matchResult.groups.counterWithWhitespace;
			document.title = document.title.slice(counterPrefixLength);
		}
		async #init() {
			const {
				counters,
				notificationCounter
			} = im_v2_application_core.Core.getApplicationData();
			im_v2_lib_logger.Logger.warn('CounterManager: counters', counters);
			await this.#store.dispatch('counters/setCounters', counters);
			void this.#store.dispatch('notifications/setCounter', notificationCounter);
			const initialChatCounter = this.#store.getters['counters/getTotalChatCounter'];
			const initialNotificationCounter = notificationCounter;
			this.#emitCountersUpdate();
			this.#subscribeToCountersChange();
			this.#emitLegacyChatCounterUpdate(initialChatCounter);
			this.#emitLegacyNotificationCounterUpdate(initialNotificationCounter);
			this.#onTotalCounterChange();
		}
		#subscribeToCountersChange() {
			this.#store.watch(notificationCounterWatch, newValue => {
				this.#emitLegacyNotificationCounterUpdate(newValue);
				this.#emitCountersUpdateWithDebounce();
				this.#onTotalCounterChange();
			});
			this.#store.watch(chatCounterWatch, newValue => {
				this.#emitLegacyChatCounterUpdate(newValue);
				this.#emitCountersUpdateWithDebounce();
				this.#onTotalCounterChange();
			});
			this.#store.watch(linesCounterWatch, () => {
				this.#emitCountersUpdateWithDebounce();
				this.#onTotalCounterChange();
			});
			this.#store.watch(copilotCounterWatch, () => this.#emitCountersUpdateWithDebounce());
			this.#store.watch(collabCounterWatch, () => this.#emitCountersUpdateWithDebounce());
			this.#store.watch(taskCounterWatch, () => this.#emitCountersUpdateWithDebounce());
		}
		#emitLegacyNotificationCounterUpdate(notificationsCounter) {
			const event = new main_core_events.BaseEvent({
				compatData: [notificationsCounter]
			});
			main_core_events.EventEmitter.emit(window, im_v2_const.EventType.counter.onNotificationCounterChange, event);
		}
		#emitLegacyChatCounterUpdate(chatCounter) {
			const event = new main_core_events.BaseEvent({
				compatData: [chatCounter]
			});
			main_core_events.EventEmitter.emit(window, im_v2_const.EventType.counter.onChatCounterChange, event);
		}
		#emitCountersUpdate() {
			const payload = {
				[im_v2_const.NavigationMenuItem.chat]: this.#store.getters['counters/getTotalChatCounter'],
				[im_v2_const.NavigationMenuItem.copilot]: this.#store.getters['counters/getTotalCopilotCounter'],
				[im_v2_const.NavigationMenuItem.collab]: this.#store.getters['counters/getTotalCollabCounter'],
				[im_v2_const.NavigationMenuItem.tasksTask]: this.#store.getters['counters/getTotalTaskCounter'],
				[im_v2_const.NavigationMenuItem.openlines]: this.#store.getters['counters/getTotalLinesCounter'],
				[im_v2_const.NavigationMenuItem.openlinesV2]: this.#store.getters['counters/getTotalLinesCounter'],
				[im_v2_const.NavigationMenuItem.notification]: this.#store.getters['notifications/getCounter']
			};
			im_v2_lib_logger.Logger.warn('CounterManager: Emitting IM.Counters:onUpdate', payload);
			main_core_events.EventEmitter.emit(im_v2_const.EventType.counter.onUpdate, payload);
		}
		#onTotalCounterChange() {
			const notificationCounter = this.#store.getters['notifications/getCounter'];
			const chatCounter = this.#store.getters['counters/getTotalChatCounter'];
			const linesCounter = this.#store.getters['counters/getTotalLinesCounter'];
			const totalCounter = notificationCounter + chatCounter + linesCounter;
			if (im_v2_lib_desktop.DesktopManager.getInstance().isDesktopActive()) {
				return;
			}
			updateBrowserTitleCounter(totalCounter);
		}
	}
	const notificationCounterWatch = (state, getters) => getters['notifications/getCounter'];
	const chatCounterWatch = (state, getters) => getters['counters/getTotalChatCounter'];
	const linesCounterWatch = (state, getters) => getters['counters/getTotalLinesCounter'];
	const copilotCounterWatch = (state, getters) => getters['counters/getTotalCopilotCounter'];
	const collabCounterWatch = (state, getters) => getters['counters/getTotalCollabCounter'];
	const taskCounterWatch = (state, getters) => getters['counters/getTotalTaskCounter'];

	exports.CounterClearActions = CounterClearActions;
	exports.CounterManager = CounterManager;
	exports.RecentTypeClearHandlers = RecentTypeClearHandlers;

})(this.BX.Messenger.v2.Lib = this.BX.Messenger.v2.Lib || {}, BX.Event, BX, BX.Messenger.v2.Application, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib, BX.Messenger.v2.Const);
//# sourceMappingURL=counter.bundle.js.map
