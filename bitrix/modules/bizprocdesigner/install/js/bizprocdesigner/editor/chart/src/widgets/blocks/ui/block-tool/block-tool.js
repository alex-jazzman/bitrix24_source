import { MoveableBlock } from 'ui.block-diagram';
import { Outline } from 'ui.icon-set.api.vue';
import { Type } from 'main.core';
import type { MenuItemOptions } from 'ui.vue3.components.menu';
import { isBlockActivated, getBlockUserTitle } from '../../../../entities/blocks/utils';
import { IconDivider, IconButton } from '../../../../shared/ui';
import {
	BlockContainer,
	BlockLayout,
	BlockHeader,
	BlockIcon,
	PortsInOutCenter,
	BlockTopTitle,
} from '../../../../entities/blocks';
import {
	DeleteBlockIconBtn,
	UpdatePublishedStatusLabel,
} from '../../../../features/blocks';

import type { Block } from '../../../../shared/types';

import { BlockMediator } from '../../lib';

type BlockToolSetup = {
	iconSet: { [string]: string };
	blockMediator: BlockMediator;
};

type Props = {
	block: Block,
};

// @vue/component
export const BlockTool = {
	name: 'BlockTool',
	components: {
		MoveableBlock,
		BlockContainer,
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
	},
	setup(props: Props): BlockToolSetup
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
	methods: {
		isUrl(value: string): boolean
		{
			if (!value || !Type.isString(value))
			{
				return false;
			}

			try
			{
				const u = new URL(value);

				return u.protocol === 'https:';
			}
			catch
			{
				return false;
			}
		},

		getSafeUrl(url: string): string
		{
			if (!url || !Type.isString(url))
			{
				return '';
			}

			try
			{
				const u = new URL(url.trim());
				if (u.protocol !== 'https:')
				{
					return '';
				}

				return u.href;
			}
			catch
			{
				return '';
			}
		},

		getBackgroundImage(url: string): Object
		{
			const safeUrl = this.getSafeUrl(url);
			if (!safeUrl)
			{
				return {};
			}

			return {
				'background-image': `url('${safeUrl}')`,
			};
		},
	},
	template: `
		<MoveableBlock :block="block">
			<template #default="{ isHighlighted, isDragged, isDisabled, isMakeNewConnection }">
				<BlockContainer
					:width="200"
					:highlighted="isHighlighted && !isDragged"
					:disabled="isDisabled"
					:deactivated="!isBlockActivated"
					:hoverable="!isMakeNewConnection"
					:contextMenuItems="contextMenuItems"
					@dblclick.stop="blockMediator.showCommonNodeSettings(block)"
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
								<BlockHeader :block="block" :subIconExternal="isUrl(block.node?.icon)">
									<template #icon>
										<BlockIcon
											:iconName="block.node.icon === 'DATABASE' ? block.node.icon : 'MCP_LETTERS'"
											:iconColorIndex="0"
										/>
									</template>
									<template #subIcon v-if="block.node?.icon && block.node.icon !== 'DATABASE'">
										<div
											v-if="isUrl(block.node.icon)"
											:style="getBackgroundImage(block.node.icon)"
											class="ui-selector-item-avatar"
										/>
										<BlockIcon
											v-else
											:iconName="block.node.icon"
											:iconColorIndex="7"
											:iconSize="24"
										/>
									</template>
								</BlockHeader>
							</PortsInOutCenter>
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
