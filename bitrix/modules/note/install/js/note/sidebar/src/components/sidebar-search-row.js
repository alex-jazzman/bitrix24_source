import { BIcon } from 'ui.icon-set.api.vue';
import 'ui.icon-set.outline';

import { SidebarSearchInput } from './sidebar-search-input';
import { SidebarCreateButton } from './sidebar-create-button';

export const SidebarSearchRow = {
	name: 'SidebarSearchRow',
	components: {
		SidebarSearchInput,
		SidebarCreateButton,
		BIcon,
	},
	props: {
		state: { type: Object, required: true },
		actions: { type: Object, required: true },
	},
	emits: ['navigate-document', 'navigate-search'],
	methods: {
		focusInput(): void
		{
			this.$refs.searchInput?.focusInput();
		},
	},
	computed: {
		showCreateButton(): boolean
		{
			return Boolean(
				this.state?.permissions?.canEditCollections
				|| this.state?.permissions?.hasManageableCollection,
			);
		},
	},
	template: `
		<div class="sidebar-search-row" :class="{ 'sidebar-search-row--no-create': !showCreateButton }">
			<SidebarSearchInput
				ref="searchInput"
				@navigate-document="$emit('navigate-document', $event)"
				@navigate-search="$emit('navigate-search', $event)"
			/>
			<SidebarCreateButton :state="state" :actions="actions" variant="row" />
		</div>
	`,
};
