import { MoveableBlock } from 'ui.block-diagram';
import { inject } from 'ui.vue3';
import { Outline } from 'ui.icon-set.api.vue';
import { isBlockActivated } from '../../../../entities/blocks/utils';
import { IconDivider, IconButton } from '../../../../shared/ui';
// eslint-disable-next-line no-unused-vars
import type { Block, BlockId } from '../../../../shared/types';
import {
	BlockLayout,
	BlockHeader,
	BlockIcon,
	PortsInOutCenter,
	BlockSwitcher,
} from '../../../../entities/blocks';
import {
	AutosizeBlockContainer,
	DeleteBlockIconBtn,
	UpdatePublishedStatusLabel,
} from '../../../../features/blocks';

import { BlockMediator } from '../../lib';

type BlockTriggerSetup = {
	iconSet: { [string]: string };
	onOpenBlockSettings: (event: MouseEvent) => void;
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
	computed: {
		isBlockActivated(): boolean
		{
			return isBlockActivated(this.block);
		}
	},
	setup(props): BlockTriggerSetup
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
	template: `
		<MoveableBlock :block="block">
			<template #default="{ isHighlighted, isDragged, isDisabled }">
				<AutosizeBlockContainer
					:blockId="block.id"
					:autosize="autosize"
					:width="block.dimensions.width"
					:height="block.dimensions.height"
					:highlighted="isHighlighted"
					:disabled="isDisabled"
					:deactivated="!isBlockActivated"
					:contextMenuItems="[
						blockMediator.getCtxMenuItemShowSimpleSettings(block),
						blockMediator.getCtxMenuItemDeleteBlock(block),
					]"
					@dblclick.stop="blockMediator.showNodeSettings(block)"
				>
					<BlockLayout
						:block="block"
						:moreMenuItems="[
							blockMediator.getCtxMenuItemShowSimpleSettings(block),
							blockMediator.getCtxMenuItemDeleteBlock(block),
						]"
						:dragged="isDragged"
						:disabled="isDisabled"
					>
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
				</AutosizeBlockContainer
					:blockId="block.id"
					:autosize="block.node.autosize"
					:width="block.dimensions.width"
					:height="block.dimensions.height">
			</template>
		</MoveableBlock>
	`,
};
