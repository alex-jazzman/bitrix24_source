/* eslint-disable */
this.BX = this.BX || {};
this.BX.Sign = this.BX.Sign || {};
this.BX.Sign.V2 = this.BX.Sign.V2 || {};
this.BX.Sign.V2.Grid = this.BX.Sign.V2.Grid || {};
(function (exports, main_core, main_core_events, pull_client, sign_v2_grid_components_actionPanel) {
	'use strict';

	// Local copy of BulkActionType from sign.v2.api: the panel needs the two action values only,
	// and importing the api extension would load its whole dependency chain on every page open.
	// sign.v2.api stays the contract owner; tests/unit/bulk-action-type.test.js asserts both match.
	const BulkActionType = Object.freeze({
		approve: 'approve',
		reject: 'reject'
	});

	const APPROVE_CONTROL_ID = 'sign-my-documents-bulk-action-approve';
	const REJECT_CONTROL_ID = 'sign-my-documents-bulk-action-reject';
	const GRID_SELECTION_EVENTS = ['Grid::thereSelectedRows', 'Grid::allRowsSelected', 'Grid::allRowsUnselected', 'Grid::noSelectedRows', 'Grid::selectRow', 'Grid::unselectRow'];
	class BulkActionPanel {
		#gridId;
		#labels;
		#onApply;
		#actionPanel = new sign_v2_grid_components_actionPanel.ActionPanel();
		#availableActions = [];
		#disabled = false;
		#subscribed = false;
		#boundControls = new WeakSet();
		#onGridUpdated = event => {
			if (!this.#isOwnGridEvent(event)) {
				return;
			}
			this.reset();
			this.#prepareRowCheckboxes();
		};
		#onGridSelectionChanged = event => {
			if (this.#isOwnGridEvent(event)) {
				this.refresh();
			}
		};
		#onWindowUnload = () => this.destroy();
		#onUiActionPanelCreated = event => {
			const [panel] = event?.getCompatData?.() ?? [];
			if (!main_core.Type.isObject(panel) || panel.params?.gridId !== this.#gridId) {
				return;
			}
			this.#adoptUiActionPanel(panel);
		};
		constructor({
			gridId,
			labels,
			onApply
		}) {
			this.#gridId = gridId;
			this.#labels = labels;
			this.#onApply = onApply;
		}
		subscribe() {
			// the shared panel announces itself from its constructor on document ready, so the listener
			// is set right away and not from inside another ready callback
			main_core_events.EventEmitter.subscribe('BX.UI.ActionPanel:created', this.#onUiActionPanelCreated);
			main_core.Event.ready(() => {
				if (this.#subscribed || !main_core.Type.isObject(this.#getGrid())) {
					return;
				}
				this.#subscribed = true;
				main_core_events.EventEmitter.subscribe('Grid::updated', this.#onGridUpdated);
				GRID_SELECTION_EVENTS.forEach(eventName => {
					main_core_events.EventEmitter.subscribe(eventName, this.#onGridSelectionChanged);
				});
				main_core.Event.bind(window, 'unload', this.#onWindowUnload);
				this.#prepareRowCheckboxes();
				this.refresh();
			});
		}

		/**
		 * With a single row selected the shared panel builds the actions of that row instead of the group
		 * ones. The bulk actions of this grid are group actions and belong to a selection of any size, so
		 * the handler is replaced on the instance - the same way the panel expects its click handler to be.
		 *
		 * Mirrors ui.actionpanel -> BX.UI.ActionPanel.prototype.handleGridSelectItem: keep both in step.
		 */
		#adoptUiActionPanel(panel) {
			const targetPanel = panel;
			targetPanel.handleGridSelectItem = () => {
				// the panel keeps its grid from Grid::ready, which never arrives for a foreign grid id
				const selectedIds = targetPanel.grid?.getRows?.()?.getSelectedIds?.();
				if (targetPanel.showTotalSelectedBlock && main_core.Type.isArray(selectedIds)) {
					targetPanel.setTotalSelectedItems(selectedIds.length);
				}
				targetPanel.buildPanelByGroup();
			};
		}
		destroy() {
			main_core_events.EventEmitter.unsubscribe('BX.UI.ActionPanel:created', this.#onUiActionPanelCreated);
			if (!this.#subscribed) {
				return;
			}
			main_core_events.EventEmitter.unsubscribe('Grid::updated', this.#onGridUpdated);
			GRID_SELECTION_EVENTS.forEach(eventName => {
				main_core_events.EventEmitter.unsubscribe(eventName, this.#onGridSelectionChanged);
			});
			main_core.Event.unbind(window, 'unload', this.#onWindowUnload);
			this.#subscribed = false;
		}
		apply(actionType) {
			const memberIds = this.getSelectedMemberIds();
			if (this.#disabled || !Object.values(BulkActionType).includes(actionType) || !this.#availableActions.includes(actionType) || memberIds.length === 0) {
				return;
			}
			this.#onApply?.({
				actionType,
				memberIds: [...memberIds],
				trigger: document.getElementById(this.#getControlId(actionType))
			});
		}
		refresh() {
			this.#availableActions = this.#getAvailableActions(this.getSelectedMemberIds());
			this.#render();
		}
		reset() {
			this.#availableActions = [];
			this.#render();
		}
		setDisabled(disabled) {
			this.#disabled = disabled;
			this.#render();
		}
		getSelectedMemberIds() {
			const grid = this.#getGrid();
			if (!main_core.Type.isObject(grid)) {
				return [];
			}
			return grid.getRows().getSelectedIds().map(id => Number(id)).filter(id => Number.isInteger(id) && id > 0);
		}
		getAvailableActions() {
			return [...this.#availableActions];
		}
		#isOwnGridEvent(event) {
			const [eventGrid] = event?.getCompatData?.() ?? [];
			if (!main_core.Type.isObject(eventGrid)) {
				return false;
			}
			return eventGrid === this.#getGrid() || main_core.Type.isFunction(eventGrid.getId) && eventGrid.getId() === this.#gridId;
		}
		#getGrid() {
			return BX.Main.gridManager?.getInstanceById(this.#gridId) ?? BX.Main.gridManager?.getById(this.#gridId)?.instance ?? null;
		}
		#getAvailableActions(memberIds) {
			if (memberIds.length === 0) {
				return [];
			}
			const grid = this.#getGrid();
			if (!main_core.Type.isObject(grid)) {
				return [];
			}
			let intersection = null;
			for (const memberId of memberIds) {
				const row = grid.getContainer().querySelector(`.main-grid-row[data-id="${memberId}"]`);
				const actions = (row?.dataset.bulkActions ?? '').split(',').filter(action => Object.values(BulkActionType).includes(action));
				intersection = intersection === null ? actions : intersection.filter(action => actions.includes(action));
			}
			return intersection ?? [];
		}
		#render() {
			Object.values(BulkActionType).forEach(actionType => {
				const controlId = this.#getControlId(actionType);
				const control = document.getElementById(controlId);
				if (control === null) {
					return;
				}
				this.#prepareControl(control, controlId);
				this.#setControlEnabled(control, !this.#disabled && this.#availableActions.includes(actionType), this.#getDisabledHint(actionType));
			});
		}

		/**
		 * The hint explains the selection, so it belongs only to a button held back by what the user picked.
		 * While the whole panel waits for a running bulk process, the block means something else entirely.
		 */
		#getDisabledHint(actionType) {
			if (this.#disabled || this.#availableActions.includes(actionType)) {
				return '';
			}
			return this.#labels.disabledHint?.[actionType] ?? '';
		}
		#prepareControl(control, testId) {
			const targetControl = control;
			targetControl.dataset.testid = testId;
			targetControl.setAttribute('role', 'button');
			targetControl.setAttribute('tabindex', '0');
			main_core.Dom.addClass(targetControl, 'sign-my-documents-bulk-action-control');
			const panel = targetControl.closest('.ui-action-panel');
			if (panel !== null) {
				panel.dataset.testid = 'sign-my-documents-bulk-action-panel';
			}
			if (this.#boundControls.has(targetControl)) {
				return;
			}
			main_core.Event.bind(targetControl, 'click', event => {
				if (targetControl.getAttribute('aria-disabled') === 'true') {
					event.preventDefault();
					event.stopImmediatePropagation();
				}
			}, true);
			main_core.Event.bind(targetControl, 'keydown', event => {
				if (event.key !== 'Enter' && event.key !== ' ') {
					return;
				}
				event.preventDefault();
				if (targetControl.getAttribute('aria-disabled') !== 'true') {
					(document.getElementById(`${targetControl.id}_control`) ?? targetControl).click();
				}
			});
			this.#boundControls.add(targetControl);
		}
		#setControlEnabled(control, enabled, disabledHint = '') {
			this.#actionPanel.toggleActionButton(control.id, enabled, disabledHint);
			// the shared panel writes the title only when a button first becomes disabled, while the reason
			// can change under a button that stays disabled: a running process replaces the selection hint
			main_core.Dom.attr(control, 'title', enabled ? '' : disabledHint);
			control.setAttribute('aria-disabled', enabled ? 'false' : 'true');
			this.#setControlReason(control, enabled ? '' : disabledHint);
		}

		/**
		 * The title of an element with role="button" and text of its own is left out of the accessible name,
		 * so a screen reader would never say why the button is blocked. Without a reason the name goes back
		 * to the text of the button, which the shared panel may have rebuilt in the meantime.
		 */
		#setControlReason(control, reason) {
			const targetControl = control;
			if (reason === '') {
				targetControl.removeAttribute('aria-label');
				return;
			}
			const text = (targetControl.textContent ?? '').replaceAll(/\s+/g, ' ').trim();
			targetControl.setAttribute('aria-label', text === '' ? reason : `${text}. ${reason}`);
		}
		#getControlId(actionType) {
			return actionType === BulkActionType.approve ? APPROVE_CONTROL_ID : REJECT_CONTROL_ID;
		}
		#prepareRowCheckboxes() {
			const grid = this.#getGrid();
			if (!main_core.Type.isObject(grid)) {
				return;
			}
			grid.getContainer().querySelectorAll('.main-grid-row input[type="checkbox"]').forEach(checkbox => {
				const rowCheckbox = checkbox;
				const row = rowCheckbox.closest('.main-grid-row');
				const memberId = Number(row?.dataset.id);
				if (Number.isInteger(memberId) && memberId > 0) {
					rowCheckbox.dataset.testid = `sign-my-documents-row-checkbox-${memberId}`;
				}
			});
		}
	}

	const GRID_UPDATE_TIMEOUT = 15000;
	const BULK_PROCESS_EXTENSION = 'sign.v2.grid.b2e.my-documents.bulk-action-process';
	const NOTIFICATION_EXTENSION = 'ui.notification';
	const NOTIFICATION_AUTO_HIDE_DELAY = 6000;
	class MyDocuments {
		#options;
		#bulkActionPanel = null;
		#bulkActionProcess = null;
		#bulkProcessFactory = null;
		#bulkProcessLoading = false;
		#bulkOperationRunning = false;
		#awaitingGridUpdate = false;
		#reloadRequested = false;
		#pullReloadPending = false;
		#dialogClosed = false;
		#focusTrigger = null;
		#frozenGridContainer = null;
		#gridUpdateTimeoutId = null;
		#onGridUpdated = event => {
			if (!this.#isOwnGridEvent(event)) {
				return;
			}
			if (this.#bulkOperationRunning) {
				this.#freezeGrid();
				return;
			}
			if (this.#awaitingGridUpdate) {
				this.#completeGridUpdate();
			}
		};
		constructor(options) {
			this.#options = options;
			// the panel follows the portal, not the page: rows with checkboxes come and go with every AJAX
			// update of the grid, and the panel has to be ready for the page that brings them back
			if (options.bulkActionAvailable && options.bulkActionLabels) {
				this.#bulkActionPanel = new BulkActionPanel({
					gridId: this.#getGridId(),
					labels: options.bulkActionLabels,
					onApply: selection => this.#startBulkAction(selection)
				});
			}
		}
		subscribeOnGridEvents() {
			this.#bulkActionPanel?.subscribe();
			main_core_events.EventEmitter.subscribe('Grid::updated', this.#onGridUpdated);
		}
		applyBulkAction(actionType) {
			this.#bulkActionPanel?.apply(actionType);
		}
		openSignSliderByGridId(gridId) {
			main_core.Event.ready(async () => {
				const gridContainer = document.querySelector(gridId);
				if (!gridContainer) {
					return;
				}
				main_core.Event.bind(gridContainer, 'click', async event => {
					let target = event.target;
					if (main_core.Dom.hasClass(target, 'ui-btn-text')) {
						target = target.parentNode;
					}
					if (!main_core.Dom.hasClass(target, 'ui-btn') || !target.dataset.memberId) {
						return;
					}
					if (main_core.Dom.hasClass(target, 'sign-action-button')) {
						main_core.Dom.addClass(target, 'ui-btn-wait');
						const memberId = Number(target.dataset.memberId);
						main_core.Runtime.loadExtension('sign.v2.b2e.sign-link').then(exports => {
							return new exports.SignLink({
								memberId
							}).openSlider({
								target,
								events: {
									onClose: async () => {
										await BX.ajax.runAction('sign.api_v1.B2e.Document.Member.callStatus', {
											json: {
												memberId
											}
										});
										if (main_core.Type.isNil(pull_client.PULL)) {
											this.#reload();
										}
									}
								}
							});
						}).catch(error => {
							console.error(error);
						}).finally(() => {
							main_core.Dom.removeClass(target, 'ui-btn-wait');
						});
						event.preventDefault();
					}
				});
			});
		}
		#reload() {
			main_core.Event.ready(() => this.#getGrid()?.reload());
		}
		subscribeOnPullEvents() {
			main_core.Event.ready(() => {
				if (main_core.Type.isNil(pull_client.PULL)) {
					return;
				}
				pull_client.PULL.subscribe({
					moduleId: 'sign',
					command: 'updateMyDocumentGrid',
					callback: () => {
						// changes made by the running operation arrive with its own final reload
						if (this.#bulkOperationRunning) {
							return;
						}
						if (this.#awaitingGridUpdate) {
							this.#pullReloadPending = true;
							return;
						}
						this.#reload();
					}
				});
				pull_client.PULL.subscribe({
					moduleId: 'sign',
					command: this.#options?.counterPullEventName,
					callback: params => {
						if (!main_core.Type.isNumber(params?.needActionCount)) {
							return;
						}
						if (!main_core.Type.isStringFilled(this.#options?.needActionCounterId)) {
							return;
						}
						main_core.Event.EventEmitter.emit('BX.Sign.DocumentCounter.Item:updateCounter', {
							id: this.#options.needActionCounterId,
							count: params.needActionCount
						});
					}
				});
			});
		}
		#startBulkAction(selection) {
			if (this.#bulkOperationRunning || this.#awaitingGridUpdate || this.#bulkProcessLoading || this.#bulkActionProcess !== null) {
				return;
			}
			this.#dialogClosed = false;
			this.#focusTrigger = selection.trigger ?? null;
			void this.#showBulkActionProcess(selection);
		}
		async #showBulkActionProcess(selection) {
			this.#bulkProcessLoading = true;
			this.#bulkActionPanel?.setDisabled(true);
			try {
				const createProcess = await this.#loadBulkProcessFactory();
				this.#bulkActionProcess = createProcess({
					actionType: selection.actionType,
					memberIds: selection.memberIds,
					trigger: selection.trigger,
					onStart: () => {
						this.#bulkOperationRunning = true;
						this.#freezeGrid();
					},
					onTerminal: () => this.#finishBulkAction(),
					onDialogClosed: trigger => {
						this.#dialogClosed = true;
						this.#focusTrigger = trigger ?? this.#focusTrigger;
						this.#bulkActionProcess = null;
						if (!this.#awaitingGridUpdate) {
							this.#restoreFocus();
						}
					}
				});
				this.#bulkActionProcess.show();
			} catch (error) {
				console.error(error);
				this.#notifyBulkProcessUnavailable();
				this.#focusTrigger = null;
			} finally {
				this.#bulkProcessLoading = false;
				if (!this.#bulkOperationRunning) {
					this.#bulkActionPanel?.setDisabled(false);
				}
			}
		}
		async #loadBulkProcessFactory() {
			if (this.#bulkProcessFactory === null) {
				const {
					BulkActionProcess
				} = await main_core.Runtime.loadExtension(BULK_PROCESS_EXTENSION);
				if (!main_core.Type.isFunction(BulkActionProcess)) {
					throw new TypeError(`${BULK_PROCESS_EXTENSION} does not export BulkActionProcess`);
				}
				this.#bulkProcessFactory = processOptions => new BulkActionProcess(processOptions);
			}
			return this.#bulkProcessFactory;
		}
		#notifyBulkProcessUnavailable() {
			void main_core.Runtime.loadExtension(NOTIFICATION_EXTENSION).then(({
				UI
			}) => {
				UI.Notification.Center.notify({
					content: main_core.Loc.getMessage('SIGN_MY_DOCUMENTS_BULK_PROCESS_UNAVAILABLE'),
					autoHideDelay: NOTIFICATION_AUTO_HIDE_DELAY
				});
			}).catch(error => {
				console.error(error);
			});
		}
		#finishBulkAction() {
			if (this.#reloadRequested) {
				return;
			}
			this.#reloadRequested = true;
			this.#bulkOperationRunning = false;
			this.#getGrid()?.getRows().unselectAll();
			if (!this.#requestGridUpdate()) {
				this.#completeGridUpdate();
			}
		}
		#requestGridUpdate() {
			const grid = this.#getGrid();
			if (!main_core.Type.isObject(grid)) {
				return false;
			}
			this.#awaitingGridUpdate = true;
			this.#startGridUpdateTimeout();
			grid.reload();
			return true;
		}
		#completeGridUpdate() {
			const hasPendingPullReload = this.#pullReloadPending;
			this.#awaitingGridUpdate = false;
			this.#pullReloadPending = false;
			this.#clearGridUpdateTimeout();
			this.#unfreezeGrid();
			if (this.#dialogClosed) {
				this.#restoreFocus();
			}

			// pull updates received while the grid was frozen are picked up by a single extra reload
			if (hasPendingPullReload) {
				this.#reload();
			}
		}

		// Grid::updated never arrives if the reload request fails, so the frozen grid needs a fallback release
		#startGridUpdateTimeout() {
			this.#clearGridUpdateTimeout();
			this.#gridUpdateTimeoutId = window.setTimeout(() => {
				this.#gridUpdateTimeoutId = null;
				if (this.#awaitingGridUpdate) {
					this.#completeGridUpdate();
				}
			}, GRID_UPDATE_TIMEOUT);
		}
		#clearGridUpdateTimeout() {
			if (this.#gridUpdateTimeoutId !== null) {
				window.clearTimeout(this.#gridUpdateTimeoutId);
				this.#gridUpdateTimeoutId = null;
			}
		}
		#freezeGrid() {
			const grid = this.#getGrid();
			if (!main_core.Type.isObject(grid)) {
				return;
			}
			this.#bulkActionPanel?.setDisabled(true);
			const gridContainer = grid.getContainer();
			gridContainer.setAttribute('aria-busy', 'true');
			this.#disableGridCheckboxes(gridContainer);
			if (this.#frozenGridContainer !== gridContainer) {
				if (this.#frozenGridContainer !== null) {
					main_core.Event.unbind(this.#frozenGridContainer, 'click', this.#preventGridSelection);
					main_core.Event.unbind(this.#frozenGridContainer, 'keydown', this.#preventGridSelection);
				}
				this.#frozenGridContainer = gridContainer;
				main_core.Event.bind(gridContainer, 'click', this.#preventGridSelection);
				main_core.Event.bind(gridContainer, 'keydown', this.#preventGridSelection);
			}
			grid.tableFade();
		}
		#unfreezeGrid() {
			const grid = this.#getGrid();
			const gridContainer = grid?.getContainer() ?? this.#frozenGridContainer;
			if (gridContainer !== null) {
				gridContainer.setAttribute('aria-busy', 'false');
				gridContainer.querySelectorAll('[data-sign-bulk-disabled]').forEach(checkbox => {
					const gridCheckbox = checkbox;
					gridCheckbox.disabled = gridCheckbox.dataset.signBulkDisabled === 'true';
					delete gridCheckbox.dataset.signBulkDisabled;
				});
				main_core.Event.unbind(gridContainer, 'click', this.#preventGridSelection);
				main_core.Event.unbind(gridContainer, 'keydown', this.#preventGridSelection);
			}
			grid?.tableUnfade();
			this.#bulkActionPanel?.setDisabled(false);
			this.#frozenGridContainer = null;
			this.#reloadRequested = false;
		}
		#disableGridCheckboxes(gridContainer) {
			gridContainer.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
				const gridCheckbox = checkbox;
				if (!gridCheckbox.hasAttribute('data-sign-bulk-disabled')) {
					gridCheckbox.dataset.signBulkDisabled = gridCheckbox.disabled ? 'true' : 'false';
				}
				gridCheckbox.disabled = true;
			});
		}
		#preventGridSelection = event => {
			if (event.target?.closest?.('input[type="checkbox"], .main-grid-row-checkbox, .main-grid-check-all')) {
				event.preventDefault();
				event.stopImmediatePropagation();
			}
		};
		#restoreFocus() {
			const trigger = this.#focusTrigger;
			const panel = document.querySelector('[data-testid="sign-my-documents-bulk-action-panel"]');
			const fallback = document.querySelector('[data-testid="sign-my-documents-bulk-action-approve"]') ?? document.querySelector('[data-testid="sign-my-documents-bulk-action-reject"]') ?? panel?.querySelector('button:not([disabled]), [tabindex="0"]');
			const target = trigger?.isConnected ? trigger : fallback;
			if (main_core.Type.isFunction(target?.focus)) {
				target.focus();
			}
			this.#focusTrigger = null;
		}
		#isOwnGridEvent(event) {
			const [eventGrid] = event?.getCompatData?.() ?? [];
			const grid = this.#getGrid();
			return main_core.Type.isObject(eventGrid) && (eventGrid === grid || eventGrid.getId?.() === this.#getGridId());
		}
		#getGridId() {
			return this.#options.gridId ?? 'SIGN_B2E_MY_DOCUMENTS_GRID';
		}
		#getGrid() {
			const gridId = this.#getGridId();
			return BX.Main.gridManager?.getInstanceById(gridId) ?? BX.Main.gridManager?.getById(gridId)?.instance ?? null;
		}
	}

	exports.MyDocuments = MyDocuments;

})(this.BX.Sign.V2.Grid.B2e = this.BX.Sign.V2.Grid.B2e || {}, BX, BX.Event, BX, BX.Sign.V2.Grid.Components);
