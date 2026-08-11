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
	template: `
		<div class="bx-im-message-block-base__container">
			<slot></slot>
		</div>
	`,
};
