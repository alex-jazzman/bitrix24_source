import { Dom, Event, Loc, Type } from 'main.core';
import { DateTimeFormat } from 'main.date';

import 'ui.design-tokens';

import { HealthcheckClient } from './healthcheck-client';
import { HealthcheckRequestError } from './healthcheck-request-error';
import { getErrorDetail, getRequestErrorDetail, getStatusCopy } from './status-copy';
import { type HealthcheckCheck, type HealthcheckSnapshot, type StatusTone } from './types';
import './portal-healthcheck.css';

const POLL_INTERVAL_MS = 5000;
const MAX_TIMER_MS = 60000;

type MountOptions = {
	rootElement: HTMLElement;
	client?: HealthcheckClient;
};

function message(key: string): string
{
	return Loc.getMessage(`BICONNECTOR_PORTAL_HEALTHCHECK_${key}`) ?? '';
}

function element(tag: string, className: string, testId?: string): HTMLElement
{
	const node = document.createElement(tag);
	node.className = className;
	if (testId)
	{
		node.dataset.testid = testId;
	}

	return node;
}

function paragraph(text: string, className: string): HTMLElement
{
	const node = element('p', className);
	node.textContent = text;

	return node;
}

export class PortalHealthcheck
{
	#root: HTMLElement;
	#client: HealthcheckClient;
	#snapshot: HealthcheckSnapshot = { status: 'IDLE', nodes: [] };
	#requestError: HealthcheckRequestError | null = null;
	#startButton: HTMLButtonElement | null = null;
	#actionHint: HTMLElement | null = null;
	#pollTimer: ReturnType<typeof setTimeout> | null = null;
	#cooldownTimer: ReturnType<typeof setTimeout> | null = null;
	#requestVersion = 0;
	#requestPending = false;
	#finalReadDone = false;
	#destroyed = false;
	#suspended = false;
	#pageHide = (): void => {
		this.#pause();
	};

	#pageShow = (): void => {
		this.#resume();
	};

	#visibilityChange = (): void => {
		if (document.visibilityState === 'hidden')
		{
			this.#pause();
		}
		else
		{
			this.#resume();
		}
	};

	static mount(options: MountOptions): PortalHealthcheck
	{
		return new PortalHealthcheck(options);
	}

	constructor({ rootElement, client }: MountOptions)
	{
		this.#root = rootElement;
		this.#client = client ?? new HealthcheckClient();
		this.#suspended = document.visibilityState === 'hidden';
		this.#render();
		Event.bind(window, 'pagehide', this.#pageHide);
		Event.bind(window, 'pageshow', this.#pageShow);
		Event.bind(document, 'visibilitychange', this.#visibilityChange);
		void this.#read();
	}

	renderSnapshot(snapshot: HealthcheckSnapshot): void
	{
		this.#requestVersion++;
		this.#requestPending = false;
		this.#applySnapshot(snapshot, null);
		this.#schedulePolling();
	}

	destroy(): void
	{
		this.#stop();
		Dom.clean(this.#root);
	}

	#stop(): void
	{
		this.#destroyed = true;
		this.#pause();
		Event.unbind(window, 'pagehide', this.#pageHide);
		Event.unbind(window, 'pageshow', this.#pageShow);
		Event.unbind(document, 'visibilitychange', this.#visibilityChange);
	}

	#resume(): void
	{
		if (!this.#destroyed && this.#suspended && document.visibilityState !== 'hidden')
		{
			this.#suspended = false;
			void this.#read();
		}
	}

	#pause(): void
	{
		this.#suspended = true;
		this.#requestVersion++;
		this.#requestPending = false;
		this.#clearPollTimer();
		if (this.#cooldownTimer !== null)
		{
			clearTimeout(this.#cooldownTimer);
			this.#cooldownTimer = null;
		}
	}

	async #read(): Promise<void>
	{
		if (this.#destroyed || this.#suspended)
		{
			return;
		}

		if (!this.#root.isConnected)
		{
			this.#stop();

			return;
		}

		const requestVersion = ++this.#requestVersion;
		this.#requestPending = true;
		this.#syncAction();
		let requestError: HealthcheckRequestError | null = null;
		try
		{
			const snapshot = await this.#client.get();
			if (this.#isCurrent(requestVersion))
			{
				this.#applySnapshot(snapshot, null);
			}
		}
		catch (reason)
		{
			requestError = HealthcheckRequestError.from(reason);
			if (this.#isCurrent(requestVersion))
			{
				this.#applySnapshot(this.#snapshot, requestError);
			}
		}
		finally
		{
			if (this.#isCurrent(requestVersion))
			{
				this.#requestPending = false;
				this.#syncAction();
				// A rejected request will not pass on a retry, while a lost connection may come back.
				if (requestError === null || requestError.isNetwork)
				{
					this.#schedulePolling(requestError !== null);
				}
			}
		}
	}

	async #start(): Promise<void>
	{
		if (this.#destroyed || this.#suspended || this.#requestPending || this.#isActionBlocked())
		{
			return;
		}

		this.#clearPollTimer();
		const requestVersion = ++this.#requestVersion;
		this.#requestPending = true;
		this.#syncAction();
		let refreshAfterError = false;
		try
		{
			const snapshot = await this.#client.start();
			if (this.#isCurrent(requestVersion))
			{
				this.#applySnapshot(snapshot, null);
			}
		}
		catch (reason)
		{
			const requestError = HealthcheckRequestError.from(reason);
			// The start may have reached the server before the connection was lost, so its state is read again.
			refreshAfterError = requestError.isNetwork;
			if (!refreshAfterError && this.#isCurrent(requestVersion))
			{
				this.#applySnapshot(this.#snapshot, requestError);
			}
		}
		finally
		{
			if (this.#isCurrent(requestVersion))
			{
				this.#requestPending = false;
				this.#syncAction();
				if (refreshAfterError)
				{
					void this.#read();
				}
				else
				{
					this.#schedulePolling();
				}
			}
		}
	}

	#isCurrent(requestVersion: number): boolean
	{
		return !this.#destroyed && !this.#suspended && requestVersion === this.#requestVersion;
	}

	#applySnapshot(snapshot: HealthcheckSnapshot, requestError: HealthcheckRequestError | null): void
	{
		const changed = JSON.stringify(this.#snapshot) !== JSON.stringify(snapshot)
			|| this.#requestError?.code !== requestError?.code;
		if (this.#snapshot.resultDeadline !== snapshot.resultDeadline)
		{
			this.#finalReadDone = false;
		}
		this.#snapshot = snapshot;
		this.#requestError = requestError;
		if (changed)
		{
			this.#render();
		}
		else
		{
			this.#syncAction();
		}
	}

	#schedulePolling(afterError = false): void
	{
		this.#clearPollTimer();
		const lateResult = this.#hasLateResultWindow();
		if (this.#destroyed || this.#suspended || (!this.#isWaiting() && !lateResult))
		{
			return;
		}

		const deadline = Date.parse(this.#snapshot.resultDeadline ?? '');
		if (!Number.isFinite(deadline))
		{
			return;
		}

		const remaining = deadline - Date.now();
		if (remaining <= 0 && lateResult)
		{
			return;
		}

		// The wait is over only when the final read has succeeded: a lost connection says nothing about the result.
		if (remaining <= 0 && this.#finalReadDone && !afterError)
		{
			this.#applySnapshot({
				...this.#snapshot,
				status: 'RESULT_MISSING',
				errorCode: this.#snapshot.errorCode || 'HEALTHCHECK_RESULT_TIMEOUT',
			}, null);

			return;
		}

		let delay = Math.min(POLL_INTERVAL_MS, remaining);
		if (remaining <= 0)
		{
			delay = afterError ? POLL_INTERVAL_MS : 0;
		}

		this.#pollTimer = setTimeout(() => {
			this.#pollTimer = null;
			if (deadline <= Date.now() && !lateResult)
			{
				this.#finalReadDone = true;
			}
			void this.#read();
		}, delay);
	}

	#clearPollTimer(): void
	{
		if (this.#pollTimer !== null)
		{
			clearTimeout(this.#pollTimer);
			this.#pollTimer = null;
		}
	}

	#isWaiting(): boolean
	{
		return this.#snapshot.status === 'RUNNING' || this.#snapshot.status === 'PENDING';
	}

	#hasLateResultWindow(): boolean
	{
		return this.#snapshot.status === 'FAILED'
			&& (
				this.#snapshot.errorCode === 'HEALTHCHECK_CONTROLLER_UNAVAILABLE'
				|| this.#snapshot.errorCode === 'HEALTHCHECK_QUEUE_FULL'
			);
	}

	#isActionBlocked(): boolean
	{
		const nextAllowedAt = Date.parse(this.#snapshot.nextAllowedAt ?? '');

		return this.#isWaiting() || (Number.isFinite(nextAllowedAt) && nextAllowedAt > Date.now());
	}

	#syncAction(): void
	{
		if (this.#startButton)
		{
			this.#startButton.disabled = this.#requestPending || this.#isActionBlocked();
		}

		if (this.#actionHint)
		{
			this.#actionHint.textContent = this.#actionHintText();
		}

		if (this.#cooldownTimer !== null)
		{
			clearTimeout(this.#cooldownTimer);
			this.#cooldownTimer = null;
		}
		const nextAllowedAt = Date.parse(this.#snapshot.nextAllowedAt ?? '');
		if (Number.isFinite(nextAllowedAt) && nextAllowedAt > Date.now())
		{
			this.#cooldownTimer = setTimeout(() => {
				this.#cooldownTimer = null;
				this.#syncAction();
			}, Math.min(MAX_TIMER_MS, nextAllowedAt - Date.now()));
		}
	}

	#actionHintText(): string
	{
		const nextAllowedAt = Date.parse(this.#snapshot.nextAllowedAt ?? '');
		if (Number.isFinite(nextAllowedAt) && nextAllowedAt > Date.now())
		{
			const formatted = DateTimeFormat.format(
				DateTimeFormat.getFormat('FORMAT_DATETIME'),
				Math.floor(nextAllowedAt / 1000),
			);

			return Loc.getMessage('BICONNECTOR_PORTAL_HEALTHCHECK_COOLDOWN_HINT', {
				'#TIME#': formatted,
			}) ?? '';
		}

		if (this.#requestPending)
		{
			return message('LOADING_HINT');
		}

		return this.#isWaiting() ? message('RUNNING_HINT') : '';
	}

	#render(): void
	{
		const openDetails = new Set(
			[...this.#root.querySelectorAll('details[open]')].map(
				(details) => (details as HTMLElement).dataset.detailKey ?? '',
			),
		);
		const focused = document.activeElement;
		const focusedDetail = focused?.closest('details') as HTMLElement | null;
		const focusKey = focusedDetail?.dataset.detailKey;
		const actionFocused = focused?.tagName === 'BUTTON' && this.#root.contains(focused);
		const page = element('main', 'biconnector-healthcheck');
		page.append(
			paragraph(message('DESCRIPTION'), 'biconnector-healthcheck__description'),
			this.#renderToolbar(),
		);
		if (this.#requestError)
		{
			page.append(this.#renderRequestError(this.#requestError));
		}
		page.append(
			this.#renderOverview(),
			this.#renderResult(openDetails),
		);

		Dom.clean(this.#root);
		Dom.append(page, this.#root);
		this.#syncAction();
		if (actionFocused)
		{
			this.#startButton?.focus({ preventScroll: true });
		}
		else if (focusKey)
		{
			const details = [...this.#root.querySelectorAll('details')].find(
				(item) => (item as HTMLElement).dataset.detailKey === focusKey,
			);
			details?.querySelector('summary')?.focus({ preventScroll: true });
		}
	}

	#renderRequestError(requestError: HealthcheckRequestError): HTMLElement
	{
		const notice = element(
			'section',
			'adm-info-message-wrap adm-info-message-red biconnector-healthcheck__notice',
			'healthcheck-request-error',
		);
		notice.setAttribute('role', 'alert');
		const content = element('div', 'adm-info-message');
		const title = element('div', 'adm-info-message-title');
		title.textContent = message('REQUEST_ERROR_TITLE');
		content.append(title, paragraph(
			getRequestErrorDetail(requestError.code),
			'biconnector-healthcheck__notice_detail',
		));
		notice.append(content);

		return notice;
	}

	#renderToolbar(): HTMLElement
	{
		const toolbar = element('div', 'biconnector-healthcheck__toolbar');
		const button = element('button', 'adm-btn adm-btn-save', 'healthcheck-start') as HTMLButtonElement;
		button.type = 'button';
		button.textContent = message('START');
		Event.bind(button, 'click', () => {
			void this.#start();
		});
		this.#startButton = button;
		const hint = element('span', 'biconnector-healthcheck__action_hint');
		this.#actionHint = hint;
		toolbar.append(button, hint);

		return toolbar;
	}

	#renderOverview(): HTMLElement
	{
		const copy = getStatusCopy(
			this.#snapshot.status,
			this.#snapshot.errorCode ?? this.#snapshot.nodesCheck?.code,
			this.#hasFailures(),
		);
		let adminTone = '';
		switch (copy.tone)
		{
			case 'success':
				adminTone = 'adm-info-message-green';
				break;
			case 'error':
				adminTone = 'adm-info-message-red';
				break;
			case 'neutral':
			case 'progress':
				adminTone = 'adm-info-message-gray';
				break;
			default:
				break;
		}
		const notice = element(
			'section',
			`adm-info-message-wrap ${adminTone} biconnector-healthcheck__notice`,
			'healthcheck-overview',
		);
		notice.setAttribute('role', 'status');
		const content = element('div', 'adm-info-message');
		const title = element('div', 'adm-info-message-title', 'healthcheck-summary-status');
		title.textContent = copy.title;
		const detail = paragraph(copy.detail, 'biconnector-healthcheck__notice_detail');
		content.append(title, detail);
		if (copy.tone === 'success' || copy.tone === 'error')
		{
			const icon = element('div', 'adm-info-message-icon');
			icon.setAttribute('aria-hidden', 'true');
			content.append(icon);
		}
		notice.append(content);

		return notice;
	}

	#renderResult(openDetails: Set<string>): HTMLElement
	{
		const wrapper = element('div', 'biconnector-healthcheck__table_wrap');
		const table = element('table', 'adm-list-table biconnector-healthcheck__table');
		table.append(this.#renderProxy(openDetails), this.#renderNodes(openDetails));
		wrapper.append(table);

		return wrapper;
	}

	#renderGroup(title: string): HTMLElement
	{
		const row = element('tr', 'adm-list-table-header');
		const cell = this.#renderCell(title);
		cell.colSpan = 3;
		row.append(cell);

		return row;
	}

	#renderCell(content: string | HTMLElement, className = ''): HTMLTableCellElement
	{
		const cell = element('td', `adm-list-table-cell ${className}`) as HTMLTableCellElement;
		const inner = element('div', 'adm-list-table-cell-inner');
		if (Type.isString(content))
		{
			inner.textContent = content;
		}
		else
		{
			inner.append(content);
		}
		cell.append(inner);

		return cell;
	}

	#renderProxy(openDetails: Set<string>): HTMLElement
	{
		const body = element('tbody', 'biconnector-healthcheck__group', 'healthcheck-proxy');
		body.append(this.#renderGroup(message('PROXY_TITLE')));
		const row = element('tr', 'adm-list-table-row');
		const proxy = this.#snapshot.proxy;
		if (proxy === undefined)
		{
			const empty = this.#renderCell(this.#emptyText('PROXY_EMPTY'), 'biconnector-healthcheck__empty');
			empty.colSpan = 3;
			row.append(empty);
		}
		else
		{
			const result = element('div', 'biconnector-healthcheck__result');
			result.append(this.#renderStatus(
				this.#checkText(proxy.status),
				proxy.status === 'SUCCESS' ? 'success' : 'error',
				'healthcheck-proxy-status',
			));
			if (proxy.status === 'FAILED' && proxy.errors?.length)
			{
				result.append(paragraph(getErrorDetail(proxy.errors[0].code), 'biconnector-healthcheck__error'));
			}

			if (proxy.httpCode !== undefined && proxy.httpCode !== 0)
			{
				result.append(paragraph(`${message('HTTP_CODE')}: ${proxy.httpCode}`, 'biconnector-healthcheck__http'));
			}
			row.append(
				this.#renderCell(proxy.address ?? message('PROXY_TITLE'), 'biconnector-healthcheck__target'),
				this.#renderCell(result),
				this.#renderCell(this.#renderDetails(proxy, 'proxy', openDetails), 'adm-list-table-cell-last'),
			);
		}
		body.append(row);

		return body;
	}

	#renderNodes(openDetails: Set<string>): HTMLElement
	{
		const body = element('tbody', 'biconnector-healthcheck__group', 'healthcheck-nodes');
		body.append(this.#renderGroup(message('NODES_TITLE')));
		if (this.#snapshot.nodes.length === 0)
		{
			const row = element('tr', 'adm-list-table-row');
			const empty = this.#renderCell(
				this.#snapshot.nodesCheck?.code
					? getErrorDetail(this.#snapshot.nodesCheck.code)
					: this.#emptyText('NODES_EMPTY'),
				'biconnector-healthcheck__empty',
			);
			empty.colSpan = 3;
			row.append(empty);
			body.append(row);

			return body;
		}

		for (const [index, node] of this.#snapshot.nodes.entries())
		{
			const row = element('tr', 'adm-list-table-row biconnector-healthcheck__node');
			const result = element('div', 'biconnector-healthcheck__result');
			result.append(this.#renderStatus(
				this.#checkText(node.status),
				node.status === 'SUCCESS' ? 'success' : 'error',
				'healthcheck-node-status',
			));
			if (node.httpCode !== undefined && node.httpCode !== 0)
			{
				result.append(paragraph(`${message('HTTP_CODE')}: ${node.httpCode}`, 'biconnector-healthcheck__http'));
			}
			row.append(
				this.#renderCell(node.publicHost || node.node || message('NODE_UNKNOWN'), 'biconnector-healthcheck__target'),
				this.#renderCell(result),
				this.#renderCell(this.#renderDetails(node, `node-${index}`, openDetails), 'adm-list-table-cell-last'),
			);
			body.append(row);
		}

		return body;
	}

	#renderStatus(text: string, tone: StatusTone, testId: string): HTMLElement
	{
		const status = element('span', `biconnector-healthcheck__status --${tone}`, testId);
		status.textContent = text;

		return status;
	}

	#renderDetails(check: HealthcheckCheck, key: string, openDetails: Set<string>): HTMLElement
	{
		const details = element('details', 'biconnector-healthcheck__details') as HTMLDetailsElement;
		details.dataset.detailKey = key;
		details.open = openDetails.has(key);
		const summary = element('summary', 'biconnector-healthcheck__details_toggle');
		summary.textContent = message('DETAILS');
		details.append(summary);
		const content = element('div', 'biconnector-healthcheck__details_content');
		if (check.httpCode !== undefined && check.httpCode !== 0)
		{
			content.append(paragraph(`${message('HTTP_CODE')}: ${check.httpCode}`, 'biconnector-healthcheck__details_line'));
		}

		if (check.remoteIp)
		{
			content.append(paragraph(`${message('PORTAL_ADDRESS')}: ${check.remoteIp}`, 'biconnector-healthcheck__details_line'));
		}

		if (check.egressAddresses?.length)
		{
			content.append(paragraph(
				`${message('EGRESS_ADDRESSES')}: ${check.egressAddresses.join(', ')}`,
				'biconnector-healthcheck__details_line',
			));
		}

		for (const error of check.errors ?? [])
		{
			content.append(paragraph(
				error.message ? `${error.code}: ${error.message}` : error.code,
				'biconnector-healthcheck__details_line',
			));
			content.append(paragraph(getErrorDetail(error.code), 'biconnector-healthcheck__details_line'));
		}

		if (content.childElementCount === 0)
		{
			content.append(paragraph(message('DETAILS_EMPTY'), 'biconnector-healthcheck__details_line'));
		}
		details.append(content);

		return details;
	}

	#hasFailures(): boolean
	{
		return this.#snapshot.proxy?.status === 'FAILED'
			|| this.#snapshot.nodes.some((node) => node.status === 'FAILED');
	}

	#emptyText(idleKey: string): string
	{
		if (this.#snapshot.status === 'IDLE')
		{
			return message(idleKey);
		}

		if (this.#isWaiting())
		{
			return message('RESULTS_PENDING');
		}

		if (this.#snapshot.status === 'COMPLETED' && idleKey === 'NODES_EMPTY')
		{
			return message('NODES_NONE');
		}

		return message('RESULTS_UNAVAILABLE');
	}

	#checkText(status: HealthcheckCheck['status']): string
	{
		return status === 'SUCCESS' ? message('STATUS_SUCCESS') : message('STATUS_ERROR');
	}
}

export function mountPortalHealthcheck(rootElement: HTMLElement): PortalHealthcheck
{
	return PortalHealthcheck.mount({ rootElement });
}
