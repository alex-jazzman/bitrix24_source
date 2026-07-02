import { MoveableBlock, PORT_POSITION } from 'ui.block-diagram';
import type { MenuItemOptions } from 'ui.system.menu';
import { Outline } from 'ui.icon-set.api.vue';
import { getBlockUserTitle } from '../../../../entities/blocks/utils';
import { IconDivider, IconButton } from '../../../../shared/ui';
import { PORT_TYPES } from '../../../../shared/constants';
import type { Block } from '../../../../shared/types';
import {
	BlockContainer,
	BlockHeader,
	BlockIcon,
	PortsLayout,
	PortInout,
	BLOCK_LAYOUT_SLOT_NAMES,
} from '../../../../entities/blocks';
import {
	AutosizeBlockContainer,
	DeleteBlockIconBtn,
	UpdatePublishedStatusLabel,
	ChangeActivationTopBtn,
	ChangeActivationBlockSwitcher,
} from '../../../../features/blocks';
import { BlockLayoutWidget } from '../block-layout/block-layout';
import { BlockTopTitleWidget } from '../block-top-title/block-top-title';

import { BlockMediator } from '../../lib';

type BlockTriggerSetup = {
	iconSet: { [string]: string };
	blockMediator: BlockMediator,
	toggleBlock: () => void;
};

type Props = {
	block: Block,
};

// @vue/component
export const BlockTrigger = {
	name: 'BlockTrigger',
	components: {
		MoveableBlock,
		AutosizeBlockContainer,
		BlockContainer,
		BlockLayoutWidget,
		BlockHeader,
		BlockIcon,
		DeleteBlockIconBtn,
		UpdatePublishedStatusLabel,
		IconDivider,
		IconButton,
		PortsLayout,
		PortInout,
		BlockTopTitleWidget,
		ChangeActivationTopBtn,
		ChangeActivationBlockSwitcher,
	},
	props: {
		/** @type Block */
		block: {
			type: Object,
			required: true,
		},
	},
	setup(props: Props): BlockTriggerSetup
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
		userTitle(): ?string
		{
			return getBlockUserTitle(this.block);
		},
		contextMenuItems(): Array<MenuItemOptions>
		{
			return this.blockMediator.getCommonBlockMenuOptions(this.block);
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
									:rightPortTypes="portTypes.output"
									:disabled="isDisabled"
								>
									<template #right="{ port, index }">
										<PortInout
											:block="block"
											:port="port"
											:index="index"
											:position="portPosition.RIGHT"
										/>
									</template>

									<template #default>
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
								</PortsLayout>
							</template>

							<template #[blockLayoutSlotNames.LEFT]>
								<ChangeActivationBlockSwitcher :block="block"/>
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
