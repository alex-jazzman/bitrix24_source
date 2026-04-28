import { Counter as BCounter } from 'ui.vue3.components.counter';
import { CounterStyle } from 'ui.cnt';

import './skus-bar.css';

// @vue/component
export const SkusBar = {
	name: 'SkusBar',
	components: {
		BCounter,
	},
	props: {
		checked: {
			type: Boolean,
			default: false,
		},
		servicesCount: {
			type: Number,
			default: 0,
		},
	},
	emits: ['update:checked'],
	setup(): { CounterStyle: typeof CounterStyle }
	{
		return {
			CounterStyle,
		};
	},
	template: `
		<div class="booking-sre-app--services-bar">
			<div class="ui-form-row-inline">
				<label class="ui-ctl ui-ctl-checkbox">
					<input
						:checked="checked"
						data-id="booking-sre-app--services-bar__select-all"
						type="checkbox"
						class="ui-ctl-element ui-ctl-checkbox"
						@change="$emit('update:checked')"
					/>
					<span class="booking-sre-app--services-bar__label">
						{{ loc('BOOKING_SRE_ALL_SERVICES_LABEL') }}
					</span>
				</label>
			</div>
			<BCounter
				:value="servicesCount"
				:maxValue="Infinity"
				:style="CounterStyle.FILLED_NO_ACCENT"
			/>
			<div class="booking-sre-app--services-bar__grow"></div>
			<slot name="button"></slot>
		</div>
	`,
};
