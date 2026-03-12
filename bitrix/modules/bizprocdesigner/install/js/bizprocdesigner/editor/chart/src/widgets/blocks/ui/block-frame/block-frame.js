import { ResizableBlock } from 'ui.block-diagram';
import { Outline } from 'ui.icon-set.api.vue';
import type { MenuItemOptions } from 'ui.vue3.components.menu';
import { isBlockActivated } from '../../../../entities/blocks/utils';
import { IconDivider, IconButton } from '../../../../shared/ui';
import {
	BlockContainer,
	BlockLayout,
	BlockTopTitle,
	ColorMenuTopBtn,
	FRAME_BG_COLORS,
	FRAME_BORDER_COLORS,
} from '../../../../entities/blocks';
import {
	DeleteBlockIconBtn,
	UpdatePublishedStatusLabel,
	ChangeFrameColorTopBtn,
} from '../../../../features/blocks';

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
		BlockTopTitle,
		DeleteBlockIconBtn,
		UpdatePublishedStatusLabel,
		IconDivider,
		IconButton,
		ColorMenuTopBtn,
		ChangeFrameColorTopBtn,
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
		};
	},
	data(): { isOpenedTopMenu: boolean }
	{
		return {
			isOpenedTopMenu: false,
		};
	},
	computed: {
		isBlockActivated(): boolean
		{
			return isBlockActivated(this.block);
		},
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
			<template #default="{ isHighlighted, isResize, isDragged, isDisabled, isMakeNewConnection }">
				<BlockContainer
					:highlighted="isHighlighted && !isDragged && !isResize"
					:disabled="isDisabled"
					:deactivated="!isBlockActivated"
					:hoverable="!isMakeNewConnection"
					:contextMenuItems="contextMenuItems"
					:backgroundColor="frameBgColors[block.node.frameColorName]"
					:borderColor="frameBorderColors[block.node.frameColorName]"
				>
					<BlockLayout
						:block="block"
						:moreMenuItems="contextMenuItems"
						:dragged="isDragged"
						:resized="isResize"
						:disabled="isDisabled"
						:isActivationVisible="false"
						:hoverable="!isMakeNewConnection"
						:topMenuOpened="isOpenedTopMenu"
					>
						<template #top-menu-title>
							<BlockTopTitle :title="block.node.title"/>
						</template>

						<template #top-menu>
							<DeleteBlockIconBtn
								:blockId="block.id"
								:disabled="isDisabled"
								@deletedBlock="blockMediator.hideCurrentBlockSettings($event)"
							/>
							<IconDivider/>
							<ChangeFrameColorTopBtn
								:block="block"
								@update:open="isOpenedTopMenu = $event"
							/>
						</template>

						<template #default>
						</template>

						<template #status>
							<UpdatePublishedStatusLabel :block="block"/>
						</template>
					</BlockLayout>
				</BlockContainer>
			</template>
		</ResizableBlock>
	`,
};
