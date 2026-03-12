import { MoveableBlock } from 'ui.block-diagram';
import { Outline } from 'ui.icon-set.api.vue';
import type { MenuItemOptions } from 'ui.vue3.components.menu';
import { isBlockActivated, getBlockUserTitle } from '../../../../entities/blocks/utils';
import { IconDivider, IconButton } from '../../../../shared/ui';
import {
	BlockLayout,
	BlockHeader,
	BlockIcon,
	PortsInOutCenter,
	BlockTopTitle,
} from '../../../../entities/blocks';
import {
	AutosizeBlockContainer,
	DeleteBlockIconBtn,
	UpdatePublishedStatusLabel,
} from '../../../../features/blocks';

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
	setup(props: Props): BlockSimpleSetup
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
			<template #default="{ isHighlighted, isDragged, isDisabled, isActivated, isMakeNewConnection }">
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
