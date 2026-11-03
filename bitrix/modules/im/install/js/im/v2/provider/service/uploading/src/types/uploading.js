import { type UploaderFile } from 'ui.uploader.core';

export type FileCommitParams = {
	temporaryFileId: string,
	tempMessageId: string,
	chatId: number,
	realFileId: number,
	fromDisk: boolean,
	sendAsFile: boolean,
	messageText: string,
	replyId?: number,
}

/**
 * Params of a file the chat cannot read from the file itself. They travel with the file up to the
 * commit and reach the server as its FILE_PARAMS entry.
 */
export type FileParams = {
	isVoiceNote?: boolean,
	isTranscribable?: boolean,
	durationSeconds?: number,
}

export type CommitFileParams = {
	is_voice_note?: 'Y',
	is_transcribable?: 'Y',
	duration?: number,
}

export type UploadFilesParams = {
	files: File[],
	dialogId: string,
	autoUpload: boolean,
	sendAsFile: boolean,
	maxParallelLoads: number,
	maxParallelUploads: number,
	fileParams?: FileParams,
}

export type AddFilesResult = {
	uploaderFiles: Array<Object>,
	uploaderId: string,
	loadAllComplete: Promise<any>,
	uploadAllComplete: Promise<any>,
}

export type PreviewSessionOrigin = 'local' | 'disk';

export type PreviewSession = {
	uploaderId: string,
	origin: PreviewSessionOrigin,
}

// an empty messageId is the draft of a new message, a filled one the attachments of that message
export type PreviewSessionScope = {
	dialogId: string,
	messageId?: ?number,
}

export type CreatePreviewSessionParams = {
	dialogId: string,
	messageId?: ?number,
	origin?: PreviewSessionOrigin,
}

export type AddFilesToPreviewSessionParams = {
	sessionId: string,
	// an uploader file is a file of another batch joining this one: a repeat of a failed upload
	files: Array<File | UploaderFile>,
	sendAsFile?: boolean,
}

// only the id and the name travel: the copy in the chat folder is made of the file on disk
export type AddDiskFilesToPreviewSessionParams = {
	dialogId: string,
	messageId?: ?number,
	files: Array<{ id: string, name: string }>,
	sendAsFile?: boolean,
}

export type RemoveFileFromPreviewSessionParams = {
	sessionId: string,
	fileId: string,
	// whether the copy the file got in the chat folder goes with it, as the uploader core names it for one file
	removeFromServer?: boolean,
}

// whether the copies the files got in the chat folder leave with their holder: only the batch of an
// edit that never reached a save gives them up
export type DestroyUploaderOptions = {
	removeFilesFromServer?: boolean,
}
