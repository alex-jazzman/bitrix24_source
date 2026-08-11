import { TextContent } from 'im.v2.component.message.elements';
import { Parser } from 'im.v2.lib.parser';
import { type ImModelMessageListBlockType } from 'im.v2.model';

import './ordered-list.css';

// @vue/component
export const OrderedList = {
	name: 'OrderedList',
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
		<ol class="bx-im-message-block-ordered-list__container">
			<li
				v-for="(listElement, index) in listBlock.elements"
				:key="index"
			>
				<TextContent :text="getFormattedText(listElement.text)" />
			</li>
		</ol>
	`,
};
