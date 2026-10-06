/* eslint-disable */
this.BX = this.BX || {};
(function (exports, ui_buttons, ui_designTokens_air, ui_iconSet_outline, main_core, main_core_events, ui_vue3, ui_notification, ui_system_dialog, ui_iconSet_api_vue, ui_iconSet_solid, note_ui_documentList, note_ui_actionMenu, note_permissions, note_sidebar, note_ui_themeContext, note_ui_documentHistory, note_analytics, note_editor, note_ui_collectionPicker) {
	'use strict';

	const ACTION_LIST = 'note.infrastructure.DocumentController.listByCollection';
	const ACTION_ARCHIVE_COLLECTION = 'note.infrastructure.CollectionController.archive';
	const ACTION_DELETE_COLLECTION = 'note.infrastructure.CollectionController.delete';
	const ACTION_RESOLVE_BULK = 'note.infrastructure.DocumentController.resolveBulkSelection';
	const ACTION_ARCHIVE_MANY = 'note.infrastructure.DocumentController.archiveMany';
	const ACTION_DELETE_MANY = 'note.infrastructure.DocumentController.deleteMany';
	const ACTION_MOVE_MANY = 'note.infrastructure.DocumentController.moveMany';
	const ACTION_ARCHIVE_ALL = 'note.infrastructure.DocumentController.archiveAllInCollection';
	const ACTION_DELETE_ALL = 'note.infrastructure.DocumentController.deleteAllInCollection';
	const SECTION_ACTIVE = 'active';

	// DTO-01: outcome of a bulk operation. On limitExceeded the counters are all zero and nothing was applied.

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
						hasChildren: doc.hasChildren === true,
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

		// API-08 dry-run: returns the true affected volume (roots + descendants) for an explicit selection.
		async resolveBulkSelection(ids, withNested) {
			try {
				const response = await main_core.ajax.runAction(ACTION_RESOLVE_BULK, {
					data: {
						documentIds: this.#normalizeIds(ids),
						section: SECTION_ACTIVE,
						withNested: withNested ? 1 : 0
					}
				});
				const data = response?.data ?? {};
				return {
					affectedCount: Number(data.affectedCount) || 0,
					limitExceeded: data.limitExceeded === true,
					hasNested: data.hasNested === true
				};
			} catch (error) {
				throw this.#wrapError(error);
			}
		}

		// API-01
		async archiveDocuments(ids, withNested) {
			return this.#runBulk(ACTION_ARCHIVE_MANY, {
				documentIds: this.#normalizeIds(ids),
				withNested: withNested ? 1 : 0
			});
		}

		// API-02
		async deleteDocuments(ids, withNested) {
			return this.#runBulk(ACTION_DELETE_MANY, {
				documentIds: this.#normalizeIds(ids),
				section: SECTION_ACTIVE,
				withNested: withNested ? 1 : 0
			});
		}

		// API-05
		async moveDocuments(ids, targetCollectionId, targetParentId) {
			return this.#runBulk(ACTION_MOVE_MANY, {
				documentIds: this.#normalizeIds(ids),
				targetCollectionId: Number(targetCollectionId),
				targetParentId: targetParentId == null ? null : Number(targetParentId)
			});
		}

		// API-06
		async archiveAllInCollection(collectionId) {
			return this.#runBulk(ACTION_ARCHIVE_ALL, {
				collectionId: Number(collectionId)
			});
		}

		// API-07
		async deleteAllInCollection(collectionId) {
			return this.#runBulk(ACTION_DELETE_ALL, {
				collectionId: Number(collectionId)
			});
		}
		async #runBulk(action, data) {
			try {
				const response = await main_core.ajax.runAction(action, {
					data
				});
				const outcome = response?.data?.outcome ?? {};
				return {
					processedCount: Number(outcome.processedCount) || 0,
					skippedCount: Number(outcome.skippedCount) || 0,
					skippedByAccessCount: Number(outcome.skippedByAccessCount) || 0,
					skippedOrphanCount: Number(outcome.skippedOrphanCount) || 0,
					limitExceeded: outcome.limitExceeded === true
				};
			} catch (error) {
				throw this.#wrapError(error);
			}
		}
		#normalizeIds(ids) {
			const source = ids instanceof Set ? [...ids] : Array.isArray(ids) ? ids : [];
			return source.map(id => Number(id)).filter(id => Number.isInteger(id) && id > 0);
		}
		#wrapError(error) {
			const code = String(error?.errors?.[0]?.code || error?.code || '');
			const wrapped = new Error(this.#extractErrorMessage(error));
			wrapped.code = code;
			return wrapped;
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
				policyLevel: String(raw.policyLevel ?? 'none'),
				hasDescription: Boolean(raw.hasDescription),
				mainDocumentId: Number(raw.mainDocumentId) || 0,
				subscribed: Boolean(raw.subscribed)
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

	// Mirror of NoteDocumentEmbedComponent's `state-change` payload (owned by note.editor). Declared
	// locally because a cross-extension type import would have to be re-exported from the note.editor
	// facade; keep this shape in sync with the emitter.

	// Payload this panel reports up to the workspace top bar through `state-change`.

	// Renders the collection's main document (the "About" description) inline, using the shared
	// note.editor engine through NoteDocumentEmbedComponent. The edit trigger lives in the workspace
	// page "..." menu and the "Done" control in its top bar - this panel owns only the
	// document surface and reports its state upward via `state-change`, while the parent drives
	// enterEditMode()/finishEdit() through a template ref. Autosave flows through the editor's
	// collaboration provider, exactly like a regular document. The main document
	// always exists (eager-created + backfilled), so an empty description is just an empty main
	// document waiting to be filled.
	const AboutPanel = {
		name: 'NoteWorkspaceAboutPanel',
		components: {
			NoteDocumentEmbedComponent: note_editor.NoteDocumentEmbedComponent
		},
		props: {
			mainDocumentId: {
				type: Number,
				default: 0
			},
			hasDescription: {
				type: Boolean,
				default: false
			},
			canManage: {
				type: Boolean,
				default: false
			}
		},
		emits: ['open-internal-link', 'state-change'],
		data() {
			return {
				embedReady: false,
				embedError: false,
				isEditMode: false,
				isSaving: false,
				// Set true when the admin chooses to add a description for an empty (unmounted) doc: it
				// mounts the editor, then onEmbedReady enters edit on the freshly mounted surface.
				pendingEdit: false,
				// Live emptiness of the description. Seeded from hasDescription until the embed loads,
				// then driven by the editor's real content so a freshly filled/cleared description
				// switches between editor and empty state without a stale placeholder.
				contentEmpty: !this.hasDescription,
				// Document-level editability reported by the embed. Null while unknown (editor not mounted
				// or not yet reported); the collection-level `canManage` seeds the affordance until then.
				embedCanEdit: null,
				// Why saving is unavailable, or null when it is available. Reported by the embed and passed
				// on to the top bar, which owns the "Done" button this panel does not render.
				saveBlockedReason: null
			};
		},
		computed: {
			messages() {
				return {
					emptyReader: main_core.Loc.getMessage('NOTE_WORKSPACE_DESCRIPTION_EMPTY_READER') || '',
					emptyAdmin: main_core.Loc.getMessage('NOTE_WORKSPACE_DESCRIPTION_EMPTY_ADMIN') || ''
				};
			},
			hasMainDocument() {
				return Number(this.mainDocumentId) > 0;
			},
			canEdit() {
				// Before the embed reports its document-level right, fall back to the collection-level
				// seed so an empty (unmounted) description can still offer "Add description". Once the
				// editor is mounted and has reported, honor the real document-level editability so the
				// menu never offers "Edit" for a document the editor will not let this user edit.
				if (this.embedCanEdit === null) {
					return Boolean(this.canManage);
				}
				return this.embedCanEdit;
			},
			hasContent() {
				return !this.contentEmpty;
			},
			// Mount the collaborative editor only when there is content to render, the user is
			// entering/using edit mode, or a load error must stay visible. An empty description in view
			// mode skips the whole tiptap/yjs stack (provider.connect, PULL, compaction, idle tracker).
			shouldMountEmbed() {
				return this.hasMainDocument && (this.hasContent || this.isEditMode || this.pendingEdit || this.embedError);
			},
			// Empty + view: nothing to load, so the panel is ready immediately and the top bar can offer
			// "Add description". When the editor is mounted, readiness follows the embed.
			isReady() {
				return this.shouldMountEmbed ? this.embedReady : this.hasMainDocument;
			},
			// Placeholder for an empty description with nobody editing. For the unmounted empty case it
			// is driven purely by the server seed (contentEmpty), without waiting for the editor to load.
			showEmptyState() {
				if (this.embedError || this.isEditMode || this.pendingEdit) {
					return false;
				}
				if (!this.shouldMountEmbed) {
					return this.hasMainDocument && this.contentEmpty;
				}
				return this.embedReady && this.contentEmpty;
			},
			emptyText() {
				return this.canEdit ? this.messages.emptyAdmin : this.messages.emptyReader;
			}
		},
		watch: {
			mainDocumentId() {
				this.resetState();
			},
			hasDescription(next) {
				// Only the seed matters - once the embed reports real content, it owns contentEmpty.
				if (!this.embedReady) {
					this.contentEmpty = !next;
					this.emitState();
				}
			}
		},
		mounted() {
			// The top bar renders as soon as this panel mounts; hand it the initial (not-yet-ready) state.
			this.emitState();
		},
		methods: {
			resetState() {
				this.embedReady = false;
				this.embedError = false;
				this.isEditMode = false;
				this.isSaving = false;
				this.pendingEdit = false;
				this.contentEmpty = !this.hasDescription;
				this.embedCanEdit = null;
				this.saveBlockedReason = null;
				this.emitState();
			},
			emitState() {
				const payload = {
					ready: this.isReady,
					error: this.embedError,
					isEditMode: this.isEditMode,
					isSaving: this.isSaving,
					isEmpty: this.contentEmpty,
					canEdit: this.canEdit,
					saveBlockedReason: this.saveBlockedReason
				};
				this.$emit('state-change', payload);
			},
			onEmbedReady(payload) {
				this.embedReady = true;
				this.embedError = false;
				this.contentEmpty = Boolean(payload?.isEmpty);

				// Deferred-edit path: the editor was mounted because the admin chose to add a
				// description; enter edit now that the freshly mounted surface is ready.
				if (this.pendingEdit) {
					this.pendingEdit = false;
					this.$refs.embed?.enterEditMode?.();
				}
				this.emitState();
			},
			onEmbedStateChange(payload) {
				this.isEditMode = Boolean(payload?.isEditMode);
				this.isSaving = Boolean(payload?.isSaving);
				this.saveBlockedReason = payload?.saveBlockedReason ?? null;
				// Emptiness becomes authoritative only once the embed has loaded (the `ready` event
				// delivers the first payload-based value). The embed also emits `state-change` mid-load
				// when canEdit/isEditMode settle, and at that point its `contentEmpty` is still the stale
				// mount-time default (true). Trusting it here would flip contentEmpty -> true, drop
				// shouldMountEmbed, and unmount the embed before `ready` fires - leaving the empty-state
				// placeholder over a document that actually has a description. So hold the server seed
				// (hasDescription) until ready; after that, follow the editor's live emptiness.
				if (this.embedReady) {
					this.contentEmpty = Boolean(payload?.isEmpty);
				}
				// The embed owns document-level editability once mounted; from here the affordance
				// follows the editor's real canEdit instead of the collection-level seed.
				this.embedCanEdit = Boolean(payload?.canEdit);
				this.emitState();
			},
			onEmbedError() {
				this.embedError = true;
				this.embedReady = false;
				// embedError keeps the surface mounted (shouldMountEmbed) so the error stays visible.
				this.pendingEdit = false;
				this.emitState();
			},
			onOpenInternalLink(payload) {
				this.$emit('open-internal-link', payload);
			},
			// Public API driven by the workspace page top bar (through a template ref).
			enterEditMode() {
				const embed = this.$refs.embed;
				if (embed && this.embedReady) {
					embed.enterEditMode?.();
					return;
				}

				// Either the editor is not mounted yet (empty description in view mode - PERF: no
				// collaborative stack for an empty doc), or it is still loading because the tab has just
				// been switched. Both cases arm the deferred entry: enterEditMode() is a no-op while the
				// document loads, so onEmbedReady performs it once the surface is live.
				this.pendingEdit = true;
			},
			finishEdit() {
				this.$refs.embed?.finishEdit?.();
			}
		},
		// language=Vue
		template: `
		<div
			class="note-workspace-about"
			:class="{ 'note-workspace-about--editing': isEditMode }"
			data-testid="note-about-panel"
		>
			<NoteDocumentEmbedComponent
				v-if="shouldMountEmbed"
				ref="embed"
				:key="mainDocumentId"
				:document-id="mainDocumentId"
				@ready="onEmbedReady"
				@state-change="onEmbedStateChange"
				@load-error="onEmbedError"
				@open-internal-link="onOpenInternalLink"
			/>

			<div
				v-if="showEmptyState"
				class="note-workspace-page__empty note-workspace-about__empty"
				:data-testid="canEdit ? 'note-about-panel-empty-admin' : 'note-about-panel-empty-reader'"
			>
				<div class="note-workspace-page__empty-image" aria-hidden="true"></div>
				<p class="note-workspace-page__empty-text">{{ emptyText }}</p>
			</div>
		</div>
	`
	};

	// Q-1 default: only the target collection is chosen; documents land at the collection root (parentId=null).
	// Resolves null on cancel/close; the page keeps the current selection on null (ERR-004).
	function openMoveDocumentsPopup() {
		return note_ui_collectionPicker.openCollectionPicker({
			title: main_core.Loc.getMessage('NOTE_WORKSPACE_BULK_MOVE_TITLE') || '',
			description: main_core.Loc.getMessage('NOTE_WORKSPACE_BULK_MOVE_TEXT') || '',
			placeholder: main_core.Loc.getMessage('NOTE_WORKSPACE_BULK_MOVE_PLACEHOLDER') || '',
			primaryLabel: main_core.Loc.getMessage('NOTE_WORKSPACE_BULK_MOVE_PRIMARY') || '',
			cancelLabel: main_core.Loc.getMessage('NOTE_WORKSPACE_BULK_CANCEL') || ''
		}).then(result => {
			if (!result) {
				return null;
			}
			return {
				collectionId: result.collectionId,
				parentId: null
			};
		});
	}

	const PAGE_SIZE = 50;
	const TAB_ABOUT = 'about';
	const TAB_ALL = 'all';
	const TAB_MINE = 'mine';
	// [API-05] Refusal of a subscription on a knowledge base that is not in the favorites list.
	const FAVORITE_REQUIRED_ERROR = 'FAVORITE_REQUIRED';
	const NoteWorkspacePageComponent = {
		name: 'NoteWorkspacePage',
		components: {
			BIcon: ui_iconSet_api_vue.BIcon,
			DocumentList: note_ui_documentList.DocumentList,
			AboutPanel,
			BulkActionsBar: note_ui_documentList.BulkActionsBar
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
				// True once the user picks a tab manually, so a late-arriving "About" tab does not
				// override an explicit choice (see the mainDocumentId watcher / applyDefaultTab).
				userChoseTab: false,
				items: [],
				loading: false,
				hasMore: false,
				hasError: false,
				nextCursor: null,
				requestId: 0,
				isRenamingTitle: false,
				titleDraft: '',
				isLocalDestruction: false,
				// Mirror of the "About" description surface, reported by AboutPanel via `state-change`.
				// The description's edit trigger lives in this page's "..." menu and its "Done" control in
				// the top bar, so the page keeps the panel's state to render them; meaningful only while
				// the "About" tab is active (AboutPanel mounted).
				aboutReady: false,
				aboutError: false,
				aboutEditMode: false,
				aboutSaving: false,
				aboutEmpty: true,
				aboutCanEdit: false,
				// Why saving the description is unavailable, or null when it is available. The right to edit
				// is unaffected: the body stays editable so the text in it can be copied out, and only the
				// top-bar "Done" is closed.
				aboutSaveBlockedReason: null,
				isTogglingSubscription: false,
				isTogglingFavorite: false,
				selection: note_ui_documentList.createSelection(),
				// "Select all in collection" latch: routes bulk archive/delete to the over-collection
				// endpoints (covers unloaded documents). Any manual toggle drops it.
				allInCollection: false,
				bulkBusy: false
			};
		},
		computed: {
			Outline: () => ui_iconSet_api_vue.Outline,
			Solid: () => ui_iconSet_api_vue.Solid,
			isSubscribed() {
				return Boolean(this.collection?.subscribed);
			},
			// [TPL-01] Is this knowledge base in the personal favorites list. The sidebar store is the owner
			// of the flag when the sidebar is on the page (its stars and EVENT-01 pushes both land there), so
			// adding the base with a star lights the bell here without a reload; the meta of the first page
			// answers when there is no sidebar.
			isFavorite() {
				const favorites = this.sidebarState?.favorites;
				if (favorites && typeof favorites.isFavorite === 'function') {
					return favorites.isFavorite('collection', Number(this.collectionId));
				}
				return Boolean(this.collection?.isFavorite);
			},
			// [AC-045] Notifications live on favorites: the bell is offered for a base in the list, and for
			// one whose subscription is still in force after the star came off - otherwise there would be no
			// way to switch that subscription off.
			showSubscribeToggle() {
				return Boolean(this.collection) && this.notificationsEnabled && (this.isFavorite || this.isSubscribed);
			},
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
			isMobile() {
				return Boolean(this.sidebarState?.isMobile);
			},
			canCreateDocuments() {
				return Boolean(this.collection?.canEditCollection);
			},
			canRenameCollection() {
				return Boolean(this.collection?.canEditCollection);
			},
			hasDescription() {
				return Boolean(this.collection?.hasDescription);
			},
			mainDocumentId() {
				return Number(this.collection?.mainDocumentId) || 0;
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
					tabAbout: main_core.Loc.getMessage('NOTE_WORKSPACE_TAB_ABOUT') || '',
					tabAll: main_core.Loc.getMessage('NOTE_WORKSPACE_TAB_ALL') || '',
					tabMine: main_core.Loc.getMessage('NOTE_WORKSPACE_TAB_MINE') || '',
					tabsLabel: main_core.Loc.getMessage('NOTE_WORKSPACE_TABS_LABEL') || '',
					descriptionEdit: main_core.Loc.getMessage('NOTE_WORKSPACE_DESCRIPTION_EDIT') || '',
					descriptionAdd: main_core.Loc.getMessage('NOTE_WORKSPACE_DESCRIPTION_ADD') || '',
					descriptionDone: main_core.Loc.getMessage('NOTE_WORKSPACE_DESCRIPTION_DONE') || '',
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
					errorDelete: main_core.Loc.getMessage('NOTE_COLLECTION_DELETE_ERROR') || '',
					favoriteOn: main_core.Loc.getMessage('NOTE_WORKSPACE_FAVORITE_ON') || '',
					favoriteOff: main_core.Loc.getMessage('NOTE_WORKSPACE_FAVORITE_OFF') || '',
					subscribe: main_core.Loc.getMessage('NOTE_WORKSPACE_SUBSCRIBE') || '',
					subscribed: main_core.Loc.getMessage('NOTE_WORKSPACE_SUBSCRIBED') || '',
					subscriptionError: main_core.Loc.getMessage('NOTE_WORKSPACE_SUBSCRIPTION_ERROR') || ''
				};
			},
			menuItems() {
				const items = [];
				if (this.canManagePermissions) {
					items.push({
						text: this.messages.menuArchive,
						iconModifier: 'o-box-with-lid',
						testId: 'note-collection-menu-archive',
						onClick: () => {
							void this.onArchive();
						}
					});
					items.push({
						text: this.messages.menuPermissions,
						iconModifier: 'o-settings',
						testId: 'note-collection-menu-permissions',
						onClick: () => this.onPermissions()
					});
				}

				// "Edit/Add description" lives only here, right above "Delete", on every platform: the
				// top bar is reserved for the create/copy-link row. Off the "About" tab the item switches
				// the tab first (see onAboutEdit).
				if (this.canEditAbout) {
					items.push({
						text: this.aboutEditLabel,
						iconModifier: 'edit-l',
						testId: 'note-collection-menu-description-edit',
						onClick: () => this.onAboutEdit()
					});
				}
				if (this.canManagePermissions) {
					items.push({
						text: this.messages.menuDelete,
						iconModifier: 'o-trashcan',
						testId: 'note-collection-menu-delete',
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
			},
			isAboutTab() {
				return this.activeTab === TAB_ABOUT;
			},
			// "Edit/Add description" is offered whenever the collection has a description surface at all,
			// for a KB admin, and only outside description edit mode. On the "About" tab the mounted panel
			// reports the real document-level right, so honor it once it has loaded; on the documents tabs
			// the panel is unmounted and the collection-level right (MODERATE, the main document's write
			// threshold) is the only thing known - the same seed AboutPanel itself falls back to.
			canEditAbout() {
				if (this.mainDocumentId <= 0) {
					return false;
				}
				if (this.isAboutTab) {
					return this.aboutReady && !this.aboutError && this.aboutCanEdit && !this.aboutEditMode;
				}
				return this.canManagePermissions;
			},
			// Top-bar "Done" + sync badge replace the edit control while the description is being edited.
			showAboutDone() {
				return this.isAboutTab && this.aboutReady && !this.aboutError && this.aboutEditMode;
			},
			isAboutDoneBlocked() {
				return main_core.Type.isStringFilled(this.aboutSaveBlockedReason);
			},
			// Keeps the visible label first, so voice control still reaches the button by what it reads
			// (WCAG 2.5.3), and appends the reason a sighted user gets from the tooltip.
			aboutDoneAriaLabel() {
				return this.isAboutDoneBlocked ? `${this.messages.descriptionDone}. ${this.aboutSaveBlockedReason}` : this.messages.descriptionDone;
			},
			aboutEditLabel() {
				// Off the "About" tab the panel is unmounted, so emptiness comes from the collection meta.
				const isEmpty = this.isAboutTab ? this.aboutEmpty : !this.hasDescription;
				return isEmpty ? this.messages.descriptionAdd : this.messages.descriptionEdit;
			},
			// "Create document" stays visible everywhere except while editing the description, where the
			// top bar is reserved for the sync badge and "Done".
			showCreateButton() {
				return this.canCreateDocuments && !(this.isAboutTab && this.aboutEditMode);
			},
			// [P8.T3] notifications_enabled bootstrap flag (from the injected sidebar root state) —
			// gates the collection subscription toggle in the header.
			notificationsEnabled() {
				return Boolean(this.sidebarState?.notificationsEnabled);
			},
			mobileMenuItems() {
				// On mobile the copy-link icon is dropped from the header row; it lives
				// in the more menu instead (mirrors the document page).
				return [{
					text: this.messages.copyLink,
					iconModifier: 'o-link',
					testId: 'note-collection-menu-copy-link',
					onClick: () => {
						void this.onCopyLink();
					}
				}, ...this.menuItems];
			},
			selectedCount() {
				return this.selection.count;
			},
			showSelectButton() {
				// The "About" tab renders the description, not a list — bulk selection has nothing to act on.
				return !this.isAboutTab && !this.hasError && this.items.length > 0;
			}
		},
		watch: {
			collectionId: {
				handler() {
					const previousTab = this.activeTab;
					this.applyDefaultTab();
					this.isRenamingTitle = false;
					this.titleDraft = '';
					this.resetSelection();
					// If applyDefaultTab switched the active tab, the activeTab watcher fires and loads
					// the list (and resets the About state); loading here too would send a redundant
					// second service.list. Load directly only when the tab did not change (collection
					// swap on the default tab, where the activeTab watcher will not fire).
					if (previousTab === this.activeTab && this.activeTab !== TAB_ABOUT) {
						void this.loadPage(false);
					}
				}
			},
			activeTab() {
				this.resetSelection();

				// The "About" tab renders the main document, not a document list - skip list loading.
				if (this.activeTab === TAB_ABOUT) {
					return;
				}

				// Leaving "About" unmounts AboutPanel, so drop its state - otherwise the top bar could
				// briefly show stale description controls when the tab is reopened.
				this.resetAboutState();
				void this.loadPage(false);
			},
			collection(next, prev) {
				// Skip when initiator's onDelete/onArchive cleared the entry locally -
				// they already emit 'deleted'/'archived' which trigger the redirect.
				if (prev && !next && !this.isLocalDestruction) {
					this.$emit('not-found', {
						collectionId: this.collectionId
					});
				}
			},
			mainDocumentId(next) {
				// On direct open of a not-yet-hydrated collection the main document id can arrive only
				// after loadPage merges the collection meta. Honor the "About by default" landing as soon
				// as the tab becomes available, unless the user already switched to a documents list.
				if (next > 0 && !this.userChoseTab && this.activeTab === TAB_ALL) {
					this.activeTab = TAB_ABOUT;
				}
			}
		},
		created() {
			this.service = new WorkspaceService();
			this.actionMenuService = ui_vue3.markRaw(new note_ui_actionMenu.ActionMenuService({
				popupClass: 'note-action-menu'
			}));
			this.dialogService = ui_vue3.markRaw(new note_sidebar.DialogService());
			this.applyDefaultTab();
			if (this.activeTab !== TAB_ABOUT) {
				void this.loadPage(false);
			}
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

					// In "select all" mode paginated-in items join the selection so they render checked.
					if (append && this.allInCollection && this.selection.mode) {
						const nextIds = response.items.map(item => Number(item.id) || 0).filter(id => id > 0);
						this.selection.set([...this.selection.ids, ...nextIds]);
					}
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
				this.userChoseTab = true;
				this.activeTab = tab;
			},
			applyDefaultTab() {
				// Landing view is "About knowledge base" whenever it exists (a main document is present);
				// only fall back to the documents list when the collection has no main document.
				this.userChoseTab = false;
				this.activeTab = this.mainDocumentId > 0 ? TAB_ABOUT : TAB_ALL;
			},
			onAboutStateChange(payload) {
				this.aboutReady = Boolean(payload?.ready);
				this.aboutError = Boolean(payload?.error);
				this.aboutEditMode = Boolean(payload?.isEditMode);
				this.aboutSaving = Boolean(payload?.isSaving);
				this.aboutEmpty = Boolean(payload?.isEmpty);
				this.aboutCanEdit = Boolean(payload?.canEdit);
				this.aboutSaveBlockedReason = payload?.saveBlockedReason ?? null;
			},
			resetAboutState() {
				this.aboutReady = false;
				this.aboutError = false;
				this.aboutEditMode = false;
				this.aboutSaving = false;
				this.aboutEmpty = true;
				this.aboutCanEdit = false;
				this.aboutSaveBlockedReason = null;
			},
			onAboutEdit() {
				// Invoked from a documents tab: land on "About" first. The panel mounts on the next tick,
				// and its enterEditMode() arms a deferred entry until the embedded editor is loaded.
				if (!this.isAboutTab) {
					this.setTab(TAB_ABOUT);
					this.$nextTick(() => {
						this.$refs.about?.enterEditMode?.();
					});
					return;
				}
				this.$refs.about?.enterEditMode?.();
			},
			onAboutDone() {
				this.$refs.about?.finishEdit?.();

				// Blocked means the session did not end: the controller answers with the reason and keeps
				// the body editable, because the text in it is the only copy left. Moving focus away from it
				// then would take the caret out of the field the user has to select and copy from.
				if (this.isAboutDoneBlocked) {
					return;
				}

				// A11Y (WCAG 2.4.3 Focus Order): the "Done" button unmounts on exit, so return focus
				// to the "..." button that now carries the edit action. Wait one tick for the DOM to settle.
				this.$nextTick(() => {
					this.$refs.moreButton?.focus?.();
				});
			},
			onOpenInternalLink(payload) {
				if (!payload) {
					return;
				}

				// Internal mention links inside the description navigate the workspace router:
				// documents reuse the existing open-document flow, collections switch the workspace.
				// Anchor links stay inside the embed and never reach here.
				const id = Number(payload.id);
				if (!Number.isInteger(id) || id <= 0) {
					return;
				}
				if (payload.type === 'document') {
					this.$emit('open', {
						documentId: id
					});
					return;
				}
				if (payload.type === 'collection' && this.$router) {
					this.$router.push({
						name: 'workspace',
						params: {
							id
						}
					});
				}
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
				const items = this.isMobile ? this.mobileMenuItems : this.menuItems;
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
			// [TPL-01] Star of the knowledge base, next to the bell exactly as in the activity line of a
			// document. The store owns the flag and the transport (optimistic flip, EVENT-01, the local
			// announcement every other star listens to), so the page only asks it to toggle.
			async onToggleFavorite() {
				const collectionId = Number(this.collectionId);
				if (this.isTogglingFavorite || !(collectionId > 0) || !this.sidebarStore?.toggleFavorite) {
					return;
				}
				this.isTogglingFavorite = true;
				try {
					await this.sidebarStore.toggleFavorite({
						entityType: 'collection',
						entityId: collectionId
					},
					// The name the page already shows, so the row of the block appears with the press.
					{
						title: this.title
					});
				} finally {
					this.isTogglingFavorite = false;
				}
			},
			// Collection bell: a plain on/off toggle (no scope popover — the whole knowledge base is the
			// only scope for a collection subscription, MODE_ALL). Optimistically flips the store this
			// frame and rolls back on failure. State is bundled into the list response (see
			// WorkspaceService / DocumentProvider::getListByCollection), so no separate getState fires.
			async onToggleSubscription() {
				if (this.isTogglingSubscription) {
					return;
				}
				const collectionId = Number(this.collectionId);
				if (!(collectionId > 0)) {
					return;
				}
				const wasSubscribed = this.isSubscribed;
				this.sidebarStore?.updateCollectionLocal?.(collectionId, {
					subscribed: !wasSubscribed
				});
				this.isTogglingSubscription = true;
				try {
					if (wasSubscribed) {
						await note_ui_documentHistory.SubscriptionApi.remove({
							scope: note_ui_documentHistory.SUBSCRIPTION_SCOPE_COLLECTION,
							entityId: collectionId
						});
					} else {
						await note_ui_documentHistory.SubscriptionApi.set({
							scope: note_ui_documentHistory.SUBSCRIPTION_SCOPE_COLLECTION,
							entityId: collectionId,
							mode: note_ui_documentHistory.SUBSCRIPTION_MODE_ALL
						});
					}

					// Broadcast this collection's subscription change over the general event bus.
					main_core_events.EventEmitter.emit('Note:subscriptionChanged');
				} catch (error) {
					this.sidebarStore?.updateCollectionLocal?.(collectionId, {
						subscribed: wasSubscribed
					});
					// [API-05] The base left the favorites list between the read and the press. The roll-back
					// above is already the server's answer about the subscription; what is stale is the list,
					// so it is re-read instead of reporting a technical failure.
					if (String(error?.errors?.[0]?.code || '') === FAVORITE_REQUIRED_ERROR) {
						void this.sidebarStore?.reloadFavorites?.();
						return;
					}
					this.showErrorToast(this.messages.subscriptionError);
				} finally {
					this.isTogglingSubscription = false;
				}
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
			},
			resetSelection() {
				// If focus currently sits on the floating bulk-actions bar (its X, the select-all toggle,
				// or an action button that just ran), the bar is about to hide — hand focus back to the
				// list so it is not lost (WCAG 2.4.3). A soft exit triggered by unticking the last card
				// leaves focus on that card, so it must not be yanked away.
				const restoreFocus = this.isFocusInsideBulkBar();
				this.allInCollection = false;
				this.selection.exit();
				if (restoreFocus) {
					void this.$nextTick(() => this.$refs.documentList?.focusRoot());
				}
			},
			isFocusInsideBulkBar() {
				return document.activeElement?.closest?.('.note-bulk-actions-bar') != null;
			},
			onSelect({
				id,
				selected,
				activate
			}) {
				const key = Number(id) || 0;
				if (key <= 0) {
					return;
				}

				// A click on the desktop hover checkbox arrives with activate=true — switch into
				// selection mode first, then apply the toggle.
				if (activate && !this.selection.mode) {
					this.selection.enter();
				}
				if (this.selection.has(key) !== selected) {
					this.selection.toggle(key);
				}

				// Deselecting the last item leaves selection mode — the checkboxes should not
				// linger once nothing is selected (desktop reverts to the hover affordance).
				if (this.selection.count === 0) {
					this.resetSelection();
					return;
				}

				// Keep the "select all" latch in sync with the manual pick: when every loaded item
				// is ticked and nothing is left to paginate, the manual set IS the whole collection, so the
				// latch (button highlight + action routing) reflects it; otherwise it stays a subset.
				this.allInCollection = !this.hasMore && this.selection.count === this.items.length;
			},
			onSelectAll() {
				// Toggle the latch: first press selects the whole collection, second press clears it.
				if (this.allInCollection) {
					this.resetSelection();
					return;
				}
				this.allInCollection = true;
				this.selection.set(this.items.map(item => Number(item.id) || 0).filter(id => id > 0));
			},
			onBulkClear() {
				this.resetSelection();
			},
			onBulkAction({
				type
			}) {
				if (this.bulkBusy) {
					return;
				}
				if (type === 'archive') {
					void this.runArchive();
				} else if (type === 'delete') {
					void this.runDelete();
				} else if (type === 'move') {
					void this.runMove();
				}
			},
			async runArchive() {
				if (this.allInCollection) {
					await this.runAllInCollection('archive');
					return;
				}
				const ids = [...this.selection.ids];
				if (ids.length === 0) {
					return;
				}
				const confirmed = await this.confirmBulkOnSelection({
					ids,
					title: this.locMessage('NOTE_WORKSPACE_BULK_ARCHIVE_TITLE'),
					okText: this.locMessage('NOTE_WORKSPACE_BULK_ARCHIVE_ACTION'),
					countKey: 'NOTE_WORKSPACE_BULK_ARCHIVE_COUNT',
					danger: false,
					withNested: true
				});
				if (!confirmed) {
					return;
				}
				await this.runBulk(() => this.service.archiveDocuments(ids, confirmed.withNested), 'archive');
			},
			async runDelete() {
				if (this.allInCollection) {
					await this.runAllInCollection('delete');
					return;
				}
				const ids = [...this.selection.ids];
				if (ids.length === 0) {
					return;
				}
				const confirmed = await this.confirmBulkOnSelection({
					ids,
					title: this.locMessage('NOTE_WORKSPACE_BULK_DELETE_TITLE'),
					okText: this.locMessage('NOTE_WORKSPACE_BULK_DELETE_ACTION'),
					countKey: 'NOTE_DOCUMENT_LIST_BULK_DELETE_COUNT',
					danger: true,
					withNested: false
				});
				if (!confirmed) {
					return;
				}
				await this.runBulk(() => this.service.deleteDocuments(ids, confirmed.withNested), 'delete');
			},
			async runMove() {
				// No "move all" endpoint: even under the "select all" latch only the loaded,
				// enumerated ids are moved (first-iteration limitation).
				const ids = [...this.selection.ids];
				if (ids.length === 0) {
					return;
				}
				const target = await openMoveDocumentsPopup();
				if (!target) {
					return;
				}
				await this.runBulk(() => this.service.moveDocuments(ids, target.collectionId, target.parentId), 'move');
			},
			async runAllInCollection(action) {
				const isDelete = action === 'delete';
				const confirmed = await this.openBulkConfirm({
					title: this.locMessage(isDelete ? 'NOTE_WORKSPACE_BULK_DELETE_TITLE' : 'NOTE_WORKSPACE_BULK_ARCHIVE_TITLE'),
					okText: this.locMessage(isDelete ? 'NOTE_WORKSPACE_BULK_DELETE_ACTION' : 'NOTE_WORKSPACE_BULK_ARCHIVE_ACTION'),
					danger: isDelete,
					bodyText: this.locMessage(isDelete ? 'NOTE_WORKSPACE_BULK_DELETE_ALL_CONFIRM' : 'NOTE_WORKSPACE_BULK_ARCHIVE_ALL_CONFIRM')
				});
				if (!confirmed)
					// openBulkConfirm resolves {withNested} or null
					{
						return;
					}
				const collectionId = Number(this.collectionId);
				await this.runBulk(() => isDelete ? this.service.deleteAllInCollection(collectionId) : this.service.archiveAllInCollection(collectionId), action);
			},
			// Whether any selected document has live children — read from the list payload (hasChildren
			// ships with each card), so the "with nested" toggle decision needs no dry-run round-trip.
			selectionHasNested(ids) {
				const flags = new Map(this.items.map(doc => [Number(doc.id), doc.hasChildren === true]));
				return ids.some(id => flags.get(Number(id)) === true);
			},
			confirmBulkOnSelection({
				ids,
				title,
				okText,
				countKey,
				danger,
				withNested
			}) {
				// Offer the "with nested" toggle only when the selection actually contains documents with
				// live children (E) — determined locally, no server call.
				const hasNested = this.selectionHasNested(ids);

				// Memoize the subtree dry-run so toggling back and forth never re-hits the server for the
				// same selection (ids are fixed for this confirm).
				let expandedResolution = null;
				return this.openBulkConfirm({
					title,
					okText,
					danger,
					withNested,
					offerNested: hasNested,
					countKey,
					// Roots-only volume is exact whenever the selection can't expand (no children, or the
					// toggle is off), so the common case shows the count immediately with no dry-run.
					initialCount: ids.length,
					// The dry-run is consulted only to expand a subtree (AC-015); the roots-only branch
					// resolves locally. Absent entirely when nothing can expand.
					resolveCount: hasNested ? nextWithNested => {
						if (!nextWithNested) {
							return Promise.resolve({
								affectedCount: ids.length,
								limitExceeded: false,
								hasNested: true
							});
						}
						if (expandedResolution) {
							return Promise.resolve(expandedResolution);
						}
						return this.service.resolveBulkSelection(ids, true).then(resolution => {
							expandedResolution = resolution;
							return resolution;
						});
					} : null
				});
			},
			async runBulk(operation, action) {
				this.bulkBusy = true;
				let succeeded = false;
				try {
					const outcome = await operation();
					this.reportOutcome(outcome, action);

					// Limit exceeded means nothing was applied: keep the selection so the user can trim
					// it and skip the reload — the list is unchanged.
					if (outcome?.limitExceeded) {
						return;
					}
					this.resetSelection();
					// Signal a change only when something was actually processed; an empty result must
					// not refresh the sidebar (parity with archive/recyclebin).
					succeeded = Number(outcome?.processedCount) > 0;
				} catch (error) {
					this.showBulkError(error);
				} finally {
					this.bulkBusy = false;
				}

				// Re-fetch on both success and failure so the list reflects the server's authoritative state.
				await this.loadPage(false);

				// The initiator is excluded from the bulk pull fan-out, so refresh the sidebar tree
				// locally — otherwise the moved/archived/deleted documents linger in the sidebar.
				if (succeeded) {
					main_core_events.EventEmitter.emit(note_sidebar.NoteEvent.DOCUMENTS_BULK_CHANGED, new main_core_events.BaseEvent({
						data: {}
					}));
				}
			},
			reportOutcome(outcome, action) {
				if (outcome?.limitExceeded) {
					this.showErrorToast(this.locMessage('NOTE_DOCUMENT_LIST_BULK_LIMIT'));
					return;
				}
				const processed = Number(outcome?.processedCount) || 0;
				const skipped = Number(outcome?.skippedCount) || 0;
				const noAccess = Number(outcome?.skippedByAccessCount) || 0;

				// Nothing applied: either the selection was already empty of eligible docs, or every
				// item was blocked. Say why instead of a cheerful "done".
				if (processed === 0) {
					if (skipped > 0 && noAccess === skipped) {
						this.showErrorToast(this.locMessage('NOTE_DOCUMENT_LIST_BULK_NO_ACCESS_ALL'));
					} else {
						this.showSuccessToast(this.locMessage('NOTE_DOCUMENT_LIST_BULK_NOTHING'));
					}
					return;
				}

				// Full success: one short, action-specific line — no "processed/skipped" bookkeeping.
				if (skipped === 0) {
					this.showSuccessToast(this.bulkDoneMessage(action, processed));
					return;
				}

				// Partial success: a single whole phrase (no fragment gluing), pluralised on the
				// processed count; the skipped count rides along as a bare number.
				this.showSuccessToast(this.bulkPartialMessage(action, processed, skipped));
			},
			bulkDoneMessage(action, count) {
				const key = action === 'delete' ? 'NOTE_DOCUMENT_LIST_BULK_DONE_DELETE' : action === 'move' ? 'NOTE_DOCUMENT_LIST_BULK_DONE_MOVE' : 'NOTE_DOCUMENT_LIST_BULK_DONE_ARCHIVE';
				return main_core.Loc.getMessagePlural(key, count, {
					'#COUNT#': count
				});
			},
			bulkPartialMessage(action, done, skipped) {
				const key = action === 'delete' ? 'NOTE_DOCUMENT_LIST_BULK_PARTIAL_DELETE' : action === 'move' ? 'NOTE_DOCUMENT_LIST_BULK_PARTIAL_MOVE' : 'NOTE_DOCUMENT_LIST_BULK_PARTIAL_ARCHIVE';
				return main_core.Loc.getMessagePlural(key, done, {
					'#DONE#': done,
					'#SKIPPED#': skipped
				});
			},
			showBulkError(error) {
				const code = String(error?.code || '');
				if (code === 'NOTE_BULK_LIMIT_EXCEEDED') {
					this.showErrorToast(this.locMessage('NOTE_DOCUMENT_LIST_BULK_LIMIT'));
					return;
				}
				if (code === 'NOTE_INVALID_TARGET') {
					this.showErrorToast(this.locMessage('NOTE_WORKSPACE_BULK_INVALID_TARGET'));
					return;
				}
				this.showErrorToast(error?.message || this.locMessage('NOTE_DOCUMENT_LIST_BULK_ERROR'));
			},
			openBulkConfirm({
				title,
				okText,
				danger,
				bodyText,
				withNested,
				offerNested,
				countKey,
				initialCount,
				resolveCount
			}) {
				// Show the "with nested" toggle only when the backend reports live children among the
				// selection (offerNested); otherwise the default withNested is returned untouched (E).
				const hasToggle = withNested !== undefined && withNested !== null && offerNested === true;
				const hasCount = typeof countKey === 'string' && typeof initialCount === 'number';
				return new Promise(resolve => {
					let isResolved = false;
					let currentWithNested = Boolean(withNested);
					let countRequestId = 0;
					let okButton = null;
					const finish = value => {
						if (isResolved) {
							return;
						}
						isResolved = true;
						resolve(value);
					};
					const formatCount = count => main_core.Loc.getMessagePlural(countKey, count, {
						'#COUNT#': count
					}) || '';
					const textNode = main_core.Tag.render`<div class="note-workspace-bulk-confirm-text"></div>`;
					textNode.textContent = hasCount ? formatCount(initialCount) : String(bodyText || '');
					const limitNode = main_core.Tag.render`<div class="note-workspace-bulk-confirm-limit"></div>`;
					limitNode.style.display = 'none';
					limitNode.textContent = this.locMessage('NOTE_DOCUMENT_LIST_BULK_LIMIT');
					let toggleInput = null;
					let toggleNode = null;
					if (hasToggle) {
						toggleInput = document.createElement('input');
						toggleInput.type = 'checkbox';
						toggleInput.className = 'ui-checkbox__input';
						toggleInput.checked = currentWithNested;
						const boxSpan = main_core.Tag.render`
						<span class="ui-checkbox__box" aria-hidden="true">
							<span class="ui-checkbox__icon"><span class="ui-icon-set --check-m"></span></span>
						</span>
					`;
						const textSpan = main_core.Tag.render`<span class="ui-checkbox__label-text"></span>`;
						textSpan.textContent = this.locMessage('NOTE_WORKSPACE_BULK_NESTED_TOGGLE');
						toggleNode = main_core.Tag.render`<label class="ui-checkbox --size-md note-workspace-bulk-confirm-toggle"></label>`;
						if (currentWithNested) {
							toggleNode.classList.add('--checked');
						}
						toggleNode.append(toggleInput, boxSpan, textSpan);
						// Hidden until the on-open probe confirms nested actually expands the selection —
						// avoids a toggle that appears then vanishes for an already-complete subtree.
						toggleNode.style.display = 'none';
					}
					const content = main_core.Tag.render`
					<div class="note-workspace-bulk-confirm-content">
						${textNode}
						${toggleNode}
						${limitNode}
					</div>
				`;
					const refreshCount = ({
						immediate = false
					} = {}) => {
						if (!hasCount || !resolveCount) {
							return;
						}
						const requestId = ++countRequestId;
						let settled = false;
						let loaderTimer = null;
						// On open with the toggle already on (archive) the recount is a guaranteed server
						// round-trip, so block the button immediately — no available→loading→available flicker.
						// On toggle changes, delay the waiting state: local and cached branches settle
						// synchronously and shouldn't flash a spinner.
						if (immediate) {
							okButton?.setWaiting(true);
						} else {
							loaderTimer = setTimeout(() => {
								if (settled || requestId !== countRequestId) {
									return;
								}
								okButton?.setWaiting(true);
							}, 120);
						}
						resolveCount(currentWithNested).then(resolution => {
							settled = true;
							if (loaderTimer) {
								clearTimeout(loaderTimer);
							}
							if (requestId !== countRequestId) {
								return;
							}
							okButton?.setWaiting(false);
							const limitExceeded = resolution?.limitExceeded === true;
							limitNode.style.display = limitExceeded ? '' : 'none';
							textNode.style.display = limitExceeded ? 'none' : '';
							textNode.textContent = formatCount(Number(resolution?.affectedCount) || 0);
							okButton?.setDisabled(limitExceeded);
						}).catch(() => {
							settled = true;
							if (loaderTimer) {
								clearTimeout(loaderTimer);
							}
							if (requestId !== countRequestId) {
								return;
							}
							okButton?.setWaiting(false);
						});
					};
					if (toggleInput) {
						toggleInput.addEventListener('change', () => {
							currentWithNested = toggleInput.checked;
							toggleNode.classList.toggle('--checked', currentWithNested);
							refreshCount();
						});
					}

					// All bulk confirms mirror the single-delete dialog: prominent Cancel first (FILLED),
					// understated action second (PLAIN) — regardless of the danger flag (C).
					okButton = new ui_buttons.Button({
						text: String(okText || ''),
						dataset: {
							testid: 'note-dialog-confirm'
						},
						size: ui_buttons.ButtonSize.LARGE,
						style: ui_buttons.AirButtonStyle.PLAIN,
						useAirDesign: true,
						onclick: () => {
							finish({
								withNested: currentWithNested
							});
							dialog.hide();
						}
					});
					const cancelButton = new ui_buttons.Button({
						text: this.locMessage('NOTE_WORKSPACE_BULK_CANCEL'),
						dataset: {
							testid: 'note-dialog-cancel'
						},
						size: ui_buttons.ButtonSize.LARGE,
						style: ui_buttons.AirButtonStyle.FILLED,
						useAirDesign: true,
						onclick: () => {
							finish(null);
							dialog.hide();
						}
					});
					const dialog = new ui_system_dialog.Dialog({
						title: String(title || ''),
						content,
						hasOverlay: true,
						overlay: true,
						width: 420,
						centerButtons: [cancelButton, okButton],
						events: {
							onHide: () => {
								finish(null);
							}
						}
					});
					note_ui_themeContext.NoteThemeContext.themeDialog(dialog, content);
					dialog.show();

					// A selection that contains parents needs one server dry-run to know whether "with
					// nested" would pull in anything beyond the explicit picks. Open with the button
					// spinning and the toggle hidden; reveal it only if the subtree truly extends past the
					// selection. This decides visibility from real data before the popup is interactive, so
					// the toggle never appears-then-vanishes and never sits there doing nothing.
					if (hasToggle && resolveCount) {
						const probeId = ++countRequestId;
						okButton?.setWaiting(true);
						resolveCount(true).then(resolution => {
							if (probeId !== countRequestId) {
								return;
							}
							okButton?.setWaiting(false);
							const limitExceeded = resolution?.limitExceeded === true;
							const expanded = Number(resolution?.affectedCount) || 0;
							// Show the toggle only when nested reaches past the explicit selection.
							toggleNode.style.display = expanded > initialCount ? '' : 'none';
							// Archive defaults the toggle on, so reflect the real expanded volume at once;
							// delete keeps the roots-only count until the user opts in.
							if (currentWithNested) {
								limitNode.style.display = limitExceeded ? '' : 'none';
								textNode.style.display = limitExceeded ? 'none' : '';
								textNode.textContent = formatCount(expanded);
								okButton?.setDisabled(limitExceeded);
							}
						}).catch(() => {
							if (probeId !== countRequestId) {
								return;
							}
							okButton?.setWaiting(false);
							// Fall back to showing the toggle so the control stays available on error.
							toggleNode.style.display = '';
						});
					}
				});
			},
			showSuccessToast(text) {
				if (!main_core.Type.isStringFilled(text)) {
					return;
				}
				BX.UI.Notification.Center.notify({
					content: text,
					position: 'top-right'
				});
			},
			locMessage(id) {
				return main_core.Loc.getMessage(id) || '';
			}
		},
		// language=Vue
		template: `
		<div class="note-workspace-page">
			<teleport to="#note-page-header-slot">
				<div class="note-page-document-header">
					<div class="note-page-document-titles">
						<div class="note-page-breadcrumb">
							<span class="note-page-breadcrumb-root">{{ breadcrumbRoot }}</span>
							<template v-if="title">
								<BIcon class="note-page-breadcrumb-separator" name="chevron-right-s" :size="24" />
								<span class="note-page-breadcrumb-current">{{ title }}</span>
							</template>
						</div>
					</div>
					<div class="note-page-document-header-right">
						<div class="note-page-document-actions">
							<template v-if="isMobile">
								<button
									v-if="showAboutDone"
									type="button"
									class="ui-btn --air ui-btn-md --style-filled ui-btn-no-caps"
									:class="{ 'ui-btn-disabled': isAboutDoneBlocked }"
									:aria-disabled="isAboutDoneBlocked ? 'true' : null"
									:title="isAboutDoneBlocked ? aboutSaveBlockedReason : null"
									:aria-label="aboutDoneAriaLabel"
									data-testid="note-workspace-description-done-btn"
									@click="onAboutDone"
								>
									{{ messages.descriptionDone }}
								</button>
								<button
									v-if="showCreateButton"
									type="button"
									class="note-page-document-action-icon"
									:title="messages.createDocument"
									:aria-label="messages.createDocument"
									data-testid="note-collection-create-document"
									@click="onCreateDocument"
								>
									<div class="ui-icon-set --plus-l"></div>
								</button>
								<button
									ref="moreButton"
									type="button"
									class="note-page-document-action-icon"
									:title="messages.more"
									:aria-label="messages.more"
									data-testid="note-collection-more"
									@click="openMoreMenu"
								>
									<div class="ui-icon-set --more-l"></div>
								</button>
							</template>
							<template v-else>
								<div
									v-if="showAboutDone"
									class="note-workspace-about-sync"
									:class="{ 'note-workspace-about-sync--saving': aboutSaving }"
									aria-hidden="true"
									data-testid="note-workspace-description-sync-badge"
								>
									<span class="note-workspace-about-sync__dot"></span>
								</div>
								<button
									v-if="showAboutDone"
									type="button"
									class="ui-btn --air ui-btn-md --style-filled ui-btn-no-caps"
									:class="{ 'ui-btn-disabled': isAboutDoneBlocked }"
									:aria-disabled="isAboutDoneBlocked ? 'true' : null"
									:title="isAboutDoneBlocked ? aboutSaveBlockedReason : null"
									:aria-label="aboutDoneAriaLabel"
									data-testid="note-workspace-description-done-btn"
									@click="onAboutDone"
								>
									{{ messages.descriptionDone }}
								</button>
								<button
									v-if="showCreateButton"
									type="button"
									class="ui-btn --air ui-btn-md --style-filled ui-btn-no-caps --with-left-icon"
									data-testid="note-collection-create-document"
									@click="onCreateDocument"
								>
									<div class="ui-icon-set --plus-30"></div>
									{{ messages.createDocument }}
								</button>
								<button
									type="button"
									class="note-page-document-action-icon"
									:title="messages.copyLink"
									:aria-label="messages.copyLink"
									data-testid="note-collection-copy-link"
									@click="onCopyLink"
								>
									<div class="ui-icon-set --o-link"></div>
								</button>
								<button
									v-if="hasMenu"
									ref="moreButton"
									type="button"
									class="note-page-document-action-icon"
									:title="messages.more"
									:aria-label="messages.more"
									data-testid="note-collection-more"
									@click="openMoreMenu"
								>
									<div class="ui-icon-set --more-l"></div>
								</button>
							</template>
						</div>
					</div>
				</div>
			</teleport>

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
				<!-- The controls sit inside the heading to ride its baseline, so its accessible name is
						 pinned to the title alone: computed from the content it would read out the label of every
						 button after it. The buttons keep their own names and stay reachable. -->
				<h2 v-else class="note-workspace-page__title" :aria-label="title">{{ title }}<button
					v-if="canRenameCollection"
					type="button"
					class="note-workspace-page__title-edit"
					@click="onStartRenameTitle"
				><span class="ui-icon-set --edit-m"></span></button><button
					v-if="collection"
					type="button"
					class="note-workspace-page__favorite"
					:class="{ '--on': isFavorite }"
					:title="isFavorite ? messages.favoriteOff : messages.favoriteOn"
					:aria-label="isFavorite ? messages.favoriteOff : messages.favoriteOn"
					:aria-pressed="isFavorite ? 'true' : 'false'"
					:disabled="isTogglingFavorite"
					@click="onToggleFavorite"
				><BIcon :name="isFavorite ? Solid.FAVORITE : Outline.FAVORITE" :size="20" class="note-workspace-page__favorite-icon" /></button><button
					v-if="showSubscribeToggle"
					type="button"
					class="note-workspace-page__subscribe"
					:class="{ '--on': isSubscribed }"
					:title="isSubscribed ? messages.subscribed : messages.subscribe"
					:aria-label="isSubscribed ? messages.subscribed : messages.subscribe"
					:aria-pressed="isSubscribed ? 'true' : 'false'"
					:disabled="isTogglingSubscription"
					@click="onToggleSubscription"
				><BIcon :name="isSubscribed ? Solid.NOTIFICATION : Outline.NOTIFICATION" :size="20" class="note-workspace-page__subscribe-icon" /></button></h2>
			</div>

			<div class="note-workspace-page__tabs" role="tablist" :aria-label="messages.tabsLabel">
				<button
					v-if="mainDocumentId > 0"
					type="button"
					class="note-workspace-page__tab"
					data-testid="note-workspace-about-tab"
					:class="{ 'note-workspace-page__tab--active': activeTab === '${TAB_ABOUT}' }"
					role="tab"
					:aria-selected="activeTab === '${TAB_ABOUT}'"
					@click="setTab('${TAB_ABOUT}')"
				>
					{{ messages.tabAbout }}
				</button>
				<button
					type="button"
					class="note-workspace-page__tab"
					data-testid="note-workspace-all-tab"
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
					data-testid="note-workspace-mine-tab"
					:class="{ 'note-workspace-page__tab--active': activeTab === '${TAB_MINE}' }"
					role="tab"
					:aria-selected="activeTab === '${TAB_MINE}'"
					@click="setTab('${TAB_MINE}')"
				>
					{{ messages.tabMine }}
				</button>
			</div>

			<AboutPanel
				v-if="activeTab === '${TAB_ABOUT}'"
				ref="about"
				:main-document-id="mainDocumentId"
				:has-description="hasDescription"
				:can-manage="canManagePermissions"
				@state-change="onAboutStateChange"
				@open-internal-link="onOpenInternalLink"
			/>
			<template v-else>
				<div v-if="showEmpty" class="note-workspace-page__empty">
					<div class="note-workspace-page__empty-image" aria-hidden="true"></div>
					<p class="note-workspace-page__empty-text">{{ messages.emptyText }}</p>
				</div>
				<DocumentList
					v-else-if="!hasError"
					ref="documentList"
					:items="listItems"
					:has-more="hasMore"
					:loading="loading"
					mode="cards"
					:selection-enabled="selection.mode"
					:selectable="showSelectButton"
					:is-mobile="isMobile"
					:selected-ids="selection.ids"
					@open="onOpen"
					@load-more="onLoadMore"
					@select="onSelect"
				/>
			</template>
			</div>

			<teleport to="body">
				<BulkActionsBar
					section="active"
					:selected-count="selectedCount"
					:all-selected="allInCollection"
					:is-mobile="isMobile"
					@action="onBulkAction"
					@select-all="onSelectAll"
					@clear="onBulkClear"
				/>
			</teleport>
		</div>
	`
	};

	exports.NoteWorkspacePageComponent = NoteWorkspacePageComponent;

})(this.BX.Note = this.BX.Note || {}, BX.UI, window, window, BX, BX.Event, BX.Vue3, BX.UI.Notification, BX.UI.System, BX.UI.IconSet, window, BX.Note.Ui, BX.Note.Ui, BX.Note.Permissions, BX.Note.Sidebar, BX.Note.Ui, BX.Note.Ui, BX.Note, BX.Note.Editor, BX.Note.Ui);
//# sourceMappingURL=workspace.bundle.js.map
