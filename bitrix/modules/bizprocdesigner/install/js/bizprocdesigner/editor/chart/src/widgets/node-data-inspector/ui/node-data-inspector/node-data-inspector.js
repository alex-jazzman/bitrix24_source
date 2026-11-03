import { BIcon, Outline } from 'ui.icon-set.api.vue';
import { mapState, mapActions } from 'ui.vue3.pinia';
import { LiveAnnouncer } from 'ui.a11y';
import { Loc, Type } from 'main.core';

import {
	InspectorSearch,
	InspectorViewModeButton,
	NodeDataInspectorLayout,
	InspectorSchemeView,
	InspectorGridView,
	InspectorCloseButton,
	InspectorEmptyState,
	InspectorSkeleton,
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
	SKELETON_DELAY_MS,
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
		InspectorSkeleton,
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
		skeletonDelayTimeoutId: ?number,
		isSkeletonDelayElapsed: boolean,
		} {
		return {
			searchValue: '',
			viewMode: ViewMode.SCHEME,
			providedItems: null,
			providedItemsBlockId: null,
			preparedItemsRequestState: createPreparedItemsRequestState(),
			updateRafId: null,
			skeletonDelayTimeoutId: null,
			isSkeletonDelayElapsed: false,
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
		mappedTemplateData(): { groups: Array<TemplateDataGeneralGroup> }
		{
			const items = this.providedItems;

			if (!items)
			{
				return {
					groups: [],
				};
			}

			return {
				groups: mapTemplateGroupsToView(items, this.ports ?? [], this.lastValues),
			};
		},
		templateData(): { groups: Array<TemplateDataGeneralGroup> }
		{
			const normalizedSearchValue = Type.isStringFilled(this.searchValue)
				? this.searchValue.trim().toLowerCase()
				: ''
			;

			if (!normalizedSearchValue)
			{
				return this.mappedTemplateData;
			}

			return this.filterWorkflowData(this.mappedTemplateData, normalizedSearchValue);
		},
		viewModeConfigList(): $Values<typeof ViewModeConfigs>
		{
			return Object.values(ViewModeConfigs);
		},
		isEmpty(): boolean
		{
			return !this.templateData?.groups?.length;
		},
		// The snapshot of the selected block has not arrived yet. Never read `isEmpty` for this: it
		// counts the tree already filtered by the search string, so a search without matches would
		// look like loading.
		isSnapshotPending(): boolean
		{
			if (!this.block)
			{
				return false;
			}

			return this.providedItems === null || this.providedItemsBlockId !== this.block.id;
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
		// The pending state owns the delay before the skeleton: entering it starts the delay,
		// leaving it drops both the delay and the placeholder.
		isSnapshotPending: {
			immediate: true,
			handler(isPending: boolean, wasPending: boolean): void
			{
				if (isPending)
				{
					this.startSkeletonDelay();

					return;
				}

				const wasSkeletonShown = this.isSkeletonDelayElapsed;
				this.clearSkeletonDelay();

				// Losing the block also ends the pending state, and that is not a result to
				// announce. Neither is a snapshot that arrived before the placeholder was shown:
				// there was no loading to report the end of.
				if (wasPending && wasSkeletonShown && this.block)
				{
					this.announceSnapshotReady();
				}
			},
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

		this.clearSkeletonDelay();
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
		startSkeletonDelay(): void
		{
			this.clearSkeletonDelay();
			this.skeletonDelayTimeoutId = setTimeout(() => {
				this.skeletonDelayTimeoutId = null;
				this.isSkeletonDelayElapsed = true;
				this.announceSnapshotLoading();
			}, SKELETON_DELAY_MS);
		},
		clearSkeletonDelay(): void
		{
			if (this.skeletonDelayTimeoutId !== null)
			{
				clearTimeout(this.skeletonDelayTimeoutId);
				this.skeletonDelayTimeoutId = null;
			}

			this.isSkeletonDelayElapsed = false;
		},
		filterWorkflowData(
			data: { groups: Array<InspectorViewItemBase> },
			searchValue: string,
		): { groups: Array<InspectorViewItemBase> }
		{
			return filterWorkflowData(data, searchValue);
		},
		// The placeholder appears without moving focus and carries no live region of its own, so
		// the start of the loading reaches a screen reader only through the announcer.
		announceSnapshotLoading(): void
		{
			const message = Loc.getMessage('BIZPROCDESIGNER_EDITOR_NODE_DATA_INSPECTOR_LOADING_STATE_TITLE');

			if (Type.isStringFilled(message))
			{
				LiveAnnouncer.announce(message);
			}
		},
		// The replacement of the skeleton moves no focus, so without this the result of the
		// loading never reaches a screen reader.
		announceSnapshotReady(): void
		{
			const message = this.isEmpty
				? Loc.getMessage('BIZPROCDESIGNER_EDITOR_NODE_DATA_INSPECTOR_EMPTY_STATE_TITLE')
				: Loc.getMessage('BIZPROCDESIGNER_EDITOR_NODE_DATA_INSPECTOR_LOADED_ANNOUNCE')
			;

			if (Type.isStringFilled(message))
			{
				LiveAnnouncer.announce(message);
			}
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
				<template v-if="isSnapshotPending">
					<InspectorSkeleton v-if="isSkeletonDelayElapsed"/>
				</template>
				<InspectorEmptyState v-else-if="isEmpty"/>
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
