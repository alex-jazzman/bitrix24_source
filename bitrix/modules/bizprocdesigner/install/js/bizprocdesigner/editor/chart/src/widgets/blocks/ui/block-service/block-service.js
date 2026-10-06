import { MoveableBlock, PORT_POSITION } from 'ui.block-diagram';
import { Outline } from 'ui.icon-set.api.vue';
import { type MenuItemOptions } from 'ui.vue3.components.menu';
import { mapState } from 'ui.vue3.pinia';

import { IconDivider, IconButton } from '../../../../shared/ui';
import { PORT_TYPES } from '../../../../shared/constants';
import {
	BlockContainer,
	BlockHeader,
	BlockIcon,
	PortsLayout,
	PortInout,
	BlockContent,
	BLOCK_LAYOUT_SLOT_NAMES,
	shouldAnimateBlock,
	diagramStore,
	resolveConsumerContentBlock,
} from '../../../../entities/blocks';
import { useCatalogStore } from '../../../../entities/catalog/stores';
import {
	DeleteBlockIconBtn,
	UpdatePublishedStatusLabel,
	ChangeActivationTopBtn,
} from '../../../../features/blocks';
import { BlockLayoutWidget } from '../block-layout/block-layout';
import { BlockTopTitleWidget } from '../block-top-title/block-top-title';
import { type Block } from '../../../../shared/types';

import { BlockMediator } from '../../lib';

import './block-service.css';

const SETUP_TEMPLATE_ACTIVITY = 'SetupTemplateActivity';

type BlockServiceSetup = {
	iconSet: { [string]: string };
	blockMediator: BlockMediator;
};

type Props = {
	block: Block,
};

// @vue/component
export const BlockService = {
	name: 'BlockService',
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
		BlockTopTitleWidget,
		BlockContent,
		ChangeActivationTopBtn,
	},
	props: {
		/** @type Block */
		block: {
			type: Object,
			required: true,
		},
	},
	setup(props: Props): BlockServiceSetup
	{
		return {
			iconSet: Outline,
			portTypes: PORT_TYPES,
			portPosition: PORT_POSITION,
			blockMediator: new BlockMediator(),
			blockLayoutSlotNames: BLOCK_LAYOUT_SLOT_NAMES,
			shouldAnimateBlock,
		};
	},
	computed: {
		...mapState(diagramStore, ['contentBlockScope']),
		...mapState(useCatalogStore, ['contentBlockConsumers']),
		contextMenuItems(): Array<MenuItemOptions>
		{
			return this.blockMediator.getCommonBlockMenuOptions(this.block);
		},
		isSetupTemplateActivity(): boolean
		{
			return this.block.activity?.Type === SETUP_TEMPLATE_ACTIVITY;
		},
		contentBlock(): ?{ text: string }
		{
			const resolved = resolveConsumerContentBlock(
				this.block,
				this.contentBlockScope,
				this.contentBlockConsumers,
			);

			return resolved ?? this.block.activity?.ContentBlock ?? null;
		},
	},
	template: `
		<MoveableBlock :block="block">
			<template #default="{ isHighlighted, isDragged, isDisabled, isActivated, isMakeNewConnection }">
				<BlockContainer
					:block="block"
					:width="260"
					:height="isSetupTemplateActivity ? 162 : 96"
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
								<PortsLayout
									:block="block"
									:leftPortTypes="portTypes.input"
									:rightPortTypes="portTypes.output"
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
													:blockId="block.id"
													:animate="shouldAnimateBlock(block)"
												/>
											</template>
										</BlockHeader>
									</template>
								</PortsLayout>
							</template>

							<template #[blockLayoutSlotNames.DEFAULT]>
								<BlockContent
									:colorIndex="block.node.colorIndex"
									:contentBlockColor="block.node.contentBlockColor"
									:deactivated="!isBlockActivated"
									:class="{ 'editor-chart-block-service__content--large': isSetupTemplateActivity }"
								>
									<span
										v-if="contentBlock"
										class="editor-chart-block-service__content-label"
									>
										{{ contentBlock.text }}
									</span>
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
