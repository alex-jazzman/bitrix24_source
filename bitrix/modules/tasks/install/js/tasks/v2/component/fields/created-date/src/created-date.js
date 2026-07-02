import { TextMd } from 'ui.system.typography.vue';
import { Dom } from 'main.core';
import { BIcon, Outline } from 'ui.icon-set.api.vue';
import 'ui.icon-set.outline';

import { HoverPill } from 'tasks.v2.component.elements.hover-pill';
import { TasksButtonCopy } from 'tasks.v2.component.tasks-button-copy';
import { calendar } from 'tasks.v2.lib.calendar';
import type { TaskModel } from 'tasks.v2.model.tasks';

import { createdDateMeta } from './created-date-meta';
import './created-date.css';

// @vue/component
export const CreatedDate = {
	name: 'TasksCreatedDate',
	components: {
		BIcon,
		TextMd,
		HoverPill,
		TasksButtonCopy,
	},
	inject: {
		task: {},
	},
	setup(): { task: TaskModel }
	{
		return {
			createdDateMeta,
			Outline,
			resizeObserver: null,
		};
	},
	computed: {
		idTaskFormatted(): string
		{
			const idTaskNew = this.task?.id;

			return String((idTaskNew || idTaskNew === 0) ? idTaskNew : '');
		},
		createdDateFormatted(): string
		{
			return calendar.formatDateTime(this.task.createdTs);
		},
	},
	created(): void
	{
		this.resizeObserver = new ResizeObserver((entries: ResizeObserverEntry[]): void => {
			for (const entry: ResizeObserverEntry of entries)
			{
				if (entry.target === this.$el)
				{
					this.updateHeight();
				}
			}
		});
	},
	mounted(): void
	{
		this.updateHeight();
		this.resizeObserver?.observe(this.$el);
	},
	beforeUnmount(): void
	{
		this.resizeObserver?.disconnect();
	},
	methods: {
		updateHeight(): void
		{
			Dom.toggleClass(this.$el, '--wrapped', this.$el.offsetHeight > 30);
		},
	},
	template: `
		<div
			class="tasks-field-created-date"
			:data-task-field-id="createdDateMeta.id"
			:data-task-field-value="task.createdTs"
		>
			<BIcon class="tasks-field-created-date-icon" :name="Outline.CALENDAR_SHARE"/>
			<TextMd class="tasks-field-created-date-text">{{ createdDateFormatted }}</TextMd>
			<TextMd class="tasks-field-created-date-separator print-font-color-base-1">/</TextMd>
			<TasksButtonCopy
				:name="loc('TASKS_V2_CREATED_DATE_TASK_ID')"
				:value="idTaskFormatted"
				:notification="loc('TASKS_V2_CREATED_DATE_COPY_TASK_ID_NOTIF')"
			/>
		</div>
	`,
};
