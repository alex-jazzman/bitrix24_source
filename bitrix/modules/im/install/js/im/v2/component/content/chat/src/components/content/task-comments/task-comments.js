import { type JsonObject } from 'main.core';
import { EventEmitter, type BaseEvent } from 'main.core.events';
import { SidePanel } from 'main.sidepanel';

import { resultMessageMenu } from 'tasks.v2.lib.result-message-menu';

import { BaseChatContent } from 'im.v2.component.content.elements';
import { SidebarAnimation } from 'im.v2.component.animation';
import { ChatTextarea } from 'im.v2.component.textarea';
import { LocalStorageKey, EventType } from 'im.v2.const';
import { LocalStorageManager } from 'im.v2.lib.local-storage';
import { Analytics } from 'im.v2.lib.analytics';
import { type ImModelChat } from 'im.v2.model';
import { Feature, FeatureManager } from 'im.v2.lib.feature';
import { TaskResultButtonController } from 'im.v2.lib.task-result-button';

import { AddToTaskPopupManager } from './classes/add-to-task-popup-manager';
import { TaskCommentsCard } from './components/card';
import { TaskCommentsHeader } from './components/header';
import { AddToTaskPopup } from './components/add-to-task-popup/add-to-task-popup';

const TASK_CARD_WIDTH = 567;
const MIN_CONTENT_WIDTH_FOR_TASK_CARD = 966;

// @vue/component
export const TaskCommentsContent = {
	name: 'TaskCommentsContent',
	components: {
		BaseChatContent,
		TaskCommentsCard,
		TaskCommentsHeader,
		SidebarAnimation,
		ChatTextarea,
		AddToTaskPopup,
	},
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
			addToTaskUserId: null,
			textareaInputElement: null,
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
	watch: {
		dialogId()
		{
			this.destroyTaskResultMenu();
			void this.initTaskResultMenu();
			this.addToTaskPopupManager.setDialogId(this.dialogId);

			this.destroyResultButton();
			this.initResultButton();
		},
	},
	created()
	{
		this.resultMenuRegistration = null;

		this.addToTaskPopupManager = new AddToTaskPopupManager({
			dialogId: this.dialogId,
			emitter: this.getEmitter(),
			onCandidateChange: (userId: ?string) => {
				this.addToTaskUserId = userId;
			},
		});
	},
	mounted()
	{
		EventEmitter.subscribe(EventType.task.openCardFromMessage, this.openCardFromMessage);
		this.restoreTaskCardOpenedState();
		this.withEmbeddedTaskCard = this.canOpenEmbeddedTaskCard();
		void this.initTaskResultMenu();
		this.initResultButton();
	},
	beforeUnmount()
	{
		this.destroyTaskResultMenu();
		this.destroyResultButton();
		EventEmitter.unsubscribe(EventType.task.openCardFromMessage, this.openCardFromMessage);
		this.addToTaskPopupManager.destroy();
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
		async initTaskResultMenu(): Promise<void>
		{
			if (!this.taskId || !this.dialog.chatId)
			{
				return;
			}

			this.resultMenuRegistration = await resultMessageMenu.register({
				taskId: this.taskId,
				chatId: this.dialog.chatId,
			});
		},
		destroyResultButton()
		{
			this.taskResultButtonController?.destroy();
			this.taskResultButtonController = null;
		},
		destroyTaskResultMenu(): void
		{
			this.resultMenuRegistration?.teardown();
			this.resultMenuRegistration = null;
		},
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
			Analytics.getInstance().taskComments.onOpenSideCard(this.taskId);

			if (this.shouldOpenInSlider())
			{
				this.openTaskCardSlider();

				return;
			}

			this.toggleTaskCard();
		},
		handleTaskCardToggle()
		{
			const taskCommentsAnalytics = Analytics.getInstance().taskComments;

			if (this.isTaskCardOpened)
			{
				taskCommentsAnalytics.onCloseSideCard(this.taskId);
			}
			else
			{
				taskCommentsAnalytics.onOpenSideCard(this.taskId);
				taskCommentsAnalytics.onOpenCard(this.dialogId);
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
			Analytics.getInstance().taskComments.onCloseSideCard(this.taskId);
			this.toggleTaskCard();
		},
		getEmitter(): EventEmitter
		{
			return this.$Bitrix.eventEmitter;
		},
		captureTextareaElement()
		{
			this.textareaInputElement = this.$refs.chatTextarea?.getInputElement() ?? null;
		},
		onTextareaTextChange(text: string)
		{
			this.addToTaskPopupManager.handleTextChange({
				text,
				isAddingUser: this.$refs['add-to-task-popup']?.isLoading ?? false,
			});
		},
		closeAddToTaskPopup()
		{
			this.addToTaskPopupManager.reset();
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
			<template #textarea>
				<ChatTextarea
					:dialogId="dialogId"
					:withKeyboardNavigation="true"
					:key="dialogId"
					ref="chatTextarea"
					@mounted="() => { captureTextareaElement(); }"
					@textChange="onTextareaTextChange"
				>
					<template #bottom-panel-buttons>
						<div ref="result-button-container"></div>
					</template>
				</ChatTextarea>
				<AddToTaskPopup
					v-if="addToTaskUserId && textareaInputElement"
					ref="add-to-task-popup"
					:bindElement="textareaInputElement"
					:userId="addToTaskUserId"
					:dialogId="dialogId"
					:chatId="dialog.chatId"
					@close="closeAddToTaskPopup"
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
