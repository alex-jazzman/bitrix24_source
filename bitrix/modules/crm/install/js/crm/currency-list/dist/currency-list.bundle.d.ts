/* eslint-disable */
type CurrencyListOptions = {
	gridId: string;
	addUrl: string;
	editUrlTemplate: string;
	batchController: string;
	batchStorageKey: string;
	canEdit: boolean;
	canDelete: boolean;
};

type CurrencyListRuntime = {
	openSlider(url: string, options: {
		cacheable: boolean;
		events: {
			onCloseComplete(): void;
		};
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

type GridInstance = {
	reload(): void;
	sendRowAction(action: string, data: {
		currencyCode: string;
	}): void;
	getData(): GridData;
	getParam(name: string, defaultValue?: unknown): unknown;
	getId?(): string;
	getRows(): {
		getSelectedIds(): Array<string | number>;
	};
	getActionsPanel(): {
		getForAllCheckbox(): {
			checked: boolean;
		} | null;
	} | null;
};

type GridData = {
	request(url: string, method: string, data: Record<string, unknown>, action: string, onSuccess?: (...args: unknown[]) => void, onError?: (...args: unknown[]) => void): void;
};

type RowActionHandler = (action: string, data: {
	currencyCode?: string;
}, proceed: (callbacks?: RowActionCallbacks) => void) => void;

type RowActionCallbacks = {
	onSuccess?(): void;
	onError?(message: string): void;
};

type BatchDeletionEvent = BX.Event.BaseEvent & {
	getData(): {
		gridId?: string;
	};
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

type BatchProcess = {
	getId(): string;
	setParam(name: string, value: unknown): BatchProcess;
	getDialog(): BatchDialog;
	showDialog(): BatchProcess;
	start(): BatchProcess;
	stop(): BatchProcess;
};

type BatchDialog = {
	summaryBlock?: HTMLElement;
	setSummary(content: string, isHtml?: boolean): BatchDialog;
	setError(content: string, isHtml?: boolean): BatchDialog;
};

declare namespace BX.Crm {
	class CurrencyList {
		constructor(options: CurrencyListOptions, runtime?: CurrencyListRuntime);
		static create(options: CurrencyListOptions): CurrencyList;
		static openForm(url: string): boolean;
		init(): void;
		destroy(): void;
		getBatchController(): string;
	}
}
