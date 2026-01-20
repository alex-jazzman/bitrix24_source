/* eslint-disable */
this.BX = this.BX || {};
this.BX.Crm = this.BX.Crm || {};
this.BX.Crm.Grid = this.BX.Crm.Grid || {};
(function (exports,main_core) {
	'use strict';

	var _templateObject, _templateObject2, _templateObject3;
	function _regeneratorRuntime() { /*! regenerator-runtime -- Copyright (c) 2014-present, Facebook, Inc. -- license (MIT): https://github.com/facebook/regenerator/blob/main/LICENSE */ _regeneratorRuntime = function _regeneratorRuntime() { return exports; }; var exports = {}, Op = Object.prototype, hasOwn = Op.hasOwnProperty, defineProperty = Object.defineProperty || function (obj, key, desc) { obj[key] = desc.value; }, $Symbol = "function" == typeof Symbol ? Symbol : {}, iteratorSymbol = $Symbol.iterator || "@@iterator", asyncIteratorSymbol = $Symbol.asyncIterator || "@@asyncIterator", toStringTagSymbol = $Symbol.toStringTag || "@@toStringTag"; function define(obj, key, value) { return Object.defineProperty(obj, key, { value: value, enumerable: !0, configurable: !0, writable: !0 }), obj[key]; } try { define({}, ""); } catch (err) { define = function define(obj, key, value) { return obj[key] = value; }; } function wrap(innerFn, outerFn, self, tryLocsList) { var protoGenerator = outerFn && outerFn.prototype instanceof Generator ? outerFn : Generator, generator = Object.create(protoGenerator.prototype), context = new Context(tryLocsList || []); return defineProperty(generator, "_invoke", { value: makeInvokeMethod(innerFn, self, context) }), generator; } function tryCatch(fn, obj, arg) { try { return { type: "normal", arg: fn.call(obj, arg) }; } catch (err) { return { type: "throw", arg: err }; } } exports.wrap = wrap; var ContinueSentinel = {}; function Generator() {} function GeneratorFunction() {} function GeneratorFunctionPrototype() {} var IteratorPrototype = {}; define(IteratorPrototype, iteratorSymbol, function () { return this; }); var getProto = Object.getPrototypeOf, NativeIteratorPrototype = getProto && getProto(getProto(values([]))); NativeIteratorPrototype && NativeIteratorPrototype !== Op && hasOwn.call(NativeIteratorPrototype, iteratorSymbol) && (IteratorPrototype = NativeIteratorPrototype); var Gp = GeneratorFunctionPrototype.prototype = Generator.prototype = Object.create(IteratorPrototype); function defineIteratorMethods(prototype) { ["next", "throw", "return"].forEach(function (method) { define(prototype, method, function (arg) { return this._invoke(method, arg); }); }); } function AsyncIterator(generator, PromiseImpl) { function invoke(method, arg, resolve, reject) { var record = tryCatch(generator[method], generator, arg); if ("throw" !== record.type) { var result = record.arg, value = result.value; return value && "object" == babelHelpers["typeof"](value) && hasOwn.call(value, "__await") ? PromiseImpl.resolve(value.__await).then(function (value) { invoke("next", value, resolve, reject); }, function (err) { invoke("throw", err, resolve, reject); }) : PromiseImpl.resolve(value).then(function (unwrapped) { result.value = unwrapped, resolve(result); }, function (error) { return invoke("throw", error, resolve, reject); }); } reject(record.arg); } var previousPromise; defineProperty(this, "_invoke", { value: function value(method, arg) { function callInvokeWithMethodAndArg() { return new PromiseImpl(function (resolve, reject) { invoke(method, arg, resolve, reject); }); } return previousPromise = previousPromise ? previousPromise.then(callInvokeWithMethodAndArg, callInvokeWithMethodAndArg) : callInvokeWithMethodAndArg(); } }); } function makeInvokeMethod(innerFn, self, context) { var state = "suspendedStart"; return function (method, arg) { if ("executing" === state) throw new Error("Generator is already running"); if ("completed" === state) { if ("throw" === method) throw arg; return doneResult(); } for (context.method = method, context.arg = arg;;) { var delegate = context.delegate; if (delegate) { var delegateResult = maybeInvokeDelegate(delegate, context); if (delegateResult) { if (delegateResult === ContinueSentinel) continue; return delegateResult; } } if ("next" === context.method) context.sent = context._sent = context.arg;else if ("throw" === context.method) { if ("suspendedStart" === state) throw state = "completed", context.arg; context.dispatchException(context.arg); } else "return" === context.method && context.abrupt("return", context.arg); state = "executing"; var record = tryCatch(innerFn, self, context); if ("normal" === record.type) { if (state = context.done ? "completed" : "suspendedYield", record.arg === ContinueSentinel) continue; return { value: record.arg, done: context.done }; } "throw" === record.type && (state = "completed", context.method = "throw", context.arg = record.arg); } }; } function maybeInvokeDelegate(delegate, context) { var methodName = context.method, method = delegate.iterator[methodName]; if (undefined === method) return context.delegate = null, "throw" === methodName && delegate.iterator["return"] && (context.method = "return", context.arg = undefined, maybeInvokeDelegate(delegate, context), "throw" === context.method) || "return" !== methodName && (context.method = "throw", context.arg = new TypeError("The iterator does not provide a '" + methodName + "' method")), ContinueSentinel; var record = tryCatch(method, delegate.iterator, context.arg); if ("throw" === record.type) return context.method = "throw", context.arg = record.arg, context.delegate = null, ContinueSentinel; var info = record.arg; return info ? info.done ? (context[delegate.resultName] = info.value, context.next = delegate.nextLoc, "return" !== context.method && (context.method = "next", context.arg = undefined), context.delegate = null, ContinueSentinel) : info : (context.method = "throw", context.arg = new TypeError("iterator result is not an object"), context.delegate = null, ContinueSentinel); } function pushTryEntry(locs) { var entry = { tryLoc: locs[0] }; 1 in locs && (entry.catchLoc = locs[1]), 2 in locs && (entry.finallyLoc = locs[2], entry.afterLoc = locs[3]), this.tryEntries.push(entry); } function resetTryEntry(entry) { var record = entry.completion || {}; record.type = "normal", delete record.arg, entry.completion = record; } function Context(tryLocsList) { this.tryEntries = [{ tryLoc: "root" }], tryLocsList.forEach(pushTryEntry, this), this.reset(!0); } function values(iterable) { if (iterable) { var iteratorMethod = iterable[iteratorSymbol]; if (iteratorMethod) return iteratorMethod.call(iterable); if ("function" == typeof iterable.next) return iterable; if (!isNaN(iterable.length)) { var i = -1, next = function next() { for (; ++i < iterable.length;) if (hasOwn.call(iterable, i)) return next.value = iterable[i], next.done = !1, next; return next.value = undefined, next.done = !0, next; }; return next.next = next; } } return { next: doneResult }; } function doneResult() { return { value: undefined, done: !0 }; } return GeneratorFunction.prototype = GeneratorFunctionPrototype, defineProperty(Gp, "constructor", { value: GeneratorFunctionPrototype, configurable: !0 }), defineProperty(GeneratorFunctionPrototype, "constructor", { value: GeneratorFunction, configurable: !0 }), GeneratorFunction.displayName = define(GeneratorFunctionPrototype, toStringTagSymbol, "GeneratorFunction"), exports.isGeneratorFunction = function (genFun) { var ctor = "function" == typeof genFun && genFun.constructor; return !!ctor && (ctor === GeneratorFunction || "GeneratorFunction" === (ctor.displayName || ctor.name)); }, exports.mark = function (genFun) { return Object.setPrototypeOf ? Object.setPrototypeOf(genFun, GeneratorFunctionPrototype) : (genFun.__proto__ = GeneratorFunctionPrototype, define(genFun, toStringTagSymbol, "GeneratorFunction")), genFun.prototype = Object.create(Gp), genFun; }, exports.awrap = function (arg) { return { __await: arg }; }, defineIteratorMethods(AsyncIterator.prototype), define(AsyncIterator.prototype, asyncIteratorSymbol, function () { return this; }), exports.AsyncIterator = AsyncIterator, exports.async = function (innerFn, outerFn, self, tryLocsList, PromiseImpl) { void 0 === PromiseImpl && (PromiseImpl = Promise); var iter = new AsyncIterator(wrap(innerFn, outerFn, self, tryLocsList), PromiseImpl); return exports.isGeneratorFunction(outerFn) ? iter : iter.next().then(function (result) { return result.done ? result.value : iter.next(); }); }, defineIteratorMethods(Gp), define(Gp, toStringTagSymbol, "Generator"), define(Gp, iteratorSymbol, function () { return this; }), define(Gp, "toString", function () { return "[object Generator]"; }), exports.keys = function (val) { var object = Object(val), keys = []; for (var key in object) keys.push(key); return keys.reverse(), function next() { for (; keys.length;) { var key = keys.pop(); if (key in object) return next.value = key, next.done = !1, next; } return next.done = !0, next; }; }, exports.values = values, Context.prototype = { constructor: Context, reset: function reset(skipTempReset) { if (this.prev = 0, this.next = 0, this.sent = this._sent = undefined, this.done = !1, this.delegate = null, this.method = "next", this.arg = undefined, this.tryEntries.forEach(resetTryEntry), !skipTempReset) for (var name in this) "t" === name.charAt(0) && hasOwn.call(this, name) && !isNaN(+name.slice(1)) && (this[name] = undefined); }, stop: function stop() { this.done = !0; var rootRecord = this.tryEntries[0].completion; if ("throw" === rootRecord.type) throw rootRecord.arg; return this.rval; }, dispatchException: function dispatchException(exception) { if (this.done) throw exception; var context = this; function handle(loc, caught) { return record.type = "throw", record.arg = exception, context.next = loc, caught && (context.method = "next", context.arg = undefined), !!caught; } for (var i = this.tryEntries.length - 1; i >= 0; --i) { var entry = this.tryEntries[i], record = entry.completion; if ("root" === entry.tryLoc) return handle("end"); if (entry.tryLoc <= this.prev) { var hasCatch = hasOwn.call(entry, "catchLoc"), hasFinally = hasOwn.call(entry, "finallyLoc"); if (hasCatch && hasFinally) { if (this.prev < entry.catchLoc) return handle(entry.catchLoc, !0); if (this.prev < entry.finallyLoc) return handle(entry.finallyLoc); } else if (hasCatch) { if (this.prev < entry.catchLoc) return handle(entry.catchLoc, !0); } else { if (!hasFinally) throw new Error("try statement without catch or finally"); if (this.prev < entry.finallyLoc) return handle(entry.finallyLoc); } } } }, abrupt: function abrupt(type, arg) { for (var i = this.tryEntries.length - 1; i >= 0; --i) { var entry = this.tryEntries[i]; if (entry.tryLoc <= this.prev && hasOwn.call(entry, "finallyLoc") && this.prev < entry.finallyLoc) { var finallyEntry = entry; break; } } finallyEntry && ("break" === type || "continue" === type) && finallyEntry.tryLoc <= arg && arg <= finallyEntry.finallyLoc && (finallyEntry = null); var record = finallyEntry ? finallyEntry.completion : {}; return record.type = type, record.arg = arg, finallyEntry ? (this.method = "next", this.next = finallyEntry.finallyLoc, ContinueSentinel) : this.complete(record); }, complete: function complete(record, afterLoc) { if ("throw" === record.type) throw record.arg; return "break" === record.type || "continue" === record.type ? this.next = record.arg : "return" === record.type ? (this.rval = this.arg = record.arg, this.method = "return", this.next = "end") : "normal" === record.type && afterLoc && (this.next = afterLoc), ContinueSentinel; }, finish: function finish(finallyLoc) { for (var i = this.tryEntries.length - 1; i >= 0; --i) { var entry = this.tryEntries[i]; if (entry.finallyLoc === finallyLoc) return this.complete(entry.completion, entry.afterLoc), resetTryEntry(entry), ContinueSentinel; } }, "catch": function _catch(tryLoc) { for (var i = this.tryEntries.length - 1; i >= 0; --i) { var entry = this.tryEntries[i]; if (entry.tryLoc === tryLoc) { var record = entry.completion; if ("throw" === record.type) { var thrown = record.arg; resetTryEntry(entry); } return thrown; } } throw new Error("illegal catch attempt"); }, delegateYield: function delegateYield(iterable, resultName, nextLoc) { return this.delegate = { iterator: values(iterable), resultName: resultName, nextLoc: nextLoc }, "next" === this.method && (this.arg = undefined), ContinueSentinel; } }, exports; }
	function _classPrivateMethodInitSpec(obj, privateSet) { _checkPrivateRedeclaration(obj, privateSet); privateSet.add(obj); }
	function _classPrivateFieldInitSpec(obj, privateMap, value) { _checkPrivateRedeclaration(obj, privateMap); privateMap.set(obj, value); }
	function _checkPrivateRedeclaration(obj, privateCollection) { if (privateCollection.has(obj)) { throw new TypeError("Cannot initialize the same private elements twice on an object"); } }
	function _classPrivateMethodGet(receiver, privateSet, fn) { if (!privateSet.has(receiver)) { throw new TypeError("attempted to get private field on non-instance"); } return fn; }
	var _id = /*#__PURE__*/new WeakMap();
	var _name = /*#__PURE__*/new WeakMap();
	var _photoUrl = /*#__PURE__*/new WeakMap();
	var _isSelected = /*#__PURE__*/new WeakMap();
	var _filterFieldName = /*#__PURE__*/new WeakMap();
	var _isSingleUserColumn = /*#__PURE__*/new WeakMap();
	var _isDisabled = /*#__PURE__*/new WeakMap();
	var _filterOptions = /*#__PURE__*/new WeakMap();
	var _filterManager = /*#__PURE__*/new WeakMap();
	var _rootNode = /*#__PURE__*/new WeakMap();
	var _onClick = /*#__PURE__*/new WeakSet();
	var _toggleFilter = /*#__PURE__*/new WeakSet();
	var _reduceFilter = /*#__PURE__*/new WeakSet();
	var _reduceCurrentFieldsValues = /*#__PURE__*/new WeakSet();
	var _extendFilter = /*#__PURE__*/new WeakSet();
	var _extendCurrentFieldsValues = /*#__PURE__*/new WeakSet();
	var _registerFieldToFilter = /*#__PURE__*/new WeakSet();
	var ClickableUser = /*#__PURE__*/function () {
	  function ClickableUser(options) {
	    var _babelHelpers$classPr, _BX$Main$filterManage, _BX$Main, _BX$Main$filterManage2;
	    babelHelpers.classCallCheck(this, ClickableUser);
	    _classPrivateMethodInitSpec(this, _registerFieldToFilter);
	    _classPrivateMethodInitSpec(this, _extendCurrentFieldsValues);
	    _classPrivateMethodInitSpec(this, _extendFilter);
	    _classPrivateMethodInitSpec(this, _reduceCurrentFieldsValues);
	    _classPrivateMethodInitSpec(this, _reduceFilter);
	    _classPrivateMethodInitSpec(this, _toggleFilter);
	    _classPrivateMethodInitSpec(this, _onClick);
	    _classPrivateFieldInitSpec(this, _id, {
	      writable: true,
	      value: void 0
	    });
	    _classPrivateFieldInitSpec(this, _name, {
	      writable: true,
	      value: void 0
	    });
	    _classPrivateFieldInitSpec(this, _photoUrl, {
	      writable: true,
	      value: void 0
	    });
	    _classPrivateFieldInitSpec(this, _isSelected, {
	      writable: true,
	      value: void 0
	    });
	    _classPrivateFieldInitSpec(this, _filterFieldName, {
	      writable: true,
	      value: void 0
	    });
	    _classPrivateFieldInitSpec(this, _isSingleUserColumn, {
	      writable: true,
	      value: void 0
	    });
	    _classPrivateFieldInitSpec(this, _isDisabled, {
	      writable: true,
	      value: void 0
	    });
	    _classPrivateFieldInitSpec(this, _filterOptions, {
	      writable: true,
	      value: void 0
	    });
	    _classPrivateFieldInitSpec(this, _filterManager, {
	      writable: true,
	      value: void 0
	    });
	    _classPrivateFieldInitSpec(this, _rootNode, {
	      writable: true,
	      value: void 0
	    });
	    var rootNode = document.getElementById(options.rootNodeId);
	    if (!rootNode) {
	      throw new Error("Root node with id \"".concat(options.rootNodeId, "\" not found."));
	    }
	    babelHelpers.classPrivateFieldSet(this, _rootNode, rootNode);
	    babelHelpers.classPrivateFieldSet(this, _id, options.id);
	    babelHelpers.classPrivateFieldSet(this, _name, options.name);
	    babelHelpers.classPrivateFieldSet(this, _photoUrl, options.photoUrl);
	    babelHelpers.classPrivateFieldSet(this, _isSelected, options.isSelected);
	    babelHelpers.classPrivateFieldSet(this, _filterFieldName, options.filterFieldId);
	    babelHelpers.classPrivateFieldSet(this, _isSingleUserColumn, options.isSingleUserColumn);
	    babelHelpers.classPrivateFieldSet(this, _filterOptions, (_babelHelpers$classPr = {}, babelHelpers.defineProperty(_babelHelpers$classPr, options.filterFieldId, [options.id]), babelHelpers.defineProperty(_babelHelpers$classPr, "".concat(options.filterFieldId, "_label"), [options.name]), _babelHelpers$classPr));
	    babelHelpers.classPrivateFieldSet(this, _filterManager, (_BX$Main$filterManage = (_BX$Main = BX.Main) === null || _BX$Main === void 0 ? void 0 : (_BX$Main$filterManage2 = _BX$Main.filterManager) === null || _BX$Main$filterManage2 === void 0 ? void 0 : _BX$Main$filterManage2.getById(options.gridId)) !== null && _BX$Main$filterManage !== void 0 ? _BX$Main$filterManage : null);
	    babelHelpers.classPrivateFieldSet(this, _isDisabled, !babelHelpers.classPrivateFieldGet(this, _isSingleUserColumn) || main_core.Type.isNull(babelHelpers.classPrivateFieldGet(this, _filterManager)));
	  }
	  babelHelpers.createClass(ClickableUser, [{
	    key: "render",
	    value: function render() {
	      var imageStyle = babelHelpers.classPrivateFieldGet(this, _photoUrl) === '' ? '' : "background-image: url(".concat(babelHelpers.classPrivateFieldGet(this, _photoUrl), ");");
	      var content = main_core.Tag.render(_templateObject || (_templateObject = babelHelpers.taggedTemplateLiteral(["\n\t\t\t<span class=\"crm-grid-user-avatar ui-icon ui-icon-common-user\">\n\t\t\t\t<i style=\"", "\"></i>\n\t\t\t</span>\n\t\t\t<span class=\"crm-grid-username-inner\">", "</span>\n\t\t\t<span class=\"crm-grid-filter-remove\"></span>\n\t\t"])), imageStyle, babelHelpers.classPrivateFieldGet(this, _name));
	      var contentClass = babelHelpers.classPrivateFieldGet(this, _isSelected) ? 'crm-grid-username crm-grid-filter-active' : 'crm-grid-username';
	      if (babelHelpers.classPrivateFieldGet(this, _isDisabled)) {
	        contentClass = 'crm-grid-username--disabled';
	      }
	      var wrapper = main_core.Tag.render(_templateObject2 || (_templateObject2 = babelHelpers.taggedTemplateLiteral(["\n\t\t\t<a\n\t\t\t\tclass=\"", "\"\n\t\t\t\thref=\"\"\n\t\t\t\tbx-tooltip-user-id=\"", "\"\n\t\t\t\tbx-tooltip-context=\"b24\"\n\t\t\t>\n\t\t\t\t", "\n\t\t\t</a>\n\t\t"])), contentClass, babelHelpers.classPrivateFieldGet(this, _id), content);
	      main_core.Event.bind(wrapper, 'click', _classPrivateMethodGet(this, _onClick, _onClick2).bind(this));
	      main_core.Dom.append(wrapper, babelHelpers.classPrivateFieldGet(this, _rootNode));
	    }
	  }]);
	  return ClickableUser;
	}();
	function _onClick2(event) {
	  event.preventDefault();
	  event.stopPropagation();
	  if (babelHelpers.classPrivateFieldGet(this, _isDisabled)) {
	    return;
	  }
	  _classPrivateMethodGet(this, _toggleFilter, _toggleFilter2).call(this);
	}
	function _toggleFilter2() {
	  if (!babelHelpers.classPrivateFieldGet(this, _filterManager)) {
	    console.log('BX.Main.filterManager not initialized');
	    return;
	  }
	  if (babelHelpers.classPrivateFieldGet(this, _isSelected)) {
	    _classPrivateMethodGet(this, _reduceFilter, _reduceFilter2).call(this);
	  } else {
	    _classPrivateMethodGet(this, _extendFilter, _extendFilter2).call(this);
	  }
	}
	function _reduceFilter2() {
	  var reducedFields = _classPrivateMethodGet(this, _reduceCurrentFieldsValues, _reduceCurrentFieldsValues2).call(this);
	  babelHelpers.classPrivateFieldGet(this, _filterManager).getApi().setFields(reducedFields);
	  babelHelpers.classPrivateFieldGet(this, _filterManager).getSearch().apply();
	}
	function _reduceCurrentFieldsValues2() {
	  var _this = this;
	  var reducedOptions = babelHelpers.classPrivateFieldGet(this, _filterOptions);
	  var filterFieldsValues = babelHelpers.classPrivateFieldGet(this, _filterManager).getFilterFieldsValues();
	  Object.entries(filterFieldsValues).forEach(function (_ref) {
	    var _ref2 = babelHelpers.slicedToArray(_ref, 2),
	      key = _ref2[0],
	      values = _ref2[1];
	    if (main_core.Type.isArray(values) && key in reducedOptions) {
	      if (babelHelpers.classPrivateFieldGet(_this, _isSingleUserColumn)) {
	        filterFieldsValues[key] = [];
	      } else {
	        var index = values.indexOf(reducedOptions[key][0].toString());
	        filterFieldsValues[key].splice(index, 1);
	      }
	    }
	  });
	  return filterFieldsValues;
	}
	function _extendFilter2() {
	  return _extendFilter3.apply(this, arguments);
	}
	function _extendFilter3() {
	  _extendFilter3 = babelHelpers.asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee() {
	    var extendedOptions;
	    return _regeneratorRuntime().wrap(function _callee$(_context) {
	      while (1) switch (_context.prev = _context.next) {
	        case 0:
	          extendedOptions = _classPrivateMethodGet(this, _extendCurrentFieldsValues, _extendCurrentFieldsValues2).call(this);
	          babelHelpers.classPrivateFieldGet(this, _filterManager).showGridAnimation();
	          _context.next = 4;
	          return _classPrivateMethodGet(this, _registerFieldToFilter, _registerFieldToFilter2).call(this);
	        case 4:
	          babelHelpers.classPrivateFieldGet(this, _filterManager).getApi().extendFilter(extendedOptions);
	        case 5:
	        case "end":
	          return _context.stop();
	      }
	    }, _callee, this);
	  }));
	  return _extendFilter3.apply(this, arguments);
	}
	function _extendCurrentFieldsValues2() {
	  var _this2 = this;
	  var extendedOptions = babelHelpers.classPrivateFieldGet(this, _filterOptions);
	  var filterFieldsValues = babelHelpers.classPrivateFieldGet(this, _filterManager).getFilterFieldsValues();
	  Object.entries(babelHelpers.classPrivateFieldGet(this, _filterOptions)).forEach(function (_ref3) {
	    var _ref4 = babelHelpers.slicedToArray(_ref3, 2),
	      key = _ref4[0],
	      values = _ref4[1];
	    var currentValues = filterFieldsValues[key];
	    if (main_core.Type.isArray(currentValues) && main_core.Type.isArray(values)) {
	      if (babelHelpers.classPrivateFieldGet(_this2, _isSingleUserColumn)) {
	        extendedOptions[key] = values;
	      } else {
	        values.forEach(function (value) {
	          if (!currentValues.includes(value)) {
	            currentValues.push(value);
	            extendedOptions[key] = currentValues;
	          }
	        });
	      }
	    }
	  });
	  return extendedOptions;
	}
	function _registerFieldToFilter2() {
	  return _registerFieldToFilter3.apply(this, arguments);
	}
	function _registerFieldToFilter3() {
	  _registerFieldToFilter3 = babelHelpers.asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee2() {
	    var _this3 = this;
	    var presetFields, oldFields, newFields, fieldsData, fieldsForAdd, disableSaveFieldsSort;
	    return _regeneratorRuntime().wrap(function _callee2$(_context2) {
	      while (1) switch (_context2.prev = _context2.next) {
	        case 0:
	          presetFields = babelHelpers.classPrivateFieldGet(this, _filterManager).getPreset().getFields();
	          oldFields = [];
	          presetFields.forEach(function (field) {
	            oldFields.push(field.dataset.name);
	          });
	          newFields = oldFields.slice(babelHelpers.classPrivateFieldGet(this, _filterManager).params.FIELDS);
	          newFields.push(babelHelpers.classPrivateFieldGet(this, _filterFieldName));
	          _context2.next = 7;
	          return babelHelpers.classPrivateFieldGet(this, _filterManager).fetchFields([babelHelpers.classPrivateFieldGet(this, _filterFieldName)], oldFields);
	        case 7:
	          fieldsData = _context2.sent;
	          fieldsData.forEach(function (field) {
	            return babelHelpers.classPrivateFieldGet(_this3, _filterManager).params.FIELDS.push(field);
	          });
	          fieldsForAdd = newFields.filter(function (field) {
	            return !oldFields.includes(field);
	          });
	          disableSaveFieldsSort = true;
	          fieldsForAdd.forEach(function (fieldId) {
	            var field = fieldsData.find(function (item) {
	              return item.NAME === fieldId;
	            });
	            if (field) {
	              babelHelpers.classPrivateFieldGet(_this3, _filterManager).getPreset().addField(field, disableSaveFieldsSort);
	              if (main_core.Type.isString(field.HTML)) {
	                var wrap = main_core.Tag.render(_templateObject3 || (_templateObject3 = babelHelpers.taggedTemplateLiteral(["<div></div>"])));
	                main_core.Dom.append(babelHelpers.classPrivateFieldGet(_this3, _filterManager).getHiddenElement(), wrap);
	                main_core.html(wrap, field.HTML);
	              }
	            }
	          });
	          babelHelpers.classPrivateFieldGet(this, _filterManager).saveFieldsSort();
	        case 13:
	        case "end":
	          return _context2.stop();
	      }
	    }, _callee2, this);
	  }));
	  return _registerFieldToFilter3.apply(this, arguments);
	}

	exports.ClickableUser = ClickableUser;

}((this.BX.Crm.Grid.Field = this.BX.Crm.Grid.Field || {}),BX));
//# sourceMappingURL=clickable-user.bundle.js.map
