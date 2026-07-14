import { type UnorderedListBlockType } from 'im.v2.const';

import { ListItem } from '../unordered-list-item/item.js';

import './unordered-list.css';

// @vue/component
export const UnorderedList = {
	name: 'UnorderedList',
	components: { ListItem },
	props: {
		block: {
			type: Object,
			required: true,
		},
	},
	computed: {
		listBlock(): UnorderedListBlockType
		{
			return this.block;
		},
	},
	template: `
		<ul class="bx-im-message-block-unordered-list__container">
			<ListItem
				v-for="(item, index) in listBlock.elements"
				:key="index"
				:block="listBlock"
				:item="item"
			/>
		</ul>
	`,
};
