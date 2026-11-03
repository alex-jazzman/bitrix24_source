import { Event, Loc, Runtime, Text, Type } from 'main.core';
import { Center as NotificationCenter } from 'ui.notification';

import { analytics as defaultAnalytics, type ChartAnalysisAnalytics } from './analytics';

import {
	api as defaultApi,
	type LaunchError,
	type LaunchRequest,
	type LaunchResult,
	RATE_LIMITED_ERROR,
	SUBSCRIPTION_REQUIRED_ERROR,
} from './api';
import { ReplyWatcher, type SubscribeToChatMessages, subscribeToChatMessages } from './reply-watcher';
import { getLineText, renderStub as defaultRenderStub, type StubOptions, type StubState } from './stub';
import {
	type BxAiConfig,
	type BxAiConfigResult,
	type BxAiMode,
	type BxAiState,
	type BxCard,
	type BxChartAnalyze,
	type BxChartAnalyzeStart,
	type ChartAnalysisConfig,
} from './types';

const CONTRACT_VERSION = 4;
const CONFIG_TIMEOUT_MS = 3000;
// Same as the frame's own busy auto-release (CONTRACT §9).
const ANALYZE_TIMEOUT_MS = 30000;
// The frame's own `timeout` is a reason of the previous period (CONTRACT §7): the host's one is told apart.
const ANALYZE_TIMEOUT_REASON = 'host_timeout';
// Busy is repeated more often than the frame's own auto-release, so it holds until the answer.
const BUSY_HEARTBEAT_MS = 15000;
// Counted from the start of the launch request: the request itself has no deadline of its own (CONTRACT §9).
const REPLY_TIMEOUT_MS = 120_000;
const START_METHOD = 'bxChartAnalyzeStart';
const ANALYZE_METHOD = 'bxChartAnalyze';

export type ChartAnalysisLoader = {
	defineFrameMethod: (name: string, executor: (args: unknown) => unknown) => void;
	setBxAiConfig: (config: BxAiConfig, signal?: AbortSignal) => Promise<BxAiConfigResult>;
	setBxAiState: (state: BxAiState) => Promise<void>;
};

export type ChartAnalysisLauncher = {
	open: () => void;
	openDialog: (chatId: number) => Promise<void>;
	showStub: (content: HTMLElement) => void;
	hideStub: () => void;
};

export type SessionDependencies = {
	api: { launch: (request: LaunchRequest) => Promise<LaunchResult> };
	renderStub: (state: StubState, card: BxCard, options?: StubOptions) => HTMLElement;
	openPromoter: (code: string) => void;
	notify: (message: string) => void;
	analytics: ChartAnalysisAnalytics;
	subscribeToChatMessages: SubscribeToChatMessages;
	configTimeoutMs: number;
	analyzeTimeoutMs: number;
	heartbeatMs: number;
	replyTimeoutMs: number;
};

export type AttachOptions = {
	loader: ChartAnalysisLoader;
	launcher: ChartAnalysisLauncher;
	config: ChartAnalysisConfig;
	dependencies?: Partial<SessionDependencies>;
};

type InfoHelperExports = {
	InfoHelper: { show: (code: string) => void };
};

const defaultDependencies: SessionDependencies = {
	api: defaultApi,
	renderStub: (state, card, options) => defaultRenderStub(state, card, options),
	openPromoter: (code) => {
		const loading = Runtime.loadExtension('ui.info-helper') as unknown as Promise<InfoHelperExports>;
		void loading.then(({ InfoHelper }) => InfoHelper.show(code));
	},
	notify: (message) => NotificationCenter.notify({ content: Text.encode(message) }),
	analytics: defaultAnalytics,
	subscribeToChatMessages,
	configTimeoutMs: CONFIG_TIMEOUT_MS,
	analyzeTimeoutMs: ANALYZE_TIMEOUT_MS,
	heartbeatMs: BUSY_HEARTBEAT_MS,
	replyTimeoutMs: REPLY_TIMEOUT_MS,
};

