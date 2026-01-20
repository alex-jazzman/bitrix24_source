import { BaseEvent } from 'main.core.events';
import { mapGetters } from 'ui.vue3.vuex';
import { TagSelector } from 'ui.entity-selector';
import type { TagSelectorOptions, DialogOptions } from 'ui.entity-selector';

import { EntitySelectorEntity, Model } from 'booking.const';

// @vue/component
export const ResourcesSkuSelector = {
	name: 'ResourcesSkuSelector',
	props: {
		resourceId: {
			type: Number,
			required: true,
		},
		/** @type{number[]} */
		selectedSkusIds: {
			type: Array,
			required: true,
		},
	},
	emits: ['add', 'remove'],
	computed: {
		...mapGetters({
			getSkuById: `${Model.SkuResourcesEditor}/getSkuById`,
		}),
	},
	watch: {
		selectedSkusIds: {
			handler(newSkusIds: number[]): void
			{
				this.updateSelectedItems(newSkusIds);
			},
			deep: true,
			immediate: false,
		},
	},
	mounted(): void
	{
		this.selector = this.createSelector();
		this.mountSelector();
	},
	beforeUnmount(): void
	{
		this.destroySelector();
	},
	methods: {
		createSelector(): TagSelector
		{
			const dialogOptions: DialogOptions = {
				context: 'bookingResourcesSkus',
				width: 290,
				height: 340,
				dropdownMode: true,
				compactView: true,
				enableSearch: true,
				cacheable: true,
				showAvatars: true,
				popupOptions: {
					targetContainer: this.$root.$el.querySelector('.booking-sre-app__wrapper'),
				},
				searchOptions: {
					allowCreateItem: false,
				},
				entities: [
					{
						id: EntitySelectorEntity.Product,
						dynamicLoad: true,
						dynamicSearch: true,
						options: this.$store.state[Model.SkuResourcesEditor].options.catalogSkuEntityOptions,
					},
				],
				preselectedItems: this.selectedSkusIds.map((id) => ([EntitySelectorEntity.Product, id])),
				events: {
					'Item:onSelect': (event: BaseEvent) => {
						this.select(event.getData().item);
					},
					'Item:onDeselect': (event: BaseEvent) => {
						this.deselect(event.getData().item.id);
					},
				},
			};

			const tagSelectionOptions: TagSelectorOptions = {
				multiple: true,
				textBoxWidth: 600,
				showAddButton: true,
				showCreateButton: false,
				tagClickable: false,
				showTextBox: false,
				dialogOptions,
			};

			return new TagSelector(tagSelectionOptions);
		},
		mountSelector(): void
		{
			this.selector.renderTo(this.$refs.skusSelector);

			if (this.disabled)
			{
				this.selector.setLocked(this.disabled);
			}
		},
		destroySelector(): void
		{
			this.selector.getDialog().destroy();
			this.selector = null;
			this.$refs.skusSelector.innerHTML = '';
		},
		select(item: Item): void
		{
			const skuId = item.getId();
			const price = item.getCustomData().get('RAW_PRICE') || { VALUE: 0, CURRENCY: null };
			const sku = this.getSkuById(skuId);

			this.$emit('add', {
				resourceId: this.resourceId,
				sku: sku || {
					id: skuId,
					name: item.getTitle(),
					price: price.VALUE,
					currencyId: price.CURRENCY,
				},
			});
		},
		deselect(skuId: number): void
		{
			this.$emit('remove', {
				resourceId: this.resourceId,
				skuId,
			});
		},
		// TODO: Logic for adding. What if need to delete?
		updateSelectedItems(skusIds: number[]): void
		{
			const items = this.selector.getDialog().getItems();
			const selectedItemsIds = new Set(
				this.selector.getDialog().getSelectedItems().map((item) => item.id),
			);

			for (const skuId of skusIds)
			{
				if (!selectedItemsIds.has(skuId))
				{
					const selectorItem = items.find((item) => item.id === skuId);
					if (selectorItem)
					{
						selectorItem.select();
					}
				}
			}
		},
	},
	template: `
		<div
			ref="skusSelector"
			class="booking-services-settings-popup__resources-view__sku-selector"
		></div>
	`,
};
