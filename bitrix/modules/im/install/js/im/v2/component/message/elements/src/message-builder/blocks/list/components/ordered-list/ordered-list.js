import { type OrderedListBlockType } from 'im.v2.const';
import { Parser } from 'im.v2.lib.parser';

import { BuilderTextContent } from '../../../../builder-text-content/builder-text-content.js';
import { getIconColorClass } from '../../helpers/get-icon-color-class.js';
import { getTextColorClass } from '../../helpers/get-text-color-class.js';

import './ordered-list.css';

type ListItemType = OrderedListBlockType['elements'][number];

// @vue/component
export const OrderedList = {
	name: 'OrderedList',
	components: { BuilderTextContent },
	props: {
		block: {
			type: Object,
			required: true,
		},
	},
	computed: {
		listBlock(): OrderedListBlockType
		{
			return this.block;
		},
	},
	methods: {
		getFormattedText(text: string): string
		{
			return Parser.decodeInlineText(text);
		},
		getTextColorClass(item: ListItemType): string
		{
			return getTextColorClass(item, this.listBlock);
		},
		getIconColorClass(item: ListItemType): string
		{
			return getIconColorClass(item, this.listBlock);
		},
	},
	template: `
		<ol class="bx-im-message-block-ordered-list__container" data-testid="message-builder-ordered-list">
			<li
				v-for="(item, index) in listBlock.elements"
				:key="index"
				class="bx-im-message-block-ordered-list__item"
				data-testid="message-builder-ordered-list-item"
			>
				<span
					class="bx-im-message-block-ordered-list__marker"
					:class="getIconColorClass(item)"
				>{{ index + 1 }}.</span>
				<span :class="getTextColorClass(item)">
					<BuilderTextContent :text="getFormattedText(item.text)" />
				</span>
			</li>
		</ol>
	`,
};
