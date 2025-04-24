/* eslint-disable */
(function (exports,main_core,main_core_events,main_popup,ui_buttons,biconnector_datasetImport) {
	'use strict';

	var _templateObject, _templateObject2, _templateObject3, _templateObject4, _templateObject5, _templateObject6, _templateObject7, _templateObject8, _templateObject9, _templateObject10, _templateObject11, _templateObject12;
	function _classPrivateMethodInitSpec(obj, privateSet) { _checkPrivateRedeclaration(obj, privateSet); privateSet.add(obj); }
	function _classPrivateFieldInitSpec(obj, privateMap, value) { _checkPrivateRedeclaration(obj, privateMap); privateMap.set(obj, value); }
	function _checkPrivateRedeclaration(obj, privateCollection) { if (privateCollection.has(obj)) { throw new TypeError("Cannot initialize the same private elements twice on an object"); } }
	function _classPrivateMethodGet(receiver, privateSet, fn) { if (!privateSet.has(receiver)) { throw new TypeError("attempted to get private field on non-instance"); } return fn; }
	var _node = /*#__PURE__*/new WeakMap();
	var _props = /*#__PURE__*/new WeakMap();
	var _checkConnectButton = /*#__PURE__*/new WeakMap();
	var _connectionStatusNode = /*#__PURE__*/new WeakMap();
	var _initForm = /*#__PURE__*/new WeakSet();
	var _initHint = /*#__PURE__*/new WeakSet();
	var _initFields = /*#__PURE__*/new WeakSet();
	var _onChangeType = /*#__PURE__*/new WeakSet();
	var _initCheckConnectButton = /*#__PURE__*/new WeakSet();
	var _initConnectionStatusBlock = /*#__PURE__*/new WeakSet();
	var _clearConnectionStatus = /*#__PURE__*/new WeakSet();
	var _updateConnectionStatus = /*#__PURE__*/new WeakSet();
	var _getConnectionValues = /*#__PURE__*/new WeakSet();
	var _onCheckConnectClick = /*#__PURE__*/new WeakSet();
	var _showSaveSuccessPopup = /*#__PURE__*/new WeakSet();
	var _closeSlider = /*#__PURE__*/new WeakSet();
	var ExternalConnectionForm = /*#__PURE__*/function () {
	  function ExternalConnectionForm(props) {
	    babelHelpers.classCallCheck(this, ExternalConnectionForm);
	    _classPrivateMethodInitSpec(this, _closeSlider);
	    _classPrivateMethodInitSpec(this, _showSaveSuccessPopup);
	    _classPrivateMethodInitSpec(this, _onCheckConnectClick);
	    _classPrivateMethodInitSpec(this, _getConnectionValues);
	    _classPrivateMethodInitSpec(this, _updateConnectionStatus);
	    _classPrivateMethodInitSpec(this, _clearConnectionStatus);
	    _classPrivateMethodInitSpec(this, _initConnectionStatusBlock);
	    _classPrivateMethodInitSpec(this, _initCheckConnectButton);
	    _classPrivateMethodInitSpec(this, _onChangeType);
	    _classPrivateMethodInitSpec(this, _initFields);
	    _classPrivateMethodInitSpec(this, _initHint);
	    _classPrivateMethodInitSpec(this, _initForm);
	    _classPrivateFieldInitSpec(this, _node, {
	      writable: true,
	      value: void 0
	    });
	    _classPrivateFieldInitSpec(this, _props, {
	      writable: true,
	      value: void 0
	    });
	    _classPrivateFieldInitSpec(this, _checkConnectButton, {
	      writable: true,
	      value: void 0
	    });
	    _classPrivateFieldInitSpec(this, _connectionStatusNode, {
	      writable: true,
	      value: void 0
	    });
	    babelHelpers.classPrivateFieldSet(this, _props, props);
	    _classPrivateMethodGet(this, _initForm, _initForm2).call(this);
	  }
	  babelHelpers.createClass(ExternalConnectionForm, [{
	    key: "onClickSave",
	    value: function onClickSave() {
	      var _this = this;
	      var saveButton = ui_buttons.ButtonManager.createFromNode(document.querySelector('#connection-button-save'));
	      saveButton.setWaiting(true);
	      var connectionValues = _classPrivateMethodGet(this, _getConnectionValues, _getConnectionValues2).call(this);
	      if (babelHelpers.classPrivateFieldGet(this, _props).sourceFields.id) {
	        connectionValues.id = babelHelpers.classPrivateFieldGet(this, _props).sourceFields.id;
	      }
	      _classPrivateMethodGet(this, _onCheckConnectClick, _onCheckConnectClick2).call(this).then(function () {
	        return main_core.ajax.runAction('biconnector.externalsource.source.save', {
	          data: {
	            data: connectionValues
	          }
	        });
	      }).then(function (response) {
	        BX.SidePanel.Instance.postMessage(window, 'BIConnector:ExternalConnection:onConnectionSave', {
	          connection: response.data.connection
	        });
	        if (babelHelpers.classPrivateFieldGet(_this, _props).closeAfterCreate) {
	          _classPrivateMethodGet(_this, _closeSlider, _closeSlider2).call(_this);
	        } else {
	          _classPrivateMethodGet(_this, _showSaveSuccessPopup, _showSaveSuccessPopup2).call(_this, response.data.connection);
	          saveButton.setWaiting(false);
	        }
	      })["catch"](function (response) {
	        var _response$errors;
	        saveButton.setWaiting(false);
	        if (((_response$errors = response.errors) === null || _response$errors === void 0 ? void 0 : _response$errors.length) > 0) {
	          BX.UI.Notification.Center.notify({
	            content: response.errors[0].message
	          });
	        } else {
	          console.error(response);
	        }
	        BX.SidePanel.Instance.postMessage(window, 'BIConnector:ExternalConnection:onConnectionCreationError');
	      });
	    }
	  }]);
	  return ExternalConnectionForm;
	}();
	function _initForm2() {
	  babelHelpers.classPrivateFieldSet(this, _node, document.querySelector('#connection-form'));
	  _classPrivateMethodGet(this, _initHint, _initHint2).call(this);
	  var fieldsNode = main_core.Tag.render(_templateObject || (_templateObject = babelHelpers.taggedTemplateLiteral(["\n\t\t\t<div class=\"fields-wrapper\"></div>\n\t\t"])));
	  main_core.Dom.append(fieldsNode, babelHelpers.classPrivateFieldGet(this, _node));
	  _classPrivateMethodGet(this, _initFields, _initFields2).call(this);
	  var buttonBlock = main_core.Tag.render(_templateObject2 || (_templateObject2 = babelHelpers.taggedTemplateLiteral(["\n\t\t\t<div class=\"db-connection-button-block\">\n\t\t\t\t<div class=\"db-connection-button\"></div>\n\t\t\t\t<div class=\"db-connection-status\"></div>\n\t\t\t</div>\n\t\t"])));
	  main_core.Dom.append(buttonBlock, babelHelpers.classPrivateFieldGet(this, _node));
	  _classPrivateMethodGet(this, _initCheckConnectButton, _initCheckConnectButton2).call(this);
	  _classPrivateMethodGet(this, _initConnectionStatusBlock, _initConnectionStatusBlock2).call(this);
	}
	function _initHint2() {
	  var hint = main_core.Tag.render(_templateObject3 || (_templateObject3 = babelHelpers.taggedTemplateLiteral(["\n\t\t\t<div class=\"db-connection-hint\">\n\t\t\t\t", "\n\t\t\t</div>\n\t\t"])), main_core.Loc.getMessage('EXTERNAL_CONNECTION_HINT', {
	    '[link]': '<a class="ui-link" onclick="top.BX.Helper.show(`redirect=detail&code=23508958`)">',
	    '[/link]': '</a>'
	  }));
	  main_core.Dom.append(hint, babelHelpers.classPrivateFieldGet(this, _node));
	}
	function _initFields2() {
	  var _babelHelpers$classPr,
	    _sourceFields$title,
	    _sourceFields$type,
	    _this2 = this;
	  var fieldsNode = babelHelpers.classPrivateFieldGet(this, _node).querySelector('.fields-wrapper');
	  var sourceFields = (_babelHelpers$classPr = babelHelpers.classPrivateFieldGet(this, _props).sourceFields) !== null && _babelHelpers$classPr !== void 0 ? _babelHelpers$classPr : {};
	  var fields = main_core.Tag.render(_templateObject4 || (_templateObject4 = babelHelpers.taggedTemplateLiteral(["\n\t\t\t<div class=\"form-fields\">\n\t\t\t\t<div class=\"ui-form-row\">\n\t\t\t\t\t<div class=\"ui-form-label\">\n\t\t\t\t\t\t<div class=\"ui-ctl-label-text\">", "</div>\n\t\t\t\t\t</div>\n\t\t\t\t\t<div class=\"ui-ctl ui-ctl-after-icon ui-ctl-dropdown ui-ctl-w100\">\n\t\t\t\t\t\t<div class=\"ui-ctl-after ui-ctl-icon-angle\"></div>\n\t\t\t\t\t\t<select class=\"ui-ctl-element\" data-code=\"type\"></select>\n\t\t\t\t\t</div>\n\t\t\t\t</div>\n\t\t\t\t<div class=\"ui-form-row\">\n\t\t\t\t\t<div class=\"ui-form-label\">\n\t\t\t\t\t\t<div class=\"ui-ctl-label-text\">", "</div>\n\t\t\t\t\t</div>\n\t\t\t\t\t<div class=\"ui-form-content\">\n\t\t\t\t\t\t<div class=\"ui-ctl ui-ctl-textbox ui-ctl-w100\">\n\t\t\t\t\t\t\t<input \n\t\t\t\t\t\t\t\ttype=\"text\" \n\t\t\t\t\t\t\t\tclass=\"ui-ctl-element\" \n\t\t\t\t\t\t\t\tplaceholder=\"", "\" \n\t\t\t\t\t\t\t\tdata-code=\"title\"\n\t\t\t\t\t\t\t\tvalue=\"", "\"\n\t\t\t\t\t\t\t>\n\t\t\t\t\t\t</div>\n\t\t\t\t\t</div>\n\t\t\t\t</div>\n\t\t\t</div>\n\t\t"])), main_core.Loc.getMessage('EXTERNAL_CONNECTION_FIELD_TYPE'), main_core.Loc.getMessage('EXTERNAL_CONNECTION_FIELD_NAME'), main_core.Loc.getMessage('EXTERNAL_CONNECTION_FIELD_NAME_PLACEHOLDER'), (_sourceFields$title = sourceFields.title) !== null && _sourceFields$title !== void 0 ? _sourceFields$title : '');
	  main_core.Dom.append(fields, fieldsNode);
	  var typeSelector = fieldsNode.querySelector('[data-code="type"]');
	  babelHelpers.classPrivateFieldGet(this, _props).supportedDatabases.forEach(function (database) {
	    main_core.Dom.append(main_core.Tag.render(_templateObject5 || (_templateObject5 = babelHelpers.taggedTemplateLiteral(["\n\t\t\t\t\t<option \n\t\t\t\t\t\tvalue=\"", "\" \n\t\t\t\t\t\t", "\n\t\t\t\t\t>\n\t\t\t\t\t\t", "\n\t\t\t\t\t</option>\n\t\t\t\t"])), database.code, sourceFields.type === database.code ? 'selected' : '', database.name), typeSelector);
	  });
	  main_core.Event.bind(typeSelector, 'input', _classPrivateMethodGet(this, _onChangeType, _onChangeType2).bind(this));
	  if (sourceFields.id) {
	    var fieldId = main_core.Tag.render(_templateObject6 || (_templateObject6 = babelHelpers.taggedTemplateLiteral(["\n\t\t\t\t<input hidden value=\"", "\" data-code=\"id\">\n\t\t\t"])), sourceFields.id);
	    main_core.Dom.append(fieldId, fields);
	    main_core.Dom.attr(typeSelector, 'disabled', true);
	  }
	  var fieldConfig = babelHelpers.classPrivateFieldGet(this, _props).fieldsConfig;
	  var connectionType = (_sourceFields$type = sourceFields.type) !== null && _sourceFields$type !== void 0 ? _sourceFields$type : babelHelpers.classPrivateFieldGet(this, _props).supportedDatabases[0].code;
	  fieldConfig[connectionType].forEach(function (field) {
	    var _sourceFields$field$c;
	    var fieldType = field.type;
	    if (field.code === 'password') {
	      fieldType = 'password';
	    }
	    var fieldNode = main_core.Tag.render(_templateObject7 || (_templateObject7 = babelHelpers.taggedTemplateLiteral(["\n\t\t\t\t<div class=\"ui-form-row\">\n\t\t\t\t\t<div class=\"ui-form-label\">\n\t\t\t\t\t\t<div class=\"ui-ctl-label-text\">", "</div>\n\t\t\t\t\t</div>\n\t\t\t\t\t<div class=\"ui-form-content\">\n\t\t\t\t\t\t<div class=\"ui-ctl ui-ctl-textbox ui-ctl-w100\">\n\t\t\t\t\t\t\t<input \n\t\t\t\t\t\t\t\ttype=\"", "\" \n\t\t\t\t\t\t\t\tclass=\"ui-ctl-element\" \n\t\t\t\t\t\t\t\tdata-code=\"", "\"\n\t\t\t\t\t\t\t\tplaceholder=\"", "\" \n\t\t\t\t\t\t\t\tvalue=\"", "\"\n\t\t\t\t\t\t\t>\n\t\t\t\t\t\t</div>\n\t\t\t\t\t</div>\n\t\t\t\t</div>\n\t\t\t"])), field.name, fieldType, field.code, field.placeholder, (_sourceFields$field$c = sourceFields[field.code]) !== null && _sourceFields$field$c !== void 0 ? _sourceFields$field$c : '');
	    main_core.Dom.append(fieldNode, fields);
	    main_core.Event.bind(fieldNode, 'input', function () {
	      return _classPrivateMethodGet(_this2, _clearConnectionStatus, _clearConnectionStatus2).call(_this2);
	    });
	  });
	}
	function _onChangeType2(event) {
	  babelHelpers.classPrivateFieldGet(this, _props).sourceFields.type = event.target.value;
	  main_core.Dom.clean(babelHelpers.classPrivateFieldGet(this, _node).querySelector('.fields-wrapper'));
	  _classPrivateMethodGet(this, _initFields, _initFields2).call(this);
	  _classPrivateMethodGet(this, _clearConnectionStatus, _clearConnectionStatus2).call(this);
	}
	function _initCheckConnectButton2() {
	  var _this3 = this;
	  var connectButton = new ui_buttons.Button({
	    text: main_core.Loc.getMessage('EXTERNAL_CONNECTION_CHECK_BUTTON'),
	    color: ui_buttons.ButtonColor.PRIMARY,
	    onclick: function onclick(button, event) {
	      event.preventDefault();
	      _classPrivateMethodGet(_this3, _onCheckConnectClick, _onCheckConnectClick2).call(_this3)["catch"](function () {});
	    },
	    noCaps: true
	  });
	  connectButton.renderTo(babelHelpers.classPrivateFieldGet(this, _node).querySelector('.db-connection-button'));
	  babelHelpers.classPrivateFieldSet(this, _checkConnectButton, connectButton);
	}
	function _initConnectionStatusBlock2() {
	  babelHelpers.classPrivateFieldSet(this, _connectionStatusNode, babelHelpers.classPrivateFieldGet(this, _node).querySelector('.db-connection-status'));
	}
	function _clearConnectionStatus2() {
	  main_core.Dom.clean(babelHelpers.classPrivateFieldGet(this, _connectionStatusNode));
	}
	function _updateConnectionStatus2(succedeed, errorMessage) {
	  main_core.Dom.clean(babelHelpers.classPrivateFieldGet(this, _connectionStatusNode));
	  var status = null;
	  if (succedeed) {
	    status = main_core.Tag.render(_templateObject8 || (_templateObject8 = babelHelpers.taggedTemplateLiteral(["\n\t\t\t\t<div class=\"db-connection-success\">\n\t\t\t\t\t<div class=\"ui-icon-set --check\" style=\"--ui-icon-set__icon-size: 18px; --ui-icon-set__icon-color: var(--ui-color-palette-green-50);\"></div>\n\t\t\t\t\t", "\n\t\t\t\t</div>\n\t\t\t"])), main_core.Loc.getMessage('EXTERNAL_CONNECTION_CHECK_SUCCESS'));
	  } else {
	    status = main_core.Tag.render(_templateObject9 || (_templateObject9 = babelHelpers.taggedTemplateLiteral(["\n\t\t\t\t<div class=\"db-connection-error\">\n\t\t\t\t\t<div class=\"ui-icon-set --warning\" style=\"--ui-icon-set__icon-size: 18px; --ui-icon-set__icon-color: var(--ui-color-palette-red-60);\"></div>\n\t\t\t\t\t", "\n\t\t\t\t</div>\n\t\t\t"])), errorMessage.replaceAll(/\s+/g, ' '));
	  }
	  main_core.Dom.append(status, babelHelpers.classPrivateFieldGet(this, _connectionStatusNode));
	}
	function _getConnectionValues2() {
	  var result = {};
	  babelHelpers.classPrivateFieldGet(this, _node).querySelectorAll('[data-code]').forEach(function (field) {
	    result[field.getAttribute('data-code')] = field.value;
	  });
	  return result;
	}
	function _onCheckConnectClick2() {
	  var _this4 = this;
	  babelHelpers.classPrivateFieldGet(this, _checkConnectButton).setState(ui_buttons.ButtonState.WAITING);
	  return new Promise(function (resolve, reject) {
	    main_core.ajax.runAction('biconnector.externalsource.source.checkConnectionByData', {
	      data: {
	        data: _classPrivateMethodGet(_this4, _getConnectionValues, _getConnectionValues2).call(_this4)
	      }
	    }).then(function (response) {
	      _classPrivateMethodGet(_this4, _updateConnectionStatus, _updateConnectionStatus2).call(_this4, true);
	      babelHelpers.classPrivateFieldGet(_this4, _checkConnectButton).setState(null);
	      resolve(response);
	    })["catch"](function (response) {
	      _classPrivateMethodGet(_this4, _updateConnectionStatus, _updateConnectionStatus2).call(_this4, false, response.errors[0].message);
	      babelHelpers.classPrivateFieldGet(_this4, _checkConnectButton).setState(null);
	      reject();
	    });
	  });
	}
	function _showSaveSuccessPopup2(connection) {
	  var _this5 = this,
	    _babelHelpers$classPr2;
	  var popup = null;

	  // show for new or active sources only
	  var showCreateDatasetButton = !Object.hasOwn(babelHelpers.classPrivateFieldGet(this, _props).sourceFields, 'id') || babelHelpers.classPrivateFieldGet(this, _props).sourceFields.active;
	  var createDatasetButton = showCreateDatasetButton ? main_core.Tag.render(_templateObject10 || (_templateObject10 = babelHelpers.taggedTemplateLiteral(["\n\t\t\t<a class=\"ui-btn ui-btn-md ui-btn-primary\">\n\t\t\t\t", "\n\t\t\t</a>\n\t\t"])), main_core.Loc.getMessage('EXTERNAL_CONNECTION_CREATE_DATASET')) : false;
	  var closeButton = main_core.Tag.render(_templateObject11 || (_templateObject11 = babelHelpers.taggedTemplateLiteral(["\n\t\t\t<a class=\"ui-btn ui-btn-md ui-btn-light-border\">\n\t\t\t\t", "\n\t\t\t</a>\n\t\t"])), main_core.Loc.getMessage('EXTERNAL_CONNECTION_CLOSE'));
	  var onPopupClose = function onPopupClose() {
	    _classPrivateMethodGet(_this5, _closeSlider, _closeSlider2).call(_this5);
	  };
	  var sourceType = (_babelHelpers$classPr2 = babelHelpers.classPrivateFieldGet(this, _props).sourceFields.type) !== null && _babelHelpers$classPr2 !== void 0 ? _babelHelpers$classPr2 : babelHelpers.classPrivateFieldGet(this, _props).supportedDatabases[0].code;
	  main_core.Event.bind(createDatasetButton, 'click', function () {
	    onPopupClose();
	    biconnector_datasetImport.Slider.open(sourceType, 0, {
	      connectionId: connection.id,
	      connectionType: connection.type
	    });
	  });
	  main_core.Event.bind(closeButton, 'click', function () {
	    onPopupClose();
	  });
	  var isEditMode = Boolean(babelHelpers.classPrivateFieldGet(this, _props).sourceFields.id);
	  var popupMessageCode = isEditMode ? 'EXTERNAL_CONNECTION_EDIT_SUCCESS' : 'EXTERNAL_CONNECTION_SAVE_SUCCESS';
	  var popupText = main_core.Loc.getMessage(popupMessageCode, {
	    '#CONNECTION_TITLE#': main_core.Text.encode(_classPrivateMethodGet(this, _getConnectionValues, _getConnectionValues2).call(this).title)
	  });
	  var popupContent = main_core.Tag.render(_templateObject12 || (_templateObject12 = babelHelpers.taggedTemplateLiteral(["\n\t\t\t<div class=\"biconnector-popup--full-height\">\n\t\t\t\t<div class=\"biconnector-save-progress-popup\">\n\t\t\t\t\t<div class=\"biconnector-save-progress-popup__content\">\n\t\t\t\t\t\t<div class=\"biconnector-save-progress-popup__success-logo\"></div>\n\t\t\t\t\t\t<div class=\"biconnector-save-progress-popup__texts\">\n\t\t\t\t\t\t\t<h3 class=\"biconnector-save-progress-popup__header\">", "</h3>\n\t\t\t\t\t\t</div>\n\t\t\t\t\t\t<div class=\"biconnector-save-progress-popup__buttons\">\n\t\t\t\t\t\t\t", "\n\t\t\t\t\t\t\t", "\n\t\t\t\t\t\t</div>\n\t\t\t\t\t</div>\n\t\t\t\t</div>\n\t\t\t</div>\n\t\t"])), popupText, createDatasetButton, closeButton);
	  popup = new main_popup.Popup({
	    content: popupContent,
	    autoHide: true,
	    events: {
	      onPopupClose: onPopupClose,
	      onPopupDestroy: onPopupClose
	    },
	    fixed: true,
	    width: 500,
	    minHeight: 299,
	    closeIcon: true,
	    noAllPaddings: true,
	    overlay: true
	  });
	  popup.show();
	}
	function _closeSlider2() {
	  BX.SidePanel.Instance.postMessage(window, 'BIConnector:ExternalConnection:onConnectionSliderClose');
	  BX.SidePanel.Instance.getTopSlider().close();
	}
	main_core.Reflection.namespace('BX.BIConnector').ExternalConnectionForm = ExternalConnectionForm;

}((this.window = this.window || {}),BX,BX.Event,BX.Main,BX.UI,BX.BIConnector.DatasetImport));
//# sourceMappingURL=script.js.map
