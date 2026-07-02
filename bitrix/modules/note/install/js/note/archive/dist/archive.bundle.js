/* eslint-disable */
this.BX = this.BX || {};
(function (exports, main_core, main_core_events, ui_vue3, ui_buttons, ui_system_dialog, ui_notification, note_ui_themeContext, note_ui_documentList, note_ui_actionMenu, note_sidebar) {
	'use strict';

	const ACTION_LIST = 'note.infrastructure.DocumentController.listArchived';
	const ACTION_RESTORE = 'note.infrastructure.DocumentController.restore';
	const ACTION_RESTORE_ALL = 'note.infrastructure.DocumentController.restoreAll';
	const ACTION_DELETE_ALL = 'note.infrastructure.DocumentController.deleteAllArchived';
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
			DocumentList: note_ui_documentList.DocumentList
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
				requestId: 0
			};
		},
		computed: {
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
					disabled: !this.canRestoreAny || this.restoringAll || this.loading,
					onClick: () => {
						void this.onRestoreAll();
					}
				});
				items.push({
					text: main_core.Loc.getMessage('NOTE_ARCHIVE_PAGE_DELETE_ALL') || '',
					iconModifier: 'o-trashcan',
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
							size: ui_buttons.ButtonSize.LARGE,
							style: ui_buttons.AirButtonStyle.FILLED,
							useAirDesign: true,
							onclick: () => {
								finish(false);
								dialog.hide();
							}
						}), new ui_buttons.Button({
							text: String(okText || ''),
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
				<div class="note-page-breadcrumb">
					<button
						type="button"
						class="note-page-breadcrumb-link"
						@click="goRoot"
					>{{ breadcrumbRoot }}</button>
				</div>
			</teleport>
			<div class="note-archive-page__actions">
				<button
					v-if="hasItems"
					type="button"
					class="note-archive-page__action-icon"
					:title="moreMenuLabel"
					:aria-label="moreMenuLabel"
					@click="openMoreMenu"
				>
					<div class="ui-icon-set --more-l"></div>
				</button>
			</div>
			<div class="note-archive-page__body">
				<div class="note-archive-page-heading">
					<h2 class="note-archive-page-title">{{ titleText }}</h2>
					<p v-if="subtitleText" class="note-archive-page-subtitle">{{ subtitleText }}</p>
				</div>
				<DocumentList
					v-if="!hasError && (loading || hasItems)"
					mode="detailed"
					:items="listItems"
					:has-more="hasMore"
					:loading="loading"
					@open="onOpen"
					@open-collection="onOpenCollection"
					@load-more="onLoadMore"
				/>
				<div
					v-else-if="!hasError"
					class="note-archive-page-empty-hint"
				>
					{{ emptyHint }}
				</div>
			</div>
		</div>
	`
	};

	exports.NoteArchivePageComponent = NoteArchivePageComponent;

})(this.BX.Note = this.BX.Note || {}, BX, BX.Event, BX.Vue3, BX.UI, BX.UI.System, BX.UI.Notification, BX.Note.Ui, BX.Note.Ui, BX.Note.Ui, BX.Note.Sidebar);
//# sourceMappingURL=archive.bundle.js.map
