import { Counter as BCounter } from 'ui.vue3.components.counter';
import { CounterStyle } from 'ui.cnt';

import './resources-bar.css';

// @vue/component
export const ResourcesBar = {
	name: 'ResourcesBar',
	components: {
		BCounter,
	},
	props: {
		checked: {
			type: Boolean,
			default: false,
		},
		resourcesCount: {
			type: Number,
			default: 0,
		},
	},
	emits: ['update:checked'],
	setup(): { CounterStyle: CounterStyle }
	{
		return {
			CounterStyle,
		};
	},
	template: `
		<div class="booking-sre-app__resources-bar">
			<div class="ui-form-row-inline">
				<label class="ui-ctl ui-ctl-checkbox">
					<input
						:checked="checked"
						data-id="booking-sre-app__resources-bar__select-all"
						type="checkbox"
						class="ui-ctl-element ui-ctl-checkbox"
						@change="$emit('update:checked')"
					/>
					<span class="booking-sre-app__resources-bar__label">
						{{ loc('BOOKING_SRE_ALL_RESOURCES_LABEL') }}
					</span>
				</label>
			</div>
			<BCounter
				:value="resourcesCount"
				:maxValue="Infinity"
				:style="CounterStyle.FILLED_NO_ACCENT"
			/>
			<div class="booking-sre-app__resources-bar__grow"></div>
			<slot name="button"></slot>
		</div>
	`,
};
