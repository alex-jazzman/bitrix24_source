import { defineComponent } from 'ui.vue3';
import { locMixin } from 'ui.vue3.mixins.loc-mixin';
import { BIcon, Outline } from 'ui.icon-set.api.vue';
import 'ui.icon-set.outline';
import 'ui.buttons';

import './empty-state.css';

export const CrmSettingsHubEmptyState = defineComponent({
	name: 'CrmSettingsHubEmptyState',
	components: { BIcon },
	mixins: [locMixin],
	props: {
		narrowed: {
			type: Boolean,
			required: true,
		},
	},
	emits: ['reset'],
	setup(): Object
	{
		return { searchIcon: Outline.SEARCH };
	},
	computed: {
		title(): string
		{
			return this.loc(
				this.narrowed ? 'CRM_SETTINGS_HUB_EMPTY_SEARCH_TITLE' : 'CRM_SETTINGS_HUB_EMPTY_SECTION_TITLE',
			);
		},
		text(): string
		{
			return this.loc(
				this.narrowed ? 'CRM_SETTINGS_HUB_EMPTY_SEARCH_TEXT' : 'CRM_SETTINGS_HUB_EMPTY_SECTION_TEXT',
			);
		},
		resetText(): string
		{
			return this.loc('CRM_SETTINGS_HUB_SEARCH_RESET');
		},
	},
	template: `
		<div
			class="crm-settings-hub-application__empty"
			data-testid="crm-settings-hub-application-empty-state"
			role="status"
		>
			<BIcon :name="searchIcon" class="crm-settings-hub-application__empty-icon"/>
			<span class="crm-settings-hub-application__empty-title">{{ title }}</span>
			<span class="crm-settings-hub-application__empty-text">{{ text }}</span>
			<button
				v-if="narrowed"
				type="button"
				class="ui-btn ui-btn-light-border ui-btn-sm crm-settings-hub-application__empty-reset"
				data-testid="crm-settings-hub-application-empty-state-reset"
				@click="$emit('reset')"
			>
				{{ resetText }}
			</button>
		</div>
	`,
});
