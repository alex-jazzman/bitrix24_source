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
	inject: {
		loadDocumentFields: {
			default: () => () => {},
		},
	},
	props: {
		item: {
			/** @type InspectorViewItemBase */
			type: Object,
			required: true,
		},
	},
	data(): { isCollapsed: boolean, isLoading: boolean }
	{
		return {
			isCollapsed: this.item.type === 'document',
			isLoading: false,
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
	watch: {
		childItems(newItems: Array<InspectorViewItemBase>): void
		{
			if (this.isLoading && newItems.length > 0)
			{
				this.isLoading = false;
			}
		},
	},
	methods: {
		toggle(): void
		{
			if (!this.hasChildren)
			{
				return;
			}

			if (this.isDocumentType && this.isCollapsed)
			{
				this.isLoading = true;

				if (this.childItems.length === 0)
				{
					this.fetchDocumentFields();
				}
				else
				{
					cancelAnimationFrame(this.loadingRafId);
					this.loadingRafId = requestAnimationFrame(() => {
						this.isLoading = false;
					});
				}
			}

			this.isCollapsed = !this.isCollapsed;
		},
		async fetchDocumentFields(): Promise<void>
		{
			try
			{
				const fields = await this.loadDocumentFields(this.item.documentType);
				if (!fields || fields.length === 0)
				{
					this.isLoading = false;
				}
			}
			catch
			{
				this.isLoading = false;
			}
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
					<slot name="loading" v-if="isLoading"/>
					<template v-else>
						<InspectorSchemeItemView
							v-for="(item, itemIndex) in childItems"
							:key="item.text || itemIndex"
							:item="item"
						>
							<template #loading><slot name="loading"/></template>
						</InspectorSchemeItemView>
					</template>
				</ul>
			</template>
		</li>
	`,
};
