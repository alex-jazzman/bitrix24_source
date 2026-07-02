/* eslint-disable */
(function (exports,main_core,main_core_events,ui_alerts,bizproc_workflow_starter) {
	'use strict';

	var _templateObject;
	function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); enumerableOnly && (symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; })), keys.push.apply(keys, symbols); } return keys; }
	function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = null != arguments[i] ? arguments[i] : {}; i % 2 ? ownKeys(Object(source), !0).forEach(function (key) { babelHelpers.defineProperty(target, key, source[key]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } return target; }
	function _classPrivateMethodInitSpec(obj, privateSet) { _checkPrivateRedeclaration(obj, privateSet); privateSet.add(obj); }
	function _classPrivateFieldInitSpec(obj, privateMap, value) { _checkPrivateRedeclaration(obj, privateMap); privateMap.set(obj, value); }
	function _checkPrivateRedeclaration(obj, privateCollection) { if (privateCollection.has(obj)) { throw new TypeError("Cannot initialize the same private elements twice on an object"); } }
	function _classPrivateMethodGet(receiver, privateSet, fn) { if (!privateSet.has(receiver)) { throw new TypeError("attempted to get private field on non-instance"); } return fn; }
	var namespace = main_core.Reflection.namespace('BX.Bizproc.Component');
	var _documents = /*#__PURE__*/new WeakMap();
	var _signedDocumentType = /*#__PURE__*/new WeakMap();
	var _signedDocumentId = /*#__PURE__*/new WeakMap();
	var _counters = /*#__PURE__*/new WeakMap();
	var _canEdit = /*#__PURE__*/new WeakMap();
	var _bizprocEditorUrl = /*#__PURE__*/new WeakMap();
	var _bizprocNewEditorUrl = /*#__PURE__*/new WeakMap();
	var _onAfterGridUpdated = /*#__PURE__*/new WeakSet();
	var _renderStartedByMeNow = /*#__PURE__*/new WeakSet();
	var WorkflowStartList = /*#__PURE__*/function () {
	  function WorkflowStartList(options) {
	    var _this = this;
	    babelHelpers.classCallCheck(this, WorkflowStartList);
	    _classPrivateMethodInitSpec(this, _renderStartedByMeNow);
	    _classPrivateMethodInitSpec(this, _onAfterGridUpdated);
	    _classPrivateFieldInitSpec(this, _documents, {
	      writable: true,
	      value: new Map()
	    });
	    _classPrivateFieldInitSpec(this, _signedDocumentType, {
	      writable: true,
	      value: void 0
	    });
	    _classPrivateFieldInitSpec(this, _signedDocumentId, {
	      writable: true,
	      value: void 0
	    });
	    _classPrivateFieldInitSpec(this, _counters, {
	      writable: true,
	      value: new Map()
	    });
	    _classPrivateFieldInitSpec(this, _canEdit, {
	      writable: true,
	      value: void 0
	    });
	    _classPrivateFieldInitSpec(this, _bizprocEditorUrl, {
	      writable: true,
	      value: void 0
	    });
	    _classPrivateFieldInitSpec(this, _bizprocNewEditorUrl, {
	      writable: true,
	      value: void 0
	    });
	    if (!main_core.Type.isPlainObject(options)) {
	      return;
	    }
	    this.gridId = options.gridId;
	    this.errorsContainerDiv = options.errorsContainerDiv;
	    babelHelpers.classPrivateFieldSet(this, _canEdit, options.canEdit);
	    babelHelpers.classPrivateFieldSet(this, _bizprocEditorUrl, options.bizprocEditorUrl);
	    babelHelpers.classPrivateFieldSet(this, _bizprocNewEditorUrl, options.bizprocNewEditorUrl);
	    if (main_core.Type.isArray(options.documentConfigs)) {
	      options.documentConfigs.forEach(function (documentConfig) {
	        if (!main_core.Type.isStringFilled(documentConfig === null || documentConfig === void 0 ? void 0 : documentConfig.documentTypeKey)) {
	          return;
	        }
	        babelHelpers.classPrivateFieldGet(_this, _documents).set(documentConfig.documentTypeKey, documentConfig);
	      });
	    }
	    if (main_core.Type.isStringFilled(options.signedDocumentType)) {
	      babelHelpers.classPrivateFieldSet(this, _signedDocumentType, options.signedDocumentType);
	    }
	    if (main_core.Type.isStringFilled(options.signedDocumentId)) {
	      babelHelpers.classPrivateFieldSet(this, _signedDocumentId, options.signedDocumentId);
	    }
	  }
	  babelHelpers.createClass(WorkflowStartList, [{
	    key: "init",
	    value: function init() {
	      BX.UI.Hint.init(document);
	      if (this.getGrid()) {
	        BX.Bizproc.Component.WorkflowStartList.colorPinnedRows(this.getGrid());
	      }
	      main_core_events.EventEmitter.subscribe('Grid::updated', _classPrivateMethodGet(this, _onAfterGridUpdated, _onAfterGridUpdated2).bind(this));
	    }
	  }, {
	    key: "editTemplate",
	    value: function editTemplate(event, templateId, templateType) {
	      var documentTypeKeys = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : [];
	      var preferredDocumentTypeKey = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : null;
	      var documentConfig = this.resolveEditDocumentConfig(documentTypeKeys, preferredDocumentTypeKey);
	      if (!documentConfig) {
	        return;
	      }
	      if (!documentConfig.canEdit) {
	        this.showNoPermissionsHint(event.target);
	        return;
	      }
	      if (!main_core.Type.isStringFilled(documentConfig.editorUrl)) {
	        this.showNoEditorHint(event.target);
	        return;
	      }
	      this.openBizprocEditor(templateId, templateType, documentConfig.editorUrl);
	    }
	  }, {
	    key: "showAngleHint",
	    value: function showAngleHint(node, text) {
	      if (this.hintTimeout) {
	        clearTimeout(this.hintTimeout);
	      }
	      this.popupHint = BX.UI.Hint.createInstance({
	        popupParameters: {
	          width: 334,
	          height: 104,
	          closeByEsc: true,
	          autoHide: true,
	          angle: {
	            offset: main_core.Dom.getPosition(node).width / 2
	          },
	          bindOptions: {
	            position: 'top'
	          }
	        }
	      });
	      this.popupHint.close = function () {
	        this.hide();
	      };
	      this.popupHint.show(node, text);
	      this.hintTimeout = setTimeout(this.hideHint.bind(this), 5000);
	    }
	  }, {
	    key: "hideHint",
	    value: function hideHint() {
	      if (this.hintTimeout) {
	        clearTimeout(this.hintTimeout);
	        this.hintTimeout = null;
	      }
	      if (this.popupHint) {
	        this.popupHint.close();
	      }
	      this.popupHint = null;
	    }
	  }, {
	    key: "showNoPermissionsHint",
	    value: function showNoPermissionsHint(node) {
	      this.showAngleHint(node, main_core.Loc.getMessage('BIZPROC_CMP_WORKKFLOW_START_LIST_START_RIGHTS_ERROR'));
	    }
	  }, {
	    key: "showNoEditorHint",
	    value: function showNoEditorHint(node) {
	      this.showAngleHint(node, main_core.Loc.getMessage('BIZPROC_CMP_WORKKFLOW_START_LIST_START_MODULE_ERROR'));
	    }
	  }, {
	    key: "showErrors",
	    value: function showErrors(errors) {
	      var _this2 = this;
	      this.errorsContainerDiv.style.margin = '10px';
	      errors.forEach(function (error) {
	        var alert = new ui_alerts.Alert({
	          text: error.message,
	          color: ui_alerts.AlertColor.DANGER,
	          closeBtn: true,
	          animated: true
	        });
	        alert.renderTo(_this2.errorsContainerDiv);
	      });
	    }
	  }, {
	    key: "reloadGrid",
	    value: function reloadGrid() {
	      var grid = this.getGrid();
	      if (!grid) {
	        return;
	      }
	      var data = this.getGridReloadData();
	      if (Object.keys(data).length > 0) {
	        grid.reloadTable('POST', data);
	        return;
	      }
	      grid.reload();
	    }
	  }, {
	    key: "getGrid",
	    value: function getGrid() {
	      if (this.gridId) {
	        return BX.Main.gridManager && BX.Main.gridManager.getInstanceById(this.gridId);
	      }
	      return null;
	    }
	  }, {
	    key: "getGridReloadData",
	    value: function getGridReloadData() {
	      var signedDocuments = this.resolveDocumentConfigs().filter(function (documentConfig) {
	        return main_core.Type.isStringFilled(documentConfig.signedDocumentType) && main_core.Type.isStringFilled(documentConfig.signedDocumentId);
	      }).map(function (documentConfig) {
	        return {
	          signedDocumentType: documentConfig.signedDocumentType,
	          signedDocumentId: documentConfig.signedDocumentId
	        };
	      });
	      if (main_core.Type.isArrayFilled(signedDocuments)) {
	        return {
	          signedDocuments: signedDocuments
	        };
	      }
	      if (babelHelpers.classPrivateFieldGet(this, _signedDocumentType) && babelHelpers.classPrivateFieldGet(this, _signedDocumentId)) {
	        return {
	          signedDocumentType: babelHelpers.classPrivateFieldGet(this, _signedDocumentType),
	          signedDocumentId: babelHelpers.classPrivateFieldGet(this, _signedDocumentId)
	        };
	      }
	      return {};
	    }
	  }, {
	    key: "startWorkflow",
	    value: function startWorkflow(event, templateId, triggerType) {
	      var _this3 = this;
	      var documentTypeKeys = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : [];
	      var preferredDocumentTypeKey = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : null;
	      event.preventDefault();
	      var id = main_core.Text.toNumber(templateId);
	      if (id <= 0) {
	        return;
	      }
	      var documentConfig = this.resolveSingleDocumentConfig(documentTypeKeys, preferredDocumentTypeKey);
	      if (!documentConfig) {
	        return;
	      }
	      var afterSuccessStart = function afterSuccessStart() {
	        var slider = BX.SidePanel.Instance.getSliderByWindow(window);
	        if (slider) {
	          slider.close();
	          return;
	        }
	        if (!babelHelpers.classPrivateFieldGet(_this3, _counters).has(templateId)) {
	          babelHelpers.classPrivateFieldGet(_this3, _counters).set(templateId, 0);
	        }
	        babelHelpers.classPrivateFieldGet(_this3, _counters).set(templateId, babelHelpers.classPrivateFieldGet(_this3, _counters).get(templateId) + 1);
	        _this3.reloadGrid();
	      };
	      bizproc_workflow_starter.Starter.singleStart({
	        signedDocumentId: documentConfig.signedDocumentId,
	        signedDocumentType: documentConfig.signedDocumentType,
	        templateId: id,
	        triggerType: triggerType
	      }, afterSuccessStart);
	    }
	  }, {
	    key: "resolveDocumentConfigs",
	    value: function resolveDocumentConfigs() {
	      var _this4 = this;
	      var documentTypeKeys = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : [];
	      var documentConfigs = [];
	      if (main_core.Type.isArrayFilled(documentTypeKeys)) {
	        documentTypeKeys.forEach(function (documentTypeKey) {
	          var documentConfig = babelHelpers.classPrivateFieldGet(_this4, _documents).get(documentTypeKey);
	          if (documentConfig) {
	            documentConfigs.push(documentConfig);
	          }
	        });
	        return documentConfigs;
	      }
	      if (babelHelpers.classPrivateFieldGet(this, _documents).size > 0) {
	        return Array.from(babelHelpers.classPrivateFieldGet(this, _documents).values());
	      }
	      if (babelHelpers.classPrivateFieldGet(this, _signedDocumentType) && babelHelpers.classPrivateFieldGet(this, _signedDocumentId)) {
	        documentConfigs.push({
	          documentTypeKey: '',
	          editorUrl: babelHelpers.classPrivateFieldGet(this, _bizprocEditorUrl),
	          canEdit: babelHelpers.classPrivateFieldGet(this, _canEdit),
	          signedDocumentType: babelHelpers.classPrivateFieldGet(this, _signedDocumentType),
	          signedDocumentId: babelHelpers.classPrivateFieldGet(this, _signedDocumentId)
	        });
	      }
	      return documentConfigs;
	    }
	  }, {
	    key: "resolveSingleDocumentConfig",
	    value: function resolveSingleDocumentConfig() {
	      var documentTypeKeys = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : [];
	      var preferredDocumentTypeKey = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;
	      if (main_core.Type.isStringFilled(preferredDocumentTypeKey)) {
	        var preferredDocumentConfig = babelHelpers.classPrivateFieldGet(this, _documents).get(preferredDocumentTypeKey);
	        if (preferredDocumentConfig) {
	          return preferredDocumentConfig;
	        }
	      }
	      var documentConfigs = this.resolveDocumentConfigs(documentTypeKeys);
	      return documentConfigs.length === 1 ? documentConfigs[0] : null;
	    }
	  }, {
	    key: "resolveEditDocumentConfig",
	    value: function resolveEditDocumentConfig() {
	      var documentTypeKeys = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : [];
	      var preferredDocumentTypeKey = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;
	      if (main_core.Type.isStringFilled(preferredDocumentTypeKey)) {
	        var preferredDocumentConfig = babelHelpers.classPrivateFieldGet(this, _documents).get(preferredDocumentTypeKey);
	        if (preferredDocumentConfig) {
	          return preferredDocumentConfig;
	        }
	      }
	      var documentConfigs = this.resolveDocumentConfigs(documentTypeKeys);
	      if (documentConfigs.length === 0) {
	        return null;
	      }
	      if (documentConfigs.length === 1) {
	        return documentConfigs[0];
	      }
	      var commonEditorUrl = this.getCommonEditorUrl(documentConfigs);
	      if (!main_core.Type.isStringFilled(commonEditorUrl)) {
	        return null;
	      }
	      return _objectSpread(_objectSpread({}, documentConfigs[0]), {}, {
	        editorUrl: commonEditorUrl,
	        canEdit: documentConfigs.some(function (documentConfig) {
	          return documentConfig.canEdit === true;
	        })
	      });
	    }
	  }, {
	    key: "getCommonEditorUrl",
	    value: function getCommonEditorUrl(documentConfigs) {
	      var editorUrls = documentConfigs.map(function (documentConfig) {
	        return documentConfig.editorUrl;
	      }).filter(function (editorUrl) {
	        return main_core.Type.isStringFilled(editorUrl);
	      });
	      if (editorUrls.length !== documentConfigs.length) {
	        return '';
	      }
	      return new Set(editorUrls).size === 1 ? editorUrls[0] : '';
	    }
	  }, {
	    key: "openBizprocEditor",
	    value: function openBizprocEditor(templateId, templateType, editorUrl) {
	      var resolvedEditorUrl = main_core.Type.isStringFilled(editorUrl) ? editorUrl : babelHelpers.classPrivateFieldGet(this, _bizprocEditorUrl);
	      if (templateType === WorkflowStartList.NEW_TEMPLATE_TYPE) {
	        top.window.location.href = babelHelpers.classPrivateFieldGet(this, _bizprocNewEditorUrl).replace('#ID#', templateId);
	      } else {
	        top.window.location.href = resolvedEditorUrl.replace('#ID#', templateId);
	      }
	    }
	  }], [{
	    key: "changePin",
	    value: function changePin(templateId, gridId, event) {
	      var eventData = event.getData();
	      var button = eventData.button;
	      if (main_core.Dom.hasClass(button, BX.Grid.CellActionState.ACTIVE)) {
	        BX.Bizproc.Component.WorkflowStartList.action('unpin', templateId, gridId);
	        main_core.Dom.removeClass(button, BX.Grid.CellActionState.ACTIVE);
	      } else {
	        BX.Bizproc.Component.WorkflowStartList.action('pin', templateId, gridId);
	        main_core.Dom.addClass(button, BX.Grid.CellActionState.ACTIVE);
	      }
	      var grid = BX.Main.gridManager.getInstanceById(gridId);
	      if (grid) {
	        BX.Bizproc.Component.WorkflowStartList.colorPinnedRows(grid);
	      }
	    }
	  }, {
	    key: "action",
	    value: function action(_action, templateId, gridId) {
	      var component = 'bitrix:bizproc.workflow.start.list';
	      BX.ajax.runComponentAction(component, _action, {
	        mode: 'class',
	        data: {
	          templateId: templateId
	        }
	      }).then(function (response) {
	        var instance = BX.Bizproc.Component.WorkflowStartList.Instance;
	        if (instance) {
	          instance.reloadGrid();
	          return;
	        }
	        var grid = BX.Main.gridManager.getInstanceById(gridId);
	        if (grid) {
	          grid.reload();
	        }
	      });
	    }
	  }, {
	    key: "colorPinnedRows",
	    value: function colorPinnedRows(grid) {
	      grid.getRows().getRows().forEach(function (row) {
	        var node = row.getNode();
	        if (main_core.Type.isElementNode(node.querySelector('.main-grid-cell-content-action-pin.main-grid-cell-content-action-active'))) {
	          main_core.Dom.addClass(node, 'bizproc-workflow-start-list-item-pinned');
	        } else {
	          main_core.Dom.removeClass(node, 'bizproc-workflow-start-list-item-pinned');
	        }
	      });
	    }
	  }]);
	  return WorkflowStartList;
	}();
	function _onAfterGridUpdated2() {
	  var _this5 = this;
	  if (this.getGrid()) {
	    BX.UI.Hint.init(this.getGrid().getContainer());
	    BX.Bizproc.Component.WorkflowStartList.colorPinnedRows(this.getGrid());
	  }
	  babelHelpers.classPrivateFieldGet(this, _counters).forEach(function (value, key) {
	    var counter = document.querySelector("[data-role=\"template-".concat(key, "-counter\"]"));
	    if (main_core.Type.isElementNode(counter)) {
	      main_core.Dom.clean(counter);
	      main_core.Dom.append(_classPrivateMethodGet(_this5, _renderStartedByMeNow, _renderStartedByMeNow2).call(_this5, key), counter);
	    }
	  });
	}
	function _renderStartedByMeNow2(templateId) {
	  var message = main_core.Text.encode(main_core.Loc.getMessage('BIZPROC_CMP_TMP_WORKKFLOW_START_LIST_START_COUNTER', {
	    '#COUNTER#': babelHelpers.classPrivateFieldGet(this, _counters).get(templateId)
	  }));
	  message = message.replace('[bold]', '<span class="bizproc-workflow-start-list-column-start-counter">');
	  message = message.replace('[/bold]', '</span>');
	  return main_core.Tag.render(_templateObject || (_templateObject = babelHelpers.taggedTemplateLiteral(["<div class=\"ui-typography-text-xs\">", "</div>"])), message);
	}
	babelHelpers.defineProperty(WorkflowStartList, "NEW_TEMPLATE_TYPE", 'nodes');
	namespace.WorkflowStartList = WorkflowStartList;

}((this.window = this.window || {}),BX,BX.Event,BX.UI,BX.Bizproc.Workflow));
//# sourceMappingURL=script.js.map
