import { Chip, ChipSize, ChipDesign } from 'ui.system.chip.vue';

import { DeadlineState, TaskStatus } from 'tasks.v2.const';
import { calendar } from 'tasks.v2.lib.calendar';

// @vue/component
export const DeadlineChipView = {
	components: {
		Chip,
	},
	props: {
		deadlineFormatted: {
			type: String,
			required: true,
		},
		isExpired: {
			type: Boolean,
			required: true,
		},
		readonly: {
			type: Boolean,
			required: true,
		},
		taskStatus: {
			type: String,
			required: true,
		},
		isFlowFilledOnAdd: {
			type: Boolean,
			required: true,
		},
		isTemplate: {
			type: Boolean,
			required: true,
		},
		deadlineTs: {
			type: Number,
			default: null,
		},
	},
	emits: ['keydown', 'update:isExceededHintShown'],
	setup(): Object
	{
		return {
			ChipSize,
			ChipDesign,
			DeadlineState,
		};
	},
	computed: {
		deadlineState(): DeadlineState
		{
			if (this.taskStatus === TaskStatus.Completed)
			{
				return DeadlineState.Completed;
			}

			if (this.taskStatus === TaskStatus.Deferred)
			{
				return DeadlineState.Deferred;
			}

			if (this.taskStatus === TaskStatus.SupposedlyCompleted)
			{
				return DeadlineState.SupposedlyCompleted;
			}

			if (!this.deadlineTs)
			{
				return DeadlineState.None;
			}

			if (this.isExpired)
			{
				return DeadlineState.Expired;
			}

			if (calendar.isToday(this.deadlineTs))
			{
				return DeadlineState.Today;
			}

			if (calendar.isTomorrow(this.deadlineTs))
			{
				return DeadlineState.Tomorrow;
			}

			if (calendar.isThisWeek(this.deadlineTs))
			{
				return DeadlineState.ThisWeek;
			}

			if (calendar.isNextWeek(this.deadlineTs))
			{
				return DeadlineState.NextWeek;
			}

			return DeadlineState.MoreThanTwoWeeks;
		},
		design(): string
		{
			const designMap = {
				[DeadlineState.None]: ChipDesign.Outline,
				[DeadlineState.Completed]: ChipDesign.OutlineNoAccent,
				[DeadlineState.Deferred]: ChipDesign.Outline,
				[DeadlineState.SupposedlyCompleted]: ChipDesign.OutlineWarning,
				[DeadlineState.Expired]: ChipDesign.TintedAlert,
				[DeadlineState.Today]: ChipDesign.TintedWarning,
				[DeadlineState.Tomorrow]: ChipDesign.TintedSuccess,
				[DeadlineState.ThisWeek]: ChipDesign.Tinted,
				[DeadlineState.NextWeek]: ChipDesign.OutlineAccent2,
				[DeadlineState.MoreThanTwoWeeks]: ChipDesign.TintedNoAccent,
			};

			return designMap[this.deadlineState] || ChipDesign.Outline;
		},
		text(): string
		{
			if (this.isFlowFilledOnAdd || this.isTemplate)
			{
				return this.deadlineFormatted;
			}

			if (this.deadlineState === DeadlineState.Completed)
			{
				return this.loc('TASKS_V2_DEADLINE_COMPLETED');
			}

			if (this.deadlineState === DeadlineState.Deferred)
			{
				return this.loc('TASKS_V2_DEADLINE_DEFERRED');
			}

			if (this.deadlineState === DeadlineState.SupposedlyCompleted)
			{
				return this.loc('TASKS_V2_DEADLINE_SUPPOSEDLY_COMPLETED');
			}

			if (this.deadlineState === DeadlineState.Today)
			{
				return this.loc('TASKS_V2_DEADLINE_TODAY_FORMATTED', {
					'#TIME#': calendar.formatTime(this.deadlineTs),
				});
			}

			if (this.deadlineState === DeadlineState.Tomorrow)
			{
				return this.loc('TASKS_V2_DEADLINE_TOMORROW_FORMATTED', {
					'#TIME#': calendar.formatTime(this.deadlineTs),
				});
			}

			return this.deadlineFormatted;
		},
		hintBindElement(): HTMLElement
		{
			return this.$refs.deadline;
		},
	},
	methods: {
		focusDeadline(): void
		{
			this.$refs.deadline.focus();
		},
		getHintBindElement(): HTMLElement
		{
			return this.hintBindElement;
		},
	},
	template: `
		<div
			class="tasks-field-deadline-chip"
			:class="{ '--read-only': readonly }"
			@keydown="$emit('keydown', $event)"
			ref="deadline"
		>
			<Chip
				:size="ChipSize.Sm"
				:text
				:design
				rounded
			/>
		</div>
	`,
};
