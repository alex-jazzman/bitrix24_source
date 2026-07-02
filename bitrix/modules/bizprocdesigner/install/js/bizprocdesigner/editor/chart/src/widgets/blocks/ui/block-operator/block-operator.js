import { MoveableBlock, PORT_POSITION } from 'ui.block-diagram';
import { Outline } from 'ui.icon-set.api.vue';
import type { MenuItemOptions } from 'ui.vue3.components.menu';
import { IconDivider, IconButton } from '../../../../shared/ui';
import {
	BlockContainer,
	BlockHeader,
	BlockIcon,
	PortsLayout,
	BlockContent,
	PortsGrid,
	PortInout,
	BLOCK_LAYOUT_SLOT_NAMES,
} from '../../../../entities/blocks';
import {
	DeleteBlockIconBtn,
	UpdatePublishedStatusLabel,
	ChangeActivationTopBtn,
} from '../../../../features/blocks';
import { PORT_TYPES } from '../../../../shared/constants';
import { BlockLayoutWidget } from '../block-layout/block-layout';
import { BlockTopTitleWidget } from '../block-top-title/block-top-title';
import type { Block } from '../../../../shared/types';

import { BlockMediator } from '../../lib';

type BlockSimpleSetup = {
	iconSet: { [string]: string };
	blockMediator: BlockMediator;
};

type Props = {
	block: Block,
	autosize: boolean,
};

// @vue/component
export const BlockOperator = {
	name: 'BlockOperator',
	components: {
		MoveableBlock,
		BlockContainer,
		BlockLayoutWidget,
		BlockHeader,
		BlockIcon,
		DeleteBlockIconBtn,
		UpdatePublishedStatusLabel,
		IconDivider,
		IconButton,
		PortsLayout,
		BlockTopTitleWidget,
		BlockContent,
		PortsGrid,
		PortInout,
		ChangeActivationTopBtn,
	},
	props: {
		/** @type Block */
		block: {
			type: Object,
			required: true,
		},
		autosize: {
			type: Boolean,
			default: false,
		},
	},
	setup(props: Props): BlockSimpleSetup
	{
		return {
			iconSet: Outline,
			blockMediator: new BlockMediator(),
			portTypes: PORT_TYPES,
			portPosition: PORT_POSITION,
			blockLayoutSlotNames: BLOCK_LAYOUT_SLOT_NAMES,
		};
	},
	computed: {
		contextMenuItems(): Array<MenuItemOptions>
		{
			return this.blockMediator.getCommonBlockMenuOptions(this.block);
		},
	},
	template: `
		<MoveableBlock :block="block">
			<template #default="{ isHighlighted, isDragged, isDisabled, isActivated, isMakeNewConnection }">
				<BlockContainer
					:block="block"
					:width="180"
					:highlighted="isHighlighted && !isDragged"
					:disabled="isDisabled"
					:hoverable="!isMakeNewConnection"
					:contextMenuItems="contextMenuItems"
					@mouseup="blockMediator.handleMouseUp($event, block)"
					@mousedown="blockMediator.handleMouseDown($event)"
				>
					<template #default="{ isBlockActivated }">
						<BlockLayoutWidget
							:block="block"
							:moreMenuItems="contextMenuItems"
							:dragged="isDragged"
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
								<ChangeActivationTopBtn :block="block"/>
							</template>

							<template #[blockLayoutSlotNames.HEADER]>
								<BlockHeader
									:block="block"
									:deactivated="!isBlockActivated"
								>
									<template #icon>
										<BlockIcon
											:iconName="block.node.icon"
											:iconColorIndex="block.node.colorIndex"
											:deactivated="!isBlockActivated"
										/>
									</template>
								</BlockHeader>
							</template>

							<template #[blockLayoutSlotNames.DEFAULT]>
								<BlockContent :deactivated="!isBlockActivated">
									<PortsGrid
										:block="block"
										:leftTypes="portTypes.input"
										:rightTypes="portTypes.output"
									>
										<template #portLeft="{ port, index }">
											<PortInout
												:block="block"
												:port="port"
												:index="index"
												:position="portPosition.LEFT"
											/>
										</template>

										<template #portRight="{ port, index }">
											<PortInout
												:block="block"
												:port="port"
												:index="index"
												:position="portPosition.RIGHT"
											/>
										</template>
									</PortsGrid>
								</BlockContent>
							</template>

							<template #[blockLayoutSlotNames.STATUS]>
								<UpdatePublishedStatusLabel :block="block"/>
							</template>
						</BlockLayoutWidget>
					</template>
				</BlockContainer>
			</template>
		</MoveableBlock>
	`,
};
