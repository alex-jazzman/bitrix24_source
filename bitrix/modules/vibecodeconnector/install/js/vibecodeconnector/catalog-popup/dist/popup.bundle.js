/* eslint-disable */
this.BX = this.BX || {};
(function (exports, main_core, ui_system_dialog, ui_system_skeleton) {
	'use strict';

	const POPUP_WIDTH_PX = 460;
	const POPUP_BIND_GAP_PX = 6;
	const POPUP_BIND_OFFSET_LEFT_PX = 20;
	const POPUP_VIEWPORT_MARGIN_PX = 16;
	const SKELETON_TILES = 5;
	const SKELETON_TAB_WIDTHS = [70, 49, 63, 128];
	class CatalogLoadingPopup {
		#dialog = null;
		#rootNode = null;
		#bindNode = null;
		#dialogContainer = null;
		#repositionHandler = null;
		#onHide = null;
		show(bindNode, onHide, disableScrolling = false) {
			this.#bindNode = bindNode;
			this.#onHide = onHide;
			this.#rootNode = main_core.Tag.render`<div class="vibecode-catalog-loading__dialog-root"></div>`;
			main_core.Dom.append(this.#renderSkeleton(), this.#rootNode);
			this.#dialog = new ui_system_dialog.Dialog({
				hasHorizontalPadding: false,
				hasVerticalPadding: false,
				content: this.#rootNode,
				hasCloseButton: true,
				hasOverlay: true,
				disableScrolling,
				closeByEsc: true,
				closeByClickOutside: true,
				events: {
					onShow: () => {
						this.#bindPositioning();
						this.#position();
					},
					onHide: () => {
						this.#reset();
						this.#onHide?.();
					}
				}
			});
			this.#dialog.show();
		}
		takeOver(onHide) {
			if (this.#dialog === null || this.#rootNode === null) {
				return null;
			}
			this.#onHide = onHide;
			this.#unbindPositioning();
			return {
				dialog: this.#dialog,
				rootNode: this.#rootNode,
				bindNode: this.#bindNode
			};
		}
		close() {
			this.#dialog?.hide();
		}
		#renderSkeleton() {
			const tabsNode = main_core.Tag.render`<nav class="vibecode-catalog-loading__tabs" aria-hidden="true"></nav>`;
			for (const width of SKELETON_TAB_WIDTHS) {
				main_core.Dom.append(ui_system_skeleton.Line(width, 26, 99), tabsNode);
			}
			const listNode = main_core.Tag.render`<ul class="vibecode-catalog-loading__list"></ul>`;
			for (let index = 0; index < SKELETON_TILES; index++) {
				main_core.Dom.append(this.#renderSkeletonItem(), listNode);
			}
			return main_core.Tag.render`
			<div class="vibecode-catalog-loading">
				<header class="vibecode-catalog-loading__header">
					<h3 class="vibecode-catalog-loading__title ui-headline --md --accent">${ui_system_skeleton.Line(200, 26)}</h3>
					<div class="vibecode-catalog-loading__search" aria-hidden="true">${ui_system_skeleton.Line(null, 34)}</div>
					${tabsNode}
				</header>
				<div class="vibecode-catalog-loading__content">
					<div class="vibecode-catalog-loading__body">${listNode}</div>
				</div>
			</div>
		`;
		}
		#renderSkeletonItem() {
			return main_core.Tag.render`
			<li class="vibecode-catalog-loading__item" aria-hidden="true">
				<span class="vibecode-catalog-loading__item-icon">${ui_system_skeleton.Line(56, 56)}</span>
				<div class="vibecode-catalog-loading__item-content">
					${ui_system_skeleton.Line(136, 14)}
					<div class="vibecode-catalog-loading__item-subtitle">${ui_system_skeleton.Line(null, 10)}${ui_system_skeleton.Line(168, 10)}</div>
				</div>
			</li>
		`;
		}
		#bindPositioning() {
			this.#repositionHandler = () => this.#position();
			main_core.Event.bind(window, 'resize', this.#repositionHandler, {
				passive: true
			});
			main_core.Event.bind(window, 'scroll', this.#repositionHandler, {
				passive: true,
				capture: true
			});
		}
		#unbindPositioning() {
			if (this.#repositionHandler === null) {
				return;
			}
			main_core.Event.unbind(window, 'resize', this.#repositionHandler);
			main_core.Event.unbind(window, 'scroll', this.#repositionHandler, true);
			this.#repositionHandler = null;
			this.#dialogContainer = null;
		}
		#position() {
			const container = this.#getDialogContainer();
			if (container === null || this.#bindNode === null || !this.#bindNode.isConnected) {
				return;
			}
			const rect = this.#bindNode.getBoundingClientRect();
			const containerWidth = container.offsetWidth || POPUP_WIDTH_PX;
			const containerHeight = container.offsetHeight;
			const minLeft = window.scrollX + POPUP_VIEWPORT_MARGIN_PX;
			const maxLeft = window.scrollX + document.documentElement.clientWidth - containerWidth - POPUP_VIEWPORT_MARGIN_PX;
			let left = window.scrollX + rect.left + POPUP_BIND_OFFSET_LEFT_PX;
			left = maxLeft > minLeft ? Math.min(Math.max(left, minLeft), maxLeft) : minLeft;
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
		#getDialogContainer() {
			if (this.#dialogContainer !== null && document.body.contains(this.#dialogContainer)) {
				return this.#dialogContainer;
			}
			const container = this.#rootNode?.closest('.popup-window') ?? null;
			this.#dialogContainer = container instanceof HTMLElement ? container : null;
			return this.#dialogContainer;
		}
		#reset() {
			this.#unbindPositioning();
			this.#dialog = null;
			this.#rootNode = null;
			this.#bindNode = null;
		}
	}

	exports.CatalogLoadingPopup = CatalogLoadingPopup;

})(this.BX.Vibecodeconnector = this.BX.Vibecodeconnector || {}, BX, BX.UI.System, BX.UI.System);
//# sourceMappingURL=popup.bundle.js.map
