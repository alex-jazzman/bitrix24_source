import { defineComponent } from 'ui.vue3';

import type { LocFunction } from 'call.plugin.loc';

import './css/picture-in-picture.css';

export const CallPictureInPicture = defineComponent({
	name: 'CallPictureInPicture',
	components: {},
	inject: {
		loc: { default: (): LocFunction => (key: string): string => key },
	},
	template: /* HTML */`
		<div class="call-picture-in-picture"></div>
	`,
});
