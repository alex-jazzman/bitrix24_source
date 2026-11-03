import { Loc, Runtime } from 'main.core';
import { AirButtonStyle, Button, ButtonSize } from 'ui.buttons';
import { Dialog } from 'ui.system.dialog';

type Grid = {
	getRows: () => { getSelectedIds: () => Array<string | number> },
	getActionsPanel: () => { getValues: () => Record<string, unknown> },
	getForAllKey: () => string,
};

type Storage = Pick<globalThis.Storage, 'getItem' | 'setItem' | 'removeItem'>;

type Process = {
	showDialog: () => void,
	setParams: (params: Record<string, unknown>) => Process,
};

type BatchDeleteResult = {
	STATUS?: string,
	PROCESSED_ITEMS?: number,
	TOTAL_ITEMS?: number,
	SUCCESS_ITEMS?: number,
	FAILED_ITEMS?: number,
	SUMMARY?: string | null,
	SUMMARY_HTML?: string | null,
	WARNING?: string | null,
};

type StepCompletedHandler = (status: string, result: BatchDeleteResult) => void;

type StepHandlers = {
	RequestStart: (formData: FormData) => void,
	StepCompleted: StepCompletedHandler,
};

type ProcessHandlers = {
	StateChanged: (state: string, result?: BatchDeleteResult) => void,
	dialogClosed: () => void,
};

type Notification = {
	getActions: () => Array<{
		getId: () => string,
		getContainer: () => HTMLElement,
	}>,
};

type ProcessManager = {
	create: (options: ProcessOptions) => Process,
};

type ProcessRegistry = {
	isProcessRunning: (gridId: string) => boolean,
	registerProcessRun: (gridId: string) => void,
	registerProcessStop: (gridId: string) => void,
};

type ConfirmationDialog = {
	show: () => void,
	hide: () => void,
};

type ConfirmationButtonOptions = {
	text: string,
	size: string,
	style: string,
	useAirDesign: boolean,
	onclick: () => void,
};

type ConfirmationDialogOptions = {
	title: string,
	content: HTMLElement,
	centerButtons: unknown[],
	hasOverlay: boolean,
	hasCloseButton: boolean,
	closeByEsc: boolean,
};

type ConfirmationDialogConstructor = new (options: ConfirmationDialogOptions) => ConfirmationDialog;
type ConfirmationButtonConstructor = new (options: ConfirmationButtonOptions) => unknown;

type RuntimeDependencies = {
	Dialog: ConfirmationDialogConstructor,
	Button: ConfirmationButtonConstructor,
	buttonSizeLarge: string,
	buttonStyleFilled: string,
	buttonStyleOutline: string,
	processManager: ProcessManager,
	processRegistry: ProcessRegistry,
	processState: {
		completed: string,
		error: string,
	},
	notify: (options: Record<string, unknown>) => Notification | void,
};

type AutorunExtension = {
	ProcessRegistry: {
		isProcessRunning: (gridId: string) => boolean,
		Instance: {
			registerProcessRun: (gridId: string) => void,
			registerProcessStop: (gridId: string) => void,
		},
	},
};

type NotificationExtension = {
	Center: {
		notify: (options: Record<string, unknown>) => Notification | void,
	},
};

type StepProcessingExtension = {
	ProcessManager: ProcessManager,
	ProcessState: RuntimeDependencies['processState'],
};

type ProcessOptions = {
	id: string,
	controller: string,
	params: Record<string, unknown>,
	queue: Array<{
		action: string,
		title: string,
		progressBarTitle: string,
		handlers: StepHandlers,
	}>,
	handlers: ProcessHandlers,
	messages: Record<string, string>,
	showButtons: { start: boolean, stop: boolean, close: boolean },
};

type Dependencies = {
	ajax: {
		runAction: (
			action: string,
			options: { data: { PROCESS_TOKEN: string } },
		) => Promise<{ status: string, data: BatchDeleteResult, errors: unknown[] }>,
	},
	storage: Storage,
	getGrid: () => Grid,
	getFilterValues: () => Record<string, unknown>,
	loadRuntimeDependencies: () => Promise<RuntimeDependencies>,
};

type DependencyOverrides = Partial<Dependencies & RuntimeDependencies>;

export type BatchDeleteConfig = {
	gridId: string,
	filterId: string,
	controller: string,
	onReload: () => void,
};

