import { Type } from 'main.core';
import { BlockIcon } from '../block-icon/block-icon';

const PROTOCOL_PREFIX = 'https:';

// @vue/component
export const BlockToolSubIcon = {
	name: 'BlockToolSubIcon',
	components: {
		BlockIcon,
	},
	props: {
		icon: {
			type: String,
			default: '',
		},
		deactivated: {
			type: Boolean,
			default: false,
		},
	},
	computed: {
		isIconUrl(): boolean
		{
			if (!this.icon || !Type.isString(this.icon))
			{
				return false;
			}

			try
			{
				const u = new URL(this.icon.trim());

				return u.protocol === PROTOCOL_PREFIX;
			}
			catch
			{
				return false;
			}
		},
		subIconStyle(): { [string]: string }
		{
			if (!this.isIconUrl)
			{
				return {};
			}

			return {
				'background-image': `url('${this.icon}')`,
			};
		},
	},
	template: `
		<div
			v-if="isIconUrl"
			:style="subIconStyle"
			class="ui-selector-item-avatar"
		/>
		<BlockIcon
			v-else
			:iconName="icon"
			:iconColorIndex="7"
			:iconSize="24"
			:deactivated="deactivated"
		/>
	`,
};
