/* eslint-disable */
this.BX = this.BX || {};
this.BX.Tasks = this.BX.Tasks || {};
this.BX.Tasks.V2 = this.BX.Tasks.V2 || {};
this.BX.Tasks.V2.Lib = this.BX.Tasks.V2.Lib || {};
(function (exports,main_popup,main_ajax,ui_promoVideoPopup,ai_copilotPromoPopup,tasks_v2_lib_ahaMoments,tasks_v2_const) {
	'use strict';

	var _params = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("params");
	var _popup = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("popup");
	var _promotionType = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("promotionType");
	var _showPopup = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("showPopup");
	var _getPopup = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getPopup");
	var _onCopilotPromoHide = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("onCopilotPromoHide");
	class TasksAiPromo {
	  constructor(params) {
	    Object.defineProperty(this, _onCopilotPromoHide, {
	      value: _onCopilotPromoHide2
	    });
	    Object.defineProperty(this, _getPopup, {
	      value: _getPopup2
	    });
	    Object.defineProperty(this, _showPopup, {
	      value: _showPopup2
	    });
	    Object.defineProperty(this, _params, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _popup, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _promotionType, {
	      writable: true,
	      value: 'tasks_ai'
	    });
	    babelHelpers.classPrivateFieldLooseBase(this, _params)[_params] = params;
	  }
	  show() {
	    if (tasks_v2_lib_ahaMoments.ahaMoments.shouldShow(tasks_v2_const.Option.AhaTasksAiPromo)) {
	      tasks_v2_lib_ahaMoments.ahaMoments.setActive(tasks_v2_const.Option.AhaTasksAiPromo);
	      setTimeout(() => {
	        babelHelpers.classPrivateFieldLooseBase(this, _showPopup)[_showPopup]();
	      }, 1000);
	    }
	  }
	}
	function _showPopup2() {
	  babelHelpers.classPrivateFieldLooseBase(this, _popup)[_popup] = babelHelpers.classPrivateFieldLooseBase(this, _getPopup)[_getPopup]();
	  if (!babelHelpers.classPrivateFieldLooseBase(this, _popup)[_popup]) {
	    return;
	  }
	  babelHelpers.classPrivateFieldLooseBase(this, _popup)[_popup].subscribe(ui_promoVideoPopup.PromoVideoPopupEvents.HIDE, babelHelpers.classPrivateFieldLooseBase(this, _onCopilotPromoHide)[_onCopilotPromoHide].bind(this));
	  babelHelpers.classPrivateFieldLooseBase(this, _popup)[_popup].show();
	}
	function _getPopup2() {
	  if (!babelHelpers.classPrivateFieldLooseBase(this, _params)[_params].targetElement) {
	    return null;
	  }
	  return ai_copilotPromoPopup.CopilotPromoPopup.createByPresetId({
	    presetId: ai_copilotPromoPopup.CopilotPromoPopup.Preset.TASK,
	    targetOptions: babelHelpers.classPrivateFieldLooseBase(this, _params)[_params].targetElement,
	    offset: {
	      left: babelHelpers.classPrivateFieldLooseBase(this, _params)[_params].targetElement.offsetWidth / 2
	    },
	    angleOptions: {
	      position: ui_promoVideoPopup.AnglePosition.TOP
	    }
	  });
	}
	function _onCopilotPromoHide2() {
	  main_ajax.ajax.runAction('tasks.promotion.setViewed', {
	    data: {
	      promotion: babelHelpers.classPrivateFieldLooseBase(this, _promotionType)[_promotionType]
	    }
	  }).catch(err => {
	    console.error(err);
	  });
	  tasks_v2_lib_ahaMoments.ahaMoments.setInactive(tasks_v2_const.Option.AhaTasksAiPromo);
	  tasks_v2_lib_ahaMoments.ahaMoments.setPopupShown(tasks_v2_const.Option.AhaTasksAiPromo);
	}

	exports.TasksAiPromo = TasksAiPromo;

}((this.BX.Tasks.V2.Lib.Promotion = this.BX.Tasks.V2.Lib.Promotion || {}),BX.Main,BX,BX.UI,BX.AI,BX.Tasks.V2.Lib,BX.Tasks.V2.Const));
//# sourceMappingURL=promotion.bundle.js.map
