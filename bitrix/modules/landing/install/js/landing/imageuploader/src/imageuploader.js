import {Type} from 'main.core';
import {ImageCompressor} from 'landing.imagecompressor';
import {Backend} from 'landing.backend';
import type ImageUploaderOptions from './types/imageuploader.options';
import cloneFile from './internal/clone-file';
import renameX from './internal/renamex';

// Copied from the `init()` of the vendored compressorjs: with any of these the compressor
// refused the input before it started loading the image, so compression is off for every file
// and not for this one. Recheck the texts when the library is updated. The reliable signal is
// the stage the failure came from, and it is readable only inside `landing.imagecompressor`.
const refusedInputMessages = new Set([
	'The first argument must be a File or Blob object.',
	'The first argument must be an image File or Blob object.',
	'The current browser does not support image compression.',
]);

/**
 * @memberOf BX.Landing
 */
export class ImageUploader
{
	constructor(options: ImageUploaderOptions)
	{
		this.options = {
			uploadParams: {},
			additionalParams: {},
			dimensions: {},
			sizes: ['1x'],
			...options,
		};
	}

	setSizes(sizes: Array<string>): ImageUploader
	{
		this.options.sizes = sizes;
		return this;
	}

	getDimensions(): Array<number>
	{
		const dimensions = Object.entries(this.options.dimensions);

		return (
			this.options.sizes
				.map(size => Number.parseInt(size))
				.filter(size => Type.isNumber(size))
				.map((size) => {
					return dimensions.reduce((acc, [key, value]) => {
						acc[key] = value * size;
						return acc;
					}, {});
				})
		);
	}

	/**
	 * Uploads a file in every requested size.
	 *
	 * Only a file is accepted: given a URL `ImageCompressor` loads it itself, and the failure
	 * of that load is reported as a failed compression by `#reportCompressionFailure()`.
	 *
	 * @param {File|Blob} file
	 * @param {Object} [additionalParams]
	 * @returns {Promise<Array>}
	 */
	upload(file, additionalParams = {})
	{
		const uploadParams = {
			...this.options.uploadParams,
			...this.options.additionalParams,
			...additionalParams,
		};

		return this.#compress(file)
			.then((files) => this.#upload(file, files, uploadParams));
	}

	#isSvg(file): boolean
	{
		return (
			Boolean(this.options.allowSvg)
			&& Type.isStringFilled(file.type)
			&& file.type.includes('svg')
		);
	}

	// `null` marks a size whose compression failed.
	#compress(file): Promise<Array<?File>>
	{
		if (this.#isSvg(file))
		{
			return Promise.resolve(this.getDimensions().map(() => cloneFile(file)));
		}

		// The sizes compress the same file and usually fail the same way, so a reason is
		// reported once per upload however many sizes failed for it.
		const failures = new Map();

		const compressed = this.getDimensions().map((dimensions) => {
			return ImageCompressor
				.compress(file, dimensions)
				.catch((error) => {
					failures.set(error?.message, error);

					return null;
				});
		});

		return Promise.all(compressed).then((files) => {
			failures.forEach((error) => {
				this.#reportCompressionFailure(error);
			});

			return files;
		});
	}

	// The fallback to the original keeps a failed compression from breaking the upload, so the
	// reason has to stay readable in the report: an image the compressor could not handle is
	// expected, anything else means compression is off for every image and has to be fixed.
	#reportCompressionFailure(error)
	{
		const isImageFailure = (
			error instanceof Error
			&& error.constructor === Error
			&& !refusedInputMessages.has(error.message)
		);

		if (isImageFailure)
		{
			console.error(
				'BX.Landing.ImageUploader: image compression failed, the original file is uploaded',
				error,
			);

			return;
		}

		console.error(
			'BX.Landing.ImageUploader: image compression is broken, the original file is uploaded',
			error,
		);
	}

	// A failed compression must not break the upload, but the original is full size:
	// all the sizes that fell back to it share a single upload instead of sending it each.
	#upload(file, files, uploadParams): Promise<Array>
	{
		let originalUpload = null;

		const uploads = files.map((compressed, index) => {
			if (compressed !== null)
			{
				return Backend.getInstance()
					.upload(this.#nameForSize(compressed, index), uploadParams);
			}

			if (originalUpload === null)
			{
				originalUpload = Backend.getInstance()
					.upload(this.#nameForSize(cloneFile(file), index), uploadParams);
			}

			return originalUpload;
		});

		return Promise.all(uploads);
	}

	// The upload name is read by the backend right when the upload starts.
	#nameForSize(file, index): File
	{
		const {name} = file;
		Object.defineProperty(file, 'name', {
			get: () => renameX(name, index + 1),
			configurable: true,
		});

		return file;
	}
}