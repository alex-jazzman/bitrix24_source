import {
	ajax,
	Dom,
	Event,
	Loc,
	Reflection,
	Tag,
	Text,
	Type,
} from 'main.core';
import { type BaseEvent, EventEmitter } from 'main.core.events';
import { SidePanel } from 'main.sidepanel';
import {
	AirButtonStyle,
	Button,
	ButtonSize,
	type ButtonOptions,
} from 'ui.buttons';
import { FocusNavigator } from 'ui.a11y';
import { Center } from 'ui.notification';
import { Dialog, type DialogOptions } from 'ui.system.dialog';
import {
	ProcessManager,
	ProcessResultStatus,
	ProcessState,
} from 'ui.stepprocessing';

export type CurrencyListOptions = {
	gridId: string;
	addUrl: string;
	editUrlTemplate: string;
	batchController: string;
	batchStorageKey: string;
	canEdit: boolean;
	canDelete: boolean;
};

type GridInstance = {
	reload(): void;
	sendRowAction(action: string, data: { currencyCode: string }): void;
	getData(): GridData;
	getParam(name: string, defaultValue?: unknown): unknown;
	getId?(): string;
	getRows(): { getSelectedIds(): Array<string | number> };
	getActionsPanel(): { getForAllCheckbox(): { checked: boolean } | null } | null;
};

type GridData = {
	request(
		url: string,
		method: string,
		data: Record<string, unknown>,
		action: string,
		onSuccess?: (...args: unknown[]) => void,
		onError?: (...args: unknown[]) => void,
	): void;
};

type RowActionCallbacks = {
	onSuccess?(): void;
	onError?(message: string): void;
};

type RowActionHandler = (
	action: string,
	data: { currencyCode?: string },
	proceed: (callbacks?: RowActionCallbacks) => void,
) => void;

type BatchDeletionEvent = BaseEvent & {
	getData(): { gridId?: string };
};

type BatchDialog = {
	summaryBlock?: HTMLElement;
	setSummary(content: string, isHtml?: boolean): BatchDialog;
	setError(content: string, isHtml?: boolean): BatchDialog;
};

type BatchProcess = {
	getId(): string;
	setParam(name: string, value: unknown): BatchProcess;
	getDialog(): BatchDialog;
	showDialog(): BatchProcess;
	start(): BatchProcess;
	stop(): BatchProcess;
};

type BatchItemError = {
	currencyCode: string;
	message: string;
};

type BatchResult = {
	successfulItems: number;
	failedItems: number;
	itemErrors: BatchItemError[];
};

type BatchProcessOptions = {
	id: string;
	controller: string;
	method: 'POST';
	params: Record<string, unknown>;
	messages: Record<string, string>;
	showButtons: {
		start: boolean;
		stop: boolean;
		close: boolean;
	};
	queue: Array<{
		action: string;
		title: string;
		progressBarTitle: string;
		method: 'POST';
		handlers: {
			RequestStart(formData: FormData): void;
			StepCompleted(status: string, result: Record<string, unknown>): void;
		};
	}>;
	handlers: {
		StateChanged(state: string, result?: Record<string, unknown>): void;
		dialogClosed(): void;
	};
};

type CurrencyListRuntime = {
	openSlider(url: string, options: {
		cacheable: boolean,
		events: { onCloseComplete(): void },
	}): void;
	showConfirmation(options: ConfirmationOptions): SystemDialogHandle;
	getGrid(gridId: string): GridInstance | null;
	interceptRowActions(gridId: string, callback: RowActionHandler): (() => void) | null;
	subscribeBatchDeletion(callback: (event: BatchDeletionEvent) => void): void;
	unsubscribeBatchDeletion(callback: (event: BatchDeletionEvent) => void): void;
	createBatchProcess(options: BatchProcessOptions): BatchProcess;
	deleteBatchProcess(processId: string): void;
	readBatchToken(key: string): string | null;
	writeBatchToken(key: string, token: string): void;
	removeBatchToken(key: string): void;
	runAction(action: string, data: Record<string, unknown>): Promise<unknown>;
	notify(content: string | Element, autoHide?: boolean): void;
};

type AjaxErrorResponse = {
	errors?: Array<{ code?: unknown }>;
};

type ConfirmationOptions = {
	dialogId: string;
	title: string;
	message: string;
	confirmButtonText: string;
	closeButtonText: string;
	opener: HTMLElement | null;
	onConfirm(): void;
	onClose(): void;
};

type SystemDialogHandle = {
	hide(): void;
};

type GridManager = {
	getById(gridId: string): { instance: GridInstance } | null;
};

type PopupWindow = {
	isShown(): boolean;
	subscribe(eventName: string, handler: (event: BaseEvent) => void): void;
	unsubscribe(eventName: string, handler: (event: BaseEvent) => void): void;
};

type PopupMenu = {
	getMenuContainer(): HTMLElement;
	getPopupWindow(): PopupWindow;
};

type PopupMenuManager = {
	getMenuById(menuId: string): PopupMenu | null;
};

type MenuEnhancement = {
	popupWindow: PopupWindow;
	menuContainer: HTMLElement;
	opener: HTMLElement;
	onAfterShow(event: BaseEvent): void;
	onClose(event: BaseEvent): void;
	onKeyDown(event: KeyboardEvent): void;
};

const BATCH_DELETION_EVENT = 'BX.Crm.EntityList.Panel:CurrencyList:executeBatchDeletion';
const GRID_UPDATED_EVENT = 'Grid::updated';
const GRID_SETTINGS_CLOSED_EVENT = 'BX.Grid.SettingsWindow:close';
const GRID_SELECTION_EVENTS = [
	'Grid::selectRow',
	'Grid::unselectRow',
	'Grid::allRowsSelected',
	'Grid::allRowsUnselected',
];
const A11Y_CONTROL_ATTRIBUTE = 'data-crm-currency-list-a11y-control';
const BATCH_OPERATION_NOT_FOUND = 'CRM_CURRENCY_BATCH_NOT_FOUND';

