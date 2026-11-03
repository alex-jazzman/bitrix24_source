import { Groupable, ResizableBlock } from 'ui.block-diagram';
import { Outline } from 'ui.icon-set.api.vue';
import type { MenuItemOptions } from 'ui.vue3.components.menu';

import { FeatureCode } from 'bizprocdesigner.feature';
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
import { useEditFrameContent } from '../../../../features/blocks/composables/use-edit-frame-content';
import { useFeature } from '../../../../shared/composables';
import { BlockLayoutWidget } from '../block-layout/block-layout';

import type { Block } from '../../../../shared/types';

import { BlockMediator } from '../../lib';

import './block-frame.css';

type Props = {
	block: Block,
	dragPreview?: boolean,
};

type Setup = {
	iconSet: { [string]: string },
	blockMediator: BlockMediator,
	isFrameNodeStickingAvailable: boolean,
};

const MIN_CONTENT_SIZE = 380;
const DRAG_PREVIEW_INSET = 24;

export const BlockFrame = {
	name: 'BlockFrame',
	components: {
		Groupable,
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
		dragPreview: {
			type: Boolean,
			default: false,
		},
	},
	setup(props: Props): Setup
	{
		// const { zoom } = useBlockDiagram();

		const { editFrameContent } = useEditFrameContent();
		const { isFeatureAvailable } = useFeature();

		return {
			iconSet: Outline,
			isFrameNodeStickingAvailable: isFeatureAvailable(FeatureCode.frameNodeSticking),
			editFrameContent,
			blockMediator: new BlockMediator(),
			frameBgColors: FRAME_BG_COLORS,
			frameBorderColors: FRAME_BORDER_COLORS,
			getContextMenuName,
			blockLayoutSlotNames: BLOCK_LAYOUT_SLOT_NAMES,
			// zoom,
		};
	},
	computed: {
		dragPreviewInset(): number
		{
			return this.dragPreview ? DRAG_PREVIEW_INSET : 0;
		},
		frameTextAlign(): string
		{
			return this.block?.node?.frameTextAlign ?? FRAME_TEXT_ALIGN_OPTIONS.NONE;
		},
		contextMenuItems(): Array<MenuItemOptions>
		{
			return this.blockMediator.getFrameBlockMenuOptions(this.block);
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
	methods: {
		// The handler takes the gesture on the frame body as a whole, so the neighbours inside the
		// body stop it themselves: the toolbar in entities/blocks/ui/block-layout and the title in
		// entities/blocks/ui/node-title. A double click on the text of an open editor - where it
		// selects a word - does reach here, and the entry point ignores a frame already being edited.
		onDblClick(event: MouseEvent): void
		{
			event.stopPropagation();

			this.editFrameContent(this.block.id);
		},
	},
	template: `
		<Groupable :block="block" :enabled="isFrameNodeStickingAvailable">
			<ResizableBlock
				:block="block"
				:minHeight="preparedFrameMinHeight"
				:minWidth="preparedFrameMinWith"
			>
				<template #default="{ isHighlighted, isResize, isDragged, isDisabled, isMakeNewConnection, width, height }">
					<BlockContainer
						class="bizprocdesigner-block-frame"
						:class="{ '--drag-preview': dragPreview }"
						:style="dragPreview ? { '--drag-preview-inset': dragPreviewInset + 'px' } : null"
						:highlighted="(isHighlighted || isResize) && !isDragged"
						:disabled="isDisabled"
						:hoverable="!isMakeNewConnection"
						:contextMenuItems="contextMenuItems"
						:backgroundColor="frameBgColors[block.node.frameColorName]"
						:borderColor="frameBorderColors[block.node.frameColorName]"
						@mouseup="blockMediator.handleMouseUp($event, block)"
						@mousedown="blockMediator.handleMouseDown($event)"
						@dblclick="onDblClick"
					>
						<BlockLayoutWidget
							:data-testid="$testId('bizprocdesigner-block-frame', block.id)"
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
								<ChangeEditFrameContentTopBtn :blockId="block.id"/>
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
									:width="width - 2 * dragPreviewInset"
									:height="height - 2 * dragPreviewInset"
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
		</Groupable>
	`,
};