const StorageKeyPrefix = 'crm.config.locations.batchDelete';

async function loadRuntimeDependencies(): Promise<RuntimeDependencies>
{
	const [autorun, notification, stepProcessing] = await Promise.all([
		Runtime.loadExtension('crm.autorun') as unknown as Promise<AutorunExtension>,
		Runtime.loadExtension('ui.notification') as unknown as Promise<NotificationExtension>,
		Runtime.loadExtension('ui.stepprocessing') as unknown as Promise<StepProcessingExtension>,
	]);

	return {
		Dialog,
		Button: Button as unknown as ConfirmationButtonConstructor,
		buttonSizeLarge: ButtonSize.LARGE,
		buttonStyleFilled: AirButtonStyle.FILLED,
		buttonStyleOutline: AirButtonStyle.OUTLINE,
		processManager: stepProcessing.ProcessManager,
		processRegistry: {
			isProcessRunning: (gridId) => autorun.ProcessRegistry.isProcessRunning(gridId),
			registerProcessRun: (gridId) => autorun.ProcessRegistry.Instance.registerProcessRun(gridId),
			registerProcessStop: (gridId) => autorun.ProcessRegistry.Instance.registerProcessStop(gridId),
		},
		processState: stepProcessing.ProcessState,
		notify: (options) => notification.Center.notify(options),
	};
}

export class BatchDeleteManager
{
	#config: BatchDeleteConfig;
	#dependencies: Dependencies;
	#runtimeDependencies: RuntimeDependencies | null;
	#runtimeDependenciesPromise: Promise<RuntimeDependencies> | null = null;
	#isRunning: boolean = false;
	#isRecoveryBlocked: boolean = false;
	#mayHaveMutated: boolean = false;
	#hasCompleted: boolean = false;

