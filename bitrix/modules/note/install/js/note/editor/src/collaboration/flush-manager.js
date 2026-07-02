import { Event } from 'main.core';
import * as Y from 'yjs';
import { DocumentService } from '../application/document-service';
import { PatchPersistence } from './patch-persistence';
import { uint8ArrayToBase64, base64ToUint8Array } from '../utils/binary';
import { FLUSH_DEBOUNCE_MS, FLUSH_MAX_INTERVAL_MS } from '../const';

export class FlushManager
{
	#documentId: number;
	#document: Object | null;
	#getCursorPosition: (() => Object | null) | null;
	#pendingUpdates: Uint8Array[];
	#flushDebounceTimer: number | null;
	#flushMaxTimer: number | null;
	#updateHandler: Function | null;
	#beforeUnloadHandler: Function | null;
	#isFlushing: boolean;
	#hasRecentEdits: boolean;

	constructor({ documentId }: { documentId: number })
	{
		this.#documentId = documentId;
		this.#document = null;
		this.#getCursorPosition = null;
		this.#pendingUpdates = [];
		this.#flushDebounceTimer = null;
		this.#flushMaxTimer = null;
		this.#updateHandler = null;
		this.#beforeUnloadHandler = null;
		this.#isFlushing = false;
		this.#hasRecentEdits = false;
	}

	start({ document, getCursorPosition }: {
		document: Object,
		getCursorPosition: () => Object | null,
	}): void
	{
		this.#stopDocUpdates();
		this.#document = document;
		this.#getCursorPosition = getCursorPosition;

		this.#updateHandler = (update: Uint8Array, origin: mixed) => {
			if (origin === 'remote')
			{
				return;
			}

			this.#pendingUpdates.push(update);
			this.#hasRecentEdits = true;
			this.#scheduleFlush();
		};

		this.#document.on('update', this.#updateHandler);
	}

	stop(): void
	{
		this.#stopDocUpdates();
		this.#clearTimers();

		if (this.#pendingUpdates.length > 0)
		{
			this.#persistPendingUpdates();
			void this.flush();
		}
	}

	async flush(): Promise<void>
	{
		if (this.#isFlushing || this.#pendingUpdates.length === 0)
		{
			return;
		}

		this.#isFlushing = true;
		const updates = this.#pendingUpdates.splice(0);

		try
		{
			const merged = Y.mergeUpdates(updates);
			const base64Patch = uint8ArrayToBase64(merged);
			const cursor = this.#getCursorPosition ? this.#getCursorPosition() : null;

			await DocumentService.savePatch({
				documentId: this.#documentId,
				patch: base64Patch,
				cursor,
			});

			PatchPersistence.clear(this.#documentId);
		}
		catch
		{
			this.#pendingUpdates.unshift(...updates);
			this.#persistPendingUpdates();
		}
		finally
		{
			this.#isFlushing = false;
			this.#hasRecentEdits = false;
		}

		if (this.#flushMaxTimer !== null)
		{
			clearTimeout(this.#flushMaxTimer);
			this.#flushMaxTimer = null;
		}
	}

	hasPendingUpdates(): boolean
	{
		return this.#hasRecentEdits || this.#pendingUpdates.length > 0 || this.#isFlushing;
	}

	async sendPersistedPatches(document: Object): Promise<void>
	{
		const patch = PatchPersistence.load(this.#documentId);
		if (patch === null)
		{
			return;
		}

		try
		{
			if (document)
			{
				Y.applyUpdate(document, base64ToUint8Array(patch), 'remote');
			}

			await DocumentService.savePatch({
				documentId: this.#documentId,
				patch,
			});
			PatchPersistence.clear(this.#documentId);
		}
		catch
		{
			// Failed to send — patches stay in localStorage for next reconnect
		}
	}

	registerBeforeUnload(): void
	{
		this.unregisterBeforeUnload();
		this.#beforeUnloadHandler = () => {
			this.#persistPendingUpdates();
		};
		Event.bind(window, 'beforeunload', this.#beforeUnloadHandler);
	}

	unregisterBeforeUnload(): void
	{
		if (this.#beforeUnloadHandler)
		{
			Event.unbind(window, 'beforeunload', this.#beforeUnloadHandler);
			this.#beforeUnloadHandler = null;
		}
	}

	destroy(): void
	{
		this.stop();
		this.unregisterBeforeUnload();
	}

	#scheduleFlush(): void
	{
		if (this.#flushDebounceTimer !== null)
		{
			clearTimeout(this.#flushDebounceTimer);
		}

		this.#flushDebounceTimer = setTimeout(() => {
			this.#flushDebounceTimer = null;
			void this.flush();
		}, FLUSH_DEBOUNCE_MS);

		if (this.#flushMaxTimer === null)
		{
			this.#flushMaxTimer = setTimeout(() => {
				this.#flushMaxTimer = null;
				if (this.#flushDebounceTimer !== null)
				{
					clearTimeout(this.#flushDebounceTimer);
					this.#flushDebounceTimer = null;
				}

				void this.flush();
			}, FLUSH_MAX_INTERVAL_MS);
		}
	}

	#persistPendingUpdates(): void
	{
		if (this.#pendingUpdates.length === 0)
		{
			return;
		}

		try
		{
			const merged = Y.mergeUpdates(this.#pendingUpdates);
			const base64Patch = uint8ArrayToBase64(merged);
			PatchPersistence.save(this.#documentId, base64Patch);
		}
		catch
		{
			// localStorage write failed — patches remain in memory
		}
	}

	#stopDocUpdates(): void
	{
		if (this.#updateHandler && this.#document)
		{
			this.#document.off('update', this.#updateHandler);
			this.#updateHandler = null;
		}
	}

	#clearTimers(): void
	{
		if (this.#flushDebounceTimer !== null)
		{
			clearTimeout(this.#flushDebounceTimer);
			this.#flushDebounceTimer = null;
		}

		if (this.#flushMaxTimer !== null)
		{
			clearTimeout(this.#flushMaxTimer);
			this.#flushMaxTimer = null;
		}
	}
}
