/* eslint-disable */
this.BX = this.BX || {};
this.BX.Messenger = this.BX.Messenger || {};
this.BX.Messenger.v2 = this.BX.Messenger.v2 || {};
this.BX.Messenger.v2.Provider = this.BX.Messenger.v2.Provider || {};
(function (exports,main_core,im_v2_application_core,im_v2_const,im_v2_lib_rest,im_v2_lib_logger,im_v2_lib_notifier) {
	'use strict';

	function _regeneratorRuntime() { /*! regenerator-runtime -- Copyright (c) 2014-present, Facebook, Inc. -- license (MIT): https://github.com/facebook/regenerator/blob/main/LICENSE */ _regeneratorRuntime = function _regeneratorRuntime() { return exports; }; var exports = {}, Op = Object.prototype, hasOwn = Op.hasOwnProperty, defineProperty = Object.defineProperty || function (obj, key, desc) { obj[key] = desc.value; }, $Symbol = "function" == typeof Symbol ? Symbol : {}, iteratorSymbol = $Symbol.iterator || "@@iterator", asyncIteratorSymbol = $Symbol.asyncIterator || "@@asyncIterator", toStringTagSymbol = $Symbol.toStringTag || "@@toStringTag"; function define(obj, key, value) { return Object.defineProperty(obj, key, { value: value, enumerable: !0, configurable: !0, writable: !0 }), obj[key]; } try { define({}, ""); } catch (err) { define = function define(obj, key, value) { return obj[key] = value; }; } function wrap(innerFn, outerFn, self, tryLocsList) { var protoGenerator = outerFn && outerFn.prototype instanceof Generator ? outerFn : Generator, generator = Object.create(protoGenerator.prototype), context = new Context(tryLocsList || []); return defineProperty(generator, "_invoke", { value: makeInvokeMethod(innerFn, self, context) }), generator; } function tryCatch(fn, obj, arg) { try { return { type: "normal", arg: fn.call(obj, arg) }; } catch (err) { return { type: "throw", arg: err }; } } exports.wrap = wrap; var ContinueSentinel = {}; function Generator() {} function GeneratorFunction() {} function GeneratorFunctionPrototype() {} var IteratorPrototype = {}; define(IteratorPrototype, iteratorSymbol, function () { return this; }); var getProto = Object.getPrototypeOf, NativeIteratorPrototype = getProto && getProto(getProto(values([]))); NativeIteratorPrototype && NativeIteratorPrototype !== Op && hasOwn.call(NativeIteratorPrototype, iteratorSymbol) && (IteratorPrototype = NativeIteratorPrototype); var Gp = GeneratorFunctionPrototype.prototype = Generator.prototype = Object.create(IteratorPrototype); function defineIteratorMethods(prototype) { ["next", "throw", "return"].forEach(function (method) { define(prototype, method, function (arg) { return this._invoke(method, arg); }); }); } function AsyncIterator(generator, PromiseImpl) { function invoke(method, arg, resolve, reject) { var record = tryCatch(generator[method], generator, arg); if ("throw" !== record.type) { var result = record.arg, value = result.value; return value && "object" == babelHelpers["typeof"](value) && hasOwn.call(value, "__await") ? PromiseImpl.resolve(value.__await).then(function (value) { invoke("next", value, resolve, reject); }, function (err) { invoke("throw", err, resolve, reject); }) : PromiseImpl.resolve(value).then(function (unwrapped) { result.value = unwrapped, resolve(result); }, function (error) { return invoke("throw", error, resolve, reject); }); } reject(record.arg); } var previousPromise; defineProperty(this, "_invoke", { value: function value(method, arg) { function callInvokeWithMethodAndArg() { return new PromiseImpl(function (resolve, reject) { invoke(method, arg, resolve, reject); }); } return previousPromise = previousPromise ? previousPromise.then(callInvokeWithMethodAndArg, callInvokeWithMethodAndArg) : callInvokeWithMethodAndArg(); } }); } function makeInvokeMethod(innerFn, self, context) { var state = "suspendedStart"; return function (method, arg) { if ("executing" === state) throw new Error("Generator is already running"); if ("completed" === state) { if ("throw" === method) throw arg; return doneResult(); } for (context.method = method, context.arg = arg;;) { var delegate = context.delegate; if (delegate) { var delegateResult = maybeInvokeDelegate(delegate, context); if (delegateResult) { if (delegateResult === ContinueSentinel) continue; return delegateResult; } } if ("next" === context.method) context.sent = context._sent = context.arg;else if ("throw" === context.method) { if ("suspendedStart" === state) throw state = "completed", context.arg; context.dispatchException(context.arg); } else "return" === context.method && context.abrupt("return", context.arg); state = "executing"; var record = tryCatch(innerFn, self, context); if ("normal" === record.type) { if (state = context.done ? "completed" : "suspendedYield", record.arg === ContinueSentinel) continue; return { value: record.arg, done: context.done }; } "throw" === record.type && (state = "completed", context.method = "throw", context.arg = record.arg); } }; } function maybeInvokeDelegate(delegate, context) { var methodName = context.method, method = delegate.iterator[methodName]; if (undefined === method) return context.delegate = null, "throw" === methodName && delegate.iterator["return"] && (context.method = "return", context.arg = undefined, maybeInvokeDelegate(delegate, context), "throw" === context.method) || "return" !== methodName && (context.method = "throw", context.arg = new TypeError("The iterator does not provide a '" + methodName + "' method")), ContinueSentinel; var record = tryCatch(method, delegate.iterator, context.arg); if ("throw" === record.type) return context.method = "throw", context.arg = record.arg, context.delegate = null, ContinueSentinel; var info = record.arg; return info ? info.done ? (context[delegate.resultName] = info.value, context.next = delegate.nextLoc, "return" !== context.method && (context.method = "next", context.arg = undefined), context.delegate = null, ContinueSentinel) : info : (context.method = "throw", context.arg = new TypeError("iterator result is not an object"), context.delegate = null, ContinueSentinel); } function pushTryEntry(locs) { var entry = { tryLoc: locs[0] }; 1 in locs && (entry.catchLoc = locs[1]), 2 in locs && (entry.finallyLoc = locs[2], entry.afterLoc = locs[3]), this.tryEntries.push(entry); } function resetTryEntry(entry) { var record = entry.completion || {}; record.type = "normal", delete record.arg, entry.completion = record; } function Context(tryLocsList) { this.tryEntries = [{ tryLoc: "root" }], tryLocsList.forEach(pushTryEntry, this), this.reset(!0); } function values(iterable) { if (iterable) { var iteratorMethod = iterable[iteratorSymbol]; if (iteratorMethod) return iteratorMethod.call(iterable); if ("function" == typeof iterable.next) return iterable; if (!isNaN(iterable.length)) { var i = -1, next = function next() { for (; ++i < iterable.length;) if (hasOwn.call(iterable, i)) return next.value = iterable[i], next.done = !1, next; return next.value = undefined, next.done = !0, next; }; return next.next = next; } } return { next: doneResult }; } function doneResult() { return { value: undefined, done: !0 }; } return GeneratorFunction.prototype = GeneratorFunctionPrototype, defineProperty(Gp, "constructor", { value: GeneratorFunctionPrototype, configurable: !0 }), defineProperty(GeneratorFunctionPrototype, "constructor", { value: GeneratorFunction, configurable: !0 }), GeneratorFunction.displayName = define(GeneratorFunctionPrototype, toStringTagSymbol, "GeneratorFunction"), exports.isGeneratorFunction = function (genFun) { var ctor = "function" == typeof genFun && genFun.constructor; return !!ctor && (ctor === GeneratorFunction || "GeneratorFunction" === (ctor.displayName || ctor.name)); }, exports.mark = function (genFun) { return Object.setPrototypeOf ? Object.setPrototypeOf(genFun, GeneratorFunctionPrototype) : (genFun.__proto__ = GeneratorFunctionPrototype, define(genFun, toStringTagSymbol, "GeneratorFunction")), genFun.prototype = Object.create(Gp), genFun; }, exports.awrap = function (arg) { return { __await: arg }; }, defineIteratorMethods(AsyncIterator.prototype), define(AsyncIterator.prototype, asyncIteratorSymbol, function () { return this; }), exports.AsyncIterator = AsyncIterator, exports.async = function (innerFn, outerFn, self, tryLocsList, PromiseImpl) { void 0 === PromiseImpl && (PromiseImpl = Promise); var iter = new AsyncIterator(wrap(innerFn, outerFn, self, tryLocsList), PromiseImpl); return exports.isGeneratorFunction(outerFn) ? iter : iter.next().then(function (result) { return result.done ? result.value : iter.next(); }); }, defineIteratorMethods(Gp), define(Gp, toStringTagSymbol, "Generator"), define(Gp, iteratorSymbol, function () { return this; }), define(Gp, "toString", function () { return "[object Generator]"; }), exports.keys = function (val) { var object = Object(val), keys = []; for (var key in object) keys.push(key); return keys.reverse(), function next() { for (; keys.length;) { var key = keys.pop(); if (key in object) return next.value = key, next.done = !1, next; } return next.done = !0, next; }; }, exports.values = values, Context.prototype = { constructor: Context, reset: function reset(skipTempReset) { if (this.prev = 0, this.next = 0, this.sent = this._sent = undefined, this.done = !1, this.delegate = null, this.method = "next", this.arg = undefined, this.tryEntries.forEach(resetTryEntry), !skipTempReset) for (var name in this) "t" === name.charAt(0) && hasOwn.call(this, name) && !isNaN(+name.slice(1)) && (this[name] = undefined); }, stop: function stop() { this.done = !0; var rootRecord = this.tryEntries[0].completion; if ("throw" === rootRecord.type) throw rootRecord.arg; return this.rval; }, dispatchException: function dispatchException(exception) { if (this.done) throw exception; var context = this; function handle(loc, caught) { return record.type = "throw", record.arg = exception, context.next = loc, caught && (context.method = "next", context.arg = undefined), !!caught; } for (var i = this.tryEntries.length - 1; i >= 0; --i) { var entry = this.tryEntries[i], record = entry.completion; if ("root" === entry.tryLoc) return handle("end"); if (entry.tryLoc <= this.prev) { var hasCatch = hasOwn.call(entry, "catchLoc"), hasFinally = hasOwn.call(entry, "finallyLoc"); if (hasCatch && hasFinally) { if (this.prev < entry.catchLoc) return handle(entry.catchLoc, !0); if (this.prev < entry.finallyLoc) return handle(entry.finallyLoc); } else if (hasCatch) { if (this.prev < entry.catchLoc) return handle(entry.catchLoc, !0); } else { if (!hasFinally) throw new Error("try statement without catch or finally"); if (this.prev < entry.finallyLoc) return handle(entry.finallyLoc); } } } }, abrupt: function abrupt(type, arg) { for (var i = this.tryEntries.length - 1; i >= 0; --i) { var entry = this.tryEntries[i]; if (entry.tryLoc <= this.prev && hasOwn.call(entry, "finallyLoc") && this.prev < entry.finallyLoc) { var finallyEntry = entry; break; } } finallyEntry && ("break" === type || "continue" === type) && finallyEntry.tryLoc <= arg && arg <= finallyEntry.finallyLoc && (finallyEntry = null); var record = finallyEntry ? finallyEntry.completion : {}; return record.type = type, record.arg = arg, finallyEntry ? (this.method = "next", this.next = finallyEntry.finallyLoc, ContinueSentinel) : this.complete(record); }, complete: function complete(record, afterLoc) { if ("throw" === record.type) throw record.arg; return "break" === record.type || "continue" === record.type ? this.next = record.arg : "return" === record.type ? (this.rval = this.arg = record.arg, this.method = "return", this.next = "end") : "normal" === record.type && afterLoc && (this.next = afterLoc), ContinueSentinel; }, finish: function finish(finallyLoc) { for (var i = this.tryEntries.length - 1; i >= 0; --i) { var entry = this.tryEntries[i]; if (entry.finallyLoc === finallyLoc) return this.complete(entry.completion, entry.afterLoc), resetTryEntry(entry), ContinueSentinel; } }, "catch": function _catch(tryLoc) { for (var i = this.tryEntries.length - 1; i >= 0; --i) { var entry = this.tryEntries[i]; if (entry.tryLoc === tryLoc) { var record = entry.completion; if ("throw" === record.type) { var thrown = record.arg; resetTryEntry(entry); } return thrown; } } throw new Error("illegal catch attempt"); }, delegateYield: function delegateYield(iterable, resultName, nextLoc) { return this.delegate = { iterator: values(iterable), resultName: resultName, nextLoc: nextLoc }, "next" === this.method && (this.arg = undefined), ContinueSentinel; } }, exports; }
	function _classPrivateMethodInitSpec(obj, privateSet) { _checkPrivateRedeclaration(obj, privateSet); privateSet.add(obj); }
	function _classPrivateFieldInitSpec(obj, privateMap, value) { _checkPrivateRedeclaration(obj, privateMap); privateMap.set(obj, value); }
	function _checkPrivateRedeclaration(obj, privateCollection) { if (privateCollection.has(obj)) { throw new TypeError("Cannot initialize the same private elements twice on an object"); } }
	function _classPrivateMethodGet(receiver, privateSet, fn) { if (!privateSet.has(receiver)) { throw new TypeError("attempted to get private field on non-instance"); } return fn; }
	var PACKS_REQUEST_LIMIT = 10;
	var _lastPackId = /*#__PURE__*/new WeakMap();
	var _lastPackType = /*#__PURE__*/new WeakMap();
	var _hasMore = /*#__PURE__*/new WeakMap();
	var _getQueryParams = /*#__PURE__*/new WeakSet();
	var _requestItems = /*#__PURE__*/new WeakSet();
	var _handlePagination = /*#__PURE__*/new WeakSet();
	var _updateModels = /*#__PURE__*/new WeakSet();
	var _wasPackRenamed = /*#__PURE__*/new WeakSet();
	var StickerService = /*#__PURE__*/function () {
	  function StickerService() {
	    babelHelpers.classCallCheck(this, StickerService);
	    _classPrivateMethodInitSpec(this, _wasPackRenamed);
	    _classPrivateMethodInitSpec(this, _updateModels);
	    _classPrivateMethodInitSpec(this, _handlePagination);
	    _classPrivateMethodInitSpec(this, _requestItems);
	    _classPrivateMethodInitSpec(this, _getQueryParams);
	    _classPrivateFieldInitSpec(this, _lastPackId, {
	      writable: true,
	      value: null
	    });
	    _classPrivateFieldInitSpec(this, _lastPackType, {
	      writable: true,
	      value: ''
	    });
	    _classPrivateFieldInitSpec(this, _hasMore, {
	      writable: true,
	      value: true
	    });
	  }
	  babelHelpers.createClass(StickerService, [{
	    key: "initFirstPage",
	    value: function () {
	      var _initFirstPage = babelHelpers.asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee() {
	        return _regeneratorRuntime().wrap(function _callee$(_context) {
	          while (1) switch (_context.prev = _context.next) {
	            case 0:
	              if (!babelHelpers.classPrivateFieldGet(this, _lastPackId)) {
	                _context.next = 2;
	                break;
	              }
	              return _context.abrupt("return", Promise.resolve());
	            case 2:
	              return _context.abrupt("return", _classPrivateMethodGet(this, _requestItems, _requestItems2).call(this));
	            case 3:
	            case "end":
	              return _context.stop();
	          }
	        }, _callee, this);
	      }));
	      function initFirstPage() {
	        return _initFirstPage.apply(this, arguments);
	      }
	      return initFirstPage;
	    }()
	  }, {
	    key: "loadNextPage",
	    value: function () {
	      var _loadNextPage = babelHelpers.asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee2() {
	        return _regeneratorRuntime().wrap(function _callee2$(_context2) {
	          while (1) switch (_context2.prev = _context2.next) {
	            case 0:
	              if (babelHelpers.classPrivateFieldGet(this, _hasMore)) {
	                _context2.next = 2;
	                break;
	              }
	              return _context2.abrupt("return", Promise.resolve());
	            case 2:
	              return _context2.abrupt("return", _classPrivateMethodGet(this, _requestItems, _requestItems2).call(this));
	            case 3:
	            case "end":
	              return _context2.stop();
	          }
	        }, _callee2, this);
	      }));
	      function loadNextPage() {
	        return _loadNextPage.apply(this, arguments);
	      }
	      return loadNextPage;
	    }()
	  }, {
	    key: "loadPack",
	    value: function () {
	      var _loadPack = babelHelpers.asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee3(_ref) {
	        var id, type, hasPack, rawData, pack, stickers, packsPromise, stickersPromise;
	        return _regeneratorRuntime().wrap(function _callee3$(_context3) {
	          while (1) switch (_context3.prev = _context3.next) {
	            case 0:
	              id = _ref.id, type = _ref.type;
	              hasPack = im_v2_application_core.Core.getStore().getters['stickers/packs/hasPack']({
	                id: id,
	                type: type
	              });
	              if (!hasPack) {
	                _context3.next = 4;
	                break;
	              }
	              return _context3.abrupt("return", Promise.resolve());
	            case 4:
	              _context3.next = 6;
	              return im_v2_lib_rest.runAction(im_v2_const.RestMethod.imV2StickerPackGet, {
	                data: {
	                  id: id,
	                  type: type
	                }
	              })["catch"](function (error) {
	                im_v2_lib_logger.Logger.warn('StickerService: pack request error', error);
	              });
	            case 6:
	              rawData = _context3.sent;
	              pack = rawData.pack, stickers = rawData.stickers;
	              packsPromise = im_v2_application_core.Core.getStore().dispatch('stickers/packs/set', [pack]);
	              stickersPromise = im_v2_application_core.Core.getStore().dispatch('stickers/set', stickers);
	              return _context3.abrupt("return", Promise.all([stickersPromise, packsPromise]));
	            case 11:
	            case "end":
	              return _context3.stop();
	          }
	        }, _callee3);
	      }));
	      function loadPack(_x) {
	        return _loadPack.apply(this, arguments);
	      }
	      return loadPack;
	    }()
	  }, {
	    key: "linkPack",
	    value: function () {
	      var _linkPack = babelHelpers.asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee4(_ref2) {
	        var id, type;
	        return _regeneratorRuntime().wrap(function _callee4$(_context4) {
	          while (1) switch (_context4.prev = _context4.next) {
	            case 0:
	              id = _ref2.id, type = _ref2.type;
	              void im_v2_application_core.Core.getStore().dispatch('stickers/packs/link', {
	                id: id,
	                type: type
	              });
	              _context4.next = 4;
	              return im_v2_lib_rest.runAction(im_v2_const.RestMethod.imV2StickerPackLink, {
	                data: {
	                  id: id,
	                  type: type
	                }
	              })["catch"](function (errors) {
	                var _errors = babelHelpers.slicedToArray(errors, 1),
	                  firstError = _errors[0];
	                im_v2_lib_notifier.Notifier.sticker.handleLimits(firstError);
	                im_v2_lib_logger.Logger.warn('StickerService: link pack error', errors);
	                im_v2_lib_notifier.Notifier.sticker.onLinkPackError();
	              });
	            case 4:
	            case "end":
	              return _context4.stop();
	          }
	        }, _callee4);
	      }));
	      function linkPack(_x2) {
	        return _linkPack.apply(this, arguments);
	      }
	      return linkPack;
	    }()
	  }, {
	    key: "createPack",
	    value: function () {
	      var _createPack = babelHelpers.asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee5(_ref3) {
	        var uuids, type, name, rawData, pack, stickers, packsPromise, stickersPromise;
	        return _regeneratorRuntime().wrap(function _callee5$(_context5) {
	          while (1) switch (_context5.prev = _context5.next) {
	            case 0:
	              uuids = _ref3.uuids, type = _ref3.type, name = _ref3.name;
	              _context5.next = 3;
	              return im_v2_lib_rest.runAction(im_v2_const.RestMethod.imV2StickerPackAdd, {
	                data: {
	                  uuids: uuids,
	                  type: type,
	                  name: name
	                }
	              })["catch"](function (errors) {
	                var _errors2 = babelHelpers.slicedToArray(errors, 1),
	                  firstError = _errors2[0];
	                im_v2_lib_notifier.Notifier.sticker.handleLimits(firstError);
	                im_v2_lib_logger.Logger.warn('StickerService: pack creation error', errors);
	              });
	            case 3:
	              rawData = _context5.sent;
	              pack = rawData.pack, stickers = rawData.stickers;
	              packsPromise = im_v2_application_core.Core.getStore().dispatch('stickers/packs/set', [pack]);
	              stickersPromise = im_v2_application_core.Core.getStore().dispatch('stickers/set', stickers);
	              return _context5.abrupt("return", Promise.all([packsPromise, stickersPromise]));
	            case 8:
	            case "end":
	              return _context5.stop();
	          }
	        }, _callee5);
	      }));
	      function createPack(_x3) {
	        return _createPack.apply(this, arguments);
	      }
	      return createPack;
	    }()
	  }, {
	    key: "renamePack",
	    value: function () {
	      var _renamePack = babelHelpers.asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee6(_ref4) {
	        var id, type, name;
	        return _regeneratorRuntime().wrap(function _callee6$(_context6) {
	          while (1) switch (_context6.prev = _context6.next) {
	            case 0:
	              id = _ref4.id, type = _ref4.type, name = _ref4.name;
	              void im_v2_application_core.Core.getStore().dispatch('stickers/packs/rename', {
	                id: id,
	                type: type,
	                name: name
	              });
	              _context6.next = 4;
	              return im_v2_lib_rest.runAction(im_v2_const.RestMethod.imV2StickerPackRename, {
	                data: {
	                  id: id,
	                  type: type,
	                  name: name
	                }
	              })["catch"](function (error) {
	                im_v2_lib_logger.Logger.warn('StickerService: rename pack error', error);
	              });
	            case 4:
	            case "end":
	              return _context6.stop();
	          }
	        }, _callee6);
	      }));
	      function renamePack(_x4) {
	        return _renamePack.apply(this, arguments);
	      }
	      return renamePack;
	    }()
	  }, {
	    key: "addStickers",
	    value: function () {
	      var _addStickers = babelHelpers.asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee7(_ref5) {
	        var uuids, id, type, rawData, pack, stickers, packsPromise, stickersPromise;
	        return _regeneratorRuntime().wrap(function _callee7$(_context7) {
	          while (1) switch (_context7.prev = _context7.next) {
	            case 0:
	              uuids = _ref5.uuids, id = _ref5.id, type = _ref5.type;
	              _context7.next = 3;
	              return im_v2_lib_rest.runAction(im_v2_const.RestMethod.imV2StickerAdd, {
	                data: {
	                  uuids: uuids,
	                  packId: id,
	                  packType: type
	                }
	              })["catch"](function (errors) {
	                var _errors3 = babelHelpers.slicedToArray(errors, 1),
	                  firstError = _errors3[0];
	                im_v2_lib_notifier.Notifier.sticker.handleLimits(firstError);
	                im_v2_lib_logger.Logger.warn('StickerService: add stickers error', errors);
	                throw errors;
	              });
	            case 3:
	              rawData = _context7.sent;
	              pack = rawData.pack, stickers = rawData.stickers;
	              packsPromise = im_v2_application_core.Core.getStore().dispatch('stickers/packs/set', [pack]);
	              stickersPromise = im_v2_application_core.Core.getStore().dispatch('stickers/set', stickers);
	              return _context7.abrupt("return", Promise.all([packsPromise, stickersPromise]));
	            case 8:
	            case "end":
	              return _context7.stop();
	          }
	        }, _callee7);
	      }));
	      function addStickers(_x5) {
	        return _addStickers.apply(this, arguments);
	      }
	      return addStickers;
	    }()
	  }, {
	    key: "updatePack",
	    value: function () {
	      var _updatePack = babelHelpers.asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee8(_ref6) {
	        var uuids, id, type, name, promises;
	        return _regeneratorRuntime().wrap(function _callee8$(_context8) {
	          while (1) switch (_context8.prev = _context8.next) {
	            case 0:
	              uuids = _ref6.uuids, id = _ref6.id, type = _ref6.type, name = _ref6.name;
	              promises = [];
	              if (main_core.Type.isArrayFilled(uuids)) {
	                promises.push(this.addStickers({
	                  uuids: uuids,
	                  id: id,
	                  type: type
	                }));
	              }
	              if (_classPrivateMethodGet(this, _wasPackRenamed, _wasPackRenamed2).call(this, {
	                id: id,
	                type: type,
	                name: name
	              })) {
	                promises.push(this.renamePack({
	                  uuids: uuids,
	                  id: id,
	                  type: type,
	                  name: name
	                }));
	              }
	              return _context8.abrupt("return", Promise.all(promises));
	            case 5:
	            case "end":
	              return _context8.stop();
	          }
	        }, _callee8, this);
	      }));
	      function updatePack(_x6) {
	        return _updatePack.apply(this, arguments);
	      }
	      return updatePack;
	    }()
	  }, {
	    key: "deletePack",
	    value: function () {
	      var _deletePack = babelHelpers.asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee9(_ref7) {
	        var id, type;
	        return _regeneratorRuntime().wrap(function _callee9$(_context9) {
	          while (1) switch (_context9.prev = _context9.next) {
	            case 0:
	              id = _ref7.id, type = _ref7.type;
	              void im_v2_application_core.Core.getStore().dispatch('stickers/packs/delete', {
	                id: id,
	                type: type
	              });
	              void im_v2_application_core.Core.getStore().dispatch('stickers/deleteByPack', {
	                id: id,
	                type: type
	              });
	              _context9.next = 5;
	              return im_v2_lib_rest.runAction(im_v2_const.RestMethod.imV2StickerPackDelete, {
	                data: {
	                  id: id,
	                  type: type
	                }
	              })["catch"](function (error) {
	                im_v2_lib_logger.Logger.warn('StickerService: delete pack error', error);
	              });
	            case 5:
	            case "end":
	              return _context9.stop();
	          }
	        }, _callee9);
	      }));
	      function deletePack(_x7) {
	        return _deletePack.apply(this, arguments);
	      }
	      return deletePack;
	    }()
	  }, {
	    key: "unlinkPack",
	    value: function () {
	      var _unlinkPack = babelHelpers.asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee10(_ref8) {
	        var id, type;
	        return _regeneratorRuntime().wrap(function _callee10$(_context10) {
	          while (1) switch (_context10.prev = _context10.next) {
	            case 0:
	              id = _ref8.id, type = _ref8.type;
	              void im_v2_application_core.Core.getStore().dispatch('stickers/packs/unlink', {
	                id: id,
	                type: type
	              });
	              _context10.next = 4;
	              return im_v2_lib_rest.runAction(im_v2_const.RestMethod.imV2StickerPackUnlink, {
	                data: {
	                  id: id,
	                  type: type
	                }
	              })["catch"](function (error) {
	                im_v2_lib_logger.Logger.warn('StickerService: unlink pack error', error);
	              });
	            case 4:
	            case "end":
	              return _context10.stop();
	          }
	        }, _callee10);
	      }));
	      function unlinkPack(_x8) {
	        return _unlinkPack.apply(this, arguments);
	      }
	      return unlinkPack;
	    }()
	  }, {
	    key: "clearRecent",
	    value: function () {
	      var _clearRecent = babelHelpers.asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee11() {
	        return _regeneratorRuntime().wrap(function _callee11$(_context11) {
	          while (1) switch (_context11.prev = _context11.next) {
	            case 0:
	              void im_v2_application_core.Core.getStore().dispatch('stickers/recent/clear');
	              _context11.next = 3;
	              return im_v2_lib_rest.runAction(im_v2_const.RestMethod.imV2StickerRecentDeleteAll, {
	                data: {}
	              })["catch"](function (error) {
	                im_v2_lib_logger.Logger.warn('StickerService: clear recent error', error);
	              });
	            case 3:
	            case "end":
	              return _context11.stop();
	          }
	        }, _callee11);
	      }));
	      function clearRecent() {
	        return _clearRecent.apply(this, arguments);
	      }
	      return clearRecent;
	    }()
	  }, {
	    key: "removeFromRecent",
	    value: function () {
	      var _removeFromRecent = babelHelpers.asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee12(_ref9) {
	        var id, packType, packId;
	        return _regeneratorRuntime().wrap(function _callee12$(_context12) {
	          while (1) switch (_context12.prev = _context12.next) {
	            case 0:
	              id = _ref9.id, packType = _ref9.packType, packId = _ref9.packId;
	              void im_v2_application_core.Core.getStore().dispatch('stickers/recent/delete', {
	                id: id,
	                packType: packType,
	                packId: packId
	              });
	              _context12.next = 4;
	              return im_v2_lib_rest.runAction(im_v2_const.RestMethod.imV2StickerRecentDelete, {
	                data: {
	                  id: id,
	                  packId: packId,
	                  packType: packType
	                }
	              })["catch"](function (error) {
	                im_v2_lib_logger.Logger.warn('StickerService: remove sticker from recent error', error);
	              });
	            case 4:
	            case "end":
	              return _context12.stop();
	          }
	        }, _callee12);
	      }));
	      function removeFromRecent(_x9) {
	        return _removeFromRecent.apply(this, arguments);
	      }
	      return removeFromRecent;
	    }()
	  }, {
	    key: "deleteStickerFromPack",
	    value: function () {
	      var _deleteStickerFromPack = babelHelpers.asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee13(_ref10) {
	        var ids, packId, packType, remainingStickers;
	        return _regeneratorRuntime().wrap(function _callee13$(_context13) {
	          while (1) switch (_context13.prev = _context13.next) {
	            case 0:
	              ids = _ref10.ids, packId = _ref10.packId, packType = _ref10.packType;
	              void im_v2_application_core.Core.getStore().dispatch('stickers/delete', {
	                ids: ids,
	                packType: packType,
	                packId: packId
	              });
	              remainingStickers = im_v2_application_core.Core.getStore().getters['stickers/getByPack']({
	                id: packId,
	                type: packType
	              });
	              if (!main_core.Type.isArrayFilled(remainingStickers)) {
	                void im_v2_application_core.Core.getStore().dispatch('stickers/packs/delete', {
	                  id: packId,
	                  type: packType
	                });
	              }
	              _context13.next = 6;
	              return im_v2_lib_rest.runAction(im_v2_const.RestMethod.imV2StickerDelete, {
	                data: {
	                  ids: ids,
	                  packId: packId,
	                  packType: packType
	                }
	              })["catch"](function (error) {
	                im_v2_lib_logger.Logger.warn('StickerService: remove sticker from pack error', error);
	              });
	            case 6:
	            case "end":
	              return _context13.stop();
	          }
	        }, _callee13);
	      }));
	      function deleteStickerFromPack(_x10) {
	        return _deleteStickerFromPack.apply(this, arguments);
	      }
	      return deleteStickerFromPack;
	    }()
	  }], [{
	    key: "getInstance",
	    value: function getInstance() {
	      if (!this.instance) {
	        this.instance = new this();
	      }
	      return this.instance;
	    }
	  }]);
	  return StickerService;
	}();
	function _getQueryParams2() {
	  var params = {
	    limit: PACKS_REQUEST_LIMIT
	  };
	  var isFirstPage = !babelHelpers.classPrivateFieldGet(this, _lastPackId) && !babelHelpers.classPrivateFieldGet(this, _lastPackType);
	  if (!isFirstPage) {
	    params.id = babelHelpers.classPrivateFieldGet(this, _lastPackId);
	    params.type = babelHelpers.classPrivateFieldGet(this, _lastPackType);
	  }
	  return params;
	}
	function _requestItems2() {
	  return _requestItems3.apply(this, arguments);
	}
	function _requestItems3() {
	  _requestItems3 = babelHelpers.asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee14() {
	    var query, isFirstPage, method, rawData;
	    return _regeneratorRuntime().wrap(function _callee14$(_context14) {
	      while (1) switch (_context14.prev = _context14.next) {
	        case 0:
	          query = {
	            data: _classPrivateMethodGet(this, _getQueryParams, _getQueryParams2).call(this)
	          };
	          isFirstPage = !babelHelpers.classPrivateFieldGet(this, _lastPackId) && !babelHelpers.classPrivateFieldGet(this, _lastPackType);
	          method = isFirstPage ? im_v2_const.RestMethod.imV2StickerPackLoad : im_v2_const.RestMethod.imV2StickerPackTail;
	          _context14.next = 5;
	          return im_v2_lib_rest.runAction(method, query)["catch"](function (error) {
	            im_v2_lib_logger.Logger.warn('StickerService: page request error', error);
	          });
	        case 5:
	          rawData = _context14.sent;
	          _classPrivateMethodGet(this, _handlePagination, _handlePagination2).call(this, rawData);
	          _classPrivateMethodGet(this, _updateModels, _updateModels2).call(this, rawData);
	        case 8:
	        case "end":
	          return _context14.stop();
	      }
	    }, _callee14, this);
	  }));
	  return _requestItems3.apply(this, arguments);
	}
	function _handlePagination2(response) {
	  babelHelpers.classPrivateFieldSet(this, _hasMore, response.hasNextPage);
	  var lastPack = response.packs[response.packs.length - 1];
	  if (lastPack) {
	    babelHelpers.classPrivateFieldSet(this, _lastPackId, lastPack.id);
	    babelHelpers.classPrivateFieldSet(this, _lastPackType, lastPack.type);
	  }
	}
	function _updateModels2(response) {
	  var packs = response.packs,
	    stickers = response.stickers,
	    _response$recentStick = response.recentStickers,
	    recentStickers = _response$recentStick === void 0 ? [] : _response$recentStick;
	  var packsPromise = im_v2_application_core.Core.getStore().dispatch('stickers/packs/set', packs);
	  var stickersPromise = im_v2_application_core.Core.getStore().dispatch('stickers/set', stickers);
	  var recentPromise = im_v2_application_core.Core.getStore().dispatch('stickers/recent/set', recentStickers);
	  return Promise.all([stickersPromise, packsPromise, recentPromise]);
	}
	function _wasPackRenamed2(_ref11) {
	  var id = _ref11.id,
	    type = _ref11.type,
	    name = _ref11.name;
	  var pack = im_v2_application_core.Core.getStore().getters['stickers/packs/getByIdentifier']({
	    id: id,
	    type: type
	  });
	  if (!pack) {
	    return false;
	  }
	  return pack.name !== name;
	}

	exports.StickerService = StickerService;

}((this.BX.Messenger.v2.Provider.Service = this.BX.Messenger.v2.Provider.Service || {}),BX,BX.Messenger.v2.Application,BX.Messenger.v2.Const,BX.Messenger.v2.Lib,BX.Messenger.v2.Lib,BX.Messenger.v2.Lib));
//# sourceMappingURL=sticker.bundle.js.map
