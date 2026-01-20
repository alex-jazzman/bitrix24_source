// @vue/component
export const ContentBody = {
	name: 'ContentBody',
	props: {
		bgColor: {
			type: String,
			default: null,
		},
		borderColor: {
			type: String,
			default: 'var(--ui-color-divider-accent)',
		},
		padding: {
			type: String,
			default: 'var(--ui-space-inset-md)',
		},
	},
	template: `
		<div
			class="crm-messagesender-editor__content__body"
			:style="{
				backgroundColor: bgColor,
				border: 'var(--ui-border-width-thin) var(--ui-text-decoration-style-solid) ' + borderColor,
				padding: padding,
			}"
		>
			<slot/>
		</div>
	`,
};
