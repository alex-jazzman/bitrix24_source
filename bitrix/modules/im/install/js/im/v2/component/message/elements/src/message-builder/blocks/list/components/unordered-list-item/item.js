import { BIcon, Outline as OutlineIcons } from 'ui.icon-set.api.vue';

import { type UnorderedListBlockType } from 'im.v2.const';
import { Parser } from 'im.v2.lib.parser';

import { BuilderTextContent } from '../../../../builder-text-content/builder-text-content.js';
import { getTextColorClass } from '../../helpers/get-text-color-class.js';
import { getIconColorClass } from '../../helpers/get-icon-color-class.js';
import { IconMap } from './icon-map.js';

import './item.css';

type ListItemType = UnorderedListBlockType['elements'][number];

const DEFAULT_ICON = 'bullet';

// @vue/component
export const ListItem = {
	name: 'ListItem',
	components: { BuilderTextContent, BIcon },
	props: {
		block: {
			type: Object,
			required: true,
		},
		item: {
			type: Object,
			required: true,
		},
	},
	computed: {
		OutlineIcons: () => OutlineIcons,
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
			if (!IconMap[iconType])
			{
				return DEFAULT_ICON;
			}

			return IconMap[iconType];
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
};
