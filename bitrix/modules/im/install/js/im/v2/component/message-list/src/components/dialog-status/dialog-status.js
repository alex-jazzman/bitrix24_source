import { CopilotManager } from 'im.v2.lib.copilot';

import { InputActions } from './components/input-actions';
import { ReadStatus } from './components/read-status/read-status';

import './css/dialog-status.css';

import type { JsonObject } from 'main.core';
import type { ImModelChat, ImModelInputActions } from 'im.v2.model';

// @vue/component
export const DialogStatus = {
	components: { InputActions, ReadStatus },
	props:
	{
		dialogId: {
			required: true,
			type: String,
		},
	},
	data(): JsonObject
	{
		return {
			enterAnimationFinished: false,
		};
	},
	computed:
	{
		dialog(): ImModelChat
		{
			return this.$store.getters['chats/get'](this.dialogId, true);
		},
		chatInputActions(): ?ImModelInputActions
		{
			return this.$store.getters['chats/inputActions/getByDialogId'](this.dialogId);
		},
		visibleInputActions(): ImModelInputActions
		{
			return (this.chatInputActions ?? []).filter((userRecord) => {
				return !this.getCopilotManager().isCopilotBot(userRecord.userId);
			});
		},
		showInputStatus(): boolean
		{
			return this.dialog.inited && this.visibleInputActions.length > 0;
		},
		showReadStatus(): boolean
		{
			return this.dialog.inited && this.dialog.lastMessageViews.countOfViewers > 0;
		},
	},
	methods:
	{
		getCopilotManager(): CopilotManager
		{
			this.copilotManager ??= new CopilotManager();

			return this.copilotManager;
		},
	},
	template: `
		<div class="bx-im-dialog-chat-status__container">
			<Transition
				name="im-dialog-status-animation"
				mode="out-in"
				@before-enter="enterAnimationFinished = false"
				@enter="enterAnimationFinished = true"
			>
				<InputActions v-if="showInputStatus" :inputActions="visibleInputActions" :enterAnimationFinished="enterAnimationFinished" />
				<ReadStatus v-else-if="showReadStatus" :dialogId="dialogId" />
			</Transition>
		</div>
	`,
};
