/* eslint-disable */
this.BX = this.BX || {};
(function (exports, main_core, main_core_events, ui_vue3, ui_buttons, ui_system_dialog, ui_notification, ui_iconSet_api_vue, note_ui_themeContext, note_ui_documentList, note_ui_actionMenu, note_sidebar) {
	'use strict';

	const ACTION_LIST = 'note.infrastructure.DocumentController.listArchived';
	const ACTION_RESTORE = 'note.infrastructure.DocumentController.restore';
	const ACTION_RESTORE_ALL = 'note.infrastructure.DocumentController.restoreAll';
	const ACTION_DELETE_ALL = 'note.infrastructure.DocumentController.deleteAllArchived';
	const ACTION_RESOLVE_BULK = 'note.infrastructure.DocumentController.resolveBulkSelection';
	const ACTION_RESTORE_MANY = 'note.infrastructure.DocumentController.restoreMany';
	const ACTION_DELETE_MANY = 'note.infrastructure.DocumentController.deleteMany';
	const SECTION_ARCHIVE = 'archive';

	// DTO-01: outcome of a bulk operation. On limitExceeded the counters are all zero and nothing was applied.

	class ArchiveService {
		async list({
			limit = 50,
			afterCursor = null
		} = {}) {
			try {
				const response = await main_core.ajax.runAction(ACTION_LIST, {
					data: {
						limit,
						afterCursor: afterCursor || null
					}
				});
				const data = response?.data ?? {};
				const documents = Array.isArray(data.items) ? data.items : [];
				return {
					items: documents.map(doc => ({
						id: Number(doc.id) || 0,
						parentId: doc.parentId == null ? null : Number(doc.parentId),
						title: String(doc.title || ''),
						collectionId: Number(doc.collectionId) || 0,
						collectionTitle: String(doc.collectionTitle || ''),
						archivedAt: doc.archivedAt ? String(doc.archivedAt) : null,
						archivedBy: main_core.Type.isPlainObject(doc.archivedBy) ? {
							id: Number(doc.archivedBy.id) || 0,
							name: String(doc.archivedBy.name || ''),
							isSystem: doc.archivedBy.isSystem === true
						} : null,
						canRestore: Boolean(doc.canRestore),
						excerpt: String(doc.excerpt || ''),
						author: main_core.Type.isPlainObject(doc.author) ? {
							id: Number(doc.author.id) || 0,
							name: String(doc.author.name || ''),
							photoUrl: doc.author.photoUrl ? String(doc.author.photoUrl) : null,
							isSystem: doc.author.isSystem === true
						} : null
					})),
					nextCursor: main_core.Type.isPlainObject(data.nextCursor) ? data.nextCursor : null
				};
			} catch (error) {
				throw new Error(this.#extractErrorMessage(error));
			}
		}
		async restore(id) {
			try {
				await main_core.ajax.runAction(ACTION_RESTORE, {
					data: {
						id
					}
				});
			} catch (error) {
				throw new Error(this.#extractErrorMessage(error));
			}
		}
		async restoreAll() {
			try {
				const response = await main_core.ajax.runAction(ACTION_RESTORE_ALL, {
					data: {}
				});
				const data = response?.data ?? {};
				return {
					restoredCount: Number(data.restoredCount) || 0,
					restoredCollections: Array.isArray(data.restoredCollections) ? data.restoredCollections : []
				};
			} catch (error) {
				throw new Error(this.#extractErrorMessage(error));
			}
		}
		async deleteAll() {
			try {
				const response = await main_core.ajax.runAction(ACTION_DELETE_ALL, {
					data: {}
				});
				const data = response?.data ?? {};
				return {
					deletedCount: Number(data.deletedCount) || 0
				};
			} catch (error) {
				throw new Error(this.#extractErrorMessage(error));
			}
		}

		// API-08 dry-run: true affected volume (roots + descendants) for an explicit archive selection.
		async resolveBulkSelection(ids, withNested) {
			try {
				const response = await main_core.ajax.runAction(ACTION_RESOLVE_BULK, {
					data: {
						documentIds: this.#normalizeIds(ids),
						section: SECTION_ARCHIVE,
						withNested: withNested ? 1 : 0
					}
				});
				const data = response?.data ?? {};
				return {
					affectedCount: Number(data.affectedCount) || 0,
					limitExceeded: data.limitExceeded === true
				};
			} catch (error) {
				throw this.#wrapError(error);
			}
		}

		// API-03
		async restoreMany(ids) {
			return this.#runBulk(ACTION_RESTORE_MANY, {
				documentIds: this.#normalizeIds(ids)
			});
		}

		// API-02
		async deleteMany(ids, withNested) {
			return this.#runBulk(ACTION_DELETE_MANY, {
				documentIds: this.#normalizeIds(ids),
				section: SECTION_ARCHIVE,
				withNested: withNested ? 1 : 0
			});
		}
		async #runBulk(action, data) {
			try {
				const response = await main_core.ajax.runAction(action, {
					data
				});
				return this.#parseOutcome(response?.data?.outcome);
			} catch (error) {
				throw this.#wrapError(error);
			}
		}
		#parseOutcome(raw) {
			const outcome = main_core.Type.isPlainObject(raw) ? raw : {};
			return {
				processedCount: Number(outcome.processedCount) || 0,
				skippedCount: Number(outcome.skippedCount) || 0,
				skippedByAccessCount: Number(outcome.skippedByAccessCount) || 0,
				skippedOrphanCount: Number(outcome.skippedOrphanCount) || 0,
				limitExceeded: outcome.limitExceeded === true
			};
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
			return 'Archive request failed';
		}
	}

	const PAGE_SIZE = 50;
	const NoteArchivePageComponent = {
		name: 'NoteArchivePage',
		components: {
			BIcon: ui_iconSet_api_vue.BIcon,
			DocumentList: note_ui_documentList.DocumentList,
			BulkActionsBar: note_ui_documentList.BulkActionsBar
		},
		inject: {
			sidebarState: {
				from: 'noteSidebarState',
				default: null
			}
		},
		emits: ['open'],
		data() {
			return {
				items: [],
				loading: false,
				restoringAll: false,
				deletingAll: false,
				hasMore: false,
				hasError: false,
				nextCursor: null,
				requestId: 0,
				selection: note_ui_documentList.createSelection(),
				// "Select all" latch: routes bulk restore/delete to the over-section endpoints
				// (restoreAll/deleteAll). Any manual toggle drops it.
				allSelected: false,
				bulkBusy: false
			};
		},
		computed: {
			Outline: () => ui_iconSet_api_vue.Outline,
			isMobile() {
				return Boolean(this.sidebarState?.isMobile);
			},
			selectedCount() {
				return this.selection.count;
			},
			showSelectButton() {
				return !this.hasError && this.hasItems;
			},
			listItems() {
				return this.items.map(item => ({
					id: item.id,
					title: item.title,
					snippet: '',
					excerpt: item.excerpt || '',
					author: item.author || null,
					documentId: item.id,
					collectionId: item.collectionId || 0,
					collectionTitle: item.collectionTitle || '',
					archivedBy: item.archivedBy || null,
					archivedAt: item.archivedAt || null
				}));
			},
			titleText() {
				return main_core.Loc.getMessage('NOTE_ARCHIVE_PAGE_TITLE') || '';
			},
			breadcrumbRoot() {
				return main_core.Loc.getMessage('NOTE_ARCHIVE_BREADCRUMB_ROOT') || '';
			},
			subtitleText() {
				return main_core.Loc.getMessage('NOTE_ARCHIVE_PAGE_SUBTITLE') || '';
			},
			emptyHint() {
				return main_core.Loc.getMessage('NOTE_ARCHIVE_PAGE_EMPTY_HINT') || '';
			},
			moreMenuLabel() {
				return main_core.Loc.getMessage('NOTE_ARCHIVE_PAGE_MORE_LABEL') || '';
			},
			canRestoreAny() {
				return this.items.some(item => item.canRestore);
			},
			hasItems() {
				return this.items.length > 0;
			},
			headerMenuItems() {
				const items = [];
				items.push({
					text: main_core.Loc.getMessage('NOTE_ARCHIVE_PAGE_RESTORE_ALL') || '',
					iconModifier: 'o-undo',
					testId: 'note-archive-menu-restore-all',
					disabled: !this.canRestoreAny || this.restoringAll || this.loading,
					onClick: () => {
						void this.onRestoreAll();
					}
				});
				items.push({
					text: main_core.Loc.getMessage('NOTE_ARCHIVE_PAGE_DELETE_ALL') || '',
					iconModifier: 'o-trashcan',
					testId: 'note-archive-menu-delete-all',
					danger: true,
					disabled: !this.hasItems || this.deletingAll || this.restoringAll || this.loading,
					onClick: () => {
						void this.onDeleteAll();
					}
				});
				return items;
			}
		},
		created() {
			this.service = new ArchiveService();
			this.actionMenuService = ui_vue3.markRaw(new note_ui_actionMenu.ActionMenuService({
				popupClass: 'note-action-menu'
			}));
			void this.loadPage(false);
		},
		beforeUnmount() {
			this.actionMenuService?.destroy?.();
			this.actionMenuService = null;
		},
		methods: {
			goRoot() {
				this.$router.push({
					name: 'archive'
				});
			},
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
					if (append && this.allSelected && this.selection.mode) {
						const nextIds = response.items.map(item => Number(item.id) || 0).filter(id => id > 0);
						this.selection.set([...this.selection.ids, ...nextIds]);
					}
				} catch (error) {
					if (currentRequestId !== this.requestId) {
						return;
					}
					if (!append) {
						this.hasError = true;
					}
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
			resetSelection() {
				// Hand focus back to the list when the floating bulk-actions bar (teleported to <body>)
				// is about to hide, so keyboard/AT focus is not lost (WCAG 2.4.3). A soft exit from
				// unticking the last card leaves focus on that card and must be left alone.
				const restoreFocus = this.isFocusInsideBulkBar();
				this.allSelected = false;
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

				// Desktop hover checkbox: enter selection mode before applying the toggle.
				if (activate && !this.selection.mode) {
					this.selection.enter();
				}
				if (this.selection.has(key) !== selected) {
					this.selection.toggle(key);
				}

				// Deselecting the last item leaves selection mode so the checkboxes do not linger.
				if (this.selection.count === 0) {
					this.resetSelection();
					return;
				}

				// Keep the "select all" latch in sync with the manual pick: when every loaded item
				// is ticked and nothing is left to paginate, the manual set IS the whole section, so the
				// latch (button highlight + action routing) reflects it; otherwise it stays a subset.
				this.allSelected = !this.hasMore && this.selection.count === this.items.length;
			},
			onSelectAll() {
				if (this.allSelected) {
					this.resetSelection();
					return;
				}
				this.allSelected = true;
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
				if (type === 'restore') {
					void this.runRestore();
				} else if (type === 'delete') {
					void this.runDelete();
				}
			},
			async runRestore() {
				// "Select all" reuses the over-section restore (covers unloaded documents).
				if (this.allSelected) {
					await this.onRestoreAll();
					this.resetSelection();
					return;
				}
				const ids = [...this.selection.ids];
				if (ids.length === 0) {
					return;
				}
				await this.runBulk(() => this.service.restoreMany(ids), {
					restored: true
				});
			},
			async runDelete() {
				if (this.allSelected) {
					await this.onDeleteAll();
					this.resetSelection();
					return;
				}
				const ids = [...this.selection.ids];
				if (ids.length === 0) {
					return;
				}
				const confirmed = await this.confirmBulkDelete(ids);
				if (!confirmed) {
					return;
				}
				await this.runBulk(() => this.service.deleteMany(ids, confirmed.withNested), {
					restored: false
				});
			},
			confirmBulkDelete(ids) {
				// Archive is a flat list with no nesting UI, so bulk delete removes exactly the selected
				// documents — no "with nested" option and no subtree dry-run.
				return this.openBulkConfirm({
					title: main_core.Loc.getMessage('NOTE_ARCHIVE_BULK_DELETE_TITLE') || '',
					okText: main_core.Loc.getMessage('NOTE_ARCHIVE_BULK_DELETE_ACTION') || '',
					countKey: 'NOTE_DOCUMENT_LIST_BULK_DELETE_COUNT',
					count: ids.length
				});
			},
			async runBulk(operation, {
				restored
			}) {
				this.bulkBusy = true;
				try {
					const outcome = await operation();
					this.reportOutcome(outcome, restored ? 'restore' : 'delete');
					if (restored && Number(outcome?.processedCount) > 0) {
						this.emitBulkRestored();
					}
					this.resetSelection();
				} catch (error) {
					this.showBulkError(error);
				} finally {
					this.bulkBusy = false;
				}

				// Re-fetch on both success and failure so the list reflects the server's authoritative state.
				await this.loadPage(false);
			},
			emitBulkRestored() {
				main_core_events.EventEmitter.emit(note_sidebar.NoteEvent.DOCUMENTS_BULK_RESTORED, new main_core_events.BaseEvent({
					data: {
						restoredCollections: []
					}
				}));
			},
			reportOutcome(outcome, action) {
				if (outcome?.limitExceeded) {
					this.showErrorToast(main_core.Loc.getMessage('NOTE_DOCUMENT_LIST_BULK_LIMIT') || '');
					return;
				}
				const processed = Number(outcome?.processedCount) || 0;
				const skipped = Number(outcome?.skippedCount) || 0;
				const noAccess = Number(outcome?.skippedByAccessCount) || 0;
				if (processed === 0) {
					if (skipped > 0 && noAccess === skipped) {
						this.showErrorToast(main_core.Loc.getMessage('NOTE_DOCUMENT_LIST_BULK_NO_ACCESS_ALL') || '');
					} else {
						this.showSuccessToast(main_core.Loc.getMessage('NOTE_DOCUMENT_LIST_BULK_NOTHING') || '');
					}
					return;
				}
				if (skipped === 0) {
					const key = action === 'restore' ? 'NOTE_DOCUMENT_LIST_BULK_DONE_RESTORE' : 'NOTE_DOCUMENT_LIST_BULK_DONE_DELETE';
					this.showSuccessToast(main_core.Loc.getMessagePlural(key, processed, {
						'#COUNT#': processed
					}));
					return;
				}

				// Partial success: a single whole phrase pluralised on the processed count.
				const partialKey = action === 'restore' ? 'NOTE_DOCUMENT_LIST_BULK_PARTIAL_RESTORE' : 'NOTE_DOCUMENT_LIST_BULK_PARTIAL_DELETE';
				this.showSuccessToast(main_core.Loc.getMessagePlural(partialKey, processed, {
					'#DONE#': processed,
					'#SKIPPED#': skipped
				}));
			},
			showBulkError(error) {
				const code = String(error?.code || '');
				if (code === 'NOTE_BULK_LIMIT_EXCEEDED') {
					this.showErrorToast(main_core.Loc.getMessage('NOTE_DOCUMENT_LIST_BULK_LIMIT') || '');
					return;
				}
				this.showErrorToast(error?.message || main_core.Loc.getMessage('NOTE_DOCUMENT_LIST_BULK_ERROR') || '');
			},
			openBulkConfirm({
				title,
				okText,
				countKey,
				count
			}) {
				return new Promise(resolve => {
					let isResolved = false;
					const finish = value => {
						if (isResolved) {
							return;
						}
						isResolved = true;
						resolve(value);
					};
					const formatCount = n => main_core.Loc.getMessagePlural(countKey, n, {
						'#COUNT#': n
					}) || '';
					const textNode = main_core.Tag.render`<div class="note-archive-bulk-confirm-text"></div>`;
					textNode.textContent = formatCount(Number(count) || 0);
					const content = main_core.Tag.render`
					<div class="note-archive-bulk-confirm-content">
						${textNode}
					</div>
				`;

					// Matches the single-delete dialog: no red button, inverted order
					// (prominent Cancel on the left, understated Delete on the right).
					const okButton = new ui_buttons.Button({
						text: String(okText || ''),
						dataset: {
							testid: 'note-dialog-confirm'
						},
						size: ui_buttons.ButtonSize.LARGE,
						style: ui_buttons.AirButtonStyle.PLAIN,
						useAirDesign: true,
						onclick: () => {
							finish({
								withNested: false
							});
							dialog.hide();
						}
					});
					const cancelButton = new ui_buttons.Button({
						text: main_core.Loc.getMessage('NOTE_ARCHIVE_BULK_CANCEL') || '',
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
				});
			},
			async onRestoreAll() {
				if (this.restoringAll || !this.canRestoreAny) {
					return;
				}
				this.restoringAll = true;
				try {
					const {
						restoredCount,
						restoredCollections
					} = await this.service.restoreAll();
					if (restoredCount > 0) {
						main_core_events.EventEmitter.emit(note_sidebar.NoteEvent.DOCUMENTS_BULK_RESTORED, new main_core_events.BaseEvent({
							data: {
								restoredCollections: Array.isArray(restoredCollections) ? restoredCollections : []
							}
						}));
					}
					await this.loadPage(false);
					const message = (main_core.Loc.getMessage('NOTE_ARCHIVE_PAGE_RESTORE_ALL_SUCCESS') || '').replace('#COUNT#', String(restoredCount));
					this.showSuccessToast(message);
				} catch (error) {
					this.showErrorToast(error?.message || '');
				} finally {
					this.restoringAll = false;
				}
			},
			async onDeleteAll() {
				if (this.deletingAll || this.restoringAll || !this.hasItems) {
					return;
				}
				const confirmed = await this.confirm({
					title: main_core.Loc.getMessage('NOTE_ARCHIVE_PAGE_DELETE_ALL_CONFIRM_TITLE') || '',
					message: main_core.Loc.getMessage('NOTE_ARCHIVE_PAGE_DELETE_ALL_CONFIRM_MESSAGE') || '',
					okText: main_core.Loc.getMessage('NOTE_ARCHIVE_PAGE_DELETE_ALL_ACTION') || ''
				});
				if (!confirmed) {
					return;
				}
				this.deletingAll = true;
				try {
					const {
						deletedCount
					} = await this.service.deleteAll();
					await this.loadPage(false);
					if (deletedCount > 0) {
						const message = (main_core.Loc.getMessage('NOTE_ARCHIVE_PAGE_DELETE_ALL_SUCCESS') || '').replace('#COUNT#', String(deletedCount));
						this.showSuccessToast(message);
					} else {
						this.showSuccessToast(main_core.Loc.getMessage('NOTE_ARCHIVE_PAGE_DELETE_ALL_NOTHING') || '');
					}
				} catch (error) {
					this.showErrorToast(error?.message || '');
				} finally {
					this.deletingAll = false;
				}
			},
			confirm({
				title,
				message,
				okText
			}) {
				return new Promise(resolve => {
					let isResolved = false;
					const finish = value => {
						if (isResolved) {
							return;
						}
						isResolved = true;
						resolve(value);
					};
					const content = main_core.Tag.render`
					<div class="note-archive-confirm-content">
						${String(message || '')}
					</div>
				`;
					const dialog = new ui_system_dialog.Dialog({
						title: String(title || ''),
						content,
						hasOverlay: true,
						overlay: true,
						width: 420,
						centerButtons: [new ui_buttons.Button({
							text: main_core.Loc.getMessage('NOTE_ARCHIVE_PAGE_CONFIRM_CANCEL') || '',
							dataset: {
								testid: 'note-dialog-cancel'
							},
							size: ui_buttons.ButtonSize.LARGE,
							style: ui_buttons.AirButtonStyle.FILLED,
							useAirDesign: true,
							onclick: () => {
								finish(false);
								dialog.hide();
							}
						}), new ui_buttons.Button({
							text: String(okText || ''),
							dataset: {
								testid: 'note-dialog-confirm'
							},
							size: ui_buttons.ButtonSize.LARGE,
							style: ui_buttons.AirButtonStyle.PLAIN,
							useAirDesign: true,
							onclick: () => {
								finish(true);
								dialog.hide();
							}
						})],
						events: {
							onHide: () => {
								finish(false);
							}
						}
					});
					note_ui_themeContext.NoteThemeContext.themeDialog(dialog, content);
					dialog.show();
				});
			},
			onOpen(item) {
				this.$emit('open', {
					documentId: item.documentId
				});
			},
			onOpenCollection({
				collectionId
			}) {
				if (!collectionId) {
					return;
				}
				this.$router.push({
					name: 'workspace',
					params: {
						id: collectionId
					}
				});
			},
			openMoreMenu(event) {
				const target = event?.currentTarget;
				if (!this.actionMenuService || !(target instanceof HTMLElement)) {
					return;
				}
				const items = this.headerMenuItems;
				if (items.length === 0) {
					return;
				}
				this.actionMenuService.open(items, target, {
					key: 'archive-header',
					popupClass: 'note-action-menu'
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
			showErrorToast(text) {
				const message = main_core.Type.isStringFilled(text) ? text : main_core.Loc.getMessage('NOTE_ARCHIVE_PAGE_ERROR_GENERIC') || '';
				if (!main_core.Type.isStringFilled(message)) {
					return;
				}
				BX.UI.Notification.Center.notify({
					content: message,
					position: 'top-right'
				});
			}
		},
		// language=Vue
		template: `
		<div class="note-archive-page">
			<teleport to="#note-page-header-slot">
				<div class="note-page-document-header">
					<div class="note-page-document-titles">
						<div class="note-page-breadcrumb">
							<button
								type="button"
								class="note-page-breadcrumb-link"
								@click="goRoot"
							>{{ breadcrumbRoot }}</button>
						</div>
					</div>
					<div class="note-page-document-header-right">
						<div class="note-page-document-actions">
							<button
								v-if="hasItems"
								type="button"
								class="note-page-document-action-icon"
								:title="moreMenuLabel"
								:aria-label="moreMenuLabel"
								data-testid="note-archive-more"
								@click="openMoreMenu"
							>
								<div class="ui-icon-set --more-l"></div>
							</button>
						</div>
					</div>
				</div>
			</teleport>
			<div class="note-archive-page__body">
				<div class="note-archive-page-heading">
					<h2 class="note-archive-page-title">{{ titleText }}</h2>
					<p v-if="subtitleText" class="note-archive-page-subtitle">{{ subtitleText }}</p>
				</div>
				<DocumentList
					v-if="!hasError && (loading || hasItems)"
					ref="documentList"
					mode="detailed"
					:items="listItems"
					:has-more="hasMore"
					:loading="loading"
					:selection-enabled="selection.mode"
					:selectable="showSelectButton"
					:is-mobile="isMobile"
					:selected-ids="selection.ids"
					@open="onOpen"
					@open-collection="onOpenCollection"
					@load-more="onLoadMore"
					@select="onSelect"
				/>
				<div
					v-else-if="!hasError"
					class="note-archive-page-empty-hint"
				>
					{{ emptyHint }}
				</div>
			</div>

			<teleport to="body">
				<BulkActionsBar
					section="archive"
					:selected-count="selectedCount"
					:all-selected="allSelected"
					:is-mobile="isMobile"
					@action="onBulkAction"
					@select-all="onSelectAll"
					@clear="onBulkClear"
				/>
			</teleport>
		</div>
	`
	};

	exports.NoteArchivePageComponent = NoteArchivePageComponent;

})(this.BX.Note = this.BX.Note || {}, BX, BX.Event, BX.Vue3, BX.UI, BX.UI.System, BX.UI.Notification, BX.UI.IconSet, BX.Note.Ui, BX.Note.Ui, BX.Note.Ui, BX.Note.Sidebar);
//# sourceMappingURL=archive.bundle.js.map
