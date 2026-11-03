/* eslint-disable */
this.BX = this.BX || {};
(function (exports, main_core, main_date) {
	'use strict';

	const NETWORK_ERROR_CODE = 'NETWORK_ERROR';
	class HealthcheckRequestError extends Error {
		code;
		constructor(code) {
			super(code);
			this.name = 'HealthcheckRequestError';
			this.code = code;
		}
		get isNetwork() {
			return this.code === NETWORK_ERROR_CODE;
		}
		static from(reason) {
			if (reason instanceof HealthcheckRequestError) {
				return reason;
			}
			const errors = main_core.Type.isPlainObject(reason) ? reason.errors : null;
			const code = main_core.Type.isArray(errors) && main_core.Type.isPlainObject(errors[0]) ? errors[0].code : null;
			return new HealthcheckRequestError(main_core.Type.isStringFilled(code) ? code : NETWORK_ERROR_CODE);
		}
	}

	async function runAction(action) {
		try {
			const response = await main_core.ajax.runAction(action);
			return response.data;
		} catch (reason) {
			throw HealthcheckRequestError.from(reason);
		}
	}
	class HealthcheckClient {
		async get() {
			return runAction('biconnector.portalhealthcheck.get');
		}
		async start() {
			return runAction('biconnector.portalhealthcheck.start');
		}
	}

	const ERROR_CODES = new Set(['HEALTHCHECK_TOKEN_INVALID', 'PORTAL_URL_INVALID', 'PORTAL_HOST_MISMATCH', 'LICENSE_INVALID', 'HEALTHCHECK_NOT_SUPPORTED', 'HTTPS_REQUIRED', 'HEALTHCHECK_RATE_LIMITED', 'HEALTHCHECK_NOT_CONFIGURED', 'HEALTHCHECK_QUEUE_FULL', 'HEALTHCHECK_CONTROLLER_UNAVAILABLE', 'PROXY_ERROR', 'PROXY_NETWORK_ERROR', 'HEALTHCHECK_PROTOCOL_ERROR', 'HEALTHCHECK_RESULT_TIMEOUT', 'TARGET_NOT_HTTPS', 'TARGET_NOT_ALLOWED', 'CONTROLLER_REJECTED', 'ERR_NETWORK', 'ERR_PRIVATE_ADDRESS', 'ERR_REDIRECT', 'ERR_HTTP_STATUS', 'ERR_INVALID_RESPONSE', 'ERR_SSH_UNAVAILABLE', 'ERR_SCRIPT_UNAVAILABLE', 'ERR_SCRIPT_TIMEOUT', 'ERR_INVALID_OUTPUT', 'ERR_DNS_RESOLUTION', 'ERR_CONNECTION_REFUSED', 'ERR_TIMEOUT', 'ERR_TLS', 'ERR_TLS_CERTIFICATE', 'ERR_CURL_FAILED', 'ERR_UNKNOWN']);
	function message$1(key) {
		return main_core.Loc.getMessage(`BICONNECTOR_PORTAL_HEALTHCHECK_${key}`) ?? '';
	}
	function getErrorDetail(code) {
		if (code && ERROR_CODES.has(code)) {
			return message$1(`CODE_${code}`);
		}
		return message$1('ERROR_GENERIC');
	}
	function getStatusCopy(status, code, hasFailures = false) {
		if (status === 'COMPLETED') {
			if (code === 'HEALTHCHECK_PROTOCOL_ERROR') {
				return {
					title: message$1('STATUS_PROTOCOL'),
					detail: getErrorDetail(code),
					tone: 'warning'
				};
			}
			if (code) {
				return {
					title: message$1('STATUS_START_REJECTED'),
					detail: getErrorDetail(code),
					tone: 'warning'
				};
			}
			return hasFailures ? {
				title: message$1('STATUS_PARTIAL'),
				detail: message$1('PARTIAL_DESCRIPTION'),
				tone: 'warning'
			} : {
				title: message$1('STATUS_SUCCESS'),
				detail: message$1('SUCCESS_DESCRIPTION'),
				tone: 'success'
			};
		}
		const statuses = {
			IDLE: {
				title: message$1('STATUS_IDLE'),
				detail: message$1('IDLE_DESCRIPTION'),
				tone: 'neutral'
			},
			PENDING: {
				title: message$1('STATUS_PENDING'),
				detail: message$1('PENDING_DESCRIPTION'),
				tone: 'progress'
			},
			RUNNING: {
				title: message$1('STATUS_RUNNING'),
				detail: message$1('RUNNING_DESCRIPTION'),
				tone: 'progress'
			},
			PORTAL_UNAVAILABLE: {
				title: message$1('STATUS_PORTAL_UNAVAILABLE'),
				detail: message$1('PORTAL_UNAVAILABLE_DESCRIPTION'),
				tone: 'error'
			},
			NODES_CHECK_REJECTED: {
				title: message$1('STATUS_NODES_CHECK_REJECTED'),
				detail: message$1('NODES_CHECK_REJECTED_DESCRIPTION'),
				tone: 'warning'
			},
			RESULT_MISSING: {
				title: message$1('STATUS_RESULT_MISSING'),
				detail: message$1('RESULT_MISSING_DESCRIPTION'),
				tone: 'error'
			},
			FAILED: {
				title: message$1('STATUS_ERROR'),
				detail: message$1('ERROR_DESCRIPTION'),
				tone: 'error'
			}
		};
		const copy = statuses[status];
		if (!code) {
			return copy;
		}
		return {
			...copy,
			title: status === 'IDLE' ? message$1('STATUS_START_REJECTED') : copy.title,
			detail: getErrorDetail(code),
			tone: status === 'IDLE' ? 'warning' : copy.tone
		};
	}
	const REQUEST_ERROR_KEYS = new Map([['NETWORK_ERROR', 'REQUEST_NETWORK_ERROR'], ['ACCESS_DENIED', 'REQUEST_ACCESS_DENIED'], ['HEALTHCHECK_MODE_UNAVAILABLE', 'REQUEST_MODE_UNAVAILABLE'], ['invalid_csrf', 'REQUEST_SESSION_EXPIRED'], ['invalid_authentication', 'REQUEST_SESSION_EXPIRED']]);
	function getRequestErrorDetail(code) {
		return message$1(REQUEST_ERROR_KEYS.get(code) ?? 'REQUEST_ERROR_GENERIC');
	}

	const POLL_INTERVAL_MS = 5000;
	const MAX_TIMER_MS = 60000;
	function message(key) {
		return main_core.Loc.getMessage(`BICONNECTOR_PORTAL_HEALTHCHECK_${key}`) ?? '';
	}
	function element(tag, className, testId) {
		const node = document.createElement(tag);
		node.className = className;
		if (testId) {
			node.dataset.testid = testId;
		}
		return node;
	}
	function paragraph(text, className) {
		const node = element('p', className);
		node.textContent = text;
		return node;
	}
	class PortalHealthcheck {
		#root;
		#client;
		#snapshot = {
			status: 'IDLE',
			nodes: []
		};
		#requestError = null;
		#startButton = null;
		#actionHint = null;
		#pollTimer = null;
		#cooldownTimer = null;
		#requestVersion = 0;
		#requestPending = false;
		#finalReadDone = false;
		#destroyed = false;
		#suspended = false;
		#pageHide = () => {
			this.#pause();
		};
		#pageShow = () => {
			this.#resume();
		};
		#visibilityChange = () => {
			if (document.visibilityState === 'hidden') {
				this.#pause();
			} else {
				this.#resume();
			}
		};
		static mount(options) {
			return new PortalHealthcheck(options);
		}
		constructor({
			rootElement,
			client
		}) {
			this.#root = rootElement;
			this.#client = client ?? new HealthcheckClient();
			this.#suspended = document.visibilityState === 'hidden';
			this.#render();
			main_core.Event.bind(window, 'pagehide', this.#pageHide);
			main_core.Event.bind(window, 'pageshow', this.#pageShow);
			main_core.Event.bind(document, 'visibilitychange', this.#visibilityChange);
			void this.#read();
		}
		renderSnapshot(snapshot) {
			this.#requestVersion++;
			this.#requestPending = false;
			this.#applySnapshot(snapshot, null);
			this.#schedulePolling();
		}
		destroy() {
			this.#stop();
			main_core.Dom.clean(this.#root);
		}
		#stop() {
			this.#destroyed = true;
			this.#pause();
			main_core.Event.unbind(window, 'pagehide', this.#pageHide);
			main_core.Event.unbind(window, 'pageshow', this.#pageShow);
			main_core.Event.unbind(document, 'visibilitychange', this.#visibilityChange);
		}
		#resume() {
			if (!this.#destroyed && this.#suspended && document.visibilityState !== 'hidden') {
				this.#suspended = false;
				void this.#read();
			}
		}
		#pause() {
			this.#suspended = true;
			this.#requestVersion++;
			this.#requestPending = false;
			this.#clearPollTimer();
			if (this.#cooldownTimer !== null) {
				clearTimeout(this.#cooldownTimer);
				this.#cooldownTimer = null;
			}
		}
		async #read() {
			if (this.#destroyed || this.#suspended) {
				return;
			}
			if (!this.#root.isConnected) {
				this.#stop();
				return;
			}
			const requestVersion = ++this.#requestVersion;
			this.#requestPending = true;
			this.#syncAction();
			let requestError = null;
			try {
				const snapshot = await this.#client.get();
				if (this.#isCurrent(requestVersion)) {
					this.#applySnapshot(snapshot, null);
				}
			} catch (reason) {
				requestError = HealthcheckRequestError.from(reason);
				if (this.#isCurrent(requestVersion)) {
					this.#applySnapshot(this.#snapshot, requestError);
				}
			} finally {
				if (this.#isCurrent(requestVersion)) {
					this.#requestPending = false;
					this.#syncAction();
					if (requestError === null || requestError.isNetwork) {
						this.#schedulePolling(requestError !== null);
					}
				}
			}
		}
		async #start() {
			if (this.#destroyed || this.#suspended || this.#requestPending || this.#isActionBlocked()) {
				return;
			}
			this.#clearPollTimer();
			const requestVersion = ++this.#requestVersion;
			this.#requestPending = true;
			this.#syncAction();
			let refreshAfterError = false;
			try {
				const snapshot = await this.#client.start();
				if (this.#isCurrent(requestVersion)) {
					this.#applySnapshot(snapshot, null);
				}
			} catch (reason) {
				const requestError = HealthcheckRequestError.from(reason);
				refreshAfterError = requestError.isNetwork;
				if (!refreshAfterError && this.#isCurrent(requestVersion)) {
					this.#applySnapshot(this.#snapshot, requestError);
				}
			} finally {
				if (this.#isCurrent(requestVersion)) {
					this.#requestPending = false;
					this.#syncAction();
					if (refreshAfterError) {
						void this.#read();
					} else {
						this.#schedulePolling();
					}
				}
			}
		}
		#isCurrent(requestVersion) {
			return !this.#destroyed && !this.#suspended && requestVersion === this.#requestVersion;
		}
		#applySnapshot(snapshot, requestError) {
			const changed = JSON.stringify(this.#snapshot) !== JSON.stringify(snapshot) || this.#requestError?.code !== requestError?.code;
			if (this.#snapshot.resultDeadline !== snapshot.resultDeadline) {
				this.#finalReadDone = false;
			}
			this.#snapshot = snapshot;
			this.#requestError = requestError;
			if (changed) {
				this.#render();
			} else {
				this.#syncAction();
			}
		}
		#schedulePolling(afterError = false) {
			this.#clearPollTimer();
			const lateResult = this.#hasLateResultWindow();
			if (this.#destroyed || this.#suspended || !this.#isWaiting() && !lateResult) {
				return;
			}
			const deadline = Date.parse(this.#snapshot.resultDeadline ?? '');
			if (!Number.isFinite(deadline)) {
				return;
			}
			const remaining = deadline - Date.now();
			if (remaining <= 0 && lateResult) {
				return;
			}
			if (remaining <= 0 && this.#finalReadDone && !afterError) {
				this.#applySnapshot({
					...this.#snapshot,
					status: 'RESULT_MISSING',
					errorCode: this.#snapshot.errorCode || 'HEALTHCHECK_RESULT_TIMEOUT'
				}, null);
				return;
			}
			let delay = Math.min(POLL_INTERVAL_MS, remaining);
			if (remaining <= 0) {
				delay = afterError ? POLL_INTERVAL_MS : 0;
			}
			this.#pollTimer = setTimeout(() => {
				this.#pollTimer = null;
				if (deadline <= Date.now() && !lateResult) {
					this.#finalReadDone = true;
				}
				void this.#read();
			}, delay);
		}
		#clearPollTimer() {
			if (this.#pollTimer !== null) {
				clearTimeout(this.#pollTimer);
				this.#pollTimer = null;
			}
		}
		#isWaiting() {
			return this.#snapshot.status === 'RUNNING' || this.#snapshot.status === 'PENDING';
		}
		#hasLateResultWindow() {
			return this.#snapshot.status === 'FAILED' && (this.#snapshot.errorCode === 'HEALTHCHECK_CONTROLLER_UNAVAILABLE' || this.#snapshot.errorCode === 'HEALTHCHECK_QUEUE_FULL');
		}
		#isActionBlocked() {
			const nextAllowedAt = Date.parse(this.#snapshot.nextAllowedAt ?? '');
			return this.#isWaiting() || Number.isFinite(nextAllowedAt) && nextAllowedAt > Date.now();
		}
		#syncAction() {
			if (this.#startButton) {
				this.#startButton.disabled = this.#requestPending || this.#isActionBlocked();
			}
			if (this.#actionHint) {
				this.#actionHint.textContent = this.#actionHintText();
			}
			if (this.#cooldownTimer !== null) {
				clearTimeout(this.#cooldownTimer);
				this.#cooldownTimer = null;
			}
			const nextAllowedAt = Date.parse(this.#snapshot.nextAllowedAt ?? '');
			if (Number.isFinite(nextAllowedAt) && nextAllowedAt > Date.now()) {
				this.#cooldownTimer = setTimeout(() => {
					this.#cooldownTimer = null;
					this.#syncAction();
				}, Math.min(MAX_TIMER_MS, nextAllowedAt - Date.now()));
			}
		}
		#actionHintText() {
			const nextAllowedAt = Date.parse(this.#snapshot.nextAllowedAt ?? '');
			if (Number.isFinite(nextAllowedAt) && nextAllowedAt > Date.now()) {
				const formatted = main_date.DateTimeFormat.format(main_date.DateTimeFormat.getFormat('FORMAT_DATETIME'), Math.floor(nextAllowedAt / 1000));
				return main_core.Loc.getMessage('BICONNECTOR_PORTAL_HEALTHCHECK_COOLDOWN_HINT', {
					'#TIME#': formatted
				}) ?? '';
			}
			if (this.#requestPending) {
				return message('LOADING_HINT');
			}
			return this.#isWaiting() ? message('RUNNING_HINT') : '';
		}
		#render() {
			const openDetails = new Set([...this.#root.querySelectorAll('details[open]')].map(details => details.dataset.detailKey ?? ''));
			const focused = document.activeElement;
			const focusedDetail = focused?.closest('details');
			const focusKey = focusedDetail?.dataset.detailKey;
			const actionFocused = focused?.tagName === 'BUTTON' && this.#root.contains(focused);
			const page = element('main', 'biconnector-healthcheck');
			page.append(paragraph(message('DESCRIPTION'), 'biconnector-healthcheck__description'), this.#renderToolbar());
			if (this.#requestError) {
				page.append(this.#renderRequestError(this.#requestError));
			}
			page.append(this.#renderOverview(), this.#renderResult(openDetails));
			main_core.Dom.clean(this.#root);
			main_core.Dom.append(page, this.#root);
			this.#syncAction();
			if (actionFocused) {
				this.#startButton?.focus({
					preventScroll: true
				});
			} else if (focusKey) {
				const details = [...this.#root.querySelectorAll('details')].find(item => item.dataset.detailKey === focusKey);
				details?.querySelector('summary')?.focus({
					preventScroll: true
				});
			}
		}
		#renderRequestError(requestError) {
			const notice = element('section', 'adm-info-message-wrap adm-info-message-red biconnector-healthcheck__notice', 'healthcheck-request-error');
			notice.setAttribute('role', 'alert');
			const content = element('div', 'adm-info-message');
			const title = element('div', 'adm-info-message-title');
			title.textContent = message('REQUEST_ERROR_TITLE');
			content.append(title, paragraph(getRequestErrorDetail(requestError.code), 'biconnector-healthcheck__notice_detail'));
			notice.append(content);
			return notice;
		}
		#renderToolbar() {
			const toolbar = element('div', 'biconnector-healthcheck__toolbar');
			const button = element('button', 'adm-btn adm-btn-save', 'healthcheck-start');
			button.type = 'button';
			button.textContent = message('START');
			main_core.Event.bind(button, 'click', () => {
				void this.#start();
			});
			this.#startButton = button;
			const hint = element('span', 'biconnector-healthcheck__action_hint');
			this.#actionHint = hint;
			toolbar.append(button, hint);
			return toolbar;
		}
		#renderOverview() {
			const copy = getStatusCopy(this.#snapshot.status, this.#snapshot.errorCode ?? this.#snapshot.nodesCheck?.code, this.#hasFailures());
			let adminTone = '';
			switch (copy.tone) {
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
			}
			const notice = element('section', `adm-info-message-wrap ${adminTone} biconnector-healthcheck__notice`, 'healthcheck-overview');
			notice.setAttribute('role', 'status');
			const content = element('div', 'adm-info-message');
			const title = element('div', 'adm-info-message-title', 'healthcheck-summary-status');
			title.textContent = copy.title;
			const detail = paragraph(copy.detail, 'biconnector-healthcheck__notice_detail');
			content.append(title, detail);
			if (copy.tone === 'success' || copy.tone === 'error') {
				const icon = element('div', 'adm-info-message-icon');
				icon.setAttribute('aria-hidden', 'true');
				content.append(icon);
			}
			notice.append(content);
			return notice;
		}
		#renderResult(openDetails) {
			const wrapper = element('div', 'biconnector-healthcheck__table_wrap');
			const table = element('table', 'adm-list-table biconnector-healthcheck__table');
			table.append(this.#renderProxy(openDetails), this.#renderNodes(openDetails));
			wrapper.append(table);
			return wrapper;
		}
		#renderGroup(title) {
			const row = element('tr', 'adm-list-table-header');
			const cell = this.#renderCell(title);
			cell.colSpan = 3;
			row.append(cell);
			return row;
		}
		#renderCell(content, className = '') {
			const cell = element('td', `adm-list-table-cell ${className}`);
			const inner = element('div', 'adm-list-table-cell-inner');
			if (main_core.Type.isString(content)) {
				inner.textContent = content;
			} else {
				inner.append(content);
			}
			cell.append(inner);
			return cell;
		}
		#renderProxy(openDetails) {
			const body = element('tbody', 'biconnector-healthcheck__group', 'healthcheck-proxy');
			body.append(this.#renderGroup(message('PROXY_TITLE')));
			const row = element('tr', 'adm-list-table-row');
			const proxy = this.#snapshot.proxy;
			if (proxy === undefined) {
				const empty = this.#renderCell(this.#emptyText('PROXY_EMPTY'), 'biconnector-healthcheck__empty');
				empty.colSpan = 3;
				row.append(empty);
			} else {
				const result = element('div', 'biconnector-healthcheck__result');
				result.append(this.#renderStatus(this.#checkText(proxy.status), proxy.status === 'SUCCESS' ? 'success' : 'error', 'healthcheck-proxy-status'));
				if (proxy.status === 'FAILED' && proxy.errors?.length) {
					result.append(paragraph(getErrorDetail(proxy.errors[0].code), 'biconnector-healthcheck__error'));
				}
				if (proxy.httpCode !== undefined && proxy.httpCode !== 0) {
					result.append(paragraph(`${message('HTTP_CODE')}: ${proxy.httpCode}`, 'biconnector-healthcheck__http'));
				}
				row.append(this.#renderCell(proxy.address ?? message('PROXY_TITLE'), 'biconnector-healthcheck__target'), this.#renderCell(result), this.#renderCell(this.#renderDetails(proxy, 'proxy', openDetails), 'adm-list-table-cell-last'));
			}
			body.append(row);
			return body;
		}
		#renderNodes(openDetails) {
			const body = element('tbody', 'biconnector-healthcheck__group', 'healthcheck-nodes');
			body.append(this.#renderGroup(message('NODES_TITLE')));
			if (this.#snapshot.nodes.length === 0) {
				const row = element('tr', 'adm-list-table-row');
				const empty = this.#renderCell(this.#snapshot.nodesCheck?.code ? getErrorDetail(this.#snapshot.nodesCheck.code) : this.#emptyText('NODES_EMPTY'), 'biconnector-healthcheck__empty');
				empty.colSpan = 3;
				row.append(empty);
				body.append(row);
				return body;
			}
			for (const [index, node] of this.#snapshot.nodes.entries()) {
				const row = element('tr', 'adm-list-table-row biconnector-healthcheck__node');
				const result = element('div', 'biconnector-healthcheck__result');
				result.append(this.#renderStatus(this.#checkText(node.status), node.status === 'SUCCESS' ? 'success' : 'error', 'healthcheck-node-status'));
				if (node.httpCode !== undefined && node.httpCode !== 0) {
					result.append(paragraph(`${message('HTTP_CODE')}: ${node.httpCode}`, 'biconnector-healthcheck__http'));
				}
				row.append(this.#renderCell(node.publicHost || node.node || message('NODE_UNKNOWN'), 'biconnector-healthcheck__target'), this.#renderCell(result), this.#renderCell(this.#renderDetails(node, `node-${index}`, openDetails), 'adm-list-table-cell-last'));
				body.append(row);
			}
			return body;
		}
		#renderStatus(text, tone, testId) {
			const status = element('span', `biconnector-healthcheck__status --${tone}`, testId);
			status.textContent = text;
			return status;
		}
		#renderDetails(check, key, openDetails) {
			const details = element('details', 'biconnector-healthcheck__details');
			details.dataset.detailKey = key;
			details.open = openDetails.has(key);
			const summary = element('summary', 'biconnector-healthcheck__details_toggle');
			summary.textContent = message('DETAILS');
			details.append(summary);
			const content = element('div', 'biconnector-healthcheck__details_content');
			if (check.httpCode !== undefined && check.httpCode !== 0) {
				content.append(paragraph(`${message('HTTP_CODE')}: ${check.httpCode}`, 'biconnector-healthcheck__details_line'));
			}
			if (check.remoteIp) {
				content.append(paragraph(`${message('PORTAL_ADDRESS')}: ${check.remoteIp}`, 'biconnector-healthcheck__details_line'));
			}
			if (check.egressAddresses?.length) {
				content.append(paragraph(`${message('EGRESS_ADDRESSES')}: ${check.egressAddresses.join(', ')}`, 'biconnector-healthcheck__details_line'));
			}
			for (const error of check.errors ?? []) {
				content.append(paragraph(error.message ? `${error.code}: ${error.message}` : error.code, 'biconnector-healthcheck__details_line'));
				content.append(paragraph(getErrorDetail(error.code), 'biconnector-healthcheck__details_line'));
			}
			if (content.childElementCount === 0) {
				content.append(paragraph(message('DETAILS_EMPTY'), 'biconnector-healthcheck__details_line'));
			}
			details.append(content);
			return details;
		}
		#hasFailures() {
			return this.#snapshot.proxy?.status === 'FAILED' || this.#snapshot.nodes.some(node => node.status === 'FAILED');
		}
		#emptyText(idleKey) {
			if (this.#snapshot.status === 'IDLE') {
				return message(idleKey);
			}
			if (this.#isWaiting()) {
				return message('RESULTS_PENDING');
			}
			if (this.#snapshot.status === 'COMPLETED' && idleKey === 'NODES_EMPTY') {
				return message('NODES_NONE');
			}
			return message('RESULTS_UNAVAILABLE');
		}
		#checkText(status) {
			return status === 'SUCCESS' ? message('STATUS_SUCCESS') : message('STATUS_ERROR');
		}
	}
	function mountPortalHealthcheck(rootElement) {
		return PortalHealthcheck.mount({
			rootElement
		});
	}

	exports.PortalHealthcheck = PortalHealthcheck;
	exports.mountPortalHealthcheck = mountPortalHealthcheck;

})(this.BX.BIConnector = this.BX.BIConnector || {}, BX, BX.Main);
//# sourceMappingURL=portal-healthcheck.bundle.js.map
