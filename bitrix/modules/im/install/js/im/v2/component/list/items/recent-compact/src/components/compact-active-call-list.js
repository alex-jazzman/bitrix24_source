import { CompactActiveCallList as CompactActiveCallListOriginal } from 'call.widget.compact-active-call-list';

import { defineComponent, type BitrixVueComponentProps } from 'ui.vue3';

// @vue/component
export const CompactActiveCallList = defineComponent({
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
});
