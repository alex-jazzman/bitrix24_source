import { Text, Type } from 'main.core';
import { EventEmitter } from 'main.core.events';

import { EventName } from 'tasks.v2.const';
import { resultMessageService } from 'tasks.v2.provider.service.result-message-service';

import { StateStatus, type HydrateOptions, type ResultEvent, type ResultMessageMap, type StateEntry, type StateStatusValue } from './types';

class StateController
{
	#cache: Map<number, StateEntry> = new Map();
	#subscriptions: Map<string, (event: ResultEvent) => void> = new Map();
	#retainCount: number = 0;

	retain(): void
	{
		this.#retainCount++;
		this.#subscribe();
	}

	release(): void
	{
		if (this.#retainCount === 0)
		{
			return;
		}

		this.#retainCount--;
		if (this.#retainCount === 0)
		{
			this.#unsubscribe();
		}
	}

	hydrate(taskId: number, options: HydrateOptions = {}): Promise<ResultMessageMap>
	{
		const normalizedTaskId = Text.toInteger(taskId);
		const entry = this.#getOrCreateEntry(normalizedTaskId);

		if (!options.force)
		{
			if (entry.status === StateStatus.Loading && entry.promise)
			{
				return entry.promise;
			}

			if (entry.status === StateStatus.Loaded)
			{
				return Promise.resolve(entry.map);
			}
		}

		return this.#load(normalizedTaskId, entry, options.force ? ++entry.revision : entry.revision);
	}

	#load(taskId: number, entry: StateEntry, revision: number): Promise<ResultMessageMap>
	{
		const stateEntry = entry;

		stateEntry.status = StateStatus.Loading;
		const promise = resultMessageService
			.getCurrentUserMap(taskId)
			.then((data) => {
				// a newer force hydrate is in flight: drop the stale response
				if (revision !== stateEntry.revision)
				{
					return stateEntry.map;
				}

				stateEntry.map = this.#normalizeMap(data);
				stateEntry.status = StateStatus.Loaded;
				stateEntry.promise = null;

				return stateEntry.map;
			})
			.catch((error) => {
				console.error('ResultMessageMenu.StateController.hydrate error', error);

				if (revision !== stateEntry.revision)
				{
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

	getStatus(taskId: number): StateStatusValue
	{
		return this.#cache.get(Text.toInteger(taskId))?.status ?? StateStatus.Idle;
	}

	isTracked(taskId: number): boolean
	{
		return this.#cache.has(Text.toInteger(taskId));
	}

	getMessageResultId(taskId: number, messageId: number): number
	{
		const entry = this.#cache.get(Text.toInteger(taskId));
		if (!entry)
		{
			return 0;
		}

		return Text.toInteger(entry.map[Text.toInteger(messageId)]);
	}

	setMessageResultId(taskId: number, messageId: number, resultId: number): void
	{
		const entry = this.#getOrCreateEntry(Text.toInteger(taskId));
		entry.status = StateStatus.Loaded;
		entry.promise = null;

		const normalizedMessageId = Text.toInteger(messageId);
		const normalizedResultId = Text.toInteger(resultId);

		if (normalizedResultId > 0)
		{
			entry.map[normalizedMessageId] = normalizedResultId;

			return;
		}

		delete entry.map[normalizedMessageId];
	}

	removeResultId(taskId: number, resultId: number): void
	{
		const entry = this.#cache.get(Text.toInteger(taskId));
		if (!entry)
		{
			return;
		}

		const normalizedResultId = Text.toInteger(resultId);
		Object.entries(entry.map).forEach(([messageId, messageResultId]) => {
			if (Text.toInteger(messageResultId) === normalizedResultId)
			{
				delete entry.map[messageId];
			}
		});
	}

	evict(taskId: number): void
	{
		this.#cache.delete(Text.toInteger(taskId));
	}

	dispose(): void
	{
		this.#unsubscribe();
		this.#cache.clear();
		this.#retainCount = 0;
	}

	#getOrCreateEntry(taskId: number): StateEntry
	{
		if (!this.#cache.has(taskId))
		{
			this.#cache.set(taskId, {
				status: StateStatus.Idle,
				map: {},
				promise: null,
				revision: 0,
			});
		}

		return this.#cache.get(taskId) as StateEntry;
	}

	#normalizeMap(data: unknown): ResultMessageMap
	{
		if (!Type.isPlainObject(data))
		{
			return {};
		}

		const map: ResultMessageMap = {};
		Object.entries(data).forEach(([messageId, resultId]) => {
			const normalizedMessageId = Text.toInteger(messageId);
			const normalizedResultId = Text.toInteger(resultId);

			if (normalizedMessageId > 0 && normalizedResultId > 0)
			{
				map[normalizedMessageId] = normalizedResultId;
			}
		});

		return map;
	}

	#subscribe(): void
	{
		if (this.#subscriptions.size > 0)
		{
			return;
		}

		[
			EventName.ResultFromMessageAdded,
			EventName.ResultSuccessfulDeleted,
		].forEach((eventName) => {
			this.#subscriptions.set(eventName, this.#handleResultEvent);
			EventEmitter.subscribe(eventName, this.#handleResultEvent);
		});
	}

	#unsubscribe(): void
	{
		this.#subscriptions.forEach((handler, eventName) => {
			EventEmitter.unsubscribe(eventName, handler);
		});
		this.#subscriptions.clear();
	}

	#handleResultEvent = (event: ResultEvent): void => {
		const taskId = Text.toInteger(event.getData()?.taskId);
		if (taskId <= 0 || !this.#cache.has(taskId))
		{
			return;
		}

		void this.hydrate(taskId, { force: true });
	};
}

export const stateController = new StateController();
