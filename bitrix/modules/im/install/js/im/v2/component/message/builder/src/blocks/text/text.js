import { TextContent } from 'im.v2.component.message.elements';
import { Parser } from 'im.v2.lib.parser';
import { type ImModelMessageTextBlockType } from 'im.v2.model';

import { BaseBlock } from '../base/base';

// @vue/component
export const TextBlock = {
	name: 'TextBlock',
	components: { BaseBlock, TextContent },
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
		textBlock(): ImModelMessageTextBlockType
		{
			return this.block;
		},
		formattedText(): string
		{
			return Parser.decodeText(this.textBlock.text);
		},
	},
	template: `
		<BaseBlock
			:message="message"
			:block="textBlock"
			:dialogId="dialogId"
		>
			<TextContent :text="formattedText" />
		</BaseBlock>
	`,
};