const getGridErrorMessage = (grid: GridInstance): string => {
	const messages = grid.getParam('MESSAGES', []);
	if (!Array.isArray(messages))
	{
		return '';
	}

	const message = messages.find((item): item is { TEXT: string } => (
		Type.isPlainObject(item) && Type.isStringFilled(item.TEXT)
	));

	return message?.TEXT ?? '';
};

const defaultRuntime: CurrencyListRuntime = {
	openSlider(url: string, options: {
		cacheable: boolean,
		events: { onCloseComplete(): void },
	}): void
	{
		const topSidePanel = Reflection.getClass('top.BX.SidePanel.Instance') as typeof SidePanel.Instance | null;
		(topSidePanel ?? SidePanel.Instance).open(url, options);
	},
	showConfirmation(options: ConfirmationOptions): SystemDialogHandle
	{
		const content = Tag.render`
			<div data-testid="crm-currency-list-confirmation-message">${options.message}</div>
		`;
		const enhanceDialog = (): void => {
			const dialogContainer = content.closest<HTMLElement>('.ui-system-dialog');
			if (!dialogContainer)
			{
				return;
			}

			dialogContainer.setAttribute('data-testid', 'crm-currency-list-confirmation');
			const titleElement = dialogContainer.querySelector<HTMLElement>(
				'.ui-system-dialog__header-left > :first-child',
			);
			if (titleElement)
			{
				const titleId = `${options.dialogId}-title`;
				titleElement.id = titleId;
				dialogContainer.setAttribute('aria-labelledby', titleId);
			}

			const closeButton = dialogContainer.querySelector<HTMLButtonElement>(
				'.ui-system-dialog__header-close-btn',
			);
			if (closeButton)
			{
				closeButton.type = 'button';
				closeButton.setAttribute('data-testid', 'crm-currency-list-confirmation-close');
				closeButton.setAttribute('aria-label', options.closeButtonText);
			}
		};
		const dialog = new Dialog({
			title: options.title,
			content,
			hasCloseButton: true,
			hasOverlay: true,
			closeByEsc: true,
			closeByClickOutside: true,
			width: 480,
			events: {
				onAfterShow: enhanceDialog,
				onAfterHide: (): void => {
					options.onClose();
					FocusNavigator.restoreFocus(options.opener, { preventScroll: true });
				},
			},
		} as unknown as DialogOptions);
		const confirmButton = new Button({
			text: options.confirmButtonText,
			size: ButtonSize.LARGE,
			style: AirButtonStyle.FILLED,
			useAirDesign: true,
			dataset: {
				testid: 'crm-currency-list-confirm',
			},
			onclick: () => {
				dialog.hide();
				options.onConfirm();

				return {};
			},
		} as unknown as ButtonOptions);
		const cancelButton = new Button({
			text: Loc.getMessage('CRM_CURRENCY_LIST_CANCEL_BUTTON') ?? '',
			size: ButtonSize.LARGE,
			style: AirButtonStyle.OUTLINE,
			useAirDesign: true,
			dataset: {
				testid: 'crm-currency-list-cancel',
			},
			onclick: () => {
				dialog.hide();

				return {};
			},
		} as unknown as ButtonOptions);
		dialog.setCenterButtons([confirmButton, cancelButton]);
		dialog.show();
		enhanceDialog();

		return dialog;
	},
	getGrid(gridId: string): GridInstance | null
	{
		const gridManager = BX.Main.gridManager as GridManager;

		return gridManager.getById(gridId)?.instance ?? null;
	},
	interceptRowActions(gridId: string, callback: RowActionHandler): (() => void) | null
	{
		const grid = defaultRuntime.getGrid(gridId);
		if (!grid)
		{
			return null;
		}

		const sendRowAction = grid.sendRowAction;
		const interceptedSendRowAction = (action: string, data: { currencyCode: string }): void => {
			callback(action, data, (callbacks = {}): void => {
				const gridData = grid.getData();
				const request = gridData.request;
				const restoreRequest = (): void => {
					if (gridData.request === interceptedRequest)
					{
						gridData.request = request;
					}
				};

				const interceptedRequest: GridData['request'] = function(
					url,
					method,
					requestData,
					requestAction,
					onSuccess,
					onError,
				): void {
					restoreRequest();
					request.call(
						gridData,
						url,
						method,
						requestData,
						requestAction,
						function(this: GridData, ...args): void {
							onSuccess?.apply(this, args);
							callbacks.onSuccess?.();
						},
						function(this: GridData, ...args): void {
							onError?.apply(this, args);
							callbacks.onError?.(getGridErrorMessage(grid));
						},
					);
				};
				gridData.request = interceptedRequest;

				try
				{
					sendRowAction.call(grid, action, data);
				}
				catch
				{
					restoreRequest();
					callbacks.onError?.('');
				}
			});
		};
		grid.sendRowAction = interceptedSendRowAction;

		return (): void => {
			if (grid.sendRowAction === interceptedSendRowAction)
			{
				grid.sendRowAction = sendRowAction;
			}
		};
	},
	subscribeBatchDeletion(callback: (event: BatchDeletionEvent) => void): void
	{
		EventEmitter.subscribe(BATCH_DELETION_EVENT, callback);
	},
	unsubscribeBatchDeletion(callback: (event: BatchDeletionEvent) => void): void
	{
		EventEmitter.unsubscribe(BATCH_DELETION_EVENT, callback);
	},
	createBatchProcess(options: BatchProcessOptions): BatchProcess
	{
		return ProcessManager.create(options) as unknown as BatchProcess;
	},
	deleteBatchProcess(processId: string): void
	{
		ProcessManager.delete(processId);
	},
	readBatchToken(key: string): string | null
	{
		try
		{
			return window.sessionStorage.getItem(key);
		}
		catch
		{
			return null;
		}
	},
	writeBatchToken(key: string, token: string): void
	{
		try
		{
			window.sessionStorage.setItem(key, token);
		}
		catch
		{
			// The process can continue when browser storage is unavailable.
		}
	},
	removeBatchToken(key: string): void
	{
		try
		{
			window.sessionStorage.removeItem(key);
		}
		catch
		{
			// Browser storage may be unavailable in restricted contexts.
		}
	},
	runAction(action: string, data: Record<string, unknown>): Promise<unknown>
	{
		return ajax.runAction(action, {
			method: 'POST',
			data,
		});
	},
	notify(content: string | Element, autoHide: boolean = true): void
	{
		Center.notify({
			content,
			autoHide,
			closeButton: !autoHide,
		});
	},
};

