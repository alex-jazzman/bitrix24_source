import { Mixin } from '../../mixin';
import { SkuList } from './sku-list/sku-list';
import { TotalPrice } from './total-price/total-price';
import { ResourceInfo } from './resource-info/resource-info';

import type { ResourceModel, Skus } from 'booking.model.resources';

import './booking-detail.css';

// @vue/component
export const BookingDetail = {
	name: 'BookingDetail',
	components: {
		ResourceInfo,
		SkuList,
		TotalPrice,
	},
	mixins: [Mixin],
	props: {
		booking: {
			type: Object,
			required: true,
		},
	},
	computed: {
		primaryResource(): ResourceModel
		{
			return this.booking.resources.find((resource: ResourceModel): boolean => resource.isPrimary);
		},
		skuList(): Skus[]
		{
			return this.booking.skus;
		},
		isAllSkuPricesZero(): boolean
		{
			return this.skuList.every((sku: Skus): boolean => sku.price === 0);
		},
	},
	template: `
		<div class="booking-confirm-page__booking-detail_border">
			<div class="booking-confirm-page__booking-detail_title">
				{{ loc('BOOKING_CONFIRM_PAGE_BOOKING_DETAILS') }}
			</div>
			<div class="booking-confirm-page__booking-detail_line"></div>
			<div class="booking-confirm-page__booking-detail_resource">
				<ResourceInfo :resource="primaryResource" />
			</div>
			<template v-if="skuList.length > 0">
				<div class="booking-confirm-page__booking-detail_line"></div>
				<SkuList :skuList :withPrice="!isAllSkuPricesZero"/>
				<div class="booking-confirm-page__booking-detail_line"></div>
				<TotalPrice v-if="!isAllSkuPricesZero" :skuList />
			</template>
		</div>
	`,
};
