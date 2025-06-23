/* eslint-disable */
this.BX = this.BX || {};
(function (exports,main_core,pull_client) {
	'use strict';

	var _templateObject;
	function _classPrivateMethodInitSpec(obj, privateSet) { _checkPrivateRedeclaration(obj, privateSet); privateSet.add(obj); }
	function _classPrivateFieldInitSpec(obj, privateMap, value) { _checkPrivateRedeclaration(obj, privateMap); privateMap.set(obj, value); }
	function _checkPrivateRedeclaration(obj, privateCollection) { if (privateCollection.has(obj)) { throw new TypeError("Cannot initialize the same private elements twice on an object"); } }
	function _classPrivateMethodGet(receiver, privateSet, fn) { if (!privateSet.has(receiver)) { throw new TypeError("attempted to get private field on non-instance"); } return fn; }
	var State = Object.freeze({
	  Closed: 'CLOSED',
	  Opened: 'OPENED',
	  Paused: 'PAUSED',
	  Expired: 'EXPIRED'
	});
	var CommandType = Object.freeze({
	  Start: 'start',
	  Pause: 'pause',
	  Continue: 'continue',
	  Reopen: 'relaunch',
	  Stop: 'stop'
	});
	var _params = /*#__PURE__*/new WeakMap();
	var _layout = /*#__PURE__*/new WeakMap();
	var _subscribeToPull = /*#__PURE__*/new WeakSet();
	var _handlePullEvent = /*#__PURE__*/new WeakSet();
	var _isValidCommand = /*#__PURE__*/new WeakSet();
	var _updateIcon = /*#__PURE__*/new WeakSet();
	var _getIconClass = /*#__PURE__*/new WeakSet();
	var _getIconStyle = /*#__PURE__*/new WeakSet();
	var WorkTimeStateIcon = /*#__PURE__*/function () {
	  function WorkTimeStateIcon(params) {
	    babelHelpers.classCallCheck(this, WorkTimeStateIcon);
	    _classPrivateMethodInitSpec(this, _getIconStyle);
	    _classPrivateMethodInitSpec(this, _getIconClass);
	    _classPrivateMethodInitSpec(this, _updateIcon);
	    _classPrivateMethodInitSpec(this, _isValidCommand);
	    _classPrivateMethodInitSpec(this, _handlePullEvent);
	    _classPrivateMethodInitSpec(this, _subscribeToPull);
	    _classPrivateFieldInitSpec(this, _params, {
	      writable: true,
	      value: void 0
	    });
	    _classPrivateFieldInitSpec(this, _layout, {
	      writable: true,
	      value: void 0
	    });
	    babelHelpers.classPrivateFieldSet(this, _params, params);
	    babelHelpers.classPrivateFieldSet(this, _layout, {});
	    _classPrivateMethodGet(this, _subscribeToPull, _subscribeToPull2).call(this);
	  }
	  babelHelpers.createClass(WorkTimeStateIcon, [{
	    key: "renderTo",
	    value: function renderTo(container) {
	      if (main_core.Type.isDomNode(container)) {
	        main_core.Dom.append(this.render(), container);
	      }
	    }
	  }, {
	    key: "render",
	    value: function render() {
	      var iconClass = _classPrivateMethodGet(this, _getIconClass, _getIconClass2).call(this);
	      var style = _classPrivateMethodGet(this, _getIconStyle, _getIconStyle2).call(this);
	      var _ref = main_core.Tag.render(_templateObject || (_templateObject = babelHelpers.taggedTemplateLiteral(["\n\t\t\t<div ref=\"node\" class=\"work-time-state\" style=\"", "\">\n\t\t\t\t<div ref=\"icon\" class=\"work-time-state-icon ", "\"></div>\n\t\t\t</div>\n\t\t"])), style, iconClass),
	        node = _ref.node,
	        icon = _ref.icon;
	      babelHelpers.classPrivateFieldGet(this, _layout).node = node;
	      babelHelpers.classPrivateFieldGet(this, _layout).iconNode = icon;
	      return node;
	    }
	  }]);
	  return WorkTimeStateIcon;
	}();
	function _subscribeToPull2() {
	  var _this = this;
	  pull_client.PULL.subscribe({
	    moduleId: 'timeman',
	    callback: function callback(data) {
	      return _classPrivateMethodGet(_this, _handlePullEvent, _handlePullEvent2).call(_this, data);
	    }
	  });
	}
	function _handlePullEvent2(data) {
	  if (!_classPrivateMethodGet(this, _isValidCommand, _isValidCommand2).call(this, data.command)) {
	    return;
	  }
	  babelHelpers.classPrivateFieldGet(this, _params).state = data.params.info.state;
	  babelHelpers.classPrivateFieldGet(this, _params).action = data.params.info.action;
	  _classPrivateMethodGet(this, _updateIcon, _updateIcon2).call(this);
	}
	function _isValidCommand2(command) {
	  return Object.values(CommandType).includes(command);
	}
	function _updateIcon2() {
	  if (babelHelpers.classPrivateFieldGet(this, _layout).node === null) {
	    return;
	  }
	  var iconClass = _classPrivateMethodGet(this, _getIconClass, _getIconClass2).call(this);
	  var style = _classPrivateMethodGet(this, _getIconStyle, _getIconStyle2).call(this);
	  babelHelpers.classPrivateFieldGet(this, _layout).iconNode.className = 'work-time-state-icon';
	  if (iconClass) {
	    main_core.Dom.addClass(babelHelpers.classPrivateFieldGet(this, _layout).iconNode, iconClass);
	  }
	  main_core.Dom.style(babelHelpers.classPrivateFieldGet(this, _layout).node, style);
	}
	function _getIconClass2() {
	  var _babelHelpers$classPr = babelHelpers.classPrivateFieldGet(this, _params),
	    state = _babelHelpers$classPr.state,
	    action = _babelHelpers$classPr.action;
	  if (state === State.Opened) {
	    return '';
	  }
	  if (state === State.Closed && action === 'OPEN') {
	    return '--start';
	  }
	  if (state === State.Paused) {
	    return '--pause';
	  }
	  if (state === State.Closed && action === 'REOPEN') {
	    return '--check';
	  }
	  if (state === State.Expired) {
	    return '--warn';
	  }
	  return '';
	}
	function _getIconStyle2() {
	  var _babelHelpers$classPr2 = babelHelpers.classPrivateFieldGet(this, _params),
	    state = _babelHelpers$classPr2.state;
	  if (state === State.Opened) {
	    return 'display: none';
	  }
	  return null;
	}

	exports.WorkTimeStateIcon = WorkTimeStateIcon;

}((this.BX.Timeman = this.BX.Timeman || {}),BX,BX));
//# sourceMappingURL=work-time-state-icon.bundle.js.map
