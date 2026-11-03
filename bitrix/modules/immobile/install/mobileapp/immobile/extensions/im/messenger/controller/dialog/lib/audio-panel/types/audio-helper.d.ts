import { ChatId, DialogId, MessageId } from '../../../../../types/common';
import { MessengerCoreStore } from '../../../../../core/types/store';
import { ReturnAudioData } from './native-audio-player';

/** Options of the dialog opened when the listener returns to the playing audio. */
type ReturnToAudioOpenDialogOptions = {
	dialogId: DialogId,
	actionsAfterOpen: Array<{ type: string, messageId: MessageId, targetMessagePosition: string }>
}

type ReturnToAudioMessageParams = {
	audioData: ReturnAudioData,
	openDialog: (options: ReturnToAudioOpenDialogOptions) => void
}

type PrepareAudioNameParams = {
	fileName: string,
	messageId: MessageId,
	store: MessengerCoreStore
}

type CreateChatReturnDataParams = {
	dialogId: DialogId,
	messageId: MessageId,
	fileId: string | number
}

/**
 * Comments play through the player of their parent chat, so the id is resolved
 * from the dialog kind rather than from the chat id alone.
 */
type AudioPlayerIdParams = {
	chatId: ChatId,
	isComment?: boolean,
	parentChatId?: ChatId | null
}

export {
	AudioPlayerIdParams,
	CreateChatReturnDataParams,
	PrepareAudioNameParams,
	ReturnToAudioMessageParams,
	ReturnToAudioOpenDialogOptions,
};
