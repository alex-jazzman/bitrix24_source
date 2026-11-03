/* eslint-disable */
this.BX = this.BX || {};
this.BX.Sign = this.BX.Sign || {};
this.BX.Sign.V2 = this.BX.Sign.V2 || {};
(function (exports, sign_v2_grid_b2e_placeholders, main_core, main_core_events) {
	'use strict';

	class PlaceholdersWidget {
		#mount = null;
		#widget = null;
		#isDragging = false;
		#dragOffsetX = 0;
		#dragOffsetY = 0;
		#isCollapsed = false;
		#handleMouseMove = null;
		#handleMouseUp = null;
		async show() {
			this.#widget = this.#createWidget();
			main_core.Dom.append(this.#widget, document.body);
			this.#initDrag();
			this.#initControls();
			this.#initSliderDestroyHandler();
			this.#mount = new sign_v2_grid_b2e_placeholders.PlaceholdersMount({
				container: this.#widget.querySelector('.sign-placeholders-widget-body'),
				showHeader: false
			});
			await this.#mount.load();
		}
		#createWidget() {
			const title = main_core.Loc.getMessage('SIGN_EDITOR_PLACEHOLDERS_WIDGET_TITLE');
			const createHint = main_core.Loc.getMessage('SIGN_EDITOR_PLACEHOLDERS_WIDGET_BTN_CREATE_HINT');
			return main_core.Tag.render`
			<div class="sign-placeholders-widget" data-testid="sign-placeholders-widget">
				<div class="sign-placeholders-widget-header">
					<div class="sign-placeholders-widget-drag-handle">
						<div class="sign-placeholders-widget-drag-icon"
							 data-testid="sign-placeholders-widget-drag-icon"
						></div>
						<span class="sign-placeholders-widget-title">${main_core.Text.encode(title)}</span>
					</div>
					<div class="sign-placeholders-widget-controls">
						<div class="sign-placeholders-widget-btn-collapse"
							 data-testid="sign-placeholders-widget-btn-collapse"
						>
						</div>
					</div>
				</div>
				<div class="sign-placeholders-widget-body"></div>
				<div class="sign-placeholders-widget-btn-create"
					 data-testid="sign-placeholders-widget-btn-create"
					 title="${main_core.Text.encode(createHint)}"
				>
				</div>
			</div>
		`;
		}
		#initControls() {
			const collapseBtn = this.#widget.querySelector('.sign-placeholders-widget-btn-collapse');
			main_core.Event.bind(collapseBtn, 'click', this.#toggleCollapse.bind(this));
			const createBtn = this.#widget.querySelector('.sign-placeholders-widget-btn-create');
			main_core.Event.bind(createBtn, 'click', this.#handleCreate.bind(this));
		}
		#initSliderDestroyHandler() {
			const slider = BX.SidePanel.Instance?.getTopSlider();
			if (!slider) {
				return;
			}
			main_core_events.EventEmitter.subscribe('SidePanel.Slider:onCloseComplete', event => {
				if (event.getTarget() === slider) {
					this.destroy();
				}
			});
		}
		#initDrag() {
			const handle = this.#widget.querySelector('.sign-placeholders-widget-header');
			main_core.Event.bind(handle, 'mousedown', event => {
				if (event.target.closest('.sign-placeholders-widget-controls')) {
					return;
				}
				this.#isDragging = true;
				const rect = this.#widget.getBoundingClientRect();
				this.#dragOffsetX = event.clientX - rect.left;
				this.#dragOffsetY = event.clientY - rect.top;
				main_core.Dom.addClass(this.#widget, 'sign-placeholders-widget--dragging');
				main_core.Dom.style(document.body, 'user-select', 'none');
			});
			this.#handleMouseMove = event => {
				if (!this.#isDragging) {
					return;
				}
				let x = event.clientX - this.#dragOffsetX;
				let y = event.clientY - this.#dragOffsetY;
				const maxX = window.innerWidth - this.#widget.offsetWidth;
				const maxY = window.innerHeight - this.#widget.offsetHeight;
				x = Math.max(0, Math.min(x, maxX));
				y = Math.max(0, Math.min(y, maxY));
				main_core.Dom.style(this.#widget, {
					left: `${x}px`,
					top: `${y}px`,
					right: 'auto',
					bottom: 'auto'
				});
			};
			this.#handleMouseUp = () => {
				if (this.#isDragging) {
					this.#isDragging = false;
					main_core.Dom.removeClass(this.#widget, 'sign-placeholders-widget--dragging');
					main_core.Dom.style(document.body, 'user-select', '');
				}
			};
			main_core.Event.bind(document, 'mousemove', this.#handleMouseMove);
			main_core.Event.bind(document, 'mouseup', this.#handleMouseUp);
		}
		#toggleCollapse() {
			this.#isCollapsed = !this.#isCollapsed;
			const body = this.#widget.querySelector('.sign-placeholders-widget-body');
			const btn = this.#widget.querySelector('.sign-placeholders-widget-btn-collapse');
			if (this.#isCollapsed) {
				main_core.Dom.style(body, 'display', 'none');
				main_core.Dom.addClass(btn, 'sign-placeholders-widget-btn-collapse--collapsed');
				main_core.Dom.addClass(this.#widget, 'sign-placeholders-widget--collapsed');
			} else {
				main_core.Dom.style(body, 'display', '');
				main_core.Dom.removeClass(btn, 'sign-placeholders-widget-btn-collapse--collapsed');
				main_core.Dom.removeClass(this.#widget, 'sign-placeholders-widget--collapsed');
			}
		}
		#handleCreate() {
			this.#mount?.getAppInstance()?.onCreateClick();
		}
		destroy() {
			main_core.Event.unbind(document, 'mousemove', this.#handleMouseMove);
			main_core.Event.unbind(document, 'mouseup', this.#handleMouseUp);
			this.#handleMouseMove = null;
			this.#handleMouseUp = null;
			this.#mount?.unmount();
			if (this.#widget) {
				main_core.Dom.remove(this.#widget);
				this.#widget = null;
			}
		}
	}

	exports.PlaceholdersWidget = PlaceholdersWidget;

})(this.BX.Sign.V2.B2e = this.BX.Sign.V2.B2e || {}, BX.Sign.V2.Grid.B2e, BX, BX.Event);
//# sourceMappingURL=placeholders-widget.bundle.js.map
