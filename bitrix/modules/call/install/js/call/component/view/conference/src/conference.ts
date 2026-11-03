import { defineComponent } from 'ui.vue3';

import type { LocFunction } from 'call.plugin.loc';

import './css/conference.css';

export const CallConference = defineComponent({
	name: 'CallConference',
	components: {},
	inject: {
		loc: { default: (): LocFunction => (key: string): string => key },
	},
	template: /* HTML */`
		<div class="call-conference"></div>
	`,
});
