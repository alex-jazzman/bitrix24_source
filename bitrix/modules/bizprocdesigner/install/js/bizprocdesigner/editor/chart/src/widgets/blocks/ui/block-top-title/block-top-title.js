import { BlockTopTitle } from '../../../../entities/blocks';

// @vue/component
export const BlockTopTitleWidget = {
	name: 'BlockTopTitleWidget',
	components: {
		BlockTopTitle,
	},
	props: {
		/** @type Block */
		block: {
			type: Object,
			required: true,
		},
	},
	computed: {
		userTitle(): string | null
		{
			const activityTitle = this.block.activity?.Properties?.Title;
			const defaultNodeTitle = this.block.node?.title;

			return activityTitle === defaultNodeTitle ? null : activityTitle;
		},
	},
	template: `
		<BlockTopTitle
			:title="userTitle"
			:description="block.activity.Properties.EditorComment"
		/>
	`,
};
