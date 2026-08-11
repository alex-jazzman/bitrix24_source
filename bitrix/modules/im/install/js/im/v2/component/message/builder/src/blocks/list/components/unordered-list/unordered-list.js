import { TextContent } from 'im.v2.component.message.elements';
import { Parser } from 'im.v2.lib.parser';
import { type ImModelMessageListBlockType } from 'im.v2.model';

import './unordered-list.css';

// @vue/component
export const UnorderedList = {
	name: 'UnorderedList',
	components: { TextContent },
	props: {
		block: {
			type: Object,
			required: true,
		},
	},
	computed: {
		listBlock(): ImModelMessageListBlockType
		{
			return this.block;
		},
	},
	methods: {
		getFormattedText(text: string): string
		{
			return Parser.decodeText(text);
		},
	},
	template: `
		<ul class="bx-im-message-block-unordered-list__container">
			<li
				v-for="(listElement, index) in listBlock.elements"
				:key="index"
			>
				<TextContent :text="getFormattedText(listElement.text)" />
			</li>
		</ul>
	`,
};
