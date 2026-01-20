import { Runtime } from 'main.core';
import { TextXs } from 'ui.system.typography.vue';
import { BLine } from 'ui.system.skeleton.vue';
import { BIcon, Outline } from 'ui.icon-set.api.vue';
import 'ui.icon-set.outline';

import { EntitySelectorEntity, Model } from 'tasks.v2.const';
import { EntitySelectorDialog } from 'tasks.v2.lib.entity-selector-dialog';
import { Color } from 'tasks.v2.lib.color';
import { taskService } from 'tasks.v2.provider.service.task-service';
import { groupService } from 'tasks.v2.provider.service.group-service';
import type { EpicModel } from 'tasks.v2.model.epics';
import type { TaskModel } from 'tasks.v2.model.tasks';

import './epic.css';

// @vue/component
export const Epic = {
	components: {
		TextXs,
		BIcon,
		BLine,
	},
	inject: {
		task: {},
		taskId: {},
	},
	setup(): { task: TaskModel }
	{
		return {
			Outline,
		};
	},
	data(): Object
	{
		return {
			hasScrumInfo: groupService.hasScrumInfo(this.taskId),
		};
	},
	computed: {
		epic(): ?EpicModel
		{
			return this.$store.getters[`${Model.Epics}/getById`](this.task.epicId);
		},
		preselectedEpic(): [string, number][]
		{
			return this.epic ? [['epic-selector', this.epic.id]] : [];
		},
		epicColor(): string
		{
			if (!this.epic)
			{
				return '';
			}

			return new Color(this.epic.color).toRgb();
		},
		backgroundColor(): string
		{
			if (!this.epic)
			{
				return '';
			}

			return new Color(this.epic.color).setOpacity(0.3).limit(250).toRgb();
		},
		isDarkColor(): boolean
		{
			if (!this.epic)
			{
				return false;
			}

			return new Color(this.epic.color).isDark();
		},
	},
	async mounted(): Promise<void>
	{
		await groupService.getScrumInfo(this.taskId);

		this.hasScrumInfo = groupService.hasScrumInfo(this.taskId);
	},
	methods: {
		showDialog(): void
		{
			this.handleEpicSelectedDebounced ??= Runtime.debounce(this.handleEpicSelected, 10, this);

			this.dialog ??= new EntitySelectorDialog({
				multiple: false,
				dropdownMode: true,
				enableSearch: true,
				compactView: true,
				hideOnDeselect: true,
				entities: [
					{
						id: EntitySelectorEntity.Epic,
						options: {
							groupId: this.task.groupId,
						},
						dynamicLoad: true,
						dynamicSearch: true,
					},
				],
				preselectedItems: this.preselectedEpic,
				events: {
					'Item:onSelect': this.handleEpicSelectedDebounced,
					'Item:onDeselect': this.handleEpicSelectedDebounced,
				},
			});

			this.dialog.selectItemsByIds(this.preselectedEpic);
			this.dialog.showTo(this.$el);
		},
		handleEpicSelected(): void
		{
			const item = this.dialog.getSelectedItems()[0];
			if (item)
			{
				void this.$store.dispatch(`${Model.Epics}/insert`, {
					id: item.getId(),
					title: item.getTitle(),
					color: item.getAvatarOption('bgColor'),
				});
			}

			void taskService.update(this.taskId, {
				epicId: item?.getId() ?? 0,
			});
		},
	},
	template: `
		<div
			v-if="hasScrumInfo"
			class="tasks-field-epic"
			:class="{ '--dark': isDarkColor, '--filled': epic }"
			:style="{
				'--epic-color': epicColor,
				'--epic-background': backgroundColor,
			}"
			:title="epic?.title"
			@click="showDialog"
		>
			<TextXs className="tasks-field-epic-title">
				{{ epic?.title || loc('TASKS_V2_GROUP_CHOOSE_EPIC') }}
			</TextXs>
			<BIcon :name="Outline.CHEVRON_DOWN_S"/>
		</div>
		<div v-else class="tasks-field-epic-loader">
			<BLine :width="80" :height="10"/>
		</div>
	`,
};
