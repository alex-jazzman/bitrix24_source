import './icon-button.css';
import { computed, toRefs, toValue } from 'ui.vue3';
import { BIcon } from 'ui.icon-set.api.vue';

export type IconButtonSetup = {
	iconName: string,
	color: string,
	size: number,
	iconButtonClassNames: { [string]: boolean },
	iconButtonStyle: { [string]: string },
	iconClassNames: { [string]: boolean },
};

const ICON_BUTTON_CLASS_NAMES = {
	base: 'editor-chart-icon-button',
	disabled: '--disabled',
};

const ICON_CLASS_NAMES = {
	base: 'editor-chart-icon-button__icon',
	active: '--active',
};

// @vue/component
export const IconButton = {
	name: 'icon-button',
	components: {
		BIcon,
	},
	props: {
		iconName: {
			type: String,
			default: '',
		},
		size: {
			type: [Number, String],
			default: 16,
		},
		color: {
			type: String,
			default: 'var(--ui-color-gray-60)',
		},
		active: {
			type: Boolean,
			default: false,
		},
		disabled: {
			type: Boolean,
			default: false,
		},
	},
	setup(props): IconButtonSetup
	{
		const { size, active, disabled } = toRefs(props);

		const iconButtonClassNames = computed(() => ({
			[ICON_BUTTON_CLASS_NAMES.base]: true,
			[ICON_BUTTON_CLASS_NAMES.disabled]: toValue(disabled),
		}));

		const iconButtonStyle = computed(() => ({
			width: `${toValue(size)}px`,
			height: `${toValue(size)}px`,
		}));

		const iconClassNames = computed(() => ({
			[ICON_CLASS_NAMES.base]: true,
			[ICON_CLASS_NAMES.active]: toValue(active),
		}));

		return {
			iconButtonClassNames,
			iconButtonStyle,
			iconClassNames,
		};
	},
	template: `
		<button
			:class="iconButtonClassNames"
			:style="iconButtonStyle"
		>
			<slot>
				<BIcon
					:class="iconClassNames"
					:name="iconName"
					:color="color"
					:size="size"
				/>
			</slot>
		</button>
	`,
};
