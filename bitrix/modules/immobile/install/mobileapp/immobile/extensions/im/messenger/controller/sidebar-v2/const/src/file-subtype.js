/**
 * @module im/messenger/controller/sidebar-v2/const/src/file-subtype
 */
jn.define('im/messenger/controller/sidebar-v2/const/src/file-subtype', (require, exports, module) => {
	// Wire values of the server enum Bitrix\Im\V2\Link\File\Subtype: it serializes its cases
	// in lower case, and the tab request is filtered by exactly these strings.
	const SidebarFileType = Object.freeze({
		document: 'document',
		other: 'other',
		media: 'media',
		audio: 'audio',
		videoNote: 'video_note',
	});

	// The server keeps a video note in the audio subtype group, so the tab asks for both at once.
	const SidebarAudioTabSubtypes = Object.freeze([
		SidebarFileType.audio,
		SidebarFileType.videoNote,
	]);

	module.exports = {
		SidebarFileType,
		SidebarAudioTabSubtypes,
	};
});
