import type { MenuItemOptions } from 'ui.vue3.components.menu';

import { MoveableBlock, Port } from 'ui.block-diagram';

import { IconDivider, IconButton } from '../../../../shared/ui';
import {
	BlockContainer,
	BlockLayout,
	BlockHeader,
	BlockIcon,
	BlockComplexContent,
	BlockComplexPortPlaceholder,
	PortsLayout,
	BlockTopTitle,
} from '../../../../entities/blocks';
import {
	getBlockUserTitle,
	validationInputOutputRule,
	normalyzeInputOutputConnection,
	validationAuxRule,
	normalyzeAuxConnection,
} from '../../../../entities/blocks';
import {
	DeleteBlockIconBtn,
	UpdatePublishedStatusLabel,
	ChangeActivationTopBtn,
} from '../../../../features/blocks';
import { BlockLayoutWidget } from '../block-layout/block-layout';

import { BlockMediator } from '../../lib';

import { PORT_TYPES } from '../../../../shared/constants';
import type { Block, BlockId } from '../../../../shared/types';

const MAX_AUX_COUNT = 5;
const DEFAULT_BLOCK_WIDTH = 200;

import { useLoc } from '../../../../shared/composables';

type Props = {
	block: Block,
};

type Setup = {
	blockMediator: BlockMediator,
	getMessage: () => string,
};

// @vue/component
export const BlockComplex = {
	name: 'block-complex',
	components: {
		MoveableBlock,
		BlockContainer,
		BlockLayout,
		BlockLayoutWidget,
		BlockHeader,
		BlockIcon,
		DeleteBlockIconBtn,
		IconDivider,
		IconButton,
		PortsLayout,
		BlockComplexContent,
		BlockComplexPortPlaceholder,
		UpdatePublishedStatusLabel,
		BlockTopTitle,
		Port,
		ChangeActivationTopBtn,
	},
	props: {
		/** @type Block */
		block: {
			type: Object,
			required: true,
		},
	},
	setup(props: Props): Setup
	{
		const { getMessage } = useLoc();

		return {
			blockMediator: new BlockMediator(),
			validationInputOutputRule,
			normalyzeInputOutputConnection,
			validationAuxRule,
			normalyzeAuxConnection,
			getMessage,
		};
	},
	computed:
	{
		userTitle(): ?string
		{
			return getBlockUserTitle(this.block);
		},
		auxPortsCount(): number
		{
			return this.block.ports.filter((port) => port.type === PORT_TYPES.aux).length;
		},
		blockWidth(): number
		{
			return this.block.dimensions?.width ?? DEFAULT_BLOCK_WIDTH;
		},
		contextMenuItems(): Array<MenuItemOptions>
		{
			return this.blockMediator.getCommonBlockMenuOptions(this.block);
		},
	},
	methods:
	{
		onAddPort(title: string): void
		{
			this.blockMediator.addComplexBlockPort(this.block, title);
		},
		onAddAuxPort(title: string): void
		{
			if (this.auxPortsCount >= MAX_AUX_COUNT)
			{
				return;
			}

			this.blockMediator.addAuxPort(this.block, title);
		},
		onDeletedBlock(blockId: BlockId): void
		{
			this.blockMediator.hideCurrentBlockSettings(blockId);
			if (this.blockMediator.isCurrentComplexBlock(blockId))
			{
				this.blockMediator.resetComplexBlockSettings();
			}
		},
	},
	template: `
		<MoveableBlock :block="block">
			<template #default="{ isHighlighted, isDragged, isDisabled, isMakeNewConnection }">
				<BlockContainer
					:block="block"
					:width="blockWidth"
					:contextMenuItems="contextMenuItems"
					:highlighted="isHighlighted && !isDragged"
					:disabled="isDisabled"
					:hoverable="!isMakeNewConnection"
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
								<BlockTopTitle
									:title="userTitle"
									:description="block.activity.Properties.EditorComment"
								/>
							</template>
							<template #top-menu>
								<DeleteBlockIconBtn
									:blockId="block.id"
									:disabled="isDisabled"
									@deletedBlock="onDeletedBlock($event)"
								/>
								<IconDivider/>
								<ChangeActivationTopBtn :block="block"/>
							</template>

							<template #header>
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

							<template #default>
								<BlockComplexContent
									:block="block"
									:ports="blockMediator.getComplexBlockPorts(block)"
									:title="blockMediator.getComplexBlockTitle(block)"
									:disabled="isDisabled"
									:deactivated="!isBlockActivated"
								>
									<template #header="{ title }">
									</template>
									<template #portPlaceholder="{ item, isOutput }">
										<BlockComplexPortPlaceholder
											:title="item.title"
											:isOutput="isOutput"
											@addPort="onAddPort($event)"
										/>
									</template>
									<template #port="{ item, disabled, position, index }">
										<Port
											:block="block"
											:port="item"
											:index="index"
											:disabled="disabled"
											:validationRules="[validationInputOutputRule]"
											:normalyzeConnectionFn="normalyzeInputOutputConnection"
											:position="position"
										/>
										<span class="block-complex__content_col-value-text">
											{{ item.title }}
										</span>
									</template>
									<template #auxSectionLabel>
										<div class="block-complex__aux-section-label">
											<span class="block-complex__aux-section-label-text">
												{{ getMessage('BIZPROCDESIGNER_EDITOR_COMPLEX_NODE_AUX_LAYOUT_TITLE') }}
											</span>
										</div>
									</template>
									<template #auxPort="{ item, index }">
										<Port
											:block="block"
											:port="item"
											:disabled="isDisabled"
											:styled="false"
											:validationRules="[validationAuxRule]"
											:normalyzeConnectionFn="normalyzeAuxConnection"
											:index="index"
											position="bottom"
										/>
									</template>
									<template #auxPortPlaceholder="{ item }">
										<BlockComplexPortPlaceholder
											:title="item.title"
											@addPort="onAddAuxPort($event)"
										/>
									</template>
								</BlockComplexContent>
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
