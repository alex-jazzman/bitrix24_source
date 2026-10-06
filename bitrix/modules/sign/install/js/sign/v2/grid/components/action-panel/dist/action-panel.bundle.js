/* eslint-disable */
this.BX = this.BX || {};
this.BX.Sign = this.BX.Sign || {};
this.BX.Sign.V2 = this.BX.Sign.V2 || {};
this.BX.Sign.V2.Grid = this.BX.Sign.V2.Grid || {};
(function (exports, main_core) {
	'use strict';

	class ActionPanel {
		#storedOnClick = new Map();
		toggleActionButton(id, enabled, title = '') {
			const button = document.getElementById(id);
			if (button === null) {
				return;
			}
			if (!enabled && !main_core.Dom.hasClass(button, 'ui-action-panel-item-is-disabled')) {
				main_core.Dom.addClass(button, 'ui-action-panel-item-is-disabled');
				main_core.Dom.attr(button, 'title', title);
				main_core.Dom.style(button, 'user-select', 'none');
				this.#storedOnClick.set(id, button.onclick);
				button.onclick = () => false;
				return;
			}
			if (enabled && main_core.Dom.hasClass(button, 'ui-action-panel-item-is-disabled')) {
				main_core.Dom.removeClass(button, 'ui-action-panel-item-is-disabled');
				main_core.Dom.attr(button, 'title', '');
				main_core.Dom.style(button, 'user-select', 'auto');
				button.onclick = this.#storedOnClick.get(id) ?? null;
			}
		}
		toggleActionButtonVisibility(id, visible) {
			const button = document.getElementById(id);
			if (!main_core.Type.isElementNode(button)) {
				return;
			}
			main_core.Dom.style(button, 'display', visible ? null : 'none');
		}
	}

	exports.ActionPanel = ActionPanel;

})(this.BX.Sign.V2.Grid.Components = this.BX.Sign.V2.Grid.Components || {}, BX);
//# sourceMappingURL=action-panel.bundle.js.map
