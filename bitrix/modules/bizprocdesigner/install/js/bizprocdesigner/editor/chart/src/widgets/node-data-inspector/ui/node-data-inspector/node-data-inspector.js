import { BIcon, Outline } from 'ui.icon-set.api.vue';
import { mapState, mapActions } from 'ui.vue3.pinia';
import { Type } from 'main.core';

import {
	InspectorSearch,
	InspectorViewModeButton,
	NodeDataInspectorLayout,
	InspectorSchemeView,
	InspectorSchemeLoadingView,
	InspectorGridView,
	InspectorCloseButton,
	InspectorEmptyState,
	type InspectorViewItemBase,
} from '../../../../entities/node-data-inspector';
import { NavigateGridView, FilterGridView } from '../../../../features/node-data-inspector';
import { useNodeSettingsStore } from '../../../../entities/node-settings';
import { useAppStore } from '../../../../entities/app';

import { useNodeDataInspectorStore } from '../../../../shared/stores/node-data-inspector-store';
import { documentFieldsCache } from '../../../../shared/utils';
import { getTemplateDataProvider } from '../../../../shared/utils/template-data-provider';
import { type TemplateDataGeneralGroup } from '../../../../shared/types';

import { mapTemplateGroupsToView } from '../../utils/map-provider-data-to-view';
import {
	ViewMode,
	ViewModeConfigs,
} from './const';

