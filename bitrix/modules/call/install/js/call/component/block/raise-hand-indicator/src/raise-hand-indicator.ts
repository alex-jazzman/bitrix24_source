import { defineComponent } from 'ui.vue3';

import type { LocFunction } from 'call.plugin.loc';

import './css/raise-hand-indicator.css';

export const CallRaiseHandIndicator = defineComponent({
	name: 'CallRaiseHandIndicator',
	components: { },
	inject: {
		loc: { default: (): LocFunction => (key: string): string => key },
	},
	template: /* HTML */`
		<div class="call-raise-hand-indicator"></div>
	`,
});
