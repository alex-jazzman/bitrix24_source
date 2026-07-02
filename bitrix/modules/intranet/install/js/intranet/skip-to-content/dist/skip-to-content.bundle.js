/* eslint-disable */
this.BX = this.BX || {};
(function (exports, main_core) {
	'use strict';

	class SkipToContent {
		#root = null;
		#summary = null;
		#links = [];
		render() {
			this.#render();
			this.#bindEvents();
		}
		#render() {
			const items = [{
				selector: '#page-area',
				label: main_core.Loc.getMessage('BITRIX24_SKIP_NAV_MAIN_CONTENT')
			}, {
				selector: '#menu-items-block',
				label: main_core.Loc.getMessage('BITRIX24_SKIP_NAV_MAIN_MENU')
			}, {
				selector: '#air-header-menu .main-buttons',
				label: main_core.Loc.getMessage('BITRIX24_SKIP_NAV_TOP_MENU')
			}];
			const list = main_core.Tag.render`<ul class="skip-to-content__list"></ul>`;
			this.#links = items.map(item => {
				const link = main_core.Tag.render`
				<a class="skip-to-content__link --ui-hoverable" href="#" data-target="${item.selector}">
					${item.label}
				</a>
			`;
				main_core.Dom.append(main_core.Tag.render`<li>${link}</li>`, list);
				return link;
			});
			this.#summary = main_core.Tag.render`<summary class="skip-to-content__button">${main_core.Loc.getMessage('BITRIX24_SKIP_NAV_BUTTON')}</summary>`;
			this.#root = main_core.Tag.render`
			<details class="skip-to-content --ui-context-content-light">
				${this.#summary}
				<nav aria-label="${main_core.Loc.getMessage('BITRIX24_SKIP_NAV_LABEL')}">
					${list}
				</nav>
			</details>
		`;
			main_core.Dom.prepend(this.#root, document.body);
		}
		#bindEvents() {
			if (!this.#root) {
				return;
			}
			this.#links.forEach(link => {
				main_core.Event.bind(link, 'click', this.#onLinkClick.bind(this));
			});
			main_core.Event.bind(this.#root, 'keydown', this.#onKeyDown.bind(this));
		}
		#onLinkClick(event) {
			event.preventDefault();
			const link = event.currentTarget;
			const selector = link.dataset.target;
			const target = selector ? document.querySelector(selector) : null;
			this.#close();
			if (!(target instanceof HTMLElement)) {
				return;
			}
			this.#focusTarget(target);
		}
		#focusTarget(target) {
			if (!target.hasAttribute('tabindex')) {
				target.setAttribute('tabindex', '-1');
			}
			main_core.Dom.attr(target, 'data-focus-by-skip-link', 'true');
			main_core.Event.unbind(target, 'blur', SkipToContent.#handleOnBlur);
			main_core.Event.bindOnce(target, 'blur', SkipToContent.#handleOnBlur);
			target.focus();
			target.scrollIntoView({
				block: 'nearest'
			});
		}
		static #handleOnBlur(event) {
			const target = event.currentTarget;
			main_core.Dom.attr(target, 'data-focus-by-skip-link', null);
		}
		#onKeyDown(event) {
			if (!this.#root || !this.#root.open) {
				return;
			}
			const links = this.#links;
			if (links.length === 0) {
				return;
			}
			const activeIndex = links.indexOf(document.activeElement);
			switch (event.key) {
				case 'ArrowDown':
					event.preventDefault();
					links[activeIndex < 0 ? 0 : (activeIndex + 1) % links.length].focus();
					break;
				case 'ArrowUp':
					event.preventDefault();
					links[activeIndex <= 0 ? links.length - 1 : activeIndex - 1].focus();
					break;
				case 'Home':
					event.preventDefault();
					links[0].focus();
					break;
				case 'End':
					event.preventDefault();
					links[links.length - 1].focus();
					break;
				case 'Escape':
					event.preventDefault();
					this.#close();
					this.#summary?.focus();
					break;
			}
		}
		#close() {
			if (this.#root) {
				main_core.Dom.attr(this.#root, 'open', null);
			}
		}
	}

	exports.SkipToContent = SkipToContent;

})(this.BX.Intranet = this.BX.Intranet || {}, BX);
//# sourceMappingURL=skip-to-content.bundle.js.map
