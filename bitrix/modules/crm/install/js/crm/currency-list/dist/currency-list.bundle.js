/* eslint-disable */
this.BX = this.BX || {};
(function (exports, main_core, main_core_events, main_sidepanel, ui_buttons, ui_a11y, ui_notification, ui_system_dialog, ui_stepprocessing) {
	'use strict';

	const BATCH_DELETION_EVENT = 'BX.Crm.EntityList.Panel:CurrencyList:executeBatchDeletion';
	const GRID_UPDATED_EVENT = 'Grid::updated';
	const GRID_SETTINGS_CLOSED_EVENT = 'BX.Grid.SettingsWindow:close';
	const GRID_SELECTION_EVENTS = ['Grid::selectRow', 'Grid::unselectRow', 'Grid::allRowsSelected', 'Grid::allRowsUnselected'];
	const A11Y_CONTROL_ATTRIBUTE = 'data-crm-currency-list-a11y-control';
	const BATCH_OPERATION_NOT_FOUND = 'CRM_CURRENCY_BATCH_NOT_FOUND';
	const getGridErrorMessage = grid => {
		const messages = grid.getParam('MESSAGES', []);
		if (!Array.isArray(messages)) {
			return '';
		}
		const message = messages.find(item => main_core.Type.isPlainObject(item) && main_core.Type.isStringFilled(item.TEXT));
		return message?.TEXT ?? '';
	};
	const defaultRuntime = {
		openSlider(url, options) {
			const topSidePanel = main_core.Reflection.getClass('top.BX.SidePanel.Instance');
			(topSidePanel ?? main_sidepanel.SidePanel.Instance).open(url, options);
		},
		showConfirmation(options) {
			const content = main_core.Tag.render`
			<div data-testid="crm-currency-list-confirmation-message">${options.message}</div>
		`;
			const enhanceDialog = () => {
				const dialogContainer = content.closest('.ui-system-dialog');
				if (!dialogContainer) {
					return;
				}
				dialogContainer.setAttribute('data-testid', 'crm-currency-list-confirmation');
				const titleElement = dialogContainer.querySelector('.ui-system-dialog__header-left > :first-child');
				if (titleElement) {
					const titleId = `${options.dialogId}-title`;
					titleElement.id = titleId;
					dialogContainer.setAttribute('aria-labelledby', titleId);
				}
				const closeButton = dialogContainer.querySelector('.ui-system-dialog__header-close-btn');
				if (closeButton) {
					closeButton.type = 'button';
					closeButton.setAttribute('data-testid', 'crm-currency-list-confirmation-close');
					closeButton.setAttribute('aria-label', options.closeButtonText);
				}
			};
			const dialog = new ui_system_dialog.Dialog({
				title: options.title,
				content,
				hasCloseButton: true,
				hasOverlay: true,
				closeByEsc: true,
				closeByClickOutside: true,
				width: 480,
				events: {
					onAfterShow: enhanceDialog,
					onAfterHide: () => {
						options.onClose();
						ui_a11y.FocusNavigator.restoreFocus(options.opener, {
							preventScroll: true
						});
					}
				}
			});
			const confirmButton = new ui_buttons.Button({
				text: options.confirmButtonText,
				size: ui_buttons.ButtonSize.LARGE,
				style: ui_buttons.AirButtonStyle.FILLED,
				useAirDesign: true,
				dataset: {
					testid: 'crm-currency-list-confirm'
				},
				onclick: () => {
					dialog.hide();
					options.onConfirm();
					return {};
				}
			});
			const cancelButton = new ui_buttons.Button({
				text: main_core.Loc.getMessage('CRM_CURRENCY_LIST_CANCEL_BUTTON') ?? '',
				size: ui_buttons.ButtonSize.LARGE,
				style: ui_buttons.AirButtonStyle.OUTLINE,
				useAirDesign: true,
				dataset: {
					testid: 'crm-currency-list-cancel'
				},
				onclick: () => {
					dialog.hide();
					return {};
				}
			});
			dialog.setCenterButtons([confirmButton, cancelButton]);
			dialog.show();
			enhanceDialog();
			return dialog;
		},
		getGrid(gridId) {
			const gridManager = BX.Main.gridManager;
			return gridManager.getById(gridId)?.instance ?? null;
		},
		interceptRowActions(gridId, callback) {
			const grid = defaultRuntime.getGrid(gridId);
			if (!grid) {
				return null;
			}
			const sendRowAction = grid.sendRowAction;
			const interceptedSendRowAction = (action, data) => {
				callback(action, data, (callbacks = {}) => {
					const gridData = grid.getData();
					const request = gridData.request;
					const restoreRequest = () => {
						if (gridData.request === interceptedRequest) {
							gridData.request = request;
						}
					};
					const interceptedRequest = function (url, method, requestData, requestAction, onSuccess, onError) {
						restoreRequest();
						request.call(gridData, url, method, requestData, requestAction, function (...args) {
							onSuccess?.apply(this, args);
							callbacks.onSuccess?.();
						}, function (...args) {
							onError?.apply(this, args);
							callbacks.onError?.(getGridErrorMessage(grid));
						});
					};
					gridData.request = interceptedRequest;
					try {
						sendRowAction.call(grid, action, data);
					} catch {
						restoreRequest();
						callbacks.onError?.('');
					}
				});
			};
			grid.sendRowAction = interceptedSendRowAction;
			return () => {
				if (grid.sendRowAction === interceptedSendRowAction) {
					grid.sendRowAction = sendRowAction;
				}
			};
		},
		subscribeBatchDeletion(callback) {
			main_core_events.EventEmitter.subscribe(BATCH_DELETION_EVENT, callback);
		},
		unsubscribeBatchDeletion(callback) {
			main_core_events.EventEmitter.unsubscribe(BATCH_DELETION_EVENT, callback);
		},
		createBatchProcess(options) {
			return ui_stepprocessing.ProcessManager.create(options);
		},
		deleteBatchProcess(processId) {
			ui_stepprocessing.ProcessManager.delete(processId);
		},
		readBatchToken(key) {
			try {
				return window.sessionStorage.getItem(key);
			} catch {
				return null;
			}
		},
		writeBatchToken(key, token) {
			try {
				window.sessionStorage.setItem(key, token);
			} catch {
			}
		},
		removeBatchToken(key) {
			try {
				window.sessionStorage.removeItem(key);
			} catch {
			}
		},
		runAction(action, data) {
			return main_core.ajax.runAction(action, {
				method: 'POST',
				data
			});
		},
		notify(content, autoHide = true) {
			ui_notification.Center.notify({
				content,
				autoHide,
				closeButton: !autoHide
			});
		}
	};
	class CurrencyList {
		static #instances = new Map();
		#options;
		#runtime;
		#initialized = false;
		#restoreRowActions = null;
		#confirmationDialog = null;
		#batchProcess = null;
		#batchPreflight = null;
		#pendingBatchDeletion = null;
		#retainedBatchProcessIds = new Set();
		#batchProcessToken = null;
		#batchCancellationRequested = false;
		#batchTerminalHandled = false;
		#batchResult = null;
		#dialogOpener = null;
		#settingsWindow = null;
		#menuEnhancements = new Map();
		constructor(options, runtime = defaultRuntime) {
			this.#options = options;
			this.#runtime = runtime;
		}
		static create(options) {
			CurrencyList.#instances.get(options.gridId)?.destroy();
			const controller = new CurrencyList(options);
			CurrencyList.#instances.set(options.gridId, controller);
			controller.init();
			return controller;
		}
		static openForm(url) {
			for (const controller of CurrencyList.#instances.values()) {
				if (controller.#initialized && (controller.#isAddUrl(url) || controller.#isEditUrl(url))) {
					controller.#openForm(url);
					return true;
				}
			}
			return false;
		}
		init() {
			if (this.#initialized) {
				return;
			}
			const activeController = CurrencyList.#instances.get(this.#options.gridId);
			if (activeController && activeController !== this) {
				activeController.destroy();
			}
			CurrencyList.#instances.set(this.#options.gridId, this);
			this.#initialized = true;
			main_core.Event.bind(document, 'keydown', this.#handleAccessibilityKeyDown);
			main_core.Event.bind(document, 'pointerdown', this.#handleAccessibilityPointerDown);
			main_core.Event.bind(document, 'click', this.#handleAccessibilityClick);
			main_core_events.EventEmitter.subscribe(GRID_UPDATED_EVENT, this.#handleGridUpdated);
			main_core_events.EventEmitter.subscribe(GRID_SETTINGS_CLOSED_EVENT, this.#handleGridSettingsClosed);
			GRID_SELECTION_EVENTS.forEach(eventName => {
				main_core_events.EventEmitter.subscribe(eventName, this.#handleGridSelectionChanged);
			});
			this.#enhanceGridAccessibility();
			if (this.#options.canEdit) {
				main_core.Event.bind(document, 'click', this.#handleDocumentClick);
			}
			if (this.#options.canDelete) {
				this.#restoreRowActions = this.#runtime.interceptRowActions(this.#options.gridId, this.#handleRowAction);
				this.#runtime.subscribeBatchDeletion(this.#handleBatchDeletion);
				this.#restoreBatchDeletion();
			}
			main_core.Event.bind(window, 'unload', this.#handleWindowUnload);
		}
		destroy() {
			if (!this.#initialized) {
				return;
			}
			this.#initialized = false;
			main_core.Event.unbind(document, 'keydown', this.#handleAccessibilityKeyDown);
			main_core.Event.unbind(document, 'pointerdown', this.#handleAccessibilityPointerDown);
			main_core.Event.unbind(document, 'click', this.#handleAccessibilityClick);
			main_core.Event.unbind(document, 'click', this.#handleDocumentClick);
			main_core.Event.unbind(window, 'unload', this.#handleWindowUnload);
			main_core_events.EventEmitter.unsubscribe(GRID_UPDATED_EVENT, this.#handleGridUpdated);
			main_core_events.EventEmitter.unsubscribe(GRID_SETTINGS_CLOSED_EVENT, this.#handleGridSettingsClosed);
			GRID_SELECTION_EVENTS.forEach(eventName => {
				main_core_events.EventEmitter.unsubscribe(eventName, this.#handleGridSelectionChanged);
			});
			this.#runtime.unsubscribeBatchDeletion(this.#handleBatchDeletion);
			this.#restoreRowActions?.();
			this.#restoreRowActions = null;
			this.#settingsWindow?.removeAttribute('inert');
			this.#settingsWindow = null;
			this.#deactivateMenuEnhancements();
			this.#dialogOpener = null;
			this.#closeConfirmation();
			this.#batchPreflight = null;
			this.#pendingBatchDeletion = null;
			this.#deleteBatchProcess();
			this.#retainedBatchProcessIds.forEach(processId => {
				this.#retainedBatchProcessIds.delete(processId);
				this.#runtime.deleteBatchProcess(processId);
			});
			if (CurrencyList.#instances.get(this.#options.gridId) === this) {
				CurrencyList.#instances.delete(this.#options.gridId);
			}
		}
		getBatchController() {
			return this.#options.batchController;
		}
		#handleDocumentClick = event => {
			if (event.defaultPrevented || !this.#initialized || !(event.target instanceof Element)) {
				return;
			}
			const link = event.target.closest('a[href]');
			const url = link?.getAttribute('href');
			if (!main_core.Type.isStringFilled(url) || !this.#isAddUrl(url) && !this.#isEditUrl(url)) {
				return;
			}
			event.preventDefault();
			this.#openForm(url);
		};
		#handleAccessibilityPointerDown = event => {
			if (!this.#initialized || !(event.target instanceof Element)) {
				return;
			}
			const gridRoot = this.#getGridRoot();
			const rowActionOpener = event.target.closest('.main-grid-row-action-button');
			const batchAction = event.target.closest('#grid_remove_button');
			const opener = rowActionOpener ?? batchAction?.querySelector('#grid_remove_button_control') ?? null;
			if (!opener || !gridRoot?.contains(opener)) {
				return;
			}
			opener.focus({
				preventScroll: true
			});
			this.#dialogOpener = opener;
		};
		#handleAccessibilityClick = event => {
			if (!this.#initialized || !(event.target instanceof Element)) {
				return;
			}
			const control = this.#getAccessibilityControl(event.target);
			if (!control) {
				return;
			}
			const controlType = control.getAttribute(A11Y_CONTROL_ATTRIBUTE);
			if (controlType === 'settings') {
				this.#showSettingsWindowAccessibility(control);
				return;
			}
			if (controlType === 'row-actions') {
				this.#dialogOpener = control;
				const rowId = control.closest('tr[data-id]')?.dataset.id;
				if (main_core.Type.isStringFilled(rowId)) {
					this.#scheduleMenuEnhancement(`main-grid-actions-menu-${rowId}`, control, event.detail === 0);
				}
				return;
			}
			if (controlType === 'page-size') {
				this.#scheduleMenuEnhancement(`${control.id}_menu`, control, event.detail === 0);
			}
		};
		#handleAccessibilityKeyDown = event => {
			if (!this.#initialized || !(event.target instanceof Element)) {
				return;
			}
			const control = this.#getAccessibilityControl(event.target);
			if (!control || this.#isAccessibilityControlDisabled(control)) {
				return;
			}
			const controlType = control.getAttribute(A11Y_CONTROL_ATTRIBUTE);
			if (controlType === 'row-actions') {
				this.#dialogOpener = control;
			}
			const isActivationKey = event.key === 'Enter' || event.key === ' ';
			const isOpenKey = event.key === 'ArrowDown' && (controlType === 'row-actions' || controlType === 'page-size');
			if (!isActivationKey && !isOpenKey) {
				return;
			}
			event.preventDefault();
			control.click();
			if (controlType === 'row-actions') {
				const rowId = control.closest('tr[data-id]')?.dataset.id;
				if (main_core.Type.isStringFilled(rowId)) {
					this.#scheduleMenuEnhancement(`main-grid-actions-menu-${rowId}`, control, true);
				}
			} else if (controlType === 'page-size') {
				this.#scheduleMenuEnhancement(`${control.id}_menu`, control, true);
			}
		};
		#handleGridUpdated = event => {
			const [grid] = event.getData();
			if (grid?.getId?.() !== this.#options.gridId) {
				return;
			}
			this.#deactivateMenuEnhancements();
			this.#enhanceGridAccessibility();
		};
		#handleGridSettingsClosed = event => {
			const [, manager] = event.getData();
			if (manager?.parent?.getId?.() !== this.#options.gridId) {
				return;
			}
			this.#settingsWindow?.setAttribute('inert', '');
			this.#getGridRoot()?.querySelector('.main-grid-interface-settings-icon')?.setAttribute('aria-expanded', 'false');
		};
		#handleGridSelectionChanged = event => {
			const [first, second] = event.getData();
			const grid = [second, first].find(candidate => candidate?.getId?.() === this.#options.gridId);
			if (!grid) {
				return;
			}
			window.requestAnimationFrame(() => {
				if (this.#initialized) {
					this.#syncPanelActionAccessibility();
				}
			});
		};
		#handleRowAction = (action, data, proceed) => {
			if (action === 'set-base') {
				proceed({
					onSuccess: () => {
						if (this.#initialized) {
							this.#runtime.getGrid(this.#options.gridId)?.reload();
						}
					}
				});
				return;
			}
			if (action !== 'delete') {
				proceed();
				return;
			}
			const {
				currencyCode
			} = data;
			if (!main_core.Type.isStringFilled(currencyCode)) {
				proceed();
				return;
			}
			this.#showConfirmation(main_core.Loc.getMessage('CRM_CURRENCY_LIST_DELETE_CONFIRM') ?? '', main_core.Loc.getMessage('CRM_CURRENCY_LIST_DELETE_CONFIRM_DESCRIPTION') ?? '', main_core.Loc.getMessage('CRM_CURRENCY_LIST_DELETE_CONFIRM_BUTTON') ?? '', () => {
				if (!this.#initialized) {
					return;
				}
				proceed({
					onError: message => {
						this.#runtime.notify(main_core.Type.isStringFilled(message) ? message : main_core.Loc.getMessage('CRM_CURRENCY_LIST_DELETE_ERROR') ?? '');
					}
				});
			});
		};
		#handleWindowUnload = () => {
			this.destroy();
		};
		#handleBatchDeletion = event => {
			if (!this.#initialized || this.#batchProcess !== null || event.getData().gridId !== this.#options.gridId) {
				return;
			}
			if (main_core.Type.isStringFilled(this.#runtime.readBatchToken(this.#options.batchStorageKey))) {
				this.#restoreBatchDeletion(() => this.#handleBatchDeletion(event));
				return;
			}
			const grid = this.#runtime.getGrid(this.#options.gridId);
			if (!grid) {
				return;
			}
			const forAll = grid.getActionsPanel()?.getForAllCheckbox()?.checked ?? false;
			const currencyCodes = grid.getRows().getSelectedIds().filter(currencyCode => main_core.Type.isStringFilled(currencyCode));
			if (!forAll && currencyCodes.length === 0) {
				return;
			}
			this.#showConfirmation(main_core.Loc.getMessage('CRM_CURRENCY_LIST_BATCH_DELETE_CONFIRM') ?? '', main_core.Loc.getMessage('CRM_CURRENCY_LIST_BATCH_DELETE_CONFIRM_DESCRIPTION') ?? '', main_core.Loc.getMessage('CRM_CURRENCY_LIST_BATCH_DELETE_CONFIRM_BUTTON') ?? '', () => {
				if (!this.#initialized || this.#batchProcess !== null) {
					return;
				}
				this.#startBatchDeletion(forAll ? 'all' : 'selected', currencyCodes);
			});
		};
		#showConfirmation(title, message, confirmButtonText, onConfirm) {
			this.#closeConfirmation();
			const grid = this.#runtime.getGrid(this.#options.gridId);
			const closeButtonText = main_core.Type.isFunction(grid?.getParam) ? grid.getParam('CLOSE', '') : '';
			const opener = this.#resolveDialogOpener();
			this.#dialogOpener = null;
			const dialogHolder = {
				current: null
			};
			const dialog = this.#runtime.showConfirmation({
				dialogId: `${this.#options.gridId.toLowerCase()}-confirmation`,
				title,
				message,
				confirmButtonText,
				closeButtonText: main_core.Type.isStringFilled(closeButtonText) ? closeButtonText : main_core.Loc.getMessage('CRM_CURRENCY_LIST_CANCEL_BUTTON') ?? '',
				opener,
				onConfirm,
				onClose: () => {
					if (this.#confirmationDialog === dialogHolder.current) {
						this.#confirmationDialog = null;
					}
				}
			});
			dialogHolder.current = dialog;
			this.#confirmationDialog = dialog;
		}
		#resolveDialogOpener() {
			const activeElement = document.activeElement instanceof HTMLElement ? document.activeElement : null;
			const gridRoot = this.#getGridRoot();
			if (activeElement && gridRoot?.contains(activeElement)) {
				return activeElement;
			}
			return this.#dialogOpener?.isConnected === true ? this.#dialogOpener : activeElement;
		}
		#enhanceGridAccessibility() {
			const gridRoot = this.#getGridRoot();
			if (!gridRoot) {
				return;
			}
			const settingsWindow = gridRoot.querySelector('.main-grid-settings-window');
			if (settingsWindow) {
				this.#settingsWindow = settingsWindow;
				main_core.Dom.addClass(settingsWindow, 'crm-currency-list-settings-window');
				settingsWindow.setAttribute('inert', '');
			}
			gridRoot.querySelectorAll('th.main-grid-col-sortable').forEach(header => {
				this.#setAccessibilityControl(header, 'sort');
				const sortIndicator = header.querySelector('.main-grid-control-sort');
				let sortDirection = 'none';
				if (sortIndicator && main_core.Dom.hasClass(sortIndicator, 'main-grid-control-sort-asc')) {
					sortDirection = 'ascending';
				} else if (sortIndicator && main_core.Dom.hasClass(sortIndicator, 'main-grid-control-sort-desc')) {
					sortDirection = 'descending';
				}
				header.setAttribute('aria-sort', sortDirection);
			});
			const settingsButton = gridRoot.querySelector('.main-grid-interface-settings-icon');
			if (settingsButton) {
				this.#setAccessibilityControl(settingsButton, 'settings', this.#getGridStringParam('SETTINGS_TITLE'));
				settingsButton.setAttribute('aria-haspopup', 'dialog');
				settingsButton.setAttribute('aria-expanded', 'false');
			}
			const pageSize = gridRoot.querySelector('.main-grid-panel-select-pagesize');
			if (pageSize) {
				const pageSizeTitle = pageSize.closest('.main-grid-panel-content')?.querySelector('.main-grid-panel-content-title')?.textContent?.trim() ?? '';
				this.#setAccessibilityControl(pageSize, 'page-size', `${pageSizeTitle} ${pageSize.textContent?.trim() ?? ''}`.trim());
				pageSize.setAttribute('aria-haspopup', 'menu');
				pageSize.setAttribute('aria-expanded', 'false');
			}
			this.#syncPanelActionAccessibility();
			const checkAll = gridRoot.querySelector('input.main-grid-check-all');
			if (checkAll && main_core.Type.isStringFilled(checkAll.title)) {
				checkAll.setAttribute('aria-label', checkAll.title);
			}
			gridRoot.querySelectorAll('tr[data-id]:not([hidden]) input.main-grid-row-checkbox:not(.main-grid-check-all)').forEach(checkbox => {
				const currencyCode = checkbox.closest('tr[data-id]')?.dataset.id ?? '';
				const label = [checkbox.title, currencyCode].filter(part => main_core.Type.isStringFilled(part)).join(' — ');
				if (main_core.Type.isStringFilled(label)) {
					checkbox.setAttribute('aria-label', label);
				}
			});
			const rowActionButtons = [...gridRoot.querySelectorAll('.main-grid-row-action-button')];
			const actionTitles = new Set();
			rowActionButtons.forEach(button => {
				const currencyCode = button.closest('tr[data-id]')?.dataset.id ?? '';
				const titles = this.#getRowActionTitles(button);
				titles.forEach(title => actionTitles.add(title));
				const label = [...titles, currencyCode].filter(part => main_core.Type.isStringFilled(part)).join(' — ');
				this.#setAccessibilityControl(button, 'row-actions', label);
				button.setAttribute('aria-haspopup', 'menu');
				button.setAttribute('aria-expanded', 'false');
			});
			const actionHeader = gridRoot.querySelector('th.main-grid-cell-action');
			if (actionHeader && actionTitles.size > 0) {
				actionHeader.setAttribute('aria-label', [...actionTitles].join(', '));
			}
			gridRoot.querySelectorAll('th.main-grid-special-empty').forEach(header => {
				header.setAttribute('role', 'presentation');
				header.setAttribute('aria-hidden', 'true');
			});
			this.#enhanceTechnicalFrames(gridRoot);
		}
		#enhanceTechnicalFrames(gridRoot) {
			gridRoot.querySelectorAll('iframe[id^="main-grid-tmp-frame-"]').forEach(frame => {
				frame.removeAttribute('role');
				frame.setAttribute('aria-hidden', 'true');
				frame.setAttribute('tabindex', '-1');
			});
		}
		#showSettingsWindowAccessibility(settingsButton) {
			if (!this.#settingsWindow) {
				return;
			}
			this.#settingsWindow.removeAttribute('inert');
			settingsButton.setAttribute('aria-expanded', 'true');
			this.#settingsWindow.querySelectorAll(['.main-grid-settings-window-actions-item-reset', '.main-grid-settings-window-actions-item-button.ui-btn', '.main-grid-settings-window-select-all', '.main-grid-settings-window-unselect-all'].join(', ')).forEach(control => this.#setAccessibilityControl(control, 'settings-action'));
		}
		#setAccessibilityControl(control, type, label = '') {
			control.setAttribute(A11Y_CONTROL_ATTRIBUTE, type);
			main_core.Dom.addClass(control, 'crm-currency-list-a11y-control');
			control.setAttribute('tabindex', '0');
			if (control.tagName !== 'TH' && control.tagName !== 'A') {
				control.setAttribute('role', 'button');
			}
			if (main_core.Type.isStringFilled(label)) {
				control.setAttribute('aria-label', label);
			}
		}
		#syncPanelActionAccessibility() {
			this.#getGridRoot()?.querySelectorAll('.main-grid-panel-control-container > .ui-btn').forEach(control => {
				this.#setAccessibilityControl(control, 'panel-action');
				const container = control.closest('.main-grid-panel-control-container');
				const actionPanel = control.closest('.main-grid-action-panel');
				const isDisabled = main_core.Dom.hasClass(control, 'main-grid-disable') || container !== null && main_core.Dom.hasClass(container, 'main-grid-disable') || actionPanel !== null && main_core.Dom.hasClass(actionPanel, 'main-grid-disable');
				control.setAttribute('tabindex', isDisabled ? '-1' : '0');
				control.setAttribute('aria-disabled', String(isDisabled));
			});
		}
		#getGridStringParam(name) {
			const grid = this.#runtime.getGrid(this.#options.gridId);
			if (!grid || !main_core.Type.isFunction(grid.getParam)) {
				return '';
			}
			const value = grid.getParam(name, '');
			return main_core.Type.isStringFilled(value) ? value : '';
		}
		#getRowActionTitles(button) {
			const actions = button.dataset.actions;
			if (!main_core.Type.isStringFilled(actions)) {
				return [];
			}
			try {
				const serializedActions = actions.startsWith('(') && actions.endsWith(')') ? actions.slice(1, -1) : actions;
				const parsedActions = JSON.parse(serializedActions);
				if (!Array.isArray(parsedActions)) {
					return [];
				}
				return parsedActions.flatMap(action => {
					const title = main_core.Type.isPlainObject(action) ? action.text : null;
					return main_core.Type.isStringFilled(title) ? [title.trim()] : [];
				});
			} catch {
				return [];
			}
		}
		#getGridRoot() {
			const gridRoot = document.getElementById(this.#options.gridId);
			return gridRoot instanceof HTMLElement ? gridRoot : null;
		}
		#getAccessibilityControl(target) {
			const control = target.closest(`[${A11Y_CONTROL_ATTRIBUTE}]`);
			if (!control) {
				return null;
			}
			return this.#getGridRoot()?.contains(control) === true || this.#settingsWindow?.contains(control) === true ? control : null;
		}
		#isAccessibilityControlDisabled(control) {
			return main_core.Dom.hasClass(control, 'main-grid-disable') || control.getAttribute('aria-disabled') === 'true';
		}
		#scheduleMenuEnhancement(menuId, opener, focusMenu, attempt = 0) {
			window.requestAnimationFrame(() => {
				if (!this.#initialized) {
					return;
				}
				const popupMenuManager = main_core.Reflection.getClass('BX.PopupMenu');
				const menu = popupMenuManager?.getMenuById(menuId);
				if (!menu || !menu.getPopupWindow().isShown()) {
					if (attempt < 5) {
						this.#scheduleMenuEnhancement(menuId, opener, focusMenu, attempt + 1);
					}
					return;
				}
				const menuContainer = menu.getMenuContainer();
				if (this.#menuEnhancements.has(menuContainer)) {
					if (focusMenu) {
						this.#focusFirstMenuItem(menuContainer);
					}
					opener.setAttribute('aria-expanded', 'true');
					return;
				}
				const popupWindow = menu.getPopupWindow();
				const onKeyDown = event => this.#navigateMenu(event, menuContainer);
				const onAfterShow = () => {
					if (focusMenu) {
						this.#focusFirstMenuItem(menuContainer);
					}
				};
				const onClose = () => {
					this.#menuEnhancements.delete(menuContainer);
					opener.setAttribute('aria-expanded', 'false');
					popupWindow.unsubscribe('onAfterShow', onAfterShow);
					popupWindow.unsubscribe('onClose', onClose);
					main_core.Event.unbind(menuContainer, 'keydown', onKeyDown, true);
				};
				if (focusMenu) {
					this.#focusFirstMenuItem(menuContainer);
				}
				opener.setAttribute('aria-expanded', 'true');
				popupWindow.subscribe('onAfterShow', onAfterShow);
				popupWindow.subscribe('onClose', onClose);
				main_core.Event.bind(menuContainer, 'keydown', onKeyDown, true);
				this.#menuEnhancements.set(menuContainer, {
					popupWindow,
					menuContainer,
					opener,
					onAfterShow,
					onClose,
					onKeyDown
				});
			});
		}
		#focusFirstMenuItem(menuContainer) {
			const firstItem = menuContainer.querySelector('[role="menuitem"]:not([aria-disabled="true"])');
			if (firstItem) {
				firstItem.setAttribute('tabindex', '0');
				main_core.Dom.addClass(firstItem, '--focus --focus-visible');
				firstItem.focus({
					preventScroll: true
				});
			}
		}
		#navigateMenu(event, menuContainer) {
			const menuItems = [...menuContainer.querySelectorAll('[role="menuitem"]:not([aria-disabled="true"])')];
			if (menuItems.length === 0) {
				return;
			}
			const activeIndex = menuItems.indexOf(document.activeElement);
			let targetIndex = null;
			switch (event.key) {
				case 'ArrowDown':
					targetIndex = activeIndex < 0 ? 0 : (activeIndex + 1) % menuItems.length;
					break;
				case 'ArrowUp':
					targetIndex = activeIndex <= 0 ? menuItems.length - 1 : activeIndex - 1;
					break;
				case 'Home':
					targetIndex = 0;
					break;
				case 'End':
					targetIndex = menuItems.length - 1;
					break;
				case 'Enter':
				case ' ':
					if (activeIndex >= 0) {
						event.preventDefault();
						event.stopImmediatePropagation();
						menuItems[activeIndex].click();
					}
					return;
				default:
					return;
			}
			if (targetIndex === null) {
				return;
			}
			event.preventDefault();
			event.stopImmediatePropagation();
			menuItems.forEach((item, index) => {
				item.setAttribute('tabindex', index === targetIndex ? '0' : '-1');
				main_core.Dom.toggleClass(item, '--focus', index === targetIndex);
				main_core.Dom.toggleClass(item, '--focus-visible', index === targetIndex);
			});
			menuItems[targetIndex].focus({
				preventScroll: true
			});
		}
		#deactivateMenuEnhancements() {
			this.#menuEnhancements.forEach(({
				popupWindow,
				menuContainer,
				opener,
				onAfterShow,
				onClose,
				onKeyDown
			}) => {
				popupWindow.unsubscribe('onAfterShow', onAfterShow);
				popupWindow.unsubscribe('onClose', onClose);
				main_core.Event.unbind(menuContainer, 'keydown', onKeyDown, true);
				opener.setAttribute('aria-expanded', 'false');
			});
			this.#menuEnhancements.clear();
		}
		#closeConfirmation() {
			const dialog = this.#confirmationDialog;
			this.#confirmationDialog = null;
			dialog?.hide();
		}
		#handleBatchRequestStart = formData => {
			const generatedToken = formData.get('PROCESS_TOKEN');
			const storedToken = this.#runtime.readBatchToken(this.#options.batchStorageKey);
			const processToken = this.#batchProcessToken ?? (main_core.Type.isStringFilled(storedToken) ? storedToken : null) ?? (main_core.Type.isStringFilled(generatedToken) ? generatedToken : null);
			if (!main_core.Type.isStringFilled(processToken)) {
				return;
			}
			this.#batchProcessToken = processToken;
			formData.set('PROCESS_TOKEN', processToken);
			this.#batchProcess?.setParam('PROCESS_TOKEN', processToken);
			this.#runtime.writeBatchToken(this.#options.batchStorageKey, processToken);
		};
		#handleBatchStepCompleted = (status, result) => {
			if (this.#batchTerminalHandled || status !== ui_stepprocessing.ProcessResultStatus.completed) {
				return;
			}
			this.#batchResult = this.#normalizeBatchResult(result);
		};
		#handleBatchStateChanged = (state, result = {}) => {
			if (this.#batchTerminalHandled) {
				return;
			}
			if (state === ui_stepprocessing.ProcessState.error) {
				this.#finishBatchDeletion(true, false);
				return;
			}
			if (state !== ui_stepprocessing.ProcessState.completed) {
				return;
			}
			if (!this.#batchCancellationRequested) {
				const batchResult = this.#batchResult ?? this.#normalizeBatchResult(result);
				const dialog = this.#batchProcess?.getDialog();
				const summary = this.#getBatchResultSummary(batchResult);
				if (batchResult.itemErrors.length > 0) {
					dialog?.setError(this.#getBatchResultError(summary, batchResult.itemErrors), true);
				} else {
					dialog?.setSummary(summary);
				}
			}
			this.#finishBatchDeletion(true);
		};
		#startBatchDeletion(mode, currencyCodes = [], processToken = null) {
			const params = {
				gridId: this.#options.gridId
			};
			if (mode !== null) {
				params.mode = mode;
				if (mode === 'selected') {
					params.currencyCodes = currencyCodes;
				}
			}
			this.#batchProcessToken = processToken;
			this.#batchCancellationRequested = false;
			this.#batchTerminalHandled = false;
			this.#batchResult = null;
			const processId = `crm_currency_list_batch_deletion_${main_core.Text.getRandom().toLowerCase()}`;
			const process = this.#runtime.createBatchProcess({
				id: processId,
				controller: this.#options.batchController,
				method: 'POST',
				params,
				messages: {
					DialogTitle: main_core.Loc.getMessage('CRM_CURRENCY_LIST_BATCH_TITLE') ?? '',
					DialogSummary: main_core.Loc.getMessage('CRM_CURRENCY_LIST_BATCH_PREPARING') ?? ''
				},
				showButtons: {
					start: false,
					stop: true,
					close: true
				},
				queue: [{
					action: 'prepare',
					title: main_core.Loc.getMessage('CRM_CURRENCY_LIST_BATCH_PREPARING') ?? '',
					progressBarTitle: main_core.Loc.getMessage('CRM_CURRENCY_LIST_BATCH_PROGRESS') ?? '',
					method: 'POST',
					handlers: {
						RequestStart: this.#handleBatchRequestStart,
						StepCompleted: this.#handleBatchStepCompleted
					}
				}],
				handlers: {
					StateChanged: this.#handleBatchStateChanged,
					dialogClosed: () => {
						if (this.#retainedBatchProcessIds.delete(processId)) {
							this.#runtime.deleteBatchProcess(processId);
						}
					}
				}
			});
			this.#batchProcess = process;
			const stop = process.stop.bind(process);
			process.stop = () => {
				this.#batchCancellationRequested = true;
				return stop();
			};
			process.showDialog();
			process.getDialog().summaryBlock?.setAttribute('data-testid', 'crm-currency-list-batch-state');
			process.start();
		}
		#restoreBatchDeletion(onNotFound = null) {
			const processToken = this.#runtime.readBatchToken(this.#options.batchStorageKey);
			if (main_core.Type.isStringFilled(processToken)) {
				if (onNotFound !== null && this.#pendingBatchDeletion === null) {
					this.#pendingBatchDeletion = onNotFound;
				}
				if (this.#batchPreflight !== null) {
					return;
				}
				let operationNotFound = false;
				const preflight = this.#runtime.runAction(`${this.#options.batchController}.prepare`, {
					gridId: this.#options.gridId,
					PROCESS_TOKEN: processToken
				}).then(() => {
					if (this.#initialized && this.#batchProcess === null && this.#runtime.readBatchToken(this.#options.batchStorageKey) === processToken) {
						this.#pendingBatchDeletion = null;
						this.#startBatchDeletion(null, [], processToken);
					}
				}, response => {
					if (this.#initialized && this.#isBatchOperationNotFound(response) && this.#runtime.readBatchToken(this.#options.batchStorageKey) === processToken) {
						operationNotFound = true;
						this.#runtime.removeBatchToken(this.#options.batchStorageKey);
					} else {
						this.#pendingBatchDeletion = null;
					}
				}).then(() => {
					if (this.#batchPreflight !== preflight) {
						return;
					}
					this.#batchPreflight = null;
					const pendingBatchDeletion = this.#pendingBatchDeletion;
					this.#pendingBatchDeletion = null;
					if (operationNotFound && this.#initialized) {
						pendingBatchDeletion?.();
					}
				});
				this.#batchPreflight = preflight;
			} else if (processToken !== null) {
				this.#runtime.removeBatchToken(this.#options.batchStorageKey);
			}
		}
		#isBatchOperationNotFound(response) {
			if (!main_core.Type.isObjectLike(response)) {
				return false;
			}
			const errors = response.errors;
			return Array.isArray(errors) && errors.some(error => main_core.Type.isObjectLike(error) && error.code === BATCH_OPERATION_NOT_FOUND);
		}
		#deleteBatchProcess() {
			if (!this.#batchProcess) {
				return;
			}
			const process = this.#batchProcess;
			const processId = process.getId();
			this.#runtime.deleteBatchProcess(processId);
			if (this.#batchProcess !== process) {
				return;
			}
			this.#batchProcess = null;
			this.#batchProcessToken = null;
			this.#batchCancellationRequested = false;
			this.#batchResult = null;
		}
		#finishBatchDeletion(reloadGrid, removeToken = true) {
			if (this.#batchTerminalHandled) {
				return;
			}
			this.#batchTerminalHandled = true;
			if (removeToken) {
				this.#runtime.removeBatchToken(this.#options.batchStorageKey);
			}
			if (reloadGrid) {
				this.#runtime.getGrid(this.#options.gridId)?.reload();
			}
			const process = this.#batchProcess;
			if (process) {
				this.#retainedBatchProcessIds.add(process.getId());
				this.#batchProcess = null;
				this.#batchProcessToken = null;
				this.#batchCancellationRequested = false;
				this.#batchResult = null;
			}
		}
		#normalizeBatchResult(result) {
			const itemErrors = Array.isArray(result.ITEM_ERRORS) ? result.ITEM_ERRORS.flatMap(itemError => {
				if (!main_core.Type.isPlainObject(itemError) || !main_core.Type.isString(itemError.currencyCode) || !main_core.Type.isString(itemError.message)) {
					return [];
				}
				return [{
					currencyCode: itemError.currencyCode,
					message: itemError.message
				}];
			}) : [];
			return {
				successfulItems: this.#normalizeBatchCount(result.SUCCESSFUL_ITEMS),
				failedItems: this.#normalizeBatchCount(result.FAILED_ITEMS),
				itemErrors
			};
		}
		#normalizeBatchCount(value) {
			return main_core.Type.isNumber(value) && value >= 0 ? Math.floor(value) : 0;
		}
		#getBatchResultSummary(result) {
			return main_core.Loc.getMessage('CRM_CURRENCY_LIST_BATCH_RESULT', {
				'#SUCCESSFUL#': String(result.successfulItems),
				'#FAILED#': String(result.failedItems)
			}) ?? '';
		}
		#getBatchResultError(summary, itemErrors) {
			return [summary, ...itemErrors.map(({
				currencyCode,
				message
			}) => `${currencyCode}: ${message}`)].map(message => main_core.Text.encode(message)).join('<br>');
		}
		#openForm(url) {
			this.#runtime.openSlider(url, {
				cacheable: false,
				events: {
					onCloseComplete: () => {
						if (this.#initialized) {
							this.#runtime.getGrid(this.#options.gridId)?.reload();
						}
					}
				}
			});
		}
		#isAddUrl(url) {
			return this.#normalizeUrl(url) === this.#normalizeUrl(this.#options.addUrl);
		}
		#isEditUrl(url) {
			const placeholder = 'CRM_CURRENCY_ID_PLACEHOLDER';
			const templateUrl = this.#normalizeUrl(this.#options.editUrlTemplate.replace('#currency_id#', placeholder));
			const pattern = this.#escapeRegExp(templateUrl).replace(placeholder, '[A-Z]{3}');
			return new RegExp(`^${pattern}$`).test(this.#normalizeUrl(url));
		}
		#normalizeUrl(url) {
			return new URL(url, window.location.href).toString();
		}
		#escapeRegExp(value) {
			return value.replaceAll(/[$()*+.?[\\\]^{|}]/g, '\\$&');
		}
	}

	exports.CurrencyList = CurrencyList;

})(this.BX.Crm = this.BX.Crm || {}, BX, BX.Event, BX.SidePanel, BX.UI, BX.UI.Accessibility, BX.UI.Notification, BX.UI.System, BX.UI.StepProcessing);
//# sourceMappingURL=currency-list.bundle.js.map
