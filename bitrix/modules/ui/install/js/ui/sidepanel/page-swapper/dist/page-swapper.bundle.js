/* eslint-disable */
this.BX = this.BX || {};
this.BX.UI = this.BX.UI || {};
(function (exports, main_core, main_core_events, ui_iconSet_api_core, ui_iconSet_actions, main_loader) {
	'use strict';

	class PageSwapper extends main_core_events.EventEmitter {
		#disableClass = 'ui-swap-btn-disabled';
		btnSize = 20;
		constructor(options) {
			super(options);
			this.setEventNamespace('BX.UI.Sidepanel.PageSwapper');
			this.slider = options.slider || null;
			this.container = options.container || null;
			this.pagesHref = options.pagesHref || null;
			this.useLoader = options.useLoader || false;
			this.pageType = options.pageType || 'default';
		}
		init() {
			if (!this.slider) {
				console.warn('BX.UI.SliderPageSwapper.Preview: \'slider\' is not defined');
				return;
			}
			if (!this.container) {
				console.warn('BX.UI.SliderPageSwapper.Preview: \'container\' is not defined');
				return;
			}
			this.window = this.slider.getFrameWindow();
			this.curHref = this.slider.url;
			this.pageId = this.slider.getData().get('pageId');
			if (!this.#isAnyPageSet()) {
				this.#setNeighboursHref();
			}
			this.#setPrevButton();
			this.#setNextButton();
			this.setTitles(this.pageType);
			this.getWrapper();
			this.#renderWrapper();
		}
		setPrevPage(prevPageId = null, prevPageHref = null) {
			if (prevPageId) {
				this.prevPageId = prevPageId;
			}
			if (prevPageHref) {
				this.prevPageHref = prevPageHref;
			}
			this.#setButtonHref(this.getPrevButton(), this.prevPageId, this.prevPageHref);
		}
		setNextPage(nextPageId = null, nextPageHref = null) {
			if (nextPageId) {
				this.nextPageId = nextPageId;
			}
			if (nextPageHref) {
				this.nextPageHref = nextPageHref;
			}
			this.#setButtonHref(this.getNextButton(), this.nextPageId, this.nextPageHref);
		}
		updatePagesHref(pagesHref) {
			this.showLoader();
			this.#setNeighboursHref(pagesHref);
			this.setPrevPage();
			this.setNextPage();
			this.hideLoader();
		}
		#setPrevButton() {
			const icon = new ui_iconSet_api_core.Icon({
				icon: ui_iconSet_api_core.Actions.CHEVRON_LEFT,
				size: this.btnSize
			});
			this.prevBtn = main_core.Tag.render`<button type="button" class="ui-page-swap-btn ui-page-swap-left"></button>`;
			main_core.Dom.append(icon.render(), this.prevBtn);
			this.#setButtonHref(this.getPrevButton(), this.prevPageId, this.prevPageHref);
		}
		#setNextButton() {
			const icon = new ui_iconSet_api_core.Icon({
				icon: ui_iconSet_api_core.Actions.CHEVRON_RIGHT,
				size: this.btnSize
			});
			this.nextBtn = main_core.Tag.render`<button type="button" class="ui-page-swap-btn ui-page-swap-right"></button>`;
			main_core.Dom.append(icon.render(), this.nextBtn);
			this.#setButtonHref(this.getNextButton(), this.nextPageId, this.nextPageHref);
		}
		getPrevButton() {
			return this.prevBtn;
		}
		getNextButton() {
			return this.nextBtn;
		}
		#setButtonHref(button, pageId = null, pageHref = null) {
			if (pageId && pageHref) {
				this.#addListenerToButton(button, pageId, pageHref);
				this.hideLoader();
			} else {
				main_core.Event.unbindAll(button, 'click');
			}
			this.#toggleButton(button, pageId, pageHref);
		}
		#toggleButton(button, pageId, pageHref) {
			if (main_core.Dom.hasClass(button, this.#disableClass) && pageId && pageHref) {
				main_core.Dom.removeClass(button, this.#disableClass);
				main_core.Dom.style(button, 'cursor', 'pointer');
				button.disabled = false;
			} else if (!main_core.Dom.hasClass(button, this.#disableClass) && !(pageId && pageHref)) {
				main_core.Dom.addClass(button, this.#disableClass);
				main_core.Dom.style(button, 'cursor', 'not-allowed');
				button.disabled = true;
			}
		}
		getWrapper() {
			if (!this.wrapper) {
				this.wrapper = main_core.Tag.render`
				<div class='ui-page-swapper'>
					${this.getPrevButton()}
					${this.getNextButton()}
				</div>
			`;
			}
			return this.wrapper;
		}
		#renderWrapper() {
			main_core.Dom.append(this.getWrapper(), this.container);
			this.loader = new main_loader.Loader({
				target: this.getWrapper(),
				size: 20,
				mode: 'absolute'
			});
			if (this.useLoader && !this.#isAnyPageSet()) {
				this.showLoader();
			} else {
				this.hideLoader();
			}
		}
		#activateOverlay() {
			const loader = this.slider.layout.loader;
			if (loader) {
				main_core.Dom.style(loader, 'opacity', 0.5);
				main_core.Dom.style(loader, 'display', 'block');
			}
		}
		#setNeighboursHref(pagesHref = null) {
			if (pagesHref) {
				this.pagesHref = pagesHref;
			}
			if (!this.pagesHref) {
				return;
			}
			if (!this.pageId) {
				this.pagesHref.forEach(page => {
					if (page.HREF.includes(this.curHref)) {
						this.pageId = Number(page.ID);
					}
				});
			}
			this.prevPageId = null;
			this.prevPageHref = null;
			this.nextPageId = null;
			this.nextPageHref = null;
			if (!this.pageId) {
				return;
			}
			Object.keys(this.pagesHref).forEach(key => {
				if (Number(this.pagesHref[key].ID) === this.pageId) {
					this.prevPageId = Number(this.pagesHref[key - 1]?.ID) || null;
					this.prevPageHref = this.pagesHref[key - 1]?.HREF || null;
					this.nextPageId = Number(this.pagesHref[Number(key) + 1]?.ID) || null;
					this.nextPageHref = this.pagesHref[Number(key) + 1]?.HREF || null;
				}
			});
		}
		#addListenerToButton(button, pageId, pageHref) {
			main_core.Event.bind(button, 'click', () => {
				this.slider.getData().set('pageId', pageId);
				const url = new URL(pageHref, window.location);
				url.searchParams.append('IFRAME_TYPE', 'SIDE_SLIDER');
				url.searchParams.append('IFRAME', 'Y');
				this.#activateOverlay();
				this.window.location.href = url;
			});
		}
		hasPagesBeforeEnd(pagesBeforeEnd = 0) {
			if (pagesBeforeEnd === 0) {
				return !main_core.Type.isUndefined(this.nextPageHref) && !main_core.Type.isNull(this.nextPageHref);
			}
			if (pagesBeforeEnd > 0 && main_core.Type.isNumber(pagesBeforeEnd)) {
				let check = null;
				Object.keys(this.pagesHref).forEach(key => {
					if (Number(this.pagesHref[key].ID) === this.pageId) {
						check = this.pagesHref[Number(key) + pagesBeforeEnd]?.HREF || null;
					}
				});
				return !main_core.Type.isNull(check);
			}
			return false;
		}
		#isAnyPageSet() {
			return this.prevPageId && this.prevPageHref || this.nextPageId && this.nextPageHref;
		}
		showLoader() {
			if (this.loader && !this.loader.isShown()) {
				this.loader.show();
				main_core.Dom.style(this.getPrevButton(), 'visibility', 'hidden');
				main_core.Dom.style(this.getNextButton(), 'visibility', 'hidden');
			}
		}
		hideLoader() {
			if (this.loader && this.loader.isShown()) {
				this.loader.hide();
				main_core.Dom.style(this.getPrevButton(), 'visibility', 'visible');
				main_core.Dom.style(this.getNextButton(), 'visibility', 'visible');
			}
		}
		setTitles(type) {
			if (type === 'mail') {
				const prevLabel = main_core.Loc.getMessage('UI_SIDEPANEL_PAGE_SWAPPER_PREVIOUS_MAIL_MESSAGE');
				const nextLabel = main_core.Loc.getMessage('UI_SIDEPANEL_PAGE_SWAPPER_NEXT_MAIL_MESSAGE');
				this.prevBtn.setAttribute('title', prevLabel);
				this.prevBtn.setAttribute('aria-label', prevLabel);
				this.nextBtn.setAttribute('title', nextLabel);
				this.nextBtn.setAttribute('aria-label', nextLabel);
			}
		}
	}

	exports.PageSwapper = PageSwapper;

})(this.BX.UI.SidePanel = this.BX.UI.SidePanel || {}, BX, BX.Event, BX.UI.IconSet, window, BX);
//# sourceMappingURL=page-swapper.bundle.js.map
