import { Text, Type } from 'main.core';
import { BaseEvent } from 'main.core.events';
import { checkListService } from 'tasks.v2.provider.service.check-list-service';

import { Chip, ChipDesign } from 'ui.system.chip.vue';
import { Animated, Outline } from 'ui.icon-set.api.vue';
import 'ui.icon-set.animated';
import 'ui.icon-set.outline';

import { EventName, Model } from 'tasks.v2.const';
import { fieldHighlighter } from 'tasks.v2.lib.field-highlighter';
import { fileService, EntityTypes } from 'tasks.v2.provider.service.file-service';
import { taskService } from 'tasks.v2.provider.service.task-service';
import type { TaskModel } from 'tasks.v2.model.tasks';
import type { CheckListModel } from 'tasks.v2.model.check-list';
import { CheckListManager } from './lib/check-list-manager';

import { checkListMeta } from './lib/check-list-meta';

// @vue/component
export const CheckListChip = {
	components: {
		Chip,
	},
	inject: {
		task: {},
		taskId: {},
		isEdit: {},
	},
	props: {
		isAutonomous: {
			type: Boolean,
			default: false,
		},
	},
	emits: ['showCheckList'],
	setup(): { task: TaskModel }
	{
		return {
			checkListMeta,
		};
	},
	computed: {
		checkLists(): CheckListModel[]
		{
			return this.$store.getters[`${Model.CheckList}/getByIds`](this.task.checklist);
		},
		isUploading(): boolean
		{
			return this.task.checklist?.some((itemId) => {
				return fileService.get(
					itemId,
					EntityTypes.CheckListItem,
					{ parentEntityId: this.taskId },
				).isUploading();
			});
		},
		design(): string
		{
			return {
				[!this.isAutonomous && !this.isSelected]: ChipDesign.ShadowNoAccent,
				[!this.isAutonomous && this.isSelected]: ChipDesign.ShadowAccent,
				[this.isAutonomous && !this.isSelected]: ChipDesign.OutlineNoAccent,
				[this.isAutonomous && this.isSelected]: ChipDesign.OutlineAccent,
			}.true;
		},
		isSelected(): boolean
		{
			if (this.isAutonomous)
			{
				return this.checkLists.length > 0;
			}

			return this.wasFilled || this.checkLists.length > 0;
		},
		wasFilled(): boolean
		{
			return this.task.filledFields[checkListMeta.id];
		},
		checkListItemCount(): number
		{
			return this.checkLists.filter((checkList: CheckListModel) => checkList.parentId !== 0).length;
		},
		text(): string
		{
			if (this.isAutonomous && this.checkListItemCount > 0)
			{
				const completedCount = this.getCompletedCount();

				return this.loc(
					'TASKS_V2_CHECK_LIST_COUNT_TITLE',
					{
						'#count#': completedCount,
						'#total#': this.checkListItemCount,
					},
				);
			}

			return this.loc('TASKS_V2_CHECK_LIST_CHIP_TITLE');
		},
		icon(): string
		{
			if (this.isUploading && !this.wasFilled)
			{
				return Animated.LOADER_WAIT;
			}

			return Outline.CHECK_LIST;
		},
	},
	created(): void
	{
		this.checkListManager = new CheckListManager({
			computed: {
				checkLists: () => this.checkLists,
			},
		});
	},
	mounted(): void
	{
		this.$bitrix.eventEmitter.subscribe(EventName.AiAddCheckList, this.handleAiAdd);
		this.$bitrix.eventEmitter.subscribe(EventName.CloseCheckList, this.handleFieldClose);
	},
	beforeUnmount(): void
	{
		this.$bitrix.eventEmitter.unsubscribe(EventName.AiAddCheckList, this.handleAiAdd);
		this.$bitrix.eventEmitter.unsubscribe(EventName.CloseCheckList, this.handleFieldClose);
	},
	methods: {
		handleClick(): void
		{
			if (this.isAutonomous)
			{
				void this.showCheckList();
			}
			else
			{
				// eslint-disable-next-line no-lonely-if
				if (this.isSelected)
				{
					void this.highlightField();
				}
				else
				{
					void this.showCheckList();
				}
			}
		},
		async handleAiAdd(baseEvent: BaseEvent): Promise<void>
		{
			const checkListId = await this.buildAiCheckList(baseEvent.getData());

			await this.highlightField();

			this.checkListManager.scrollToCheckList(this.$root.$el, checkListId, 'smooth');

			if (this.isEdit)
			{
				void checkListService.save(this.taskId, this.checkLists);
			}
		},
		handleFieldClose(): void
		{
			if (this.isAutonomous)
			{
				this.$el.focus();
			}
		},
		async showCheckList(): Promise<void>
		{
			if (!this.isSelected)
			{
				await this.buildEmptyCheckList();
			}

			this.$emit('showCheckList');
		},
		async buildEmptyCheckList(): Promise<void>
		{
			const parentId = Text.getRandom();
			const childId = Text.getRandom();

			await this.$store.dispatch(`${Model.CheckList}/insertMany`, [
				{
					id: parentId,
					nodeId: parentId,
					title: this.loc('TASKS_V2_CHECK_LIST_TITLE_NUMBER', { '#number#': 1 }),
				},
				{
					id: childId,
					nodeId: childId,
					parentId,
				},
			]);

			await taskService.updateStoreTask(this.taskId, {
				checklist: [parentId, childId],
			});
		},
		async buildAiCheckList(baseText: string): Promise<string>
		{
			if (!Type.isString(baseText) || baseText === '')
			{
				return '';
			}

			const titles = baseText
				.split(/\r\n|\r|\n/g)
				.map((line: string) => line.trim())
				.filter((line: string) => line !== '');
			if (titles.length === 0)
			{
				return '';
			}

			const items = [];

			const parentId = Text.getRandom();
			const checkListsNumber = this.getCheckListsNumber();

			const taskChecklist = [...this.task.checklist, parentId];

			items.push({
				id: parentId,
				nodeId: parentId,
				parentId: 0,
				title: this.loc('TASKS_V2_CHECK_LIST_TITLE_NUMBER', { '#number#': checkListsNumber + 1 }),
				sortIndex: checkListsNumber,
			});

			titles.forEach((title: string, index: number) => {
				const childId = Text.getRandom();

				items.push({
					id: childId,
					nodeId: childId,
					parentId,
					title,
					sortIndex: index,
				});

				taskChecklist.push(childId);
			});

			await this.$store.dispatch(`${Model.CheckList}/insertMany`, items);

			await taskService.updateStoreTask(this.taskId, {
				checklist: taskChecklist,
			});

			return parentId;
		},
		highlightField(): Promise<void>
		{
			return fieldHighlighter.setContainer(this.$root.$el).highlight(checkListMeta.id);
		},
		getCheckListsNumber(): number
		{
			return this.checkLists.filter((checklist: CheckListModel) => checklist.parentId === 0).length;
		},
		getCompletedCount(): number
		{
			return this.checkLists.filter((checklist: CheckListModel) => {
				return checklist.isComplete && checklist.parentId !== 0;
			}).length;
		},
	},
	template: `
		<Chip
			:design
			:icon
			:text
			:data-task-id="taskId"
			:data-task-chip-id="checkListMeta.id"
			@click="handleClick"
		/>
	`,
};
