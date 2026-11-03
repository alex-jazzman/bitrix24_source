import { ChatId, DialogId, MessageId } from '../../../../../types/common';
import { MessengerCoreStore } from '../../../../../core/types/store';
import { MessagesModelState } from '../../../../../model/messages/src/types/messages';

/** Messages currently rendered by the dialog view, as the view reports them. */
type ViewableMessages = {
	messageList: Array<MessagesModelState>,
	indexList: Array<number>
}

type AudioPanelProps = {
	store: MessengerCoreStore,
	chatId: ChatId,
	dialogId: DialogId,
	getViewableMessages: () => Promise<ViewableMessages>,
	/** Mutes the other chat media - the play button of the native panel bypasses the dialog. */
	stopConcurrentMedia?: () => void
}

/** What the panel keeps about the message it plays right now. */
type AudioPanelPlayingState = {
	messageId: MessageId,
	playingTime: number
}

/** Argument of the panel play/pause actions triggered from the dialog view. */
type AudioPlayActionParams = {
	messageId: MessageId,
	/** The tapped file, when the message holds both its own audio and an audio block. */
	fileId?: number | string | null,
	playingTime?: number
}

/** Argument of the internal playing-state update of a single message. */
type AudioMessagePlayingParams = {
	messageId: MessageId,
	isPlaying?: boolean,
	playingTime?: number
}

/** Argument of the messagesModel/setPlayingState store action. */
type AudioModelState = {
	id: MessageId,
	isPlaying: boolean,
	playingTime: number
}

export {
	AudioMessagePlayingParams,
	AudioModelState,
	AudioPanelPlayingState,
	AudioPanelProps,
	AudioPlayActionParams,
	ViewableMessages,
};
