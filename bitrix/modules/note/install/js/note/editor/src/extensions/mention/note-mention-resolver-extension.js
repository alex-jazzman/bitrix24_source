import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { EventEmitter } from 'main.core.events';
import { NoteEvent } from 'note.sidebar';
import {
	createMentionSnapshot,
	MENTION_BATCH_LIMIT,
	resolveMentionsBatch,
} from '../../utils/resolve-mentions';
import { DocumentMentionLabelCache } from './document-mention-label-cache';

export const MENTION_RESOLVER_KEY = new PluginKey('noteMentionResolver');

const RESOLVE_DEBOUNCE_MS = 200;
const RESOLVE_MAX_WAIT_MS = 1000;
const RESOLVE_RETRY_MS = 3000;
const RESOLVE_RETRY_MAX_MS = 60_000;

const Freshness = Object.freeze({
	PENDING: 'pending',
	FRESH: 'fresh',
	STALE: 'stale',
});

function collectMentionState(doc: Object): Object
{
	const items = [];
	const presentKeys = new Set();
	const historicalDocumentLabels = new Map();
	doc.descendants((node) => {
		const { entityType, entityId, label } = node.attrs ?? {};
		const id = Number(entityId);
		if (node.type.name !== 'noteMention' || !entityType || !Number.isInteger(id) || id <= 0)
		{
			return;
		}

		const key = `document:${id}`;
		if (
			entityType === 'document'
			&& typeof label === 'string'
			&& label.trim() !== ''
			&& !historicalDocumentLabels.has(key)
		)
		{
			historicalDocumentLabels.set(key, label);
		}

		const mentionKey = `${entityType}:${id}`;
		if (!presentKeys.has(mentionKey))
		{
			presentKeys.add(mentionKey);
			items.push({ type: entityType, id });
		}
	});

	return { items, presentKeys, historicalDocumentLabels };
}

export class MentionProjection
{
	#entries: Map<string, Object> = new Map();
	#listeners: Map<string, Set<Function>> = new Map();
	#presentKeys: Set<string> = new Set();
	#invalidateHandler: ?Function = null;
	#subscribeHandler: ?Function = null;

	get(key: string): ?Object
	{
		return this.#entries.get(key)?.snapshot ?? null;
	}

	getFresh(key: string): ?Object
	{
		const entry = this.#entries.get(key);

		return entry?.freshness === Freshness.FRESH ? entry.snapshot : null;
	}

	subscribe(key: string, listener: Function): Function
	{
		if (!this.#listeners.has(key))
		{
			this.#listeners.set(key, new Set());
		}

		if (!this.#entries.has(key))
		{
			this.#entries.set(key, {
				snapshot: null,
				freshness: Freshness.PENDING,
				revision: 0,
			});
		}

		this.#listeners.get(key).add(listener);
		this.#subscribeHandler?.(key);
		listener(this.get(key));

		return () => {
			const listeners = this.#listeners.get(key);
			listeners?.delete(listener);
			if (listeners?.size === 0)
			{
				this.#listeners.delete(key);
			}
		};
	}

	replace(key: string, snapshot: Object): boolean
	{
		return this.replaceIfCurrent(key, snapshot, null);
	}

	hydratePending(key: string, snapshot: Object): boolean
	{
		const entry = this.#entries.get(key);
		if (!entry || entry.snapshot !== null)
		{
			return false;
		}

		entry.snapshot = snapshot;
		entry.freshness = Freshness.PENDING;
		this.#notify(key);

		return true;
	}

