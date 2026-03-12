import { Messenger } from 'im.public';
import { AiAssistantList } from 'im.v2.component.list.items.ai-assistant';
import { ActionByUserType, Layout } from 'im.v2.const';
import { Logger } from 'im.v2.lib.logger';
import { AiAssistantService } from 'im.v2.provider.service.ai-assistant';
import { PermissionManager } from 'im.v2.lib.permission';

import './css/ai-assistant-container.css';

import type { JsonObject } from 'main.core';

// @vue/component
export const AiAssistantListContainer = {
	name: 'AiAssistantListContainer',
	components: { AiAssistantList },
	emits: ['selectEntity'],
	data(): JsonObject
	{
		return {
			isCreatingChat: false,
		};
	},
	computed: {
		canCreate(): boolean
		{
			return PermissionManager.getInstance().canPerformActionByUserType(ActionByUserType.createAiAssistant);
		},
	},
	created()
	{
		Logger.warn('List: AiAssistant container created');
	},
	methods: {
		onChatClick(dialogId)
		{
			this.$emit('selectEntity', { layoutName: Layout.aiAssistant, entityId: dialogId });
		},
		getAiAssistantService(): AiAssistantService
		{
			if (!this.aiAssistantService)
			{
				this.aiAssistantService = new AiAssistantService();
			}

			return this.aiAssistantService;
		},
		async onCreateChatClick()
		{
			this.isCreatingChat = true;

			const newDialogId = await this.getAiAssistantService().createChat()
				.catch(() => {
					this.isCreatingChat = false;
				});

			this.isCreatingChat = false;
			void Messenger.openCopilot(newDialogId);
		},
		loc(phraseCode: string): string
		{
			return this.$Bitrix.Loc.getMessage(phraseCode);
		},
	},
	template: `
		<div class="bx-im-list-container-ai-assistant__container">
			<div class="bx-im-list-container-ai-assistant__header_container">
				<div class="bx-im-list-container-ai-assistant__header_title">Marta AI</div>
				<div
					v-if="canCreate"
					class="bx-im-list-container-ai-assistant__create-chat"
					:class="{ '--loading': isCreatingChat }"
					@click="onCreateChatClick"
				>
					<div class="bx-im-list-container-ai-assistant__create-chat_icon"></div>
				</div>
			</div>
			<div class="bx-im-list-container-ai-assistant__elements_container">
				<div class="bx-im-list-container-ai-assistant__elements">
					<AiAssistantList @chatClick="onChatClick" />
				</div>
			</div>
		</div>
	`,
};
