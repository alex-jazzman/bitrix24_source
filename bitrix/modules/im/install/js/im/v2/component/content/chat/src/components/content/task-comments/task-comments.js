import { type JsonObject } from 'main.core';
import { EventEmitter, type BaseEvent } from 'main.core.events';

import { BaseChatContent } from 'im.v2.component.content.elements';
import { SidebarAnimation } from 'im.v2.component.animation';
import { LocalStorageKey, EventType } from 'im.v2.const';
import { LocalStorageManager } from 'im.v2.lib.local-storage';
import { Analytics } from 'im.v2.lib.analytics';
import { type ImModelChat } from 'im.v2.model';
import { Feature, FeatureManager } from 'im.v2.lib.feature';

import { TaskCommentsCard } from './components/card';
import { TaskCommentsHeader } from './components/header';

const TASK_CARD_WIDTH = 567;

// @vue/component
export const TaskCommentsContent = {
	name: 'TaskCommentsContent',
	components: { BaseChatContent, TaskCommentsCard, TaskCommentsHeader, SidebarAnimation },
	props: {
		dialogId: {
			type: String,
			required: true,
		},
	},
	data(): JsonObject
	{
		return {
			isTaskCardOpened: LocalStorageManager.getInstance().get(LocalStorageKey.taskCommentsCardOpened, false),
		};
	},
	computed: {
		TASK_CARD_WIDTH: () => TASK_CARD_WIDTH,
		dialog(): ImModelChat
		{
			return this.$store.getters['chats/get'](this.dialogId, true);
		},
		taskId(): number
		{
			return Number(this.dialog.entityLink.id);
		},
		isTaskCardAvailable(): boolean
		{
			return FeatureManager.isFeatureAvailable(Feature.isTaskCardAvailable);
		},
	},
	mounted()
	{
		EventEmitter.subscribe(EventType.task.openCardFromMessage, this.openCardFromMessage);
	},
	beforeUnmount()
	{
		EventEmitter.unsubscribe(EventType.task.openCardFromMessage, this.openCardFromMessage);
	},
	methods: {
		openCardFromMessage(event: BaseEvent)
		{
			const { taskId } = event.getData();

			if (taskId !== this.taskId)
			{
				return;
			}

			if (this.isTaskCardOpened)
			{
				return;
			}

			event.preventDefault();

			Analytics.getInstance().taskComments.onOpenCardFromMessage(this.dialogId);

			this.isTaskCardOpened = !this.isTaskCardOpened;

			this.saveTaskCardOpenedState();
		},
		toggleTaskCard()
		{
			if (this.isTaskCardOpened === false)
			{
				Analytics.getInstance().taskComments.onOpenCard(this.dialogId);
			}

			this.isTaskCardOpened = !this.isTaskCardOpened;

			this.saveTaskCardOpenedState();
		},
		saveTaskCardOpenedState()
		{
			const WRITE_TO_STORAGE_TIMEOUT = 200;
			clearTimeout(this.saveTaskCardStateTimeout);
			this.saveTaskCardStateTimeout = setTimeout(() => {
				LocalStorageManager.getInstance().set(LocalStorageKey.taskCommentsCardOpened, this.isTaskCardOpened);
			}, WRITE_TO_STORAGE_TIMEOUT);
		},
	},
	template: `
		<BaseChatContent :dialogId="dialogId">
			<template #header>
				<TaskCommentsHeader
					:dialogId="dialogId"
					:isTaskCardOpened="isTaskCardOpened"
					@toggleTaskCard="toggleTaskCard"
				/>
			</template>
			<template #extra-panel>
				<SidebarAnimation :width="TASK_CARD_WIDTH">
					<TaskCommentsCard
						v-if="isTaskCardAvailable && isTaskCardOpened"
						:dialogId="dialogId"
						:taskId="taskId"
					/>
				</SidebarAnimation>
			</template>
		</BaseChatContent>
	`,
};
