import { ajax, Event, Loc, Reflection, Tag, Text, Type } from 'main.core';
import {
	AirButtonStyle,
	Button,
	ButtonSize,
	CancelButton,
	type ButtonOptions,
} from 'ui.buttons';
import 'ui.notification';
import { Dialog } from 'ui.system.dialog';
import {
	ProcessCallback,
	ProcessManager,
	ProcessResultStatus,
	ProcessState,
} from 'ui.stepprocessing';
import {
	type BatchDeleteRequest,
	type BatchDeleteResult,
	type GridInstance,
	type MeasureGridOptions,
	type SidePanelEvent,
	type SidePanelInstance,
	type StepProcess,
} from './types';

const DELETE_ACTION = 'delete';
const SELECTED_SCOPE = 'selected';
const ALL_SCOPE = 'all';
const FOR_ALL_VALUE = 'Y';
const MEASURE_ID_PLACEHOLDER = '#measure_id#';
const SLIDER_SAVE_STATUS_KEY = 'crmMeasureSaveSucceeded';

export class MeasureGrid
{
	static #instances: Map<string, MeasureGrid> = new Map();

	#options: MeasureGridOptions;
	#grid: GridInstance;
	#process: StepProcess | null = null;
	#hasDeletedItems: boolean = false;
	#processGridReloaded: boolean = false;
	#originalRemoveSelected: GridInstance['removeSelected'] | null = null;
	#originalSendRowAction: GridInstance['sendRowAction'] | null = null;
	#singleDeletePending: boolean = false;
	#batchDeletePending: boolean = false;

	private constructor(options: MeasureGridOptions, grid: GridInstance)
	{
		this.#options = options;
		this.#grid = grid;
		this.#bindGridActions();
		this.#bindPageEvents();
	}

	static create(options: MeasureGridOptions): MeasureGrid | null
	{
		MeasureGrid.#validateOptions(options);

		const grid = MeasureGrid.#getGrid(options.gridId);
		if (grid === null)
		{
			return null;
		}

		const existingInstance = MeasureGrid.#instances.get(options.gridId);
		if (existingInstance)
		{
			existingInstance.#reinitialize(options, grid);

			return existingInstance;
		}

		const instance = new MeasureGrid(options, grid);
		MeasureGrid.#instances.set(options.gridId, instance);

		return instance;
	}

