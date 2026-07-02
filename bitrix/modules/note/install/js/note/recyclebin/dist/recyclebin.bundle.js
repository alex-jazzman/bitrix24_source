/* eslint-disable */
this.BX = this.BX || {};
(function (exports, main_core, main_core_events, ui_vue3, ui_buttons, ui_system_dialog, ui_notification, note_ui_themeContext, note_ui_documentList, note_ui_actionMenu, note_sidebar, ui_entitySelector) {
	'use strict';

	const ACTION_LIST = 'note.infrastructure.RecycleBinController.list';
	const ACTION_STATS = 'note.infrastructure.RecycleBinController.getStats';
	const ACTION_RESTORE = 'note.infrastructure.RecycleBinController.restoreDocument';
	const ACTION_RESTORE_ALL = 'note.infrastructure.RecycleBinController.restoreAll';
	const ACTION_HARD_DELETE = 'note.infrastructure.RecycleBinController.hardDeleteDocument';
	const ACTION_EMPTY = 'note.infrastructure.RecycleBinController.empty';
	const ORPHAN_TARGET_REQUIRED_CODE = 'NOTE_RECYCLE_BIN_ORPHAN_TARGET_REQUIRED';
	class RecycleBinServiceError extends Error {
		constructor(message, code = '') {
			super(message);
			this.code = code;
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

	const ENTITY_ID$1 = 'note-collection';
	function openBulkRestorePopup(options) {
		const total = Math.max(0, Number(options?.total) || 0);
		const orphanCount = Math.max(0, Number(options?.orphanCount) || 0);
		const hasOrphans = orphanCount > 0;
		return new Promise(resolve => {
			let isResolved = false;
			let restoreButton = null;
			let selector = null;
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
			const selectorContainer = hasOrphans ? main_core.Tag.render`<div class="note-recyclebin-bulk-popup-selector"></div>` : null;
			const content = main_core.Tag.render`
			<div class="note-recyclebin-bulk-popup-content">
				${headlineNode}
				${orphanHintNode}
				${selectorContainer}
			</div>
		`;
			const getSelectedCollectionId = () => {
				if (!selector || !main_core.Type.isFunction(selector.getTags)) {
					return 0;
				}
				const tags = selector.getTags();
				if (!Array.isArray(tags) || tags.length !== 1) {
					return 0;
				}
				const tag = tags[0];
				const id = Number(tag?.id ?? tag?.entityId ?? 0);
				return Number.isInteger(id) && id > 0 ? id : 0;
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
			restoreButton = new ui_buttons.Button({
				text: main_core.Loc.getMessage('NOTE_RECYCLEBIN_PAGE_RESTORE_ALL') || '',
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
						if (!hasOrphans || !selectorContainer) {
							return;
						}
						const isMobile = document.documentElement.classList.contains('note-mobile');
						selector = new ui_entitySelector.TagSelector({
							multiple: false,
							tagLimit: 1,
							placeholder: main_core.Loc.getMessage('NOTE_RECYCLEBIN_ORPHAN_POPUP_PLACEHOLDER') || '',
							dialogOptions: {
								height: isMobile ? 240 : 340,
								entities: [{
									id: ENTITY_ID$1,
									dynamicLoad: true,
									dynamicSearch: true,
									options: {}
								}]
							},
							events: {
								onAfterTagAdd: () => updateRestoreState(),
								onAfterTagRemove: () => updateRestoreState(),
								onAfterTagsClear: () => updateRestoreState()
							}
						});
						selector.renderTo(selectorContainer);
						const outer = selector.getOuterContainer?.();
						if (outer) {
							main_core.Dom.removeClass(outer, '--ui-context-content-light');
							main_core.Dom.removeClass(outer, '--ui-context-content-dark');
							main_core.Dom.addClass(outer, note_ui_themeContext.NoteThemeContext.getDesignSystemContext());
						}
						updateRestoreState();
					},
					onHide: () => {
						finish({
							confirmed: false,
							orphanTargetCollectionId: null
						});
					},
					onDestroy: () => {
						if (selector && main_core.Type.isFunction(selector.destroy)) {
							selector.destroy();
						}
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

	const PAGE_SIZE = 50;
	const NoteRecycleBinPageComponent = {
		name: 'NoteRecycleBinPage',
		components: {
			DocumentList: note_ui_documentList.DocumentList
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
				requestId: 0
			};
		},
		computed: {
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
					disabled: this.restoringAll || this.loading,
					onClick: () => {
						void this.onRestoreAll();
					}
				});
				items.push({
					text: main_core.Loc.getMessage('NOTE_RECYCLEBIN_PAGE_EMPTY_ACTION') || '',
					iconModifier: 'o-trashcan',
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
					const dialog = new ui_system_dialog.Dialog({
						title: String(title || ''),
						content,
						hasOverlay: true,
						overlay: true,
						width: 420,
						centerButtons: [new ui_buttons.Button({
							text: main_core.Loc.getMessage('NOTE_RECYCLEBIN_PAGE_CONFIRM_CANCEL') || '',
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
							color: danger ? ui_buttons.Button.Color.DANGER : null,
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
				<div class="note-page-breadcrumb">
					<button
						type="button"
						class="note-page-breadcrumb-link"
						@click="goRoot"
					>{{ breadcrumbRoot }}</button>
				</div>
			</teleport>
			<div class="note-recyclebin-page__actions">
				<button
					v-if="hasItems"
					type="button"
					class="note-recyclebin-page__action-icon"
					:title="moreMenuLabel"
					:aria-label="moreMenuLabel"
					@click="openMoreMenu"
				>
					<div class="ui-icon-set --more-l"></div>
				</button>
			</div>
			<div class="note-recyclebin-page__body">
				<div class="note-recyclebin-page-heading">
					<h2 class="note-recyclebin-page-title">{{ titleText }}</h2>
					<p v-if="subtitleText" class="note-recyclebin-page-subtitle">{{ subtitleText }}</p>
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
					class="note-recyclebin-page-empty-hint"
				>
					{{ emptyHint }}
				</div>
			</div>
		</div>
	`
	};

	const ENTITY_ID = 'note-collection';
	function openOrphanRestorePopup(options = {}) {
		const documentTitle = String(options?.documentTitle || '');
		return new Promise(resolve => {
			let isResolved = false;
			let restoreButton = null;
			let selector = null;
			const finish = value => {
				if (isResolved) {
					return;
				}
				isResolved = true;
				resolve(value);
			};
			const textNode = main_core.Tag.render`
			<div class="note-recyclebin-orphan-popup-text"></div>
		`;
			textNode.textContent = buildBodyText(documentTitle);
			const selectorContainer = main_core.Tag.render`
			<div class="note-recyclebin-orphan-popup-selector"></div>
		`;
			const content = main_core.Tag.render`
			<div class="note-recyclebin-orphan-popup-content">
				${textNode}
				${selectorContainer}
			</div>
		`;
			const updateRestoreState = () => {
				if (!restoreButton || !selector) {
					return;
				}
				const tags = main_core.Type.isFunction(selector.getTags) ? selector.getTags() : [];
				restoreButton.setDisabled(!Array.isArray(tags) || tags.length !== 1);
			};
			const getSelectedTag = () => {
				if (!selector || !main_core.Type.isFunction(selector.getTags)) {
					return null;
				}
				const tags = selector.getTags();
				if (!Array.isArray(tags) || tags.length !== 1) {
					return null;
				}
				const tag = tags[0];
				const id = Number(tag?.id ?? tag?.entityId ?? 0);
				if (!Number.isInteger(id) || id <= 0) {
					return null;
				}
				return {
					collectionId: id,
					collectionTitle: String(tag?.title || tag?.searchable || '')
				};
			};
			restoreButton = new ui_buttons.Button({
				text: main_core.Loc.getMessage('NOTE_RECYCLEBIN_PAGE_RESTORE') || '',
				size: ui_buttons.ButtonSize.LARGE,
				style: ui_buttons.AirButtonStyle.FILLED,
				useAirDesign: true,
				disabled: true,
				onclick: () => {
					const selected = getSelectedTag();
					if (!selected) {
						return;
					}
					finish(selected);
					dialog.hide();
				}
			});
			const cancelButton = new ui_buttons.Button({
				text: main_core.Loc.getMessage('NOTE_RECYCLEBIN_PAGE_CONFIRM_CANCEL') || '',
				size: ui_buttons.ButtonSize.LARGE,
				style: ui_buttons.AirButtonStyle.PLAIN,
				useAirDesign: true,
				onclick: () => {
					finish(null);
					dialog.hide();
				}
			});
			const dialog = new ui_system_dialog.Dialog({
				title: main_core.Loc.getMessage('NOTE_RECYCLEBIN_ORPHAN_POPUP_TITLE') || '',
				content,
				hasOverlay: true,
				overlay: true,
				width: 480,
				centerButtons: [restoreButton, cancelButton],
				events: {
					onAfterShow: () => {
						const isMobile = document.documentElement.classList.contains('note-mobile');
						selector = new ui_entitySelector.TagSelector({
							multiple: false,
							tagLimit: 1,
							placeholder: main_core.Loc.getMessage('NOTE_RECYCLEBIN_ORPHAN_POPUP_PLACEHOLDER') || '',
							dialogOptions: {
								height: isMobile ? 280 : 340,
								showAvatars: false,
								popupOptions: {
									className: note_ui_themeContext.NoteThemeContext.getDesignSystemContext()
								},
								entities: [{
									id: ENTITY_ID,
									dynamicLoad: true,
									dynamicSearch: true,
									options: {}
								}]
							},
							events: {
								onAfterTagAdd: () => updateRestoreState(),
								onAfterTagRemove: () => updateRestoreState(),
								onAfterTagsClear: () => updateRestoreState()
							}
						});
						note_ui_themeContext.NoteThemeContext.applyToTagSelector(selector);
						selector.renderTo(selectorContainer);
						const entityDialog = typeof selector.getDialog === 'function' ? selector.getDialog() : null;
						if (entityDialog) {
							note_ui_themeContext.NoteThemeContext.themeEntitySelector(entityDialog);
						}
						updateRestoreState();
					},
					onHide: () => {
						const entityDialog = selector && main_core.Type.isFunction(selector.getDialog) ? selector.getDialog() : null;
						if (entityDialog && main_core.Type.isFunction(entityDialog.hide)) {
							entityDialog.hide();
						}
						finish(null);
					},
					onDestroy: () => {
						if (selector && main_core.Type.isFunction(selector.destroy)) {
							selector.destroy();
						}
					}
				}
			});
			note_ui_themeContext.NoteThemeContext.themeDialog(dialog, content);
			dialog.show();
		});
	}
	function buildBodyText(documentTitle) {
		return (main_core.Loc.getMessage('NOTE_RECYCLEBIN_ORPHAN_POPUP_TEXT') || '').replace('#DOCUMENT#', documentTitle);
	}

	exports.NoteRecycleBinPageComponent = NoteRecycleBinPageComponent;
	exports.ORPHAN_TARGET_REQUIRED_CODE = ORPHAN_TARGET_REQUIRED_CODE;
	exports.RecycleBinService = RecycleBinService;
	exports.RecycleBinServiceError = RecycleBinServiceError;
	exports.openBulkRestorePopup = openBulkRestorePopup;
	exports.openOrphanRestorePopup = openOrphanRestorePopup;

})(this.BX.Note = this.BX.Note || {}, BX, BX.Event, BX.Vue3, BX.UI, BX.UI.System, BX.UI.Notification, BX.Note.Ui, BX.Note.Ui, BX.Note.Ui, BX.Note.Sidebar, BX.UI.EntitySelector);
//# sourceMappingURL=recyclebin.bundle.js.map
