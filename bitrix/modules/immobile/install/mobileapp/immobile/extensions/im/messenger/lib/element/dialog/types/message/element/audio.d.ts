import { AudioRate } from '../../../../../../model/application/src/types';
import { Speech2Text } from '../base';

export type MessageAudio = {
	id: string | number,
	type: 'audio',
	localUrl: string | null,
	url: string | null,
	size: number | null,
	isPlaying: boolean,
	playingTime: number | null,
	rate: AudioRate,
	speech2text: Speech2Text,
}
