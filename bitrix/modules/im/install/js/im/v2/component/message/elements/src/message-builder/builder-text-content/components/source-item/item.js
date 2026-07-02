import './item.css';

// @vue/component
export const SourceItem = {
	name: 'SourceItem',
	props: {
		text: {
			type: String,
			required: true,
		},
	},
	template: `
		<span class="bx-im-message-source-item__container --ui-hoverable">
			<span class="--ellipsis">{{ text }}</span>
		</span>
	`,
};
