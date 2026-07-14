import { Loc, Type } from 'main.core';
import { markRaw } from 'ui.vue3';
import 'ui.notification';
import { BIcon } from 'ui.icon-set.api.vue';
import { DocumentList } from 'note.ui.document-list';
import { ActionMenuService } from 'note.ui.action-menu';
import { App as PermissionsApp } from 'note.permissions';
import { DialogService } from 'note.sidebar';
import { WorkspaceService } from './services/workspace-service';

const PAGE_SIZE = 50;
const TAB_ALL = 'all';
const TAB_MINE = 'mine';

export const NoteWorkspacePageComponent = {
	name: 'NoteWorkspacePage',
	components: {
		BIcon,
		DocumentList,
	},
	inject: {
		sidebarActions: { from: 'noteSidebarActions', default: null },
		sidebarState: { from: 'noteSidebarState', default: null },
		sidebarStore: { from: 'noteSidebarStore', default: null },
	},
	props: {
		collectionId: { type: Number, required: true },
	},
	emits: ['open', 'archived', 'deleted', 'not-found'],
	data()
	{
		return {
			activeTab: TAB_ALL,
			items: [],
			loading: false,
			hasMore: false,
			hasError: false,
			nextCursor: null,
			requestId: 0,
			isRenamingTitle: false,
			titleDraft: '',
			isLocalDestruction: false,
		};
	},
	computed: {
		collection(): ?Object
		{
			const collections = this.sidebarState?.collections;
			if (!Array.isArray(collections))
			{
				return null;
			}

			return collections.find((c) => Number(c.id) === Number(this.collectionId)) || null;
		},
		title(): string
		{
			return String(this.collection?.name ?? '');
		},
		canManagePermissions(): boolean
		{
			return Boolean(this.collection?.canManagePermissions ?? false);
		},
		canCreateDocuments(): boolean
		{
			return Boolean(this.collection?.canEditCollection);
		},
		canRenameCollection(): boolean
		{
			return Boolean(this.collection?.canEditCollection);
		},
		listItems(): Array
		{
			return this.items.map((item) => ({
				id: item.id,
				title: item.title,
				excerpt: item.excerpt || '',
				author: item.author || null,
				documentId: item.id,
			}));
		},
		showEmpty(): boolean
		{
			return !this.loading && !this.hasError && this.items.length === 0;
		},
		breadcrumbRoot(): string
		{
			return Loc.getMessage('NOTE_WORKSPACE_BREADCRUMB_ROOT') || '';
		},
		messages(): Object
		{
			return {
				createDocument: Loc.getMessage('NOTE_WORKSPACE_CREATE_DOCUMENT') || '',
				copyLink: Loc.getMessage('NOTE_WORKSPACE_COPY_LINK') || '',
				linkCopied: Loc.getMessage('NOTE_WORKSPACE_LINK_COPIED') || '',
				more: Loc.getMessage('NOTE_WORKSPACE_MORE') || '',
				tabAll: Loc.getMessage('NOTE_WORKSPACE_TAB_ALL') || '',
				tabMine: Loc.getMessage('NOTE_WORKSPACE_TAB_MINE') || '',
				menuPermissions: Loc.getMessage('NOTE_WORKSPACE_MENU_PERMISSIONS') || '',
				menuArchive: Loc.getMessage('NOTE_WORKSPACE_MENU_ARCHIVE') || '',
				menuDelete: Loc.getMessage('NOTE_WORKSPACE_MENU_DELETE') || '',
				emptyText: Loc.getMessage('NOTE_WORKSPACE_EMPTY_TEXT') || '',
				confirmDeleteCollection: Loc.getMessage('NOTE_SIDEBAR_CONFIRM_DELETE_COLLECTION') || '',
				confirmDeleteCollectionTitle: Loc.getMessage('NOTE_SIDEBAR_CONFIRM_DELETE_COLLECTION_TITLE') || '',
				confirmArchiveCollection: Loc.getMessage('NOTE_WORKSPACE_CONFIRM_ARCHIVE_COLLECTION') || '',
				confirmArchiveCollectionTitle: Loc.getMessage('NOTE_WORKSPACE_CONFIRM_ARCHIVE_COLLECTION_TITLE') || '',
				delete: Loc.getMessage('NOTE_SIDEBAR_DELETE') || '',
				archive: Loc.getMessage('NOTE_WORKSPACE_ARCHIVE') || '',
				errorArchive: Loc.getMessage('NOTE_COLLECTION_ARCHIVE_ERROR') || '',
				errorDelete: Loc.getMessage('NOTE_COLLECTION_DELETE_ERROR') || '',
			};
		},
		menuItems(): Array
		{
			const items = [];

			if (this.canManagePermissions)
			{
				items.push({
					text: this.messages.menuArchive,
					iconModifier: 'o-box-with-lid',
					onClick: () => { void this.onArchive(); },
				});
				items.push({
					text: this.messages.menuPermissions,
					iconModifier: 'o-settings',
					onClick: () => this.onPermissions(),
				});
				items.push({
					text: this.messages.menuDelete,
					iconModifier: 'o-trashcan',
					danger: true,
					onClick: () => { void this.onDelete(); },
				});
			}

			return items;
		},
		hasMenu(): boolean
		{
			return this.menuItems.length > 0;
		},
	},
	watch: {
		collectionId: {
			handler(): void
			{
				this.activeTab = TAB_ALL;
				this.isRenamingTitle = false;
				this.titleDraft = '';
				void this.loadPage(false);
			},
		},
		activeTab(): void
		{
			void this.loadPage(false);
		},
		collection(next, prev): void
		{
			// Skip when initiator's onDelete/onArchive cleared the entry locally —
			// they already emit 'deleted'/'archived' which trigger the redirect.
			if (prev && !next && !this.isLocalDestruction)
			{
				this.$emit('not-found', { collectionId: this.collectionId });
			}
		},
	},
	created()
	{
		this.service = new WorkspaceService();
		this.actionMenuService = markRaw(new ActionMenuService({ popupClass: 'note-action-menu' }));
		this.dialogService = markRaw(new DialogService());
		void this.loadPage(false);
	},
	beforeUnmount()
	{
		this.actionMenuService?.destroy?.();
		this.actionMenuService = null;
		this.dialogService = null;
	},
	methods: {
		async loadPage(append: boolean): Promise<void>
		{
			if (!append)
			{
				this.items = [];
				this.nextCursor = null;
				this.hasMore = false;
				this.hasError = false;
			}

			const currentRequestId = ++this.requestId;
			this.loading = true;

			try
			{
				const response = await this.service.list({
					collectionId: this.collectionId,
					ownedByMe: this.activeTab === TAB_MINE,
					limit: PAGE_SIZE,
					afterCursor: append ? this.nextCursor : null,
				});

				if (currentRequestId !== this.requestId)
				{
					return;
				}

				this.items = append ? [...this.items, ...response.items] : response.items;
				this.nextCursor = response.nextCursor;
				this.hasMore = Boolean(response.nextCursor);

				if (!append && response.collection && this.sidebarStore?.insertCollectionLocal)
				{
					this.sidebarStore.insertCollectionLocal(response.collection);
				}
			}
			catch (error)
			{
				if (currentRequestId !== this.requestId)
				{
					return;
				}

				const code = String(error?.code || '');
				if (code === 'COLLECTION_NOT_FOUND' || code === 'ACCESS_DENIED')
				{
					this.$emit('not-found', { collectionId: this.collectionId });

					return;
				}

				this.hasError = true;
				this.showErrorToast(error?.message || '');
			}
			finally
			{
				if (currentRequestId === this.requestId)
				{
					this.loading = false;
				}
			}
		},
		onLoadMore(): void
		{
			if (this.loading || !this.hasMore)
			{
				return;
			}

			void this.loadPage(true);
		},
		onOpen(item): void
		{
			this.$emit('open', { documentId: item.documentId });
		},
		setTab(tab: string): void
		{
			if (tab === this.activeTab)
			{
				return;
			}

			this.activeTab = tab;
		},
		onCreateDocument(): void
		{
			const collection = this.collection;
			if (!collection || !this.sidebarActions)
			{
				return;
			}

			void this.sidebarActions.createDocumentForCollection(collection);
		},
		async onCopyLink(): Promise<void>
		{
			const url = String(window.location.href || '');
			if (url === '')
			{
				return;
			}

			try
			{
				if (navigator?.clipboard?.writeText)
				{
					await navigator.clipboard.writeText(url);
				}
				else if (window.BX?.clipboard?.copy)
				{
					window.BX.clipboard.copy(url);
				}
			}
			catch
			{
				// silent
			}

			BX.UI.Notification.Center.notify({
				content: this.messages.linkCopied,
				position: 'top-right',
			});
		},
		onPermissions(): void
		{
			const collection = this.collection;
			if (!collection)
			{
				return;
			}

			void PermissionsApp.openCollectionPopup(Number(collection.id), {
				collectionName: String(collection.name || ''),
			});
		},
		async onArchive(): Promise<void>
		{
			const collection = this.collection;
			if (!collection || !this.canManagePermissions || !this.dialogService)
			{
				return;
			}

			const confirmed = await this.dialogService.confirm(
				this.messages.confirmArchiveCollection,
				this.messages.confirmArchiveCollectionTitle,
				this.messages.archive,
			);
			if (!confirmed)
			{
				return;
			}

			const collectionId = Number(collection.id);
			try
			{
				await this.service.archiveCollection(collectionId);
			}
			catch (error)
			{
				this.showErrorToast(error?.message || this.messages.errorArchive);

				return;
			}

			this.isLocalDestruction = true;
			this.removeFromSidebar(collectionId);
			this.$emit('archived', { collectionId });
		},
		async onDelete(): Promise<void>
		{
			const collection = this.collection;
			if (!collection || !this.canManagePermissions || !this.dialogService)
			{
				return;
			}

			const confirmed = await this.dialogService.confirm(
				this.messages.confirmDeleteCollection,
				this.messages.confirmDeleteCollectionTitle,
				this.messages.delete,
			);
			if (!confirmed)
			{
				return;
			}

			const collectionId = Number(collection.id);
			try
			{
				await this.service.deleteCollection(collectionId);
			}
			catch (error)
			{
				this.showErrorToast(error?.message || this.messages.errorDelete);

				return;
			}

			this.isLocalDestruction = true;
			this.removeFromSidebar(collectionId);
			this.$emit('deleted', { collectionId });
		},
		removeFromSidebar(collectionId: number): void
		{
			if (!this.sidebarStore)
			{
				return;
			}

			this.sidebarStore.removeCollectionLocal?.(collectionId);
			if (this.sidebarStore.isCollectionSelected?.(collectionId))
			{
				this.sidebarStore.clearCollectionSelection?.();
			}
		},
		openMoreMenu(event: MouseEvent): void
		{
			const target = event?.currentTarget;
			if (!this.actionMenuService || !(target instanceof HTMLElement))
			{
				return;
			}

			const items = this.menuItems;
			if (items.length === 0)
			{
				return;
			}

			this.actionMenuService.open(items, target, {
				key: `workspace-header-${this.collectionId}`,
				popupClass: 'note-action-menu',
			});
		},
		showErrorToast(text: string): void
		{
			if (!Type.isStringFilled(text))
			{
				return;
			}

			BX.UI.Notification.Center.notify({ content: text, position: 'top-right' });
		},
		onStartRenameTitle(): void
		{
			if (!this.canRenameCollection)
			{
				return;
			}

			this.titleDraft = this.title;
			this.isRenamingTitle = true;
			this.$nextTick(() => {
				const el = this.$refs.titleInput;
				if (el)
				{
					el.focus();
					el.select();
				}
			});
		},
		onTitleEnter(event: KeyboardEvent): void
		{
			event.preventDefault();
			const target = event.target;
			if (target && typeof target.blur === 'function')
			{
				target.blur();
			}
		},
		onTitleEscape(): void
		{
			this.titleDraft = '';
			this.isRenamingTitle = false;
		},
		onTitleBlur(): void
		{
			if (!this.isRenamingTitle)
			{
				return;
			}

			const value = String(this.titleDraft || '').trim();
			this.isRenamingTitle = false;
			this.titleDraft = '';

			if (!value || value === this.title)
			{
				return;
			}

			void this.sidebarActions?.confirmRenameCollection(Number(this.collectionId), value);
		},
	},
	// language=Vue
	template: `
		<div class="note-workspace-page">
			<teleport to="#note-page-header-slot">
				<div class="note-page-breadcrumb">
					<span class="note-page-breadcrumb-root">{{ breadcrumbRoot }}</span>
					<template v-if="title">
						<BIcon class="note-page-breadcrumb-separator" name="chevron-right-s" :size="24" />
						<span class="note-page-breadcrumb-current">{{ title }}</span>
					</template>
				</div>
			</teleport>
			<div class="note-workspace-page__actions">
				<button
					v-if="canCreateDocuments"
					type="button"
					class="ui-btn --air ui-btn-md --style-filled ui-btn-no-caps --with-left-icon"
					@click="onCreateDocument"
				>
					<div class="ui-icon-set --plus-30"></div>
					{{ messages.createDocument }}
				</button>
				<button
					type="button"
					class="note-workspace-page__action-icon"
					:title="messages.copyLink"
					:aria-label="messages.copyLink"
					@click="onCopyLink"
				>
					<div class="ui-icon-set --o-link"></div>
				</button>
				<button
					v-if="hasMenu"
					type="button"
					class="note-workspace-page__action-icon"
					:title="messages.more"
					:aria-label="messages.more"
					@click="openMoreMenu"
				>
					<div class="ui-icon-set --more-l"></div>
				</button>
			</div>

			<div class="note-workspace-page__body">
			<div class="note-workspace-page__title-row">
				<input
					v-if="isRenamingTitle"
					ref="titleInput"
					class="note-workspace-page__title-input"
					type="text"
					v-model="titleDraft"
					@keydown.enter="onTitleEnter($event)"
					@keydown.escape="onTitleEscape"
					@blur="onTitleBlur"
				/>
				<h2 v-else class="note-workspace-page__title">{{ title }}<button
					v-if="canRenameCollection"
					type="button"
					class="note-workspace-page__title-edit"
					@click="onStartRenameTitle"
				><span class="ui-icon-set --edit-m"></span></button></h2>
			</div>

			<div class="note-workspace-page__tabs" role="tablist">
				<button
					type="button"
					class="note-workspace-page__tab"
					:class="{ 'note-workspace-page__tab--active': activeTab === '${TAB_ALL}' }"
					role="tab"
					:aria-selected="activeTab === '${TAB_ALL}'"
					@click="setTab('${TAB_ALL}')"
				>
					{{ messages.tabAll }}
				</button>
				<button
					type="button"
					class="note-workspace-page__tab"
					:class="{ 'note-workspace-page__tab--active': activeTab === '${TAB_MINE}' }"
					role="tab"
					:aria-selected="activeTab === '${TAB_MINE}'"
					@click="setTab('${TAB_MINE}')"
				>
					{{ messages.tabMine }}
				</button>
			</div>

			<div v-if="showEmpty" class="note-workspace-page__empty">
				<div class="note-workspace-page__empty-image" aria-hidden="true"></div>
				<p class="note-workspace-page__empty-text">{{ messages.emptyText }}</p>
			</div>
			<DocumentList
				v-else-if="!hasError"
				:items="listItems"
				:has-more="hasMore"
				:loading="loading"
				mode="cards"
				@open="onOpen"
				@load-more="onLoadMore"
			/>
			</div>
		</div>
	`,
};
