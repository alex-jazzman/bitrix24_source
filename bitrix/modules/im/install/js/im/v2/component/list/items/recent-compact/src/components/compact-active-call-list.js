import { CompactActiveCallList as CompactActiveCallListOriginal } from 'call.component.compact-active-call-list';

import type { BitrixVueComponentProps } from 'ui.vue3';

// @vue/component
export const CompactActiveCallList = {
	name: 'CompactActiveCallList',
	emits: ['click'],
	computed:
		{
			componentToRender(): BitrixVueComponentProps
			{
				return CompactActiveCallListOriginal;
			},
		},
	template: `
		<component v-if="componentToRender" :is="componentToRender"  @click="$emit('click', $event)" />
	`,
};
