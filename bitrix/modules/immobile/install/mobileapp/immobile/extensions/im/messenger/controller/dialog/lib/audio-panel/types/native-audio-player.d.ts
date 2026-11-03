import { DialogId, MessageId } from '../../../../../types/common';

/**
 * Playback state reported by the native player. The native side normalizes its
 * internal "finished" status to "stopped" and sends "final" once the whole
 * playlist is over.
 */
type AudioPlayingStateType = 'stopped' | 'playing' | 'paused' | 'final';

type CurrentAudioState = {
	id: string,
	uri: string,
	associatedId: string,
	title: string,
	imageUri: string,
	returnData: ReturnAudioData
}

/**
 * Payload of the native playingMediaChanged event. In the final state the
 * player sends playingState and an empty currentAudio only; playingTime and
 * duration are absent in part of the payloads, so both are optional.
 */
type AudioState = {
	playingState: AudioPlayingStateType,
	playingTime?: number,
	duration?: number,
	currentAudio: CurrentAudioState | null
}

/** Payload of the native speedChanged event. */
type SpeedChangedState = {
	speed: number
}

/** Payload of the native timeupdate event. */
type TimeUpdateState = {
	currentTime: number
}

/**
 * Constructor params of the native player. The id is the player identity: the
 * dialog panel and the sidebar tab must pass the same one to share the playback.
 * keepPlaying leaves the audio alive when the component that started it is gone.
 */
type NativeAudioPlayerParams = {
	id: string,
	keepPlaying: boolean
}

/** Single playlist entry accepted by the native playList method. */
type NativeAudioItem = {
	uri: string,
	title: string,
	associatedId: string,
	returnData: ReturnAudioData
}

/**
 * type and text are required by the native player: text labels the return
 * button on the audio panel. Any other key is passed through untouched and
 * comes back in the audioPanelReturnClick event.
 */
type ReturnAudioData = {
	type: string,
	text: string,
	dialogId?: DialogId,
	messageId?: MessageId,
	fileId?: string | number
}

export {
	AudioPlayingStateType,
	AudioState,
	CurrentAudioState,
	NativeAudioItem,
	NativeAudioPlayerParams,
	ReturnAudioData,
	SpeedChangedState,
	TimeUpdateState,
};
