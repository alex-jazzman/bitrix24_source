import { Parser } from 'im.v2.lib.parser';
import { BuilderTextContent, SourceHandler } from 'im.v2.component.message.elements';
import { type TextBlockType } from 'im.v2.const';

import { BaseBlock } from '../base/base';

// @vue/component
export const TextBlock = {
	name: 'TextBlock',
	components: { BaseBlock, BuilderTextContent, SourceHandler },
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
		textBlock(): TextBlockType
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
			<SourceHandler :block="block" :messageId="message.id">
				<BuilderTextContent :text="formattedText" />
			</SourceHandler>
		</BaseBlock>
	`,
};
