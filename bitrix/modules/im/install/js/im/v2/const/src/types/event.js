import { DialogScrollThreshold } from '../chat';
import { TextareaTarget } from '../textarea';

export type OnLayoutChangeEvent = {
	from: {
		name: string,
		entityId: string,
		contextId: number
	},
	to: {
		name: string,
		entityId: string,
		contextId: number
	}
};

export type OnDialogInitedEvent = {
	dialogId: string
};

export type OnGuestInitialChatOpenEvent = {
	dialogId: string
};

export type InsertTextEvent = {
	text: string,
	withNewLine?: boolean,
	replace?: boolean,
	dialogId: string,
	target?: $Values<typeof TextareaTarget>,
};

export type InsertMentionEvent = {
	mentionText: string,
	mentionReplacement: string,
	dialogId: string,
	textToReplace?: string,
	// the pick came from the mention popup and consumes the symbol it was opened with; an insert
	// started by anything else must pass false, otherwise the stored symbol eats a typed character
	isMentionSymbol?: boolean,
	target?: $Values<typeof TextareaTarget>,
	mentionedUserId?: string | number,
	isParticipant?: boolean,
	suppressAddToChatPopup?: boolean,
};

export type EditMessageEvent = {
	messageId: number
};

export type ScrollToBottomEvent = {
	chatId: number,
	threshold?: $Values<typeof DialogScrollThreshold>,
	animation?: boolean,
};
