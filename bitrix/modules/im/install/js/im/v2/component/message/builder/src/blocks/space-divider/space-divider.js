import { type ImModelMessageSpaceDividerBlockType } from 'im.v2.model';

import { BaseBlock } from '../base/base';

import './space-divider.css';

// @vue/component
export const SpaceDivider = {
	name: 'SpaceDivider',
	components: { BaseBlock },
	props: {
		message: {
			type: Object,
			required: true,
		},
		block: {
			type: Object,
			required: true,
		},
		dialogId: {
			type: String,
			required: true,
		},
	},
	computed: {
		spaceDividerBlock(): ImModelMessageSpaceDividerBlockType
		{
			return this.block;
		},
		containerClasses(): string[]
		{
			return [`--size-${this.spaceDividerBlock.size}`];
		},
	},
	template: `
		<BaseBlock
			:message="message"
			:block="spaceDividerBlock"
			:dialogId="dialogId"
		>
			<div class="bx-im-message-block-space-divider__container" :class="containerClasses"></div>
		</BaseBlock>
	`,
};
