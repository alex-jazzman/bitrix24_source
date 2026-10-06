import { Type, Event } from 'main.core';
import * as Y from 'yjs';
import { Awareness } from 'y-protocols/awareness';
import { DocumentService } from '../application/document-service';
import { AwarenessManager } from './awareness-manager';
import { createYDoc } from './ydoc-factory';
import { FlushManager, PersistedQueueOutcome } from './flush-manager';
import { PullTransport } from './pull-transport';
import { CompactManager } from './compact-manager';
import { MaterializeManager } from './materialize-manager';
import { resolveAppliedCursor } from './applied-cursor';
import { readBaselineCursor } from './baseline-cursor';
import { uint8ArrayToBase64, base64ToUint8Array } from '../utils/binary';
import { crc32Utf8 } from '../utils/checksum';
import { MATERIALIZE_DEBOUNCE_MS, MATERIALIZE_MAX_INTERVAL_MS, COMPACT_SUGGEST_DEBOUNCE_MS } from '../const';

// Writing the genesis state has exactly three outcomes, and only a refusal says anything about the
// document itself: the server answered and would answer the same way to every further attempt. A
// technical failure says nothing — the next attempt may well succeed — so it must never be read as one.
const GenesisOutcome = Object.freeze({
	APPLIED: 'applied',
	REFUSED: 'refused',
	FAILED: 'failed',
});

export class PushPullYjsProvider
{
	documentId: number;
	collectionId: number;
	#userId: number;
	#userName: string;
	#userColor: string;
	#userAvatar: string | null;
	#mode: string;
	#schema: Object;

	document: Object | null;
	awareness: Object | null;
	isConnected: boolean;
	#lastAppliedPatchId: number;
	#compactedUpToId: number;
	#isCompactionForced: boolean;
	// The compaction in flight, so overlapping triggers join it instead of each paying for its own.
	#compaction: Promise<void> | null;
	#hasJournalGap: boolean;
	#recovery: Promise<void> | null;
	#recoveryQueued: boolean;
	#hasLocalEdits: boolean;
	#pendingPullPatches: Array<Object> | null;
	// Which lineage this session's Y.Doc belongs to: the document's waterline as the server reported it,
	// and the checksum of the state the Y.Doc was built from. Stored with a queue that goes into local
	// storage and weighed against the document on the next open - see FlushManager.
	#materializedUptoId: number | null;
	#baselineChecksum: string;

	onStatus: Function | null;
	onSynced: Function | null;
	onDisconnect: Function | null;
	onConnectError: Function | null;
	onNeedReconnect: Function | null;
	onRemoteDocumentUpdate: Function | null;
	onRemoteArchive: Function | null;
	onRemoteRestore: Function | null;
	onRemoteDelete: Function | null;
	onRemoteHardDelete: Function | null;
	onRemoteContentOverwritten: Function | null;
	onGenesisRefused: Function | null;
	onGenesisFailed: Function | null;
	onSaveRefused: Function | null;
	onRemoteCapabilities: Function | null;
	onParticipants: Function | null;

	#flushManager: FlushManager;
	#pullTransport: PullTransport;
	#compactManager: CompactManager;
	#materializeManager: MaterializeManager;
	#getEditorMarkdown: (() => string | null) | null;
	#materializeDebounceTimer: number | null;
	#materializeMaxTimer: number | null;
	#materializeUpdateHandler: Function | null;
	#visibilityHandler: Function | null;
	#compactSuggestTimer: number | null;
	#awarenessManager: Object | null;
	#isDestroyed: boolean;

