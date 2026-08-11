/* eslint-disable */
this.BX = this.BX || {};
(function (exports, main_core, main_loader, ui_system_typography) {
	'use strict';

	class DeferredDocLoad {
		static loaded = false;
		static timeoutId = 0;
		static immediateLoadLinkId = 'immediate-open-link';
		static render(selector) {
			if (document.visibilityState === 'visible') {
				this.loaded = true;
				this.loadDocument();
				return;
			}
			this.showStub(selector);
			main_core.Event.bind(document, 'visibilitychange', () => this.maybeLoadDocument());
		}
		static maybeLoadDocument() {
			if (this.loaded) {
				return;
			}
			if (document.visibilityState === 'visible') {
				this.timeoutId = setTimeout(() => {
					this.loaded = true;
					this.loadDocument();
				}, 1000);
			}
			if (document.visibilityState === 'hidden') {
				clearTimeout(this.timeoutId);
			}
		}
		static loadDocument() {
			window.location.replace(this.getUriToLoad());
		}
		static showStub(selector) {
			const container = document.querySelector(selector);
			if (!main_core.Type.isDomNode(container)) {
				return;
			}
			container.innerHTML = '';
			main_core.Dom.append(this.renderStub(), container);
			this.initLoadLink();
		}
		static renderStub() {
			const url = this.getUriToLoad();
			const loaderHolder = main_core.Tag.render`<div class="disk-deferred-doc-load__loader"></div>`;
			const loader = new main_loader.Loader({
				target: loaderHolder,
				size: 140,
				color: 'var(--ui-color-accent-main-primary)',
				strokeWidth: 3,
				mode: 'inline'
			});
			loader.show();
			const title = ui_system_typography.Headline.render(main_core.Loc.getMessage('JS_DISK_DEFERRED_DOC_LOAD_TITLE') ?? '', {
				size: 'lg',
				tag: 'h2'
			});
			main_core.Dom.addClass(title, 'disk-deferred-doc-load__title');
			const hint = ui_system_typography.Text.render('', {
				size: 'lg',
				tag: 'p'
			});
			main_core.Dom.addClass(hint, 'disk-deferred-doc-load__hint');
			hint.innerHTML = main_core.Loc.getMessage('JS_DISK_DEFERRED_DOC_LOAD_HINT', {
				'[immediate_load_link]': `<a class="disk-deferred-doc-load__link" id="${this.immediateLoadLinkId}" href="${main_core.Text.encode(url)}">`,
				'[/immediate_load_link]': '</a>'
			}) ?? '';
			return main_core.Tag.render`
			<div class="disk-deferred-doc-load">
				${loaderHolder}
				${title}
				${hint}
			</div>
		`;
		}
		static initLoadLink() {
			const link = document.getElementById(this.immediateLoadLinkId);
			if (link !== null) {
				main_core.Event.bind(link, 'click', e => {
					e.preventDefault();
					this.loadDocument();
				});
			}
		}
		static getUriToLoad() {
			const uri = new main_core.Uri(document.location.href);
			uri.setQueryParam('immediate_load', 'Y');
			return uri.toString();
		}
	}

	exports.DeferredDocLoad = DeferredDocLoad;

})(this.BX.Disk = this.BX.Disk || {}, BX, BX, BX.UI.System.Typography);
//# sourceMappingURL=deferred-doc-load.bundle.js.map
