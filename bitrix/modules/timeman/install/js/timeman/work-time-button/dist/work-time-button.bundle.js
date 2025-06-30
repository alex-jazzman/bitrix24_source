/* eslint-disable */
this.BX = this.BX || {};
(function (exports,main_core,main_core_events,ui_buttons) {
	'use strict';

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
	var Action = Object.freeze({
	  Open: 'OPEN',
	  Reopen: 'REOPEN'
	});
	var _data = /*#__PURE__*/new WeakMap();
	var _button = /*#__PURE__*/new WeakMap();
	var _node = /*#__PURE__*/new WeakMap();
	var _timerInterval = /*#__PURE__*/new WeakMap();
	var _getState = /*#__PURE__*/new WeakSet();
	var _getAvailableAction = /*#__PURE__*/new WeakSet();
	var _getDateStart = /*#__PURE__*/new WeakSet();
	var _getTimeLeaks = /*#__PURE__*/new WeakSet();
	var _init = /*#__PURE__*/new WeakSet();
	var _updateState = /*#__PURE__*/new WeakSet();
	var _handleClick = /*#__PURE__*/new WeakSet();
	var _getButtonText = /*#__PURE__*/new WeakSet();
	var _getButtonIcon = /*#__PURE__*/new WeakSet();
	var _getButtonStyle = /*#__PURE__*/new WeakSet();
	var _initWorkingButtonTimer = /*#__PURE__*/new WeakSet();
	var _startWorkingButtonTimer = /*#__PURE__*/new WeakSet();
	var _stopWorkingButtonTimer = /*#__PURE__*/new WeakSet();
	var _getWorkingButtonText = /*#__PURE__*/new WeakSet();
	var _formatTime = /*#__PURE__*/new WeakSet();
	var WorkTimeButton = /*#__PURE__*/function () {
	  function WorkTimeButton() {
	    babelHelpers.classCallCheck(this, WorkTimeButton);
	    _classPrivateMethodInitSpec(this, _formatTime);
	    _classPrivateMethodInitSpec(this, _getWorkingButtonText);
	    _classPrivateMethodInitSpec(this, _stopWorkingButtonTimer);
	    _classPrivateMethodInitSpec(this, _startWorkingButtonTimer);
	    _classPrivateMethodInitSpec(this, _initWorkingButtonTimer);
	    _classPrivateMethodInitSpec(this, _getButtonStyle);
	    _classPrivateMethodInitSpec(this, _getButtonIcon);
	    _classPrivateMethodInitSpec(this, _getButtonText);
	    _classPrivateMethodInitSpec(this, _handleClick);
	    _classPrivateMethodInitSpec(this, _updateState);
	    _classPrivateMethodInitSpec(this, _init);
	    _classPrivateMethodInitSpec(this, _getTimeLeaks);
	    _classPrivateMethodInitSpec(this, _getDateStart);
	    _classPrivateMethodInitSpec(this, _getAvailableAction);
	    _classPrivateMethodInitSpec(this, _getState);
	    _classPrivateFieldInitSpec(this, _data, {
	      writable: true,
	      value: {}
	    });
	    _classPrivateFieldInitSpec(this, _button, {
	      writable: true,
	      value: void 0
	    });
	    _classPrivateFieldInitSpec(this, _node, {
	      writable: true,
	      value: void 0
	    });
	    _classPrivateFieldInitSpec(this, _timerInterval, {
	      writable: true,
	      value: void 0
	    });
	    var settings = main_core.Extension.getSettings('timeman.work-time-button');
	    babelHelpers.classPrivateFieldGet(this, _data).workReport = settings.get('workReport');
	    babelHelpers.classPrivateFieldGet(this, _data).info = settings.get('info');
	    babelHelpers.classPrivateFieldGet(this, _data).siteId = settings.get('siteId');
	    babelHelpers.classPrivateFieldSet(this, _button, new ui_buttons.Button({
	      size: ui_buttons.Button.Size.MEDIUM,
	      text: _classPrivateMethodGet(this, _getButtonText, _getButtonText2).call(this),
	      icon: _classPrivateMethodGet(this, _getButtonIcon, _getButtonIcon2).call(this),
	      useAirDesign: true,
	      style: _classPrivateMethodGet(this, _getButtonStyle, _getButtonStyle2).call(this),
	      noCaps: true,
	      wide: true,
	      events: {
	        click: _classPrivateMethodGet(this, _handleClick, _handleClick2).bind(this)
	      },
	      className: 'timeman-work-time-button'
	    }));
	    babelHelpers.classPrivateFieldSet(this, _node, babelHelpers.classPrivateFieldGet(this, _button).render());
	    main_core_events.EventEmitter.subscribe('onTimemanInit', _classPrivateMethodGet(this, _init, _init2).bind(this));
	    main_core_events.EventEmitter.subscribe('onTimeManDataRecieved', _classPrivateMethodGet(this, _updateState, _updateState2).bind(this));
	    window.BX.timeman('bx_tm', babelHelpers.classPrivateFieldGet(this, _data).info, babelHelpers.classPrivateFieldGet(this, _data).siteId);
	  }
	  babelHelpers.createClass(WorkTimeButton, [{
	    key: "render",
	    value: function render() {
	      return babelHelpers.classPrivateFieldGet(this, _node);
	    }
	  }]);
	  return WorkTimeButton;
	}();
	function _getState2() {
	  return babelHelpers.classPrivateFieldGet(this, _data).info.STATE;
	}
	function _getAvailableAction2() {
	  var _babelHelpers$classPr, _babelHelpers$classPr2;
	  return (_babelHelpers$classPr = (_babelHelpers$classPr2 = babelHelpers.classPrivateFieldGet(this, _data).info) === null || _babelHelpers$classPr2 === void 0 ? void 0 : _babelHelpers$classPr2.CAN_OPEN) !== null && _babelHelpers$classPr !== void 0 ? _babelHelpers$classPr : null;
	}
	function _getDateStart2() {
	  return babelHelpers.classPrivateFieldGet(this, _data).info.INFO.DATE_START;
	}
	function _getTimeLeaks2() {
	  return babelHelpers.classPrivateFieldGet(this, _data).info.INFO.TIME_LEAKS;
	}
	function _init2() {
	  _classPrivateMethodGet(this, _initWorkingButtonTimer, _initWorkingButtonTimer2).call(this);
	  window.BXTIMEMAN.initFormWeekly(babelHelpers.classPrivateFieldGet(this, _data).workReport);
	}
	function _updateState2(baseEvent) {
	  var _baseEvent$getCompatD = baseEvent.getCompatData(),
	    _baseEvent$getCompatD2 = babelHelpers.slicedToArray(_baseEvent$getCompatD, 1),
	    data = _baseEvent$getCompatD2[0];
	  babelHelpers.classPrivateFieldGet(this, _data).info = data;
	  babelHelpers.classPrivateFieldGet(this, _button).setText(_classPrivateMethodGet(this, _getButtonText, _getButtonText2).call(this));
	  babelHelpers.classPrivateFieldGet(this, _button).setIcon(_classPrivateMethodGet(this, _getButtonIcon, _getButtonIcon2).call(this));
	  babelHelpers.classPrivateFieldGet(this, _button).setStyle(_classPrivateMethodGet(this, _getButtonStyle, _getButtonStyle2).call(this));
	  _classPrivateMethodGet(this, _initWorkingButtonTimer, _initWorkingButtonTimer2).call(this);
	}
	function _handleClick2(button, event) {
	  event.stopPropagation();
	  window.BXTIMEMAN.setBindOptions({
	    node: babelHelpers.classPrivateFieldGet(this, _node),
	    mode: 'popup',
	    popupOptions: {
	      autoHide: true,
	      angle: false,
	      offsetTop: -40,
	      closeByEsc: true,
	      bindOptions: {
	        forceBindPosition: true,
	        forceTop: true,
	        forceLeft: false
	      },
	      events: {
	        onClose: function onClose() {},
	        onDestroy: function onDestroy() {}
	      },
	      fixed: true
	    }
	  });
	  window.BXTIMEMAN.Open();
	}
	function _getButtonText2() {
	  if (_classPrivateMethodGet(this, _getState, _getState2).call(this) === State.Closed && _classPrivateMethodGet(this, _getAvailableAction, _getAvailableAction2).call(this) === Action.Open) {
	    return main_core.Loc.getMessage('TIMEMAN_WORK_TIME_BUTTON_TEXT_START');
	  }
	  if (_classPrivateMethodGet(this, _getState, _getState2).call(this) === State.Opened) {
	    return _classPrivateMethodGet(this, _getWorkingButtonText, _getWorkingButtonText2).call(this);
	  }
	  if (_classPrivateMethodGet(this, _getState, _getState2).call(this) === State.Paused) {
	    return main_core.Loc.getMessage('TIMEMAN_WORK_TIME_BUTTON_TEXT_CONTINUE');
	  }
	  if (_classPrivateMethodGet(this, _getState, _getState2).call(this) === State.Closed && _classPrivateMethodGet(this, _getAvailableAction, _getAvailableAction2).call(this) === Action.Reopen) {
	    return main_core.Loc.getMessage('TIMEMAN_WORK_TIME_BUTTON_TEXT_CONTINUE');
	  }
	  if (_classPrivateMethodGet(this, _getState, _getState2).call(this) === State.Expired) {
	    return main_core.Loc.getMessage('TIMEMAN_WORK_TIME_BUTTON_TEXT_EXPIRED');
	  }
	  return '';
	}
	function _getButtonIcon2() {
	  if (_classPrivateMethodGet(this, _getState, _getState2).call(this) === State.Closed && _classPrivateMethodGet(this, _getAvailableAction, _getAvailableAction2).call(this) === Action.Open) {
	    return ui_buttons.ButtonIcon.START;
	  }
	  if (_classPrivateMethodGet(this, _getState, _getState2).call(this) === State.Opened) {
	    return ui_buttons.ButtonIcon.START;
	  }
	  if (_classPrivateMethodGet(this, _getState, _getState2).call(this) === State.Paused) {
	    return ui_buttons.ButtonIcon.START;
	  }
	  if (_classPrivateMethodGet(this, _getState, _getState2).call(this) === State.Closed && _classPrivateMethodGet(this, _getAvailableAction, _getAvailableAction2).call(this) === Action.Reopen) {
	    return ui_buttons.ButtonIcon.REFRESH;
	  }
	  if (_classPrivateMethodGet(this, _getState, _getState2).call(this) === State.Expired) {
	    return ui_buttons.ButtonIcon.ALERT;
	  }
	  return null;
	}
	function _getButtonStyle2() {
	  if (_classPrivateMethodGet(this, _getState, _getState2).call(this) === State.Opened) {
	    return ui_buttons.AirButtonStyle.TINTED;
	  }
	  if (_classPrivateMethodGet(this, _getState, _getState2).call(this) === State.Paused) {
	    return ui_buttons.AirButtonStyle.FILLED;
	  }
	  if (_classPrivateMethodGet(this, _getState, _getState2).call(this) === State.Closed && _classPrivateMethodGet(this, _getAvailableAction, _getAvailableAction2).call(this) === Action.Reopen) {
	    return ui_buttons.AirButtonStyle.TINTED;
	  }
	  if (_classPrivateMethodGet(this, _getState, _getState2).call(this) === State.Expired) {
	    return ui_buttons.AirButtonStyle.TINTED_ALERT;
	  }
	  return ui_buttons.AirButtonStyle.FILLED;
	}
	function _initWorkingButtonTimer2() {
	  _classPrivateMethodGet(this, _stopWorkingButtonTimer, _stopWorkingButtonTimer2).call(this);
	  if (_classPrivateMethodGet(this, _getState, _getState2).call(this) === State.Opened) {
	    _classPrivateMethodGet(this, _startWorkingButtonTimer, _startWorkingButtonTimer2).call(this);
	  }
	}
	function _startWorkingButtonTimer2() {
	  var _this = this;
	  babelHelpers.classPrivateFieldSet(this, _timerInterval, setInterval(function () {
	    babelHelpers.classPrivateFieldGet(_this, _button).setText(_classPrivateMethodGet(_this, _getWorkingButtonText, _getWorkingButtonText2).call(_this));
	  }, 1000));
	}
	function _stopWorkingButtonTimer2() {
	  clearInterval(babelHelpers.classPrivateFieldGet(this, _timerInterval));
	}
	function _getWorkingButtonText2() {
	  var nowSeconds = Math.floor(Date.now() / 1000);
	  var workingSeconds = nowSeconds - _classPrivateMethodGet(this, _getDateStart, _getDateStart2).call(this) - (_classPrivateMethodGet(this, _getTimeLeaks, _getTimeLeaks2).call(this) || 0);
	  if (workingSeconds < 0) {
	    return _classPrivateMethodGet(this, _formatTime, _formatTime2).call(this, 0, 0, 0);
	  }
	  var hours = Math.floor(workingSeconds / 3600);
	  var minutes = Math.floor(workingSeconds % 3600 / 60);
	  var seconds = workingSeconds % 60;
	  return _classPrivateMethodGet(this, _formatTime, _formatTime2).call(this, hours, minutes, seconds);
	}
	function _formatTime2(hours, minutes, seconds) {
	  var format = function format(value) {
	    return (value !== null && value !== void 0 ? value : 0).toString().padStart(2, '0');
	  };
	  return main_core.Loc.getMessage('TIMEMAN_WORK_TIME_BUTTON_TEXT_WORKING').replace('#time#', "".concat(format(hours), ":").concat(format(minutes), ":").concat(format(seconds)));
	}

	exports.WorkTimeButton = WorkTimeButton;

}((this.BX.Timeman = this.BX.Timeman || {}),BX,BX.Event,BX.UI));
//# sourceMappingURL=work-time-button.bundle.js.map