	static handleEditAction(gridId: string, url: string): boolean
	{
		const instance = MeasureGrid.#instances.get(gridId);
		if (!instance || !instance.#options.isSlider)
		{
			return true;
		}

		return !instance.#openEditSlider(url);
	}

	static #validateOptions(options: MeasureGridOptions): void
	{
		if (
			!Type.isPlainObject(options)
			|| !Type.isStringFilled(options.gridId)
			|| !Type.isStringFilled(options.componentName)
			|| !Type.isString(options.editUrlTemplate)
			|| !Type.isBoolean(options.isSlider)
		)
		{
			throw new TypeError('Invalid MeasureGrid options.');
		}
	}

	static #getGrid(gridId: string): GridInstance | null
	{
		if (!Reflection.getClass('BX.Main.gridManager.getInstanceById'))
		{
			return null;
		}

		return BX.Main.gridManager.getInstanceById(gridId) ?? null;
	}

	#reinitialize(options: MeasureGridOptions, grid: GridInstance): void
	{
		this.#options = options;
		if (this.#grid === grid)
		{
			return;
		}

		this.#unbindGridActions();
		this.#grid = grid;
		this.#bindGridActions();
	}

	#bindGridActions(): void
	{
		this.#originalRemoveSelected = this.#grid.removeSelected;
		this.#originalSendRowAction = this.#grid.sendRowAction;
		this.#grid.removeSelected = this.#handleRemoveSelected;
		this.#grid.sendRowAction = this.#handleSendRowAction;
	}

	#unbindGridActions(): void
	{
		if (this.#grid.removeSelected === this.#handleRemoveSelected && this.#originalRemoveSelected)
		{
			this.#grid.removeSelected = this.#originalRemoveSelected;
		}

		if (this.#grid.sendRowAction === this.#handleSendRowAction && this.#originalSendRowAction)
		{
			this.#grid.sendRowAction = this.#originalSendRowAction;
		}

		this.#originalRemoveSelected = null;
		this.#originalSendRowAction = null;
	}

	#bindPageEvents(): void
	{
		Event.bind(document, 'click', this.#handleDocumentClick);
		Event.bind(window, 'unload', this.#destroy);
	}

	#unbindPageEvents(): void
	{
		Event.unbind(document, 'click', this.#handleDocumentClick);
		Event.unbind(window, 'unload', this.#destroy);
	}

	#destroy = (): void => {
		this.#unbindPageEvents();
		this.#unbindGridActions();
		MeasureGrid.#instances.delete(this.#options.gridId);
	};

	#handleDocumentClick = (event: MouseEvent): void => {
		if (
			!this.#options.isSlider
			|| event.defaultPrevented
			|| event.button !== 0
			|| event.altKey
			|| event.ctrlKey
			|| event.metaKey
			|| event.shiftKey
			|| !(event.target instanceof Element)
		)
		{
			return;
		}

		const link = event.target.closest('a[href]');
		if (
			!(link instanceof HTMLAnchorElement)
			|| link.hasAttribute('download')
			|| (link.target !== '' && link.target !== '_self')
		)
		{
			return;
		}

		const url = link.getAttribute('href');
		if (!this.#isEditUrl(url) || !this.#openEditSlider(url))
		{
			return;
		}

		event.preventDefault();
	};

	#isEditUrl(url: string | null): url is string
	{
		if (!Type.isStringFilled(url))
		{
			return false;
		}

		const placeholderPosition = this.#options.editUrlTemplate.indexOf(MEASURE_ID_PLACEHOLDER);
		if (placeholderPosition < 0)
		{
			return false;
		}

		const prefix = this.#options.editUrlTemplate.slice(0, placeholderPosition);
		const suffix = this.#options.editUrlTemplate.slice(
			placeholderPosition + MEASURE_ID_PLACEHOLDER.length,
		);
		const [urlPath] = url.split(/[#?]/);
		if (!urlPath.startsWith(prefix) || !urlPath.endsWith(suffix))
		{
			return false;
		}

		const measureId = urlPath.slice(prefix.length, suffix === '' ? undefined : -suffix.length);

		return /^\d+$/.test(measureId);
	}

	#openEditSlider(url: string): boolean
	{
		const sidePanel = Reflection.getClass('BX.SidePanel.Instance') as SidePanelInstance | null;
		if (!sidePanel || !Type.isFunction(sidePanel.open))
		{
			return false;
		}

		sidePanel.open(url, {
			cacheable: false,
			events: {
				onClose: this.#handleEditSliderClose,
			},
		});

		return true;
	}

	#handleEditSliderClose = (event: SidePanelEvent): void => {
		if (event.getSlider()?.getData().get(SLIDER_SAVE_STATUS_KEY) === true)
		{
			this.#grid.reload();
		}
	};

	#handleRemoveSelected = (): void => {
		if (
			this.#process
			&& (
				this.#process.getState() === ProcessState.running
				|| this.#process.getState() === ProcessState.canceling
			)
		)
		{
			this.#process.showDialog();

			return;
		}

		if (this.#batchDeletePending)
		{
			return;
		}

		const request = this.#getBatchDeleteRequest();
		if (request === null)
		{
			return;
		}

		this.#batchDeletePending = true;
		this.#showDeleteConfirmation(
			'CRM_MEASURE_GRID_BATCH_DELETE_TITLE',
			'CRM_MEASURE_GRID_BATCH_DELETE_WARNING',
			'CRM_MEASURE_GRID_BATCH_DELETE_BUTTON',
			() => {
				this.#batchDeletePending = false;
				this.#startDeletion(request);
			},
			() => {
				this.#batchDeletePending = false;
			},
		);
	};

	#handleSendRowAction = (action: string, data: Record<string, unknown> = {}): void => {
		if (action !== DELETE_ACTION)
		{
			this.#originalSendRowAction?.call(this.#grid, action, data);

			return;
		}

		const id = Number(data.id);
		if (!Number.isInteger(id) || id <= 0)
		{
			return;
		}

		if (this.#singleDeletePending)
		{
			return;
		}

		this.#singleDeletePending = true;
		this.#showDeleteConfirmation(
			'CRM_MEASURE_GRID_SINGLE_DELETE_TITLE',
			'CRM_MEASURE_GRID_SINGLE_DELETE_WARNING',
			'CRM_MEASURE_GRID_SINGLE_DELETE_BUTTON',
			() => this.#deleteSingleItem(id),
			() => {
				this.#singleDeletePending = false;
			},
		);
	};

	#showDeleteConfirmation(
		titleMessageId: string,
		warningMessageId: string,
		confirmButtonMessageId: string,
		onConfirm: () => void,
		onCancel: () => void,
	): void
	{
		let settled = false;
		const dialog = new Dialog({
			title: Loc.getMessage(titleMessageId) ?? '',
			content: Tag.render`
				<div data-testid="crm-measure-delete-dialog-content">
					${Loc.getMessage(warningMessageId) ?? ''}
				</div>
			`,
			centerButtons: [
				new Button({
					text: Loc.getMessage(confirmButtonMessageId) ?? '',
					dataset: {
						testid: 'crm-measure-delete-dialog-confirm-button',
					},
					size: ButtonSize.LARGE,
					style: AirButtonStyle.FILLED,
					useAirDesign: true,
					onclick: () => {
						if (settled)
						{
							return {};
						}

						settled = true;
						dialog.hide();
						onConfirm();

						return {};
					},
				} as unknown as ButtonOptions),
				new CancelButton({
					dataset: {
						testid: 'crm-measure-delete-dialog-cancel-button',
					},
					size: ButtonSize.LARGE,
					style: AirButtonStyle.OUTLINE,
					useAirDesign: true,
					onclick: () => {
						dialog.hide();

						return {};
					},
				} as unknown as ButtonOptions),
			],
			hasOverlay: true,
			closeByEsc: true,
			closeByClickOutside: true,
			events: {
				onShow: () => {},
				onAfterShow: () => {},
				onHide: () => {
					if (settled)
					{
						return;
					}

					settled = true;
					onCancel();
				},
				onAfterHide: () => {},
			},
		});
		dialog.show();
	}

	async #deleteSingleItem(id: number): Promise<void>
	{
		try
		{
			await ajax.runComponentAction(this.#options.componentName, 'deleteItem', {
				mode: 'class',
				data: { id },
			});
			this.#grid.reload();
		}
		catch (response)
		{
			const errorResponse = response as { errors?: Array<{ message?: unknown }> };
			const serverMessage = errorResponse.errors?.[0]?.message;
			const message = Type.isStringFilled(serverMessage)
				? serverMessage
				: (Loc.getMessage('CRM_MEASURE_GRID_SINGLE_DELETE_ERROR') ?? '')
			;
			BX.UI.Notification.Center.notify({
				content: Text.encode(message),
				autoHideDelay: 5000,
			});
		}
		finally
		{
			this.#singleDeletePending = false;
		}
	}

	#getBatchDeleteRequest(): BatchDeleteRequest | null
	{
		const actionPanelValues = this.#grid.getActionsPanel()?.getValues() ?? {};
		if (actionPanelValues[this.#grid.getForAllKey()] === FOR_ALL_VALUE)
		{
			return { scope: ALL_SCOPE };
		}

		const ids = this.#grid
			.getRows()
			.getSelectedIds()
			.map((id) => Number(id))
			.filter((id) => Number.isInteger(id) && id > 0)
		;

		return ids.length > 0 ? { scope: SELECTED_SCOPE, ids } : null;
	}

	#startDeletion(request: BatchDeleteRequest): void
	{
		if (
			this.#process
			&& (
				this.#process.getState() === ProcessState.running
				|| this.#process.getState() === ProcessState.canceling
			)
		)
		{
			this.#process.showDialog();

			return;
		}

		this.#hasDeletedItems = false;
		this.#processGridReloaded = false;

		const processOptions = {
			id: `crm-measure-grid-delete-${this.#options.gridId}`,
			component: this.#options.componentName,
			componentMode: 'class' as const,
			method: 'POST' as const,
			params: request,
			messages: {
				DialogTitle: Loc.getMessage('CRM_MEASURE_GRID_PROCESS_TITLE') ?? '',
				DialogSummary: Loc.getMessage('CRM_MEASURE_GRID_PROCESS_SUMMARY') ?? '',
			},
			queue: [
				{
					action: DELETE_ACTION,
					title: Loc.getMessage('CRM_MEASURE_GRID_PROCESS_SUMMARY') ?? '',
					progressBarTitle: Loc.getMessage('CRM_MEASURE_GRID_PROCESS_PROGRESS') ?? '',
					handlers: {
						[ProcessCallback.StepCompleted]: this.#handleStepCompleted,
					},
				},
			],
			handlers: {
				[ProcessCallback.RequestStart]: this.#handleRequestStart,
				[ProcessCallback.StateChanged]: this.#handleProcessStateChanged,
			},
		};

		// create() replaces the terminal instance with the same id. Deleting it crashes if its dialog is closed.
		this.#process = ProcessManager.create(processOptions) as unknown as StepProcess;

		this.#process.showDialog();
		this.#process.start();
	}

	#handleRequestStart = (actionData: FormData): void => {
		const processToken = actionData.get('PROCESS_TOKEN');
		if (!Type.isStringFilled(processToken))
		{
			return;
		}

		try
		{
			window.sessionStorage.setItem(this.#getProcessTokenStorageKey(), processToken);
		}
		catch
		{
			// sessionStorage can be unavailable in restricted browser contexts.
		}
	};

	#handleStepCompleted = (status: string, result: BatchDeleteResult): void => {
		if (
			status !== ProcessResultStatus.progress
			&& status !== ProcessResultStatus.completed
		)
		{
			return;
		}

		const errors = Type.isArray(result.ERRORS) ? result.ERRORS : [];
		const errorMessages = errors
			.filter((error) => (
				Type.isPlainObject(error)
				&& Number.isInteger(error.id)
				&& error.id > 0
				&& Type.isStringFilled(error.message)
			))
			.map((error) => Loc.getMessage(
				'CRM_MEASURE_GRID_PARTIAL_ERROR',
				{
					'#ID#': String(error.id),
					'#MESSAGE#': error.message,
				},
			) ?? '')
		;

		if (errorMessages.length > 0)
		{
			const errorList = errorMessages.map((message) => Text.encode(message)).join('<br>');
			this.#process?.getDialog().setErrors([errorList], true);
		}

		if (
			Type.isNumber(result.DELETED_ITEMS)
			&& result.DELETED_ITEMS > 0
		)
		{
			this.#hasDeletedItems = true;
		}
	};

	#handleProcessStateChanged = (state: string): void => {
		if (
			state === ProcessState.completed
			|| state === ProcessState.stopped
			|| state === ProcessState.error
		)
		{
			this.#clearProcessToken();
			this.#reloadGridIfNeeded();
		}
	};

	#reloadGridIfNeeded(): void
	{
		if (!this.#hasDeletedItems || this.#processGridReloaded)
		{
			return;
		}

		this.#processGridReloaded = true;
		this.#grid.reload();
	}

	#clearProcessToken(): void
	{
		try
		{
			window.sessionStorage.removeItem(this.#getProcessTokenStorageKey());
		}
		catch
		{
			// sessionStorage can be unavailable in restricted browser contexts.
		}
	}

	#getProcessTokenStorageKey(): string
	{
		return `crm.measure-grid.${this.#options.gridId}.process-token`;
	}
}
