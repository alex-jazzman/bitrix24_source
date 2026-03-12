import { Messenger } from 'im.public';
import { CopilotList } from 'im.v2.component.list.items.copilot';
import { ActionByUserType, ChatType, Layout } from 'im.v2.const';
import { Analytics } from 'im.v2.lib.analytics';
import { Logger } from 'im.v2.lib.logger';
import { CopilotService } from 'im.v2.provider.service.copilot';
import { PermissionManager } from 'im.v2.lib.permission';

import './css/copilot-container.css';

import type { JsonObject } from 'main.core';

// @vue/component
export const CopilotListContainer = {
	name: 'CopilotListContainer',
	components: { CopilotList },
	emits: ['selectEntity'],
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
	},
	created()
	{
		Logger.warn('List: Copilot container created');
	},
	methods:
	{
		async onCreateChatClick()
		{
			Analytics.getInstance().chatCreate.onStartClick(ChatType.copilot);
			await this.createChat();
		},
		onChatClick(dialogId)
		{
			this.$emit('selectEntity', { layoutName: Layout.copilot, entityId: dialogId });
		},
		getCopilotService(): CopilotService
		{
			if (!this.copilotService)
			{
				this.copilotService = new CopilotService();
			}

			return this.copilotService;
		},
		async createChat(roleCode: string)
		{
			this.isCreatingChat = true;

			const newDialogId = await this.getCopilotService().createChat({ roleCode })
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
		<div class="bx-im-list-container-copilot__scope bx-im-list-container-copilot__container">
			<div class="bx-im-list-container-copilot__header_container">
				<div class="bx-im-list-container-copilot__header_title">{{ loc('IM_LIST_CONTAINER_COPILOT_HEADER') }}</div>
				<div
					v-if="canCreate"
					class="bx-im-list-container-copilot__create-chat"
					:class="{'--loading': isCreatingChat}"
					ref="createChatButton"
					@click="onCreateChatClick"
				>
					<div class="bx-im-list-container-copilot__create-chat_icon"></div>
				</div>
			</div>
			<div class="bx-im-list-container-copilot__elements_container">
				<div class="bx-im-list-container-copilot__elements">
					<CopilotList @chatClick="onChatClick" />
				</div>
			</div>
		</div>
	`,
};
