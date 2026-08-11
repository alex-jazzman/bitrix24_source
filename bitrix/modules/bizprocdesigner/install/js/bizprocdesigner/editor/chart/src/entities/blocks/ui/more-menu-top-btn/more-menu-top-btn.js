import { useContextMenu, useBlockDiagram, type DiagramContextMenuItemOptions } from 'ui.block-diagram';
import { Outline } from 'ui.icon-set.api.vue';

import { type Block } from '../../../../shared/types';
import { IconButton } from '../../../../shared/ui';
import { getContextMenuName } from '../../utils';

import './more-menu-top-btn.css';

type MoreMenuTopBtnProps = {
	block: Block,
	moreMenuItems: DiagramContextMenuItemOptions[],
};

type MoreMenuTopBtnSetup = {
	iconSet: { [string]: string };
	zoom: number;
	isOpen: boolean;
	showMenu: Pick<UseContextMenu, 'showMenu'>,
	closeContextMenu: Pick<UseContextMenu, 'closeContextMenu'>,
};

const OFFSET_MORE_MENU_RIGHT = 15;
const OFFSET_MORE_MENU_TOP = 10;

// @vue/component
export const MoreMenuTopBtn = {
	name: 'MoreMenuTopBtn',
	components: {
		IconButton,
	},
	props: {
		/** @type Block */
		block: {
			type: Object,
			required: true,
		},
		moreMenuItems: {
			type: Array,
			default: () => ([]),
		},
		menuTargetContainer: {
			type: HTMLElement,
			default: null,
		},
		size: {
			type: Number,
			default: 16,
		},
	},
	setup(props: MoreMenuTopBtnProps): MoreMenuTopBtnSetup
	{
		const {
			isOpen,
			showMenu,
			closeContextMenu,
		} = useContextMenu(getContextMenuName(props.block.id));
		const { zoom } = useBlockDiagram();

		return {
			iconSet: Outline,
			zoom,
			isOpen,
			showMenu,
			closeContextMenu,
		};
	},
	methods: {
		onOpenMoreMenu(): void
		{
			const buttonEl = this.$refs.buttonMore?.$el;
			const { top = 0, right = 0 } = buttonEl?.getBoundingClientRect() ?? {};

			const options = { items: this.moreMenuItems };
			if (this.menuTargetContainer)
			{
				options.targetContainer = this.menuTargetContainer;
				options.bindElement = buttonEl;
			}

			this.showMenu(
				{
					clientX: right + (OFFSET_MORE_MENU_RIGHT * this.zoom),
					clientY: top - (OFFSET_MORE_MENU_TOP * this.zoom),
				},
				options,
			);
		},
	},
	template: `
		<IconButton
			ref="buttonMore"
			:active="isOpen"
			:size="size"
			:icon-name="iconSet.MORE_L"
			@click="onOpenMoreMenu"
		/>
	`,
};
