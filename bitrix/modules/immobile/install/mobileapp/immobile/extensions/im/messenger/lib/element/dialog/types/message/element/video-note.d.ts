import { AudioRate } from '../../../../../../model/application/src/types';
import { Speech2Text } from '../base';
import { AiAnimationMessageData } from './audio';

export type MessageVideoNote = {
	id: string,
	localUrl: string | null,
	url: string | null,
	previewUrl: string | null,
	isPlaying: boolean,
	playingTime: number,
	speech2text: Speech2Text | null,
	aiAnimation: AiAnimationMessageData | null,
	rate?: AudioRate,
}
