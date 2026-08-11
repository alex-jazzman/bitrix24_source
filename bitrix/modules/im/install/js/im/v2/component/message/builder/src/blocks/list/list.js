import { type BitrixVueComponentProps } from 'ui.vue3';

import { type ImModelMessageListBlockType } from 'im.v2.model';

import { BaseBlock } from '../base/base';
import { UnorderedList } from './components/unordered-list/unordered-list';
import { OrderedList } from './components/ordered-list/ordered-list';
import { IconList } from './components/icon-list/icon-list';

const ListIconType = {
	number: 'number',
	bullet: 'bullet',
	arrow: 'arrow',
};

// @vue/component
export const ListBlock = {
	name: 'ListBlock',
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
		listBlock(): ImModelMessageListBlockType
		{
			return this.block;
		},
		listComponent(): BitrixVueComponentProps
		{
			const iconToTypeMap = {
				[ListIconType.number]: OrderedList,
				[ListIconType.bullet]: UnorderedList,
				[ListIconType.arrow]: IconList,
			};

			return iconToTypeMap[this.listBlock.icon] ?? UnorderedList;
		},
	},
	template: `
		<BaseBlock
			:message="message"
			:block="listBlock"
			:dialogId="dialogId"
		>
			<component :is="listComponent" :block="listBlock" />
		</BaseBlock>
	`,
};
