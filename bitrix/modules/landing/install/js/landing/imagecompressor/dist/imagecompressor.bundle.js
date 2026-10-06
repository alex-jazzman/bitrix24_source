/* eslint-disable */
this.BX = this.BX || {};
(function (exports, main_core) {
	'use strict';

	function getDefaultExportFromCjs (x) {
		return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, 'default') ? x['default'] : x;
	}

	var canvasToBlob = {exports: {}};

	/*
	 * JavaScript Canvas to Blob
	 * https://github.com/blueimp/JavaScript-Canvas-to-Blob
	 *
	 * Copyright 2012, Sebastian Tschan
	 * https://blueimp.net
	 *
	 * Licensed under the MIT license:
	 * https://opensource.org/licenses/MIT
	 *
	 * Based on stackoverflow user Stoive's code snippet:
	 * http://stackoverflow.com/q/4998908
	 */

	var hasRequiredCanvasToBlob;

	function requireCanvasToBlob () {
		if (hasRequiredCanvasToBlob) return canvasToBlob.exports;
		hasRequiredCanvasToBlob = 1;
		(function (module) {
			(function (window) {

				var CanvasPrototype = window.HTMLCanvasElement && window.HTMLCanvasElement.prototype;
				var hasBlobConstructor = window.Blob && function () {
					try {
						return Boolean(new Blob());
					} catch (e) {
						return false;
					}
				}();
				var hasArrayBufferViewSupport = hasBlobConstructor && window.Uint8Array && function () {
					try {
						return new Blob([new Uint8Array(100)]).size === 100;
					} catch (e) {
						return false;
					}
				}();
				var BlobBuilder = window.BlobBuilder || window.WebKitBlobBuilder || window.MozBlobBuilder || window.MSBlobBuilder;
				var dataURIPattern = /^data:((.*?)(;charset=.*?)?)(;base64)?,/;
				var dataURLtoBlob = (hasBlobConstructor || BlobBuilder) && window.atob && window.ArrayBuffer && window.Uint8Array && function (dataURI) {
					var matches, mediaType, isBase64, dataString, byteString, arrayBuffer, intArray, i, bb;
					// Parse the dataURI components as per RFC 2397
					matches = dataURI.match(dataURIPattern);
					if (!matches) {
						throw new Error('invalid data URI');
					}
					// Default to text/plain;charset=US-ASCII
					mediaType = matches[2] ? matches[1] : 'text/plain' + (matches[3] || ';charset=US-ASCII');
					isBase64 = !!matches[4];
					dataString = dataURI.slice(matches[0].length);
					if (isBase64) {
						// Convert base64 to raw binary data held in a string:
						byteString = atob(dataString);
					} else {
						// Convert base64/URLEncoded data component to raw binary:
						byteString = decodeURIComponent(dataString);
					}
					// Write the bytes of the string to an ArrayBuffer:
					arrayBuffer = new ArrayBuffer(byteString.length);
					intArray = new Uint8Array(arrayBuffer);
					for (i = 0; i < byteString.length; i += 1) {
						intArray[i] = byteString.charCodeAt(i);
					}
					// Write the ArrayBuffer (or ArrayBufferView) to a blob:
					if (hasBlobConstructor) {
						return new Blob([hasArrayBufferViewSupport ? intArray : arrayBuffer], {
							type: mediaType
						});
					}
					bb = new BlobBuilder();
					bb.append(arrayBuffer);
					return bb.getBlob(mediaType);
				};
				if (window.HTMLCanvasElement && !CanvasPrototype.toBlob) {
					if (CanvasPrototype.mozGetAsFile) {
						CanvasPrototype.toBlob = function (callback, type, quality) {
							var self = this;
							setTimeout(function () {
								if (quality && CanvasPrototype.toDataURL && dataURLtoBlob) {
									callback(dataURLtoBlob(self.toDataURL(type, quality)));
								} else {
									callback(self.mozGetAsFile('blob', type));
								}
							});
						};
					} else if (CanvasPrototype.toDataURL && dataURLtoBlob) {
						if (CanvasPrototype.msToBlob) {
							CanvasPrototype.toBlob = function (callback, type, quality) {
								var self = this;
								setTimeout(function () {
									if ((type && type !== 'image/png' || quality) && CanvasPrototype.toDataURL && dataURLtoBlob) {
										callback(dataURLtoBlob(self.toDataURL(type, quality)));
									} else {
										callback(self.msToBlob(type));
									}
								});
							};
						} else {
							CanvasPrototype.toBlob = function (callback, type, quality) {
								var self = this;
								setTimeout(function () {
									callback(dataURLtoBlob(self.toDataURL(type, quality)));
								});
							};
						}
					}
				}
				if (module.exports) {
					module.exports = dataURLtoBlob;
				} else {
					window.dataURLtoBlob = dataURLtoBlob;
				}
			})(window); 
		} (canvasToBlob));
		return canvasToBlob.exports;
	}

	var canvasToBlobExports = requireCanvasToBlob();
	var toBlob = /*@__PURE__*/getDefaultExportFromCjs(canvasToBlobExports);

	var isBlob$2;
	var hasRequiredIsBlob;

	function requireIsBlob () {
		if (hasRequiredIsBlob) return isBlob$2;
		hasRequiredIsBlob = 1;

		isBlob$2 = value => {
			if (typeof Blob === 'undefined') {
				return false;
			}
			return value instanceof Blob || Object.prototype.toString.call(value) === '[object Blob]';
		};
		return isBlob$2;
	}

	var isBlobExports = requireIsBlob();
	var isBlob$1 = /*@__PURE__*/getDefaultExportFromCjs(isBlobExports);

	var DEFAULTS = {
		/**
		 * Indicates if output the original image instead of the compressed one
		 * when the size of the compressed image is greater than the original one's
		 * @type {boolean}
		 */
		strict: true,
		/**
		 * Indicates if read the image's Exif Orientation information,
		 * and then rotate or flip the image automatically.
		 * @type {boolean}
		 */
		checkOrientation: true,
		/**
		 * The max width of the output image.
		 * @type {number}
		 */
		maxWidth: Infinity,
		/**
		 * The max height of the output image.
		 * @type {number}
		 */
		maxHeight: Infinity,
		/**
		 * The min width of the output image.
		 * @type {number}
		 */
		minWidth: 0,
		/**
		 * The min height of the output image.
		 * @type {number}
		 */
		minHeight: 0,
		/**
		 * The width of the output image.
		 * If not specified, the natural width of the source image will be used.
		 * @type {number}
		 */
		width: undefined,
		/**
		 * The height of the output image.
		 * If not specified, the natural height of the source image will be used.
		 * @type {number}
		 */
		height: undefined,
		/**
		 * The quality of the output image.
		 * It must be a number between `0` and `1`,
		 * and only available for `image/jpeg` and `image/webp` images.
		 * Check out {@link https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/toBlob canvas.toBlob}.
		 * @type {number}
		 */
		quality: 0.8,
		/**
		 * The mime type of the output image.
		 * By default, the original mime type of the source image file will be used.
		 * @type {string}
		 */
		mimeType: 'auto',
		/**
		 * PNG files over this value (5 MB by default) will be converted to JPEGs.
		 * To disable this, just set the value to `Infinity`.
		 * @type {number}
		 */
		convertSize: 5000000,
		/**
		 * The hook function to execute before draw the image into the canvas for compression.
		 * @type {Function}
		 * @param {CanvasRenderingContext2D} context - The 2d rendering context of the canvas.
		 * @param {HTMLCanvasElement} canvas - The canvas for compression.
		 * @example
		 * function (context, canvas) {
		 *   context.fillStyle = '#fff';
		 * }
		 */
		beforeDraw: null,
		/**
		 * The hook function to execute after drew the image into the canvas for compression.
		 * @type {Function}
		 * @param {CanvasRenderingContext2D} context - The 2d rendering context of the canvas.
		 * @param {HTMLCanvasElement} canvas - The canvas for compression.
		 * @example
		 * function (context, canvas) {
		 *   context.filter = 'grayscale(100%)';
		 * }
		 */
		drew: null,
		/**
		 * The hook function to execute when success to compress the image.
		 * @type {Function}
		 * @param {File} file - The compressed image File object.
		 * @example
		 * function (file) {
		 *   console.log(file);
		 * }
		 */
		success: null,
		/**
		 * The hook function to execute when fail to compress the image.
		 * @type {Function}
		 * @param {Error} err - An Error object.
		 * @example
		 * function (err) {
		 *   console.log(err.message);
		 * }
		 */
		error: null
	};

	const IN_BROWSER = typeof window !== 'undefined';
	const WINDOW = IN_BROWSER ? window : {};

	const {
		slice
	} = Array.prototype;

	/**
	 * Convert array-like or iterable object to an array.
	 * @param {*} value - The value to convert.
	 * @returns {Array} Returns a new array.
	 */
	function toArray(value) {
		return Array.from ? Array.from(value) : slice.call(value);
	}
	const REGEXP_IMAGE_TYPE = /^image\/.+$/;

	/**
	 * Check if the given value is a mime type of image.
	 * @param {*} value - The value to check.
	 * @returns {boolean} Returns `true` if the given is a mime type of image, else `false`.
	 */
	function isImageType(value) {
		return REGEXP_IMAGE_TYPE.test(value);
	}

	/**
	 * Convert image type to extension.
	 * @param {string} value - The image type to convert.
	 * @returns {boolean} Returns the image extension.
	 */
	function imageTypeToExtension(value) {
		let extension = isImageType(value) ? value.substr(6) : '';
		if (extension === 'jpeg') {
			extension = 'jpg';
		}
		return `.${extension}`;
	}
	const {
		fromCharCode
	} = String;

	/**
	 * Get string from char code in data view.
	 * @param {DataView} dataView - The data view for read.
	 * @param {number} start - The start index.
	 * @param {number} length - The read length.
	 * @returns {string} The read result.
	 */
	function getStringFromCharCode(dataView, start, length) {
		let str = '';
		let i;
		length += start;
		for (i = start; i < length; i += 1) {
			str += fromCharCode(dataView.getUint8(i));
		}
		return str;
	}
	const {
		btoa
	} = WINDOW;

	/**
	 * Transform array buffer to Data URL.
	 * @param {ArrayBuffer} arrayBuffer - The array buffer to transform.
	 * @param {string} mimeType - The mime type of the Data URL.
	 * @returns {string} The result Data URL.
	 */
	function arrayBufferToDataURL(arrayBuffer, mimeType) {
		const chunks = [];
		const chunkSize = 8192;
		let uint8 = new Uint8Array(arrayBuffer);
		while (uint8.length > 0) {
			// XXX: Babel's `toConsumableArray` helper will throw error in IE or Safari 9
			// eslint-disable-next-line prefer-spread
			chunks.push(fromCharCode.apply(null, toArray(uint8.subarray(0, chunkSize))));
			uint8 = uint8.subarray(chunkSize);
		}
		return `data:${mimeType};base64,${btoa(chunks.join(''))}`;
	}

	/**
	 * Get orientation value from given array buffer.
	 * @param {ArrayBuffer} arrayBuffer - The array buffer to read.
	 * @returns {number} The read orientation value.
	 */
	function resetAndGetOrientation(arrayBuffer) {
		const dataView = new DataView(arrayBuffer);
		let orientation;

		// Ignores range error when the image does not have correct Exif information
		try {
			let littleEndian;
			let app1Start;
			let ifdStart;

			// Only handle JPEG image (start by 0xFFD8)
			if (dataView.getUint8(0) === 0xFF && dataView.getUint8(1) === 0xD8) {
				const length = dataView.byteLength;
				let offset = 2;
				while (offset + 1 < length) {
					if (dataView.getUint8(offset) === 0xFF && dataView.getUint8(offset + 1) === 0xE1) {
						app1Start = offset;
						break;
					}
					offset += 1;
				}
			}
			if (app1Start) {
				const exifIDCode = app1Start + 4;
				const tiffOffset = app1Start + 10;
				if (getStringFromCharCode(dataView, exifIDCode, 4) === 'Exif') {
					const endianness = dataView.getUint16(tiffOffset);
					littleEndian = endianness === 0x4949;
					if (littleEndian || endianness === 0x4D4D /* bigEndian */) {
						if (dataView.getUint16(tiffOffset + 2, littleEndian) === 0x002A) {
							const firstIFDOffset = dataView.getUint32(tiffOffset + 4, littleEndian);
							if (firstIFDOffset >= 0x00000008) {
								ifdStart = tiffOffset + firstIFDOffset;
							}
						}
					}
				}
			}
			if (ifdStart) {
				const length = dataView.getUint16(ifdStart, littleEndian);
				let offset;
				let i;
				for (i = 0; i < length; i += 1) {
					offset = ifdStart + i * 12 + 2;
					if (dataView.getUint16(offset, littleEndian) === 0x0112 /* Orientation */) {
						// 8 is the offset of the current tag's value
						offset += 8;

						// Get the original orientation value
						orientation = dataView.getUint16(offset, littleEndian);

						// Override the orientation with its default value
						dataView.setUint16(offset, 1, littleEndian);
						break;
					}
				}
			}
		} catch (e) {
			orientation = 1;
		}
		return orientation;
	}

	/**
	 * Parse Exif Orientation value.
	 * @param {number} orientation - The orientation to parse.
	 * @returns {Object} The parsed result.
	 */
	function parseOrientation(orientation) {
		let rotate = 0;
		let scaleX = 1;
		let scaleY = 1;
		switch (orientation) {
			// Flip horizontal
			case 2:
				scaleX = -1;
				break;

			// Rotate left 180°
			case 3:
				rotate = -180;
				break;

			// Flip vertical
			case 4:
				scaleY = -1;
				break;

			// Flip vertical and rotate right 90°
			case 5:
				rotate = 90;
				scaleY = -1;
				break;

			// Rotate right 90°
			case 6:
				rotate = 90;
				break;

			// Flip horizontal and rotate right 90°
			case 7:
				rotate = 90;
				scaleX = -1;
				break;

			// Rotate left 90°
			case 8:
				rotate = -90;
				break;
		}
		return {
			rotate,
			scaleX,
			scaleY
		};
	}
	const REGEXP_DECIMALS = /\.\d*(?:0|9){12}\d*$/;

	/**
	 * Normalize decimal number.
	 * Check out {@link http://0.30000000000000004.com/}
	 * @param {number} value - The value to normalize.
	 * @param {number} [times=100000000000] - The times for normalizing.
	 * @returns {number} Returns the normalized number.
	 */
	function normalizeDecimalNumber(value, times = 100000000000) {
		return REGEXP_DECIMALS.test(value) ? Math.round(value * times) / times : value;
	}

	const {
		ArrayBuffer: ArrayBuffer$1,
		FileReader
	} = WINDOW;
	const URL$1 = WINDOW.URL || WINDOW.webkitURL;
	const REGEXP_EXTENSION = /\.\w+$/;
	const AnotherCompressor = WINDOW.Compressor;

	/**
	 * Creates a new image compressor.
	 * @class
	 */
	class Compressor {
		/**
		 * The constructor of Compressor.
		 * @param {File|Blob} file - The target image file for compressing.
		 * @param {Object} [options] - The options for compressing.
		 */
		constructor(file, options) {
			this.file = file;
			this.image = new Image();
			this.options = {
				...DEFAULTS,
				...options
			};
			this.aborted = false;
			this.result = null;
			this.init();
		}
		init() {
			const {
				file,
				options
			} = this;
			if (!isBlob$1(file)) {
				this.fail(new Error('The first argument must be a File or Blob object.'));
				return;
			}
			const mimeType = file.type;
			if (!isImageType(mimeType)) {
				this.fail(new Error('The first argument must be an image File or Blob object.'));
				return;
			}
			if (!URL$1 || !FileReader) {
				this.fail(new Error('The current browser does not support image compression.'));
				return;
			}
			if (!ArrayBuffer$1) {
				options.checkOrientation = false;
			}
			if (URL$1 && !options.checkOrientation) {
				this.load({
					url: URL$1.createObjectURL(file)
				});
			} else {
				const reader = new FileReader();
				const checkOrientation = options.checkOrientation && mimeType === 'image/jpeg';
				this.reader = reader;
				reader.onload = ({
					target
				}) => {
					const {
						result
					} = target;
					const data = {};
					if (checkOrientation) {
						// Reset the orientation value to its default value 1
						// as some iOS browsers will render image with its orientation
						const orientation = resetAndGetOrientation(result);
						if (orientation > 1 || !URL$1) {
							// Generate a new URL which has the default orientation value
							data.url = arrayBufferToDataURL(result, mimeType);
							if (orientation > 1) {
								Object.assign(data, parseOrientation(orientation));
							}
						} else {
							data.url = URL$1.createObjectURL(file);
						}
					} else {
						data.url = result;
					}
					this.load(data);
				};
				reader.onabort = () => {
					this.fail(new Error('Aborted to read the image with FileReader.'));
				};
				reader.onerror = () => {
					this.fail(new Error('Failed to read the image with FileReader.'));
				};
				reader.onloadend = () => {
					this.reader = null;
				};
				if (checkOrientation) {
					reader.readAsArrayBuffer(file);
				} else {
					reader.readAsDataURL(file);
				}
			}
		}
		load(data) {
			const {
				file,
				image
			} = this;
			image.onload = () => {
				this.draw({
					...data,
					naturalWidth: image.naturalWidth,
					naturalHeight: image.naturalHeight
				});
			};
			image.onabort = () => {
				this.fail(new Error('Aborted to load the image.'));
			};
			image.onerror = () => {
				this.fail(new Error('Failed to load the image.'));
			};
			image.alt = file.name;
			image.src = data.url;
		}
		draw({
			naturalWidth,
			naturalHeight,
			rotate = 0,
			scaleX = 1,
			scaleY = 1
		}) {
			const {
				file,
				image,
				options
			} = this;
			const canvas = document.createElement('canvas');
			const context = canvas.getContext('2d');
			const aspectRatio = naturalWidth / naturalHeight;
			const is90DegreesRotated = Math.abs(rotate) % 180 === 90;
			let maxWidth = Math.max(options.maxWidth, 0) || Infinity;
			let maxHeight = Math.max(options.maxHeight, 0) || Infinity;
			let minWidth = Math.max(options.minWidth, 0) || 0;
			let minHeight = Math.max(options.minHeight, 0) || 0;
			let width = Math.max(options.width, 0) || naturalWidth;
			let height = Math.max(options.height, 0) || naturalHeight;
			if (is90DegreesRotated) {
				[maxWidth, maxHeight] = [maxHeight, maxWidth];
				[minWidth, minHeight] = [minHeight, minWidth];
				[width, height] = [height, width];
			}
			if (maxWidth < Infinity && maxHeight < Infinity) {
				if (maxHeight * aspectRatio > maxWidth) {
					maxHeight = maxWidth / aspectRatio;
				} else {
					maxWidth = maxHeight * aspectRatio;
				}
			} else if (maxWidth < Infinity) {
				maxHeight = maxWidth / aspectRatio;
			} else if (maxHeight < Infinity) {
				maxWidth = maxHeight * aspectRatio;
			}
			if (minWidth > 0 && minHeight > 0) {
				if (minHeight * aspectRatio > minWidth) {
					minHeight = minWidth / aspectRatio;
				} else {
					minWidth = minHeight * aspectRatio;
				}
			} else if (minWidth > 0) {
				minHeight = minWidth / aspectRatio;
			} else if (minHeight > 0) {
				minWidth = minHeight * aspectRatio;
			}
			if (height * aspectRatio > width) {
				height = width / aspectRatio;
			} else {
				width = height * aspectRatio;
			}
			width = Math.floor(normalizeDecimalNumber(Math.min(Math.max(width, minWidth), maxWidth)));
			height = Math.floor(normalizeDecimalNumber(Math.min(Math.max(height, minHeight), maxHeight)));
			const destX = -width / 2;
			const destY = -height / 2;
			const destWidth = width;
			const destHeight = height;
			if (is90DegreesRotated) {
				[width, height] = [height, width];
			}
			canvas.width = width;
			canvas.height = height;
			if (!isImageType(options.mimeType)) {
				options.mimeType = file.type;
			}
			let fillStyle = 'transparent';

			// Converts PNG files over the `convertSize` to JPEGs.
			if (file.size > options.convertSize && options.mimeType === 'image/png') {
				fillStyle = '#fff';
				options.mimeType = 'image/jpeg';
			}

			// Override the default fill color (#000, black)
			context.fillStyle = fillStyle;
			context.fillRect(0, 0, width, height);
			if (options.beforeDraw) {
				options.beforeDraw.call(this, context, canvas);
			}
			if (this.aborted) {
				return;
			}
			context.save();
			context.translate(width / 2, height / 2);
			context.rotate(rotate * Math.PI / 180);
			context.scale(scaleX, scaleY);
			context.drawImage(image, destX, destY, destWidth, destHeight);
			context.restore();
			if (options.drew) {
				options.drew.call(this, context, canvas);
			}
			if (this.aborted) {
				return;
			}
			const done = result => {
				if (!this.aborted) {
					this.done({
						naturalWidth,
						naturalHeight,
						result
					});
				}
			};
			if (canvas.toBlob) {
				canvas.toBlob(done, options.mimeType, options.quality);
			} else {
				done(toBlob(canvas.toDataURL(options.mimeType, options.quality)));
			}
		}
		done({
			naturalWidth,
			naturalHeight,
			result
		}) {
			const {
				file,
				image,
				options
			} = this;
			if (URL$1 && !options.checkOrientation) {
				URL$1.revokeObjectURL(image.src);
			}
			if (result) {
				// Returns original file if the result is greater than it and without size related options
				if (options.strict && result.size > file.size && options.mimeType === file.type && !(options.width > naturalWidth || options.height > naturalHeight || options.minWidth > naturalWidth || options.minHeight > naturalHeight)) {
					result = file;
				} else {
					const date = new Date();
					result.lastModified = date.getTime();
					result.lastModifiedDate = date;
					result.name = file.name;

					// Convert the extension to match its type
					if (result.name && result.type !== file.type) {
						result.name = result.name.replace(REGEXP_EXTENSION, imageTypeToExtension(result.type));
					}
				}
			} else {
				// Returns original file if the result is null in some cases.
				result = file;
			}
			this.result = result;
			if (options.success) {
				options.success.call(this, result);
			}
		}
		fail(err) {
			const {
				options
			} = this;
			if (options.error) {
				options.error.call(this, err);
			} else {
				throw err;
			}
		}
		abort() {
			if (!this.aborted) {
				this.aborted = true;
				if (this.reader) {
					this.reader.abort();
				} else if (!this.image.complete) {
					this.image.onload = null;
					this.image.onabort();
				} else {
					this.fail(new Error('The compression process has been aborted.'));
				}
			}
		}

		/**
		 * Get the no conflict compressor class.
		 * @returns {Compressor} The compressor class.
		 */
		static noConflict() {
			window.Compressor = AnotherCompressor;
			return Compressor;
		}

		/**
		 * Change the default options.
		 * @param {Object} options - The new default options.
		 */
		static setDefaults(options) {
			Object.assign(DEFAULTS, options);
		}
	}

	const allowedSizeProps = ['width', 'height', 'maxWidth', 'maxHeight', 'minWidth', 'minHeight'];

	/**
	 * Rebuilds a blob with the constructors of the current window.
	 *
	 * A named source stays a named file: the name is part of the compressed result, and its
	 * extension follows the mime type the compression produced.
	 *
	 * @param {Blob|File} blob
	 * @returns {Blob|File}
	 */
	function cloneBlob(blob) {
		const type = main_core.Type.isStringFilled(blob.type) ? blob.type : '';
		if (!main_core.Type.isStringFilled(blob.name)) {
			return new Blob([blob], {
				type
			});
		}
		return new File([blob], blob.name, {
			type,
			lastModified: blob.lastModified
		});
	}

	const blobBrands = new Set(['[object Blob]', '[object File]']);

	/**
	 * Tells a Blob or a File of any window from an object that only looks like one.
	 *
	 * `instanceof` is bound to a window, the brand is not: it is read from the prototype of the
	 * window the object was created in. Testing for `size` and `slice` instead would take any
	 * object for a file, and rebuilding one gives `new Blob([object])` — the 15 bytes of
	 * `[object Object]`, which reach the server as a broken image.
	 *
	 * @param {*} value
	 * @returns {boolean}
	 */
	function isBlob(value) {
		return blobBrands.has(Object.prototype.toString.call(value));
	}

	/**
	 * Releases an object URL if the given source is one.
	 *
	 * @param {string} url
	 */
	function revokeObjectUrl(url) {
		if (main_core.Type.isStringFilled(url) && url.startsWith('blob:')) {
			URL.revokeObjectURL(url);
		}
	}

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
	function toCurrentWindowBlob(blob) {
		const isForeignBlob = !(blob instanceof Blob) && isBlob(blob);
		if (!isForeignBlob) {
			return blob;
		}
		if (!rebuilt.has(blob)) {
			rebuilt.set(blob, cloneBlob(blob));
		}
		return rebuilt.get(blob);
	}

	function urlToBlob(url) {
		if (!main_core.Type.isString(url)) {
			return Promise.resolve(url);
		}
		return new Promise((resolve, reject) => {
			try {
				const xhr = main_core.ajax.xhr();
				xhr.open('GET', url);
				xhr.responseType = 'blob';
				xhr.onerror = () => {
					reject(new Error('Network error.'));
				};
				xhr.onload = () => {
					if (xhr.status === 200) {
						resolve(xhr.response);
					} else {
						reject(new Error(`Loading error: ${xhr.statusText}`));
					}
				};
				xhr.send();
			} catch (err) {
				reject(err.message);
			}
		});
	}

	class ImageCompressor {
		static maxOriginalPngSize = 5 * 1024 * 1024;
		constructor(file, options = {}) {
			this.file = file;
			this.options = {
				quality: 0.8,
				...options
			};
			if (this.options.retina) {
				allowedSizeProps.forEach(prop => {
					if (main_core.Type.isNumber(this.options[prop])) {
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
		static compress(file, options = {}) {
			return urlToBlob(file).then(blob => {
				// anything else is left for the compressor to refuse: cloning it would rebuild
				// it into 15 bytes and answer with them as with a compressed image
				if (isBlob(blob) && main_core.Type.isStringFilled(blob.type)) {
					if (blob.type.includes('gif') || blob.type.includes('png') && blob.size < ImageCompressor.maxOriginalPngSize) {
						return cloneBlob(blob);
					}
				}
				const source = toCurrentWindowBlob(blob);
				return new ImageCompressor(source, options).compress()
				// compressorjs answers with the very object it was given when compressing it
				// makes no sense
				.then(result => result === source ? cloneBlob(result) : result);
			});
		}
		compress() {
			let instance = null;
			return new Promise((resolve, reject) => {
				instance = new Compressor(this.file, {
					...this.options,
					...{
						success: resolve,
						error: reject
					}
				});
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

	exports.ImageCompressor = ImageCompressor;

})(this.BX.Landing = this.BX.Landing || {}, BX);
//# sourceMappingURL=imagecompressor.bundle.js.map
