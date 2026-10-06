import { EventEmitter, BaseEvent } from 'main.core.events';
import { NoteEvent } from 'note.sidebar';
import { DocumentService } from '../application/document-service';

// Non-destructive sibling of CompactManager: it ships the current markdown + uptoId so the server
// can refresh CONTENT_UPDATED_AT, but never touches the patch journal or the yjsState snapshot.
// Idempotent by a cheap markdown hash so the many work-boundary triggers (typing pause, finishEdit,
// visibilitychange, idle, softReconnect, SPA teardown) collapse to at most one send per change.
export class MaterializeManager
{
	#documentId: number;
	#getCollectionId: (() => number) | null;
	#lastMaterializedHash: string | null;
	#lastMaterializedUpto: number;
	#inFlightKey: string | null;
	#inFlight: Promise<void> | null;

	constructor(
		{ documentId, getCollectionId = null }: {
			documentId: number,
			getCollectionId?: (() => number) | null,
		},
	)
	{
		this.#documentId = documentId;
		this.#getCollectionId = typeof getCollectionId === 'function' ? getCollectionId : null;
		this.#lastMaterializedHash = null;
		this.#lastMaterializedUpto = 0;
		this.#inFlightKey = null;
		this.#inFlight = null;
	}

	async materialize(
		{ getEditorMarkdown, getUptoId }: {
			getEditorMarkdown: () => string | null,
			getUptoId: () => number,
		},
	): Promise<void>
	{
		const markdown = typeof getEditorMarkdown === 'function' ? getEditorMarkdown() : null;
		if (typeof markdown !== 'string')
		{
			return;
		}

		const uptoId = Number(typeof getUptoId === 'function' ? getUptoId() : 0) || 0;
		const hash = this.#cheapHash(markdown);
		if (hash === this.#lastMaterializedHash && uptoId <= this.#lastMaterializedUpto)
		{
			return; // text and cursor unchanged since the last successful materialize
		}

		// The hash above only de-dupes against a FINISHED send. Boundaries love to arrive together — a
		// typing pause, leaving edit mode, the tab going hidden and the provider being torn down all land
		// within the same moment — and without this every one of them would ship the same full markdown
		// over its own request. Joining the in-flight send makes them one. The slot clears in finally, so
		// a failed or locked attempt is retried, and a send for different text/cursor never joins the
		// wrong request.
		const key = `${hash}:${uptoId}`;
		if (this.#inFlight !== null && this.#inFlightKey === key)
		{
			return this.#inFlight;
		}

		this.#inFlightKey = key;
		this.#inFlight = this.#send(markdown, uptoId, hash).finally(() => {
			if (this.#inFlightKey === key)
			{
				this.#inFlightKey = null;
				this.#inFlight = null;
			}
		});

		return this.#inFlight;
	}

	async #send(markdown: string, uptoId: number, hash: string): Promise<void>
	{
		try
		{
			const response = await DocumentService.materialize({
				documentId: this.#documentId,
				markdown,
				uptoId,
			});

			const data = response?.data;
			if (data?.locked)
			{
				return; // someone else holds the compact lock — skip this tick, retry on the next trigger
			}

			// `applied` is the forward-only guard's answer: it refused this cursor and stored nothing, so
			// remembering the text as materialized would mean never sending it again. A server still on the
			// previous contract answers without the field, where `success` carried that same meaning.
			const applied = data?.applied ?? Boolean(data?.success);
			// Sends with different keys do not join, so two can be in flight at once and their answers can
			// come back in the other order. The cursor check keeps the later answer from rolling the
			// watermark back and from publishing a preview of text that is already superseded.
			if (applied && uptoId >= this.#lastMaterializedUpto)
			{
				this.#lastMaterializedHash = hash;
				this.#lastMaterializedUpto = uptoId;
				this.#emitExcerpt(data?.excerpt);
			}
		}
		catch
		{
			// Materialize errors are non-fatal — the next trigger or compaction carries the text.
		}
	}

	// Emitted from the manager rather than the provider: the last materialize of a document is fired off
	// while the provider is being torn down, so by the time the answer arrives there is no provider left
	// to ask. An empty string is a valid preview of an emptied document and must travel too.
	#emitExcerpt(excerpt: mixed): void
	{
		if (typeof excerpt !== 'string')
		{
			return; // a server on the previous contract answers without a preview
		}

		EventEmitter.emit(NoteEvent.DOCUMENT_EXCERPT_CHANGED, new BaseEvent({
			data: {
				documentId: this.#documentId,
				collectionId: this.#getCollectionId === null ? 0 : Number(this.#getCollectionId()) || 0,
				excerpt,
			},
		}));
	}

	// Cheap, non-cryptographic hash (djb2 over char codes, prefixed with length). Only needs to
	// answer "did the markdown change" — collisions across genuinely different text are acceptable.
	#cheapHash(text: string): string
	{
		let hash = 5381;
		for (let i = 0; i < text.length; i++)
		{
			hash = ((hash << 5) + hash + text.charCodeAt(i)) | 0;
		}

		return `${text.length}:${hash}`;
	}
}