export class ChartAnalysisSession
{
	#loader: ChartAnalysisLoader;
	#launcher: ChartAnalysisLauncher;
	#config: ChartAnalysisConfig;
	#dependencies: SessionDependencies;
	#mode: BxAiMode;
	#currentRequestId: string | null = null;
	#launchedRequestId: string | null = null;
	#isDestroyed: boolean = false;
	#analyzeTimerId: ReturnType<typeof setTimeout> | null = null;
	#isStubShown: boolean = false;
	#replyWatcher: ReplyWatcher | null = null;
	#replyRequestId: string | null = null;
	#heartbeatId: ReturnType<typeof setInterval> | null = null;
	#replyTimerId: ReturnType<typeof setTimeout> | null = null;
	// Kept in memory only: a page reload or a new session starts a new chat.
	#chatId: number | null = null;

	constructor(options: AttachOptions)
	{
		this.#loader = options.loader;
		this.#launcher = options.launcher;
		this.#config = options.config;
		this.#dependencies = { ...defaultDependencies, ...options.dependencies };
		this.#mode = options.config.state === 'subscription_required' ? 'notify' : 'analyze';
	}

	async connect(): Promise<boolean>
	{
		// Superset drops emits to undefined methods, so handlers must exist before icons are enabled.
		this.#loader.defineFrameMethod(START_METHOD, (event) => this.#onStart(event as BxChartAnalyzeStart));
		this.#loader.defineFrameMethod(ANALYZE_METHOD, (event) => this.#onAnalyze(event as BxChartAnalyze));

		const result = await this.#applyConfig();

		return result?.applied === true
			&& Type.isArray(result.supportedVersions)
			&& result.supportedVersions.includes(CONTRACT_VERSION)
		;
	}

