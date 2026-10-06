import { Type } from 'main.core';

import { InspectorViewItemTypeDict } from '../../../../constants';
import type { InspectorViewItemBase } from '../../../../types';
import { InspectorSchemeCollapsibleItemView } from '../inspector-scheme-collapsible-item-view/inspector-scheme-collapsible-item-view';
import { InspectorSchemeDataItemView } from '../inspector-scheme-data-item-view/inspector-scheme-data-item-view';

// @vue/component
export const InspectorSchemeItemView = {
	name: 'InspectorSchemeItemView',
	components: {
		InspectorSchemeCollapsibleItemView,
		InspectorSchemeDataItemView,
	},
	props: {
		item: {
			/** @type InspectorViewItemBase */
			type: Object,
			required: true,
		},
	},
	data(): { isCollapsed: boolean }
	{
		return {
			isCollapsed: this.item.type === 'document',
		};
	},
	computed: {
		itemType(): string
		{
			return this.item.type;
		},
		isData(): boolean
		{
			return this.itemType === InspectorViewItemTypeDict.DATA;
		},
		isGroup(): boolean
		{
			return this.itemType === InspectorViewItemTypeDict.GROUP;
		},
		isDocumentType(): boolean
		{
			return this.itemType === 'document';
		},
		hasChildren(): boolean
		{
			if (this.isDocumentType)
			{
				return true;
			}

			return Type.isArray(this.item.items) && this.item.items.length > 0;
		},
		childItems(): Array
		{
			return this.item?.items ?? [];
		},
		rootClasses(): Array
		{
			const baseClass = this.isGroup ? 'inspector-scheme-view__group' : 'inspector-scheme-view__item';

			return [
				baseClass,
				{ '--expanded': this.hasChildren && !this.isCollapsed },
			];
		},
	},
	methods: {
		toggle(): void
		{
			if (!this.hasChildren)
			{
				return;
			}

			this.isCollapsed = !this.isCollapsed;
		},
	},
	template: `
		<li :class="rootClasses">
			<InspectorSchemeDataItemView v-if="isData" :item="item"/>
			<template v-else>
				<InspectorSchemeCollapsibleItemView
					:item="item"
					:item-type="itemType"
					:collapsed="isCollapsed"
					:has-children="hasChildren"
					@toggle="toggle"
				/>
				<ul class="inspector-scheme-view__item-list" v-if="!isCollapsed">
					<InspectorSchemeItemView
						v-for="(item, itemIndex) in childItems"
						:key="item.text || itemIndex"
						:item="item"
					/>
				</ul>
			</template>
		</li>
	`,
};
