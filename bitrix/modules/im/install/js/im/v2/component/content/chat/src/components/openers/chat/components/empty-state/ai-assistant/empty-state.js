import { type JsonObject } from 'main.core';

import { Layout } from 'im.v2.const';
import { CopilotManager } from 'im.v2.lib.copilot';
import { Feature, FeatureManager } from 'im.v2.lib.feature';
import { LayoutManager } from 'im.v2.lib.layout';
import { SpecialBackground, ThemeManager, type BackgroundStyle } from 'im.v2.lib.theme';
import { SendingService } from 'im.v2.provider.service.sending';

import { AiAssistantEmptyStateView } from './empty-state-view';

import './css/empty-state.css';

// @vue/component
export const AiAssistantEmptyState = {
	name: 'AiAssistantEmptyState',
	components: { AiAssistantEmptyStateView },
	data(): JsonObject
	{
		return {
			currentDialogId: '',
			deferredDialogPromise: null,
		};
	},
	computed:
	{
		backgroundStyle(): BackgroundStyle
		{
			const backgroundId = FeatureManager.isFeatureAvailable(Feature.isBitrixGptV2Available)
				? SpecialBackground.aiAssistant
				: SpecialBackground.copilot;

			return ThemeManager.getBackgroundStyleById(backgroundId);
		},
		isFileUploadEnabled(): boolean
		{
			return FeatureManager.isFeatureAvailable(Feature.isCopilotFileUploadAvailable);
		},
		suggestions(): string[]
		{
			return this.$store.getters['copilot/getSuggests'];
		},
		isCurrentChatActivated(): boolean
		{
			if (!this.currentDialogId)
			{
				return false;
			}

			return Boolean(this.$store.getters['recent/get'](this.currentDialogId));
		},
	},
	watch:
	{
		isCurrentChatActivated(isActivated: boolean): void
		{
			if (isActivated)
			{
				this.openActivatedChat();
			}
		},
	},
	created()
	{
		this.copilotManager = new CopilotManager();
		this.currentDialogId = this.copilotManager.draftChatCreate();
		this.deferredDialogPromise = this.copilotManager.draftChatGetRealPromise();
		void this.syncRealDialogId();
	},
	beforeUnmount()
	{
		this.copilotManager.draftChatDispose();
	},
	methods:
	{
		async syncRealDialogId(): Promise<void>
		{
			const realDialogId = await this.copilotManager.draftChatGetRealPromise();
			if (realDialogId)
			{
				this.currentDialogId = realDialogId;
			}
		},
		openActivatedChat(): void
		{
			void LayoutManager.getInstance().setLayout({
				name: Layout.copilot,
				entityId: this.currentDialogId,
				contextId: 0,
			});
		},
		async onSuggestionSelect({ text }: { text: string }): Promise<void>
		{
			const realDialogId = await this.copilotManager.draftChatGetRealPromise();
			if (!realDialogId)
			{
				return;
			}

			void SendingService.getInstance().sendMessage({ text, dialogId: realDialogId });
		},
	},
	template: `
		<div class="bx-im-content-ai-assistant-empty-state__container" :style="backgroundStyle">
			<AiAssistantEmptyStateView
				:suggestions="suggestions"
				:dialogId="currentDialogId"
				:withTextArea="true"
				:deferredDialogPromise="deferredDialogPromise"
				:isFileUploadEnabled="isFileUploadEnabled"
				@selectSuggestion="onSuggestionSelect"
			/>
		</div>
	`,
};
