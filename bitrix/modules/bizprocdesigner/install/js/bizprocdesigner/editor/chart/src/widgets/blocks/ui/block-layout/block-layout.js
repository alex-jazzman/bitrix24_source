import { useBlockDiagram } from 'ui.block-diagram';
import {
	BlockLayout,
	BLOCK_LAYOUT_SLOT_NAMES,
	MoreMenuTopBtn,
	getContextMenuName,
} from '../../../../entities/blocks';

import type { DiagramContextMenuItemOptions } from 'ui.block-diagram';
import type { BlockId } from '../../../../shared/types';

type BlockLayoutWidgetSetup = {
	openedContextMenuName: string | null,
	getContextMenuName: (blockId: BlockId) => string,
	blockLayoutSlotNames: { [string]: string },
};

// @vue/component
export const BlockLayoutWidget = {
	name: 'BlockLayoutWidget',
	components: {
		BlockLayout,
		MoreMenuTopBtn,
	},
	props: {
		/** @type Block */
		block: {
			type: Object,
			required: true,
		},
		/** @type Array<DiagramContextMenuItemOptions> */
		moreMenuItems: {
			type: Array,
			default: () => ([]),
		},
		showTopMenu: {
			type: Boolean,
			default: false,
		},
		dragged: {
			type: Boolean,
			default: false,
		},
		resized: {
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
	},
	setup(): BlockLayoutWidgetSetup
	{
		const { openedContextMenuName } = useBlockDiagram();

		return {
			openedContextMenuName,
			getContextMenuName,
			blockLayoutSlotNames: BLOCK_LAYOUT_SLOT_NAMES,
		};
	},
	computed: {
		isShowTopMenu(): boolean
		{
			return this.openedContextMenuName === getContextMenuName(this.block.id) || this.showTopMenu;
		},
		isShowMoreMenu(): boolean
		{
			return this.moreMenuItems.length > 0;
		},
	},
	template: `
		<BlockLayout
			:block="block"
			:dragged="dragged"
			:resized="resized"
			:disabled="disabled"
			:hoverable="hoverable"
			:showTopMenu="isShowTopMenu"
		>
			<template
				v-if="$slots[blockLayoutSlotNames.TOP_MENU]"
				#[blockLayoutSlotNames.TOP_MENU]
			>
				<slot :name="blockLayoutSlotNames.TOP_MENU"/>
				<MoreMenuTopBtn
					v-if="isShowMoreMenu"
					:block="block"
					:moreMenuItems="moreMenuItems"
				/>
			</template>

			<template
				v-if="$slots[blockLayoutSlotNames.TOP_MENU_TITLE]"
				#[blockLayoutSlotNames.TOP_MENU_TITLE]
			>
				<slot :name="blockLayoutSlotNames.TOP_MENU_TITLE"/>
			</template>

			<template
				v-if="$slots[blockLayoutSlotNames.HEADER]"
				#[blockLayoutSlotNames.HEADER]
			>
				<slot :name="blockLayoutSlotNames.HEADER"/>
			</template>

			<template
				v-if="$slots[blockLayoutSlotNames.DEFAULT]"
				#[blockLayoutSlotNames.DEFAULT]
			>
				<slot :name="blockLayoutSlotNames.DEFAULT"/>
			</template>

			<template
				v-if="$slots[blockLayoutSlotNames.LEFT]"
				#[blockLayoutSlotNames.LEFT]
			>
				<slot :name="blockLayoutSlotNames.LEFT"/>
			</template>

			<template
				v-if="$slots[blockLayoutSlotNames.STATUS]"
				#[blockLayoutSlotNames.STATUS]
			>
				<slot :name="blockLayoutSlotNames.STATUS"/>
			</template>
		</BlockLayout>
	`,
};
