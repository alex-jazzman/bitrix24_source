/* eslint-disable */
this.BX = this.BX || {};
(function (exports, main_core, ui_notification, ui_analytics) {
	'use strict';

	const LAUNCH_ACTION = 'biconnector.chartanalysis.launch';
	const PAYLOAD_VERSION = 4;
	const NETWORK_ERROR = 'NETWORK_ERROR';
	const SUBSCRIPTION_REQUIRED_ERROR = 'CHART_ANALYSIS_SUBSCRIPTION_REQUIRED';
	const RATE_LIMITED_ERROR = 'CHART_ANALYSIS_RATE_LIMITED';
	class ChartAnalysisApi {
		#runAction;
		constructor(runAction = (...args) => main_core.ajax.runAction(...args)) {
			this.#runAction = runAction;
		}
		async launch(request) {
			const {
				dashboardId,
				requestId,
				card,
				previousStatus,
				data,
				chatId: previousChatId
			} = request;
			const payload = JSON.stringify({
				version: PAYLOAD_VERSION,
				requestId,
				card,
				previousStatus,
				data
			});
			const actionData = {
				dashboardId,
				payload
			};
			if (main_core.Type.isInteger(previousChatId) && previousChatId > 0) {
				actionData.chatId = previousChatId;
			}
			let response = null;
			try {
				response = await this.#runAction(LAUNCH_ACTION, {
					data: actionData
				});
			} catch (failure) {
				throw this.#toLaunchError(failure);
			}
			const chatId = Number(response?.data?.chatId);
			if (!Number.isInteger(chatId) || chatId <= 0) {
				throw this.#networkError();
			}
			const botId = Number(response?.data?.botId);
			return {
				chatId,
				botId: Number.isInteger(botId) && botId > 0 ? botId : 0
			};
		}
		#toLaunchError(failure) {
			const error = failure?.errors?.[0];
			if (!main_core.Type.isStringFilled(error?.code) || error.code === NETWORK_ERROR) {
				return this.#networkError();
			}
			const launchError = {
				code: error.code,
				message: main_core.Type.isString(error.message) ? error.message : ''
			};
			const promoterCode = error.customData?.promoterCode;
			if (main_core.Type.isStringFilled(promoterCode)) {
				launchError.promoterCode = promoterCode;
			}
			return launchError;
		}
		#networkError() {
			return {
				code: NETWORK_ERROR,
				message: main_core.Loc.getMessage('BICONNECTOR_CHART_ANALYSIS_NETWORK_ERROR') ?? ''
			};
		}
	}
	const api = new ChartAnalysisApi();

	const TOOL = 'BI_Builder';
	const CATEGORY = 'ai_agents';
	const SECTION = 'chart_analysis';
	const MAX_CODE_LENGTH = 50;
	const OTHER_CODE = 'other';
	function normalizeCode(value) {
		const code = String(value ?? '').toLowerCase();
		return /^[\d_a-z]+$/.test(code) && code.length <= MAX_CODE_LENGTH ? code : OTHER_CODE;
	}
	function createAnalytics(sendData = ui_analytics.sendData) {
		const send = (event, options) => {
			const data = {
				tool: TOOL,
				category: CATEGORY,
				event,
				c_section: SECTION,
				c_element: normalizeCode(options.vizType)
			};
			if (options.status !== undefined) {
				data.type = normalizeCode(options.status);
			}
			sendData(data);
		};
		return {
			send,
			sendPreviousStatus: (previousStatus, vizType) => {
				if (previousStatus !== null) {
					send(`previous_${previousStatus}`, {
						vizType
					});
				}
			}
		};
	}
	const analytics = createAnalytics();

	const subscribeToChatMessages = callback => {
		const pullClient = globalThis.BX?.PULL;
		const unsubscribe = pullClient?.subscribe({
			moduleId: 'im',
			command: 'messageChat',
			callback: params => callback(params)
		});
		return main_core.Type.isFunction(unsubscribe) ? unsubscribe : () => {};
	};
	class ReplyWatcher {
		#unsubscribe;
		#onReply;
		#chatId = null;
		#botId = 0;
		#earlySenders = new Set();
		constructor(subscribe, onReply) {
			this.#onReply = onReply;
			this.#unsubscribe = subscribe(params => this.#onMessage(params));
		}
		expect(chatId, botId) {
			this.#chatId = chatId;
			this.#botId = botId;
			if (this.#earlySenders.has(this.#senderKey(chatId, botId))) {
				this.#reply();
			}
		}
		stop() {
			const unsubscribe = this.#unsubscribe;
			this.#unsubscribe = null;
			this.#earlySenders.clear();
			unsubscribe?.();
		}
		#onMessage(params) {
			if (this.#unsubscribe === null) {
				return;
			}
			const chatId = Number(params?.chatId) || 0;
			const senderId = Number(params?.message?.senderId) || 0;
			if (chatId <= 0 || senderId <= 0 || params?.message?.system === 'Y' || Boolean(params?.message?.params?.COMPONENT_PARAMS?.copilotProcess)) {
				return;
			}
			if (this.#chatId === null) {
				this.#earlySenders.add(this.#senderKey(chatId, senderId));
			}
			else if (chatId === this.#chatId && senderId === this.#botId) {
				this.#reply();
			}
		}
		#senderKey(chatId, senderId) {
			return `${chatId}:${senderId}`;
		}
		#reply() {
			this.stop();
			this.#onReply();
		}
	}

	const LINE_PHRASES = {
		no_data: 'BICONNECTOR_CHART_ANALYSIS_STUB_NO_DATA',
		too_large: 'BICONNECTOR_CHART_ANALYSIS_STUB_TOO_LARGE'
	};
	const defaultDependencies$1 = {
		createRetryButton: async (text, onClick) => {
			const loading = main_core.Runtime.loadExtension('ui.buttons');
			const {
				Button,
				ButtonSize,
				AirButtonStyle
			} = await loading;
			return new Button({
				text,
				size: ButtonSize.SMALL,
				style: AirButtonStyle.OUTLINE,
				useAirDesign: true,
				onclick: () => onClick()
			}).render();
		}
	};
	function renderCard(card) {
		const node = main_core.Tag.render`
		<div class="biconnector-chart-analysis-stub__card">
			<div class="biconnector-chart-analysis-stub__title">${main_core.Text.encode(card.sliceName)}</div>
		</div>
	`;
		if (main_core.Type.isStringFilled(card.periodLabel)) {
			main_core.Dom.append(main_core.Tag.render`
			<div class="biconnector-chart-analysis-stub__period">${main_core.Text.encode(card.periodLabel)}</div>
		`, node);
		}
		if (main_core.Type.isArrayFilled(card.appliedFilters)) {
			const list = main_core.Tag.render`<ul class="biconnector-chart-analysis-stub__filters"></ul>`;
			card.appliedFilters.forEach(filter => {
				main_core.Dom.append(main_core.Tag.render`
				<li class="biconnector-chart-analysis-stub__filter">
					${main_core.Text.encode(filter.label)}: ${main_core.Text.encode(filter.value)}
				</li>
			`, list);
			});
			main_core.Dom.append(list, node);
		}
		return node;
	}
	function getLineText(state, options = {}) {
		if (state === 'error') {
			return main_core.Type.isStringFilled(options.message) ? options.message : main_core.Loc.getMessage('BICONNECTOR_CHART_ANALYSIS_ANALYZE_ERROR') ?? '';
		}
		return main_core.Loc.getMessage(LINE_PHRASES[state]) ?? '';
	}
	function renderStub(state, card, options = {}, dependencies = defaultDependencies$1) {
		const node = main_core.Tag.render`
		<div class="biconnector-chart-analysis-stub --${state}">
			<div class="biconnector-chart-analysis-stub__line">${main_core.Text.encode(getLineText(state, options))}</div>
		</div>
	`;
		main_core.Dom.prepend(renderCard(card), node);
		if (state === 'error' && main_core.Type.isFunction(options.onRetry)) {
			const actions = main_core.Tag.render`<div class="biconnector-chart-analysis-stub__actions"></div>`;
			main_core.Dom.append(actions, node);
			const text = main_core.Loc.getMessage('BICONNECTOR_CHART_ANALYSIS_STUB_RETRY') ?? '';
			dependencies.createRetryButton(text, options.onRetry).then(button => main_core.Dom.append(button, actions)).catch(error => console.error('ChartAnalysis: failed to render retry button', error));
		}
		return node;
	}

	const CONTRACT_VERSION = 4;
	const CONFIG_TIMEOUT_MS = 3000;
	const ANALYZE_TIMEOUT_MS = 30000;
	const ANALYZE_TIMEOUT_REASON = 'host_timeout';
	const BUSY_HEARTBEAT_MS = 15000;
	const REPLY_TIMEOUT_MS = 120_000;
	const START_METHOD = 'bxChartAnalyzeStart';
	const ANALYZE_METHOD = 'bxChartAnalyze';
	const defaultDependencies = {
		api: api,
		renderStub: (state, card, options) => renderStub(state, card, options),
		openPromoter: code => {
			const loading = main_core.Runtime.loadExtension('ui.info-helper');
			void loading.then(({
				InfoHelper
			}) => InfoHelper.show(code));
		},
		notify: message => ui_notification.Center.notify({
			content: main_core.Text.encode(message)
		}),
		analytics: analytics,
		subscribeToChatMessages,
		configTimeoutMs: CONFIG_TIMEOUT_MS,
		analyzeTimeoutMs: ANALYZE_TIMEOUT_MS,
		heartbeatMs: BUSY_HEARTBEAT_MS,
		replyTimeoutMs: REPLY_TIMEOUT_MS
	};
	class ChartAnalysisSession {
		#loader;
		#launcher;
		#config;
		#dependencies;
		#mode;
		#currentRequestId = null;
		#launchedRequestId = null;
		#isDestroyed = false;
		#analyzeTimerId = null;
		#isStubShown = false;
		#replyWatcher = null;
		#replyRequestId = null;
		#heartbeatId = null;
		#replyTimerId = null;
		#chatId = null;
		constructor(options) {
			this.#loader = options.loader;
			this.#launcher = options.launcher;
			this.#config = options.config;
			this.#dependencies = {
				...defaultDependencies,
				...options.dependencies
			};
			this.#mode = options.config.state === 'subscription_required' ? 'notify' : 'analyze';
		}
		async connect() {
			this.#loader.defineFrameMethod(START_METHOD, event => this.#onStart(event));
			this.#loader.defineFrameMethod(ANALYZE_METHOD, event => this.#onAnalyze(event));
			const result = await this.#applyConfig();
			return result?.applied === true && main_core.Type.isArray(result.supportedVersions) && result.supportedVersions.includes(CONTRACT_VERSION);
		}
		destroy() {
			this.#isDestroyed = true;
			this.#currentRequestId = null;
			this.#launchedRequestId = null;
			this.#chatId = null;
			this.#clearAnalyzeTimeout();
			this.#stopReplyWait();
			if (this.#isStubShown) {
				this.#hideStub();
			}
		}
		async #applyConfig() {
			const controller = new AbortController();
			const timeout = new Promise(resolve => {
				main_core.Event.bind(controller.signal, 'abort', () => resolve(null), {
					once: true
				});
			});
			const timerId = setTimeout(() => controller.abort(), this.#dependencies.configTimeoutMs);
			let result = null;
			try {
				result = await Promise.race([this.#loader.setBxAiConfig(this.#buildConfig(), controller.signal), timeout]);
			} catch (error) {
				this.#disableFrame();
				throw error;
			} finally {
				clearTimeout(timerId);
			}
			if (result === null) {
				this.#disableFrame();
			}
			return result;
		}
		#disableFrame() {
			Promise.resolve().then(() => this.#loader.setBxAiConfig({
				...this.#buildConfig(),
				enabled: false
			})).catch(() => {});
		}
		#buildConfig() {
			const replacements = {
				'#BITRIXGPT_NAME#': this.#config.bitrixGptName
			};
			return {
				version: CONTRACT_VERSION,
				enabled: true,
				mode: this.#mode,
				labels: {
					action: main_core.Loc.getMessage('BICONNECTOR_CHART_ANALYSIS_ACTION', replacements) ?? '',
					unavailable: main_core.Loc.getMessage('BICONNECTOR_CHART_ANALYSIS_UNAVAILABLE', replacements) ?? '',
					busy: main_core.Loc.getMessage('BICONNECTOR_CHART_ANALYSIS_BUSY', replacements) ?? ''
				}
			};
		}
		#isActual(event) {
			if (this.#isDestroyed) {
				return false;
			}
			if (event?.version === CONTRACT_VERSION) {
				return true;
			}
			const requestId = event?.requestId;
			if (main_core.Type.isStringFilled(requestId)) {
				this.#release(requestId);
			}
			return false;
		}
		#onStart(event) {
			if (!this.#isActual(event) || !main_core.Type.isStringFilled(event.requestId)) {
				return;
			}
			if (this.#mode === 'notify') {
				this.#openPromoter(this.#config.promoterCode, event.card);
				return;
			}
			this.#dependencies.analytics.send('click', {
				vizType: event.card?.vizType
			});
			this.#stopReplyWait();
			this.#currentRequestId = event.requestId;
			this.#setBusy(event.requestId);
			this.#launcher.open();
			this.#hideStaleStub();
			this.#startAnalyzeTimeout(event);
		}
		#startAnalyzeTimeout(event) {
			this.#clearAnalyzeTimeout();
			this.#analyzeTimerId = setTimeout(() => {
				this.#analyzeTimerId = null;
				if (!this.#isCurrent(event.requestId)) {
					return;
				}
				this.#currentRequestId = null;
				this.#dependencies.analytics.send('analyze_error', {
					vizType: event.card?.vizType,
					status: ANALYZE_TIMEOUT_REASON
				});
				this.#showFailure('error', event.card, {
					message: main_core.Loc.getMessage('BICONNECTOR_CHART_ANALYSIS_ANALYZE_ERROR') ?? ''
				});
				this.#release(event.requestId);
			}, this.#dependencies.analyzeTimeoutMs);
		}
		#clearAnalyzeTimeout() {
			if (this.#analyzeTimerId !== null) {
				clearTimeout(this.#analyzeTimerId);
				this.#analyzeTimerId = null;
			}
		}
		#onAnalyze(event) {
			if (!this.#isActual(event) || event.requestId !== this.#currentRequestId || event.requestId === this.#launchedRequestId) {
				return;
			}
			this.#clearAnalyzeTimeout();
			const vizType = event.card?.vizType;
			if (event.status === 'ok') {
				this.#launchedRequestId = event.requestId;
				this.#dependencies.analytics.sendPreviousStatus(event.previousStatus, vizType);
				void this.#launch(event);
				return;
			}
			if (event.status === 'no_data' || event.status === 'too_large') {
				this.#dependencies.analytics.send(event.status, {
					vizType
				});
				this.#showFailure(event.status, event.card);
			} else {
				this.#dependencies.analytics.send('analyze_error', {
					vizType,
					status: event.reason
				});
				this.#showFailure('error', event.card, {
					message: main_core.Loc.getMessage('BICONNECTOR_CHART_ANALYSIS_ANALYZE_ERROR') ?? ''
				});
			}
			this.#release(event.requestId);
		}
		async #launch(snapshot) {
			const {
				requestId,
				card,
				previousStatus,
				data
			} = snapshot;
			const request = {
				dashboardId: this.#config.dashboardId,
				requestId,
				card,
				previousStatus,
				data
			};
			const previousChatId = this.#chatId;
			if (previousChatId !== null) {
				request.chatId = previousChatId;
			}
			this.#startReplyWait(requestId);
			let result = null;
			try {
				result = await this.#dependencies.api.launch(request);
			} catch (error) {
				if (this.#isCurrent(requestId)) {
					this.#handleRefusal(error, snapshot);
					this.#finishReplyWait(requestId);
				}
				return;
			}
			if (!this.#isCurrent(requestId)) {
				return;
			}
			this.#chatId = result.chatId;
			this.#expectReply(requestId, result.chatId, result.botId);
			try {
				await this.#launcher.openDialog(result.chatId);
				this.#isStubShown = false;
			} catch {
				if (this.#isCurrent(requestId)) {
					this.#showFailure('error', card, {
						message: main_core.Loc.getMessage('BICONNECTOR_CHART_ANALYSIS_ANALYZE_ERROR') ?? ''
					}, previousChatId !== null);
					this.#finishReplyWait(requestId);
				}
			}
		}
		#startReplyWait(requestId) {
			this.#stopReplyWait();
			this.#replyRequestId = requestId;
			this.#replyWatcher = new ReplyWatcher(this.#dependencies.subscribeToChatMessages, () => this.#finishReplyWait(requestId));
			this.#setBusy(requestId);
			this.#heartbeatId = setInterval(() => this.#setBusy(requestId), this.#dependencies.heartbeatMs);
			this.#replyTimerId = setTimeout(() => this.#finishReplyWait(requestId), this.#dependencies.replyTimeoutMs);
		}
		#expectReply(requestId, chatId, botId) {
			if (this.#replyRequestId !== requestId) {
				return;
			}
			this.#replyWatcher?.expect(chatId, botId);
		}
		#finishReplyWait(requestId) {
			if (this.#replyRequestId !== requestId) {
				return;
			}
			this.#stopReplyWait();
			this.#release(requestId);
		}
		#stopReplyWait() {
			const watcher = this.#replyWatcher;
			this.#replyWatcher = null;
			this.#replyRequestId = null;
			if (this.#heartbeatId !== null) {
				clearInterval(this.#heartbeatId);
				this.#heartbeatId = null;
			}
			if (this.#replyTimerId !== null) {
				clearTimeout(this.#replyTimerId);
				this.#replyTimerId = null;
			}
			watcher?.stop();
		}
		#handleRefusal(error, snapshot) {
			if (error?.code === SUBSCRIPTION_REQUIRED_ERROR) {
				this.#hideStub();
				this.#openPromoter(error.promoterCode ?? this.#config.promoterCode, snapshot.card);
				return;
			}
			this.#dependencies.analytics.send('launch_error', {
				vizType: snapshot.card?.vizType,
				status: error?.code
			});
			const options = {
				message: main_core.Type.isStringFilled(error?.message) ? error.message : ''
			};
			if (error?.code !== RATE_LIMITED_ERROR) {
				options.onRetry = () => this.#retry(snapshot);
			}
			this.#showFailure('error', snapshot.card, options);
		}
		#retry(snapshot) {
			if (!this.#isCurrent(snapshot.requestId)) {
				return;
			}
			this.#setBusy(snapshot.requestId);
			this.#hideStaleStub();
			void this.#launch(snapshot);
		}
		#isCurrent(requestId) {
			return !this.#isDestroyed && this.#currentRequestId === requestId;
		}
		#hideStaleStub() {
			if (this.#isStubShown) {
				this.#hideStub();
			}
		}
		#showFailure(state, card, options = {}, isChatShown = this.#chatId !== null) {
			if (!isChatShown) {
				this.#showStub(state, card, options);
				return;
			}
			if (this.#isStubShown) {
				this.#hideStub();
			}
			this.#dependencies.notify(getLineText(state, {
				message: options.message
			}));
		}
		#showStub(state, card, options) {
			this.#launcher.showStub(this.#dependencies.renderStub(state, card, options));
			this.#isStubShown = true;
		}
		#hideStub() {
			this.#launcher.hideStub();
			this.#isStubShown = false;
		}
		#openPromoter(code, card) {
			if (main_core.Type.isStringFilled(code)) {
				this.#dependencies.analytics.send('subscription_open', {
					vizType: card?.vizType
				});
				this.#dependencies.openPromoter(code);
			}
		}
		#setBusy(requestId) {
			void this.#loader.setBxAiState({
				version: CONTRACT_VERSION,
				busyRequestId: requestId
			});
		}
		#release(requestId) {
			void this.#loader.setBxAiState({
				version: CONTRACT_VERSION,
				busyRequestId: null,
				doneRequestId: requestId
			});
		}
	}
	const ChartAnalysis = {
		async attach(options) {
			const session = new ChartAnalysisSession(options);
			try {
				if (await session.connect()) {
					return session;
				}
			} catch {
			}
			session.destroy();
			return null;
		}
	};

	exports.ChartAnalysis = ChartAnalysis;
	exports.ChartAnalysisApi = ChartAnalysisApi;
	exports.ChartAnalysisSession = ChartAnalysisSession;
	exports.NETWORK_ERROR = NETWORK_ERROR;
	exports.RATE_LIMITED_ERROR = RATE_LIMITED_ERROR;
	exports.SUBSCRIPTION_REQUIRED_ERROR = SUBSCRIPTION_REQUIRED_ERROR;

})(this.BX.BIConnector = this.BX.BIConnector || {}, BX, BX.UI.Notification, BX.UI.Analytics);
//# sourceMappingURL=chart-analysis.bundle.js.map
