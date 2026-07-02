/* eslint-disable */
this.BX = this.BX || {};
(function (exports, main_core) {
	'use strict';

	class Badge {
		#target;
		constructor(target) {
			this.#target = target;
		}
		init(params = null) {
			const hint = params?.hint ?? main_core.Dom.attr(this.#target, 'data-badgehint');
			if (!main_core.Type.isStringFilled(hint)) {
				return;
			}
			main_core.Dom.addClass(this.#target, '--hint');
			main_core.Event.unbindAll(this.#target, 'mouseover');
			main_core.Event.unbindAll(this.#target, 'mouseleave');
			main_core.Event.bind(this.#target, 'mouseover', event => {
				main_core.Runtime.debounce(() => {
					BX.UI.Hint.show(this.#target, hint);

					// hide the title in the grid so that it does not overlap the hint
					const parentRow = event.target.closest('tr');
					if (!parentRow) {
						return;
					}
					const title = parentRow.getAttribute('title');
					if (main_core.Type.isStringFilled(title)) {
						parentRow.setAttribute('data-title', title);
						parentRow.removeAttribute('title');
					}
				}, 50, this)();
			});
			main_core.Event.bind(this.#target, 'mouseleave', event => {
				BX.UI.Hint.hide(this.#target);
				const parentRow = event.target.closest('tr');
				if (!parentRow) {
					return;
				}
				const title = parentRow.getAttribute('data-title');
				if (main_core.Type.isStringFilled(title)) {
					parentRow.setAttribute('title', title);
				}
				parentRow.removeAttribute('data-title');
			});
		}
	}

	exports.Badge = Badge;

})(this.BX.Crm = this.BX.Crm || {}, BX);
//# sourceMappingURL=badge.bundle.js.map
