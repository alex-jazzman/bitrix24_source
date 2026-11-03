import { Dom, Event, Loc, Tag, Type } from 'main.core';
import { DateTimeFormat } from 'main.date';
import { Popup } from 'main.popup';
import { FocusMonitor, FocusNavigator, InteractivityChecker } from 'ui.a11y';
import 'ui.design-tokens';
import 'ui.design-tokens.air';
import { BitrixVue, nextTick, reactive } from 'ui.vue3';

import { getMigrationState } from 'mail.migration-state';

import {
	MigrationProgressService,
	type MigrationManualControlCommand,
} from './migration-progress-service';
import { MigrationProgressView } from './migration-progress-view';

const anchorSelector = '[data-role="mailbox-migration-progress-anchor"]';
const stages = {
	LEGACY: 'STAGE_PREPARING',
	INITIALIZING_G1: 'STAGE_PREPARING',
	G1_READY: 'STAGE_SOURCE',
	PREPARING_G2: 'STAGE_SOURCE',
	SHADOW_MATCHING: 'STAGE_IMPORT',
	MATCHING: 'STAGE_IMPORT',
	RESETTING_IMPORT: 'STAGE_RESET',
	TAIL_APPEND: 'STAGE_TAIL',
	AWAITING_SWITCH_AUTHORIZATION: 'STAGE_AUTHORIZATION',
	READY_TO_SWITCH: 'STAGE_FINAL',
};
const statuses = new Set([
	'running',
	'waiting',
	'manual_waiting',
	'blocked',
	'cancelling',
	'cancelled',
	'switching',
	'done',
]);
const reasons = {
	migration_paused: 'REASON_PAUSED',
	action_required: 'REASON_ACTION',
	waiting_for_switch_authorization: 'REASON_AUTHORIZATION',
	inconsistent_state: 'REASON_INCONSISTENT',
	unknown_stage: 'UNKNOWN',
};
const missingFolderRoles = {
	inbox: 'FOLDER_INBOX',
	sent: 'FOLDER_SENT',
	drafts: 'FOLDER_DRAFTS',
	trash: 'FOLDER_TRASH',
	spam: 'FOLDER_SPAM',
};
const warningMessages = {
	tail_left_behind: 'WARNING_LEFT_BEHIND',
	tail_set_aside: 'WARNING_SET_ASIDE',
	tail_envelope_only: 'WARNING_ENVELOPE_ONLY',
};
const stageSequence = [
	{ label: 'STEP_PREPARING', title: 'STAGE_PREPARING', description: 'STAGE_PREPARING_DESCRIPTION' },
	{ label: 'STEP_SOURCE', title: 'STAGE_SOURCE', description: 'STAGE_SOURCE_DESCRIPTION' },
	{ label: 'STEP_IMPORT', title: 'STAGE_IMPORT', description: 'STAGE_IMPORT_DESCRIPTION' },
	{ label: 'STEP_TAIL', title: 'STAGE_TAIL', description: 'STAGE_TAIL_DESCRIPTION' },
	{ label: 'STEP_AUTHORIZATION', title: 'STAGE_AUTHORIZATION', description: 'STAGE_AUTHORIZATION_DESCRIPTION' },
	{ label: 'STEP_FINAL', title: 'STAGE_FINAL', description: 'FINAL_DESCRIPTION' },
	{ label: 'STEP_DONE', title: 'STATUS_DONE', description: 'STAGE_DONE_DESCRIPTION' },
];
const stageIndexes = {
	LEGACY: 0,
	INITIALIZING_G1: 0,
	G1_READY: 1,
	PREPARING_G2: 1,
	SHADOW_MATCHING: 2,
	MATCHING: 2,
	RESETTING_IMPORT: 2,
	TAIL_APPEND: 3,
	AWAITING_SWITCH_AUTHORIZATION: 4,
	READY_TO_SWITCH: 5,
};
const manualCheckpointMessages = {
	preparation: 'STAGE_PREPARING',
	checking: 'STAGE_SOURCE',
	loading: 'STEP_IMPORT',
	tail: 'STAGE_TAIL',
	completion: 'STAGE_FINAL',
};
const manualCommands = new Set(['enable', 'grant', 'automatic']);
const manualErrorMessages = {
	MAIL_MIGRATION_MANUAL_BUSY: 'MANUAL_BUSY',
	MAIL_MIGRATION_MANUAL_CONFLICT: 'MANUAL_CONFLICT',
	MAIL_MIGRATION_MANUAL_DISABLED: 'MANUAL_DISABLED',
	MAIL_MIGRATION_MANUAL_TOO_LATE: 'MANUAL_TOO_LATE',
	MAIL_MIGRATION_MANUAL_UNAVAILABLE: 'MANUAL_UNAVAILABLE',
};
const manualSuccessMessages = {
	enable: 'MANUAL_ENABLE_DONE',
	grant: 'MANUAL_GRANT_DONE',
	automatic: 'MANUAL_AUTOMATIC_DONE',
};

