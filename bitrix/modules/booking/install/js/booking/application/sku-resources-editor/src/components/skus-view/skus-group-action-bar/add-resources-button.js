import { BaseEvent } from 'main.core.events';
import { Dialog } from 'ui.entity-selector';
import { BIcon, Outline } from 'ui.icon-set.api.vue';

import { EntitySelectorEntity, Model } from 'booking.const';
import type { ResourceModel } from 'booking.model.resources';

import './add-resources-button.css';

let dialog: ?Dialog = null;

// @vue/component
export const AddResourcesButton = {
	name: 'AddResourcesButton',
	components: {
		BIcon,
	},
	props: {
		skus: {
			type: Array,
			default: () => [],
		},
	},
	setup(): { Outline: typeof Outline }
	{
		return {
			Outline,
		};
	},
	data(): { shown: boolean, resourceIds: Set<number> }
	{
		return {
			shown: false,
			resourceIds: new Set(),
		};
	},
	computed: {
		resourcesList(): ResourceModel[]
		{
			return this.$store.getters[`${Model.SkuResourcesEditor}/resources`];
		},
	},
	watch: {
		shown(shown: boolean): void
		{
			if (shown)
			{
				this.getDialog().show();
			}
			else
			{
				this.getDialog().hide();
			}
		},
	},
	unmounted()
	{
		dialog?.destroy();
		dialog = undefined;
	},
	methods: {
		toggleDialog(): void
		{
			this.shown = !this.shown;
		},
		getDialog(): Dialog
		{
			if (dialog instanceof Dialog)
			{
				return dialog;
			}

			dialog = new Dialog({
				id: 'booking-sre-app__add-resource-dialog',
				targetNode: this.$refs.button,
				width: 400,
				enableSearch: true,
				dropdownMode: true,
				context: 'crmFormsBookingResourcesSelector',
				multiple: true,
				cacheable: true,
				showAvatars: true,
				entities: [
					{
						id: EntitySelectorEntity.Resource,
						dynamicLoad: false,
						dynamicSearch: false,
					},
				],
				items: this.resourcesList.map((resource) => {
					return {
						id: resource.id,
						entityId: EntitySelectorEntity.Resource,
						tabs: EntitySelectorEntity.Resource,
						title: resource.name,
						avatar: resource.avatar?.url || '/bitrix/js/booking/application/sku-resources-editor/images/resource-icon.svg',
						customData: resource,
					};
				}),
				tabs: [
					{
						id: EntitySelectorEntity.Resource,
						stub: false,
					},
				],
				searchOptions: {
					allowCreateItem: false,
				},
				events: {
					onHide: () => {
						this.shown = false;
						this.updateSkusResources();
					},
					'Item:onSelect': (event: BaseEvent) => {
						this.resourceIds.add(event.getData().item.id);
					},
					'Item:onDeselect': (event: BaseEvent) => {
						this.resourceIds.delete(event.getData().item.id);
					},
				},
			});

			return dialog;
		},
		updateSkusResources(): void
		{
			void this.$store.dispatch(`${Model.SkuResourcesEditor}/addSkusToResources`, {
				resourcesIds: [...this.resourceIds],
				skus: this.skus.map((sku) => {
					return {
						id: sku.id,
						name: sku.name,
						permissions: sku.permissions,
					};
				}),
			});
		},
	},
	template: `
		<div
			ref="button"
			class="booking-sre-app--add-resources-button"
			tabindex="0"
			role="button"
			@click="toggleDialog"
		>
			<BIcon :size="20" :name="Outline.SERVICES" color="rgb(var(--ui-color-on-primary-rgb))"/>
			<span class="booking-sre-app--add-resources-button__label">
				{{ loc('BOOKING_SRE_GROUP_ACTION_BAR_ADD_RESOURCES') }}
			</span>
		</div>
	`,
};
