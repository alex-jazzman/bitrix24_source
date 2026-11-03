import { defineComponent } from 'ui.vue3';

import type { LocFunction } from 'call.plugin.loc';

import './css/control-panel.css';

export const CallControlPanel = defineComponent({
	name: 'CallControlPanel',
	components: { },
	inject: {
		loc: { default: (): LocFunction => (key: string): string => key },
	},
	template: /* HTML */`
		<div class="call-control-panel"></div>
	`,
});
