import type { BaseEvent } from 'main.core.events';

import { RichLoc } from 'ui.vue3.components.rich-loc';
import { DatePicker, DatePickerEvent } from 'ui.date-picker';
import { TextMd } from 'ui.system.typography.vue';

import { HoverPill } from 'tasks.v2.component.elements.hover-pill';
import { calendar } from 'tasks.v2.lib.calendar';
import { timezone } from 'tasks.v2.lib.timezone';

import { TimeStringConverter } from '../../../lib';

// @vue/component
export const ReplicationStartTime = {
	name: 'ReplicationStartTime',
	components: {
		RichLoc,
		TextMd,
		HoverPill,
	},
	inject: {
		replicateParams: {},
	},
	emits: ['update'],
	data(): { isPickerShown: boolean }
	{
		return {
			isPickerShown: false,
		};
	},
	computed: {
		startTs: {
			get(): number
			{
				return this.replicateParams.startTs;
			},
			set(startTs: number): void
			{
				this.$emit('update', { startTs });
			},
		},
		startTimeFormatted(): string
		{
			return TimeStringConverter.format(this.startTs);
		},
	},
	methods: {
		showPicker(): void
		{
			this.datePicker ??= new DatePicker({
				selectedDates: [this.startTs + timezone.getOffset(this.startTs)],
				type: 'time',
				events: {
					[DatePickerEvent.SELECT]: (event: BaseEvent) => {
						const { date } = event.getData();
						const dateTs = calendar.createDateFromUtc(date).getTime();

						this.startTs = dateTs - timezone.getOffset(dateTs);
					},
				},
				popupOptions: {
					targetContainer: document.body,
					events: {
						onClose: () => {
							this.isPickerShown = false;
						},
					},
				},
			});

			this.datePicker.setTargetNode(this.$refs.time.$el);
			this.datePicker.show();
			this.isPickerShown = true;
		},
	},
	template: `
		<TextMd tag="div" className="tasks-field-replication-section">
			<RichLoc
				class="tasks-field-replication-row tasks-field-replication-secondary"
				:text="loc('TASKS_V2_REPLICATION_CREATE_AT')"
				placeholder="[time/]"
			>
				<template #time>
					<HoverPill
						textOnly
						noOffset
						:ariaLabel="loc('TASKS_V2_REPLICATION_START_TIME_ARIA_LABEL')"
						:ariaHaspopup="'dialog'"
						:ariaExpanded="isPickerShown"
						data-testid="tasks-replication-start-time-btn"
						ref="time"
						@click="showPicker"
					>
						<span class="tasks-field-replication-link">{{ startTimeFormatted }}</span>
					</HoverPill>
				</template>
			</RichLoc>
		</TextMd>
	`,
};
