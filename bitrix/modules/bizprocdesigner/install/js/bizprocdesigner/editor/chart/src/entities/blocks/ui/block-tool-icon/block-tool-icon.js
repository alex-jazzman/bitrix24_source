import { BlockIcon } from '../block-icon/block-icon';

type BlockToolIconSetup = {
	databaseIconName: string,
	mcpIconName: string,
};

const DATABASE_ICON_NAME = 'DATABASE';
const MCP_ICON_NAME = 'MCP_LETTERS';

// @vue/component
export const BlockToolIcon = {
	name: 'BlockToolIcon',
	components: {
		BlockIcon,
	},
	props: {
		iconName: {
			type: String,
			default: '',
		},
		deactivated: {
			type: Boolean,
			default: false,
		},
	},
	setup(): BlockToolIconSetup
	{
		return {
			databaseIconName: DATABASE_ICON_NAME,
			mcpIconName: MCP_ICON_NAME,
		};
	},
	computed: {
		preparedIconName(): string
		{
			return this.iconName === this.databaseIconName
				? this.iconName
				: this.mcpIconName;
		},
	},
	template: `
		<BlockIcon
			:iconName="preparedIconName"
			:iconColorIndex="0"
			:deactivated="deactivated"
		/>
	`,
};
