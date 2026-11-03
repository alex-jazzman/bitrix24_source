/* eslint-disable */
this.BX = this.BX || {};
this.BX.Vibecodeconnector = this.BX.Vibecodeconnector || {};
(function (exports, main_core, main_sidepanel, ui_buttons, ui_iconSet_api_core) {
	'use strict';

	const LOADER_VIDEO_SRC = '/bitrix/js/vibecodeconnector/open-app/images/bg-blackhole-B-video-min.mp4';
	const LOADER_VIDEO_POSTER = '/bitrix/js/vibecodeconnector/open-app/dist/images/bg-blackhole-B-poster.webp';
	const FULLSCREEN_LEFT_BOUNDARY = 65;
	const ICON_EXPAND = 'ui-icon-set --expand-l';
	const ICON_COLLAPSE = 'ui-icon-set --collapse-l';
	const LOC_EXPAND = 'VIBECODECONNECTOR_CATALOG_OPEN_APP_EXPAND';
	const LOC_COLLAPSE = 'VIBECODECONNECTOR_CATALOG_OPEN_APP_COLLAPSE';
	const RESTART_COOLDOWN_MS = 500;
	const LOADER_SAFETY_TIMEOUT_MS = 30000;
	const LOADER_LOGO_PATH = '/bitrix/js/vibecodeconnector/open-app-loader/images/';
	class OpenAppView {
		#options;
		#container = null;
		#contentArea = null;
		#identityNode = null;
		#iconSlot = null;
		#titleNode = null;
		#iconNode = null;
		#loader = null;
		#currentIframe = null;
		#safetyTimer = null;
		#layoutGeneration = 0;
		#mountQueue = Promise.resolve();
		#lastRestartAt = null;
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
		setTitle(title) {
			if (!main_core.Type.isStringFilled(title)) {
				return;
			}
			this.#options.title = title;
			this.#applyTitle();
		}
		setIconUrl(iconUrl) {
			this.getContainer();
			if (this.#iconNode?.getAttribute('src') === iconUrl) {
				return;
			}
			main_core.Dom.remove(this.#iconNode);
			this.#iconNode = null;
			if (!main_core.Type.isStringFilled(iconUrl) || this.#iconSlot === null) {
				return;
			}
			const icon = main_core.Tag.render`
			<img
				class="vibecode-catalog-open-app__icon"
				alt=""
				aria-hidden="true"
				data-testid="vibecode-open-app-icon"
			>
		`;
			main_core.Event.bindOnce(icon, 'load', () => {
				main_core.Dom.addClass(icon, '--loaded');
			});
			main_core.Event.bindOnce(icon, 'error', () => {
				main_core.Dom.remove(icon);
				if (this.#iconNode === icon) {
					this.#iconNode = null;
				}
			});
			this.#iconNode = icon;
			main_core.Dom.append(icon, this.#iconSlot);
			main_core.Dom.attr(icon, 'src', iconUrl);
		}
		setIconColor(color) {
			this.#options.iconColor = color;
			this.getContainer();
			this.#applyIconColor();
		}
		setFullscreenControls(slider, fullscreenLabel) {
			this.#fullscreenSlider = slider;
			this.#fullscreenLabel = fullscreenLabel;
			fullscreenLabel.setIconClass(ICON_EXPAND);
			fullscreenLabel.setIconTitle(main_core.Loc.getMessage(LOC_EXPAND) ?? '');
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
				fullscreenLabel.setIconTitle(main_core.Loc.getMessage(LOC_EXPAND) ?? '');
				this.#isFullscreen = false;
			} else {
				this.#savedLeftBoundary = slider.getCustomLeftBoundary();
				slider.setCustomLeftBoundary(FULLSCREEN_LEFT_BOUNDARY);
				main_core.Dom.addClass(wrapper, '--fullscreen');
				fullscreenLabel.setIconClass(ICON_COLLAPSE);
				fullscreenLabel.setIconTitle(main_core.Loc.getMessage(LOC_COLLAPSE) ?? '');
				this.#isFullscreen = true;
			}
			slider.adjustLayout();
		}
		mountLayout(html) {
			this.getContainer();
			const generation = this.#layoutGeneration;
			const mountPromise = this.#mountQueue.then(() => this.#mountLayout(html, generation));
			this.#mountQueue = mountPromise.catch(() => {});
			return mountPromise;
		}
		async #mountLayout(html, generation) {
			if (generation !== this.#layoutGeneration) {
				return;
			}
			this.#currentIframe = null;
			const contentArea = this.#contentArea;
			if (contentArea === null) {
				return;
			}
			await main_core.Runtime.html(contentArea, html);
			if (generation !== this.#layoutGeneration) {
				main_core.Dom.clean(contentArea);
				return;
			}
			const iframe = contentArea.querySelector('iframe');
			if (iframe === null) {
				this.#hideLoader();
				return;
			}
			this.#showLoader();
			this.#currentIframe = iframe;
			main_core.Event.bind(iframe, 'load', () => this.#onIframeLoad(iframe));
		}
		showLoading() {
			this.getContainer();
			this.#layoutGeneration += 1;
			this.#currentIframe = null;
			main_core.Dom.clean(this.#contentArea);
			this.#showLoader();
		}
		showLoadError() {
			this.getContainer();
			const generation = ++this.#layoutGeneration;
			this.#currentIframe = null;
			this.#renderLoadError();
			this.#mountQueue = this.#mountQueue.then(() => {
				if (generation === this.#layoutGeneration) {
					this.#renderLoadError();
				}
			});
		}
		#renderLoadError() {
			main_core.Dom.clean(this.#contentArea);
			main_core.Dom.append(main_core.Tag.render`
				<div class="vibecode-catalog-open-app__error" role="alert" data-testid="vibecode-open-app-error">
					${main_core.Loc.getMessage('VIBECODECONNECTOR_CATALOG_OPEN_APP_LOAD_ERROR')}
				</div>
			`, this.#contentArea);
			this.#hideLoader();
		}
		#onIframeLoad(iframe) {
			if (iframe !== this.#currentIframe || this.#isBlankFrame(iframe)) {
				return;
			}
			this.#hideLoader();
		}
		#isBlankFrame(iframe) {
			try {
				return iframe.contentDocument !== null && iframe.contentWindow?.location.href === 'about:blank';
			} catch {
				return false;
			}
		}
		#showLoader() {
			if (this.#contentArea === null || this.#loader === null) {
				return;
			}
			this.#contentArea.inert = true;
			main_core.Dom.removeClass(this.#loader, '--hidden');
			this.#clearSafetyTimer();
			this.#safetyTimer = window.setTimeout(() => this.#hideLoader(), LOADER_SAFETY_TIMEOUT_MS);
		}
		#hideLoader() {
			this.#clearSafetyTimer();
			if (this.#contentArea !== null) {
				this.#contentArea.inert = false;
			}
			if (this.#loader !== null) {
				main_core.Dom.addClass(this.#loader, '--hidden');
			}
		}
		#clearSafetyTimer() {
			if (this.#safetyTimer !== null) {
				window.clearTimeout(this.#safetyTimer);
				this.#safetyTimer = null;
			}
		}
		#render() {
			this.#contentArea = main_core.Tag.render`<div class="vibecode-catalog-open-app__content" data-testid="vibecode-open-app-content"></div>`;
			this.#loader = main_core.Tag.render`
			<div class="vibecode-catalog-open-app__loader" role="status" data-testid="vibecode-open-app-loader">
				<video
					class="vibecode-catalog-open-app__loader-video"
					poster="${LOADER_VIDEO_POSTER}"
					autoplay
					muted
					loop
					playsinline
					aria-hidden="true"
				>
					<source
						src="${LOADER_VIDEO_SRC}"
						type="video/mp4"
						media="(prefers-reduced-motion: no-preference)"
					>
				</video>
				<div class="vibecode-catalog-open-app__loader-softener" aria-hidden="true"></div>
				${this.#renderLoaderBrand()}
				<span class="vibecode-catalog-open-app__visually-hidden">${main_core.Loc.getMessage('VIBECODECONNECTOR_CATALOG_OPEN_APP_LOADER')}</span>
			</div>
		`;
			this.#showLoader();
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
		#renderLoaderBrand() {
			const isAlaio = this.#options.loaderBrand === 'alaio';
			const modifier = isAlaio ? ' --alaio' : '';
			const logoFile = isAlaio ? 'logo-alaio.svg' : 'logo.svg';
			return main_core.Tag.render`
			<div class="vibecode-catalog-open-app__loader-brand${modifier}" aria-hidden="true">
				<img
					class="vibecode-catalog-open-app__loader-brand-logo"
					src="${LOADER_LOGO_PATH}${logoFile}"
					alt=""
					data-testid="vibecode-open-app-brand-logo"
				>
				<span
					class="vibecode-catalog-open-app__loader-brand-shine"
					data-testid="vibecode-open-app-brand-shine"
				></span>
			</div>
		`;
		}
		#renderHeader() {
			this.#titleNode = main_core.Tag.render`
			<h3 class="vibecode-catalog-open-app__title ui-headline --lg" data-testid="vibecode-open-app-title"></h3>
		`;
			this.#applyTitle();
			this.#iconSlot = main_core.Tag.render`
			<span class="vibecode-catalog-open-app__icon-slot" aria-hidden="true">
				${new ui_iconSet_api_core.Icon({
			icon: ui_iconSet_api_core.Outline.APPS,
			size: 24,
			color: 'var(--ui-color-base-white-fixed)'
		}).render()}
			</span>
		`;
			this.#applyIconColor();
			this.#identityNode = main_core.Tag.render`
			<div class="vibecode-catalog-open-app__identity">
				${this.#iconSlot}
				<div class="vibecode-catalog-open-app__identity-text">
					${this.#titleNode}
					${this.#renderAuthor()}
				</div>
			</div>
		`;
			return main_core.Tag.render`
			<div class="vibecode-catalog-open-app__header">
				${this.#identityNode}
				${this.#renderRestartButton()}
			</div>
		`;
		}
		#renderRestartButton() {
			return new ui_buttons.Button({
				className: 'vibecode-catalog-open-app__restart-button',
				text: main_core.Loc.getMessage('VIBECODECONNECTOR_CATALOG_OPEN_APP_RESTART') ?? '',
				size: ui_buttons.ButtonSize.MEDIUM,
				style: ui_buttons.AirButtonStyle.TINTED,
				collapsedIcon: '',
				useAirDesign: true,
				props: {
					type: 'button'
				},
				dataset: {
					testid: 'vibecode-open-app-restart'
				},
				onclick: () => {
					this.#restart();
					return {};
				}
			}).render();
		}
		#applyIconColor() {
			if (this.#iconSlot === null) {
				return;
			}
			const color = this.#options.iconColor;
			main_core.Dom.style(this.#iconSlot, '--vibecode-catalog-open-app-icon-background', main_core.Type.isString(color) && /^#[\dA-Fa-f]{6}$/.test(color) ? color : '');
		}
		#restart() {
			const now = Date.now();
			if (this.#lastRestartAt !== null && now - this.#lastRestartAt < RESTART_COOLDOWN_MS) {
				return;
			}
			this.#lastRestartAt = now;
			this.showLoading();
			this.#options.onRestart();
		}
		#applyTitle() {
			if (this.#titleNode === null) {
				return;
			}
			const title = main_core.Type.isStringFilled(this.#options.title) ? this.#options.title : null;
			this.#titleNode.textContent = title ?? '';
			this.#titleNode.hidden = title === null;
			main_core.Dom.attr(this.#titleNode, 'title', title);
		}
		#getProfilePathTemplate() {
			const template = main_core.Extension.getSettings('vibecodeconnector.open-app').get('userProfilePathTemplate');
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
			}) ?? '';
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

	const SLIDER_ID_PREFIX = 'vibecodeconnector-open-app-';
	const APP_PAGE_PATH_PREFIX = '/vibecode/app/';
	const ERROR_EXTERNAL_ID_MISSING = 'EXTERNAL_ID_MISSING';
	const LAUNCH_ACTION = 'vibecodeconnector.Catalog.launch';
	const LAUNCH_KIND_APP = 'app';
	const LOADER_BRAND_ALAIO = 'alaio';
	function openUrl(url) {
		if (!main_core.Type.isStringFilled(url)) {
			return;
		}
		window.open(url, '_blank', 'noopener,noreferrer');
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
	function openCatalogApp(target, openFallback = openUrl) {
		const appPageUrl = buildAppPageUrl(target.id);
		if (appPageUrl === null) {
			return false;
		}
		if (!canOpenAppInIframe(target.id, target.canOpenInIframe, target.externalId)) {
			if (main_core.Type.isStringFilled(target.viewUrl)) {
				openFallback(appPageUrl);
			}
			return false;
		}
		return openAppSlider(target.id, {
			title: target.title,
			ownerId: target.ownerId,
			ownerName: target.ownerName,
			isMine: target.isMine,
			iconUrl: target.iconUrl,
			color: target.color
		});
	}
	function openAppSlider(itemId, presentation = {}) {
		const appPageUrl = buildAppPageUrl(itemId);
		if (appPageUrl === null) {
			return false;
		}
		const title = resolveInitialTitle(presentation.title);
		const sliderId = `${SLIDER_ID_PREFIX}${itemId}`;
		const sidePanel = getSidePanel();
		if (sidePanel.Instance.getSlider(sliderId) !== null) {
			return true;
		}
		let slider = null;
		let layoutPromise = null;
		let latestRequestId = 0;
		let layoutRequestId = 0;
		let sliderClosed = false;
		let view = null;
		const isRequestCurrent = requestId => {
			return requestId === latestRequestId && !sliderClosed;
		};
		const applyLayout = (promise, requestId) => {
			promise.then(async layout => {
				if (!isRequestCurrent(requestId) || view === null) {
					return;
				}
				if (layout.errorCode === ERROR_EXTERNAL_ID_MISSING) {
					openAppPage(slider, appPageUrl);
					return;
				}
				applyAppTitle(slider, view, layout.title);
				view.setIconColor(layout.color);
				view.setIconUrl(layout.iconUrl);
				await view.mountLayout(layout.html);
			}).catch(() => {
				if (isRequestCurrent(requestId) && view !== null) {
					view.showLoadError();
				}
			});
		};
		const requestAndMountLayout = () => {
			layoutRequestId = ++latestRequestId;
			layoutPromise = loadOpenAppLayout(itemId);
			layoutPromise.catch(() => {});
			if (slider !== null) {
				applyLayout(layoutPromise, layoutRequestId);
			}
		};
		view = new OpenAppView({
			title,
			ownerId: presentation.ownerId ?? 0,
			ownerName: presentation.ownerName ?? null,
			isMine: presentation.isMine === true,
			onRestart: requestAndMountLayout,
			loaderBrand: getLoaderBrand(),
			iconColor: presentation.color
		});
		view.setIconUrl(presentation.iconUrl ?? null);
		requestAndMountLayout();
		let fullscreenLabel = null;
		sidePanel.Instance.open(sliderId, {
			title: title || undefined,
			cacheable: false,
			allowChangeHistory: false,
			copyLinkLabel: true,
			newWindowUrl: appPageUrl,
			contentCallback: () => view.getContainer(),
			events: {
				onCloseStart: () => {
					sliderClosed = true;
					latestRequestId += 1;
				},
				onLoad: event => {
					slider = event.getSlider();
					if (layoutPromise !== null) {
						applyLayout(layoutPromise, layoutRequestId);
					}
				},
				onOpenComplete: event => {
					const openedSlider = event.getSlider();
					if (openedSlider !== null && view !== null) {
						fullscreenLabel ??= addFullscreenLabel(openedSlider, view);
					}
				}
			}
		});
		return true;
	}
	function openCatalogAppById(catalogItemId, openFallback = openUrl) {
		const appPageUrl = buildAppPageUrl(catalogItemId);
		if (appPageUrl === null) {
			return Promise.resolve(false);
		}
		return main_core.ajax.runAction(LAUNCH_ACTION, {
			data: {
				catalogItemId
			}
		}).then(response => {
			const data = response?.data ?? {};
			if (data.kind !== LAUNCH_KIND_APP) {
				openFallback(appPageUrl);
				return false;
			}
			const target = {
				id: catalogItemId,
				title: main_core.Type.isString(data.title) ? data.title : '',
				viewUrl: main_core.Type.isString(data.viewUrl) ? data.viewUrl : null,
				externalId: main_core.Type.isString(data.externalId) ? data.externalId : null,
				canOpenInIframe: true,
				ownerId: main_core.Type.isNumber(data.ownerId) ? data.ownerId : 0,
				ownerName: main_core.Type.isString(data.ownerName) ? data.ownerName : null,
				isMine: data.isMine === true
			};
			const opened = openCatalogApp(target, openFallback);
			if (!opened && !main_core.Type.isStringFilled(target.viewUrl)) {
				openFallback(appPageUrl);
			}
			return opened;
		}).catch(() => {
			openFallback(appPageUrl);
			return false;
		});
	}
	function resolveInitialTitle(title) {
		if (main_core.Type.isStringFilled(title)) {
			return title;
		}
		const defaultTitle = main_core.Loc.getMessage('VIBECODECONNECTOR_CATALOG_OPEN_APP_DEFAULT_TITLE');
		return main_core.Type.isStringFilled(defaultTitle) ? defaultTitle : '';
	}
	function applyAppTitle(slider, view, title) {
		if (!main_core.Type.isStringFilled(title)) {
			return;
		}
		view.setTitle(title);
		if (slider) {
			slider.setTitle(title);
			main_core.Dom.attr(slider.getContainer(), 'aria-label', title);
		}
	}
	function openAppPage(slider, appPageUrl) {
		slider?.close();
		main_core.Page.redirect(appPageUrl);
	}
	function addFullscreenLabel(slider, view) {
		const fullscreenLabel = new main_sidepanel.Label(slider, {
			className: '--ui-hoverable',
			onclick: () => view.toggleFullscreen()
		});
		main_core.Dom.attr(fullscreenLabel.getContainer(), 'data-testid', 'vibecode-open-app-fullscreen-toggle');
		view.setFullscreenControls(slider, fullscreenLabel);
		main_core.Dom.append(fullscreenLabel.getContainer(), slider.getExtraLabelsContainer());
		return fullscreenLabel;
	}
	function getSidePanel() {
		return BX.SidePanel;
	}
	function canOpenAppInIframe(itemId, canOpenInIframe, externalId) {
		return isOpenAppInIframeEnabled() && canOpenInIframe && isCatalogItemIdValid(itemId) && main_core.Type.isStringFilled(externalId);
	}
	function isCatalogItemIdValid(itemId) {
		return main_core.Type.isNumber(itemId) && itemId > 0;
	}
	function buildAppPageUrl(itemId) {
		if (!isCatalogItemIdValid(itemId)) {
			return null;
		}
		return `${APP_PAGE_PATH_PREFIX}${encodeURIComponent(itemId)}/`;
	}
	function isOpenAppInIframeEnabled() {
		return main_core.Extension.getSettings('vibecodeconnector.open-app').get('openAppInIframe', false) === true;
	}
	function getLoaderBrand() {
		return main_core.Extension.getSettings('vibecodeconnector.open-app').get('loaderBrand') === LOADER_BRAND_ALAIO ? LOADER_BRAND_ALAIO : 'bitrix24';
	}
	function loadOpenAppLayout(catalogItemId) {
		return main_core.ajax.runAction('vibecodeconnector.Catalog.openAppLayout', {
			data: {
				catalogItemId
			}
		}).then(response => {
			const html = response?.data?.html;
			const title = response?.data?.title;
			const errorCode = response?.data?.errorCode;
			const iconUrl = response?.data?.iconUrl;
			const color = response?.data?.color;
			return {
				html: main_core.Type.isString(html) ? html : '',
				title: main_core.Type.isString(title) ? title : '',
				errorCode: main_core.Type.isString(errorCode) ? errorCode : '',
				iconUrl: main_core.Type.isStringFilled(iconUrl) ? iconUrl : null,
				color: main_core.Type.isStringFilled(color) ? color : null
			};
		});
	}

	exports.buildAppPageUrl = buildAppPageUrl;
	exports.hasCatalogAppOpenTarget = hasCatalogAppOpenTarget;
	exports.openAppSlider = openAppSlider;
	exports.openCatalogApp = openCatalogApp;
	exports.openCatalogAppById = openCatalogAppById;
	exports.openUrl = openUrl;

})(this.BX.Vibecodeconnector.OpenApp = this.BX.Vibecodeconnector.OpenApp || {}, BX, BX.SidePanel, BX.UI, BX.UI.IconSet);
//# sourceMappingURL=open-app.bundle.js.map