	replaceIfCurrent(key: string, snapshot: Object, revision: ?number): boolean
	{
		const entry = this.#entries.get(key);
		if (!entry || !this.#presentKeys.has(key) || (revision !== null && entry.revision !== revision))
		{
			return false;
		}

		entry.snapshot = snapshot;
		entry.freshness = Freshness.FRESH;
		this.#notify(key);

		return true;
	}

	invalidate(key: string): void
	{
		if (!this.#listeners.has(key))
		{
			return;
		}

		const entry = this.#entries.get(key);
		if (!entry)
		{
			return;
		}

		entry.freshness = Freshness.STALE;
		entry.revision += 1;
		this.#invalidateHandler?.(key);
	}

	setPresentKeys(keys: Set<string>): void
	{
		this.#presentKeys = new Set(keys);

		for (const key of this.#entries.keys())
		{
			if (!this.#presentKeys.has(key))
			{
				this.#entries.delete(key);
			}
		}

		for (const key of this.#presentKeys)
		{
			if (!this.#entries.has(key))
			{
				this.#entries.set(key, {
					snapshot: null,
					freshness: Freshness.PENDING,
					revision: 0,
				});
			}
		}
	}

	getPendingKeys(): string[]
	{
		return [...this.#presentKeys].filter((key) => {
			return this.#entries.get(key)?.freshness !== Freshness.FRESH;
		});
	}

	getRevision(key: string): number
	{
		return this.#entries.get(key)?.revision ?? -1;
	}

	setInvalidateHandler(handler: ?Function): void
	{
		this.#invalidateHandler = handler;
	}

	getSubscribedKeys(): string[]
	{
		return [...this.#listeners.keys()];
	}

	setSubscribeHandler(handler: ?Function): void
	{
		this.#subscribeHandler = handler;
	}

	destroy(): void
	{
		this.#invalidateHandler = null;
		this.#subscribeHandler = null;
		this.#entries.clear();
		this.#listeners.clear();
		this.#presentKeys.clear();
	}

	#notify(key: string): void
	{
		const snapshot = this.get(key);
		for (const listener of this.#listeners.get(key) ?? [])
		{
			listener(snapshot);
		}
	}
}

function getCachedDocumentSnapshot(labelCache: ?Object, key: string): ?Object
{
	const [type, rawId] = key.split(':');
	const id = Number(rawId);
	if (type !== 'document' || !Number.isInteger(id) || id <= 0)
	{
		return null;
	}

	const cachedSnapshot = labelCache?.get(id);
	if (!cachedSnapshot)
	{
		return null;
	}

	return createMentionSnapshot({
		type: 'document',
		label: cachedSnapshot.label,
		available: cachedSnapshot.available,
	});
}

function createMentionProjectionStorage(): Object
{
	const projection = new MentionProjection();

	return {
		get: (key) => projection.get(key),
		getFresh: (key) => projection.getFresh(key),
		subscribe: (key, listener) => projection.subscribe(key, listener),
		replace: (key, snapshot) => projection.replace(key, snapshot),
		hydratePending: (key, snapshot) => projection.hydratePending(key, snapshot),
		replaceIfCurrent: (key, snapshot, revision) => projection.replaceIfCurrent(key, snapshot, revision),
		invalidate: (key) => projection.invalidate(key),
		setPresentKeys: (keys) => projection.setPresentKeys(keys),
		getPendingKeys: () => projection.getPendingKeys(),
		getRevision: (key) => projection.getRevision(key),
		setInvalidateHandler: (handler) => projection.setInvalidateHandler(handler),
		getSubscribedKeys: () => projection.getSubscribedKeys(),
		setSubscribeHandler: (handler) => projection.setSubscribeHandler(handler),
		destroy: () => projection.destroy(),
	};
}

export class MentionResolver
{
	#view: Object;
	#projection: MentionProjection;
	#resolveBatch: Function;
	#eventEmitter: Object;
	#noteEvent: Object;
	#setTimer: Function;
	#clearTimer: Function;
	#labelCache: ?Object;
	#historicalDocumentLabels: Map<string, string> = new Map();
	#timer: mixed = null;
	#retryTimer: mixed = null;
	#retryAttempt: number = 0;
	#retryPending: boolean = false;
	#running: boolean = false;
	#dirty: boolean = false;
	#firstScheduleAt: ?number = null;
	#destroyed: boolean = false;

	constructor({
		view,
		projection,
		resolveBatch = resolveMentionsBatch,
		eventEmitter = EventEmitter,
		noteEvent = NoteEvent,
		setTimer = (handler, delay) => setTimeout(handler, delay),
		clearTimer = (timer) => clearTimeout(timer),
		labelCache = null,
	}: Object)
	{
		this.#view = view;
		this.#projection = projection;
		this.#resolveBatch = resolveBatch;
		this.#eventEmitter = eventEmitter;
		this.#noteEvent = noteEvent;
		this.#setTimer = setTimer;
		this.#clearTimer = clearTimer;
		this.#labelCache = labelCache;
	}

	start(): void
	{
		this.#eventEmitter.subscribe(this.#noteEvent.DOCUMENT_RENAMED, this.#handleDocumentRenamed);
		this.#eventEmitter.subscribe(this.#noteEvent.PULL_EVENT, this.#handlePullEvent);
		if (typeof document !== 'undefined')
		{
			document.addEventListener('visibilitychange', this.#handleVisibilityChange);
		}
		this.#projection.setInvalidateHandler(() => this.schedule());
		this.#projection.setSubscribeHandler((key) => this.#hydrateCachedDocument(key));
		for (const key of this.#projection.getSubscribedKeys())
		{
			this.#hydrateCachedDocument(key);
		}
		this.schedule();
	}

	update(view: Object, prevState: Object): void
	{
		this.#view = view;
		if (view.state.doc !== prevState.doc)
		{
			this.schedule();
		}
	}

	async runNow(): Promise<void>
	{
		if (this.#timer !== null)
		{
			this.#clearTimer(this.#timer);
			this.#timer = null;
		}

		await this.#run();
	}

	schedule(): void
	{
		if (this.#destroyed)
		{
			return;
		}

		if (this.#timer !== null)
		{
			this.#clearTimer(this.#timer);
		}
		if (this.#firstScheduleAt === null)
		{
			this.#firstScheduleAt = Date.now();
		}

		const elapsed = Date.now() - this.#firstScheduleAt;
		const delay = Math.min(RESOLVE_DEBOUNCE_MS, Math.max(0, RESOLVE_MAX_WAIT_MS - elapsed));
		this.#timer = this.#setTimer(() => {
			this.#timer = null;

			return this.#run();
		}, delay);
	}

	destroy(): void
	{
		this.#destroyed = true;
		this.#eventEmitter.unsubscribe(this.#noteEvent.DOCUMENT_RENAMED, this.#handleDocumentRenamed);
		this.#eventEmitter.unsubscribe(this.#noteEvent.PULL_EVENT, this.#handlePullEvent);
		if (typeof document !== 'undefined')
		{
			document.removeEventListener('visibilitychange', this.#handleVisibilityChange);
		}
		this.#projection.setInvalidateHandler(null);
		this.#projection.setSubscribeHandler(null);

		if (this.#timer !== null)
		{
			this.#clearTimer(this.#timer);
			this.#timer = null;
		}
		if (this.#retryTimer !== null)
		{
			this.#clearTimer(this.#retryTimer);
			this.#retryTimer = null;
		}

	}

	#hydrateCachedDocument(key: string): void
	{
		const cachedSnapshot = getCachedDocumentSnapshot(this.#labelCache, key);
		if (cachedSnapshot)
		{
			this.#projection.hydratePending(key, cachedSnapshot);
		}
	}

	async #run(): Promise<void>
	{
		if (this.#destroyed)
		{
			return;
		}
		if (this.#running)
		{
			this.#dirty = true;

			return;
		}

		this.#running = true;
		this.#dirty = false;
		this.#firstScheduleAt = null;

		try
		{
			const { items: presentItems, presentKeys, historicalDocumentLabels } = collectMentionState(
				this.#view.state.doc,
			);
			this.#historicalDocumentLabels = historicalDocumentLabels;
			this.#projection.setPresentKeys(presentKeys);
			for (const { type, id } of presentItems)
			{
				this.#hydrateCachedDocument(`${type}:${id}`);
			}

			const pendingKeys = new Set(this.#projection.getPendingKeys());
			const items = presentItems
				.filter(({ type, id }) => pendingKeys.has(`${type}:${id}`))
				.slice(0, MENTION_BATCH_LIMIT)
			;

			if (items.length === 0)
			{
				this.#resetRetry();

				return;
			}

			const revisions = new Map(
				items.map(({ type, id }) => {
					const key = `${type}:${id}`;

					return [key, this.#projection.getRevision(key)];
				}),
			);
			const resolvedMap = await this.#resolveBatch(items);
			if (this.#destroyed)
			{
				return;
			}

			if (resolvedMap === null)
			{
				this.#scheduleRetry();

				return;
			}

			this.#resetRetry();

			const resolvedDocumentSnapshots = new Map();
			for (const { type, id } of items)
			{
				const key = `${type}:${id}`;
				const resolvedMention = resolvedMap.get(key);
				const fallbackLabel = type === 'document'
					? this.#projection.get(key)?.label ?? this.#historicalDocumentLabels.get(key) ?? null
					: null
				;
				const snapshot = createMentionSnapshot(resolvedMention, fallbackLabel);
				const replaced = this.#projection.replaceIfCurrent(
					key,
					snapshot,
					revisions.get(key),
				);
				if (
					replaced
					&& type === 'document'
					&& (
						snapshot.available === false
						|| (typeof snapshot.label === 'string' && snapshot.label.trim() !== '')
					)
				)
				{
					resolvedDocumentSnapshots.set(id, {
						label: snapshot.label,
						available: snapshot.available,
					});
				}
			}
			this.#labelCache?.setMany(resolvedDocumentSnapshots);

			if (this.#projection.getPendingKeys().length > 0)
			{
				this.schedule();
			}
		}
		finally
		{
			this.#running = false;
			if (this.#dirty)
			{
				this.schedule();
			}
		}
	}

	#scheduleRetry(): void
	{
		if (this.#destroyed || this.#retryTimer !== null)
		{
			return;
		}
		if (this.#isDocumentHidden())
		{
			this.#retryPending = true;

			return;
		}

		const delay = Math.min(RESOLVE_RETRY_MS * (2 ** this.#retryAttempt), RESOLVE_RETRY_MAX_MS);
		this.#retryAttempt += 1;
		this.#retryTimer = this.#setTimer(() => {
			this.#retryTimer = null;
			if (this.#isDocumentHidden())
			{
				this.#retryPending = true;

				return;
			}

			return this.#run();
		}, delay);
	}

	#resetRetry(): void
	{
		this.#retryAttempt = 0;
		this.#retryPending = false;
		if (this.#retryTimer !== null)
		{
			this.#clearTimer(this.#retryTimer);
			this.#retryTimer = null;
		}
	}

	#invalidateDocument(documentId: mixed): void
	{
		const id = Number(documentId);
		if (Number.isInteger(id) && id > 0)
		{
			this.#projection.invalidate(`document:${id}`);
		}
	}

	#invalidateDocuments(documentIds: mixed): void
	{
		if (!Array.isArray(documentIds))
		{
			return;
		}

		for (const documentId of documentIds)
		{
			this.#invalidateDocument(documentId);
		}
	}

	#invalidateAllDocuments(): void
	{
		for (const key of this.#projection.getSubscribedKeys())
		{
			if (key.startsWith('document:'))
			{
				this.#projection.invalidate(key);
			}
		}
	}

	#invalidateFromPullParams(params: Object): void
	{
		if (params?.requestRefetch === true)
		{
			this.#invalidateAllDocuments();

			return;
		}

		this.#invalidateDocument(params?.documentId);
		this.#invalidateDocuments(params?.documentIds);
	}

	#handleDocumentRenamed = (event: Object): void => {
		this.#invalidateDocument(event.getData()?.id);
	};

	#handlePullEvent = (event: Object): void => {
		const { command, params } = event.getData() ?? {};
		if (
			command === 'documentUpdate'
			|| command === 'documentMentionTargetChanged'
			|| command === 'documentAccessCascade'
		)
		{
			this.#invalidateFromPullParams(params);
		}
	};

	#handleVisibilityChange = (): void => {
		if (!this.#isDocumentHidden() && this.#retryPending)
		{
			this.#retryPending = false;
			this.schedule();
		}
	};

	#isDocumentHidden(): boolean
	{
		return typeof document !== 'undefined' && document.hidden === true;
	}
}

export const NoteMentionResolverExtension = Extension.create({
	name: 'noteMentionResolver',

	addOptions()
	{
		return {
			currentUserId: 0,
			labelCache: null,
		};
	},

	addStorage()
	{
		return createMentionProjectionStorage();
	},

	onDestroy()
	{
		this.storage.destroy();
	},

	addProseMirrorPlugins()
	{
		const { editor, options } = this;
		const labelCache = options.labelCache
			?? new DocumentMentionLabelCache({ userId: options.currentUserId })
		;

		return [
			new Plugin({
				key: MENTION_RESOLVER_KEY,

				view(view)
				{
					const resolver = new MentionResolver({
						view,
						projection: editor.storage.noteMentionResolver,
						labelCache,
					});
					resolver.start();

					return {
						update: (updatedView, prevState) => resolver.update(updatedView, prevState),
						destroy: () => resolver.destroy(),
					};
				},
			}),
		];
	},
});
