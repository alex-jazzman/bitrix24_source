import { defineComponent, type PropType } from 'ui.vue3';

import { CrmSettingsHubCapabilityGroup } from '../capability-group/capability-group';
import { CrmSettingsHubEmptyState } from '../empty-state/empty-state';
import { CrmSettingsHubGptPrompt } from '../gpt-prompt/gpt-prompt';
import { HubFilter } from '../../model/hub-filter';
import {
	type Capability,
	type CapabilityGroup,
	type CatalogSectionRegistration,
} from '../../model/types';

import './capabilities-panel.css';

export const CrmSettingsHubCapabilitiesPanel = defineComponent({
	name: 'CrmSettingsHubCapabilitiesPanel',
	components: {
		CrmSettingsHubCapabilityGroup,
		CrmSettingsHubEmptyState,
		CrmSettingsHubGptPrompt,
	},
	props: {
		section: {
			type: Object as PropType<CatalogSectionRegistration>,
			required: true,
		},
		query: {
			type: String,
			required: true,
		},
		activeCapabilityId: {
			type: String as PropType<string | null>,
			default: null,
		},
		selectedSectionId: {
			type: String as PropType<string | null>,
			default: null,
		},
	},
	emits: ['select-capability', 'content-sections-change', 'activate', 'reset-search'],
	computed: {
		activeCapability(): Capability | null
		{
			if (this.activeCapabilityId === null)
			{
				return null;
			}

			for (const group of this.section.catalog.groups)
			{
				const capability = group.capabilities.find(({ id }) => id === this.activeCapabilityId);
				if (capability !== undefined)
				{
					return capability;
				}
			}

			return null;
		},
		titleId(): string
		{
			return 'crm-settings-hub-application-capabilities-title';
		},
		visibleGroups(): readonly CapabilityGroup[]
		{
			const filter = new HubFilter();
			filter.setQuery(this.query);

			return this.section.catalog.groups
				.map((group) => ({
					...group,
					capabilities: group.capabilities.filter((capability) => filter.matchesCapability(capability)),
				}))
				.filter((group) => group.capabilities.length > 0);
		},
	},
	template: `
		<component
			v-if="activeCapability"
			:is="activeCapability.component"
			:capability="activeCapability"
			:active-capability-id="activeCapabilityId"
			:selected-section-id="selectedSectionId"
			:query="query"
			@select-capability="$emit('select-capability', $event)"
			@content-sections-change="$emit('content-sections-change', $event)"
			@activate="$emit('activate', $event)"
		/>
		<div
			v-else-if="activeCapabilityId === null"
			class="crm-settings-hub-application__catalog"
			data-testid="crm-settings-hub-application-capabilities-catalog"
		>
			<h1
				:id="titleId"
				class="crm-settings-hub-application__title crm-settings-hub-application__sr-only"
			>
				{{ section.title }}
			</h1>
			<CrmSettingsHubGptPrompt/>
			<CrmSettingsHubCapabilityGroup
				v-for="group in visibleGroups"
				:key="group.id"
				:group="group"
				:active-capability-id="activeCapabilityId"
				:selected-section-id="selectedSectionId"
				:query="query"
				@select-capability="$emit('select-capability', $event)"
				@content-sections-change="$emit('content-sections-change', $event)"
				@activate="$emit('activate', $event)"
			/>
			<CrmSettingsHubEmptyState
				v-if="visibleGroups.length === 0"
				:narrowed="query !== ''"
				@reset="$emit('reset-search')"
			/>
		</div>
	`,
});
