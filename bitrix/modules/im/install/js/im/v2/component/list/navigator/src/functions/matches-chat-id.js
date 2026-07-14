import { type ImModelChat } from 'im.v2.model';

export const chatMatchesChatId = (chat: ImModelChat, targetChatId: number): boolean => {
	const matchesChat = chat.chatId === targetChatId;
	const matchesParentChat = chat.parentChatId === targetChatId;

	return matchesChat || matchesParentChat;
};
