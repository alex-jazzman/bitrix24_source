import { mapGetters } from 'ui.vue3.vuex';

import { Model } from 'booking.const';
import type { SkuResourcesEditorOptions } from 'booking.model.sku-resources-editor';

import { SearchInput } from '../base/search-input/search-input';
import { SkusItem } from './skus-item/skus-item';
import { EmptyState } from './empty-state/empty-state';
import { SkusBar } from './skus-bar/skus-bar';
import { AddSkusButton } from './add-skus-button/add-skus-button';
import { SkusGroupActionBar } from './skus-group-action-bar/skus-group-action-bar';
import { BaseItemSkeleton } from '../base/base-item/base-item-skeleton';

import './skus-view.css';

// @vue/component
export const SkusView = {
	name: 'SkusView',
	components: {
		AddSkusButton,
		SearchInput,
		SkusGroupActionBar,
		SkusItem,
		SkusBar,
		EmptyState,
		BaseItemSkeleton,
	},
	props: {
		loading: {
			type: Boolean,
			default: false,
		},
	},
	data(): SkusViewData
	{
		return {
			search: '',
			selected: new Set(),
		};
	},
	computed: {
		...mapGetters({
			getResourceById: `${Model.Resources}/getById`,
			skusResourcesMap: `${Model.SkuResourcesEditor}/skusResourcesMap`,
			skus: `${Model.SkuResourcesEditor}/skus`,
			getSkusByIds: `${Model.SkuResourcesEditor}/getSkusByIds`,
		}),
		skus(): number[]
		{
			return this.getSkusByIds([...this.skusResourcesMap.keys()]);
		},
		skusList(): Array
		{
			if (!this.search)
			{
				return this.skus;
			}

			const query = this.search.toLowerCase();

			return this.skus.filter((sku) => sku.name.toLowerCase().includes(query));
		},
		skusResourcesEditorOptions(): SkuResourcesEditorOptions
		{
			return this.$store.state[Model.SkuResourcesEditor].options;
		},
	},
	methods: {
		selectSku(skuId): void
		{
			if (this.selected.has(skuId))
			{
				this.selected.delete(skuId);
			}
			else
			{
				this.selected.add(skuId);
			}
		},
		toggleAll(): void
		{
			if (this.selected.size === this.skus.length)
			{
				this.selected.clear();
			}
			else
			{
				this.skus.forEach((sku) => this.selected.add(sku.id));
			}
		},
		getSelectedSkus(): Array
		{
			return this.skus.filter(({ id }) => this.selected.has(id));
		},
	},
	template: `
		<div class="booking-services-settings-popup__services-view">
			<SkusGroupActionBar v-if="selected.size > 0" :skus="getSelectedSkus()" @close="selected.clear()"/>
			<SearchInput 
				v-model="search"
				:placeholder-text="loc('BOOKING_SERVICES_SETTINGS_POPUP_SEARCH_SKU_INPUT_PLACEHOLDER')"
			/>
			<SkusBar
				:checked="selected.size > 0 && (selected.size === skus.length)"
				:servicesCount="skus.length"
				@update:checked="toggleAll"
			>
				<template #button>
					<AddSkusButton
						v-if="skusResourcesEditorOptions.editMode && skusResourcesEditorOptions.catalogSkuEntityOptions"
						:skus
					/>
				</template>
			</SkusBar>
			<div class="booking-services-settings-popup__services-view__services-list">
				<template v-if="loading">
					<BaseItemSkeleton/>
					<BaseItemSkeleton/>
				</template>
				<SkusItem
					v-else-if="!loading && skusList.length > 0"
					v-for="sku of skusList"
					:key="sku.id"
					:sku="sku"
					:selected="selected.has(sku.id)"
					@update:selected="selectSku"
					@afterRemove="selected.delete($event)"
				/>
				<EmptyState
					v-else
					:sku-title="search"
				/>
			</div>
		</div>
	`,
};

type SkusViewData = {
	selected: Set<number>;
}
