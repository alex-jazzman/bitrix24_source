/* eslint-disable */
(function (exports,main_core,main_core_events,main_popup,ui_buttons) {
	'use strict';

	var _templateObject, _templateObject2;
	function _classPrivateMethodInitSpec(obj, privateSet) { _checkPrivateRedeclaration(obj, privateSet); privateSet.add(obj); }
	function _classPrivateFieldInitSpec(obj, privateMap, value) { _checkPrivateRedeclaration(obj, privateMap); privateMap.set(obj, value); }
	function _checkPrivateRedeclaration(obj, privateCollection) { if (privateCollection.has(obj)) { throw new TypeError("Cannot initialize the same private elements twice on an object"); } }
	function _classPrivateMethodGet(receiver, privateSet, fn) { if (!privateSet.has(receiver)) { throw new TypeError("attempted to get private field on non-instance"); } return fn; }
	var namespaceCrmWhatsNew = main_core.Reflection.namespace('BX.Crm.WhatsNew');
	var _slides = /*#__PURE__*/new WeakMap();
	var _steps = /*#__PURE__*/new WeakMap();
	var _options = /*#__PURE__*/new WeakMap();
	var _popup = /*#__PURE__*/new WeakMap();
	var _closeOptionName = /*#__PURE__*/new WeakMap();
	var _closeOptionCategory = /*#__PURE__*/new WeakMap();
	var _isViewHappened = /*#__PURE__*/new WeakMap();
	var _prepareSlides = /*#__PURE__*/new WeakSet();
	var _getPreparedSlideHtml = /*#__PURE__*/new WeakSet();
	var _getPrepareSlideButtons = /*#__PURE__*/new WeakSet();
	var _prepareSteps = /*#__PURE__*/new WeakSet();
	var _showStepByEvent = /*#__PURE__*/new WeakSet();
	var _getDefaultStepEventName = /*#__PURE__*/new WeakSet();
	var _isMultipleViewsAllowed = /*#__PURE__*/new WeakSet();
	var _showHelpDesk = /*#__PURE__*/new WeakSet();
	var _executeWhatsNew = /*#__PURE__*/new WeakSet();
	var _executeGuide = /*#__PURE__*/new WeakSet();
	var ActionViewMode = /*#__PURE__*/function () {
	  function ActionViewMode(_ref) {
	    var slides = _ref.slides,
	      _steps2 = _ref.steps,
	      options = _ref.options,
	      closeOptionCategory = _ref.closeOptionCategory,
	      closeOptionName = _ref.closeOptionName;
	    babelHelpers.classCallCheck(this, ActionViewMode);
	    _classPrivateMethodInitSpec(this, _executeGuide);
	    _classPrivateMethodInitSpec(this, _executeWhatsNew);
	    _classPrivateMethodInitSpec(this, _showHelpDesk);
	    _classPrivateMethodInitSpec(this, _isMultipleViewsAllowed);
	    _classPrivateMethodInitSpec(this, _getDefaultStepEventName);
	    _classPrivateMethodInitSpec(this, _showStepByEvent);
	    _classPrivateMethodInitSpec(this, _prepareSteps);
	    _classPrivateMethodInitSpec(this, _getPrepareSlideButtons);
	    _classPrivateMethodInitSpec(this, _getPreparedSlideHtml);
	    _classPrivateMethodInitSpec(this, _prepareSlides);
	    _classPrivateFieldInitSpec(this, _slides, {
	      writable: true,
	      value: void 0
	    });
	    _classPrivateFieldInitSpec(this, _steps, {
	      writable: true,
	      value: void 0
	    });
	    _classPrivateFieldInitSpec(this, _options, {
	      writable: true,
	      value: void 0
	    });
	    _classPrivateFieldInitSpec(this, _popup, {
	      writable: true,
	      value: void 0
	    });
	    _classPrivateFieldInitSpec(this, _closeOptionName, {
	      writable: true,
	      value: void 0
	    });
	    _classPrivateFieldInitSpec(this, _closeOptionCategory, {
	      writable: true,
	      value: void 0
	    });
	    _classPrivateFieldInitSpec(this, _isViewHappened, {
	      writable: true,
	      value: false
	    });
	    babelHelpers.classPrivateFieldSet(this, _slides, []);
	    babelHelpers.classPrivateFieldSet(this, _steps, []);
	    babelHelpers.classPrivateFieldSet(this, _options, options);
	    babelHelpers.classPrivateFieldSet(this, _popup, null);
	    this.slideClassName = 'crm-whats-new-slides-wrapper';
	    babelHelpers.classPrivateFieldSet(this, _closeOptionCategory, main_core.Type.isString(closeOptionCategory) ? closeOptionCategory : '');
	    babelHelpers.classPrivateFieldSet(this, _closeOptionName, main_core.Type.isString(closeOptionName) ? closeOptionName : '');
	    this.onClickClose = this.onClickCloseHandler.bind(this);
	    this.whatNewPromise = null;
	    this.tourPromise = null;
	    _classPrivateMethodGet(this, _prepareSlides, _prepareSlides2).call(this, slides);
	    _classPrivateMethodGet(this, _prepareSteps, _prepareSteps2).call(this, _steps2);
	  }
	  babelHelpers.createClass(ActionViewMode, [{
	    key: "show",
	    value: function show() {
	      if (babelHelpers.classPrivateFieldGet(this, _options).isNumberOfViewsExceeded) {
	        // eslint-disable-next-line no-console
	        console.warn('Number of views exceeded');
	        return;
	      }
	      if (babelHelpers.classPrivateFieldGet(this, _slides).length > 0) {
	        _classPrivateMethodGet(this, _executeWhatsNew, _executeWhatsNew2).call(this);
	      } else if (babelHelpers.classPrivateFieldGet(this, _steps).length > 0) {
	        _classPrivateMethodGet(this, _executeGuide, _executeGuide2).call(this);
	      }
	    }
	  }, {
	    key: "onClickCloseHandler",
	    value: function onClickCloseHandler() {
	      var lastPosition = babelHelpers.classPrivateFieldGet(this, _popup).getLastPosition();
	      var currentPosition = babelHelpers.classPrivateFieldGet(this, _popup).getPositionBySlide(babelHelpers.classPrivateFieldGet(this, _popup).getCurrentSlide());
	      if (currentPosition >= lastPosition) {
	        babelHelpers.classPrivateFieldGet(this, _popup).destroy();
	      } else {
	        babelHelpers.classPrivateFieldGet(this, _popup).selectNextSlide();
	      }
	    }
	  }, {
	    key: "createGuideInstance",
	    value: function createGuideInstance(Guide, steps, onEvents) {
	      var _this = this;
	      return new Guide({
	        onEvents: onEvents,
	        steps: steps,
	        events: {
	          onFinish: function onFinish() {
	            if (babelHelpers.classPrivateFieldGet(_this, _slides).length === 0) {
	              _this.save();
	            }
	          }
	        }
	      });
	    }
	  }, {
	    key: "setStepPopupOptions",
	    value: function setStepPopupOptions(popup) {
	      var _steps$popup;
	      var _babelHelpers$classPr = babelHelpers.classPrivateFieldGet(this, _options),
	        steps = _babelHelpers$classPr.steps,
	        _babelHelpers$classPr2 = _babelHelpers$classPr.hideTourOnMissClick,
	        hideTourOnMissClick = _babelHelpers$classPr2 === void 0 ? false : _babelHelpers$classPr2;
	      popup.setAutoHide(hideTourOnMissClick);
	      if (steps !== null && steps !== void 0 && (_steps$popup = steps.popup) !== null && _steps$popup !== void 0 && _steps$popup.width) {
	        popup.setWidth(steps.popup.width);
	      }
	    }
	  }, {
	    key: "save",
	    value: function save() {
	      var _babelHelpers$classPr3,
	        _this2 = this;
	      main_core.ajax.runAction('crm.settings.tour.updateOption', {
	        json: {
	          category: babelHelpers.classPrivateFieldGet(this, _closeOptionCategory),
	          name: babelHelpers.classPrivateFieldGet(this, _closeOptionName),
	          options: {
	            isMultipleViewsAllowed: !babelHelpers.classPrivateFieldGet(this, _isViewHappened) && _classPrivateMethodGet(this, _isMultipleViewsAllowed, _isMultipleViewsAllowed2).call(this),
	            numberOfViewsLimit: (_babelHelpers$classPr3 = babelHelpers.classPrivateFieldGet(this, _options).numberOfViewsLimit) !== null && _babelHelpers$classPr3 !== void 0 ? _babelHelpers$classPr3 : 1
	          }
	        }
	      }).then(function (_ref2) {
	        var data = _ref2.data;
	        babelHelpers.classPrivateFieldGet(_this2, _options).isNumberOfViewsExceeded = data.isNumberOfViewsExceeded;
	        babelHelpers.classPrivateFieldSet(_this2, _isViewHappened, true);
	      })["catch"](function (errors) {
	        console.error('Could not save tour settings', errors);
	      });
	    }
	  }]);
	  return ActionViewMode;
	}();
	function _prepareSlides2(slideConfigs) {
	  var _this3 = this;
	  if (slideConfigs.length > 0) {
	    this.whatNewPromise = main_core.Runtime.loadExtension('ui.dialogs.whats-new');
	  }
	  babelHelpers.classPrivateFieldSet(this, _slides, slideConfigs.map(function (slideConfig) {
	    return {
	      className: _this3.slideClassName,
	      title: slideConfig.title,
	      html: _classPrivateMethodGet(_this3, _getPreparedSlideHtml, _getPreparedSlideHtml2).call(_this3, slideConfig)
	    };
	  }));
	}
	function _getPreparedSlideHtml2(slideConfig) {
	  var slide = main_core.Tag.render(_templateObject || (_templateObject = babelHelpers.taggedTemplateLiteral(["\n\t\t\t<div class=\"crm-whats-new-slide\">\n\t\t\t\t<img src=\"", "\" alt=\"\">\n\t\t\t\t<div class=\"crm-whats-new-slide-inner-title\"> ", " </div>\n\t\t\t\t<p>", "</p>\n\t\t\t</div>\n\t\t"])), slideConfig.innerImage, slideConfig.innerTitle, slideConfig.innerDescription);
	  var buttons = _classPrivateMethodGet(this, _getPrepareSlideButtons, _getPrepareSlideButtons2).call(this, slideConfig);
	  if (buttons.length > 0) {
	    var buttonsContainer = main_core.Tag.render(_templateObject2 || (_templateObject2 = babelHelpers.taggedTemplateLiteral(["<div class=\"crm-whats-new-slide-buttons\"></div>"])));
	    main_core.Dom.append(buttonsContainer, slide);
	    buttons.forEach(function (button) {
	      main_core.Dom.append(button.getContainer(), buttonsContainer);
	    });
	  }
	  return slide;
	}
	function _getPrepareSlideButtons2(slideConfig) {
	  var _this4 = this;
	  var buttons = [];
	  if (slideConfig.buttons) {
	    var className = 'ui-btn ui-btn-primary ui-btn-hover ui-btn-round ';
	    buttons = slideConfig.buttons.map(function (buttonConfig) {
	      var _buttonConfig$classNa;
	      var config = {
	        className: className + ((_buttonConfig$classNa = buttonConfig.className) !== null && _buttonConfig$classNa !== void 0 ? _buttonConfig$classNa : ''),
	        text: buttonConfig.text
	      };
	      if (buttonConfig.onClickClose) {
	        config.onclick = function () {
	          return _this4.onClickClose();
	        };
	      } else if (buttonConfig.helpDeskCode) {
	        config.onclick = function () {
	          return _classPrivateMethodGet(_this4, _showHelpDesk, _showHelpDesk2).call(_this4, buttonConfig.helpDeskCode);
	        };
	      }
	      return new ui_buttons.Button(config);
	    });
	  }
	  return buttons;
	}
	function _prepareSteps2(stepsConfig) {
	  var _this5 = this;
	  if (stepsConfig.length > 0) {
	    this.tourPromise = main_core.Runtime.loadExtension('ui.tour');
	  }
	  babelHelpers.classPrivateFieldSet(this, _steps, stepsConfig.map(function (stepConfig) {
	    var step = {
	      id: stepConfig.id,
	      title: stepConfig.title,
	      text: stepConfig.text,
	      position: stepConfig.position,
	      article: stepConfig.article
	    };
	    if (stepConfig.useDynamicTarget) {
	      var _stepConfig$eventName;
	      var eventName = (_stepConfig$eventName = stepConfig.eventName) !== null && _stepConfig$eventName !== void 0 ? _stepConfig$eventName : _classPrivateMethodGet(_this5, _getDefaultStepEventName, _getDefaultStepEventName2).call(_this5, step.id);
	      main_core_events.EventEmitter.subscribeOnce(eventName, _classPrivateMethodGet(_this5, _showStepByEvent, _showStepByEvent2).bind(_this5));
	    } else {
	      step.target = stepConfig.target;
	    }
	    return step;
	  }));
	}
	function _showStepByEvent2(event) {
	  var _this6 = this;
	  // eslint-disable-next-line promise/catch-or-return
	  this.tourPromise.then(function (exports) {
	    var _event$data = event.data,
	      stepId = _event$data.stepId,
	      target = _event$data.target,
	      delay = _event$data.delay;
	    // eslint-disable-next-line no-shadow
	    var step = babelHelpers.classPrivateFieldGet(_this6, _steps).find(function (step) {
	      return step.id === stepId;
	    });
	    if (!step) {
	      console.error('step not found');
	      return;
	    }
	    setTimeout(function () {
	      step.target = target;
	      var Guide = exports.Guide;
	      var guide = _this6.createGuideInstance(Guide, [step], true);
	      _this6.setStepPopupOptions(guide.getPopup());
	      guide.showNextStep();
	      _this6.save();
	    }, delay || 0);
	  });
	}
	function _getDefaultStepEventName2(stepId) {
	  return "Crm.WhatsNew::onTargetSetted::".concat(stepId);
	}
	function _isMultipleViewsAllowed2() {
	  return babelHelpers.classPrivateFieldGet(this, _options).numberOfViewsLimit > 1;
	}
	function _showHelpDesk2(code) {
	  if (top.BX.Helper) {
	    top.BX.Helper.show("redirect=detail&code=".concat(code));
	    event.preventDefault();
	  }
	}
	function _executeWhatsNew2() {
	  var _this7 = this;
	  if (main_popup.PopupManager && main_popup.PopupManager.isAnyPopupShown()) {
	    return;
	  }

	  // eslint-disable-next-line promise/catch-or-return
	  this.whatNewPromise.then(function (exports) {
	    var WhatsNew = exports.WhatsNew;
	    babelHelpers.classPrivateFieldSet(_this7, _popup, new WhatsNew({
	      slides: babelHelpers.classPrivateFieldGet(_this7, _slides),
	      popupOptions: {
	        height: 440
	      },
	      events: {
	        onDestroy: function onDestroy() {
	          _this7.save();
	          _classPrivateMethodGet(_this7, _executeGuide, _executeGuide2).call(_this7);
	        }
	      }
	    }));
	    babelHelpers.classPrivateFieldGet(_this7, _popup).show();
	    ActionViewMode.whatsNewInstances.push(babelHelpers.classPrivateFieldGet(_this7, _popup));
	  }, this);
	}
	function _executeGuide2() {
	  var _this8 = this;
	  var steps = main_core.clone(babelHelpers.classPrivateFieldGet(this, _steps));
	  steps = steps.filter(function (step) {
	    return Boolean(step.target);
	  });
	  if (steps.length === 0) {
	    return;
	  }

	  // eslint-disable-next-line promise/catch-or-return
	  this.tourPromise.then(function (exports) {
	    if (main_popup.PopupManager && main_popup.PopupManager.isAnyPopupShown()) {
	      return;
	    }
	    var Guide = exports.Guide;
	    var guide = _this8.createGuideInstance(Guide, steps, babelHelpers.classPrivateFieldGet(_this8, _steps).length <= 1);
	    if (ActionViewMode.tourInstances.find(function (existedGuide) {
	      var _existedGuide$getPopu;
	      return (_existedGuide$getPopu = existedGuide.getPopup()) === null || _existedGuide$getPopu === void 0 ? void 0 : _existedGuide$getPopu.isShown();
	    })) {
	      return; // do not allow many guides at the same time
	    }

	    ActionViewMode.tourInstances.push(guide);
	    _this8.setStepPopupOptions(guide.getPopup());
	    if (guide.steps.length > 1 || babelHelpers.classPrivateFieldGet(_this8, _options).showOverlayFromFirstStep) {
	      guide.start();
	    } else {
	      guide.showNextStep();
	    }
	    _this8.save();
	  });
	}
	babelHelpers.defineProperty(ActionViewMode, "tourInstances", []);
	babelHelpers.defineProperty(ActionViewMode, "whatsNewInstances", []);
	namespaceCrmWhatsNew.ActionViewMode = ActionViewMode;

}((this.window = this.window || {}),BX,BX.Event,BX.Main,BX.UI));
//# sourceMappingURL=script.js.map
