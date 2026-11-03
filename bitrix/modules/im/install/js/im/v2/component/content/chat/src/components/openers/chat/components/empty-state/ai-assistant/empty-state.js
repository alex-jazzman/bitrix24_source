import { type JsonObject } from 'main.core';

import { Layout, LocalStorageKey } from 'im.v2.const';
import { CopilotManager } from 'im.v2.lib.copilot';
import { DraftManager } from 'im.v2.lib.draft';
import { Feature, FeatureManager } from 'im.v2.lib.feature';
import { LayoutManager } from 'im.v2.lib.layout';
import { Notifier } from 'im.v2.lib.notifier';
import { SpecialBackground, ThemeManager, type BackgroundStyle } from 'im.v2.lib.theme';
import { SendingService } from 'im.v2.provider.service.sending';
import { DropArea } from 'im.v2.component.content.elements';

import { AiAssistantEmptyStateView } from './empty-state-view';

import './css/empty-state.css';

const EMPTY_STATE_TEXTAREA_MIN_HEIGHT = 40;

// @vue/component
export const AiAssistantEmptyState = {
	name: 'AiAssistantEmptyState',
	components: { AiAssistantEmptyStateView, DropArea },
	data(): JsonObject
	{
		return {
			currentDialogId: '',
			draftDialogId: '',
			deferredDialogPromise: null,
			dropAreaContainer: null,
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
		isTempChat(): boolean
		{
			return this.$store.getters['copilot/chats/isTempChat'](this.currentDialogId);
		},
		withDropArea(): boolean
		{
			return this.isFileUploadEnabled && !this.isTempChat && Boolean(this.dropAreaContainer);
		},
		suggestions(): string[]
		{
			return this.$store.getters['copilot/getSuggests'];
		},
		withDraft(): { draftDialogId: string }
		{
			return { draftDialogId: this.draftDialogId };
		},
		textareaHeightConfig(): { storageKey: string, minHeight: number }
		{
			return {
				storageKey: LocalStorageKey.textareaHeightAiAssistantEmptyState,
				minHeight: EMPTY_STATE_TEXTAREA_MIN_HEIGHT,
			};
		},
		isCurrentChatActivated(): boolean
		{
			if (!this.currentDialogId)
			{
				return false;
			}

			if (this.$store.getters['recent/get'](this.currentDialogId))
			{
				return true;
			}

			const chatId = this.$store.getters['chats/get'](this.currentDialogId)?.chatId ?? 0;
			if (chatId <= 0)
			{
				return false;
			}

			return Boolean(this.$store.state.messages.chatCollection[chatId]?.size);
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
		this.isUnmounted = false;
		this.copilotManager = new CopilotManager();
		this.currentDialogId = this.copilotManager.draftChatCreate();
		this.activeTempDialogId = this.currentDialogId;
		this.draftDialogId = this.copilotManager.getEmptyStateDraftKey();
		this.deferredDialogPromise = this.copilotManager.draftChatGetRealPromise();

		void this.syncRealDialogId();
	},
	mounted()
	{
		this.dropAreaContainer = this.$refs.container;
	},
	beforeUnmount()
	{
		this.isUnmounted = true;
		this.invalidateDraftChat(this.activeTempDialogId);
	},
	methods:
	{
		async syncRealDialogId(): Promise<void>
		{
			const tempDialogId = this.activeTempDialogId;
			let realDialogId: ?string = null;
			try
			{
				realDialogId = await this.deferredDialogPromise;
			}
			catch
			{
				realDialogId = null;
			}

			if (this.isUnmounted || !tempDialogId || this.activeTempDialogId !== tempDialogId)
			{
				return;
			}

			if (this.currentDialogId !== tempDialogId)
			{
				this.invalidateDraftChat(tempDialogId);

				return;
			}

			if (!realDialogId)
			{
				this.invalidateDraftChat(tempDialogId);
				Notifier.onDefaultError();
				void LayoutManager.getInstance().setLayout({ name: Layout.chat });

				return;
			}

			this.activeTempDialogId = null;
			this.currentDialogId = realDialogId;
		},
		invalidateDraftChat(tempDialogId: ?string): void
		{
			if (this.activeTempDialogId !== tempDialogId)
			{
				return;
			}

			this.activeTempDialogId = null;
			if (this.currentDialogId === tempDialogId)
			{
				this.currentDialogId = '';
			}
			this.copilotManager.draftChatDispose();
		},
		openActivatedChat(): void
		{
			if (this.isUnmounted || !this.currentDialogId || this.isTempChat)
			{
				return;
			}

			// the send just activated the draft chat — let ChatOpener cross-fade this specific swap
			void this.$store.dispatch('copilot/setActivatedChatDialogId', this.currentDialogId);
			void LayoutManager.getInstance().setLayout({
				name: Layout.copilot,
				entityId: this.currentDialogId,
				contextId: 0,
			});
		},
		async onSuggestionSelect({ text }: { text: string }): Promise<void>
		{
			const draftManager = DraftManager.getInstance();
			draftManager.clearDraft(this.draftDialogId);
			draftManager.setDraftText(this.draftDialogId, '');

			const realDialogId = await this.deferredDialogPromise?.catch(() => null);
			if (this.isUnmounted || !realDialogId || this.currentDialogId !== realDialogId)
			{
				return;
			}

			void SendingService.getInstance().sendMessage({ text, dialogId: realDialogId });
		},
	},
	template: `
		<div class="bx-im-content-ai-assistant-empty-state__container" :style="backgroundStyle" ref="container">
			<AiAssistantEmptyStateView
				:suggestions="suggestions"
				:dialogId="currentDialogId"
				:withDraft="withDraft"
				:withTextArea="true"
				:withKeyboardNavigation="true"
				:deferredDialogPromise="deferredDialogPromise"
				:isFileUploadEnabled="isFileUploadEnabled"
				:heightConfig="textareaHeightConfig"
				@selectSuggestion="onSuggestionSelect"
			/>
			<DropArea v-if="withDropArea" :key="currentDialogId" :dialogId="currentDialogId" :container="dropAreaContainer" />
		</div>
	`,
};
