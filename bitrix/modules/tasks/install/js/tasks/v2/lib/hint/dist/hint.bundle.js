/* eslint-disable */
this.BX = this.BX || {};
this.BX.Tasks = this.BX.Tasks || {};
this.BX.Tasks.V2 = this.BX.Tasks.V2 || {};
(function (exports,main_popup) {
	'use strict';

	var _delay = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("delay");
	var _destroy = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("destroy");
	class Hint {
	  constructor() {
	    Object.defineProperty(this, _destroy, {
	      value: _destroy2
	    });
	    Object.defineProperty(this, _delay, {
	      writable: true,
	      value: 2000
	    });
	  }
	  async showHint(options) {
	    babelHelpers.classPrivateFieldLooseBase(this, _destroy)[_destroy](options.id);
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
	    setTimeout(() => popup.close(), babelHelpers.classPrivateFieldLooseBase(this, _delay)[_delay]);
	  }
	}
	function _destroy2(popupId) {
	  var _PopupManager$getPopu;
	  (_PopupManager$getPopu = main_popup.PopupManager.getPopupById(popupId)) == null ? void 0 : _PopupManager$getPopu.destroy();
	}

	exports.Hint = Hint;

}((this.BX.Tasks.V2.Lib = this.BX.Tasks.V2.Lib || {}),BX.Main));
//# sourceMappingURL=hint.bundle.js.map
