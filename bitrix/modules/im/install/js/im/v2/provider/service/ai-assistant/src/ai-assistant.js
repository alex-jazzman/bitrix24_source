import { ChatType } from 'im.v2.const';
import { ChatService } from 'im.v2.provider.service.chat';

export class AiAssistantService
{
	async createChat(): Promise<string>
	{
		const chatService = new ChatService();
		const { newDialogId } = await chatService.createChat({
			type: ChatType.aiAssistant,
		});

		await chatService.loadChatWithMessages(newDialogId);

		return newDialogId;
	}
}
