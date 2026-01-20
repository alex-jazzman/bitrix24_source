import './block-switcher.css';
import { computed } from 'ui.vue3';
import { BIcon } from 'ui.icon-set.api.vue';
import { hint } from 'ui.vue3.directives.hint';

type BlockSwitcherSetup = {
	blockSwitcherClassNames: { [string]: boolean };
	iconClassNames: { [string]: boolean };
	switcherLabel: string;
	handleClick: () => void;
}

const BLOCK_SWITCHER_CLASS_NAMES = {
	base: 'editor-chart-block-switcher',
	on: 'editor-chart-block-switcher__on',
};

const ICON_CLASS_NAMES = {
	base: 'editor-chart-block-switcher__icon',
	on: '--on',
};

const SWITCHER_LABEL_ON = 'on';
const SWITCHER_LABEL_OFF = 'off';

// @vue/component
export const BlockSwitcher = {
	name: 'block-switcher',
	components: {
		BIcon,
	},
	directives: {
		hint,
	},
	props: {
		on: {
			type: Boolean,
			default: true,
		},
	},
	emits: ['click'],
	setup(props, { emit }): BlockSwitcherSetup
	{
		const blockSwitcherClassNames = computed((): { [string]: boolean } => ({
			[BLOCK_SWITCHER_CLASS_NAMES.base]: true,
			[BLOCK_SWITCHER_CLASS_NAMES.on]: props.on,
		}));

		const iconClassNames = computed((): { [string]: boolean } => ({
			[ICON_CLASS_NAMES.base]: true,
			[ICON_CLASS_NAMES.on]: props.on,
		}));

		const switcherLabel = computed((): string => {
			return props.on
				? SWITCHER_LABEL_ON
				: SWITCHER_LABEL_OFF;
		});

		const handleClick = (): void => {
			emit('click');
		};

		return {
			blockSwitcherClassNames,
			iconClassNames,
			switcherLabel,
			handleClick,
		};
	},
	template: `
		<div
			:class="blockSwitcherClassNames"
			@click="handleClick"
		>
			<BIcon
				:class="iconClassNames"
				:size="12"
				name="o-power" 
			/>
			<p class="editor-chart-block-switcher__label">
				{{ switcherLabel }}
			</p>
		</div>
	`,
};
