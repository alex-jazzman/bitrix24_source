import { Dom } from 'main.core';
import { Notifier } from 'ui.notification-manager';
import { TextMd } from 'ui.system.typography.vue';
import { BIcon, Outline } from 'ui.icon-set.api.vue';
import 'ui.icon-set.outline';

import { HoverPill } from 'tasks.v2.component.elements.hover-pill';
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
		createdDateFormatted(): string
		{
			return calendar.formatDateTime(this.task.createdTs);
		},
		idFormatted(): string
		{
			return this.loc('TASKS_V2_CREATED_DATE_TASK_ID', {
				'#TASK_ID#': this.task.id,
			});
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
		copyTaskId(): void
		{
			const isCopyingSuccess = BX.clipboard.copy(this.task.id);
			if (isCopyingSuccess)
			{
				Notifier.notifyViaBrowserProvider({
					id: 'task-notify-copy',
					text: this.loc('TASKS_V2_CREATED_DATE_COPY_TASK_ID_NOTIF'),
				});
			}
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
			<div class="tasks-field-created-date-separator print-font-color-base-1"> / </div>
			<div class="tasks-field-created-date-id-container" @click="copyTaskId">
				<TextMd class="tasks-field-created-date-id-text print-font-color-base-1">{{ idFormatted }}</TextMd>
				<BIcon class="tasks-field-created-date-copy-id-icon print-ignore" :name="Outline.COPY"/>
			</div>
		</div>
	`,
};
