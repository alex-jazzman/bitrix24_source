import {Type} from 'main.core';
import Compressor from 'compressorjs/src/index';
import allowedSizeProps from './internal/allowed-size-props';
import cloneBlob from './internal/clone-blob';
import isBlob from './internal/is-blob';
import revokeObjectUrl from './internal/revoke-object-url';
import toCurrentWindowBlob from './internal/to-current-window-blob';
import urlToBlob from './internal/url-to-blob';
import type {ImageCompressorOptions} from './types';

export class ImageCompressor
{
	static maxOriginalPngSize = 5 * 1024 * 1024;

	constructor(file, options: ImageCompressorOptions = {})
	{
		this.file = file;
		this.options = {quality: 0.8, ...options};

		if (this.options.retina)
		{
			allowedSizeProps.forEach((prop) => {
				if (Type.isNumber(this.options[prop]))
				{
					this.options[prop] *= 2;
				}
			});
		}
	}

	/**
	 * Compresses an image and answers with an object of its own on every call, never with
	 * the one it was given, so the caller is free to modify the result.
	 *
	 * @param {Blob|File|string} file
	 * @param {ImageCompressorOptions} options
	 * @returns {Promise<Blob|File>}
	 */
	static compress(file, options: ImageCompressorOptions = {}): Promise<File>
	{
		return urlToBlob(file)
			.then((blob) => {
				// anything else is left for the compressor to refuse: cloning it would rebuild
				// it into 15 bytes and answer with them as with a compressed image
				if (isBlob(blob) && Type.isStringFilled(blob.type))
				{
					if (
						blob.type.includes('gif')
						|| (
							blob.type.includes('png')
							&& blob.size < ImageCompressor.maxOriginalPngSize
						)
					)
					{
						return cloneBlob(blob);
					}
				}

				const source = toCurrentWindowBlob(blob);

				return new ImageCompressor(source, options)
					.compress()
					// compressorjs answers with the very object it was given when compressing it
					// makes no sense
					.then((result) => (result === source ? cloneBlob(result) : result));
			});
	}

	compress(): Promise<File>
	{
		let instance = null;

		return new Promise((resolve, reject) => {
			instance = new Compressor(
				this.file,
				{...this.options, ...{success: resolve, error: reject}},
			);
		})
			// compressorjs releases the object URL of the source file only when `checkOrientation`
			// is off, so on the default path it would be held until the page is reloaded.
			// `image` is a field of the library implementation, not of its public API: recheck it
			// when the version changes — the tests of the release fail once it stops holding the URL.
			.finally(() => {
				revokeObjectUrl(instance?.image?.src);
			});
	}
}