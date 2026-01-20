import { BaseEvent } from 'main.core.events';
import { TagSelector } from 'ui.entity-selector';
import type { TagSelectorOptions, DialogOptions } from 'ui.entity-selector';

import { EntitySelectorEntity, Model } from 'booking.const';
import type { ResourceModel } from 'booking.model.resources';

// @vue/component
export const SkusResourceSelector = {
	name: 'SkusResourceSelector',
	props: {
		skuId: {
			type: Number,
			required: true,
		},
		/**
		 * @type {number[]}
		 */
		resourcesIds: {
			type: Array,
			required: true,
		},
	},
	emits: ['add', 'remove'],
	computed: {
		resourcesList(): ResourceModel[]
		{
			return this.$store.getters[`${Model.SkuResourcesEditor}/resources`];
		},
	},
	watch: {
		resourcesIds(resourcesIds: number[]): void
		{
			this.updateSelectedItems(resourcesIds);
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
				context: 'bookingSkusResources',
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
				items: this.resourcesList.map((resource) => {
					return {
						id: resource.id,
						entityId: EntitySelectorEntity.Resource,
						tabs: EntitySelectorEntity.Resource,
						title: resource.name,
						avatar: resource.avatar?.url || '/bitrix/js/booking/application/sku-resources-editor/images/resource-icon.svg',
						selected: this.resourcesIds.includes(resource.id),
					};
				}),
				tabs: [
					{
						id: EntitySelectorEntity.Resource,
					},
				],
				entities: [
					{
						id: EntitySelectorEntity.Resource,
						dynamicLoad: false,
						dynamicSearch: false,
					},
				],
				preselectedItems: this.resourcesIds.map((id) => ([EntitySelectorEntity.Resource, id])),
				events: {
					'Item:onSelect': (event: BaseEvent) => {
						this.select(event.getData().item.id);
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
			this.selector.renderTo(this.$refs.resourcesSelector);

			if (this.disabled)
			{
				this.selector.setLocked(this.disabled);
			}
		},
		destroySelector(): void
		{
			this.selector.getDialog().destroy();
			this.selector = null;
			this.$refs.resourcesSelector.innerHTML = '';
		},
		select(resourceId: number)
		{
			this.$emit('add', {
				skuId: this.skuId,
				resourceId,
			});
		},
		deselect(resourceId: number)
		{
			this.$emit('remove', {
				skuId: this.skuId,
				resourceId,
			});
		},
		updateSelectedItems(resourcesIds: number[])
		{
			const items = this.selector.getDialog().getItems();
			const selectedItemsIds = new Set(
				this.selector.getDialog().getSelectedItems().map((item) => item.getId()),
			);

			for (const resourceId of resourcesIds)
			{
				if (!selectedItemsIds.has(resourceId))
				{
					const selectorItem = items.find((item) => item.getId() === resourceId);
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
			ref="resourcesSelector"
			class="booking-sre-app--skus-view--resource-selector"
		></div>
	`,
};
