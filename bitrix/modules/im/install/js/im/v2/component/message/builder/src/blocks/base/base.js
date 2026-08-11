import './base.css';

// @vue/component
export const BaseBlock = {
	name: 'BaseBlock',
	props: {
		message: {
			type: Object,
			required: true,
		},
		block: {
			type: Object,
			required: true,
		},
		dialogId: {
			type: String,
			required: true,
		},
	},
	computed: {},
	methods: {},
	template: `
		<slot></slot>
	`,
};
