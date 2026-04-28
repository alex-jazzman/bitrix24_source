import { BitrixVueComponentProps } from 'ui.vue3';

export const Value: BitrixVueComponentProps = {
	name: 'Value',

	props: {
		value: {
			type: [String, Array, Object],
			required: true,
		},
	},

	template: `
		<div v-if="Array.isArray(value)" v-for="valueItem in value" class="value-set">
			<Value :value="valueItem" />
		</div>
		<div v-else class="value" :title="value">
			{{ value }}
		</div>
	`,
};
