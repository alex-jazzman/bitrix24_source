import './block-content.css';

const CONTENT_CLASS_NAMES = {
	base: 'editor-chart-block-content',
	deactivated: '--deactivated',
};

const CONTENT_BG_COLORS_CLASS_NAMES = {
	bgColor_1: '--background-color-1',
	bgColor_2: '--background-color-2',
	bgColor_3: '--background-color-3',
	bgColor_4: '--background-color-4',
	bgColor_5: '--background-color-5',
	bgColor_6: '--background-color-6',
	bgColor_7: '--background-color-7',
	bgColor_8: '--background-color-8',
};

export const BlockContent = {
	name: 'BlockContent',
	props: {
		colorIndex: {
			type: Number,
			default: null,
		},
		deactivated: {
			type: Boolean,
			default: false,
		},
	},
	computed: {
		contentClassName(): { [string]: boolean }
		{
			const bgColorsClassNames = Object.keys(CONTENT_BG_COLORS_CLASS_NAMES)
				.reduce((colorsMap, colorKey, index) => {
					return {
						...colorsMap,
						[CONTENT_BG_COLORS_CLASS_NAMES[colorKey]]: this.colorIndex === index && !this.deactivated,
					};
				}, {});

			return {
				[CONTENT_CLASS_NAMES.base]: true,
				[CONTENT_CLASS_NAMES.deactivated]: this.deactivated,
				...bgColorsClassNames,
			};
		},
	},
	template: `
		<div :class="contentClassName">
			<slot/>
		</div>
	`,
};
