import { useContextMenu, useBlockDiagram } from 'ui.block-diagram';
import { Outline } from 'ui.icon-set.api.vue';
import { IconButton } from '../../../../shared/ui';
import { getContextMenuName } from '../../utils';

import type { DiagramContextMenuItemOptions } from 'ui.block-diagram';
import type { Block } from '../../../../shared/types';

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
			const { top = 0, right = 0 } = this.$refs.buttonMore
				?.$el?.getBoundingClientRect() ?? {};

			this.showMenu(
				{
					clientX: right + (OFFSET_MORE_MENU_RIGHT * this.zoom),
					clientY: top - (OFFSET_MORE_MENU_TOP * this.zoom),
				},
				{ items: this.moreMenuItems },
			);
		},
	},
	template: `
		<IconButton
			ref="buttonMore"
			:active="isOpen"
			:size="16"
			:icon-name="iconSet.MORE_L"
			@click="onOpenMoreMenu"
		/>
	`,
};