export class MigrationProgressPanel
{
	static #instances = new Map();
	#gridId;
	#service;
	#popup = null;
	#anchor = null;
	#content = null;
	#app = null;
	#viewState = null;
	#snapshot = null;
	#mailboxId = null;
	#operationId = null;
	#epoch = 0;
	#sequence = 0;
	#activeRequestId = 0;
	#inFlight = null;
	#commandInFlight = null;
	#pendingRefresh = false;
	#pendingCommandAnnouncement = null;
	#commandFocusTestId = null;
	#lastAnnouncedSummary = '';
	#denied = false;
	#destroyed = false;
	#interactive = false;
	#restoringFocus = false;
	#openTimer = null;
	#closeTimer = null;
	#refreshTimer = null;
	#sessionListeners = [];
	#triggerListeners = [];
	#observer = null;
	#unsubscribe = null;
	#scrollFrame = null;
	#viewedStageIndex = null;

	constructor(gridId: string, service = new MigrationProgressService())
	{
		this.#gridId = gridId;
		this.#service = service;
		const grid = document.getElementById(gridId);
		if (grid)
		{
			['mouseover', 'mouseout', 'focusin', 'focusout', 'click', 'keydown'].forEach((name) => {
				this.#listen(grid, name, (event) => this.#handleTrigger(event), this.#triggerListeners);
			});
		}

		this.#listen(window, 'pagehide', () => this.destroy(), this.#triggerListeners);
	}

