import { Loc } from 'main.core';
import { Menu } from 'main.popup';
import { mapGetters } from 'ui.vue3.vuex';
import { CollapsibleCard } from '../card/collapsible-card';

export const RelatedDatasetsCard = {
	components: { CollapsibleCard },
	inject: ['appParams'],
	data()
	{
		return {
			titleMessage: Loc.getMessage('DATASET_IMPORT_V2_CARD_RELATED_TITLE'),
			createLabel: Loc.getMessage('DATASET_IMPORT_V2_CARD_RELATED_CREATE'),
			emptyMessage: Loc.getMessage('DATASET_IMPORT_V2_CARD_RELATED_EMPTY'),
		};
	},
	computed:
	{
		...mapGetters(['datasetProperties', 'connectionProperties', 'hasPreview']),
		isSupersetReady()
		{
			return Boolean(this.appParams?.isSupersetReady);
		},
		items()
		{
			return this.datasetProperties?.externalDatasets ?? [];
		},
		hasItems()
		{
			return this.items.length > 0;
		},
		createPhysicalDatasetUrl()
		{
			return this.connectionProperties?.createPhysicalDatasetUrl
				?? this.datasetProperties?.createPhysicalDatasetUrl
				?? '';
		},
		createVirtualDatasetUrl()
		{
			return this.connectionProperties?.createVirtualDatasetUrl
				?? this.datasetProperties?.createVirtualDatasetUrl
				?? '';
		},
		canCreate()
		{
			return this.isSupersetReady && Boolean(this.createPhysicalDatasetUrl || this.createVirtualDatasetUrl);
		},
		isVisible()
		{
			return this.hasItems || this.canCreate;
		},
	},
	beforeUnmount()
	{
		this.createMenu?.destroy?.();
	},
	methods:
	{
		datasetLabel(item)
		{
			return item.table_name ?? item.name ?? '';
		},
		datasetUrl(item)
		{
			return item.url ?? '';
		},
		onCreateClick(event)
		{
			if (this.createMenu)
			{
				this.createMenu.toggle();

				return;
			}

			const items = [];
			if (this.createPhysicalDatasetUrl)
			{
				items.push({
					text: Loc.getMessage('DATASET_IMPORT_V2_CARD_RELATED_CREATE_PHYSICAL'),
					onclick: () => {
						window.open(this.createPhysicalDatasetUrl, '_blank')?.focus();
						this.createMenu.close();
					},
				});
			}
			if (this.createVirtualDatasetUrl)
			{
				items.push({
					text: Loc.getMessage('DATASET_IMPORT_V2_CARD_RELATED_CREATE_VIRTUAL'),
					onclick: () => {
						window.open(this.createVirtualDatasetUrl, '_blank')?.focus();
						this.createMenu.close();
					},
				});
			}

			this.createMenu = new Menu({
				bindElement: event.currentTarget,
				items,
			});
			this.createMenu.show();
		},
	},
	// language=Vue
	template: `
		<CollapsibleCard
			v-if="isVisible"
			id="related-datasets"
			:title="titleMessage"
			icon-class="--o-links-list"
			:disabled="!hasPreview"
		>
			<template #header-extra>
				<button
					v-if="canCreate"
					type="button"
					class="biconnector-dataset-import-v2-card__header-link ui-typography-text-sm"
					@click="onCreateClick"
				>
					<span class="biconnector-dataset-import-v2-card__header-link-icon ui-icon-set --plus-20"></span>
					<span class="biconnector-dataset-import-v2-card__header-link-text">{{ createLabel }}</span>
				</button>
			</template>
			<div v-if="hasItems" class="biconnector-dataset-import-v2-related__list">
				<a
					v-for="(item, index) in items"
					:key="item.id || index"
					class="biconnector-dataset-import-v2-related__chip"
					:href="datasetUrl(item) || null"
					:target="datasetUrl(item) ? '_blank' : null"
				>{{ datasetLabel(item) }}</a>
			</div>
			<div v-else class="biconnector-dataset-import-v2-related__empty">
				{{ emptyMessage }}
			</div>
		</CollapsibleCard>
	`,
};
