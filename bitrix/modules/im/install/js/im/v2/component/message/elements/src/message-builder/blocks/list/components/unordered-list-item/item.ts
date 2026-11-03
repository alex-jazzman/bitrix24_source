import { BIcon, Outline as OutlineIcons } from 'ui.icon-set.api.vue';
import { defineComponent, type PropType } from 'ui.vue3';

import { type UnorderedListBlockType } from 'im.v2.const';
import { Parser } from 'im.v2.lib.parser';

import { BuilderTextContent } from '../../../../builder-text-content/builder-text-content';
import { getTextColorClass } from '../../helpers/get-text-color-class';
import { getIconColorClass } from '../../helpers/get-icon-color-class';
import { IconMap } from './icon-map';

import './item.css';

type ListItemType = UnorderedListBlockType['elements'][number];

const DEFAULT_ICON = 'bullet';

// @vue/component
export const ListItem = defineComponent({
	name: 'ListItem',
	components: { BuilderTextContent, BIcon } as { BuilderTextContent: typeof BuilderTextContent, BIcon: typeof BIcon },
	props: {
		block: {
			type: Object as PropType<UnorderedListBlockType>,
			required: true,
		},
		item: {
			type: Object as PropType<ListItemType>,
			required: true,
		},
	},
	computed: {
		OutlineIcons(): typeof OutlineIcons
		{
			return OutlineIcons;
		},
		listBlock(): UnorderedListBlockType
		{
			return this.block;
		},
		listItem(): ListItemType
		{
			return this.item;
		},
		iconColorClass(): string
		{
			return getIconColorClass(this.listItem, this.listBlock);
		},
		textColorClass(): string
		{
			return getTextColorClass(this.listItem, this.listBlock);
		},
		formattedText(): string
		{
			return Parser.decodeInlineText(this.listItem.text);
		},
		itemIconType(): string
		{
			const iconType = this.listItem.icon?.type || this.listBlock.icon?.type;
			if (!IconMap[iconType as keyof typeof IconMap])
			{
				return DEFAULT_ICON;
			}

			return IconMap[iconType as keyof typeof IconMap];
		},
		isDefaultIcon(): boolean
		{
			return this.itemIconType === DEFAULT_ICON;
		},
	},
	template: `
		<li class="bx-im-message-block-unordered-list-item__container" data-testid="message-builder-unordered-list-item">
			<span
				class="bx-im-message-block-unordered-list-item__marker"
				:class="iconColorClass"
			>
				<span 
					v-if="isDefaultIcon" 
					class="bx-im-message-block-unordered-list-item__bullet"
				>
					&bull;
				</span>
				<BIcon
					v-else
					:name="itemIconType"
					class="bx-im-message-block-unordered-list-item__icon"
				/>
			</span>
			<span :class="textColorClass">
				<BuilderTextContent :text="formattedText" />
			</span>
		</li>
	`,
});
