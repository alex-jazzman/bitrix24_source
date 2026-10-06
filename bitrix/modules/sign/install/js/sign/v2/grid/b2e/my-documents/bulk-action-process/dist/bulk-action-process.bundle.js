/* eslint-disable */
this.BX = this.BX || {};
this.BX.Sign = this.BX.Sign || {};
this.BX.Sign.V2 = this.BX.Sign.V2 || {};
this.BX.Sign.V2.Grid = this.BX.Sign.V2.Grid || {};
(function (exports, main_core, ui_a11y, ui_dialogs_messagebox, ui_notification, ui_stepprocessing, sign_v2_api) {
	'use strict';

	const PROCESS_ID = 'SignMyDocumentsBulkActionProcess';
	const BulkActionResultType = Object.freeze({
		full: 'full',
		partial: 'partial',
		zero: 'zero',
		stopped: 'stopped',
		fatal: 'fatal'
	});
	class BulkActionProcess {
		#actionType;
		#memberIds;
		#trigger;
		#labels;
		#onStart;
		#onTerminal;
		#onDialogClosed;
		#api;
		#processFactory;
		#announce;
		#notify;
		#process = null;
		#detailsBox = null;
		#processedItems = 0;
		#totalItems = 0;
		#lastProcessedId = 0;
		#succeededMemberIds = new Set();
		#failedItems = new Map();
		#limitApplied = false;
		#warning = '';
		#stopRequested = false;
		#stopAtBoundaryCalled = false;
		#started = false;
		#terminal = false;
		#dialogClosed = false;
		#displayedItems = 0;
		#progressTarget = 0;
		#animationFrameId = null;
		#escapeHandler = event => {
			if (event.key !== 'Escape') {
				return;
			}
			if (this.#detailsBox?.getPopupWindow().isShown()) {
				return;
			}
			event.preventDefault();
			if (this.#isRunning()) {
				this.requestStop();
			} else {
				this.#process?.closeDialog();
			}
		};
		constructor(options) {
			this.#actionType = options.actionType;
			this.#memberIds = Object.freeze([...new Set(options.memberIds)]);
			this.#trigger = options.trigger ?? null;
			this.#labels = {
				...this.#getDefaultLabels(),
				...(main_core.Type.isPlainObject(options.labels) ? options.labels : {})
			};
			this.#onStart = options.onStart;
			this.#onTerminal = options.onTerminal;
			this.#onDialogClosed = options.onDialogClosed;
			this.#api = options.api ?? new sign_v2_api.Api();
			this.#processFactory = options.processFactory ?? (processOptions => new ui_stepprocessing.Process(processOptions));
			this.#announce = options.announce ?? ((message, priority) => ui_a11y.LiveAnnouncer.announce(message, priority));
			this.#notify = options.notify ?? (notificationOptions => ui_notification.UI.Notification.Center.notify(notificationOptions));
		}
		show() {
			if (this.#process !== null) {
				return;
			}
			const processOptions = this.#api.myDocuments.getBulkActionProcessOptions({
				actionType: this.#actionType,
				memberIds: this.#memberIds
			});
			this.#process = this.#processFactory({
				id: PROCESS_ID,
				controller: processOptions.controller,
				params: processOptions.params,
				messages: {
					DialogTitle: this.#labels.dialogTitle,
					DialogSummary: this.#format(this.#labels.dialogSummary, {
						ACTION: this.#labels[`${this.#actionType}ProcessAction`],
						TOTAL: this.#memberIds.length
					}),
					RequestCanceling: this.#labels.stopping,
					RequestCanceled: this.#labels.stoppedResult(this.#memberIds.length),
					RequestCompleted: this.#labels.fullResult,
					RequestError: this.#labels.fatalResult
				},
				showButtons: {
					start: true,
					stop: true,
					close: true
				},
				dialogMaxWidth: 600,
				popupOptions: {
					focusTrap: true,
					closeByEsc: false,
					resizable: false,
					draggable: false,
					disableScroll: true
				},
				handlers: {
					[ui_stepprocessing.ProcessCallback.StateChanged]: state => this.#handleStateChanged(state),
					[ui_stepprocessing.ProcessCallback.RequestStop]: () => {},
					dialogClosed: () => this.#handleDialogClosed()
				}
			});
			this.#process.addQueueAction({
				action: processOptions.action,
				title: this.#labels.running,
				progressBarTitle: this.#labels.progressTitle,
				handlers: {
					[ui_stepprocessing.ProcessCallback.StepCompleted]: (status, result) => this.#handleStepCompleted(status, result)
				}
			});
			const dialog = this.#process.getDialog();
			dialog.setHandler('stop', () => this.requestStop());
			this.#process.showDialog();
			this.#decorateDialog();
			main_core.Event.bind(document, 'keydown', this.#escapeHandler, true);
		}
		requestStop() {
			if (!this.#isRunning() || this.#stopRequested) {
				return;
			}
			this.#stopRequested = true;
			this.#process?.getDialog().setSummary(this.#labels.stopping).lockButton('stop', true).lockButton('close', true);
			this.#announce(this.#labels.stopping, 'polite');
		}
		getResult(type = this.#getCompletedResultType()) {
			return {
				type,
				processedItems: this.#processedItems,
				totalItems: this.#totalItems,
				succeededMemberIds: [...this.#succeededMemberIds],
				failedItems: [...this.#failedItems].map(([memberId, title]) => ({
					memberId,
					title
				})),
				failedTitles: [...new Set([...this.#failedItems.values()].filter(title => main_core.Type.isStringFilled(title)))],
				limitApplied: this.#limitApplied,
				warning: this.#warning
			};
		}
		#handleStepCompleted(status, result) {
			this.#accumulateResult(result);
			this.#queueProgressAnimation();
			if (status === ui_stepprocessing.ProcessResultStatus.progress) {
				const currentData = this.#process?.getParam('data');
				const data = main_core.Type.isPlainObject(currentData) ? {
					...currentData
				} : {};
				data.processedItems = this.#processedItems;
				data.lastProcessedId = this.#lastProcessedId;
				this.#process?.setParam('data', data);
				if (this.#stopRequested && !this.#stopAtBoundaryCalled) {
					this.#stopAtBoundaryCalled = true;
					this.#process?.stopRequest();
				}
			}
		}
		#accumulateResult(result) {
			this.#processedItems = this.#readCounter(result.PROCESSED_ITEMS, this.#processedItems);
			this.#totalItems = this.#readCounter(result.TOTAL_ITEMS, this.#totalItems);
			this.#lastProcessedId = this.#readCounter(result.LAST_PROCESSED_ID, this.#lastProcessedId);
			this.#limitApplied = this.#limitApplied || result.LIMIT_APPLIED === true;
			if (main_core.Type.isStringFilled(result.WARNING)) {
				this.#warning = result.WARNING;
			}
			(result.SUCCEEDED_MEMBER_IDS ?? []).forEach(memberId => {
				const id = Number(memberId);
				if (!Number.isInteger(id) || id <= 0) {
					return;
				}
				this.#succeededMemberIds.add(id);
				this.#failedItems.delete(id);
			});
			(result.FAILED_ITEMS ?? []).forEach(item => {
				const memberId = Number(item?.memberId);
				if (!Number.isInteger(memberId) || memberId <= 0 || this.#succeededMemberIds.has(memberId)) {
					return;
				}
				this.#failedItems.set(memberId, main_core.Type.isStringFilled(item.title) ? item.title : null);
			});
			if (this.#started) {
				this.#announce(this.#format(this.#labels.chunkAnnouncement, {
					PROCESSED: this.#processedItems,
					TOTAL: this.#totalItems
				}), 'polite');
			}
		}
		#handleStateChanged(state) {
			if (state === ui_stepprocessing.ProcessState.running) {
				if (!this.#started) {
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
			switch (state) {
				case ui_stepprocessing.ProcessState.completed:
					this.#complete(this.#getCompletedResultType());
					break;
				case ui_stepprocessing.ProcessState.stopped:
					this.#complete(BulkActionResultType.stopped);
					break;
				case ui_stepprocessing.ProcessState.error:
					this.#process?.getDialog().clearErrors().setError(this.#labels.fatalResult, false);
					this.#complete(BulkActionResultType.fatal);
					break;
			}
		}
		#complete(type) {
			if (this.#terminal) {
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
				autoHideDelay: 6000
			});
			this.#announce(message, type === BulkActionResultType.fatal ? 'assertive' : 'polite');
			this.#onTerminal?.(result);
		}
		#getCompletedResultType() {
			if (this.#succeededMemberIds.size === 0) {
				return BulkActionResultType.zero;
			}
			return this.#failedItems.size === 0 && this.#succeededMemberIds.size === this.#totalItems ? BulkActionResultType.full : BulkActionResultType.partial;
		}
		#getResultMessage(result) {
			const messageByType = {
				[BulkActionResultType.full]: this.#labels.fullResult,
				[BulkActionResultType.partial]: this.#labels.partialResult(result.totalItems),
				[BulkActionResultType.zero]: this.#labels.zeroResult(result.totalItems),
				[BulkActionResultType.stopped]: this.#labels.stoppedResult(result.totalItems),
				[BulkActionResultType.fatal]: this.#labels.fatalResult
			};
			const resultMessage = this.#format(messageByType[result.type], {
				ACTION: this.#labels[`${this.#actionType}ResultAction`],
				SUCCESS: result.succeededMemberIds.length,
				PROCESSED: result.processedItems,
				TOTAL: result.totalItems
			});
			return result.limitApplied && main_core.Type.isStringFilled(result.warning) ? `${result.warning}. ${resultMessage}` : resultMessage;
		}
		#decorateDialog() {
			const dialog = this.#process?.getDialog();
			const popupContainer = dialog?.popupWindow?.getPopupContainer?.();
			if (popupContainer) {
				popupContainer.dataset.testid = 'sign-my-documents-bulk-dialog';
			}
			if (dialog?.progressBarBlock) {
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
		#prepareButton(button, testId, interceptClose = false) {
			if (!button) {
				return;
			}
			const targetButton = button;
			targetButton.dataset.testid = testId;
			if (interceptClose && targetButton.dataset.signBulkCloseBound !== 'true') {
				targetButton.dataset.signBulkCloseBound = 'true';
				main_core.Event.bind(targetButton, 'click', event => {
					if (!this.#isRunning()) {
						return;
					}
					event.preventDefault();
					event.stopImmediatePropagation();
					this.requestStop();
				}, true);
			}
		}
		#updateProgressAccessibility() {
			const progress = this.#process?.getDialog()?.progressBarBlock;
			if (!progress) {
				return;
			}
			progress.setAttribute('aria-valuenow', String(this.#displayedItems));
			progress.setAttribute('aria-valuemax', String(this.#getProgressTotal()));
			progress.setAttribute('aria-valuetext', this.#format(this.#labels.chunkAnnouncement, {
				PROCESSED: this.#displayedItems,
				TOTAL: this.#getProgressTotal()
			}));
		}
		#queueProgressAnimation() {
			this.#progressTarget = Math.min(this.#processedItems, this.#getProgressTotal());
			queueMicrotask(() => {
				if (this.#terminal) {
					return;
				}
				this.#displayedItems = Math.min(this.#displayedItems, this.#progressTarget);
				this.#setDisplayedProgress(this.#displayedItems);
				if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true) {
					this.#setDisplayedProgress(this.#progressTarget);
					return;
				}
				this.#requestAnimationFrame();
			});
		}
		#requestAnimationFrame() {
			if (this.#animationFrameId !== null || this.#displayedItems >= this.#progressTarget) {
				return;
			}
			this.#animationFrameId = window.requestAnimationFrame(() => {
				this.#animationFrameId = null;
				this.#advanceProgressAnimation();
			});
		}
		#advanceProgressAnimation() {
			if (this.#terminal || this.#displayedItems >= this.#progressTarget) {
				return;
			}
			this.#setDisplayedProgress(this.#displayedItems + 1);
			this.#requestAnimationFrame();
		}
		#finishProgressAnimation() {
			if (this.#animationFrameId !== null) {
				window.cancelAnimationFrame(this.#animationFrameId);
				this.#animationFrameId = null;
			}
			this.#progressTarget = Math.min(this.#processedItems, this.#getProgressTotal());
			this.#setDisplayedProgress(this.#progressTarget);
		}
		#setDisplayedProgress(processedItems) {
			this.#displayedItems = processedItems;
			this.#process?.getDialog()?.setProgressBar(this.#getProgressTotal(), this.#displayedItems, this.#labels.progressTitle);
			this.#updateProgressAccessibility();
		}

		// The server caps the batch, so its TOTAL_ITEMS wins over the selection size as soon as it arrives
		#getProgressTotal() {
			return this.#totalItems > 0 ? this.#totalItems : Math.max(this.#memberIds.length, 1);
		}
		#renderDetailsButton(failedTitles) {
			if (failedTitles.length === 0) {
				return;
			}
			const summary = this.#process?.getDialog()?.summaryBlock;
			if (!summary || summary.parentElement?.querySelector('[data-testid="sign-my-documents-bulk-details-button"]')) {
				return;
			}
			const button = document.createElement('button');
			button.type = 'button';
			button.className = 'sign-my-documents-bulk-details-button';
			button.dataset.testid = 'sign-my-documents-bulk-details-button';
			button.textContent = this.#labels.details;
			main_core.Event.bind(button, 'click', () => this.#showDetails(failedTitles));
			main_core.Dom.insertAfter(button, summary);
		}
		#showDetails(failedTitles) {
			if (this.#detailsBox?.getPopupWindow().isShown()) {
				return;
			}
			const list = document.createElement('ul');
			list.className = 'sign-my-documents-bulk-details';
			list.dataset.testid = 'sign-my-documents-bulk-details';
			failedTitles.forEach(title => {
				const item = document.createElement('li');
				item.textContent = title;
				list.append(item);
			});
			this.#detailsBox = new ui_dialogs_messagebox.MessageBox({
				title: this.#labels.detailsTitle,
				message: list,
				buttons: ui_dialogs_messagebox.MessageBoxButtons.OK,
				popupOptions: {
					focusTrap: true,
					closeByEsc: true,
					events: {
						onClose: () => {
							this.#detailsBox = null;
						}
					}
				}
			});
			this.#detailsBox.show();
		}
		#handleDialogClosed() {
			if (this.#dialogClosed) {
				return;
			}
			this.#dialogClosed = true;
			main_core.Event.unbind(document, 'keydown', this.#escapeHandler, true);
			this.#onDialogClosed?.(this.#trigger);
		}
		#isRunning() {
			const state = this.#process?.getState?.();
			return state === ui_stepprocessing.ProcessState.running || state === ui_stepprocessing.ProcessState.canceling;
		}
		#readCounter(value, fallback) {
			const counter = Number(value);
			return Number.isInteger(counter) && counter >= 0 ? counter : fallback;
		}
		#format(template, replacements) {
			return Object.entries(replacements).reduce((message, [key, value]) => message.replaceAll(`#${key}#`, String(value)), template);
		}
		#getDefaultLabels() {
			return {
				dialogTitle: main_core.Loc.getMessage('SIGN_MY_DOCUMENTS_BULK_DIALOG_TITLE'),
				dialogSummary: main_core.Loc.getMessage('SIGN_MY_DOCUMENTS_BULK_DIALOG_SUMMARY'),
				approveProcessAction: main_core.Loc.getMessage('SIGN_MY_DOCUMENTS_BULK_APPROVE_PROCESS_ACTION'),
				rejectProcessAction: main_core.Loc.getMessage('SIGN_MY_DOCUMENTS_BULK_REJECT_PROCESS_ACTION'),
				approveResultAction: main_core.Loc.getMessage('SIGN_MY_DOCUMENTS_BULK_APPROVE_RESULT_ACTION'),
				rejectResultAction: main_core.Loc.getMessage('SIGN_MY_DOCUMENTS_BULK_REJECT_RESULT_ACTION'),
				start: main_core.Loc.getMessage('SIGN_MY_DOCUMENTS_BULK_START'),
				stop: main_core.Loc.getMessage('SIGN_MY_DOCUMENTS_BULK_STOP'),
				close: main_core.Loc.getMessage('SIGN_MY_DOCUMENTS_BULK_CLOSE'),
				progressTitle: main_core.Loc.getMessage('SIGN_MY_DOCUMENTS_BULK_PROGRESS_TITLE'),
				running: main_core.Loc.getMessage('SIGN_MY_DOCUMENTS_BULK_RUNNING'),
				stopping: main_core.Loc.getMessage('SIGN_MY_DOCUMENTS_BULK_STOPPING'),
				startedAnnouncement: main_core.Loc.getMessage('SIGN_MY_DOCUMENTS_BULK_STARTED_ANNOUNCEMENT'),
				chunkAnnouncement: main_core.Loc.getMessage('SIGN_MY_DOCUMENTS_BULK_CHUNK_ANNOUNCEMENT'),
				fullResult: main_core.Loc.getMessage('SIGN_MY_DOCUMENTS_BULK_FULL_RESULT'),
				partialResult: total => main_core.Loc.getMessagePlural('SIGN_MY_DOCUMENTS_BULK_PARTIAL_RESULT', total),
				zeroResult: total => main_core.Loc.getMessagePlural('SIGN_MY_DOCUMENTS_BULK_ZERO_RESULT', total),
				stoppedResult: total => main_core.Loc.getMessagePlural('SIGN_MY_DOCUMENTS_BULK_STOPPED_RESULT', total),
				fatalResult: main_core.Loc.getMessage('SIGN_MY_DOCUMENTS_BULK_FATAL_RESULT'),
				details: main_core.Loc.getMessage('SIGN_MY_DOCUMENTS_BULK_DETAILS'),
				detailsTitle: main_core.Loc.getMessage('SIGN_MY_DOCUMENTS_BULK_DETAILS_TITLE')
			};
		}
	}

	exports.BulkActionProcess = BulkActionProcess;
	exports.BulkActionResultType = BulkActionResultType;

})(this.BX.Sign.V2.Grid.B2e = this.BX.Sign.V2.Grid.B2e || {}, BX, BX.UI.Accessibility, BX.UI.Dialogs, BX.UI.Notification, BX.UI.StepProcessing, BX.Sign.V2);
