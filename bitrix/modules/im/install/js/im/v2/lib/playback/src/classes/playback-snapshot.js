export type PlaybackTrack = {
	fileId: string,
	src: string,
	messageId: string | number,
	scope: string,
	dialogId: string,
	chatId: number,
	authorId: number,
	authorName: string,
	fileName: string,
	isVideoNote: boolean,
	status: string,
	waveformIndex: number,
};

export class PlaybackSnapshot
{
	fileId: string;
	src: string;
	messageId: string | number;
	scope: string;
	dialogId: string;
	chatId: number;
	authorId: number;
	authorName: string;
	fileName: string;
	isVideoNote: boolean;
	status: string;
	waveformIndex: number;
	duration: number | null = null;

	constructor(track: PlaybackTrack)
	{
		this.fileId = track.fileId;
		this.src = track.src;
		this.messageId = track.messageId;
		this.scope = track.scope;
		this.dialogId = track.dialogId;
		this.chatId = track.chatId;
		this.authorId = track.authorId;
		this.authorName = track.authorName;
		this.fileName = track.fileName;
		this.isVideoNote = track.isVideoNote;
		this.status = track.status;
		this.waveformIndex = track.waveformIndex;
	}
}
