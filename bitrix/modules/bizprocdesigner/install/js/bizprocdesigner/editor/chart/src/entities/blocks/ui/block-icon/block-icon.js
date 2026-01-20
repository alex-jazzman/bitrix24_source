import './block-icon.css';
import { computed } from 'ui.vue3';
import { BIcon, Outline } from 'ui.icon-set.api.vue';

type BlockIconSetup = {
	iconClassNames: { [string]: boolean };
	getIconName: (name: ?string) => string;
	getIconColor: (colorIndex: ?Number) => ?string;
};

const ICON_CLASS_NAMES = {
	base: 'editor-chart-block-icon',
	bgColor_1: '--background-color-1',
	bgColor_2: '--background-color-2',
	bgColor_3: '--background-color-3',
	bgColor_4: '--background-color-4',
	bgColor_5: '--background-color-5',
	bgColor_6: '--background-color-6',
	bgColor_7: '--background-color-7',
	bgColor_8: '--background-color-8',
};

const ICON_COLORS = {
	0: '#9C5CEF',
	1: '#188AE6',
	2: '#E08907',
	3: '#8E96A2',
	4: '#3CB811',
	5: '#52BCBC',
	6: '#B4B959',
	7: '#FFFFFF',
};

const DEFAULT_ICON_NAME = Outline.FILE;

// @vue/component
export const BlockIcon = {
	name: 'block-icon',
	components: {
		BIcon,
	},
	props: {
		iconName: {
			type: String,
			default: DEFAULT_ICON_NAME,
		},
		iconColorIndex: {
			type: Number,
			default: 0,
		},
		customColor: {
			type: String,
			default: null,
		},
		iconSize: {
			type: Number,
			default: 28,
		},
	},
	setup(props): BlockIconSetup
	{
		const iconSet = Outline;

		const iconClassNames = computed(() => ({
			[ICON_CLASS_NAMES.base]: true,
			[ICON_CLASS_NAMES.bgColor_1]: props.iconColorIndex === 0,
			[ICON_CLASS_NAMES.bgColor_2]: props.iconColorIndex === 1,
			[ICON_CLASS_NAMES.bgColor_3]: props.iconColorIndex === 2,
			[ICON_CLASS_NAMES.bgColor_4]: props.iconColorIndex === 3,
			[ICON_CLASS_NAMES.bgColor_5]: props.iconColorIndex === 4,
			[ICON_CLASS_NAMES.bgColor_6]: props.iconColorIndex === 5,
			[ICON_CLASS_NAMES.bgColor_7]: props.iconColorIndex === 6,
			[ICON_CLASS_NAMES.bgColor_8]: props.iconColorIndex === 7,
		}));

		function getIconName(name: ?string): string
		{
			if (name && Object.prototype.hasOwnProperty.call(iconSet, name))
			{
				return iconSet[name];
			}

			return DEFAULT_ICON_NAME;
		}

		function getIconColor(colorIndex: ?Number): ?string
		{
			if (colorIndex !== false && ICON_COLORS[colorIndex])
			{
				return ICON_COLORS[colorIndex];
			}

			return null;
		}

		return {
			iconClassNames,
			getIconName,
			getIconColor,
		};
	},
	template: `
		<div :class="iconClassNames">
			<BIcon
				:name="getIconName(iconName)" 
				:size="iconSize"
				:color="customColor || getIconColor(iconColorIndex)"
				class="editor-chart-block-icon__icon"
			/>
		</div>
	`,
};
