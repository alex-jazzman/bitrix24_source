import { ResizableBlock } from 'ui.block-diagram';
import { Outline } from 'ui.icon-set.api.vue';
import { isBlockActivated } from '../../../../entities/blocks/utils';
import { IconDivider, IconButton } from '../../../../shared/ui';
// eslint-disable-next-line no-unused-vars
import type { Block, BlockId } from '../../../../shared/types';
import {
	BlockContainer,
	BlockLayout,
	BlockTopTitle,
} from '../../../../entities/blocks';
import {
	DeleteBlockIconBtn,
	UpdatePublishedStatusLabel,
} from '../../../../features/blocks';

import { BlockMediator } from '../../lib';

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
	},
	props: {
		/** @type Block */
		block: {
			type: Object,
			required: true,
		},
	},
	setup(props): {...}
	{
		return {
			iconSet: Outline,
			blockMediator: new BlockMediator(),
		};
	},
	computed: {
		isBlockActivated(): boolean
		{
			return isBlockActivated(this.block);
		}
	},
	template: `
		<ResizableBlock :block="block">
			<template #default="{ isHighlighted, isResize, isDragged, isDisabled }">
				<BlockContainer
					:highlighted="isHighlighted"
					:disabled="isDisabled"
					:deactivated="!isBlockActivated"
					:contextMenuItems="[
						blockMediator.getCtxMenuItemDeleteBlock(block)
					]"
					colorName="orange"
				>
					<BlockLayout
						:block="block"
						:moreMenuItems="[
							blockMediator.getCtxMenuItemDeleteBlock(block)
						]"
						:dragged="isDragged"
						:resized="isResize"
						:disabled="isDisabled"
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
							<IconButton :icon-name="iconSet.PAUSE_L"/>
							<IconButton :icon-name="iconSet.QUESTION"/>
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