export class CurrencyList
{
	static #instances: Map<string, CurrencyList> = new Map();

	#options: CurrencyListOptions;
	#runtime: CurrencyListRuntime;
	#initialized: boolean = false;
	#restoreRowActions: (() => void) | null = null;
	#confirmationDialog: SystemDialogHandle | null = null;
	#batchProcess: BatchProcess | null = null;
	#batchPreflight: Promise<void> | null = null;
	#pendingBatchDeletion: (() => void) | null = null;
	#retainedBatchProcessIds: Set<string> = new Set();
	#batchProcessToken: string | null = null;
	#batchCancellationRequested: boolean = false;
	#batchTerminalHandled: boolean = false;
	#batchResult: BatchResult | null = null;
	#dialogOpener: HTMLElement | null = null;
	#settingsWindow: HTMLElement | null = null;
	#menuEnhancements: Map<HTMLElement, MenuEnhancement> = new Map();

	constructor(options: CurrencyListOptions, runtime: CurrencyListRuntime = defaultRuntime)
	{
		this.#options = options;
		this.#runtime = runtime;
	}

	static create(options: CurrencyListOptions): CurrencyList
	{
		CurrencyList.#instances.get(options.gridId)?.destroy();

		const controller = new CurrencyList(options);
		CurrencyList.#instances.set(options.gridId, controller);
		controller.init();

		return controller;
	}

