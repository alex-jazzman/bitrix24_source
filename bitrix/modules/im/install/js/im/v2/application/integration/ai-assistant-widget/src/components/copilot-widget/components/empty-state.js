import { LocalStorageKey } from 'im.v2.const';
import { Feature, FeatureManager } from 'im.v2.lib.feature';
import { AiAssistantEmptyStateView, AiAssistantSuggestionDesign } from 'im.v2.component.content.chat';
import { ChatContentDisclaimer, DropArea } from 'im.v2.component.content.elements';

import { WidgetChatManager } from '../../../classes/widget-chat-manager';

import '../css/empty-state.css';

// @vue/component
export const AiAssistantWidgetEmptyState = {
	name: 'AiAssistantWidgetEmptyState',
	components: { AiAssistantEmptyStateView, ChatContentDisclaimer, DropArea },
	props: {
		dialogId: {
			type: String,
			default: '',
		},
	},
	emits: ['selectSuggestion'],
	data(): {
		currentDialogId: string,
		deferredDialogPromise: ?Promise<?string>,
		allowBeforeSendOnUninitedTemp: boolean,
		dropAreaContainer: ?HTMLElement,
	}
	{
		return {
			// The textarea targets the hydrated real chat on success. If hydration fails,
			// it stays on the local temp and enables only the guarded before-send retry.
			currentDialogId: this.dialogId,
			deferredDialogPromise: null,
			allowBeforeSendOnUninitedTemp: false,
			dropAreaContainer: null,
		};
	},
	computed: {
		AiAssistantSuggestionDesign: () => AiAssistantSuggestionDesign,
		isFileUploadEnabled(): boolean
		{
			return !this.allowBeforeSendOnUninitedTemp
				&& FeatureManager.isFeatureAvailable(Feature.isCopilotFileUploadAvailable)
			;
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
			return { draftDialogId: WidgetChatManager.getInstance().getEmptyStateDraftDialogId() };
		},
		textareaHeightConfig(): { storageKey: string }
		{
			return {
				storageKey: LocalStorageKey.textareaHeightAiAssistantWidget,
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
	watch: {
		dialogId(): void
		{
			void this.syncRealDialogId();
		},
		isCurrentChatActivated(isActivated: boolean): void
		{
			if (isActivated)
			{
				WidgetChatManager.getInstance().promoteDraftChat(this.currentDialogId);
			}
		},
	},
	created(): void
	{
		this.isUnmounted = false;
		void this.syncRealDialogId();
	},
	mounted(): void
	{
		this.dropAreaContainer = this.$refs.container;
	},
	beforeUnmount(): void
	{
		this.isUnmounted = true;
		this.allowBeforeSendOnUninitedTemp = false;
		if (this.currentDialogId === this.activeTempDialogId)
		{
			this.currentDialogId = '';
		}
		this.activeTempDialogId = null;
	},
	methods: {
		async syncRealDialogId(): Promise<void>
		{
			const tempDialogId = this.dialogId;
			const manager = WidgetChatManager.getInstance();
			const isTempChat = this.$store.getters['copilot/chats/isTempChat'](tempDialogId);
			this.allowBeforeSendOnUninitedTemp = false;
			this.currentDialogId = tempDialogId;
			this.activeTempDialogId = isTempChat ? tempDialogId : null;
			this.deferredDialogPromise = isTempChat ? manager.getDraftRealPromise() : null;
			if (!this.activeTempDialogId)
			{
				return;
			}

			const realPromise = this.deferredDialogPromise;
			let realDialogId: ?string = null;
			try
			{
				realDialogId = await realPromise;
			}
			catch
			{
				realDialogId = null;
			}

			if (this.isUnmounted || this.activeTempDialogId !== tempDialogId || this.dialogId !== tempDialogId)
			{
				return;
			}

			if (this.currentDialogId !== tempDialogId)
			{
				this.activeTempDialogId = null;

				return;
			}

			if (manager.getDraftRealPromise() !== realPromise)
			{
				this.activeTempDialogId = null;
				this.currentDialogId = '';

				return;
			}
			if (!realDialogId)
			{
				if (!manager.hasActiveDraft())
				{
					this.activeTempDialogId = null;
					this.currentDialogId = '';
				}
				else
				{
					this.allowBeforeSendOnUninitedTemp = true;
				}

				return;
			}

			this.activeTempDialogId = null;
			this.currentDialogId = realDialogId;
		},
		onSuggestionSelect({ text }: { text: string }): void
		{
			this.$emit('selectSuggestion', text);
		},
	},
	template: `
		<div class="bx-im-ai-assistant-widget-empty-state --ui-context-content-light" data-testid="ai-assistant-widget-start-screen" ref="container">
			<AiAssistantEmptyStateView
				:suggestions="suggestions"
				:dialogId="currentDialogId"
				:withTextArea="true"
				:withDraft="withDraft"
				:suggestionDesign="AiAssistantSuggestionDesign.gradient"
				:deferredDialogPromise="deferredDialogPromise"
				:allowBeforeSendOnUninitedTemp="allowBeforeSendOnUninitedTemp"
				:isFileUploadEnabled="isFileUploadEnabled"
				:heightConfig="textareaHeightConfig"
				@selectSuggestion="onSuggestionSelect"
			/>
			<ChatContentDisclaimer :dialogId="currentDialogId" :forceVisible="true"/>
			<DropArea v-if="withDropArea" :key="currentDialogId" :dialogId="currentDialogId" :container="dropAreaContainer" data-testid="ai-assistant-widget-start-screen-drop-area"/>
		</div>
	`,
};
