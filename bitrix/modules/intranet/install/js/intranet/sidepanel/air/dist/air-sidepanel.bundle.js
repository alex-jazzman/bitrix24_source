/* eslint-disable */
this.BX = this.BX || {};
this.BX.Intranet = this.BX.Intranet || {};
(function (exports, main_core, main_sidepanel, main_core_events) {
	'use strict';

	class ChatMenuBar {
		#slider = null;
		#container = null;
		#loaded = false;
		#onZIndexChangeHandler = null;
		#onOpeningSliderHandler = null;
		#onClosingSliderHandler = null;
		#onImLayoutChange = null;
		constructor(slider) {
			this.#slider = slider;
			this.#container = document.getElementById('im-chat-menu');
			if (!this.#container) {
				console.warn('ChatMenu: container not found');
				return;
			}
			main_core.Dom.append(this.#container, document.body);
			main_core_events.EventEmitter.subscribeOnce(this.#slider, 'SidePanel.Slider:onOpenStart', this.#handleSliderOpenStartOnce.bind(this));
			main_core_events.EventEmitter.subscribe(this.#slider, 'SidePanel.Slider:onOpening', this.#handleSliderOpening.bind(this));
			main_core_events.EventEmitter.subscribe(this.#slider, 'SidePanel.Slider:onClosing', this.#handleSliderClosing.bind(this));
			main_core_events.EventEmitter.subscribe(this.#slider, 'SidePanel.Slider:onCloseComplete', this.#handleSliderCloseComplete.bind(this));
			main_core_events.EventEmitter.subscribe(this.#slider, 'SidePanel.Slider:onDestroy', this.#handleSliderDestroy.bind(this));
			main_core_events.EventEmitter.subscribe(this.#slider, 'SidePanel.Slider:onLayout', this.#handleSliderLayout.bind(this));
			this.#onOpeningSliderHandler = event => {
				const [sliderEvent] = event.getData();
				if (sliderEvent.getSlider() !== this.#slider) {
					main_core.Dom.style(this.getContainer(), 'background', this.#slider.getOverlayBgColor());
					main_core.Dom.style(this.getContainer(), 'box-shadow', `-10px 0px 10px 3px ${this.#slider.getOverlayBgColor()}`);
					main_core.Dom.attr(this.getContainer(), 'inert', 'true');
				}
			};
			this.#onClosingSliderHandler = () => {
				if (this.#slider === main_sidepanel.SidePanel.Instance.getPreviousSlider()) {
					main_core.Dom.style(this.getContainer(), 'background', null);
					main_core.Dom.style(this.getContainer(), 'box-shadow', null);
					main_core.Dom.attr(this.getContainer(), 'inert', null);
				}
			};
			this.#onImLayoutChange = () => {
				if (!this.#loaded) {
					this.#loaded = true;
					main_core.Dom.addClass(this.getContainer(), '--loaded');
				}
			};
			main_core_events.EventEmitter.subscribe('SidePanel.Slider:onOpening', this.#onOpeningSliderHandler);
			main_core_events.EventEmitter.subscribe('SidePanel.Slider:onClosing', this.#onClosingSliderHandler);
			main_core_events.EventEmitter.subscribe('IM.Layout:onLayoutChange', this.#onImLayoutChange);
		}
		getContainer() {
			return this.#container;
		}
		setZIndex(zIndex) {
			main_core.Dom.style(this.getContainer(), 'z-index', zIndex);
		}
		reset() {
			this.getMenu()?.reset();
		}
		getMenu() {
			/**
			 *
			 * @type {BX.Main.interfaceButtonsManager}
			 */
			const menuManager = main_core.Reflection.getClass('BX.Main.interfaceButtonsManager');
			if (menuManager) {
				return menuManager.getById('chat-menu');
			}
			return null;
		}
		#handleSliderOpenStartOnce() {
			const zIndexComponent = this.#slider.getZIndexComponent();
			if (zIndexComponent && this.#onZIndexChangeHandler === null) {
				this.#onZIndexChangeHandler = this.#handleZIndexChange.bind(this);
				main_core_events.EventEmitter.subscribe(zIndexComponent, 'onZIndexChange', this.#onZIndexChangeHandler);
			}
		}
		#handleSliderOpening() {
			const zIndexComponent = this.#slider.getZIndexComponent();
			if (zIndexComponent) {
				this.setZIndex(zIndexComponent.getZIndex() + 1);
			}
			main_core.Dom.style(this.getContainer(), 'display', 'block');
			main_core.Dom.style(this.getContainer(), 'background', null);
			main_core.Dom.style(this.getContainer(), 'box-shadow', null);
			main_core.Dom.attr(this.getContainer(), 'inert', null);
			requestAnimationFrame(() => {
				main_core.Dom.addClass(this.getContainer(), '--open');
			});
		}
		#handleSliderClosing() {
			this.reset();
			main_core.Dom.removeClass(this.getContainer(), '--open');
		}
		#handleSliderCloseComplete() {
			main_core.Dom.style(this.getContainer(), 'display', 'none');
			main_core.Dom.style(this.getContainer(), 'background', null);
			main_core.Dom.style(this.getContainer(), 'box-shadow', null);
			main_core.Dom.attr(this.getContainer(), 'inert', null);
		}
		#handleSliderDestroy() {
			this.reset();
			main_core_events.EventEmitter.unsubscribe('SidePanel.Slider:onOpening', this.#onOpeningSliderHandler);
			main_core_events.EventEmitter.unsubscribe('SidePanel.Slider:onClosing', this.#onClosingSliderHandler);
			main_core_events.EventEmitter.unsubscribe('IM.Layout:onLayoutChange', this.#onImLayoutChange);
			const zIndexComponent = this.#slider.getZIndexComponent();
			if (zIndexComponent) {
				main_core_events.EventEmitter.unsubscribe(zIndexComponent, 'onZIndexChange', this.#onZIndexChangeHandler);
			}
			this.#onZIndexChangeHandler = null;
		}
		#handleZIndexChange() {
			const zIndexComponent = this.#slider.getZIndexComponent();
			if (zIndexComponent) {
				this.setZIndex(zIndexComponent.getZIndex() + 1);
			}
		}
		#handleSliderLayout() {
			main_core.Dom.style(this.getContainer(), 'width', `${this.#slider.getOverlay().offsetWidth}px`);
		}
	}

	const MENU_COLLAPSED_WIDTH = 65;
	const MENU_EXPANDED_WIDTH = 240;
	class Slider extends main_sidepanel.Slider {
		#onWindowResize = null;
		#onViewerClose = null;
		#chatMenuBar = null;
		static #verticalScrollWidth = null;
		constructor(url, sliderOptions) {
			const options = main_core.Type.isPlainObject(sliderOptions) ? {
				...sliderOptions
			} : {};
			const isMessenger = url.startsWith('im:slider');
			if (isMessenger) {
				options.hideControls = false;
				options.autoOffset = false;
				options.customRightBoundary = null;
			}
			options.customRightBoundary = null;
			super(url, options);
			this.#chatMenuBar = isMessenger ? new ChatMenuBar(this) : null;
			this.#onWindowResize = this.#handleWindowResize.bind(this);
			this.#onViewerClose = this.#handleViewerClose.bind(this);
		}
		applyHacks() {
			Slider.#verticalScrollWidth = window.innerWidth - document.documentElement.clientWidth;
			this.adjustBackgroundSize();
			main_core.Event.bind(window, 'resize', this.#onWindowResize);
			main_core_events.EventEmitter.subscribe('BX.UI.Viewer.Controller:onClose', this.#onViewerClose);
			return true;
		}
		resetHacks() {
			this.resetBackgroundSize();
			main_core.Event.unbind(window, 'resize', this.#onWindowResize);
			main_core_events.EventEmitter.unsubscribe('BX.UI.Viewer.Controller:onClose', this.#onViewerClose);
		}
		static isMessengerOpen() {
			const MessengerSlider = main_core.Reflection.getClass('BX.Messenger.v2.Lib.MessengerSlider');
			if (MessengerSlider && MessengerSlider.getInstance().isOpened()) {
				return true;
			}
			return Slider.isMessengerEmbedded();
		}
		static isMessengerEmbedded() {
			const LayoutManager = main_core.Reflection.getClass('BX.Messenger.v2.Lib.LayoutManager');
			return LayoutManager && LayoutManager.getInstance().isEmbeddedMode();
		}
		static isMessengerOpenBeforeSlider(slider) {
			if (Slider.isMessengerEmbedded()) {
				return true;
			}
			const sliders = main_sidepanel.SidePanel.Instance.getOpenSliders();
			for (const openSlider of sliders) {
				if (openSlider === slider) {
					return false;
				}
				if (openSlider?.isMessengerSlider()) {
					return true;
				}
			}
			return false;
		}
		isMessengerSlider() {
			return this.#chatMenuBar !== null;
		}
		static isVideoCallOpen() {
			const CallManager = main_core.Reflection.getClass('BX.Messenger.v2.Lib.CallManager');
			return CallManager && CallManager.getInstance().hasCurrentCall();
		}
		getRightBar() {
			return document.getElementById('right-bar');
		}
		getRightPanel() {
			return document.getElementById('app__right-panel');
		}
		isRightPanelOpen() {
			return this.getRightPanel()?.offsetWidth > 0;
		}
		getLeftBoundary() {
			const windowWidth = main_core.Browser.isMobile() ? window.innerWidth : document.documentElement.clientWidth;
			if (windowWidth < 1260) {
				return this.getMinLeftBoundary();
			}
			const LeftMenu = main_core.Reflection.getClass('BX.Intranet.LeftMenu');
			return LeftMenu?.isCollapsed() || this.isMessengerSlider() ? MENU_COLLAPSED_WIDTH : MENU_EXPANDED_WIDTH;
		}
		getRightBoundary() {
			const viewer = main_core.Reflection.getClass('BX.UI.Viewer.Instance');
			if (viewer && viewer.isOpen()) {
				return 0;
			}
			if (!this.isRightPanelOpen() && (this.isMessengerSlider() || Slider.isMessengerOpenBeforeSlider(this) || Slider.isVideoCallOpen())) {
				return 0;
			}
			const rightPanel = this.getRightPanel() || this.getRightBar();
			if (rightPanel === null) {
				return 0;
			}
			const leftOffset = rightPanel.getBoundingClientRect().left;
			if (leftOffset === 0) {
				return 0;
			}

			// const rightMargin = Slider.#verticalScrollWidth + rightBarWidth;

			const windowWidth = main_core.Browser.isMobile() ? window.innerWidth : document.documentElement.clientWidth;
			return windowWidth - leftOffset;
		}
		getTopBoundary() {
			return 0;
		}
		calculateOuterBoundary() {
			if (this.isMessengerSlider() || Slider.isMessengerOpenBeforeSlider(this) || Slider.isVideoCallOpen()) {
				return {
					top: this.isMessengerSlider() ? 58 : 16,
					right: 18
				};
			}
			const rightMargin = Slider.#verticalScrollWidth > 0 ? 0 : 18;
			return {
				top: 16,
				right: this.isRightPanelOpen() ? 18 : this.getRightBar()?.offsetWidth > 0 ? 0 : rightMargin
			};
		}
		adjustBackgroundSize() {
			const themePicker = main_core.Reflection.getClass('BX.Intranet.Bitrix24.ThemePicker.Singleton');
			if (!themePicker) {
				return;
			}
			const theme = themePicker.getAppliedTheme();
			if (theme && theme.resizable === true) {
				if (theme.video) {
					this.adjustVideoSize();
				} else if (theme.width > 0 && theme.height > 0) {
					this.adjustImageSize(theme.width, theme.height);
				}
			}
		}
		adjustImageSize(imgWidth, imgHeight) {
			const containerWidth = document.documentElement.clientWidth;
			const containerHeight = document.documentElement.clientHeight;
			const imgRatio = imgHeight / imgWidth;
			const containerRatio = containerHeight / containerWidth;
			const width = containerRatio > imgRatio ? containerHeight / imgRatio : containerWidth;
			const height = containerRatio > imgRatio ? containerHeight : containerWidth * imgRatio;
			main_core.Dom.style(document.body, '--air-theme-bg-size', `${width}px ${height}px`);
		}
		adjustVideoSize() {
			const themePicker = main_core.Reflection.getClass('BX.Intranet.Bitrix24.ThemePicker.Singleton');
			if (!themePicker) {
				return;
			}
			const videoContainer = themePicker.getVideoContainer();
			if (videoContainer) {
				main_core.Dom.style(videoContainer, 'right', `${window.innerWidth - document.documentElement.clientWidth}px`);
			}
		}
		resetBackgroundSize() {
			main_core.Dom.style(document.body, '--air-theme-bg-size', null);
			const themePicker = main_core.Reflection.getClass('BX.Intranet.Bitrix24.ThemePicker.Singleton');
			if (themePicker) {
				const videoContainer = themePicker.getVideoContainer();
				if (videoContainer) {
					main_core.Dom.style(videoContainer, 'right', null);
				}
			}
		}
		#handleWindowResize() {
			this.adjustBackgroundSize();
		}
		#handleViewerClose() {
			main_sidepanel.SidePanel.Instance.adjustLayout();
		}
	}

	main_sidepanel.SliderManager.registerSliderClass('BX.Intranet.Bitrix24.Slider', {
		startPosition: 'bottom',
		overlayBgColor: '#00204E',
		overlayBgCallback: (state, slider) => {
			const {
				intensity
			} = state;
			const overlayBgColor = slider.getOverlayBgColor();
			const overlayOpacity = slider.getOverlayOpacity();
			const start = Math.round(overlayOpacity * intensity / 100).toString(16).padStart(2, 0);
			const end = Math.round(100 * intensity / 100).toString(16).padStart(2, 0);
			const defaultBg = `linear-gradient(to bottom, ${overlayBgColor}${start} 0%, ${overlayBgColor}${end} 100%)`;
			const Template = main_core.Reflection.getClass('BX.Intranet.Bitrix24.Template');
			Template?.getRightSidebar().setOverlayBackground(defaultBg);
			if (slider.isMessengerSlider()) {
				return `linear-gradient(to bottom, ${overlayBgColor}${end} 0%, ${overlayBgColor}${end} 35px, ${overlayBgColor}${start} 145px, ${overlayBgColor}${end} 100%)`;
			}
			return defaultBg;
		},
		overlayOpacity: 52,
		autoOffset: false,
		copyLinkLabel: true,
		newWindowLabel: true
	}, {
		focusTrap: {
			outsideExceptionSelectors: ['.aiassistant-marta', '#right-bar', '#avatar-area', '.side-panel-toolbar', '#im-chat-menu', '#app__right-panel'],
			looped: false
		},
		targetContainer: '#a11y-slider-container',
		animationDuration: 200,
		label: {
			text: ''
		}
	});
	const namespace = main_core.Reflection.namespace('BX.Bitrix24');
	Object.defineProperty(namespace, 'Slider', {
		get: () => {
			// eslint-disable-next-line no-console
			console.warn('Don\'t use BX.Bitrix24.Slider.');
			return main_sidepanel.SidePanel.Instance;
		}
	});
	Object.defineProperty(namespace, 'PageSlider', {
		get: () => {
			// eslint-disable-next-line no-console
			console.warn('Don\'t use BX.Bitrix24.PageSlider.');
			return main_sidepanel.SidePanel.Instance;
		}
	});

	exports.Slider = Slider;

})(this.BX.Intranet.Bitrix24 = this.BX.Intranet.Bitrix24 || {}, BX, BX.SidePanel, BX.Event);
//# sourceMappingURL=air-sidepanel.bundle.js.map
