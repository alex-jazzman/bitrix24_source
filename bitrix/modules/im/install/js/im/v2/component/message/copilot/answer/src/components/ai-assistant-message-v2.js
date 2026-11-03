import { type BaseEvent } from 'main.core.events';

import { BaseMessage } from 'im.v2.component.message.base';
import { AuthorTitle, DefaultMessageContent, MessageKeyboard, MessageStatus } from 'im.v2.component.message.elements';
import { EventType, KeyboardButtonType, RestMethod, type KeyboardButtonConfig } from 'im.v2.const';
import { Analytics } from 'im.v2.lib.analytics';
import { CopilotManager, isCopilotGenerationActive } from 'im.v2.lib.copilot';
import { runAction } from 'im.v2.lib.rest';
import { type ImModelMessage } from 'im.v2.model';

import { BottomPanel } from './bottom-panel';

import '../css/ai-assistant-message-v2.css';

// @vue/component
export const AiAssistantMessageV2 = {
	name: 'AiAssistantMessageV2',
	components: {
		AuthorTitle,
		BaseMessage,
		BottomPanel,
		MessageKeyboard,
		MessageStatus,
		DefaultMessageContent,
	},
	props: {
		item: {
			type: Object,
			required: true,
		},
		dialogId: {
			type: String,
			required: true,
		},
		withTitle: {
			type: Boolean,
			default: true,
		},
	},
	computed: {
		message(): ImModelMessage
		{
			return this.item;
		},
		isError(): boolean
		{
			return this.copilotManager.isErrorMessage(this.message.id);
		},
		isFooterAvailable(): boolean
		{
			return this.copilotManager.isMessageFooterAvailable(this.message.id);
		},
		isContextMenuAvailable(): boolean
		{
			return !this.copilotManager.isProcessingMessage(this.message.id);
		},
		isThinking(): boolean
		{
			const blocks = this.$store.getters['messages/builder/getBlocks'](this.message.id);

			return blocks.some((block) => block.type === 'aiAssistantSearch');
		},
		isGenerationActive(): boolean
		{
			return isCopilotGenerationActive(this.message, this.$store);
		},
		isActionsAvailable(): boolean
		{
			return !this.isGenerationActive && this.isContextMenuAvailable;
		},
		hasKeyboard(): boolean
		{
			return this.message.keyboard.length > 0;
		},
		suggestsCount(): number
		{
			return this.message.keyboard.filter(
				(button: KeyboardButtonConfig) => button.type === KeyboardButtonType.button,
			).length;
		},
	},
	created()
	{
		this.copilotManager = new CopilotManager();
	},
	mounted()
	{
		if (this.hasKeyboard)
		{
			this.subscribeToVisibility();
		}
	},
	beforeUnmount()
	{
		this.unsubscribeFromVisibility();
	},
	methods: {
		subscribeToVisibility(): void
		{
			this.$Bitrix.eventEmitter.subscribe(EventType.dialog.onMessageIsVisible, this.onMessageIsVisible);
		},
		unsubscribeFromVisibility(): void
		{
			this.$Bitrix.eventEmitter.unsubscribe(EventType.dialog.onMessageIsVisible, this.onMessageIsVisible);
		},
		onMessageIsVisible(event: BaseEvent<{ messageId: number, dialogId: string }>): void
		{
			const { messageId, dialogId } = event.getData();
			if (dialogId !== this.dialogId || messageId !== this.message.id)
			{
				return;
			}

			Analytics.getInstance().copilot.onShowSuggestedPrompts(this.dialogId, this.message.id, this.suggestsCount);
		},
		onSuggestedPromptClick(): void
		{
			Analytics.getInstance().copilot.onClickSuggestedPrompt(this.dialogId, this.suggestsCount);
		},
		onRegenerate(): void
		{
			void runAction(RestMethod.imV2CopilotMessageRegenerate, {
				data: { messageId: this.message.id },
			});
		},
		loc(phraseCode: string, replacements: {[p: string]: string} = {}): string
		{
			return this.$Bitrix.Loc.getMessage(phraseCode, replacements);
		},
	},
	template: `
		<BaseMessage
			:item="item"
			:dialogId="dialogId"
			:withError="isError"
			:withContextMenu="isActionsAvailable"
			:withReactions="isActionsAvailable"
			class="bx-im-message-ai-assistant-v2-base-message__container"
			:class="{'--thinking': isThinking}"
		>
			<div v-if="isThinking" class="bx-im-message-ai-assistant-v2-answer__glow"></div>
			<div class="bx-im-message-default__container bx-im-message-ai-assistant-v2-answer__container" :class="{'--error': isError}">
				<AuthorTitle :item="item" />
				<div class="bx-im-message-default-content__container bx-im-message-default-content__scope">
					<DefaultMessageContent
						:item="item"
						:dialogId="dialogId"
						:withAttach="false"
						:withMessageStatus="false"
						:withBuilder="true"
						:withReactions="isActionsAvailable"
					/>
					<div v-if="isError" class="bx-im-message-default-content__bottom-panel">
						<div class="bx-im-message-default-content__status-container">
							<MessageStatus :item="message" />
						</div>
					</div>
				</div>
			</div>
			<BottomPanel v-if="isFooterAvailable" :message="message" :dialogId="dialogId" class="bx-im-message-ai-assistant-v2-answer__bottom-panel" @regenerate="onRegenerate" />
			<template #after-message v-if="hasKeyboard">
				<MessageKeyboard :item="message" :dialogId="dialogId" @click="onSuggestedPromptClick" />
			</template>
		</BaseMessage>
	`,
};
