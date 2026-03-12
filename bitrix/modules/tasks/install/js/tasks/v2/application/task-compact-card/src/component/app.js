import { Event, Type } from 'main.core';
import { EventEmitter, BaseEvent } from 'main.core.events';
import type { Popup } from 'main.popup';

import { computed } from 'ui.vue3';
import { mapActions, mapGetters } from 'ui.vue3.vuex';
import { Notifier } from 'ui.notification-manager';
import { DragOverMixin } from 'ui.uploader.tile-widget';
import { Button as UiButton, AirButtonStyle, ButtonSize } from 'ui.vue3.components.button';
import { BIcon, Outline } from 'ui.icon-set.api.vue';
import 'ui.icon-set.outline';

import { Core } from 'tasks.v2.core';
import { EventName, Model, CardType, GroupType, Analytics } from 'tasks.v2.const';
import { AddTaskButton } from 'tasks.v2.component.add-task-button';
import { Title as FieldTitle } from 'tasks.v2.component.fields.title';
import { Importance } from 'tasks.v2.component.fields.importance';
import { DescriptionInline } from 'tasks.v2.component.fields.description';
import { FieldList } from 'tasks.v2.component.elements.field-list';
import { DropZone } from 'tasks.v2.component.drop-zone';
import { Responsible, responsibleMeta } from 'tasks.v2.component.fields.responsible';
import { Deadline, deadlineMeta } from 'tasks.v2.component.fields.deadline';
import { CheckListChip, CheckList } from 'tasks.v2.component.fields.check-list';
import { FilesChip } from 'tasks.v2.component.fields.files';
import { GroupChip } from 'tasks.v2.component.fields.group';

import { idUtils } from 'tasks.v2.lib.id-utils';
import { analytics } from 'tasks.v2.lib.analytics';
import { fileService, EntityTypes } from 'tasks.v2.provider.service.file-service';
import { taskService } from 'tasks.v2.provider.service.task-service';
import type { TaskModel } from 'tasks.v2.model.tasks';
import type { GroupModel } from 'tasks.v2.model.groups';
import type { CheckListModel } from 'tasks.v2.model.check-list';
import type { AppField, AppChip } from 'tasks.v2.application.task-card';

import { FullCardButton } from './full-card-button/full-card-button';
import './app.css';

