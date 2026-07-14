import { type JsonObject } from 'main.core';

import { Messenger } from 'im.public';
import { CopilotList } from 'im.v2.component.list.items.copilot';
import { ActionByUserType, ChatType, Layout } from 'im.v2.const';
import { Analytics } from 'im.v2.lib.analytics';
import { CopilotManager } from 'im.v2.lib.copilot';
import { Logger } from 'im.v2.lib.logger';
import { PermissionManager } from 'im.v2.lib.permission';
import { CopilotChatService } from 'im.v2.provider.service.copilot';

import { AiAssistantCreateChatButton } from './create-chat-button-ai-assistant';

import './css/ai-assistant-container.css';

// @vue/component
export const AiAssistantListContainer = {
	name: 'AiAssistantListContainer',
	components: { CopilotList, AiAssistantCreateChatButton },
	emits: ['selectChat'],
	data(): JsonObject
	{
		return {
			isCreatingChat: false,
		};
	},
	computed:
	{
		canCreate(): boolean
		{
			return PermissionManager.getInstance().canPerformActionByUserType(ActionByUserType.createCopilot);
		},
		headerTitle(): string
		{
			return this.loc('IM_LIST_CONTAINER_COPILOT_HEADER_MSGVER_1', {
				'#COPILOT_NAME#': this.copilotManager.getName(),
			});
		},
	},
	created()
	{
		this.copilotManager = new CopilotManager();
		Logger.warn('List: Copilot container created');
	},
	methods:
	{
		onSelectChat(dialogId)
		{
			this.$emit('selectChat', { layoutName: Layout.copilot, dialogId });
		},
		getCopilotChatService(): CopilotChatService
		{
			if (!this.copilotService)
			{
				this.copilotService = new CopilotChatService();
			}

			return this.copilotService;
		},
		async createChat()
		{
			Analytics.getInstance().chatCreate.onStartClick(ChatType.copilot);
			this.isCreatingChat = true;

			const newDialogId = await this.getCopilotChatService().createDefaultChat()
				.catch(() => {
					this.isCreatingChat = false;
				});

			this.isCreatingChat = false;
			void Messenger.openCopilot(newDialogId);
		},
		loc(phraseCode: string, replacements: {[p: string]: string} = {}): string
		{
			return this.$Bitrix.Loc.getMessage(phraseCode, replacements);
		},
	},
	template: `
		<div class="bx-im-list-container-copilot__scope bx-im-list-container-copilot__container">
			<div class="bx-im-list-container-copilot__header_container">
				<div class="bx-im-list-container-copilot__header_title">{{ headerTitle }}</div>
				<AiAssistantCreateChatButton
					v-if="canCreate"
					:isCreating="isCreatingChat"
					@newChat="createChat"
				/>
			</div>
			<div class="bx-im-list-container-copilot__elements_container">
				<div class="bx-im-list-container-copilot__elements">
					<CopilotList @selectChat="onSelectChat" />
				</div>
			</div>
		</div>
	`,
};
