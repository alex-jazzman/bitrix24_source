import { Dom, Event, Loc, Type } from 'main.core';
import { LiveAnnouncer } from 'ui.a11y';
import { MessageBox, MessageBoxButtons } from 'ui.dialogs.messagebox';
import { UI } from 'ui.notification';
import { Process, ProcessCallback, ProcessResultStatus, ProcessState } from 'ui.stepprocessing';
import { Api } from 'sign.v2.api';
import './style.css';

const PROCESS_ID = 'SignMyDocumentsBulkActionProcess';
export const BulkActionResultType = Object.freeze({
	full: 'full',
	partial: 'partial',
	zero: 'zero',
	stopped: 'stopped',
	fatal: 'fatal',
});

type BulkActionResultTypeValue = 'full' | 'partial' | 'zero' | 'stopped' | 'fatal';

type BulkActionProcessLabels = {
	dialogTitle: string,
	dialogSummary: string,
	approveProcessAction: string,
	rejectProcessAction: string,
	approveResultAction: string,
	rejectResultAction: string,
	start: string,
	stop: string,
	close: string,
	progressTitle: string,
	running: string,
	stopping: string,
	startedAnnouncement: string,
	chunkAnnouncement: string,
	fullResult: string,
	// plural forms: the noun agrees with #TOTAL#, so the form is picked when the total is known
	partialResult: (total: number) => string,
	zeroResult: (total: number) => string,
	stoppedResult: (total: number) => string,
	fatalResult: string,
	details: string,
	detailsTitle: string,
};

type BulkActionResult = {
	type: BulkActionResultTypeValue,
	processedItems: number,
	totalItems: number,
	succeededMemberIds: number[],
	failedItems: Array<{ memberId: number, title: ?string }>,
	failedTitles: string[],
	limitApplied: boolean,
	warning: string,
};

type BulkActionProcessOptions = {
	actionType: 'approve' | 'reject',
	memberIds: number[],
	trigger?: ?HTMLElement,
	labels?: BulkActionProcessLabels,
	onStart?: () => void,
	onTerminal?: (result: BulkActionResult) => void,
	onDialogClosed?: (?HTMLElement) => void,
	api?: Api,
	processFactory?: (Object) => Process,
	announce?: (string, string) => void,
	notify?: (Object) => void,
};

export class BulkActionProcess
{
	#actionType: 'approve' | 'reject';
	#memberIds: number[];
	#trigger: ?HTMLElement;
	#labels: BulkActionProcessLabels;
	#onStart: ?Function;
	#onTerminal: ?Function;
	#onDialogClosed: ?Function;
	#api: Api;
	#processFactory: Function;
	#announce: Function;
	#notify: Function;
	#process: ?Process = null;
	#detailsBox: ?MessageBox = null;
	#processedItems = 0;
	#totalItems = 0;
	#lastProcessedId = 0;
	#succeededMemberIds: Set<number> = new Set();
	#failedItems: Map<number, ?string> = new Map();
	#limitApplied = false;
	#warning = '';
	#stopRequested = false;
	#stopAtBoundaryCalled = false;
	#started = false;
	#terminal = false;
	#dialogClosed = false;
	#displayedItems = 0;
	#progressTarget = 0;
	#animationFrameId: ?number = null;
	#escapeHandler = (event: KeyboardEvent) => {
		if (event.key !== 'Escape')
		{
			return;
		}

		if (this.#detailsBox?.getPopupWindow().isShown())
		{
			return;
		}

		event.preventDefault();
		if (this.#isRunning())
		{
			this.requestStop();
		}
		else
		{
			this.#process?.closeDialog();
		}
	};

	constructor(options: BulkActionProcessOptions)
	{
		this.#actionType = options.actionType;
		this.#memberIds = Object.freeze([...new Set(options.memberIds)]);
		this.#trigger = options.trigger ?? null;
		this.#labels = {
			...this.#getDefaultLabels(),
			...(Type.isPlainObject(options.labels) ? options.labels : {}),
		};
		this.#onStart = options.onStart;
		this.#onTerminal = options.onTerminal;
		this.#onDialogClosed = options.onDialogClosed;
		this.#api = options.api ?? new Api();
		this.#processFactory = options.processFactory ?? ((processOptions) => new Process(processOptions));
		this.#announce = options.announce ?? ((message, priority) => LiveAnnouncer.announce(message, priority));
		this.#notify = options.notify ?? ((notificationOptions) => UI.Notification.Center.notify(notificationOptions));
	}

