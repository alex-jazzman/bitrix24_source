import { Type, Uri } from 'main.core';
import { BaseEvent } from 'main.core.events';
import { Dialog } from 'ui.entity-selector';

import { SidePanelInstance } from 'booking.lib.side-panel-instance';
import { catalogServiceSkuService } from 'booking.provider.service.catalog-service-sku-service';

import { EntitySelectorEntity, Model } from 'booking.const';
import type { ResourceModel } from 'booking.model.resources';
import type { SkuInfo } from 'booking.model.sku-resources-editor';
import type { CatalogSkuEntityOptions } from 'booking.model.sku';

import { fetchResourcesBySkuIds } from '../../../lib/fetch-resources-by-skus';

// @vue/component
export const SkusSelector = {
	name: 'SkusSelector',
	props: {
		targetNode: {
			type: HTMLElement,
			required: true,
		},
		skus: {
			type: Array,
			default: () => [],
		},
	},
	emits: ['close'],
	data(): { selected: any[] }
	{
		return {
			selected: [],
		};
	},
	computed: {
		skusIds(): number[]
		{
			return this.skus.map(({ id }) => id);
		},
		catalogSkuEntityOptions(): CatalogSkuEntityOptions
		{
			return this.$store.state[Model.SkuResourcesEditor].options.catalogSkuEntityOptions;
		},
	},
	created(): void
	{
		this.dialog = this.createDialog();
	},
	mounted(): void
	{
		this.dialog.show();
	},
	unmounted(): void
	{
		this.dialog?.destroy();
	},
	methods: {
		createDialog(): Dialog
		{
			return new Dialog({
				targetNode: this.targetNode,
				context: 'bookingSkusSelector',
				width: 290,
				height: 450,
				dropdownMode: true,
				compactView: true,
				enableSearch: true,
				cacheable: true,
				showAvatars: false,
				multiple: false,
				popupOptions: {
					targetContainer: this.$root.$el.querySelector('.booking-sre-app__wrapper'),
				},
				tagSelectorOptions: {
					textBoxWidth: '100%',
				},
				searchOptions: {
					allowCreateItem: true,
				},
				entities: [
					{
						id: EntitySelectorEntity.Product,
						dynamicLoad: true,
						dynamicSearch: true,
						options: this.catalogSkuEntityOptions,
					},
				],
				undeselectedItems: this.skusIds.map((skuId) => ([EntitySelectorEntity.Product, skuId])),
				events: {
					'Item:onSelect': (event: BaseEvent) => {
						this.select(event.getData().item);
					},
					'Item:onDeselect': (event: BaseEvent) => {
						this.deselected(event.getData().item.id);
					},
					'Search:onItemCreateAsync': (event: BaseEvent): void => {
						return this.createService(event);
					},
					onLoad: (event: BaseEvent) => {
						this.removeSelected(event.getTarget()?.getItems() || []);
					},
					'SearchTab:onLoad': () => {
						this.removeSelected(this.dialog.getItems());
					},
					onHide: () => this.beforeHide(),
				},
			});
		},
		removeSelected(items: Item[]): void
		{
			for (const item of items)
			{
				if (this.skusIds.includes(item.getId()))
				{
					item.setHidden(true);
				}
			}
		},
		select(item: Item): void
		{
			if (this.selected.every(({ id }) => id !== item.id))
			{
				const price = item.getCustomData().get('RAW_PRICE') || { VALUE: 0, CURRENCY: null };

				this.selected.push({
					id: item.id,
					name: item.title.text,
					price: price.VALUE,
					currencyId: price.CURRENCY,
					resources: [],
				});
			}
		},
		deselected(item: Item): void
		{
			const itemId = item.id;
			this.selected = this.selected.filter(({ id }) => id !== itemId);
		},
		async createService(event: BaseEvent): Promise<void>
		{
			const serviceName = event.getData().searchQuery.getQuery();
			const iblockId = this.catalogSkuEntityOptions?.iblockId;

			const serviceId: number | null = await catalogServiceSkuService.create(iblockId, serviceName);

			const dialog = event.getTarget();
			if (!Type.isNumber(serviceId))
			{
				return;
			}

			const blockId = this.catalogSkuEntityOptions.iblockId;
			const url = new Uri(`/crm/catalog/${blockId}/product/${serviceId}/`).toString();

			const item = dialog.addItem({
				id: serviceId,
				entityId: EntitySelectorEntity.Product,
				title: serviceName,
				tabs: dialog.getRecentTab().getId(),
				sort: 2,
				link: url,
			});

			if (item)
			{
				item.select();

				SidePanelInstance.open(url);
			}

			dialog.hide();
		},
		async beforeHide(): Promise<void>
		{
			await this.addSku();
			this.$emit('close');
		},
		async addSku(): Promise<void>
		{
			const sku: ?SkuInfo = this.selected[0];
			if (Type.isNil(sku?.id))
			{
				return;
			}

			await fetchResourcesBySkuIds([sku]);

			const skusInfo: SkuInfo[] = this.$store.getters[`${Model.SkuResourcesEditor}/getSkusByIds`]([sku.id]);
			const skuInfo: SkuInfo = skusInfo[0];
			if (Type.isNil(skuInfo))
			{
				return;
			}

			const skuIds = skusInfo.map((item: SkuInfo) => item.id);

			skuInfo.resources.forEach(
				(resource: ResourceModel) => {
					this.$store.commit(`${Model.SkuResourcesEditor}/addResourceSkus`, {
						resourceId: resource.id,
						skus: skuIds,
					});
				},
			);
		},
	},
	template: '<div hidden="hidden"></div>',
};
