/* eslint-disable */
(function (exports) {
	'use strict';

	var _BX = BX,
	  Dom = _BX.Dom,
	  BXEvent = _BX.Event,
	  UI = _BX.UI,
	  Type = _BX.Type;
	var AiNodeBpJsonEditor = /*#__PURE__*/function () {
	  babelHelpers.createClass(AiNodeBpJsonEditor, null, [{
	    key: "init",
	    value: function init(messages) {
	      return new AiNodeBpJsonEditor(messages);
	    }
	  }]);
	  function AiNodeBpJsonEditor(messages) {
	    babelHelpers.classCallCheck(this, AiNodeBpJsonEditor);
	    this.lastJsonValue = '';
	    this.messages = messages && Object.keys(messages).length > 0 ? messages : this.getMessages();
	    this.elements = this.queryElements();
	    this.bindEvents();
	  }
	  babelHelpers.createClass(AiNodeBpJsonEditor, [{
	    key: "getMessages",
	    value: function getMessages() {
	      var box = document.getElementById(this.constructor.IDS.messagesBox);
	      return {
	        valid: (box === null || box === void 0 ? void 0 : box.dataset.statusValid) || '',
	        invalid: (box === null || box === void 0 ? void 0 : box.dataset.statusInvalid) || '',
	        confirmOverwrite: (box === null || box === void 0 ? void 0 : box.dataset.confirmOverwrite) || ''
	      };
	    }
	  }, {
	    key: "queryElements",
	    value: function queryElements() {
	      var IDS = this.constructor.IDS;
	      var els = {
	        returnTypeSelect: document.querySelector('select[name="returnType"]'),
	        tabs: babelHelpers.toConsumableArray(document.querySelectorAll("#".concat(IDS.returnTypeTabs, " .node-settings-tab"))),
	        jsonRow: document.getElementById('row_jsonSchema'),
	        jsonTextarea: document.querySelector('textarea[name="jsonSchema"]'),
	        templateBtn: document.getElementById(IDS.jsonSchemaTemplateBtn),
	        statusBox: document.getElementById(IDS.jsonSchemaStatus)
	      };
	      if (els.jsonTextarea) {
	        this.lastJsonValue = els.jsonTextarea.value;
	      }
	      return els;
	    }
	  }, {
	    key: "setStatus",
	    value: function setStatus(ok) {
	      var statusBox = this.elements.statusBox;
	      if (!statusBox) {
	        return;
	      }
	      var _this$messages = this.messages,
	        valid = _this$messages.valid,
	        invalid = _this$messages.invalid;
	      Dom.style(statusBox, 'display', 'flex');
	      Dom[ok ? 'addClass' : 'removeClass'](statusBox, '--ok');
	      Dom[ok ? 'removeClass' : 'addClass'](statusBox, '--err');
	      var textEl = statusBox.querySelector('.status-text');
	      if (textEl) {
	        textEl.textContent = ok ? valid : invalid;
	      }
	    }
	  }, {
	    key: "clearStatus",
	    value: function clearStatus() {
	      var statusBox = this.elements.statusBox;
	      if (!statusBox) {
	        return;
	      }
	      Dom.style(statusBox, 'display', 'none');
	      Dom.removeClass(statusBox, '--ok');
	      Dom.removeClass(statusBox, '--err');
	    }
	  }, {
	    key: "autoResize",
	    value: function autoResize() {
	      var jsonTextarea = this.elements.jsonTextarea;
	      if (!jsonTextarea) {
	        return;
	      }
	      Dom.style(jsonTextarea, 'height', 'auto');
	      Dom.style(jsonTextarea, 'height', "".concat(Math.min(jsonTextarea.scrollHeight, this.constructor.TEXTAREA_MAX_HEIGHT), "px"));
	    }
	  }, {
	    key: "buildTemplate",
	    value: function buildTemplate() {
	      var schema = {
	        type: 'object',
	        properties: {
	          category: {
	            type: 'string',
	            description: 'Category description'
	          },
	          priority: {
	            type: 'integer',
	            description: 'Priority description'
	          }
	        },
	        required: ['category']
	      };
	      return JSON.stringify(schema, null, 2);
	    }
	  }, {
	    key: "setReturnType",
	    value: function setReturnType(value) {
	      var returnTypeSelect = this.elements.returnTypeSelect;
	      if (!returnTypeSelect || returnTypeSelect.value === value) {
	        return;
	      }
	      returnTypeSelect.value = value;
	      returnTypeSelect.dispatchEvent(new Event('change', {
	        bubbles: true
	      }));
	    }
	  }, {
	    key: "applyVisibility",
	    value: function applyVisibility() {
	      var _this$elements = this.elements,
	        returnTypeSelect = _this$elements.returnTypeSelect,
	        tabs = _this$elements.tabs,
	        jsonRow = _this$elements.jsonRow,
	        jsonTextarea = _this$elements.jsonTextarea;
	      if (!returnTypeSelect) {
	        return;
	      }
	      var val = returnTypeSelect.value;
	      tabs.forEach(function (btn) {
	        Dom[btn.dataset.value === val ? 'addClass' : 'removeClass'](btn, '--active');
	      });
	      if (!jsonRow) {
	        return;
	      }
	      if (val === 'json') {
	        Dom.style(jsonRow, 'display', '');
	        if (jsonTextarea && jsonTextarea.value.trim() === '' && this.lastJsonValue.trim() !== '') {
	          jsonTextarea.value = this.lastJsonValue;
	          this.validate();
	          this.autoResize();
	        }
	        return;
	      }
	      if (jsonTextarea && jsonTextarea.value.trim() !== '') {
	        this.lastJsonValue = jsonTextarea.value;
	        jsonTextarea.value = '';
	      }
	      Dom.style(jsonRow, 'display', 'none');
	    }
	  }, {
	    key: "validate",
	    value: function validate() {
	      var jsonTextarea = this.elements.jsonTextarea;
	      if (!jsonTextarea) {
	        return;
	      }
	      var raw = jsonTextarea.value.trim();
	      if (raw === '') {
	        this.clearStatus();
	        return;
	      }
	      var parsed = null;
	      try {
	        parsed = JSON.parse(raw);
	      } catch (_unused) {
	        this.setStatus(false);
	        return;
	      }
	      this.setStatus(Type.isObject(parsed));
	    }
	  }, {
	    key: "applyTemplate",
	    value: function applyTemplate() {
	      var jsonTextarea = this.elements.jsonTextarea;
	      if (!jsonTextarea) {
	        return;
	      }
	      var template = this.buildTemplate();
	      jsonTextarea.value = template;
	      this.lastJsonValue = template;
	      this.validate();
	      this.autoResize();
	    }
	  }, {
	    key: "promptAndApplyTemplate",
	    value: function promptAndApplyTemplate() {
	      var _this = this;
	      var jsonTextarea = this.elements.jsonTextarea;
	      if (!jsonTextarea) {
	        return;
	      }
	      if (jsonTextarea.value.trim() === '') {
	        this.applyTemplate();
	        return;
	      }
	      var confirmOverwrite = this.messages.confirmOverwrite;
	      if (UI.Dialogs.MessageBox) {
	        UI.Dialogs.MessageBox.confirm(confirmOverwrite, function (mb) {
	          _this.applyTemplate();
	          mb.close();
	        });
	      } else {
	        this.applyTemplate();
	      }
	    }
	  }, {
	    key: "bindEvents",
	    value: function bindEvents() {
	      this.bindTabEvents();
	      this.bindReturnTypeEvents();
	      this.bindJsonTextareaEvents();
	      this.bindTemplateButton();
	    }
	  }, {
	    key: "bindTabEvents",
	    value: function bindTabEvents() {
	      var _this2 = this;
	      var tabs = this.elements.tabs;
	      if (tabs.length === 0) {
	        return;
	      }
	      tabs.forEach(function (btn) {
	        BXEvent.bind(btn, 'click', function () {
	          return _this2.setReturnType(btn.dataset.value || '');
	        });
	      });
	    }
	  }, {
	    key: "bindReturnTypeEvents",
	    value: function bindReturnTypeEvents() {
	      var returnTypeSelect = this.elements.returnTypeSelect;
	      if (!returnTypeSelect) {
	        return;
	      }
	      var visibilityFn = this.applyVisibility.bind(this);
	      BXEvent.bind(returnTypeSelect, 'change', visibilityFn);
	      visibilityFn();
	    }
	  }, {
	    key: "bindJsonTextareaEvents",
	    value: function bindJsonTextareaEvents() {
	      var _this3 = this;
	      var jsonTextarea = this.elements.jsonTextarea;
	      if (!jsonTextarea) {
	        return;
	      }
	      var timer = null;
	      BXEvent.bind(jsonTextarea, 'input', function () {
	        _this3.autoResize();
	        if (timer) {
	          clearTimeout(timer);
	        }
	        timer = setTimeout(function () {
	          return _this3.validate();
	        }, _this3.constructor.VALIDATE_DEBOUNCE);
	      });
	      this.autoResize();
	      this.validate();
	    }
	  }, {
	    key: "bindTemplateButton",
	    value: function bindTemplateButton() {
	      var _this4 = this;
	      var _this$elements2 = this.elements,
	        templateBtn = _this$elements2.templateBtn,
	        jsonTextarea = _this$elements2.jsonTextarea;
	      if (templateBtn && jsonTextarea) {
	        BXEvent.bind(templateBtn, 'click', function () {
	          return _this4.promptAndApplyTemplate();
	        });
	      }
	    }
	  }]);
	  return AiNodeBpJsonEditor;
	}();
	babelHelpers.defineProperty(AiNodeBpJsonEditor, "IDS", Object.freeze({
	  returnTypeTabs: 'ai-node-bp-json-return-type-tabs',
	  jsonSchemaTemplateBtn: 'ai-node-bp-json-schema-template-btn',
	  jsonSchemaStatus: 'ai-node-bp-json-schema-status'
	}));
	babelHelpers.defineProperty(AiNodeBpJsonEditor, "TEXTAREA_MAX_HEIGHT", 500);
	babelHelpers.defineProperty(AiNodeBpJsonEditor, "VALIDATE_DEBOUNCE", 250);
	BX.AiNodeBpJsonEditor = AiNodeBpJsonEditor;

}((this.window = this.window || {})));
//# sourceMappingURL=script.js.map
