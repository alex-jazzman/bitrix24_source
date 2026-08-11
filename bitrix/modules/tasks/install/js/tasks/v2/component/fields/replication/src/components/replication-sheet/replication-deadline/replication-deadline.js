import { Loc, Type } from 'main.core';
import { TextMd } from 'ui.system.typography.vue';

import { HoverPill } from 'tasks.v2.component.elements.hover-pill';
import { DeadlineAfterPopup } from 'tasks.v2.component.fields.deadline';
import { calendar } from 'tasks.v2.lib.calendar';

// @vue/component
export const ReplicationDeadline = {
	name: 'ReplicationDeadline',
	components: {
		TextMd,
		DeadlineAfterPopup,
		HoverPill,
	},
	inject: {
		replicateParams: {},
		taskId: {},
		task: {},
	},
	emits: ['update'],
	data(): Object
	{
		return {
			isDeadlinePopupShown: false,
		};
	},
	computed: {
		deadlineLabel(): string
		{
			let deadlineAfter = this.replicateParams.deadlineOffset || null;

			if (!deadlineAfter)
			{
				return this.loc('TASKS_V2_REPLICATION_DEADLINE_NOT_SET');
			}

			deadlineAfter *= 1000;

			if (this.isMinutes(deadlineAfter))
			{
				const minutes = deadlineAfter / (60 * 1000);

				return Loc.getMessagePlural(
					'TASKS_V2_REPLICATION_DEADLINE_IN_MINUTES',
					minutes,
					{ '#TASK_DEADLINE#': minutes },
				);
			}

			if (this.isHours(deadlineAfter))
			{
				const hours = deadlineAfter / (60 * 60 * 1000);

				return Loc.getMessagePlural(
					'TASKS_V2_REPLICATION_DEADLINE_IN_HOURS',
					hours,
					{ '#TASK_DEADLINE#': hours },
				);
			}

			if (this.isWeeks(deadlineAfter))
			{
				const weeks = deadlineAfter / (7 * 24 * 60 * 60 * 1000);

				return Loc.getMessagePlural(
					'TASKS_V2_REPLICATION_DEADLINE_IN_WEEKS',
					weeks,
					{ '#TASK_DEADLINE#': weeks },
				);
			}

			const days = deadlineAfter / this.dayDuration;

			return Loc.getMessagePlural(
				'TASKS_V2_REPLICATION_DEADLINE_IN_DAYS',
				days,
				{ '#TASK_DEADLINE#': days },
			);
		},
		dayDuration(): number
		{
			return this.task?.matchesWorkTime ? calendar.workdayDuration : (24 * 60 * 60 * 1000);
		},
		today(): Date
		{
			const today = new Date();

			return new Date(today.getFullYear(), today.getMonth(), today.getDate());
		},
	},
	methods: {
		update(deadlineOffset: number | null): void
		{
			this.$emit('update', { deadlineOffset });
		},
		updateDeadlineAfter(deadlineTs: number | null): void
		{
			this.update(Type.isNumber(deadlineTs) ? deadlineTs / 1000 : deadlineTs);
		},
		isMinutes(durationTs: number): boolean
		{
			const hourTs = 60 * 60 * 1000;

			return durationTs < hourTs || durationTs % hourTs !== 0;
		},
		isHours(durationTs: number): boolean
		{
			return durationTs < this.dayDuration || durationTs % this.dayDuration !== 0;
		},
		isWeeks(durationTs: number): boolean
		{
			const weekTs = 7 * 24 * 60 * 60 * 1000;

			return durationTs % weekTs === 0;
		},
	},
	template: `
		<div class="tasks-field-replication-section">
			<TextMd tag="div" className="tasks-field-replication-row tasks-field-replication-secondary">
				<span>
					{{ loc('TASKS_V2_REPLICATION_DEADLINE') }}
				</span>
				<HoverPill textOnly noOffset ref="deadline">
					<span class="tasks-field-replication-link" @click="isDeadlinePopupShown = true">
						{{ deadlineLabel }}
					</span>
				</HoverPill>
				<DeadlineAfterPopup
					v-if="isDeadlinePopupShown"
					:deadlineAfter="replicateParams.deadlineAfter"
					:taskId
					:bindElement="$refs.deadline.$el"
					@update:deadlineAfter="updateDeadlineAfter"
					@close="isDeadlinePopupShown = false"
				/>
			</TextMd>
		</div>
	`,
};
