import {Type} from 'main.core';

/**
 * Rebuilds a blob with the constructors of the current window.
 *
 * A named source stays a named file: the name is part of the compressed result, and its
 * extension follows the mime type the compression produced.
 *
 * @param {Blob|File} blob
 * @returns {Blob|File}
 */
export default function cloneBlob(blob)
{
	const type = Type.isStringFilled(blob.type) ? blob.type : '';

	if (!Type.isStringFilled(blob.name))
	{
		return new Blob([blob], {type});
	}

	return new File([blob], blob.name, {type, lastModified: blob.lastModified});
}
