import { ChatId, DialogId, MessageId } from '../../../../../types/common';
import { MessengerCoreStore } from '../../../../../core/types/store';

/** Audio row the tab addresses: the file plus the message it was sent with. */
type AudioFile = {
	messageId?: MessageId,
	fileId: string | number
}

type SidebarAudioPlayerProps = {
	chatId: ChatId,
	dialogId: DialogId,
	store: MessengerCoreStore
}

/** Playback state the player keeps for the currently bound audio item. */
type SidebarAudioPlayingState = {
	fileId?: string | number,
	messageId?: MessageId,
	currentTime?: number,
	duration?: number,
	isPlaying?: boolean
}

/**
 * Payload the player emits to the tab on every playback change. event carries an
 * AudioEvents value: both native event names and the internal stage names.
 */
type SidebarAudioChangePayload = SidebarAudioPlayingState & {
	event: string
}

/** Playback fields pushed into a single list row. */
type SidebarAudioRowUpdate = {
	fileId?: string | number,
	stage?: string,
	currentTime?: number,
	duration?: number
}

/** The player surface the audio tab relies on; both players implement it. */
interface IAudioPlayerController {
	setItems(items: Array<{ data: AudioFile }>): void;

	on(eventName: string, handler: (payload: SidebarAudioChangePayload) => void): void;

	off(eventName: string, handler: (payload: SidebarAudioChangePayload) => void): void;

	start(audioFile: AudioFile): void;

	play(): void;

	pause(): void;

	stop(): void;

	destructor(): void;

	initActualState?(): Promise<string | number | null>;

	/**
	 * The list reports indexes of the rows it shows, in the order of the item list.
	 * Only the player of the floating panel acts on them: the legacy one has no panel.
	 */
	onViewableItemsChanged(visibleIndexes: Array<number>): void;

	/** Brings the panel back when no row of the tab can stand in for it. */
	restorePanel?(): void;
}

type SidebarAudioTabContentProps = {
	tabId: string,
	audioController: IAudioPlayerController,
	destroyAudioController: () => void,
	dialogData: { chatId: ChatId, dialogId: DialogId },
	widgetNavigator: { backToChatMessage: (messageId: number) => Promise<unknown> }
}

export {
	AudioFile,
	IAudioPlayerController,
	SidebarAudioChangePayload,
	SidebarAudioPlayerProps,
	SidebarAudioPlayingState,
	SidebarAudioRowUpdate,
	SidebarAudioTabContentProps,
};
