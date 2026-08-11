import { ref } from 'ui.vue3';
import { Type } from 'main.core';
import { Outline } from 'ui.icon-set.api.vue';

import {
	BlockHeader,
	BlockIcon,
	MoreMenuTopBtn,
} from '../../../entities/blocks';
import {
	DeleteBlockIconBtn,
	ChangeActivationTopBtn,
	UpdatePublishedStatusLabel,
} from '../../../features/blocks';
import { BLOCK_TYPES } from '../../../shared/constants';
// eslint-disable-next-line no-unused-vars
import { type Block, type BlockId } from '../../../shared/types';

import './style.css';

// @vue/component
export const NodeSettingsHeader = {
	name: 'NodeSettingsHeader',
	components: {
		BlockHeader,
		BlockIcon,
		DeleteBlockIconBtn,
		ChangeActivationTopBtn,
		MoreMenuTopBtn,
		UpdatePublishedStatusLabel,
	},
	props: {
		/** @type Block */
		block: {
			type: Object,
			required: true,
		},
		title: {
			type: String,
			default: '',
		},
		moreMenuItems: {
			type: Array,
			default: () => [],
		},
	},
	emits: ['deletedBlock'],
	setup()
	{
		const headerRef = ref(null);

		return { headerRef };
	},
	computed: {
		icon(): string
		{
			if (this.block.node?.type === BLOCK_TYPES.TOOL)
			{
				const mcpLettersKey = 'MCP_LETTERS';

				return Outline[this.block.node.icon] === Outline.DATABASE
					? this.block.node.icon
					: mcpLettersKey;
			}

			return this.block.node?.icon;
		},
		colorIndex(): number
		{
			return this.block.node?.type === BLOCK_TYPES.TOOL ? 0 : this.block.node?.colorIndex;
		},
		isSubIcon(): boolean
		{
			return this.block.node?.type === BLOCK_TYPES.TOOL
				&& this.block.node?.icon && Outline[this.block.node.icon] !== Outline.DATABASE;
		},
		subIconExternal(): boolean
		{
			const icon = this.block.node?.icon;

			if (!icon || !Type.isString(icon))
			{
				return false;
			}

			try
			{
				const u = new URL(icon);

				return u.protocol === 'https:';
			}
			catch
			{
				return false;
			}
		},
		subIconBackground(): Object
		{
			if (!this.subIconExternal)
			{
				return {};
			}

			return { 'background-image': `url('${this.block.node.icon}')` };
		},
	},
	methods: {
		onDeletedBlock(blockId: BlockId): void
		{
			this.$emit('deletedBlock', blockId);
		},
	},
	template: `
		<div ref="headerRef" class="editor-chart-node-settings-header">
			<BlockHeader
				:block="block"
				:title="title"
				:subIconExternal="subIconExternal"
			>
				<template #icon>
					<BlockIcon
						:iconName="icon"
						:iconColorIndex="colorIndex"
					/>
				</template>
				<template v-if="isSubIcon" #subIcon>
					<div
						v-if="subIconExternal"
						:style="subIconBackground"
						class="ui-selector-item-avatar"
					/>
					<BlockIcon
						v-else
						:iconName="block.node.icon"
						:iconColorIndex="7"
						:iconSize="24"
					/>
				</template>
				<template #status>
					<UpdatePublishedStatusLabel :block="block"/>
				</template>
			</BlockHeader>
			<div class="editor-chart-node-settings-header__controls">
				<DeleteBlockIconBtn
					:blockId="block.id"
					:size="20"
					@deletedBlock="onDeletedBlock"
				/>
				<ChangeActivationTopBtn :block="block" :size="20"/>
				<MoreMenuTopBtn
					v-if="moreMenuItems.length > 0"
					:block="block"
					:moreMenuItems="moreMenuItems"
					:menuTargetContainer="headerRef"
					:size="20"
				/>
			</div>
		</div>
	`,
};
