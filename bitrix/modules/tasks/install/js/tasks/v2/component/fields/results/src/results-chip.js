import { Text, Event, Type } from 'main.core';

import { mapGetters } from 'ui.vue3.vuex';
import { BMenu, type MenuOptions, type MenuItemOptions } from 'ui.vue3.components.menu';
import { Chip, ChipDesign } from 'ui.system.chip.vue';
import { Outline } from 'ui.icon-set.api.vue';
import 'ui.icon-set.outline';

import { Core } from 'tasks.v2.core';
import { Model, EventName } from 'tasks.v2.const';
import { showLimit } from 'tasks.v2.lib.show-limit';
import { fieldHighlighter } from 'tasks.v2.lib.field-highlighter';
import { resultService } from 'tasks.v2.provider.service.result-service';
import { taskService } from 'tasks.v2.provider.service.task-service';
import { stateService } from 'tasks.v2.provider.service.state-service';
import { UserMappers, type UserDto } from 'tasks.v2.provider.service.user-service';
import type { UserModel } from 'tasks.v2.model.users';
import type { TaskModel } from 'tasks.v2.model.tasks';

import { resultsMeta } from './results-meta';
import { ResultEditorSheet } from './components/result-editor-sheet/result-editor-sheet';

// @vue/component
export const ResultsChip = {
	components: {
		Chip,
		BMenu,
		ResultEditorSheet,
	},
	inject: {
		task: {},
		taskId: {},
		isEdit: {},
	},
	props: {
		isSheetShown: {
			type: Boolean,
			default: false,
		},
		sheetBindProps: {
			type: Object,
			required: true,
		},
	},
	emits: ['update:isSheetShown'],
	setup(): { task: TaskModel }
	{
		return {
			Outline,
			resultsMeta,
		};
	},
	data(): Object
	{
		return {
			isMenuShown: false,
			sheetResultId: 0,
		};
	},
	computed: {
		...mapGetters({
			currentUserId: `${Model.Interface}/currentUserId`,
			stateFlags: `${Model.Interface}/stateFlags`,
		}),
		design(): string
		{
			return this.isSelected ? ChipDesign.ShadowAccent : ChipDesign.ShadowNoAccent;
		},
		isSelected(): boolean
		{
			return !this.isLocked && (this.task.filledFields[resultsMeta.id] || this.task.requireResult);
		},
		menuOptions(): MenuOptions
		{
			return {
				id: `result-chip-menu-${Text.getRandom()}`,
				bindOptions: {
					forceBindPosition: true,
					forceTop: true,
					position: 'top',
				},
				bindElement: this.$refs.chip.$el,
				targetContainer: document.body,
				minWidth: 240,
				items: this.menuItems,
				autoHide: true,
				closeByEsc: true,
			};
		},
		menuItems(): MenuItemOptions[]
		{
			return [
				{
					title: this.loc('TASKS_V2_RESULT_ADD'),
					icon: Outline.PLUS_L,
					onClick: this.openAddResultSheet,
					dataset: {
						id: `MenuResultAdd-${this.taskId}`,
					},
				},
				{
					title: this.loc('TASKS_V2_RESULT_REQUIRE'),
					icon: Outline.WINDOW_FLAG,
					onClick: this.requireResult,
					dataset: {
						id: `MenuResultRequire-${this.taskId}`,
					},
				},
			];
		},
		isLocked(): boolean
		{
			return !Core.getParams().restrictions.requiredResult.available;
		},
	},
	mounted(): void
	{
		Event.EventEmitter.subscribe(EventName.AddResultFromChat, this.handleAddResultFromChat);
		Event.EventEmitter.subscribe(EventName.DeleteResultFromChat, this.handleDeleteResultFromChat);
	},
	beforeUnmount(): void
	{
		Event.EventEmitter.unsubscribe(EventName.AddResultFromChat, this.handleAddResultFromChat);
		Event.EventEmitter.unsubscribe(EventName.DeleteResultFromChat, this.handleDeleteResultFromChat);
	},
	methods: {
		handleClick(): void
		{
			if (this.isLocked)
			{
				void showLimit({
					featureId: Core.getParams().restrictions.requiredResult.featureId,
				});

				return;
			}

			if (this.isSelected)
			{
				this.highlightField();

				return;
			}

			if (!this.isEdit)
			{
				this.requireResult();

				return;
			}

			if (this.task.rights.edit)
			{
				this.isMenuShown = true;
			}
			else
			{
				this.openAddResultSheet();
			}
		},
		async handleAddResultFromChat(event): void
		{
			const { taskId, messageId, text, authorId } = event.data;

			if (taskId !== this.taskId)
			{
				return;
			}

			const payload = {
				text: Type.isStringFilled(text) ? text : this.loc('TASKS_V2_RESULT_DEFAULT_TITLE_FROM_MESSAGE'),
				author: this.getUserDto(authorId),
				id: Text.getRandom(),
				taskId: this.taskId,
				createdAtTs: Date.now() / 1000,
				updatedAtTs: Date.now() / 1000,
				rights: {
					edit: true,
					remove: true,
				},
			};

			await resultService.addResultFromMessage(taskId, messageId, payload);

			Event.EventEmitter.emit(EventName.ResultFromMessageAdded, { taskId });
		},
		handleDeleteResultFromChat(event): void
		{
			const { taskId, resultId } = event.data;

			if (taskId !== this.taskId)
			{
				return;
			}

			void resultService.delete(resultId);
		},
		openAddResultSheet(): void
		{
			const id = Text.getRandom();

			const payload = {
				id,
				taskId: this.taskId,
				author: this.getUser(this.currentUserId),
			};

			void this.$store.dispatch(`${Model.Results}/insert`, payload);

			this.sheetResultId = id;
			this.setSheetShown(true);
		},
		async requireResult(): void
		{
			void taskService.update(this.taskId, { requireResult: true });

			if (!this.isEdit)
			{
				await this.$store.dispatch(`${Model.Interface}/updateStateFlags`, { defaultRequireResult: true });

				void stateService.set(this.stateFlags);
			}
		},
		highlightField(): void
		{
			void fieldHighlighter.setContainer(this.$root.$el).highlight(resultsMeta.id);
		},
		getUser(userId): UserModel | null
		{
			return this.$store.getters[`${Model.Users}/getById`](userId);
		},
		getUserDto(userId): UserDto | null
		{
			return UserMappers.mapModelToDto(this.getUser(userId));
		},
		setSheetShown(isShown: boolean): void
		{
			this.$emit('update:isSheetShown', isShown);
		},
	},
	template: `
		<Chip
			:design
			:text="resultsMeta.title"
			:icon="Outline.WINDOW_FLAG"
			:data-task-id="taskId"
			:data-task-chip-id="resultsMeta.id"
			:lock="isLocked"
			ref="chip"
			@click="handleClick"
		/>
		<BMenu v-if="isMenuShown" :options="menuOptions" @close="isMenuShown = false"/>
		<ResultEditorSheet
			v-if="isSheetShown"
			:resultId="sheetResultId"
			:sheetBindProps
			@close="setSheetShown(false)"
		/>
	`,
};
