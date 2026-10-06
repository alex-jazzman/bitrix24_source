import { Type } from 'main.core';
import { type BaseEvent } from 'main.core.events';

import { AvatarSize, MessageAvatar } from 'im.v2.component.elements.avatar';
import { BaseMessage } from 'im.v2.component.message.base';
import { EventType } from 'im.v2.const';
import { Analytics } from 'im.v2.lib.analytics';
import { SendingService } from 'im.v2.provider.service.sending';
import { type ImModelMessage, type ImModelCopilotPrompt, type ImModelCopilotRole } from 'im.v2.model';

import './css/copilot-creation-message.css';

// @vue/component
export const ChatCopilotCreationMessage = {
	name: 'ChatCopilotCreationMessage',
	components: { BaseMessage, MessageAvatar },
	props: {
		item: {
			type: Object,
			required: true,
		},
		dialogId: {
			type: String,
			required: true,
		},
	},
	computed: {
		AvatarSize: () => AvatarSize,
		message(): ImModelMessage
		{
			return this.item;
		},
		preparedTitle(): string
		{
			const phrase = this.message.componentParams?.copilotRoleUpdated
				? 'IM_MESSAGE_COPILOT_CREATION_HEADER_TITLE_AFTER_CHANGE'
				: 'IM_MESSAGE_COPILOT_CREATION_HEADER_TITLE'
			;

			return this.loc(phrase, {
				'#COPILOT_ROLE_NAME#': this.roleName,
			});
		},
		promptList(): ImModelCopilotPrompt[]
		{
			return this.$store.getters['copilot/messages/getPrompts'](this.message.id);
		},
		hasSuggestedPrompts(): boolean
		{
			return Type.isArrayFilled(this.promptList);
		},
		suggestsCount(): number
		{
			return this.promptList.length;
		},
		role(): ImModelCopilotRole
		{
			return this.$store.getters['copilot/messages/getRole'](this.message.id);
		},
		roleName(): string
		{
			return this.role.name;
		},
	},
	mounted()
	{
		if (this.hasSuggestedPrompts)
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
		onMessageClick(prompt: ImModelCopilotPrompt)
		{
			Analytics.getInstance().copilot.onClickSuggestedPrompt(this.dialogId, this.suggestsCount);

			void this.getSendingService().sendCopilotPrompt({
				text: prompt.text,
				copilot: {
					promptCode: prompt.code,
				},
				dialogId: this.dialogId,
			});
		},
		getSendingService(): SendingService
		{
			if (!this.sendingService)
			{
				this.sendingService = SendingService.getInstance();
			}

			return this.sendingService;
		},
		loc(phraseCode: string, replacements: {[p: string]: string} = {}): string
		{
			return this.$Bitrix.Loc.getMessage(phraseCode, replacements);
		},
	},
	template: `
		<BaseMessage
			:dialogId="dialogId"
			:item="item"
			:withContextMenu="false"
			:withReactions="false"
			:withBackground="false"
		>
			<div class="bx-im-message-copilot-creation__container">
				<div class="bx-im-message-copilot-creation__header">
					<MessageAvatar 
						:messageId="message.id"
						:authorId="message.authorId"
						:size="AvatarSize.XXL"
					/>
					<div class="bx-im-message-copilot-creation__info">
						<div class="bx-im-message-copilot-creation__title" :title="preparedTitle">
							{{ preparedTitle }}
						</div>
						<div 
							class="bx-im-message-copilot-creation__text" 
							:title="loc('IM_MESSAGE_COPILOT_CREATION_HEADER_DESC')"
						>
							{{ loc('IM_MESSAGE_COPILOT_CREATION_HEADER_DESC') }}
						</div>
					</div>
				</div>
				<div class="bx-im-message-copilot-creation__separator"><div></div></div>
				<div class="bx-im-message-copilot-creation__actions">
					<div
						v-for="prompt in promptList"
						:key="prompt.code"
						@click="onMessageClick(prompt)"
						class="bx-im-message-copilot-creation__action"
					>
						<span class="bx-im-message-copilot-creation__action-text">
							{{ prompt.title }}
						</span>
					</div>
				</div>
			</div>
		</BaseMessage>
	`,
};
