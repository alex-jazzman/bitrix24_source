import { EventEmitter, BaseEvent } from 'main.core.events';
import { Extension, Runtime } from 'main.core';

import { Core } from 'im.v2.application.core';
import { DesktopManager } from 'im.v2.lib.desktop';
import { Logger } from 'im.v2.lib.logger';
import { EventType, NavigationMenuItem } from 'im.v2.const';

import { updateBrowserTitleCounter } from './helpers/update-browser-title-counter';

import type { SettingsCollection } from 'main.core.collections';
import type { Store } from 'ui.vue3.vuex';

export { CounterClearHandlersByChatType, CounterClearActions } from './const/const';

type NavigationCountersPayload = {
	chat: number;
	copilot: number;
	collab: number;
	task: number;
	openlines: number;
	openlinesV2: number;
	notification: number;
};

export class CounterManager
{
	static #instance: CounterManager;

	#store: Store;
	#emitCountersUpdateWithDebounce: Function;

	static getInstance(): CounterManager
	{
		if (!this.#instance)
		{
			this.#instance = new this();
		}

		return this.#instance;
	}

	constructor()
	{
		this.#store = Core.getStore();
		this.#emitCountersUpdateWithDebounce = Runtime.debounce(this.#emitCountersUpdate, 0, this);

		void this.#init();
	}

	static init()
	{
		CounterManager.getInstance();
	}

	static getCounterDisplayLimit(): number
	{
		const settings: SettingsCollection = Extension.getSettings('im.v2.lib.counter');

		return settings.get('counterDisplayLimit');
	}

	static formatCounter(counter: number): string
	{
		if (counter >= CounterManager.getCounterDisplayLimit())
		{
			return '99+';
		}

		return String(counter);
	}

	emitCounters()
	{
		this.#emitCountersUpdate();
	}

	removeBrowserTitleCounter()
	{
		const regexp = /^(?<counterWithWhitespace>\(\d+\)\s).*/;
		const matchResult: ?RegExpMatchArray = document.title.match(regexp);
		if (!matchResult?.groups.counterWithWhitespace)
		{
			return;
		}

		const counterPrefixLength = matchResult.groups.counterWithWhitespace;
		document.title = document.title.slice(counterPrefixLength);
	}

	async #init()
	{
		const { counters, notificationCounter } = Core.getApplicationData();
		Logger.warn('CounterManager: counters', counters);

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

	#subscribeToCountersChange()
	{
		this.#store.watch(notificationCounterWatch, (newValue: number) => {
			this.#emitLegacyNotificationCounterUpdate(newValue);
			this.#emitCountersUpdateWithDebounce();
			this.#onTotalCounterChange();
		});

		this.#store.watch(chatCounterWatch, (newValue: number) => {
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

	#emitLegacyNotificationCounterUpdate(notificationsCounter: number)
	{
		const event = new BaseEvent({ compatData: [notificationsCounter] });
		EventEmitter.emit(window, EventType.counter.onNotificationCounterChange, event);
	}

	#emitLegacyChatCounterUpdate(chatCounter: number)
	{
		const event = new BaseEvent({ compatData: [chatCounter] });
		EventEmitter.emit(window, EventType.counter.onChatCounterChange, event);
	}

	#emitCountersUpdate()
	{
		const payload: NavigationCountersPayload = {
			[NavigationMenuItem.chat]: this.#store.getters['counters/getTotalChatCounter'],
			[NavigationMenuItem.copilot]: this.#store.getters['counters/getTotalCopilotCounter'],
			[NavigationMenuItem.collab]: this.#store.getters['counters/getTotalCollabCounter'],
			[NavigationMenuItem.tasksTask]: this.#store.getters['counters/getTotalTaskCounter'],
			[NavigationMenuItem.openlines]: this.#store.getters['counters/getTotalLinesCounter'],
			[NavigationMenuItem.openlinesV2]: this.#store.getters['counters/getTotalLinesCounter'],
			[NavigationMenuItem.notification]: this.#store.getters['notifications/getCounter'],
		};

		Logger.warn('CounterManager: Emitting IM.Counters:onUpdate', payload);
		EventEmitter.emit(EventType.counter.onUpdate, payload);
	}

	#onTotalCounterChange()
	{
		const notificationCounter = this.#store.getters['notifications/getCounter'];
		const chatCounter = this.#store.getters['counters/getTotalChatCounter'];
		const linesCounter = this.#store.getters['counters/getTotalLinesCounter'];
		const totalCounter = notificationCounter + chatCounter + linesCounter;

		if (DesktopManager.getInstance().isDesktopActive())
		{
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
