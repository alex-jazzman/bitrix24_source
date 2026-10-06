import {Type} from 'main.core';

/**
 * Makes an independent copy of a file.
 *
 * Every requested size gets its own copy: the upload name is set on the file itself
 * through `Object.defineProperty`, so a shared object would be renamed once per size.
 *
 * @param {Blob|File} file
 * @returns {Blob|File}
 */
export default function cloneFile(file)
{
	const type = Type.isStringFilled(file.type) ? file.type : '';

	if (!Type.isStringFilled(file.name))
	{
		return new Blob([file], {type});
	}

	return new File([file], file.name, {type, lastModified: file.lastModified});
}
