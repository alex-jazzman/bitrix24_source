import { Speech2Text } from '../base';

export type MessageVideoNote = {
	id: string,
	localUrl: string,
	url: string,
	previewUrl: string,
	isPlaying: boolean,
	playingTime: number,
	speech2text: Speech2Text,
}
