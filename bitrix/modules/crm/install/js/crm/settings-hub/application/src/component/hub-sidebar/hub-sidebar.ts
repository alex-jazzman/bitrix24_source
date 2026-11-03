import { defineComponent, type PropType } from 'ui.vue3';
import { locMixin } from 'ui.vue3.mixins.loc-mixin';

import { CrmSettingsHubHubSearch } from '../hub-search/hub-search';

import './hub-sidebar.css';

export type HubSidebarSection = Readonly<{
	id: string,
	title: string,
}>;

export const CrmSettingsHubHubSidebar = defineComponent({
	name: 'CrmSettingsHubHubSidebar',
	components: { CrmSettingsHubHubSearch },
	mixins: [locMixin],
	props: {
		sections: {
			type: Array as PropType<readonly HubSidebarSection[]>,
			required: true,
		},
		selectedId: {
			type: String,
			default: null,
		},
		query: {
			type: String,
			required: true,
		},
	},
	emits: ['select-section', 'update-query', 'clear-query'],
	computed: {
		menuTitle(): string
		{
			return this.loc('CRM_SETTINGS_HUB_TITLE');
		},
		emptyMenuText(): string
		{
			return this.loc('CRM_SETTINGS_HUB_MENU_EMPTY');
		},
	},
	template: `
		<aside
			class="crm-settings-hub-application__menu"
			data-testid="crm-settings-hub-application-sidebar"
			:aria-label="menuTitle"
		>
			<div class="crm-settings-hub-application__menu-title">{{ menuTitle }}</div>
			<CrmSettingsHubHubSearch
				:model-value="query"
				@update:model-value="$emit('update-query', $event)"
				@clear="$emit('clear-query')"
			/>
			<nav
				class="crm-settings-hub-application__menu-list"
				data-testid="crm-settings-hub-application-sidebar-menu-list"
			>
				<button
					v-for="section in sections"
					:key="section.id"
					type="button"
					class="crm-settings-hub-application__menu-item"
					:class="{ '--active': section.id === selectedId }"
					:data-testid="'crm-settings-hub-application-menu-' + section.id"
					:aria-current="section.id === selectedId ? 'page' : null"
					@click="section.id !== selectedId && $emit('select-section', section.id)"
				>
					<span class="crm-settings-hub-application__menu-text">{{ section.title }}</span>
				</button>
				<div v-if="sections.length === 0" class="crm-settings-hub-application__menu-empty">
					{{ emptyMenuText }}
				</div>
			</nav>
		</aside>
	`,
});
