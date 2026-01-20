import { Model } from 'tasks.v2.const';
import { HoverPill } from 'tasks.v2.component.elements.hover-pill';
import { GanttMenu } from 'tasks.v2.application.gantt-popup';
import { ganttService } from 'tasks.v2.provider.service.relation-service';
import type { GanttLinkModel } from 'tasks.v2.model.gantt-links';

// @vue/component
export const Gantt = {
	components: {
		HoverPill,
		GanttMenu,
	},
	inject: {
		parentTaskId: 'taskId',
	},
	props: {
		taskId: {
			type: [Number, String],
			required: true,
		},
	},
	data(): Object
	{
		return {
			isMenuShown: false,
		};
	},
	computed: {
		ganttLink(): GanttLinkModel
		{
			return this.$store.getters[`${Model.GanttLinks}/getLink`]({
				taskId: this.parentTaskId,
				dependentId: this.taskId,
			});
		},
		type: {
			get(): string
			{
				return this.ganttLink?.type;
			},
			set(type: string): void
			{
				void ganttService.updateDependence({
					taskId: this.parentTaskId,
					dependentId: this.taskId,
					type,
				});
			},
		},
		typeTitle(): string
		{
			return this.loc({
				finish_start: 'TASKS_V2_GANTT_FINISH_START',
				start_start: 'TASKS_V2_GANTT_START_START',
				start_finish: 'TASKS_V2_GANTT_START_FINISH',
				finish_finish: 'TASKS_V2_GANTT_FINISH_FINISH',
			}[this.type]);
		},
	},
	template: `
		<HoverPill textOnly noOffset ref="type" @click="isMenuShown = true">
			{{ typeTitle }}
		</HoverPill>
		<GanttMenu v-if="isMenuShown" v-model:type="type" :bindElement="$refs.type.$el" @close="isMenuShown = false"/>
	`,
};