	static getInstance(gridId: string): MigrationProgressPanel
	{
		if (!this.#instances.has(gridId))
		{
			this.#instances.set(gridId, new MigrationProgressPanel(gridId));
		}

		return this.#instances.get(gridId);
	}

	bindAnchor(anchor: HTMLElement, mailboxId: number): void
	{
		Dom.attr(anchor, {
			'data-role': 'mailbox-migration-progress-anchor',
			'data-mailbox-id': String(mailboxId),
			'data-testid': 'mail-migration-progress-chip',
			role: 'button',
			tabindex: '0',
			'aria-expanded': 'false',
			'aria-controls': this.#getContentId(),
		});
	}

	unbindAnchor(anchor: HTMLElement): void
	{
		if (this.#anchor === anchor)
		{
			this.close(false);
		}
	}

	open(anchor: HTMLElement, interactive = false): void
	{
		this.#clearTimer('open');
		this.#clearTimer('close');
		if (this.#destroyed || !anchor.isConnected)
		{
			return;
		}

		if (this.#anchor === anchor && this.#popup)
		{
			this.#interactive ||= interactive;

			return;
		}

		this.close(false);
		const mailboxId = Number(anchor.dataset.mailboxId);
		if (!Number.isSafeInteger(mailboxId) || mailboxId <= 0)
		{
			return;
		}

		this.#epoch++;
		this.#anchor = anchor;
		this.#mailboxId = mailboxId;
		this.#interactive = interactive;
		this.#denied = false;
		this.#createContent();
		this.#popup = new Popup({
			id: `mail-migration-progress-${this.#gridId}`,
			bindElement: anchor,
			content: this.#content,
			width: 520,
			offsetLeft: anchor.offsetWidth / 2,
			autoHide: true,
			closeByEsc: true,
			closeIcon: true,
			cacheable: true,
			overlay: false,
			angle: true,
			bindOptions: { forceBindPosition: true },
			padding: 0,
			role: 'region',
			ariaLabel: this.#message('TITLE'),
			focusTrap: false,
			events: {
				onShow: () => this.#bindScroll(),
				onClose: () => {
					if (this.#popup)
					{
						this.close();
					}
				},
			},
		});
		Dom.style(this.#popup.getPopupContainer(), 'max-width', 'calc(100vw - 32px)');
		this.#bindSession();
		this.#popup.show();
		Dom.attr(anchor, 'aria-expanded', 'true');
		this.#render('LOADING');
		this.refresh();
	}

	#createContent(): void
	{
		this.#content = Tag.render`<section class="mail-migration-progress --ui-context-content-light" tabindex="-1"></section>`;
		Dom.attr(this.#content, {
			id: this.#getContentId(),
			'data-testid': 'mail-migration-progress-panel',
		});
		this.#viewState = reactive({
			summary: '',
			message: '',
			retryVisible: false,
			retryDisabled: false,
			stageVisible: false,
			stageTitle: '',
			stageDescription: '',
			steps: [],
			details: [],
			hints: [],
			manualVisible: false,
			manualDescription: '',
			manualWaitingSince: '',
			manualAllowedCommands: [],
			manualCommandPending: false,
			selectStage: (index) => {
				if (this.#getStageState(this.#snapshot, index) !== 'future')
				{
					this.#viewedStageIndex = index;
					this.#render();
				}
			},
			retry: () => this.refresh(),
			manualAction: (command) => this.#runManualCommand(command),
		});
		this.#lastAnnouncedSummary = '';
		this.#app = BitrixVue.createApp(MigrationProgressView, { state: this.#viewState });
		this.#app.mount(this.#content);
	}

	refresh(): void
	{
		this.#clearTimer('refresh');
		if (!this.#canRefresh())
		{
			return;
		}

		if (this.#commandInFlight)
		{
			this.#pendingRefresh = true;

			return;
		}

		if (this.#inFlight)
		{
			this.#pendingRefresh = true;

			return;
		}

		this.#pendingRefresh = false;
		const epoch = this.#epoch;
		const mailboxId = this.#mailboxId;
		const requestId = ++this.#sequence;
		this.#activeRequestId = requestId;
		const retry = this.#content.querySelector('[data-testid="mail-migration-progress-retry"]');
		if (retry?.contains(FocusNavigator.getActiveElement()))
		{
			FocusNavigator.focusContainer(this.#content);
		}
		this.#viewState.retryDisabled = true;
		const request = Promise.resolve().then(() => {
			if (!this.#isCurrent(epoch, requestId))
			{
				return null;
			}

			return this.#service.getProgress(mailboxId);
		});
		this.#inFlight = request;
		request.then((progress) => {
			if (!this.#isCurrent(epoch, requestId))
			{
				return;
			}

			if (progress?.mailboxId !== mailboxId)
			{
				throw new Error('Unexpected mailbox progress response.');
			}

			this.#acceptProgress(progress);
			const migrationStatus = this.#anchor.closest('[data-role="mailbox-grid-migration-status"]');
			if (migrationStatus)
			{
				const hasAdminProgress = this.#snapshot?.availability === 'available'
					&& !['done', 'cancelled'].includes(this.#snapshot.status);
				Dom.attr(migrationStatus, 'data-mailbox-admin-progress', hasAdminProgress ? 'Y' : 'N');
			}

			this.#render();
			if (this.#pendingCommandAnnouncement)
			{
				this.#announce(this.#pendingCommandAnnouncement);
				this.#pendingCommandAnnouncement = null;
			}
		}).catch((error) => {
			if (!this.#isCurrent(epoch, requestId))
			{
				return;
			}

			if (this.#service.isAccessDenied(error))
			{
				this.#snapshot = null;
				this.#operationId = null;
				this.#denied = true;
				this.#pendingRefresh = false;
				this.#unsubscribe?.();
				this.#unsubscribe = null;
				this.#render('DENIED');
			}
			else
			{
				this.#render(this.#snapshot ? 'STALE' : 'ERROR');
			}
		}).finally(() => this.#finishRefresh(request));
	}

	#finishRefresh(request): void
	{
		if (this.#inFlight === request)
		{
			this.#inFlight = null;
		}

		if (!this.#canRefresh() || this.#commandInFlight)
		{
			return;
		}

		this.#viewState.retryDisabled = false;
		if (this.#pendingRefresh)
		{
			this.refresh();
		}
		else
		{
			this.#refreshTimer = setTimeout(() => this.refresh(), 20000);
		}
	}

	#acceptProgress(progress): void
	{
		const previousCurrentStage = this.#getCurrentStageIndex(this.#snapshot);
		if (progress.availability !== 'no_operation' && progress.operationId !== this.#operationId)
		{
			this.#snapshot = null;
			this.#operationId = progress.operationId;
			this.#viewedStageIndex = null;
			this.#lastAnnouncedSummary = '';
		}

		const terminal = ['done', 'cancelled'].includes(this.#snapshot?.status);
		if (!terminal || progress.availability !== 'no_operation')
		{
			this.#snapshot = progress;
		}

		const currentStage = this.#getCurrentStageIndex(this.#snapshot);
		if (this.#viewedStageIndex === null || this.#viewedStageIndex === previousCurrentStage)
		{
			this.#viewedStageIndex = currentStage;
		}
	}

	close(restoreFocus = true): void
	{
		this.#epoch++;
		['open', 'close', 'refresh'].forEach((name) => this.#clearTimer(name));
		this.#pendingRefresh = false;
		this.#commandInFlight = null;
		this.#pendingCommandAnnouncement = null;
		this.#commandFocusTestId = null;
		this.#unlisten(this.#sessionListeners);
		this.#observer?.disconnect();
		this.#observer = null;
		if (this.#scrollFrame !== null)
		{
			cancelAnimationFrame(this.#scrollFrame);
			this.#scrollFrame = null;
		}
		this.#unsubscribe?.();
		this.#unsubscribe = null;
		const anchor = this.#anchor;
		const popup = this.#popup;
		const focused = FocusNavigator.getActiveElement();
		let focusTarget = anchor;
		this.#popup = null;
		this.#anchor = null;
		if (anchor)
		{
			Dom.attr(anchor, 'aria-expanded', 'false');
			const row = anchor.closest('[data-mailbox-migration-active]');
			const migrationStatus = anchor.closest('[data-role="mailbox-grid-migration-status"]');
			if (migrationStatus && row?.dataset.mailboxMigrationActive === 'N'
				&& migrationStatus.dataset.mailboxAdminProgress !== 'Y')
			{
				focusTarget = document.getElementById(this.#gridId);
				const regularStatus = row.querySelector('[data-role="mailbox-grid-regular-sync-status"]');
				if (regularStatus)
				{
					regularStatus.hidden = false;
					focusTarget = regularStatus;
				}

				if (migrationStatus.contains(focused))
				{
					this.#restoreFocus(focusTarget);
				}
				migrationStatus.hidden = true;
			}
		}

		if (popup && restoreFocus && this.#interactive)
		{
			this.#restoreFocus(focusTarget);
		}
		this.#app?.unmount();
		popup?.destroy();
		this.#app = null;
		this.#viewState = null;
		this.#content = null;
		this.#snapshot = null;
		this.#operationId = null;
		this.#mailboxId = null;
		this.#interactive = false;
		this.#viewedStageIndex = null;
		this.#lastAnnouncedSummary = '';
	}

	#restoreFocus(target): void
	{
		const visibleTarget = target?.isConnected && InteractivityChecker.isVisible(target)
			? target : document.getElementById(this.#gridId);
		if (visibleTarget)
		{
			this.#restoringFocus = true;
			FocusNavigator.focusContainer(visibleTarget, { preventScroll: true });
			this.#restoringFocus = false;
		}
	}

	destroy(): void
	{
		this.#destroyed = true;
		this.close(false);
		this.#unlisten(this.#triggerListeners);
		MigrationProgressPanel.#instances.delete(this.#gridId);
	}

	#handleTrigger(event): void
	{
		const anchor = event.target.closest?.(anchorSelector);
		if (!anchor || this.#restoringFocus)
		{
			return;
		}

		switch (event.type)
		{
			case 'mouseover':
				this.#clearTimer('close');
				if (!anchor.contains(event.relatedTarget))
				{
					this.#clearTimer('open');
					this.#openTimer = setTimeout(() => this.open(anchor), 200);
				}
				break;
			case 'mouseout':
				if (!anchor.contains(event.relatedTarget))
				{
					this.#clearTimer('open');
					this.#scheduleClose(event.relatedTarget, true);
				}
				break;
			case 'focusout':
				this.#scheduleClose(event.relatedTarget);
				break;
			case 'click':
			case 'focusin':
				this.open(anchor, true);
				break;
			case 'keydown':
				if (event.key === 'Enter' || event.key === ' ')
				{
					event.preventDefault();
					this.open(anchor, true);
				}
				else if (event.key === 'Tab' && !event.shiftKey && this.#anchor === anchor && this.#content)
				{
					event.preventDefault();
					this.#interactive = true;
					this.#content.focus();
				}
				break;
			default:
				break;
		}
	}

	#bindSession(): void
	{
		const popupContainer = this.#popup.getPopupContainer();
		this.#listen(popupContainer, 'mouseenter', () => this.#clearTimer('close'));
		this.#listen(popupContainer, 'mouseleave', (event) => this.#scheduleClose(event.relatedTarget, true));
		this.#listen(popupContainer, 'focusin', () => {
			this.#interactive = true;
			this.#clearTimer('close');
		});
		this.#listen(popupContainer, 'focusout', (event) => this.#scheduleClose(event.relatedTarget));
		this.#listen(popupContainer, 'keydown', (event) => {
			if (event.key === 'Tab' && event.shiftKey && event.target === this.#content)
			{
				event.preventDefault();
				this.#anchor?.focus();
			}
		});
		this.#listen(document, 'visibilitychange', () => {
			this.#epoch++;
			this.#clearTimer('refresh');
			this.#pendingRefresh = false;
			if (!document.hidden)
			{
				this.refresh();
			}
		});
		this.#observer = new MutationObserver(() => {
			if (!this.#anchor?.isConnected)
			{
				this.close();
			}
		});
		this.#observer.observe(document.body, { childList: true, subtree: true });
		this.#unsubscribe = getMigrationState(this.#mailboxId).subscribe(() => this.refresh());
	}

	#bindScroll(): void
	{
		this.#listen(
			document,
			'scroll',
			(event) => this.#handleDocumentScroll(event),
			this.#sessionListeners,
			{ capture: true, passive: true },
		);
	}

	#handleDocumentScroll(event): void
	{
		if (this.#popup?.getPopupContainer().contains(event.target) || this.#scrollFrame !== null)
		{
			return;
		}

		this.#scrollFrame = requestAnimationFrame(() => {
			this.#scrollFrame = null;
			this.#popup?.adjustPosition();
		});
	}

	#scheduleClose(target, checkFocus = false): void
	{
		const activeElement = FocusNavigator.getActiveElement();
		if (this.#isInsidePanel(target) || (checkFocus && this.#isInsidePanel(activeElement)))
		{
			return;
		}

		this.#clearTimer('close');
		this.#closeTimer = setTimeout(() => {
			const focused = FocusNavigator.getActiveElement();
			if (!this.#isInsidePanel(focused))
			{
				this.close(false);
			}
		}, 200);
	}

	#isInsidePanel(target): boolean
	{
		return Boolean(
			this.#anchor?.contains(target)
			|| this.#popup?.getPopupContainer().contains(target),
		);
	}

	#canRefresh(): boolean
	{
		return Boolean(
			this.#popup && this.#anchor?.isConnected && !document.hidden && !this.#denied && !this.#destroyed,
		);
	}

	#isCurrent(epoch: number, requestId: number): boolean
	{
		return epoch === this.#epoch && requestId === this.#activeRequestId && this.#canRefresh();
	}

	#isSessionCurrent(epoch: number): boolean
	{
		return epoch === this.#epoch && this.#canRefresh();
	}

	#runManualCommand(command: MigrationManualControlCommand): void
	{
		const control = this.#snapshot?.manualControl;
		if (
			this.#commandInFlight
			|| !manualCommands.has(command)
			|| !this.#getAllowedManualCommands(control).includes(command)
		)
		{
			return;
		}

		this.#clearTimer('refresh');
		const activeTestId = FocusNavigator.getActiveElement()?.dataset?.testid ?? '';
		this.#commandFocusTestId = FocusMonitor.Instance.getLastInputModality() === 'keyboard'
			&& activeTestId.startsWith('mail-migration-manual-') ? activeTestId : null;
		this.#viewState.manualCommandPending = true;
		this.#restoreManualFocus();
		const epoch = this.#epoch;
		const operationId = this.#snapshot.operationId;
		const commandRequest = (async () => {
			try
			{
				let readSucceeded = true;
				await this.#inFlight?.catch(() => {
					readSucceeded = false;
				});
				if (!this.#isSessionCurrent(epoch))
				{
					return;
				}

				if (!readSucceeded)
				{
					this.#pendingCommandAnnouncement = 'MANUAL_UNCONFIRMED';

					return;
				}

				const progress = this.#snapshot;
				const currentControl = progress?.manualControl;
				if (
					progress?.availability !== 'available'
					|| !progress.operationId
					|| progress.operationId !== operationId
					|| !this.#getAllowedManualCommands(currentControl).includes(command)
				)
				{
					this.#pendingCommandAnnouncement = 'MANUAL_CONFLICT';

					return;
				}

				const updated = await this.#service.setManualControl(
					this.#mailboxId,
					progress.operationId,
					command,
					currentControl.version,
					command === 'grant' ? currentControl.checkpoint : null,
				);
				if (!this.#isSessionCurrent(epoch))
				{
					return;
				}

				if (updated?.mailboxId !== this.#mailboxId)
				{
					throw new Error('Unexpected mailbox progress response.');
				}

				this.#acceptProgress(updated);
				this.#render();
				this.#announce(manualSuccessMessages[command]);
				this.#restoreManualFocus();
			}
			catch (error)
			{
				if (!this.#isSessionCurrent(epoch))
				{
					return;
				}

				this.#handleManualCommandError(error);
			}
		})();
		this.#commandInFlight = commandRequest;
		const finish = () => this.#finishManualCommand(commandRequest, epoch);
		commandRequest.then(finish).catch(finish);
	}

	#handleManualCommandError(error): void
	{
		if (this.#service.isAccessDenied(error))
		{
			this.#snapshot = null;
			this.#operationId = null;
			this.#denied = true;
			this.#pendingRefresh = false;
			this.#unsubscribe?.();
			this.#unsubscribe = null;
			this.#render('DENIED');

			return;
		}

		const codes = this.#service.getErrorCodes(error);
		const errorCode = Object.keys(manualErrorMessages).find((code) => codes.has(code));
		this.#pendingCommandAnnouncement = errorCode
			? manualErrorMessages[errorCode]
			: 'MANUAL_UNCONFIRMED';
	}

	#finishManualCommand(commandRequest: Promise, epoch: number): void
	{
		if (this.#commandInFlight !== commandRequest)
		{
			return;
		}

		this.#commandInFlight = null;
		if (!this.#isSessionCurrent(epoch))
		{
			return;
		}

		this.#viewState.manualCommandPending = false;
		this.#restoreManualFocus();
		if (this.#pendingCommandAnnouncement || this.#pendingRefresh)
		{
			this.refresh();
		}
		else
		{
			this.#refreshTimer = setTimeout(() => this.refresh(), 20000);
		}
	}

	#restoreManualFocus(): void
	{
		const popup = this.#popup;
		const content = this.#content;
		const testId = this.#commandFocusTestId;
		if (!testId)
		{
			return;
		}

		nextTick(() => nextTick(() => {
			if (this.#popup !== popup || this.#content !== content || !content?.isConnected)
			{
				return;
			}

			const target = content.querySelector(`[data-testid="${testId}"]`)
				?? content.querySelector('.mail-migration-progress__manual-actions [data-testid]')
				?? content;
			FocusNavigator.focusTarget(target, { preventScroll: true });
		}));
	}

	#render(message = ''): void
	{
		const activeElement = FocusNavigator.getActiveElement();
		const activeTestId = activeElement?.dataset?.testid ?? '';
		const focusedTestId = activeTestId.startsWith('mail-migration-progress-step-')
			|| activeTestId.startsWith('mail-migration-manual-') ? activeTestId : null;
		const inputModality = FocusMonitor.Instance.getLastInputModality();
		const summary = message ? this.#message(message) : this.#getSummary();
		if (this.#lastAnnouncedSummary !== summary)
		{
			this.#lastAnnouncedSummary = summary;
			this.#viewState.message = summary;
		}
		this.#viewState.summary = message ? summary : summary.split('. ')[0];
		const retry = this.#content.querySelector('[data-testid="mail-migration-progress-retry"]');
		this.#viewState.retryVisible = ['ERROR', 'STALE'].includes(message);
		if (!this.#viewState.retryVisible && retry?.contains(FocusNavigator.getActiveElement()))
		{
			FocusNavigator.focusContainer(this.#content);
		}
		this.#resetView();
		if (this.#snapshot)
		{
			this.#renderSnapshot(this.#snapshot);
		}

		const popup = this.#popup;
		const content = this.#content;
		nextTick(() => {
			if (this.#popup !== popup || this.#content !== content || !content?.isConnected)
			{
				return;
			}

			popup.adjustPosition();
			if (!focusedTestId)
			{
				return;
			}

			if (inputModality === 'keyboard')
			{
				const selector = `[data-testid="${focusedTestId}"]`;
				const target = content.querySelector(selector)
					?? content.querySelector('.mail-migration-progress__manual-actions [data-testid]')
					?? content.querySelector(
						'.mail-migration-progress__step[data-selected="true"] '
						+ '.mail-migration-progress__step-button',
					)
					?? content.querySelector('.mail-migration-progress__step-button')
					?? content;
				FocusNavigator.focusTarget(target, { preventScroll: true });
			}
			else if (!popup.getPopupContainer().contains(FocusNavigator.getActiveElement()))
			{
				FocusNavigator.focusContainer(content, { preventScroll: true });
			}
		});
	}

	#getSummary(): string
	{
		const progress = this.#snapshot;
		if (!progress)
		{
			return '';
		}

		if (progress.availability !== 'available')
		{
			return this.#message(progress.availability === 'no_operation' ? 'NO_OPERATION' : 'UNAVAILABLE');
		}

		const status = this.#getStatus(progress);
		const summary = [this.#message(`STATUS_${status.toUpperCase()}`)];
		if (!['done', 'cancelled'].includes(status))
		{
			summary.push(this.#message(Object.hasOwn(stages, progress.stage) ? stages[progress.stage] : 'UNKNOWN'));
		}

		return summary.join('. ');
	}

	#getStatus(progress): string
	{
		if (this.#isManualWaiting(progress))
		{
			return 'manual_waiting';
		}

		return statuses.has(progress.status) ? progress.status : 'unknown';
	}

	#isManualWaiting(progress): boolean
	{
		const control = progress?.manualControl;

		return Type.isObject(control) && control.enabled === true && control.waiting === true;
	}

	#renderManualControl(progress): void
	{
		const control = progress.manualControl;
		if (!Type.isObject(control))
		{
			return;
		}

		const checkpointMessage = manualCheckpointMessages[control.checkpoint];
		const stage = checkpointMessage ? this.#message(checkpointMessage) : this.#message('UNKNOWN');
		this.#viewState.manualVisible = true;
		this.#viewState.manualAllowedCommands = this.#getAllowedManualCommands(control);
		if (!control.enabled)
		{
			this.#viewState.manualDescription = this.#message('MANUAL_DESCRIPTION');
		}
		else if (control.waiting)
		{
			this.#viewState.manualDescription = this.#message('MANUAL_WAITING', { '#STAGE#': stage });
		}
		else if (control.granted && control.checkpoint === 'completion' && progress.switchAuthorized === false)
		{
			this.#viewState.manualDescription = this.#message('MANUAL_EXTERNAL_WAIT', { '#STAGE#': stage });
		}
		else if (control.granted)
		{
			this.#viewState.manualDescription = this.#message('MANUAL_RUNNING', { '#STAGE#': stage });
		}
		else
		{
			this.#viewState.manualDescription = this.#message('MANUAL_ENABLED');
		}

		if (control.waiting && this.#isTimestamp(control.waitingSince))
		{
			this.#viewState.manualWaitingSince = this.#message('MANUAL_WAITING_SINCE', {
				'#DATE#': this.#formatDate(control.waitingSince),
			});
		}
	}

	#getAllowedManualCommands(control): MigrationManualControlCommand[]
	{
		return Type.isArray(control?.allowedCommands)
			? control.allowedCommands.filter((command) => manualCommands.has(command))
			: [];
	}

	#renderSnapshot(progress): void
	{
		if (progress.availability !== 'available')
		{
			return;
		}

		this.#renderManualControl(progress);

		const status = this.#getStatus(progress);
		if (status !== 'cancelled')
		{
			this.#renderStages(progress);
		}

		const reasonHint = this.#getReasonHint(progress);
		if (reasonHint !== null)
		{
			this.#viewState.hints.push(reasonHint);
		}

		if (status === 'waiting' && this.#isTimestamp(progress.nextAttemptAt))
		{
			this.#viewState.hints.push(this.#message('NEXT_ATTEMPT', {
				'#DATE#': this.#formatDate(progress.nextAttemptAt),
			}));
		}
		else if (status === 'waiting')
		{
			this.#viewState.hints.push(this.#message('NO_RETRY_PLAN'));
		}

		if (this.#viewedStageIndex === this.#getCurrentStageIndex(progress))
		{
			['snapshotAccepted', 'switchAuthorized'].forEach((key) => {
				if (Type.isBoolean(progress[key]))
				{
					const name = key === 'snapshotAccepted' ? 'SNAPSHOT' : 'AUTHORIZATION';
					this.#viewState.details.push(this.#toDetail(
						this.#message(`${name}_${progress[key] ? 'YES' : 'NO'}`),
					));
				}
			});
		}
		['importProcessed', 'tailAppended'].forEach((key) => {
			const value = progress.metrics?.[key];
			const name = key === 'importProcessed' ? 'IMPORT_PROCESSED' : 'TAIL_APPENDED';
			this.#viewState.details.push(this.#toDetail(this.#message(name, {
				'#COUNT#': Number.isSafeInteger(value) && value >= 0 ? String(value) : this.#message('NO_DATA'),
			})));
		});
		(progress.warnings ?? []).forEach(({ code, count }) => {
			if (Object.hasOwn(warningMessages, code) && Number.isSafeInteger(count) && count > 0)
			{
				this.#viewState.details.push(this.#toDetail(
					this.#message(warningMessages[code], { '#COUNT#': String(count) }),
				));
			}
		});
		this.#viewState.details.push(
			this.#toDetail(this.#message('LAST_PROGRESS', {
				'#DATE#': this.#formatDate(progress.lastProgressAt),
			})),
			this.#toDetail(this.#message('SAMPLED_AT', {
				'#DATE#': this.#formatDate(progress.sampledAt),
			})),
		);
	}

	#renderStages(progress): void
	{
		const currentIndex = this.#getCurrentStageIndex(progress);
		if (!Number.isInteger(currentIndex))
		{
			return;
		}

		if (
			this.#viewedStageIndex === null
			|| this.#getStageState(progress, this.#viewedStageIndex) === 'future'
		)
		{
			this.#viewedStageIndex = currentIndex;
		}

		this.#viewState.stageVisible = true;
		const currentStageKey = Object.hasOwn(stages, progress.stage)
			? stages[progress.stage]
			: stageSequence[currentIndex].title;
		const currentDescription = progress.stage === 'RESETTING_IMPORT'
			? 'RESET_DESCRIPTION'
			: stageSequence[currentIndex].description;
		this.#viewState.steps = stageSequence.map((stage, index) => ({
			label: this.#message(stage.label),
			title: this.#message(index === currentIndex ? currentStageKey : stage.title),
			description: this.#message(index === currentIndex ? currentDescription : stage.description),
			state: this.#getStageState(progress, index),
			selected: index === this.#viewedStageIndex,
		}));

		const viewedStage = stageSequence[this.#viewedStageIndex];
		const title = this.#viewedStageIndex === currentIndex ? currentStageKey : viewedStage.title;
		this.#viewState.stageTitle = this.#message(title);
		const description = this.#viewedStageIndex === currentIndex ? currentDescription : viewedStage.description;
		this.#viewState.stageDescription = this.#message(description);
	}

	#getCurrentStageIndex(progress): ?number
	{
		if (!progress || progress.availability !== 'available')
		{
			return null;
		}

		return progress.status === 'done' ? stageSequence.length - 1 : stageIndexes[progress.stage];
	}

	#getStageState(progress, index: number): 'past' | 'current' | 'reached' | 'future'
	{
		const currentIndex = this.#getCurrentStageIndex(progress);
		if (index === currentIndex)
		{
			return 'current';
		}

		if (index < currentIndex)
		{
			return 'past';
		}

		const authorizationIndex = stageIndexes.AWAITING_SWITCH_AUTHORIZATION;
		if (index === authorizationIndex && progress?.switchAuthorized === true)
		{
			return 'reached';
		}

		return 'future';
	}

	#resetView(): void
	{
		Object.assign(this.#viewState, {
			stageVisible: false,
			stageTitle: '',
			stageDescription: '',
			steps: [],
			details: [],
			hints: [],
			manualVisible: false,
			manualDescription: '',
			manualWaitingSince: '',
			manualAllowedCommands: [],
		});
	}

	#announce(message: string): void
	{
		this.#viewState.message = this.#message(message);
	}

	#toDetail(text: string): { label: string, value: string }
	{
		const separator = text.indexOf(':');
		if (separator > 0)
		{
			return {
				label: `${text.slice(0, separator + 1)} `,
				value: text.slice(separator + 1).trim(),
			};
		}

		return { label: text, value: '' };
	}

	#isTimestamp(value): boolean
	{
		return Number.isSafeInteger(value) && value > 0 && value <= 8_640_000_000_000;
	}

	#getReasonHint(progress): ?string
	{
		if (progress.reason === 'target_folder_missing')
		{
			return Object.hasOwn(missingFolderRoles, progress.missingFolderRole)
				? this.#message('REASON_FOLDER_MISSING', {
					'#FOLDER#': this.#message(missingFolderRoles[progress.missingFolderRole]),
				})
				: this.#message('REASON_ACTION');
		}

		return Object.hasOwn(reasons, progress.reason) ? this.#message(reasons[progress.reason]) : null;
	}

	#formatDate(value): string
	{
		if (!this.#isTimestamp(value))
		{
			return this.#message('NO_DATA');
		}

		const dateFormat = DateTimeFormat.getFormat('LONG_DATE_FORMAT');
		const timeFormat = DateTimeFormat.getFormat('SHORT_TIME_FORMAT');

		return DateTimeFormat.format(`${dateFormat} ${timeFormat}`, value);
	}

	#message(key: string, replacements = {}): string
	{
		return Loc.getMessage(`MAIL_MIGRATION_PROGRESS_${key}`, replacements) ?? '';
	}

	#getContentId(): string
	{
		return `mail-migration-progress-content-${this.#gridId}`;
	}

	#listen(target, name, listener, listeners = this.#sessionListeners, options = false): void
	{
		Event.bind(target, name, listener, options);
		listeners.push(() => Event.unbind(target, name, listener, options));
	}

	#unlisten(listeners): void
	{
		listeners.splice(0).forEach((unsubscribe) => unsubscribe());
	}

	#clearTimer(name): void
	{
		if (name === 'open')
		{
			clearTimeout(this.#openTimer);
			this.#openTimer = null;
		}
		else if (name === 'close')
		{
			clearTimeout(this.#closeTimer);
			this.#closeTimer = null;
		}
		else
		{
			clearTimeout(this.#refreshTimer);
			this.#refreshTimer = null;
		}
	}
}
