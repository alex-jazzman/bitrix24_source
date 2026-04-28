import { MoveableBlock } from 'ui.block-diagram';
import type { MenuItemOptions } from 'ui.system.menu';
import { inject } from 'ui.vue3';
import { Outline } from 'ui.icon-set.api.vue';
import { isBlockActivated, getBlockUserTitle } from '../../../../entities/blocks/utils';
import { IconDivider, IconButton } from '../../../../shared/ui';
import type { Block } from '../../../../shared/types';
import {
	BlockLayout,
	BlockHeader,
	BlockIcon,
	PortsInOutCenter,
	BlockSwitcher,
	BlockTopTitle,
} from '../../../../entities/blocks';
import {
	AutosizeBlockContainer,
	DeleteBlockIconBtn,
	UpdatePublishedStatusLabel,
} from '../../../../features/blocks';

import { BlockMediator } from '../../lib';

type BlockTriggerSetup = {
	iconSet: { [string]: string };
	blockMediator: BlockMediator,
	toggleBlock: () => void;
};

type Props = {
	block: Block,
	autosize: boolean,
};

// @vue/component
export const BlockTrigger = {
	name: 'BlockTrigger',
	components: {
		MoveableBlock,
		AutosizeBlockContainer,
		BlockLayout,
		BlockHeader,
		BlockIcon,
		DeleteBlockIconBtn,
		UpdatePublishedStatusLabel,
		IconDivider,
		IconButton,
		PortsInOutCenter,
		BlockSwitcher,
		BlockTopTitle,
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
	setup(props: Props): BlockTriggerSetup
	{
		const onToggleBlockActivation = inject('onToggleBlockActivation');
		function toggleBlock(): void
		{
			if (!onToggleBlockActivation)
			{
				console.warn('onToggleBlockActivation is not provided');

				return;
			}

			onToggleBlockActivation(props.block.id);
		}

		return {
			iconSet: Outline,
			blockMediator: new BlockMediator(),
			toggleBlock,
		};
	},
	computed: {
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
	template: `
		<MoveableBlock :block="block">
			<template #default="{ isHighlighted, isDragged, isDisabled, isMakeNewConnection }">
				<AutosizeBlockContainer
					:blockId="block.id"
					:autosize="autosize"
					:width="block.dimensions.width"
					:height="block.dimensions.height"
					:highlighted="isHighlighted && !isDragged"
					:disabled="isDisabled"
					:deactivated="!isBlockActivated"
					:hoverable="!isMakeNewConnection"
					:contextMenuItems="contextMenuItems"
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
								@deletedBlock="blockMediator.hideCurrentBlockSettings($event)"
							/>
							<IconDivider/>
						</template>

						<template #default>
							<PortsInOutCenter
								:block="block"
								:disabled="isDisabled"
								hideInputPorts
							>
								<BlockHeader :block="block">
									<template #icon>
										<BlockIcon
											:iconName="block.node.icon"
											:iconColorIndex="block.node.colorIndex"
										/>
									</template>
								</BlockHeader>
							</PortsInOutCenter>
						</template>

						<template #left>
							<BlockSwitcher
								:on="isBlockActivated"
								@click="toggleBlock"
							/>
						</template>

						<template #status>
							<UpdatePublishedStatusLabel :block="block"/>
						</template>
					</BlockLayout>
				</AutosizeBlockContainer>
			</template>
		</MoveableBlock>
	`,
};
