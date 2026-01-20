import './icon-divider.css';
import { computed, toRefs, toValue } from 'ui.vue3';

export type IconDividerSetup = {
	containerStyle: { [string]: string },
	lineStyle: { [string]: string },
};

// @vue/component
export const IconDivider = {
	name: 'icon-divider',
	props: {
		size: {
			type: [Number, String],
			default: 16,
		},
		color: {
			type: String,
			default: 'var(--ui-color-gray-20)',
		},
	},
	setup(props): IconDividerSetup
	{
		const { size, color } = toRefs(props);

		const containerStyle = computed(() => ({
			height: `${toValue(size)}px`,
		}));

		const lineStyle = computed(() => ({
			height: `${Math.round(toValue(size) / 2)}px`,
			background: toValue(color),
		}));

		return {
			containerStyle,
			lineStyle,
		};
	},
	template: `
		<div
			class="ui-block-diagram-icon-divider"
			:style="containerStyle"
		>
			<div
				class="ui-block-diagram-icon-divider-line"
				:style="lineStyle"
			/>
		</div>
	`,
};