// @vue/component
export const App = {
	name: 'TaskCompactCard',
	components: {
		BIcon,
		FieldTitle,
		DescriptionInline,
		Importance,
		FieldList,
		UiButton,
		AddTaskButton,
		CheckList,
		FullCardButton,
		DropZone,
	},
	mixins: [DragOverMixin],
	provide(): Object
	{
		return {
			settings: Core.getParams(),
			analytics: this.analytics,
			cardType: CardType.Compact,
			/** @type { TaskModel } */
			task: computed((): TaskModel => taskService.getStoreTask(this.taskId)),
			/** @type { number | string } */
			taskId: computed((): number | string => this.taskId),
			/** @type { boolean } */
			isEdit: computed((): boolean => false),
			/** @type { boolean } */
			isTemplate: computed((): boolean => idUtils.isTemplate(this.taskId)),
		};
	},
	props: {
		id: {
			type: [Number, String],
			required: true,
		},
		initialTask: {
			/**
			 * @type TaskModel
			 */
			type: Object,
			required: true,
		},
		analytics: {
			type: Object,
			default: () => ({}),
		},
	},
	setup(): Object
	{
		return {
			ButtonSize,
			AirButtonStyle,
			Outline,
			EntityTypes,
		};
	},
	data(): Object
	{
		return {
			taskId: this.id,
			openingFullCard: false,
			isCheckListPopupShown: false,
			creationError: false,
			popupCount: 0,
		};
	},
	computed: {
		...mapGetters({
			titleFieldOffsetHeight: `${Model.Interface}/titleFieldOffsetHeight`,
			currentUserId: `${Model.Interface}/currentUserId`,
			defaultDeadlineTs: `${Model.Interface}/defaultDeadlineTs`,
			stateFlags: `${Model.Interface}/stateFlags`,
		}),
		task(): TaskModel
		{
			return taskService.getStoreTask(this.taskId);
		},
		isTemplate(): boolean
		{
			return idUtils.isTemplate(this.taskId);
		},
		group(): GroupModel
		{
			return this.$store.getters[`${Model.Groups}/getById`](this.task.groupId);
		},
		checklist(): CheckListModel[]
		{
			if (!this.task.checklist)
			{
				return [];
			}

			return this.$store.getters[`${Model.CheckList}/getByIds`](this.task.checklist);
		},
		fields(): AppField[]
		{
			return [
				{
					title: responsibleMeta.getTitle(false),
					component: Responsible,
					props: {
						taskId: this.taskId,
						isSingle: true,
					},
				},
				{
					title: deadlineMeta.title,
					component: Deadline,
					props: {
						taskId: this.taskId,
						isTemplate: this.isTemplate,
						isAutonomous: true,
						isHovered: false,
					},
				},
				Core.getParams().features.disk && {
					chip: {
						component: FilesChip,
						props: {
							taskId: this.taskId,
						},
					},
				},
				{
					chip: {
						component: CheckListChip,
						events: {
							showCheckList: this.showCheckListPopup,
						},
					},
				},
				Core.getParams().features.isProjectsEnabled && {
					chip: {
						component: GroupChip,
					},
				},
			].filter((field) => field);
		},
		primaryFields(): AppField[]
		{
			return this.getFields(new WeakMap([
				[Responsible, true],
				[Deadline, true],
			]));
		},
		chips(): AppChip[]
		{
			return this.fields.filter(({ chip }) => chip).map(({ chip }) => chip);
		},
		isDiskModuleInstalled(): boolean
		{
			return Core.getParams().features.disk;
		},
	},
	created(): void
	{
		this.insert({
			...this.initialTask,
			id: this.taskId,
			creatorId: this.currentUserId,
			responsibleIds: [this.currentUserId],
			deadlineTs: this.initialTask.deadlineTs ?? this.defaultDeadlineTs,
			needsControl: this.stateFlags.needsControl ?? null,
			matchesWorkTime: this.stateFlags.matchesWorkTime ?? null,
			allowsTimeTracking: this.stateFlags.allowsTimeTracking ?? null,
			requireResult: this.stateFlags.defaultRequireResult ?? false,
		});

		void fileService.get(this.taskId).list(this.task.fileIds);

		analytics.sendClickCreate(this.analytics, {
			collabId: this.group?.type === GroupType.Collab ? this.group.id : null,
			cardType: CardType.Compact,
			viewersCount: this.initialTask?.auditorsIds?.length ?? 0,
			coexecutorsCount: this.initialTask?.accomplicesIds?.length ?? 0,
		});
	},
	mounted(): void
	{
		this.resizeObserver = new ResizeObserver(async (entries) => {
			const title = entries.find(({ target }) => target === this.$refs.title);
			if (title)
			{
				await this.updateTitleFieldOffsetHeight(title.contentRect.height);
			}
		});

		this.resizeObserver.observe(this.$refs.title);
		this.subscribeEvents();
	},
	beforeUnmount(): void
	{
		this.resizeObserver?.disconnect();
		this.unsubscribeEvents();
	},
	unmounted(): void
	{
		if (this.openingFullCard === false)
		{
			this.destroy();
		}
	},
	methods: {
		...mapActions(Model.Tasks, [
			'insert',
			'delete',
		]),
		...mapActions(Model.Interface, [
			'updateTitleFieldOffsetHeight',
		]),
		getFields(map: WeakMap): boolean
		{
			return this.fields.filter(({ component }) => map.get(component));
		},
		close(): void
		{
			EventEmitter.emit(`${EventName.CloseCard}:${this.id}`);
		},
		async addTask(): void
		{
			const checklists = this.checklist;

			const [id, error] = await taskService.add(this.task);

			if (!id)
			{
				this.creationError = true;

				Notifier.notifyViaBrowserProvider({
					id: 'task-notify-add-error',
					text: error.message,
				});

				this.sendAddTaskAnalytics(false, checklists);

				return;
			}

			this.taskId = id;

			this.sendAddTaskAnalytics(true, checklists);

			analytics.sendDescription(this.analytics, {
				hasDescription: Type.isStringFilled(this.task?.description),
				hasScroll: this.$refs?.description?.hasScroll(),
				cardType: CardType.Compact,
			});

			fileService.replace(this.id, id);

			EventEmitter.emit(EventName.LegacyTasksTaskEvent, new BaseEvent({
				data: id,
				compatData: [
					'ADD',
					{
						task: { ID: id },
						taskUgly: { id },
						options: {},
					},
				],
			}));

			this.close();
		},
		sendAddTaskAnalytics(isSuccess: boolean, checklists: CheckListModel[]): void
		{
			const collabId = this.group?.type === GroupType.Collab ? this.group.id : null;
			const viewersCount = this.task.auditorsIds.length;
			const coexecutorsCount = this.task.accomplicesIds.length;

			if (this.task.templateId)
			{
				analytics.sendAddTask(this.analytics, {
					isSuccess,
					collabId,
					viewersCount,
					coexecutorsCount,
					event: Analytics.Event.PatternTaskCreate,
					cardType: CardType.Compact,
					taskId: this.taskId,
				});
			}
			else if (this.task.parentId)
			{
				analytics.sendAddTask(this.analytics, {
					isSuccess,
					collabId,
					viewersCount,
					coexecutorsCount,
					event: Analytics.Event.SubTaskAdd,
					cardType: CardType.Compact,
					taskId: this.taskId,
				});
			}
			else if (checklists.length > 0)
			{
				const checklistCount = checklists.filter(({ parentId }) => parentId === 0).length;
				const checklistItemsCount = checklists.filter(({ parentId }) => parentId !== 0).length;
				analytics.sendAddTaskWithCheckList(this.analytics, {
					isSuccess,
					collabId,
					viewersCount: this.task.auditorsIds.length,
					checklistCount,
					checklistItemsCount,
					cardType: CardType.Compact,
					taskId: this.taskId,
				});
			}
			else
			{
				analytics.sendAddTask(this.analytics, {
					isSuccess,
					collabId,
					viewersCount,
					coexecutorsCount,
					event: Analytics.Event.TaskCreate,
					cardType: CardType.Compact,
					taskId: this.taskId,
				});
			}
		},
		handleShowingPopup(event: BaseEvent): void
		{
			EventEmitter.emit(`${EventName.ShowOverlay}:${this.taskId}`);
			EventEmitter.emit(`${EventName.AdjustPosition}:${this.taskId}`);
			this.externalPopup = event.popupInstance;
			this.adjustCardPopup(true);
		},
		handleHidingPopup(): void
		{
			EventEmitter.emit(`${EventName.HideOverlay}:${this.taskId}`);
			EventEmitter.emit(`${EventName.AdjustPosition}:${this.taskId}`);
			this.externalPopup = null;
		},
		handleResizingPopup(): void
		{
			this.adjustCardPopup();
		},
		adjustCardPopup(animate: boolean = false): void
		{
			if (!this.externalPopup)
			{
				EventEmitter.emit(`${EventName.AdjustPosition}:${this.taskId}`);

				return;
			}

			EventEmitter.emit(`${EventName.AdjustPosition}:${this.taskId}`, {
				titleFieldHeight: this.titleFieldOffsetHeight,
				innerPopup: this.externalPopup,
				animate,
			});
		},
		showCheckListPopup(): void
		{
			this.isCheckListPopupShown = true;
		},
		closeCheckListPopup(): void
		{
			this.isCheckListPopupShown = false;
		},
		subscribeEvents(): void
		{
			EventEmitter.subscribe('BX.Main.Popup:onShow', this.handlePopupShow);
			Event.bind(document, 'keydown', this.handleKeyDown, { capture: true });
		},
		unsubscribeEvents(): void
		{
			EventEmitter.unsubscribe('BX.Main.Popup:onShow', this.handlePopupShow);
			Event.unbind(document, 'keydown', this.handleKeyDown, { capture: true });
		},
		handlePopupShow(event): void
		{
			const popup: Popup = event.getCompatData()[0];

			const onClose = (): void => {
				popup.unsubscribe('onClose', onClose);
				popup.unsubscribe('onDestroy', onClose);

				this.popupCount--;
			};

			popup.subscribe('onClose', onClose);
			popup.subscribe('onDestroy', onClose);

			this.popupCount++;
		},
		handleKeyDown(event: KeyboardEvent): void
		{
			if (this.popupCount > 0)
			{
				return;
			}

			if (event.key === 'Enter' && (event.ctrlKey || event.metaKey))
			{
				this.$refs.addTaskButton.handleClick();
			}
		},
		destroy(): void
		{
			this.delete(this.id);
			fileService.delete(this.id);
		},
	},
	template: `
		<div v-drop class="tasks-compact-card-container" ref="main">
			<div v-if="task" class="tasks-compact-card" :data-task-id="taskId" data-task-compact>
				<div class="tasks-compact-card-fields">
					<div
						class="tasks-compact-card-fields-title"
						:class="{'--no-gap': task.description.length > 0}"
						ref="title"
					>
						<FieldTitle :disabled="isCheckListPopupShown"/>
						<Importance/>
						<BIcon
							class="tasks-compact-card-fields-close"
							:name="Outline.CROSS_L"
							data-task-button-id="close"
							@click="close"
						/>
					</div>
					<DescriptionInline ref="description"/>
					<div class="tasks-compact-card-fields-list">
						<FieldList :fields="primaryFields"/>
					</div>
					<CheckList
						v-if="isCheckListPopupShown"
						isAutonomous
						@show="handleShowingPopup"
						@close="handleHidingPopup(); closeCheckListPopup();"
						@resize="handleResizingPopup"
					/>
				</div>
				<div class="tasks-compact-card-footer">
					<div class="tasks-compact-card-chips">
						<template v-for="(chip, key) of chips" :key>
							<component
								:is="chip.component"
								v-bind="{ isAutonomous: true, ...chip.props }"
								v-on="chip.events ?? {}"
							/>
						</template>
					</div>
					<div class="tasks-compact-card-buttons">
						<div class="tasks-compact-card-main-buttons">
							<AddTaskButton
								ref="addTaskButton"
								:size="ButtonSize.LARGE"
								v-model:hasError="creationError"
								@addTask="addTask"
							/>
							<UiButton
								:text="loc('TASKS_V2_TCC_CANCEL_BTN')"
								:size="ButtonSize.LARGE"
								:style="AirButtonStyle.PLAIN"
								:dataset="{
									taskButtonId: 'cancel',
								}"
								@click="close"
							/>
						</div>
						<FullCardButton v-model:isOpening="openingFullCard"/>
					</div>
				</div>
			</div>
			<DropZone
				v-if="isDiskModuleInstalled && !isCheckListPopupShown"
				:container="$refs.main || {}"
				:entityId="taskId"
				:entityType="EntityTypes.Task"
				:bottom="18"
			/>
		</div>
	`,
};
