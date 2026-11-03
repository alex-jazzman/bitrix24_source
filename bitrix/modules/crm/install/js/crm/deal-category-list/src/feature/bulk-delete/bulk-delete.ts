import { Dom, Loc, Runtime, Type } from 'main.core';
import { type BaseEvent, EventEmitter } from 'main.core.events';
import { AirButtonStyle, Button, ButtonSize } from 'ui.buttons';

import {
	type DealCategoryBatchDeleteResult,
	type DealCategoryBulkDeleteAction,
	type DealCategoryGrid,
	type DealCategorySlider,
} from '../../types';

type BulkDeleteOptions = {
	getGrid: () => DealCategoryGrid | null,
	onSuccess?: (successCount: number) => void,
	dependencies?: BulkDeleteDependencies,
};

type DeleteScope = 'selected' | 'all';

type SliderCloseEvent = {
	denyAction: () => void,
	getSlider: () => DealCategorySlider | null,
};

type StepProcess = {
	showDialog: () => void,
	start: () => void,
	stop: () => void,
};

type StepProcessOptions = {
	id: string,
	controller: string,
	method: 'POST',
	params: Readonly<{ scope: DeleteScope, ids: readonly number[] }>,
	queue: Array<{
		action: string,
		title: string,
		progressBarTitle: string,
	}>,
	messages: Record<string, string>,
	showButtons: {
		start: boolean,
		stop: boolean,
		close: boolean,
	},
	handlers: Record<string, (state: string, result?: DealCategoryBatchDeleteResult) => void>,
};

type DialogInstance = {
	show: () => void,
	hide: () => void,
	subscribe: (eventName: string, handler: () => void) => void,
};

export type BulkDeleteDependencies = {
	Dialog: new (options: Record<string, unknown>) => DialogInstance,
	SidePanel: {
		Instance: {
			getSliderByWindow: (target: Window) => DealCategorySlider | null,
		},
	},
	ProcessCallback: { StateChanged: string },
	ProcessManager: { create: (options: unknown) => StepProcess },
	ProcessState: {
		running: string,
		stopped: string,
		completed: string,
		error: string,
	},
};

const PROCESS_ID = 'crm-deal-category-bulk-delete';
const SLIDER_CLOSE_EVENT = 'SidePanel.Slider:onClose';

export class BulkDelete
{
	#getGrid: BulkDeleteOptions['getGrid'];
	#onSuccess: (successCount: number) => void;
	#dependencies: BulkDeleteDependencies | null;
	#dependenciesPromise: Promise<BulkDeleteDependencies> | null = null;
	#grid: DealCategoryGrid | null = null;
	#process: StepProcess | null = null;
	#slider: DealCategorySlider | null = null;
	#confirmDialog: DialogInstance | null = null;
	#closeDialog: DialogInstance | null = null;
	#startPending: boolean = false;
	#processActive: boolean = false;
	#closePending: boolean = false;
	#closeApproved: boolean = false;
	#closeListenerBound: boolean = false;
	#reloadCompleted: boolean = false;

	constructor(options: BulkDeleteOptions)
	{
		this.#getGrid = options.getGrid;
		this.#onSuccess = options.onSuccess ?? (() => {});
		this.#dependencies = options.dependencies ?? null;
	}

