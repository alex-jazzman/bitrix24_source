import './catalog-group-icon.css';
import { BIcon, Outline } from 'ui.icon-set.api.vue';

type CatalogGroupIconSetup = {
	getIconName: (name: ?string) => string,
};

const DEFAULT_ICON_NAME = 'o-folder';

// @vue/component
export const CatalogGroupIcon = {
	name: 'catalog-group-icon',
	components: {
		BIcon,
	},
	props: {
		iconName: {
			type: String,
			default: DEFAULT_ICON_NAME,
			required: true,
		},
	},
	setup(): CatalogGroupIconSetup
	{
		const iconSet = Outline;

		function getIconName(name: ?string): string
		{
			if (name && Object.prototype.hasOwnProperty.call(iconSet, name))
			{
				return iconSet[name];
			}

			return DEFAULT_ICON_NAME;
		}

		return {
			getIconName,
		};
	},
	template: `
		<BIcon
			:name="getIconName(iconName)"
			:size="30"
			class="editor-chart-catalog-group-icon"
		/>
	`,
};
