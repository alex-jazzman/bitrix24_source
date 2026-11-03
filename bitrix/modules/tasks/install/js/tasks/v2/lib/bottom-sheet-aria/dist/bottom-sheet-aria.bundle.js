/* eslint-disable */
this.BX = this.BX || {};
this.BX.Tasks = this.BX.Tasks || {};
this.BX.Tasks.V2 = this.BX.Tasks.V2 || {};
(function (exports) {
	'use strict';

	function syncBottomSheetModality(bottomSheet) {
		const popup = bottomSheet?.$refs?.popup?.getPopupInstance?.();
		if (!popup) {
			return;
		}
		const container = popup.getPopupContainer?.();
		if (!container) {
			return;
		}
		if (popup.getFocusTrap?.()) {
			container.setAttribute('aria-modal', 'true');
		} else {
			container.removeAttribute('aria-modal');
		}
	}

	exports.syncBottomSheetModality = syncBottomSheetModality;

})(this.BX.Tasks.V2.Lib = this.BX.Tasks.V2.Lib || {});
//# sourceMappingURL=bottom-sheet-aria.bundle.js.map
