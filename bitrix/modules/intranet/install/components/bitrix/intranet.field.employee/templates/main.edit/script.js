/* eslint-disable */
(function (exports,main_core,ui_entitySelector) {
	'use strict';

	function _createForOfIteratorHelper(o, allowArrayLike) { var it = typeof Symbol !== "undefined" && o[Symbol.iterator] || o["@@iterator"]; if (!it) { if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") { if (it) o = it; var i = 0; var F = function F() {}; return { s: F, n: function n() { if (i >= o.length) return { done: true }; return { done: false, value: o[i++] }; }, e: function e(_e) { throw _e; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var normalCompletion = true, didErr = false, err; return { s: function s() { it = it.call(o); }, n: function n() { var step = it.next(); normalCompletion = step.done; return step; }, e: function e(_e2) { didErr = true; err = _e2; }, f: function f() { try { if (!normalCompletion && it["return"] != null) it["return"](); } finally { if (didErr) throw err; } } }; }
	function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }
	function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) arr2[i] = arr[i]; return arr2; }
	var namespace = main_core.Reflection.namespace('BX.Intranet.UserField');
	var EmployeeEditor = /*#__PURE__*/function () {
	  function EmployeeEditor(params) {
	    babelHelpers.classCallCheck(this, EmployeeEditor);
	    this.selectorName = params.selectorName || '';
	    this.isMultiple = params.isMultiple === true;
	    this.fieldNameJs = params.fieldNameJs || '';
	    this.selectedItems = new Set(params.selectedItems || []);
	    this.initTagSelector(params);
	  }
	  babelHelpers.createClass(EmployeeEditor, [{
	    key: "initTagSelector",
	    value: function initTagSelector() {
	      var _this = this;
	      var container = document.getElementById("cont_".concat(this.selectorName));
	      if (!container) {
	        return;
	      }
	      new ui_entitySelector.TagSelector({
	        multiple: this.isMultiple,
	        dialogOptions: {
	          context: "entity_selector_".concat(this.selectorName),
	          width: 450,
	          height: 300,
	          preselectedItems: babelHelpers.toConsumableArray(this.selectedItems),
	          entities: [{
	            id: 'user',
	            options: {
	              emailUsers: false,
	              intranetUsersOnly: true,
	              inviteEmployeeLink: false,
	              inviteGuestLink: false
	            }
	          }, {
	            id: 'structure-node',
	            options: {
	              selectMode: 'usersOnly'
	            }
	          }]
	        },
	        events: {
	          onAfterTagAdd: function onAfterTagAdd(event) {
	            return _this.onAfterTagUpdate(event);
	          },
	          onAfterTagRemove: function onAfterTagRemove(event) {
	            return _this.onAfterTagUpdate(event);
	          }
	        }
	      }).renderTo(container);
	    }
	  }, {
	    key: "onAfterTagUpdate",
	    value: function onAfterTagUpdate(event) {
	      var tags = event.getTarget().tags;
	      var ids = tags.map(function (tag) {
	        return tag.id;
	      });
	      this.setData(ids);
	    }
	  }, {
	    key: "setData",
	    value: function setData(values) {
	      var valueContainer = document.getElementById("value_".concat(this.selectorName));
	      if (!valueContainer) {
	        return;
	      }
	      var html = '';
	      if (values.length > 0) {
	        if (this.isMultiple) {
	          var _iterator = _createForOfIteratorHelper(values),
	            _step;
	          try {
	            for (_iterator.s(); !(_step = _iterator.n()).done;) {
	              var value = _step.value;
	              html += "<input type=\"hidden\" name=\"".concat(this.fieldNameJs, "\" value=\"").concat(BX.util.htmlspecialchars(value), "\">");
	            }
	          } catch (err) {
	            _iterator.e(err);
	          } finally {
	            _iterator.f();
	          }
	        } else {
	          html += "<input type=\"hidden\" name=\"".concat(this.fieldNameJs, "\" value=\"").concat(BX.util.htmlspecialchars(values[0]), "\">");
	        }
	      }
	      if (html.length <= 0) {
	        html = "<input type=\"hidden\" name=\"".concat(this.fieldNameJs, "\" value=\"\">");
	      }
	      valueContainer.innerHTML = html;
	      main_core.defer(function () {
	        main_core.fireEvent(valueContainer.firstChild, 'change');
	      })();
	    }
	  }]);
	  return EmployeeEditor;
	}();
	namespace.EmployeeEditor = EmployeeEditor;

}((this.window = this.window || {}),BX,BX.UI.EntitySelector));
//# sourceMappingURL=script.js.map
