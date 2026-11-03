import { Dom, Event, Loc, Runtime, Text, Tag, Type } from 'main.core';
import { EventEmitter, type BaseEvent } from 'main.core.events';
import type { MenuItemOptions } from 'main.popup';
import { Menu } from 'main.popup';
import { Loader } from 'main.loader';
import { DateTimeFormat } from 'main.date';
import type { ChartAnalysisConfig, DetailConfig } from './type/detail-config';
import type { FilterOptions } from './type/filter-options';
import type { DashboardEmbeddedParameters } from './type/dashboard-embedded-parameters';
import { DashboardManager } from 'biconnector.apache-superset-dashboard-manager';
import { ApacheSupersetEmbeddedLoader } from 'biconnector.apache-superset-embedded-loader';
import { ApacheSupersetAnalytics } from 'biconnector.apache-superset-analytics';
import { ApacheSupersetFeedbackForm } from 'biconnector.apache-superset-feedback-form';
import { ChatSelector } from './chat-selector';
import { AhaMoment } from 'biconnector.aha-moment';
import { SharePopup } from 'biconnector.share-popup';
import { AiDigestSetup, type ScreenStateBridge } from 'biconnector.ai-digest-setup';
import 'sidepanel';
import 'ui.icon-set.outline';

const EMBED_TIMEOUT = 20000;
const COMPACT_HEADER_CLASS = 'dashboard-header--compact';
const MEASURING_HEADER_CLASS = 'dashboard-header--measuring';
const HEADER_FIT_SAFETY = 8;

type DigestSetupAvailability = {
	state: 'ready' | 'subscription_required' | 'hidden',
	promoterCode?: string,
};

type DigestSetupConfig = {
	dashboardId: number,
	availability: DigestSetupAvailability,
};

const ONBOARDING_EXTENSION = 'biconnector.dashboard-onboarding';
// Mirrors OnboardingMode.None of the onboarding extension, which is not loaded to read it.
const ONBOARDING_MODE_NONE = 'none';

const EMBED_READY_EVENT = 'biconnector:dashboard-embed-ready';
const EMBED_ERROR_EVENT = 'biconnector:dashboard-embed-error';
const SHARE_SETTING_CHANGE_EVENT = 'BIConnector.ShareSetting:onChange';

export class DetailInstance
{
	#dashboardManager: DashboardManager;
	#dashboardNode: HTMLElement;
	#frameNode: HTMLElement;

	#embeddedParams: DashboardEmbeddedParameters;
	#embeddedLoader: ApacheSupersetEmbeddedLoader;
	#embeddedBridge: ?ScreenStateBridge = null;
	#embeddedDebugMode: boolean;
	#isEmbedReady: boolean = false;
	#embedAttempt: number = 0;
	#canExport: boolean;
	#canEdit: boolean;
	#lockWarningDismissed: boolean = false;
	#canShare: boolean;
	#shareData: ?Object;
	#isShareBanned: boolean;
	#shareMenu: ?Menu;
	#digestSetup: ?DigestSetupConfig;
	#chartAnalysisConfig: ?ChartAnalysisConfig;
	#chartAnalysisSession: ?{ destroy: () => void } = null;

	#moreMenu: Menu;
	#infoAhaMoment: ?AhaMoment;
	#infoAhaMomentOptions: ?Object;
	#dashboardSavedEventName: string;
	#onDashboardSavedHandler: Function;
	#onShareSettingChangeHandler: Function;
	#sharePopup: ?SharePopup;
	#dashboardOnboardingConfig: ?Object;
	#dashboardOnboarding: ?Object;
	#dashboardOnboardingPromise: ?Promise<?Object>;
	#agentConnection: ?Object;
	#agentConnectionLoadPromise: ?Promise<?Object> = null;

	#compactHintAbort: ?AbortController;

	#headerNode: ?HTMLElement;
	#headerTitleText: ?HTMLElement;
	#headerButtons: ?HTMLElement;
	#headerChromeWidth: number = 0;
	#buttonsExpandedWidth: number = 0;
	#headerResizeObserver: ?ResizeObserver;
	#headerTitleObserver: ?MutationObserver;

