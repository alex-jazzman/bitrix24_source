import { mapGetters } from 'ui.vue3.vuex';

import { Model } from 'booking.const';
import { currencyFormat } from 'booking.lib.currency-format';
// eslint-disable-next-line no-unused-vars
import type { SkuInfo } from 'booking.model.sku-resources-editor';
import type { ResourceModel } from 'booking.model.resources';

import { BaseItem } from '../../base/base-item/base-item';
import { SkusResourceSelector } from './skus-resource-selector';
import './skus-item.css';

// @vue/component
export const SkusItem = {
	name: 'SkusItem',
	components: {
		BaseItem,
		SkusResourceSelector,
	},
	props: {
		/** @type{SkuInfo} */
		sku: {
			type: Object,
			required: true,
		},
		selected: {
			type: Boolean,
			default: false,
		},
	},
	emits: ['update:selected', 'afterRemove', 'addResource', 'removeResource'],
	computed: {
		...mapGetters({
			getResourcesByIds: `${Model.SkuResourcesEditor}/getResourcesByIds`,
			skusResourcesMap: `${Model.SkuResourcesEditor}/skusResourcesMap`,
		}),
		resourcesIds(): Map<number, ResourceModel>
		{
			return [...this.skusResourcesMap.get(this.sku.id) || []];
		},
		price(): string
		{
			return currencyFormat.format(this.sku.currencyId, this.sku.price);
		},
		invalid(): boolean
		{
			return this.$store.state[Model.SkuResourcesEditor].invalidSku
				&& this.resourcesIds.length === 0;
		},
	},
	watch: {
		invalid: {
			handler(invalid: boolean)
			{
				if (invalid)
				{
					this.scrollToInvalid();
				}
			},
			immediate: true,
		},
	},
	methods: {
		scrollToInvalid(): void
		{
			void this.$nextTick(() => {
				this.$refs.sku?.$el?.scrollIntoView(true, { behavior: 'smooth', block: 'center' });
			});
		},
		removeSku(skuId: number): void
		{
			void this.$store.dispatch(`${Model.SkuResourcesEditor}/deleteSkuFromResources`, {
				resourceIds: this.resourcesIds,
				skuId,
			});
			void this.$store.dispatch(`${Model.SkuResourcesEditor}/deleteSku`, skuId);

			this.$emit('afterRemove', skuId);
		},
		addResource({ resourceId, skuId }: { resourceId: number, skuId: number }): void
		{
			void this.$store.dispatch(`${Model.SkuResourcesEditor}/addSkuToResource`, {
				resourceId,
				sku: {
					id: skuId,
					name: this.sku.name,
				},
			});
		},
		removeResource({ resourceId, skuId }: { resourceId: number, skuId: number }): void
		{
			void this.$store.dispatch(`${Model.SkuResourcesEditor}/deleteSkuFromResource`, {
				resourceId,
				skuId,
			});
		},
	},
	template: `
		<BaseItem
			ref="sku"
			:selected
			:name="sku.name"
			:label="loc('BOOKING_SRE_SKU_RESOURCES_LABEL')"
			:dataId="sku.id"
			:invalid
			:invalidMessage="loc('BOOKING_SRE_RESOURCES_FOR_SKU_NOT_SELECTED')"
			@update:selected="$emit('update:selected', sku.id)"
			@remove="removeSku(sku.id)"
		>
			<template #header>
				<span class="booking-sre-app--sku-item--price" v-html="price"></span>
			</template>
			<SkusResourceSelector
				:skuId="sku.id"
				:resourcesIds="resourcesIds"
				@add="addResource"
				@remove="removeResource"
			/>
		</BaseItem>
	`,
};
