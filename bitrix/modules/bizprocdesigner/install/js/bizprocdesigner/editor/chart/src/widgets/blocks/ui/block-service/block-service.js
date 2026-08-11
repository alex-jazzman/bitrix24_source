import { MoveableBlock, PORT_POSITION } from 'ui.block-diagram';
import { Outline } from 'ui.icon-set.api.vue';
import { type MenuItemOptions } from 'ui.vue3.components.menu';

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
	parseItemsFromBlocksJson,
	shouldAnimateBlock,
} from '../../../../entities/blocks';
import {
	DeleteBlockIconBtn,
	UpdatePublishedStatusLabel,
	ChangeActivationTopBtn,
} from '../../../../features/blocks';
import { BlockLayoutWidget } from '../block-layout/block-layout';
import { BlockTopTitleWidget } from '../block-top-title/block-top-title';
import { useLoc } from '../../../../shared/composables';
import { type Block } from '../../../../shared/types';

import { BlockMediator } from '../../lib';

import './block-service.css';

const SETUP_TEMPLATE_ACTIVITY = 'SetupTemplateActivity';

type BlockServiceSetup = {
	iconSet: { [string]: string };
	blockMediator: BlockMediator;
	getMessage: Function;
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
		const { getMessage } = useLoc();

		return {
			iconSet: Outline,
			portTypes: PORT_TYPES,
			portPosition: PORT_POSITION,
			blockMediator: new BlockMediator(),
			blockLayoutSlotNames: BLOCK_LAYOUT_SLOT_NAMES,
			getMessage,
			shouldAnimateBlock,
		};
	},
	computed: {
		contextMenuItems(): Array<MenuItemOptions>
		{
			return this.blockMediator.getCommonBlockMenuOptions(this.block);
		},
		isSetupTemplateActivity(): boolean
		{
			return this.block.activity?.Type === SETUP_TEMPLATE_ACTIVITY;
		},
		constantsCount(): number
		{
			if (!this.isSetupTemplateActivity)
			{
				return 0;
			}

			const items = parseItemsFromBlocksJson(this.block.activity?.Properties?.blocks);

			return items.filter((item) => item?.itemType === 'constant').length;
		},
		hasConstants(): boolean
		{
			return this.constantsCount > 0;
		},
		constantsLabel(): string
		{
			return this.getMessage(
				'BIZPROCDESIGNER_EDITOR_BLOCK_SERVICE_CONSTANTS_COUNT',
				{ '#count#': this.constantsCount },
			);
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
										v-if="hasConstants"
										class="editor-chart-block-service__constants-label"
									>
										{{ constantsLabel }}
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
