import { BlockTopTitle, getBlockUserTitle } from '../../../../entities/blocks';

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
		userTitle(): ?string
		{
			return getBlockUserTitle(this.block);
		},
	},
	template: `
		<BlockTopTitle
			:title="userTitle"
			:description="block.activity.Properties.EditorComment"
		/>
	`,
};
