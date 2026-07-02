import { BIcon } from 'ui.icon-set.api.vue';
import { Animated, Main } from 'ui.icon-set.api.core';
import 'ui.icon-set.animated';
import 'ui.icon-set.main';

import { Counter as UiCounter, CounterColor, CounterSize } from 'booking.component.counter';

import './full-counter.css';

// @vue/component
export const FullCounter = {
	name: 'BookingFullCounter',
	components: {
		BIcon,
		UiCounter,
	},
	props: {
		showClocking: {
			type: Boolean,
			default: false,
		},
		showConfirmed: {
			type: Boolean,
			default: false,
		},
		showCounter: {
			type: Boolean,
			default: false,
		},
		counterValue: {
			type: Number,
			default: 0,
		},
	},
	setup(): Object
	{
		return {
			Animated,
			Main,
			CounterColor,
			CounterSize,
		};
	},
	template: `
		<div v-if="showClocking" class="booking-booking-booking__counter_icon --clocking">
			<BIcon :name="Animated.LOADER_CLOCK" :hoverable="false"/>
		</div>
		<div v-else-if="showConfirmed" class="booking-booking-booking__counter_icon --confirmed">
			<BIcon :name="Main.CHECK" :hoverable="false"/>
		</div>
		<UiCounter
			v-else-if="showCounter"
			:value="counterValue"
			:color="CounterColor.DANGER"
			:size="CounterSize.LARGE"
			border
		/>
	`,
};
