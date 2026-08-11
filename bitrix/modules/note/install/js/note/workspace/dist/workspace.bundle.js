/* eslint-disable */
this.BX = this.BX || {};
(function (exports, ui_buttons, ui_designTokens_air, ui_iconSet_outline, main_core, ui_vue3, ui_notification, ui_iconSet_api_vue, note_ui_documentList, note_ui_actionMenu, note_permissions, note_sidebar, note_analytics) {
	'use strict';

	const ACTION_LIST = 'note.infrastructure.DocumentController.listByCollection';
	const ACTION_ARCHIVE_COLLECTION = 'note.infrastructure.CollectionController.archive';
	const ACTION_DELETE_COLLECTION = 'note.infrastructure.CollectionController.delete';
	class WorkspaceService {
		async list({
			collectionId,
			ownedByMe = false,
			limit = 50,
			afterCursor = null
		}) {
			try {
				const response = await main_core.ajax.runAction(ACTION_LIST, {
					data: {
						collectionId,
						ownedByMe: ownedByMe ? 1 : 0,
						limit,
						afterCursor: afterCursor || null
					}
				});
				const data = response?.data ?? {};
				const items = Array.isArray(data.items) ? data.items : [];
				return {
					items: items.map(doc => ({
						id: Number(doc.id) || 0,
						parentId: doc.parentId == null ? null : Number(doc.parentId),
						title: String(doc.title || ''),
						position: Number(doc.position) || 0,
						updatedAt: doc.updatedAt ? String(doc.updatedAt) : null,
						excerpt: String(doc.excerpt || ''),
						author: main_core.Type.isPlainObject(doc.author) ? {
							id: Number(doc.author.id) || 0,
							name: String(doc.author.name || ''),
							photoUrl: doc.author.photoUrl ? String(doc.author.photoUrl) : null,
							isSystem: doc.author.isSystem === true
						} : null
					})),
					nextCursor: main_core.Type.isPlainObject(data.nextCursor) ? data.nextCursor : null,
					collection: this.#normalizeCollection(data.collection)
				};
			} catch (error) {
				const code = String(error?.errors?.[0]?.code || '');
				const wrapped = new Error(this.#extractErrorMessage(error));
				wrapped.code = code;
				throw wrapped;
			}
		}
		async archiveCollection(id) {
			try {
				await main_core.ajax.runAction(ACTION_ARCHIVE_COLLECTION, {
					data: {
						id: Number(id)
					}
				});
			} catch (error) {
				throw new Error(this.#extractErrorMessage(error));
			}
		}
		async deleteCollection(id) {
			try {
				await main_core.ajax.runAction(ACTION_DELETE_COLLECTION, {
					data: {
						id: Number(id)
					}
				});
			} catch (error) {
				throw new Error(this.#extractErrorMessage(error));
			}
		}
		#normalizeCollection(raw) {
			if (!main_core.Type.isPlainObject(raw)) {
				return null;
			}
			const id = Number(raw.id);
			if (!Number.isInteger(id) || id <= 0) {
				return null;
			}
			return {
				...raw,
				id,
				name: String(raw.name ?? ''),
				position: Number.isFinite(Number(raw.position)) ? Number(raw.position) : 0,
				canEditCollection: Boolean(raw.canEditCollection),
				canManagePermissions: Boolean(raw.canManagePermissions),
				policyLevel: String(raw.policyLevel ?? 'none')
			};
		}
		#extractErrorMessage(error) {
			if (main_core.Type.isPlainObject(error)) {
				const firstError = error?.errors?.[0]?.message;
				if (main_core.Type.isStringFilled(firstError)) {
					return firstError;
				}
				if (main_core.Type.isStringFilled(error.message)) {
					return error.message;
				}
			}
			return 'Workspace list request failed';
		}
	}

	const PAGE_SIZE = 50;
	const TAB_ALL = 'all';
	const TAB_MINE = 'mine';
	const NoteWorkspacePageComponent = {
		name: 'NoteWorkspacePage',
		components: {
			BIcon: ui_iconSet_api_vue.BIcon,
			DocumentList: note_ui_documentList.DocumentList
		},
		inject: {
			sidebarActions: {
				from: 'noteSidebarActions',
				default: null
			},
			sidebarState: {
				from: 'noteSidebarState',
				default: null
			},
			sidebarStore: {
				from: 'noteSidebarStore',
				default: null
			}
		},
		props: {
			collectionId: {
				type: Number,
				required: true
			}
		},
		emits: ['open', 'archived', 'deleted', 'not-found'],
		data() {
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
				isLocalDestruction: false
			};
		},
		computed: {
			collection() {
				const collections = this.sidebarState?.collections;
				if (!Array.isArray(collections)) {
					return null;
				}
				return collections.find(c => Number(c.id) === Number(this.collectionId)) || null;
			},
			title() {
				return String(this.collection?.name ?? '');
			},
			canManagePermissions() {
				return Boolean(this.collection?.canManagePermissions ?? false);
			},
			canCreateDocuments() {
				return Boolean(this.collection?.canEditCollection);
			},
			canRenameCollection() {
				return Boolean(this.collection?.canEditCollection);
			},
			listItems() {
				return this.items.map(item => ({
					id: item.id,
					title: item.title,
					excerpt: item.excerpt || '',
					author: item.author || null,
					documentId: item.id
				}));
			},
			showEmpty() {
				return !this.loading && !this.hasError && this.items.length === 0;
			},
			breadcrumbRoot() {
				return main_core.Loc.getMessage('NOTE_WORKSPACE_BREADCRUMB_ROOT') || '';
			},
			messages() {
				return {
					createDocument: main_core.Loc.getMessage('NOTE_WORKSPACE_CREATE_DOCUMENT') || '',
					copyLink: main_core.Loc.getMessage('NOTE_WORKSPACE_COPY_LINK') || '',
					linkCopied: main_core.Loc.getMessage('NOTE_WORKSPACE_LINK_COPIED') || '',
					more: main_core.Loc.getMessage('NOTE_WORKSPACE_MORE') || '',
					tabAll: main_core.Loc.getMessage('NOTE_WORKSPACE_TAB_ALL') || '',
					tabMine: main_core.Loc.getMessage('NOTE_WORKSPACE_TAB_MINE') || '',
					menuPermissions: main_core.Loc.getMessage('NOTE_WORKSPACE_MENU_PERMISSIONS') || '',
					menuArchive: main_core.Loc.getMessage('NOTE_WORKSPACE_MENU_ARCHIVE') || '',
					menuDelete: main_core.Loc.getMessage('NOTE_WORKSPACE_MENU_DELETE') || '',
					emptyText: main_core.Loc.getMessage('NOTE_WORKSPACE_EMPTY_TEXT') || '',
					confirmDeleteCollection: main_core.Loc.getMessage('NOTE_SIDEBAR_CONFIRM_DELETE_COLLECTION') || '',
					confirmDeleteCollectionTitle: main_core.Loc.getMessage('NOTE_SIDEBAR_CONFIRM_DELETE_COLLECTION_TITLE') || '',
					confirmArchiveCollection: main_core.Loc.getMessage('NOTE_WORKSPACE_CONFIRM_ARCHIVE_COLLECTION') || '',
					confirmArchiveCollectionTitle: main_core.Loc.getMessage('NOTE_WORKSPACE_CONFIRM_ARCHIVE_COLLECTION_TITLE') || '',
					delete: main_core.Loc.getMessage('NOTE_SIDEBAR_DELETE') || '',
					archive: main_core.Loc.getMessage('NOTE_WORKSPACE_ARCHIVE') || '',
					errorArchive: main_core.Loc.getMessage('NOTE_COLLECTION_ARCHIVE_ERROR') || '',
					errorDelete: main_core.Loc.getMessage('NOTE_COLLECTION_DELETE_ERROR') || ''
				};
			},
			menuItems() {
				const items = [];
				if (this.canManagePermissions) {
					items.push({
						text: this.messages.menuArchive,
						iconModifier: 'o-box-with-lid',
						onClick: () => {
							void this.onArchive();
						}
					});
					items.push({
						text: this.messages.menuPermissions,
						iconModifier: 'o-settings',
						onClick: () => this.onPermissions()
					});
					items.push({
						text: this.messages.menuDelete,
						iconModifier: 'o-trashcan',
						danger: true,
						onClick: () => {
							void this.onDelete();
						}
					});
				}
				return items;
			},
			hasMenu() {
				return this.menuItems.length > 0;
			}
		},
		watch: {
			collectionId: {
				handler() {
					this.activeTab = TAB_ALL;
					this.isRenamingTitle = false;
					this.titleDraft = '';
					void this.loadPage(false);
				}
			},
			activeTab() {
				void this.loadPage(false);
			},
			collection(next, prev) {
				// Skip when initiator's onDelete/onArchive cleared the entry locally —
				// they already emit 'deleted'/'archived' which trigger the redirect.
				if (prev && !next && !this.isLocalDestruction) {
					this.$emit('not-found', {
						collectionId: this.collectionId
					});
				}
			}
		},
		created() {
			this.service = new WorkspaceService();
			this.actionMenuService = ui_vue3.markRaw(new note_ui_actionMenu.ActionMenuService({
				popupClass: 'note-action-menu'
			}));
			this.dialogService = ui_vue3.markRaw(new note_sidebar.DialogService());
			void this.loadPage(false);
		},
		beforeUnmount() {
			this.actionMenuService?.destroy?.();
			this.actionMenuService = null;
			this.dialogService = null;
		},
		methods: {
			async loadPage(append) {
				if (!append) {
					this.items = [];
					this.nextCursor = null;
					this.hasMore = false;
					this.hasError = false;
				}
				const currentRequestId = ++this.requestId;
				this.loading = true;
				try {
					const response = await this.service.list({
						collectionId: this.collectionId,
						ownedByMe: this.activeTab === TAB_MINE,
						limit: PAGE_SIZE,
						afterCursor: append ? this.nextCursor : null
					});
					if (currentRequestId !== this.requestId) {
						return;
					}
					this.items = append ? [...this.items, ...response.items] : response.items;
					this.nextCursor = response.nextCursor;
					this.hasMore = Boolean(response.nextCursor);
					if (!append && response.collection && this.sidebarStore?.insertCollectionLocal) {
						this.sidebarStore.insertCollectionLocal(response.collection);
					}
				} catch (error) {
					if (currentRequestId !== this.requestId) {
						return;
					}
					const code = String(error?.code || '');
					if (code === 'COLLECTION_NOT_FOUND' || code === 'ACCESS_DENIED') {
						this.$emit('not-found', {
							collectionId: this.collectionId
						});
						return;
					}
					this.hasError = true;
					this.showErrorToast(error?.message || '');
				} finally {
					if (currentRequestId === this.requestId) {
						this.loading = false;
					}
				}
			},
			onLoadMore() {
				if (this.loading || !this.hasMore) {
					return;
				}
				void this.loadPage(true);
			},
			onOpen(item) {
				note_analytics.NoteAnalytics.documentViewed('docs_list');
				this.$emit('open', {
					documentId: item.documentId
				});
			},
			setTab(tab) {
				if (tab === this.activeTab) {
					return;
				}
				this.activeTab = tab;
			},
			onCreateDocument() {
				const collection = this.collection;
				if (!collection || !this.sidebarActions) {
					return;
				}
				void this.sidebarActions.createDocumentForCollection(collection);
			},
			async onCopyLink() {
				const url = String(window.location.href || '');
				if (url === '') {
					return;
				}
				let success = false;
				try {
					if (navigator?.clipboard?.writeText) {
						await navigator.clipboard.writeText(url);
						success = true;
					} else if (window.BX?.clipboard?.copy) {
						// BX.clipboard.copy has no reliable return value; treat absence of a throw as success.
						window.BX.clipboard.copy(url);
						success = true;
					}
				} catch {
					success = false;
				}
				note_analytics.NoteAnalytics.collectionLinkCopied(success);
				BX.UI.Notification.Center.notify({
					content: this.messages.linkCopied,
					position: 'top-right'
				});
			},
			onPermissions() {
				const collection = this.collection;
				if (!collection) {
					return;
				}
				void note_permissions.App.openCollectionPopup(Number(collection.id), {
					collectionName: String(collection.name || '')
				});
			},
			async onArchive() {
				const collection = this.collection;
				if (!collection || !this.canManagePermissions || !this.dialogService) {
					return;
				}
				const confirmed = await this.dialogService.confirm(this.messages.confirmArchiveCollection, this.messages.confirmArchiveCollectionTitle, this.messages.archive);
				if (!confirmed) {
					return;
				}
				const collectionId = Number(collection.id);
				try {
					await this.service.archiveCollection(collectionId);
				} catch (error) {
					this.showErrorToast(error?.message || this.messages.errorArchive);
					return;
				}
				this.isLocalDestruction = true;
				this.removeFromSidebar(collectionId);
				this.$emit('archived', {
					collectionId
				});
			},
			async onDelete() {
				const collection = this.collection;
				if (!collection || !this.canManagePermissions || !this.dialogService) {
					return;
				}
				const confirmed = await this.dialogService.confirm(this.messages.confirmDeleteCollection, this.messages.confirmDeleteCollectionTitle, this.messages.delete);
				if (!confirmed) {
					return;
				}
				const collectionId = Number(collection.id);
				try {
					await this.service.deleteCollection(collectionId);
				} catch (error) {
					this.showErrorToast(error?.message || this.messages.errorDelete);
					return;
				}
				this.isLocalDestruction = true;
				this.removeFromSidebar(collectionId);
				this.$emit('deleted', {
					collectionId
				});
			},
			removeFromSidebar(collectionId) {
				if (!this.sidebarStore) {
					return;
				}
				this.sidebarStore.removeCollectionLocal?.(collectionId);
				if (this.sidebarStore.isCollectionSelected?.(collectionId)) {
					this.sidebarStore.clearCollectionSelection?.();
				}
			},
			openMoreMenu(event) {
				const target = event?.currentTarget;
				if (!this.actionMenuService || !(target instanceof HTMLElement)) {
					return;
				}
				const items = this.menuItems;
				if (items.length === 0) {
					return;
				}
				this.actionMenuService.open(items, target, {
					key: `workspace-header-${this.collectionId}`,
					popupClass: 'note-action-menu'
				});
			},
			showErrorToast(text) {
				if (!main_core.Type.isStringFilled(text)) {
					return;
				}
				BX.UI.Notification.Center.notify({
					content: text,
					position: 'top-right'
				});
			},
			onStartRenameTitle() {
				if (!this.canRenameCollection) {
					return;
				}
				this.titleDraft = this.title;
				this.isRenamingTitle = true;
				this.$nextTick(() => {
					const el = this.$refs.titleInput;
					if (el) {
						el.focus();
						el.select();
					}
				});
			},
			onTitleEnter(event) {
				event.preventDefault();
				const target = event.target;
				if (target && typeof target.blur === 'function') {
					target.blur();
				}
			},
			onTitleEscape() {
				this.titleDraft = '';
				this.isRenamingTitle = false;
			},
			onTitleBlur() {
				if (!this.isRenamingTitle) {
					return;
				}
				const value = String(this.titleDraft || '').trim();
				this.isRenamingTitle = false;
				this.titleDraft = '';
				if (!value || value === this.title) {
					return;
				}
				void this.sidebarActions?.confirmRenameCollection(Number(this.collectionId), value);
			}
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
	`
	};

	exports.NoteWorkspacePageComponent = NoteWorkspacePageComponent;

})(this.BX.Note = this.BX.Note || {}, BX.UI, window, window, BX, BX.Vue3, BX.UI.Notification, BX.UI.IconSet, BX.Note.Ui, BX.Note.Ui, BX.Note.Permissions, BX.Note.Sidebar, BX.Note);
//# sourceMappingURL=workspace.bundle.js.map