	constructor(config: DetailConfig & { digestSetup?: ?DigestSetupConfig })
	{
		this.#dashboardNode = document.getElementById(config.appNodeId);
		if (!Type.isDomNode(this.#dashboardNode))
		{
			const errorMsg = `Cannot init superset dashboard. Node with ID ${config.appNodeId} does not exists`;
			throw new Error(errorMsg);
		}
		this.#dashboardManager = new DashboardManager();
		this.#canExport = config.canExport === 'Y';
		this.#canEdit = config.canEdit === 'Y';
		this.#canShare = config.canShare === 'Y';
		this.#shareData = config.shareData ?? null;
		this.#isShareBanned = config.isShareBanned === 'Y';
		this.#digestSetup = config.digestSetup ?? null;
		this.#chartAnalysisConfig = config.chartAnalysis ?? null;
		this.#embeddedParams = config.dashboardEmbeddedParams;
		this.#embeddedDebugMode = config.embeddedDebugMode;
		this.#infoAhaMomentOptions = config.infoAhaMoment ?? null;
		this.#dashboardSavedEventName = 'BIConnector.CreateForm:onDashboardSaved';
		this.#onDashboardSavedHandler = this.#onDashboardSaved.bind(this);
		this.#onShareSettingChangeHandler = this.#onShareSettingChange.bind(this);

		this.#frameNode = this.#dashboardNode.querySelector('.dashboard-iframe');
		this.#dashboardOnboardingConfig = Type.isPlainObject(config.dashboardOnboarding)
			? config.dashboardOnboarding
			: null
		;
		this.#subscribeEvents();
		this.#initHeaderButtons();
		this.#initAgentConnection(config);

		if (!BX.BIConnector.LimitLockPopup)
		{
			this.#initFrame(this.#embeddedParams);
		}

		ApacheSupersetAnalytics.sendAnalytics('view', 'report_view', {
			c_element: config.analyticSource,
			status: 'success',
			type: this.#embeddedParams.type.toLowerCase(),
			p1: ApacheSupersetAnalytics.buildAppIdForAnalyticRequest(this.#embeddedParams.appId),
			p2: this.#embeddedParams.id,
			...(config.analyticScope && { p3: ApacheSupersetAnalytics.buildScopeForAnalyticRequest(config.analyticScope) }),
			p4: this.#embeddedParams.isUseExternalDatasets ?? false,
		});
	}

	#subscribeEvents()
	{
		const eventBus = this.#getEventBus();
		if (Type.isFunction(eventBus?.unsubscribe))
		{
			eventBus.unsubscribe(this.#dashboardSavedEventName, this.#onDashboardSavedHandler);
			eventBus.unsubscribe(SHARE_SETTING_CHANGE_EVENT, this.#onShareSettingChangeHandler);
		}

		if (Type.isFunction(eventBus?.subscribe))
		{
			eventBus.subscribe(this.#dashboardSavedEventName, this.#onDashboardSavedHandler);
			eventBus.subscribe(SHARE_SETTING_CHANGE_EVENT, this.#onShareSettingChangeHandler);
		}

		EventEmitter.subscribe('BiConnector:DashboardSelector.onSelect', (event) => {
			this.#embeddedBridge = null;
			Dom.clean(this.#frameNode);
			BX.BIConnector.ApacheSuperset.Dashboard.Detail.createSkeleton({
				container: this.#frameNode,
				status: DashboardManager.DASHBOARD_STATUS_LOAD,
			});
		});

		EventEmitter.subscribe('BiConnector:DashboardSelector.onSelectDataLoaded', (event) => {
			Dom.clean(this.#frameNode);
			// The onboarding is decided per page load for one certain report: its steps and
			// rights come from the server config of that report. The selector replaces the
			// report without a reload, so the orchestrator is dropped instead of being reused -
			// otherwise the tour would keep pointing at the previous report and the menu would
			// offer to replay it. The next page load decides the onboarding anew.
			this.#dashboardOnboarding?.destroy();
			this.#dashboardOnboarding = null;
			this.#dashboardOnboardingConfig = null;
			this.#dashboardOnboardingPromise = null;
			this.#embeddedParams = event.data.credentials;
			this.#canEdit = this.#embeddedParams.canEdit;
			this.#canExport = this.#embeddedParams.canExport;
			this.#updateTitle(this.#embeddedParams.title);
			this.#canShare = this.#embeddedParams.canShare ?? false;
			this.#shareData = this.#embeddedParams.shareData ?? null;
			this.#isShareBanned = this.#embeddedParams.isShareBanned === true;
			this.#sharePopup = null;

			let historyUrl = this.#embeddedParams.embeddedUrl;
			this.#initFrame(this.#embeddedParams);

			ApacheSupersetAnalytics.sendAnalytics('view', 'report_view', {
				c_element: 'selector',
				status: 'success',
				type: this.#embeddedParams.type.toLowerCase(),
				p1: ApacheSupersetAnalytics.buildAppIdForAnalyticRequest(this.#embeddedParams.appId),
				p2: this.#embeddedParams.id,
				p4: this.#embeddedParams.isUseExternalDatasets ?? false,
			});

			top.window.history.pushState(null, '', historyUrl);
			this.#initHeaderButtons();
		});

		EventEmitter.subscribe('BiConnector:LimitPopup.Warning.onClose', (event) => {
			this.#lockWarningDismissed = true;
			this.#initFrame(this.#embeddedParams);
			this.#initHeaderButtons();
		});

		EventEmitter.subscribe('BX.BIConnector.Settings:onAfterSave', () => {
			this.#reloadGridAfterSliderClose();
		});

		EventEmitter.subscribe('BIConnector.SharePopup:onShareActivated', (event) => {
			if (event.data.dashboardId === this.#embeddedParams.id)
			{
				this.#shareData = {
					...this.#shareData,
					isActive: true,
				};
			}
		});

		EventEmitter.subscribe('BIConnector.SharePopup:onShareDeactivated', (event) => {
			if (event.data.dashboardId === this.#embeddedParams.id)
			{
				this.#shareData = {
					...this.#shareData,
					isActive: false,
				};
			}
		});

		Event.bind(window, 'message', this.#postOptionsForFilter.bind(this));
		Event.bind(window, 'unload', this.#onWindowUnload.bind(this));
	}

	#getEventBus(): Object
	{
		return window.top?.BX?.Event?.EventEmitter ?? EventEmitter;
	}

	#onWindowUnload(): void
	{
		const eventBus = this.#getEventBus();
		if (Type.isFunction(eventBus?.unsubscribe))
		{
			eventBus.unsubscribe(this.#dashboardSavedEventName, this.#onDashboardSavedHandler);
			eventBus.unsubscribe(SHARE_SETTING_CHANGE_EVENT, this.#onShareSettingChangeHandler);
		}
	}

	#onDashboardSaved(event: Object): void
	{
		const rawData = event && Type.isFunction(event.getData) ? event.getData() : null;
		const data = Array.isArray(rawData) ? rawData[0] : rawData;
		const dashboardId = Text.toNumber(data?.dashboard?.id);
		const title = data?.dashboard?.title;
		const isEditMode = data?.isEditMode === true;

		if (!isEditMode || dashboardId <= 0 || dashboardId !== this.#embeddedParams.id || !Type.isStringFilled(title))
		{
			return;
		}

		this.#updateTitle(title);
	}

	#updateTitle(title: string): void
	{
		this.#embeddedParams = {
			...this.#embeddedParams,
			title,
		};

		BX.ajax?.UpdatePageTitle?.(title);
		BX.ajax?.UpdateWindowTitle?.(title);

		const titleNode = this.#dashboardNode.querySelector('#dashboard-selector-text');
		if (Type.isDomNode(titleNode))
		{
			titleNode.textContent = title;
			titleNode.setAttribute('title', title);
		}
	}

	/**
	 * Readable embedding state for subscribers appearing after the event: events are not buffered.
	 */
	isEmbedReady(): boolean
	{
		return this.#isEmbedReady;
	}

	/**
	 * The report card hint is older than any announcement and keeps the surface to itself.
	 */
	isInfoHintShown(): boolean
	{
		return this.#infoAhaMoment?.isShown === true;
	}

	#initFrame(embeddedParams: DashboardEmbeddedParameters)
	{
		// selecting another report re-runs the embedding, so the state starts over
		this.#isEmbedReady = false;
		// A hung attempt keeps running after another report replaces it, so every attempt is
		// numbered: only the current one is allowed to touch the frame and the ready state.
		const attempt = ++this.#embedAttempt;
		this.#embeddedBridge = null;
		this.#destroyChartAnalysis();

		if (!embeddedParams.uuid || !embeddedParams.supersetDomain)
		{
			BX.BIConnector.ApacheSuperset.Dashboard.Detail.createSkeleton({
				container: this.#frameNode,
				supersetStatus: 'ERROR',
			});
			EventEmitter.emit(EMBED_ERROR_EVENT, {});

			return;
		}

		const dashboardParams = {
			id: embeddedParams.uuid, // given by the Superset embedding UI
			supersetDomain: embeddedParams.supersetDomain,
			mountPoint: this.#frameNode, // any html element that can contain an iframe
			fetchGuestToken: embeddedParams.guestToken,
			debug: this.#embeddedDebugMode,
			dashboardUiConfig: { // dashboard UI config: hideTitle, hideTab, ...etc.
				hideTitle: true,
				hideTab: true,
				hideChartControls: true,
				filters: {
					expanded: true,
					visible: true,
					nativeFilters: embeddedParams.nativeFilters,
				},
				urlParams: embeddedParams.urlParams ?? {},
			},
		};

		const embeddedLoader = new ApacheSupersetEmbeddedLoader(dashboardParams);
		this.#embeddedLoader = embeddedLoader;
		embeddedLoader.embedDashboard()
			.then((bridge: ScreenStateBridge) => {
				// a frame of the report the user has already left must not answer for the current one
				if (this.#embeddedLoader === embeddedLoader)
				{
					this.#embeddedBridge = bridge;
					this.#attachChartAnalysis(embeddedLoader, embeddedParams);
				}
				this.#onEmbedReady();
			})
			.catch(() => this.#onEmbedError())
		;
	}

	#onEmbedReady(): void
	{
		this.#isEmbedReady = true;
		EventEmitter.emit(EMBED_READY_EVENT, {});
		this.#startDashboardOnboarding();
	}

	#onEmbedError(): void
	{
		this.#isEmbedReady = false;
		this.#embeddedBridge = null;
		this.#destroyChartAnalysis();
		Dom.clean(this.#frameNode);
		BX.BIConnector.ApacheSuperset.Dashboard.Detail.createSkeleton({
			container: this.#frameNode,
			supersetStatus: 'ERROR',
		});
		EventEmitter.emit(EMBED_ERROR_EVENT, {});

		// A silent Superset gets no tour - the onboarding itself decides that by the embed
		// state. The empty-draft card does not depend on the embed, so this path still starts it.
		this.#startDashboardOnboarding();
	}

	// The server checked the chart analysis gate for the report of the page only, so another report opened
	// without a reload stays without it.
	#attachChartAnalysis(
		embeddedLoader: ApacheSupersetEmbeddedLoader,
		embeddedParams: DashboardEmbeddedParameters,
	): void
	{
		const config = this.#chartAnalysisConfig;
		const launcher = BX.BIConnector?.BitrixGptLauncher?.getInstance?.() ?? null;
		if (!config || Text.toInteger(embeddedParams.id) !== Text.toInteger(config.dashboardId) || !launcher)
		{
			return;
		}

		Runtime.loadExtension('biconnector.chart-analysis')
			.then((extension: Object): ?Promise<?Object> => {
				if (this.#embeddedLoader !== embeddedLoader || !Type.isFunction(extension.ChartAnalysis?.attach))
				{
					return null;
				}

				return extension.ChartAnalysis.attach({ loader: embeddedLoader, launcher, config });
			})
			.then((session: ?Object) => {
				if (!session)
				{
					return;
				}

				if (this.#embeddedLoader === embeddedLoader)
				{
					this.#chartAnalysisSession = session;
				}
				else
				{
					session.destroy();
				}
			})
			.catch((error) => {
				console.error('BIConnector: chart analysis is not available', error);
			})
		;
	}

	#destroyChartAnalysis(): void
	{
		this.#chartAnalysisSession?.destroy();
		this.#chartAnalysisSession = null;
	}

	#initHeaderButtons()
	{
		this.#initMoreMenu();
		this.#initShareButton();
		this.#initInfoButton();
		this.#initAdaptiveHeader();
		this.#initCompactHints();
	}

	// Raised once and outside #initHeaderButtons(): the connection is portal-wide, not report-wide, so
	// switching the report neither raises a second facade nor asks the server anything. The page of the
	// report reaches the server for this action not once: whoever may not connect learns it from the popup,
	// which tells the refusal of the server in its own screen.
	#initAgentConnection(config: DetailConfig): void
	{
		const button = this.#dashboardNode.querySelector('.dashboard-header-buttons-connect-agent');
		if (config.mcpBiConnection !== true || !button)
		{
			return;
		}

		Event.bind(button, 'click', () => {
			void this.#showAgentConnection(button);
		});
	}

	async #showAgentConnection(button: HTMLElement): Promise<void>
	{
		let agentConnection = null;
		try
		{
			agentConnection = await this.#loadAgentConnection(button);
		}
		catch
		{
			return;
		}

		if (Type.isFunction(agentConnection?.show))
		{
			agentConnection.show();
		}
	}

	// The extension carries the catalogue of the operations in its own settings, so the loading of it is
	// what builds the catalogue on the server - at the press of the action and never at the drawing of the
	// page.
	#loadAgentConnection(button: HTMLElement): Promise<?Object>
	{
		if (this.#agentConnection)
		{
			return Promise.resolve(this.#agentConnection);
		}

		if (this.#agentConnectionLoadPromise)
		{
			return this.#agentConnectionLoadPromise;
		}

		this.#agentConnectionLoadPromise = Runtime.loadExtension('biconnector.ai-agent-connection')
			.then((extension: Object): ?Object => {
				const AgentConnection = extension.AiAgentConnection;
				if (!Type.isFunction(AgentConnection))
				{
					return null;
				}

				this.#agentConnection = new AgentConnection({ anchor: button });

				return this.#agentConnection;
			})
			.finally(() => {
				this.#agentConnectionLoadPromise = null;
			})
		;

		return this.#agentConnectionLoadPromise;
	}

	#initAdaptiveHeader(): void
	{
		const header = this.#dashboardNode.querySelector('.dashboard-header');
		const titleSection = this.#dashboardNode.querySelector('.dashboard-header-title-section');
		const titleText = this.#dashboardNode.querySelector('#dashboard-selector-text');
		const selector = this.#dashboardNode.querySelector('#dashboard-selector');
		const buttons = this.#dashboardNode.querySelector('.dashboard-header-buttons');
		if (!header || !titleSection || !titleText || !selector || !buttons)
		{
			return;
		}

		this.#headerResizeObserver?.disconnect();
		this.#headerTitleObserver?.disconnect();

		this.#headerNode = header;
		this.#headerTitleText = titleText;
		this.#headerButtons = buttons;

		this.#measureHeaderMetrics(titleSection, selector);
		this.#evaluateHeaderCompact();

		this.#headerResizeObserver = new ResizeObserver(() => this.#evaluateHeaderCompact());
		this.#headerResizeObserver.observe(header);
		this.#headerTitleObserver = new MutationObserver(() => this.#evaluateHeaderCompact());
		this.#headerTitleObserver.observe(titleText, { characterData: true, childList: true, subtree: true });

		if (document.fonts && document.fonts.ready)
		{
			document.fonts.ready.then(() => {
				if (!this.#headerNode)
				{
					return;
				}
				this.#measureHeaderMetrics(titleSection, selector);
				this.#evaluateHeaderCompact();
			});
		}
	}

	#measureHeaderMetrics(titleSection: HTMLElement, selector: HTMLElement): void
	{
		const outer = (el: ?HTMLElement, ...sides: Array<string>): number => {
			if (!el)
			{
				return 0;
			}
			const cs = window.getComputedStyle(el);
			return el.getBoundingClientRect().width + sides.reduce((sum, side) => sum + (parseFloat(cs[side]) || 0), 0);
		};

		this.#headerNode.classList.add(MEASURING_HEADER_CLASS);

		const logoOuter = outer(titleSection.querySelector('.dashboard-header-logo'), 'marginRight');
		const chevronOuter = outer(selector.querySelector('.dashboard-header-selector-icon'), 'marginLeft', 'marginRight');
		this.#headerChromeWidth = logoOuter + chevronOuter + HEADER_FIT_SAFETY;
		this.#buttonsExpandedWidth = this.#headerButtons.getBoundingClientRect().width;

		this.#headerNode.classList.remove(MEASURING_HEADER_CLASS);
	}

	#evaluateHeaderCompact(): void
	{
		if (!this.#headerNode || !this.#headerTitleText)
		{
			return;
		}
		const needed = this.#headerChromeWidth + this.#headerTitleText.scrollWidth + this.#buttonsExpandedWidth;
		this.#headerNode.classList.toggle(COMPACT_HEADER_CLASS, needed > this.#headerNode.clientWidth);
	}

	#initCompactHints()
	{
		if (this.#compactHintAbort)
		{
			this.#compactHintAbort.abort();
		}
		this.#compactHintAbort = new AbortController();
		const { signal } = this.#compactHintAbort;

		let hintAnchor = null;

		const hide = () => {
			if (hintAnchor && BX?.UI?.Hint && Type.isFunction(BX.UI.Hint.hide))
			{
				BX.UI.Hint.hide(hintAnchor);
				hintAnchor = null;
			}
		};

		const buttons = this.#dashboardNode.querySelectorAll('.dashboard-header-buttons [data-compact-hint]');
		buttons.forEach((button) => {
			const label = button.querySelector('.dashboard-header-button-label');
			const hintText = button.getAttribute('data-compact-hint') || '';

			button.addEventListener('mouseenter', () => {
				if (!hintText || (label && label.offsetWidth > 0))
				{
					return;
				}
				if (!BX?.UI?.Hint || !Type.isFunction(BX.UI.Hint.show))
				{
					return;
				}
				hintAnchor = button;
				BX.UI.Hint.show(button, hintText, false, false);
			}, { signal });

			button.addEventListener('mouseleave', hide, { signal });
			button.addEventListener('click', hide, { signal });
		});
	}

	#alignMenuPopupToArrow(button: HTMLElement, popup: Object): void
	{
		if (!popup || !Type.isFunction(popup.adjustPosition))
		{
			return;
		}
		const buttonStyle = window.getComputedStyle(button);
		const paddingRight = parseFloat(buttonStyle.paddingRight) || 0;
		const dropdownArrowStyle = window.getComputedStyle(button, '::after');
		const dropdownArrowWidth = parseFloat(dropdownArrowStyle.width) || 8;
		const dropdownArrowCenter = button.offsetWidth - paddingRight - dropdownArrowWidth / 2;
		popup.setOffset({ offsetLeft: Math.round(dropdownArrowCenter), offsetTop: 0 });
		popup.bindOptions.forceBindPosition = true;
		popup.adjustPosition();
	}

	#initInfoButton()
	{
		const infoButton = this.#dashboardNode.querySelector('.dashboard-header-buttons-info');
		Event.unbindAll(infoButton);

		if (Type.isPlainObject(this.#infoAhaMomentOptions))
		{
			if (!this.#infoAhaMoment)
			{
				this.#infoAhaMoment = new AhaMoment({
					...this.#infoAhaMomentOptions,
					bindElement: infoButton,
				});
			}
			else
			{
				this.#infoAhaMoment.setBindElement(infoButton);
			}

			this.#infoAhaMoment.show();
		}

		Event.bind(infoButton, 'click', () => {
			this.#infoAhaMoment?.close();

			BX.SidePanel.Instance.open(`/bitrix/components/bitrix/biconnector.apachesuperset.dashboard.detail.info/slider.php?dashboard_id=${this.#embeddedParams.id}`, {
				width: 860,
				allowChangeHistory: false,
				cacheable: false,
			});
		});
	}

	/**
	 * The onboarding bundle is fetched on demand: the tour starts after the embed is ready and
	 * the restart item plays it after a click, so nothing here belongs to the first render. The
	 * promise is kept so a click during the fetch reuses it instead of asking for a second copy.
	 */
	#getDashboardOnboarding(): Promise<?Object>
	{
		if (!Type.isPlainObject(this.#dashboardOnboardingConfig))
		{
			return Promise.resolve(null);
		}

		this.#dashboardOnboardingPromise ??= Runtime.loadExtension(ONBOARDING_EXTENSION)
			.then(({ DashboardOnboarding }) => {
				// The header selector can replace the report while the bundle is on its way, and
				// the config that arrived with the page is then no longer the one on the screen.
				if (!Type.isPlainObject(this.#dashboardOnboardingConfig))
				{
					return null;
				}

				this.#dashboardOnboarding ??= new DashboardOnboarding({
					config: this.#dashboardOnboardingConfig,
					frameNode: this.#frameNode,
					isEmbedReady: () => this.isEmbedReady(),
					onEditRequested: () => {
						this.#onEditButtonClick();
					},
				});

				return this.#dashboardOnboarding;
			})
		;

		return this.#dashboardOnboardingPromise;
	}

	#startDashboardOnboarding(): void
	{
		if (this.#dashboardOnboardingConfig?.mode === ONBOARDING_MODE_NONE)
		{
			return;
		}

		// A broken hint must not affect the report itself.
		this.#getDashboardOnboarding()
			.then((onboarding) => onboarding?.start())
			.catch(() => {})
		;
	}

	#restartDashboardOnboarding(): void
	{
		this.#getDashboardOnboarding()
			.then((onboarding) => onboarding?.restart())
			.catch(() => {})
		;
	}

	#onEditButtonClick()
	{
		const dashboardInfo = {
			id: this.#embeddedParams.id,
			editLink: this.#embeddedParams.editUrl,
			type: this.#embeddedParams.type,
		};

		this.#dashboardManager.processEditDashboard(
			dashboardInfo,
			() => {},
			(popupType) => {
				ApacheSupersetAnalytics.sendAnalytics('edit', 'report_edit', {
					c_sub_section: popupType,
					c_element: 'detail_button',
					type: this.#embeddedParams.type.toLowerCase(),
					p1: ApacheSupersetAnalytics.buildAppIdForAnalyticRequest(this.#embeddedParams.appId),
					p2: this.#embeddedParams.id,
					status: 'success',
				});
			},
			(popupType) => {
				ApacheSupersetAnalytics.sendAnalytics('edit', 'report_edit', {
					c_sub_section: popupType,
					c_element: 'detail_button',
					type: this.#embeddedParams.type.toLowerCase(),
					p1: ApacheSupersetAnalytics.buildAppIdForAnalyticRequest(this.#embeddedParams.appId),
					p2: this.#embeddedParams.id,
					status: 'error',
				});
			},
		);

		this.#reloadGridAfterSliderClose();
	}

	#reloadGridAfterSliderClose()
	{
		const slider = BX.SidePanel.Instance.getSliderByWindow(window);
		if (slider)
		{
			EventEmitter.subscribeOnce(slider, 'SidePanel.Slider:onClose', () => {
				if (!top.BX.Main || !top.BX.Main.gridManager)
				{
					return;
				}

				top.BX.Main.gridManager.data.forEach((grid) => {
					if (grid.instance.getId() === 'biconnector_superset_dashboard_grid')
					{
						grid.instance.reload();
					}
				});
			});
		}
	}

	// eslint-disable-next-line max-lines-per-function

	#initShareButton()
	{
		const shareButton = this.#dashboardNode.querySelector('.dashboard-header-buttons-share');
		if (!shareButton)
		{
			return;
		}

		Event.unbindAll(shareButton);

		const menuItems = [];

		if (this.#canShare)
		{
			menuItems.push(this.#getShareLinkMenuItem());
		}

		menuItems.push(
			{
				id: 'share-screenshot',
				title: Loc.getMessage('SUPERSET_DASHBOARD_DETAIL_SHARE_TO_CHAT_IMAGE_MSGVER_1'),
				html: Tag.render`
					<span class="dashboard-detail-menu-item">
						<span class="dashboard-detail-menu-item-content">
							<span class="dashboard-detail-menu-item-title">
								${Text.encode(Loc.getMessage('SUPERSET_DASHBOARD_DETAIL_SHARE_TO_CHAT_IMAGE_MSGVER_1'))}
							</span>
							<span class="dashboard-detail-menu-item-description">
								${Text.encode(Loc.getMessage('SUPERSET_DASHBOARD_DETAIL_SHARE_TO_CHAT_IMAGE_DESCRIPTION'))}
							</span>
						</span>
			
						<span class="ui-icon-set --o-image dashboard-detail-menu-item-icon"></span>
					</span>`,
				className: 'menu-popup-no-icon dashboard-detail-share-link-menu-item',
				onclick: (event, menuItem: MenuItem) => {
					menuItem.menuWindow.close();
					const moreButton = this.#dashboardNode.querySelector('.dashboard-header-buttons-more');
					const selector: ChatSelector = new ChatSelector({
						targetNode: moreButton,
						dashboardName: Text.decode(this.#embeddedParams.title),
						fileExtension: 'jpeg',
						onSend: () => this.#embeddedLoader.getScreenshot(),
						dashboardId: this.#embeddedParams.id,
						dashboardType: this.#embeddedParams.type.toLowerCase(),
						appId: this.#embeddedParams.appId,
					});
					selector.show();
					ApacheSupersetAnalytics.sendAnalytics('share', 'open_selector', {
						p3: 'ext_jpeg',
					});
				},
			},
			{
				id: 'share-pdf',
				title: Loc.getMessage('SUPERSET_DASHBOARD_DETAIL_SHARE_TO_CHAT_PDF_MSGVER_1'),
				html: Tag.render`
					<span class="dashboard-detail-menu-item">
						<span class="dashboard-detail-menu-item-content">
							<span class="dashboard-detail-menu-item-title">
								${Text.encode(Loc.getMessage('SUPERSET_DASHBOARD_DETAIL_SHARE_TO_CHAT_PDF_MSGVER_1'))}
							</span>
							<span class="dashboard-detail-menu-item-description">
								${Text.encode(Loc.getMessage('SUPERSET_DASHBOARD_DETAIL_SHARE_TO_CHAT_PDF_DESCRIPTION'))}
							</span>
						</span>
			
						<span class="ui-icon-set --o-file dashboard-detail-menu-item-icon"></span>
					</span>`,
				className: 'menu-popup-no-icon dashboard-detail-share-link-menu-item',
				onclick: (event, menuItem: MenuItem) => {
					menuItem.menuWindow.close();
					const moreButton = this.#dashboardNode.querySelector('.dashboard-header-buttons-more');
					const selector: ChatSelector = new ChatSelector({
						targetNode: moreButton,
						dashboardName: Text.decode(this.#embeddedParams.title),
						fileExtension: 'pdf',
						onSend: () => this.#embeddedLoader.getPdf(),
						dashboardId: this.#embeddedParams.id,
						dashboardType: this.#embeddedParams.type.toLowerCase(),
						appId: this.#embeddedParams.appId,
					});
					selector.show();
					ApacheSupersetAnalytics.sendAnalytics('share', 'open_selector', {
						p3: 'ext_pdf',
					});
				},
			},
		);

		this.#shareMenu?.destroy();
		const shareMenu = new Menu({
			closeByEsc: false,
			closeIcon: false,
			cacheable: true,
			angle: {
				position: 'top',
			},
			bindElement: shareButton,
			events: {
				onShow: (event) => {
					this.#alignMenuPopupToArrow(shareButton, event.getTarget());
					BX.UI.Hint?.init(event.getTarget().getPopupContainer());
				},
			},
			autoHide: true,
			items: menuItems,
		});
		this.#shareMenu = shareMenu;

		Event.bind(shareButton, 'click', () => {
			shareMenu.show();
			ApacheSupersetAnalytics.sendAnalytics('share', 'click_share', {
				type: this.#embeddedParams.type.toLowerCase(),
			});
		});
	}

	#getShareLinkMenuItem(): MenuItemOptions
	{
		const bannedHint = Loc.getMessage('SUPERSET_DASHBOARD_DETAIL_SHARE_LINK_BANNED_HINT');

		return {
			id: 'share-link',
			dataset: { testId: 'share-link' },
			disabled: this.#isShareBanned,
			attrs: this.#isShareBanned ? { 'data-hint': bannedHint, 'data-hint-no-icon': '' } : null,
			title: Loc.getMessage('SUPERSET_DASHBOARD_DETAIL_SHARE_LINK_MSGVER_1'),
			html: Tag.render`
				<span class="dashboard-detail-menu-item">
					<span class="dashboard-detail-menu-item-content">
						<span class="dashboard-detail-menu-item-title">
							${Text.encode(Loc.getMessage('SUPERSET_DASHBOARD_DETAIL_SHARE_LINK_MSGVER_1'))}
						</span>
						<span class="dashboard-detail-menu-item-description">
							${Text.encode(Loc.getMessage('SUPERSET_DASHBOARD_DETAIL_SHARE_LINK_DESCRIPTION'))}
						</span>
					</span>

					<span class="ui-icon-set --o-link dashboard-detail-menu-item-icon"></span>
				</span>`,
			className: 'menu-popup-no-icon dashboard-detail-share-link-menu-item',
			onclick: (event, menuItem: MenuItem) => {
				if (menuItem.isDisabled())
				{
					return;
				}

				menuItem.menuWindow.close();
				this.#showSharePopup();
			},
		};
	}

	#showSharePopup()
	{
		if (!this.#sharePopup)
		{
			this.#sharePopup = new SharePopup({
				dashboardId: this.#embeddedParams.id,
				dashboardTitle: this.#embeddedParams.title ?? '',
				embeddedLoader: this.#embeddedLoader,
				initialShareData: this.#shareData,
				urlParams: this.#embeddedParams.urlParams ?? null,
				type: (this.#embeddedParams.type ?? '').toLowerCase(),
				analyticsElement: 'detail_button',
			});
		}

		this.#sharePopup.show();
	}

	#initMoreMenu()
	{
		const moreButton = this.#dashboardNode.querySelector('.dashboard-header-buttons-more');
		if (this.#moreMenu)
		{
			Event.unbindAll(moreButton);
			this.#moreMenu.destroy();
		}

		this.#moreMenu = new Menu({
			closeByEsc: false,
			closeIcon: false,
			cacheable: true,
			angle: {
				position: 'top',
				offset: 43,
			},
			items: this.#getMoreMenuItems(),
			toFrontOnShow: true,
			autoHide: true,
			bindElement: moreButton,
			className: 'more-popup',
			events: {
				onBeforeClose: () => {
					this.#moreMenu.getMenuItems().forEach((menuItem) => {
						menuItem.closeSubMenu();
					});
				},
				onAfterShow: () => {
					const popupContainer = this.#getMoreMenu().getPopupWindow().getPopupContainer();
					const overHeight = popupContainer.getBoundingClientRect().top + popupContainer.offsetHeight;

					if (overHeight > window.innerHeight)
					{
						window.scrollTo({
							top: window.scrollY + (-window.innerHeight + overHeight),
							behavior: 'smooth',
						});
					}
				},
			},
		});

		Event.bind(moreButton, 'click', () => this.#moreMenu.show());
	}

	#getDownloadMenuItems(): MenuItemOptions[]
	{
		return [
			{
				id: 'download-screenshot',
				title: Loc.getMessage('SUPERSET_DASHBOARD_DETAIL_DOWNLOAD_JPEG_MSGVER_1'),
				html: Tag.render`<span class="dashboard-detail-menu-item">
						<span>${Text.encode(Loc.getMessage('SUPERSET_DASHBOARD_DETAIL_DOWNLOAD_JPEG_MSGVER_1'))}</span>
						<span class="ui-icon-set --o-image dashboard-detail-menu-item-icon"></span>
						</span>`,
				className: 'menu-popup-no-icon',
				onclick: (event, menuItem) => {
					menuItem.disable();
					const loader = new Loader({
						target: menuItem.layout.item,
						size: 30,
					});
					loader.show();
					this.#embeddedLoader.getScreenshot()
						.then((imageData: string) => {
							const dashboardTitle = Text.decode(this.#embeddedParams.title);
							const datetime = DateTimeFormat.format('Y-m-d H-i-s');
							this.#downloadFile(
								imageData.replace('data:image/jpeg;base64,', ''),
								`${dashboardTitle} ${datetime}.jpeg`,
								'image/jpeg',
							);
							menuItem.enable();
							loader.hide();
							ApacheSupersetAnalytics.sendAnalytics('download', 'dashboard_download', {
								status: 'success',
								type: this.#embeddedParams.type.toLowerCase(),
								p1: ApacheSupersetAnalytics.buildAppIdForAnalyticRequest(this.#embeddedParams.appId),
								p2: this.#embeddedParams.id,
								p3: 'ext_jpeg',
							});
						})
						.catch(() => {
							menuItem.enable();
							loader.hide();
							BX.UI.Notification.Center.notify({
								content: Loc.getMessage('SUPERSET_DASHBOARD_DETAIL_DOWNLOAD_ERROR'),
							});
							ApacheSupersetAnalytics.sendAnalytics('download', 'dashboard_download', {
								status: 'error',
								type: this.#embeddedParams.type.toLowerCase(),
								p1: ApacheSupersetAnalytics.buildAppIdForAnalyticRequest(this.#embeddedParams.appId),
								p2: this.#embeddedParams.id,
								p3: 'ext_jpeg',
							});
						})
					;
				},
			},
			{
				id: 'download-pdf',
				title: Loc.getMessage('SUPERSET_DASHBOARD_DETAIL_DOWNLOAD_PDF'),
				html: Tag.render`<span class="dashboard-detail-menu-item">
						<span>${Text.encode(Loc.getMessage('SUPERSET_DASHBOARD_DETAIL_DOWNLOAD_PDF'))}</span>
						<span class="ui-icon-set --o-file dashboard-detail-menu-item-icon"></span>
						</span>`,
				className: 'menu-popup-no-icon',
				onclick: (event, menuItem) => {
					menuItem.disable();
					const loader = new Loader({
						target: menuItem.layout.item,
						size: 30,
					});
					loader.show();
					this.#embeddedLoader.getPdf()
						.then((imageData: string) => {
							const dashboardTitle = Text.decode(this.#embeddedParams.title);
							const datetime = DateTimeFormat.format('Y-m-d H-i-s');
							this.#downloadFile(
								imageData,
								`${dashboardTitle} ${datetime}.pdf`,
								'application/pdf',
							);
							menuItem.enable();
							loader.hide();
							ApacheSupersetAnalytics.sendAnalytics('download', 'dashboard_download', {
								status: 'success',
								type: this.#embeddedParams.type.toLowerCase(),
								p1: ApacheSupersetAnalytics.buildAppIdForAnalyticRequest(this.#embeddedParams.appId),
								p2: this.#embeddedParams.id,
								p3: 'ext_pdf',
							});
						})
						.catch(() => {
							menuItem.enable();
							loader.hide();
							BX.UI.Notification.Center.notify({
								content: Loc.getMessage('SUPERSET_DASHBOARD_DETAIL_DOWNLOAD_ERROR'),
							});
							ApacheSupersetAnalytics.sendAnalytics('download', 'dashboard_download', {
								status: 'error',
								type: this.#embeddedParams.type.toLowerCase(),
								p1: ApacheSupersetAnalytics.buildAppIdForAnalyticRequest(this.#embeddedParams.appId),
								p2: this.#embeddedParams.id,
								p3: 'ext_pdf',
							});
						})
					;
				},
			},
		];
	}

	// eslint-disable-next-line max-lines-per-function
	#getMoreMenuItems(): MenuItemOptions[]
	{
		const result = [];

		if (this.#canEdit && (!BX.BIConnector.LimitLockPopup || this.#lockWarningDismissed))
		{
			result.push(
				{
					id: 'edit_dashboard',
					title: Loc.getMessage('SUPERSET_DASHBOARD_DETAIL_HEADER_EDIT_MSGVER_1'),
					html: Tag.render`<span class="dashboard-detail-menu-item">
						<span>${Text.encode(Loc.getMessage('SUPERSET_DASHBOARD_DETAIL_HEADER_EDIT_MSGVER_1'))}</span>
						<span class="ui-icon-set --edit-l dashboard-detail-menu-item-icon"></span>
						</span>`,
					className: 'menu-popup-no-icon',
					onclick: () => {
						this.#onEditButtonClick();
					},
				},
			);
		}

		if (
			this.#digestSetup
			&& ['ready', 'subscription_required'].includes(this.#digestSetup.availability.state)
		)
		{
			result.push({
				id: 'configure_digest',
				title: Loc.getMessage('SUPERSET_DASHBOARD_DETAIL_MORE_MENU_CONFIGURE_DIGEST'),
				html: Tag.render`<span class="dashboard-detail-menu-item" data-testid="dashboard-configure-digest">
					<span>${Text.encode(Loc.getMessage('SUPERSET_DASHBOARD_DETAIL_MORE_MENU_CONFIGURE_DIGEST'))}</span>
					<span class="ui-icon-set --o-file-with-clock dashboard-detail-menu-item-icon"></span>
					</span>`,
				className: 'menu-popup-no-icon',
				onclick: () => {
					void AiDigestSetup.open({
						dashboardId: this.#embeddedParams.id,
						availability: this.#digestSetup.availability,
						bridge: this.#embeddedBridge,
					});
				},
			});
		}

		result.push(
			{
				id: 'download',
				title: Loc.getMessage('SUPERSET_DASHBOARD_DETAIL_DOWNLOAD_IMAGE_MSGVER_1'),
				html: Tag.render`
					<span class="dashboard-detail-menu-item">
					<span>${Text.encode(Loc.getMessage('SUPERSET_DASHBOARD_DETAIL_DOWNLOAD_IMAGE_MSGVER_1'))}</span>
					<span class="ui-icon-set --o-download dashboard-detail-menu-item-icon no-chevron"></span>
					</span>`,
				className: 'menu-popup-no-icon dashboard-detail-download-menu-item',
				cacheable: true,
				items: this.#getDownloadMenuItems(),

				onclick: (event, menuItem) => {
					menuItem.showSubMenu();
				},
			},
			{
				id: 'feedback',
				title: Loc.getMessage('SUPERSET_DASHBOARD_DETAIL_MORE_MENU_FEEDBACK'),
				html: Tag.render`<span class="dashboard-detail-menu-item">
						<span>${Text.encode(Loc.getMessage('SUPERSET_DASHBOARD_DETAIL_MORE_MENU_FEEDBACK'))}</span>
						<span class="ui-icon-set --o-message dashboard-detail-menu-item-icon"></span>
						</span>`,
				className: 'menu-popup-no-icon',
				onclick: () => {
					ApacheSupersetFeedbackForm.feedbackFormOpen();
				},
			},
			{
				id: 'order_dashboard',
				title: Loc.getMessage('SUPERSET_DASHBOARD_DETAIL_MORE_MENU_ORDER_DASHBOARD'),
				html: Tag.render`<span class="dashboard-detail-menu-item">
						<span>${Text.encode(Loc.getMessage('SUPERSET_DASHBOARD_DETAIL_MORE_MENU_ORDER_DASHBOARD'))}</span>
						<span class="ui-icon-set --o-market dashboard-detail-menu-item-icon"></span>
						</span>`,
				className: 'menu-popup-no-icon',
				onclick: () => {
					ApacheSupersetFeedbackForm.requestIntegrationFormOpen();
				},
			},
		);

		if (this.#dashboardOnboardingConfig?.canRestart === true)
		{
			result.push({
				id: 'restart_onboarding',
				title: Loc.getMessage('BICONNECTOR_DASHBOARD_ONBOARDING_RESTART_MENU_ITEM'),
				html: Tag.render`
					<span
						class="dashboard-detail-menu-item"
						data-testid="biconnector-report-detail-restart-onboarding-item"
					>
						<span>${Text.encode(Loc.getMessage('BICONNECTOR_DASHBOARD_ONBOARDING_RESTART_MENU_ITEM'))}</span>
						<span class="ui-icon-set --o-question dashboard-detail-menu-item-icon"></span>
					</span>
				`,
				className: 'menu-popup-no-icon',
				onclick: (event, menuItem) => {
					menuItem.menuWindow.close();
					this.#restartDashboardOnboarding();
				},
			});
		}

		if (this.#canExport)
		{
			result.push({
				id: 'export',
				title: Loc.getMessage('SUPERSET_DASHBOARD_DETAIL_MORE_MENU_EXPORT'),
				html: Tag.render`<span class="dashboard-detail-menu-item">
						<span>${Text.encode(Loc.getMessage('SUPERSET_DASHBOARD_DETAIL_MORE_MENU_EXPORT'))}</span>
						<span class="ui-icon-set --o-share dashboard-detail-menu-item-icon"></span>
						</span>`,
				className: 'menu-popup-no-icon',
				onclick: () => {
					this.#moreMenu.getMenuItem('export').disable();
					this.#dashboardManager.exportDashboard(this.#embeddedParams.id, 'detail_button')
						.finally(() => {
							this.#moreMenu.getMenuItem('export').enable();
						})
						.catch(() => {
						})
					;
				},
			});
		}

		return result;
	}

	#onShareSettingChange(event: BaseEvent): void
	{
		const { dashboardId, isBanned } = event.getData();
		if (Text.toInteger(dashboardId) !== Text.toInteger(this.#embeddedParams.id))
		{
			return;
		}

		this.#applyShareBanState(isBanned === true);
		this.#initShareButton();
	}

	// The ban switches off the own link too, so the next popup must start from the disabled state.
	#applyShareBanState(isBanned: boolean): void
	{
		this.#isShareBanned = isBanned;
		this.#sharePopup?.hide();
		this.#sharePopup = null;

		if (!this.#shareData)
		{
			return;
		}

		this.#shareData = {
			...this.#shareData,
			isBanned,
			...(isBanned && { isActive: false, disabledByAdmin: null }),
		};
	}

	#downloadFile(base64Data: string, fileName: string, fileType: string): void
	{
		const byteCharacters = atob(base64Data);
		const byteNumbers = Array.from({ length: byteCharacters.length });
		for (let i = 0; i < byteCharacters.length; i++)
		{
			byteNumbers[i] = byteCharacters.codePointAt(i);
		}

		const byteArray = new Uint8Array(byteNumbers);
		const blob = new Blob([byteArray], { type: fileType });
		const link = document.createElement('a');
		link.href = window.URL.createObjectURL(blob);
		link.download = fileName;
		Dom.append(link, document.body);
		link.click();
		Dom.remove(link);
	}

	#getMoreMenu(): Menu
	{
		return this.#moreMenu;
	}

	#postOptionsForFilter(event): void
	{
		if (event.origin === this.#embeddedParams.supersetDomain)
		{
			const { type, filterId } = event.data;

			if (type === 'superset-filter-request-options' && filterId)
			{
				event.source.postMessage({
					type: 'superset-filter-options',
					filterId,
					options: this.#getOptionsForFilter(filterId),
				}, event.origin);
			}
		}
	}

	#getOptionsForFilter(filterId): FilterOptions[]
	{
		return this.#embeddedParams.filters[filterId] || [];
	}

}
