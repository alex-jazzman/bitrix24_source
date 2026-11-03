/**
 * @module im/messenger/controller/dialog/lib/media-gallery/src/media-collection
 */
jn.define('im/messenger/controller/dialog/lib/media-gallery/src/media-collection', (require, exports, module) => {
	/**
	 * Keeps the files the dialog media gallery may show, in their original order.
	 *
	 * A video note is stored on disk as an ordinary video, so the file type alone does not tell it
	 * apart: it is excluded by the model flag. Gallery types come from the caller to keep this
	 * module free of dependencies.
	 *
	 * @param {Array<mediaListItem>} files
	 * @param {Array<string>} galleryFileTypes
	 * @returns {Array<mediaListItem>}
	 */
	const selectGalleryFiles = (files, galleryFileTypes) => files.filter(
		(file) => Boolean(file) && !file.isVideoNote && galleryFileTypes.includes(file.type),
	);

	module.exports = {
		selectGalleryFiles,
	};
});
