import { Type } from 'main.core';
import * as Y from 'yjs';
import { PATCH_PERSISTENCE_MAX_SIZE } from '../const';
import { uint8ArrayToBase64, base64ToUint8Array } from '../utils/binary';
import { crc32Utf8 } from '../utils/checksum';
import { readBaselineCursor } from './baseline-cursor';

export class PatchPersistence
{
	static #storageKey(documentId: number): string
	{
		return `note_unsent_patches_${documentId}`;
	}

	// A key of its own rather than a wrapper around the queue: the stored value is a merged Y update in
	// base64 and every reader of it - including a bundle already running in a browser - expects exactly
	// that. A satellite key an older bundle never reads costs it nothing, and a queue stored without one
	// is simply a queue whose lineage is unknown.
	static #baselineKey(documentId: number): string
	{
		return `note_unsent_patches_baseline_${documentId}`;
	}

	/**
	 * @return the queue as it now stands in storage, or null when this call stored nothing - an oversized
	 * merge and a failed write both leave whatever was there before. The caller cannot tell the two apart
	 * from the outside, and it needs to: the lineage record names its queue by checksum, so it may only be
	 * written for a queue this call actually put there.
	 */
	static save(documentId: number, patch: string): string | null
	{
		try
		{
			const key = PatchPersistence.#storageKey(documentId);
			const existing = PatchPersistence.load(documentId);

			const merged = existing === null
				? patch
				: uint8ArrayToBase64(Y.mergeUpdates([
					base64ToUint8Array(existing),
					base64ToUint8Array(patch),
				]));

			if (merged.length > PATCH_PERSISTENCE_MAX_SIZE)
			{
				return null;
			}

			localStorage.setItem(key, merged);

			return merged;
		}
		catch
		{
			// localStorage unavailable or quota exceeded — silent degrade
			return null;
		}
	}

	static load(documentId: number): string | null
	{
		try
		{
			const key = PatchPersistence.#storageKey(documentId);
			const value = localStorage.getItem(key);
			if (Type.isStringFilled(value))
			{
				return value;
			}

			return null;
		}
		catch
		{
			return null;
		}
	}

	// The baseline the queue was written against: the waterline of the document as this tab knew it, and
	// the checksum of the state the Y.Doc was built from. Together they say WHICH lineage the queue
	// continues, which the queue itself cannot - a Y update carries no document identity, so a queue of
	// the text an overwrite replaced applies onto the text that replaced it just as cleanly.
	// `queueChecksum` names the queue this record is about. Without it the record could outlive what it
	// describes: a bundle that does not know this key clears the queue and leaves the satellite behind, and
	// the next queue stored under that key would be weighed against a lineage that was never its own. It is
	// computed from `queue`, which the caller must pass exactly as save() reported storing it - re-reading
	// storage here would checksum up to five megabytes a second time for no new information.
	static saveBaseline(documentId: number, baseline: Object, queue: string): void
	{
		try
		{
			localStorage.setItem(
				PatchPersistence.#baselineKey(documentId),
				JSON.stringify({
					materializedUptoId: readBaselineCursor(baseline?.materializedUptoId),
					checksum: String(baseline?.checksum ?? ''),
					queueChecksum: crc32Utf8(queue),
				}),
			);
		}
		catch
		{
			// localStorage unavailable or quota exceeded - the queue then reads as one of unknown lineage
		}
	}

	static loadBaseline(documentId: number): Object | null
	{
		try
		{
			const raw = localStorage.getItem(PatchPersistence.#baselineKey(documentId));
			if (!Type.isStringFilled(raw))
			{
				return null;
			}

			const parsed = JSON.parse(raw);

			return Type.isPlainObject(parsed) ? parsed : null;
		}
		catch
		{
			return null;
		}
	}

	static clear(documentId: number): void
	{
		try
		{
			localStorage.removeItem(PatchPersistence.#storageKey(documentId));
			localStorage.removeItem(PatchPersistence.#baselineKey(documentId));
		}
		catch
		{
			// silent
		}
	}
}
