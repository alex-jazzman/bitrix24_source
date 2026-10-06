// @vue/component
export const ContentContainer = {
	name: 'ContentContainer',
	props: {
		contentStyle: {
			/** @type {{ [key: string]: string | null }} */
			type: Object,
			default: () => ({}),
		},
	},
	template: `
		<div class="messageservice-message-editor__content" data-role="content-container" :style="contentStyle">
			<slot/>
		</div>
	`,
};
