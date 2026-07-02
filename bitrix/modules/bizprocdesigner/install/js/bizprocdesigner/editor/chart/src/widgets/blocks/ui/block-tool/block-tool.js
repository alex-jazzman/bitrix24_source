import { MoveableBlock, PORT_POSITION } from 'ui.block-diagram';
import { Outline } from 'ui.icon-set.api.vue';
import type { MenuItemOptions } from 'ui.vue3.components.menu';
import { IconDivider, IconButton } from '../../../../shared/ui';
import { PORT_TYPES } from '../../../../shared/constants';
import {
	BlockContainer,
	BlockHeader,
	BlockIcon,
	BlockToolSubIcon,
	BlockToolIcon,
	PortsLayout,
	PortAux,
	BLOCK_LAYOUT_SLOT_NAMES,
} from '../../../../entities/blocks';
import {
	DeleteBlockIconBtn,
	UpdatePublishedStatusLabel,
	ChangeActivationTopBtn,
} from '../../../../features/blocks';
import { BlockLayoutWidget } from '../block-layout/block-layout';
import { BlockTopTitleWidget } from '../block-top-title/block-top-title';

import type { Block } from '../../../../shared/types';

import { BlockMediator } from '../../lib';

type BlockToolSetup = {
	iconSet: { [string]: string };
	blockMediator: BlockMediator;
};

type Props = {
	block: Block,
};

const BLOCK_ICON_NAMES = {
	DATABASE: 'DATABASE',
	MCP_LETTERS: 'MCP_LETTERS',
};

// @vue/component
export const BlockTool = {
	name: 'BlockTool',
	components: {
		MoveableBlock,
		BlockContainer,
		BlockLayoutWidget,
		BlockHeader,
		BlockIcon,
		BlockToolSubIcon,
		BlockToolIcon,
		DeleteBlockIconBtn,
		UpdatePublishedStatusLabel,
		IconDivider,
		IconButton,
		PortsLayout,
		PortAux,
		BlockTopTitleWidget,
		ChangeActivationTopBtn,
	},
	props: {
		/** @type Block */
		block: {
			type: Object,
			required: true,
		},
	},
	setup(props: Props): BlockToolSetup
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
		headerBlockIconName(): string
		{
			return this.block.node.icon === BLOCK_ICON_NAMES.DATABASE
				? this.block.node.icon
				: BLOCK_ICON_NAMES.MCP_LETTERS;
		},
		isShowSubIcon(): boolean
		{
			const iconName = this.block.node?.icon ?? null;

			return iconName && iconName !== BLOCK_ICON_NAMES.DATABASE;
		},
	},
	template: `
		<MoveableBlock :block="block">
			<template #default="{ isHighlighted, isDragged, isDisabled, isMakeNewConnection }">
				<BlockContainer
					:block="block"
					:width="300"
					:height="58"
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

							<template #[blockLayoutSlotNames.DEFAULT]>
								<PortsLayout
									:block="block"
									:topPortTypes="portTypes.topAux"
									:bottomPortTypes="portTypes.aux"
									:leftPortTypes="portTypes.input"
									:rightPortTypes="portTypes.output"
									:disabled="isDisabled"
								>
									<template #top="{ port, index }">
										<PortAux
											:block="block"
											:port="port"
											:index="index"
											:position="portPosition.TOP"
											:inactive="port.isActive === false"
										/>
									</template>

									<template #default>
										<BlockHeader
											:block="block"
											:deactivated="!isBlockActivated"
										>
											<template #icon>
												<BlockToolIcon
													:iconName="block.node.icon"
													:deactivated="!isBlockActivated"
												/>
											</template>

											<template #subIcon>
												<BlockToolSubIcon
													v-if="block.node?.icon && block.node.icon !== 'DATABASE'"
													:icon="block.node.icon"
													:deactivated="!isBlockActivated"
												/>
											</template>
										</BlockHeader>
									</template>
								</PortsLayout>
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
