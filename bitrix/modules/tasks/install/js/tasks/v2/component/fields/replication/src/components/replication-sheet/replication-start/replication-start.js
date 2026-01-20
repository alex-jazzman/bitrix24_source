import { Text } from 'main.core';
import { DateTimeFormat } from 'main.date';

import { RichLoc } from 'ui.vue3.components.rich-loc';
import { TextMd } from 'ui.system.typography.vue';
import { Button as UiButton, AirButtonStyle, ButtonSize } from 'ui.vue3.components.button';

import { HoverPill } from 'tasks.v2.component.elements.hover-pill';
import { calendar } from 'tasks.v2.lib.calendar';
import { timezone } from 'tasks.v2.lib.timezone';

import { ReplicationDatepicker } from '../replication-datepicker/replication-datepicker';
import './replication-start.css';

// @vue/component
export const ReplicationStart = {
	name: 'ReplicationStart',
	components: {
		RichLoc,
		TextMd,
		HoverPill,
		ReplicationDatepicker,
		UiButton,
	},
	inject: {
		replicateParams: {},
	},
	emits: ['update'],
	setup(): { AirButtonStyle: typeof AirButtonStyle, ButtonSize: typeof ButtonSize }
	{
		return {
			AirButtonStyle,
			ButtonSize,
		};
	},
	data(): { isDatepickerOpened: false }
	{
		return {
			isDatepickerOpened: false,
		};
	},
	computed: {
		startTs: {
			get(): number
			{
				return DateTimeFormat.parse(this.replicateParams.startDate).getTime();
			},
			set(value: number): void
			{
				const startDate = DateTimeFormat.format(DateTimeFormat.getFormat('FORMAT_DATETIME'), new Date(value));
				this.$emit('update', { startDate });
			},
		},
		startLabel(): string
		{
			if (this.isToday(this.startTs))
			{
				return Text.capitalize(DateTimeFormat.format('today'));
			}

			return calendar.formatDate(this.startTs);
		},
	},
	beforeMount(): void
	{
		if (!this.replicateParams.startDate)
		{
			this.startTs = Date.now();
		}
	},
	methods: {
		isToday(dateTs: number): boolean
		{
			const today = new Date();
			const day = new Date(dateTs + timezone.getOffset(dateTs));

			return (
				today.getFullYear() === day.getFullYear()
				&& today.getMonth() === day.getMonth()
				&& today.getDate() === day.getDate()
			);
		},
	},
	template: `
		<TextMd tag="div" className="tasks-field-replication-section">
			<RichLoc
				class="tasks-field-replication-row tasks-field-replication-secondary"
				:text="loc('TASKS_V2_REPLICATION_START')"
				placeholder="[date/]"
			>
				<template #date>
					<HoverPill textOnly noOffset ref="datepickerStartOpener">
						<span class="tasks-field-replication-link" @click="isDatepickerOpened = true">
							{{ startLabel }}
						</span>
					</HoverPill>
					<ReplicationDatepicker
						v-if="isDatepickerOpened"
						v-model:dateTs="startTs"
						:bindElement="$refs.datepickerStartOpener.$el"
						@close="isDatepickerOpened = false"
					/>
				</template>
			</RichLoc>
		</TextMd>
	`,
};
