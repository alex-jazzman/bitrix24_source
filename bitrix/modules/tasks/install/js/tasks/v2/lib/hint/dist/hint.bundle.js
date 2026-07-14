/* eslint-disable */
this.BX = this.BX || {};
this.BX.Tasks = this.BX.Tasks || {};
this.BX.Tasks.V2 = this.BX.Tasks.V2 || {};
(function (exports, main_popup) {
	'use strict';

	class Hint {
		#delay = 2000;
		async showHint(options) {
			this.#destroy(options.id);
			const baseOptions = {
				className: 'tasks-hint',
				background: 'var(--ui-color-bg-content-inapp)',
				angle: true,
				autoHide: true,
				autoHideHandler: () => true,
				cacheable: false,
				animation: 'fading',
				...options
			};
			const popup = new main_popup.Popup(baseOptions);
			popup.show();
			setTimeout(() => popup.close(), this.#delay);
		}
		#destroy(popupId) {
			main_popup.PopupManager.getPopupById(popupId)?.destroy();
		}
	}

	exports.Hint = Hint;

})(this.BX.Tasks.V2.Lib = this.BX.Tasks.V2.Lib || {}, BX.Main);
//# sourceMappingURL=hint.bundle.js.map
