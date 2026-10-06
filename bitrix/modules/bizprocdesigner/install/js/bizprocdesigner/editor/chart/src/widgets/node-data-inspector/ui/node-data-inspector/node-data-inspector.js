import { BIcon, Outline } from 'ui.icon-set.api.vue';
import { mapState, mapActions } from 'ui.vue3.pinia';
import { Type } from 'main.core';

import {
	InspectorSearch,
	InspectorViewModeButton,
	NodeDataInspectorLayout,
	InspectorSchemeView,
	InspectorGridView,
	InspectorCloseButton,
	InspectorEmptyState,
	type InspectorViewItemBase,
} from '../../../../entities/node-data-inspector';
import { NavigateGridView, FilterGridView } from '../../../../features/node-data-inspector';
import { useNodeSettingsStore } from '../../../../entities/node-settings';
import { useAppStore } from '../../../../entities/app';
import { diagramStore } from '../../../../entities/blocks/stores';

import { useNodeDataInspectorStore } from '../../../../shared/stores/node-data-inspector-store';
import { getTemplateDataProvider } from '../../../../shared/utils/template-data-provider';
import {
	type ActivityData,
	type Block,
	type TemplateDataGeneralGroup,
} from '../../../../shared/types';

import { mapTemplateGroupsToView } from '../../utils/map-provider-data-to-view';
import {
	ViewMode,
	ViewModeConfigs,
	SchemeViewGroupKey,
} from './const';
import {
	createPreparedItemsRequestState,
	createPreparedItemsRequestVersion,
	destroyPreparedItemsRequestState,
	filterWorkflowData,
	prepareCurrentItems,
	type PreparedItemsRequestState,
} from './node-data-inspector-utils';

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
		InspectorCloseButton,
		InspectorEmptyState,
		NavigateGridView,
		FilterGridView,
	},
	data(): {
		searchValue: string,
		viewMode: $Keys<typeof ViewModeConfigs>,
		providedItems: ?Object,
		providedItemsBlockId: ?string,
		preparedItemsRequestState: PreparedItemsRequestState,
		updateRafId: ?number,
		} {
		return {
			searchValue: '',
			viewMode: ViewMode.SCHEME,
			providedItems: null,
			providedItemsBlockId: null,
			preparedItemsRequestState: createPreparedItemsRequestState(),
			updateRafId: null,
		};
	},
	computed: {
		...mapState(useNodeDataInspectorStore, [
			'block',
			'activityData',
			'countRowsOnPage',
			'currentPageNumber',
			'selectedGridViewGroup',
			'lastValues',
		]),
		...mapState(useNodeSettingsStore, ['ports']),
		...mapState(diagramStore, ['templateId']),
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
				groups: mapTemplateGroupsToView(items, this.ports ?? [], this.lastValues),
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
		gridTemplateData(): { groups: Array<TemplateDataGeneralGroup> }
		{
			return {
				groups: (this.templateData?.groups ?? []).filter((g) => g.id !== SchemeViewGroupKey.FILTER),
			};
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
		// The panel is mounted anew on every open, so one request per mount is
		// exactly one request per open of the data panel.
		this.loadLastValues(this.templateId);
	},
	beforeUnmount()
	{
		destroyPreparedItemsRequestState(this.preparedItemsRequestState);
		if (this.updateRafId !== null)
		{
			cancelAnimationFrame(this.updateRafId);
		}
	},
	methods: {
		...mapActions(useAppStore, ['toggleDataInspectorPanel']),
		...mapActions(useNodeDataInspectorStore, ['resetGridView', 'loadLastValues']),
		scheduleProvidedItemsUpdate(): void
		{
			const requestVersion = createPreparedItemsRequestVersion(this.preparedItemsRequestState);
			if (this.updateRafId !== null)
			{
				cancelAnimationFrame(this.updateRafId);
			}

			if (!this.block)
			{
				this.providedItems = null;
				this.providedItemsBlockId = null;
				this.updateRafId = null;

				return;
			}

			const block = this.block;
			const activityData = this.activityData;
			if (this.providedItemsBlockId !== block.id)
			{
				this.providedItems = null;
				this.providedItemsBlockId = null;
			}

			this.updateRafId = requestAnimationFrame(() => {
				this.updateRafId = null;
				void this.updateProvidedItems(requestVersion, block, activityData);
			});
		},
		async updateProvidedItems(
			requestVersion: number,
			block: Block,
			activityData: ?ActivityData,
		): Promise<void>
		{
			const provider = getTemplateDataProvider();
			const preparedItems = await prepareCurrentItems(
				provider,
				this.preparedItemsRequestState,
				requestVersion,
				block,
				activityData,
			);
			if (!preparedItems)
			{
				return;
			}

			this.providedItems = preparedItems;
			this.providedItemsBlockId = block.id;
		},
		filterWorkflowData(
			data: { groups: Array<InspectorViewItemBase> },
			searchValue: string,
		): { groups: Array<InspectorViewItemBase> }
		{
			return filterWorkflowData(data, searchValue);
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
					:templateData="gridTemplateData"
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
				/>
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
