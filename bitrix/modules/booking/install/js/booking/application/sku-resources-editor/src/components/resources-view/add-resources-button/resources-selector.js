import { Type } from 'main.core';
import { BaseEvent } from 'main.core.events';
import { Dialog } from 'ui.entity-selector';

import { Model, EntitySelectorEntity } from 'booking.const';
import type { Skus } from 'booking.model.resources';

import { fetchResourcesByIds } from '../../../lib/fetch-resources-by-ids';
import { getServicesCollection } from '../../../lib/get-services-collection';

// @vue/component
export const ResourcesSelector = {
	name: 'ResourcesSelector',
	props: {
		targetNode: {
			type: HTMLElement,
			required: true,
		},
		/** @type {number[]} */
		resourcesIds: {
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
	created(): void
	{
		this.createDialog();
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
		createDialog(): void
		{
			this.dialog = new Dialog({
				targetNode: this.targetNode,
				context: 'bookingResourcesSelector',
				width: 290,
				height: 340,
				dropdownMode: true,
				compactView: true,
				enableSearch: true,
				cacheable: true,
				showAvatars: true,
				multiple: false,
				popupOptions: {
					targetContainer: this.$root.$el.querySelector('.booking-sre-app__wrapper'),
				},
				tagSelectorOptions: {
					textBoxWidth: '100%',
				},
				searchOptions: {
					allowCreateItem: false,
				},
				entities: [
					{
						id: EntitySelectorEntity.Resource,
						dynamicLoad: true,
						dynamicSearch: true,
					},
				],
				preselectedItems: this.resourcesIds.map((id) => ([EntitySelectorEntity.Product, id])),
				events: {
					'Item:onSelect': (event: BaseEvent) => {
						this.select(event.getData().item);
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
				if (this.resourcesIds.includes(item.getId()))
				{
					item.setHidden(true);
				}
			}
		},
		select(item: Item): void
		{
			this.selected.push(item.getId());
		},
		async beforeHide(): Promise<void>
		{
			await this.addResource();
			this.$emit('close');
		},
		async addResource(): Promise<void>
		{
			const resourceId: ?number = this.selected[0];
			if (Type.isNil(resourceId))
			{
				return;
			}

			await fetchResourcesByIds(this.selected);

			const skus: Skus[] = getServicesCollection(
				this.$store.getters[`${Model.SkuResourcesEditor}/getResourcesByIds`]([resourceId]),
			);

			this.$store.commit(`${Model.SkuResourcesEditor}/addResourceSkus`, {
				resourceId,
				skus: skus.map((sku: Skus) => sku.id),
			});
		},
	},
	template: '<div hidden="hidden"></div>',
};
