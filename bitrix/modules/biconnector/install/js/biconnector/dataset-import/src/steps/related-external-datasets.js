import { Event } from 'main.core';
import { StepBlock } from '../layout/step-block';
import { BaseStep } from './base-step';
import { Menu } from 'main.popup';
import '../css/related-external-datasets.css';

export const RelatedExternalDatasetsStep = {
	extends: BaseStep,
	props: {
		isSupersetReady: {
			type: Boolean,
			required: false,
			default: false,
		},
	},
	data()
	{
		return {
			createDatasetsMenu: null,
		};
	},
	computed: {
		defaultTitle(): string
		{
			return this.$Bitrix.Loc.getMessage('DATASET_IMPORT_RELATED_EXTERNAL_DATASETS_HEADER_MSGVER_1');
		},
		items(): Array<Object>
		{
			return this.$store.getters.datasetProperties?.externalDatasets ?? [];
		},
		hasItems(): boolean
		{
			return (this.items?.length ?? 0) > 0;
		},
		createPhysicalDatasetUrl(): ?string
		{
			return this.$store.getters.connectionProperties?.createPhysicalDatasetUrl
				?? this.$store.getters.datasetProperties?.createPhysicalDatasetUrl;
		},
		createVirtualDatasetUrl(): ?string
		{
			return this.$store.getters.connectionProperties?.createVirtualDatasetUrl
				?? this.$store.getters.datasetProperties?.createVirtualDatasetUrl;
		},
		showCreateButton(): boolean
		{
			return this.isSupersetReady && Boolean(this.createPhysicalDatasetUrl || this.createVirtualDatasetUrl);
		},
	},
	methods: {
		onCreateClick(event: any): void
		{
			if (this.createDatasetsMenu)
			{
				this.createDatasetsMenu.toggle();

				return;
			}

			const items = [
				{
					text: this.$Bitrix.Loc.getMessage('DATASET_IMPORT_RELATED_EXTERNAL_DATASETS_CREATE_PHYSICAL'),
					onclick: () => {
						if (!this.createPhysicalDatasetUrl)
						{
							return false;
						}
						window.open(this.createPhysicalDatasetUrl, '_blank').focus();
						this.createDatasetsMenu.close();

						return true;
					},
					className: this.createPhysicalDatasetUrl ? '' : 'menu-popup-no-icon menu-popup-item-disabled-with-hint',
				},
				{
					text: this.$Bitrix.Loc.getMessage('DATASET_IMPORT_RELATED_EXTERNAL_DATASETS_CREATE_VIRTUAL'),
					onclick: () => {
						if (!this.createVirtualDatasetUrl)
						{
							return false;
						}
						window.open(this.createVirtualDatasetUrl, '_blank').focus();
						this.createDatasetsMenu.close();

						return true;
					},
				},
			];

			this.createDatasetsMenu = new Menu({
				bindElement: event.currentTarget,
				items,
			});
			this.createDatasetsMenu.show();

			if (!this.createPhysicalDatasetUrl)
			{
				const disabledMenuItem = this.createDatasetsMenu.itemsContainer.querySelector('.menu-popup-item-disabled-with-hint');
				if (disabledMenuItem)
				{
					const hintManager = BX.UI.Hint.createInstance({
						id: 'menu-popup-item-disabled-with-hint',
						popupParameters: {
							offsetLeft: disabledMenuItem.offsetWidth,
							offsetTop: -50,
							autoHide: true,
							width: 270,
							angle: {
								position: 'left',
								offset: 15,
							},
						},
					});

					Event.bind(disabledMenuItem, 'mouseenter', () => {
						hintManager.show(disabledMenuItem, this.$Bitrix.Loc.getMessage('DATASET_IMPORT_RELATED_EXTERNAL_DATASETS_CREATE_PHYSICAL_DISABLE'), false, false);
					});
					Event.bind(disabledMenuItem, 'mouseleave', () => {
						hintManager.hide();
					});
				}
			}
		},
	},
	components: {
		Step: StepBlock,
	},
	// language=Vue
	template: `
		<Step
			:title="displayedTitle"
			:is-open-initially="isOpenInitially"
			:disabled="disabled"
			ref="stepBlock"
		>
			<template #headerRightContent>
				<button
					v-if="showCreateButton"
					class="ui-btn-icon-add related-external-datasets__header-right-create-btn"
					@click.stop="onCreateClick"
					type="button"
					:disabled="disabled"
				>
					<span>{{ $Bitrix.Loc.getMessage('DATASET_IMPORT_RELATED_EXTERNAL_DATASETS_CREATE_BUTTON') }}</span>
					<i class="ui-icon-set related-external-datasets__header-right-create-btn-icon --chevron-down"/>
				</button>
			</template>
			<div class="ui-form-row" v-if="hasItems">
				<ul class="ui-list related-external-datasets__list">
					<li v-for="item in items" :key="item.id" class="related-external-datasets__item">
						<a :href="item.url" target="_blank" class="related-external-datasets__link">
							{{ item.table_name ?? item.name}}
						</a>
					</li>
				</ul>
			</div>
			<div class="ui-form-row related-external-datasets__empty-row" v-else>
				<div class="related-external-datasets__no-data-logo-content">
					<div class="related-external-datasets__no-data-logo">
					</div>
					<span class="related-external-datasets__no-data-logo-text">{{ $Bitrix.Loc.getMessage('DATASET_IMPORT_RELATED_EXTERNAL_DATASETS_NO_DATASETS') }}</span>
				</div>
			</div>
		</Step>
	`,
};
