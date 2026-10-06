import { DateTimeFormat } from 'main.date';

import { HoursInDay } from 'booking.lib.grid';
import { range } from 'booking.lib.range';

import { type TimeScaleHour } from './types';

import './time-scale.css';

// @vue/component
export const TimeScale = {
	name: 'TimeScale',
	props: {
		fromHour: {
			type: Number,
			required: true,
		},
		toHour: {
			type: Number,
			required: true,
		},
		offHoursExpanded: {
			type: Boolean,
			required: true,
		},
	},
	setup(): { HoursInDay: number }
	{
		return {
			HoursInDay,
		};
	},
	computed: {
		hours(): TimeScaleHour[]
		{
			const timeFormat = DateTimeFormat.getFormat('SHORT_TIME_FORMAT');
			const lastHour = this.offHoursExpanded ? HoursInDay : this.toHour;

			return range(0, HoursInDay).map((hour: number) => {
				const timestamp = new Date().setHours(hour, 0) / 1000;

				return {
					value: hour,
					formatted: DateTimeFormat.format(timeFormat, timestamp),
					offHours: hour < this.fromHour || hour >= this.toHour,
					last: hour === lastHour,
				};
			});
		},
	},
	template: `
		<div class="booking-booking-time-scale">
			<template v-for="hour of hours" :key="hour.value">
				<div
					v-if="hour.last"
					class="booking-booking-time-scale__label"
				>
					{{ hour.formatted }}
				</div>
				<div
					v-if="hour.value !== HoursInDay"
					class="booking-booking-time-scale__row"
					:class="{ '--off-hours': hour.offHours }"
				>
					<div class="booking-booking-time-scale__label">
						{{ hour.formatted }}
					</div>
					<slot name="row" :hour="hour"></slot>
				</div>
			</template>
		</div>
	`,
};
