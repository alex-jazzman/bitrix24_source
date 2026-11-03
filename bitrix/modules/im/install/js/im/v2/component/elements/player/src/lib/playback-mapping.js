import { AudioPlaybackRate, PlaybackTrackState } from 'im.v2.const';
import { type PlaybackService, type PlaybackTrack } from 'im.v2.lib.playback';
import { type ImModelFile } from 'im.v2.model';

export type PlaybackView = {
	isPlaying: boolean,
	isLoading: boolean,
	isLoaded: boolean,
	timeCurrent: number,
	timeTotal: number,
	rate: $Values<typeof AudioPlaybackRate>,
};

type TrackSource = {
	file: ImModelFile,
	src: string,
	messageId: string | number,
	scope: string,
	dialogId: string,
	authorId: number,
	waveformIndex: number,
};

export const buildPlaybackView = (
	service: PlaybackService,
	fileId: string,
	fallbackDuration: number,
): PlaybackView => {
	const state = service.getState();

	if (!service.isCurrentFile(fileId))
	{
		return {
			isPlaying: false,
			isLoading: false,
			isLoaded: false,
			timeCurrent: 0,
			timeTotal: fallbackDuration,
			rate: state.rate,
		};
	}

	const timeTotal = service.getSnapshot()?.duration || fallbackDuration;

	return {
		isPlaying: state.trackState === PlaybackTrackState.playing,
		isLoading: state.trackState === PlaybackTrackState.loading,
		isLoaded: timeTotal > 0,
		timeCurrent: state.position,
		timeTotal,
		rate: state.rate,
	};
};

export const buildPlaybackTrack = (source: TrackSource): PlaybackTrack => {
	const { file, src, messageId, scope, dialogId, authorId, waveformIndex } = source;

	return {
		fileId: file.id,
		src,
		messageId,
		scope,
		dialogId,
		chatId: file.chatId,
		authorId,
		authorName: file.authorName,
		fileName: file.name,
		isVideoNote: file.isVideoNote,
		status: file.status,
		waveformIndex,
	};
};
