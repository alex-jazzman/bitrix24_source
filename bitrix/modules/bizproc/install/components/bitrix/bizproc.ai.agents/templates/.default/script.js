/* eslint-disable */
this.BX = this.BX || {};
this.BX.Bizproc = this.BX.Bizproc || {};
this.BX.Bizproc.Ai = this.BX.Bizproc.Ai || {};
(function (exports,ui_infoHelper,ui_buttons,bizproc_aiAgents_grid) {
    'use strict';

    function _classPrivateMethodInitSpec(obj, privateSet) { _checkPrivateRedeclaration(obj, privateSet); privateSet.add(obj); }
    function _checkPrivateRedeclaration(obj, privateCollection) { if (privateCollection.has(obj)) { throw new TypeError("Cannot initialize the same private elements twice on an object"); } }
    function _classPrivateMethodGet(receiver, privateSet, fn) { if (!privateSet.has(receiver)) { throw new TypeError("attempted to get private field on non-instance"); } return fn; }
    var _bindEvents = /*#__PURE__*/new WeakSet();
    var _initGridManager = /*#__PURE__*/new WeakSet();
    var _bindAddAgentButtonEvent = /*#__PURE__*/new WeakSet();
    var _getOpenBPEditorClosure = /*#__PURE__*/new WeakSet();
    var _getShowTariffSliderClosure = /*#__PURE__*/new WeakSet();
    var AiAgentsPage = function AiAgentsPage(params) {
      babelHelpers.classCallCheck(this, AiAgentsPage);
      _classPrivateMethodInitSpec(this, _getShowTariffSliderClosure);
      _classPrivateMethodInitSpec(this, _getOpenBPEditorClosure);
      _classPrivateMethodInitSpec(this, _bindAddAgentButtonEvent);
      _classPrivateMethodInitSpec(this, _initGridManager);
      _classPrivateMethodInitSpec(this, _bindEvents);
      this.agentsGridId = params.agentsGridId;
      this.headerAddButtonUniqId = params.headerAddButtonUniqId;
      this.baseDesignerUri = params.baseDesignerUri;
      this.startTrigger = params.startTrigger;
      this.isAiAgentsAvailableByTariff = params === null || params === void 0 ? void 0 : params.isAiAgentsAvailableByTariff;
      this.aiAgentsTariffSliderCode = params === null || params === void 0 ? void 0 : params.aiAgentsTariffSliderCode;
      _classPrivateMethodGet(this, _initGridManager, _initGridManager2).call(this);
      _classPrivateMethodGet(this, _bindEvents, _bindEvents2).call(this);
    };
    function _bindEvents2() {
      _classPrivateMethodGet(this, _bindAddAgentButtonEvent, _bindAddAgentButtonEvent2).call(this);
    }
    function _initGridManager2() {
      this.gridManager = bizproc_aiAgents_grid.GridManager.getInstance(this.agentsGridId);
    }
    function _bindAddAgentButtonEvent2() {
      var addButton = ui_buttons.ButtonManager.createByUniqId(this.headerAddButtonUniqId);
      if (!addButton) {
        return;
      }
      var closure = _classPrivateMethodGet(this, _getOpenBPEditorClosure, _getOpenBPEditorClosure2).call(this);
      if (!this.isAiAgentsAvailableByTariff) {
        closure = _classPrivateMethodGet(this, _getShowTariffSliderClosure, _getShowTariffSliderClosure2).call(this);
      }
      addButton.bindEvent('click', closure);
    }
    function _getOpenBPEditorClosure2() {
      var _this = this;
      return function () {
        var grid = _this.gridManager.getGrid();
        grid.tableFade();
        var editUri = "".concat(_this.baseDesignerUri).concat(_this.startTrigger);
        window.open(editUri, '_blank');
        grid.reload();
        grid.tableUnfade();
      };
    }
    function _getShowTariffSliderClosure2() {
      var _this2 = this;
      return function () {
        var featureCode = _this2.aiAgentsTariffSliderCode;
        if (!featureCode) {
          return;
        }
        ui_infoHelper.FeaturePromotersRegistry.getPromoter({
          code: featureCode
        }).show();
      };
    }

    exports.AiAgentsPage = AiAgentsPage;

}((this.BX.Bizproc.Ai.Agents = this.BX.Bizproc.Ai.Agents || {}),BX.UI,BX.UI,BX.Bizproc.Ai.Agents));
//# sourceMappingURL=script.js.map
