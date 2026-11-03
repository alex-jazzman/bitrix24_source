/**
 * @module assets/icons/src/file-type
 */
jn.define('assets/icons/src/file-type', (require, exports, module) => {
	const FileType = {
		IMAGE: 2,
		VIDEO: 3,
		DOCUMENT: 4,
		ARCHIVE: 5,
		SCRIPTS: 6,
		UNKNOWN: 7,
		PDF: 8,
		AUDIO: 9,
		KNOWN: 10,
		VECTOR_IMAGE: 11,
		FLIPCHART: 12,
	};

	const mediaTypeToFileType = new Map([
		['image', FileType.IMAGE],
		['video', FileType.VIDEO],
		['file', FileType.UNKNOWN],
	]);

	/**
	 * @param {string} [mediaType]
	 * @returns {number}
	 */
	function resolveFileTypeByMediaType(mediaType = '')
	{
		return mediaTypeToFileType.get(mediaType) ?? FileType.UNKNOWN;
	}

	module.exports = { FileType, resolveFileTypeByMediaType };
});
