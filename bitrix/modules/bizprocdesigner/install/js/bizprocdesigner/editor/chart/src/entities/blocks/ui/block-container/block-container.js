import './block-container.css';
import { computed } from 'ui.vue3';
import { useContextMenu } from 'ui.block-diagram';
import { BLOCK_COLOR_NAMES } from '../../constants';
// eslint-disable-next-line no-unused-vars
import type { MenuItemOptions } from 'ui.vue3.components.menu';

type BlockContainerSetup = {
	blockContainerClassNames: { [string]: boolean };
	blockContainerStyle: { [string]: string };
};

const BLOCK_CONTAINER_CLASS_NAMES = {
	base: 'editor-chart-block-container',
	highlighted: '--highlighted',
	deactivated: '--deactivated',
	[BLOCK_COLOR_NAMES.WHITE]: '--white',
	[BLOCK_COLOR_NAMES.ORANGE]: '--orange',
	[BLOCK_COLOR_NAMES.BLUE]: '--blue',
};

// @vue/component
export const BlockContainer = {
	name: 'block-container',
	props: {
		/** @type Array<MenuItemOptions> */
		contextMenuItems: {
			type: Array,
			default: () => ([]),
		},
		width: {
			type: Number,
			default: null,
		},
		height: {
			type: Number,
			default: null,
		},
		highlighted: {
			type: Boolean,
			default: false,
		},
		deactivated: {
			type: Boolean,
			default: false,
		},
		disabled: {
			type: Boolean,
			default: false,
		},
		colorName: {
			type: String,
			default: BLOCK_COLOR_NAMES.WHITE,
			validator(name): boolean
			{
				return Object.values(BLOCK_COLOR_NAMES).includes(name);
			},
		},
	},
	setup(props): BlockContainerSetup
	{
		const {
			isOpen: isOpenContextMenu,
			showContextMenu,
		} = useContextMenu(props.contextMenuItems);

		const blockContainerClassNames = computed((): { [string]: boolean } => ({
			[BLOCK_CONTAINER_CLASS_NAMES.base]: true,
			[BLOCK_CONTAINER_CLASS_NAMES.highlighted]: props.highlighted,
			[BLOCK_CONTAINER_CLASS_NAMES.deactivated]: props.deactivated,
			[BLOCK_CONTAINER_CLASS_NAMES[props.colorName]]: true,
		}));

		const blockContainerStyle = computed((): { [string]: string } => {
			const style: { [string]: string } = {};

			if (props.width !== null)
			{
				style.width = `${props.width}px`;
			}

			if (props.height !== null)
			{
				style.height = `${props.height}px`;
			}

			return style;
		});

		function onShowContextMenu(event: MouseEvent): void
		{
			event.preventDefault();

			if (props.disabled)
			{
				return;
			}

			showContextMenu(event);
		}

		return {
			isOpenContextMenu,
			blockContainerClassNames,
			blockContainerStyle,
			onShowContextMenu,
		};
	},
	template: `
		<div
			:class="blockContainerClassNames"
			:style="blockContainerStyle"
			@contextmenu="onShowContextMenu"
		>
			<slot :isOpenContextMenu="isOpenContextMenu"/>
		</div>
	`,
};
