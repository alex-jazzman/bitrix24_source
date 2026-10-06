import { Loc, Tag } from 'main.core';
import { markRaw } from 'ui.vue3';
import { BIcon } from 'ui.icon-set.api.vue';
import { ActionMenuService } from 'note.ui.action-menu';
import 'ui.icon-set.outline';

// Shared by the search row and the collapsed rail: both need the same rights branching -
// two rights open a menu, a single right runs its action straight away.
export const SidebarCreateButton = {
	name: 'SidebarCreateButton',
	components: {
		BIcon,
	},
	props: {
		state: { type: Object, required: true },
		actions: { type: Object, required: true },
		// `row` - square air button in the search row; `rail` - 44px icon button of the rail.
		variant: { type: String, default: 'row' },
	},
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
		isVisible(): boolean
		{
			return this.canCreateCollection || this.canCreateDocument;
		},
		label(): string
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
		buttonClass(): string
		{
			return this.variant === 'rail'
				? 'sidebar-rail__btn'
				: 'sidebar-search-row__create ui-btn --air --with-icon ui-btn-md --style-plain-accent ui-btn-collapsed'
			;
		},
		iconSize(): number
		{
			return this.variant === 'rail' ? 22 : 20;
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
		onClick(event: Event): void
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
				<span class="note-action-menu-icon sidebar-search-row__menu-icon-collection note-collection-glyph"></span>
			`;

			const items = [
				{
					text: Loc.getMessage('NOTE_SIDEBAR_CREATE_DOCUMENT_MENU') || '',
					iconModifier: 'o-document-sign',
					testId: 'note-create-menu-document',
					onClick: () => { void this.actions?.createDocumentFromSidebar?.(); },
				},
				{
					text: Loc.getMessage('NOTE_SIDEBAR_CREATE_COLLECTION_MENU') || '',
					iconElement: collectionIcon,
					testId: 'note-create-menu-collection',
					onClick: () => { void this.actions?.createCollection?.(); },
				},
			];

			this.actionMenuService.open(items, bindElement, {
				key: 'sidebar-create-button',
			});
		},
	},
	template: `
		<button
			v-if="isVisible"
			type="button"
			:class="buttonClass"
			:title="label"
			:aria-label="label"
			data-testid="note-sidebar-create"
			@click="onClick($event)"
		>
			<BIcon name="plus-l" :size="iconSize" />
		</button>
	`,
};
