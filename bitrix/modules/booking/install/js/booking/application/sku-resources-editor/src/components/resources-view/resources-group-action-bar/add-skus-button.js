import { BaseEvent } from 'main.core.events';
import { mapGetters } from 'ui.vue3.vuex';
import { Dialog } from 'ui.entity-selector';
import { BIcon, Outline } from 'ui.icon-set.api.vue';

import { EntitySelectorEntity, Model } from 'booking.const';
import type { SkuInfo } from 'booking.model.sku-resources-editor';
import type { ResourceModel, Skus } from 'booking.model.resources';

import './add-skus-button.css';

let dialog: ?Dialog = null;

// @vue/component
export const AddSkusButton = {
	name: 'AddSkusButton',
	components: {
		BIcon,
	},
	props: {
		resources: {
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
	data(): { shown: boolean, selectedSkus: Map<number, Skus>, initialSkuIds: Set<number> }
	{
		return {
			shown: false,
			selectedSkus: new Map(),
			initialSkuIds: new Set(),
		};
	},
	computed: {
		...mapGetters({
			getSkuById: `${Model.SkuResourcesEditor}/getSkuById`,
		}),
		skus(): SkuInfo[]
		{
			return this.$store.getters[`${Model.SkuResourcesEditor}/skus`];
		},
	},
	watch: {
		shown(shown: boolean): void
		{
			if (shown)
			{
				// this.setSelectedSkuIds();
				this.getDialog().show();
			}
			else
			{
				this.getDialog().hide();
			}
		},
	},
	unmounted(): void
	{
		dialog?.destroy();
		dialog = undefined;
	},
	methods: {
		toggleDialog(): void
		{
			this.shown = !this.shown;
		},
		setSelectedSkuIds(): void
		{
			this.selectedSkus.clear();
			this.initialSkuIds.clear();

			const minSkusResource = this.findResourceWithMinSkus(this.resources);
			if (!minSkusResource)
			{
				return;
			}

			for (const sku of minSkusResource.skus)
			{
				if (this.resources.every(({ skus }) => skus.some(({ id }) => id === sku.id)))
				{
					this.selectedSkus.set(sku.id, sku);
					this.initialSkuIds.add(sku.id);
				}
			}
		},
		findResourceWithMinSkus(resources: ResourceModel[]): ResourceModel
		{
			let min = Infinity;
			let minResource = null;

			for (const resource: ResourceModel of resources)
			{
				const count = resource.skus.length;

				if (count === 1)
				{
					return resource;
				}

				if (count < min)
				{
					min = count;
					minResource = resource;
				}
			}

			return minResource;
		},
		getDialog(): Dialog
		{
			if (dialog instanceof Dialog)
			{
				return dialog;
			}

			dialog = new Dialog({
				id: 'booking-sre-app__add-sku-dialog',
				targetNode: this.$refs.button,
				// preselectedItems: [...this.selectedSkuIds].map((id: number) => [EntitySelectorEntity.Product, id]),
				width: 400,
				enableSearch: true,
				dropdownMode: true,
				context: 'crmFormsBookingSkusSelector',
				multiple: true,
				cacheable: true,
				showAvatars: true,
				entities: [
					{
						id: EntitySelectorEntity.Product,
						dynamicLoad: true,
						dynamicSearch: true,
						options: this.$store.state[Model.SkuResourcesEditor].options.catalogSkuEntityOptions,
					},
				],
				searchOptions: {
					allowCreateItem: false,
				},
				events: {
					onHide: () => {
						this.shown = false;
						this.updateResourcesSkus();
					},
					'Item:onSelect': (event: BaseEvent) => {
						const item = event.getData().item;
						this.selectedSkus.set(item.id, {
							id: item.id,
							name: item.title.text,
						});
					},
					'Item:onDeselect': (event: BaseEvent) => {
						this.selectedSkus.delete(event.getData().item.id);
					},
				},
			});

			return dialog;
		},
		updateResourcesSkus(): void
		{
			const resourcesIds = this.resources.map(({ id }) => id);
			const skus = [...this.selectedSkus.values()];

			if (skus.length > 0)
			{
				void this.$store.dispatch(`${Model.SkuResourcesEditor}/addSkusToResources`, {
					resourcesIds,
					skus,
				});
			}
		},
	},
	template: `
		<div
			ref="button"
			class="booking-sre-app__add-skus-button"
			tabindex="0"
			role="button"
			@click="toggleDialog"
		>
			<BIcon :size="20" :name="Outline.SERVICES" color="rgb(var(--ui-color-on-primary-rgb))"/>
			<span class="booking-sre-app__add-skus-button__label">
				{{ loc('BOOKING_SRE_GROUP_ACTION_BAR_ADD_SKUS') }}
			</span>
		</div>
	`,
};
