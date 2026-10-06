import { ChatType, CopilotRole } from 'im.v2.const';
import { Logger } from 'im.v2.lib.logger';
import { ChatService } from 'im.v2.provider.service.chat';

export class CopilotChatService
{
	async createChat({ roleCode, parentChatId }: { roleCode: string, parentChatId?: number }): Promise<string>
	{
		const chatService = new ChatService();

		try
		{
			const config = { type: ChatType.copilot, copilotMainRole: roleCode };
			if (parentChatId)
			{
				config.parentChatId = parentChatId;
			}
			const { newDialogId } = await chatService.createChat(config);

			await chatService.loadChatWithMessages(newDialogId);

			return newDialogId;
		}
		catch (error)
		{
			console.error('CopilotChatService: create chat error', error);
			throw error;
		}
	}

	createDefaultChat(parentChatId?: number): Promise<string>
	{
		return this.createChat({ roleCode: CopilotRole.universalCode, parentChatId });
	}

	async fetchDraftChat(): Promise<{ dialogId: string, chatId: number }>
	{
		try
		{
			return await new ChatService().loadCopilotDraftChat();
		}
		catch (error)
		{
			Logger.warn('CopilotChatService: fetchDraftChat failed', error);
			throw error;
		}
	}
}
