import { Event, Type } from 'main.core';
import * as Y from 'yjs';
import { DocumentService } from '../application/document-service';
import { PatchPersistence } from './patch-persistence';
import { readBaselineCursor } from './baseline-cursor';
import { uint8ArrayToBase64, base64ToUint8Array } from '../utils/binary';
import { crc32Utf8 } from '../utils/checksum';
import { FLUSH_DEBOUNCE_MS, FLUSH_MAX_INTERVAL_MS } from '../const';

// How many send passes settle() is allowed before it declares the document unsettled. Each pass is one
// round trip, and every pass but the last exists only to pick up what was typed during the previous
// one — three is plenty for a human typist and still bounds a caller that must not hang.
const SETTLE_MAX_PASSES = 3;

// Server-side code for "this document is not collaborative any more" (DocumentUpdateRepository).
// It marks the one patch failure that no retry can fix. Deliberately the only code the rescue path hangs
// on: the archived, trashed and missing states have codes of their own there, and each of them is a
// lifecycle state the client reports in its own way rather than a reason to close saving.
const NOT_EDITABLE_ERROR_CODE = 'NOTE_DOCUMENT_NOT_EDITABLE';

// What became of a queue restored from local storage. REPLACED is the one outcome the caller has to act
// on: the queue continues a lineage the document no longer has, so the connection this queue was
// restored into is not one it can ever be sent through.
export const PersistedQueueOutcome = Object.freeze({
	SENT: 'sent',
	REPLACED: 'replaced',
});

export class FlushManager
{
	#documentId: number;
	#document: Object | null;
	#getCursorPosition: (() => Object | null) | null;
	#onPatchSaved: ((patchId: number, prevPatchId: number | null, journalBaseId: number | null) => void) | null;
	#onCompactSuggested: (() => void) | null;
	#onSaveRefused: (() => void) | null;
	#getBaseline: (() => Object) | null;
	#pendingUpdates: Uint8Array[];
	#flushDebounceTimer: number | null;
	#flushMaxTimer: number | null;
	#updateHandler: Function | null;
	#beforeUnloadHandler: Function | null;
	#isFlushing: boolean;
	#hasRecentEdits: boolean;
	#currentFlush: Promise<boolean> | null;

	constructor({ documentId }: { documentId: number })
	{
		this.#documentId = documentId;
		this.#document = null;
		this.#getCursorPosition = null;
		this.#onPatchSaved = null;
		this.#onCompactSuggested = null;
		this.#onSaveRefused = null;
		this.#getBaseline = null;
		this.#pendingUpdates = [];
		this.#flushDebounceTimer = null;
		this.#flushMaxTimer = null;
		this.#updateHandler = null;
		this.#beforeUnloadHandler = null;
		this.#isFlushing = false;
		this.#hasRecentEdits = false;
		this.#currentFlush = null;
	}

