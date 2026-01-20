import { MoveableBlock } from 'ui.block-diagram';
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
} from '../../../../entities/blocks';
import {
	AutosizeBlockContainer,
	DeleteBlockIconBtn,
	UpdatePublishedStatusLabel,
} from '../../../../features/blocks';

import { BlockMediator } from '../../lib';

type BlockSimpleSetup = {
	iconSet: { [string]: string };
	onOpenBlockSettings: (event: MouseEvent) => void;
};

// @vue/component
export const BlockSimple = {
	name: 'BlockSimple',
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
	setup(props): BlockSimpleSetup
	{
		return {
			iconSet: Outline,
			blockMediator: new BlockMediator(),
		};
	},
	template: `
		<MoveableBlock :block="block">
			<template #default="{ isHighlighted, isDragged, isDisabled, isActivated }">
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

						<template #status>
							<UpdatePublishedStatusLabel :block="block"/>
						</template>
					</BlockLayout>
				</AutosizeBlockContainer>
			</template>
		</MoveableBlock>
	`,
};