	static openForm(url: string): boolean
	{
		for (const controller of CurrencyList.#instances.values())
		{
			if (
				controller.#initialized
				&& (controller.#isAddUrl(url) || controller.#isEditUrl(url))
			)
			{
				controller.#openForm(url);

				return true;
			}
		}

		return false;
	}

	init(): void
	{
		if (this.#initialized)
		{
			return;
		}

		const activeController = CurrencyList.#instances.get(this.#options.gridId);
		if (activeController && activeController !== this)
		{
			activeController.destroy();
		}
		CurrencyList.#instances.set(this.#options.gridId, this);
		this.#initialized = true;
		Event.bind(document, 'keydown', this.#handleAccessibilityKeyDown);
		Event.bind(document, 'pointerdown', this.#handleAccessibilityPointerDown);
		Event.bind(document, 'click', this.#handleAccessibilityClick);
		EventEmitter.subscribe(GRID_UPDATED_EVENT, this.#handleGridUpdated);
		EventEmitter.subscribe(GRID_SETTINGS_CLOSED_EVENT, this.#handleGridSettingsClosed);
		GRID_SELECTION_EVENTS.forEach((eventName) => {
			EventEmitter.subscribe(eventName, this.#handleGridSelectionChanged);
		});
		this.#enhanceGridAccessibility();

		if (this.#options.canEdit)
		{
			Event.bind(document, 'click', this.#handleDocumentClick);
		}

		if (this.#options.canDelete)
		{
			this.#restoreRowActions = this.#runtime.interceptRowActions(
				this.#options.gridId,
				this.#handleRowAction,
			);
			this.#runtime.subscribeBatchDeletion(this.#handleBatchDeletion);
			this.#restoreBatchDeletion();
		}

		Event.bind(window, 'unload', this.#handleWindowUnload);
	}

	destroy(): void
	{
		if (!this.#initialized)
		{
			return;
		}

		this.#initialized = false;
		Event.unbind(document, 'keydown', this.#handleAccessibilityKeyDown);
		Event.unbind(document, 'pointerdown', this.#handleAccessibilityPointerDown);
		Event.unbind(document, 'click', this.#handleAccessibilityClick);
		Event.unbind(document, 'click', this.#handleDocumentClick);
		Event.unbind(window, 'unload', this.#handleWindowUnload);
		EventEmitter.unsubscribe(GRID_UPDATED_EVENT, this.#handleGridUpdated);
		EventEmitter.unsubscribe(GRID_SETTINGS_CLOSED_EVENT, this.#handleGridSettingsClosed);
		GRID_SELECTION_EVENTS.forEach((eventName) => {
			EventEmitter.unsubscribe(eventName, this.#handleGridSelectionChanged);
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
		this.#retainedBatchProcessIds.forEach((processId) => {
			this.#retainedBatchProcessIds.delete(processId);
			this.#runtime.deleteBatchProcess(processId);
		});
		if (CurrencyList.#instances.get(this.#options.gridId) === this)
		{
			CurrencyList.#instances.delete(this.#options.gridId);
		}
	}

	getBatchController(): string
	{
		return this.#options.batchController;
	}

	#handleDocumentClick = (event: MouseEvent): void => {
		if (event.defaultPrevented || !this.#initialized || !(event.target instanceof Element))
		{
			return;
		}

		const link = event.target.closest<HTMLAnchorElement>('a[href]');
		const url = link?.getAttribute('href');
		if (!Type.isStringFilled(url) || (!this.#isAddUrl(url) && !this.#isEditUrl(url)))
		{
			return;
		}

		event.preventDefault();
		this.#openForm(url);
	};

	#handleAccessibilityPointerDown = (event: PointerEvent): void => {
		if (!this.#initialized || !(event.target instanceof Element))
		{
			return;
		}

		const gridRoot = this.#getGridRoot();
		const rowActionOpener = event.target.closest<HTMLElement>('.main-grid-row-action-button');
		const batchAction = event.target.closest<HTMLElement>('#grid_remove_button');
		const opener = rowActionOpener
			?? batchAction?.querySelector<HTMLElement>('#grid_remove_button_control')
			?? null;
		if (!opener || !gridRoot?.contains(opener))
		{
			return;
		}

		opener.focus({ preventScroll: true });
		this.#dialogOpener = opener;
	};

	#handleAccessibilityClick = (event: MouseEvent): void => {
		if (!this.#initialized || !(event.target instanceof Element))
		{
			return;
		}

		const control = this.#getAccessibilityControl(event.target);
		if (!control)
		{
			return;
		}

		const controlType = control.getAttribute(A11Y_CONTROL_ATTRIBUTE);
		if (controlType === 'settings')
		{
			this.#showSettingsWindowAccessibility(control);

			return;
		}

		if (controlType === 'row-actions')
		{
			this.#dialogOpener = control;
			const rowId = control.closest<HTMLElement>('tr[data-id]')?.dataset.id;
			if (Type.isStringFilled(rowId))
			{
				this.#scheduleMenuEnhancement(`main-grid-actions-menu-${rowId}`, control, event.detail === 0);
			}

			return;
		}

		if (controlType === 'page-size')
		{
			this.#scheduleMenuEnhancement(`${control.id}_menu`, control, event.detail === 0);
		}
	};

	#handleAccessibilityKeyDown = (event: KeyboardEvent): void => {
		if (!this.#initialized || !(event.target instanceof Element))
		{
			return;
		}

		const control = this.#getAccessibilityControl(event.target);
		if (!control || this.#isAccessibilityControlDisabled(control))
		{
			return;
		}

		const controlType = control.getAttribute(A11Y_CONTROL_ATTRIBUTE);
		if (controlType === 'row-actions')
		{
			this.#dialogOpener = control;
		}

		const isActivationKey = event.key === 'Enter' || event.key === ' ';
		const isOpenKey = event.key === 'ArrowDown'
			&& (controlType === 'row-actions' || controlType === 'page-size')
		;
		if (!isActivationKey && !isOpenKey)
		{
			return;
		}

		event.preventDefault();
		control.click();
		if (controlType === 'row-actions')
		{
			const rowId = control.closest<HTMLElement>('tr[data-id]')?.dataset.id;
			if (Type.isStringFilled(rowId))
			{
				this.#scheduleMenuEnhancement(`main-grid-actions-menu-${rowId}`, control, true);
			}
		}
		else if (controlType === 'page-size')
		{
			this.#scheduleMenuEnhancement(`${control.id}_menu`, control, true);
		}
	};

	#handleGridUpdated = (event: BaseEvent): void => {
		const [grid] = event.getData() as [GridInstance?];
		if (grid?.getId?.() !== this.#options.gridId)
		{
			return;
		}

		this.#deactivateMenuEnhancements();
		this.#enhanceGridAccessibility();
	};

	#handleGridSettingsClosed = (event: BaseEvent): void => {
		const [, manager] = event.getData() as [unknown, { parent?: GridInstance }?];
		if (manager?.parent?.getId?.() !== this.#options.gridId)
		{
			return;
		}

		this.#settingsWindow?.setAttribute('inert', '');
		this.#getGridRoot()
			?.querySelector<HTMLElement>('.main-grid-interface-settings-icon')
			?.setAttribute('aria-expanded', 'false');
	};

	#handleGridSelectionChanged = (event: BaseEvent): void => {
		const [first, second] = event.getData() as [GridInstance?, GridInstance?];
		const grid = [second, first].find((candidate) => candidate?.getId?.() === this.#options.gridId);
		if (!grid)
		{
			return;
		}

		window.requestAnimationFrame(() => {
			if (this.#initialized)
			{
				this.#syncPanelActionAccessibility();
			}
		});
	};

	#handleRowAction: RowActionHandler = (action, data, proceed): void => {
		if (action === 'set-base')
		{
			proceed({
				onSuccess: (): void => {
					if (this.#initialized)
					{
						this.#runtime.getGrid(this.#options.gridId)?.reload();
					}
				},
			});

			return;
		}

		if (action !== 'delete')
		{
			proceed();

			return;
		}

		const { currencyCode } = data;
		if (!Type.isStringFilled(currencyCode))
		{
			proceed();

			return;
		}

		this.#showConfirmation(
			Loc.getMessage('CRM_CURRENCY_LIST_DELETE_CONFIRM') ?? '',
			Loc.getMessage('CRM_CURRENCY_LIST_DELETE_CONFIRM_DESCRIPTION') ?? '',
			Loc.getMessage('CRM_CURRENCY_LIST_DELETE_CONFIRM_BUTTON') ?? '',
			(): void => {
				if (!this.#initialized)
				{
					return;
				}

				proceed({
					onError: (message): void => {
						this.#runtime.notify(
							Type.isStringFilled(message)
								? message
								: Loc.getMessage('CRM_CURRENCY_LIST_DELETE_ERROR') ?? '',
						);
					},
				});
			},
		);
	};

	#handleWindowUnload = (): void => {
		this.destroy();
	};

	#handleBatchDeletion = (event: BatchDeletionEvent): void => {
		if (
			!this.#initialized
			|| this.#batchProcess !== null
			|| event.getData().gridId !== this.#options.gridId
		)
		{
			return;
		}

		if (Type.isStringFilled(this.#runtime.readBatchToken(this.#options.batchStorageKey)))
		{
			this.#restoreBatchDeletion((): void => this.#handleBatchDeletion(event));

			return;
		}

		const grid = this.#runtime.getGrid(this.#options.gridId);
		if (!grid)
		{
			return;
		}

		const forAll = grid.getActionsPanel()?.getForAllCheckbox()?.checked ?? false;
		const currencyCodes = grid
			.getRows()
			.getSelectedIds()
			.filter((currencyCode): currencyCode is string => Type.isStringFilled(currencyCode));
		if (!forAll && currencyCodes.length === 0)
		{
			return;
		}

		this.#showConfirmation(
			Loc.getMessage('CRM_CURRENCY_LIST_BATCH_DELETE_CONFIRM') ?? '',
			Loc.getMessage('CRM_CURRENCY_LIST_BATCH_DELETE_CONFIRM_DESCRIPTION') ?? '',
			Loc.getMessage('CRM_CURRENCY_LIST_BATCH_DELETE_CONFIRM_BUTTON') ?? '',
			(): void => {
				if (!this.#initialized || this.#batchProcess !== null)
				{
					return;
				}

				this.#startBatchDeletion(forAll ? 'all' : 'selected', currencyCodes);
			},
		);
	};

	#showConfirmation(title: string, message: string, confirmButtonText: string, onConfirm: () => void): void
	{
		this.#closeConfirmation();
		const grid = this.#runtime.getGrid(this.#options.gridId);
		const closeButtonText = Type.isFunction(grid?.getParam)
			? grid.getParam('CLOSE', '')
			: '';
		const opener = this.#resolveDialogOpener();
		this.#dialogOpener = null;
		const dialogHolder: { current: SystemDialogHandle | null } = { current: null };
		const dialog = this.#runtime.showConfirmation({
			dialogId: `${this.#options.gridId.toLowerCase()}-confirmation`,
			title,
			message,
			confirmButtonText,
			closeButtonText: Type.isStringFilled(closeButtonText)
				? closeButtonText
				: Loc.getMessage('CRM_CURRENCY_LIST_CANCEL_BUTTON') ?? '',
			opener,
			onConfirm,
			onClose: (): void => {
				if (this.#confirmationDialog === dialogHolder.current)
				{
					this.#confirmationDialog = null;
				}
			},
		});
		dialogHolder.current = dialog;
		this.#confirmationDialog = dialog;
	}

	#resolveDialogOpener(): HTMLElement | null
	{
		const activeElement = document.activeElement instanceof HTMLElement
			? document.activeElement
			: null;
		const gridRoot = this.#getGridRoot();
		if (activeElement && gridRoot?.contains(activeElement))
		{
			return activeElement;
		}

		return this.#dialogOpener?.isConnected === true
			? this.#dialogOpener
			: activeElement;
	}

	#enhanceGridAccessibility(): void
	{
		const gridRoot = this.#getGridRoot();
		if (!gridRoot)
		{
			return;
		}

		const settingsWindow = gridRoot.querySelector<HTMLElement>('.main-grid-settings-window');
		if (settingsWindow)
		{
			this.#settingsWindow = settingsWindow;
			Dom.addClass(settingsWindow, 'crm-currency-list-settings-window');
			settingsWindow.setAttribute('inert', '');
		}

		gridRoot.querySelectorAll<HTMLElement>('th.main-grid-col-sortable').forEach((header) => {
			this.#setAccessibilityControl(header, 'sort');
			const sortIndicator = header.querySelector<HTMLElement>('.main-grid-control-sort');
			let sortDirection = 'none';
			if (sortIndicator && Dom.hasClass(sortIndicator, 'main-grid-control-sort-asc'))
			{
				sortDirection = 'ascending';
			}
			else if (sortIndicator && Dom.hasClass(sortIndicator, 'main-grid-control-sort-desc'))
			{
				sortDirection = 'descending';
			}
			header.setAttribute('aria-sort', sortDirection);
		});

		const settingsButton = gridRoot.querySelector<HTMLElement>('.main-grid-interface-settings-icon');
		if (settingsButton)
		{
			this.#setAccessibilityControl(
				settingsButton,
				'settings',
				this.#getGridStringParam('SETTINGS_TITLE'),
			);
			settingsButton.setAttribute('aria-haspopup', 'dialog');
			settingsButton.setAttribute('aria-expanded', 'false');
		}

		const pageSize = gridRoot.querySelector<HTMLElement>('.main-grid-panel-select-pagesize');
		if (pageSize)
		{
			const pageSizeTitle = pageSize
				.closest<HTMLElement>('.main-grid-panel-content')
				?.querySelector<HTMLElement>('.main-grid-panel-content-title')
				?.textContent
				?.trim() ?? '';
			this.#setAccessibilityControl(
				pageSize,
				'page-size',
				`${pageSizeTitle} ${pageSize.textContent?.trim() ?? ''}`.trim(),
			);
			pageSize.setAttribute('aria-haspopup', 'menu');
			pageSize.setAttribute('aria-expanded', 'false');
		}

		this.#syncPanelActionAccessibility();

		const checkAll = gridRoot.querySelector<HTMLInputElement>('input.main-grid-check-all');
		if (checkAll && Type.isStringFilled(checkAll.title))
		{
			checkAll.setAttribute('aria-label', checkAll.title);
		}

		gridRoot
			.querySelectorAll<HTMLInputElement>('tr[data-id]:not([hidden]) input.main-grid-row-checkbox:not(.main-grid-check-all)')
			.forEach((checkbox) => {
				const currencyCode = checkbox.closest<HTMLElement>('tr[data-id]')?.dataset.id ?? '';
				const label = [checkbox.title, currencyCode]
					.filter((part) => Type.isStringFilled(part))
					.join(' — ');
				if (Type.isStringFilled(label))
				{
					checkbox.setAttribute('aria-label', label);
				}
			});

		const rowActionButtons = [
			...gridRoot.querySelectorAll<HTMLElement>('.main-grid-row-action-button'),
		];
		const actionTitles = new Set<string>();
		rowActionButtons.forEach((button) => {
			const currencyCode = button.closest<HTMLElement>('tr[data-id]')?.dataset.id ?? '';
			const titles = this.#getRowActionTitles(button);
			titles.forEach((title) => actionTitles.add(title));
			const label = [...titles, currencyCode]
				.filter((part) => Type.isStringFilled(part))
				.join(' — ');
			this.#setAccessibilityControl(button, 'row-actions', label);
			button.setAttribute('aria-haspopup', 'menu');
			button.setAttribute('aria-expanded', 'false');
		});

		const actionHeader = gridRoot.querySelector<HTMLElement>('th.main-grid-cell-action');
		if (actionHeader && actionTitles.size > 0)
		{
			actionHeader.setAttribute('aria-label', [...actionTitles].join(', '));
		}

		gridRoot.querySelectorAll<HTMLElement>('th.main-grid-special-empty').forEach((header) => {
			header.setAttribute('role', 'presentation');
			header.setAttribute('aria-hidden', 'true');
		});

		this.#enhanceTechnicalFrames(gridRoot);
	}

	#enhanceTechnicalFrames(gridRoot: HTMLElement): void
	{
		gridRoot.querySelectorAll<HTMLIFrameElement>('iframe[id^="main-grid-tmp-frame-"]').forEach((frame) => {
			frame.removeAttribute('role');
			frame.setAttribute('aria-hidden', 'true');
			frame.setAttribute('tabindex', '-1');
		});
	}

	#showSettingsWindowAccessibility(settingsButton: HTMLElement): void
	{
		if (!this.#settingsWindow)
		{
			return;
		}

		this.#settingsWindow.removeAttribute('inert');
		settingsButton.setAttribute('aria-expanded', 'true');
		this.#settingsWindow
			.querySelectorAll<HTMLElement>([
				'.main-grid-settings-window-actions-item-reset',
				'.main-grid-settings-window-actions-item-button.ui-btn',
				'.main-grid-settings-window-select-all',
				'.main-grid-settings-window-unselect-all',
			].join(', '))
			.forEach((control) => this.#setAccessibilityControl(control, 'settings-action'));
	}

	#setAccessibilityControl(control: HTMLElement, type: string, label: string = ''): void
	{
		control.setAttribute(A11Y_CONTROL_ATTRIBUTE, type);
		Dom.addClass(control, 'crm-currency-list-a11y-control');
		control.setAttribute('tabindex', '0');
		if (control.tagName !== 'TH' && control.tagName !== 'A')
		{
			control.setAttribute('role', 'button');
		}

		if (Type.isStringFilled(label))
		{
			control.setAttribute('aria-label', label);
		}
	}

	#syncPanelActionAccessibility(): void
	{
		this.#getGridRoot()
			?.querySelectorAll<HTMLElement>('.main-grid-panel-control-container > .ui-btn')
			.forEach((control) => {
				this.#setAccessibilityControl(control, 'panel-action');
				const container = control.closest<HTMLElement>('.main-grid-panel-control-container');
				const actionPanel = control.closest<HTMLElement>('.main-grid-action-panel');
				const isDisabled = Dom.hasClass(control, 'main-grid-disable')
					|| (container !== null && Dom.hasClass(container, 'main-grid-disable'))
					|| (actionPanel !== null && Dom.hasClass(actionPanel, 'main-grid-disable'))
				;
				control.setAttribute('tabindex', isDisabled ? '-1' : '0');
				control.setAttribute('aria-disabled', String(isDisabled));
			});
	}

	#getGridStringParam(name: string): string
	{
		const grid = this.#runtime.getGrid(this.#options.gridId);
		if (!grid || !Type.isFunction(grid.getParam))
		{
			return '';
		}

		const value = grid.getParam(name, '');

		return Type.isStringFilled(value) ? value : '';
	}

	#getRowActionTitles(button: HTMLElement): string[]
	{
		const actions = button.dataset.actions;
		if (!Type.isStringFilled(actions))
		{
			return [];
		}

		try
		{
			const serializedActions = actions.startsWith('(') && actions.endsWith(')')
				? actions.slice(1, -1)
				: actions;
			const parsedActions = JSON.parse(serializedActions) as unknown;
			if (!Array.isArray(parsedActions))
			{
				return [];
			}

			return parsedActions.flatMap((action): string[] => {
				const title = Type.isPlainObject(action) ? action.text : null;

				return Type.isStringFilled(title) ? [title.trim()] : [];
			});
		}
		catch
		{
			return [];
		}
	}

	#getGridRoot(): HTMLElement | null
	{
		const gridRoot = document.getElementById(this.#options.gridId);

		return gridRoot instanceof HTMLElement ? gridRoot : null;
	}

	#getAccessibilityControl(target: Element): HTMLElement | null
	{
		const control = target.closest<HTMLElement>(`[${A11Y_CONTROL_ATTRIBUTE}]`);
		if (!control)
		{
			return null;
		}

		return (
			this.#getGridRoot()?.contains(control) === true
			|| this.#settingsWindow?.contains(control) === true
		)
			? control
			: null;
	}

	#isAccessibilityControlDisabled(control: HTMLElement): boolean
	{
		return Dom.hasClass(control, 'main-grid-disable')
			|| control.getAttribute('aria-disabled') === 'true';
	}

	#scheduleMenuEnhancement(menuId: string, opener: HTMLElement, focusMenu: boolean, attempt: number = 0): void
	{
		window.requestAnimationFrame(() => {
			if (!this.#initialized)
			{
				return;
			}

			const popupMenuManager = Reflection.getClass('BX.PopupMenu') as PopupMenuManager | null;
			const menu = popupMenuManager?.getMenuById(menuId);
			if (!menu || !menu.getPopupWindow().isShown())
			{
				if (attempt < 5)
				{
					this.#scheduleMenuEnhancement(menuId, opener, focusMenu, attempt + 1);
				}

				return;
			}

			const menuContainer = menu.getMenuContainer();
			if (this.#menuEnhancements.has(menuContainer))
			{
				if (focusMenu)
				{
					this.#focusFirstMenuItem(menuContainer);
				}
				opener.setAttribute('aria-expanded', 'true');

				return;
			}

			const popupWindow = menu.getPopupWindow();
			const onKeyDown = (event: KeyboardEvent): void => this.#navigateMenu(event, menuContainer);
			const onAfterShow = (): void => {
				if (focusMenu)
				{
					this.#focusFirstMenuItem(menuContainer);
				}
			};

			const onClose = (): void => {
				this.#menuEnhancements.delete(menuContainer);
				opener.setAttribute('aria-expanded', 'false');
				popupWindow.unsubscribe('onAfterShow', onAfterShow);
				popupWindow.unsubscribe('onClose', onClose);
				Event.unbind(menuContainer, 'keydown', onKeyDown, true);
			};

			if (focusMenu)
			{
				this.#focusFirstMenuItem(menuContainer);
			}
			opener.setAttribute('aria-expanded', 'true');
			popupWindow.subscribe('onAfterShow', onAfterShow);
			popupWindow.subscribe('onClose', onClose);
			Event.bind(menuContainer, 'keydown', onKeyDown, true);
			this.#menuEnhancements.set(menuContainer, {
				popupWindow,
				menuContainer,
				opener,
				onAfterShow,
				onClose,
				onKeyDown,
			});
		});
	}

	#focusFirstMenuItem(menuContainer: HTMLElement): void
	{
		const firstItem = menuContainer.querySelector<HTMLElement>(
			'[role="menuitem"]:not([aria-disabled="true"])',
		);
		if (firstItem)
		{
			firstItem.setAttribute('tabindex', '0');
			Dom.addClass(firstItem, '--focus --focus-visible');
			firstItem.focus({ preventScroll: true });
		}
	}

	#navigateMenu(event: KeyboardEvent, menuContainer: HTMLElement): void
	{
		const menuItems = [
			...menuContainer.querySelectorAll<HTMLElement>('[role="menuitem"]:not([aria-disabled="true"])'),
		];
		if (menuItems.length === 0)
		{
			return;
		}

		const activeIndex = menuItems.indexOf(document.activeElement as HTMLElement);
		let targetIndex: number | null = null;

		switch (event.key)
		{
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
				if (activeIndex >= 0)
				{
					event.preventDefault();
					event.stopImmediatePropagation();
					menuItems[activeIndex].click();
				}

				return;
			default:
				return;
		}

		if (targetIndex === null)
		{
			return;
		}

		event.preventDefault();
		event.stopImmediatePropagation();
		menuItems.forEach((item, index) => {
			item.setAttribute('tabindex', index === targetIndex ? '0' : '-1');
			Dom.toggleClass(item, '--focus', index === targetIndex);
			Dom.toggleClass(item, '--focus-visible', index === targetIndex);
		});
		menuItems[targetIndex].focus({ preventScroll: true });
	}

	#deactivateMenuEnhancements(): void
	{
		this.#menuEnhancements.forEach(({
			popupWindow,
			menuContainer,
			opener,
			onAfterShow,
			onClose,
			onKeyDown,
		}) => {
			popupWindow.unsubscribe('onAfterShow', onAfterShow);
			popupWindow.unsubscribe('onClose', onClose);
			Event.unbind(menuContainer, 'keydown', onKeyDown, true);
			opener.setAttribute('aria-expanded', 'false');
		});
		this.#menuEnhancements.clear();
	}

	#closeConfirmation(): void
	{
		const dialog = this.#confirmationDialog;
		this.#confirmationDialog = null;
		dialog?.hide();
	}

	#handleBatchRequestStart = (formData: FormData): void => {
		const generatedToken = formData.get('PROCESS_TOKEN');
		const storedToken = this.#runtime.readBatchToken(this.#options.batchStorageKey);
		const processToken = this.#batchProcessToken
			?? (Type.isStringFilled(storedToken) ? storedToken : null)
			?? (Type.isStringFilled(generatedToken) ? generatedToken : null);
		if (!Type.isStringFilled(processToken))
		{
			return;
		}

		this.#batchProcessToken = processToken;
		formData.set('PROCESS_TOKEN', processToken);
		this.#batchProcess?.setParam('PROCESS_TOKEN', processToken);
		this.#runtime.writeBatchToken(this.#options.batchStorageKey, processToken);
	};

	#handleBatchStepCompleted = (status: string, result: Record<string, unknown>): void => {
		if (this.#batchTerminalHandled || status !== ProcessResultStatus.completed)
		{
			return;
		}

		this.#batchResult = this.#normalizeBatchResult(result);
	};

	#handleBatchStateChanged = (
		state: string,
		result: Record<string, unknown> = {},
	): void => {
		if (this.#batchTerminalHandled)
		{
			return;
		}

		if (state === ProcessState.error)
		{
			this.#finishBatchDeletion(true, false);

			return;
		}

		if (state !== ProcessState.completed)
		{
			return;
		}

		if (!this.#batchCancellationRequested)
		{
			const batchResult = this.#batchResult ?? this.#normalizeBatchResult(result);
			const dialog = this.#batchProcess?.getDialog();
			const summary = this.#getBatchResultSummary(batchResult);
			if (batchResult.itemErrors.length > 0)
			{
				dialog?.setError(this.#getBatchResultError(summary, batchResult.itemErrors), true);
			}
			else
			{
				dialog?.setSummary(summary);
			}
		}

		this.#finishBatchDeletion(true);
	};

	#startBatchDeletion(
		mode: 'selected' | 'all' | null,
		currencyCodes: string[] = [],
		processToken: string | null = null,
	): void
	{
		const params: Record<string, unknown> = {
			gridId: this.#options.gridId,
		};
		if (mode !== null)
		{
			params.mode = mode;
			if (mode === 'selected')
			{
				params.currencyCodes = currencyCodes;
			}
		}

		this.#batchProcessToken = processToken;
		this.#batchCancellationRequested = false;
		this.#batchTerminalHandled = false;
		this.#batchResult = null;
		const processId = `crm_currency_list_batch_deletion_${Text.getRandom().toLowerCase()}`;
		const process = this.#runtime.createBatchProcess({
			id: processId,
			controller: this.#options.batchController,
			method: 'POST',
			params,
			messages: {
				DialogTitle: Loc.getMessage('CRM_CURRENCY_LIST_BATCH_TITLE') ?? '',
				DialogSummary: Loc.getMessage('CRM_CURRENCY_LIST_BATCH_PREPARING') ?? '',
			},
			showButtons: {
				start: false,
				stop: true,
				close: true,
			},
			queue: [
				{
					action: 'prepare',
					title: Loc.getMessage('CRM_CURRENCY_LIST_BATCH_PREPARING') ?? '',
					progressBarTitle: Loc.getMessage('CRM_CURRENCY_LIST_BATCH_PROGRESS') ?? '',
					method: 'POST',
					handlers: {
						RequestStart: this.#handleBatchRequestStart,
						StepCompleted: this.#handleBatchStepCompleted,
					},
				},
			],
			handlers: {
				StateChanged: this.#handleBatchStateChanged,
				dialogClosed: (): void => {
					if (this.#retainedBatchProcessIds.delete(processId))
					{
						this.#runtime.deleteBatchProcess(processId);
					}
				},
			},
		});
		this.#batchProcess = process;

		const stop = process.stop.bind(process);
		process.stop = (): BatchProcess => {
			this.#batchCancellationRequested = true;

			return stop();
		};

		process.showDialog();
		process.getDialog().summaryBlock?.setAttribute(
			'data-testid',
			'crm-currency-list-batch-state',
		);
		process.start();
	}

	#restoreBatchDeletion(onNotFound: (() => void) | null = null): void
	{
		const processToken = this.#runtime.readBatchToken(this.#options.batchStorageKey);
		if (Type.isStringFilled(processToken))
		{
			if (onNotFound !== null && this.#pendingBatchDeletion === null)
			{
				this.#pendingBatchDeletion = onNotFound;
			}

			if (this.#batchPreflight !== null)
			{
				return;
			}

			let operationNotFound = false;
			const preflight = this.#runtime.runAction(
				`${this.#options.batchController}.prepare`,
				{
					gridId: this.#options.gridId,
					PROCESS_TOKEN: processToken,
				},
			).then(
				() => {
					if (
						this.#initialized
						&& this.#batchProcess === null
						&& this.#runtime.readBatchToken(this.#options.batchStorageKey) === processToken
					)
					{
						this.#pendingBatchDeletion = null;
						this.#startBatchDeletion(null, [], processToken);
					}
				},
				(response: unknown) => {
					if (
						this.#initialized
						&& this.#isBatchOperationNotFound(response)
						&& this.#runtime.readBatchToken(this.#options.batchStorageKey) === processToken
					)
					{
						operationNotFound = true;
						this.#runtime.removeBatchToken(this.#options.batchStorageKey);
					}
					else
					{
						this.#pendingBatchDeletion = null;
					}
				},
			).then((): void => {
				if (this.#batchPreflight !== preflight)
				{
					return;
				}

				this.#batchPreflight = null;
				const pendingBatchDeletion = this.#pendingBatchDeletion;
				this.#pendingBatchDeletion = null;
				if (operationNotFound && this.#initialized)
				{
					pendingBatchDeletion?.();
				}
			});
			this.#batchPreflight = preflight;
		}
		else if (processToken !== null)
		{
			this.#runtime.removeBatchToken(this.#options.batchStorageKey);
		}
	}

	#isBatchOperationNotFound(response: unknown): boolean
	{
		if (!Type.isObjectLike(response))
		{
			return false;
		}

		const errors = (response as AjaxErrorResponse).errors;

		return Array.isArray(errors)
			&& errors.some((error) => (
				Type.isObjectLike(error)
				&& error.code === BATCH_OPERATION_NOT_FOUND
			));
	}

	#deleteBatchProcess(): void
	{
		if (!this.#batchProcess)
		{
			return;
		}

		const process = this.#batchProcess;
		const processId = process.getId();
		this.#runtime.deleteBatchProcess(processId);
		if (this.#batchProcess !== process)
		{
			return;
		}

		this.#batchProcess = null;
		this.#batchProcessToken = null;
		this.#batchCancellationRequested = false;
		this.#batchResult = null;
	}

	#finishBatchDeletion(reloadGrid: boolean, removeToken: boolean = true): void
	{
		if (this.#batchTerminalHandled)
		{
			return;
		}

		this.#batchTerminalHandled = true;
		if (removeToken)
		{
			this.#runtime.removeBatchToken(this.#options.batchStorageKey);
		}

		if (reloadGrid)
		{
			this.#runtime.getGrid(this.#options.gridId)?.reload();
		}
		const process = this.#batchProcess;
		if (process)
		{
			this.#retainedBatchProcessIds.add(process.getId());
			this.#batchProcess = null;
			this.#batchProcessToken = null;
			this.#batchCancellationRequested = false;
			this.#batchResult = null;
		}
	}

	#normalizeBatchResult(result: Record<string, unknown>): BatchResult
	{
		const itemErrors = Array.isArray(result.ITEM_ERRORS)
			? result.ITEM_ERRORS.flatMap((itemError): BatchItemError[] => {
				if (
					!Type.isPlainObject(itemError)
					|| !Type.isString(itemError.currencyCode)
					|| !Type.isString(itemError.message)
				)
				{
					return [];
				}

				return [{
					currencyCode: itemError.currencyCode,
					message: itemError.message,
				}];
			})
			: [];

		return {
			successfulItems: this.#normalizeBatchCount(result.SUCCESSFUL_ITEMS),
			failedItems: this.#normalizeBatchCount(result.FAILED_ITEMS),
			itemErrors,
		};
	}

	#normalizeBatchCount(value: unknown): number
	{
		return Type.isNumber(value) && value >= 0 ? Math.floor(value) : 0;
	}

	#getBatchResultSummary(result: BatchResult): string
	{
		return Loc.getMessage('CRM_CURRENCY_LIST_BATCH_RESULT', {
			'#SUCCESSFUL#': String(result.successfulItems),
			'#FAILED#': String(result.failedItems),
		}) ?? '';
	}

	#getBatchResultError(summary: string, itemErrors: BatchItemError[]): string
	{
		return [summary, ...itemErrors.map(({ currencyCode, message }) => `${currencyCode}: ${message}`)]
			.map((message) => Text.encode(message))
			.join('<br>');
	}

	#openForm(url: string): void
	{
		this.#runtime.openSlider(url, {
			cacheable: false,
			events: {
				onCloseComplete: (): void => {
					if (this.#initialized)
					{
						this.#runtime.getGrid(this.#options.gridId)?.reload();
					}
				},
			},
		});
	}

	#isAddUrl(url: string): boolean
	{
		return this.#normalizeUrl(url) === this.#normalizeUrl(this.#options.addUrl);
	}

	#isEditUrl(url: string): boolean
	{
		const placeholder = 'CRM_CURRENCY_ID_PLACEHOLDER';
		const templateUrl = this.#normalizeUrl(
			this.#options.editUrlTemplate.replace('#currency_id#', placeholder),
		);
		const pattern = this.#escapeRegExp(templateUrl).replace(placeholder, '[A-Z]{3}');

		return new RegExp(`^${pattern}$`).test(this.#normalizeUrl(url));
	}

	#normalizeUrl(url: string): string
	{
		return new URL(url, window.location.href).toString();
	}

	#escapeRegExp(value: string): string
	{
		return value.replaceAll(/[$()*+.?[\\\]^{|}]/g, '\\$&');
	}
}
