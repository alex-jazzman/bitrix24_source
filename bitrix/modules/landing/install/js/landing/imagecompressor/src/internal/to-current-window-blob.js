import cloneBlob from './clone-blob';
import isBlob from './is-blob';

// Every requested size compresses the same input, so the rebuilt object is reused
// instead of being created anew for each of them.
const rebuilt = new WeakMap();

/**
 * Rebuilds a file created in another window with the constructors of the current one.
 *
 * Every window has its own Blob and File constructors, so a File from another window
 * (the editor is multi-window) does not pass the `instanceof Blob` check of the compressor
 * and is rejected with "The first argument must be a File or Blob object".
 *
 * @param {Blob|File} blob
 * @returns {Blob|File}
 */
export default function toCurrentWindowBlob(blob)
{
	const isForeignBlob = !(blob instanceof Blob) && isBlob(blob);

	if (!isForeignBlob)
	{
		return blob;
	}

	if (!rebuilt.has(blob))
	{
		rebuilt.set(blob, cloneBlob(blob));
	}

	return rebuilt.get(blob);
}
