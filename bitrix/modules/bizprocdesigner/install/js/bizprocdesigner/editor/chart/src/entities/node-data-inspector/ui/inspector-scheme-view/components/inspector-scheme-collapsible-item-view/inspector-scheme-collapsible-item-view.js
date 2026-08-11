import { BIcon, Outline } from 'ui.icon-set.api.vue';
import { Type } from 'main.core';

import './style.css';
import { InspectorViewItemTypeDict } from '../../../../constants';

export const InspectorSchemeCollapsibleItemView = {
	name: 'InspectorSchemeCollapsibleItemView',
	emits: ['toggle'],
	components: {
		BIcon,
	},
	props: {
		item: {
			/** @type InspectorViewItemBase */
			type: Object,
			required: true,
		},
		itemType: {
			/** @type InspectorViewItemType */
			type: String,
			default: '',
		},
		collapsed: {
			type: Boolean,
			default: false,
		},
		hasChildren: {
			type: Boolean,
			default: false,
		},
	},
	computed: {
		itemTitle(): string
		{
			return this.item.text;
		},
		isGroup(): boolean
		{
			return this.itemType === InspectorViewItemTypeDict.GROUP;
		},
		isSection(): boolean
		{
			return this.itemType === InspectorViewItemTypeDict.SECTION;
		},
		isNode(): boolean
		{
			return this.itemType === InspectorViewItemTypeDict.NODE;
		},
		hasNodeIcon(): boolean
		{
			if (!Type.isStringFilled(this.item?.icon))
			{
				return false;
			}

			return Outline[this.item.icon] ?? false;
		},
		hasGroupIcon(): boolean
		{
			return Type.isStringFilled(this.item?.icon);
		},
		nodeIconName(): string
		{
			if (Type.isStringFilled(this.item?.icon))
			{
				return Outline[this.item.icon];
			}

			return Outline.FILE;
		},
		collapseIconName(): string
		{
			return this.collapsed ? Outline.CHEVRON_RIGHT_L : Outline.CHEVRON_DOWN_L;
		},
		typeClass(): string
		{
			return `--${this.itemType}`;
		},
	},
	template: `
		<div class="inspector-scheme-view__collapsible-header" :class="typeClass">
			<div
				v-if="hasChildren"
				class="inspector-scheme-view__collapsible-header__toggle-button"
				@click="$emit('toggle')"
			>
				<BIcon :name="collapseIconName" :size="16" />
			</div>
			<template v-if="isGroup">
				<div class="inspector-scheme-view__collapsible-item-group-title">
					<BIcon v-if="hasGroupIcon" :name="item.icon" :size="24"/>
					<span class="inspector-scheme-view__collapsible-group-item-title">{{ item.text }}</span>
				</div>
			</template>
			<template v-else>
				<div v-if="isNode" class="inspector-scheme-view__collapsible-header__icon">
					<BIcon :name="nodeIconName" :size="20"/>
				</div>
				<span class="inspector-scheme-view__collapsible-item-title" :class="typeClass">{{ item.text }}</span>
			</template>
		</div>
	`,
};