// @vue/component
export const NodeDataInspector = {
	name: 'NodeDataInspector',
	components: {
		BIcon,
		NodeDataInspectorLayout,
		InspectorSearch,
		InspectorViewModeButton,
		InspectorSchemeView,
		InspectorGridView,
		InspectorSchemeLoadingView,
		InspectorCloseButton,
		InspectorEmptyState,
		NavigateGridView,
		FilterGridView,
	},
	provide(): Object
	{
		return {
			loadDocumentFields: (documentType: string | Array<string>) => this.loadDocumentFields(documentType),
		};
	},
	data(): {
		searchValue: string,
		viewMode: $Keys<typeof ViewModeConfigs>,
		providedItems: ?Object,
		} {
		return {
			searchValue: '',
			viewMode: ViewMode.SCHEME,
			providedItems: null,
		};
	},
	computed: {
		...mapState(useNodeDataInspectorStore, [
			'block',
			'activityData',
			'countRowsOnPage',
			'currentPageNumber',
			'selectedGridViewGroup',
		]),
		...mapState(useNodeSettingsStore, ['ports']),
		templateData(): { groups: Array<TemplateDataGeneralGroup> }
		{
			const items = this.providedItems;

			if (!items)
			{
				return {
					groups: [],
				};
			}

			const mappedData = {
				groups: mapTemplateGroupsToView(items, this.ports ?? []),
			};

			const normalizedSearchValue = Type.isStringFilled(this.searchValue)
				? this.searchValue.trim().toLowerCase()
				: ''
			;

			if (!normalizedSearchValue)
			{
				return mappedData;
			}

			return this.filterWorkflowData(mappedData, normalizedSearchValue);
		},
		viewModeConfigList(): $Values<typeof ViewModeConfigs>
		{
			return Object.values(ViewModeConfigs);
		},
		isEmpty(): boolean
		{
			return !this.templateData?.groups?.length;
		},
		Outline: (): typeof Outline => Outline,
		ViewMode: (): typeof ViewMode => ViewMode,
		isGridVisible(): boolean
		{
			return this.viewMode === ViewMode.GRID;
		},
	},
	watch: {
		block: {
			immediate: true,
			handler(): void
			{
				this.scheduleProvidedItemsUpdate();
			},
		},
		activityData(): void
		{
			this.scheduleProvidedItemsUpdate();
		},
	},
	created()
	{
		const provider = getTemplateDataProvider();
		this.onDocumentFieldsLoadedHandler = () => {
			this.scheduleProvidedItemsUpdate();
		};
		provider.subscribe('onDocumentFieldsLoaded', this.onDocumentFieldsLoadedHandler);
	},
	beforeUnmount()
	{
		cancelAnimationFrame(this.updateRafId);

		const provider = getTemplateDataProvider();
		provider.unsubscribe('onDocumentFieldsLoaded', this.onDocumentFieldsLoadedHandler);
	},
	methods: {
		...mapActions(useAppStore, ['toggleDataInspectorPanel']),
		...mapActions(useNodeDataInspectorStore, ['resetGridView']),
		async loadDocumentFields(documentType: string | Array<string>): Promise<Array<Object>>
		{
			const fields = await documentFieldsCache.fetchFields(documentType);
			if (fields.length > 0)
			{
				this.scheduleProvidedItemsUpdate();
			}

			return fields;
		},
		scheduleProvidedItemsUpdate(): void
		{
			cancelAnimationFrame(this.updateRafId);
			this.updateRafId = requestAnimationFrame(() => {
				this.updateProvidedItems();
			});
		},
		updateProvidedItems(): void
		{
			if (!this.block)
			{
				this.providedItems = null;

				return;
			}

			const provider = getTemplateDataProvider();
			this.providedItems = {
				templateItems: provider.getTemplateItems(),
				incomingItems: provider.getIncomingProperties(this.block),
				outgoingItems: provider.getOutgoingProperties(this.block, { activityData: this.activityData }),
			};
		},
		filterWorkflowData(
			data: { groups: InspectorViewItemBase },
			searchValue: string,
		): { groups: InspectorViewItemBase }
		{
			const filteredGroups = (Array.isArray(data?.groups) ? data.groups : [])
				.map((group) => this.filterGroup(group, searchValue))
				.filter(Boolean)
			;

			return {
				...data,
				groups: filteredGroups,
			};
		},
		filterGroup(group: InspectorViewItemBase, searchValue: string): InspectorViewItemBase | null
		{
			const filteredItems = this.filterItems(group?.items, searchValue);

			if (filteredItems.length === 0)
			{
				return null;
			}

			return {
				...group,
				items: filteredItems,
			};
		},
		filterItems(items: ?InspectorViewItemBase, searchValue: string): InspectorViewItemBase['items']
		{
			const normalizedItems = Array.isArray(items) ? items : [];

			return normalizedItems
				.map((item) => {
					const itemText = Type.isStringFilled(item?.text) ? item.text.toLowerCase() : '';
					const isTextMatch = itemText.includes(searchValue);

					if (isTextMatch)
					{
						return item;
					}

					const childItems = this.filterItems(item?.items, searchValue);

					if (childItems.length > 0)
					{
						return {
							...item,
							items: childItems,
						};
					}

					return null;
				})
				.filter(Boolean)
			;
		},
		onClose(): void
		{
			this.toggleDataInspectorPanel();
			this.resetGridView();
		},
		onViewModeConfigClick(config: $Keys<typeof ViewModeConfigs>): void
		{
			this.viewMode = config;
		},
	},
	template: `
		<NodeDataInspectorLayout>
			<template #title>
				{{ $Bitrix.Loc.getMessage('BIZPROCDESIGNER_EDITOR_NODE_DATA_INSPECTOR_TITLE') }}
			</template>
			<template #header-controls>
				<InspectorCloseButton
					@click="onClose"
				/>
			</template>
			<template #filter>
				<FilterGridView
					v-if="viewMode === ViewMode.GRID"
					:templateData="templateData"
				/>
			</template>
			<template #search>
				<InspectorSearch
					:modelValue="searchValue"
					@update:modelValue="searchValue = $event"
				/>
			</template>
			<template #view-mode>
				<InspectorViewModeButton
					v-for="{ key, title } in viewModeConfigList"
					:key="key"
					:title="title"
					:isActive="viewMode === key"
					@click="onViewModeConfigClick(key)"
				/>
			</template>
			<template #data-viewer>
				<InspectorEmptyState v-if="isEmpty"/>
				<InspectorSchemeView
					v-else-if="viewMode === ViewMode.SCHEME"
					:data="templateData"
				>
					<template #loading>
						<InspectorSchemeLoadingView/>
					</template>
				</InspectorSchemeView>
				<InspectorGridView
					v-else-if="isGridVisible"
					:countRowsOnPage="countRowsOnPage"
					:currentPageNumber="currentPageNumber"
					:selectedGridViewGroup="selectedGridViewGroup"
				>
					<template #navigate-grid-view="{ totalRowsCount }">
						<NavigateGridView
							:totalRowsCount="totalRowsCount"
						/>
					</template>
				</InspectorGridView>
			</template>
		</NodeDataInspectorLayout>
	`,
};
