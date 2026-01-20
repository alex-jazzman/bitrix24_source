import { MoveableBlock } from 'ui.block-diagram';
import { Outline } from 'ui.icon-set.api.vue';
import { Type } from 'main.core';
import { isBlockActivated } from '../../../../entities/blocks/utils';
import { IconDivider, IconButton } from '../../../../shared/ui';
// eslint-disable-next-line no-unused-vars
import type { Block, BlockId } from '../../../../shared/types';
import {
	BlockContainer,
	BlockLayout,
	BlockHeader,
	BlockIcon,
	PortsInOutCenter,
} from '../../../../entities/blocks';
import {
	DeleteBlockIconBtn,
	UpdatePublishedStatusLabel,
} from '../../../../features/blocks';

import { BlockMediator } from '../../lib';

type BlockToolSetup = {
	iconSet: { [string]: string };
	onOpenBlockSettings: (event: MouseEvent) => void;
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
	},
	props: {
		/** @type Block */
		block: {
			type: Object,
			required: true,
		},
	},
	setup(props): BlockToolSetup
	{
		return {
			iconSet: Outline,
			blockMediator: new BlockMediator(),
		};
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
					:highlighted="isHighlighted"
					:disabled="isDisabled"
					:deactivated="!isBlockActivated"
					:contextMenuItems="[
						blockMediator.getCtxMenuItemShowSimpleSettings(block),
						blockMediator.getCtxMenuItemDeleteBlock(block),
					]"
					@dblclick.stop="blockMediator.showCommonNodeSettings(block)"
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
