import { Type } from 'main.core';
import * as Y from 'yjs';
import { PATCH_PERSISTENCE_MAX_SIZE } from '../const';
import { uint8ArrayToBase64, base64ToUint8Array } from '../utils/binary';

export class PatchPersistence
{
	static #storageKey(documentId: number): string
	{
		return `note_unsent_patches_${documentId}`;
	}

	static save(documentId: number, patch: string): void
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
				return;
			}

			localStorage.setItem(key, merged);
		}
		catch
		{
			// localStorage unavailable or quota exceeded — silent degrade
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

	static clear(documentId: number): void
	{
		try
		{
			localStorage.removeItem(PatchPersistence.#storageKey(documentId));
		}
		catch
		{
			// silent
		}
	}
}
