/* eslint-disable */
this.BX = this.BX || {};
(function (exports, main_core, ui_system_dialog, main_sidepanel, ui_buttons, ui_analytics, ui_iconSet_outline, ui_tooltip, intranet_user_miniProfile, main_core_events, main_popup, ui_iconSet_api_core, ui_system_skeleton, ui_system_menu, ui_system_typography, im_public, ui_cnt, ui_iconSet_smallOutline, ui_iconSet_solid, ui_notification, ui_system_input, ui_dialogs_messagebox, ui_datePicker, ui_entitySelector, ui_switcher, ui_system_chip) {
	'use strict';

	const TOOL = 'intranet';
	const CATEGORY = 'vibecode_catalog';
	function sendCatalogAnalytics(payload) {
		ui_analytics.sendData({
			tool: TOOL,
			category: CATEGORY,
			...payload
		});
	}

	const SAFETY_TIMEOUT_MS = 30000;
	const LOADER_VIDEO_SRC = '/bitrix/js/vibecodeconnector/catalog/images/bg-blackhole-B-video-min.mp4';
	// the same runtime url as the loader background in style.css: chef copies
	// the poster referenced from css into dist/images, so the browser loads it once
	const LOADER_VIDEO_POSTER = '/bitrix/js/vibecodeconnector/catalog/dist/images/bg-blackhole-B-poster.webp';
	const FULLSCREEN_LEFT_BOUNDARY = 65; // the core slider zone reserved for the labels
	const ICON_EXPAND = 'ui-icon-set --expand-l';
	const ICON_COLLAPSE = 'ui-icon-set --collapse-l';
	const LOC_EXPAND = 'VIBECODECONNECTOR_CATALOG_OPEN_APP_EXPAND';
	const LOC_COLLAPSE = 'VIBECODECONNECTOR_CATALOG_OPEN_APP_COLLAPSE';
	class OpenAppView {
		#options;
		#container = null;
		#contentArea = null;
		#loader = null;
		#safetyTimer = null;
		#fullscreenSlider = null;
		#fullscreenLabel = null;
		#savedLeftBoundary = null;
		#isFullscreen = false;
		constructor(options) {
			this.#options = options;
		}
		getContainer() {
			this.#container ??= this.#render();
			return this.#container;
		}
		setFullscreenControls(slider, fullscreenLabel) {
			this.#fullscreenSlider = slider;
			this.#fullscreenLabel = fullscreenLabel;
			fullscreenLabel.setIconClass(ICON_EXPAND);
			fullscreenLabel.setIconTitle(main_core.Loc.getMessage(LOC_EXPAND));
		}
		toggleFullscreen() {
			const slider = this.#fullscreenSlider;
			const fullscreenLabel = this.#fullscreenLabel;
			if (slider === null || fullscreenLabel === null) {
				return;
			}
			const wrapper = this.getContainer();
			if (this.#isFullscreen) {
				slider.setCustomLeftBoundary(this.#savedLeftBoundary);
				main_core.Dom.removeClass(wrapper, '--fullscreen');
				fullscreenLabel.setIconClass(ICON_EXPAND);
				fullscreenLabel.setIconTitle(main_core.Loc.getMessage(LOC_EXPAND));
				this.#isFullscreen = false;
			} else {
				this.#savedLeftBoundary = slider.getCustomLeftBoundary();
				slider.setCustomLeftBoundary(FULLSCREEN_LEFT_BOUNDARY);
				main_core.Dom.addClass(wrapper, '--fullscreen');
				fullscreenLabel.setIconClass(ICON_COLLAPSE);
				fullscreenLabel.setIconTitle(main_core.Loc.getMessage(LOC_COLLAPSE));
				this.#isFullscreen = true;
			}
			slider.adjustLayout();
		}
		async mountLayout(html) {
			this.getContainer();
			await main_core.Runtime.html(this.#contentArea, html);
			const iframe = this.#contentArea.querySelector('iframe');
			if (iframe === null) {
				this.#hideLoader();
				return;
			}
			this.#showLoader();
			main_core.Event.bind(iframe, 'load', () => this.#onIframeLoad(iframe));
			this.#restartSafetyTimer();
		}
		showLoadError() {
			this.getContainer();
			main_core.Dom.clean(this.#contentArea);
			main_core.Dom.append(main_core.Tag.render`
				<div class="vibecode-catalog-open-app__error" role="alert" data-testid="vibecode-open-app-error">
					${main_core.Loc.getMessage('VIBECODECONNECTOR_CATALOG_OPEN_APP_LOAD_ERROR')}
				</div>
			`, this.#contentArea);
			this.#hideLoader();
		}
		#onIframeLoad(iframe) {
			if (this.#isBlankFrame(iframe)) {
				return;
			}
			this.#hideLoader();
		}
		#isBlankFrame(iframe) {
			try {
				return iframe.contentDocument !== null && iframe.contentWindow.location.href === 'about:blank';
			} catch {
				return false;
			}
		}
		#showLoader() {
			// the loader overlay covers the content visually; inert also removes
			// the covered iframe from the tab order and the accessibility tree
			this.#contentArea.inert = true;
			main_core.Dom.removeClass(this.#loader, '--hidden');
		}
		#hideLoader() {
			if (this.#safetyTimer !== null) {
				window.clearTimeout(this.#safetyTimer);
				this.#safetyTimer = null;
			}
			this.#contentArea.inert = false;
			main_core.Dom.addClass(this.#loader, '--hidden');
		}
		#restartSafetyTimer() {
			if (this.#safetyTimer !== null) {
				window.clearTimeout(this.#safetyTimer);
			}
			this.#safetyTimer = window.setTimeout(() => this.#hideLoader(), SAFETY_TIMEOUT_MS);
		}
		#render() {
			this.#contentArea = main_core.Tag.render`<div class="vibecode-catalog-open-app__content" data-testid="vibecode-open-app-content"></div>`;
			// the loader is visible from the first paint: it covers both the layout request
			// and the app loading inside the iframe; the visually hidden text makes
			// the live region actually announce the loading state
			this.#loader = main_core.Tag.render`
			<div class="vibecode-catalog-open-app__loader" role="status" data-testid="vibecode-open-app-loader">
				<video
					class="vibecode-catalog-open-app__loader-video"
					src="${LOADER_VIDEO_SRC}"
					poster="${LOADER_VIDEO_POSTER}"
					autoplay
					muted
					loop
					playsinline
					aria-hidden="true"
				></video>
				<span class="vibecode-catalog-open-app__visually-hidden">${main_core.Loc.getMessage('VIBECODECONNECTOR_CATALOG_OPEN_APP_LOADER')}</span>
			</div>
		`;
			this.#showLoader();
			this.#restartSafetyTimer();
			return main_core.Tag.render`
			<div class="vibecode-catalog-open-app" data-testid="vibecode-open-app-wrapper">
				${this.#renderHeader()}
				<div class="vibecode-catalog-open-app__body">
					${this.#contentArea}
					${this.#loader}
				</div>
			</div>
		`;
		}
		#renderHeader() {
			const encodedTitle = main_core.Text.encode(this.#options.title);
			return main_core.Tag.render`
			<div class="vibecode-catalog-open-app__header">
				<h3 class="vibecode-catalog-open-app__title ui-headline --lg" title="${encodedTitle}" data-testid="vibecode-open-app-title">${encodedTitle}</h3>
				${this.#renderAuthor()}
			</div>
		`;
		}
		#getProfilePathTemplate() {
			const template = main_core.Extension.getSettings('vibecodeconnector.catalog').get('userProfilePathTemplate');
			return main_core.Type.isStringFilled(template) ? template : '/company/personal/user/#user_id#/';
		}
		#renderAuthor() {
			if (this.#options.isMine === true || !main_core.Type.isStringFilled(this.#options.ownerName)) {
				return '';
			}
			const ownerId = main_core.Text.toInteger(this.#options.ownerId);
			const profileUrl = this.#getProfilePathTemplate().replace('#user_id#', String(ownerId));
			const authorLabel = main_core.Loc.getMessage('VIBECODECONNECTOR_CATALOG_OPEN_APP_AUTHOR', {
				'#NAME#': this.#options.ownerName
			});
			return main_core.Tag.render`
			<a
				class="vibecode-catalog-open-app__author ui-text --lg"
				href="${profileUrl}"
				aria-label="${main_core.Text.encode(authorLabel)}"
				bx-tooltip-user-id="${ownerId}"
				bx-tooltip-context="b24"
				bx-tooltip-mini-profile-direction="viewport"
				data-testid="vibecode-open-app-author"
			>${main_core.Text.encode(this.#options.ownerName)}</a>
		`;
		}
	}

	const VIBECODE_URL = main_core.Extension.getSettings('vibecodeconnector.catalog').get('vibecodeUrl', 'https://vibecode.bitrix24.tech');
	const VIBECODE_DASHBOARD_URL = `${VIBECODE_URL}/dashboard`;
	const SLIDER_ID_PREFIX = 'vibecodeconnector-open-app-';
	const OPEN_APP_PAGE_URL = '/bitrix/services/main/ajax.php?action=vibecodeconnector.Catalog.openAppPage';
	function openUrl(url) {
		if (!main_core.Type.isStringFilled(url)) {
			return;
		}
		window.open(url, '_blank', 'noopener,noreferrer');
	}
	function openVibecodeDashboard() {
		openUrl(VIBECODE_DASHBOARD_URL);
	}
	function hasCatalogAppOpenTarget(itemId, viewUrl, canOpenInIframe = true, externalId = null) {
		if (!isCatalogItemIdValid(itemId)) {
			return false;
		}
		if (canOpenAppInIframe(itemId, canOpenInIframe, externalId)) {
			return true;
		}
		return main_core.Type.isStringFilled(viewUrl);
	}
	function openCatalogApp(target) {
		const openAppPageUrl = buildOpenAppPageUrl(target.id);
		if (openAppPageUrl === null) {
			return false;
		}
		if (!canOpenAppInIframe(target.id, target.canOpenInIframe, target.externalId)) {
			if (main_core.Type.isStringFilled(target.viewUrl)) {
				openUrl(openAppPageUrl);
			}
			return false;
		}
		const sliderId = `${SLIDER_ID_PREFIX}${target.id}`;
		if (BX.SidePanel.Instance.getSlider(sliderId) !== null) {
			// the slider is already open (for example, a double click on the item):
			// a second layout request would be orphaned, the core keeps the open instance
			return true;
		}
		const view = new OpenAppView({
			title: target.title,
			ownerId: target.ownerId,
			ownerName: target.ownerName,
			isMine: target.isMine
		});
		const layoutPromise = loadOpenAppLayout(target.id);
		// the real handlers are attached in onLoad; the no-op catch keeps a fast
		// ajax failure before onLoad from surfacing as an unhandled rejection
		layoutPromise.catch(() => {});
		let fullscreenLabel = null;
		BX.SidePanel.Instance.open(sliderId, {
			// the slider container is a role="dialog": the title becomes its accessible name
			title: target.title,
			cacheable: false,
			allowChangeHistory: false,
			copyLinkLabel: true,
			newWindowUrl: openAppPageUrl,
			contentCallback: () => view.getContainer(),
			events: {
				// the layout is mounted after the slider appends the container to the document:
				// the inline script submits the POST form into the iframe, and a detached iframe
				// has no browsing context to receive it
				onLoad: () => {
					layoutPromise.then(({
						html
					}) => view.mountLayout(html)).catch(() => view.showLoadError());
				},
				onOpenComplete: event => {
					fullscreenLabel ??= addFullscreenLabel(event.getSlider(), view);
				}
			}
		});
		return true;
	}
	function addFullscreenLabel(slider, view) {
		const fullscreenLabel = new main_sidepanel.Label(slider, {
			className: '--ui-hoverable',
			onclick: () => view.toggleFullscreen()
		});
		view.setFullscreenControls(slider, fullscreenLabel);
		main_core.Dom.append(fullscreenLabel.getContainer(), slider.getExtraLabelsContainer());
		return fullscreenLabel;
	}
	function canOpenAppInIframe(itemId, canOpenInIframe, externalId) {
		return isOpenAppInIframeEnabled() && canOpenInIframe && isCatalogItemIdValid(itemId) && main_core.Type.isStringFilled(externalId);
	}
	function isCatalogItemIdValid(itemId) {
		return main_core.Type.isNumber(itemId) && itemId > 0;
	}
	function buildOpenAppPageUrl(itemId) {
		if (!isCatalogItemIdValid(itemId)) {
			return null;
		}
		return `${OPEN_APP_PAGE_URL}&catalogItemId=${encodeURIComponent(itemId)}`;
	}
	function isOpenAppInIframeEnabled() {
		return main_core.Extension.getSettings('vibecodeconnector.catalog').get('openAppInIframe', false) === true;
	}
	function loadOpenAppLayout(catalogItemId) {
		return main_core.ajax.runAction('vibecodeconnector.Catalog.openAppLayout', {
			data: {
				catalogItemId
			}
		}).then(response => {
			const html = response?.data?.html;
			return {
				html: main_core.Type.isString(html) ? html : ''
			};
		});
	}

	class CatalogEmptyState {
		render() {
			const actionButton = new ui_buttons.Button({
				className: 'vibecode-catalog__popup-empty-state-button',
				size: ui_buttons.ButtonSize.MEDIUM,
				useAirDesign: true,
				style: ui_buttons.AirButtonStyle.FILLED_SUCCESS,
				text: main_core.Loc.getMessage('VIBECODECONNECTOR_CATALOG_POPUP_EMPTY_BUTTON'),
				props: {
					type: 'button'
				}
			}).render();
			main_core.Event.bind(actionButton, 'click', event => {
				event.preventDefault();
				sendCatalogAnalytics({
					event: 'click_vibecode',
					c_section: 'empty_state'
				});
				openVibecodeDashboard();
			});
			return main_core.Tag.render`
			<div class="vibecode-catalog__empty-popup --ui-context-edge-dark">
				<div class="vibecode-catalog__popup-empty-state">
					<div class="vibecode-catalog__popup-empty-state-text">
						<h4 class="vibecode-catalog__popup-empty-state-title ui-headline --sm">
							${main_core.Loc.getMessage('VIBECODECONNECTOR_CATALOG_POPUP_EMPTY_TITLE')}
						</h4>
						<p class="vibecode-catalog__popup-empty-state-description ui-text --sm">
							${main_core.Loc.getMessage('VIBECODECONNECTOR_CATALOG_POPUP_EMPTY_DESCRIPTION')}
						</p>
					</div>
					${actionButton}
				</div>
			</div>
		`;
		}
	}

	class CatalogNoAccessState {
		render() {
			return main_core.Tag.render`
			<div class="vibecode-catalog__empty-popup --no-action --ui-context-edge-dark" data-testid="vibecode-catalog-no-access">
				<div class="vibecode-catalog__popup-empty-state">
					<div class="vibecode-catalog__popup-empty-state-text">
						<h4 class="vibecode-catalog__popup-empty-state-title ui-headline --sm">
							${main_core.Loc.getMessage('VIBECODECONNECTOR_CATALOG_POPUP_NO_ACCESS_TITLE')}
						</h4>
						<p class="vibecode-catalog__popup-empty-state-description ui-text --sm">
							${main_core.Loc.getMessage('VIBECODECONNECTOR_CATALOG_POPUP_NO_ACCESS_DESCRIPTION')}
						</p>
					</div>
				</div>
			</div>
		`;
		}
	}

	const POPUP_WIDTH_PX = 460;
	const POPUP_BIND_GAP_PX = 6;
	const POPUP_BIND_OFFSET_LEFT_PX = 20;
	const POPUP_VIEWPORT_MARGIN_PX = 16;
	class CatalogPopupPositioner {
		#getRootNode;
		#getBindNode;
		#onReposition;
		#dialogContainer = null;
		#repositionHandler = null;
		constructor(options) {
			this.#getRootNode = options.getRootNode;
			this.#getBindNode = options.getBindNode;
			this.#onReposition = options.onReposition;
		}
		bind() {
			if (this.#repositionHandler) {
				return;
			}
			this.#repositionHandler = () => {
				this.#onReposition?.();
				this.position();
			};
			main_core.Event.bind(window, 'resize', this.#repositionHandler, {
				passive: true
			});
			main_core.Event.bind(window, 'scroll', this.#repositionHandler, {
				passive: true,
				capture: true
			});
		}
		unbind() {
			if (!this.#repositionHandler) {
				return;
			}
			main_core.Event.unbind(window, 'resize', this.#repositionHandler);
			main_core.Event.unbind(window, 'scroll', this.#repositionHandler, true);
			this.#repositionHandler = null;
		}
		reset() {
			this.unbind();
			this.#dialogContainer = null;
		}
		position() {
			const container = this.#ensureDialogContainer();
			if (!container) {
				return;
			}
			const bindNode = this.#getBindNode();
			if (!bindNode || !bindNode.isConnected) {
				main_core.Dom.style(container, 'left', '');
				main_core.Dom.style(container, 'top', '');
				main_core.Dom.style(container, 'transform', '');
				return;
			}
			const rect = bindNode.getBoundingClientRect();
			const containerWidth = container.offsetWidth || POPUP_WIDTH_PX;
			const containerHeight = container.offsetHeight;
			const minLeft = window.scrollX + POPUP_VIEWPORT_MARGIN_PX;
			const maxLeft = window.scrollX + document.documentElement.clientWidth - containerWidth - POPUP_VIEWPORT_MARGIN_PX;
			let left = window.scrollX + rect.left + POPUP_BIND_OFFSET_LEFT_PX;
			if (maxLeft > minLeft) {
				left = Math.min(Math.max(left, minLeft), maxLeft);
			} else {
				left = minLeft;
			}
			const availableBelow = window.innerHeight - rect.bottom - POPUP_BIND_GAP_PX - POPUP_VIEWPORT_MARGIN_PX;
			const availableAbove = rect.top - POPUP_BIND_GAP_PX - POPUP_VIEWPORT_MARGIN_PX;
			let top = window.scrollY + rect.bottom + POPUP_BIND_GAP_PX;
			if (containerHeight > 0 && availableBelow < containerHeight && availableAbove > availableBelow) {
				top = window.scrollY + rect.top - containerHeight - POPUP_BIND_GAP_PX;
			}
			main_core.Dom.style(container, 'left', `${Math.round(left)}px`);
			main_core.Dom.style(container, 'top', `${Math.round(Math.max(window.scrollY + POPUP_VIEWPORT_MARGIN_PX, top))}px`);
			main_core.Dom.style(container, 'transform', 'none');
		}
		#ensureDialogContainer() {
			if (this.#dialogContainer && document.body.contains(this.#dialogContainer)) {
				return this.#dialogContainer;
			}
			const container = this.#getRootNode()?.closest('.popup-window') ?? null;
			if (!(container instanceof HTMLElement)) {
				return null;
			}
			this.#dialogContainer = container;
			return container;
		}
	}

	const SLIDER_OPEN_EVENT = 'SidePanel.Slider:onOpenStart';
	const SLIDER_CLOSE_EVENTS = ['SidePanel.Slider:onCloseComplete', 'SidePanel.Slider:onDestroyComplete'];
	/**
	 * While a slider covers the catalog, a click inside it is a click outside the dialog and Esc
	 * belongs to the slider, so both closing paths of the dialog are switched off until the last
	 * slider opened above the catalog is gone.
	 */
	class CatalogPopupSliderGuard {
		#getRootNode;
		#openSliders = new Set();
		#isBound = false;
		#isClosingDisabled = false;
		constructor(options) {
			this.#getRootNode = options.getRootNode;
		}
		bind() {
			if (this.#isBound) {
				return;
			}
			this.#isBound = true;
			main_core_events.EventEmitter.subscribe(SLIDER_OPEN_EVENT, this.#handleSliderOpen);
			for (const eventName of SLIDER_CLOSE_EVENTS) {
				main_core_events.EventEmitter.subscribe(eventName, this.#handleSliderClose);
			}
		}
		reset() {
			if (!this.#isBound) {
				return;
			}
			main_core_events.EventEmitter.unsubscribe(SLIDER_OPEN_EVENT, this.#handleSliderOpen);
			for (const eventName of SLIDER_CLOSE_EVENTS) {
				main_core_events.EventEmitter.unsubscribe(eventName, this.#handleSliderClose);
			}
			this.#openSliders.clear();
			this.#isBound = false;
			this.#isClosingDisabled = false;
		}
		#handleSliderOpen = event => {
			const slider = getEventSlider(event);
			if (slider === null) {
				return;
			}
			this.#openSliders.add(slider);
			if (this.#openSliders.size === 1) {
				this.#setClosingEnabled(false);
			}
		};
		#handleSliderClose = event => {
			const slider = getEventSlider(event);

			// a closed slider is destroyed right after, so the same slider arrives twice
			if (slider !== null) {
				this.#openSliders.delete(slider);
			}

			// an event that names no slider would otherwise leave the catalog locked for good, so
			// the page is asked whether anything is still open - it may only release the lock,
			// never take the tracked sliders away
			if (this.#openSliders.size > 0 && !noSlidersLeft()) {
				return;
			}
			this.#openSliders.clear();
			this.#setClosingEnabled(true);
		};
		#setClosingEnabled(enabled) {
			if (this.#isClosingDisabled === !enabled) {
				return;
			}
			const popup = this.#getPopup();
			if (!popup) {
				console.error('[vibecodeconnector.catalog] the dialog popup is out of reach, the catalog will close under the slider');
				return;
			}
			popup.setAutoHide(enabled);
			popup.setClosingByEsc(enabled);
			this.#isClosingDisabled = !enabled;
		}

		// the dialog keeps its popup private, and the container id is the popup id
		#getPopup() {
			const container = this.#getRootNode()?.closest('.popup-window') ?? null;
			return container instanceof HTMLElement ? main_popup.PopupManager.getPopupById(container.id) : null;
		}
	}
	function noSlidersLeft() {
		const sliders = window.BX?.SidePanel?.Instance?.getOpenSliders?.();
		return Array.isArray(sliders) && sliders.length === 0;
	}
	function getEventSlider(event) {
		const [sliderEvent] = event.getData() ?? [];
		return sliderEvent?.getSlider?.() ?? null;
	}

	const NAME_MAP = {
		chevron: ui_iconSet_api_core.Actions.CHEVRON_RIGHT,
		search: ui_iconSet_api_core.Main.SEARCH_1,
		dots: ui_iconSet_api_core.Outline.MORE_M,
		plus: ui_iconSet_api_core.Actions.PLUS_30,
		close: ui_iconSet_api_core.Outline.CROSS_L,
		market: ui_iconSet_api_core.Outline.MARKET,
		apps: ui_iconSet_api_core.Outline.APPS
	};
	function getIconName(name) {
		return NAME_MAP[name] ?? name;
	}
	function renderIcon(name, size = null) {
		const iconName = getIconName(name);
		const params = {
			icon: iconName
		};
		if (size !== null) {
			params.size = size;
		}
		return new ui_iconSet_api_core.Icon(params).render();
	}

	function renderPopupFab() {
		const fab = new ui_buttons.Button({
			className: 'vibecode-catalog__fab',
			size: ui_buttons.ButtonSize.EXTRA_LARGE,
			useAirDesign: true,
			style: ui_buttons.AirButtonStyle.TINTED,
			icon: getIconName('plus'),
			props: {
				type: 'button',
				'aria-label': main_core.Loc.getMessage('VIBECODECONNECTOR_CATALOG_ADD_APP_LABEL')
			}
		}).render();
		main_core.Event.bind(fab, 'click', event => {
			event.preventDefault();
			sendCatalogAnalytics({
				event: 'click_vibecode',
				c_section: 'fab'
			});
			openVibecodeDashboard();
		});
		return fab;
	}

	const SKELETON_TAB_WIDTHS = [70, 49, 63, 128];
	class CatalogSkeleton {
		renderPopup(itemCount) {
			const tabsNode = main_core.Tag.render`
			<nav class="vibecode-catalog__tabs vibecode-catalog__tabs--placeholder" aria-hidden="true"></nav>
		`;
			for (const width of SKELETON_TAB_WIDTHS) {
				main_core.Dom.append(ui_system_skeleton.Line(width, 26, 99), tabsNode);
			}
			return main_core.Tag.render`
			<div class="vibecode-catalog vibecode-catalog--loading">
				<header class="vibecode-catalog__header">
					<h3 class="vibecode-catalog__title ui-headline --md --accent">
						${ui_system_skeleton.Line(200, 26)}
					</h3>
					<div class="vibecode-catalog__search vibecode-catalog__search--placeholder" aria-hidden="true">
						${ui_system_skeleton.Line(null, 34)}
					</div>
					${tabsNode}
				</header>
				<div class="vibecode-catalog__content">
					<div class="vibecode-catalog__body vibecode-catalog__body--static">
						${this.#renderList(itemCount)}
					</div>
				</div>
			</div>
		`;
		}
		appendItems(container, itemCount) {
			for (let i = 0; i < itemCount; i++) {
				main_core.Dom.append(this.renderItem(), container);
			}
		}
		renderItem() {
			return main_core.Tag.render`
			<li class="vibecode-catalog__item vibecode-catalog__item--placeholder" aria-hidden="true">
				<span class="vibecode-catalog__item-icon vibecode-catalog__item-icon--placeholder">
					${ui_system_skeleton.Line(56, 56)}
				</span>
				<div class="vibecode-catalog__item-content vibecode-catalog__item-content--placeholder">
					${ui_system_skeleton.Line(136, 14)}
					<div class="vibecode-catalog__item-subtitle-placeholder">
						${ui_system_skeleton.Line(null, 10)}
						${ui_system_skeleton.Line(168, 10)}
					</div>
				</div>
			</li>
		`;
		}
		#renderList(itemCount) {
			const listNode = main_core.Tag.render`<ul class="vibecode-catalog__list"></ul>`;
			this.appendItems(listNode, itemCount);
			return listNode;
		}
	}

	class CatalogPopupCompanyListEmptyState {
		render() {
			return main_core.Tag.render`
			<div class="vibecode-catalog__content-empty-state">
				<div class="vibecode-catalog__popup-empty-state vibecode-catalog__popup-empty-state--content">
					<div class="vibecode-catalog__popup-empty-state-text">
						<p class="vibecode-catalog__popup-empty-state-description ui-text --sm">
							${main_core.Loc.getMessage('VIBECODECONNECTOR_CATALOG_COMPANY_EMPTY_TITLE')}
						</p>
					</div>
				</div>
			</div>
		`;
		}
	}

	class CatalogPopupMyListEmptyState {
		render() {
			return main_core.Tag.render`
			<div class="vibecode-catalog__content-empty-state">
				<div class="vibecode-catalog__popup-empty-state vibecode-catalog__popup-empty-state--content">
					<div class="vibecode-catalog__popup-empty-state-text">
						<h4 class="vibecode-catalog__popup-empty-state-title ui-headline --sm">
							${main_core.Loc.getMessage('VIBECODECONNECTOR_CATALOG_POPUP_EMPTY_TITLE')}
						</h4>
						<p class="vibecode-catalog__popup-empty-state-description ui-text --sm">
							${main_core.Loc.getMessage('VIBECODECONNECTOR_CATALOG_POPUP_EMPTY_DESCRIPTION')}
						</p>
					</div>
					${this.#renderActionButton()}
				</div>
			</div>
		`;
		}
		#renderActionButton() {
			const actionButton = new ui_buttons.Button({
				className: 'vibecode-catalog__popup-empty-state-button',
				size: ui_buttons.ButtonSize.MEDIUM,
				useAirDesign: true,
				style: ui_buttons.AirButtonStyle.FILLED,
				text: main_core.Loc.getMessage('VIBECODECONNECTOR_CATALOG_POPUP_EMPTY_BUTTON'),
				props: {
					type: 'button'
				}
			}).render();
			main_core.Event.bind(actionButton, 'click', event => {
				event.preventDefault();
				sendCatalogAnalytics({
					event: 'click_vibecode',
					c_section: 'content_empty_state'
				});
				openVibecodeDashboard();
			});
			return actionButton;
		}
	}

	function createCounter(value, options = {}) {
		return new ui_cnt.Counter({
			value,
			size: options.size ?? ui_cnt.Counter.Size.MEDIUM,
			style: options.style ?? ui_cnt.CounterStyle.FILLED,
			border: options.border === true,
			useAirDesign: true
		});
	}
	function renderTabCounter(value) {
		return main_core.Tag.render`
		<span class="vibecode-catalog__tab-counter">
			${createCounter(value, {
		border: true
	}).render()}
		</span>
	`;
	}
	function renderItemCounter(value) {
		return main_core.Tag.render`
		<span class="vibecode-catalog__item-counter">
			${createCounter(value, {
		size: ui_cnt.Counter.Size.LARGE
	}).render()}
		</span>
	`;
	}

	const MY_TAB_ID = 'my';

	class CatalogPopupItemPinButton {
		#item;
		#tab;
		#onPinToggled;
		#node = null;
		constructor(item, tab = null, options = {}) {
			this.#item = item;
			this.#tab = tab;
			this.#onPinToggled = options.onPinToggled ?? null;
		}
		canBePinned() {
			return this.#tab?.id === MY_TAB_ID && this.#item.isHidden !== true;
		}
		getMenuItem() {
			if (!this.canBePinned()) {
				return null;
			}
			return {
				title: main_core.Loc.getMessage(this.#item.isPinned ? 'VIBECODECONNECTOR_CATALOG_MENU_UNPIN' : 'VIBECODECONNECTOR_CATALOG_MENU_PIN'),
				onClick: () => this.toggle()
			};
		}
		render() {
			if (!this.canBePinned()) {
				return null;
			}
			if (this.#node === null) {
				this.#node = main_core.Tag.render`<button type="button"></button>`;
				main_core.Event.bind(this.#node, 'click', event => {
					event.preventDefault();
					event.stopPropagation();
					this.toggle();
				});
				main_core.Event.bind(this.#node, 'keydown', event => {
					event.stopPropagation();
				});
			}
			this.#syncNode();
			return this.#node;
		}
		toggle() {
			const action = this.#item.isPinned ? 'vibecodeconnector.Catalog.unpin' : 'vibecodeconnector.Catalog.pin';
			this.#item.isPinned = !this.#item.isPinned;
			this.#syncNode();
			this.#onPinToggled?.();
			main_core.ajax.runAction(action, {
				data: {
					...this.#tab?.extraData,
					catalogItemId: this.#item.id
				}
			}).catch(error => {
				this.#item.isPinned = !this.#item.isPinned;
				this.#syncNode();
				this.#onPinToggled?.();
				console.error('[vibecodeconnector.catalog] failed to toggle pin', this.#item.id, error);
			});
		}
		#syncNode() {
			if (!(this.#node instanceof HTMLButtonElement)) {
				return;
			}
			this.#node.className = `vibecode-catalog__item-pin-button${this.#item.isPinned ? ' vibecode-catalog__item-pin-button--pinned' : ''}`;
			this.#node.setAttribute('aria-label', main_core.Loc.getMessage(this.#item.isPinned ? 'VIBECODECONNECTOR_CATALOG_MENU_UNPIN' : 'VIBECODECONNECTOR_CATALOG_MENU_PIN'));
			main_core.Dom.clean(this.#node);
			main_core.Dom.append(renderIcon(this.#item.isPinned ? 's-pin' : 'so-pin', 16), this.#node);
		}
	}

	const UNDO_TOAST_DELAY_MS = 5000;
	class CatalogPopupItemHideAction {
		#item;
		#tab;
		#onHiddenToggled;
		#onHiddenCommitted;
		constructor(item, tab = null, options = {}) {
			this.#item = item;
			this.#tab = tab;
			this.#onHiddenToggled = options.onHiddenToggled ?? null;
			this.#onHiddenCommitted = options.onHiddenCommitted ?? null;
		}
		canBeHidden() {
			return this.#tab?.id === MY_TAB_ID && (this.#item.isMine !== true || this.#item.editUrl !== null);
		}
		getMenuItem() {
			if (!this.canBeHidden()) {
				return null;
			}
			return {
				title: main_core.Loc.getMessage(this.#item.isHidden ? 'VIBECODECONNECTOR_CATALOG_MENU_UNHIDE' : 'VIBECODECONNECTOR_CATALOG_MENU_HIDE'),
				onClick: () => {
					if (this.#item.isHidden) {
						this.#unhide();
					} else {
						this.#hide();
					}
				}
			};
		}
		#hide() {
			const wasPinned = this.#item.isPinned;
			this.#item.isHidden = true;
			this.#item.isPinned = false;
			this.#onHiddenToggled?.();
			this.#runAction('vibecodeconnector.Catalog.hide').then(() => {
				this.#showUndoToast(wasPinned);
				this.#onHiddenCommitted?.();
			}).catch(error => {
				this.#item.isHidden = false;
				this.#item.isPinned = wasPinned;
				this.#onHiddenToggled?.();
				this.#showError();
				console.error('[vibecodeconnector.catalog] failed to hide', this.#item.id, error);
			});
		}
		#unhide() {
			this.#item.isHidden = false;
			this.#onHiddenToggled?.();
			this.#runAction('vibecodeconnector.Catalog.unhide').then(() => {
				this.#onHiddenCommitted?.();
			}).catch(error => {
				this.#item.isHidden = true;
				this.#onHiddenToggled?.();
				this.#showError();
				console.error('[vibecodeconnector.catalog] failed to unhide', this.#item.id, error);
			});
		}
		#showUndoToast(wasPinned) {
			ui_notification.Center.notify({
				content: main_core.Loc.getMessage('VIBECODECONNECTOR_CATALOG_HIDE_TOAST'),
				autoHideDelay: UNDO_TOAST_DELAY_MS,
				actions: [{
					title: main_core.Loc.getMessage('VIBECODECONNECTOR_CATALOG_HIDE_TOAST_UNDO'),
					events: {
						click: (event, balloon) => {
							balloon?.close();
							this.#undoHide(wasPinned);
						}
					}
				}]
			});
		}
		#undoHide(wasPinned) {
			this.#item.isHidden = false;
			this.#item.isPinned = wasPinned;
			this.#onHiddenToggled?.();
			this.#runAction('vibecodeconnector.Catalog.unhide').then(() => {
				if (!wasPinned) {
					return null;
				}
				return this.#runAction('vibecodeconnector.Catalog.pin').catch(error => {
					this.#item.isPinned = false;
					this.#onHiddenToggled?.();
					this.#showError();
					console.error('[vibecodeconnector.catalog] failed to restore pin on undo', this.#item.id, error);
				});
			}).then(() => {
				this.#onHiddenCommitted?.();
			}).catch(error => {
				this.#item.isHidden = true;
				this.#item.isPinned = false;
				this.#onHiddenToggled?.();
				this.#showError();
				console.error('[vibecodeconnector.catalog] failed to undo hide', this.#item.id, error);
			});
		}
		#runAction(action) {
			return main_core.ajax.runAction(action, {
				data: {
					...this.#tab?.extraData,
					catalogItemId: this.#item.id
				}
			});
		}
		#showError() {
			ui_notification.Center.notify({
				content: main_core.Loc.getMessage('VIBECODECONNECTOR_CATALOG_HIDE_ERROR')
			});
		}
	}

	class CatalogPopupItemDeleteAction {
		#item;
		#tab;
		constructor(item, tab = null) {
			this.#item = item;
			this.#tab = tab;
		}
		canBeDeleted() {
			return this.#tab?.id === MY_TAB_ID && this.#item.isMine === true && this.#item.editUrl !== null;
		}
		getMenuItem() {
			if (!this.canBeDeleted()) {
				return null;
			}
			return {
				title: main_core.Loc.getMessage('VIBECODECONNECTOR_CATALOG_MENU_DELETE'),
				onClick: () => this.#confirmDelete()
			};
		}
		#confirmDelete() {
			const content = main_core.Tag.render`
			<div class="vibecode-catalog__delete-dialog ui-text --sm" data-testid="vibecode-catalog-delete-dialog">
				${main_core.Loc.getMessage('VIBECODECONNECTOR_CATALOG_DELETE_DIALOG_TEXT')}
			</div>
		`;
			const cancelButton = new ui_buttons.Button({
				text: main_core.Loc.getMessage('VIBECODECONNECTOR_CATALOG_DELETE_DIALOG_CANCEL'),
				size: ui_buttons.ButtonSize.MEDIUM,
				style: ui_buttons.AirButtonStyle.OUTLINE,
				useAirDesign: true,
				dataset: {
					testid: 'vibecode-catalog-delete-dialog-cancel'
				},
				onclick: () => dialog.hide()
			});
			const confirmButton = new ui_buttons.Button({
				text: main_core.Loc.getMessage('VIBECODECONNECTOR_CATALOG_DELETE_DIALOG_CONFIRM'),
				size: ui_buttons.ButtonSize.MEDIUM,
				style: ui_buttons.AirButtonStyle.FILLED,
				useAirDesign: true,
				dataset: {
					testid: 'vibecode-catalog-delete-dialog-confirm'
				},
				onclick: () => {
					openUrl(this.#item.editUrl);
					dialog.hide();
				}
			});
			const dialog = new ui_system_dialog.Dialog({
				title: main_core.Loc.getMessage('VIBECODECONNECTOR_CATALOG_DELETE_DIALOG_TITLE'),
				content,
				width: 400,
				hasOverlay: true,
				rightButtons: [cancelButton, confirmButton]
			});
			dialog.show();
		}
	}

	const HEADER_BYTES = 1024 * 1024;
	async function readImageSize(file) {
		const buffer = await file.slice(0, HEADER_BYTES).arrayBuffer();
		const view = new DataView(buffer);
		return readPngSize(view) ?? readGifSize(view) ?? readBmpSize(view) ?? readWebpSize(view) ?? readJpegSize(view);
	}
	function ascii(view, offset, length) {
		if (offset + length > view.byteLength) {
			return '';
		}
		let out = '';
		for (let i = 0; i < length; i++) {
			out += String.fromCharCode(view.getUint8(offset + i));
		}
		return out;
	}
	function readPngSize(view) {
		if (view.byteLength < 24 || ascii(view, 1, 3) !== 'PNG') {
			return null;
		}
		return {
			width: view.getUint32(16),
			height: view.getUint32(20)
		};
	}
	function readGifSize(view) {
		if (view.byteLength < 10 || ascii(view, 0, 3) !== 'GIF') {
			return null;
		}
		return {
			width: view.getUint16(6, true),
			height: view.getUint16(8, true)
		};
	}
	function readBmpSize(view) {
		if (view.byteLength < 26 || ascii(view, 0, 2) !== 'BM') {
			return null;
		}
		return {
			width: Math.abs(view.getInt32(18, true)),
			height: Math.abs(view.getInt32(22, true))
		};
	}
	function readWebpSize(view) {
		if (view.byteLength < 30 || ascii(view, 0, 4) !== 'RIFF' || ascii(view, 8, 4) !== 'WEBP') {
			return null;
		}
		const chunk = ascii(view, 12, 4);
		if (chunk === 'VP8 ') {
			return {
				width: view.getUint16(26, true) & 0x3FFF,
				height: view.getUint16(28, true) & 0x3FFF
			};
		}
		if (chunk === 'VP8L') {
			const bits = view.getUint32(21, true);
			return {
				width: (bits & 0x3FFF) + 1,
				height: (bits >> 14 & 0x3FFF) + 1
			};
		}
		if (chunk === 'VP8X') {
			const width = view.getUint8(24) | view.getUint8(25) << 8 | view.getUint8(26) << 16;
			const height = view.getUint8(27) | view.getUint8(28) << 8 | view.getUint8(29) << 16;
			return {
				width: width + 1,
				height: height + 1
			};
		}
		return null;
	}
	function readJpegSize(view) {
		if (view.byteLength < 4 || view.getUint16(0) !== 0xFFD8) {
			return null;
		}
		let offset = 2;
		while (offset + 9 < view.byteLength) {
			if (view.getUint8(offset) !== 0xFF) {
				offset++;
				continue;
			}
			const marker = view.getUint8(offset + 1);
			if (marker >= 0xC0 && marker <= 0xCF && marker !== 0xC4 && marker !== 0xC8 && marker !== 0xCC) {
				return {
					width: view.getUint16(offset + 7),
					height: view.getUint16(offset + 5)
				};
			}
			if (marker === 0xFF || marker >= 0xD0 && marker <= 0xD9) {
				offset += marker === 0xFF ? 1 : 2;
				continue;
			}
			if (marker === 0xDA) {
				return null;
			}
			offset += 2 + view.getUint16(offset + 2);
		}
		return null;
	}

	const TITLE_MIN_LENGTH = 2;
	const TITLE_MAX_LENGTH = 100;
	const DESCRIPTION_MAX_LENGTH = 500;
	const ICON_ACTION_KEEP = 'keep';
	const ICON_ACTION_REPLACE = 'replace';
	const ICON_ACTION_DELETE = 'delete';
	const ICON_MAX_BYTES = 5 * 1024 * 1024;
	const ICON_MAX_PIXELS = 4_000_000;
	const ICON_ALLOWED_TYPES = new Set(['image/png', 'image/jpeg', 'image/gif', 'image/webp', 'image/bmp', 'image/x-ms-bmp']);
	const ICON_ACCEPT_ATTRIBUTE = 'image/png,image/jpeg,image/gif,image/webp,image/bmp';
	const ICON_PREVIEW_SIZE = 45;

	// eslint-disable-next-line no-control-regex
	const CONTROL_CHARS_REGEX = /[\u0000-\u001F\u007F]/;
	// eslint-disable-next-line no-control-regex
	const DESCRIPTION_CONTROL_CHARS_REGEX = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/;
	const DESCRIPTION_ROWS = 4;
	function validateRenameInput(title, description, initial = {}) {
		const trimmedTitle = String(title ?? '').trim();
		const trimmedDescription = String(description ?? '').trim();
		const titleChanged = initial.title === undefined || trimmedTitle !== String(initial.title ?? '').trim();
		const descriptionChanged = initial.description === undefined || trimmedDescription !== String(initial.description ?? '').trim();
		const titleLength = Array.from(trimmedTitle).length;
		if (titleChanged && titleLength < TITLE_MIN_LENGTH) {
			return {
				field: 'title',
				message: main_core.Loc.getMessagePlural('VIBECODECONNECTOR_CATALOG_RENAME_ERROR_TITLE_MIN', TITLE_MIN_LENGTH, {
					'#MIN#': String(TITLE_MIN_LENGTH)
				})
			};
		}
		if (titleChanged && titleLength > TITLE_MAX_LENGTH) {
			return {
				field: 'title',
				message: main_core.Loc.getMessagePlural('VIBECODECONNECTOR_CATALOG_RENAME_ERROR_TITLE_MAX', TITLE_MAX_LENGTH, {
					'#MAX#': String(TITLE_MAX_LENGTH)
				})
			};
		}
		if (titleChanged && CONTROL_CHARS_REGEX.test(trimmedTitle)) {
			return {
				field: 'title',
				message: main_core.Loc.getMessage('VIBECODECONNECTOR_CATALOG_RENAME_ERROR_TITLE_CONTROL')
			};
		}
		if (!descriptionChanged) {
			return null;
		}
		if (Array.from(String(description ?? '')).length > DESCRIPTION_MAX_LENGTH) {
			return {
				field: 'description',
				message: main_core.Loc.getMessagePlural('VIBECODECONNECTOR_CATALOG_RENAME_ERROR_DESCRIPTION_MAX', DESCRIPTION_MAX_LENGTH, {
					'#MAX#': String(DESCRIPTION_MAX_LENGTH)
				})
			};
		}
		if (DESCRIPTION_CONTROL_CHARS_REGEX.test(String(description ?? ''))) {
			return {
				field: 'description',
				message: main_core.Loc.getMessage('VIBECODECONNECTOR_CATALOG_RENAME_ERROR_DESCRIPTION_CONTROL')
			};
		}
		return null;
	}
	function validateIconFile(file) {
		if (file.size > ICON_MAX_BYTES) {
			return main_core.Loc.getMessage('VIBECODECONNECTOR_CATALOG_RENAME_ERROR_ICON_SIZE');
		}
		const type = String(file.type ?? '');
		if (type !== '' && type !== 'application/octet-stream' && !ICON_ALLOWED_TYPES.has(type)) {
			return main_core.Loc.getMessage('VIBECODECONNECTOR_CATALOG_RENAME_ERROR_ICON_FORMAT');
		}
		return null;
	}
	class CatalogRenameDialog {
		#titleInput;
		#descriptionInput;
		#initialTitle;
		#initialDescription;
		#onSubmit;
		#dialog = null;
		#saveButton = null;
		#cancelButton = null;
		#errorNode = null;
		#submitting = false;
		#iconUrl;
		#iconColor;
		#iconAction = ICON_ACTION_KEEP;
		#iconFile = null;
		#iconError = '';
		#iconPreviewUrl = null;
		#iconPreviewNode = null;
		#iconErrorNode = null;
		#iconFileInput = null;
		#iconDeleteButton = null;
		#iconPickGeneration = 0;
		#iconPending = false;
		constructor(options) {
			this.#onSubmit = options.onSubmit;
			this.#iconUrl = options.iconUrl ?? null;
			this.#iconColor = options.color ?? null;
			this.#initialTitle = options.title ?? '';
			this.#titleInput = new ui_system_input.Input({
				value: options.title ?? '',
				label: main_core.Loc.getMessage('VIBECODECONNECTOR_CATALOG_RENAME_TITLE_LABEL'),
				placeholder: main_core.Loc.getMessage('VIBECODECONNECTOR_CATALOG_RENAME_TITLE_PLACEHOLDER'),
				size: ui_system_input.InputSize.Md,
				stretched: true,
				required: true,
				active: true,
				dataTestId: 'vibecode-catalog-rename-title'
			});
			const descriptionValue = options.isDescriptionDefault === true ? '' : options.description ?? '';
			this.#initialDescription = descriptionValue;
			this.#descriptionInput = new ui_system_input.Input({
				value: '',
				label: main_core.Loc.getMessage('VIBECODECONNECTOR_CATALOG_RENAME_DESCRIPTION_LABEL'),
				placeholder: main_core.Loc.getMessage('VIBECODECONNECTOR_CATALOG_RENAME_DESCRIPTION_PLACEHOLDER'),
				size: ui_system_input.InputSize.Md,
				stretched: true,
				rowsQuantity: DESCRIPTION_ROWS,
				resize: 'vertical',
				dataTestId: 'vibecode-catalog-rename-description'
			});
			this.#descriptionInput.render();
			this.#descriptionInput.setValue(descriptionValue);
		}
		show() {
			if (this.#dialog === null) {
				this.#saveButton = new ui_buttons.Button({
					text: main_core.Loc.getMessage('VIBECODECONNECTOR_CATALOG_RENAME_SAVE'),
					useAirDesign: true,
					style: ui_buttons.AirButtonStyle.FILLED,
					size: ui_buttons.ButtonSize.MEDIUM,
					onclick: () => this.submit()
				});
				this.#cancelButton = new ui_buttons.Button({
					text: main_core.Loc.getMessage('VIBECODECONNECTOR_CATALOG_RENAME_CANCEL'),
					useAirDesign: true,
					style: ui_buttons.AirButtonStyle.OUTLINE,
					size: ui_buttons.ButtonSize.MEDIUM,
					onclick: () => this.hide()
				});
				this.#dialog = new ui_system_dialog.Dialog({
					title: main_core.Loc.getMessage('VIBECODECONNECTOR_CATALOG_RENAME_DIALOG_TITLE'),
					content: this.#renderContent(),
					hasOverlay: true,
					closeByEsc: true,
					closeByClickOutside: true,
					leftButtons: [this.#cancelButton],
					rightButtons: [this.#saveButton],
					events: {
						onAfterShow: () => this.#titleInput.focus(),
						onAfterHide: () => this.#onHidden()
					}
				});
			}
			this.#dialog.show();
		}
		hide() {
			this.#iconPickGeneration++;
			this.#iconPending = false;
			this.#dialog?.hide();
		}
		#onHidden() {
			this.#iconPickGeneration++;
			this.#iconPending = false;
			this.#releaseIconPreview();
		}
		getPayload() {
			const title = this.#titleInput.getValue().trim();
			const description = this.#descriptionInput.getValue();
			return {
				title,
				description,
				titleChanged: title !== this.#initialTitle.trim(),
				descriptionChanged: description.trim() !== this.#initialDescription.trim(),
				iconAction: this.#iconAction,
				iconFile: this.#iconAction === ICON_ACTION_REPLACE ? this.#iconFile : null
			};
		}
		getFieldError(field) {
			return field === 'description' ? this.#descriptionInput.getError() : this.#titleInput.getError();
		}
		getIconError() {
			return this.#iconError;
		}
		isIconDeletable() {
			if (this.#iconAction === ICON_ACTION_REPLACE) {
				return this.#iconFile !== null;
			}
			return this.#iconAction === ICON_ACTION_KEEP && this.#iconUrl !== null;
		}
		async selectIconFile(file) {
			const generation = ++this.#iconPickGeneration;
			this.#iconPending = false;
			const error = validateIconFile(file);
			if (error !== null) {
				this.#setIconError(error);
				this.#syncIconControls();
				return;
			}
			this.#iconPending = true;
			this.#syncIconControls();
			let size = null;
			try {
				size = await readImageSize(file);
			} catch {
				if (generation !== this.#iconPickGeneration) {
					return;
				}
				this.#iconPending = false;
				this.#setIconError(main_core.Loc.getMessage('VIBECODECONNECTOR_CATALOG_RENAME_ERROR_ICON_READ'));
				this.#syncIconControls();
				return;
			}
			if (generation !== this.#iconPickGeneration) {
				return;
			}
			this.#iconPending = false;
			if (size !== null && size.width * size.height > ICON_MAX_PIXELS) {
				this.#setIconError(main_core.Loc.getMessage('VIBECODECONNECTOR_CATALOG_RENAME_ERROR_ICON_PIXELS'));
				this.#syncIconControls();
				return;
			}
			this.#setIconError('');
			this.#iconAction = ICON_ACTION_REPLACE;
			this.#iconFile = file;
			this.#showIconPreview(URL.createObjectURL(file));
			this.#syncIconControls();
		}
		deleteIcon() {
			this.#iconPickGeneration++;
			this.#iconPending = false;
			this.#setIconError('');
			this.#iconAction = ICON_ACTION_DELETE;
			this.#iconFile = null;
			this.#releaseIconPreview();
			this.#renderIconPreview();
			this.#syncIconControls();
		}
		submit() {
			if (this.#submitting || this.#iconPending) {
				return;
			}
			this.#setIconError('');
			const payload = this.getPayload();
			if (!this.#validate(payload)) {
				return;
			}
			this.#clearServerError();
			this.#setSubmitting(true);
			Promise.resolve(this.#onSubmit(payload)).then(() => {
				this.hide();
			}).catch(error => {
				this.#setSubmitting(false);
				this.#showServerError(error?.message);
			});
		}
		#validate(payload) {
			this.#titleInput.setError('');
			this.#descriptionInput.setError('');
			const error = validateRenameInput(payload.title, payload.description, {
				title: this.#initialTitle,
				description: this.#initialDescription
			});
			if (error === null) {
				return true;
			}
			if (error.field === 'description') {
				this.#descriptionInput.setError(error.message);
			} else {
				this.#titleInput.setError(error.message);
			}
			return false;
		}
		#renderContent() {
			this.#errorNode = main_core.Tag.render`
			<div
				class="vibecode-catalog__rename-error ui-text --xs"
				data-testid="vibecode-catalog-rename-error"
				role="alert"
				aria-live="polite"
				hidden
			></div>
		`;
			return main_core.Tag.render`
			<div class="vibecode-catalog__rename-form" data-testid="vibecode-catalog-rename-form">
				${this.#renderIconBlock()}
				${this.#titleInput.render()}
				${this.#descriptionInput.render()}
				${this.#errorNode}
			</div>
		`;
		}
		#renderIconBlock() {
			const uploadButton = new ui_buttons.Button({
				text: main_core.Loc.getMessage('VIBECODECONNECTOR_CATALOG_RENAME_ICON_UPLOAD'),
				useAirDesign: true,
				style: ui_buttons.AirButtonStyle.OUTLINE,
				size: ui_buttons.ButtonSize.SMALL,
				onclick: () => {
					this.#setIconError('');
					this.#iconFileInput?.click();
				}
			});
			this.#iconDeleteButton = new ui_buttons.Button({
				text: main_core.Loc.getMessage('VIBECODECONNECTOR_CATALOG_RENAME_ICON_DELETE'),
				useAirDesign: true,
				style: ui_buttons.AirButtonStyle.PLAIN_NO_ACCENT,
				size: ui_buttons.ButtonSize.SMALL,
				onclick: () => this.deleteIcon()
			});
			this.#iconFileInput = main_core.Tag.render`
			<input
				class="vibecode-catalog__rename-icon-input"
				type="file"
				accept="${ICON_ACCEPT_ATTRIBUTE}"
				tabindex="-1"
				aria-hidden="true"
				data-testid="vibecode-catalog-rename-icon-input"
			/>
		`;
			main_core.Event.bind(this.#iconFileInput, 'change', () => {
				const file = this.#iconFileInput?.files?.[0] ?? null;
				if (file !== null) {
					this.selectIconFile(file);
				}
				this.#iconFileInput.value = '';
			});
			this.#iconPreviewNode = main_core.Tag.render`
			<span
				class="vibecode-catalog__rename-icon-preview"
				style="${this.#iconColor === null ? '' : `--vibecode-catalog-item-icon-background: ${this.#iconColor};`}"
				data-testid="vibecode-catalog-rename-icon-preview"
			></span>
		`;
			this.#renderIconPreview();
			this.#iconErrorNode = main_core.Tag.render`
			<div
				class="vibecode-catalog__rename-icon-error ui-text --xs"
				data-testid="vibecode-catalog-rename-icon-error"
				role="alert"
				aria-live="polite"
				hidden
			></div>
		`;
			const block = main_core.Tag.render`
			<div class="vibecode-catalog__rename-icon" data-testid="vibecode-catalog-rename-icon">
				<div class="vibecode-catalog__rename-icon-label ui-text --xs">
					${main_core.Loc.getMessage('VIBECODECONNECTOR_CATALOG_RENAME_ICON_LABEL')}
				</div>
				<div class="vibecode-catalog__rename-icon-row">
					${this.#iconPreviewNode}
					<div class="vibecode-catalog__rename-icon-buttons">
						${uploadButton.render()}
						${this.#iconDeleteButton.render()}
					</div>
					${this.#iconFileInput}
				</div>
				${this.#iconErrorNode}
			</div>
		`;
			this.#syncIconControls();
			return block;
		}
		#renderIconPreview() {
			if (!this.#iconPreviewNode) {
				return;
			}
			const source = this.#iconPreviewUrl ?? (this.#iconAction === ICON_ACTION_DELETE ? null : this.#iconUrl);
			const content = source === null ? renderIcon('apps', ICON_PREVIEW_SIZE) : main_core.Tag.render`
				<img
					class="vibecode-catalog__rename-icon-img"
					src="${source}"
					alt="${main_core.Loc.getMessage('VIBECODECONNECTOR_CATALOG_RENAME_ICON_ALT')}"
				/>
			`;
			main_core.Dom.clean(this.#iconPreviewNode);
			main_core.Dom.append(content, this.#iconPreviewNode);
		}
		#showIconPreview(objectUrl) {
			this.#releaseIconPreview();
			this.#iconPreviewUrl = objectUrl;
			this.#renderIconPreview();
		}
		#releaseIconPreview() {
			if (this.#iconPreviewUrl === null) {
				return;
			}
			URL.revokeObjectURL(this.#iconPreviewUrl);
			this.#iconPreviewUrl = null;
		}
		#syncIconControls() {
			this.#iconDeleteButton?.setDisabled(this.#iconPending || !this.isIconDeletable());
			this.#saveButton?.setDisabled(this.#submitting || this.#iconPending);
		}
		#setIconError(message) {
			this.#iconError = message;
			if (!this.#iconErrorNode) {
				return;
			}
			this.#iconErrorNode.textContent = message;
			if (message === '') {
				this.#iconErrorNode.setAttribute('hidden', '');
			} else {
				this.#iconErrorNode.removeAttribute('hidden');
			}
		}
		#setSubmitting(submitting) {
			this.#submitting = submitting;
			this.#saveButton?.setWaiting(submitting);
			this.#saveButton?.setDisabled(submitting);
			this.#cancelButton?.setDisabled(submitting);
		}
		#showServerError(message) {
			if (!this.#errorNode) {
				return;
			}
			this.#errorNode.textContent = message ?? main_core.Loc.getMessage('VIBECODECONNECTOR_CATALOG_RENAME_ERROR_GENERIC');
			this.#errorNode.removeAttribute('hidden');
		}
		#clearServerError() {
			if (!this.#errorNode) {
				return;
			}
			this.#errorNode.textContent = '';
			this.#errorNode.setAttribute('hidden', '');
		}
	}

	const KIND_APPLICATION$1 = 'application';
	const UPDATE_ACTION = 'vibecodeconnector.Catalog.update';
	class CatalogPopupItemRenameAction {
		#item;
		#tab;
		#onRenamed;
		#sendAnalytics;
		#dialog = null;
		constructor(item, tab = null, options = {}) {
			this.#item = item;
			this.#tab = tab;
			this.#onRenamed = options.onRenamed ?? null;
			this.#sendAnalytics = options.sendAnalytics ?? sendCatalogAnalytics;
		}
		canBeRenamed() {
			if (this.#tab?.extraData?.previewUserId) {
				return false;
			}
			return this.#item.isMine === true && this.#item.kind === KIND_APPLICATION$1;
		}
		getMenuItem() {
			if (!this.canBeRenamed()) {
				return null;
			}
			return {
				title: main_core.Loc.getMessage('VIBECODECONNECTOR_CATALOG_MENU_EDIT'),
				onClick: () => this.#openDialog()
			};
		}
		#openDialog() {
			this.#dialog = new CatalogRenameDialog({
				title: this.#item.title,
				description: this.#item.description,
				isDescriptionDefault: this.#item.isDescriptionDefault === true,
				iconUrl: this.#item.iconUrl,
				color: this.#item.color,
				onSubmit: payload => this.submitRename(payload)
			});
			this.#dialog.show();
		}
		submitRename(payload) {
			return main_core.ajax.runAction(UPDATE_ACTION, {
				data: this.#buildFormData(payload)
			}).catch(rejection => {
				throw new Error(this.#firstErrorMessage(rejection));
			}).then(response => {
				if (this.#hasErrors(response)) {
					throw new Error(this.#firstErrorMessage(response));
				}
				this.#applyServerItem(response);
				this.#dialog?.hide();
				this.#showSuccessToast();
				this.#sendAnalyticsSafely();
				this.#notifyRenamedSafely();
			});
		}
		#buildFormData(payload) {
			const formData = new FormData();
			formData.append('catalogItemId', String(this.#item.id));
			if (payload.titleChanged) {
				formData.append('title', payload.title);
			}
			if (payload.descriptionChanged) {
				formData.append('description', payload.description);
			}
			formData.append('iconAction', payload.iconAction);
			if (payload.iconAction === ICON_ACTION_REPLACE && payload.iconFile !== null) {
				formData.append('icon', payload.iconFile);
			}
			return formData;
		}
		#applyServerItem(response) {
			const item = response?.data?.item;
			if (!main_core.Type.isPlainObject(item)) {
				return;
			}
			if (main_core.Type.isStringFilled(item.title)) {
				this.#item.title = item.title;
			}
			this.#item.description = main_core.Type.isStringFilled(item.description) ? item.description : null;
			this.#item.isDescriptionDefault = item.isDescriptionDefault === true;
			if (item.iconUrl !== undefined) {
				this.#item.iconUrl = main_core.Type.isStringFilled(item.iconUrl) ? item.iconUrl : null;
			}
		}
		#sendAnalyticsSafely() {
			try {
				this.#sendAnalytics({
					event: 'rename_app',
					c_section: 'menu'
				});
			} catch (error) {
				console.error('[vibecodeconnector.catalog] rename analytics failed', this.#item.id, error);
			}
		}
		#notifyRenamedSafely() {
			try {
				this.#onRenamed?.();
			} catch (error) {
				console.error('[vibecodeconnector.catalog] rename re-render failed', this.#item.id, error);
			}
		}
		#showSuccessToast() {
			ui_notification.Center.notify({
				content: main_core.Loc.getMessage('VIBECODECONNECTOR_CATALOG_RENAME_SUCCESS'),
				autoHide: true
			});
		}
		#hasErrors(response) {
			return main_core.Type.isArrayFilled(response?.errors);
		}
		#firstErrorMessage(response) {
			const first = response?.errors?.[0];
			return main_core.Type.isStringFilled(first?.message) ? first.message : main_core.Loc.getMessage('VIBECODECONNECTOR_CATALOG_RENAME_ERROR_GENERIC');
		}
	}

	class CatalogShareApi {
		getShare(catalogItemId) {
			return main_core.ajax.runAction('vibecodeconnector.Catalog.getShare', {
				data: {
					catalogItemId
				}
			}).then(response => response.data.share);
		}
		setShare(catalogItemId, share) {
			const data = {
				catalogItemId,
				audience: share.audience
			};
			if (share.users.length > 0) {
				data.users = share.users;
			}
			if (share.departments.length > 0) {
				data.departments = share.departments;
			}
			return main_core.ajax.runAction('vibecodeconnector.Catalog.setShare', {
				data
			}).then(response => response.data.share);
		}
		getLink(catalogItemId) {
			return main_core.ajax.runAction('vibecodeconnector.Catalog.getLink', {
				data: {
					catalogItemId
				}
			}).then(response => response.data.linkState);
		}
		setLink(catalogItemId, payload) {
			const data = {
				catalogItemId,
				enabled: payload.enabled ? 1 : 0
			};
			if (payload.enabled) {
				data.requireB24Auth = payload.requireB24Auth ? 1 : 0;
				if (payload.expiresAt !== null) {
					data.expiresAt = payload.expiresAt;
				}
			}
			return main_core.ajax.runAction('vibecodeconnector.Catalog.setLink', {
				data
			}).then(response => response.data.linkState);
		}
	}
	const catalogShareApi = new CatalogShareApi();

	const Audience = Object.freeze({
		OwnerOnly: 'OWNER_ONLY',
		SpecificMembers: 'SPECIFIC_MEMBERS',
		Portal: 'PORTAL',
		Authenticated: 'AUTHENTICATED',
		Public: 'PUBLIC'
	});
	const LinkAvailability = Object.freeze({
		Available: 'AVAILABLE',
		Unavailable: 'UNAVAILABLE'
	});

	const LINK_EXPIRY_MIN_OFFSET_SECONDS = 5 * 60;
	const LINK_EXPIRY_MAX_OFFSET_SECONDS = 315_360_000;
	function createDefaultLinkExpiry(now = new Date()) {
		const expiry = new Date(now.getTime());
		const day = expiry.getUTCDate();
		expiry.setUTCDate(1);
		expiry.setUTCMonth(expiry.getUTCMonth() + 1);
		const lastDay = new Date(Date.UTC(expiry.getUTCFullYear(), expiry.getUTCMonth() + 1, 0)).getUTCDate();
		expiry.setUTCDate(Math.min(day, lastDay));
		return expiry;
	}
	function createEnabledLinkPayload(expiresAt, requireB24Auth, now = new Date()) {
		if (expiresAt === null) {
			return {
				enabled: true,
				expiresAt: null,
				requireB24Auth
			};
		}
		const offset = expiresAt.getTime() - now.getTime();
		if (!Number.isFinite(offset) || offset < LINK_EXPIRY_MIN_OFFSET_SECONDS * 1000) {
			throw new Error('LINK_EXPIRY_TOO_SOON');
		}
		if (offset > LINK_EXPIRY_MAX_OFFSET_SECONDS * 1000) {
			throw new Error('LINK_EXPIRY_TOO_LATE');
		}
		return {
			enabled: true,
			expiresAt: expiresAt.toISOString(),
			requireB24Auth
		};
	}
	const CatalogShareViewState = Object.freeze({
		Loading: 'loading',
		LoadError: 'loadError',
		Audience: 'audience',
		MemberDraft: 'memberDraft',
		SavingShare: 'savingShare',
		RefreshingLink: 'refreshingLink',
		GeneratingDefaultLink: 'generatingDefaultLink',
		LinkSettings: 'linkSettings',
		ConfirmAnonymousLink: 'confirmAnonymousLink',
		ConfirmPortalLinkRevoke: 'confirmPortalLinkRevoke',
		SavingLink: 'savingLink',
		Closed: 'closed'
	});
	const GLOBAL_AUDIENCES = new Set([Audience.Authenticated, Audience.Public]);
	function cloneParticipants(participants) {
		return participants.map(participant => ({
			...participant
		}));
	}
	function cloneShare(share) {
		return {
			audience: share.audience,
			users: cloneParticipants(share.users),
			departments: cloneParticipants(share.departments)
		};
	}
	function deduplicateParticipants(participants) {
		const uniqueParticipants = new Map();
		participants.forEach(participant => {
			const id = String(participant.id);
			if (!uniqueParticipants.has(id)) {
				uniqueParticipants.set(id, {
					id,
					name: participant.name
				});
			}
		});
		return [...uniqueParticipants.values()];
	}
	function haveSameParticipantIds(left, right) {
		if (left.length !== right.length) {
			return false;
		}
		const rightIds = new Set(right.map(participant => String(participant.id)));
		return left.every(participant => rightIds.has(String(participant.id)));
	}
	class CatalogShareStateMachine {
		#status = CatalogShareViewState.Loading;
		#share = null;
		#linkState = null;
		#draftShare = null;
		#specificMembersDraft = {
			audience: Audience.SpecificMembers,
			users: [],
			departments: []
		};
		#errorCode = null;
		#pendingAudience = null;
		#ownerOnlyConfirmationRequired = false;
		#previousEditableState = null;
		#linkSettingsReturnState = null;
		#linkDraft = null;
		getSnapshot() {
			return {
				status: this.#status,
				share: this.#share,
				linkState: this.#linkState,
				draftShare: this.#draftShare === null ? null : cloneShare(this.#draftShare),
				errorCode: this.#errorCode,
				pendingAudience: this.#pendingAudience,
				ownerOnlyConfirmationRequired: this.#ownerOnlyConfirmationRequired,
				linkDraft: this.#linkDraft === null ? null : {
					expiryEnabled: this.#linkDraft.expiryEnabled,
					lastFiniteExpiresAt: new Date(this.#linkDraft.lastFiniteExpiresAt.getTime()),
					requireB24Auth: this.#linkDraft.requireB24Auth
				},
				isShareDraftDirty: this.#isShareDraftDirty(),
				isLinkDraftDirty: this.#isLinkDraftDirty()
			};
		}
		beginLoading() {
			if (this.#status === CatalogShareViewState.Loading || this.#status === CatalogShareViewState.SavingShare || this.#status === CatalogShareViewState.RefreshingLink || this.#status === CatalogShareViewState.GeneratingDefaultLink || this.#status === CatalogShareViewState.SavingLink || this.#status === CatalogShareViewState.Closed) {
				return false;
			}
			this.#status = CatalogShareViewState.Loading;
			this.#errorCode = null;
			return true;
		}
		completeLoading(share, linkState) {
			if (this.#status !== CatalogShareViewState.Loading) {
				return false;
			}
			this.#replaceCanonicalShare(share);
			this.#linkState = linkState;
			this.#status = share.audience === Audience.SpecificMembers ? CatalogShareViewState.MemberDraft : CatalogShareViewState.Audience;
			this.#errorCode = null;
			return true;
		}
		failLoading(errorCode) {
			if (this.#status !== CatalogShareViewState.Loading) {
				return false;
			}
			this.#status = CatalogShareViewState.LoadError;
			this.#errorCode = errorCode;
			return true;
		}
		retryLoading() {
			if (this.#status !== CatalogShareViewState.LoadError) {
				return false;
			}
			this.#status = CatalogShareViewState.Loading;
			this.#errorCode = null;
			return true;
		}
		selectAudience(audience) {
			if (!this.#isAudienceEditable()) {
				return false;
			}
			if (GLOBAL_AUDIENCES.has(audience) && this.#hasActiveLink()) {
				this.#pendingAudience = audience;
				return false;
			}
			this.#applyAudience(audience);
			return true;
		}
		confirmLinkRevoke() {
			if (!this.#isAudienceEditable() || this.#pendingAudience === null) {
				return false;
			}
			const audience = this.#pendingAudience;
			this.#pendingAudience = null;
			this.#applyAudience(audience);
			return true;
		}
		cancelLinkRevoke() {
			if (this.#pendingAudience === null) {
				return false;
			}
			this.#pendingAudience = null;
			return true;
		}
		setMembers(users, departments) {
			if (this.#status !== CatalogShareViewState.MemberDraft || this.#draftShare === null) {
				return false;
			}
			const previousMemberCount = this.#getMemberCount();
			this.#specificMembersDraft = {
				audience: Audience.SpecificMembers,
				users: deduplicateParticipants(users),
				departments: deduplicateParticipants(departments)
			};
			this.#draftShare = cloneShare(this.#specificMembersDraft);
			this.#ownerOnlyConfirmationRequired = previousMemberCount > 0 && this.#getMemberCount() === 0;
			this.#errorCode = null;
			return true;
		}
		confirmOwnerOnly() {
			if (!this.#ownerOnlyConfirmationRequired || !this.#isAudienceEditable()) {
				return false;
			}
			this.#ownerOnlyConfirmationRequired = false;
			this.#applyAudience(Audience.OwnerOnly);
			return true;
		}
		cancelOwnerOnly() {
			if (!this.#ownerOnlyConfirmationRequired) {
				return false;
			}
			this.#ownerOnlyConfirmationRequired = false;
			return true;
		}
		setEditableError(errorCode) {
			if (!this.#isAudienceEditable()) {
				return false;
			}
			this.#errorCode = errorCode;
			return true;
		}
		beginShareSave() {
			if (!this.#isAudienceEditable() || this.#draftShare === null) {
				throw new Error('SHARE_NOT_EDITABLE');
			}
			if (this.#draftShare.audience === Audience.SpecificMembers && this.#getMemberCount() === 0) {
				throw new Error('EMPTY_PARTICIPANTS');
			}
			this.#previousEditableState = this.#status;
			this.#status = CatalogShareViewState.SavingShare;
			this.#errorCode = null;
			return cloneShare(this.#draftShare);
		}
		completeShareSave(share) {
			if (this.#status !== CatalogShareViewState.SavingShare) {
				return false;
			}
			this.#replaceCanonicalShare(share);
			this.#status = CatalogShareViewState.RefreshingLink;
			return true;
		}
		completeLinkRefresh(linkState) {
			if (this.#status !== CatalogShareViewState.RefreshingLink) {
				return false;
			}
			this.#linkState = linkState;
			this.#status = this.#draftShare?.audience === Audience.SpecificMembers ? CatalogShareViewState.MemberDraft : CatalogShareViewState.Audience;
			this.#previousEditableState = null;
			return true;
		}
		openLinkSettings(now = new Date()) {
			if (!this.#isAudienceEditable() || this.#linkState?.availability !== LinkAvailability.Available) {
				return false;
			}
			this.#linkSettingsReturnState = this.#status;
			this.#linkDraft = this.#createLinkDraft(now);
			this.#status = this.#linkState.link === null ? CatalogShareViewState.GeneratingDefaultLink : CatalogShareViewState.LinkSettings;
			this.#errorCode = null;
			return true;
		}
		prepareDefaultLinkGeneration(now = new Date()) {
			if (this.#status !== CatalogShareViewState.GeneratingDefaultLink) {
				throw new Error('LINK_GENERATION_NOT_ACTIVE');
			}
			return createEnabledLinkPayload(createDefaultLinkExpiry(now), true, now);
		}
		completeDefaultLinkGeneration(linkState, now = new Date()) {
			if (this.#status !== CatalogShareViewState.GeneratingDefaultLink) {
				return false;
			}
			this.#linkState = linkState;
			this.#linkDraft = this.#createLinkDraft(now);
			this.#status = CatalogShareViewState.LinkSettings;
			this.#errorCode = null;
			return true;
		}
		failDefaultLinkGeneration(errorCode) {
			if (this.#status !== CatalogShareViewState.GeneratingDefaultLink) {
				return false;
			}
			this.#status = CatalogShareViewState.LinkSettings;
			this.#errorCode = errorCode;
			return true;
		}
		closeLinkSettings() {
			if (this.#status !== CatalogShareViewState.LinkSettings && this.#status !== CatalogShareViewState.ConfirmAnonymousLink && this.#status !== CatalogShareViewState.ConfirmPortalLinkRevoke) {
				return false;
			}
			this.#status = this.#linkSettingsReturnState ?? CatalogShareViewState.Audience;
			this.#linkSettingsReturnState = null;
			this.#linkDraft = null;
			this.#errorCode = null;
			return true;
		}
		setLinkExpiry(expiresAt) {
			if (this.#status !== CatalogShareViewState.LinkSettings || this.#linkDraft === null) {
				return false;
			}
			this.#linkDraft.lastFiniteExpiresAt = new Date(expiresAt.getTime());
			this.#errorCode = null;
			return true;
		}
		setLinkExpiryEnabled(expiryEnabled) {
			if (this.#status !== CatalogShareViewState.LinkSettings || this.#linkDraft === null || !main_core.Type.isBoolean(expiryEnabled)) {
				return false;
			}
			this.#linkDraft.expiryEnabled = expiryEnabled;
			this.#errorCode = null;
			return true;
		}
		setLinkRequireB24Auth(requireB24Auth) {
			if (this.#status !== CatalogShareViewState.LinkSettings || this.#linkDraft === null || !main_core.Type.isBoolean(requireB24Auth)) {
				return false;
			}
			this.#linkDraft.requireB24Auth = requireB24Auth;
			this.#errorCode = null;
			return true;
		}
		prepareLinkSave(now = new Date()) {
			if (this.#status !== CatalogShareViewState.LinkSettings || this.#linkDraft === null) {
				throw new Error('LINK_NOT_EDITABLE');
			}
			const payload = createEnabledLinkPayload(this.#linkDraft.expiryEnabled ? this.#linkDraft.lastFiniteExpiresAt : null, this.#linkDraft.requireB24Auth, now);
			if (!payload.requireB24Auth) {
				this.#status = CatalogShareViewState.ConfirmAnonymousLink;
				return null;
			}
			this.#startLinkSave();
			return payload;
		}
		confirmAnonymousLinkSave(now = new Date()) {
			if (this.#status !== CatalogShareViewState.ConfirmAnonymousLink || this.#linkDraft === null) {
				throw new Error('LINK_CONFIRMATION_NOT_ACTIVE');
			}
			const payload = createEnabledLinkPayload(this.#linkDraft.expiryEnabled ? this.#linkDraft.lastFiniteExpiresAt : null, this.#linkDraft.requireB24Auth, now);
			this.#startLinkSave();
			return payload;
		}
		cancelAnonymousLinkSave() {
			if (this.#status !== CatalogShareViewState.ConfirmAnonymousLink) {
				return false;
			}
			this.#status = CatalogShareViewState.LinkSettings;
			return true;
		}
		requestPortalLinkRevoke() {
			if (this.#status !== CatalogShareViewState.LinkSettings || this.#linkState?.availability !== LinkAvailability.Available || this.#linkState.link === null) {
				return false;
			}
			this.#status = CatalogShareViewState.ConfirmPortalLinkRevoke;
			this.#errorCode = null;
			return true;
		}
		confirmPortalLinkRevoke() {
			if (this.#status !== CatalogShareViewState.ConfirmPortalLinkRevoke) {
				throw new Error('LINK_REVOKE_CONFIRMATION_NOT_ACTIVE');
			}
			this.#startLinkSave();
			return {
				enabled: false
			};
		}
		cancelPortalLinkRevoke() {
			if (this.#status !== CatalogShareViewState.ConfirmPortalLinkRevoke) {
				return false;
			}
			this.#status = CatalogShareViewState.LinkSettings;
			return true;
		}
		setLinkSettingsError(errorCode) {
			if (this.#status !== CatalogShareViewState.LinkSettings) {
				return false;
			}
			this.#errorCode = errorCode;
			return true;
		}
		completeLinkSave(linkState) {
			if (this.#status !== CatalogShareViewState.SavingLink) {
				return false;
			}
			this.#linkState = linkState;
			this.#status = CatalogShareViewState.LinkSettings;
			if (linkState.link !== null) {
				const lastFiniteExpiresAt = linkState.link.expiresAt === null ? this.#linkDraft?.lastFiniteExpiresAt ?? createDefaultLinkExpiry() : new Date(linkState.link.expiresAt);
				this.#linkDraft = {
					expiryEnabled: linkState.link.expiresAt !== null,
					lastFiniteExpiresAt,
					requireB24Auth: linkState.link.requireB24Auth
				};
			}
			this.#previousEditableState = null;
			return true;
		}
		failSaving(errorCode) {
			if (this.#status !== CatalogShareViewState.SavingShare && this.#status !== CatalogShareViewState.RefreshingLink && this.#status !== CatalogShareViewState.SavingLink) {
				return false;
			}
			this.#status = this.#previousEditableState ?? CatalogShareViewState.Audience;
			this.#previousEditableState = null;
			this.#errorCode = errorCode;
			return true;
		}
		close() {
			this.#status = CatalogShareViewState.Closed;
			this.#pendingAudience = null;
			this.#ownerOnlyConfirmationRequired = false;
			this.#linkSettingsReturnState = null;
			this.#linkDraft = null;
		}
		#replaceCanonicalShare(share) {
			this.#share = share;
			this.#draftShare = cloneShare(share);
			this.#specificMembersDraft = {
				audience: Audience.SpecificMembers,
				users: share.audience === Audience.SpecificMembers ? cloneParticipants(share.users) : [],
				departments: share.audience === Audience.SpecificMembers ? cloneParticipants(share.departments) : []
			};
			this.#pendingAudience = null;
			this.#ownerOnlyConfirmationRequired = false;
		}
		#applyAudience(audience) {
			const keepMembers = audience === Audience.SpecificMembers;
			if (this.#draftShare?.audience === Audience.SpecificMembers) {
				this.#specificMembersDraft = cloneShare(this.#draftShare);
			}
			this.#draftShare = {
				audience,
				users: keepMembers ? cloneParticipants(this.#specificMembersDraft.users) : [],
				departments: keepMembers ? cloneParticipants(this.#specificMembersDraft.departments) : []
			};
			this.#status = keepMembers ? CatalogShareViewState.MemberDraft : CatalogShareViewState.Audience;
			this.#errorCode = null;
			this.#ownerOnlyConfirmationRequired = false;
		}
		#isAudienceEditable() {
			return this.#status === CatalogShareViewState.Audience || this.#status === CatalogShareViewState.MemberDraft;
		}
		#isShareDraftDirty() {
			if (this.#share === null || this.#draftShare === null) {
				return false;
			}
			if (this.#share.audience !== this.#draftShare.audience) {
				return true;
			}
			if (this.#draftShare.audience !== Audience.SpecificMembers) {
				return false;
			}
			return !haveSameParticipantIds(this.#share.users, this.#draftShare.users) || !haveSameParticipantIds(this.#share.departments, this.#draftShare.departments);
		}
		#hasActiveLink() {
			return this.#linkState?.availability === LinkAvailability.Available && this.#linkState.link !== null;
		}
		#getMemberCount() {
			return (this.#draftShare?.users.length ?? 0) + (this.#draftShare?.departments.length ?? 0);
		}
		#createLinkDraft(now) {
			const link = this.#linkState?.link;
			if (link !== null && link !== undefined) {
				return {
					expiryEnabled: link.expiresAt !== null,
					lastFiniteExpiresAt: link.expiresAt === null ? createDefaultLinkExpiry(now) : new Date(link.expiresAt),
					requireB24Auth: link.requireB24Auth
				};
			}
			return {
				expiryEnabled: true,
				lastFiniteExpiresAt: createDefaultLinkExpiry(now),
				requireB24Auth: true
			};
		}
		#isLinkDraftDirty() {
			if (this.#linkDraft === null || this.#linkState?.link === null || this.#linkState?.link === undefined) {
				return this.#linkDraft !== null;
			}
			const canonicalLink = this.#linkState.link;
			if (canonicalLink.requireB24Auth !== this.#linkDraft.requireB24Auth) {
				return true;
			}
			if (canonicalLink.expiresAt === null) {
				return this.#linkDraft.expiryEnabled;
			}
			return !this.#linkDraft.expiryEnabled || new Date(canonicalLink.expiresAt).getTime() !== this.#linkDraft.lastFiniteExpiresAt.getTime();
		}
		#startLinkSave() {
			this.#previousEditableState = CatalogShareViewState.LinkSettings;
			this.#status = CatalogShareViewState.SavingLink;
			this.#errorCode = null;
		}
	}

	const AUDIENCE_MESSAGES = Object.freeze({
		[Audience.OwnerOnly]: 'VIBECODECONNECTOR_CATALOG_SHARE_AUDIENCE_OWNER_ONLY',
		[Audience.SpecificMembers]: 'VIBECODECONNECTOR_CATALOG_SHARE_AUDIENCE_SPECIFIC_MEMBERS',
		[Audience.Portal]: 'VIBECODECONNECTOR_CATALOG_SHARE_AUDIENCE_PORTAL',
		[Audience.Authenticated]: 'VIBECODECONNECTOR_CATALOG_SHARE_AUDIENCE_AUTHENTICATED',
		[Audience.Public]: 'VIBECODECONNECTOR_CATALOG_SHARE_AUDIENCE_PUBLIC'
	});
	const AUDIENCES = [Audience.OwnerOnly, Audience.SpecificMembers, Audience.Portal, Audience.Authenticated, Audience.Public];
	function getMessage(code) {
		return main_core.Loc.getMessage(code) ?? '';
	}
	function hasDirectGlobalAccess(audience) {
		return audience === Audience.Authenticated || audience === Audience.Public;
	}
	class CatalogShareDialogView {
		#application;
		#callbacks;
		#selectorFactory;
		#now;
		#tagSelector = null;
		#audienceMenu = null;
		#audienceMenuOpened = false;
		#snapshot = null;
		#shareButton = null;
		#buttons = [];
		#inputs = [];
		#switchers = new Map();
		#datePicker = null;
		#boundNodes = [];
		constructor(options) {
			this.#application = options.application;
			this.#callbacks = options.callbacks;
			this.#now = options.now ?? (() => new Date());
			this.#selectorFactory = options.selectorFactory ?? (selectorOptions => {
				return new ui_entitySelector.TagSelector(selectorOptions);
			});
		}
		render(snapshot) {
			this.#disposeControls();
			this.#destroyTagSelector();
			this.#snapshot = snapshot;
			if (snapshot.status === CatalogShareViewState.Loading) {
				return {
					content: this.#renderLoading(),
					leftButtons: [],
					rightButtons: []
				};
			}
			if (snapshot.status === CatalogShareViewState.LoadError) {
				return {
					content: this.#renderLoadError(),
					leftButtons: [],
					rightButtons: []
				};
			}
			if (snapshot.status === CatalogShareViewState.GeneratingDefaultLink || snapshot.status === CatalogShareViewState.LinkSettings || snapshot.status === CatalogShareViewState.ConfirmAnonymousLink || snapshot.status === CatalogShareViewState.ConfirmPortalLinkRevoke || snapshot.status === CatalogShareViewState.SavingLink) {
				return this.#renderLinkSettings(snapshot);
			}
			const content = this.#renderEditor(snapshot);
			const buttons = this.#createFooterButtons(snapshot);
			return {
				content,
				leftButtons: buttons.left,
				rightButtons: buttons.right
			};
		}
		destroy() {
			this.#disposeControls();
			this.#destroySwitchers();
			this.#destroyTagSelector();
			this.#snapshot = null;
		}
		updateShareButton(snapshot) {
			const isDisabled = this.#isShareButtonDisabled(snapshot);
			this.#shareButton?.setDisabled(isDisabled);
			if (this.#shareButton !== null) {
				this.#shareButton.render().hidden = this.#isShareButtonHidden(snapshot);
			}
			if (!isDisabled) {
				this.#shareButton?.removeClass(ui_buttons.ButtonState.DISABLED);
			}
		}
		#renderLoading() {
			return main_core.Tag.render`
			<div
				class="vibecode-catalog__share-dialog-loading ui-text --sm"
				data-state="loading"
				aria-busy="true"
			>
				${getMessage('VIBECODECONNECTOR_CATALOG_SHARE_LOADING')}
			</div>
		`;
		}
		#renderLoadError() {
			const retryButton = this.#createButton({
				text: getMessage('VIBECODECONNECTOR_CATALOG_SHARE_RETRY'),
				style: ui_buttons.AirButtonStyle.FILLED,
				dataset: {
					testid: 'vibecode-catalog-share-retry'
				},
				onclick: this.#callbacks.onRetry
			});
			return main_core.Tag.render`
			<div class="vibecode-catalog__share-dialog-error" data-state="loadError">
				<p class="ui-text --sm">${getMessage('VIBECODECONNECTOR_CATALOG_SHARE_LOAD_ERROR')}</p>
				${retryButton.render()}
			</div>
		`;
		}
		#renderLinkSettings(snapshot) {
			const content = document.createElement('div');
			content.className = 'vibecode-catalog__share-dialog vibecode-catalog__share-link-settings';
			content.dataset.state = snapshot.status;
			main_core.Dom.append(main_core.Tag.render`
			<p class="vibecode-catalog__share-link-description ui-text --sm">
				${getMessage('VIBECODECONNECTOR_CATALOG_SHARE_LINK_DESCRIPTION')}
			</p>
		`, content);
			if (snapshot.status === CatalogShareViewState.GeneratingDefaultLink) {
				main_core.Dom.append(main_core.Tag.render`
				<p
					class="vibecode-catalog__share-link-generating ui-text --sm"
					data-testid="vibecode-catalog-share-link-generating"
					aria-busy="true"
				>
					${getMessage('VIBECODECONNECTOR_CATALOG_SHARE_LINK_GENERATING')}
				</p>
			`, content);
				return {
					content,
					leftButtons: [],
					rightButtons: []
				};
			}
			if (snapshot.linkState?.availability === LinkAvailability.Unavailable) {
				main_core.Dom.append(main_core.Tag.render`
				<p class="vibecode-catalog__share-notice ui-text --sm" role="status">
					${getMessage('VIBECODECONNECTOR_CATALOG_SHARE_LINK_UNAVAILABLE')}
				</p>
			`, content);
				const buttons = this.#createLinkFooterButtons(snapshot);
				return {
					content,
					leftButtons: buttons.left,
					rightButtons: buttons.right
				};
			}
			if (snapshot.linkDraft !== null) {
				main_core.Dom.append(this.#renderExpiryInput(snapshot), content);
				main_core.Dom.append(this.#renderAuthCheckbox(snapshot), content);
			}
			if (snapshot.errorCode !== null) {
				let errorMessage = 'VIBECODECONNECTOR_CATALOG_SHARE_LINK_SAVE_ERROR';
				if (snapshot.errorCode === 'COPY_FAILED') {
					errorMessage = 'VIBECODECONNECTOR_CATALOG_SHARE_LINK_COPY_ERROR';
				} else if (['LINK_EXPIRY_TOO_SOON', 'LINK_EXPIRY_TOO_LATE'].includes(snapshot.errorCode)) {
					errorMessage = 'VIBECODECONNECTOR_CATALOG_SHARE_LINK_EXPIRY_ERROR';
				}
				main_core.Dom.append(main_core.Tag.render`
				<p class="vibecode-catalog__share-error ui-text --sm" role="alert">
					${getMessage(errorMessage)}
				</p>
			`, content);
			}
			const buttons = this.#createLinkFooterButtons(snapshot);
			return {
				content,
				leftButtons: buttons.left,
				rightButtons: buttons.right
			};
		}
		#renderExpiryInput(snapshot) {
			const isEditable = snapshot.status === CatalogShareViewState.LinkSettings;
			const expiryEnabled = snapshot.linkDraft?.expiryEnabled === true;
			const isExpired = this.#isLinkExpired(snapshot);
			const section = document.createElement('div');
			section.className = 'vibecode-catalog__share-link-expiry';
			const expirySwitcher = this.#createSwitcher({
				id: `vibecode-catalog-share-expiry-enabled-${this.#application.id}`,
				checked: expiryEnabled,
				disabled: !isEditable,
				testId: 'vibecode-catalog-share-link-expiry-switch',
				ariaLabel: getMessage('VIBECODECONNECTOR_CATALOG_SHARE_LINK_EXPIRY'),
				onToggle: this.#callbacks.onSetLinkExpiryEnabled
			});
			const switchLabel = document.createElement('div');
			switchLabel.className = 'vibecode-catalog__share-link-switch-row';
			main_core.Dom.append(expirySwitcher.getNode(), switchLabel);
			main_core.Dom.append(main_core.Tag.render`
			<span>${getMessage('VIBECODECONNECTOR_CATALOG_SHARE_LINK_EXPIRY')}</span>
		`, switchLabel);
			main_core.Dom.append(switchLabel, section);
			const expiryInput = this.#createInput({
				readonly: true,
				design: !isEditable || !expiryEnabled ? ui_system_input.InputDesign.Disabled : ui_system_input.InputDesign.Grey,
				error: isExpired ? getMessage('VIBECODECONNECTOR_CATALOG_SHARE_LINK_EXPIRED') : '',
				stretched: false,
				ariaLabel: getMessage('VIBECODECONNECTOR_CATALOG_SHARE_LINK_EXPIRY_ARIA')
			});
			const inputWrapper = expiryInput.render();
			const inputField = inputWrapper.querySelector('input');
			const composition = document.createElement('div');
			composition.className = 'vibecode-catalog__share-link-expiry-date';
			composition.dataset.testid = 'vibecode-catalog-share-link-expiry-date';
			main_core.Dom.append(inputWrapper, composition);
			const calendarButton = document.createElement('button');
			calendarButton.type = 'button';
			calendarButton.className = 'vibecode-catalog__share-link-expiry-calendar';
			calendarButton.disabled = !isEditable || !expiryEnabled;
			calendarButton.dataset.testid = 'vibecode-catalog-share-link-expiry-calendar';
			calendarButton.setAttribute('aria-label', getMessage('VIBECODECONNECTOR_CATALOG_SHARE_LINK_CALENDAR_ARIA'));
			const calendarIcon = new ui_iconSet_api_core.Icon({
				icon: ui_iconSet_api_core.Outline.CALENDAR,
				size: 20
			}).render();
			calendarIcon.setAttribute('aria-hidden', 'true');
			main_core.Dom.append(calendarIcon, calendarButton);
			main_core.Dom.append(calendarButton, composition);
			main_core.Dom.append(composition, section);
			const now = this.#now();
			const minimumExpiry = new Date(now.getTime() + 5 * 60 * 1000);
			this.#datePicker = new ui_datePicker.DatePicker({
				enableTime: true,
				selectionMode: 'single',
				selectedDates: [snapshot.linkDraft.lastFiniteExpiresAt],
				minDate: minimumExpiry,
				maxDate: new Date(now.getTime() + 315_360_000 * 1000),
				inputField,
				targetNode: composition
			});
			this.#datePicker.subscribe('onSelect', event => {
				const date = event.getData().date;
				if (date instanceof Date) {
					this.#callbacks.onSetLinkExpiry(date);
				}
			});
			this.#datePicker.updateInputFields();
			const showDatePicker = () => {
				if (isEditable && expiryEnabled) {
					this.#datePicker?.show();
				}
			};
			if (inputField !== null) {
				main_core.Event.bind(inputField, 'click', showDatePicker);
				this.#boundNodes.push(inputField);
			}
			main_core.Event.bind(calendarButton, 'click', showDatePicker);
			this.#boundNodes.push(calendarButton);
			return section;
		}
		#renderAuthCheckbox(snapshot) {
			const label = document.createElement('div');
			label.className = 'vibecode-catalog__share-link-switch-row';
			const switcher = this.#createSwitcher({
				id: `vibecode-catalog-share-require-auth-${this.#application.id}`,
				checked: snapshot.linkDraft?.requireB24Auth === true,
				disabled: snapshot.status !== CatalogShareViewState.LinkSettings,
				testId: 'vibecode-catalog-share-link-require-auth',
				ariaLabel: getMessage('VIBECODECONNECTOR_CATALOG_SHARE_LINK_REQUIRE_AUTH'),
				onToggle: this.#callbacks.onSetLinkRequireB24Auth
			});
			main_core.Dom.append(switcher.getNode(), label);
			main_core.Dom.append(main_core.Tag.render`<span>${getMessage('VIBECODECONNECTOR_CATALOG_SHARE_LINK_REQUIRE_AUTH')}</span>`, label);
			return label;
		}
		#createSwitcher(options) {
			let switcher = this.#switchers.get(options.id);
			if (!switcher) {
				switcher = new ui_switcher.Switcher({
					id: options.id,
					checked: options.checked,
					disabled: options.disabled,
					size: ui_switcher.SwitcherSize.extraSmall,
					useAirDesign: true,
					style: ui_switcher.AirSwitcherStyle.TINTED,
					showStateTitle: false,
					handlers: {
						toggled() {
							options.onToggle(this.isChecked());
						}
					}
				});
				const node = switcher.getNode();
				main_core.Event.bind(node, 'keydown', event => {
					if (event.key === ' ' || event.key === 'Enter') {
						event.preventDefault();
						switcher.toggle(event);
					}
				});
				this.#switchers.set(options.id, switcher);
			}
			switcher.check(options.checked, false);
			switcher.disable(options.disabled, false);
			const node = switcher.getNode();
			node.dataset.testid = options.testId;
			node.setAttribute('role', 'switch');
			node.setAttribute('aria-label', options.ariaLabel);
			node.setAttribute('aria-checked', String(options.checked));
			node.setAttribute('aria-disabled', String(options.disabled));
			node.tabIndex = options.disabled ? -1 : 0;
			return switcher;
		}
		#createLinkFooterButtons(snapshot) {
			const isSaving = snapshot.status === CatalogShareViewState.SavingLink;
			const isExpired = this.#isLinkExpired(snapshot);
			const left = [this.#createButton({
				text: getMessage('VIBECODECONNECTOR_CATALOG_SHARE_LINK_BACK'),
				style: ui_buttons.AirButtonStyle.OUTLINE,
				dataset: {
					testid: 'vibecode-catalog-share-link-back'
				},
				disabled: isSaving,
				onclick: this.#callbacks.onCloseLinkSettings
			})];
			if (snapshot.linkState?.availability === LinkAvailability.Unavailable) {
				return {
					left,
					right: []
				};
			}
			const right = [];
			if (snapshot.linkState?.link !== null && snapshot.linkState?.link !== undefined) {
				right.push(this.#createButton({
					text: getMessage('VIBECODECONNECTOR_CATALOG_SHARE_LINK_REVOKE'),
					style: ui_buttons.AirButtonStyle.PLAIN,
					dataset: {
						testid: 'vibecode-catalog-share-link-revoke'
					},
					disabled: isSaving,
					onclick: this.#callbacks.onRequestPortalLinkRevoke
				}));
			}
			right.push(this.#createButton({
				text: getMessage(snapshot.isLinkDraftDirty ? 'VIBECODECONNECTOR_CATALOG_SHARE_LINK_SAVE_AND_COPY' : 'VIBECODECONNECTOR_CATALOG_SHARE_LINK_COPY'),
				style: ui_buttons.AirButtonStyle.FILLED,
				dataset: {
					testid: 'vibecode-catalog-share-link-copy'
				},
				disabled: isSaving || isExpired,
				onclick: this.#callbacks.onSaveAndCopyLink
			}));
			return {
				left,
				right
			};
		}
		#isLinkExpired(snapshot) {
			return snapshot.linkDraft?.expiryEnabled === true && snapshot.linkDraft.lastFiniteExpiresAt.getTime() <= this.#now().getTime();
		}
		#createInput(options) {
			const input = new ui_system_input.Input(options);
			this.#inputs.push(input);
			return input;
		}
		#renderEditor(snapshot) {
			const root = document.createElement('div');
			root.className = 'vibecode-catalog__share-dialog';
			root.dataset.state = snapshot.status;
			main_core.Dom.append(main_core.Tag.render`
			<p class="vibecode-catalog__share-description ui-text --sm">
				${getMessage('VIBECODECONNECTOR_CATALOG_SHARE_DESCRIPTION')}
			</p>
		`, root);
			main_core.Dom.append(this.#renderApplication(), root);
			main_core.Dom.append(main_core.Tag.render`
			<h3 class="vibecode-catalog__share-audience-title ui-text --sm">
				${getMessage('VIBECODECONNECTOR_CATALOG_SHARE_AUDIENCE_TITLE')}
			</h3>
		`, root);
			main_core.Dom.append(this.#renderAudience(snapshot), root);
			if (snapshot.status === CatalogShareViewState.MemberDraft) {
				main_core.Dom.append(this.#renderMembers(snapshot), root);
			}
			const linkSettingsHint = this.#renderLinkSettingsHint(snapshot);
			if (linkSettingsHint !== null) {
				main_core.Dom.append(linkSettingsHint, root);
			}
			if (snapshot.errorCode !== null) {
				const error = main_core.Tag.render`
				<p class="vibecode-catalog__share-error ui-text --sm" role="alert">
					${getMessage('VIBECODECONNECTOR_CATALOG_SHARE_SAVE_ERROR')}
				</p>
			`;
				main_core.Dom.append(error, root);
			}
			return root;
		}
		#renderLinkSettingsHint(snapshot) {
			if (snapshot.linkState?.availability !== LinkAvailability.Available || hasDirectGlobalAccess(snapshot.draftShare?.audience)) {
				return null;
			}
			const hint = document.createElement('p');
			hint.className = 'vibecode-catalog__share-link-hint ui-text --sm';
			const linkSettings = document.createElement('button');
			linkSettings.type = 'button';
			linkSettings.className = 'vibecode-catalog__share-link-action';
			linkSettings.dataset.testid = 'vibecode-catalog-share-link-settings';
			linkSettings.disabled = snapshot.status !== CatalogShareViewState.Audience && snapshot.status !== CatalogShareViewState.MemberDraft;
			main_core.Event.bind(linkSettings, 'click', this.#callbacks.onOpenLinkSettings);
			this.#boundNodes.push(linkSettings);
			const message = getMessage('VIBECODECONNECTOR_CATALOG_SHARE_LINK_HINT');
			const linkStart = message.indexOf('[link]');
			const linkEnd = message.indexOf('[/link]');
			if (linkStart === -1 || linkEnd < linkStart) {
				hint.textContent = message;
				return hint;
			}
			main_core.Dom.append(document.createTextNode(message.slice(0, linkStart)), hint);
			linkSettings.textContent = message.slice(linkStart + '[link]'.length, linkEnd);
			main_core.Dom.append(linkSettings, hint);
			main_core.Dom.append(document.createTextNode(message.slice(linkEnd + '[/link]'.length)), hint);
			return hint;
		}
		#renderApplication() {
			const application = document.createElement('div');
			application.className = 'vibecode-catalog__share-application';
			const iconContainer = document.createElement('span');
			iconContainer.className = 'vibecode-catalog__share-application-icon';
			iconContainer.setAttribute('aria-hidden', 'true');
			if (this.#application.color !== null) {
				main_core.Dom.style(iconContainer, 'backgroundColor', this.#application.color);
			}
			if (this.#application.iconUrl !== null) {
				const icon = document.createElement('img');
				icon.alt = '';
				icon.src = this.#application.iconUrl;
				main_core.Dom.append(icon, iconContainer);
			}
			const title = document.createElement('span');
			title.className = 'ui-text --sm';
			title.textContent = this.#application.title;
			main_core.Dom.append(iconContainer, application);
			main_core.Dom.append(title, application);
			return application;
		}
		#renderAudience(snapshot) {
			const audience = document.createElement('div');
			audience.className = 'vibecode-catalog__share-audience';
			const isDisabled = snapshot.status !== CatalogShareViewState.Audience && snapshot.status !== CatalogShareViewState.MemberDraft || snapshot.pendingAudience !== null || snapshot.ownerOnlyConfirmationRequired;
			const currentAudience = snapshot.draftShare?.audience ?? Audience.OwnerOnly;
			let triggerNode = null;
			const input = this.#createInput({
				value: getMessage(AUDIENCE_MESSAGES[currentAudience]),
				readonly: true,
				dropdown: true,
				clickable: true,
				stretched: true,
				design: isDisabled ? ui_system_input.InputDesign.Disabled : ui_system_input.InputDesign.Grey,
				ariaLabel: getMessage('VIBECODECONNECTOR_CATALOG_SHARE_AUDIENCE_ARIA'),
				onClick: () => {
					if (triggerNode !== null) {
						this.#toggleAudienceMenu(triggerNode, isDisabled);
					}
				}
			});
			const node = input.render();
			triggerNode = node;
			node.dataset.testid = 'vibecode-catalog-share-audience';
			node.setAttribute('role', 'combobox');
			node.setAttribute('aria-haspopup', 'listbox');
			node.setAttribute('aria-expanded', 'false');
			node.setAttribute('aria-disabled', String(isDisabled));
			node.tabIndex = isDisabled ? -1 : 0;
			main_core.Event.bind(node, 'keydown', event => {
				if (!isDisabled && (event.key === 'Enter' || event.key === ' ' || event.key === 'ArrowDown')) {
					event.preventDefault();
					this.#toggleAudienceMenu(node, false);
				}
			});
			this.#boundNodes.push(node);
			main_core.Dom.append(node, audience);
			return audience;
		}
		#toggleAudienceMenu(bindNode, isDisabled) {
			if (isDisabled) {
				return;
			}
			if (this.#audienceMenuOpened) {
				this.#audienceMenu?.close();
				return;
			}
			const currentAudience = this.#snapshot?.draftShare?.audience ?? Audience.OwnerOnly;
			const items = AUDIENCES.map(audienceValue => ({
				id: audienceValue,
				dataset: {
					testid: `vibecode-catalog-share-audience-${audienceValue.toLowerCase().replaceAll('_', '-')}`
				},
				title: getMessage(AUDIENCE_MESSAGES[audienceValue]),
				isSelected: audienceValue === currentAudience,
				onClick: () => {
					this.#audienceMenu?.close();
					this.#callbacks.onSelectAudience(audienceValue);
				}
			}));
			if (this.#audienceMenu === null) {
				this.#audienceMenu = new ui_system_menu.Menu({
					closeOnItemClick: false,
					items,
					events: {
						onShow: () => {
							const menuButtons = this.#audienceMenu?.getPopup()?.getPopupContainer()?.querySelectorAll('.ui-popup-menu-item-action') ?? [];
							items.forEach((item, index) => {
								if (menuButtons[index]) {
									Object.assign(menuButtons[index].dataset, item.dataset);
								}
							});
							this.#audienceMenuOpened = true;
							bindNode.setAttribute('aria-expanded', 'true');
							main_core.Dom.addClass(bindNode, '--active');
						},
						onClose: () => {
							this.#audienceMenuOpened = false;
							bindNode.setAttribute('aria-expanded', 'false');
							main_core.Dom.removeClass(bindNode, '--active');
						}
					}
				});
			} else {
				this.#audienceMenu.updateItems(items);
			}
			this.#audienceMenu.show(bindNode);
		}
		#renderMembers(snapshot) {
			const section = document.createElement('div');
			section.className = 'vibecode-catalog__share-members';
			section.dataset.testid = 'vibecode-catalog-share-members';
			section.setAttribute('aria-label', getMessage('VIBECODECONNECTOR_CATALOG_SHARE_MEMBERS_ARIA'));
			const selectedItems = [...(snapshot.draftShare?.users ?? []).map(({
				id
			}) => ['user', id]), ...(snapshot.draftShare?.departments ?? []).map(({
				id
			}) => ['department', id])];
			const items = [...(snapshot.draftShare?.users ?? []).map(({
				id,
				name
			}) => ({
				id,
				entityId: 'user',
				title: name
			})), ...(snapshot.draftShare?.departments ?? []).map(({
				id,
				name
			}) => ({
				id,
				entityId: 'department',
				title: name
			}))];
			let tagSelector = null;
			let memberSyncScheduled = false;
			const scheduleMemberSync = () => {
				if (memberSyncScheduled) {
					return;
				}
				memberSyncScheduled = true;
				void Promise.resolve().then(() => {
					memberSyncScheduled = false;
					if (this.#tagSelector === tagSelector) {
						this.#syncMembers();
					}
				});
			};
			tagSelector = this.#selectorFactory({
				id: `vibecode-catalog-share-members-${this.#application.id}`,
				items,
				multiple: true,
				textBoxAutoHide: false,
				textBoxWidth: 350,
				maxHeight: 99,
				placeholder: getMessage('VIBECODECONNECTOR_CATALOG_SHARE_ADD_MEMBERS'),
				addButtonCaption: getMessage('VIBECODECONNECTOR_CATALOG_SHARE_ADD_MEMBERS'),
				events: {
					onTagAdd: scheduleMemberSync,
					onTagRemove: scheduleMemberSync
				},
				dialogOptions: {
					preselectedItems: selectedItems,
					multiple: true,
					hideOnDeselect: false,
					entities: [{
						id: 'user',
						options: {
							intranetUsersOnly: true
						}
					}, {
						id: 'department',
						options: {
							selectMode: 'usersAndDepartments',
							allowFlatDepartments: true,
							allowSelectRootDepartment: true
						}
					}],
					events: {
						'Item:onSelect': scheduleMemberSync,
						'Item:onDeselect': scheduleMemberSync
					}
				}
			});
			this.#tagSelector = tagSelector;
			this.#tagSelector.renderTo(section);
			return section;
		}
		#createFooterButtons(snapshot) {
			const isSaving = snapshot.status === CatalogShareViewState.SavingShare || snapshot.status === CatalogShareViewState.RefreshingLink;
			if (snapshot.status !== CatalogShareViewState.Audience && snapshot.status !== CatalogShareViewState.MemberDraft && !isSaving) {
				return {
					left: [],
					right: []
				};
			}
			const right = [];
			if (hasDirectGlobalAccess(snapshot.draftShare?.audience) && main_core.Type.isStringFilled(this.#application.viewUrl)) {
				right.push(this.#createButton({
					text: getMessage('VIBECODECONNECTOR_CATALOG_SHARE_COPY_APPLICATION_LINK'),
					style: ui_buttons.AirButtonStyle.PLAIN,
					dataset: {
						testid: 'vibecode-catalog-share-copy-application-link'
					},
					disabled: isSaving,
					onclick: this.#callbacks.onCopyApplicationLink
				}));
			}
			this.#shareButton = this.#createButton({
				text: getMessage('VIBECODECONNECTOR_CATALOG_SHARE_SAVE'),
				style: ui_buttons.AirButtonStyle.FILLED,
				dataset: {
					testid: 'vibecode-catalog-share-save'
				},
				disabled: this.#isShareButtonDisabled(snapshot),
				onclick: this.#callbacks.onSaveShare
			});
			this.updateShareButton(snapshot);
			right.push(this.#shareButton);
			return {
				left: [],
				right
			};
		}
		#isShareButtonDisabled(snapshot) {
			return snapshot.status === CatalogShareViewState.SavingShare || snapshot.status === CatalogShareViewState.RefreshingLink || this.#isShareButtonHidden(snapshot) || !snapshot.isShareDraftDirty;
		}
		#isShareButtonHidden(snapshot) {
			return snapshot.draftShare?.audience === Audience.SpecificMembers && snapshot.draftShare.users.length === 0 && snapshot.draftShare.departments.length === 0;
		}
		#createButton(options) {
			const button = new ui_buttons.Button({
				size: ui_buttons.ButtonSize.MEDIUM,
				useAirDesign: true,
				...options
			});
			this.#buttons.push(button);
			return button;
		}
		#syncMembers() {
			const users = [];
			const departments = [];
			this.#tagSelector?.getDialog()?.getSelectedItems().forEach(item => {
				const participant = {
					id: String(item.getId()),
					name: item.getTitle()
				};
				if (item.getEntityId() === 'user') {
					users.push(participant);
				} else if (item.getEntityId() === 'department') {
					departments.push(participant);
				}
			});
			this.#callbacks.onSetMembers(users, departments);
		}
		#disposeControls() {
			this.#audienceMenu?.destroy();
			this.#audienceMenu = null;
			this.#audienceMenuOpened = false;
			this.#datePicker?.destroy();
			this.#datePicker = null;
			this.#inputs.forEach(input => input.destroy());
			this.#inputs = [];
			this.#boundNodes.forEach(node => main_core.Event.unbindAll(node));
			this.#boundNodes = [];
			this.#buttons.forEach(button => button.unbindEvent('click'));
			this.#buttons = [];
			this.#shareButton = null;
		}
		#destroySwitchers() {
			const switcherList = ui_switcher.Switcher.getList();
			this.#switchers.forEach(switcher => {
				main_core.Event.unbindAll(switcher.getNode());
				const index = switcherList.indexOf(switcher);
				if (index !== -1) {
					switcherList.splice(index, 1);
				}
			});
			this.#switchers.clear();
		}
		#destroyTagSelector() {
			if (this.#tagSelector === null) {
				return;
			}
			this.#tagSelector.focusZone?.deactivate();
			this.#tagSelector.unsubscribeAll();
			this.#tagSelector.getDialog()?.destroy();
			this.#tagSelector = null;
		}
	}

	const CATALOG_SHARE_DIALOG_WIDTH = 588;
	Object.freeze({
		Loading: CatalogShareViewState.Loading,
		Error: CatalogShareViewState.LoadError,
		Ready: CatalogShareViewState.Audience,
		Audience: CatalogShareViewState.Audience,
		MemberDraft: CatalogShareViewState.MemberDraft,
		SavingShare: CatalogShareViewState.SavingShare,
		RefreshingLink: CatalogShareViewState.RefreshingLink,
		GeneratingDefaultLink: CatalogShareViewState.GeneratingDefaultLink,
		LinkSettings: CatalogShareViewState.LinkSettings,
		ConfirmAnonymousLink: CatalogShareViewState.ConfirmAnonymousLink,
		ConfirmPortalLinkRevoke: CatalogShareViewState.ConfirmPortalLinkRevoke,
		SavingLink: CatalogShareViewState.SavingLink,
		Closed: CatalogShareViewState.Closed
	});
	class CatalogShareDialog {
		#application;
		#trigger;
		#api;
		#machine;
		#view;
		#dialog;
		#confirmationMessageBox = null;
		#confirmationCancel = null;
		#draft = null;
		#request = null;
		#saveRequest = null;
		#linkRequest = null;
		#applicationLinkCopyRequest = null;
		#copyText;
		#now;
		#shown = false;
		#destroyed = false;
		constructor(options) {
			this.#application = options.application;
			this.#trigger = options.trigger;
			this.#api = options.api ?? catalogShareApi;
			this.#copyText = options.copyText ?? this.#copyToClipboard;
			this.#now = options.now ?? (() => new Date());
			this.#machine = new CatalogShareStateMachine();
			this.#view = new CatalogShareDialogView({
				application: this.#application,
				selectorFactory: options.selectorFactory,
				now: this.#now,
				callbacks: {
					onRetry: this.#handleRetry,
					onSelectAudience: this.#handleSelectAudience,
					onSetMembers: this.#handleSetMembers,
					onSaveShare: this.#handleSaveShare,
					onCopyApplicationLink: this.#handleCopyApplicationLink,
					onOpenLinkSettings: this.#handleOpenLinkSettings,
					onCloseLinkSettings: this.#handleCloseLinkSettings,
					onSetLinkExpiryEnabled: this.#handleSetLinkExpiryEnabled,
					onSetLinkExpiry: this.#handleSetLinkExpiry,
					onSetLinkRequireB24Auth: this.#handleSetLinkRequireB24Auth,
					onSaveAndCopyLink: this.#handleSaveAndCopyLink,
					onRequestPortalLinkRevoke: this.#handleRequestPortalLinkRevoke
				}
			});
			const rendering = this.#view.render(this.#machine.getSnapshot());
			this.#dialog = new ui_system_dialog.Dialog({
				title: main_core.Loc.getMessage('VIBECODECONNECTOR_CATALOG_SHARE_TITLE'),
				width: CATALOG_SHARE_DIALOG_WIDTH,
				content: rendering.content,
				leftButtons: rendering.leftButtons,
				rightButtons: rendering.rightButtons,
				hasOverlay: true,
				events: {
					onAfterHide: this.#handleAfterHide
				}
			});
		}
		static show(options) {
			const dialog = new CatalogShareDialog(options);
			void dialog.show();
			return dialog;
		}
		show() {
			if (this.#destroyed) {
				return Promise.resolve();
			}
			if (!this.#shown) {
				this.#shown = true;
				this.#dialog?.show();
			}
			return this.refresh();
		}
		refresh() {
			if (this.#destroyed) {
				return Promise.resolve();
			}
			if (this.#request !== null) {
				return this.#request;
			}
			const status = this.#machine.getSnapshot().status;
			if (status === CatalogShareViewState.LoadError) {
				this.#machine.retryLoading();
				this.#render();
			} else if (status !== CatalogShareViewState.Loading) {
				if (!this.#machine.beginLoading()) {
					return Promise.resolve();
				}
				this.#render();
			}
			const request = Promise.all([this.#api.getShare(this.#application.id), this.#api.getLink(this.#application.id)]).then(([share, linkState]) => {
				if (this.#destroyed) {
					return;
				}
				this.#machine.completeLoading(share, linkState);
				this.#syncDraft();
				this.#render();
			}).catch(error => {
				if (this.#destroyed) {
					return;
				}
				this.#machine.failLoading(this.#getErrorCode(error));
				this.#render();
			}).finally(() => {
				if (this.#request === request) {
					this.#request = null;
				}
			});
			this.#request = request;
			return request;
		}
		getState() {
			return this.#machine.getSnapshot().status;
		}
		getDraft() {
			return this.#draft;
		}
		destroy() {
			this.#release(true);
		}
		#handleRetry = () => {
			void this.refresh();
		};
		#handleSelectAudience = audience => {
			if (this.#machine.selectAudience(audience)) {
				this.#syncDraft();
				this.#render();
				return;
			}
			const pendingAudience = this.#machine.getSnapshot().pendingAudience;
			if (pendingAudience !== null) {
				const title = pendingAudience === Audience.Authenticated ? main_core.Loc.getMessage('VIBECODECONNECTOR_CATALOG_SHARE_CONFIRM_AUTHENTICATED_TITLE') : main_core.Loc.getMessage('VIBECODECONNECTOR_CATALOG_SHARE_CONFIRM_PUBLIC_TITLE');
				const description = pendingAudience === Audience.Authenticated ? main_core.Loc.getMessage('VIBECODECONNECTOR_CATALOG_SHARE_CONFIRM_AUTHENTICATED_DESCRIPTION') : main_core.Loc.getMessage('VIBECODECONNECTOR_CATALOG_SHARE_CONFIRM_PUBLIC_DESCRIPTION');
				this.#showConfirmation({
					title,
					description,
					confirmText: main_core.Loc.getMessage('VIBECODECONNECTOR_CATALOG_SHARE_CONFIRM_GLOBAL_BUTTON'),
					onConfirm: this.#handleConfirmLinkRevoke,
					onCancel: this.#handleCancelLinkRevoke
				});
			}
		};
		#handleConfirmLinkRevoke = () => {
			if (this.#machine.confirmLinkRevoke()) {
				this.#syncDraft();
				this.#render();
			}
		};
		#handleCancelLinkRevoke = () => {
			if (this.#machine.cancelLinkRevoke()) {
				this.#render();
			}
		};
		#handleSetMembers = (users, departments) => {
			if (!this.#machine.setMembers(users, departments)) {
				return;
			}
			this.#syncDraft();
			const snapshot = this.#machine.getSnapshot();
			this.#view.updateShareButton(snapshot);
			if (snapshot.ownerOnlyConfirmationRequired) {
				this.#showConfirmation({
					title: main_core.Loc.getMessage('VIBECODECONNECTOR_CATALOG_SHARE_CONFIRM_OWNER_ONLY_TITLE'),
					description: main_core.Loc.getMessage('VIBECODECONNECTOR_CATALOG_SHARE_CONFIRM_OWNER_ONLY_DESCRIPTION'),
					confirmText: main_core.Loc.getMessage('VIBECODECONNECTOR_CATALOG_SHARE_CONFIRM_OWNER_ONLY_BUTTON'),
					onConfirm: this.#handleConfirmOwnerOnly,
					onCancel: this.#handleCancelOwnerOnly
				});
			}
		};
		#handleConfirmOwnerOnly = () => {
			if (this.#machine.confirmOwnerOnly()) {
				this.#syncDraft();
				this.#render();
			}
		};
		#handleCancelOwnerOnly = () => {
			if (this.#machine.cancelOwnerOnly()) {
				this.#render();
			}
		};
		#handleSaveShare = () => {
			if (this.#saveRequest !== null || this.#destroyed) {
				return;
			}
			const request = this.#saveShare();
			this.#saveRequest = request;
			void request.finally(() => {
				if (this.#saveRequest === request) {
					this.#saveRequest = null;
				}
			});
		};
		#handleCopyApplicationLink = () => {
			if (this.#applicationLinkCopyRequest !== null || this.#destroyed) {
				return;
			}
			const viewUrl = this.#application.viewUrl?.trim();
			if (!viewUrl) {
				return;
			}
			let absoluteUrl = '';
			try {
				absoluteUrl = new URL(viewUrl, window.location.origin).toString();
			} catch {
				return;
			}
			const request = this.#copyApplicationLink(absoluteUrl);
			this.#applicationLinkCopyRequest = request;
			void request.finally(() => {
				if (this.#applicationLinkCopyRequest === request) {
					this.#applicationLinkCopyRequest = null;
				}
			});
		};
		async #copyApplicationLink(url) {
			let copied = false;
			try {
				copied = await this.#copyText(url);
			} catch {
				copied = false;
			}
			if (this.#destroyed) {
				return;
			}
			ui_notification.Center.notify({
				content: main_core.Loc.getMessage(copied ? 'VIBECODECONNECTOR_CATALOG_SHARE_LINK_COPIED' : 'VIBECODECONNECTOR_CATALOG_SHARE_LINK_COPY_ERROR'),
				position: ui_notification.Position.TOP_RIGHT,
				useAirDesign: true
			});
		}
		#handleOpenLinkSettings = () => {
			if (this.#machine.openLinkSettings(this.#now())) {
				this.#render();
				if (this.#machine.getSnapshot().status === CatalogShareViewState.GeneratingDefaultLink) {
					this.#startDefaultLinkGeneration();
				}
			}
		};
		#handleCloseLinkSettings = () => {
			if (this.#machine.closeLinkSettings()) {
				this.#render();
			}
		};
		#handleSetLinkExpiry = expiresAt => {
			if (this.#machine.setLinkExpiry(expiresAt)) {
				this.#render();
			}
		};
		#handleSetLinkExpiryEnabled = expiryEnabled => {
			if (this.#machine.setLinkExpiryEnabled(expiryEnabled)) {
				this.#render();
			}
		};
		#handleSetLinkRequireB24Auth = requireB24Auth => {
			if (this.#machine.setLinkRequireB24Auth(requireB24Auth)) {
				this.#render();
			}
		};
		#handleSaveAndCopyLink = () => {
			if (this.#linkRequest !== null || this.#destroyed) {
				return;
			}
			const snapshot = this.#machine.getSnapshot();
			if (!snapshot.isLinkDraftDirty && snapshot.linkState?.link !== null) {
				this.#startCopyRequest(snapshot.linkState.link.url);
				return;
			}
			try {
				const payload = this.#machine.prepareLinkSave(this.#now());
				if (payload === null) {
					this.#showConfirmation({
						title: main_core.Loc.getMessage('VIBECODECONNECTOR_CATALOG_SHARE_LINK_CONFIRM_ANONYMOUS_TITLE'),
						description: main_core.Loc.getMessage('VIBECODECONNECTOR_CATALOG_SHARE_LINK_CONFIRM_ANONYMOUS_DESCRIPTION'),
						confirmText: main_core.Loc.getMessage('VIBECODECONNECTOR_CATALOG_SHARE_LINK_CONFIRM_ANONYMOUS_BUTTON'),
						onConfirm: this.#handleConfirmAnonymousLink,
						onCancel: this.#handleCancelAnonymousLink
					});
					return;
				}
				this.#render();
				this.#startLinkRequest(payload, true, false);
			} catch (error) {
				this.#machine.setLinkSettingsError(this.#getErrorCode(error));
				this.#render();
			}
		};
		#handleConfirmAnonymousLink = () => {
			if (this.#linkRequest !== null || this.#destroyed) {
				return;
			}
			try {
				const payload = this.#machine.confirmAnonymousLinkSave(this.#now());
				this.#render();
				this.#startLinkRequest(payload, true, false);
			} catch (error) {
				this.#machine.cancelAnonymousLinkSave();
				this.#machine.setLinkSettingsError(this.#getErrorCode(error));
				this.#render();
			}
		};
		#handleCancelAnonymousLink = () => {
			if (this.#machine.cancelAnonymousLinkSave()) {
				this.#render();
			}
		};
		#handleRequestPortalLinkRevoke = () => {
			if (this.#machine.requestPortalLinkRevoke()) {
				this.#showConfirmation({
					title: main_core.Loc.getMessage('VIBECODECONNECTOR_CATALOG_SHARE_LINK_CONFIRM_REVOKE_TITLE'),
					description: main_core.Loc.getMessage('VIBECODECONNECTOR_CATALOG_SHARE_LINK_CONFIRM_REVOKE_DESCRIPTION'),
					confirmText: main_core.Loc.getMessage('VIBECODECONNECTOR_CATALOG_SHARE_LINK_CONFIRM_REVOKE_BUTTON'),
					confirmStyle: ui_buttons.AirButtonStyle.FILLED_ALERT,
					onConfirm: this.#handleConfirmPortalLinkRevoke,
					onCancel: this.#handleCancelPortalLinkRevoke
				});
			}
		};
		#handleConfirmPortalLinkRevoke = () => {
			if (this.#linkRequest !== null || this.#destroyed) {
				return;
			}
			try {
				const payload = this.#machine.confirmPortalLinkRevoke();
				this.#render();
				this.#startLinkRequest(payload, false, true);
			} catch (error) {
				this.#machine.cancelPortalLinkRevoke();
				this.#machine.setLinkSettingsError(this.#getErrorCode(error));
				this.#render();
			}
		};
		#handleCancelPortalLinkRevoke = () => {
			if (this.#machine.cancelPortalLinkRevoke()) {
				this.#render();
			}
		};
		#showConfirmation(options) {
			if (this.#destroyed || this.#confirmationMessageBox !== null) {
				return;
			}
			let confirmationMessageBox = null;
			confirmationMessageBox = ui_dialogs_messagebox.MessageBox.create({
				useAirDesign: true,
				title: options.title,
				message: options.description,
				buttons: ui_dialogs_messagebox.MessageBoxButtons.OK_CANCEL,
				okCaption: options.confirmText,
				cancelCaption: main_core.Loc.getMessage('VIBECODECONNECTOR_CATALOG_SHARE_CANCEL'),
				onOk: () => {
					if (confirmationMessageBox === null || !this.#settleConfirmation(confirmationMessageBox)) {
						return false;
					}
					options.onConfirm();
					return true;
				},
				onCancel: () => {
					if (confirmationMessageBox === null || !this.#settleConfirmation(confirmationMessageBox)) {
						return false;
					}
					options.onCancel();
					return true;
				},
				popupOptions: {
					closeByEsc: true,
					events: {
						onClose: () => {
							if (confirmationMessageBox !== null) {
								this.#handleConfirmationClose(confirmationMessageBox);
							}
						}
					}
				}
			});
			confirmationMessageBox.getOkButton().setStyle(options.confirmStyle ?? ui_buttons.AirButtonStyle.FILLED);
			confirmationMessageBox.getOkButton().getDataSet().testid = 'vibecode-catalog-share-confirm-accept';
			confirmationMessageBox.getCancelButton().getDataSet().testid = 'vibecode-catalog-share-confirm-cancel';
			this.#confirmationMessageBox = confirmationMessageBox;
			this.#confirmationCancel = options.onCancel;
			confirmationMessageBox.show();
		}
		#handleConfirmationClose(messageBox) {
			if (this.#confirmationMessageBox !== messageBox) {
				return;
			}
			const cancel = this.#confirmationCancel;
			this.#confirmationMessageBox = null;
			this.#confirmationCancel = null;
			cancel?.();
		}
		#settleConfirmation(messageBox) {
			if (this.#confirmationMessageBox !== messageBox) {
				return false;
			}
			this.#confirmationMessageBox = null;
			this.#confirmationCancel = null;
			return true;
		}
		#startLinkRequest(payload, copyAfterSave, returnToAudience) {
			const request = this.#saveLink(payload, copyAfterSave, returnToAudience);
			this.#linkRequest = request;
			void request.finally(() => {
				if (this.#linkRequest === request) {
					this.#linkRequest = null;
				}
			});
		}
		async #saveLink(payload, copyAfterSave, returnToAudience) {
			try {
				const linkState = await this.#api.setLink(this.#application.id, payload);
				if (this.#destroyed) {
					return;
				}
				this.#machine.completeLinkSave(linkState);
				if (returnToAudience) {
					this.#machine.closeLinkSettings();
				}
				this.#syncDraft();
				if (copyAfterSave && linkState.link !== null) {
					let copied = false;
					try {
						copied = await this.#copyText(linkState.link.url);
					} catch {
						copied = false;
					}
					if (this.#destroyed) {
						return;
					}
					if (copied) {
						ui_notification.Center.notify({
							content: main_core.Loc.getMessage('VIBECODECONNECTOR_CATALOG_SHARE_LINK_COPIED'),
							position: ui_notification.Position.TOP_RIGHT,
							useAirDesign: true
						});
					} else {
						this.#machine.setLinkSettingsError('COPY_FAILED');
					}
				}
				this.#render();
			} catch (error) {
				if (!this.#destroyed) {
					this.#machine.failSaving(this.#getErrorCode(error));
					this.#syncDraft();
					this.#render();
				}
			}
		}
		#startDefaultLinkGeneration() {
			if (this.#linkRequest !== null || this.#destroyed) {
				return;
			}
			try {
				const payload = this.#machine.prepareDefaultLinkGeneration(this.#now());
				const request = this.#generateDefaultLink(payload);
				this.#linkRequest = request;
				void request.finally(() => {
					if (this.#linkRequest === request) {
						this.#linkRequest = null;
					}
				});
			} catch (error) {
				this.#machine.failDefaultLinkGeneration(this.#getErrorCode(error));
				this.#render();
			}
		}
		async #generateDefaultLink(payload) {
			try {
				const linkState = await this.#api.setLink(this.#application.id, payload);
				if (this.#destroyed) {
					return;
				}
				if (linkState.link === null) {
					throw new Error('LINK_GENERATION_FAILED');
				}
				this.#machine.completeDefaultLinkGeneration(linkState, this.#now());
				this.#syncDraft();
				this.#render();
			} catch (error) {
				if (!this.#destroyed) {
					this.#machine.failDefaultLinkGeneration(this.#getErrorCode(error));
					this.#render();
				}
			}
		}
		#startCopyRequest(url) {
			const request = this.#copyCanonicalLink(url);
			this.#linkRequest = request;
			void request.finally(() => {
				if (this.#linkRequest === request) {
					this.#linkRequest = null;
				}
			});
		}
		async #copyCanonicalLink(url) {
			let copied = false;
			try {
				copied = await this.#copyText(url);
			} catch {
				copied = false;
			}
			if (this.#destroyed) {
				return;
			}
			if (copied) {
				ui_notification.Center.notify({
					content: main_core.Loc.getMessage('VIBECODECONNECTOR_CATALOG_SHARE_LINK_COPIED'),
					position: ui_notification.Position.TOP_RIGHT,
					useAirDesign: true
				});
			} else {
				this.#machine.setLinkSettingsError('COPY_FAILED');
			}
			this.#render();
		}
		async #saveShare() {
			let desiredShare = null;
			try {
				desiredShare = this.#machine.beginShareSave();
			} catch (error) {
				this.#machine.setEditableError(this.#getErrorCode(error));
				this.#render();
				return;
			}
			this.#render();
			try {
				const canonicalShare = await this.#api.setShare(this.#application.id, desiredShare);
				if (this.#destroyed) {
					return;
				}
				this.#machine.completeShareSave(canonicalShare);
				this.#syncDraft();
				this.#render();
				const canonicalLinkState = await this.#api.getLink(this.#application.id);
				if (this.#destroyed) {
					return;
				}
				this.#machine.completeLinkRefresh(canonicalLinkState);
				this.#syncDraft();
				this.#render();
				ui_notification.Center.notify({
					content: main_core.Loc.getMessage('VIBECODECONNECTOR_CATALOG_SHARE_SAVED'),
					position: ui_notification.Position.TOP_RIGHT,
					useAirDesign: true
				});
			} catch (error) {
				if (!this.#destroyed) {
					this.#machine.failSaving(this.#getErrorCode(error));
					this.#syncDraft();
					this.#render();
				}
			}
		}
		#syncDraft() {
			const snapshot = this.#machine.getSnapshot();
			if (snapshot.draftShare === null || snapshot.linkState === null) {
				return;
			}
			this.#draft = {
				share: snapshot.draftShare,
				linkState: snapshot.linkState
			};
		}
		#render() {
			if (this.#dialog === null) {
				return;
			}
			const snapshot = this.#machine.getSnapshot();
			const rendering = this.#view.render(snapshot);
			const linkStatuses = new Set([CatalogShareViewState.GeneratingDefaultLink, CatalogShareViewState.LinkSettings, CatalogShareViewState.ConfirmAnonymousLink, CatalogShareViewState.ConfirmPortalLinkRevoke, CatalogShareViewState.SavingLink]);
			this.#dialog.setTitle(main_core.Loc.getMessage(linkStatuses.has(snapshot.status) ? 'VIBECODECONNECTOR_CATALOG_SHARE_LINK_TITLE' : 'VIBECODECONNECTOR_CATALOG_SHARE_TITLE'));
			this.#dialog.setContent(rendering.content);
			this.#dialog.setLeftButtons(rendering.leftButtons);
			this.#dialog.setRightButtons(rendering.rightButtons);
		}
		#getErrorCode(error) {
			return error instanceof Error && error.message !== '' ? error.message : 'UNKNOWN_ERROR';
		}
		#copyToClipboard = async text => {
			if (navigator.clipboard && window.isSecureContext) {
				await navigator.clipboard.writeText(text);
				return true;
			}
			return BX.clipboard?.copy(text) === true;
		};
		#handleAfterHide = () => {
			this.#release(false);
		};
		#release(hide) {
			if (this.#destroyed) {
				return;
			}
			this.#destroyed = true;
			const confirmationMessageBox = this.#confirmationMessageBox;
			this.#confirmationMessageBox = null;
			this.#confirmationCancel = null;
			confirmationMessageBox?.close();
			this.#machine.close();
			this.#request = null;
			this.#saveRequest = null;
			this.#linkRequest = null;
			this.#applicationLinkCopyRequest = null;
			this.#view.destroy();
			const dialog = this.#dialog;
			this.#dialog = null;
			dialog?.unsubscribeAll();
			if (hide) {
				dialog?.hide();
			}
			this.#trigger.focus({
				preventScroll: true
			});
		}
	}

	class CatalogPopupItemShareAction {
		#item;
		constructor(item) {
			this.#item = item;
		}
		canBeShared() {
			return this.#item.kind === 'application' && this.#item.canShare === true;
		}
		getMenuItem(trigger) {
			if (!this.canBeShared()) {
				return null;
			}
			return {
				title: main_core.Loc.getMessage('VIBECODECONNECTOR_CATALOG_MENU_SHARE'),
				dataset: {
					testid: 'vibecode-catalog-share-menu'
				},
				onClick: () => {
					CatalogShareDialog.show({
						application: {
							id: this.#item.id,
							title: this.#item.title,
							iconUrl: this.#item.iconUrl,
							color: this.#item.color,
							viewUrl: this.#item.viewUrl
						},
						trigger
					});
				}
			};
		}
	}

	const KIND_APPLICATION = 'application';
	const KIND_BOT = 'bot';
	const CATALOG_OPENED_EVENT = 'im:vibe-code-catalog:opened';
	class CatalogPopupItem {
		#item;
		#pinButton;
		#hideAction;
		#deleteAction;
		#renameAction;
		#shareAction;
		#callbacks;
		#showHiddenBadge;
		#node = null;
		#newBadgeNode = null;
		#actionMenu = null;
		constructor(item, tab = null, callbacks = {}) {
			this.#item = item;
			this.#callbacks = callbacks;
			this.#showHiddenBadge = callbacks.showHiddenBadge === true;
			this.#pinButton = new CatalogPopupItemPinButton(item, tab, {
				onPinToggled: callbacks.onPinToggled
			});
			this.#hideAction = new CatalogPopupItemHideAction(item, tab, {
				onHiddenToggled: callbacks.onHiddenToggled,
				onHiddenCommitted: callbacks.onHiddenCommitted
			});
			this.#deleteAction = new CatalogPopupItemDeleteAction(item, tab);
			this.#renameAction = new CatalogPopupItemRenameAction(item, tab, {
				onRenamed: callbacks.onRenamed
			});
			this.#shareAction = new CatalogPopupItemShareAction(item);
		}
		render() {
			if (this.#node) {
				return this.#node;
			}
			const isClickable = this.#hasOpenTarget();
			const counterNode = this.#item.counter !== null && this.#item.counter > 0 ? renderItemCounter(this.#item.counter) : '';
			const subtitleNode = this.#item.description !== null && this.#item.description !== '' ? main_core.Tag.render`<p class="vibecode-catalog__item-subtitle ui-text --xs">${main_core.Text.encode(this.#item.description)}</p>` : '';
			const authorText = this.#item.isMine === true ? main_core.Loc.getMessage('VIBECODECONNECTOR_CATALOG_ITEM_AUTHOR_YOU') : this.#item.ownerName ?? main_core.Loc.getMessage('VIBECODECONNECTOR_CATALOG_ITEM_AUTHOR_UNKNOWN');
			const authorNode = ui_system_typography.Text.render(authorText, {
				tag: 'p',
				size: 'xs',
				className: 'vibecode-catalog__item-author'
			});
			authorNode.dataset.testid = 'vibecode-catalog-item-author';
			authorNode.title = authorText;
			const titleNode = ui_system_typography.Headline.render(this.#item.title, {
				tag: 'h4',
				size: 'xs',
				className: 'vibecode-catalog__item-title'
			});
			titleNode.dataset.testid = 'vibecode-catalog-item-title';
			const showBadge = this.#showHiddenBadge && this.#item.isHidden === true;
			const hiddenBadgeNode = showBadge ? main_core.Tag.render`
				<span class="vibecode-catalog__item-badge ui-text --2xs" data-testid="vibecode-catalog-item-hidden-badge">
					${main_core.Loc.getMessage('VIBECODECONNECTOR_CATALOG_BADGE_HIDDEN')}
				</span>
			` : '';
			const showNewBadge = this.#item.isNew === true && this.#item.isOpened !== true;
			const newBadgeNode = showNewBadge ? main_core.Tag.render`
				<span class="vibecode-catalog__item-badge vibecode-catalog__item-badge--new ui-text --2xs" data-testid="vibecode-catalog-item-new-badge">
					${main_core.Loc.getMessage('VIBECODECONNECTOR_CATALOG_BADGE_NEW')}
				</span>
			` : '';
			this.#newBadgeNode = showNewBadge ? newBadgeNode : null;
			const actionButtonNode = this.#renderActionButton();
			const pinButtonNode = this.#pinButton.render();
			const actionControlsNode = (pinButtonNode || actionButtonNode) && main_core.Tag.render`
			<div class="vibecode-catalog__item-action-button-wrap">
				${pinButtonNode}
				${actionButtonNode}
			</div>
		`;
			this.#node = main_core.Tag.render`
			<li
				class="vibecode-catalog__item${isClickable ? ' vibecode-catalog__item--clickable' : ''}${this.#item.isPinned ? ' vibecode-catalog__item--pinned' : ''}${showBadge ? ' vibecode-catalog__item--hidden' : ''}"
				data-id="${this.#item.id}"
				data-testid="vibecode-catalog-item"
			>
				${this.#renderItemIcon()}
				<div class="vibecode-catalog__item-content">
					<div class="vibecode-catalog__item-title-row">
						${titleNode}
						${hiddenBadgeNode}
						${newBadgeNode}
					</div>
					${authorNode}
					${subtitleNode}
				</div>
				<div class="vibecode-catalog__item-actions">
					${counterNode}
					${actionControlsNode}
				</div>
			</li>
		`;
			if (isClickable) {
				this.#bindLink(this.#node);
			}
			return this.#node;
		}
		#hasOpenTarget() {
			if (this.#isBotWithChat()) {
				return true;
			}
			return hasCatalogAppOpenTarget(this.#item.id, this.#item.viewUrl, this.#isApplication(), this.#item.externalId);
		}
		#isApplication() {
			return this.#item.kind === KIND_APPLICATION;
		}
		#isBotWithChat() {
			return this.#item.kind === KIND_BOT && this.#item.chatId !== null;
		}
		#recordOpen() {
			const wasNew = this.#item.isNew === true && this.#item.isOpened !== true;
			this.#markOpened();
			main_core.ajax.runAction('vibecodeconnector.Catalog.recordOpen', {
				data: {
					catalogItemId: this.#item.id
				}
			}).then(() => {
				if (wasNew) {
					main_core_events.EventEmitter.emit(CATALOG_OPENED_EVENT, {
						catalogItemId: this.#item.id
					});
				}
			}).catch(console.error);
		}

		// the badge goes, the isNew flag stays: the New slice is filtered by it, and the item must
		// hold its place in the open catalog until the user closes it
		#markOpened() {
			if (this.#item.isNew !== true || this.#item.isOpened === true) {
				return;
			}
			this.#item.isOpened = true;
			this.#callbacks.onOpened?.(this.#item.id);
			if (this.#newBadgeNode !== null) {
				this.#newBadgeNode.remove();
				this.#newBadgeNode = null;
			}
		}
		#openTarget() {
			this.#recordOpen();
			if (this.#isBotWithChat()) {
				void im_public.Messenger.openChat(String(this.#item.chatId));
				// the chat opens on the page behind the modal catalog, which would block it
				this.#callbacks.onChatOpen?.();
				return;
			}
			openCatalogApp(this.#buildOpenAppTarget());
		}
		#buildOpenAppTarget() {
			return {
				id: this.#item.id,
				title: this.#item.title,
				viewUrl: this.#item.viewUrl,
				externalId: this.#item.externalId,
				canOpenInIframe: this.#isApplication(),
				ownerId: this.#item.ownerId,
				ownerName: this.#item.ownerName,
				isMine: this.#item.isMine === true
			};
		}
		#getActionMenuItems(trigger) {
			const items = [];
			if (this.#item.editUrl !== null && this.#item.isMine === true) {
				items.push({
					title: main_core.Loc.getMessage('VIBECODECONNECTOR_CATALOG_MENU_EDIT_IN_VIBE'),
					onClick: () => openUrl(this.#item.editUrl)
				});
			}
			const shareMenuItem = this.#shareAction.getMenuItem(trigger);
			if (shareMenuItem) {
				items.push(shareMenuItem);
			}
			const renameMenuItem = this.#renameAction.getMenuItem();
			if (renameMenuItem) {
				items.push(renameMenuItem);
			}
			const pinMenuItem = this.#pinButton.getMenuItem();
			if (pinMenuItem) {
				items.push(pinMenuItem);
			}
			const hideMenuItem = this.#hideAction.getMenuItem();
			if (hideMenuItem) {
				items.push(hideMenuItem);
			}
			const deleteMenuItem = this.#deleteAction.getMenuItem();
			if (deleteMenuItem) {
				items.push(deleteMenuItem);
			}
			return items;
		}
		#renderActionButton() {
			const actionButtonNode = main_core.Tag.render`
			<button
				class="vibecode-catalog__item-action-button"
				type="button"
				aria-label="${main_core.Loc.getMessage('VIBECODECONNECTOR_CATALOG_ACTIONS_LABEL')}"
				data-testid="vibecode-catalog-item-action-btn"
			>
				${renderIcon('dots', 24)}
			</button>
		`;
			const menuItems = this.#getActionMenuItems(actionButtonNode) ?? [];
			if (menuItems.length <= 0) {
				return null;
			}
			main_core.Event.bind(actionButtonNode, 'click', event => {
				event.preventDefault();
				event.stopPropagation();
				this.#actionMenu ??= new ui_system_menu.Menu({
					items: menuItems,
					events: {
						onShow: () => {
							const menuButtons = this.#actionMenu?.getPopup()?.getPopupContainer()?.querySelectorAll('.ui-popup-menu-item-action') ?? [];
							menuItems.forEach((item, index) => {
								if (menuButtons[index] && item.dataset) {
									Object.assign(menuButtons[index].dataset, item.dataset);
								}
							});
							this.#bindMenuFollowScroll();
							this.#bindHeadPopupAdjust();
						},
						onClose: () => {
							this.#unbindMenuFollowScroll();
							this.#unbindHeadPopupAdjust();
						}
					}
				});
				this.#actionMenu.show(actionButtonNode);
			});
			return actionButtonNode;
		}
		#followScrollHandler = () => {
			const popup = this.#actionMenu?.getPopup();
			if (!popup || !this.#node) {
				return;
			}
			const body = this.#node.closest('.vibecode-catalog__body');
			if (!body) {
				return;
			}
			const itemRect = this.#node.getBoundingClientRect();
			const bodyRect = body.getBoundingClientRect();
			if (itemRect.bottom <= bodyRect.top || itemRect.top >= bodyRect.bottom - this.#node.offsetHeight) {
				this.#actionMenu.close();
				return;
			}
			popup.adjustPosition();
		};
		#bindMenuFollowScroll() {
			const body = this.#node?.closest('.vibecode-catalog__body');
			if (!body) {
				return;
			}
			main_core.Event.bind(body, 'scroll', this.#followScrollHandler, {
				passive: true
			});
		}
		#unbindMenuFollowScroll() {
			const body = this.#node?.closest('.vibecode-catalog__body');
			if (!body) {
				return;
			}
			main_core.Event.unbind(body, 'scroll', this.#followScrollHandler);
		}
		#headPopupAdjustHandler = event => {
			const headContainer = this.#node?.closest('.popup-window');
			if (!headContainer) {
				return;
			}
			const adjustingPopup = event.getTarget();
			if (adjustingPopup?.getPopupContainer?.() === headContainer) {
				this.#actionMenu?.close();
			}
		};
		#bindHeadPopupAdjust() {
			main_core_events.EventEmitter.subscribe('BX.Main.Popup:onBeforeAdjustPosition', this.#headPopupAdjustHandler);
		}
		#unbindHeadPopupAdjust() {
			main_core_events.EventEmitter.unsubscribe('BX.Main.Popup:onBeforeAdjustPosition', this.#headPopupAdjustHandler);
		}
		#renderItemIcon() {
			const iconNode = this.#item.iconUrl === null ? renderIcon('apps', 45) : main_core.Tag.render`<img class="vibecode-catalog__item-icon-img" src="${this.#item.iconUrl}" alt="" />`;
			const colorStyle = this.#item.color === null ? '' : `--vibecode-catalog-item-icon-background: ${this.#item.color};`;
			return main_core.Tag.render`
			<span
				class="vibecode-catalog__item-icon"
				aria-hidden="true"
				style="${colorStyle}"
			>${iconNode}</span>
		`;
		}
		#bindLink(node) {
			const itemNode = node;
			itemNode.tabIndex = 0;
			itemNode.setAttribute('role', 'link');
			main_core.Event.bind(itemNode, 'click', () => {
				sendCatalogAnalytics({
					event: 'open_app',
					c_section: 'item'
				});
				this.#openTarget();
			});
			main_core.Event.bind(itemNode, 'keydown', event => {
				if (event.key === 'Enter' || event.key === ' ') {
					event.preventDefault();
					sendCatalogAnalytics({
						event: 'open_app',
						c_section: 'item'
					});
					this.#openTarget();
				}
			});
		}
	}

	const CatalogState = Object.freeze({
		Active: 'active',
		Hidden: 'hidden',
		All: 'all',
		New: 'new'
	});
	const STATE_ORDER = [CatalogState.Active, CatalogState.Hidden, CatalogState.New, CatalogState.All];
	class CatalogPopupStateDropdown {
		#tab;
		#state;
		#onStateSelect;
		#hasNewApps;
		#chip;
		#node = null;
		#menu = null;
		#opened = false;
		constructor(options) {
			this.#tab = options.tab;
			this.#state = options.initialState ?? CatalogState.Active;
			this.#onStateSelect = options.onStateSelect;
			this.#hasNewApps = options.hasNewApps === true;
			this.#chip = new ui_system_chip.Chip({
				size: ui_system_chip.ChipSize.Md,
				design: ui_system_chip.ChipDesign.Outline,
				rounded: true,
				compact: true,
				dropdown: true,
				text: this.#getChipLabel(),
				onClick: () => this.#toggleMenu()
			});
		}
		render() {
			if (this.#node) {
				return this.#node;
			}
			this.#node = this.#chip.render();
			main_core.Dom.addClass(this.#node, 'vibecode-catalog__tab');
			this.#node.dataset.tabId = this.#tab.id;
			this.#node.setAttribute('role', 'tab');
			this.#node.setAttribute('aria-selected', 'false');
			this.#node.setAttribute('data-testid', `vibecode-catalog-tab-${this.#tab.id}`);
			return this.#node;
		}
		getChip() {
			return this.#chip;
		}
		getState() {
			return this.#state;
		}
		getAvailableStates() {
			return STATE_ORDER.filter(state => state === this.#state || state !== CatalogState.New || this.#hasNewApps);
		}
		setState(state) {
			this.#state = state;
			this.#chip.setText(this.#getChipLabel());
		}
		setHasNewApps(hasNewApps) {
			this.#hasNewApps = hasNewApps === true;
		}
		isMenuOpen() {
			return this.#opened;
		}
		closeMenu() {
			if (this.#opened) {
				this.#menu?.close();
			}
		}
		focus() {
			this.#node?.focus();
		}
		destroy() {
			this.#menu?.destroy();
			this.#menu = null;
			this.#node = null;
		}
		#toggleMenu() {
			if (!this.#node) {
				return;
			}
			if (this.#opened) {
				this.#menu?.close();
				return;
			}
			const menuItems = this.getAvailableStates().map(state => ({
				title: this.#getStateTitle(state),
				isSelected: state === this.#state,
				onClick: () => this.#select(state)
			}));
			if (this.#menu) {
				this.#menu.updateItems(menuItems);
			} else {
				this.#menu = new ui_system_menu.Menu({
					closeOnItemClick: true,
					items: menuItems,
					events: {
						onShow: () => {
							this.#opened = true;
							this.#chip.setDropdownActive(true);
						},
						onClose: () => {
							this.#opened = false;
							this.#chip.setDropdownActive(false);
						}
					}
				});
			}
			this.#menu.show(this.#node);
		}
		#select(state) {
			this.setState(state);
			this.#onStateSelect(state);
		}
		#getStateTitle(state) {
			if (state === CatalogState.Hidden) {
				return main_core.Loc.getMessage('VIBECODECONNECTOR_CATALOG_STATE_HIDDEN');
			}
			if (state === CatalogState.All) {
				return main_core.Loc.getMessage('VIBECODECONNECTOR_CATALOG_STATE_ALL');
			}
			if (state === CatalogState.New) {
				return main_core.Loc.getMessage('VIBECODECONNECTOR_CATALOG_STATE_NEW');
			}
			return main_core.Loc.getMessage('VIBECODECONNECTOR_CATALOG_STATE_ACTIVE');
		}
		#getChipLabel() {
			if (this.#state === CatalogState.Hidden) {
				return main_core.Loc.getMessage('VIBECODECONNECTOR_CATALOG_TAB_VIBECODE_HIDDEN');
			}
			if (this.#state === CatalogState.All) {
				return main_core.Loc.getMessage('VIBECODECONNECTOR_CATALOG_TAB_VIBECODE_ALL');
			}
			if (this.#state === CatalogState.New) {
				return main_core.Loc.getMessage('VIBECODECONNECTOR_CATALOG_TAB_VIBECODE_NEW');
			}
			return main_core.Loc.getMessage('VIBECODECONNECTOR_CATALOG_TAB_VIBECODE');
		}
	}

	class CatalogPopupList {
		#onScroll;
		#onChatOpen;
		#onReloadRequested;
		#initialSkeletonTiles;
		#paginationSkeletonTiles;
		#skeleton = new CatalogSkeleton();
		#myEmptyState = new CatalogPopupMyListEmptyState();
		#companyEmptyState = new CatalogPopupCompanyListEmptyState();
		#bodyNode = null;
		#listNode = null;
		#lastState = null;
		constructor(options) {
			this.#onScroll = options.onScroll;
			this.#onChatOpen = options.onChatOpen ?? null;
			this.#onReloadRequested = options.onReloadRequested ?? null;
			this.#initialSkeletonTiles = options.initialSkeletonTiles;
			this.#paginationSkeletonTiles = options.paginationSkeletonTiles;
		}
		render() {
			if (this.#bodyNode) {
				return this.#bodyNode;
			}
			this.#listNode = main_core.Tag.render`<ul class="vibecode-catalog__list"></ul>`;
			this.#bodyNode = main_core.Tag.render`<div class="vibecode-catalog__body" tabindex="-1"></div>`;
			main_core.Dom.append(this.#listNode, this.#bodyNode);
			main_core.Event.bind(this.#bodyNode, 'scroll', this.#onScroll);
			return this.#bodyNode;
		}
		renderItems(state) {
			if (!this.#bodyNode || !this.#listNode) {
				return;
			}
			this.#lastState = state;
			const ctrl = state.controllers.get(state.activeTabId);
			if (!ctrl) {
				return;
			}
			const items = ctrl.getItems();
			const isLoading = ctrl.isLoading();

			// a failed first load leaves nothing to render: without this the list would be an
			// empty box with no way back
			if (items.length === 0 && !isLoading && ctrl.hasFailed()) {
				this.#showLoadErrorState();
				return;
			}
			const shouldShowContentEmptyState = items.length === 0 && ctrl.isLoaded() && !isLoading && !ctrl.hasQuery() && this.#hasContentEmptyState(state.activeTabId);
			if (shouldShowContentEmptyState) {
				this.#showContentEmptyState(state.activeTabId, ctrl.getState());
				return;
			}
			const listNode = this.#showList();
			main_core.Dom.attr(listNode, 'aria-busy', isLoading ? 'true' : null);
			if (items.length === 0 && isLoading) {
				this.#skeleton.appendItems(listNode, this.#initialSkeletonTiles);
				return;
			}
			const tab = ctrl.getConfig();
			const showHiddenBadge = ctrl.getState() === CatalogState.All;
			for (const item of items) {
				const reRender = () => {
					ctrl.resortForPin(item.id);
					if (this.#lastState) {
						this.renderItems(this.#lastState);
					}
				};
				const reRenderAfterRename = () => {
					if (!ctrl.hasQuery()) {
						if (this.#lastState) {
							this.renderItems(this.#lastState);
						}
						return;
					}
					void ctrl.refresh().then(refreshed => {
						if (!refreshed) {
							console.error('[vibecodeconnector.catalog] rename list re-read failed; showing locally updated item');
						}
						if (this.#lastState) {
							this.renderItems(this.#lastState);
						}
					});
				};
				const popupItem = new CatalogPopupItem(item, tab, {
					onPinToggled: reRender,
					onHiddenToggled: reRender,
					onHiddenCommitted: () => this.#onReloadRequested?.(),
					onRenamed: reRenderAfterRename,
					onChatOpen: () => this.#onChatOpen?.(),
					onOpened: itemId => ctrl.markOpened(itemId),
					showHiddenBadge
				});
				main_core.Dom.append(popupItem.render(), listNode);
			}
			if (isLoading) {
				this.#skeleton.appendItems(listNode, this.#paginationSkeletonTiles);
				return;
			}
			if (items.length === 0 && ctrl.isLoaded()) {
				main_core.Dom.append(this.#renderEmptyState(), listNode);
			}
		}
		containsFocus() {
			return this.#bodyNode !== null && this.#bodyNode.contains(document.activeElement);
		}
		isScrollThresholdReached(thresholdPx) {
			if (!this.#bodyNode) {
				return false;
			}
			const distance = this.#bodyNode.scrollHeight - this.#bodyNode.scrollTop - this.#bodyNode.clientHeight;
			return distance <= thresholdPx;
		}
		updateSubtitleClamps() {
			if (!this.#listNode || !this.#listNode.isConnected) {
				return;
			}
			const subtitles = this.#listNode.querySelectorAll('.vibecode-catalog__item-subtitle');
			for (const subtitle of subtitles) {
				if (!(subtitle instanceof HTMLElement)) {
					continue;
				}
				const lineHeight = Number.parseFloat(window.getComputedStyle(subtitle).lineHeight);
				const availableHeight = subtitle.getBoundingClientRect().height;
				const lines = lineHeight > 0 ? Math.max(1, Math.floor((availableHeight + 1) / lineHeight)) : 1;
				main_core.Dom.style(subtitle, '-webkit-line-clamp', String(lines));
				main_core.Dom.style(subtitle, 'line-clamp', String(lines));
			}
		}
		destroy() {
			this.#toggleContentEmptyState(false);
			this.#bodyNode = null;
			this.#listNode = null;
			this.#lastState = null;
		}
		#showList() {
			const listNode = this.#listNode;
			const bodyNode = this.#bodyNode;
			if (!listNode || !bodyNode) {
				throw new Error('CatalogPopupList is not rendered');
			}
			main_core.Dom.removeClass(bodyNode, 'vibecode-catalog__body--static');
			this.#toggleContentEmptyState(false);
			if (!listNode.isConnected) {
				main_core.Dom.clean(bodyNode);
				main_core.Dom.append(listNode, bodyNode);
			}
			main_core.Dom.clean(listNode);
			return listNode;
		}
		#showContentEmptyState(activeTabId, catalogState) {
			if (!this.#bodyNode) {
				return;
			}
			main_core.Dom.clean(this.#bodyNode);
			main_core.Dom.addClass(this.#bodyNode, 'vibecode-catalog__body--static');
			if (catalogState === CatalogState.Hidden) {
				main_core.Dom.append(this.#renderHiddenEmptyState(), this.#bodyNode);
			} else {
				const emptyState = activeTabId === 'company' ? this.#companyEmptyState : this.#myEmptyState;
				main_core.Dom.append(emptyState.render(), this.#bodyNode);
			}
			this.#toggleContentEmptyState(true);
		}
		#showLoadErrorState() {
			if (!this.#bodyNode) {
				return;
			}
			main_core.Dom.clean(this.#bodyNode);
			main_core.Dom.addClass(this.#bodyNode, 'vibecode-catalog__body--static');
			main_core.Dom.append(this.#renderLoadErrorState(), this.#bodyNode);
			this.#toggleContentEmptyState(true);
		}
		#renderLoadErrorState() {
			const retryButton = new ui_buttons.Button({
				className: 'vibecode-catalog__popup-empty-state-button',
				size: ui_buttons.ButtonSize.MEDIUM,
				useAirDesign: true,
				style: ui_buttons.AirButtonStyle.FILLED,
				text: main_core.Loc.getMessage('VIBECODECONNECTOR_CATALOG_LIST_LOAD_RETRY'),
				dataset: {
					testid: 'vibecode-catalog-load-error-retry'
				},
				props: {
					type: 'button'
				},
				onclick: (button, event) => {
					event.preventDefault();

					// the button is about to be disabled and then dropped with the whole
					// state: without this the focus would land on the document body
					this.#bodyNode?.focus();
					button.setDisabled(true);
					this.#onReloadRequested?.();
				}
			});
			return main_core.Tag.render`
			<div class="vibecode-catalog__content-empty-state" role="alert" data-testid="vibecode-catalog-load-error">
				<div class="vibecode-catalog__popup-empty-state vibecode-catalog__popup-empty-state--content">
					<p class="vibecode-catalog__popup-empty-state-description ui-text --sm">
						${main_core.Loc.getMessage('VIBECODECONNECTOR_CATALOG_LIST_LOAD_ERROR')}
					</p>
					${retryButton.render()}
				</div>
			</div>
		`;
		}
		#renderHiddenEmptyState() {
			return main_core.Tag.render`
			<div class="vibecode-catalog__content-empty-state" data-testid="vibecode-catalog-hidden-empty">
				<p class="vibecode-catalog__hidden-empty-state ui-text --sm">
					${main_core.Loc.getMessage('VIBECODECONNECTOR_CATALOG_HIDDEN_EMPTY')}
				</p>
			</div>
		`;
		}
		#toggleContentEmptyState(isShown) {
			const contentNode = this.#bodyNode?.closest('.vibecode-catalog__content');
			if (!(contentNode instanceof HTMLElement)) {
				return;
			}
			const method = isShown ? main_core.Dom.addClass : main_core.Dom.removeClass;
			method(contentNode, 'vibecode-catalog__content--empty');
		}
		#hasContentEmptyState(tabId) {
			return [MY_TAB_ID, 'company'].includes(tabId);
		}
		#renderEmptyState() {
			return main_core.Tag.render`
			<li class="vibecode-catalog__item vibecode-catalog__item--empty">
				<div class="vibecode-catalog__item-content">
					<p class="vibecode-catalog__item-subtitle">
						${main_core.Loc.getMessage('VIBECODECONNECTOR_CATALOG_TAB_EMPTY')}
					</p>
				</div>
			</li>
		`;
		}
	}

	class CatalogPopupSearch {
		#input;
		constructor(options) {
			const useSearch = options.useSearch !== false;
			this.#input = new ui_system_input.Input({
				placeholder: main_core.Loc.getMessage('VIBECODECONNECTOR_CATALOG_SEARCH_PLACEHOLDER'),
				size: ui_system_input.InputSize.Md,
				stretched: true,
				withSearch: useSearch,
				onInput: options.onInput,
				onClear: options.onClear
			});
		}
		render() {
			return this.#input.render();
		}
		focus() {
			this.#input.focus();
		}
		getQuery() {
			return this.#input.getValue().trim();
		}
		destroy() {
			this.#input.destroy();
		}
	}

	function createPopupTabChip(tab, onClick) {
		const chip = new ui_system_chip.Chip({
			size: ui_system_chip.ChipSize.Md,
			design: ui_system_chip.ChipDesign.Outline,
			rounded: true,
			compact: true,
			text: tab.title,
			icon: main_core.Type.isStringFilled(tab.icon) ? getIconName(tab.icon) : null,
			onClick
		});
		const node = chip.render();
		main_core.Dom.addClass(node, 'vibecode-catalog__tab');
		node.dataset.tabId = tab.id;
		if (main_core.Type.isStringFilled(tab.navigateUrl)) {
			node.setAttribute('role', 'link');
		} else {
			node.setAttribute('role', 'tab');
			node.setAttribute('aria-selected', 'false');
		}
		node.setAttribute('data-testid', `vibecode-catalog-tab-${tab.id}`);
		if (main_core.Type.isNumber(tab.counter) && tab.counter > 0) {
			main_core.Dom.append(renderTabCounter(tab.counter), node);
		}
		return {
			chip,
			node
		};
	}

	class CatalogPopupTabsNav {
		#tabs;
		#hasNewApps;
		#initialState;
		#onTabSelect;
		#onStateSelect;
		#tabChips = new Map();
		#stateDropdown = null;
		#navNode = null;
		constructor(options) {
			this.#tabs = options.tabs;
			this.#hasNewApps = main_core.Type.isNumber(options.newAppsCount) && options.newAppsCount > 0;
			this.#initialState = options.initialState ?? null;
			this.#onTabSelect = options.onTabSelect;
			this.#onStateSelect = options.onStateSelect ?? null;
		}
		render() {
			if (this.#navNode) {
				return this.#navNode;
			}
			this.#tabChips.clear();
			this.#navNode = main_core.Tag.render`
			<nav
				class="vibecode-catalog__tabs"
				role="tablist"
				aria-label="${main_core.Loc.getMessage('VIBECODECONNECTOR_CATALOG_TABS_LABEL')}"
			></nav>
		`;
			for (const tab of this.#tabs) {
				main_core.Dom.append(this.#renderChip(tab), this.#navNode);
			}
			return this.#navNode;
		}
		setActiveTab(tabId) {
			for (const [candidateTabId, chip] of this.#tabChips) {
				const node = chip.getWrapper();
				if (!node) {
					continue;
				}
				if (node.getAttribute('role') !== 'tab') {
					continue;
				}
				const isActive = candidateTabId === tabId;
				chip.setDesign(isActive ? ui_system_chip.ChipDesign.OutlineAccent2 : ui_system_chip.ChipDesign.Outline);
				node.setAttribute('aria-selected', isActive ? 'true' : 'false');
			}
		}
		setNewAppsCount(value) {
			this.#hasNewApps = main_core.Type.isNumber(value) && value > 0;
			this.#stateDropdown?.setHasNewApps(this.#hasNewApps);
		}
		setState(state) {
			this.#stateDropdown?.setState(state);
		}
		isStateMenuOpen() {
			return this.#stateDropdown?.isMenuOpen() === true;
		}
		closeStateMenu() {
			this.#stateDropdown?.closeMenu();
		}
		focusStateChip() {
			this.#stateDropdown?.focus();
		}
		destroy() {
			this.#stateDropdown?.destroy();
			this.#stateDropdown = null;
			this.#tabChips.clear();
			this.#navNode = null;
		}
		#renderChip(tab) {
			if (tab.id === MY_TAB_ID && this.#onStateSelect !== null) {
				return this.#renderStateChip(tab);
			}
			const {
				chip,
				node
			} = createPopupTabChip(tab, () => this.#onTabSelect(tab.id));
			this.#tabChips.set(tab.id, chip);
			return node;
		}
		#renderStateChip(tab) {
			const dropdown = new CatalogPopupStateDropdown({
				tab,
				initialState: this.#initialState,
				hasNewApps: this.#hasNewApps,
				onStateSelect: state => this.#onStateSelect?.(state)
			});
			this.#stateDropdown = dropdown;
			this.#tabChips.set(tab.id, dropdown.getChip());
			return dropdown.render();
		}
	}

	function renderPopupTitleLink() {
		const titleLabel = main_core.Loc.getMessage('VIBECODECONNECTOR_CATALOG_TITLE') ?? '';
		const titleLinkNode = main_core.Tag.render`
		<a
			class="vibecode-catalog__title vibecode-catalog__title--link ui-headline --md --accent"
			href="${VIBECODE_DASHBOARD_URL}"
			target="_blank"
			rel="noopener noreferrer"
			aria-label="${titleLabel}"
			title="${titleLabel}"
		>
			<span class="vibecode-catalog__title-logo" aria-hidden="true">
				<span class="vibecode-catalog__title-logo-text">${titleLabel}</span>
			</span>
			<span class="vibecode-catalog__title-breadcrumb" aria-hidden="true">
				${renderIcon('chevron', 18)}
			</span>
		</a>
	`;
		main_core.Event.bind(titleLinkNode, 'click', event => {
			event.preventDefault();
			event.stopPropagation();
			sendCatalogAnalytics({
				event: 'click_vibecode',
				c_section: 'header'
			});
			openVibecodeDashboard();
		});
		return titleLinkNode;
	}

	class CatalogPopupView {
		#rootNode = null;
		#tabsNav;
		#search;
		#list;
		constructor(options) {
			this.#tabsNav = new CatalogPopupTabsNav({
				tabs: options.tabs,
				newAppsCount: options.newAppsCount,
				initialState: options.initialState,
				onTabSelect: options.onTabSelect,
				onStateSelect: options.onStateSelect
			});
			this.#search = new CatalogPopupSearch({
				onInput: options.onSearchInput,
				onClear: options.onSearchClear,
				useSearch: options.useSearch
			});
			this.#list = new CatalogPopupList({
				onScroll: options.onScroll,
				onChatOpen: options.onChatOpen,
				onReloadRequested: options.onReloadRequested,
				initialSkeletonTiles: options.initialSkeletonTiles,
				paginationSkeletonTiles: options.paginationSkeletonTiles
			});
		}
		render() {
			if (this.#rootNode) {
				return this.#rootNode;
			}
			this.#rootNode = main_core.Tag.render`
			<div class="vibecode-catalog">
				<header class="vibecode-catalog__header">
					${renderPopupTitleLink()}
					<div class="vibecode-catalog__search">
						${this.#search.render()}
					</div>
					${this.#tabsNav.render()}
				</header>
				<div class="vibecode-catalog__content">
					${this.#list.render()}
					${renderPopupFab()}
				</div>
			</div>
		`;
			return this.#rootNode;
		}
		destroy() {
			this.#tabsNav.destroy();
			this.#search.destroy();
			this.#list.destroy();
			this.#rootNode = null;
		}
		focusSearch() {
			this.#search.focus();
		}
		getSearchQuery() {
			return this.#search.getQuery();
		}
		setActiveTab(tabId) {
			this.#tabsNav.setActiveTab(tabId);
		}
		setNewAppsCount(value) {
			this.#tabsNav.setNewAppsCount(value);
		}
		setState(state) {
			this.#tabsNav.setState(state);
		}
		isStateMenuOpen() {
			return this.#tabsNav.isStateMenuOpen();
		}
		closeStateMenu() {
			this.#tabsNav.closeStateMenu();
		}
		focusStateChip() {
			this.#tabsNav.focusStateChip();
		}
		isFocusInsideList() {
			return this.#list.containsFocus();
		}
		renderList(options) {
			this.#list.renderItems(options);
		}
		isScrollThresholdReached(thresholdPx) {
			return this.#list.isScrollThresholdReached(thresholdPx);
		}
		updateSubtitleClamps() {
			this.#list.updateSubtitleClamps();
		}
	}

	class TabController {
		#config;
		#pageSize;
		#items = [];
		#offset = 0;
		#hasMore = true;
		#loaded = false;
		#loading = false;
		#failed = false;
		#generation = 0;
		#query = '';
		#state = CatalogState.Active;
		#viewSession = null;
		#newAppsCount = null;
		#openedIds = new Set();
		constructor(config, pageSize) {
			this.#config = config;
			this.#pageSize = pageSize;
		}
		isStub() {
			return this.#config.action === null;
		}
		getConfig() {
			return this.#config;
		}
		resortForPin(itemId) {
			const idx = this.#items.findIndex(row => row.id === itemId);
			if (idx < 0) {
				return;
			}
			const [picked] = this.#items.splice(idx, 1);
			if (picked.isPinned) {
				this.#items.unshift(picked);
				return;
			}
			const firstUnpinned = this.#items.findIndex(row => !row.isPinned);
			if (firstUnpinned < 0) {
				this.#items.push(picked);
				return;
			}
			this.#items.splice(firstUnpinned, 0, picked);
		}
		isLoading() {
			return this.#loading;
		}
		isLoaded() {
			return this.#loaded;
		}
		hasFailed() {
			return this.#failed;
		}
		countNewItems() {
			return this.#items.filter(item => item.isNew).length;
		}

		/**
		 * The New slice is a subset of the Active listing: when everything the server counted is
		 * already loaded, switching to it is a filter change and not another round to the server.
		 * Paging is over by definition: there is nothing new left beyond what is in hand.
		 */
		switchToLoadedNewSlice() {
			this.#state = CatalogState.New;
			this.#hasMore = false;
		}
		getItems() {
			return this.#items.filter(item => this.#matchesState(item));
		}
		getState() {
			return this.#state;
		}
		setState(state) {
			// The view session belongs to the whole catalog session, not to a load cycle or to a
			// slice: dropping it here would restart the session on the way back to New and put
			// the apps just shown in another slice into it.
			this.#state = state;
		}
		getNewAppsCount() {
			return this.#newAppsCount;
		}
		reset() {
			this.#reset();
		}

		/**
		 * The badge of an opened app must stay off for the rest of the catalog session, but the
		 * item itself does not survive it: a slice change resets the list and a refresh replaces
		 * it with server copies, and the server keeps reporting the app as new until the session
		 * ends. So the ids live on the controller and outlive both.
		 */
		markOpened(itemId) {
			if (!Number.isInteger(itemId) || itemId <= 0) {
				return;
			}
			this.#openedIds.add(itemId);
			const item = this.#items.find(row => row.id === itemId);
			if (item) {
				item.isOpened = true;
			}
		}

		/**
		 * The catalog session is over. Everything the session owns goes with it: the view
		 * session, so the next opening asks the server for a fresh one instead of holding the
		 * apps it has already shown in the New slice, and the loaded list with its query, so
		 * the next opening loads the list anew instead of rendering what is left in memory.
		 */
		endViewSession() {
			this.#viewSession = null;
			this.#query = '';
			this.#openedIds.clear();
			this.#reset();
		}
		#matchesState(item) {
			if (this.#state === CatalogState.Hidden) {
				return item.isHidden;
			}
			if (this.#state === CatalogState.All) {
				return true;
			}
			if (this.#state === CatalogState.New) {
				return item.isNew;
			}
			return !item.isHidden;
		}
		hasQuery() {
			return this.#query !== '';
		}
		shouldLoadMore() {
			if (this.isStub() || this.#loading) {
				return false;
			}
			return !this.#loaded || this.#hasMore;
		}

		// whether the listing in hand is the whole thing, regardless of a load being in flight
		hasMorePages() {
			return this.#hasMore;
		}
		setQuery(query) {
			if (query === this.#query) {
				return;
			}
			this.#query = query;
			this.#reset();
		}
		async loadNext() {
			if (this.isStub() || this.#loading || this.#loaded && !this.#hasMore) {
				return;
			}
			this.#loading = true;
			this.#failed = false;
			const generation = this.#generation;
			try {
				const actionOptions = this.#config.paginated === false ? {
					data: this.#buildData()
				} : this.#buildPagedActionOptions();
				const sentSession = actionOptions.data?.viewSession ?? null;
				const response = await main_core.ajax.runAction(this.#config.action, actionOptions);
				if (generation !== this.#generation) {
					return;
				}
				this.#rememberViewSession(response?.data?.viewSession, sentSession);
				this.#rememberNewAppsCount(response?.data?.newAppsCount);
				const rawItems = response?.data?.items ?? [];
				const newItems = rawItems.map(raw => this.#mapItem(raw));
				this.#appendPage(newItems);
				if (this.#config.paginated === false) {
					this.#hasMore = false;
				} else {
					this.#offset = this.#resolveNextOffset(response?.data?.pagination, newItems.length);
					this.#hasMore = this.#resolveHasMore(response?.data?.pagination, newItems.length);
				}
				this.#loaded = true;
			} catch (error) {
				if (generation === this.#generation) {
					this.#failed = true;
				}
				throw error;
			} finally {
				if (generation === this.#generation) {
					this.#loading = false;
				}
			}
		}
		async refresh() {
			if (this.isStub()) {
				return false;
			}
			const generation = ++this.#generation;
			this.#loading = true;
			this.#failed = false;
			try {
				const size = Math.max(this.#getPageSize(), this.#items.length);
				const actionOptions = this.#config.paginated === false ? {
					data: this.#buildData()
				} : {
					data: this.#buildData(),
					navigation: {
						page: 1,
						size
					}
				};
				const sentSession = actionOptions.data?.viewSession ?? null;
				const response = await main_core.ajax.runAction(this.#config.action, actionOptions);
				if (generation !== this.#generation) {
					return false;
				}
				this.#rememberViewSession(response?.data?.viewSession, sentSession);
				this.#rememberNewAppsCount(response?.data?.newAppsCount);
				const rawItems = response?.data?.items ?? [];
				this.#items = this.#dedupePage(rawItems.map(raw => this.#mapItem(raw)));
				if (this.#config.paginated === false) {
					this.#offset = 0;
					this.#hasMore = false;
				} else {
					// the server has served rawItems.length rows: paging moves by what it sent,
					// not by what is left after the duplicates are dropped
					this.#offset = this.#resolveNextOffset(response?.data?.pagination, rawItems.length);
					this.#hasMore = this.#resolveHasMore(response?.data?.pagination, rawItems.length);
				}
				this.#loaded = true;
				return true;
			} catch (error) {
				if (generation === this.#generation) {
					this.#failed = true;
				}
				console.error('[vibecodeconnector.catalog] failed to refresh tab', this.#config.id, error);
				return false;
			} finally {
				if (generation === this.#generation) {
					this.#loading = false;
				}
			}
		}

		/**
		 * Opening an app moves it in the server order, so a page loaded afterwards can bring an
		 * item the previous pages already had. The fresh copy wins - it carries the current pin,
		 * counter and novelty, but keeps its place in the list and the flags the client owns.
		 */
		#appendPage(newItems) {
			const positions = new Map();
			this.#items.forEach((item, index) => {
				// an item without an id is an anomaly of the response, not a duplicate of another
				if (item.id > 0) {
					positions.set(item.id, index);
				}
			});
			const appended = [];
			const appendedIds = new Set();
			for (const item of newItems) {
				if (item.id > 0 && appendedIds.has(item.id)) {
					continue;
				}
				const position = item.id > 0 ? positions.get(item.id) : undefined;
				if (position === undefined) {
					appended.push(item);
					if (item.id > 0) {
						appendedIds.add(item.id);
					}
					continue;
				}
				const loaded = this.#items[position];
				this.#items[position] = {
					...item,
					isOpened: loaded.isOpened === true ? true : item.isOpened
				};
			}
			this.#items = [...this.#items, ...appended];
		}
		#dedupePage(items) {
			const seen = new Set();

			// an item without an id is an anomaly of the response, not a duplicate of another
			return items.filter(item => {
				if (item.id <= 0 || !seen.has(item.id)) {
					seen.add(item.id);
					return true;
				}
				return false;
			});
		}
		#reset() {
			this.#failed = false;
			this.#items = [];
			this.#offset = 0;
			this.#hasMore = true;
			this.#loaded = false;
			this.#loading = false;
			this.#generation += 1;
		}
		#rememberViewSession(value, sentSession) {
			if (!Number.isInteger(value) || value <= 0) {
				return;
			}

			// A stamp we sent has been judged by the server: answering with another one means
			// ours is no longer accepted, so its value wins. An unsolicited stamp only fills an
			// empty slot - the listing that starts the session carries one whatever slice it
			// serves, while a later slice must not restart the session under the user.
			if (sentSession !== null || this.#viewSession === null) {
				this.#viewSession = value;
			}
		}
		#rememberNewAppsCount(value) {
			if (Number.isInteger(value) && value >= 0) {
				this.#newAppsCount = value;
			}
		}
		#buildData() {
			const data = {
				...this.#config.extraData,
				state: this.#state
			};
			if (this.#query !== '') {
				data.q = this.#query;
			}
			if (this.#state === CatalogState.New && this.#viewSession !== null) {
				data.viewSession = this.#viewSession;
			}
			return data;
		}
		#buildPagedActionOptions() {
			const pageSize = this.#getPageSize();
			return {
				data: this.#buildData(),
				navigation: {
					page: Math.floor(this.#offset / pageSize) + 1,
					size: pageSize
				}
			};
		}
		#resolveNextOffset(pagination, loadedItemsCount) {
			if (!main_core.Type.isPlainObject(pagination)) {
				return this.#offset + loadedItemsCount;
			}
			const responseOffset = this.#normalizeInteger(pagination.offset);
			return responseOffset + loadedItemsCount;
		}
		#resolveHasMore(pagination, loadedItemsCount) {
			if (main_core.Type.isPlainObject(pagination) && main_core.Type.isBoolean(pagination.hasNext)) {
				return pagination.hasNext;
			}
			return loadedItemsCount >= this.#getPageSize();
		}
		#normalizeInteger(value) {
			if (main_core.Type.isNumber(value)) {
				return Math.max(0, value);
			}
			if (main_core.Type.isString(value)) {
				const parsed = Number.parseInt(value, 10);
				return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
			}
			return 0;
		}
		#getPageSize() {
			return Math.max(1, this.#pageSize);
		}
		#mapItem(raw) {
			const id = main_core.Type.isNumber(raw?.id) ? raw.id : Number.parseInt(raw?.id, 10) || 0;
			return {
				id,
				isOpened: this.#openedIds.has(id),
				title: main_core.Type.isString(raw?.title) ? raw.title : '',
				description: main_core.Type.isString(raw?.description) ? raw.description : null,
				isDescriptionDefault: Boolean(raw?.isDescriptionDefault),
				iconUrl: main_core.Type.isString(raw?.iconUrl) ? raw.iconUrl : null,
				editUrl: this.#normalizeUrl(raw?.editUrl ?? raw?.EDIT_URL),
				viewUrl: this.#normalizeUrl(raw?.viewUrl ?? raw?.VIEW_URL),
				externalId: main_core.Type.isString(raw?.externalId) ? raw.externalId : null,
				color: this.#normalizeColor(raw?.color ?? raw?.COLOR),
				counter: main_core.Type.isNumber(raw?.counter) ? raw.counter : null,
				isPinned: Boolean(raw?.isPinned),
				isHidden: Boolean(raw?.isHidden),
				isMine: Boolean(raw?.isMine),
				isPublished: Boolean(raw?.isPublished),
				isNew: Boolean(raw?.isNew),
				canShare: main_core.Type.isBoolean(raw?.canShare) ? raw.canShare : false,
				ownerId: main_core.Type.isNumber(raw?.ownerId) ? raw.ownerId : Number.parseInt(raw?.ownerId, 10) || 0,
				ownerName: main_core.Type.isStringFilled(raw?.ownerName) ? raw.ownerName : null,
				kind: main_core.Type.isString(raw?.kind) ? raw.kind : '',
				chatId: this.#normalizeChatId(raw?.chatId)
			};
		}
		#normalizeChatId(value) {
			if (main_core.Type.isNumber(value) && value > 0) {
				return value;
			}
			if (main_core.Type.isString(value)) {
				const parsed = Number.parseInt(value, 10);
				return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
			}
			return null;
		}
		#normalizeColor(value) {
			if (!main_core.Type.isString(value)) {
				return null;
			}
			return /^#[\dA-Fa-f]{6}$/.test(value) ? value : null;
		}
		#normalizeUrl(value) {
			if (!main_core.Type.isString(value)) {
				return null;
			}
			const normalized = value.trim();
			if (normalized === '') {
				return null;
			}
			if (normalized.startsWith('//')) {
				return null;
			}
			if (!/^[A-Za-z][\d+.A-Za-z-]*:/.test(normalized)) {
				return normalized.startsWith('/') ? normalized : null;
			}
			try {
				const url = new URL(normalized);
				return ['http:', 'https:'].includes(url.protocol) ? normalized : null;
			} catch {
				return null;
			}
		}
	}

	const SEARCH_DEBOUNCE_MS = 300;
	const SKELETON_TILES = 5;
	const EMPTY_TILES_ON_PAGINATION = 3;
	const SCROLL_THRESHOLD_PX = 60;
	const DISABLE_SCROLLING_CLASS = 'ui-system-dialog__disable-scrolling';
	const CatalogStateMode = Object.freeze({
		Normal: 'normal',
		Empty: 'empty',
		NoAccess: 'no-access'
	});

	// analytics reports the modes in its own spelling
	const STATE_MODE_ANALYTICS = Object.freeze({
		[CatalogStateMode.Normal]: 'normal',
		[CatalogStateMode.Empty]: 'empty',
		[CatalogStateMode.NoAccess]: 'no_access'
	});
	function resolveStateMode(options) {
		if (Object.values(CatalogStateMode).includes(options.stateMode)) {
			return options.stateMode;
		}
		return options.forceEmpty === true ? CatalogStateMode.Empty : CatalogStateMode.Normal;
	}
	class CatalogPopup {
		#tabs;
		#pageSize;
		#stateMode;
		#newAppsCount;
		#controllers = new Map();
		#emptyState;
		#noAccessState;
		#skeleton;
		#positioner;
		#sliderGuard;
		#activeTabId = null;
		#onCloseHandlers = [];
		#stateSelectedByUser = false;
		#responseStateApplied = false;
		#dialog = null;
		#isShown = false;
		#bindNode = null;
		#rootNode = null;
		#view = null;
		#searchTimer = null;
		#onNewAppsCount = null;
		#ownsScrollLock = false;
		constructor(options) {
			this.#tabs = options.tabs;
			this.#pageSize = options.pageSize;
			this.#stateMode = resolveStateMode(options);
			this.#onNewAppsCount = options.onNewAppsCount ?? null;
			this.#newAppsCount = main_core.Type.isNumber(options.newAppsCount) && options.newAppsCount > 0 ? Math.trunc(options.newAppsCount) : 0;
			for (const tab of this.#tabs) {
				this.#controllers.set(tab.id, new TabController(tab, this.#pageSize));
			}
			this.#skeleton = new CatalogSkeleton();
			this.#emptyState = new CatalogEmptyState();
			this.#noAccessState = new CatalogNoAccessState();
			this.#positioner = new CatalogPopupPositioner({
				getRootNode: () => this.#rootNode,
				getBindNode: () => this.#bindNode,
				onReposition: () => this.#view?.updateSubtitleClamps()
			});
			this.#sliderGuard = new CatalogPopupSliderGuard({
				getRootNode: () => this.#rootNode
			});
		}
		subscribeOnClose(handler) {
			this.#onCloseHandlers.push(handler);
		}
		isShown() {
			return this.#isShown;
		}
		setNewAppsCount(value) {
			// opening an app spends the counter at once, and the owner of the badge recounts it
			// right after; the New slice the user is in the middle of must not go with it
			if (this.#isShown && this.#newAppsCount > 0 && !(main_core.Type.isNumber(value) && value > 0)) {
				return;
			}
			this.#applyNewAppsCount(value);
		}
		adoptLoadingPopup(loadingPopup) {
			const popup = loadingPopup?.takeOver(() => this.#fireCloseHandlers());
			if (popup === null || popup === undefined) {
				return false;
			}
			this.#dialog = popup.dialog;
			this.#rootNode = popup.rootNode;
			this.#bindNode = popup.bindNode;
			this.#isShown = true;
			this.#positioner.bind();
			this.#sliderGuard.bind();
			sendCatalogAnalytics({
				event: 'open_popup',
				p1: STATE_MODE_ANALYTICS[this.#stateMode]
			});
			if (this.#hasStateCard()) {
				main_core.Dom.removeClass(this.#rootNode, 'vibecode-catalog-loading__dialog-root');
				this.#setRootContent(this.#renderStateCard());
				this.#enableScrollLock();
			} else {
				main_core.Dom.removeClass(this.#rootNode, 'vibecode-catalog-loading__dialog-root');
				main_core.Dom.addClass(this.#rootNode, 'vibecode-catalog__dialog-root');
				this.#initializePopup();
			}
			this.#syncLayout();
			this.#view?.focusSearch();
			return true;
		}
		#applyNewAppsCount(value) {
			this.#newAppsCount = main_core.Type.isNumber(value) && value > 0 ? Math.trunc(value) : 0;
			this.#view?.setNewAppsCount(this.#newAppsCount);
		}
		show(bindNode) {
			if (bindNode) {
				this.#bindNode = bindNode;
			}
			if (this.#dialog === null) {
				const hasStateCard = this.#hasStateCard();
				this.#rootNode = hasStateCard ? main_core.Tag.render`<div></div>` : main_core.Tag.render`<div class="vibecode-catalog__dialog-root"></div>`;
				this.#resetViewState();
				this.#setRootContent(hasStateCard ? this.#renderStateCard() : this.#skeleton.renderPopup(SKELETON_TILES));
				this.#dialog = new ui_system_dialog.Dialog({
					hasHorizontalPadding: false,
					hasVerticalPadding: false,
					content: this.#rootNode,
					hasCloseButton: true,
					hasOverlay: true,
					disableScrolling: hasStateCard,
					closeByEsc: true,
					closeByClickOutside: true,
					events: {
						onShow: () => {
							this.#isShown = true;
							this.#positioner.bind();
							this.#sliderGuard.bind();
							this.#syncLayout();
							sendCatalogAnalytics({
								event: 'open_popup',
								p1: STATE_MODE_ANALYTICS[this.#stateMode]
							});
						},
						onAfterShow: () => {
							this.#syncLayout();
							this.#view?.focusSearch();
						},
						onHide: () => this.#fireCloseHandlers()
					}
				});
				if (!hasStateCard) {
					this.#initializePopup();
				}
			} else if (this.#isShown) {
				this.#syncLayout();
				this.#view?.focusSearch();
				return;
			}
			this.#dialog.show();
		}

		// a state card is the whole content of the popup: no tabs, no list, no requests
		#hasStateCard() {
			return this.#stateMode !== CatalogStateMode.Normal;
		}
		#renderStateCard() {
			return this.#stateMode === CatalogStateMode.NoAccess ? this.#noAccessState.render() : this.#emptyState.render();
		}
		#initializePopup() {
			if (!this.#rootNode || this.#dialog === null) {
				return;
			}
			this.#stateSelectedByUser = false;
			this.#responseStateApplied = false;
			const initialState = this.#resolveInitialState();
			this.#applyStateToController(initialState);
			this.#resetViewState();
			this.#view = new CatalogPopupView({
				tabs: this.#tabs,
				newAppsCount: this.#newAppsCount,
				initialState,
				onTabSelect: tabId => this.#switchTo(tabId),
				onStateSelect: state => {
					this.#stateSelectedByUser = true;
					this.#selectState(state);
				},
				onReloadRequested: () => this.#reloadActiveState(),
				onSearchInput: () => this.#scheduleSearch(),
				onSearchClear: () => {
					this.#clearSearchTimer();
					this.#applySearch();
				},
				onScroll: () => this.#onMaybeLoadMore(),
				onChatOpen: () => this.close(),
				useSearch: true,
				initialSkeletonTiles: SKELETON_TILES,
				paginationSkeletonTiles: EMPTY_TILES_ON_PAGINATION
			});
			this.#setRootContent(this.#view.render());
			this.#setInitialTab();
			this.#syncLayout();
			this.#view?.focusSearch();
		}
		close() {
			this.#dialog?.hide();
		}
		#fireCloseHandlers() {
			this.#releaseScrollLock();
			this.#positioner.reset();
			this.#sliderGuard.reset();
			if (this.#searchTimer) {
				clearTimeout(this.#searchTimer);
				this.#searchTimer = null;
			}
			for (const ctrl of this.#controllers.values()) {
				ctrl.endViewSession();
			}
			this.#isShown = false;
			this.#activeTabId = null;
			this.#view?.destroy();
			this.#dialog = null;
			this.#bindNode = null;
			this.#rootNode = null;
			this.#view = null;
			for (const handler of this.#onCloseHandlers) {
				handler();
			}
		}
		#enableScrollLock() {
			if (this.#ownsScrollLock) {
				return;
			}
			main_core.Dom.addClass(document.body, DISABLE_SCROLLING_CLASS);
			this.#ownsScrollLock = true;
		}
		#releaseScrollLock() {
			if (!this.#ownsScrollLock) {
				return;
			}
			main_core.Dom.removeClass(document.body, DISABLE_SCROLLING_CLASS);
			this.#ownsScrollLock = false;
		}
		#setRootContent(content) {
			if (!this.#rootNode) {
				return;
			}
			main_core.Dom.clean(this.#rootNode);
			main_core.Dom.append(content, this.#rootNode);
		}
		#resetViewState() {
			this.#view?.destroy();
			this.#view = null;
		}
		#resolveInitialState() {
			return this.#newAppsCount > 0 ? CatalogState.New : CatalogState.Active;
		}
		#setInitialTab() {
			const firstTab = this.#tabs[0];
			if (!firstTab) {
				return;
			}
			this.#activeTabId = firstTab.id;
			this.#view?.setActiveTab(firstTab.id);
			void this.#loadInitial(firstTab.id);
		}

		// the slice to open on is guessed from a counter that may be stale, so the first response
		// is rendered only once it is clear the guess holds: otherwise the listing of the wrong
		// slice would flash before the switch
		async #loadInitial(tabId) {
			const ctrl = this.#controllers.get(tabId);
			if (ctrl?.shouldLoadMore()) {
				const loadPromise = ctrl.loadNext();
				// the skeleton belongs to the loading state, not to a slice: it holds the frame
				// while the slice is still in question
				this.#renderList();
				try {
					await loadPromise;
				} catch (error) {
					console.error('[vibecodeconnector.catalog] failed to load tab', tabId, error);
				}
			} else {
				this.#renderList();
			}
			if (this.#activeTabId !== tabId) {
				return;
			}
			if (!this.#applyStateFromResponse()) {
				this.#renderList();
			}
		}
		#applyStateFromResponse() {
			if (this.#responseStateApplied || this.#stateSelectedByUser || this.#activeTabId !== MY_TAB_ID) {
				return false;
			}
			const ctrl = this.#controllers.get(MY_TAB_ID);
			const newAppsCount = ctrl?.getNewAppsCount() ?? null;
			if (!ctrl || newAppsCount === null || ctrl.hasQuery()) {
				return false;
			}
			this.#responseStateApplied = true;
			// the server is the one source allowed to lower the count: it answers for the very
			// session being opened
			this.#applyNewAppsCount(newAppsCount);
			// the value came from the server, so the owner of the badge learns it too instead of
			// waiting for its own recount to land
			this.#onNewAppsCount?.(this.#newAppsCount);
			const state = ctrl.getState();
			if (state === CatalogState.Active && newAppsCount > 0) {
				// the response that served the Active slice already carries the new apps and had
				// them marked as viewed, so when all of them are in hand the switch costs nothing.
				// The count and the listing are two separate reads: only a listing with nothing
				// left beyond it proves there is no new app hiding past the page.
				if (!ctrl.hasMorePages() && ctrl.countNewItems() >= newAppsCount) {
					this.#view?.setState(CatalogState.New);
					ctrl.switchToLoadedNewSlice();
					this.#renderList();
					return true;
				}
				return this.#applyState(CatalogState.New);
			}

			// An empty slice is enough on its own: the counter and the listing are two different
			// reads, and waiting for both to agree would leave the catalog sitting on a slice
			// that has nothing to show.
			if (state === CatalogState.New && ctrl.getItems().length === 0) {
				return this.#applyState(CatalogState.Active);
			}
			return false;
		}
		#applyState(state) {
			// the list is re-rendered from scratch below, so a focused item would be dropped; the
			// slice menu closed right after takes the focus with it just the same
			const shouldMoveFocus = this.#view?.isFocusInsideList() === true || this.#view?.isStateMenuOpen() === true;
			this.#view?.closeStateMenu();
			this.#view?.setState(state);
			const switched = this.#selectState(state);
			if (shouldMoveFocus) {
				this.#view?.focusStateChip();
			}
			return switched;
		}
		#applyStateToController(state) {
			const ctrl = this.#controllers.get(MY_TAB_ID);
			if (!ctrl || ctrl.getState() === state) {
				return false;
			}
			ctrl.setState(state);
			ctrl.reset();
			return true;
		}
		#switchTo(tabId) {
			sendCatalogAnalytics({
				event: 'click_tab',
				p1: tabId
			});
			const tab = this.#tabs.find(t => t.id === tabId);
			if (main_core.Type.isStringFilled(tab?.navigateUrl)) {
				BX.SidePanel.Instance.open(tab.navigateUrl);
				return;
			}
			this.#activeTabId = tabId;
			this.#view?.setActiveTab(tabId);

			// no #renderList() here: the load below paints the frame synchronously, either the
			// listing in hand or the skeleton over the request it has just started
			void this.#loadIfNeeded(tabId);
		}
		#selectState(state) {
			if (!this.#applyStateToController(state)) {
				return false;
			}
			this.#activeTabId = MY_TAB_ID;
			this.#view?.setActiveTab(MY_TAB_ID);
			// no #renderList() here: the slice was just reset, so the frame would hold neither a
			// listing nor a skeleton - the load below paints both
			void this.#loadIfNeeded(MY_TAB_ID);
			return true;
		}
		#reloadActiveState() {
			if (this.#activeTabId === null) {
				return;
			}
			const ctrl = this.#controllers.get(this.#activeTabId);
			// a failed listing is worth retrying in any slice, the All one included
			if (!ctrl || ctrl.getState() === CatalogState.All && !ctrl.hasFailed()) {
				return;
			}
			const reloadPromise = ctrl.refresh();
			// the wait is shown right away: the skeleton replaces whatever the retry was started from
			this.#renderList();
			void reloadPromise.then(() => {
				// the slice was guessed from a counter that may be stale, and a first load that
				// failed left the guess unchecked: the retry answer is the first word the server
				// says, so it decides the slice instead of leaving an empty New under the user
				if (ctrl.hasFailed() || !this.#applyStateFromResponse()) {
					this.#renderList();
				}
			});
		}
		async #loadIfNeeded(tabId) {
			const ctrl = this.#controllers.get(tabId);
			if (!ctrl || !ctrl.shouldLoadMore()) {
				// nothing to wait for, so what is in hand is what the screen gets
				this.#renderList();
				return;
			}
			const loadPromise = ctrl.loadNext();
			this.#renderList();
			try {
				await loadPromise;
			} catch (error) {
				console.error('[vibecodeconnector.catalog] failed to load tab', tabId, error);
			}
			if (this.#activeTabId !== null) {
				this.#renderList();
			}
		}
		#renderList() {
			if (!this.#view || !this.#activeTabId) {
				return;
			}
			this.#view.renderList({
				activeTabId: this.#activeTabId,
				controllers: this.#controllers
			});
			this.#syncLayout();
		}
		#onMaybeLoadMore() {
			if (!this.#view || !this.#activeTabId) {
				return;
			}
			const ctrl = this.#controllers.get(this.#activeTabId);
			if (!ctrl || !ctrl.shouldLoadMore()) {
				return;
			}
			if (this.#view.isScrollThresholdReached(SCROLL_THRESHOLD_PX)) {
				void this.#loadIfNeeded(this.#activeTabId);
			}
		}
		#applySearch() {
			const query = this.#view?.getSearchQuery() ?? '';
			for (const ctrl of this.#controllers.values()) {
				ctrl.setQuery(query);
			}
			if (this.#activeTabId) {
				void this.#loadIfNeeded(this.#activeTabId);
			}
		}
		#scheduleSearch() {
			this.#clearSearchTimer();
			this.#searchTimer = setTimeout(() => {
				this.#searchTimer = null;
				this.#applySearch();
			}, SEARCH_DEBOUNCE_MS);
		}
		#clearSearchTimer() {
			if (this.#searchTimer) {
				clearTimeout(this.#searchTimer);
				this.#searchTimer = null;
			}
		}
		#syncLayout() {
			this.#view?.updateSubtitleClamps();
			this.#positioner.position();
		}
	}

	const DEFAULT_TABS = [
	// {
	// 	id: 'vibe24',
	// 	title: Loc.getMessage('VIBECODECONNECTOR_CATALOG_TAB_VIBE24'),
	// 	action: 'vibecodeconnector.Catalog.vibe24List',
	// },
	{
		id: MY_TAB_ID,
		title: main_core.Loc.getMessage('VIBECODECONNECTOR_CATALOG_TAB_VIBECODE'),
		action: 'vibecodeconnector.Catalog.myList'
	}, {
		id: 'market',
		title: main_core.Loc.getMessage('VIBECODECONNECTOR_CATALOG_TAB_MARKETPLACE'),
		action: null,
		icon: 'market',
		navigateUrl: main_core.Extension.getSettings('vibecodeconnector.catalog').get('marketUrl', null)
	}];
	class Catalog {
		#popup = null;
		#tabs;
		#pageSize;
		#isEmpty;
		#newAppsCount;
		#onClose = null;
		constructor(options = {}) {
			const allTabs = main_core.Type.isArray(options.tabs) ? options.tabs : DEFAULT_TABS;
			const baseTabs = allTabs.filter(tab => tab.navigateUrl === undefined || main_core.Type.isStringFilled(tab.navigateUrl));
			const previewUserId = main_core.Type.isNumber(options.previewUserId) && options.previewUserId > 0 ? options.previewUserId : null;
			this.#tabs = previewUserId === null ? baseTabs : baseTabs.map(tab => ({
				...tab,
				extraData: {
					...tab.extraData,
					previewUserId
				}
			}));
			this.#pageSize = main_core.Type.isNumber(options.pageSize) ? options.pageSize : 20;
			this.#isEmpty = main_core.Type.isBoolean(options.isEmpty) ? options.isEmpty : main_core.Extension.getSettings('vibecodeconnector.catalog').get('isEmpty', false) === true;
			this.#newAppsCount = this.#normalizeCount(main_core.Type.isNumber(options.newAppsCount) ? options.newAppsCount : main_core.Extension.getSettings('vibecodeconnector.catalog').get('newAppsCount', 0));
			this.#onClose = main_core.Type.isFunction(options.onClose) ? options.onClose : null;
		}
		#normalizeCount(value) {
			return main_core.Type.isNumber(value) && value > 0 ? Math.trunc(value) : 0;
		}
		setNewAppsCount(value) {
			this.#newAppsCount = this.#normalizeCount(value);
			this.#popup?.setNewAppsCount(this.#newAppsCount);
		}
		showEmpty(bindNode = null) {
			const popup = new CatalogPopup({
				tabs: [],
				pageSize: 0,
				forceEmpty: true
			});
			popup.show(bindNode);
			return popup;
		}
		show(bindNode = null, loadingPopup = null) {
			this.#openPopup(bindNode, () => new CatalogPopup({
				tabs: this.#tabs,
				pageSize: this.#pageSize,
				forceEmpty: this.#isEmpty,
				newAppsCount: this.#newAppsCount,
				onNewAppsCount: value => {
					this.#newAppsCount = this.#normalizeCount(value);
				}
			}), loadingPopup);
		}
		showNoAccess(bindNode = null, loadingPopup = null) {
			this.#openPopup(bindNode, () => new CatalogPopup({
				tabs: [],
				pageSize: 0,
				stateMode: CatalogStateMode.NoAccess
			}), loadingPopup);
		}
		#openPopup(bindNode, createPopup, loadingPopup) {
			if (this.#popup === null) {
				this.#popup = createPopup();
				this.#popup.subscribeOnClose(() => {
					this.#popup = null;
					this.#onClose?.();
				});
				if (loadingPopup !== null && this.#popup.adoptLoadingPopup(loadingPopup)) {
					return;
				}
			}
			this.#popup.show(bindNode);
		}
		close() {
			this.#popup?.close();
		}
	}

	exports.Catalog = Catalog;

})(this.BX.Vibecodeconnector = this.BX.Vibecodeconnector || {}, BX, BX.UI.System, BX.SidePanel, BX.UI, BX.UI.Analytics, window, BX.UI, BX.Intranet.User, BX.Event, BX.Main, BX.UI.IconSet, BX.UI.System, BX.UI.System, BX.UI.System.Typography, BX.Messenger.v2.Lib, BX.UI, window, window, BX.UI.Notification, BX.UI.System.Input, BX.UI.Dialogs, BX.UI.DatePicker, BX.UI.EntitySelector, BX.UI, BX.UI.System.Chip);
//# sourceMappingURL=catalog.bundle.js.map
