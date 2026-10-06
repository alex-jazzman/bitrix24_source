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
import { FocusAnchor, setFocusAnchor, clearFocusAnchor } from '../../../shared/utils/focus-rescue';
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
		// The header takes the rescued focus, so a screen reader reads it: the name comes from the
		// title BlockHeader shows below, and names the node the panel is about. A plain container is
		// not allowed to carry a name, hence the role, and both go away together with the title.
		accessibleName(): string
		{
			return this.title || this.block.node?.title;
		},
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
	// The header receives the focus rescued from a subtree the panel destroys on its own.
	mounted(): void
	{
		setFocusAnchor(FocusAnchor.settingsHeader, this.headerRef);
	},
	beforeUnmount(): void
	{
		clearFocusAnchor(FocusAnchor.settingsHeader, this.headerRef);
	},
	methods: {
		onDeletedBlock(blockId: BlockId): void
		{
			this.$emit('deletedBlock', blockId);
		},
	},
	template: `
		<div
			ref="headerRef"
			class="editor-chart-node-settings-header"
			:data-testid="$testId('bizprocdesigner-node-settings-header', block.id)"
			:role="accessibleName ? 'group' : null"
			:aria-label="accessibleName || null"
			tabindex="-1"
		>
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
