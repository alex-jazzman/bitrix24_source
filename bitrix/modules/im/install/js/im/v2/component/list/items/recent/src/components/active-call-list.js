import { ActiveCallList as ActiveCallListOriginal } from 'call.component.active-call-list';

import type { BitrixVueComponentProps } from 'ui.vue3';

// @vue/component
export const ActiveCallList = {
	name: 'ActiveCallList',
	props: {
		listIsScrolled: {
			type: Boolean,
			required: true,
		},
	},
	emits: ['onCallClick'],
	computed:
		{
			componentToRender(): BitrixVueComponentProps
			{
				return ActiveCallListOriginal;
			},
		},
	template: `
		<component v-if="componentToRender" :is="componentToRender" :listIsScrolled="listIsScrolled" @onCallClick="$emit('onCallClick', $event)" />
	`,
};
