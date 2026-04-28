import { Type, Uri } from 'main.core';
import { BaseEvent } from 'main.core.events';
import { TagSelector } from 'ui.entity-selector';
import { Set as IconSet } from 'ui.icon-set.api.vue';
import type { TagSelectorOptions, DialogOptions, TagItemOptions } from 'ui.entity-selector';
import { createNamespacedHelpers } from 'ui.vue3.vuex';

import { EntitySelectorEntity, Model } from 'booking.const';
import { catalogServiceSkuService } from 'booking.provider.service.catalog-service-sku-service';
import { SidePanelInstance } from 'booking.lib.side-panel-instance';
import type { CatalogSkuEntityOptions } from 'booking.model.sku';

import { TextLayout } from '../text-layout/text-layout';
import { TitleLayout } from '../title-layout/title-layout';

const { mapGetters: mapResourceGetters, mapActions } = createNamespacedHelpers(Model.ResourceCreationWizard);

// @vue/component
export const ServicesSkus = {
	name: 'ResourceSettingsCardServicesSkus',
	components: {
		TitleLayout,
		TextLayout,
	},
	computed: {
		...mapResourceGetters({
			skus: 'skus',
		}),
		title(): string
		{
			return this.loc('BRCW_SETTINGS_CARD_SERVICES_SKUS_TITLE');
		},
		text(): string
		{
			return this.loc('BRCW_SETTINGS_CARD_SERVICES_SKUS_TEXT');
		},
		titleIconType(): string
		{
			return IconSet.PERSONS_3;
		},
		catalogSkuEntityOptions(): CatalogSkuEntityOptions
		{
			return this.$store.state[Model.Sku].catalogSkuEntityOptions;
		},
		disabled(): boolean
		{
			return this.catalogSkuEntityOptions.length === 0;
		},
	},
	created(): void
	{
		this.selector = this.createSelector();
	},
	mounted(): void
	{
		this.mountSelector();
	},
	beforeUnmount(): void
	{
		this.destroySelector();
	},
	methods: {
		...mapActions([
			'addSku',
			'deleteSku',
		]),
		createSelector(): TagSelector
		{
			const dialogOptions: DialogOptions = this.disabled ? null : {
				context: 'bookingResourceServices',
				width: 390,
				height: 340,
				dropdownMode: true,
				compactView: true,
				enableSearch: true,
				cacheable: true,
				showAvatars: false,
				popupOptions: {
					targetContainer: this.$root.$el.querySelector('.resource-creation-wizard__wrapper'),
				},
				searchOptions: {
					allowCreateItem: this.catalogSkuEntityOptions?.canCreate,
				},
				entities: [
					{
						id: EntitySelectorEntity.Product,
						dynamicLoad: true,
						dynamicSearch: true,
						options: this.catalogSkuEntityOptions,
					},
				],
				preselectedItems: this.skus.map((sku) => ([EntitySelectorEntity.Product, sku.id])),
				events: {
					'Item:onSelect': (event: BaseEvent) => {
						this.select(event.getData().item.id);
					},
					'Item:onDeselect': (event: BaseEvent) => {
						this.deselect(event.getData().item.id);
					},
					'Search:onItemCreateAsync': (event: BaseEvent): void => {
						return this.createService(event);
					},
				},
				recentTabOptions: {
					stub: true,
					stubOptions: {
						title: this.loc('BRCW_SETTINGS_CARD_SERVICES_SKUS_RECENT_EMPTY_STATE_TITLE_MSGVER_1'),
						subtitle: this.loc('BRCW_SETTINGS_CARD_SERVICES_SKUS_RECENT_EMPTY_STATE_SUBTITLE_MSGVER_1'),
					},
				},
			};

			const items: TagItemOptions = [{
				id: '0',
				entityId: EntitySelectorEntity.Product,
				title: this.loc('BRCW_SETTINGS_CARD_SERVICES_SKUS_HIDDEN_ITEM'),
				hidden: true,
				deselectable: false,
			}];

			const tagSelectionOptions: TagSelectorOptions = {
				showAddButton: !this.disabled,
				multiple: true,
				textBoxWidth: 190,
				placeholder: this.loc('BRCW_SETTINGS_CARD_SERVICES_SKUS_PLACEHOLDER'),
				addButtonCaption: this.loc('BRCW_SETTINGS_CARD_SERVICES_SKUS_PLACEHOLDER'),
				showCreateButton: false,
				dialogOptions,
				items: this.disabled ? items : null,
				tagBgColor: this.disabled ? 'var(--ui-color-gray-20)' : null,
				tagTextColor: this.disabled ? 'var(--ui-color-gray-70)' : null,
				tagClickable: !this.disabled,
			};

			return new TagSelector(tagSelectionOptions);
		},
		async select(id: number): Promise<void>
		{
			await this.addSku(id);
		},
		async deselect(id: number): Promise<void>
		{
			await this.deleteSku(id);
		},
		mountSelector(): void
		{
			this.selector.renderTo(this.$refs.servicesSelector);

			if (this.disabled)
			{
				this.selector.setLocked(this.disabled);
			}
		},
		destroySelector(): void
		{
			this.selector.getDialog()?.destroy();
			this.selector = null;
			this.$refs.servicesSelector.innerHTML = '';
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
	},
	template: `
		<div class="ui-form resource-creation-wizard__form-settings" data-id="brcw-resource-settings-services-skus">
			<TitleLayout
				:title="title"
				:iconType="titleIconType"
			/>
			<TextLayout
				type="WorkTime"
				:text="text"
			/>
			<div
				ref="servicesSelector"
				class="resource-creation-wizard__services_services-selector"
			></div>
			<div
				v-if="this.catalogSkuEntityOptions.length === 0"
				class="resource-creation-wizard__services_warning"
			>
				{{ loc('BRCW_SETTINGS_CARD_SERVICES_SKUS_WARNING') }}
			</div>
		</div>
	`,
};
