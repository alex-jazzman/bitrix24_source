import { Tag, Type } from 'main.core';
import { BaseEvent } from 'main.core.events';
import { Dialog, BaseFooter, Item } from 'ui.entity-selector';
import { mapGetters } from 'ui.vue3.vuex';

import { EntitySelectorEntity, Model } from 'booking.const';
import { currencyFormat } from 'booking.lib.currency-format';
import type { BookingModel } from 'booking.model.bookings';
import type { Skus } from 'booking.model.resources';
import type { CatalogSkuEntityOptions } from 'booking.model.sku';

import './skus-info-selector.css';

const RAW_PRICE = 'RAW_PRICE';

// @vue/component
export const SkusInfoSelector = {
	name: 'SkusInfoSelector',
	props: {
		id: {
			type: Number,
			required: true,
		},
		resourceId: {
			type: Number,
			required: true,
		},
	},
	emits: ['save'],
	data(): { shownFooter: boolean, total: number, currencyId: ?string }
	{
		return {
			shownFooter: false,
			total: 0,
			currencyId: null,
			isSelected: false,
		};
	},
	computed: {
		...mapGetters({
			getResourceById: `${Model.Resources}/getById`,
			getBookingById: `${Model.Bookings}/getById`,
		}),
		catalogSkuEntityOptions(): CatalogSkuEntityOptions
		{
			return this.$store.state[Model.Sku].catalogSkuEntityOptions;
		},
		bookings(): BookingModel[]
		{
			return this.getBookingById(this.id);
		},
		bookingSkus(): Skus[]
		{
			return this.bookings?.skus ?? [];
		},
		resourceSkus(): Skus[]
		{
			return this.getResourceById(this.resourceId).skus;
		},
		resourceSkusIds(): number[]
		{
			return this.resourceSkus.map((sku) => sku.id);
		},
		bookingSkusIds(): number[]
		{
			return this.bookingSkus.map((sku) => sku.id);
		},
		entitiesOptions(): Object
		{
			return {
				...this.catalogSkuEntityOptions,
				restrictedProductIds: [...new Set([...this.bookingSkusIds, ...this.resourceSkusIds])],
			};
		},
		totalSumFormatted(): string
		{
			return currencyFormat.format(this.currencyId, this.total);
		},
	},
	mounted(): void
	{
		this.dialog = new Dialog({
			id: `booking-booking-skus-selector-${this.id}`,
			targetNode: this.$refs.dialog,
			preselectedItems: this.selectedResourceSkus().map((id: number) => [EntitySelectorEntity.Product, id]),
			width: 440,
			height: Math.min(window.innerHeight - 380, 400),
			dropdownMode: true,
			entities: [
				{
					id: EntitySelectorEntity.Product,
					dynamicLoad: true,
					dynamicSearch: true,
					options: this.entitiesOptions,
				},
			],
			popupOptions: {
				id: `booking-actions-popup-skus-dialog-${this.id}-${this.resourceId}`,
				className: 'booking-booking-actions-popup__skus-info_skus-dialog',
			},
			enableSearch: true,
			cacheable: true,
			searchOptions: {
				allowCreateItem: false,
			},
			footer: SkusInfoSelectorFooter,
			events: {
				'Item:onSelect': (event: BaseEvent) => {
					const selectedItems = event.getTarget().getSelectedItems();
					this.isSelected = selectedItems.length > 0;
					this.updateTotal(selectedItems);
				},
				'Item:onDeselect': (event: BaseEvent) => {
					const selectedItems = event.getTarget().getSelectedItems();
					this.isSelected = selectedItems.length > 0;
					this.updateTotal(selectedItems);
				},
				onLoad: (event: BaseEvent): void => {
					const selectedItems = event.getTarget().getSelectedItems();
					this.isSelected = selectedItems.length > 0;
					this.updateTotal(selectedItems);
				},
				onHide: (): void => {
					const selectedItemIds = this.dialog.getSelectedItems().map((item) => item.id);

					this.$emit('save', selectedItemIds);
					this.shownFooter = false;
				},
			},
			recentTabOptions: {
				stub: true,
				stubOptions: {
					title: this.loc('BOOKING_ACTIONS_POPUP_RECENT_EMPTY_STATE_TITLE'),
					subtitle: this.loc('BOOKING_ACTIONS_POPUP_RECENT_EMPTY_STATE_SUBTITLE'),
				},
			},
			searchTabOptions: {
				stub: true,
				stubOptions: {
					title: this.loc('BOOKING_ACTIONS_POPUP_SEARCH_EMPTY_STATE_TITLE'),
					subtitle: this.loc('BOOKING_ACTIONS_POPUP_SEARCH_EMPTY_STATE_SUBTITLE'),
				},
			},
		});

		this.dialog.show();
		this.shownFooter = true;
	},
	unmounted()
	{
		this.dialog?.destroy?.();
	},
	methods: {
		isItemSelected(id: number): boolean
		{
			return this.bookingSkusIds.includes(id);
		},
		selectedResourceSkus(): Array
		{
			return this.bookingSkusIds;
		},
		updateTotal(items: Item[])
		{
			this.total = items.reduce((total, item) => {
				const price = item.getCustomData().get(RAW_PRICE) || { VALUE: 0, CURRENCY: null };
				if (!Type.isObject(price))
				{
					return total;
				}

				if (!this.currencyId && price.CURRENCY)
				{
					this.currencyId = price.CURRENCY;
				}

				return total + (price.VALUE ?? 0);
			}, 0);
		},
	},
	template: `
		<div ref="dialog"></div>
		<Teleport
			v-if="shownFooter && isSelected && totalSumFormatted"
			to="#booking-booking-skus-info-selector-footer"
			defer
		>
			<div class="booking-actions-popup-info--skus-info-popup--footer">
				<div class="booking-actions-popup-info--skus-info-popup--footer__total-text">
					{{ loc('BOOKING_ACTIONS_POPUP_SKUS_INFO_SELECTOR_TOTAL') }}
				</div>
				<div
					class="booking-actions-popup-info--skus-info-popup--footer__total-price"
					:data-profit="total"
					v-html="totalSumFormatted"
				>
				</div>
			</div>
		</Teleport>
	`,
};

class SkusInfoSelectorFooter extends BaseFooter
{
	render(): HTMLElement
	{
		return Tag.render`
			<div id="booking-booking-skus-info-selector-footer"></div>
		`;
	}
}