	// `getBaseline` answers which lineage the queue this manager holds belongs to - the document's
	// waterline and the checksum of the state the Y.Doc was built from. Stored next to the queue and
	// weighed against the document on the next open; a manager started without it stores no lineage, and
	// its queue is then sent as it always was.
	start({
		document,
		getCursorPosition,
		getBaseline = null,
		onPatchSaved = null,
		onCompactSuggested = null,
		onSaveRefused = null,
	}: {
		document: Object,
		getCursorPosition: () => Object | null,
		getBaseline?: (() => Object) | null,
		onPatchSaved?: ((patchId: number, prevPatchId: number | null, journalBaseId: number | null) => void) | null,
		onCompactSuggested?: (() => void) | null,
		onSaveRefused?: (() => void) | null,
	}): void
	{
		this.#stopDocUpdates();
		this.#document = document;
		this.#getCursorPosition = getCursorPosition;
		this.#getBaseline = Type.isFunction(getBaseline) ? getBaseline : null;
		this.#onPatchSaved = typeof onPatchSaved === 'function' ? onPatchSaved : null;
		this.#onCompactSuggested = typeof onCompactSuggested === 'function' ? onCompactSuggested : null;
		this.#onSaveRefused = typeof onSaveRefused === 'function' ? onSaveRefused : null;

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

	// `discardPending` throws the queue away instead of saving and sending it. It is for the case where the
	// queue describes text the server has already replaced: sending it is refused while the document is out
	// of the collaborative format, and accepted - putting the replaced text back - once someone rebuilds the
	// document onto the new text. Neither is wanted, so it never leaves the browser.
	stop(options: Object = {}): void
	{
		this.#stopDocUpdates();
		this.#clearTimers();

		if (options.discardPending === true)
		{
			this.#pendingUpdates = [];
			// Nothing is waiting to be sent any more, and callers ask this manager exactly that.
			this.#hasRecentEdits = false;

			return;
		}

		if (this.#pendingUpdates.length > 0)
		{
			this.#persistPendingUpdates();
			void this.flush();
		}
	}

	/**
	 * @return true if everything this call was responsible for reached the server.
	 */
	async flush(): Promise<boolean>
	{
		// A caller that needs the patch to have LANDED (settle) must be able to wait for a send that is
		// already in the air, not skip past it.
		if (this.#isFlushing)
		{
			return this.#currentFlush === null ? false : this.#currentFlush;
		}

		if (this.#pendingUpdates.length === 0)
		{
			return true;
		}

		this.#currentFlush = this.#doFlush();

		return this.#currentFlush;
	}

	/**
	 * Drain everything typed so far and wait for the server to acknowledge it, cancelling the debounce
	 * that would otherwise hold the text back. Materialization calls this first and only proceeds when
	 * this returns true: it reports the applied patch id as its cursor, so a text that has run ahead of
	 * the journal would be pinned at a cursor that does not cover it — and no other client could correct
	 * that projection afterwards, the forward-only guard refusing an equal cursor.
	 *
	 * One pass is not enough: keystrokes landing while a send is in the air queue up behind it, so the
	 * loop keeps going until nothing is pending. The pass limit is what makes it terminate — someone who
	 * never stops typing would otherwise hold the caller forever. Giving up returns false, and the text
	 * simply waits for the next boundary.
	 *
	 * @return true if the journal now holds everything the local document contains.
	 */
	async settle(): Promise<boolean>
	{
		this.#clearTimers();

		for (let pass = 0; pass < SETTLE_MAX_PASSES; pass++)
		{
			if (!this.#isFlushing && this.#pendingUpdates.length === 0)
			{
				return true;
			}

			if (!await this.flush())
			{
				return false;
			}
		}

		return !this.#isFlushing && this.#pendingUpdates.length === 0;
	}

	/**
	 * @return true if the patch reached the server; false leaves the updates queued and persisted.
	 */
	async #doFlush(): Promise<boolean>
	{
		this.#isFlushing = true;
		const updates = this.#pendingUpdates.splice(0);
		let saved = false;

		try
		{
			const merged = Y.mergeUpdates(updates);
			const base64Patch = uint8ArrayToBase64(merged);
			const cursor = this.#getCursorPosition ? this.#getCursorPosition() : null;

			const response = await DocumentService.savePatch({
				documentId: this.#documentId,
				patch: base64Patch,
				cursor,
			});

			PatchPersistence.clear(this.#documentId);
			this.#handleSaveResponse(response);
			saved = true;
		}
		catch (error)
		{
			// A refusal is not a failure. Requeueing is right for a send that did not get through - the
			// next attempt sends it - and wrong for one the server will refuse just as firmly next time:
			// the queue would go back into local storage and stay there, and this session would keep
			// believing its work is on its way. So the queue is dropped here and the caller told, while
			// the text is still on screen and can be rescued.
			if (this.#isRefusedError(error))
			{
				PatchPersistence.clear(this.#documentId);
				if (this.#onSaveRefused)
				{
					this.#onSaveRefused();
				}
			}
			else
			{
				// The failure is reported, not swallowed: a caller that is about to publish this text as
				// the document projection must know the journal does not back it yet.
				this.#pendingUpdates.unshift(...updates);
				this.#persistPendingUpdates();
			}
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

		return saved;
	}

	#handleSaveResponse(response: ?Object): void
	{
		const data = response?.data;
		if (!data)
		{
			return;
		}

		if (data.patchId !== null && data.patchId !== undefined && this.#onPatchSaved)
		{
			// prevPatchId travels with the id: the provider needs it to tell whether our own patch
			// continues what we have applied or jumped over somebody else's. journalBaseId comes with it
			// for the case where nothing precedes ours - the level the journal was cut down to, which is
			// what says whether the cut took anything we had not applied.
			this.#onPatchSaved(
				Number(data.patchId),
				data.prevPatchId ?? null,
				data.journalBaseId ?? null,
			);
		}

		if (data.compactSuggested === true && this.#onCompactSuggested)
		{
			this.#onCompactSuggested();
		}
	}

	/**
	 * The server refusing this patch because the document is no longer collaborative - not a network
	 * failure, not a temporary one. Recognised by the error code rather than the message, which is text
	 * for the user and free to change.
	 */
	#isRefusedError(error: mixed): boolean
	{
		if (!Type.isPlainObject(error))
		{
			return false;
		}

		const errors = Array.isArray(error?.errors) ? error.errors : [];

		return errors.some(
			(item) => Type.isPlainObject(item) && String(item?.code || '') === NOT_EDITABLE_ERROR_CODE,
		);
	}

	// A baseline rebuilt from the document's own text begins a new lineage, and whatever is left in local
	// storage belongs to the Y.Doc that came before it: sending it would merge the replaced text back
	// into the new baseline. Dropped rather than sent.
	discardPersistedPatches(): void
	{
		PatchPersistence.clear(this.#documentId);
	}

	hasPendingUpdates(): boolean
	{
		return this.#hasRecentEdits || this.#pendingUpdates.length > 0 || this.#isFlushing;
	}

	/**
	 * @return one of the PersistedQueueOutcome values.
	 */
	async sendPersistedPatches(document: Object): Promise<string>
	{
		const patch = PatchPersistence.load(this.#documentId);
		if (patch === null)
		{
			return PersistedQueueOutcome.SENT;
		}

		if (this.#belongsToReplacedBaseline(patch))
		{
			// Applied but never sent. The text in this queue is somebody's unsent work and the only copy of
			// it left, so it goes on screen - and it stops there: the server would take it now that the
			// document is collaborative again, and taking it means merging the replaced text back in.
			if (document)
			{
				Y.applyUpdate(document, base64ToUint8Array(patch), 'remote');
			}

			PatchPersistence.clear(this.#documentId);

			return PersistedQueueOutcome.REPLACED;
		}

		try
		{
			if (document)
			{
				Y.applyUpdate(document, base64ToUint8Array(patch), 'remote');
			}

			const response = await DocumentService.savePatch({
				documentId: this.#documentId,
				patch,
			});
			PatchPersistence.clear(this.#documentId);
			this.#handleSaveResponse(response);
		}
		catch (error)
		{
			// Failed to send - patches stay in localStorage for next reconnect. A refusal is the one
			// answer that no later reconnect improves on, so it clears the slot instead of leaving a patch
			// there that every future open will try and be refused again.
			if (this.#isRefusedError(error))
			{
				PatchPersistence.clear(this.#documentId);
				if (this.#onSaveRefused)
				{
					this.#onSaveRefused();
				}
			}
		}

		return PersistedQueueOutcome.SENT;
	}

	/**
	 * Whether the stored queue continues a lineage this document no longer has.
	 *
	 * A Y update carries no document identity, so a queue written against the text an overwrite replaced
	 * applies onto the text that replaced it just as cleanly - and the server accepts it, because by then
	 * somebody has rebuilt the document back into the collaborative format. That is the loop closing
	 * through local storage rather than through a push, and nothing in the queue itself can tell it apart.
	 *
	 * What tells it apart here is the waterline going BACKWARDS. An accepted rebuild resets
	 * MATERIALIZED_UPTO_ID to zero (SaveYjsStateCommand), so a document whose waterline now sits below the
	 * one this queue was stored under has had its journal replaced since. Where neither line ever
	 * materialized - both waterlines a real zero - the baseline checksum answers instead: the state the
	 * Y.Doc was built from is not the state the document holds now.
	 *
	 * Not a general answer, and knowingly so. Once the rebuilt lineage materializes, its waterline climbs
	 * back above the stored one and the check below says nothing: the checksum, the only discriminator
	 * left, is out of reach because a checksum differs after any ordinary compaction too and would refuse
	 * honest queues wholesale. Only the author of the rebuild is covered past that point, by
	 * discardPersistedPatches() at genesis. Closing it for everyone needs identity the server has to
	 * issue - a generation stamped on the document and on each queued patch - not a value a returning tab
	 * can derive on its own; see RESULT-frontend.md.
	 *
	 * A queue with no stored lineage is sent, and so is one the current baseline cannot be compared with.
	 * Unknown is not suspicion: an absent waterline is not a zero one, and reading it as zero would make
	 * the first open after an update take away text people typed before it. A lineage that names another
	 * queue counts as no lineage for the same reason - it is what a bundle that does not know the
	 * satellite key leaves behind when it clears the queue alone.
	 */
	#belongsToReplacedBaseline(patch: string): boolean
	{
		const stored = PatchPersistence.loadBaseline(this.#documentId);
		if (stored === null || this.#getBaseline === null)
		{
			return false;
		}

		if (String(stored.queueChecksum ?? '') !== crc32Utf8(patch))
		{
			return false;
		}

		const current = this.#getBaseline() ?? {};
		const storedUptoId = readBaselineCursor(stored.materializedUptoId);
		const currentUptoId = readBaselineCursor(current.materializedUptoId);
		if (storedUptoId === null || currentUptoId === null)
		{
			return false;
		}

		if (storedUptoId > 0)
		{
			return currentUptoId < storedUptoId;
		}

		if (currentUptoId > 0)
		{
			return false;
		}

		const storedChecksum = String(stored.checksum ?? '');
		const currentChecksum = String(current.checksum ?? '');

		return storedChecksum !== '' && currentChecksum !== '' && storedChecksum !== currentChecksum;
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
			const storedQueue = PatchPersistence.save(this.#documentId, base64Patch);
			// Written with the queue, not once at start: the waterline moves while the session runs, and
			// what the next open has to weigh is the lineage as of the moment the queue was put away. A
			// call that stored nothing gets no record: it would name a queue that is not there, and the
			// older queue still in storage would then be weighed against a lineage that is not its own.
			if (storedQueue !== null && this.#getBaseline !== null)
			{
				PatchPersistence.saveBaseline(this.#documentId, this.#getBaseline() ?? {}, storedQueue);
			}
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