	constructor(config: BatchDeleteConfig, dependencies: DependencyOverrides = {})
	{
		this.#config = config;
		const injectedRuntimeDependencies = this.#getInjectedRuntimeDependencies(dependencies);
		this.#runtimeDependencies = dependencies.loadRuntimeDependencies === undefined
			? injectedRuntimeDependencies
			: null
		;
		this.#dependencies = {
			ajax: dependencies.ajax ?? BX.ajax,
			storage: dependencies.storage ?? window.sessionStorage,
			getGrid: dependencies.getGrid ?? (() => this.#getPlatformGrid()),
			getFilterValues: dependencies.getFilterValues ?? (() => this.#getPlatformFilterValues()),
			loadRuntimeDependencies: dependencies.loadRuntimeDependencies ?? loadRuntimeDependencies,
		};
	}

	async init(): Promise<void>
	{
		const token = this.#dependencies.storage.getItem(this.#storageKey());
		if (token === null || token === '')
		{
			return;
		}

		this.#isRecoveryBlocked = true;
		await this.#ensureRuntimeDependencies();
		await this.#recover(token);
	}

	execute(): void
	{
		if (this.#runtimeDependencies === null)
		{
			void this.#ensureRuntimeDependencies().then(() => this.#execute());

			return;
		}

		this.#execute();
	}

	#execute(): void
	{
		if (this.#isRunning || this.#isRecoveryBlocked)
		{
			return;
		}

		const runtimeDependencies = this.#getRuntimeDependencies();
		if (runtimeDependencies.processRegistry.isProcessRunning(this.#config.gridId))
		{
			this.#notify(this.#message('CRM_CONFIG_LOCATIONS_BATCH_DELETE_ANOTHER_PROCESS'));

			return;
		}

		const scope = this.#getScope();
		if (scope.mode === 'selected' && scope.ids.length === 0)
		{
			this.#notify(this.#message('CRM_CONFIG_LOCATIONS_BATCH_DELETE_NOT_SELECTED'));

			return;
		}

		const content = document.createElement('div');
		content.dataset.testid = 'crm-locations-batch-delete-confirm';
		content.textContent = this.#message('CRM_CONFIG_LOCATIONS_BATCH_DELETE_CONFIRM_TEXT');

		const dialog = new runtimeDependencies.Dialog({
			title: this.#message('CRM_CONFIG_LOCATIONS_BATCH_DELETE_CONFIRM_TITLE'),
			content,
			centerButtons: [
				new runtimeDependencies.Button({
					text: this.#message('CRM_CONFIG_LOCATIONS_BATCH_DELETE_CONFIRM_BUTTON'),
					size: runtimeDependencies.buttonSizeLarge,
					style: runtimeDependencies.buttonStyleFilled,
					useAirDesign: true,
					onclick: () => {
						dialog.hide();
						this.#start(scope);
					},
				}),
				new runtimeDependencies.Button({
					text: this.#message('CRM_CONFIG_LOCATIONS_BATCH_DELETE_CONFIRM_CANCEL'),
					size: runtimeDependencies.buttonSizeLarge,
					style: runtimeDependencies.buttonStyleOutline,
					useAirDesign: true,
					onclick: () => dialog.hide(),
				}),
			],
			hasOverlay: true,
			hasCloseButton: true,
			closeByEsc: true,
		});
		dialog.show();
	}

	#start(scope: { mode: 'selected' | 'all', ids: number[], filter: Record<string, unknown> }): void
	{
		const runtimeDependencies = this.#getRuntimeDependencies();
		if (
			this.#isRunning
			|| this.#isRecoveryBlocked
			|| runtimeDependencies.processRegistry.isProcessRunning(this.#config.gridId)
		)
		{
			return;
		}

		this.#isRunning = true;
		this.#mayHaveMutated = false;
		this.#hasCompleted = false;
		runtimeDependencies.processRegistry.registerProcessRun(this.#config.gridId);

		const process = runtimeDependencies.processManager.create({
			id: `crm_location_batch_delete_${this.#config.gridId}`,
			controller: this.#config.controller,
			params: scope,
			queue: [
				{
					action: 'process',
					title: this.#message('CRM_CONFIG_LOCATIONS_BATCH_DELETE_PROGRESS'),
					progressBarTitle: this.#message('CRM_CONFIG_LOCATIONS_BATCH_DELETE_PROGRESS'),
					handlers: {
						RequestStart: (formData: FormData) => {
							const token = String(formData.get('PROCESS_TOKEN') ?? '');
							if (token !== '')
							{
								this.#dependencies.storage.setItem(this.#storageKey(), token);
								process.setParams({ PROCESS_TOKEN: token });
							}

							this.#mayHaveMutated = true;
						},
						StepCompleted: (status: string, result: BatchDeleteResult) => {
							this.#hasCompleted = status === 'COMPLETED' && result.STATUS === 'COMPLETED';
						},
					},
				},
			],
			handlers: {
				StateChanged: (state: string) => {
					if (state === runtimeDependencies.processState.completed)
					{
						if (this.#hasCompleted)
						{
							this.#dependencies.storage.removeItem(this.#storageKey());
						}

						this.#finish();
					}
					else if (state === runtimeDependencies.processState.error)
					{
						this.#finish();
						const token = this.#dependencies.storage.getItem(this.#storageKey());
						if (token !== null && token !== '')
						{
							this.#isRecoveryBlocked = true;
							this.#showRecoveryError(token);
						}
					}
				},
				dialogClosed: () => {
					if (!this.#mayHaveMutated)
					{
						this.#finish();
					}
				},
			},
			messages: {
				DialogTitle: this.#message('CRM_CONFIG_LOCATIONS_BATCH_DELETE_TITLE'),
				DialogSummary: this.#message('CRM_CONFIG_LOCATIONS_BATCH_DELETE_SUMMARY'),
				RequestCanceling: this.#message('CRM_CONFIG_LOCATIONS_BATCH_DELETE_CANCELING'),
			},
			showButtons: {
				start: true,
				stop: true,
				close: true,
			},
		});

		process.showDialog();
	}

	#finish(): void
	{
		if (!this.#isRunning)
		{
			return;
		}

		this.#isRunning = false;
		this.#getRuntimeDependencies().processRegistry.registerProcessStop(this.#config.gridId);
		if (this.#mayHaveMutated)
		{
			this.#config.onReload();
		}
	}

	async #recover(token: string): Promise<void>
	{
		try
		{
			const response = await this.#dependencies.ajax.runAction(`${this.#config.controller}.cancel`, {
				data: { PROCESS_TOKEN: token },
			});

			if (response.data.STATUS !== 'COMPLETED')
			{
				throw new Error('Recovery cancel has not completed.');
			}

			this.#dependencies.storage.removeItem(this.#storageKey());
			this.#isRecoveryBlocked = false;
			this.#config.onReload();
		}
		catch
		{
			this.#isRecoveryBlocked = true;
			this.#showRecoveryError(token);
		}
	}

	#showRecoveryError(token: string): void
	{
		const notification = this.#getRuntimeDependencies().notify({
			content: this.#message('CRM_CONFIG_LOCATIONS_BATCH_DELETE_RECOVERY_ERROR'),
			autoHide: false,
			actions: [
				{
					id: 'retry',
					title: this.#message('CRM_CONFIG_LOCATIONS_BATCH_DELETE_RECOVERY_RETRY'),
					events: {
						click: () => {
							void this.#recover(token);
						},
					},
				},
			],
		});
		const retryAction = notification?.getActions().find((action) => action.getId() === 'retry');
		if (retryAction !== undefined)
		{
			retryAction.getContainer().dataset.testid = 'crm-locations-batch-delete-recovery-retry';
		}
	}

	#getScope(): { mode: 'selected' | 'all', ids: number[], filter: Record<string, unknown> }
	{
		const grid = this.#dependencies.getGrid();
		const values = grid.getActionsPanel().getValues();
		const forAll = values[grid.getForAllKey()] === 'Y';
		const filter = { ...this.#dependencies.getFilterValues() };
		if (!Object.hasOwn(filter, 'PARENT_ID') && !Object.hasOwn(filter, 'PARENT_ID_numsel'))
		{
			filter.PARENT_ID = 0;
		}

		return {
			mode: forAll ? 'all' : 'selected',
			ids: forAll
				? []
				: grid.getRows().getSelectedIds()
					.map((id) => Number(id))
					.filter((id) => Number.isInteger(id) && id > 0),
			filter,
		};
	}

	#getPlatformGrid(): Grid
	{
		const grid = BX.Main.gridManager.getInstanceById(this.#config.gridId);
		if (grid === null || grid === undefined)
		{
			throw new Error(`Grid "${this.#config.gridId}" is not initialized.`);
		}

		return grid;
	}

	#getPlatformFilterValues(): Record<string, unknown>
	{
		return BX.Main.filterManager.getById(this.#config.filterId)?.getFilterFieldsValues() ?? {};
	}

	#storageKey(): string
	{
		return `${StorageKeyPrefix}.${this.#config.gridId}`;
	}

	#notify(content: string): void
	{
		this.#getRuntimeDependencies().notify({ content, autoHide: true });
	}

	#getInjectedRuntimeDependencies(dependencies: DependencyOverrides): RuntimeDependencies | null
	{
		if (
			dependencies.Dialog === undefined
			|| dependencies.Button === undefined
			|| dependencies.buttonSizeLarge === undefined
			|| dependencies.buttonStyleFilled === undefined
			|| dependencies.buttonStyleOutline === undefined
			|| dependencies.processManager === undefined
			|| dependencies.processRegistry === undefined
			|| dependencies.processState === undefined
			|| dependencies.notify === undefined
		)
		{
			return null;
		}

		return {
			Dialog: dependencies.Dialog,
			Button: dependencies.Button,
			buttonSizeLarge: dependencies.buttonSizeLarge,
			buttonStyleFilled: dependencies.buttonStyleFilled,
			buttonStyleOutline: dependencies.buttonStyleOutline,
			processManager: dependencies.processManager,
			processRegistry: dependencies.processRegistry,
			processState: dependencies.processState,
			notify: dependencies.notify,
		};
	}

	async #ensureRuntimeDependencies(): Promise<RuntimeDependencies>
	{
		if (this.#runtimeDependencies !== null)
		{
			return this.#runtimeDependencies;
		}

		this.#runtimeDependenciesPromise ??= this.#dependencies.loadRuntimeDependencies();
		try
		{
			this.#runtimeDependencies = await this.#runtimeDependenciesPromise;

			return this.#runtimeDependencies;
		}
		catch (error)
		{
			this.#runtimeDependenciesPromise = null;

			throw error;
		}
	}

	#getRuntimeDependencies(): RuntimeDependencies
	{
		if (this.#runtimeDependencies === null)
		{
			throw new Error('Batch delete runtime dependencies are not loaded.');
		}

		return this.#runtimeDependencies;
	}

	#message(code: string): string
	{
		return Loc.getMessage(code) ?? '';
	}
}
