import { Loc, Tag } from 'main.core';
import { markRaw } from 'ui.vue3';
import { BIcon } from 'ui.icon-set.api.vue';
import { ActionMenuService } from 'note.ui.action-menu';
import 'ui.icon-set.outline';

import { SidebarSearchInput } from './sidebar-search-input';

export const SidebarSearchRow = {
	name: 'SidebarSearchRow',
	components: {
		SidebarSearchInput,
		BIcon,
	},
	props: {
		state: { type: Object, required: true },
		actions: { type: Object, required: true },
	},
	emits: ['navigate-document', 'navigate-search'],
	data(): Object
	{
		return {
			actionMenuService: markRaw(new ActionMenuService({ popupClass: 'note-action-menu' })),
		};
	},
	computed: {
		canCreateCollection(): boolean
		{
			return Boolean(this.state?.permissions?.canEditCollections);
		},
		canCreateDocument(): boolean
		{
			return Boolean(this.state?.permissions?.hasManageableCollection);
		},
		showCreateButton(): boolean
		{
			return this.canCreateCollection || this.canCreateDocument;
		},
		createButtonLabel(): string
		{
			if (this.canCreateCollection && this.canCreateDocument)
			{
				return Loc.getMessage('NOTE_SIDEBAR_CREATE_MENU') || '';
			}

			if (this.canCreateDocument)
			{
				return Loc.getMessage('NOTE_SIDEBAR_CREATE_DOCUMENT_MENU') || '';
			}

			return Loc.getMessage('NOTE_SIDEBAR_CREATE_COLLECTION_MENU') || '';
		},
	},
	beforeUnmount(): void
	{
		if (this.actionMenuService)
		{
			this.actionMenuService.destroy();
		}
	},
	methods: {
		onCreateClick(event: Event): void
		{
			if (this.canCreateCollection && this.canCreateDocument)
			{
				this.openCreateMenu(event.currentTarget);

				return;
			}

			if (this.canCreateDocument)
			{
				void this.actions?.createDocumentFromSidebar?.();

				return;
			}

			if (this.canCreateCollection)
			{
				void this.actions?.createCollection?.();
			}
		},
		openCreateMenu(bindElement: HTMLElement): void
		{
			const collectionIcon = Tag.render`
				<span class="note-action-menu-icon sidebar-search-row__menu-icon-collection"></span>
			`;

			const items = [
				{
					text: Loc.getMessage('NOTE_SIDEBAR_CREATE_DOCUMENT_MENU') || '',
					iconModifier: 'o-document-sign',
					onClick: () => { void this.actions?.createDocumentFromSidebar?.(); },
				},
				{
					text: Loc.getMessage('NOTE_SIDEBAR_CREATE_COLLECTION_MENU') || '',
					iconElement: collectionIcon,
					onClick: () => { void this.actions?.createCollection?.(); },
				},
			];

			this.actionMenuService.open(items, bindElement, {
				key: 'sidebar-search-row-create',
			});
		},
	},
	template: `
		<div class="sidebar-search-row" :class="{ 'sidebar-search-row--no-create': !showCreateButton }">
			<SidebarSearchInput
				@navigate-document="$emit('navigate-document', $event)"
				@navigate-search="$emit('navigate-search', $event)"
			/>
			<button
				v-if="showCreateButton"
				type="button"
				class="sidebar-search-row__create"
				:title="createButtonLabel"
				:aria-label="createButtonLabel"
				@click="onCreateClick($event)"
			>
				<BIcon class="sidebar-search-row__create-icon" name="plus-l" :size="28" color="var(--ui-color-accent-main-primary)" />
			</button>
		</div>
	`,
};
