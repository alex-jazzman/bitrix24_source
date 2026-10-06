import * as Y from 'yjs';
import { DocumentService } from '../application/document-service';
import { uint8ArrayToBase64 } from '../utils/binary';
import { COMPACT_INTERVAL_MS } from '../const';

export class CompactManager
{
	#documentId: number;
	#compactIntervalTimer: number | null;

	constructor({ documentId }: { documentId: number })
	{
		this.#documentId = documentId;
		this.#compactIntervalTimer = null;
	}

	// Pure transport: the snapshot of the document it is handed, published under the cursor it is handed.
	// Neither is decided here. The document has to be brought level with the server state first, because
	// the server drains the journal up to processedUpToId and keeps nothing but this snapshot - a cursor
	// covering text the snapshot lacks deletes that text for good. Only the provider knows whether that
	// holds, so it does the reading and this only sends.
	//
	// @return true when the server drained the window; false when nothing was sent or the server stood
	//         down, so the caller keeps treating the window as still open.
	async compact(
		{ document, getEditorMarkdown, processedUpToId }: {
			document: Object,
			getEditorMarkdown: () => string | null,
			processedUpToId: number,
		},
	): Promise<boolean>
	{
		if (!document)
		{
			return false;
		}

		const uptoId = Number(processedUpToId);
		if (!Number.isInteger(uptoId) || uptoId <= 0)
		{
			return false; // nothing has been applied yet, so there is nothing to drain behind us
		}

		const markdown = getEditorMarkdown();
		if (typeof markdown !== 'string')
		{
			return false;
		}

		try
		{
			const fullState = Y.encodeStateAsUpdate(document);
			const yjsState = uint8ArrayToBase64(fullState);

			const response = await DocumentService.compact({
				documentId: this.#documentId,
				markdown,
				processedUpToId: uptoId,
				yjsState,
			});

			// 'locked' means another editor holds the compact lock: our journal window was left untouched,
			// so this attempt has settled nothing and the next trigger has to ask again.
			return response?.data?.success === true;
		}
		catch
		{
			// Compact errors are non-fatal — patches accumulate and will be compacted later
			return false;
		}
	}

	// The tick calls back instead of compacting on its own: whether compaction may run at all is decided
	// by the provider, which is the only one that knows the document is whole. A timer that went straight
	// to compact() here would be a way around that decision.
	startInterval(onTick: () => mixed): void
	{
		this.stopInterval();
		this.#compactIntervalTimer = setInterval(() => {
			onTick();
		}, COMPACT_INTERVAL_MS);
	}

	stopInterval(): void
	{
		if (this.#compactIntervalTimer !== null)
		{
			clearInterval(this.#compactIntervalTimer);
			this.#compactIntervalTimer = null;
		}
	}

	destroy(): void
	{
		this.stopInterval();
	}
}
