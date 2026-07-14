import { type Store } from 'ui.vue3.vuex';

import { Core } from 'im.v2.application.core';
import { CopilotManager } from 'im.v2.lib.copilot';
import { Logger } from 'im.v2.lib.logger';
import { type ImModelChat } from 'im.v2.model';

import { type EngineUpdateParams, type FileTranscriptionParams, type CopilotRoleParams, type AiAssistantTitleParams } from '../../types/ai';

export class AiPullHandler
{
	#store: Store;

	constructor()
	{
		this.#store = Core.getStore();
	}

	handleChangeEngine(params: EngineUpdateParams)
	{
		Logger.warn('AiPullHandler: handleChangeEngine', params);
		const { chatId, engineCode } = params;
		const dialog: ImModelChat = this.#store.getters['chats/getByChatId'](chatId);

		if (!dialog)
		{
			return;
		}

		this.#store.dispatch('copilot/chats/updateModel', { dialogId: dialog.dialogId, aiModel: engineCode });
	}

	handleFileTranscription(params: FileTranscriptionParams)
	{
		Logger.warn('AiPullHandler: handleFileTranscription', params);

		this.#store.dispatch('files/setTranscription', params);
	}

	handleSetCopilotTitle(params: AiAssistantTitleParams)
	{
		Logger.warn('AiPullHandler: handleSetCopilotTitle', params);
		const { dialogId } = params;

		if (!dialogId)
		{
			return;
		}

		void this.#store.dispatch('copilot/chats/setTitleIsCustom', { dialogId, titleIsCustom: true });
	}

	handleChatCopilotRoleUpdate(params: CopilotRoleParams)
	{
		if (!params.copilotRole)
		{
			return;
		}

		const copilotManager = new CopilotManager();
		void copilotManager.handleRoleUpdate(params.copilotRole);
	}
}
