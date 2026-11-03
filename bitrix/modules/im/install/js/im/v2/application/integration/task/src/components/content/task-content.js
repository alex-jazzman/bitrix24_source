import { EventEmitter, type BaseEvent } from 'main.core.events';

import { BaseChatContent } from 'im.v2.component.content.elements';
import { ChatTextarea } from 'im.v2.component.textarea';
import { ChatDialog } from 'im.v2.component.dialog.chat';
import { EventType } from 'im.v2.const';
import { TaskResultButtonController } from 'im.v2.lib.task-result-button';
import { NotifierShowMessageAction } from 'im.v2.lib.message-notifier';

import { TaskChatHeader } from './components/header';

// @vue/component
export const TaskChatContent = {
	name: 'TaskChatContent',
	components: { BaseChatContent, TaskChatHeader, ChatDialog, ChatTextarea },
	props:
	{
		dialogId: {
			type: String,
			default: '',
		},
		withSidebar: {
			type: Boolean,
			default: true,
		},
	},
	computed: {
		taskId(): number
		{
			const dialog = this.$store.getters['chats/get'](this.dialogId, true);

			return Number(dialog?.entityLink?.id);
		},
	},
	watch: {
		dialogId()
		{
			this.destroyResultButton();
			this.initResultButton();
		},
	},
	created()
	{
		this.initResultButton();

		EventEmitter.subscribe(EventType.notifier.onBeforeShowMessage, this.onBeforeNotificationShow);
	},
	beforeUnmount()
	{
		this.destroyResultButton();
		EventEmitter.unsubscribe(EventType.notifier.onBeforeShowMessage, this.onBeforeNotificationShow);
	},
	methods: {
		initResultButton(): void
		{
			this.taskResultButtonController = new TaskResultButtonController();

			void this.$nextTick(() => {
				this.taskResultButtonController.mount(this.$refs['result-button-container'], {
					taskId: this.taskId,
					dialogId: this.dialogId,
				});
			});
		},
		destroyResultButton()
		{
			this.taskResultButtonController?.destroy();
			this.taskResultButtonController = null;
		},
		onBeforeNotificationShow(event: BaseEvent<{ dialogId: string }>): $Values<typeof NotifierShowMessageAction>
		{
			const eventData = event.getData();
			if (eventData.dialogId !== this.dialogId)
			{
				return NotifierShowMessageAction.show;
			}

			return NotifierShowMessageAction.skip;
		},
	},
	template: `
		<BaseChatContent :dialogId="dialogId" :withSidebar="withSidebar">
			<template #header>
				<TaskChatHeader :dialogId="dialogId" />
			</template>
			<template #dialog>
				<ChatDialog
					:dialogId="dialogId"
					:key="dialogId"
					:reloadOnExit="false"
					:directForward="true"
				/>
			</template>
			<template #textarea>
				<ChatTextarea
					:dialogId="dialogId"
					:key="dialogId"
					:withMarket="true"
					:withAutoFocus="false"
					:withKeyboardNavigation="true"
				>
					<template #bottom-panel-buttons>
						<div ref="result-button-container"></div>
					</template>
				</ChatTextarea>
			</template>
		</BaseChatContent>
	`,
};
