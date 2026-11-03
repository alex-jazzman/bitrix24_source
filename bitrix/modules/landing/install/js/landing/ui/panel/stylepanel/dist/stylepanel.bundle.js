/* eslint-disable */
this.BX = this.BX || {};
this.BX.Landing = this.BX.Landing || {};
this.BX.Landing.UI = this.BX.Landing.UI || {};
(function (exports, main_core, main_loader, landing_ui_panel_content, landing_loc, landing_pageobject) {
	'use strict';

	const showPseudoContent = Symbol('showPseudoContent');
	const hidePseudoContent = Symbol('hidePseudoContent');
	const disableEditorPointerEvents = Symbol('disableEditorPointerEvents');
	const enableEditorPointerEvents = Symbol('enableEditorPointerEvents');

	/**
	 * @memberOf BX.Landing.UI.Panel
	 */
	class StylePanel extends landing_ui_panel_content.Content {
		shouldAdjustTopPanelControls = false;

		// Not a modal: the panel drops its own overlay, shrinks the page beside itself
		// and expects clicks on the preview nodes while it is open.
		isDialog = false;
		constructor(options = {}) {
			super(options);
			this.setEventNamespace('BX.Landing.UI.Panel.StylePanel');
			this.setTitle(landing_loc.Loc.getMessage('LANDING_DESIGN_PANEL_HEADER'));
			this.pseudoContent = main_core.Runtime.clone(this.content);
			this.loader = new main_loader.Loader({
				target: this.pseudoContent,
				offset: {
					top: '-10%'
				}
			});
			this.lsCache = new main_core.Cache.LocalStorageCache();
			this.cache = new main_core.Cache.MemoryCache();
			this.switcher = this.getSwitcher();
			this.closeByEsc = false;
			main_core.Dom.addClass(this.layout, 'landing-ui-panel-style');
			main_core.Dom.addClass(this.overlay, 'landing-ui-panel-style-overlay');
			main_core.Dom.attr(this.layout, 'hidden', 'true');
			main_core.Dom.clean(this.pseudoContent);
			main_core.Dom.style(this.pseudoContent, 'margin-left', '20px');
			main_core.Dom.append(this.pseudoContent, this.body);
			main_core.Dom.append(this.switcher.layout, this.footer);
			main_core.Dom.prepend(this.layout, this.getViewContainer());
			if (window.localStorage) {
				const state = window.localStorage.getItem('selectGroup') === 'true';
				this.lsCache.set('selectGroup', state.toString());
			}
		}
		static getInstance() {
			const rootWindow = landing_pageobject.PageObject.getRootWindow();
			// Outside the editor the root window is the portal page and has no landing namespace,
			// so the panel keeps its instance in the current window.
			const rootWindowPanel = rootWindow.BX.getClass('BX.Landing.UI.Panel.StylePanel');
			if (!rootWindowPanel?.instance && !StylePanel.instance) {
				StylePanel.instance = new StylePanel();
				if (rootWindowPanel) {
					rootWindowPanel.instance = StylePanel.instance;
				}
			}
			return rootWindowPanel?.instance || StylePanel.instance;
		}
		getSwitcher() {
			return this.cache.remember('switcher', () => {
				return new BX.Landing.UI.Field.Switch({
					title: landing_loc.Loc.getMessage('LANDING_STYLE_PANEL_SELECT_GROUP_SWITCH'),
					onValueChange: () => {
						if (window.localStorage) {
							window.localStorage.setItem('selectGroup', this.switcher.getValue().toString());
						}
						this.lsCache.set('selectGroup', this.switcher.getValue().toString());
					},
					value: main_core.Text.toBoolean(this.lsCache.get('selectGroup'))
				});
			});
		}
		getViewContainer() {
			return this.cache.remember('viewContainer', () => {
				return landing_pageobject.PageObject.getRootWindow().document.querySelector('.landing-ui-view-container');
			});
		}
		getViewWrapper() {
			return this.cache.remember('viewWrapper', () => {
				return this.getViewContainer().querySelector('.landing-ui-view-wrapper');
			});
		}
		[showPseudoContent]() {
			main_core.Dom.attr(this.content, 'hidden', true);
			main_core.Dom.attr(this.pseudoContent, 'hidden', null);
		}
		[hidePseudoContent]() {
			main_core.Dom.attr(this.content, 'hidden', null);
			main_core.Dom.attr(this.pseudoContent, 'hidden', true);
		}
		static [enableEditorPointerEvents]() {
			main_core.Dom.style(document.body, 'pointer-events', null);
		}
		static [disableEditorPointerEvents]() {
			main_core.Dom.style(document.body, 'pointer-events', 'none');
		}
		show(formMode) {
			const isOpening = !this.isShown();
			this[showPseudoContent]();
			StylePanel[disableEditorPointerEvents]();
			if (formMode) {
				if (!main_core.Dom.hasClass(this.layout, 'landing-ui-style-form-mode')) {
					main_core.Dom.addClass(this.layout, 'landing-ui-style-form-mode');

					/*Dom.style(this.overlay, {
						'z-index': 9998,
						width: '880px',
					});*/
					main_core.Dom.insertAfter(this.overlay, this.layout);
					main_core.Dom.removeClass(this.overlay, 'landing-ui-panel-style-overlay');
				}
			} else {
				//Dom.remove(this.overlay);
				main_core.Dom.addClass(this.overlay, 'landing-ui-panel-style-overlay');
				main_core.Dom.removeClass(this.layout, 'landing-ui-style-form-mode');
			}
			main_core.Dom.remove(this.overlay);
			return super.show().then(() => {
				// The panel has no focus trap to bring the focus in, so it does it on its own, once the
				// panel is really on screen: a layout still carrying `hidden` takes no focus.
				if (isOpening) {
					this.moveFocusInside();
				}
				this.loader.show();
				setTimeout(() => {
					this[hidePseudoContent]();
					StylePanel[enableEditorPointerEvents]();
				}, 300);
				if (!formMode) {
					main_core.Dom.style(this.getViewWrapper(), 'max-width', 'calc(100% - 320px)');
					main_core.Dom.addClass(document.body, 'landing-ui-collapsed');
				}
				BX.onCustomEvent('BX.Landing.Style:enable', []);
				this.emit('enable', {
					panel: this
				});
				return this;
			});
		}
		hide() {
			StylePanel[disableEditorPointerEvents]();
			main_core.Dom.style(this.getViewWrapper(), 'max-width', null);
			return super.hide().then(() => {
				StylePanel[enableEditorPointerEvents]();
				main_core.Dom.addClass(document.body, 'landing-ui-collapsed');
				BX.onCustomEvent('BX.Landing.Style:disable', []);
				this.emit('disable', {
					panel: this
				});
				return this;
			});
		}
		prepareFooter(isMultiSelector = true) {
			if (isMultiSelector) {
				this.footer.hidden = false;
				main_core.Dom.removeClass(this.body, 'landing-ui-panel-content-body_long');
			} else {
				this.footer.hidden = true;
				main_core.Dom.addClass(this.body, 'landing-ui-panel-content-body_long');
			}
		}
	}

	exports.StylePanel = StylePanel;

})(this.BX.Landing.UI.Panel = this.BX.Landing.UI.Panel || {}, BX, BX, BX.Landing.UI.Panel, BX.Landing, BX.Landing);
//# sourceMappingURL=stylepanel.bundle.js.map
