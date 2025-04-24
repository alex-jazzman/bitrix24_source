export const FileStatus = Object.freeze({
	upload: 'upload',
	wait: 'wait',
	progress: 'progress',
	done: 'done',
	error: 'error',
});

export const FileType = Object.freeze({
	image: 'image',
	video: 'video',
	audio: 'audio',
	file: 'file',
});

export const FileIconType = Object.freeze({
	file: 'file',
	image: 'image',
	audio: 'audio',
	video: 'video',
	code: 'code',
	call: 'call',
	attach: 'attach',
	quote: 'quote',
});

export const FileViewerContext = Object.freeze({
	dialog: 'dialog',
	sidebarMain: 'sidebarMain',
	sidebarTabBriefs: 'sidebarTabBriefs',
	sidebarTabDocuments: 'sidebarTabDocuments',
	sidebarTabMedia: 'sidebarTabMedia',
	sidebarTabOther: 'sidebarTabOther',
	sidebarTabFileUnsorted: 'sidebarTabFileUnsorted',
});

export const AudioPlaybackRate = Object.freeze({
	1: 1,
	1.5: 1.5,
	2: 2,
});

export const AudioPlaybackState = Object.freeze({
	play: 'play',
	pause: 'pause',
	stop: 'stop',
	none: 'none',
});
