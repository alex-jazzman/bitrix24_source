import { ResizableBlock } from 'ui.block-diagram';
import { Outline } from 'ui.icon-set.api.vue';
import type { MenuItemOptions } from 'ui.vue3.components.menu';
import { IconDivider, IconButton } from '../../../../shared/ui';
import {
	BlockContainer,
	BlockLayout,
	BLOCK_LAYOUT_SLOT_NAMES,
	ColorMenuTopBtn,
	ContentSeparator,
	FRAME_BG_COLORS,
	FRAME_BORDER_COLORS,
	getContextMenuName,
} from '../../../../entities/blocks';
import {
	DeleteBlockIconBtn,
	UpdatePublishedStatusLabel,
	ChangeFrameColorTopBtn,
	ChangeFrameTextAlignTopBtn,
} from '../../../../features/blocks';
import { BlockLayoutWidget } from '../block-layout/block-layout';
import { BlockTopTitleWidget } from '../block-top-title/block-top-title';

import type { Block } from '../../../../shared/types';

import { BlockMediator } from '../../lib';

type Props = {
	block: Block,
};

type Setup = {
	iconSet: { [string]: string },
	blockMediator: BlockMediator,
};

export const BlockFrame = {
	name: 'BlockFrame',
	components: {
		ResizableBlock,
		BlockContainer,
		BlockLayout,
		BlockLayoutWidget,
		BlockTopTitleWidget,
		DeleteBlockIconBtn,
		UpdatePublishedStatusLabel,
		IconDivider,
		IconButton,
		ColorMenuTopBtn,
		ChangeFrameColorTopBtn,
		ChangeFrameTextAlignTopBtn,
		ContentSeparator,
	},
	props: {
		/** @type Block */
		block: {
			type: Object,
			required: true,
		},
	},
	setup(props: Props): Setup
	{
		return {
			iconSet: Outline,
			blockMediator: new BlockMediator(),
			frameBgColors: FRAME_BG_COLORS,
			frameBorderColors: FRAME_BORDER_COLORS,
			getContextMenuName,
			blockLayoutSlotNames: BLOCK_LAYOUT_SLOT_NAMES,
		};
	},
	computed: {
		contextMenuItems(): Array<MenuItemOptions>
		{
			return [
				this.blockMediator.getCtxMenuItemCopyBlock(this.block),
				this.blockMediator.getCtxMenuItemDeleteBlock(this.block),
			];
		},
	},
	template: `
		<ResizableBlock :block="block">
			<template #default="{ isHighlighted, isResize, isDragged, isDisabled, isMakeNewConnection, width, height }">
				<BlockContainer
					:highlighted="(isHighlighted || isResize) && !isDragged"
					:disabled="isDisabled"
					:hoverable="!isMakeNewConnection"
					:contextMenuItems="contextMenuItems"
					:backgroundColor="frameBgColors[block.node.frameColorName]"
					:borderColor="frameBorderColors[block.node.frameColorName]"
					@mouseup="blockMediator.handleMouseUp($event, block)"
					@mousedown="blockMediator.handleMouseDown($event)"
				>
					<BlockLayoutWidget
						:block="block"
						:moreMenuItems="contextMenuItems"
						:dragged="isDragged"
						:resized="isResize"
						:disabled="isDisabled"
						:hoverable="!isMakeNewConnection"
					>
						<template #[blockLayoutSlotNames.TOP_MENU_TITLE]>
							<BlockTopTitleWidget :block="block"/>
						</template>

						<template #[blockLayoutSlotNames.TOP_MENU]>
							<DeleteBlockIconBtn
								:blockId="block.id"
								:disabled="isDisabled"
								@deletedBlock="blockMediator.hideCurrentBlockSettings($event)"
							/>
							<IconDivider/>
							<ChangeFrameTextAlignTopBtn :block="block"/>
							<ChangeFrameColorTopBtn :block="block"/>
						</template>

						<template #[blockLayoutSlotNames.DEFAULT]>
							<ContentSeparator
								v-model:separatorPosition="block.node.frameSeparatorPosition"
								:blockId="block.id"
								:contentPosition="block.node.frameTextAlign"
								:width="width"
								:height="height"
							>
								<template #content>
								</template>
							</ContentSeparator>
						</template>

						<template #[blockLayoutSlotNames.STATUS]>
							<UpdatePublishedStatusLabel :block="block"/>
						</template>
					</BlockLayoutWidget>
				</BlockContainer>
			</template>
		</ResizableBlock>
	`,
};
