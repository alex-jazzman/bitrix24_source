import { ResizableBlock } from 'ui.block-diagram';
import { Outline } from 'ui.icon-set.api.vue';
import type { MenuItemOptions } from 'ui.vue3.components.menu';
import { IconDivider, IconButton } from '../../../../shared/ui';
import {
	BlockContainer,
	BlockLayout,
	BLOCK_LAYOUT_SLOT_NAMES,
	ColorMenuTopBtn,
	// ContentSeparator,
	FRAME_BG_COLORS,
	FRAME_BORDER_COLORS,
	FRAME_TEXT_ALIGN_OPTIONS,
	SEPARATOR_SIZE,
	getContextMenuName,
} from '../../../../entities/blocks';
import {
	DeleteBlockIconBtn,
	UpdatePublishedStatusLabel,
	ChangeFrameColorTopBtn,
	ChangeFrameTextAlignTopBtn,
	EditFrameContent,
	ChangeEditFrameContentTopBtn,
	EditNodeTitle,
} from '../../../../features/blocks';
import { BlockLayoutWidget } from '../block-layout/block-layout';

import type { Block } from '../../../../shared/types';

import { BlockMediator } from '../../lib';

type Props = {
	block: Block,
};

type Setup = {
	iconSet: { [string]: string },
	blockMediator: BlockMediator,
};

const MIN_CONTENT_SIZE = 380;

export const BlockFrame = {
	name: 'BlockFrame',
	components: {
		ResizableBlock,
		BlockContainer,
		BlockLayout,
		BlockLayoutWidget,
		EditNodeTitle,
		DeleteBlockIconBtn,
		UpdatePublishedStatusLabel,
		IconDivider,
		IconButton,
		ColorMenuTopBtn,
		ChangeFrameColorTopBtn,
		ChangeFrameTextAlignTopBtn,
		// ContentSeparator,
		EditFrameContent,
		ChangeEditFrameContentTopBtn,
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
		// const { zoom } = useBlockDiagram();

		return {
			iconSet: Outline,
			blockMediator: new BlockMediator(),
			frameBgColors: FRAME_BG_COLORS,
			frameBorderColors: FRAME_BORDER_COLORS,
			getContextMenuName,
			blockLayoutSlotNames: BLOCK_LAYOUT_SLOT_NAMES,
			// zoom,
		};
	},
	computed: {
		frameTextAlign(): string
		{
			return this.block?.node?.frameTextAlign ?? FRAME_TEXT_ALIGN_OPTIONS.NONE;
		},
		isNoneTextAlign(): boolean
		{
			return this.frameTextAlign === FRAME_TEXT_ALIGN_OPTIONS.NONE;
		},
		contextMenuItems(): Array<MenuItemOptions>
		{
			if (this.isNoneTextAlign)
			{
				return [
					this.blockMediator.getCtxMenuItemRenameNodeTitle(this.block.id),
					this.blockMediator.getCtxMenuItemCopyBlock(this.block),
					this.blockMediator.getCtxMenuItemDeleteBlock(this.block),
				];
			}

			return [
				this.blockMediator.getCtxMenuItemEditFrameContent(this.block.id),
				this.blockMediator.getCtxMenuItemRenameNodeTitle(this.block.id),
				this.blockMediator.getCtxMenuItemCopyBlock(this.block),
				this.blockMediator.getCtxMenuItemDeleteBlock(this.block),
			];
		},
		frameWidth(): number
		{
			return this.block.dimensions.width;
		},
		frameHeight(): number
		{
			return this.block.dimensions.height;
		},
		preparedFrameMinWith(): number
		{
			return (
				this.frameTextAlign === FRAME_TEXT_ALIGN_OPTIONS.LEFT
				|| this.frameTextAlign === FRAME_TEXT_ALIGN_OPTIONS.RIGHT
			)
				? MIN_CONTENT_SIZE + SEPARATOR_SIZE
				: MIN_CONTENT_SIZE;
		},
		preparedFrameMinHeight(): number
		{
			return (
				this.frameTextAlign === FRAME_TEXT_ALIGN_OPTIONS.TOP
				|| this.frameTextAlign === FRAME_TEXT_ALIGN_OPTIONS.BOTTOM
			)
				? MIN_CONTENT_SIZE + SEPARATOR_SIZE
				: MIN_CONTENT_SIZE;
		},
	},
	template: `
		<ResizableBlock
			:block="block"
			:minHeight="preparedFrameMinHeight"
			:minWidth="preparedFrameMinWith"
		>
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
							<EditNodeTitle :block="block"/>
						</template>

						<template #[blockLayoutSlotNames.TOP_MENU]>
							<DeleteBlockIconBtn
								:blockId="block.id"
								:disabled="isDisabled"
								@deletedBlock="blockMediator.hideCurrentBlockSettings($event)"
							/>
							<IconDivider/>
							<ChangeEditFrameContentTopBtn
								:blockId="block.id"
								:textAlign="frameTextAlign"
							/>
							<ChangeFrameTextAlignTopBtn :block="block"/>
							<ChangeFrameColorTopBtn :block="block"/>
						</template>

						<template #[blockLayoutSlotNames.DEFAULT]>
							<!--<ContentSeparator
								v-model:separatorPosition="block.node.frameSeparatorPosition"
								:blockId="block.id"
								:contentPosition="frameTextAlign"
								:width="width"
								:height="height"
								:zoom="zoom"
							>
								<template #content="{ height }">
									<EditFrameContent
										:block="block"
										:height="height"
									/>
								</template>
							</ContentSeparator>-->

							<EditFrameContent
								:block="block"
								:width="width"
								:height="height"
								:resizing="isResize"
							/>
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
