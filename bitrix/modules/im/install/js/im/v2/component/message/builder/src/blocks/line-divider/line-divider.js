import { type ImModelMessageLineDividerBlockType } from 'im.v2.model';

import { BaseBlock } from '../base/base';

import './line-divider.css';

// @vue/component
export const LineDivider = {
	name: 'LineDivider',
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
		lineDividerBlock(): ImModelMessageLineDividerBlockType
		{
			return this.block;
		},
	},
	template: `
		<BaseBlock
			:message="message"
			:block="lineDividerBlock"
			:dialogId="dialogId"
		>
			<div class="bx-im-message-block-line-divider__container">
				<div class="bx-im-message-block-line-divider__line"></div>
			</div>
		</BaseBlock>
	`,
};
