import { CollabV2Manager } from './classes/collab-v2';
import { CollabManager } from './classes/collab';
import { MessagesAutoDelete } from './classes/messages-auto-delete';
import { ChatHistoryManager } from './classes/chat-history';

export const TariffManager = {
	collabV2: CollabV2Manager,
	collab: CollabManager,
	messagesAutoDelete: MessagesAutoDelete,
	chatHistory: ChatHistoryManager,
};
