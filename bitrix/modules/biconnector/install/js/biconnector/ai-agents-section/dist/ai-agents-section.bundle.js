/* eslint-disable */
this.BX = this.BX || {};
(function (exports, main_core, ui_buttons, ui_designTokens_air, ui_iconSet_api_core, ui_iconSet_outline, ui_infoHelper, ui_system_typography, biconnector_apacheSupersetAnalytics) {
	'use strict';

	const CardIcon = Object.freeze({
		prepare_report: ui_iconSet_api_core.Outline.RESUME,
		configure_dashboard: ui_iconSet_api_core.Outline.GRAPHS_DIAGRAM,
		work_with_datasets: ui_iconSet_api_core.Outline.DATABASE,
		describe_metrics: ui_iconSet_api_core.Outline.SPEED_METER,
		find_anomalies: ui_iconSet_api_core.Outline.SEARCH,
		explain_trends: ui_iconSet_api_core.Outline.TREND_UP,
		prepare_insights: ui_iconSet_api_core.Outline.IDEA_LAMP,
		test_hypotheses: ui_iconSet_api_core.Outline.QUESTION
	});

	const LaunchState = Object.freeze({
		CardPending: 'ai-agents-card-pending',
		RefusalTariff: 'ai-agents-refusal-tariff',
		RefusalUnavailable: 'ai-agents-refusal-unavailable',
		RefusalPreparing: 'ai-agents-refusal-preparing',
		LaunchStarting: 'ai-agents-launch-starting',
		LaunchStarted: 'ai-agents-launch-started',
		LaunchNoSurface: 'ai-agents-launch-no-surface',
		LaunchFailed: 'ai-agents-launch-failed',
		LaunchTimeout: 'ai-agents-launch-timeout',
		LaunchPanelFailed: 'ai-agents-launch-panel-failed'
	});
	const Availability = Object.freeze({
		Ready: 'ready',
		Tariff: 'tariff',
		Unavailable: 'unavailable',
		Preparing: 'preparing'
	});
	const Severity = Object.freeze({
		Notice: 'notice',
		Error: 'error'
	});
	const StatusAction = Object.freeze({
		None: 'none',
		Retry: 'ai-agents-launch-retry',
		ChatLink: 'ai-agents-launch-chat-link'
	});
	const REFUSAL_STATE = Object.freeze({
		[Availability.Tariff]: LaunchState.RefusalTariff,
		[Availability.Unavailable]: LaunchState.RefusalUnavailable,
		[Availability.Preparing]: LaunchState.RefusalPreparing
	});
	const PRESENTATION = Object.freeze({
		[LaunchState.RefusalTariff]: {
			phraseId: 'BICONNECTOR_AI_AGENTS_SECTION_REFUSAL_TARIFF',
			action: StatusAction.None,
			severity: Severity.Error
		},
		[LaunchState.RefusalUnavailable]: {
			phraseId: 'BICONNECTOR_AI_AGENTS_SECTION_REFUSAL_UNAVAILABLE',
			action: StatusAction.None,
			severity: Severity.Error
		},
		[LaunchState.RefusalPreparing]: {
			phraseId: 'BICONNECTOR_AI_AGENTS_SECTION_REFUSAL_PREPARING',
			action: StatusAction.None,
			severity: Severity.Error
		},
		[LaunchState.LaunchStarting]: {
			phraseId: 'BICONNECTOR_AI_AGENTS_SECTION_LAUNCH_STARTING',
			action: StatusAction.None,
			severity: Severity.Notice
		},
		[LaunchState.LaunchStarted]: {
			phraseId: 'BICONNECTOR_AI_AGENTS_SECTION_LAUNCH_STARTED',
			action: StatusAction.None,
			severity: Severity.Notice
		},
		[LaunchState.LaunchNoSurface]: {
			phraseId: 'BICONNECTOR_AI_AGENTS_SECTION_LAUNCH_NO_SURFACE',
			action: StatusAction.None,
			severity: Severity.Error
		},
		[LaunchState.LaunchFailed]: {
			phraseId: 'BICONNECTOR_AI_AGENTS_SECTION_LAUNCH_FAILED',
			action: StatusAction.Retry,
			severity: Severity.Error
		},
		[LaunchState.LaunchTimeout]: {
			phraseId: 'BICONNECTOR_AI_AGENTS_SECTION_LAUNCH_TIMEOUT',
			action: StatusAction.Retry,
			severity: Severity.Error
		},
		[LaunchState.LaunchPanelFailed]: {
			phraseId: 'BICONNECTOR_AI_AGENTS_SECTION_LAUNCH_PANEL_FAILED',
			action: StatusAction.ChatLink,
			severity: Severity.Error
		}
	});
	const resolveRefusalState = code => {
		return REFUSAL_STATE[code] ?? null;
	};
	const resolveErrorState = code => {
		return resolveRefusalState(code) ?? LaunchState.LaunchFailed;
	};
	const getStatusPresentation = state => {
		return PRESENTATION[state] ?? null;
	};

	const BACKDROP_PLAYING_CLASS = '--backdrop-playing';
	const BACKDROP_STILL_CLASS = '--backdrop-still';
	const MOTION_STOPPED_CLASS = '--motion-stopped';
	const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';
	const BACKDROP_WAIT = 8000;
	const Selector$1 = Object.freeze({
		MotionToggle: '[data-role="motion-toggle"]',
		BackdropVideo: '[data-role="backdrop-video"]',
		BackdropSource: '[data-role="backdrop-source"]'
	});
	const FOCUS_STOP = 'a[href], button, [tabindex]';
	class Backdrop {
		#container;
		#video = null;
		#observer = null;
		#waitId = 0;
		#isOnScreen = true;
		#motionQuery = null;
		#isReducedMotion = false;
		#motionToggle = null;
		#isMotionStopped = false;
		constructor(container) {
			this.#container = container;
		}
		start() {
			this.#watchReducedMotion();
			this.#startVideo();
			this.#startMotionToggle();
		}
		destroy() {
			main_core.Event.unbind(window, 'load', this.#attach);
			main_core.Event.unbind(document, 'visibilitychange', this.#sync);
			if (this.#motionQuery !== null) {
				main_core.Event.unbind(this.#motionQuery, 'change', this.#handleReducedMotion);
				this.#motionQuery = null;
			}
			if (this.#motionToggle !== null) {
				main_core.Event.unbind(this.#motionToggle, 'click', this.#toggleMotion);
				this.#motionToggle = null;
			}
			clearTimeout(this.#waitId);
			this.#observer?.disconnect();
			this.#observer = null;
			this.#video?.pause();
			this.#video = null;
		}
		#watchReducedMotion() {
			const query = window.matchMedia?.(REDUCED_MOTION_QUERY) ?? null;
			if (query === null) {
				return;
			}
			this.#isReducedMotion = query.matches;
			this.#motionQuery = query;
			main_core.Event.bind(query, 'change', this.#handleReducedMotion);
		}
		#handleReducedMotion = () => {
			this.#isReducedMotion = this.#motionQuery?.matches === true;
			if (this.#isReducedMotion) {
				main_core.Dom.removeClass(this.#container, BACKDROP_PLAYING_CLASS);
			}
			this.#sync();
		};
		#startVideo() {
			if (this.#isReducedMotion) {
				return;
			}
			const video = this.#container.querySelector(Selector$1.BackdropVideo);
			if (!main_core.Type.isElementNode(video) || Backdrop.#sources(video).length === 0) {
				return;
			}
			this.#video = video;
			main_core.Event.bindOnce(video, 'playing', () => {
				clearTimeout(this.#waitId);
				main_core.Dom.removeClass(this.#container, BACKDROP_STILL_CLASS);
				main_core.Dom.addClass(this.#container, BACKDROP_PLAYING_CLASS);
			});
			if (document.readyState === 'complete') {
				this.#attach();
				return;
			}
			main_core.Event.bindOnce(window, 'load', this.#attach);
		}
		#attach = () => {
			const video = this.#video;
			if (video === null) {
				return;
			}
			Backdrop.#sources(video).forEach(source => {
				main_core.Dom.attr(source, 'src', source.dataset.src ?? '');
			});
			video.load();
			main_core.Event.bindOnce(video, 'error', this.#stopWaiting);
			this.#waitId = setTimeout(this.#stopWaiting, BACKDROP_WAIT);
			if (this.#isMotionStopped) {
				video.pause();
			} else {
				void video.play().catch(this.#stopWaiting);
			}
			this.#watch(video);
		};
		static #sources(video) {
			const sources = [...video.querySelectorAll(Selector$1.BackdropSource)];
			return sources.filter(source => main_core.Type.isStringFilled(source.dataset.src));
		}
		#stopWaiting = () => {
			clearTimeout(this.#waitId);
			if (main_core.Dom.hasClass(this.#container, BACKDROP_PLAYING_CLASS)) {
				return;
			}
			this.#keepFocusOut();
			main_core.Dom.addClass(this.#container, BACKDROP_STILL_CLASS);
		};
		#keepFocusOut() {
			const toggle = this.#motionToggle;
			if (toggle === null || this.#isMotionStopped || !toggle.contains(document.activeElement)) {
				return;
			}
			const stops = [...this.#container.querySelectorAll(FOCUS_STOP)];
			stops[stops.indexOf(toggle) + 1]?.focus({
				preventScroll: true
			});
		}
		#watch(video) {
			main_core.Event.bind(document, 'visibilitychange', this.#sync);
			const backdrop = video.parentElement;
			if (!main_core.Type.isElementNode(backdrop) || !main_core.Type.isFunction(window.IntersectionObserver)) {
				return;
			}
			this.#observer = new IntersectionObserver(entries => {
				this.#isOnScreen = entries[entries.length - 1]?.isIntersecting === true;
				this.#sync();
			});
			this.#observer.observe(backdrop);
		}
		#sync = () => {
			const video = this.#video;
			if (video === null) {
				return;
			}
			if (this.#isOnScreen && !document.hidden && !this.#isMotionStopped && !this.#isReducedMotion) {
				void video.play().catch(() => {});
				return;
			}
			video.pause();
		};
		#startMotionToggle() {
			const toggle = this.#container.querySelector(Selector$1.MotionToggle);
			if (!main_core.Type.isElementNode(toggle)) {
				return;
			}
			this.#motionToggle = toggle;
			main_core.Event.bind(toggle, 'click', this.#toggleMotion);
		}
		#toggleMotion = () => {
			this.#isMotionStopped = !this.#isMotionStopped;
			if (this.#isMotionStopped) {
				main_core.Dom.addClass(this.#container, MOTION_STOPPED_CLASS);
			} else {
				main_core.Dom.removeClass(this.#container, MOTION_STOPPED_CLASS);
			}
			main_core.Dom.attr(this.#motionToggle, 'aria-pressed', this.#isMotionStopped ? 'true' : 'false');
			this.#sync();
		};
	}

	const TEMPLATE_CLASS = 'BX.Intranet.Bitrix24.Template';
	const PANEL_GETTER = 'getRightPanelAiChat';
	const EXPAND_EVENT = 'onExpand';
	const EXPAND_TIMEOUT = 3000;
	const PanelOutcome = Object.freeze({
		NoSurface: 'no_surface',
		Shown: 'shown',
		PanelFailed: 'panel_failed'
	});
	const isSurface = candidate => {
		if (!main_core.Type.isObject(candidate)) {
			return false;
		}
		const surface = candidate;
		return main_core.Type.isFunction(surface.isExpanded) && main_core.Type.isFunction(surface.preload) && main_core.Type.isFunction(surface.expand) && main_core.Type.isFunction(surface.subscribeOnce) && main_core.Type.isFunction(surface.unsubscribe);
	};
	const resolveSurface = () => {
		try {
			const template = main_core.Reflection.getClass(TEMPLATE_CLASS);
			if (!main_core.Type.isObject(template) || !main_core.Type.isFunction(template[PANEL_GETTER])) {
				return null;
			}
			const surface = template[PANEL_GETTER].call(template);
			return isSurface(surface) ? surface : null;
		} catch {
			return null;
		}
	};
	class RightPanel {
		#surface;
		#preloadPromise = null;
		constructor(surface = resolveSurface()) {
			this.#surface = surface;
		}
		hasSurface() {
			return this.#surface !== null;
		}
		preload() {
			if (this.#surface === null) {
				return;
			}
			try {
				this.#preloadPromise = Promise.resolve(this.#surface.preload());
			} catch (error) {
				this.#preloadPromise = Promise.reject(error);
			}
			this.#preloadPromise.catch(() => {});
		}
		async show(chatId) {
			const surface = this.#surface;
			if (surface === null) {
				return PanelOutcome.NoSurface;
			}
			try {
				if (surface.isExpanded()) {
					await this.#preloadPromise;
					if (surface.isExpanded()) {
						surface.expand({
							chatId
						});
						return PanelOutcome.Shown;
					}
				}
				return await this.#waitForExpand(surface, chatId);
			} catch {
				return PanelOutcome.PanelFailed;
			}
		}
		#waitForExpand(surface, chatId) {
			return new Promise(resolve => {
				let listener = null;
				let timeoutId = null;
				const finish = outcome => {
					if (timeoutId !== null) {
						clearTimeout(timeoutId);
						timeoutId = null;
					}
					if (listener !== null) {
						try {
							surface.unsubscribe(EXPAND_EVENT, listener);
						} catch {
						}
						listener = null;
					}
					resolve(outcome);
				};
				listener = () => {
					finish(PanelOutcome.Shown);
				};
				try {
					surface.subscribeOnce(EXPAND_EVENT, listener);
					timeoutId = setTimeout(() => {
						finish(PanelOutcome.PanelFailed);
					}, EXPAND_TIMEOUT);
					surface.expand({
						chatId
					});
				} catch {
					finish(PanelOutcome.PanelFailed);
				}
			});
		}
	}

	const mapResponseToAnswer = response => ({
		chatId: Number(response?.data?.chatId ?? 0),
		errorCode: '',
		limitCode: ''
	});
	const mapErrorToAnswer = error => {
		const serverError = error?.errors?.[0] ?? {};
		return {
			chatId: 0,
			errorCode: main_core.Type.isStringFilled(serverError.code) ? serverError.code : '',
			limitCode: serverError.customData?.limitCode ?? ''
		};
	};

	const LAUNCH_ACTION = 'biconnector.aiagentsscenario.launch';
	const LAUNCH_TIMEOUT = 10000;
	const TIMED_OUT = Symbol('timed-out');
	class ScenarioLaunch {
		launch(cardId) {
			const request = main_core.ajax.runAction(LAUNCH_ACTION, {
				data: {
					cardId
				}
			}).then(mapResponseToAnswer, mapErrorToAnswer);
			let timeoutId = 0;
			const timeout = new Promise(resolve => {
				timeoutId = setTimeout(() => {
					resolve(TIMED_OUT);
				}, LAUNCH_TIMEOUT);
			});
			return Promise.race([request, timeout]).finally(() => {
				clearTimeout(timeoutId);
			}).then(answer => answer === TIMED_OUT ? null : answer);
		}
	}

	const STATUS_CLASS = 'biconnector-ai-agents-status';
	const CARD_STATE_CLASS = 'biconnector-ai-agents-card-state';
	const CHAT_URL = '/online/?IM_DIALOG=chat';
	const Selector = Object.freeze({
		Card: '[data-role="card"]',
		CardIcon: '[data-role="card-icon"]',
		CardState: '[data-role="card-state"]',
		SectionStatus: '[data-role="section-status"]',
		SectionAlert: '[data-role="section-alert"]',
		SectionAction: '[data-role="section-action"]'
	});
	const ANALYTICS_CATEGORY = 'ai_agents';
	const ANALYTICS_SECTION = 'ai_agents_section';
	const ANALYTICS_EVENT = 'card_click';
	const AnalyticsType = Object.freeze({
		Available: 'available',
		LowTariff: 'low_tariff'
	});
	const getMessage = phraseId => {
		return main_core.Loc.getMessage(phraseId);
	};
	class AiAgentsSection {
		#container;
		#availability;
		#rightPanel;
		#backdrop;
		#launchService = new ScenarioLaunch();
		#cards = [];
		#statusNode = null;
		#alertNode = null;
		#actionNode = null;
		#pendingSlot = null;
		#isLaunching = false;
		#lastCard = null;
		constructor(container, params, rightPanel) {
			this.#container = container;
			this.#availability = params.availability;
			this.#rightPanel = rightPanel;
			this.#statusNode = container.querySelector(Selector.SectionStatus);
			this.#alertNode = container.querySelector(Selector.SectionAlert);
			this.#actionNode = container.querySelector(Selector.SectionAction);
			this.#cards = [...container.querySelectorAll(Selector.Card)];
			this.#backdrop = new Backdrop(container);
			this.#renderIcons(params.cardIds);
			this.#backdrop.start();
			main_core.Event.bind(this.#container, 'click', this.#handleClick);
		}
		static init(params, rightPanel = new RightPanel()) {
			const container = document.getElementById(params?.containerId ?? '');
			if (!main_core.Type.isElementNode(container) || !main_core.Type.isArrayFilled(params.cardIds)) {
				return null;
			}
			return new AiAgentsSection(container, params, rightPanel);
		}
		#renderIcons(cardIds) {
			const cards = new Map();
			this.#cards.forEach(card => {
				cards.set(card.dataset.cardId ?? '', card);
			});
			cardIds.forEach(cardId => {
				const icon = CardIcon[cardId];
				const slot = cards.get(cardId)?.querySelector(Selector.CardIcon) ?? null;
				if (!main_core.Type.isStringFilled(icon) || !main_core.Type.isElementNode(slot)) {
					return;
				}
				new ui_iconSet_api_core.Icon({
					icon
				}).renderTo(slot);
			});
		}
		destroy() {
			main_core.Event.unbind(this.#container, 'click', this.#handleClick);
			this.#backdrop.destroy();
		}
		#handleClick = event => {
			const target = event.target;
			const card = target?.closest(Selector.Card) ?? null;
			if (!main_core.Type.isElementNode(card) || this.#isLaunching) {
				return;
			}
			const cardId = card.dataset.cardId ?? '';
			if (!main_core.Type.isStringFilled(cardId)) {
				return;
			}
			this.#sendCardClick(cardId);
			void this.#launch(cardId, card);
		};
		async #launch(cardId, card) {
			const refusal = resolveRefusalState(this.#availability.state);
			if (refusal !== null) {
				this.#showStatus(refusal, this.#availability.limitCode ?? '');
				return;
			}
			if (!this.#rightPanel.hasSurface()) {
				this.#showStatus(LaunchState.LaunchNoSurface);
				return;
			}
			this.#startPending(card);
			try {
				this.#rightPanel.preload();
				const answer = await this.#launchService.launch(cardId);
				if (answer === null) {
					this.#showStatus(LaunchState.LaunchTimeout);
					return;
				}
				if (main_core.Type.isStringFilled(answer.errorCode) || answer.chatId <= 0) {
					this.#showStatus(resolveErrorState(answer.errorCode), answer.limitCode);
					return;
				}
				const outcome = await this.#rightPanel.show(answer.chatId);
				if (outcome !== PanelOutcome.Shown) {
					this.#showStatus(LaunchState.LaunchPanelFailed, '', answer.chatId);
					return;
				}
				this.#showStatus(LaunchState.LaunchStarted);
			} catch {
				this.#showStatus(LaunchState.LaunchFailed);
			} finally {
				this.#stopPending();
			}
		}
		#startPending(card) {
			this.#isLaunching = true;
			this.#lastCard = card;
			this.#tellLaunching(card);
			this.#showStatus(LaunchState.LaunchStarting);
			const slot = card.querySelector(Selector.CardState);
			if (!main_core.Type.isElementNode(slot)) {
				return;
			}
			main_core.Dom.append(main_core.Tag.render`
				<span class="${CARD_STATE_CLASS}" data-testid="${LaunchState.CardPending}">
					${ui_system_typography.Text.render(getMessage('BICONNECTOR_AI_AGENTS_SECTION_CARD_PENDING'), {
			size: 'sm'
		})}
				</span>
			`, slot);
			this.#pendingSlot = slot;
		}
		#stopPending() {
			this.#isLaunching = false;
			this.#tellLaunching(null);
			this.#dropStartingNotice();
			if (this.#pendingSlot === null) {
				return;
			}
			main_core.Dom.clean(this.#pendingSlot);
			this.#pendingSlot = null;
		}
		#dropStartingNotice() {
			const notice = this.#statusNode?.querySelector(`[data-testid="${LaunchState.LaunchStarting}"]`) ?? null;
			if (notice !== null) {
				main_core.Dom.remove(notice);
			}
		}
		#tellLaunching(card) {
			this.#cards.forEach(item => {
				main_core.Dom.attr(item, 'aria-disabled', card === null ? null : 'true');
				main_core.Dom.attr(item, 'aria-busy', item === card ? 'true' : null);
			});
		}
		#showStatus(state, limitCode = '', chatId = 0) {
			const presentation = getStatusPresentation(state);
			if (presentation === null) {
				return;
			}
			const region = presentation.severity === Severity.Error ? this.#alertNode ?? this.#statusNode : this.#statusNode;
			if (region === null) {
				return;
			}
			this.#clearStatus();
			const status = main_core.Tag.render`
			<div class="${STATUS_CLASS}" data-testid="${state}">
				${ui_system_typography.Text.render(getMessage(presentation.phraseId), {
			size: 'md',
			className: `${STATUS_CLASS}__text`
		})}
			</div>
		`;
			main_core.Dom.append(status, region);
			this.#showAction(presentation.action, chatId, region);
			if (state === LaunchState.RefusalTariff && main_core.Type.isStringFilled(limitCode)) {
				new ui_infoHelper.FeaturePromoter({
					code: limitCode
				}).show();
			}
		}
		#showAction(action, chatId, region) {
			const node = this.#renderAction(action, chatId);
			if (node === null) {
				return;
			}
			main_core.Dom.append(node, this.#actionNode ?? region);
		}
		#renderAction(action, chatId) {
			if (action === StatusAction.Retry) {
				return this.#renderRetry();
			}
			if (action === StatusAction.ChatLink && chatId > 0) {
				return main_core.Tag.render`
				<a
					class="${STATUS_CLASS}__link"
					data-testid="${StatusAction.ChatLink}"
					href="${CHAT_URL}${chatId}"
				>${getMessage('BICONNECTOR_AI_AGENTS_SECTION_LAUNCH_CHAT_LINK')}</a>
			`;
			}
			return null;
		}
		#renderRetry() {
			const options = {
				text: getMessage('BICONNECTOR_AI_AGENTS_SECTION_LAUNCH_RETRY'),
				style: ui_buttons.AirButtonStyle.OUTLINE_ACCENT_1,
				size: ui_buttons.ButtonSize.SMALL,
				useAirDesign: true,
				onclick: () => {
					this.#retry();
					return {};
				}
			};
			const button = new ui_buttons.Button(options);
			const node = button.render();
			main_core.Dom.attr(node, 'data-testid', StatusAction.Retry);
			return node;
		}
		#retry() {
			const card = this.#lastCard;
			if (card === null || this.#isLaunching) {
				return;
			}
			const cardId = card.dataset.cardId ?? '';
			if (!main_core.Type.isStringFilled(cardId)) {
				return;
			}
			this.#sendCardClick(cardId);
			void this.#launch(cardId, card);
		}
		#clearStatus() {
			[this.#statusNode, this.#alertNode, this.#actionNode].forEach(region => {
				if (region === null) {
					return;
				}
				this.#keepFocusOut(region);
				main_core.Dom.clean(region);
			});
		}
		#keepFocusOut(region) {
			if (!region.contains(document.activeElement)) {
				return;
			}
			(this.#lastCard ?? region).focus();
		}
		#sendCardClick(cardId) {
			const data = {
				c_section: ANALYTICS_SECTION,
				c_element: cardId,
				type: this.#availability.state === Availability.Tariff ? AnalyticsType.LowTariff : AnalyticsType.Available
			};
			biconnector_apacheSupersetAnalytics.ApacheSupersetAnalytics.sendAnalytics(ANALYTICS_CATEGORY, ANALYTICS_EVENT, data);
		}
	}

	exports.AiAgentsSection = AiAgentsSection;
	exports.Availability = Availability;
	exports.CardIcon = CardIcon;
	exports.LaunchState = LaunchState;
	exports.PanelOutcome = PanelOutcome;
	exports.RightPanel = RightPanel;
	exports.StatusAction = StatusAction;

})(this.BX.BIConnector = this.BX.BIConnector || {}, BX, BX.UI, window, BX.UI.IconSet, window, BX.UI, BX.UI.System.Typography, BX.BIConnector);
//# sourceMappingURL=ai-agents-section.bundle.js.map
