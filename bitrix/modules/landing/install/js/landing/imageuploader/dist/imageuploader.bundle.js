/* eslint-disable */
this.BX = this.BX || {};
(function (exports, main_core, landing_imagecompressor, landing_backend) {
	'use strict';

	/**
	 * Makes an independent copy of a file.
	 *
	 * Every requested size gets its own copy: the upload name is set on the file itself
	 * through `Object.defineProperty`, so a shared object would be renamed once per size.
	 *
	 * @param {Blob|File} file
	 * @returns {Blob|File}
	 */
	function cloneFile(file) {
		const type = main_core.Type.isStringFilled(file.type) ? file.type : '';
		if (!main_core.Type.isStringFilled(file.name)) {
			return new Blob([file], {
				type
			});
		}
		return new File([file], file.name, {
			type,
			lastModified: file.lastModified
		});
	}

	function renameX(filename, x) {
		const name = filename.replace(/@[1-9]x/, '');
		let extension = BX.util.getExtension(name);
		if (extension.length > 4) {
			extension = extension.split('_').pop();
		}
		return name ? name.replace(/\.[^.]+$/, `@${x}x.${extension}`) : name;
	}

	// Copied from the `init()` of the vendored compressorjs: with any of these the compressor
	// refused the input before it started loading the image, so compression is off for every file
	// and not for this one. Recheck the texts when the library is updated. The reliable signal is
	// the stage the failure came from, and it is readable only inside `landing.imagecompressor`.
	const refusedInputMessages = new Set(['The first argument must be a File or Blob object.', 'The first argument must be an image File or Blob object.', 'The current browser does not support image compression.']);

	/**
	 * @memberOf BX.Landing
	 */
	class ImageUploader {
		constructor(options) {
			this.options = {
				uploadParams: {},
				additionalParams: {},
				dimensions: {},
				sizes: ['1x'],
				...options
			};
		}
		setSizes(sizes) {
			this.options.sizes = sizes;
			return this;
		}
		getDimensions() {
			const dimensions = Object.entries(this.options.dimensions);
			return this.options.sizes.map(size => Number.parseInt(size)).filter(size => main_core.Type.isNumber(size)).map(size => {
				return dimensions.reduce((acc, [key, value]) => {
					acc[key] = value * size;
					return acc;
				}, {});
			});
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
		upload(file, additionalParams = {}) {
			const uploadParams = {
				...this.options.uploadParams,
				...this.options.additionalParams,
				...additionalParams
			};
			return this.#compress(file).then(files => this.#upload(file, files, uploadParams));
		}
		#isSvg(file) {
			return Boolean(this.options.allowSvg) && main_core.Type.isStringFilled(file.type) && file.type.includes('svg');
		}

		// `null` marks a size whose compression failed.
		#compress(file) {
			if (this.#isSvg(file)) {
				return Promise.resolve(this.getDimensions().map(() => cloneFile(file)));
			}

			// The sizes compress the same file and usually fail the same way, so a reason is
			// reported once per upload however many sizes failed for it.
			const failures = new Map();
			const compressed = this.getDimensions().map(dimensions => {
				return landing_imagecompressor.ImageCompressor.compress(file, dimensions).catch(error => {
					failures.set(error?.message, error);
					return null;
				});
			});
			return Promise.all(compressed).then(files => {
				failures.forEach(error => {
					this.#reportCompressionFailure(error);
				});
				return files;
			});
		}

		// The fallback to the original keeps a failed compression from breaking the upload, so the
		// reason has to stay readable in the report: an image the compressor could not handle is
		// expected, anything else means compression is off for every image and has to be fixed.
		#reportCompressionFailure(error) {
			const isImageFailure = error instanceof Error && error.constructor === Error && !refusedInputMessages.has(error.message);
			if (isImageFailure) {
				console.error('BX.Landing.ImageUploader: image compression failed, the original file is uploaded', error);
				return;
			}
			console.error('BX.Landing.ImageUploader: image compression is broken, the original file is uploaded', error);
		}

		// A failed compression must not break the upload, but the original is full size:
		// all the sizes that fell back to it share a single upload instead of sending it each.
		#upload(file, files, uploadParams) {
			let originalUpload = null;
			const uploads = files.map((compressed, index) => {
				if (compressed !== null) {
					return landing_backend.Backend.getInstance().upload(this.#nameForSize(compressed, index), uploadParams);
				}
				if (originalUpload === null) {
					originalUpload = landing_backend.Backend.getInstance().upload(this.#nameForSize(cloneFile(file), index), uploadParams);
				}
				return originalUpload;
			});
			return Promise.all(uploads);
		}

		// The upload name is read by the backend right when the upload starts.
		#nameForSize(file, index) {
			const {
				name
			} = file;
			Object.defineProperty(file, 'name', {
				get: () => renameX(name, index + 1),
				configurable: true
			});
			return file;
		}
	}

	exports.ImageUploader = ImageUploader;

})(this.BX.Landing = this.BX.Landing || {}, BX, BX.Landing, BX.Landing);
//# sourceMappingURL=imageuploader.bundle.js.map
