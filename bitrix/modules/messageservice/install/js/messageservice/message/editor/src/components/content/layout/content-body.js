// @vue/component
export const ContentBody = {
	name: 'ContentBody',
	props: {
		bgColor: {
			type: String,
			default: null,
		},
		padding: {
			type: String,
			default: 'var(--ui-space-inset-md)',
		},
	},
	template: `
		<div
			class="messageservice-message-editor__content__body"
			:style="{
				backgroundColor: bgColor,
				padding: padding,
			}"
		>
			<slot/>
		</div>
	`,
};
