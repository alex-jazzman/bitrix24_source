import { BIcon, Outline as OutlineIcons } from 'ui.icon-set.api.vue';
import { TextContent } from 'im.v2.component.message.elements';
import { Parser } from 'im.v2.lib.parser';
import { type ImModelMessageListBlockType } from 'im.v2.model';

import './icon-list.css';

// @vue/component
export const IconList = {
	name: 'IconList',
	components: { TextContent, BIcon },
	props: {
		block: {
			type: Object,
			required: true,
		},
	},
	computed: {
		OutlineIcons: () => OutlineIcons,
		listBlock(): ImModelMessageListBlockType
		{
			return this.block;
		},
		listItemIcon(): $Values<typeof OutlineIcons>
		{
			// there is only one icon for now
			return OutlineIcons.ARROW_RIGHT_L;
		},
	},
	methods: {
		getFormattedText(text: string): string
		{
			return Parser.decodeText(text);
		},
	},
	template: `
		<ul class="bx-im-message-block-icon-list__container">
			<li
				v-for="(listElement, index) in listBlock.elements"
				:key="index"
				class="bx-im-message-block-icon-list__item"
			>
				<BIcon
					:name="listItemIcon"
					class="bx-im-message-block-icon-list__icon"
				/>
				<TextContent :text="getFormattedText(listElement.text)" />
			</li>
		</ul>
	`,
};