	constructor({
		documentId,
		userId,
		userName,
		userColor,
		userAvatar = null,
		mode = 'view',
		schema,
		getEditorMarkdown = null,
	}: {
		documentId: number,
		userId: number,
		userName: string,
		userColor: string,
		userAvatar?: string | null,
		mode?: string,
		schema: Object,
		getEditorMarkdown?: (() => string | null) | null,
	})
	{
		this.documentId = documentId;
		this.collectionId = 0;
		this.#userId = userId;
		this.#userName = userName;
		this.#userColor = userColor;
		this.#userAvatar = userAvatar;
		this.#mode = mode === 'edit' ? 'edit' : 'view';
		this.#schema = schema;

		this.document = null;
		this.awareness = null;
		this.isConnected = false;
		this.#lastAppliedPatchId = 0;
		this.#compactedUpToId = 0;
		this.#isCompactionForced = false;
		this.#compaction = null;
		this.#hasJournalGap = false;
		this.#recovery = null;
		this.#recoveryQueued = false;
		this.#hasLocalEdits = false;
		this.#pendingPullPatches = null;
		this.#materializedUptoId = null;
		this.#baselineChecksum = '';

		this.onStatus = null;
		this.onSynced = null;
		this.onDisconnect = null;
		this.onConnectError = null;
		this.onNeedReconnect = null;
		this.onRemoteDocumentUpdate = null;
		this.onRemoteArchive = null;
		this.onRemoteRestore = null;
		this.onRemoteDelete = null;
		this.onRemoteHardDelete = null;
		this.onRemoteContentOverwritten = null;
		this.onGenesisRefused = null;
		this.onGenesisFailed = null;
		this.onSaveRefused = null;
		this.onRemoteCapabilities = null;
		this.onParticipants = null;

		this.#flushManager = new FlushManager({ documentId });
		this.#pullTransport = new PullTransport({ documentId });
		this.#compactManager = new CompactManager({ documentId });
		// Read through a getter: collectionId is still zero here and only arrives with the loaded document.
		this.#materializeManager = new MaterializeManager({
			documentId,
			getCollectionId: () => Number(this.collectionId) || 0,
		});
		this.#getEditorMarkdown = typeof getEditorMarkdown === 'function' ? getEditorMarkdown : null;
		this.#materializeDebounceTimer = null;
		this.#materializeMaxTimer = null;
		this.#materializeUpdateHandler = null;
		this.#visibilityHandler = null;
		this.#compactSuggestTimer = null;
		this.#awarenessManager = null;
		this.#isDestroyed = false;
	}

	async connect(collaborationData: Object | null = null): Promise<void>
	{
		if (this.#isDestroyed)
		{
			return;
		}

		this.#cleanupBeforeReconnect();
		this.#emitStatus('connecting');

		// Pull is subscribed to BEFORE the state is read, never after. The server puts this tab into the
		// document channel while it is answering loadForCollaboration, so a patch published in the window
		// between that registration and BX.PULL.subscribe here is delivered to the browser and dropped for
		// want of a handler. Nothing reports the loss afterwards: prevPatchId only exposes a hole to
		// whoever receives the NEXT patch, and if the lost one was the last, no next patch ever comes.
		// The Y.Doc is not built yet, so whatever arrives is buffered and replayed into it below.
		this.#pendingPullPatches = [];
		this.#startPullTransport();

		let data = collaborationData;
		if (data === null || data === undefined)
		{
			try
			{
				const response = await DocumentService.loadForCollaboration({
					documentId: this.documentId,
				});
				data = response?.data ?? {};
			}
			catch (error)
			{
				// No Y.Doc will be built, so the buffered patches have nowhere to go; the reconnect that
				// follows reads the whole state again anyway.
				this.#pendingPullPatches = null;
				this.#emitStatus('disconnected');
				if (this.onConnectError)
				{
					this.onConnectError(error);
				}

				return;
			}

			if (this.#isDestroyed)
			{
				this.#pendingPullPatches = null;

				return;
			}
		}

		const yjsState = data?.yjsState ?? null;
		const markdown = data?.markdown ?? null;
		const patches = Array.isArray(data?.patches) ? data.patches : [];
		this.#adoptBaseline(data, yjsState);
		// connect() rebuilds the Y.Doc from scratch, so the cursor is taken as-is - but from the patches
		// that actually went into it, not from the server's own last id.
		this.#lastAppliedPatchId = resolveAppliedCursor(patches, data?.lastPatchId);
		this.#hasJournalGap = false;
		// The document is read from scratch here, so nothing is known to have been compacted yet: the
		// journal this cursor came from is exactly what the first compaction has to drain. Anything
		// carried over from a previous connection would be measured against a cursor that no longer
		// means the same thing, and the one direction that must never happen is standing down when a
		// compaction is due - the journal then grows with nobody left to cut it.
		this.#compactedUpToId = 0;

		this.document = createYDoc({
			yjsState,
			markdown,
			patches,
			schema: this.#schema,
		});

		// Skip genesis save when server holds raw markdown — ydoc-factory has no MD parser,
		// so the Y.Doc would be empty and would clobber the real content in DB.
		if (yjsState === null && this.document && !Type.isString(markdown))
		{
			// Anything but an accepted genesis ends the connection here, before awareness, flushing and
			// the materialize triggers are wired to a Y.Doc the server will not accept anything for.
			// Both outcomes are reported: what they say about the document differs, but either way this
			// provider stops halfway and must not be taken for a working one.
			//
			// The claim that this baseline IS the document's own current text rebuilt - the one claim under
			// which a document demoted by an overwrite is taken back into the collaborative format. It is
			// made by the caller, never inferred here: only the caller knows whether it parsed the text
			// the server had just served, and the shape of `markdown` does not say so. A document in the
			// json format arrives here as a tree too (that is what an import leaves behind), and a
			// provider that read the state itself never parsed anything - neither is a rebuild, and
			// claiming one for them would spend the claim on a document nobody demoted.
			//
			// `markdownChecksum` names WHICH text was rebuilt. The document can be overwritten again
			// between the response the caller parsed and this write, and the claim alone would then be an
			// honest client's word for a text that is already gone.
			const isRebuiltFromMarkdown = data?.rebuiltFromMarkdown === true;
			const markdownChecksum = isRebuiltFromMarkdown ? (data?.markdownChecksum ?? null) : null;
			const outcome = await this.#saveGenesisState(patches, isRebuiltFromMarkdown, markdownChecksum);
			if (outcome !== GenesisOutcome.APPLIED)
			{
				this.#pendingPullPatches = null;
				this.#emitStatus('disconnected');
				this.#reportGenesisOutcome(outcome);

				return;
			}

			// The baseline just stored was built from the server's own text, so anything this browser had
			// left in local storage was written against the Y.Doc that came before it. Sending it below
			// would merge the replaced text back into the document - the very thing the overwrite undid.
			if (isRebuiltFromMarkdown)
			{
				this.#flushManager.discardPersistedPatches();
			}
		}

		this.#initializeAwareness();
		// The Y.Doc and the cursor are both in place now, so the patches held back during the read can go
		// in: the ones the response already carried are dropped by the cursor, the rest continue it.
		this.#drainPendingPullPatches();
		this.#startFlushManager();
		this.#flushManager.registerBeforeUnload();
		// Sent only once the response handler above is wired up. A patch restored from localStorage is a
		// patch like any other: its id moves the cursor, its prevPatchId is checked for continuity, and it
		// marks this session as having edited - without which no work boundary would ever publish it.
		//
		// Unless it belongs to a lineage this document no longer has: then it is on screen and stays there,
		// and this connection ends the same way a refused patch ends it - nothing more can be saved through
		// it, and the text has to stay in front of the person who typed it.
		if (await this.#flushManager.sendPersistedPatches(this.document) === PersistedQueueOutcome.REPLACED)
		{
			this.#pendingPullPatches = null;
			this.#emitStatus('disconnected');
			this.#handleSaveRefused();

			return;
		}

		this.#startMaterializeTriggers();

		this.isConnected = true;
		this.#emitStatus('connected');

		if (this.onSynced)
		{
			this.onSynced();
		}
	}

	async sync(): Promise<void>
	{
		if (this.#isDestroyed || !this.document)
		{
			return;
		}

		// Subscribed before the read for the same reason as in connect(): the server registers this tab in
		// the channel while answering, so subscribing afterwards leaves a window in which a patch reaches
		// the browser with no handler to take it. Buffering rather than applying straight away keeps the
		// replay behind the server state, so these patches meet the cursor that state has already set.
		this.#pendingPullPatches = [];
		this.#startPullTransport();

		// Read BEFORE anything is sent, and that order is the whole reason the read sits here. A session
		// coming back from a disconnect knows only the lineage it left with, so weighing the stored queue
		// against what it already knows compares that lineage with itself - it can never notice that an
		// overwrite ended it while this tab was away, which is the one case the weighing exists for.
		let data = null;
		try
		{
			const response = await DocumentService.loadForCollaboration({
				documentId: this.documentId,
			});

			data = response?.data ?? {};
		}
		catch (error)
		{
			// Nothing is sent against a state that could not be read: sending blind is exactly what the
			// read above prevents, and the queue loses nothing by waiting - it stays in local storage and
			// in memory. Thrown rather than swallowed so the caller cannot take a resync that never
			// happened for a finished one: softReconnect() ends in its own catch, the indicator stays
			// offline, and the next activity or reconnect reads again.
			this.#pendingPullPatches = null;

			throw error;
		}

		if (this.#isDestroyed || !this.document)
		{
			this.#pendingPullPatches = null;

			return;
		}

		// Only the lineage of that answer is taken now; what it does to the Y.Doc waits until the queue has
		// been judged. Applied first, the state that replaced the text would be merged into the Y.Doc of the
		// text it replaced, and the queue would then be weighed against a document already holding both.
		this.#adoptBaseline(data, data?.yjsState ?? null);

		// Same answer as in connect() and for the same reason.
		if (await this.#flushManager.sendPersistedPatches(this.document) === PersistedQueueOutcome.REPLACED)
		{
			this.#pendingPullPatches = null;
			this.#emitStatus('disconnected');
			this.#handleSaveRefused();

			return;
		}

		await this.#flushManager.flush();

		// The snapshot predates the sends above, which costs nothing: applying it only ever adds, and the
		// cursor it carries moves forward only (see #applyServerState).
		this.#applyServerState(data);

		this.#drainPendingPullPatches();
		this.#startFlushManager();
		this.#flushManager.unregisterBeforeUnload();
		this.#flushManager.registerBeforeUnload();
		this.#startMaterializeTriggers();

		if (this.awareness)
		{
			this.awareness.setLocalStateField('user', {
				id: this.#userId,
				name: this.#userName,
				color: this.#userColor,
				avatar: this.#userAvatar,
				mode: this.#mode,
			});
		}

		if (this.#awarenessManager)
		{
			this.#awarenessManager.start();
		}

		this.isConnected = true;
		this.#emitStatus('connected');
	}

	setMode(mode: string): void
	{
		const normalized = mode === 'edit' ? 'edit' : 'view';
		if (normalized === this.#mode)
		{
			return;
		}

		this.#mode = normalized;

		if (this.awareness)
		{
			const localState = this.awareness.getLocalState() || {};
			this.awareness.setLocalStateField('user', {
				...(localState.user || {}),
				id: this.#userId,
				name: this.#userName,
				color: this.#userColor,
				avatar: this.#userAvatar,
				mode: this.#mode,
			});
		}

		if (this.#awarenessManager)
		{
			this.#awarenessManager.broadcastMode();
		}
	}

	clearCursor(): void
	{
		if (this.#awarenessManager)
		{
			this.#awarenessManager.clearCursor();
		}

		if (this.awareness)
		{
			this.awareness.setLocalStateField('cursor', null);
		}
	}

	disconnect(options: Object = {}): void
	{
		this.#stopMaterializeTriggers();
		this.#clearCompactSuggestTimer();
		this.#pendingPullPatches = null;
		this.#flushManager.unregisterBeforeUnload();
		this.#pullTransport.stop();
		this.#flushManager.stop(options);
		this.#compactManager.stopInterval();

		if (this.#awarenessManager)
		{
			this.#awarenessManager.leave();
		}

		const wasConnected = this.isConnected;
		this.isConnected = false;

		if (wasConnected && this.onDisconnect)
		{
			this.onDisconnect();
		}
	}

	async destroy(options: Object = {}): Promise<void>
	{
		if (this.#isDestroyed)
		{
			return;
		}

		this.#isDestroyed = true;

		// The markdown is taken HERE, synchronously, before anything is awaited. The caller may be Vue's
		// beforeUnmount, which unmounts the editor the moment this returns — by the time an awaited flush
		// resolved there would be no view model left to read, and the last patches would stay in the
		// journal with no fresh projection. Whether there is anything to send is decided now for the same
		// reason: disconnect() below drains the pending updates.
		const shouldMaterialize = options.materialize !== false
			&& (this.#hasLocalEdits || this.#flushManager.hasPendingUpdates());
		const finalMarkdown = shouldMaterialize ? this.#captureMarkdown() : null;

		this.disconnect(options);

		// Deliberately not awaited: an SPA navigation would otherwise sit through a savePatch and a
		// full-markdown round trip before the next document even starts loading. The text is already
		// captured, so the Y.Doc can die right away, and FlushManager.destroy() below only stops
		// listeners and timers — it does not cancel a send that is already on its way.
		if (finalMarkdown !== null)
		{
			void this.#materializeSnapshot(finalMarkdown);
		}

		this.#flushManager.destroy();
		this.#pullTransport.destroy();
		this.#compactManager.destroy();

		if (this.#awarenessManager)
		{
			this.#awarenessManager.destroy();
			this.#awarenessManager = null;
		}

		if (this.awareness)
		{
			this.awareness.destroy();
			this.awareness = null;
		}

		if (this.document)
		{
			this.document.destroy();
			this.document = null;
		}
	}

	freezeWrites(): void
	{
		this.#stopMaterializeTriggers();
		this.#flushManager.unregisterBeforeUnload();
		this.#flushManager.stop();
		this.#compactManager.stopInterval();

		if (this.#awarenessManager)
		{
			this.#awarenessManager.leave();
		}
	}

	refreshCollectionWatch(): void
	{
		this.#pullTransport.refreshCollectionWatch();
	}

	unfreezeWrites(): void
	{
		if (this.#isDestroyed || !this.document)
		{
			return;
		}

		this.#startFlushManager();
		this.#flushManager.registerBeforeUnload();
		this.#startMaterializeTriggers();

		if (this.#awarenessManager)
		{
			this.#awarenessManager.start();
		}
	}

	// Every compaction goes through here - the interval, the server-driven backstop, the restore flow and
	// the e2e trigger alike - because this is where the document is known to be whole.
	//
	// One at a time, and a second caller waits for the first rather than starting its own. The triggers
	// are independent and do collide: the one-shot five seconds after connect, the backstop the server
	// raises when the journal grows too long, and the periodic tick all decide on their own. The cheap
	// gate below cannot separate them - the cursor it reads only moves once a compaction is accepted, so
	// until the first one returns every caller sees the same "yes, there is work". Each of them would
	// then pay the whole price: a full read of the server state, a full snapshot of the Y.Doc serialised
	// on the main thread, and the text sent back - to be told "busy" by the server lock that lets only
	// one of them write. Nothing accumulated meanwhile is lost by waiting: a backstop raised during a
	// compaction keeps its flag until one is accepted, and the cursor keeps whatever moved it.
	async compact(getEditorMarkdown: () => string | null): Promise<void>
	{
		if (this.#compaction !== null)
		{
			return this.#compaction;
		}

		this.#compaction = (async () => {
			try
			{
				await this.#runCompaction(getEditorMarkdown);
			}
			finally
			{
				this.#compaction = null;
			}
		})();

		return this.#compaction;
	}

	async #runCompaction(getEditorMarkdown: () => string | null): Promise<void>
	{
		if (this.#isDestroyed || !this.document)
		{
			return;
		}

		// The cheap question first, before anything goes over the wire. Everything below costs a full
		// read of the server state and a full snapshot of the Y.Doc back, and a tab where nobody typed
		// used to pay that every three minutes for nothing: the first compaction empties the journal
		// while the cursor stays where it is, so the tick had no way of telling itself apart from a
		// useful one.
		if (!this.#hasSomethingToCompact())
		{
			return;
		}

		// Compaction is materialization's destructive twin: it overwrites YJS_STATE with a snapshot of THIS
		// Y.Doc and drains the journal behind it. While a hole is open the missing patch is either still in
		// the journal - and then it is the recovery below that brings it in - or already folded into another
		// client's snapshot, and then ours replaces that snapshot with text the co-author's paragraph never
		// reached, with no journal row left to restore it from. The server waterline does not catch it: it
		// refuses a cursor that runs ahead, and a cursor with a hole in it lags behind instead. So give the
		// recovery in flight its round trip and stand down if the hole survives it.
		await this.#awaitRecovery();
		if (this.#hasJournalGap || this.#isDestroyed || !this.document)
		{
			return;
		}

		// The gap flag is not enough on its own, and it never can be: it only knows about holes that some
		// later patch reported through its prevPatchId, so a patch lost with nobody typing afterwards
		// leaves it clean. Compaction cannot afford that - it replaces YJS_STATE with a snapshot of THIS
		// Y.Doc, and a snapshot missing a paragraph another client already folded into the server one
		// erases that paragraph from the snapshot and from the journal at once. So the server state is
		// pulled in first: applying it makes our snapshot a provable superset of the one we overwrite,
		// whether or not we ever learned we were behind. Y.applyUpdate is idempotent, so this only ever
		// adds. If the state does not arrive, nothing is proven and the destructive path stands down.
		if (!await this.#loadAuthoritativeState())
		{
			return;
		}

		if (this.#isDestroyed || !this.document)
		{
			return;
		}

		// Read before the request leaves, not after it returns. A patch arriving while it is in the air
		// moves the cursor past the window the server was asked to drain, and remembering that later
		// value would write off patches the journal still holds.
		const processedUpToId = this.#lastAppliedPatchId;
		const isCompacted = await this.#compactManager.compact({
			document: this.document,
			getEditorMarkdown,
			processedUpToId,
		});

		if (isCompacted)
		{
			this.#compactedUpToId = processedUpToId;
			this.#isCompactionForced = false;
		}
	}

	// Has anything happened since the last compaction the server accepted? The applied-patch cursor
	// answers it without a request: it moves for every patch of this document, ours or a co-author's,
	// and the journal cannot have grown without one of those. Whatever the cursor cannot see is covered
	// by the two clauses around it.
	#hasSomethingToCompact(): boolean
	{
		// The server backstop outranks the cursor. compactSuggested rides on a savePatch response and
		// says the journal has already grown past what the server is willing to keep, so that demand has
		// to reach compact() whatever the cursor looks like: standing down here would leave the journal
		// growing with nothing to cut it back.
		if (this.#isCompactionForced)
		{
			return true;
		}

		// Local updates that have not been flushed yet are part of the window too - the restore flow
		// compacts precisely that window before it rewrites the text, and it may run between a keystroke
		// and the flush that carries it.
		return this.#lastAppliedPatchId > this.#compactedUpToId || this.#flushManager.hasPendingUpdates();
	}

	// Work-boundary materialize: guarded against a destroyed provider. All P2 triggers funnel here,
	// so hash-idempotency in MaterializeManager de-dupes overlapping boundaries.
	async materialize(): Promise<void>
	{
		if (this.#isDestroyed)
		{
			return;
		}

		await this.#materializeNow();
	}

	// Final materialize during teardown. Takes the markdown captured before the teardown began instead
	// of reading it now: the editor it would read from may already be gone. Past the #isDestroyed gate
	// that destroy() has raised, and best-effort throughout — a failed send must never break teardown.
	async #materializeSnapshot(markdown: string): Promise<void>
	{
		// The journal must hold the text before it is published as the projection. If the last patch
		// never made it, sending anyway would store markdown the journal cannot reproduce: a later
		// compaction rebuilds the text from patches and the projection silently regresses. The unsent
		// patch survives in localStorage, so the next opening of the document sends it and materializes.
		if (!await this.#settleQuietly())
		{
			return;
		}

		// An open hole does NOT stop this one, unlike the work-boundary materialize above. Recovery
		// cannot run any more - the Y.Doc is already gone - and there is no later boundary to retry at,
		// so skipping would drop the author's last edit from the projection for good. Publishing is safe
		// because the cursor no longer lies: it stopped at the last patch that continued ours, below the
		// id of whatever we are missing, so any editor that does hold that patch outranks this projection
		// and overwrites it, and a compaction drains no further than the cursor either.
		try
		{
			await this.#materializeManager.materialize({
				getEditorMarkdown: () => markdown,
				getUptoId: () => this.#lastAppliedPatchId,
			});
		}
		catch
		{
			// teardown materialize is best-effort
		}
	}

	// settle() answers whether the journal caught up with the local text; a throw from it counts as "no".
	async #settleQuietly(): Promise<boolean>
	{
		try
		{
			return await this.#flushManager.settle();
		}
		catch
		{
			return false;
		}
	}

	#captureMarkdown(): string | null
	{
		if (typeof this.#getEditorMarkdown !== 'function')
		{
			return null;
		}

		try
		{
			const markdown = this.#getEditorMarkdown();

			return typeof markdown === 'string' ? markdown : null;
		}
		catch
		{
			return null; // the editor is already gone — nothing to materialize
		}
	}

	async #materializeNow(): Promise<void>
	{
		if (!this.document)
		{
			return;
		}

		// A reader who never typed has nothing to materialize: the projection is already whatever the
		// server stores. Sending anyway costs a full-markdown round trip on every boundary — and for a
		// read-only viewer it is a request the server is bound to refuse, which SPA navigation would
		// still sit and wait for.
		if (!this.#hasLocalEdits && !this.#flushManager.hasPendingUpdates())
		{
			return;
		}

		// The cursor reported below is the last APPLIED patch id, so the text must not run ahead of it.
		// Leaving edit mode right after typing would otherwise ship new markdown with the previous
		// cursor: the server's forward-only guard refuses an equal cursor, and if it did accept, the
		// projection would be pinned at a cursor that does not cover the text it holds — nobody could
		// correct it afterwards. Not settled means not materialized; the next boundary tries again.
		if (!await this.#settleQuietly())
		{
			return;
		}

		if (!this.document)
		{
			return; // torn down while the flush was in the air
		}

		// A hole in the applied patches means this text is not the document: publishing it would put a
		// projection out there with somebody's paragraph silently missing, and feed the derived search
		// and RAG the same. Recovery is one round trip away, so wait for the one in flight; if the hole
		// is still open after it, drop this boundary - another one follows, and so does another editor.
		await this.#awaitRecovery();
		if (this.#hasJournalGap || !this.document)
		{
			return;
		}

		await this.#materializeManager.materialize({
			getEditorMarkdown: this.#getEditorMarkdown ?? (() => null),
			getUptoId: () => this.#lastAppliedPatchId,
		});
	}

	// Implicit boundaries: a pause in typing (debounce) with a ceiling for continuous typing, and the
	// tab going hidden. Explicit boundaries (finishEdit, idle, softReconnect, teardown) call
	// materialize() directly from the feature/lifecycle layer.
	#startMaterializeTriggers(): void
	{
		this.#stopMaterializeTriggers();
		if (!this.document)
		{
			return;
		}

		this.#materializeUpdateHandler = (update: Uint8Array, origin: mixed) => {
			if (origin === 'remote')
			{
				return; // remote edits must not keep resetting the local materialize debounce
			}

			this.#scheduleMaterialize();
		};
		this.document.on('update', this.#materializeUpdateHandler);

		this.#visibilityHandler = () => {
			if (typeof document !== 'undefined' && document.visibilityState === 'hidden')
			{
				void this.materialize();
			}
		};
		Event.bind(document, 'visibilitychange', this.#visibilityHandler);
	}

	#stopMaterializeTriggers(): void
	{
		this.#clearMaterializeTimers();

		if (this.#materializeUpdateHandler && this.document)
		{
			this.document.off('update', this.#materializeUpdateHandler);
		}
		this.#materializeUpdateHandler = null;

		if (this.#visibilityHandler)
		{
			Event.unbind(document, 'visibilitychange', this.#visibilityHandler);
			this.#visibilityHandler = null;
		}
	}

	#scheduleMaterialize(): void
	{
		if (this.#materializeDebounceTimer !== null)
		{
			clearTimeout(this.#materializeDebounceTimer);
		}

		this.#materializeDebounceTimer = setTimeout(() => {
			this.#materializeDebounceTimer = null;
			this.#fireMaterialize();
		}, MATERIALIZE_DEBOUNCE_MS);

		if (this.#materializeMaxTimer === null)
		{
			this.#materializeMaxTimer = setTimeout(() => {
				this.#materializeMaxTimer = null;
				this.#fireMaterialize();
			}, MATERIALIZE_MAX_INTERVAL_MS);
		}
	}

	#fireMaterialize(): void
	{
		this.#clearMaterializeTimers();
		void this.materialize();
	}

	#clearMaterializeTimers(): void
	{
		if (this.#materializeDebounceTimer !== null)
		{
			clearTimeout(this.#materializeDebounceTimer);
			this.#materializeDebounceTimer = null;
		}

		if (this.#materializeMaxTimer !== null)
		{
			clearTimeout(this.#materializeMaxTimer);
			this.#materializeMaxTimer = null;
		}
	}

	// Journal backstop (P4): the server raised compactSuggested in a savePatch response, so the
	// journal is piling up. Debounce so a burst of flagged flushes collapses into one compaction; the
	// server 'compact' lock resolves any race between editors.
	#handleCompactSuggested(): void
	{
		if (this.#isDestroyed || !this.document)
		{
			return;
		}

		// Raised here rather than left to the cursor. The patch that carried the flag normally moves the
		// cursor along with it, but "normally" is not a guarantee the journal can rely on: the backstop
		// is the one signal that says the journal is already too long, and it has to reach compact()
		// even when the cursor has nothing to add. Cleared only once a compaction is accepted.
		this.#isCompactionForced = true;

		if (this.#compactSuggestTimer !== null)
		{
			clearTimeout(this.#compactSuggestTimer);
		}

		this.#compactSuggestTimer = setTimeout(() => {
			this.#compactSuggestTimer = null;
			void this.compact(this.#getEditorMarkdown ?? (() => null));
		}, COMPACT_SUGGEST_DEBOUNCE_MS);
	}

	#clearCompactSuggestTimer(): void
	{
		if (this.#compactSuggestTimer !== null)
		{
			clearTimeout(this.#compactSuggestTimer);
			this.#compactSuggestTimer = null;
		}
	}

	startCompactInterval(getEditorMarkdown: () => string | null): void
	{
		this.#compactManager.startInterval(() => {
			void this.compact(getEditorMarkdown);
		});
	}

	stopCompactInterval(): void
	{
		this.#compactManager.stopInterval();
	}

	#cleanupBeforeReconnect(): void
	{
		if (this.#awarenessManager)
		{
			this.#awarenessManager.destroy();
			this.#awarenessManager = null;
		}

		if (this.awareness)
		{
			this.awareness.destroy();
			this.awareness = null;
		}

		if (this.document)
		{
			this.document.destroy();
			this.document = null;
		}
	}

	#startFlushManager(): void
	{
		this.#flushManager.start({
			document: this.document,
			getCursorPosition: () => this.#getCursorPosition(),
			getBaseline: () => this.#currentBaseline(),
			onPatchSaved: (patchId, prevPatchId, journalBaseId) => {
				this.#handleLocalPatchSaved(patchId, prevPatchId, journalBaseId);
			},
			onCompactSuggested: () => this.#handleCompactSuggested(),
			onSaveRefused: () => this.#handleSaveRefused(),
		});
	}

	// The lineage of the state just read: the document's waterline, and the checksum of what the Y.Doc was
	// built from. The checksum is taken of the server's own snapshot rather than of the local Y.Doc - the
	// local one changes with every keystroke, while the question this value answers is whether the
	// DOCUMENT still stands where it stood. A response that carried no snapshot leaves it unknown, and
	// unknown never accuses: see FlushManager.
	// A response that carries no waterline leaves the lineage unknown rather than zero - see
	// readBaselineCursor. Every path that builds this provider's data now passes the value through
	// (bootstrap, direct open, the reload after an overwrite), so an absent one means an older server or a
	// caller that has not been taught, and neither is grounds to suspect somebody's unsent text.
	#adoptBaseline(data: ?Object, yjsState: mixed): void
	{
		this.#materializedUptoId = readBaselineCursor(data?.materializedUptoId);
		this.#baselineChecksum = Type.isStringFilled(yjsState) ? crc32Utf8(yjsState) : '';
	}

	#currentBaseline(): Object
	{
		return {
			materializedUptoId: this.#materializedUptoId,
			checksum: this.#baselineChecksum,
		};
	}

	// The journal of a document being created is normally empty, but a co-author who got in first may
	// already have typed into it - hence `patches`, which the rebuild below has to carry over.
	// Returns one of the GenesisOutcome values: only REFUSED means the server itself said no, and only
	// APPLIED lets this connection continue. Called from the one place in connect() that has just built
	// `this.document`, so the encode below has a Y.Doc to read.
	async #saveGenesisState(
		patches: Array<Object> = [],
		rebuiltFromMarkdown: boolean = false,
		markdownChecksum: ?string = null,
	): Promise<string>
	{
		try
		{
			const fullState = Y.encodeStateAsUpdate(this.document);
			const yjsState = uint8ArrayToBase64(fullState);

			const response = await DocumentService.saveYjsState({
				documentId: this.documentId,
				yjsState,
				rebuiltFromMarkdown,
				markdownChecksum,
			});

			// The provider may have been torn down while the write was in flight — a rebuilt Y.Doc would
			// then be assigned to a dead provider, and its caller would carry on connecting it.
			if (this.#isDestroyed)
			{
				return GenesisOutcome.FAILED;
			}

			const applied = response?.data?.applied;
			const serverState = response?.data?.yjsState ?? null;
			if (applied === false && Type.isStringFilled(serverState))
			{
				// Lost the genesis race: discard our orphan baseline and rebuild from the
				// authoritative server state so transport/awareness/flush/editor bind to it. The journal
				// goes back in with it - the cursor was already set from these patches, and a rebuild
				// without them would leave it covering text the new document does not hold.
				this.document = createYDoc({
					yjsState: serverState,
					markdown: null,
					patches,
					schema: this.#schema,
				});
				this.#baselineChecksum = crc32Utf8(serverState);
				// Whose baseline won, and whether winning it zeroed the waterline, this answer does not
				// say. The value read before the race describes the document as it was before somebody
				// else wrote it, so it is dropped rather than kept: an unknown lineage costs a queue
				// nothing but the check, a stale one could cost the next session its text.
				this.#materializedUptoId = null;
			}
			else if (applied === false)
			{
				// Refused with no state to rebuild from: this document is out of the collaborative format
				// and this baseline is not the one thing that brings it back - a rebuild of the document's
				// own current text. The local Y.Doc describes text the server no longer holds, and it
				// rejects patches for a non-collaborative document, so carrying on would let someone type
				// into a document whose every keystroke is dropped, with nothing to tell them.
				return GenesisOutcome.REFUSED;
			}
			else
			{
				// The document now holds the baseline this session wrote, so that is the lineage anything
				// queued from here belongs to. An accepted rebuild claim also zeroed the waterline on the
				// server (SaveYjsStateCommand): the value the load response carried belongs to the text
				// that was replaced, and keeping it would make this session's own queue look like a queue
				// of a lineage that is gone.
				this.#baselineChecksum = crc32Utf8(yjsState);
				if (rebuiltFromMarkdown)
				{
					this.#materializedUptoId = 0;
				}
			}
		}
		catch
		{
			// A failed request says nothing about the document: it is not a refusal, and it is not a
			// reason to connect either. Nothing retries it here - the caller tears this provider down,
			// and the genesis is written again only by the next provider built for this document.
			return GenesisOutcome.FAILED;
		}

		return GenesisOutcome.APPLIED;
	}

	// A refusal says the document itself is not collaborative any more, a technical failure says only
	// that this attempt did not get through — but the caller has to hear about both, because either way
	// awareness, flushing and the materialize triggers stayed unwired. Each outcome has its own channel:
	// they end the attempt the same way and differ in everything the caller decides afterwards.
	#reportGenesisOutcome(outcome: string): void
	{
		if (this.#isDestroyed)
		{
			return;
		}

		if (outcome === GenesisOutcome.REFUSED)
		{
			if (this.onGenesisRefused)
			{
				this.onGenesisRefused({ documentId: this.documentId });
			}

			return;
		}

		if (this.onGenesisFailed)
		{
			this.onGenesisFailed();
		}
	}

	// The server refused a patch, and a refusal is final: this document is out of the collaborative format,
	// so nothing this session types can reach it any more. Nothing is torn down here - the Y.Doc still
	// holds what was typed, and it is the only copy of it left. What to do with that text is the feature
	// layer's call, the same as for a refused genesis.
	#handleSaveRefused(): void
	{
		if (this.#isDestroyed)
		{
			return;
		}

		if (this.onSaveRefused)
		{
			this.onSaveRefused({ documentId: this.documentId });
		}
	}

	#initializeAwareness(): void
	{
		this.awareness = new Awareness(this.document);
		this.awareness.setLocalStateField('user', {
			id: this.#userId,
			name: this.#userName,
			color: this.#userColor,
			avatar: this.#userAvatar,
			mode: this.#mode,
		});

		this.#awarenessManager = new AwarenessManager({
			awareness: this.awareness,
			documentId: this.documentId,
			userId: this.#userId,
			userName: this.#userName,
			userColor: this.#userColor,
			userAvatar: this.#userAvatar,
			getMode: () => this.#mode,
			onParticipantsChange: (participants) => {
				if (this.onParticipants)
				{
					this.onParticipants(participants);
				}
			},
			hasPendingUpdates: () => this.#flushManager.hasPendingUpdates(),
		});
		this.#awarenessManager.start();
	}

	// Replays what the pull channel delivered while the state was being read, then goes back to applying
	// patches as they arrive. Order is preserved, and the cursor sorts out what the response already
	// carried: an id at or below it is a duplicate, and the CRDT takes it either way.
	#drainPendingPullPatches(): void
	{
		const buffered = this.#pendingPullPatches;
		this.#pendingPullPatches = null;

		if (buffered === null)
		{
			return;
		}

		for (const { update, params } of buffered)
		{
			this.#applyPulledPatch(update, params);
		}
	}

	#applyPulledPatch(update: Uint8Array, params: ?Object): void
	{
		if (!this.document || this.#isDestroyed)
		{
			return;
		}

		Y.applyUpdate(this.document, update, 'remote');
		this.#trackAppliedPatch(params);

		if (this.#awarenessManager)
		{
			this.#awarenessManager.refreshAllCursors();
		}

		if (params?.cursor && this.#awarenessManager)
		{
			let cursorData = params.cursor;
			if (Type.isString(cursorData))
			{
				try
				{
					cursorData = JSON.parse(cursorData);
				}
				catch
				{
					cursorData = null;
				}
			}

			if (cursorData)
			{
				this.#awarenessManager.handleRemoteAwareness({
					type: 'cursor',
					userId: params.userId,
					position: cursorData,
				});
			}
		}
	}

	#startPullTransport(): void
	{
		this.#pullTransport.start({
			onPatch: (update, params) => {
				if (this.#isDestroyed)
				{
					return;
				}

				// connect()/sync() are reading the state right now: hold the patch instead of dropping it,
				// there being no Y.Doc yet in the first case and no cursor for it yet in the second.
				if (this.#pendingPullPatches !== null)
				{
					this.#pendingPullPatches.push({ update, params });

					return;
				}

				this.#applyPulledPatch(update, params);
			},
			onAwareness: (params) => {
				if (this.#awarenessManager)
				{
					this.#awarenessManager.handleRemoteAwareness(params);
				}
			},
			onOffline: () => {
				if (this.isConnected)
				{
					this.#emitStatus('disconnected');
				}
			},
			onBackOnline: () => {
				if (this.onNeedReconnect)
				{
					this.onNeedReconnect();
				}
			},
			onDocumentUpdate: (params) => {
				if (this.onRemoteDocumentUpdate)
				{
					this.onRemoteDocumentUpdate(params);
				}
			},
			onArchive: (params) => {
				if (this.onRemoteArchive)
				{
					this.onRemoteArchive(params);
				}
			},
			onRestore: (params) => {
				if (this.onRemoteRestore)
				{
					this.onRemoteRestore(params);
				}
			},
			onDelete: (params) => {
				if (this.onRemoteDelete)
				{
					this.onRemoteDelete(params);
				}
			},
			onHardDelete: (params) => {
				if (this.onRemoteHardDelete)
				{
					this.onRemoteHardDelete(params);
				}
			},
			onContentOverwritten: (params) => {
				this.#handleContentOverwritten(params);
			},
			onCapabilities: (params) => {
				if (this.onRemoteCapabilities)
				{
					this.onRemoteCapabilities(params);
				}
			},
			getCollectionId: () => Number(this.collectionId) || 0,
		});
	}

	#handleContentOverwritten(params: Object): void
	{
		if (this.#isDestroyed)
		{
			return;
		}

		if (Number(params?.documentId) !== this.documentId)
		{
			return;
		}

		// Provider only dispatches — feature layer owns the rebuild. Going through connect(null)
		// here pipes raw markdown into ydoc-factory, which has no parser and clobbers the doc
		// with an empty Y.Doc via saveGenesisState.
		if (this.onRemoteContentOverwritten)
		{
			this.onRemoteContentOverwritten(params);
		}
	}

	// Our own patch landed on the server: this session has edited, so a teardown or a work boundary has
	// something worth materializing. Backfill must not set this — it carries other people's patches.
	//
	// The cursor goes through the same continuity check as an incoming patch. Saving our own patch used
	// to advance it unconditionally, which quietly skipped over anything we had missed: seen 8, missed
	// somebody's 9, saved our 10 — the cursor read 10 while the text lacked 9. Materialization would
	// then pin that incomplete text at cursor 10, and a client that did have 9 could no longer correct
	// the projection, because its own cursor was 10 as well and the forward-only guard refuses equals.
	#handleLocalPatchSaved(patchId: mixed, prevPatchId: mixed = null, journalBaseId: mixed = null): void
	{
		this.#hasLocalEdits = true;
		this.#applyPatchCursor(patchId, prevPatchId, journalBaseId);
	}

	#advanceAppliedPatchId(patchId: mixed): void
	{
		if (patchId === null || patchId === undefined)
		{
			return;
		}

		const id = Number(patchId);
		if (Number.isInteger(id) && id > this.#lastAppliedPatchId)
		{
			this.#lastAppliedPatchId = id;
		}
	}

	// Applied-patch cursor + gap detection (ALG-F2). The CRDT applyUpdate already ran; here we only
	// keep #lastAppliedPatchId honest so uptoId for materialization stays correct, and recover when we
	// turn out to have missed a patch.
	#trackAppliedPatch(params: ?Object): void
	{
		this.#applyPatchCursor(params?.patchId, params?.prevPatchId, params?.journalBaseId);
	}

	// Continuity is decided by prevPatchId — the id of the previous patch OF THIS DOCUMENT — not by
	// arithmetic on the ids themselves. b_note_document_updates.ID is a table-wide auto-increment, so
	// two consecutive patches of one document are numbered consecutively only while nobody else on the
	// portal is typing. Treating any jump as a gap therefore refetched on nearly every pull, replaying
	// the whole journal each time.
	#applyPatchCursor(patchId: mixed, prevPatchId: mixed, journalBaseId: mixed = null): void
	{
		if (patchId === null || patchId === undefined)
		{
			return;
		}

		const id = Number(patchId);
		if (!Number.isInteger(id) || id <= this.#lastAppliedPatchId)
		{
			return; // duplicate / reordered — CRDT is idempotent, cursor must not roll back
		}

		// A server that does not send prevPatchId leaves nothing to verify: trust the id, as before.
		if (prevPatchId === null || prevPatchId === undefined)
		{
			this.#lastAppliedPatchId = id;

			return;
		}

		const previousId = Number(prevPatchId);
		if (previousId === this.#lastAppliedPatchId)
		{
			this.#lastAppliedPatchId = id;

			return;
		}

		// prevPatchId === 0 says the journal holds nothing before this patch, and our cursor is above
		// zero, so a compaction cut the journal behind us. It does not say WHAT was cut: journalBaseId -
		// the level the journal now starts from - does. A cursor at or above that level proves the cut
		// took only patches we had already applied, so the cursor moves on without a fetch; that is the
		// path after every compaction and the reason the waterline exists at all. Below the level, the
		// cut also took something we never received: accepting it would write a hole into the cursor,
		// and our own compaction would then persist the incomplete text as the settled state. A server
		// that does not state the waterline (0, or an older build that omits the field) leaves nothing
		// to verify, and an unverified cut is treated as a hole.
		if (previousId === 0)
		{
			const waterline = Number(journalBaseId);
			if (Number.isInteger(waterline) && waterline > 0 && this.#lastAppliedPatchId >= waterline)
			{
				this.#lastAppliedPatchId = id;

				return;
			}

			this.#recoverFromGap();

			return;
		}

		// The patch does not continue what we hold - something never reached us.
		this.#recoverFromGap();
	}

	// A hole in the applied patches. It cannot be closed from the journal alone: whatever is missing may
	// already have been compacted out of it, and re-reading the journal would then leave the hole open
	// while the cursor claimed otherwise. The consistent state is the snapshot plus the journal on top of
	// it - the same authoritative state sync() applies - so recovery goes through that.
	//
	// The cursor is deliberately left where it is until the state arrives: until then the text does not
	// cover this patch, and #hasJournalGap keeps materialization from publishing it.
	#recoverFromGap(): void
	{
		this.#hasJournalGap = true;

		if (this.#recovery !== null)
		{
			// The fetch already in the air was issued before this gap was known, so it cannot answer for
			// it. Queue one more pass instead of dropping the signal.
			this.#recoveryQueued = true;

			return;
		}

		this.#recovery = this.#loadAuthoritativeState().then(() => {
			this.#recovery = null;
			if (this.#recoveryQueued)
			{
				this.#recoveryQueued = false;
				this.#recoverFromGap();
			}
		});
	}

	/**
	 * @return true if the server state was read and applied to the live Y.Doc.
	 */
	async #loadAuthoritativeState(): Promise<boolean>
	{
		if (!this.document || this.#isDestroyed)
		{
			return false;
		}

		try
		{
			const response = await DocumentService.loadForCollaboration({ documentId: this.documentId });
			if (!this.document || this.#isDestroyed)
			{
				return false;
			}

			this.#applyServerState(response?.data ?? {});

			return true;
		}
		catch
		{
			// The hole stays open: the next patch that does not continue ours retries, and until then
			// nothing publishes this text as the document projection. CRDT convergence is unaffected.
			return false;
		}
	}

	// Waits out a recovery that is already running, so a caller about to publish the text gives the
	// missing patches their one round trip. A pass queued behind this one is not waited for - the gap
	// flag still tells the caller the text is not whole.
	async #awaitRecovery(): Promise<void>
	{
		const recovery = this.#recovery;
		if (recovery !== null)
		{
			await recovery;
		}
	}

	// The authoritative state: the snapshot as the baseline, the surviving journal on top of it. Whatever
	// a hole in the cursor was hiding is inside one or the other, so applying both closes it.
	#applyServerState(data: Object): void
	{
		const yjsState = data?.yjsState ?? null;
		const patches = Array.isArray(data?.patches) ? data.patches : [];
		// The lineage travels with the state: this read is as authoritative as the one connect() made, and
		// a queue put away after it must be weighed against what was read here.
		this.#adoptBaseline(data, yjsState);

		if (Type.isStringFilled(yjsState))
		{
			Y.applyUpdate(this.document, base64ToUint8Array(yjsState), 'remote');
		}

		for (const patch of patches)
		{
			const raw = String(patch.PATCH || patch.patch || '');
			if (raw.length > 0)
			{
				Y.applyUpdate(this.document, base64ToUint8Array(raw), 'remote');
			}
		}

		// The live Y.Doc is kept, so the cursor only moves forward: a lagging replica/cache behind
		// loadForCollaboration must not roll it back and break uptoId.
		this.#advanceAppliedPatchId(resolveAppliedCursor(patches, data?.lastPatchId));
		this.#hasJournalGap = false;
	}

	#getCursorPosition(): Object | null
	{
		if (!this.awareness)
		{
			return null;
		}

		const localState = this.awareness.getLocalState();

		return localState?.cursor ?? null;
	}

	#emitStatus(status: string): void
	{
		// A destroyed provider owns nothing on screen any more: a late status of its own would overwrite
		// what the live provider has already put there.
		if (this.#isDestroyed || !this.onStatus)
		{
			return;
		}

		this.onStatus({ status });
	}
}
