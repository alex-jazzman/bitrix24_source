import type { MenuItemOptions } from 'ui.vue3.components.menu';

import { MoveableBlock, Port } from 'ui.block-diagram';
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
import { isBlockActivated, getBlockUserTitle, validationInputOutputRule, normalyzeInputOutputConnection } from '../../../../entities/blocks/utils';

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
		Port,
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
			validationInputOutputRule,
			normalyzeInputOutputConnection,
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
		onAddPort(title: string): void
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
					@mouseup="blockMediator.handleMouseUp($event, block)"
					@mousedown="blockMediator.handleMouseDown($event)"
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
								<template #portPlaceholder="{ item, isOutput }">
									<BlockComplexPortPlaceholder
										:title="item.title"
										:isOutput="isOutput"
										@addPort="onAddPort($event)"
									/>
								</template>
								<template #port="{ item, disabled, position, index }">
									<Port
										:block="block"
										:port="item"
										:index="index"
										:disabled="disabled"
										:validationRules="[validationInputOutputRule]"
										:normalyzeConnectionFn="normalyzeInputOutputConnection"
										:position="position"
									/>
									<span class="block-complex__content_col-value-text">
										{{ item.title }}
									</span>
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
