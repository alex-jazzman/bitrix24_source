import { DateTimeFormat } from 'main.date';
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
	computed: {
		createTime: {
			get(): string
			{
				return this.replicateParams.time;
			},
			set(value: string): void
			{
				this.$emit('update', { time: value });
			},
		},
		startTimeTs(): number
		{
			return TimeStringConverter.toTimestamp(this.createTime);
		},
		starTimeLocale(): string
		{
			return TimeStringConverter.toTimeString(
				this.startTimeTs,
				timezone.getOffset(this.startTimeTs),
			);
		},
	},
	beforeMount(): void
	{
		if (!this.replicateParams.time)
		{
			this.createTime = calendar.dayStartTime;
		}
	},
	methods: {
		showPicker(): void
		{
			this.datePicker ??= new DatePicker({
				selectedDates: [this.startTimeTs + timezone.getOffset(this.startTimeTs)],
				type: 'time',
				events: {
					[DatePickerEvent.SELECT]: (event: BaseEvent) => {
						const { date } = event.getData();
						const dateTs = calendar.createDateFromUtc(date).getTime();

						this.updateTime(dateTs - timezone.getOffset(dateTs));
					},
				},
				popupOptions: {
					targetContainer: document.body,
				},
			});

			this.datePicker.setTargetNode(this.$refs.time.$el);
			this.datePicker.show();
		},
		updateTime(dateTs: number): void
		{
			this.createTime = DateTimeFormat.format('H:i', new Date(dateTs));
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
					<HoverPill textOnly noOffset ref="time" @click="showPicker">
						<span class="tasks-field-replication-link">{{ starTimeLocale }}</span>
					</HoverPill>
				</template>
			</RichLoc>
		</TextMd>
	`,
};
