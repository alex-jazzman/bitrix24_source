import { computed, toValue } from 'ui.vue3';
import { useContextMenu } from 'ui.block-diagram';
import { BLOCK_COLOR_NAMES } from '../../constants';
import { BX_FLAG_NO } from '../../../../shared/constants';
// eslint-disable-next-line no-unused-vars
import type { MenuItemOptions } from 'ui.vue3.components.menu';

import './block-container.css';

type BlockContainerSetup = {
	blockContainerClassNames: { [string]: boolean };
	blockContainerStyle: { [string]: string };
};

const BLOCK_CONTAINER_CLASS_NAMES = {
	base: 'editor-chart-block-container',
	highlighted: '--highlighted',
	deactivated: '--deactivated',
	hoverable: '--hoverable',
	[BLOCK_COLOR_NAMES.WHITE]: '--white',
	[BLOCK_COLOR_NAMES.ORANGE]: '--orange',
	[BLOCK_COLOR_NAMES.BLUE]: '--blue',
};

// @vue/component
export const BlockContainer = {
	name: 'BlockContainer',
	props: {
		/** @type Block */
		block: {
			type: Object,
			default: null,
		},
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
		disabled: {
			type: Boolean,
			default: false,
		},
		hoverable: {
			type: Boolean,
			default: true,
		},
		backgroundColor: {
			type: String,
			default: null,
		},
		borderColor: {
			type: String,
			default: null,
		},
	},
	setup(props): BlockContainerSetup
	{
		const {
			isOpen: isOpenContextMenu,
			showMenu,
			closeContextMenu,
		} = useContextMenu();

		const isBlockActivated = computed((): boolean => {
			if (!props.block?.activity?.Activated)
			{
				return true;
			}

			return props.block.activity.Activated !== BX_FLAG_NO;
		});

		const blockContainerClassNames = computed((): { [string]: boolean } => ({
			[BLOCK_CONTAINER_CLASS_NAMES.base]: true,
			[BLOCK_CONTAINER_CLASS_NAMES.highlighted]: props.highlighted,
			[BLOCK_CONTAINER_CLASS_NAMES.deactivated]: !toValue(isBlockActivated),
			[BLOCK_CONTAINER_CLASS_NAMES.hoverable]: props.hoverable,
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

			if (props.backgroundColor !== null)
			{
				style.backgroundColor = props.backgroundColor;
			}

			if (props.borderColor !== null && !props.highlighted)
			{
				style.borderColor = props.borderColor;
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

			showMenu(
				{ clientX: event.clientX, clientY: event.clientY },
				{ items: props.contextMenuItems },
			);
		}

		return {
			isOpenContextMenu,
			isBlockActivated,
			blockContainerClassNames,
			blockContainerStyle,
			onShowContextMenu,
			closeContextMenu,
		};
	},
	template: `
		<div
			:class="blockContainerClassNames"
			:style="blockContainerStyle"
			@mousedown="closeContextMenu"
			@contextmenu.stop="onShowContextMenu"
		>
			<slot
				:isOpenContextMenu="isOpenContextMenu"
				:isBlockActivated="isBlockActivated"
			/>
		</div>
	`,
};
