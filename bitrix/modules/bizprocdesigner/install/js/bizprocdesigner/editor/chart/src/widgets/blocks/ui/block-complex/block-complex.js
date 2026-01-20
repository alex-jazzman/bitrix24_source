import { mapActions } from 'ui.vue3.pinia';

import { MoveableBlock } from 'ui.block-diagram';
import { Outline } from 'ui.icon-set.api.vue';

import { IconDivider, IconButton } from '../../../../shared/ui';
import {
	BlockContainer,
	BlockLayout,
	BlockHeader,
	BlockIcon,
	BlockComplexContent,
	PortsInOutCenter,
} from '../../../../entities/blocks';
import { DeleteBlockIconBtn, AddComplexBlockPort, UpdatePublishedStatusLabel } from '../../../../features/blocks';
import { useNodeSettingsStore } from '../../../../entities/node-settings';
import { isBlockActivated } from '../../../../entities/blocks/utils';

import { BlockMediator } from '../../lib';

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
		AddComplexBlockPort,
		UpdatePublishedStatusLabel,
	},
	props: {
		/** @type Block */
		block: {
			type: Object,
			required: true,
		},
	},
	setup(props): {...}
	{
		return {
			iconSet: Outline,
			blockMediator: new BlockMediator(),
		};
	},
	methods:
	{

		...mapActions(useNodeSettingsStore, ['fetchNodeSettings', 'toggleVisibility']),
		onBlockDblClick(): void
		{
			this.toggleVisibility(true);
			this.fetchNodeSettings(this.block);
		},
	},
	computed: {
		isBlockActivated(): boolean
		{
			return isBlockActivated(this.block);
		}
	},
	template: `
		<MoveableBlock :block="block">
			<template #default="{ isHighlighted, isDragged, isDisabled }">
				<BlockContainer
					:width="200"
					:contextMenuItems="[
						blockMediator.getCtxMenuItemShowComplexSettings(block),
						blockMediator.getCtxMenuItemDeleteBlock(block),
					]"
					:highlighted="isHighlighted"
					:disabled="isDisabled"
					:deactivated="!isBlockActivated"
					@dblclick.stop="blockMediator.showNodeSettings(block)"
				>
					<BlockLayout
						:block="block"
						:moreMenuItems="[
							blockMediator.getCtxMenuItemShowComplexSettings(block),
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
							<BlockComplexContent
								:block="block"
								:disabled="isDisabled"
							>
								<template #header>
									<BlockHeader :block="block">
										<template #icon>
											<BlockIcon
												:iconName="block.node.icon"
												:iconColorIndex="block.node.colorIndex"
											/>
										</template>
									</BlockHeader>
								</template>
								<!--
								<template #addPortPoint="{ position }">
									<AddComplexBlockPort
										:position="position"
										:highlighted="isHighlighted"
									/>
								</template>
								-->
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
