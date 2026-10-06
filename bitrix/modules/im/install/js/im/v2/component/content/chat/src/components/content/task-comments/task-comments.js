import { type JsonObject } from 'main.core';
import { EventEmitter, type BaseEvent } from 'main.core.events';
import { SidePanel } from 'main.sidepanel';

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
const MIN_CONTENT_WIDTH_FOR_TASK_CARD = 966;

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
			isTaskCardOpened: false,
			withEmbeddedTaskCard: false,
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
		this.restoreTaskCardOpenedState();
		this.withEmbeddedTaskCard = this.canOpenEmbeddedTaskCard();
	},
	beforeUnmount()
	{
		EventEmitter.unsubscribe(EventType.task.openCardFromMessage, this.openCardFromMessage);
	},
	methods: {
		canOpenEmbeddedTaskCard(): boolean
		{
			return this.$refs.content.getContainer().clientWidth >= MIN_CONTENT_WIDTH_FOR_TASK_CARD;
		},
		shouldOpenInSlider(): boolean
		{
			return !this.isTaskCardOpened && !this.canOpenEmbeddedTaskCard();
		},
		openCardFromMessage(event: BaseEvent)
		{
			const { taskId } = event.getData();

			if (taskId !== this.taskId || this.isTaskCardOpened)
			{
				return;
			}

			event.preventDefault();

			Analytics.getInstance().taskComments.onOpenCardFromMessage(this.dialogId);

			if (this.shouldOpenInSlider())
			{
				this.openTaskCardSlider();

				return;
			}

			this.toggleTaskCard();
		},
		handleTaskCardToggle()
		{
			if (!this.isTaskCardOpened)
			{
				Analytics.getInstance().taskComments.onOpenCard(this.dialogId);
			}

			if (this.shouldOpenInSlider())
			{
				this.openTaskCardSlider();

				return;
			}

			this.toggleTaskCard();
		},
		restoreTaskCardOpenedState()
		{
			const taskCardOpened = LocalStorageManager.getInstance().get(LocalStorageKey.taskCommentsCardOpened, false);

			this.isTaskCardOpened = taskCardOpened && this.canOpenEmbeddedTaskCard();
		},
		openTaskCardSlider()
		{
			const entityUrl = this.dialog.entityLink.url;
			SidePanel.Instance.open(entityUrl);
		},
		toggleTaskCard()
		{
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
		onTaskCardClose()
		{
			this.toggleTaskCard();
		},
	},
	template: `
		<BaseChatContent :dialogId="dialogId" ref="content">
			<template #header>
				<TaskCommentsHeader
					:dialogId="dialogId"
					:isTaskCardOpened="isTaskCardOpened"
					:withEmbeddedTaskCard="withEmbeddedTaskCard"
					@toggleTaskCard="handleTaskCardToggle"
				/>
			</template>
			<template #extra-panel>
				<SidebarAnimation :width="TASK_CARD_WIDTH">
					<TaskCommentsCard
						v-if="isTaskCardAvailable && isTaskCardOpened"
						:dialogId="dialogId"
						:taskId="taskId"
						@close="onTaskCardClose"
					/>
				</SidebarAnimation>
			</template>
		</BaseChatContent>
	`,
};
