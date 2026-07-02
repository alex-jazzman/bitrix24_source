import { MoveableBlock, PORT_POSITION } from 'ui.block-diagram';
import { Outline } from 'ui.icon-set.api.vue';
import type { MenuItemOptions } from 'ui.vue3.components.menu';
import { IconDivider, IconButton } from '../../../../shared/ui';
import { PORT_TYPES } from '../../../../shared/constants';
import {
	BlockContainer,
	BlockHeader,
	BlockIcon,
	PortsLayout,
	PortInout,
	PortAux,
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

type BlockSimpleSetup = {
	iconSet: { [string]: string };
	blockMediator: BlockMediator;
};

type Props = {
	block: Block,
};

// @vue/component
export const BlockSimple = {
	name: 'BlockSimple',
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
		PortInout,
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
	setup(props: Props): BlockSimpleSetup
	{
		return {
			iconSet: Outline,
			blockMediator: new BlockMediator(),
			portTypes: PORT_TYPES,
			portPosition: PORT_POSITION,
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
							<template #top-menu-title>
								<BlockTopTitleWidget :block="block"/>
							</template>

							<template #top-menu>
								<DeleteBlockIconBtn
									:blockId="block.id"
									:disabled="isDisabled"
									@deletedBlock="blockMediator.hideCurrentBlockSettings($event)"
								/>
								<IconDivider/>
								<ChangeActivationTopBtn :block="block"/>
							</template>

							<template #default>
								<PortsLayout
									:block="block"
									:leftPortTypes="portTypes.input"
									:rightPortTypes="portTypes.output"
									:bottomPortTypes="portTypes.aux"
									:disabled="isDisabled"
								>
									<template #left="{ port, index }">
										<PortInout
											:block="block"
											:port="port"
											:index="index"
											:position="portPosition.LEFT"
										/>
									</template>

									<template #right="{ port, index }">
										<PortInout
											:block="block"
											:port="port"
											:index="index"
											:position="portPosition.RIGHT"
										/>
									</template>

									<template #bottom="{ port, index }">
										<PortAux
											:block="block"
											:port="port"
											:index="index"
											:position="portPosition.BOTTOM"
											:inactive="port.isActive === false"
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

							<template #status>
								<UpdatePublishedStatusLabel :block="block"/>
							</template>
						</BlockLayoutWidget>
					</template>
				</BlockContainer>
			</template>
		</MoveableBlock>
	`,
};
