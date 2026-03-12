import { TextXs } from 'ui.system.typography.vue';
import { BLine } from 'ui.system.skeleton.vue';
import { BIcon, Outline } from 'ui.icon-set.api.vue';
import 'ui.icon-set.outline';

import { Model } from 'tasks.v2.const';
import { Color } from 'tasks.v2.lib.color';
import { groupService } from 'tasks.v2.provider.service.group-service';
import type { EpicModel } from 'tasks.v2.model.epics';
import type { TaskModel } from 'tasks.v2.model.tasks';

import { epicDialog } from './epic-dialog';
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
			epicDialog.show({
				targetNode: this.$el,
				taskId: this.taskId,
			});
		},
	},
	template: `
		<div
			v-if="hasScrumInfo"
			class="tasks-field-epic print-background-white"
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
			<BIcon :name="Outline.CHEVRON_DOWN_S" class="print-ignore"/>
		</div>
		<div v-else class="tasks-field-epic-loader">
			<BLine :width="80" :height="10"/>
		</div>
	`,
};
