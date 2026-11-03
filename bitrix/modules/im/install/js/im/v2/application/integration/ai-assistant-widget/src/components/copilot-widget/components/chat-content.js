import { CopilotContent } from 'im.v2.component.content.chat';
import { LocalStorageKey } from 'im.v2.const';
import { ChatDialog } from 'im.v2.component.dialog.chat';
import { SpecialBackground } from 'im.v2.lib.theme';

import { WidgetChatManager } from '../../../classes/widget-chat-manager';
import { AiAssistantWidgetChatHeader } from '../../header/header';
import { AiAssistantWidgetEmptyState } from './empty-state';

import '../css/chat-content.css';

// @vue/component
export const CopilotWidgetChatContent = {
	name: 'CopilotWidgetChatContent',
	components: { CopilotContent, ChatDialog, AiAssistantWidgetChatHeader, AiAssistantWidgetEmptyState },
	props: {
		dialogId: {
			type: String,
			default: '',
		},
		withSidebar: {
			type: Boolean,
			default: true,
		},
		isCreatingChat: {
			type: Boolean,
			default: false,
		},
	},
	emits: ['toggleList', 'createChat', 'selectSuggestion'],
	data(): { animateSwapOnSend: boolean }
	{
		return { animateSwapOnSend: false };
	},
	watch: {
		showStartScreen(isStartScreen: boolean, wasStartScreen: boolean): void
		{
			// animate the start screen → chat swap only when it is caused by a send; plain
			// navigation to an existing chat carries no mark, so it stays instant
			this.animateSwapOnSend = wasStartScreen && !isStartScreen
				&& this.$store.getters['copilot/isWidgetChatOpenedBySend'](this.dialogId);
		},
	},
	computed: {
		SpecialBackground: () => SpecialBackground,
		heightConfig: () => ({ storageKey: LocalStorageKey.textareaHeightAiAssistantWidget }),
		isTempChat(): boolean
		{
			return this.$store.getters['copilot/chats/isTempChat'](this.dialogId);
		},
		showStartScreen(): boolean
		{
			if (this.isTempChat)
			{
				return true;
			}

			// no dialog resolved yet: show the start screen instead of a DialogLoader,
			// but only on a clean open (a draft is active). while a saved chat is being
			// restored no draft exists, so the loader stays.
			return !this.dialogId && WidgetChatManager.getInstance().hasActiveDraft();
		},
	},
	template: `
		<Transition name="im-widget-start-reveal" :css="animateSwapOnSend" :duration="400">
		<div v-if="showStartScreen" class="bx-im-ai-assistant-widget-start-screen-content --ui-context-content-light" data-testid="ai-assistant-widget-start-screen-content">
			<div class="--ui-context-content-dark">
				<AiAssistantWidgetChatHeader
					:dialogId="dialogId"
					:withListToggle="true"
					:isCreating="isCreatingChat"
					:isStartScreen="true"
					@toggleList="$emit('toggleList')"
					@createChat="$emit('createChat')"
				/>
			</div>
			<AiAssistantWidgetEmptyState
				:key="dialogId"
				:dialogId="dialogId"
				@selectSuggestion="$emit('selectSuggestion', $event)"
			/>
		</div>
		<CopilotContent
			v-else
			:dialogId="dialogId"
			:withSidebar="withSidebar"
			:backgroundId="SpecialBackground.transparent"
			:heightConfig="heightConfig"
		>
			<template #header>
				<div class="--ui-context-content-dark">
					<AiAssistantWidgetChatHeader
						:dialogId="dialogId"
						:withListToggle="true"
						:isCreating="isCreatingChat"
						@toggleList="$emit('toggleList')"
						@createChat="$emit('createChat')"
					/>
				</div>
			</template>
			<template #dialog>
				<div class="bx-im-ai-assistant-widget-dialog-context --ui-context-content-light">
					<ChatDialog :dialogId="dialogId" :key="dialogId"/>
				</div>
			</template>
		</CopilotContent>
		</Transition>
	`,
};
