import type { ResourceModel } from 'booking.model.resources';
import { mapGetters } from 'ui.vue3.vuex';

import { Model } from 'booking.const';
import type { SkuResourcesEditorOptions } from 'booking.model.sku-resources-editor';

import { SearchInput } from '../base/search-input/search-input';
import { ResourcesItem } from './resources-item/resources-item';
import { EmptyState } from './empty-state/empty-state';
import { ResourcesBar } from './resources-bar/resources-bar';
import { AddResourcesButton } from './add-resources-button/add-resources-button';
import { ResourcesGroupActionBar } from './resources-group-action-bar/resources-group-action-bar';
import { ResourcesGroup } from './resources-group/resources-group';

import './resources-view.css';

// @vue/component
export const ResourcesView = {
	name: 'ResourcesView',
	components: {
		AddResourcesButton,
		SearchInput,
		ResourcesGroup,
		ResourcesGroupActionBar,
		ResourcesItem,
		ResourcesBar,
		EmptyState,
	},
	data(): ResourcesViewData
	{
		return {
			search: '',
			selected: new Set(),
		};
	},
	computed: {
		...mapGetters({
			getResourcesByIds: `${Model.SkuResourcesEditor}/getResourcesByIds`,
		}),
		resourcesSkusMap(): Map<number, Set<number>>
		{
			return this.$store.state[Model.SkuResourcesEditor].resourcesSkusMap;
		},
		resources(): ResourceModel[]
		{
			return this.getResourcesByIds([...this.resourcesSkusMap.keys()]);
		},
		resourcesList(): ResourceModel[]
		{
			if (!this.search)
			{
				return this.resources;
			}

			const query = this.search.toLowerCase();

			return this.resources.filter((resource) => resource.name.toLowerCase().includes(query));
		},
		groupedResources(): Map<number, ResourceModel[]>
		{
			const groupedResources = new Map();

			for (const resource of this.resourcesList)
			{
				const resources = groupedResources.get(resource.typeId) || [];
				resources.push(resource);
				groupedResources.set(resource.typeId, resources);
			}

			return groupedResources;
		},
		skusResourcesEditorOptions(): SkuResourcesEditorOptions
		{
			return this.$store.state[Model.SkuResourcesEditor].options;
		},
	},
	methods: {
		selectResource(resourceId: number): void
		{
			if (this.selected.has(resourceId))
			{
				this.selected.delete(resourceId);
			}
			else
			{
				this.selected.add(resourceId);
			}
		},
		toggleAll(): void
		{
			if (this.selected.size === this.resources.length)
			{
				this.selected.clear();
			}
			else
			{
				this.resources.forEach((resource) => this.selected.add(resource.id));
			}
		},
		toggleSelectGroup({ checked, resourcesIds }: { checked: boolean, resourcesIds: number[] }): void
		{
			if (checked)
			{
				resourcesIds.forEach((id) => this.selected.add(id));
			}
			else
			{
				resourcesIds.forEach((id) => this.selected.delete(id));
			}
		},
		getSelectedResources(): Array
		{
			return this.resources.filter(({ id }) => this.selected.has(id));
		},
	},
	template: `
		<div class="booking-sre-app__resources-view">
			<ResourcesGroupActionBar
				v-if="selected.size > 0"
				:resources="getSelectedResources()"
				@close="selected.clear()"
			/>
			<SearchInput 
				v-model="search"
				:placeholder-text="loc('BOOKING_SERVICES_SETTINGS_POPUP_SEARCH_RESOURCE_INPUT_PLACEHOLDER')"
			/>
			<ResourcesBar
				:checked="selected.size > 0 && (selected.size === resources.length)"
				:resourcesCount="resources.length"
				@update:checked="toggleAll"
			>
				<template #button>
					<AddResourcesButton
						v-if="skusResourcesEditorOptions.editMode"
					/>
				</template>
			</ResourcesBar>
			<div class="booking-sre-app__resources-view__resources-list">
				<template v-if="resourcesList.length > 0">
					<ResourcesGroup
						v-for="[typeId, resources] of groupedResources"
						:key="typeId"
						:selected="selected"
						:typeId="typeId"
						:resourcesIds="resources.map(({ id }) => id)"
						@selectGroup="toggleSelectGroup"
					>
						<div class="booking-sre-app__resources-view__resources-list">
							<ResourcesItem
								v-slot="{ resourcesIds }"
								v-for="resource of resources"
								:key="resource.id"
								:resourceId="resource.id"
								:selected="selected.has(resource.id)"
								@update:selected="selectResource"
								@afterRemove="selected.delete($event)"
							/>
						</div>
					</ResourcesGroup>
				</template>
				<EmptyState
					v-else
					:resource-title="search"
				/>
			</div>
		</div>
	`,
};

type ResourcesViewData = {
	search: string;
	selected: Set<number>;
}