	destroy(): void
	{
		this.#isDestroyed = true;
		this.#currentRequestId = null;
		this.#launchedRequestId = null;
		this.#chatId = null;
		this.#clearAnalyzeTimeout();
		this.#stopReplyWait();

		if (this.#isStubShown)
		{
			this.#hideStub();
		}
	}

	async #applyConfig(): Promise<BxAiConfigResult | null>
	{
		const controller = new AbortController();
		const timeout = new Promise<null>((resolve) => {
			Event.bind(controller.signal, 'abort', () => resolve(null), { once: true });
		});
		const timerId = setTimeout(() => controller.abort(), this.#dependencies.configTimeoutMs);

		let result: BxAiConfigResult | null = null;
		try
		{
			result = await Promise.race([
				this.#loader.setBxAiConfig(this.#buildConfig(), controller.signal),
				timeout,
			]);
		}
		catch (error)
		{
			this.#disableFrame();

			throw error;
		}
		finally
		{
			clearTimeout(timerId);
		}

		if (result === null)
		{
			this.#disableFrame();
		}

		return result;
	}

	/**
	 * A late answer of the frame must not enable icons without a live session (CONTRACT §11).
	 * The frame may not answer at all, so the call is not awaited.
	 */
	#disableFrame(): void
	{
		Promise.resolve()
			.then(() => this.#loader.setBxAiConfig({ ...this.#buildConfig(), enabled: false }))
			.catch(() => {})
		;
	}

	#buildConfig(): BxAiConfig
	{
		const replacements = { '#BITRIXGPT_NAME#': this.#config.bitrixGptName };

		return {
			version: CONTRACT_VERSION,
			enabled: true,
			mode: this.#mode,
			labels: {
				action: Loc.getMessage('BICONNECTOR_CHART_ANALYSIS_ACTION', replacements) ?? '',
				unavailable: Loc.getMessage('BICONNECTOR_CHART_ANALYSIS_UNAVAILABLE', replacements) ?? '',
				busy: Loc.getMessage('BICONNECTOR_CHART_ANALYSIS_BUSY', replacements) ?? '',
			},
		};
	}

	/**
	 * An event of an unknown version is not handled, but its busy is released (CONTRACT §11).
	 */
	#isActual(event: { version?: unknown, requestId?: unknown } | null | undefined): boolean
	{
		if (this.#isDestroyed)
		{
			return false;
		}

		if (event?.version === CONTRACT_VERSION)
		{
			return true;
		}

		const requestId = event?.requestId;
		if (Type.isStringFilled(requestId))
		{
			this.#release(requestId as string);
		}

		return false;
	}

	#onStart(event: BxChartAnalyzeStart): void
	{
		if (!this.#isActual(event) || !Type.isStringFilled(event.requestId))
		{
			return;
		}

		if (this.#mode === 'notify')
		{
			this.#openPromoter(this.#config.promoterCode, event.card);

			return;
		}

		this.#dependencies.analytics.send('click', { vizType: event.card?.vizType });
		this.#stopReplyWait();
		this.#currentRequestId = event.requestId;
		this.#setBusy(event.requestId);
		this.#launcher.open();
		this.#hideStaleStub();
		this.#startAnalyzeTimeout(event);
	}

	#startAnalyzeTimeout(event: BxChartAnalyzeStart): void
	{
		this.#clearAnalyzeTimeout();
		this.#analyzeTimerId = setTimeout(() => {
			this.#analyzeTimerId = null;
			if (!this.#isCurrent(event.requestId))
			{
				return;
			}

			// A late bxChartAnalyze of this request no longer matches and is dropped.
			this.#currentRequestId = null;
			this.#dependencies.analytics.send('analyze_error', {
				vizType: event.card?.vizType,
				status: ANALYZE_TIMEOUT_REASON,
			});
			this.#showFailure('error', event.card, {
				message: Loc.getMessage('BICONNECTOR_CHART_ANALYSIS_ANALYZE_ERROR') ?? '',
			});
			this.#release(event.requestId);
		}, this.#dependencies.analyzeTimeoutMs);
	}

	#clearAnalyzeTimeout(): void
	{
		if (this.#analyzeTimerId !== null)
		{
			clearTimeout(this.#analyzeTimerId);
			this.#analyzeTimerId = null;
		}
	}

	#onAnalyze(event: BxChartAnalyze): void
	{
		if (
			!this.#isActual(event)
			|| event.requestId !== this.#currentRequestId
			|| event.requestId === this.#launchedRequestId
		)
		{
			return;
		}

		this.#clearAnalyzeTimeout();
		const vizType = event.card?.vizType;
		if (event.status === 'ok')
		{
			// The frame may emit the same result twice; only #retry may relaunch an accepted request.
			this.#launchedRequestId = event.requestId;
			this.#dependencies.analytics.sendPreviousStatus(event.previousStatus, vizType);
			void this.#launch(event);

			return;
		}

		if (event.status === 'no_data' || event.status === 'too_large')
		{
			this.#dependencies.analytics.send(event.status, { vizType });
			this.#showFailure(event.status, event.card);
		}
		else
		{
			this.#dependencies.analytics.send('analyze_error', { vizType, status: event.reason });
			this.#showFailure('error', event.card, {
				message: Loc.getMessage('BICONNECTOR_CHART_ANALYSIS_ANALYZE_ERROR') ?? '',
			});
		}

		this.#release(event.requestId);
	}

	async #launch(snapshot: BxChartAnalyze): Promise<void>
	{
		const { requestId, card, previousStatus, data } = snapshot;

		const request: LaunchRequest = { dashboardId: this.#config.dashboardId, requestId, card, previousStatus, data };
		const previousChatId = this.#chatId;
		if (previousChatId !== null)
		{
			request.chatId = previousChatId;
		}

		// Subscribed before the launch: the answer may come before the launch request returns.
		// The reply deadline starts here too, so a launch request that hangs still releases busy.
		this.#startReplyWait(requestId);

		let result: LaunchResult | null = null;
		try
		{
			result = await this.#dependencies.api.launch(request);
		}
		catch (error)
		{
			if (this.#isCurrent(requestId))
			{
				this.#handleRefusal(error as LaunchError, snapshot);
				this.#finishReplyWait(requestId);
			}

			return;
		}

		if (!this.#isCurrent(requestId))
		{
			return;
		}

		this.#chatId = result.chatId;
		this.#expectReply(requestId, result.chatId, result.botId);

		try
		{
			await this.#launcher.openDialog(result.chatId);
			// openDialog removes the stub itself.
			this.#isStubShown = false;
		}
		catch
		{
			if (this.#isCurrent(requestId))
			{
				this.#showFailure('error', card, {
					message: Loc.getMessage('BICONNECTOR_CHART_ANALYSIS_ANALYZE_ERROR') ?? '',
				}, previousChatId !== null);
				this.#finishReplyWait(requestId);
			}
		}
	}

	#startReplyWait(requestId: string): void
	{
		this.#stopReplyWait();
		this.#replyRequestId = requestId;
		this.#replyWatcher = new ReplyWatcher(
			this.#dependencies.subscribeToChatMessages,
			() => this.#finishReplyWait(requestId),
		);
		// The launch re-arms the frame's own auto-release at once: collecting data may have taken most of it.
		this.#setBusy(requestId);
		this.#heartbeatId = setInterval(() => this.#setBusy(requestId), this.#dependencies.heartbeatMs);
		this.#replyTimerId = setTimeout(() => this.#finishReplyWait(requestId), this.#dependencies.replyTimeoutMs);
	}

	#expectReply(requestId: string, chatId: number, botId: number): void
	{
		if (this.#replyRequestId !== requestId)
		{
			return;
		}

		// A reply that came before the launch answer finishes the wait right here.
		this.#replyWatcher?.expect(chatId, botId);
	}

	#finishReplyWait(requestId: string): void
	{
		if (this.#replyRequestId !== requestId)
		{
			return;
		}

		this.#stopReplyWait();
		this.#release(requestId);
	}

	#stopReplyWait(): void
	{
		const watcher = this.#replyWatcher;
		this.#replyWatcher = null;
		this.#replyRequestId = null;

		if (this.#heartbeatId !== null)
		{
			clearInterval(this.#heartbeatId);
			this.#heartbeatId = null;
		}

		if (this.#replyTimerId !== null)
		{
			clearTimeout(this.#replyTimerId);
			this.#replyTimerId = null;
		}

		watcher?.stop();
	}

	#handleRefusal(error: LaunchError, snapshot: BxChartAnalyze): void
	{
		if (error?.code === SUBSCRIPTION_REQUIRED_ERROR)
		{
			this.#hideStub();
			this.#openPromoter(error.promoterCode ?? this.#config.promoterCode, snapshot.card);

			return;
		}

		this.#dependencies.analytics.send('launch_error', { vizType: snapshot.card?.vizType, status: error?.code });

		const options: StubOptions = { message: Type.isStringFilled(error?.message) ? error.message : '' };
		// The limit will not pass within a minute: a retry button would only repeat the refusal.
		if (error?.code !== RATE_LIMITED_ERROR)
		{
			options.onRetry = () => this.#retry(snapshot);
		}

		this.#showFailure('error', snapshot.card, options);
	}

	#retry(snapshot: BxChartAnalyze): void
	{
		if (!this.#isCurrent(snapshot.requestId))
		{
			return;
		}

		this.#setBusy(snapshot.requestId);
		this.#hideStaleStub();
		void this.#launch(snapshot);
	}

	#isCurrent(requestId: string): boolean
	{
		return !this.#isDestroyed && this.#currentRequestId === requestId;
	}

	// No loading stub: a fast answer would flash it as a blank panel. Busy on the dashboard is the progress.
	#hideStaleStub(): void
	{
		if (this.#isStubShown)
		{
			this.#hideStub();
		}
	}

	#showFailure(
		state: StubState,
		card: BxCard,
		options: StubOptions = {},
		isChatShown: boolean = this.#chatId !== null,
	): void
	{
		if (!isChatShown)
		{
			this.#showStub(state, card, options);

			return;
		}

		// A stub would cover the whole chat the user is reading: the failure is reported over it instead.
		if (this.#isStubShown)
		{
			this.#hideStub();
		}

		this.#dependencies.notify(getLineText(state, { message: options.message }));
	}

	#showStub(state: StubState, card: BxCard, options?: StubOptions): void
	{
		this.#launcher.showStub(this.#dependencies.renderStub(state, card, options));
		this.#isStubShown = true;
	}

	#hideStub(): void
	{
		this.#launcher.hideStub();
		this.#isStubShown = false;
	}

	#openPromoter(code: string | null | undefined, card: BxCard | undefined): void
	{
		if (Type.isStringFilled(code))
		{
			this.#dependencies.analytics.send('subscription_open', { vizType: card?.vizType });
			this.#dependencies.openPromoter(code);
		}
	}

	#setBusy(requestId: string): void
	{
		void this.#loader.setBxAiState({ version: CONTRACT_VERSION, busyRequestId: requestId });
	}

	#release(requestId: string): void
	{
		void this.#loader.setBxAiState({ version: CONTRACT_VERSION, busyRequestId: null, doneRequestId: requestId });
	}
}

export const ChartAnalysis = {
	async attach(options: AttachOptions): Promise<ChartAnalysisSession | null>
	{
		const session = new ChartAnalysisSession(options);

		try
		{
			if (await session.connect())
			{
				return session;
			}
		}
		catch
		{
			// The frame refused or lost the channel: the dashboard works without chart analysis.
		}

		session.destroy();

		return null;
	},
};
