/**
 * @module im/messenger/controller/sidebar-v2/tabs/audio/src/row-state
 */
jn.define('im/messenger/controller/sidebar-v2/tabs/audio/src/row-state', (require, exports, module) => {
	const AudioTabRowType = Object.freeze({
		audio: 'audio',
		videoNote: 'video_note',
	});

	/**
	 * A video note is stored as an ordinary video, so only the model flag tells the two records
	 * of the tab apart. A record with no model is drawn as an ordinary row: this answers what to
	 * draw, not what can be played.
	 *
	 * @param {FilesModelState|undefined} fileModel
	 * @returns {string}
	 */
	const resolveAudioTabRowType = (fileModel) => (
		fileModel?.isVideoNote ? AudioTabRowType.videoNote : AudioTabRowType.audio
	);

	/**
	 * A video note has a row in the tab but no playback, and neither has a row that outlived its
	 * file model: the row type falls back to audio for drawing and cannot answer this on its own.
	 *
	 * @param {FilesModelState|undefined} fileModel
	 * @returns {boolean}
	 */
	const isPlayableAudioRow = (fileModel) => (
		Boolean(fileModel) && resolveAudioTabRowType(fileModel) === AudioTabRowType.audio
	);

	/**
	 * An unfinished upload is marked instead of hiding the record. A failed upload is not an
	 * unfinished one and gets no mark, so the statuses that count as processing are listed
	 * rather than derived from "not done"; they come from the caller to keep this module free
	 * of dependencies.
	 *
	 * @param {FilesModelState|undefined} fileModel
	 * @param {Array<string>} processingStatuses
	 * @returns {boolean}
	 */
	const isVideoNoteProcessing = (fileModel, processingStatuses = []) => (
		Boolean(fileModel) && processingStatuses.includes(fileModel.status)
	);

	/**
	 * @param {FilesModelState|undefined} fileModel
	 * @returns {boolean}
	 */
	const hasVideoNotePreview = (fileModel) => Boolean(fileModel?.urlPreview);

	module.exports = {
		AudioTabRowType,
		resolveAudioTabRowType,
		isPlayableAudioRow,
		isVideoNoteProcessing,
		hasVideoNotePreview,
	};
});
