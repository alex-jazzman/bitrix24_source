import { defineComponent, type PropType } from 'ui.vue3';

import { type TextBlockType } from 'im.v2.const';
import { Parser } from 'im.v2.lib.parser';

import { BuilderTextContent } from '../../builder-text-content/builder-text-content';
import { SourceHandler } from '../../source-handler/source-handler';
import { BaseBlock } from '../base/base';

// @vue/component
export const TextBlock = defineComponent({
	name: 'TextBlock',
	components: { BaseBlock, BuilderTextContent, SourceHandler },
	props: {
		message: {
			type: Object,
			required: true,
		},
		block: {
			type: Object as PropType<TextBlockType>,
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
});
