/* eslint-disable */
this.BX = this.BX || {};
this.BX.Sign = this.BX.Sign || {};
this.BX.Sign.V2 = this.BX.Sign.V2 || {};
this.BX.Sign.V2.Grid = this.BX.Sign.V2.Grid || {};
(function (exports, main_core, main_core_events, ui_buttons, ui_dialogs_messagebox, sign_v2_api, sign_v2_grid_components_actionPanel, sign_v2_grid_components_folder, sign_v2_grid_components_users) {
	'use strict';

	// Action-panel button id for the mass "move to folder" action.
	// The `sign.document.list` grid template (phase P3) must render the button with
	// this id so that selection-driven enabling works.
	const MOVE_BUTTON_ID = 'sign-safe-move-to-folder-button';
	const EXPORT_BUTTON_ID = 'sign-safe-export-to-excel-button';
	const EXPORT_BUTTON_TEST_ID = 'sign-safe-action-panel-export-to-excel';

	// Excel export request params (Bitrix\Main\Grid\Export\ExcelExporter contract):
	// `mode=excel` switches the component to the export template, `ncc=1` disables the
	// composite cache for the download hit. When rows are selected, the chosen document
	// member ids are posted under `selectedIds[]` and the chosen folder ids under
	// `selectedFolderIds[]`; the backend reads both from GET or POST and exports the
	// selected documents plus the content of the selected folders.
	const EXPORT_MODE_PARAM = 'mode';
	const EXPORT_MODE_VALUE = 'excel';
	const EXPORT_NO_COMPOSITE_PARAM = 'ncc';
	const EXPORT_SELECTED_IDS_FIELD = 'selectedIds[]';
	const EXPORT_SELECTED_FOLDER_IDS_FIELD = 'selectedFolderIds[]';
	const GRID_SELECTION_EVENTS = ['Grid::thereSelectedRows', 'Grid::allRowsSelected', 'Grid::allRowsUnselected', 'Grid::noSelectedRows', 'Grid::selectRow', 'Grid::unselectRow'];
	class Safe {
		#gridId;
		#api = new sign_v2_api.Api();
		#actionPanel = new sign_v2_grid_components_actionPanel.ActionPanel();
		#selectedFolderId = null;
		#subscribedOnGridEvents = false;
		#onGridUpdated = event => {
			if (!this.#isOwnGridEvent(event)) {
				return;
			}
			const grid = this.#getGrid();
			if (main_core.Type.isObject(grid)) {
				this.#initFolderUserStacks(grid.getContainer());
			}
			this.#onGridSelectionMutate();
		};
		#onGridSelectionChanged = event => {
			if (this.#isOwnGridEvent(event)) {
				this.#onGridSelectionMutate();
			}
		};
		#onWindowUnload = () => this.destroy();
		constructor(gridId) {
			this.#gridId = gridId;
		}
		createFolder() {
			const popup = new sign_v2_grid_components_folder.CreateFolderPopup();
			popup.subscribe('submit', async event => {
				const {
					title
				} = event.getData();
				try {
					await this.#api.safeFolder.create(title);
					this.#notify(main_core.Loc.getMessage('SIGN_V2_GRID_SAFE_CREATE_FOLDER_SUCCESS'));
				} catch {
					// The api transport already surfaces the server error as a toast;
					// swallow here to avoid a second, duplicate notification.
				}
				await this.reload();
			});
			popup.show();
		}
		renameFolder(folderId, oldTitle) {
			const popup = new sign_v2_grid_components_folder.CreateFolderPopup({
				initialTitle: oldTitle
			});
			popup.subscribe('submit', async event => {
				const {
					title
				} = event.getData();
				try {
					await this.#api.safeFolder.rename(folderId, title);
					this.#notify(main_core.Loc.getMessage('SIGN_V2_GRID_SAFE_RENAME_FOLDER_SUCCESS'));
				} catch {
					// The api transport already surfaces the server error as a toast;
					// swallow here to avoid a second, duplicate notification.
				}
				await this.reload();
			});
			popup.show();
		}

		// Deletes a single folder (SC-006). An empty folder is removed right after the
		// confirmation. A folder that still holds documents needs an explicit relocation
		// target: the user is asked where to move the documents (another folder or the
		// root "no folder") before the folder is deleted.
		delete(folderId, folderTitle = '') {
			const popup = new sign_v2_grid_components_folder.DeleteConfirmationPopup({
				title: main_core.Loc.getMessage('SIGN_V2_GRID_SAFE_DELETE_FOLDER_CONFIRM_TITLE'),
				message: main_core.Loc.getMessage('SIGN_V2_GRID_SAFE_DELETE_FOLDER_CONFIRM'),
				confirmButtonText: main_core.Loc.getMessage('SIGN_V2_GRID_SAFE_DELETE_FOLDER_OK'),
				cancelButtonText: main_core.Loc.getMessage('SIGN_V2_GRID_SAFE_DELETE_FOLDER_CANCEL'),
				onConfirm: async () => {
					// Optimistically delete assuming the folder is empty (no relocation
					// target sent). The backend removes an empty folder outright and
					// answers NON_EMPTY_FOLDER_REQUIRES_TARGET otherwise.
					const {
						success,
						needsTarget
					} = await this.#requestDeleteFolder(folderId, null, false);
					if (success) {
						this.#notifyFolderDeleted(folderTitle);
						await this.reload();
						return;
					}
					if (!needsTarget) {
						this.#notify(main_core.Loc.getMessage('SIGN_V2_GRID_SAFE_DELETE_FOLDER_FAIL'));
						return;
					}

					// Non-empty folder: ask where to relocate its documents before deleting.
					await this.#promptTargetAndDeleteFolder(folderId, folderTitle);
				}
			});
			popup.show();
		}

		// Asks for the relocation target (excluding the folder being deleted), then
		// deletes the folder moving its documents to the chosen target.
		async #promptTargetAndDeleteFolder(folderId, folderTitle = '') {
			this.#selectedFolderId = 0;
			const folderSelectionPopup = new sign_v2_grid_components_folder.FolderSelectionPopup({
				loadFolders: async (limit, offset) => {
					const page = await this.#api.safeFolder.getListByDepthLevel(0, limit, offset);
					return {
						...page,
						folders: page.folders.filter(folder => Number(folder.id) !== folderId)
					};
				},
				rootItemTitle: main_core.Loc.getMessage('SIGN_V2_GRID_SAFE_MOVE_ROOT_ITEM')
			});
			folderSelectionPopup.subscribe('folderSelected', event => {
				this.#selectedFolderId = event.getData().folderId;
			});
			const folderList = await folderSelectionPopup.show();
			ui_dialogs_messagebox.MessageBox.show({
				title: main_core.Loc.getMessage('SIGN_V2_GRID_SAFE_DELETE_FOLDER_MOVE_POPUP_TITLE'),
				message: folderList,
				modal: true,
				minWidth: 500,
				minHeight: 370,
				buttons: [new BX.UI.Button({
					useAirDesign: true,
					style: ui_buttons.AirButtonStyle.FILLED_SUCCESS,
					size: ui_buttons.ButtonSize.LARGE,
					text: main_core.Loc.getMessage('SIGN_V2_GRID_SAFE_DELETE_FOLDER_MOVE_POPUP_OK'),
					onclick: async button => {
						button.setWaiting(true);
						const {
							success
						} = await this.#requestDeleteFolder(folderId, this.#toTargetFolderId(this.#selectedFolderId), true);
						if (success) {
							this.#notifyFolderDeleted(folderTitle);
						} else {
							this.#notify(main_core.Loc.getMessage('SIGN_V2_GRID_SAFE_DELETE_FOLDER_FAIL'));
						}
						button.getContext().close();
						await this.reload();
					}
				}), new BX.UI.Button({
					useAirDesign: true,
					style: ui_buttons.AirButtonStyle.PLAIN,
					size: ui_buttons.ButtonSize.LARGE,
					text: main_core.Loc.getMessage('SIGN_V2_GRID_SAFE_DELETE_FOLDER_MOVE_POPUP_CANCEL'),
					onclick: button => button.getContext().close()
				})]
			});
		}

		// Low-level folder delete transport. Called directly (not through the Api
		// facade) so that the expected NON_EMPTY_FOLDER_REQUIRES_TARGET answer is used
		// as control flow instead of surfacing a user-facing error notification.
		// When `hasTarget` is false the `targetFolderId` key is omitted, so the backend
		// treats the request as "no relocation target provided".
		async #requestDeleteFolder(folderId, targetFolderId, hasTarget) {
			const data = {
				folderId
			};
			if (hasTarget) {
				data.targetFolderId = targetFolderId;
			}
			try {
				await main_core.ajax.runAction('sign.api_v1.b2e.document.safeFolder.delete', {
					method: 'POST',
					data,
					preparePost: false,
					headers: [{
						name: 'Content-Type',
						value: 'application/json'
					}]
				});
				return {
					success: true,
					needsTarget: false
				};
			} catch (response) {
				const needsTarget = (response?.errors ?? []).some(error => error.code === 'NON_EMPTY_FOLDER_REQUIRES_TARGET');
				return {
					success: false,
					needsTarget
				};
			}
		}

		// Moves documents to a folder. With `documentId` — a single document; otherwise
		// the documents selected in the grid (which may come from different source folders).
		async moveToFolder(documentId = null) {
			const documentIds = documentId === null ? this.#getSelectedIds() : [documentId];
			if (documentIds.length === 0) {
				return;
			}
			this.#selectedFolderId = 0;
			const folderSelectionPopup = new sign_v2_grid_components_folder.FolderSelectionPopup({
				loadFolders: (limit, offset) => this.#api.safeFolder.getListByDepthLevel(0, limit, offset),
				rootItemTitle: main_core.Loc.getMessage('SIGN_V2_GRID_SAFE_MOVE_ROOT_ITEM')
			});
			folderSelectionPopup.subscribe('folderSelected', event => {
				this.#selectedFolderId = event.getData().folderId;
			});
			const folderList = await folderSelectionPopup.show();
			ui_dialogs_messagebox.MessageBox.show({
				title: main_core.Loc.getMessage('SIGN_V2_GRID_SAFE_MOVE_POPUP_TITLE'),
				message: folderList,
				modal: true,
				minWidth: 500,
				minHeight: 370,
				buttons: [new BX.UI.Button({
					useAirDesign: true,
					style: ui_buttons.AirButtonStyle.FILLED_SUCCESS,
					size: ui_buttons.ButtonSize.LARGE,
					text: main_core.Loc.getMessage('SIGN_V2_GRID_SAFE_MOVE_POPUP_OK'),
					dataset: {
						testid: 'sign-safe-folder-move-confirm-button'
					},
					onclick: async button => {
						button.setWaiting(true);
						await this.#moveDocuments(documentIds, this.#toTargetFolderId(this.#selectedFolderId));
						button.getContext().close();
						await this.reload();
					}
				}), new BX.UI.Button({
					useAirDesign: true,
					style: ui_buttons.AirButtonStyle.PLAIN,
					size: ui_buttons.ButtonSize.LARGE,
					text: main_core.Loc.getMessage('SIGN_V2_GRID_SAFE_MOVE_POPUP_CANCEL'),
					onclick: button => button.getContext().close()
				})]
			});
		}
		async #moveDocuments(documentIds, targetFolderId) {
			try {
				const {
					moved = [],
					errors = []
				} = await this.#api.safeFolder.moveDocuments(documentIds, targetFolderId);
				this.#notifyMoveResult(moved, errors);
			} catch {
				// The api transport already surfaces the server error as a toast;
				// swallow here to avoid a second, duplicate notification.
			}
		}
		#notifyMoveResult(moved, errors) {
			if (errors.length === 0) {
				this.#notify(main_core.Loc.getMessage('SIGN_V2_GRID_SAFE_MOVE_SUCCESS'));
				return;
			}
			if (moved.length === 0) {
				this.#notify(main_core.Loc.getMessage('SIGN_V2_GRID_SAFE_MOVE_FAIL'));
				return;
			}
			this.#notify(main_core.Loc.getMessage('SIGN_V2_GRID_SAFE_MOVE_PARTIAL', {
				'#MOVED#': moved.length,
				'#ERRORS#': errors.length
			}));
		}

		// FolderSelectionPopup uses `0` for the root, while the API expects `null`.
		#toTargetFolderId(folderId) {
			return folderId === 0 || folderId === null ? null : Number(folderId);
		}

		// Runs the server-side Excel export of the current Safe level. The gear-menu
		// "Export to Excel" item routes here (safe grid only). The current level is
		// carried by the page URL (folder navigation opens `?folderId=N`; the root has
		// none), so folderId is preserved automatically. Row actions pass an explicit
		// member/folder id; group actions use the checked rows. Selected ids are sent as
		// POST fields so a large selection never hits the URL-length limit; with no row
		// and no selection the whole level is exported via GET. The active main.ui.filter
		// is applied server-side by FILTER_ID either way.
		exportToExcel(documentId = null, folderId = null) {
			const hasExplicitRow = documentId !== null || folderId !== null;
			const selectedIds = hasExplicitRow ? documentId === null ? [] : [documentId] : this.#getSelectedIds();
			const selectedFolderIds = hasExplicitRow ? folderId === null ? [] : [folderId] : this.#getSelectedFolderIds();

			// Nothing checked: export the whole current level via a plain GET navigation.
			// With any selection (documents, folders, or a mix) post the ids so the backend
			// narrows the export; a folder selection alone still goes through the POST path.
			if (!hasExplicitRow && selectedIds.length === 0 && selectedFolderIds.length === 0) {
				window.location.href = this.#buildExportUrl();
				return;
			}
			this.#submitExportForm(selectedIds, selectedFolderIds);
		}

		// Builds the export URL from the current location: appends the ExcelExporter
		// params (mode/ncc) while keeping the existing query, so a folderId already in the
		// URL is carried over and the root (no folderId) exports the whole safe.
		#buildExportUrl() {
			const uri = new URL(window.location.href);
			uri.searchParams.set(EXPORT_MODE_PARAM, EXPORT_MODE_VALUE);
			uri.searchParams.set(EXPORT_NO_COMPOSITE_PARAM, '1');
			return uri.toString();
		}

		// Submits a hidden POST form to the export URL carrying the selected ids.
		// mode/ncc/folderId stay in the action query (as in the GET path); only the id
		// lists travel in the body, which the backend reads from POST. Document member ids
		// go under `selectedIds[]`, folder ids under `selectedFolderIds[]`. sessid is
		// included so the request passes when portal-wide CSRF protection is enabled.
		#submitExportForm(selectedIds, selectedFolderIds) {
			const form = main_core.Dom.create('form', {
				attrs: {
					method: 'POST',
					action: this.#buildExportUrl()
				},
				style: {
					display: 'none'
				}
			});
			main_core.Dom.append(main_core.Dom.create('input', {
				attrs: {
					type: 'hidden',
					name: 'sessid',
					value: BX.bitrix_sessid()
				}
			}), form);
			selectedIds.forEach(id => {
				main_core.Dom.append(main_core.Dom.create('input', {
					attrs: {
						type: 'hidden',
						name: EXPORT_SELECTED_IDS_FIELD,
						value: String(id)
					}
				}), form);
			});
			selectedFolderIds.forEach(id => {
				main_core.Dom.append(main_core.Dom.create('input', {
					attrs: {
						type: 'hidden',
						name: EXPORT_SELECTED_FOLDER_IDS_FIELD,
						value: String(id)
					}
				}), form);
			});
			main_core.Dom.append(form, document.body);
			form.submit();
			// The hidden form is harmless; drop it on the next tick so submit navigation is never raced.
			setTimeout(() => main_core.Dom.remove(form), 0);
		}
		subscribeOnGridEvents() {
			main_core.Event.ready(() => {
				if (this.#subscribedOnGridEvents) {
					return;
				}
				const grid = this.#getGrid();
				if (!main_core.Type.isObject(grid)) {
					return;
				}
				this.#subscribedOnGridEvents = true;
				main_core_events.EventEmitter.subscribe('Grid::updated', this.#onGridUpdated);
				GRID_SELECTION_EVENTS.forEach(eventName => {
					main_core_events.EventEmitter.subscribe(eventName, this.#onGridSelectionChanged);
				});
				main_core.Event.bind(window, 'unload', this.#onWindowUnload);
				this.#initFolderUserStacks(grid.getContainer());
				this.#onGridSelectionMutate();
			});
		}

		// Reloads the root grid after a folder side panel is closed, so that changes
		// made inside a folder (moves, deletes) are reflected in the folder/document
		// counters. Mirrors the templates grid behavior.
		reloadAfterSliderClose() {
			const context = window === top ? window : top;
			context.BX.Event.EventEmitter.subscribe('SidePanel.Slider:onCloseComplete', event => {
				const url = event.getData()[0].getSlider().getUrl();
				if (this.#isFolderSliderUrl(url)) {
					void this.reload();
				}
			});
		}
		#isFolderSliderUrl(url) {
			const folderId = new main_core.Uri(url).getQueryParam('folderId');
			return folderId !== null && folderId !== undefined;
		}
		destroy() {
			if (!this.#subscribedOnGridEvents) {
				return;
			}
			main_core_events.EventEmitter.unsubscribe('Grid::updated', this.#onGridUpdated);
			GRID_SELECTION_EVENTS.forEach(eventName => {
				main_core_events.EventEmitter.unsubscribe(eventName, this.#onGridSelectionChanged);
			});
			main_core.Event.unbind(window, 'unload', this.#onWindowUnload);
			this.#subscribedOnGridEvents = false;
		}
		#isOwnGridEvent(event) {
			const [eventGrid] = event?.getCompatData?.() ?? [];
			if (!main_core.Type.isObject(eventGrid)) {
				return true;
			}
			return eventGrid === this.#getGrid() || main_core.Type.isFunction(eventGrid.getId) && eventGrid.getId() === this.#gridId;
		}

		// Renders the role avatar stacks embedded by the grid template into folder rows.
		// The template emits an empty placeholder element per role cell carrying the
		// user preview as a JSON `data-people` attribute (participants / representatives /
		// senders). The grid re-creates its DOM on every reload, so freshly rendered
		// placeholders are picked up here; the `data-stack-ready` marker keeps a single
		// placeholder from being initialized twice within one render.
		#initFolderUserStacks(container) {
			const placeholders = container.querySelectorAll('.sign-safe-folder-people-stack:not([data-stack-ready])');
			placeholders.forEach(placeholder => {
				placeholder.setAttribute('data-stack-ready', '1');
				let users = [];
				try {
					users = JSON.parse(placeholder.dataset.people ?? '[]');
				} catch {
					users = [];
				}
				if (!Array.isArray(users) || users.length === 0) {
					return;
				}
				const stack = new sign_v2_grid_components_users.RoleAvatarStack({
					users,
					totalCount: Number(placeholder.dataset.total ?? users.length),
					loadUsers: async (limit, afterUserId) => {
						const page = await this.#api.safeFolder.listPeople(Number(placeholder.dataset.folderId), placeholder.dataset.category ?? '', limit, afterUserId);
						return {
							users: page.people,
							total: page.total,
							nextCursor: page.nextCursor
						};
					},
					title: placeholder.dataset.title ?? ''
				});
				main_core.Dom.clean(placeholder);
				main_core.Dom.append(stack.render(), placeholder);
			});
		}
		#onGridSelectionMutate() {
			const exportButton = document.getElementById(EXPORT_BUTTON_ID);
			if (main_core.Type.isElementNode(exportButton) && exportButton.dataset.testid !== EXPORT_BUTTON_TEST_ID) {
				main_core.Dom.attr(exportButton, 'data-testid', EXPORT_BUTTON_TEST_ID);
			}
			const hasFolderSelected = this.#getSelectedFolderIds().length > 0;
			const hasDocumentSelected = this.#getSelectedIds().length > 0;

			// Folders are not bulk-movable. As soon as a folder is in the selection (a folder
			// alone or mixed with documents) the mass "move" button is hidden; with only
			// documents selected it is shown and enabled as before. This only affects the
			// group panel (2+ rows); a single selection is built from the row's own actions,
			// where a folder row simply has no "move" entry. Export stays available always.
			this.#actionPanel.toggleActionButtonVisibility(MOVE_BUTTON_ID, !hasFolderSelected);
			this.#actionPanel.toggleActionButton(MOVE_BUTTON_ID, hasDocumentSelected && !hasFolderSelected, main_core.Loc.getMessage('SIGN_V2_GRID_SAFE_MOVE_DISABLED_HINT'));
		}
		reload() {
			return new Promise(resolve => {
				main_core.Event.ready(() => {
					const grid = this.#getGrid();
					if (main_core.Type.isObject(grid)) {
						grid.reloadTable();
					}
					resolve();
				});
			});
		}
		#getGrid() {
			return BX.Main.gridManager?.getInstanceById(this.#gridId) ?? null;
		}
		#getSelectedIds() {
			const grid = this.#getGrid();
			if (!main_core.Type.isObject(grid)) {
				return [];
			}
			return grid.getRows().getSelectedIds().map(id => Number(id)).filter(id => Number.isInteger(id) && id > 0);
		}

		// Selected folder ids. Folder rows use a non-numeric `folder-{N}` row id (set by the
		// grid template), so they are dropped by #getSelectedIds() (integer-only) and read
		// here instead: the numeric {N} is extracted and sent as `selectedFolderIds[]`.
		#getSelectedFolderIds() {
			const grid = this.#getGrid();
			if (!main_core.Type.isObject(grid)) {
				return [];
			}
			return grid.getRows().getSelectedIds().map(id => this.#parseFolderId(id)).filter(id => id !== null);
		}

		// Extracts the numeric id from a `folder-{N}` row id; returns null for anything else
		// (e.g. a numeric document row id).
		#parseFolderId(rawId) {
			const match = /^folder-(\d+)$/.exec(String(rawId));
			if (match === null) {
				return null;
			}
			const id = Number(match[1]);
			return Number.isInteger(id) && id > 0 ? id : null;
		}
		#notify(content) {
			window.top.BX.UI.Notification.Center.notify({
				content
			});
		}

		// "Folder «name» was deleted" when a title is known; a title-less generic
		// otherwise (e.g. bulk paths without a per-folder title).
		#notifyFolderDeleted(folderTitle = '') {
			this.#notify(main_core.Type.isStringFilled(folderTitle) ? main_core.Loc.getMessage('SIGN_V2_GRID_SAFE_DELETE_FOLDER_SUCCESS_NAMED',
			// The notification content is rendered as HTML; the folder title is
			// user data and must be HTML-encoded to avoid XSS.
			{
				'#TITLE#': main_core.Text.encode(folderTitle)
			}) : main_core.Loc.getMessage('SIGN_V2_GRID_SAFE_DELETE_FOLDER_SUCCESS'));
		}
	}

	exports.Safe = Safe;

})(this.BX.Sign.V2.Grid.B2e = this.BX.Sign.V2.Grid.B2e || {}, BX, BX.Event, BX.UI, BX.UI.Dialogs, BX.Sign.V2, BX.Sign.V2.Grid.Components, BX.Sign.V2.Grid.Components, BX.Sign.V2.Grid.Components);
//# sourceMappingURL=index.bundle.js.map
