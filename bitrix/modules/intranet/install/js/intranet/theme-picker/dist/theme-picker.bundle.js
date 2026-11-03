/* eslint-disable */
this.BX = this.BX || {};
this.BX.Intranet = this.BX.Intranet || {};
(function (exports, main_core, main_core_cache, main_core_events, main_popup, intranet_themePicker_dialog, main_loader, main_sidepanel, ui_a11y) {
	'use strict';

	class ThemePicker {
		#cache = new main_core_cache.MemoryCache();
		#dialog = null;
		#dialogInitiator = null;
		constructor(options) {
			this.#cache.set('options', {
				themeId: options.themeId,
				templateId: options.templateId,
				appliedThemeId: options.themeId,
				appliedTheme: main_core.Type.isPlainObject(options.theme) ? options.theme : null,
				siteId: options.siteId,
				entityType: options.entityType,
				entityId: options.entityId,
				maxUploadSize: main_core.Type.isNumber(options.maxUploadSize) ? options.maxUploadSize : 5 * 1024 * 1024,
				ajaxHandlerPath: main_core.Type.isStringFilled(options.ajaxHandlerPath) ? options.ajaxHandlerPath : null,
				isAdmin: options.isAdmin === true,
				allowSetDefaultTheme: options.allowSetDefaultTheme === true,
				isVideo: options.isVideo === true,
				behaviour: main_core.Type.isStringFilled(options.behaviour) ? options.behaviour : 'apply',
				returnValue: options.behaviour === 'return' ? options.themeId : null,
				isBodyClassRemoved: false
			});
			if (main_core.Type.isStringFilled(options?.theme.bgImageUrlToBlur)) {
				this.#trySaveBlurredImage(options.theme);
			}
			if (this.#getOptions().isVideo) {
				this.#setVideoEventHandlers();
			}
			const iframeMode = window !== window.top;
			if (iframeMode) {
				main_core_events.EventEmitter.subscribe('SidePanel.Slider:onLoad', this.#handleSliderLoad.bind(this));
				main_core_events.EventEmitter.subscribe('BX.Intranet.Bitrix24:ThemePicker:onThemeApply', this.#handleThemeApply.bind(this));
				main_core_events.EventEmitter.subscribe('BX.Intranet.Bitrix24:ThemePicker:onThemeAfterApply', this.#handleThemeAfterApply.bind(this));
			}
			this.#setPrintEventHandlers();
		}
		showDialog(scrollToTop = true) {
			if (scrollToTop) {
				window.scrollTo({
					top: 0,
					left: 0
				});
			}
			const dialogPopup = this.getDialogPopup();
			if (dialogPopup.isShown()) {
				return;
			}
			this.#dialogInitiator = document.activeElement;
			this.setDialogBusy(true);
			dialogPopup.show();
			this.#getLoader().show(dialogPopup.getContentContainer());
			this.#loadThemeDialog();
		}
		closeDialog() {
			this.#dialog?.close();
			this.#dialog = null;
			this.getDialogPopup().close();
		}

		/**
		 * `inert` is what actually turns the theme list off: it takes the whole popup out of the
		 * Tab order and out of the accessibility tree at once. The class stays for the film on top of it.
		 */
		enableThemeListDialog() {
			const container = this.getDialogPopup().popupContainer;
			main_core.Dom.removeClass(container, 'theme-dialog-popup-window-container-disabled');
			main_core.Dom.attr(container, 'inert', null);
			this.#dialog?.refreshGrid();
		}
		disableThemeListDialog() {
			const container = this.getDialogPopup().popupContainer;
			main_core.Dom.addClass(container, 'theme-dialog-popup-window-container-disabled');
			main_core.Dom.attr(container, 'inert', '');
		}
		getDialogPopup() {
			return this.#cache.remember('dialogPopup', () => {
				const popup = new main_popup.Popup({
					width: 800,
					height: 500,
					titleBar: main_core.Loc.getMessage('BITRIX24_THEME_DIALOG_TITLE'),
					fixed: true,
					closeByEsc: true,
					cacheable: false,
					bindOnResize: false,
					closeIcon: true,
					draggable: true,
					events: {
						onAfterClose: () => {
							this.closeDialog();
							this.#returnFocusToInitiator();
						},
						onDestroy: () => {
							this.#cache.delete('dialogPopup');
						}
					}
				});
				main_core.Dom.attr(popup.getPopupContainer(), 'data-testid', 'bx-theme-picker-dialog');
				return popup;
			});
		}
		hideLoader() {
			this.#getLoader().hide();
		}

		// The empty popup is busy until the theme grid replaces the loader.
		setDialogBusy(busy) {
			main_core.Dom.attr(this.getDialogPopup().getContentContainer(), 'aria-busy', busy ? 'true' : null);
		}

		/**
		 * The focus is never taken away from the user: it moves only when it is lost, still
		 * inside the dialog it is leaving, or has never left the node the dialog was opened from, so a
		 * click somewhere else keeps it where the user left it.
		 * The dialog defaults to the theme list; the nested creation dialog passes its own popup.
		 */
		focusInDialog(element, popup = this.getDialogPopup()) {
			if (!main_core.Type.isElementNode(element)) {
				return;
			}
			if (this.#isFocusLost() || this.#isFocusInside(popup) || this.#isFocusOnInitiator()) {
				element.focus();
			}
		}

		/**
		 * The focus still standing on the very node the dialog was opened from.
		 *
		 * A modal dialog that opens with the focus outside itself leaves the next Tab press on the page
		 * behind it, and that is what happens whenever the initiator survives the opening and the focus
		 * trap of the platform is off - its default outside dev builds. The initiator is known by
		 * identity, so this case is told apart from "the person moved the focus somewhere else" exactly.
		 */
		#isFocusOnInitiator() {
			return main_core.Type.isElementNode(this.#dialogInitiator) && document.activeElement === this.#dialogInitiator;
		}

		/**
		 * The initiator can die together with the popup it lived in (the avatar menu closes on
		 * `openChild`), so the node is checked before the focus goes back to it.
		 *
		 * A click on the close icon focuses the icon itself, so by `onAfterClose` the focus stands on a
		 * live node of the popup that is about to die: it is not lost yet, and it is about to be. The
		 * popup is destroyed only after this handler returns, so its container is still there to ask.
		 */
		#returnFocusToInitiator() {
			const initiator = this.#dialogInitiator;
			this.#dialogInitiator = null;
			const focusLeavesDialog = this.#isFocusLost() || this.#isFocusInside(this.getDialogPopup());
			if (!focusLeavesDialog || !main_core.Type.isElementNode(initiator) || !initiator.isConnected) {
				return;
			}
			if (ui_a11y.InteractivityChecker.isFocusable(initiator)) {
				initiator.focus();
			}
		}
		#isFocusLost() {
			const activeElement = document.activeElement;
			return !main_core.Type.isElementNode(activeElement) || activeElement === document.body || !activeElement.isConnected;
		}
		#isFocusInside(popup) {
			return popup?.getPopupContainer()?.contains(document.activeElement) === true;
		}
		getTemplateId() {
			return this.#getOptions().templateId;
		}
		getSiteId() {
			return this.#getOptions().siteId;
		}
		getEntityType() {
			return this.#getOptions().entityType;
		}
		getEntityId() {
			return this.#getOptions().entityId;
		}
		getAjaxHandlerPath() {
			return this.#getOptions().ajaxHandlerPath;
		}
		getVideoElement() {
			return document.querySelector('.theme-video');
		}
		getMaxUploadSize() {
			return this.#getOptions().maxUploadSize;
		}
		isCurrentUserAdmin() {
			return this.#getOptions().isAdmin;
		}
		canSetDefaultTheme() {
			return this.#getOptions().allowSetDefaultTheme;
		}
		getThemeId() {
			return this.#getOptions().themeId;
		}
		setThemeId(themeId) {
			const options = this.#getOptions();
			options.themeId = themeId;
		}
		getAppliedThemeId() {
			return this.#getOptions().appliedThemeId;
		}
		setAppliedThemeId(themeId) {
			const options = this.#getOptions();
			options.appliedThemeId = themeId;
		}
		getAppliedTheme() {
			return this.#getOptions().appliedTheme;
		}
		setThemes(themes) {
			if (main_core.Type.isArray(themes)) {
				this.#cache.set('themes', themes);
			}
		}
		getThemes() {
			return this.#cache.get('themes', []);
		}
		setBaseThemes(themes) {
			if (main_core.Type.isPlainObject(themes)) {
				this.#cache.set('baseTheme', themes);
			}
		}
		getBaseThemes() {
			return this.#cache.get('baseTheme', {});
		}
		getTheme(themeId) {
			const themes = this.getThemes();
			for (const theme of themes) {
				if (theme.id === themeId) {
					return theme;
				}
			}
			return null;
		}
		removeTheme(themeId) {
			this.setThemes(this.getThemes().filter(theme => theme.id !== themeId));
		}
		updateTheme(themeId, theme) {
			const themes = this.getThemes();
			const themeIndex = themes.findIndex(t => t.id === themeId);
			if (themeIndex === -1 || !main_core.Type.isPlainObject(theme)) {
				return;
			}
			for (const [key, value] of Object.entries(theme)) {
				themes[themeIndex][key] = value;
			}
		}
		setReturnValue(themeId) {
			const options = this.#getOptions();
			options.returnValue = themeId;
		}
		getReturnValue() {
			return this.#getOptions().returnValue;
		}
		needReturnValue() {
			return this.#getOptions().behaviour === 'return';
		}
		shouldPlayVideo() {
			const iframeMode = window !== window.top;
			if (iframeMode) {
				return main_sidepanel.SidePanel.Instance.getSliderByWindow(window) === main_sidepanel.SidePanel.Instance.getTopSlider();
			}
			return !main_sidepanel.SidePanel.Instance.isOpen();
		}
		playVideo() {
			const video = this.getVideoElement();
			if (video) {
				video.play().catch(() => {});
			}
		}
		pauseVideo() {
			const video = this.getVideoElement();
			if (video) {
				video.pause();
			}
		}
		handleWindowFocus() {
			if (this.shouldPlayVideo()) {
				this.playVideo();
			}
		}
		handleWindowBlur() {
			this.pauseVideo();
		}
		handleSliderOpen() {
			this.handleWindowBlur();
		}
		handleSliderClose() {
			this.handleWindowFocus();
		}
		handleVisibilityChange() {
			const video = this.getVideoElement();
			if (video) {
				if (document.visibilityState === 'hidden') {
					this.handleWindowBlur();
				} else {
					this.handleWindowFocus();
				}
			}
		}
		handleBeforePrint(event) {
			window.scroll(0, 0);
			if (main_core.Dom.hasClass(document.body, 'bitrix24-light-theme')) {
				main_core.Dom.removeClass(document.body, 'bitrix24-light-theme');
				this.#getOptions().isBodyClassRemoved = true;
			}
			const contextsToRemove = ['--ui-context-edge-dark', '--ui-context-edge-light', '--ui-context-content-dark'];
			contextsToRemove.forEach(contextToRemove => {
				if (main_core.Dom.hasClass(document.body, contextToRemove)) {
					main_core.Dom.removeClass(document.body, contextToRemove);
					this.#getOptions().removedContextClassname = contextToRemove;
				}
			});
			if (this.#getOptions().removedContextClassname) {
				main_core.Dom.addClass(document.body, '--ui-context-content-light');
			}
		}
		handleAfterPrint() {
			if (this.#getOptions().isBodyClassRemoved) {
				main_core.Dom.addClass(document.body, 'bitrix24-light-theme');
				this.#getOptions().isBodyClassRemoved = false;
			}
			if (this.#getOptions().removedContextClassname) {
				main_core.Dom.removeClass(document.body, 'ui-context-content-light');
				main_core.Dom.addClass(document.body, this.#getOptions().removedContextClassname);
				this.#getOptions().removedContextClassname = null;
			}
		}
		handleMediaPrint(mql) {
			if (mql.matches) {
				this.handleBeforePrint();
			} else {
				this.handleAfterPrint();
			}
		}
		#getCurrentSlider() {
			const sliderManager = main_core.Reflection.getClass('top.BX.SidePanel.Instance');
			if (sliderManager === null) {
				return null;
			}
			return sliderManager.getSliderByWindow(window);
		}
		#handleSliderLoad() {
			this.#applySliderTheme();
		}
		#handleThemeApply() {
			this.#resetSliderTheme();
		}
		#handleThemeAfterApply() {
			this.#applySliderTheme();
		}
		#applySliderTheme() {
			const currentSlider = this.#getCurrentSlider();
			if (currentSlider === null) {
				return;
			}
			const background = main_core.Dom.style(document.body, '--air-theme-background');
			if (main_core.Type.isStringFilled(background)) {
				main_core.Dom.style(currentSlider.getContentContainer(), 'background', background);
				main_core.Dom.style(document.body, '--air-theme-background', 'transparent');
			} else {
				main_core.Dom.style(currentSlider.getContentContainer(), 'background', null);
			}
		}
		#resetSliderTheme() {
			const currentSlider = this.#getCurrentSlider();
			if (currentSlider === null) {
				return;
			}
			main_core.Dom.style(document.body, '--air-theme-background', null);
			main_core.Dom.style(currentSlider.getContentContainer(), 'background', null);
		}
		getVideoContainer() {
			return document.querySelector('.theme-video-container');
		}
		#getOptions() {
			return this.#cache.get('options', {});
		}
		#setVideoEventHandlers() {
			main_core.Event.bind(window, 'focus', this.handleWindowFocus.bind(this));
			main_core.Event.bind(window, 'blur', this.handleWindowBlur.bind(this));
			main_core_events.EventEmitter.subscribe('OnIframeFocus', this.handleWindowFocus.bind(this));
			main_core_events.EventEmitter.subscribe('SidePanel.Slider:onOpenComplete', this.handleSliderOpen.bind(this));
			main_core_events.EventEmitter.subscribe('SidePanel.Slider:onCloseComplete', this.handleSliderClose.bind(this));
			const eventHandler = this.handleVisibilityChange.bind(this);
			main_core.Event.bind(window, 'load', eventHandler);
			main_core.Event.bind(document, 'visibilitychange', eventHandler);
		}
		#setPrintEventHandlers() {
			if ('onbeforeprint' in window) {
				main_core.Event.bind(window, 'beforeprint', this.handleBeforePrint.bind(this));
				main_core.Event.bind(window, 'afterprint', this.handleAfterPrint.bind(this));
			} else if (window.matchMedia) {
				window.matchMedia('print').addListener(this.handleMediaPrint.bind(this));
			}
		}
		#loadThemeDialog() {
			main_core.Runtime.loadExtension('intranet.theme-picker.dialog').then(exports => {
				const {
					ThemePickerDialog: Dialog
				} = exports;
				this.#dialog ??= new Dialog(this);
				this.#dialog.show();
			}).catch(error => {
				console.error(error);
			});
		}
		#getLoader() {
			return this.#cache.remember('loader', () => {
				const loader = new main_loader.Loader({
					size: 120
				});

				// Decorative: the busy state of the dialog is announced by `aria-busy`, not by the spinner.
				main_core.Dom.attr(loader.layout, 'aria-hidden', 'true');
				return loader;
			});
		}
		#trySaveBlurredImage(theme) {
			const saveBlurredImage = async () => {
				try {
					const {
						ThemePickerDialog: Dialog
					} = await main_core.Runtime.loadExtension('intranet.theme-picker.dialog');
					const dialog = new Dialog(this);
					await dialog.makeCustomThemeBlurred(theme, {
						ignoreErrors: true,
						applyTheme: true
					});
					await new Promise(() => {}); // Keep the lock exclusive between browser tabs
				} catch (ex) {
					console.error(ex);
				}
			};
			if (window.navigator.locks) {
				window.navigator.locks.request('save-blurred-image', saveBlurredImage);
			} else {
				void saveBlurredImage();
			}
		}
	}

	exports.ThemePicker = ThemePicker;

})(this.BX.Intranet.Bitrix24 = this.BX.Intranet.Bitrix24 || {}, BX, BX.Cache, BX.Event, BX.Main, BX.Intranet.Bitrix24.ThemePicker, BX, BX.SidePanel, BX.UI.Accessibility);
//# sourceMappingURL=theme-picker.bundle.js.map
