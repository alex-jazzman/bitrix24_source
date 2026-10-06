/* eslint-disable */
this.BX = this.BX || {};
(function (exports, main_core, main_core_events, ui_vue3, ui_buttons, ui_system_dialog, ui_notification, ui_iconSet_api_vue, note_ui_themeContext, note_ui_documentList, note_ui_actionMenu, note_sidebar, note_ui_collectionPicker) {
	'use strict';

	const ACTION_LIST = 'note.infrastructure.RecycleBinController.list';
	const ACTION_STATS = 'note.infrastructure.RecycleBinController.getStats';
	const ACTION_RESTORE = 'note.infrastructure.RecycleBinController.restoreDocument';
	const ACTION_RESTORE_ALL = 'note.infrastructure.RecycleBinController.restoreAll';
	const ACTION_HARD_DELETE = 'note.infrastructure.RecycleBinController.hardDeleteDocument';
	const ACTION_EMPTY = 'note.infrastructure.RecycleBinController.empty';
	const ACTION_RESTORE_MANY = 'note.infrastructure.RecycleBinController.restoreMany';
	const ACTION_HARD_DELETE_MANY = 'note.infrastructure.RecycleBinController.hardDeleteMany';
	const ORPHAN_TARGET_REQUIRED_CODE = 'NOTE_RECYCLE_BIN_ORPHAN_TARGET_REQUIRED';

	// DTO-01: outcome of a bulk operation. On limitExceeded the counters are all zero and nothing was applied.

	class RecycleBinServiceError extends Error {
		// Present on the orphan double-signal: the rejection carries the partial outcome alongside the code.

		constructor(message, code = '') {
			super(message);
			this.code = code;
			this.outcome = null;
		}
	}
	class RecycleBinService {
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
					items: documents.map(doc => this.#normalizeItem(doc)),
					nextCursor: main_core.Type.isPlainObject(data.nextCursor) ? data.nextCursor : null,
					isAdmin: Boolean(data.isAdmin)
				};
			} catch (error) {
				throw this.#toServiceError(error);
			}
		}
		async restoreDocument(recycleBinId, targetCollectionId = null) {
			try {
				const data = {
					recycleBinId
				};
				if (targetCollectionId !== null && targetCollectionId !== undefined) {
					data.targetCollectionId = Number(targetCollectionId);
				}
				const response = await main_core.ajax.runAction(ACTION_RESTORE, {
					data
				});
				const payload = response?.data ?? {};
				return {
					documentId: Number(payload.documentId) || 0
				};
			} catch (error) {
				throw this.#toServiceError(error);
			}
		}
		async getStats() {
			try {
				const response = await main_core.ajax.runAction(ACTION_STATS, {
					data: {}
				});
				const data = response?.data ?? {};
				return {
					total: Number(data.total) || 0,
					orphanCount: Number(data.orphanCount) || 0
				};
			} catch (error) {
				throw this.#toServiceError(error);
			}
		}
		async restoreAll({
			orphanTargetCollectionId = null
		} = {}) {
			try {
				const data = {};
				if (orphanTargetCollectionId !== null && orphanTargetCollectionId !== undefined) {
					data.orphanTargetCollectionId = Number(orphanTargetCollectionId);
				}
				const response = await main_core.ajax.runAction(ACTION_RESTORE_ALL, {
					data
				});
				const payload = response?.data ?? {};
				return {
					restoredCount: Number(payload.restored) || 0,
					skippedOrphan: Number(payload.skippedOrphan) || 0
				};
			} catch (error) {
				throw this.#toServiceError(error);
			}
		}
		async hardDeleteDocument(recycleBinId) {
			try {
				const response = await main_core.ajax.runAction(ACTION_HARD_DELETE, {
					data: {
						recycleBinId
					}
				});
				const data = response?.data ?? {};
				return {
					documentId: Number(data.documentId) || 0
				};
			} catch (error) {
				throw this.#toServiceError(error);
			}
		}
		async empty() {
			try {
				const response = await main_core.ajax.runAction(ACTION_EMPTY, {
					data: {}
				});
				const data = response?.data ?? {};
				return {
					deletedCount: Number(data.deleted) || 0
				};
			} catch (error) {
				throw this.#toServiceError(error);
			}
		}

		// API-03. Ids are recycle-bin record ids, NOT document ids.
		// Orphan double-signal: when targetCollectionId is null and orphans are present the backend both
		// rejects (code ORPHAN_TARGET_REQUIRED) AND returns the partial outcome; both are surfaced on the error.
		async restoreMany(recycleBinIds, targetCollectionId = null) {
			try {
				const data = {
					recycleBinIds: this.#normalizeIds(recycleBinIds)
				};
				if (targetCollectionId !== null && targetCollectionId !== undefined) {
					data.targetCollectionId = Number(targetCollectionId);
				}
				const response = await main_core.ajax.runAction(ACTION_RESTORE_MANY, {
					data
				});
				return this.#parseOutcome(response?.data?.outcome);
			} catch (error) {
				throw this.#toBulkError(error);
			}
		}

		// API-04
		async hardDeleteMany(recycleBinIds) {
			try {
				const response = await main_core.ajax.runAction(ACTION_HARD_DELETE_MANY, {
					data: {
						recycleBinIds: this.#normalizeIds(recycleBinIds)
					}
				});
				return this.#parseOutcome(response?.data?.outcome);
			} catch (error) {
				throw this.#toBulkError(error);
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
		#toBulkError(error) {
			const wrapped = this.#toServiceError(error);
			// Keep the partial outcome from the rejection so the orphan retry does not discard progress.
			const rawOutcome = main_core.Type.isPlainObject(error) && main_core.Type.isPlainObject(error.data) ? error.data.outcome : null;
			if (main_core.Type.isPlainObject(rawOutcome)) {
				wrapped.outcome = this.#parseOutcome(rawOutcome);
			}
			return wrapped;
		}
		#normalizeItem(doc) {
			return {
				id: Number(doc?.id) || 0,
				documentId: Number(doc?.documentId) || 0,
				title: String(doc?.title || ''),
				parentId: doc?.parentId == null ? null : Number(doc.parentId),
				collectionId: Number(doc?.collectionId) || 0,
				collectionTitle: String(doc?.collectionTitle || ''),
				orphan: Boolean(doc?.orphan),
				trashedAt: doc?.trashedAt ? String(doc.trashedAt) : null,
				trashedBy: main_core.Type.isPlainObject(doc?.trashedBy) ? {
					id: Number(doc.trashedBy.id) || 0,
					name: String(doc.trashedBy.name || ''),
					isSystem: doc.trashedBy.isSystem === true
				} : null,
				origin: String(doc?.origin || ''),
				canRestore: Boolean(doc?.canRestore),
				canHardDelete: Boolean(doc?.canHardDelete),
				excerpt: String(doc?.excerpt || ''),
				author: main_core.Type.isPlainObject(doc?.author) ? {
					id: Number(doc.author.id) || 0,
					name: String(doc.author.name || ''),
					photoUrl: doc.author.photoUrl ? String(doc.author.photoUrl) : null,
					isSystem: doc.author.isSystem === true
				} : null
			};
		}
		#toServiceError(error) {
			if (main_core.Type.isPlainObject(error)) {
				const errors = Array.isArray(error?.errors) ? error.errors : [];
				for (const item of errors) {
					if (!main_core.Type.isPlainObject(item)) {
						continue;
					}
					const message = main_core.Type.isStringFilled(item.message) ? item.message : '';
					const code = main_core.Type.isStringFilled(item.code) ? item.code : '';
					if (message || code) {
						return new RecycleBinServiceError(message, code);
					}
				}
				if (main_core.Type.isStringFilled(error.message)) {
					return new RecycleBinServiceError(error.message);
				}
			}
			return new RecycleBinServiceError('Recycle bin request failed');
		}
	}

	function openBulkRestorePopup(options) {
		const total = Math.max(0, Number(options?.total) || 0);
		const orphanCount = Math.max(0, Number(options?.orphanCount) || 0);
		const hasOrphans = orphanCount > 0;
		return new Promise(resolve => {
			let isResolved = false;
			let restoreButton = null;
			const finish = value => {
				if (isResolved) {
					return;
				}
				isResolved = true;
				resolve(value);
			};
			const headlineNode = main_core.Tag.render`
			<div class="note-recyclebin-bulk-popup-text"></div>
		`;
			headlineNode.textContent = buildHeadline(total);
			const orphanHintNode = hasOrphans ? main_core.Tag.render`<div class="note-recyclebin-bulk-popup-hint"></div>` : null;
			if (orphanHintNode) {
				orphanHintNode.textContent = buildOrphanHint(orphanCount);
			}
			const getSelectedCollectionId = () => {
				const selected = picker ? picker.getSelectedCollection() : null;
				return selected ? selected.id : 0;
			};
			const updateRestoreState = () => {
				if (!restoreButton) {
					return;
				}
				if (!hasOrphans) {
					restoreButton.setDisabled(false);
					return;
				}
				restoreButton.setDisabled(getSelectedCollectionId() <= 0);
			};

			// Selector is only shown when part of the selection has lost its source collection.
			const picker = hasOrphans ? note_ui_collectionPicker.createCollectionSelector({
				placeholder: main_core.Loc.getMessage('NOTE_RECYCLEBIN_ORPHAN_POPUP_PLACEHOLDER') || '',
				mobileDropdownHeight: 240,
				onSelectionChange: () => updateRestoreState()
			}) : null;
			const content = main_core.Tag.render`
			<div class="note-recyclebin-bulk-popup-content">
				${headlineNode}
				${orphanHintNode}
				${picker ? picker.node : ''}
			</div>
		`;
			restoreButton = new ui_buttons.Button({
				text: main_core.Loc.getMessage('NOTE_RECYCLEBIN_PAGE_RESTORE_ALL') || '',
				dataset: {
					testid: 'note-dialog-confirm'
				},
				size: ui_buttons.ButtonSize.LARGE,
				style: ui_buttons.AirButtonStyle.FILLED,
				useAirDesign: true,
				disabled: hasOrphans,
				onclick: () => {
					if (hasOrphans) {
						const id = getSelectedCollectionId();
						if (id <= 0) {
							return;
						}
						finish({
							confirmed: true,
							orphanTargetCollectionId: id
						});
					} else {
						finish({
							confirmed: true,
							orphanTargetCollectionId: null
						});
					}
					dialog.hide();
				}
			});
			const cancelButton = new ui_buttons.Button({
				text: main_core.Loc.getMessage('NOTE_RECYCLEBIN_PAGE_CONFIRM_CANCEL') || '',
				dataset: {
					testid: 'note-dialog-cancel'
				},
				size: ui_buttons.ButtonSize.LARGE,
				style: ui_buttons.AirButtonStyle.PLAIN,
				useAirDesign: true,
				onclick: () => {
					finish({
						confirmed: false,
						orphanTargetCollectionId: null
					});
					dialog.hide();
				}
			});
			const dialog = new ui_system_dialog.Dialog({
				title: main_core.Loc.getMessage('NOTE_RECYCLEBIN_BULK_POPUP_TITLE') || '',
				content,
				hasOverlay: true,
				overlay: true,
				width: 480,
				centerButtons: [restoreButton, cancelButton],
				events: {
					onAfterShow: () => {
						if (picker) {
							picker.applyTheme();
						}
						updateRestoreState();
					},
					onHide: () => {
						if (picker) {
							picker.destroy();
						}
						finish({
							confirmed: false,
							orphanTargetCollectionId: null
						});
					}
				}
			});
			note_ui_themeContext.NoteThemeContext.themeDialog(dialog, content);
			dialog.show();
		});
	}
	function buildHeadline(total) {
		return (main_core.Loc.getMessage('NOTE_RECYCLEBIN_BULK_POPUP_TEXT') || '').replace('#COUNT#', String(total));
	}
	function buildOrphanHint(orphanCount) {
		return (main_core.Loc.getMessage('NOTE_RECYCLEBIN_BULK_POPUP_ORPHAN_HINT') || '').replace('#COUNT#', String(orphanCount));
	}

	function openOrphanRestorePopup(options = {}) {
		const documentTitle = String(options?.documentTitle || '');
		const bodyOverride = String(options?.bodyText || '');
		return note_ui_collectionPicker.openCollectionPicker({
			title: main_core.Loc.getMessage('NOTE_RECYCLEBIN_ORPHAN_POPUP_TITLE') || '',
			description: bodyOverride || buildBodyText(documentTitle),
			placeholder: main_core.Loc.getMessage('NOTE_RECYCLEBIN_ORPHAN_POPUP_PLACEHOLDER') || '',
			primaryLabel: main_core.Loc.getMessage('NOTE_RECYCLEBIN_PAGE_RESTORE') || '',
			cancelLabel: main_core.Loc.getMessage('NOTE_RECYCLEBIN_PAGE_CONFIRM_CANCEL') || ''
		});
	}
	function buildBodyText(documentTitle) {
		return (main_core.Loc.getMessage('NOTE_RECYCLEBIN_ORPHAN_POPUP_TEXT') || '').replace('#DOCUMENT#', documentTitle);
	}

	const PAGE_SIZE = 50;
	const NoteRecycleBinPageComponent = {
		name: 'NoteRecycleBinPage',
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
				emptyingTrash: false,
				hasMore: false,
				hasError: false,
				isAdmin: false,
				nextCursor: null,
				requestId: 0,
				selection: note_ui_documentList.createSelection(),
				// "Select all" latch: routes bulk restore/hard-delete to the over-section endpoints
				// (restoreAll/empty). Any manual toggle drops it.
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
					excerpt: item.excerpt || '',
					author: item.author || null,
					documentId: item.documentId,
					recycleBinId: item.id,
					canRestore: Boolean(item.canRestore),
					canHardDelete: Boolean(item.canHardDelete),
					orphan: Boolean(item.orphan),
					collectionId: item.collectionId || 0,
					collectionTitle: item.collectionTitle || '',
					trashedBy: item.trashedBy || null,
					trashedAt: item.trashedAt || null
				}));
			},
			titleText() {
				return main_core.Loc.getMessage('NOTE_RECYCLEBIN_PAGE_TITLE') || '';
			},
			breadcrumbRoot() {
				return main_core.Loc.getMessage('NOTE_RECYCLEBIN_BREADCRUMB_ROOT') || '';
			},
			subtitleText() {
				return main_core.Loc.getMessage('NOTE_RECYCLEBIN_PAGE_SUBTITLE') || '';
			},
			emptyHint() {
				return main_core.Loc.getMessage('NOTE_RECYCLEBIN_PAGE_EMPTY_HINT') || '';
			},
			moreMenuLabel() {
				return main_core.Loc.getMessage('NOTE_RECYCLEBIN_PAGE_MORE_LABEL') || '';
			},
			hasItems() {
				return this.items.length > 0;
			},
			headerMenuItems() {
				const items = [];
				items.push({
					text: main_core.Loc.getMessage('NOTE_RECYCLEBIN_PAGE_RESTORE_ALL') || '',
					iconModifier: 'o-undo',
					testId: 'note-trash-menu-restore-all',
					disabled: this.restoringAll || this.loading,
					onClick: () => {
						void this.onRestoreAll();
					}
				});
				items.push({
					text: main_core.Loc.getMessage('NOTE_RECYCLEBIN_PAGE_EMPTY_ACTION') || '',
					iconModifier: 'o-trashcan',
					testId: 'note-trash-menu-delete-all',
					danger: true,
					disabled: this.emptyingTrash || this.loading,
					onClick: () => {
						void this.onEmptyTrash();
					}
				});
				return items;
			}
		},
		created() {
			this.service = new RecycleBinService();
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
					name: 'recyclebin'
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
					this.isAdmin = response.isAdmin;

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
				// Ids here are recycle-bin record ids (DocumentList item.id === recycleBinId on this page).
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
				} else if (type === 'hardDelete') {
					void this.runHardDelete();
				}
			},
			async runRestore() {
				// "Select all" reuses the over-section restore (orphan-aware, covers unloaded records).
				if (this.allSelected) {
					await this.onRestoreAll();
					this.resetSelection();
					return;
				}
				const ids = [...this.selection.ids];
				if (ids.length === 0) {
					return;
				}
				await this.restoreSelection(ids);
			},
			// Which of the selected records are orphans (original collection gone) — read from the loaded
			// items, each of which carries an `orphan` flag. Lets us ask for a target BEFORE restoring.
			selectionOrphanIds(recycleBinIds) {
				const orphanById = new Map(this.items.map(item => [Number(item.id), item.orphan === true]));
				return recycleBinIds.map(id => Number(id)).filter(id => orphanById.get(id) === true);
			},
			async restoreSelection(recycleBinIds) {
				const orphanIds = this.selectionOrphanIds(recycleBinIds);
				const orphanIdSet = new Set(orphanIds);

				// Orphans need a target collection. Ask for it BEFORE restoring anything, so pressing
				// Cancel truly cancels — nothing is restored (previously non-orphans were committed first,
				// then the popup shown, leaving a partial restore on cancel).
				let target = null;
				if (orphanIds.length > 0) {
					target = await openOrphanRestorePopup({
						bodyText: main_core.Loc.getMessage('NOTE_RECYCLEBIN_BULK_ORPHAN_TARGET_TEXT') || ''
					});
					if (!target) {
						return;
					}
				}
				this.bulkBusy = true;
				let totalProcessed = 0;
				let lastOutcome = null;
				try {
					// Two phases, because targetCollectionId in the restore service applies to every record
					// it is given: non-orphans restore to their original collection (target null), orphans
					// go to the chosen target. Both run only after the popup was confirmed.
					const nonOrphanIds = recycleBinIds.map(id => Number(id)).filter(id => !orphanIdSet.has(id));
					if (nonOrphanIds.length > 0) {
						lastOutcome = await this.service.restoreMany(nonOrphanIds, null);
						totalProcessed += Number(lastOutcome?.processedCount) || 0;
					}
					if (orphanIds.length > 0) {
						lastOutcome = await this.service.restoreMany(orphanIds, target.collectionId);
						totalProcessed += Number(lastOutcome?.processedCount) || 0;
					}
					this.reportRestoreOutcome({
						...(lastOutcome || {}),
						processedCount: totalProcessed
					}, false);
					if (totalProcessed > 0) {
						this.emitBulkRestored();
					}
					this.resetSelection();
				} catch (error) {
					this.showBulkError(error);
				} finally {
					this.bulkBusy = false;
					await this.loadPage(false);
				}
			},
			async runHardDelete() {
				if (this.allSelected) {
					await this.onEmptyTrash();
					this.resetSelection();
					return;
				}
				const ids = [...this.selection.ids];
				if (ids.length === 0) {
					return;
				}

				// AC-032: reinforced confirm — hard delete is permanent and cannot be undone.
				const confirmed = await this.confirm({
					title: main_core.Loc.getMessage('NOTE_RECYCLEBIN_BULK_HARD_DELETE_TITLE') || '',
					message: main_core.Loc.getMessage('NOTE_RECYCLEBIN_BULK_HARD_DELETE_MESSAGE') || '',
					okText: main_core.Loc.getMessage('NOTE_RECYCLEBIN_BULK_HARD_DELETE_ACTION') || '',
					danger: true
				});
				if (!confirmed) {
					return;
				}
				this.bulkBusy = true;
				try {
					const outcome = await this.service.hardDeleteMany(ids);
					this.reportRestoreOutcome(outcome, false, 'delete');
					this.resetSelection();
				} catch (error) {
					this.showBulkError(error);
				} finally {
					this.bulkBusy = false;
					await this.loadPage(false);
				}
			},
			emitBulkRestored() {
				main_core_events.EventEmitter.emit(note_sidebar.NoteEvent.DOCUMENTS_BULK_RESTORED, new main_core_events.BaseEvent({
					data: {
						restoredCollections: []
					}
				}));
			},
			reportRestoreOutcome(outcome, orphanPending, action = 'restore') {
				if (outcome?.limitExceeded) {
					this.showErrorToast(main_core.Loc.getMessage('NOTE_DOCUMENT_LIST_BULK_LIMIT') || '');
					return;
				}
				const processed = Number(outcome?.processedCount) || 0;
				const skipped = Number(outcome?.skippedCount) || 0;
				const noAccess = Number(outcome?.skippedByAccessCount) || 0;
				const orphan = Number(outcome?.skippedOrphanCount) || 0;
				if (processed === 0) {
					// A pending-orphan restore isn't a failure: nothing landed yet because the user
					// still has to pick a target — keep the explanatory line instead of "no access".
					if (orphanPending && orphan > 0) {
						this.showSuccessToast(main_core.Loc.getMessage('NOTE_RECYCLEBIN_BULK_ORPHAN_PENDING') || '');
					} else if (skipped > 0 && noAccess === skipped) {
						this.showErrorToast(main_core.Loc.getMessage('NOTE_DOCUMENT_LIST_BULK_NO_ACCESS_ALL') || '');
					} else {
						this.showSuccessToast(main_core.Loc.getMessage('NOTE_DOCUMENT_LIST_BULK_NOTHING') || '');
					}
					return;
				}

				// Full success: one whole line.
				if (skipped === 0) {
					const doneKey = action === 'delete' ? 'NOTE_RECYCLEBIN_BULK_DONE_DELETE' : 'NOTE_DOCUMENT_LIST_BULK_DONE_RESTORE';
					this.showSuccessToast(main_core.Loc.getMessagePlural(doneKey, processed, {
						'#COUNT#': processed
					}));
				} else {
					// Partial success: a single whole phrase pluralised on the processed count.
					const partialKey = action === 'delete' ? 'NOTE_RECYCLEBIN_BULK_PARTIAL_DELETE' : 'NOTE_DOCUMENT_LIST_BULK_PARTIAL_RESTORE';
					this.showSuccessToast(main_core.Loc.getMessagePlural(partialKey, processed, {
						'#DONE#': processed,
						'#SKIPPED#': skipped
					}));
				}

				// Orphan tail is a self-contained sentence shown as its own toast, never glued onto
				// the result line. Currently unreachable — all callers pass orphanPending=false.
				if (orphanPending && orphan > 0) {
					this.showSuccessToast(main_core.Loc.getMessage('NOTE_RECYCLEBIN_BULK_ORPHAN_PENDING') || '');
				}
			},
			showBulkError(error) {
				const code = String(error?.code || '');
				if (code === 'NOTE_BULK_LIMIT_EXCEEDED') {
					this.showErrorToast(main_core.Loc.getMessage('NOTE_DOCUMENT_LIST_BULK_LIMIT') || '');
					return;
				}
				this.showErrorToast(error?.message || main_core.Loc.getMessage('NOTE_RECYCLEBIN_PAGE_ERROR_GENERIC') || '');
			},
			async onRestoreAll() {
				if (this.restoringAll) {
					return;
				}
				let stats;
				try {
					stats = await this.service.getStats();
				} catch (error) {
					this.showErrorToast(error?.message || '');
					return;
				}
				if (stats.total <= 0) {
					return;
				}
				let orphanTargetCollectionId = null;
				if (stats.orphanCount > 0) {
					const popupResult = await openBulkRestorePopup({
						total: stats.total,
						orphanCount: stats.orphanCount
					});
					if (!popupResult.confirmed) {
						return;
					}
					orphanTargetCollectionId = popupResult.orphanTargetCollectionId;
				} else {
					const confirmed = await this.confirm({
						title: main_core.Loc.getMessage('NOTE_RECYCLEBIN_PAGE_RESTORE_ALL') || '',
						message: main_core.Loc.getMessage('NOTE_RECYCLEBIN_PAGE_CONFIRM_RESTORE_ALL') || '',
						okText: main_core.Loc.getMessage('NOTE_RECYCLEBIN_PAGE_RESTORE_ALL') || ''
					});
					if (!confirmed) {
						return;
					}
				}
				this.restoringAll = true;
				try {
					const {
						restoredCount,
						skippedOrphan
					} = await this.service.restoreAll({
						orphanTargetCollectionId
					});
					if (restoredCount > 0) {
						main_core_events.EventEmitter.emit(note_sidebar.NoteEvent.DOCUMENTS_BULK_RESTORED, new main_core_events.BaseEvent({
							data: {
								restoredCollections: []
							}
						}));
					}
					await this.loadPage(false);
					const messageCode = skippedOrphan > 0 ? 'NOTE_RECYCLEBIN_PAGE_RESTORE_ALL_SUCCESS_WITH_SKIPPED' : 'NOTE_RECYCLEBIN_PAGE_RESTORE_ALL_SUCCESS';
					const message = (main_core.Loc.getMessage(messageCode) || '').replace('#COUNT#', String(restoredCount)).replace('#SKIPPED#', String(skippedOrphan));
					this.showSuccessToast(message);
				} catch (error) {
					this.showErrorToast(error?.message || '');
				} finally {
					this.restoringAll = false;
				}
			},
			async onEmptyTrash() {
				if (this.emptyingTrash) {
					return;
				}
				const confirmed = await this.confirm({
					title: main_core.Loc.getMessage('NOTE_RECYCLEBIN_PAGE_EMPTY_ACTION_TITLE') || '',
					message: main_core.Loc.getMessage('NOTE_RECYCLEBIN_PAGE_CONFIRM_EMPTY') || '',
					okText: main_core.Loc.getMessage('NOTE_RECYCLEBIN_PAGE_EMPTY_ACTION_CONFIRM') || '',
					danger: true
				});
				if (!confirmed) {
					return;
				}
				this.emptyingTrash = true;
				try {
					const {
						deletedCount
					} = await this.service.empty();
					await this.loadPage(false);
					const message = (main_core.Loc.getMessage('NOTE_RECYCLEBIN_PAGE_EMPTY_SUCCESS') || '').replace('#COUNT#', String(deletedCount));
					this.showSuccessToast(message);
				} catch (error) {
					this.showErrorToast(error?.message || '');
				} finally {
					this.emptyingTrash = false;
				}
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
					key: 'recyclebin-header',
					popupClass: 'note-action-menu'
				});
			},
			confirm({
				title,
				message,
				okText,
				danger = false
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
					<div class="note-recyclebin-confirm-content">
						${String(message || '')}
					</div>
				`;
					// Destructive actions mirror the single-delete dialog: no red button, inverted
					// order (prominent Cancel on the left, understated action on the right).
					const okButton = new ui_buttons.Button({
						text: String(okText || ''),
						dataset: {
							testid: 'note-dialog-confirm'
						},
						size: ui_buttons.ButtonSize.LARGE,
						style: danger ? ui_buttons.AirButtonStyle.PLAIN : ui_buttons.AirButtonStyle.FILLED,
						useAirDesign: true,
						onclick: () => {
							finish(true);
							dialog.hide();
						}
					});
					const cancelButton = new ui_buttons.Button({
						text: main_core.Loc.getMessage('NOTE_RECYCLEBIN_PAGE_CONFIRM_CANCEL') || '',
						dataset: {
							testid: 'note-dialog-cancel'
						},
						size: ui_buttons.ButtonSize.LARGE,
						style: danger ? ui_buttons.AirButtonStyle.FILLED : ui_buttons.AirButtonStyle.PLAIN,
						useAirDesign: true,
						onclick: () => {
							finish(false);
							dialog.hide();
						}
					});
					const dialog = new ui_system_dialog.Dialog({
						title: String(title || ''),
						content,
						hasOverlay: true,
						overlay: true,
						width: 420,
						centerButtons: danger ? [cancelButton, okButton] : [okButton, cancelButton],
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
				const message = main_core.Type.isStringFilled(text) ? text : main_core.Loc.getMessage('NOTE_RECYCLEBIN_PAGE_ERROR_GENERIC') || '';
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
		<div class="note-recyclebin-page">
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
								data-testid="note-trash-more"
								@click="openMoreMenu"
							>
								<div class="ui-icon-set --more-l"></div>
							</button>
						</div>
					</div>
				</div>
			</teleport>
			<div class="note-recyclebin-page__body">
				<div class="note-recyclebin-page-heading">
					<h2 class="note-recyclebin-page-title">{{ titleText }}</h2>
					<p v-if="subtitleText" class="note-recyclebin-page-subtitle">{{ subtitleText }}</p>
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
					class="note-recyclebin-page-empty-hint"
				>
					{{ emptyHint }}
				</div>
			</div>

			<teleport to="body">
				<BulkActionsBar
					section="recycle"
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

	exports.NoteRecycleBinPageComponent = NoteRecycleBinPageComponent;
	exports.ORPHAN_TARGET_REQUIRED_CODE = ORPHAN_TARGET_REQUIRED_CODE;
	exports.RecycleBinService = RecycleBinService;
	exports.RecycleBinServiceError = RecycleBinServiceError;
	exports.openBulkRestorePopup = openBulkRestorePopup;
	exports.openOrphanRestorePopup = openOrphanRestorePopup;

})(this.BX.Note = this.BX.Note || {}, BX, BX.Event, BX.Vue3, BX.UI, BX.UI.System, BX.UI.Notification, BX.UI.IconSet, BX.Note.Ui, BX.Note.Ui, BX.Note.Ui, BX.Note.Sidebar, BX.Note.Ui);
//# sourceMappingURL=recyclebin.bundle.js.map
