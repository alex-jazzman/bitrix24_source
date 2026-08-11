import { Type } from 'main.core';
import { Outline } from 'ui.icon-set.api.vue';

import { BLOCK_TYPES, ACTIVATION_STATUS } from '../../../../shared/constants';
import { IconButton } from '../../../../shared/ui';

import './style.css';

// @vue/component
export const NodeSettingsHeader = {
	name: 'NodeSettingsHeader',
	components: { IconButton },
	props:
	{
		/** @type Block */
		block:
		{
			type: Object,
			required: true,
		},
		title:
		{
			type: String,
			required: true,
		},
	},
	emits: ['activate'],
	computed:
	{
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
		activationIcon(): string
		{
			return this.block.activity.Activated === ACTIVATION_STATUS.ACTIVE
				? this.iconSet.PAUSE_L
				: this.iconSet.PLAY_L;
		},
		isUrl(): boolean
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
		iconSet(): Outline
		{
			return Outline;
		},
	},
	template: `
		<div class="editor-chart-node-settings-header">
			<slot
				name="blockHeader"
				:block="block"
				:title="title"
				:subIconExternal="isUrl"
				:iconName="icon"
				:iconColorIndex="colorIndex"
				:isSubIcon="isSubIcon"
			/>
			<IconButton
				:icon-name="activationIcon"
				@click="$emit('activate')"
			/>
		</div>
	`,
};
