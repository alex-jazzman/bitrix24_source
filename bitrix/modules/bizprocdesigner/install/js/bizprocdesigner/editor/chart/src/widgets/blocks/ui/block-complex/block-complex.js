import type { MenuItemOptions } from 'ui.vue3.components.menu';

import { MoveableBlock } from 'ui.block-diagram';
import { Outline } from 'ui.icon-set.api.vue';

import { IconDivider, IconButton } from '../../../../shared/ui';
import {
	BlockContainer,
	BlockLayout,
	BlockHeader,
	BlockIcon,
	BlockComplexContent,
	BlockComplexPortPlaceholder,
	PortsInOutCenter,
	BlockTopTitle,
} from '../../../../entities/blocks';
import { DeleteBlockIconBtn, UpdatePublishedStatusLabel } from '../../../../features/blocks';
import { isBlockActivated, getBlockUserTitle } from '../../../../entities/blocks/utils';

import { BlockMediator } from '../../lib';

import type { Block, BlockId } from '../../../../shared/types';

type Props = {
	block: Block,
};

type Setup = {
	iconSet: { [string]: string },
	blockMediator: BlockMediator,
};

// @vue/component
export const BlockComplex = {
	name: 'block-complex',
	components: {
		MoveableBlock,
		BlockContainer,
		BlockLayout,
		BlockHeader,
		BlockIcon,
		DeleteBlockIconBtn,
		IconDivider,
		IconButton,
		PortsInOutCenter,
		BlockComplexContent,
		BlockComplexPortPlaceholder,
		UpdatePublishedStatusLabel,
		BlockTopTitle,
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
		};
	},
	computed:
	{
		isBlockActivated(): boolean
		{
			return isBlockActivated(this.block);
		},
		userTitle(): ?string
		{
			return getBlockUserTitle(this.block);
		},
		contextMenuItems(): Array<MenuItemOptions>
		{
			return this.blockMediator.getCommonBlockMenuOptions(this.block);
		},
	},
	methods:
	{
		onAddRulePort(title: string): void
		{
			this.blockMediator.addComplexBlockPort(this.block, title);
		},
		onDeletedBlock(blockId: BlockId): void
		{
			this.blockMediator.hideCurrentBlockSettings(blockId);
			if (this.blockMediator.isCurrentComplexBlock(blockId))
			{
				this.blockMediator.resetComplexBlockSettings();
			}
		},
	},
	template: `
		<MoveableBlock :block="block">
			<template #default="{ isHighlighted, isDragged, isDisabled, isMakeNewConnection }">
				<BlockContainer
					:width="200"
					:contextMenuItems="contextMenuItems"
					:highlighted="isHighlighted && !isDragged"
					:disabled="isDisabled"
					:deactivated="!isBlockActivated"
					:hoverable="!isMakeNewConnection"
					@dblclick.stop="blockMediator.showNodeSettings(block)"
				>
					<BlockLayout
						:block="block"
						:moreMenuItems="contextMenuItems"
						:dragged="isDragged"
						:disabled="isDisabled"
						:hoverable="!isMakeNewConnection"
					>
						<template #top-menu-title>
							<BlockTopTitle
								:title="userTitle"
								:description="block.activity.Properties.EditorComment"
							/>
						</template>
						<template #top-menu>
							<DeleteBlockIconBtn
								:blockId="block.id"
								:disabled="isDisabled"
								@deletedBlock="onDeletedBlock($event)"
							/>
							<IconDivider/>
						</template>

						<template #default>
							<BlockComplexContent
								:block="block"
								:ports="blockMediator.getComplexBlockPorts(block)"
								:title="blockMediator.getComplexBlockTitle(block)"
								:disabled="isDisabled"
							>
								<template #header="{ title }">
									<BlockHeader
										:block="block"
										:title="title"
									>
										<template #icon>
											<BlockIcon
												:iconName="block.node.icon"
												:iconColorIndex="block.node.colorIndex"
											/>
										</template>
									</BlockHeader>
								</template>
								<template #portPlaceholder="{ ports }">
									<BlockComplexPortPlaceholder
										:blockId="block.id"
										:ports="ports"
										@addPort="onAddRulePort($event)"
									/>
								</template>
							</BlockComplexContent>
						</template>

						<template #status>
							<UpdatePublishedStatusLabel :block="block"/>
						</template>
					</BlockLayout>
				</BlockContainer>
			</template>
		</MoveableBlock>
	`,
};