	show(): void
	{
		if (this.#process !== null)
		{
			return;
		}

		const processOptions = this.#api.myDocuments.getBulkActionProcessOptions({
			actionType: this.#actionType,
			memberIds: this.#memberIds,
		});
		this.#process = this.#processFactory({
			id: PROCESS_ID,
			controller: processOptions.controller,
			params: processOptions.params,
			messages: {
				DialogTitle: this.#labels.dialogTitle,
				DialogSummary: this.#format(this.#labels.dialogSummary, {
					ACTION: this.#labels[`${this.#actionType}ProcessAction`],
					TOTAL: this.#memberIds.length,
				}),
				RequestCanceling: this.#labels.stopping,
				RequestCanceled: this.#labels.stoppedResult(this.#memberIds.length),
				RequestCompleted: this.#labels.fullResult,
				RequestError: this.#labels.fatalResult,
			},
			showButtons: { start: true, stop: true, close: true },
			dialogMaxWidth: 600,
			popupOptions: {
				focusTrap: true,
				closeByEsc: false,
				resizable: false,
				draggable: false,
				disableScroll: true,
			},
			handlers: {
				[ProcessCallback.StateChanged]: (state) => this.#handleStateChanged(state),
				[ProcessCallback.RequestStop]: () => {},
				dialogClosed: () => this.#handleDialogClosed(),
			},
		});
		this.#process.addQueueAction({
			action: processOptions.action,
			title: this.#labels.running,
			progressBarTitle: this.#labels.progressTitle,
			handlers: {
				[ProcessCallback.StepCompleted]: (status, result) => this.#handleStepCompleted(status, result),
			},
		});

		const dialog = this.#process.getDialog();
		dialog.setHandler('stop', () => this.requestStop());
		this.#process.showDialog();
		this.#decorateDialog();
		Event.bind(document, 'keydown', this.#escapeHandler, true);
	}

	requestStop(): void
	{
		if (!this.#isRunning() || this.#stopRequested)
		{
			return;
		}

		this.#stopRequested = true;
		this.#process?.getDialog()
			.setSummary(this.#labels.stopping)
			.lockButton('stop', true)
			.lockButton('close', true)
		;
		this.#announce(this.#labels.stopping, 'polite');
	}

	getResult(type: BulkActionResultTypeValue = this.#getCompletedResultType()): BulkActionResult
	{
		return {
			type,
			processedItems: this.#processedItems,
			totalItems: this.#totalItems,
			succeededMemberIds: [...this.#succeededMemberIds],
			failedItems: [...this.#failedItems].map(([memberId, title]) => ({ memberId, title })),
			failedTitles: [...new Set([...this.#failedItems.values()].filter((title) => Type.isStringFilled(title)))],
			limitApplied: this.#limitApplied,
			warning: this.#warning,
		};
	}

	#handleStepCompleted(status: string, result: Object): void
	{
		this.#accumulateResult(result);
		this.#queueProgressAnimation();

		if (status === ProcessResultStatus.progress)
		{
			const currentData = this.#process?.getParam('data');
			const data = Type.isPlainObject(currentData) ? { ...currentData } : {};
			data.processedItems = this.#processedItems;
			data.lastProcessedId = this.#lastProcessedId;
			this.#process?.setParam('data', data);

			if (this.#stopRequested && !this.#stopAtBoundaryCalled)
			{
				this.#stopAtBoundaryCalled = true;
				this.#process?.stopRequest();
			}
		}
	}

	#accumulateResult(result: Object): void
	{
		this.#processedItems = this.#readCounter(result.PROCESSED_ITEMS, this.#processedItems);
		this.#totalItems = this.#readCounter(result.TOTAL_ITEMS, this.#totalItems);
		this.#lastProcessedId = this.#readCounter(result.LAST_PROCESSED_ID, this.#lastProcessedId);
		this.#limitApplied = this.#limitApplied || result.LIMIT_APPLIED === true;
		if (Type.isStringFilled(result.WARNING))
		{
			this.#warning = result.WARNING;
		}

		(result.SUCCEEDED_MEMBER_IDS ?? []).forEach((memberId) => {
			const id = Number(memberId);
			if (!Number.isInteger(id) || id <= 0)
			{
				return;
			}

			this.#succeededMemberIds.add(id);
			this.#failedItems.delete(id);
		});
		(result.FAILED_ITEMS ?? []).forEach((item) => {
			const memberId = Number(item?.memberId);
			if (!Number.isInteger(memberId) || memberId <= 0 || this.#succeededMemberIds.has(memberId))
			{
				return;
			}

			this.#failedItems.set(memberId, Type.isStringFilled(item.title) ? item.title : null);
		});

		if (this.#started)
		{
			this.#announce(this.#format(this.#labels.chunkAnnouncement, {
				PROCESSED: this.#processedItems,
				TOTAL: this.#totalItems,
			}), 'polite');
		}
	}

	#handleStateChanged(state: string): void
	{
		if (state === ProcessState.running)
		{
			if (!this.#started)
			{
				this.#started = true;
				this.#onStart?.();
				this.#announce(this.#labels.startedAnnouncement, 'polite');
			}

			const dialog = this.#process?.getDialog();
			dialog?.showButton('close', true);
			this.#setDisplayedProgress(0);
			this.#decorateDialog();

			return;
		}

		switch (state)
		{
			case ProcessState.completed:
				this.#complete(this.#getCompletedResultType());
				break;
			case ProcessState.stopped:
				this.#complete(BulkActionResultType.stopped);
				break;
			case ProcessState.error:
				this.#process?.getDialog().clearErrors().setError(this.#labels.fatalResult, false);
				this.#complete(BulkActionResultType.fatal);
				break;
			default:
				break;
		}
	}

	#complete(type: BulkActionResultTypeValue): void
	{
		if (this.#terminal)
		{
			return;
		}

		this.#terminal = true;
		this.#finishProgressAnimation();
		const result = this.getResult(type);
		const message = this.#getResultMessage(result);
		const dialog = this.#process?.getDialog();
		dialog?.setSummary(message, false).lockButton('stop', true).showButton('close', true);
		this.#decorateDialog();
		this.#renderDetailsButton(result.failedTitles);
		this.#notify({
			content: message,
			autoHideDelay: 6000,
		});
		this.#announce(message, type === BulkActionResultType.fatal ? 'assertive' : 'polite');
		this.#onTerminal?.(result);
	}

	#getCompletedResultType(): BulkActionResultTypeValue
	{
		if (this.#succeededMemberIds.size === 0)
		{
			return BulkActionResultType.zero;
		}

		return this.#failedItems.size === 0 && this.#succeededMemberIds.size === this.#totalItems
			? BulkActionResultType.full
			: BulkActionResultType.partial
		;
	}

	#getResultMessage(result: BulkActionResult): string
	{
		const messageByType = {
			[BulkActionResultType.full]: this.#labels.fullResult,
			[BulkActionResultType.partial]: this.#labels.partialResult(result.totalItems),
			[BulkActionResultType.zero]: this.#labels.zeroResult(result.totalItems),
			[BulkActionResultType.stopped]: this.#labels.stoppedResult(result.totalItems),
			[BulkActionResultType.fatal]: this.#labels.fatalResult,
		};

		const resultMessage = this.#format(messageByType[result.type], {
			ACTION: this.#labels[`${this.#actionType}ResultAction`],
			SUCCESS: result.succeededMemberIds.length,
			PROCESSED: result.processedItems,
			TOTAL: result.totalItems,
		});

		return result.limitApplied && Type.isStringFilled(result.warning)
			? `${result.warning}. ${resultMessage}`
			: resultMessage
		;
	}

	#decorateDialog(): void
	{
		const dialog = this.#process?.getDialog();
		const popupContainer = dialog?.popupWindow?.getPopupContainer?.();
		if (popupContainer)
		{
			popupContainer.dataset.testid = 'sign-my-documents-bulk-dialog';
		}

		if (dialog?.progressBarBlock)
		{
			dialog.progressBarBlock.dataset.testid = 'sign-my-documents-bulk-progress';
			dialog.progressBarBlock.setAttribute('role', 'progressbar');
			dialog.progressBarBlock.setAttribute('aria-label', this.#labels.progressTitle);
			dialog.progressBarBlock.setAttribute('aria-valuemin', '0');
		}

		this.#prepareButton(dialog?.getButton('start')?.getContainer(), 'sign-my-documents-bulk-start');
		this.#prepareButton(dialog?.getButton('stop')?.getContainer(), 'sign-my-documents-bulk-stop');
		this.#prepareButton(dialog?.getButton('close')?.getContainer(), 'sign-my-documents-bulk-close', true);
		this.#prepareButton(dialog?.popupWindow?.closeIcon, 'sign-my-documents-bulk-close-icon', true);
		this.#updateProgressAccessibility();
	}

	#prepareButton(button: ?HTMLElement, testId: string, interceptClose: boolean = false): void
	{
		if (!button)
		{
			return;
		}

		const targetButton = button;
		targetButton.dataset.testid = testId;
		if (interceptClose && targetButton.dataset.signBulkCloseBound !== 'true')
		{
			targetButton.dataset.signBulkCloseBound = 'true';
			Event.bind(targetButton, 'click', (event) => {
				if (!this.#isRunning())
				{
					return;
				}

				event.preventDefault();
				event.stopImmediatePropagation();
				this.requestStop();
			}, true);
		}
	}

	#updateProgressAccessibility(): void
	{
		const progress = this.#process?.getDialog()?.progressBarBlock;
		if (!progress)
		{
			return;
		}

		progress.setAttribute('aria-valuenow', String(this.#displayedItems));
		progress.setAttribute('aria-valuemax', String(this.#getProgressTotal()));
		progress.setAttribute('aria-valuetext', this.#format(this.#labels.chunkAnnouncement, {
			PROCESSED: this.#displayedItems,
			TOTAL: this.#getProgressTotal(),
		}));
	}

	#queueProgressAnimation(): void
	{
		this.#progressTarget = Math.min(this.#processedItems, this.#getProgressTotal());
		queueMicrotask(() => {
			if (this.#terminal)
			{
				return;
			}

			this.#displayedItems = Math.min(this.#displayedItems, this.#progressTarget);
			this.#setDisplayedProgress(this.#displayedItems);
			if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true)
			{
				this.#setDisplayedProgress(this.#progressTarget);

				return;
			}

			this.#requestAnimationFrame();
		});
	}

	#requestAnimationFrame(): void
	{
		if (this.#animationFrameId !== null || this.#displayedItems >= this.#progressTarget)
		{
			return;
		}

		this.#animationFrameId = window.requestAnimationFrame(() => {
			this.#animationFrameId = null;
			this.#advanceProgressAnimation();
		});
	}

	#advanceProgressAnimation(): void
	{
		if (this.#terminal || this.#displayedItems >= this.#progressTarget)
		{
			return;
		}

		this.#setDisplayedProgress(this.#displayedItems + 1);
		this.#requestAnimationFrame();
	}

	#finishProgressAnimation(): void
	{
		if (this.#animationFrameId !== null)
		{
			window.cancelAnimationFrame(this.#animationFrameId);
			this.#animationFrameId = null;
		}

		this.#progressTarget = Math.min(this.#processedItems, this.#getProgressTotal());
		this.#setDisplayedProgress(this.#progressTarget);
	}

	#setDisplayedProgress(processedItems: number): void
	{
		this.#displayedItems = processedItems;
		this.#process?.getDialog()?.setProgressBar(
			this.#getProgressTotal(),
			this.#displayedItems,
			this.#labels.progressTitle,
		);
		this.#updateProgressAccessibility();
	}

	// The server caps the batch, so its TOTAL_ITEMS wins over the selection size as soon as it arrives
	#getProgressTotal(): number
	{
		return this.#totalItems > 0
			? this.#totalItems
			: Math.max(this.#memberIds.length, 1)
		;
	}

	#renderDetailsButton(failedTitles: string[]): void
	{
		if (failedTitles.length === 0)
		{
			return;
		}

		const summary = this.#process?.getDialog()?.summaryBlock;
		if (!summary || summary.parentElement?.querySelector('[data-testid="sign-my-documents-bulk-details-button"]'))
		{
			return;
		}

		const button = document.createElement('button');
		button.type = 'button';
		button.className = 'sign-my-documents-bulk-details-button';
		button.dataset.testid = 'sign-my-documents-bulk-details-button';
		button.textContent = this.#labels.details;
		Event.bind(button, 'click', () => this.#showDetails(failedTitles));
		Dom.insertAfter(button, summary);
	}

	#showDetails(failedTitles: string[]): void
	{
		if (this.#detailsBox?.getPopupWindow().isShown())
		{
			return;
		}

		const list = document.createElement('ul');
		list.className = 'sign-my-documents-bulk-details';
		list.dataset.testid = 'sign-my-documents-bulk-details';
		failedTitles.forEach((title) => {
			const item = document.createElement('li');
			item.textContent = title;
			list.append(item);
		});

		this.#detailsBox = new MessageBox({
			title: this.#labels.detailsTitle,
			message: list,
			buttons: MessageBoxButtons.OK,
			popupOptions: {
				focusTrap: true,
				closeByEsc: true,
				events: {
					onClose: () => {
						this.#detailsBox = null;
					},
				},
			},
		});
		this.#detailsBox.show();
	}

	#handleDialogClosed(): void
	{
		if (this.#dialogClosed)
		{
			return;
		}

		this.#dialogClosed = true;
		Event.unbind(document, 'keydown', this.#escapeHandler, true);
		this.#onDialogClosed?.(this.#trigger);
	}

	#isRunning(): boolean
	{
		const state = this.#process?.getState?.();

		return state === ProcessState.running || state === ProcessState.canceling;
	}

	#readCounter(value: mixed, fallback: number): number
	{
		const counter = Number(value);

		return Number.isInteger(counter) && counter >= 0 ? counter : fallback;
	}

	#format(template: string, replacements: Object): string
	{
		return Object.entries(replacements).reduce(
			(message, [key, value]) => message.replaceAll(`#${key}#`, String(value)),
			template,
		);
	}

	#getDefaultLabels(): BulkActionProcessLabels
	{
		return {
			dialogTitle: Loc.getMessage('SIGN_MY_DOCUMENTS_BULK_DIALOG_TITLE'),
			dialogSummary: Loc.getMessage('SIGN_MY_DOCUMENTS_BULK_DIALOG_SUMMARY'),
			approveProcessAction: Loc.getMessage('SIGN_MY_DOCUMENTS_BULK_APPROVE_PROCESS_ACTION'),
			rejectProcessAction: Loc.getMessage('SIGN_MY_DOCUMENTS_BULK_REJECT_PROCESS_ACTION'),
			approveResultAction: Loc.getMessage('SIGN_MY_DOCUMENTS_BULK_APPROVE_RESULT_ACTION'),
			rejectResultAction: Loc.getMessage('SIGN_MY_DOCUMENTS_BULK_REJECT_RESULT_ACTION'),
			start: Loc.getMessage('SIGN_MY_DOCUMENTS_BULK_START'),
			stop: Loc.getMessage('SIGN_MY_DOCUMENTS_BULK_STOP'),
			close: Loc.getMessage('SIGN_MY_DOCUMENTS_BULK_CLOSE'),
			progressTitle: Loc.getMessage('SIGN_MY_DOCUMENTS_BULK_PROGRESS_TITLE'),
			running: Loc.getMessage('SIGN_MY_DOCUMENTS_BULK_RUNNING'),
			stopping: Loc.getMessage('SIGN_MY_DOCUMENTS_BULK_STOPPING'),
			startedAnnouncement: Loc.getMessage('SIGN_MY_DOCUMENTS_BULK_STARTED_ANNOUNCEMENT'),
			chunkAnnouncement: Loc.getMessage('SIGN_MY_DOCUMENTS_BULK_CHUNK_ANNOUNCEMENT'),
			fullResult: Loc.getMessage('SIGN_MY_DOCUMENTS_BULK_FULL_RESULT'),
			partialResult: (total: number) => Loc.getMessagePlural('SIGN_MY_DOCUMENTS_BULK_PARTIAL_RESULT', total),
			zeroResult: (total: number) => Loc.getMessagePlural('SIGN_MY_DOCUMENTS_BULK_ZERO_RESULT', total),
			stoppedResult: (total: number) => Loc.getMessagePlural('SIGN_MY_DOCUMENTS_BULK_STOPPED_RESULT', total),
			fatalResult: Loc.getMessage('SIGN_MY_DOCUMENTS_BULK_FATAL_RESULT'),
			details: Loc.getMessage('SIGN_MY_DOCUMENTS_BULK_DETAILS'),
			detailsTitle: Loc.getMessage('SIGN_MY_DOCUMENTS_BULK_DETAILS_TITLE'),
		};
	}
}
