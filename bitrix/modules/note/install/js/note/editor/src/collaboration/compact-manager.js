import * as Y from 'yjs';
import { DocumentService } from '../application/document-service';
import { uint8ArrayToBase64, base64ToUint8Array } from '../utils/binary';
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

	async compact(
		{ document, getEditorMarkdown }: { document: Object, getEditorMarkdown: () => string | null },
	): Promise<void>
	{
		if (!document)
		{
			return;
		}

		try
		{
			const patchResponse = await DocumentService.loadPatches({
				documentId: this.#documentId,
			});

			const patchData = patchResponse?.data;
			const patches = Array.isArray(patchData?.patches) ? patchData.patches : [];
			const serverLastPatchId = patchData?.lastPatchId ?? null;

			if (!serverLastPatchId)
			{
				return;
			}

			for (const patch of patches)
			{
				const raw = String(patch.PATCH || patch.patch || '');
				if (raw.length > 0)
				{
					Y.applyUpdate(document, base64ToUint8Array(raw), 'remote');
				}
			}

			const markdown = getEditorMarkdown();
			if (typeof markdown !== 'string')
			{
				return;
			}

			const fullState = Y.encodeStateAsUpdate(document);
			const yjsState = uint8ArrayToBase64(fullState);

			await DocumentService.compact({
				documentId: this.#documentId,
				markdown,
				processedUpToId: serverLastPatchId,
				yjsState,
			});
		}
		catch
		{
			// Compact errors are non-fatal — patches accumulate and will be compacted later
		}
	}

	startInterval(
		{ document, getEditorMarkdown }: { document: Object, getEditorMarkdown: () => string | null },
	): void
	{
		this.stopInterval();
		this.#compactIntervalTimer = setInterval(() => {
			void this.compact({ document, getEditorMarkdown });
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
