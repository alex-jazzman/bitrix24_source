/* eslint-disable */
(function (exports,crm_integration_ui_bannerDispatcher,main_core,main_core_events,main_popup,ui_buttons,ui_tour) {
	'use strict';

	var _templateObject, _templateObject2, _templateObject3;
	function _regeneratorRuntime() { /*! regenerator-runtime -- Copyright (c) 2014-present, Facebook, Inc. -- license (MIT): https://github.com/facebook/regenerator/blob/main/LICENSE */ _regeneratorRuntime = function _regeneratorRuntime() { return exports; }; var exports = {}, Op = Object.prototype, hasOwn = Op.hasOwnProperty, defineProperty = Object.defineProperty || function (obj, key, desc) { obj[key] = desc.value; }, $Symbol = "function" == typeof Symbol ? Symbol : {}, iteratorSymbol = $Symbol.iterator || "@@iterator", asyncIteratorSymbol = $Symbol.asyncIterator || "@@asyncIterator", toStringTagSymbol = $Symbol.toStringTag || "@@toStringTag"; function define(obj, key, value) { return Object.defineProperty(obj, key, { value: value, enumerable: !0, configurable: !0, writable: !0 }), obj[key]; } try { define({}, ""); } catch (err) { define = function define(obj, key, value) { return obj[key] = value; }; } function wrap(innerFn, outerFn, self, tryLocsList) { var protoGenerator = outerFn && outerFn.prototype instanceof Generator ? outerFn : Generator, generator = Object.create(protoGenerator.prototype), context = new Context(tryLocsList || []); return defineProperty(generator, "_invoke", { value: makeInvokeMethod(innerFn, self, context) }), generator; } function tryCatch(fn, obj, arg) { try { return { type: "normal", arg: fn.call(obj, arg) }; } catch (err) { return { type: "throw", arg: err }; } } exports.wrap = wrap; var ContinueSentinel = {}; function Generator() {} function GeneratorFunction() {} function GeneratorFunctionPrototype() {} var IteratorPrototype = {}; define(IteratorPrototype, iteratorSymbol, function () { return this; }); var getProto = Object.getPrototypeOf, NativeIteratorPrototype = getProto && getProto(getProto(values([]))); NativeIteratorPrototype && NativeIteratorPrototype !== Op && hasOwn.call(NativeIteratorPrototype, iteratorSymbol) && (IteratorPrototype = NativeIteratorPrototype); var Gp = GeneratorFunctionPrototype.prototype = Generator.prototype = Object.create(IteratorPrototype); function defineIteratorMethods(prototype) { ["next", "throw", "return"].forEach(function (method) { define(prototype, method, function (arg) { return this._invoke(method, arg); }); }); } function AsyncIterator(generator, PromiseImpl) { function invoke(method, arg, resolve, reject) { var record = tryCatch(generator[method], generator, arg); if ("throw" !== record.type) { var result = record.arg, value = result.value; return value && "object" == babelHelpers["typeof"](value) && hasOwn.call(value, "__await") ? PromiseImpl.resolve(value.__await).then(function (value) { invoke("next", value, resolve, reject); }, function (err) { invoke("throw", err, resolve, reject); }) : PromiseImpl.resolve(value).then(function (unwrapped) { result.value = unwrapped, resolve(result); }, function (error) { return invoke("throw", error, resolve, reject); }); } reject(record.arg); } var previousPromise; defineProperty(this, "_invoke", { value: function value(method, arg) { function callInvokeWithMethodAndArg() { return new PromiseImpl(function (resolve, reject) { invoke(method, arg, resolve, reject); }); } return previousPromise = previousPromise ? previousPromise.then(callInvokeWithMethodAndArg, callInvokeWithMethodAndArg) : callInvokeWithMethodAndArg(); } }); } function makeInvokeMethod(innerFn, self, context) { var state = "suspendedStart"; return function (method, arg) { if ("executing" === state) throw new Error("Generator is already running"); if ("completed" === state) { if ("throw" === method) throw arg; return doneResult(); } for (context.method = method, context.arg = arg;;) { var delegate = context.delegate; if (delegate) { var delegateResult = maybeInvokeDelegate(delegate, context); if (delegateResult) { if (delegateResult === ContinueSentinel) continue; return delegateResult; } } if ("next" === context.method) context.sent = context._sent = context.arg;else if ("throw" === context.method) { if ("suspendedStart" === state) throw state = "completed", context.arg; context.dispatchException(context.arg); } else "return" === context.method && context.abrupt("return", context.arg); state = "executing"; var record = tryCatch(innerFn, self, context); if ("normal" === record.type) { if (state = context.done ? "completed" : "suspendedYield", record.arg === ContinueSentinel) continue; return { value: record.arg, done: context.done }; } "throw" === record.type && (state = "completed", context.method = "throw", context.arg = record.arg); } }; } function maybeInvokeDelegate(delegate, context) { var methodName = context.method, method = delegate.iterator[methodName]; if (undefined === method) return context.delegate = null, "throw" === methodName && delegate.iterator["return"] && (context.method = "return", context.arg = undefined, maybeInvokeDelegate(delegate, context), "throw" === context.method) || "return" !== methodName && (context.method = "throw", context.arg = new TypeError("The iterator does not provide a '" + methodName + "' method")), ContinueSentinel; var record = tryCatch(method, delegate.iterator, context.arg); if ("throw" === record.type) return context.method = "throw", context.arg = record.arg, context.delegate = null, ContinueSentinel; var info = record.arg; return info ? info.done ? (context[delegate.resultName] = info.value, context.next = delegate.nextLoc, "return" !== context.method && (context.method = "next", context.arg = undefined), context.delegate = null, ContinueSentinel) : info : (context.method = "throw", context.arg = new TypeError("iterator result is not an object"), context.delegate = null, ContinueSentinel); } function pushTryEntry(locs) { var entry = { tryLoc: locs[0] }; 1 in locs && (entry.catchLoc = locs[1]), 2 in locs && (entry.finallyLoc = locs[2], entry.afterLoc = locs[3]), this.tryEntries.push(entry); } function resetTryEntry(entry) { var record = entry.completion || {}; record.type = "normal", delete record.arg, entry.completion = record; } function Context(tryLocsList) { this.tryEntries = [{ tryLoc: "root" }], tryLocsList.forEach(pushTryEntry, this), this.reset(!0); } function values(iterable) { if (iterable) { var iteratorMethod = iterable[iteratorSymbol]; if (iteratorMethod) return iteratorMethod.call(iterable); if ("function" == typeof iterable.next) return iterable; if (!isNaN(iterable.length)) { var i = -1, next = function next() { for (; ++i < iterable.length;) if (hasOwn.call(iterable, i)) return next.value = iterable[i], next.done = !1, next; return next.value = undefined, next.done = !0, next; }; return next.next = next; } } return { next: doneResult }; } function doneResult() { return { value: undefined, done: !0 }; } return GeneratorFunction.prototype = GeneratorFunctionPrototype, defineProperty(Gp, "constructor", { value: GeneratorFunctionPrototype, configurable: !0 }), defineProperty(GeneratorFunctionPrototype, "constructor", { value: GeneratorFunction, configurable: !0 }), GeneratorFunction.displayName = define(GeneratorFunctionPrototype, toStringTagSymbol, "GeneratorFunction"), exports.isGeneratorFunction = function (genFun) { var ctor = "function" == typeof genFun && genFun.constructor; return !!ctor && (ctor === GeneratorFunction || "GeneratorFunction" === (ctor.displayName || ctor.name)); }, exports.mark = function (genFun) { return Object.setPrototypeOf ? Object.setPrototypeOf(genFun, GeneratorFunctionPrototype) : (genFun.__proto__ = GeneratorFunctionPrototype, define(genFun, toStringTagSymbol, "GeneratorFunction")), genFun.prototype = Object.create(Gp), genFun; }, exports.awrap = function (arg) { return { __await: arg }; }, defineIteratorMethods(AsyncIterator.prototype), define(AsyncIterator.prototype, asyncIteratorSymbol, function () { return this; }), exports.AsyncIterator = AsyncIterator, exports.async = function (innerFn, outerFn, self, tryLocsList, PromiseImpl) { void 0 === PromiseImpl && (PromiseImpl = Promise); var iter = new AsyncIterator(wrap(innerFn, outerFn, self, tryLocsList), PromiseImpl); return exports.isGeneratorFunction(outerFn) ? iter : iter.next().then(function (result) { return result.done ? result.value : iter.next(); }); }, defineIteratorMethods(Gp), define(Gp, toStringTagSymbol, "Generator"), define(Gp, iteratorSymbol, function () { return this; }), define(Gp, "toString", function () { return "[object Generator]"; }), exports.keys = function (val) { var object = Object(val), keys = []; for (var key in object) keys.push(key); return keys.reverse(), function next() { for (; keys.length;) { var key = keys.pop(); if (key in object) return next.value = key, next.done = !1, next; } return next.done = !0, next; }; }, exports.values = values, Context.prototype = { constructor: Context, reset: function reset(skipTempReset) { if (this.prev = 0, this.next = 0, this.sent = this._sent = undefined, this.done = !1, this.delegate = null, this.method = "next", this.arg = undefined, this.tryEntries.forEach(resetTryEntry), !skipTempReset) for (var name in this) "t" === name.charAt(0) && hasOwn.call(this, name) && !isNaN(+name.slice(1)) && (this[name] = undefined); }, stop: function stop() { this.done = !0; var rootRecord = this.tryEntries[0].completion; if ("throw" === rootRecord.type) throw rootRecord.arg; return this.rval; }, dispatchException: function dispatchException(exception) { if (this.done) throw exception; var context = this; function handle(loc, caught) { return record.type = "throw", record.arg = exception, context.next = loc, caught && (context.method = "next", context.arg = undefined), !!caught; } for (var i = this.tryEntries.length - 1; i >= 0; --i) { var entry = this.tryEntries[i], record = entry.completion; if ("root" === entry.tryLoc) return handle("end"); if (entry.tryLoc <= this.prev) { var hasCatch = hasOwn.call(entry, "catchLoc"), hasFinally = hasOwn.call(entry, "finallyLoc"); if (hasCatch && hasFinally) { if (this.prev < entry.catchLoc) return handle(entry.catchLoc, !0); if (this.prev < entry.finallyLoc) return handle(entry.finallyLoc); } else if (hasCatch) { if (this.prev < entry.catchLoc) return handle(entry.catchLoc, !0); } else { if (!hasFinally) throw new Error("try statement without catch or finally"); if (this.prev < entry.finallyLoc) return handle(entry.finallyLoc); } } } }, abrupt: function abrupt(type, arg) { for (var i = this.tryEntries.length - 1; i >= 0; --i) { var entry = this.tryEntries[i]; if (entry.tryLoc <= this.prev && hasOwn.call(entry, "finallyLoc") && this.prev < entry.finallyLoc) { var finallyEntry = entry; break; } } finallyEntry && ("break" === type || "continue" === type) && finallyEntry.tryLoc <= arg && arg <= finallyEntry.finallyLoc && (finallyEntry = null); var record = finallyEntry ? finallyEntry.completion : {}; return record.type = type, record.arg = arg, finallyEntry ? (this.method = "next", this.next = finallyEntry.finallyLoc, ContinueSentinel) : this.complete(record); }, complete: function complete(record, afterLoc) { if ("throw" === record.type) throw record.arg; return "break" === record.type || "continue" === record.type ? this.next = record.arg : "return" === record.type ? (this.rval = this.arg = record.arg, this.method = "return", this.next = "end") : "normal" === record.type && afterLoc && (this.next = afterLoc), ContinueSentinel; }, finish: function finish(finallyLoc) { for (var i = this.tryEntries.length - 1; i >= 0; --i) { var entry = this.tryEntries[i]; if (entry.finallyLoc === finallyLoc) return this.complete(entry.completion, entry.afterLoc), resetTryEntry(entry), ContinueSentinel; } }, "catch": function _catch(tryLoc) { for (var i = this.tryEntries.length - 1; i >= 0; --i) { var entry = this.tryEntries[i]; if (entry.tryLoc === tryLoc) { var record = entry.completion; if ("throw" === record.type) { var thrown = record.arg; resetTryEntry(entry); } return thrown; } } throw new Error("illegal catch attempt"); }, delegateYield: function delegateYield(iterable, resultName, nextLoc) { return this.delegate = { iterator: values(iterable), resultName: resultName, nextLoc: nextLoc }, "next" === this.method && (this.arg = undefined), ContinueSentinel; } }, exports; }
	function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); enumerableOnly && (symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; })), keys.push.apply(keys, symbols); } return keys; }
	function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = null != arguments[i] ? arguments[i] : {}; i % 2 ? ownKeys(Object(source), !0).forEach(function (key) { babelHelpers.defineProperty(target, key, source[key]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } return target; }
	function _classPrivateMethodInitSpec(obj, privateSet) { _checkPrivateRedeclaration(obj, privateSet); privateSet.add(obj); }
	function _classPrivateFieldInitSpec(obj, privateMap, value) { _checkPrivateRedeclaration(obj, privateMap); privateMap.set(obj, value); }
	function _checkPrivateRedeclaration(obj, privateCollection) { if (privateCollection.has(obj)) { throw new TypeError("Cannot initialize the same private elements twice on an object"); } }
	function _classPrivateMethodGet(receiver, privateSet, fn) { if (!privateSet.has(receiver)) { throw new TypeError("attempted to get private field on non-instance"); } return fn; }
	var namespaceCrmWhatsNew = main_core.Reflection.namespace('BX.Crm.WhatsNew');
	var _slides = /*#__PURE__*/new WeakMap();
	var _steps = /*#__PURE__*/new WeakMap();
	var _options = /*#__PURE__*/new WeakMap();
	var _popup = /*#__PURE__*/new WeakMap();
	var _bannerDispatcher = /*#__PURE__*/new WeakMap();
	var _closeOptionName = /*#__PURE__*/new WeakMap();
	var _closeOptionCategory = /*#__PURE__*/new WeakMap();
	var _isViewHappened = /*#__PURE__*/new WeakMap();
	var _autoscroll = /*#__PURE__*/new WeakMap();
	var _prepareSlides = /*#__PURE__*/new WeakSet();
	var _getPreparedSlideHtml = /*#__PURE__*/new WeakSet();
	var _getBannerDispatcher = /*#__PURE__*/new WeakSet();
	var _getPrepareSlideButtons = /*#__PURE__*/new WeakSet();
	var _prepareSteps = /*#__PURE__*/new WeakSet();
	var _showStepByEvent = /*#__PURE__*/new WeakSet();
	var _runGuideWithBannerDispatcher = /*#__PURE__*/new WeakSet();
	var _onGuideFinish = /*#__PURE__*/new WeakSet();
	var _runGuide = /*#__PURE__*/new WeakSet();
	var _getAvailableTarget = /*#__PURE__*/new WeakSet();
	var _getDefaultStepEventName = /*#__PURE__*/new WeakSet();
	var _isMultipleViewsAllowed = /*#__PURE__*/new WeakSet();
	var _showHelpDesk = /*#__PURE__*/new WeakSet();
	var _executeWhatsNew = /*#__PURE__*/new WeakSet();
	var _executeGuide = /*#__PURE__*/new WeakSet();
	var _isAnyPopupShown = /*#__PURE__*/new WeakSet();
	var _showGuide = /*#__PURE__*/new WeakSet();
	var _onBeforeShow = /*#__PURE__*/new WeakSet();
	var _isVisibleTargetNode = /*#__PURE__*/new WeakSet();
	var _getTargetNodeScrollTop = /*#__PURE__*/new WeakSet();
	var _scrollToWithPromise = /*#__PURE__*/new WeakSet();
	var ActionViewMode = /*#__PURE__*/function () {
	  function ActionViewMode(_ref) {
	    var slides = _ref.slides,
	      _steps2 = _ref.steps,
	      _options2 = _ref.options,
	      closeOptionCategory = _ref.closeOptionCategory,
	      closeOptionName = _ref.closeOptionName;
	    babelHelpers.classCallCheck(this, ActionViewMode);
	    _classPrivateMethodInitSpec(this, _scrollToWithPromise);
	    _classPrivateMethodInitSpec(this, _getTargetNodeScrollTop);
	    _classPrivateMethodInitSpec(this, _isVisibleTargetNode);
	    _classPrivateMethodInitSpec(this, _onBeforeShow);
	    _classPrivateMethodInitSpec(this, _showGuide);
	    _classPrivateMethodInitSpec(this, _isAnyPopupShown);
	    _classPrivateMethodInitSpec(this, _executeGuide);
	    _classPrivateMethodInitSpec(this, _executeWhatsNew);
	    _classPrivateMethodInitSpec(this, _showHelpDesk);
	    _classPrivateMethodInitSpec(this, _isMultipleViewsAllowed);
	    _classPrivateMethodInitSpec(this, _getDefaultStepEventName);
	    _classPrivateMethodInitSpec(this, _getAvailableTarget);
	    _classPrivateMethodInitSpec(this, _runGuide);
	    _classPrivateMethodInitSpec(this, _onGuideFinish);
	    _classPrivateMethodInitSpec(this, _runGuideWithBannerDispatcher);
	    _classPrivateMethodInitSpec(this, _showStepByEvent);
	    _classPrivateMethodInitSpec(this, _prepareSteps);
	    _classPrivateMethodInitSpec(this, _getPrepareSlideButtons);
	    _classPrivateMethodInitSpec(this, _getBannerDispatcher);
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
	    _classPrivateFieldInitSpec(this, _bannerDispatcher, {
	      writable: true,
	      value: null
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
	    _classPrivateFieldInitSpec(this, _autoscroll, {
	      writable: true,
	      value: null
	    });
	    babelHelpers.classPrivateFieldSet(this, _slides, []);
	    babelHelpers.classPrivateFieldSet(this, _steps, []);
	    babelHelpers.classPrivateFieldSet(this, _options, _options2);
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
	      var _babelHelpers$classPr,
	        _this = this;
	      var guide = new Guide({
	        onEvents: onEvents,
	        canShowWithoutTarget: (_babelHelpers$classPr = babelHelpers.classPrivateFieldGet(this, _options).canShowWithoutTarget) !== null && _babelHelpers$classPr !== void 0 ? _babelHelpers$classPr : false,
	        steps: steps.map(function (step) {
	          var _step$buttons;
	          var highlighter = null;
	          if (main_core.Type.isPlainObject(step.highlighter)) {
	            highlighter = step.highlighter;
	            // eslint-disable-next-line no-param-reassign
	            delete step.highlighter;
	          }
	          if (main_core.Type.isPlainObject(step.autoscroll)) {
	            babelHelpers.classPrivateFieldSet(_this, _autoscroll, step.autoscroll);
	            // eslint-disable-next-line no-param-reassign
	            delete step.autoscroll;
	          }
	          return _objectSpread(_objectSpread({}, step), {}, {
	            // why here and not in prepareSteps?
	            // we need a guide instance reference
	            buttons: (_step$buttons = step.buttons) === null || _step$buttons === void 0 ? void 0 : _step$buttons.map(function (button) {
	              return {
	                text: button.text,
	                event: function event() {
	                  var _button$onclick, _button$onclick2;
	                  if (main_core.Type.isStringFilled((_button$onclick = button.onclick) === null || _button$onclick === void 0 ? void 0 : _button$onclick.code)) {
	                    // eslint-disable-next-line no-eval
	                    eval(button.onclick.code);
	                  }
	                  if ((_button$onclick2 = button.onclick) !== null && _button$onclick2 !== void 0 && _button$onclick2.closeAfterClick) {
	                    guide.close();
	                  }
	                }
	              };
	            }),
	            events: {
	              onShow: function onShow(event) {
	                var data = event.data;
	                if (!data) {
	                  return;
	                }

	                // custom air design for single step tours. Remove after ui implemented
	                if (data.guide.steps.length === 1) {
	                  var airClassList = 'crm-whats-new-slide-air';
	                  if (main_core.Type.isArrayFilled(data.guide.steps[0].buttons)) {
	                    airClassList += ' --with-buttons';
	                  }
	                  if (main_core.Type.isStringFilled(data.guide.steps[0].iconSrc)) {
	                    airClassList += ' --with-icon';
	                  }
	                  main_core.Dom.addClass(data.guide.getPopup().getPopupContainer(), airClassList);
	                }
	                if (!highlighter) {
	                  return;
	                }
	                void BX.Runtime.loadExtension('ui.system.highlighter').then(function () {
	                  document.querySelectorAll(highlighter.target).forEach(function (item) {
	                    var element = main_core.Tag.render(_templateObject || (_templateObject = babelHelpers.taggedTemplateLiteral(["<span class=\"ui-highlighter\"></span>"])));
	                    if (main_core.Type.isNumber(highlighter.radius)) {
	                      main_core.Dom.style(element, '--ui-highlighter-radius', "".concat(highlighter.radius, "px"));
	                    }
	                    main_core.Dom.append(element, item);
	                  });
	                });
	              },
	              onClose: function onClose() {
	                if (!highlighter) {
	                  return;
	                }
	                document.querySelectorAll(highlighter.target).forEach(function (item) {
	                  main_core.Dom.remove(item.querySelector('.ui-highlighter'));
	                });
	              }
	            }
	          });
	        }),
	        events: {
	          onFinish: function onFinish() {
	            if (babelHelpers.classPrivateFieldGet(_this, _slides).length === 0) {
	              _this.save();
	            }
	          }
	        }
	      });
	      return guide;
	    }
	  }, {
	    key: "setStepPopupOptions",
	    value: function setStepPopupOptions(popup) {
	      var _steps$popup;
	      var _babelHelpers$classPr2 = babelHelpers.classPrivateFieldGet(this, _options),
	        steps = _babelHelpers$classPr2.steps,
	        _babelHelpers$classPr3 = _babelHelpers$classPr2.hideTourOnMissClick,
	        hideTourOnMissClick = _babelHelpers$classPr3 === void 0 ? false : _babelHelpers$classPr3;
	      popup.setAutoHide(hideTourOnMissClick);
	      if (steps !== null && steps !== void 0 && (_steps$popup = steps.popup) !== null && _steps$popup !== void 0 && _steps$popup.width) {
	        popup.setWidth(steps.popup.width);
	      }
	    }
	  }, {
	    key: "save",
	    value: function save() {
	      var _babelHelpers$classPr4,
	        _babelHelpers$classPr5,
	        _this2 = this;
	      main_core.ajax.runAction('crm.settings.tour.updateOption', {
	        json: {
	          category: babelHelpers.classPrivateFieldGet(this, _closeOptionCategory),
	          name: babelHelpers.classPrivateFieldGet(this, _closeOptionName),
	          options: {
	            isMultipleViewsAllowed: !babelHelpers.classPrivateFieldGet(this, _isViewHappened) && _classPrivateMethodGet(this, _isMultipleViewsAllowed, _isMultipleViewsAllowed2).call(this),
	            numberOfViewsLimit: (_babelHelpers$classPr4 = babelHelpers.classPrivateFieldGet(this, _options).numberOfViewsLimit) !== null && _babelHelpers$classPr4 !== void 0 ? _babelHelpers$classPr4 : 1,
	            additionalTourIdsForDisable: (_babelHelpers$classPr5 = babelHelpers.classPrivateFieldGet(this, _options).additionalTourIdsForDisable) !== null && _babelHelpers$classPr5 !== void 0 ? _babelHelpers$classPr5 : null
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
	  var slide = main_core.Tag.render(_templateObject2 || (_templateObject2 = babelHelpers.taggedTemplateLiteral(["\n\t\t\t<div class=\"crm-whats-new-slide\">\n\t\t\t\t<img src=\"", "\" alt=\"\">\n\t\t\t\t<div class=\"crm-whats-new-slide-inner-title\"> ", " </div>\n\t\t\t\t<p>", "</p>\n\t\t\t</div>\n\t\t"])), slideConfig.innerImage, slideConfig.innerTitle, slideConfig.innerDescription);
	  var buttons = _classPrivateMethodGet(this, _getPrepareSlideButtons, _getPrepareSlideButtons2).call(this, slideConfig);
	  if (buttons.length > 0) {
	    var buttonsContainer = main_core.Tag.render(_templateObject3 || (_templateObject3 = babelHelpers.taggedTemplateLiteral(["<div class=\"crm-whats-new-slide-buttons\"></div>"])));
	    main_core.Dom.append(buttonsContainer, slide);
	    buttons.forEach(function (button) {
	      main_core.Dom.append(button.getContainer(), buttonsContainer);
	    });
	  }
	  return slide;
	}
	function _getBannerDispatcher2() {
	  return _getBannerDispatcher3.apply(this, arguments);
	}
	function _getBannerDispatcher3() {
	  _getBannerDispatcher3 = babelHelpers.asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee() {
	    var _yield$Runtime$loadEx, Dispatcher;
	    return _regeneratorRuntime().wrap(function _callee$(_context) {
	      while (1) switch (_context.prev = _context.next) {
	        case 0:
	          if (!babelHelpers.classPrivateFieldGet(this, _bannerDispatcher)) {
	            _context.next = 2;
	            break;
	          }
	          return _context.abrupt("return", babelHelpers.classPrivateFieldGet(this, _bannerDispatcher));
	        case 2:
	          _context.next = 4;
	          return main_core.Runtime.loadExtension('crm.integration.ui.banner-dispatcher');
	        case 4:
	          _yield$Runtime$loadEx = _context.sent;
	          Dispatcher = _yield$Runtime$loadEx.BannerDispatcher;
	          babelHelpers.classPrivateFieldSet(this, _bannerDispatcher, new Dispatcher());
	          return _context.abrupt("return", babelHelpers.classPrivateFieldGet(this, _bannerDispatcher));
	        case 8:
	        case "end":
	          return _context.stop();
	      }
	    }, _callee, this);
	  }));
	  return _getBannerDispatcher3.apply(this, arguments);
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
	  babelHelpers.classPrivateFieldSet(this, _steps, stepsConfig.map(function (stepConfig) {
	    var _stepConfig$articleAn, _stepConfig$highlight, _stepConfig$autoscrol, _stepConfig$iconSrc;
	    var step = {
	      id: stepConfig.id,
	      title: stepConfig.title,
	      text: stepConfig.text,
	      position: stepConfig.position,
	      article: stepConfig.article,
	      articleAnchor: (_stepConfig$articleAn = stepConfig.articleAnchor) !== null && _stepConfig$articleAn !== void 0 ? _stepConfig$articleAn : null,
	      infoHelperCode: stepConfig.infoHelperCode,
	      buttons: stepConfig.buttons,
	      highlighter: (_stepConfig$highlight = stepConfig.highlighter) !== null && _stepConfig$highlight !== void 0 ? _stepConfig$highlight : null,
	      autoscroll: (_stepConfig$autoscrol = stepConfig.autoscroll) !== null && _stepConfig$autoscrol !== void 0 ? _stepConfig$autoscrol : null,
	      iconSrc: (_stepConfig$iconSrc = stepConfig.iconSrc) !== null && _stepConfig$iconSrc !== void 0 ? _stepConfig$iconSrc : null
	    };
	    if (stepConfig.useDynamicTarget) {
	      var _stepConfig$eventName;
	      var eventName = (_stepConfig$eventName = stepConfig.eventName) !== null && _stepConfig$eventName !== void 0 ? _stepConfig$eventName : _classPrivateMethodGet(_this5, _getDefaultStepEventName, _getDefaultStepEventName2).call(_this5, step.id);
	      main_core_events.EventEmitter.subscribeOnce(eventName, _classPrivateMethodGet(_this5, _showStepByEvent, _showStepByEvent2).bind(_this5));
	    } else {
	      var target = _classPrivateMethodGet(_this5, _getAvailableTarget, _getAvailableTarget2).call(_this5, stepConfig.target);
	      if (target && main_core.Dom.style(target, 'display') !== 'none') {
	        step.target = stepConfig.target;
	      } else if (main_core.Type.isArrayFilled(stepConfig.reserveTargets)) {
	        var isFound = stepConfig.reserveTargets.some(function (reserveTarget) {
	          var reserveTargetElement = _classPrivateMethodGet(_this5, _getAvailableTarget, _getAvailableTarget2).call(_this5, reserveTarget);
	          if (reserveTargetElement && main_core.Dom.style(reserveTargetElement, 'display') !== 'none') {
	            step.target = reserveTarget;
	            return true;
	          }
	          return false;
	        });
	        if (!isFound && stepConfig.ignoreIfTargetNotFound) {
	          return null;
	        }
	      } else if (stepConfig.ignoreIfTargetNotFound) {
	        return null;
	      } else {
	        step.target = stepConfig.target;
	      }
	    }
	    return step;
	  }));
	  babelHelpers.classPrivateFieldSet(this, _steps, babelHelpers.classPrivateFieldGet(this, _steps).filter(function (step) {
	    return step !== null;
	  }));
	  if (babelHelpers.classPrivateFieldGet(this, _steps).length > 0) {
	    this.tourPromise = main_core.Runtime.loadExtension('ui.tour');
	  }
	}
	function _showStepByEvent2(event) {
	  var _this6 = this;
	  var _babelHelpers$classPr6 = babelHelpers.classPrivateFieldGet(this, _options),
	    _babelHelpers$classPr7 = _babelHelpers$classPr6.disableBannerDispatcher,
	    disableBannerDispatcher = _babelHelpers$classPr7 === void 0 ? false : _babelHelpers$classPr7;
	  void this.tourPromise.then(function (exports) {
	    var _event$data = event.data,
	      stepId = _event$data.stepId,
	      target = _event$data.target;
	    // eslint-disable-next-line no-shadow
	    var step = babelHelpers.classPrivateFieldGet(_this6, _steps).find(function (step) {
	      return step.id === stepId;
	    });
	    if (!step) {
	      console.error('step not found');
	      return;
	    }
	    step.target = target;
	    var Guide = exports.Guide;
	    var guide = _this6.createGuideInstance(Guide, [step], true);
	    _this6.setStepPopupOptions(guide.getPopup());
	    if (disableBannerDispatcher === false) {
	      _classPrivateMethodGet(_this6, _runGuideWithBannerDispatcher, _runGuideWithBannerDispatcher2).call(_this6, guide);
	    } else {
	      _classPrivateMethodGet(_this6, _runGuide, _runGuide2).call(_this6, guide);
	    }
	  });
	}
	function _runGuideWithBannerDispatcher2(guide) {
	  var _this7 = this;
	  void _classPrivateMethodGet(this, _getBannerDispatcher, _getBannerDispatcher2).call(this).then(function (dispatcher) {
	    dispatcher.toQueue(function (onDone) {
	      _classPrivateMethodGet(_this7, _runGuide, _runGuide2).call(_this7, guide, onDone);
	    });
	  });
	}
	function _onGuideFinish2(guide) {
	  var _this8 = this;
	  var onDone = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;
	  guide.subscribe('UI.Tour.Guide:onFinish', function () {
	    _this8.save();
	    if (onDone) {
	      onDone();
	    }
	  });
	}
	function _runGuide2(guide) {
	  var onDone = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;
	  var canShowGuide = !_classPrivateMethodGet(this, _isAnyPopupShown, _isAnyPopupShown2).call(this);
	  var target = guide.steps[0].target;
	  if (canShowGuide && main_core.Type.isStringFilled(target)) {
	    canShowGuide = _classPrivateMethodGet(this, _getAvailableTarget, _getAvailableTarget2).call(this, target) !== null;
	  }
	  if (canShowGuide) {
	    _classPrivateMethodGet(this, _onGuideFinish, _onGuideFinish2).call(this, guide, onDone);
	    void _classPrivateMethodGet(this, _onBeforeShow, _onBeforeShow2).call(this, guide).then(function () {
	      guide.showNextStep();
	    });
	  } else {
	    onDone();
	  }
	}
	function _getAvailableTarget2(target) {
	  if (!main_core.Type.isStringFilled(target)) {
	    return null;
	  }
	  var targetNode = document.querySelector(target);
	  return main_core.Type.isDomNode(targetNode) ? targetNode : null;
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
	  var _this9 = this;
	  var _babelHelpers$classPr8 = babelHelpers.classPrivateFieldGet(this, _options),
	    _babelHelpers$classPr9 = _babelHelpers$classPr8.disableBannerDispatcher,
	    disableBannerDispatcher = _babelHelpers$classPr9 === void 0 ? false : _babelHelpers$classPr9;
	  if (_classPrivateMethodGet(this, _isAnyPopupShown, _isAnyPopupShown2).call(this)) {
	    return;
	  }
	  void this.whatNewPromise.then(function (exports) {
	    var WhatsNew = exports.WhatsNew;
	    babelHelpers.classPrivateFieldSet(_this9, _popup, new WhatsNew({
	      slides: babelHelpers.classPrivateFieldGet(_this9, _slides),
	      popupOptions: {
	        height: 440
	      },
	      events: {
	        onDestroy: function onDestroy() {
	          _this9.save();
	          _classPrivateMethodGet(_this9, _executeGuide, _executeGuide2).call(_this9, false);
	        }
	      }
	    }));
	    if (disableBannerDispatcher === false) {
	      // eslint-disable-next-line promise/no-nesting
	      void _classPrivateMethodGet(_this9, _getBannerDispatcher, _getBannerDispatcher2).call(_this9).then(function (dispatcher) {
	        dispatcher.toQueue(function (onDone) {
	          babelHelpers.classPrivateFieldGet(_this9, _popup).subscribe('onDestroy', onDone);
	          babelHelpers.classPrivateFieldGet(_this9, _popup).show();
	        });
	      });
	    } else {
	      babelHelpers.classPrivateFieldGet(_this9, _popup).show();
	    }
	    ActionViewMode.whatsNewInstances.push(babelHelpers.classPrivateFieldGet(_this9, _popup));
	  }, this);
	}
	function _executeGuide2() {
	  var _this10 = this;
	  var isAddToQueue = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : true;
	  var _babelHelpers$classPr10 = babelHelpers.classPrivateFieldGet(this, _options),
	    _babelHelpers$classPr11 = _babelHelpers$classPr10.disableBannerDispatcher,
	    disableBannerDispatcher = _babelHelpers$classPr11 === void 0 ? false : _babelHelpers$classPr11;
	  var steps = main_core.clone(babelHelpers.classPrivateFieldGet(this, _steps));
	  steps = steps.filter(function (step) {
	    return Boolean(step.target);
	  });
	  if (steps.length === 0) {
	    return;
	  }
	  void this.tourPromise.then(function (exports) {
	    if (ActionViewMode.tourInstances.some(function (existedGuide) {
	      var _existedGuide$getPopu;
	      return (_existedGuide$getPopu = existedGuide.getPopup()) === null || _existedGuide$getPopu === void 0 ? void 0 : _existedGuide$getPopu.isShown();
	    })) {
	      return; // do not allow many guides at the same time
	    }

	    if (_classPrivateMethodGet(_this10, _isAnyPopupShown, _isAnyPopupShown2).call(_this10)) {
	      return;
	    }
	    var Guide = exports.Guide;
	    var guide = _this10.createGuideInstance(Guide, steps, babelHelpers.classPrivateFieldGet(_this10, _steps).length <= 1);
	    ActionViewMode.tourInstances.push(guide);
	    _this10.setStepPopupOptions(guide.getPopup());
	    if (isAddToQueue) {
	      if (disableBannerDispatcher === false) {
	        _classPrivateMethodGet(_this10, _runGuideWithBannerDispatcher, _runGuideWithBannerDispatcher2).call(_this10, guide);
	      } else {
	        _classPrivateMethodGet(_this10, _runGuide, _runGuide2).call(_this10, guide);
	      }
	      return;
	    }
	    _classPrivateMethodGet(_this10, _showGuide, _showGuide2).call(_this10, guide);
	  });
	}
	function _isAnyPopupShown2() {
	  return main_popup.PopupManager === null || main_popup.PopupManager === void 0 ? void 0 : main_popup.PopupManager.isAnyPopupShown();
	}
	function _showGuide2(guide) {
	  if (guide.steps.length > 1 || babelHelpers.classPrivateFieldGet(this, _options).showOverlayFromFirstStep) {
	    guide.start();
	  } else {
	    guide.showNextStep();
	  }
	}
	function _onBeforeShow2(guide) {
	  var _this11 = this;
	  if (!main_core.Type.isPlainObject(babelHelpers.classPrivateFieldGet(this, _autoscroll))) {
	    return Promise.resolve();
	  }
	  var step = guide.steps[0];
	  var targetNode = _classPrivateMethodGet(this, _getAvailableTarget, _getAvailableTarget2).call(this, step.target);
	  if (targetNode === null || _classPrivateMethodGet(this, _isVisibleTargetNode, _isVisibleTargetNode2).call(this, targetNode)) {
	    return Promise.resolve();
	  }
	  var parentScrolledContainer = window;
	  var parent = targetNode.parentElement;
	  while (parent) {
	    var style = window.getComputedStyle(parent);
	    var overflowY = style.overflowY;
	    if ((overflowY === 'auto' || overflowY === 'scroll') && parent.scrollHeight >= parent.clientHeight) {
	      parentScrolledContainer = parent;
	      break;
	    }
	    parent = parent.parentElement;
	  }
	  return new Promise(function (resolve) {
	    var scrollTop = _classPrivateMethodGet(_this11, _getTargetNodeScrollTop, _getTargetNodeScrollTop2).call(_this11, targetNode, parentScrolledContainer);
	    if (babelHelpers.classPrivateFieldGet(_this11, _autoscroll).behavior === 'smooth' && 'scrollTo' in parentScrolledContainer) {
	      void _classPrivateMethodGet(_this11, _scrollToWithPromise, _scrollToWithPromise2).call(_this11, parentScrolledContainer, {
	        top: scrollTop,
	        behavior: 'smooth'
	      }).then(function () {
	        resolve();
	      });
	    } else {
	      parent.scrollTop = scrollTop;
	      guide.getPopup().adjustPosition({
	        forceBindPosition: true
	      });
	      resolve();
	    }
	  });
	}
	function _isVisibleTargetNode2(targetNode) {
	  var rect = targetNode.getBoundingClientRect();
	  return rect.top >= 0 && rect.left >= 0 && rect.bottom >= 0 && rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) - 200 && rect.right <= (window.innerWidth || document.documentElement.clientWidth) - 200;
	}
	function _getTargetNodeScrollTop2(targetNode, parentScrolledContainer) {
	  var _babelHelpers$classPr12;
	  var elementTop = targetNode.offsetTop;
	  var elementHeight = targetNode.offsetHeight;
	  var containerHeight = parentScrolledContainer.clientHeight;
	  var block = (_babelHelpers$classPr12 = babelHelpers.classPrivateFieldGet(this, _autoscroll).position) !== null && _babelHelpers$classPr12 !== void 0 ? _babelHelpers$classPr12 : 'auto';
	  var getMaxScrollTop = function getMaxScrollTop(scrollTop) {
	    return Math.max(0, Math.min(scrollTop, parentScrolledContainer.scrollHeight - containerHeight));
	  };
	  var scrollTop = parentScrolledContainer.scrollTop;
	  if (block === 'start') {
	    return getMaxScrollTop(elementTop);
	  }
	  if (block === 'center') {
	    return getMaxScrollTop(elementTop + elementHeight / 2 - containerHeight / 2);
	  }
	  if (block === 'end') {
	    return getMaxScrollTop(elementTop + elementHeight - containerHeight);
	  }
	  var currentViewTop = parentScrolledContainer.scrollTop;
	  var currentViewBottom = currentViewTop + containerHeight;
	  if (elementTop < currentViewTop) {
	    scrollTop = elementTop;
	  } else if (elementTop + elementHeight > currentViewBottom) {
	    scrollTop = elementTop + elementHeight - containerHeight;
	  }
	  return getMaxScrollTop(scrollTop);
	}
	function _scrollToWithPromise2(element, options) {
	  return new Promise(function (resolve) {
	    var _options$top, _options$left, _options$behavior;
	    var targetTop = (_options$top = options.top) !== null && _options$top !== void 0 ? _options$top : element.scrollTop;
	    var targetLeft = (_options$left = options.left) !== null && _options$left !== void 0 ? _options$left : element.scrollLeft;
	    var behavior = (_options$behavior = options.behavior) !== null && _options$behavior !== void 0 ? _options$behavior : 'auto';
	    var tolerance = 1;
	    if (behavior === 'auto') {
	      element.scrollTo(options);
	      resolve();
	      return;
	    }
	    var lastTop = element.scrollTop;
	    var lastLeft = element.scrollLeft;
	    var stationaryFrames = 0;
	    var isClose = function isClose(a, b) {
	      return Math.abs(a - b) <= tolerance;
	    };
	    var checkScrollEnd = function checkScrollEnd() {
	      var currentTop = element.scrollTop;
	      var currentLeft = element.scrollLeft;
	      var reachedTarget = isClose(currentTop, targetTop) && isClose(currentLeft, targetLeft);
	      var stoppedMoving = isClose(currentTop, lastTop) && isClose(currentLeft, lastLeft);
	      if (reachedTarget && stoppedMoving) {
	        stationaryFrames++;
	        if (stationaryFrames >= 2) {
	          resolve();
	          return;
	        }
	      } else {
	        stationaryFrames = 0;
	      }
	      lastTop = currentTop;
	      lastLeft = currentLeft;
	      requestAnimationFrame(checkScrollEnd);
	    };
	    element.scrollTo(options);
	    requestAnimationFrame(checkScrollEnd);
	  });
	}
	babelHelpers.defineProperty(ActionViewMode, "tourInstances", []);
	babelHelpers.defineProperty(ActionViewMode, "whatsNewInstances", []);
	namespaceCrmWhatsNew.ActionViewMode = ActionViewMode;

}((this.window = this.window || {}),BX.Crm.Integration.UI,BX,BX.Event,BX.Main,BX.UI,BX.UI.Tour));
//# sourceMappingURL=script.js.map