	start(action: DealCategoryBulkDeleteAction): boolean
	{
		if (this.#startPending || this.#processActive)
		{
			return false;
		}

		const grid = this.#getGrid();
		if (grid === null)
		{
			return false;
		}

		const scope: DeleteScope = grid.getActionsPanel?.()?.getForAllCheckbox?.()?.checked === true
			? 'all'
			: 'selected'
		;
		const selectedIds = grid.getRows().getSelectedIds();
		if (scope === 'selected' && selectedIds.length === 0)
		{
			return false;
		}

		const ids = Object.freeze(scope === 'selected' ? [...selectedIds] : []);
		const params = Object.freeze({ scope, ids });
		this.#grid = grid;
		this.#startPending = true;
		if (this.#dependencies === null)
		{
			void this.#loadDependencies()
				.then(() => this.#showStartConfirmation(action, params))
				.catch(() => {
					this.#startPending = false;
				})
			;
		}
		else
		{
			this.#showStartConfirmation(action, params);
		}

		return true;
	}

	#showStartConfirmation(
		action: DealCategoryBulkDeleteAction,
		params: Readonly<{ scope: DeleteScope, ids: readonly number[] }>,
	): void
	{
		if (this.#dependencies === null)
		{
			this.#startPending = false;

			return;
		}

		const { Dialog } = this.#dependencies;
		const isAll = params.scope === 'all';
		const content = Dom.create('div', {
			attrs: {
				'data-testid': 'crm-deal-category-bulk-delete-dialog',
			},
		});
		const message = Dom.create('div', {
			text: Loc.getMessage(
				isAll
					? 'CRM_DEAL_CATEGORY_LIST_BULK_DELETE_ALL_CONTENT'
					: 'CRM_DEAL_CATEGORY_LIST_BULK_DELETE_SELECTED_CONTENT',
				isAll ? undefined : { '#COUNT#': String(params.ids.length) },
			) ?? '',
			attrs: isAll ? { 'data-testid': 'crm-deal-category-bulk-delete-warning' } : {},
		});
		Dom.append(message, content);
		this.#confirmDialog = new Dialog({
			title: Loc.getMessage('CRM_DEAL_CATEGORY_LIST_BULK_DELETE_TITLE') ?? '',
			content,
			centerButtons: [
				this.#createButton(
					'CRM_DEAL_CATEGORY_LIST_BULK_DELETE_CONFIRM',
					'crm-deal-category-bulk-delete-confirm',
					AirButtonStyle.FILLED,
					(): void => {
						this.#confirmDialog?.hide();
						this.#begin(action, params);
					},
				),
				this.#createButton(
					'CRM_DEAL_CATEGORY_LIST_BULK_DELETE_CANCEL',
					'crm-deal-category-bulk-delete-cancel',
					AirButtonStyle.OUTLINE,
					(): void => {
						this.#startPending = false;
						this.#confirmDialog?.hide();
					},
				),
			],
			hasCloseButton: true,
			closeByEsc: true,
			closeByClickOutside: true,
			hasOverlay: true,
		});
		this.#confirmDialog.subscribe('onHide', (): void => {
			this.#startPending = false;
		});
		this.#confirmDialog.show();
	}

	#begin(
		action: DealCategoryBulkDeleteAction,
		params: Readonly<{ scope: DeleteScope, ids: readonly number[] }>,
	): void
	{
		this.#startPending = false;
		this.#reloadCompleted = false;
		this.#closePending = false;
		this.#closeApproved = false;
		if (this.#dependencies === null)
		{
			return;
		}
		this.#slider = this.#dependencies.SidePanel.Instance.getSliderByWindow(window);

		const { ProcessCallback, ProcessManager } = this.#dependencies;
		const processOptions: StepProcessOptions = {
			id: PROCESS_ID,
			controller: action.controller,
			method: action.method,
			params,
			queue: [{
				action: 'process',
				title: Loc.getMessage('CRM_DEAL_CATEGORY_LIST_BULK_DELETE_PROCESS_SUMMARY') ?? '',
				progressBarTitle: Loc.getMessage('CRM_DEAL_CATEGORY_LIST_BULK_DELETE_PROCESS_PROGRESS') ?? '',
			}],
			messages: {
				DialogTitle: Loc.getMessage('CRM_DEAL_CATEGORY_LIST_BULK_DELETE_PROCESS_TITLE') ?? '',
				DialogSummary: Loc.getMessage('CRM_DEAL_CATEGORY_LIST_BULK_DELETE_PROCESS_SUMMARY') ?? '',
			},
			showButtons: {
				start: false,
				stop: true,
				close: true,
			},
			handlers: {
				[ProcessCallback.StateChanged]: this.#handleProcessStateChanged,
			},
		};
		this.#process = ProcessManager.create(processOptions);
		this.#process.showDialog();
		this.#process.start();
	}

	#handleProcessStateChanged = (
		state: string,
		result?: DealCategoryBatchDeleteResult,
	): void => {
		if (state === this.#dependencies?.ProcessState.running)
		{
			this.#processActive = true;
			this.#bindCloseListener();

			return;
		}

		const processState = this.#dependencies?.ProcessState;
		if (
			processState === undefined
			|| !new Set([processState.stopped, processState.completed, processState.error]).has(state)
		)
		{
			return;
		}

		this.#processActive = false;
		this.#closeDialog?.hide();
		this.#reloadOnce(result);
		this.#unbindCloseListener();

		if (this.#closeApproved)
		{
			this.#closeApproved = false;
			this.#slider?.close();
		}
	};

	#handleSliderClose = (event: BaseEvent): void => {
		const [sliderEvent] = event.getData() as SliderCloseEvent[];
		if (
			!this.#processActive
			|| sliderEvent?.getSlider() !== this.#slider
		)
		{
			return;
		}

		sliderEvent.denyAction();
		if (this.#closePending)
		{
			return;
		}

		this.#closePending = true;
		this.#showCloseConfirmation();
	};

	#showCloseConfirmation(): void
	{
		if (this.#dependencies === null)
		{
			return;
		}

		const { Dialog } = this.#dependencies;
		this.#closeDialog = new Dialog({
			title: Loc.getMessage('CRM_DEAL_CATEGORY_LIST_BULK_DELETE_CLOSE_TITLE') ?? '',
			content: Dom.create('div', {
				text: Loc.getMessage('CRM_DEAL_CATEGORY_LIST_BULK_DELETE_CLOSE_CONTENT') ?? '',
				attrs: {
					'data-testid': 'crm-deal-category-bulk-delete-close-dialog',
				},
			}),
			centerButtons: [
				this.#createButton(
					'CRM_DEAL_CATEGORY_LIST_BULK_DELETE_CLOSE_STOP',
					'crm-deal-category-bulk-delete-close-stop',
					AirButtonStyle.FILLED,
					(): void => {
						this.#closeApproved = true;
						this.#closeDialog?.hide();
						this.#process?.stop();
					},
				),
				this.#createButton(
					'CRM_DEAL_CATEGORY_LIST_BULK_DELETE_CLOSE_STAY',
					'crm-deal-category-bulk-delete-close-stay',
					AirButtonStyle.OUTLINE,
					(): void => {
						this.#closeDialog?.hide();
					},
				),
			],
			hasCloseButton: true,
			closeByEsc: true,
			closeByClickOutside: true,
			hasOverlay: true,
		});
		this.#closeDialog.subscribe('onHide', (): void => {
			if (!this.#closeApproved)
			{
				this.#closePending = false;
			}
		});
		this.#closeDialog.show();
	}

	#bindCloseListener(): void
	{
		if (this.#slider === null || this.#closeListenerBound)
		{
			return;
		}

		EventEmitter.subscribe(this.#slider, SLIDER_CLOSE_EVENT, this.#handleSliderClose);
		this.#closeListenerBound = true;
	}

	#unbindCloseListener(): void
	{
		if (this.#slider === null || !this.#closeListenerBound)
		{
			return;
		}

		EventEmitter.unsubscribe(this.#slider, SLIDER_CLOSE_EVENT, this.#handleSliderClose);
		this.#closeListenerBound = false;
	}

	#reloadOnce(result?: DealCategoryBatchDeleteResult): void
	{
		if (this.#reloadCompleted)
		{
			return;
		}

		this.#reloadCompleted = true;
		this.#onSuccess(Math.max(0, result?.successCount ?? 0));
		const grid = this.#getGrid() ?? this.#grid;
		this.#grid = null;
		grid?.reload();
	}

	#loadDependencies(): Promise<BulkDeleteDependencies>
	{
		if (this.#dependencies !== null)
		{
			return Promise.resolve(this.#dependencies);
		}

		if (this.#dependenciesPromise === null)
		{
			const promise = Promise.all([
				Runtime.loadExtension('ui.system.dialog'),
				Runtime.loadExtension('ui.stepprocessing'),
				Runtime.loadExtension('main.sidepanel'),
			])
				.then(([dialogExports, processExports, sidePanelExports]: unknown[]): BulkDeleteDependencies => {
					const dependencies = {
						Dialog: (dialogExports as Partial<BulkDeleteDependencies>).Dialog,
						SidePanel: (sidePanelExports as Partial<BulkDeleteDependencies>).SidePanel,
						ProcessCallback: (processExports as Partial<BulkDeleteDependencies>).ProcessCallback,
						ProcessManager: (processExports as Partial<BulkDeleteDependencies>).ProcessManager,
						ProcessState: (processExports as Partial<BulkDeleteDependencies>).ProcessState,
					} as Partial<BulkDeleteDependencies>;
					if (
						!Type.isFunction(dependencies.Dialog)
						|| !Type.isFunction(dependencies.SidePanel?.Instance?.getSliderByWindow)
						|| !Type.isPlainObject(dependencies.ProcessCallback)
						|| !Type.isFunction(dependencies.ProcessManager)
						|| !Type.isFunction(dependencies.ProcessManager?.create)
						|| !Type.isPlainObject(dependencies.ProcessState)
					)
					{
						throw new TypeError('Bulk delete dependencies are invalid');
					}

					this.#dependencies = dependencies as BulkDeleteDependencies;

					return this.#dependencies;
				})
				.catch((error: unknown) => {
					if (this.#dependenciesPromise === promise)
					{
						this.#dependenciesPromise = null;
					}

					throw error;
				})
			;
			this.#dependenciesPromise = promise;
		}

		return this.#dependenciesPromise;
	}

	#createButton(
		messageId: string,
		testId: string,
		style: string,
		onClick: () => void,
	): Button
	{
		return new Button(({
			text: Loc.getMessage(messageId) ?? '',
			size: ButtonSize.LARGE,
			style,
			useAirDesign: true,
			dataset: { testid: testId },
			onclick: (): {} => {
				onClick();

				return {};
			},
		}) as any);
	}
}
