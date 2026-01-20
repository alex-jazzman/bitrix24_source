/* eslint-disable */
this.BX = this.BX || {};
this.BX.Bizproc = this.BX.Bizproc || {};
(function (exports,ui_vue3,main_core_events,ui_vue3_components_button,ui_alerts,ui_forms,ui_layoutForm,main_core,ui_uploader_tileWidget,ui_uploader_core,ui_iconSet_api_core,ui_iconSet_api_vue,ui_dialogs_messagebox) {
	'use strict';

	function _regeneratorRuntime() { /*! regenerator-runtime -- Copyright (c) 2014-present, Facebook, Inc. -- license (MIT): https://github.com/facebook/regenerator/blob/main/LICENSE */ _regeneratorRuntime = function _regeneratorRuntime() { return exports; }; var exports = {}, Op = Object.prototype, hasOwn = Op.hasOwnProperty, defineProperty = Object.defineProperty || function (obj, key, desc) { obj[key] = desc.value; }, $Symbol = "function" == typeof Symbol ? Symbol : {}, iteratorSymbol = $Symbol.iterator || "@@iterator", asyncIteratorSymbol = $Symbol.asyncIterator || "@@asyncIterator", toStringTagSymbol = $Symbol.toStringTag || "@@toStringTag"; function define(obj, key, value) { return Object.defineProperty(obj, key, { value: value, enumerable: !0, configurable: !0, writable: !0 }), obj[key]; } try { define({}, ""); } catch (err) { define = function define(obj, key, value) { return obj[key] = value; }; } function wrap(innerFn, outerFn, self, tryLocsList) { var protoGenerator = outerFn && outerFn.prototype instanceof Generator ? outerFn : Generator, generator = Object.create(protoGenerator.prototype), context = new Context(tryLocsList || []); return defineProperty(generator, "_invoke", { value: makeInvokeMethod(innerFn, self, context) }), generator; } function tryCatch(fn, obj, arg) { try { return { type: "normal", arg: fn.call(obj, arg) }; } catch (err) { return { type: "throw", arg: err }; } } exports.wrap = wrap; var ContinueSentinel = {}; function Generator() {} function GeneratorFunction() {} function GeneratorFunctionPrototype() {} var IteratorPrototype = {}; define(IteratorPrototype, iteratorSymbol, function () { return this; }); var getProto = Object.getPrototypeOf, NativeIteratorPrototype = getProto && getProto(getProto(values([]))); NativeIteratorPrototype && NativeIteratorPrototype !== Op && hasOwn.call(NativeIteratorPrototype, iteratorSymbol) && (IteratorPrototype = NativeIteratorPrototype); var Gp = GeneratorFunctionPrototype.prototype = Generator.prototype = Object.create(IteratorPrototype); function defineIteratorMethods(prototype) { ["next", "throw", "return"].forEach(function (method) { define(prototype, method, function (arg) { return this._invoke(method, arg); }); }); } function AsyncIterator(generator, PromiseImpl) { function invoke(method, arg, resolve, reject) { var record = tryCatch(generator[method], generator, arg); if ("throw" !== record.type) { var result = record.arg, value = result.value; return value && "object" == babelHelpers["typeof"](value) && hasOwn.call(value, "__await") ? PromiseImpl.resolve(value.__await).then(function (value) { invoke("next", value, resolve, reject); }, function (err) { invoke("throw", err, resolve, reject); }) : PromiseImpl.resolve(value).then(function (unwrapped) { result.value = unwrapped, resolve(result); }, function (error) { return invoke("throw", error, resolve, reject); }); } reject(record.arg); } var previousPromise; defineProperty(this, "_invoke", { value: function value(method, arg) { function callInvokeWithMethodAndArg() { return new PromiseImpl(function (resolve, reject) { invoke(method, arg, resolve, reject); }); } return previousPromise = previousPromise ? previousPromise.then(callInvokeWithMethodAndArg, callInvokeWithMethodAndArg) : callInvokeWithMethodAndArg(); } }); } function makeInvokeMethod(innerFn, self, context) { var state = "suspendedStart"; return function (method, arg) { if ("executing" === state) throw new Error("Generator is already running"); if ("completed" === state) { if ("throw" === method) throw arg; return doneResult(); } for (context.method = method, context.arg = arg;;) { var delegate = context.delegate; if (delegate) { var delegateResult = maybeInvokeDelegate(delegate, context); if (delegateResult) { if (delegateResult === ContinueSentinel) continue; return delegateResult; } } if ("next" === context.method) context.sent = context._sent = context.arg;else if ("throw" === context.method) { if ("suspendedStart" === state) throw state = "completed", context.arg; context.dispatchException(context.arg); } else "return" === context.method && context.abrupt("return", context.arg); state = "executing"; var record = tryCatch(innerFn, self, context); if ("normal" === record.type) { if (state = context.done ? "completed" : "suspendedYield", record.arg === ContinueSentinel) continue; return { value: record.arg, done: context.done }; } "throw" === record.type && (state = "completed", context.method = "throw", context.arg = record.arg); } }; } function maybeInvokeDelegate(delegate, context) { var methodName = context.method, method = delegate.iterator[methodName]; if (undefined === method) return context.delegate = null, "throw" === methodName && delegate.iterator["return"] && (context.method = "return", context.arg = undefined, maybeInvokeDelegate(delegate, context), "throw" === context.method) || "return" !== methodName && (context.method = "throw", context.arg = new TypeError("The iterator does not provide a '" + methodName + "' method")), ContinueSentinel; var record = tryCatch(method, delegate.iterator, context.arg); if ("throw" === record.type) return context.method = "throw", context.arg = record.arg, context.delegate = null, ContinueSentinel; var info = record.arg; return info ? info.done ? (context[delegate.resultName] = info.value, context.next = delegate.nextLoc, "return" !== context.method && (context.method = "next", context.arg = undefined), context.delegate = null, ContinueSentinel) : info : (context.method = "throw", context.arg = new TypeError("iterator result is not an object"), context.delegate = null, ContinueSentinel); } function pushTryEntry(locs) { var entry = { tryLoc: locs[0] }; 1 in locs && (entry.catchLoc = locs[1]), 2 in locs && (entry.finallyLoc = locs[2], entry.afterLoc = locs[3]), this.tryEntries.push(entry); } function resetTryEntry(entry) { var record = entry.completion || {}; record.type = "normal", delete record.arg, entry.completion = record; } function Context(tryLocsList) { this.tryEntries = [{ tryLoc: "root" }], tryLocsList.forEach(pushTryEntry, this), this.reset(!0); } function values(iterable) { if (iterable) { var iteratorMethod = iterable[iteratorSymbol]; if (iteratorMethod) return iteratorMethod.call(iterable); if ("function" == typeof iterable.next) return iterable; if (!isNaN(iterable.length)) { var i = -1, next = function next() { for (; ++i < iterable.length;) if (hasOwn.call(iterable, i)) return next.value = iterable[i], next.done = !1, next; return next.value = undefined, next.done = !0, next; }; return next.next = next; } } return { next: doneResult }; } function doneResult() { return { value: undefined, done: !0 }; } return GeneratorFunction.prototype = GeneratorFunctionPrototype, defineProperty(Gp, "constructor", { value: GeneratorFunctionPrototype, configurable: !0 }), defineProperty(GeneratorFunctionPrototype, "constructor", { value: GeneratorFunction, configurable: !0 }), GeneratorFunction.displayName = define(GeneratorFunctionPrototype, toStringTagSymbol, "GeneratorFunction"), exports.isGeneratorFunction = function (genFun) { var ctor = "function" == typeof genFun && genFun.constructor; return !!ctor && (ctor === GeneratorFunction || "GeneratorFunction" === (ctor.displayName || ctor.name)); }, exports.mark = function (genFun) { return Object.setPrototypeOf ? Object.setPrototypeOf(genFun, GeneratorFunctionPrototype) : (genFun.__proto__ = GeneratorFunctionPrototype, define(genFun, toStringTagSymbol, "GeneratorFunction")), genFun.prototype = Object.create(Gp), genFun; }, exports.awrap = function (arg) { return { __await: arg }; }, defineIteratorMethods(AsyncIterator.prototype), define(AsyncIterator.prototype, asyncIteratorSymbol, function () { return this; }), exports.AsyncIterator = AsyncIterator, exports.async = function (innerFn, outerFn, self, tryLocsList, PromiseImpl) { void 0 === PromiseImpl && (PromiseImpl = Promise); var iter = new AsyncIterator(wrap(innerFn, outerFn, self, tryLocsList), PromiseImpl); return exports.isGeneratorFunction(outerFn) ? iter : iter.next().then(function (result) { return result.done ? result.value : iter.next(); }); }, defineIteratorMethods(Gp), define(Gp, toStringTagSymbol, "Generator"), define(Gp, iteratorSymbol, function () { return this; }), define(Gp, "toString", function () { return "[object Generator]"; }), exports.keys = function (val) { var object = Object(val), keys = []; for (var key in object) keys.push(key); return keys.reverse(), function next() { for (; keys.length;) { var key = keys.pop(); if (key in object) return next.value = key, next.done = !1, next; } return next.done = !0, next; }; }, exports.values = values, Context.prototype = { constructor: Context, reset: function reset(skipTempReset) { if (this.prev = 0, this.next = 0, this.sent = this._sent = undefined, this.done = !1, this.delegate = null, this.method = "next", this.arg = undefined, this.tryEntries.forEach(resetTryEntry), !skipTempReset) for (var name in this) "t" === name.charAt(0) && hasOwn.call(this, name) && !isNaN(+name.slice(1)) && (this[name] = undefined); }, stop: function stop() { this.done = !0; var rootRecord = this.tryEntries[0].completion; if ("throw" === rootRecord.type) throw rootRecord.arg; return this.rval; }, dispatchException: function dispatchException(exception) { if (this.done) throw exception; var context = this; function handle(loc, caught) { return record.type = "throw", record.arg = exception, context.next = loc, caught && (context.method = "next", context.arg = undefined), !!caught; } for (var i = this.tryEntries.length - 1; i >= 0; --i) { var entry = this.tryEntries[i], record = entry.completion; if ("root" === entry.tryLoc) return handle("end"); if (entry.tryLoc <= this.prev) { var hasCatch = hasOwn.call(entry, "catchLoc"), hasFinally = hasOwn.call(entry, "finallyLoc"); if (hasCatch && hasFinally) { if (this.prev < entry.catchLoc) return handle(entry.catchLoc, !0); if (this.prev < entry.finallyLoc) return handle(entry.finallyLoc); } else if (hasCatch) { if (this.prev < entry.catchLoc) return handle(entry.catchLoc, !0); } else { if (!hasFinally) throw new Error("try statement without catch or finally"); if (this.prev < entry.finallyLoc) return handle(entry.finallyLoc); } } } }, abrupt: function abrupt(type, arg) { for (var i = this.tryEntries.length - 1; i >= 0; --i) { var entry = this.tryEntries[i]; if (entry.tryLoc <= this.prev && hasOwn.call(entry, "finallyLoc") && this.prev < entry.finallyLoc) { var finallyEntry = entry; break; } } finallyEntry && ("break" === type || "continue" === type) && finallyEntry.tryLoc <= arg && arg <= finallyEntry.finallyLoc && (finallyEntry = null); var record = finallyEntry ? finallyEntry.completion : {}; return record.type = type, record.arg = arg, finallyEntry ? (this.method = "next", this.next = finallyEntry.finallyLoc, ContinueSentinel) : this.complete(record); }, complete: function complete(record, afterLoc) { if ("throw" === record.type) throw record.arg; return "break" === record.type || "continue" === record.type ? this.next = record.arg : "return" === record.type ? (this.rval = this.arg = record.arg, this.method = "return", this.next = "end") : "normal" === record.type && afterLoc && (this.next = afterLoc), ContinueSentinel; }, finish: function finish(finallyLoc) { for (var i = this.tryEntries.length - 1; i >= 0; --i) { var entry = this.tryEntries[i]; if (entry.finallyLoc === finallyLoc) return this.complete(entry.completion, entry.afterLoc), resetTryEntry(entry), ContinueSentinel; } }, "catch": function _catch(tryLoc) { for (var i = this.tryEntries.length - 1; i >= 0; --i) { var entry = this.tryEntries[i]; if (entry.tryLoc === tryLoc) { var record = entry.completion; if ("throw" === record.type) { var thrown = record.arg; resetTryEntry(entry); } return thrown; } } throw new Error("illegal catch attempt"); }, delegateYield: function delegateYield(iterable, resultName, nextLoc) { return this.delegate = { iterator: values(iterable), resultName: resultName, nextLoc: nextLoc }, "next" === this.method && (this.arg = undefined), ContinueSentinel; } }, exports; }
	var post = /*#__PURE__*/function () {
	  var _ref = babelHelpers.asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee(action, data) {
	    var response;
	    return _regeneratorRuntime().wrap(function _callee$(_context) {
	      while (1) switch (_context.prev = _context.next) {
	        case 0:
	          _context.next = 2;
	          return main_core.ajax.runAction("bizproc.v2.Integration.Rag.".concat(action), {
	            method: 'POST',
	            json: data || {}
	          });
	        case 2:
	          response = _context.sent;
	          if (!(response.status === 'success')) {
	            _context.next = 5;
	            break;
	          }
	          return _context.abrupt("return", response.data);
	        case 5:
	          return _context.abrupt("return", null);
	        case 6:
	        case "end":
	          return _context.stop();
	      }
	    }, _callee);
	  }));
	  return function post(_x, _x2) {
	    return _ref.apply(this, arguments);
	  };
	}();
	var KnowledgeBaseApi = /*#__PURE__*/function () {
	  function KnowledgeBaseApi() {
	    babelHelpers.classCallCheck(this, KnowledgeBaseApi);
	  }
	  babelHelpers.createClass(KnowledgeBaseApi, null, [{
	    key: "create",
	    value: function create(name, description, fileIds) {
	      return post('KnowledgeBase.create', {
	        name: name,
	        description: description,
	        fileIds: fileIds
	      });
	    }
	  }, {
	    key: "update",
	    value: function update(uid, name, description, fileIds) {
	      return post('KnowledgeBase.update', {
	        uid: uid,
	        name: name,
	        description: description,
	        fileIds: fileIds
	      });
	    }
	  }, {
	    key: "get",
	    value: function get(uid) {
	      return post('KnowledgeBase.get', {
	        uid: uid
	      });
	    }
	  }]);
	  return KnowledgeBaseApi;
	}();

	function deepEqual(a, b) {
	  if (a === b) {
	    return true;
	  }

	  // eslint-disable-next-line @bitrix24/bitrix24-rules/no-typeof
	  if (babelHelpers["typeof"](a) !== babelHelpers["typeof"](b)) {
	    return false;
	  }

	  // eslint-disable-next-line @bitrix24/bitrix24-rules/no-typeof
	  if (babelHelpers["typeof"](a) !== 'object' || a === null || b === null) {
	    return false;
	  }
	  var keysA = Object.keys(a);
	  var keysB = Object.keys(b);
	  if (keysA.length !== keysB.length) {
	    return false;
	  }
	  for (var _i = 0, _keysA = keysA; _i < _keysA.length; _i++) {
	    var key = _keysA[_i];
	    if (!deepEqual(a[key], b[key])) {
	      return false;
	    }
	  }
	  return true;
	}

	// @vue/component
	var RagFileUploader = {
	  name: 'RagFileUploader',
	  components: {
	    TileWidgetComponent: ui_uploader_tileWidget.TileWidgetComponent
	  },
	  props: {
	    knowledgeBaseUid: {
	      type: String,
	      "default": ''
	    },
	    fileIds: {
	      type: Array,
	      "default": function _default() {
	        return [];
	      }
	    },
	    readonly: {
	      type: Boolean,
	      "default": false
	    },
	    fileIdsReplaces: {
	      type: [Object, null],
	      "default": null
	    }
	  },
	  emits: ['filesChanged'],
	  computed: {
	    uploaderOptions: function uploaderOptions() {
	      var _this = this,
	        _events;
	      var settings = main_core.Extension.getSettings('bizproc.rag-selector');
	      return {
	        controller: 'bizproc.fileUploader.KnowledgeBaseUploaderController',
	        controllerOptions: {
	          knowledgeBaseUid: this.knowledgeBaseUid
	        },
	        files: this.fileIds,
	        multiple: true,
	        maxFileCount: settings.get('maxFilesCount', 0),
	        maxFileSize: settings.get('maxFileSize', 0),
	        autoUpload: true,
	        hiddenFieldsContainer: this.$refs.ragUploaderHiddenFields,
	        acceptedFileTypes: settings.get('acceptedFileTypes', []),
	        events: (_events = {}, babelHelpers.defineProperty(_events, ui_uploader_core.UploaderEvent.FILE_COMPLETE, function () {
	          _this.emitFilesChanged();
	        }), babelHelpers.defineProperty(_events, ui_uploader_core.UploaderEvent.FILE_REMOVE, function () {
	          _this.emitFilesChanged();
	        }), _events)
	      };
	    },
	    widgetOptions: function widgetOptions() {
	      return {
	        readonly: this.readonly,
	        hideDropArea: this.readonly
	      };
	    }
	  },
	  watch: {
	    fileIdsReplaces: function fileIdsReplaces(newValue) {
	      var _this$$refs, _this$$refs$tileWidge;
	      if (!main_core.Type.isObject(newValue)) {
	        return;
	      }
	      var uploader = (_this$$refs = this.$refs) === null || _this$$refs === void 0 ? void 0 : (_this$$refs$tileWidge = _this$$refs.tileWidget) === null || _this$$refs$tileWidge === void 0 ? void 0 : _this$$refs$tileWidge.uploader;
	      if (!uploader) {
	        return;
	      }
	      var _loop = function _loop() {
	        var _Object$entries$_i = babelHelpers.slicedToArray(_Object$entries[_i], 2),
	          tempFileId = _Object$entries$_i[0],
	          persistentFileId = _Object$entries$_i[1];
	        uploader.getFiles().forEach(function (file) {
	          if (file.getServerFileId() === tempFileId) {
	            file.setServerFileId(persistentFileId);
	          }
	        });
	      };
	      for (var _i = 0, _Object$entries = Object.entries(newValue); _i < _Object$entries.length; _i++) {
	        _loop();
	      }
	    }
	  },
	  methods: {
	    emitFilesChanged: function emitFilesChanged() {
	      var _this$$refs2, _this$$refs2$tileWidg;
	      var uploader = (_this$$refs2 = this.$refs) === null || _this$$refs2 === void 0 ? void 0 : (_this$$refs2$tileWidg = _this$$refs2.tileWidget) === null || _this$$refs2$tileWidg === void 0 ? void 0 : _this$$refs2$tileWidg.uploader;
	      if (!uploader) {
	        return;
	      }
	      var fileIds = uploader.getFiles().map(function (value) {
	        return value.getServerFileId();
	      });
	      this.$emit('filesChanged', fileIds);
	    }
	  },
	  template: "\n\t\t<div ref=\"ragUploaderHiddenFields\"></div>\n\t\t<TileWidgetComponent :uploaderOptions=\"uploaderOptions\" :widgetOptions=\"widgetOptions\" ref=\"tileWidget\"/>\n\t"
	};

	var MAX_DESCRIPTION_LENGTH = 500;
	// @vue/component
	var KnowledgeBaseComponent = {
	  name: 'KnowledgeBaseComponent',
	  components: {
	    RagFileUploader: RagFileUploader,
	    BIcon: ui_iconSet_api_vue.BIcon
	  },
	  props: {
	    /** @type KnowledgeBase */
	    base: {
	      type: Object,
	      required: true
	    },
	    saving: {
	      type: Boolean,
	      "default": false
	    },
	    error: {
	      type: String,
	      "default": ''
	    }
	  },
	  emits: ['updated', 'remove'],
	  data: function data() {
	    return {
	      isEditing: false
	    };
	  },
	  computed: {
	    OutlineIcons: function OutlineIcons() {
	      return ui_iconSet_api_core.Outline;
	    },
	    getCounterValue: function getCounterValue() {
	      var length = (this.base.description || '').length;
	      return "".concat(length, "/").concat(MAX_DESCRIPTION_LENGTH);
	    }
	  },
	  created: function created() {
	    if (!this.base.uid) {
	      this.isEditing = true;
	    }
	  },
	  methods: {
	    onNameInput: function onNameInput(event) {
	      this.emitUpdate('name', event.target.value);
	    },
	    onDescriptionInput: function onDescriptionInput(event) {
	      var currentValue = event.target.value;
	      if (currentValue.length > MAX_DESCRIPTION_LENGTH) {
	        currentValue = currentValue.slice(0, MAX_DESCRIPTION_LENGTH);
	        event.target.value = currentValue;
	      }
	      this.emitUpdate('description', currentValue);
	    },
	    onFilesChanged: function onFilesChanged(fileIds) {
	      this.emitUpdate('fileIds', fileIds);
	    },
	    emitUpdate: function emitUpdate(name, value) {
	      this.$emit('updated', {
	        name: name,
	        value: value
	      });
	    },
	    switchToEditMode: function switchToEditMode() {
	      if (!this.saving) {
	        this.isEditing = true;
	      }
	    },
	    showConfirmPopup: function showConfirmPopup() {
	      var _this = this;
	      var popup = new ui_dialogs_messagebox.MessageBox({
	        message: this.$Bitrix.Loc.getMessage('BIZPROC_JS_RAG_SELECTOR_BASE_DELETE_CONFIRM'),
	        modal: true,
	        buttons: BX.UI.Dialogs.MessageBoxButtons.OK_CANCEL,
	        onOk: function onOk(messageBox) {
	          _this.$emit('remove');
	          messageBox.close();
	        },
	        okCaption: this.$Bitrix.Loc.getMessage('BIZPROC_JS_RAG_SELECTOR_BASE_DELETE_OK'),
	        onCancel: function onCancel(messageBox) {
	          messageBox.close();
	        },
	        useAirDesign: true,
	        maxWidth: 300
	      });
	      popup.show();
	    }
	  },
	  template: "\n\t\t<div class=\"bizproc-rag-selector__base\" :class=\"{'--view': !isEditing}\">\n\t\t\t<BIcon\n\t\t\t\t:name=\"OutlineIcons.CROSS_L\"\n\t\t\t\t:hoverable=\"true\"\n\t\t\t\t:size=\"20\"\n\t\t\t\tcolor=\"#a8adb4\"\n\t\t\t\t@click=\"showConfirmPopup()\"\n\t\t\t\tdata-test-id=\"bizproc-rag-selector__knowledge-delete-btn\"\n\t\t\t\tclass=\"bizproc-rag-selector__base-remove-icon\"\n\t\t\t/>\n\t\t\t<template v-if=\"isEditing\">\n\t\t\t\t<div v-if=\"error\" class=\"bizproc-rag-selector__base-error\">\n\t\t\t\t\t<span class=\"ui-alert-message\">{{ error }}</span>\n\t\t\t\t</div>\n\t\t\t\t<div class=\"ui-form-row\">\n\t\t\t\t\t<div class=\"ui-form-label --required\">\n\t\t\t\t\t\t<div class=\"ui-ctl-label-text bizproc-setup-template__label-text\">\n\t\t\t\t\t\t\t{{ $Bitrix.Loc.getMessage('BIZPROC_JS_RAG_SELECTOR_BASE_NAME_LABEL') }}\n\t\t\t\t\t\t</div>\n\t\t\t\t\t</div>\n\t\t\t\t\t<div class=\"ui-form-content\">\n\t\t\t\t\t\t<div class=\"ui-ctl ui-ctl-w100\">\n\t\t\t\t\t\t\t<input \n\t\t\t\t\t\t\t\ttype=\"text\" \n\t\t\t\t\t\t\t\tclass=\"ui-ctl-element\"\n\t\t\t\t\t\t\t\t:value=\"base.name\"\n\t\t\t\t\t\t\t\t:disabled=\"saving\"\n\t\t\t\t\t\t\t\t:placeholder=\"$Bitrix.Loc.getMessage('BIZPROC_JS_RAG_SELECTOR_BASE_NAME_PLACEHOLDER')\"\n\t\t\t\t\t\t\t\t@input=\"onNameInput\"\n\t\t\t\t\t\t\t\tdata-test-id=\"bizproc-rag-selector__name-field\"\n\t\t\t\t\t\t\t/>\n\t\t\t\t\t\t</div>\n\t\t\t\t\t</div>\n\t\t\t\t</div>\n\t\t\t\t<div class=\"ui-form-row\">\n\t\t\t\t\t<div class=\"ui-form-label --required\">\n\t\t\t\t\t\t<div class=\"ui-ctl-label-text\">\n\t\t\t\t\t\t\t{{ $Bitrix.Loc.getMessage('BIZPROC_JS_RAG_SELECTOR_BASE_DESCRIPTION_LABEL') }}\n\t\t\t\t\t\t</div>\n\t\t\t\t\t</div>\n\t\t\t\t\t<div class=\"ui-form-content\">\n\t\t\t\t\t\t<div class=\"bizproc-setup-template__textarea-wrapper\">\n\t\t\t\t\t\t\t<div class=\"ui-ctl ui-ctl-textarea ui-ctl-w100\">\n\t\t\t\t\t\t\t\t<textarea\n\t\t\t\t\t\t\t\t\tclass=\"ui-ctl-element\"\n\t\t\t\t\t\t\t\t\t:value=\"base.description\"\n\t\t\t\t\t\t\t\t\t:disabled=\"saving\"\n\t\t\t\t\t\t\t\t\t:placeholder=\"$Bitrix.Loc.getMessage('BIZPROC_JS_RAG_SELECTOR_BASE_DESCRIPTION_PLACEHOLDER')\"\n\t\t\t\t\t\t\t\t\t@input=\"onDescriptionInput\"\n\t\t\t\t\t\t\t\t\tdata-test-id=\"bizproc-rag-selector__description-field\"\n\t\t\t\t\t\t\t\t></textarea>\n\t\t\t\t\t\t\t</div>\n\t\t\t\t\t\t\t<div class=\"bizproc-rag-selector__char-counter\">\n\t\t\t\t\t\t\t\t{{ getCounterValue }}\n\t\t\t\t\t\t\t</div>\n\t\t\t\t\t\t</div>\n\t\t\t\t\t</div>\n\t\t\t\t</div>\n\t\t\t\t<div class=\"ui-form-row --uploader\">\n\t\t\t\t\t<div class=\"ui-form-label --required\">\n\t\t\t\t\t\t<div class=\"ui-ctl-label-text\">\n\t\t\t\t\t\t\t{{ $Bitrix.Loc.getMessage('BIZPROC_JS_RAG_SELECTOR_BASE_FILE_LABEL') }}\n\t\t\t\t\t\t</div>\n\t\t\t\t\t</div>\n\t\t\t\t\t<div class=\"bizproc-rag-selector__base-text\">\n\t\t\t\t\t\t{{ $Bitrix.Loc.getMessage('BIZPROC_JS_RAG_SELECTOR_BASE_FILE_DESC') }}\n\t\t\t\t\t</div>\n\t\t\t\t\t<RagFileUploader\n\t\t\t\t\t\t:key=\"base.uid\"\n\t\t\t\t\t\t:readonly=\"saving\"\n\t\t\t\t\t\t:knowledgeBaseUid=\"base.uid\"\n\t\t\t\t\t\t:fileIds=\"base.fileIds\"\n\t\t\t\t\t\t:fileIdsReplaces=\"base.fileIdsReplaces\"\n\t\t\t\t\t\t@filesChanged=\"onFilesChanged\"\n\t\t\t\t\t/>\n\t\t\t\t</div>\n\t\t\t</template>\n\t\t\t<template v-else>\n\t\t\t\t<div v-if=\"error\" class=\"bizproc-rag-selector__base-error\">\n\t\t\t\t\t<span class=\"ui-alert-message\">{{ error }}</span>\n\t\t\t\t</div>\n\t\t\t\t<div class=\"ui-ctl-label-text\">\n\t\t\t\t\t{{ $Bitrix.Loc.getMessage('BIZPROC_JS_RAG_SELECTOR_BASE_NAME_VIEW') }}\n\t\t\t\t</div>\n\t\t\t\t<div class=\"bizproc-rag-selector__base-view-title\" @click=\"switchToEditMode\">{{ base.name }}</div>\n\t\t\t\t<div class=\"bizproc-rag-selector__base-view-desc\">{{ base.description }}</div>\n\t\t\t</template>\n\t\t</div>\n\t"
	};

	function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); enumerableOnly && (symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; })), keys.push.apply(keys, symbols); } return keys; }
	function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = null != arguments[i] ? arguments[i] : {}; i % 2 ? ownKeys(Object(source), !0).forEach(function (key) { babelHelpers.defineProperty(target, key, source[key]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } return target; }
	function _regeneratorRuntime$1() { /*! regenerator-runtime -- Copyright (c) 2014-present, Facebook, Inc. -- license (MIT): https://github.com/facebook/regenerator/blob/main/LICENSE */ _regeneratorRuntime$1 = function _regeneratorRuntime() { return exports; }; var exports = {}, Op = Object.prototype, hasOwn = Op.hasOwnProperty, defineProperty = Object.defineProperty || function (obj, key, desc) { obj[key] = desc.value; }, $Symbol = "function" == typeof Symbol ? Symbol : {}, iteratorSymbol = $Symbol.iterator || "@@iterator", asyncIteratorSymbol = $Symbol.asyncIterator || "@@asyncIterator", toStringTagSymbol = $Symbol.toStringTag || "@@toStringTag"; function define(obj, key, value) { return Object.defineProperty(obj, key, { value: value, enumerable: !0, configurable: !0, writable: !0 }), obj[key]; } try { define({}, ""); } catch (err) { define = function define(obj, key, value) { return obj[key] = value; }; } function wrap(innerFn, outerFn, self, tryLocsList) { var protoGenerator = outerFn && outerFn.prototype instanceof Generator ? outerFn : Generator, generator = Object.create(protoGenerator.prototype), context = new Context(tryLocsList || []); return defineProperty(generator, "_invoke", { value: makeInvokeMethod(innerFn, self, context) }), generator; } function tryCatch(fn, obj, arg) { try { return { type: "normal", arg: fn.call(obj, arg) }; } catch (err) { return { type: "throw", arg: err }; } } exports.wrap = wrap; var ContinueSentinel = {}; function Generator() {} function GeneratorFunction() {} function GeneratorFunctionPrototype() {} var IteratorPrototype = {}; define(IteratorPrototype, iteratorSymbol, function () { return this; }); var getProto = Object.getPrototypeOf, NativeIteratorPrototype = getProto && getProto(getProto(values([]))); NativeIteratorPrototype && NativeIteratorPrototype !== Op && hasOwn.call(NativeIteratorPrototype, iteratorSymbol) && (IteratorPrototype = NativeIteratorPrototype); var Gp = GeneratorFunctionPrototype.prototype = Generator.prototype = Object.create(IteratorPrototype); function defineIteratorMethods(prototype) { ["next", "throw", "return"].forEach(function (method) { define(prototype, method, function (arg) { return this._invoke(method, arg); }); }); } function AsyncIterator(generator, PromiseImpl) { function invoke(method, arg, resolve, reject) { var record = tryCatch(generator[method], generator, arg); if ("throw" !== record.type) { var result = record.arg, value = result.value; return value && "object" == babelHelpers["typeof"](value) && hasOwn.call(value, "__await") ? PromiseImpl.resolve(value.__await).then(function (value) { invoke("next", value, resolve, reject); }, function (err) { invoke("throw", err, resolve, reject); }) : PromiseImpl.resolve(value).then(function (unwrapped) { result.value = unwrapped, resolve(result); }, function (error) { return invoke("throw", error, resolve, reject); }); } reject(record.arg); } var previousPromise; defineProperty(this, "_invoke", { value: function value(method, arg) { function callInvokeWithMethodAndArg() { return new PromiseImpl(function (resolve, reject) { invoke(method, arg, resolve, reject); }); } return previousPromise = previousPromise ? previousPromise.then(callInvokeWithMethodAndArg, callInvokeWithMethodAndArg) : callInvokeWithMethodAndArg(); } }); } function makeInvokeMethod(innerFn, self, context) { var state = "suspendedStart"; return function (method, arg) { if ("executing" === state) throw new Error("Generator is already running"); if ("completed" === state) { if ("throw" === method) throw arg; return doneResult(); } for (context.method = method, context.arg = arg;;) { var delegate = context.delegate; if (delegate) { var delegateResult = maybeInvokeDelegate(delegate, context); if (delegateResult) { if (delegateResult === ContinueSentinel) continue; return delegateResult; } } if ("next" === context.method) context.sent = context._sent = context.arg;else if ("throw" === context.method) { if ("suspendedStart" === state) throw state = "completed", context.arg; context.dispatchException(context.arg); } else "return" === context.method && context.abrupt("return", context.arg); state = "executing"; var record = tryCatch(innerFn, self, context); if ("normal" === record.type) { if (state = context.done ? "completed" : "suspendedYield", record.arg === ContinueSentinel) continue; return { value: record.arg, done: context.done }; } "throw" === record.type && (state = "completed", context.method = "throw", context.arg = record.arg); } }; } function maybeInvokeDelegate(delegate, context) { var methodName = context.method, method = delegate.iterator[methodName]; if (undefined === method) return context.delegate = null, "throw" === methodName && delegate.iterator["return"] && (context.method = "return", context.arg = undefined, maybeInvokeDelegate(delegate, context), "throw" === context.method) || "return" !== methodName && (context.method = "throw", context.arg = new TypeError("The iterator does not provide a '" + methodName + "' method")), ContinueSentinel; var record = tryCatch(method, delegate.iterator, context.arg); if ("throw" === record.type) return context.method = "throw", context.arg = record.arg, context.delegate = null, ContinueSentinel; var info = record.arg; return info ? info.done ? (context[delegate.resultName] = info.value, context.next = delegate.nextLoc, "return" !== context.method && (context.method = "next", context.arg = undefined), context.delegate = null, ContinueSentinel) : info : (context.method = "throw", context.arg = new TypeError("iterator result is not an object"), context.delegate = null, ContinueSentinel); } function pushTryEntry(locs) { var entry = { tryLoc: locs[0] }; 1 in locs && (entry.catchLoc = locs[1]), 2 in locs && (entry.finallyLoc = locs[2], entry.afterLoc = locs[3]), this.tryEntries.push(entry); } function resetTryEntry(entry) { var record = entry.completion || {}; record.type = "normal", delete record.arg, entry.completion = record; } function Context(tryLocsList) { this.tryEntries = [{ tryLoc: "root" }], tryLocsList.forEach(pushTryEntry, this), this.reset(!0); } function values(iterable) { if (iterable) { var iteratorMethod = iterable[iteratorSymbol]; if (iteratorMethod) return iteratorMethod.call(iterable); if ("function" == typeof iterable.next) return iterable; if (!isNaN(iterable.length)) { var i = -1, next = function next() { for (; ++i < iterable.length;) if (hasOwn.call(iterable, i)) return next.value = iterable[i], next.done = !1, next; return next.value = undefined, next.done = !0, next; }; return next.next = next; } } return { next: doneResult }; } function doneResult() { return { value: undefined, done: !0 }; } return GeneratorFunction.prototype = GeneratorFunctionPrototype, defineProperty(Gp, "constructor", { value: GeneratorFunctionPrototype, configurable: !0 }), defineProperty(GeneratorFunctionPrototype, "constructor", { value: GeneratorFunction, configurable: !0 }), GeneratorFunction.displayName = define(GeneratorFunctionPrototype, toStringTagSymbol, "GeneratorFunction"), exports.isGeneratorFunction = function (genFun) { var ctor = "function" == typeof genFun && genFun.constructor; return !!ctor && (ctor === GeneratorFunction || "GeneratorFunction" === (ctor.displayName || ctor.name)); }, exports.mark = function (genFun) { return Object.setPrototypeOf ? Object.setPrototypeOf(genFun, GeneratorFunctionPrototype) : (genFun.__proto__ = GeneratorFunctionPrototype, define(genFun, toStringTagSymbol, "GeneratorFunction")), genFun.prototype = Object.create(Gp), genFun; }, exports.awrap = function (arg) { return { __await: arg }; }, defineIteratorMethods(AsyncIterator.prototype), define(AsyncIterator.prototype, asyncIteratorSymbol, function () { return this; }), exports.AsyncIterator = AsyncIterator, exports.async = function (innerFn, outerFn, self, tryLocsList, PromiseImpl) { void 0 === PromiseImpl && (PromiseImpl = Promise); var iter = new AsyncIterator(wrap(innerFn, outerFn, self, tryLocsList), PromiseImpl); return exports.isGeneratorFunction(outerFn) ? iter : iter.next().then(function (result) { return result.done ? result.value : iter.next(); }); }, defineIteratorMethods(Gp), define(Gp, toStringTagSymbol, "Generator"), define(Gp, iteratorSymbol, function () { return this; }), define(Gp, "toString", function () { return "[object Generator]"; }), exports.keys = function (val) { var object = Object(val), keys = []; for (var key in object) keys.push(key); return keys.reverse(), function next() { for (; keys.length;) { var key = keys.pop(); if (key in object) return next.value = key, next.done = !1, next; } return next.done = !0, next; }; }, exports.values = values, Context.prototype = { constructor: Context, reset: function reset(skipTempReset) { if (this.prev = 0, this.next = 0, this.sent = this._sent = undefined, this.done = !1, this.delegate = null, this.method = "next", this.arg = undefined, this.tryEntries.forEach(resetTryEntry), !skipTempReset) for (var name in this) "t" === name.charAt(0) && hasOwn.call(this, name) && !isNaN(+name.slice(1)) && (this[name] = undefined); }, stop: function stop() { this.done = !0; var rootRecord = this.tryEntries[0].completion; if ("throw" === rootRecord.type) throw rootRecord.arg; return this.rval; }, dispatchException: function dispatchException(exception) { if (this.done) throw exception; var context = this; function handle(loc, caught) { return record.type = "throw", record.arg = exception, context.next = loc, caught && (context.method = "next", context.arg = undefined), !!caught; } for (var i = this.tryEntries.length - 1; i >= 0; --i) { var entry = this.tryEntries[i], record = entry.completion; if ("root" === entry.tryLoc) return handle("end"); if (entry.tryLoc <= this.prev) { var hasCatch = hasOwn.call(entry, "catchLoc"), hasFinally = hasOwn.call(entry, "finallyLoc"); if (hasCatch && hasFinally) { if (this.prev < entry.catchLoc) return handle(entry.catchLoc, !0); if (this.prev < entry.finallyLoc) return handle(entry.finallyLoc); } else if (hasCatch) { if (this.prev < entry.catchLoc) return handle(entry.catchLoc, !0); } else { if (!hasFinally) throw new Error("try statement without catch or finally"); if (this.prev < entry.finallyLoc) return handle(entry.finallyLoc); } } } }, abrupt: function abrupt(type, arg) { for (var i = this.tryEntries.length - 1; i >= 0; --i) { var entry = this.tryEntries[i]; if (entry.tryLoc <= this.prev && hasOwn.call(entry, "finallyLoc") && this.prev < entry.finallyLoc) { var finallyEntry = entry; break; } } finallyEntry && ("break" === type || "continue" === type) && finallyEntry.tryLoc <= arg && arg <= finallyEntry.finallyLoc && (finallyEntry = null); var record = finallyEntry ? finallyEntry.completion : {}; return record.type = type, record.arg = arg, finallyEntry ? (this.method = "next", this.next = finallyEntry.finallyLoc, ContinueSentinel) : this.complete(record); }, complete: function complete(record, afterLoc) { if ("throw" === record.type) throw record.arg; return "break" === record.type || "continue" === record.type ? this.next = record.arg : "return" === record.type ? (this.rval = this.arg = record.arg, this.method = "return", this.next = "end") : "normal" === record.type && afterLoc && (this.next = afterLoc), ContinueSentinel; }, finish: function finish(finallyLoc) { for (var i = this.tryEntries.length - 1; i >= 0; --i) { var entry = this.tryEntries[i]; if (entry.finallyLoc === finallyLoc) return this.complete(entry.completion, entry.afterLoc), resetTryEntry(entry), ContinueSentinel; } }, "catch": function _catch(tryLoc) { for (var i = this.tryEntries.length - 1; i >= 0; --i) { var entry = this.tryEntries[i]; if (entry.tryLoc === tryLoc) { var record = entry.completion; if ("throw" === record.type) { var thrown = record.arg; resetTryEntry(entry); } return thrown; } } throw new Error("illegal catch attempt"); }, delegateYield: function delegateYield(iterable, resultName, nextLoc) { return this.delegate = { iterator: values(iterable), resultName: resultName, nextLoc: nextLoc }, "next" === this.method && (this.arg = undefined), ContinueSentinel; } }, exports; }
	var BEFORE_SUBMIT_EVENT = 'Bizproc:SetupTemplate:beforeSubmit';
	var ErrorTypes = Object.freeze({
	  REQUIRED: 'required',
	  LOADING: 'loading'
	});

	// @vue/component
	var RagAppComponent = {
	  name: 'RagAppComponent',
	  components: {
	    KnowledgeBaseComponent: KnowledgeBaseComponent,
	    UiButton: ui_vue3_components_button.Button
	  },
	  props: {
	    /** @type Array<KnowledgeBase> */
	    existedKnowledgeBases: {
	      type: Array,
	      "default": function _default() {
	        return [];
	      }
	    },
	    modelValue: {
	      type: [Array, String],
	      "default": function _default() {
	        return [];
	      }
	    },
	    isMultiple: {
	      type: Boolean,
	      "default": false
	    },
	    isRequired: {
	      type: Boolean,
	      "default": false
	    }
	  },
	  emits: ['update:modelValue'],
	  data: function data() {
	    var _this$existedKnowledg;
	    return {
	      bases: (_this$existedKnowledg = this.existedKnowledgeBases) !== null && _this$existedKnowledg !== void 0 ? _this$existedKnowledg : [],
	      isSaving: false,
	      isLoading: false,
	      errorType: null,
	      errorMessage: '',
	      baseErrors: []
	    };
	  },
	  computed: {
	    AirButtonStyle: function AirButtonStyle() {
	      return ui_vue3_components_button.AirButtonStyle;
	    },
	    ButtonSize: function ButtonSize() {
	      return ui_vue3_components_button.ButtonSize;
	    },
	    buttonAddBaseText: function buttonAddBaseText() {
	      return this.$Bitrix.Loc.getMessage('BIZPROC_JS_RAG_SELECTOR_ADD_KNOWLEDGE_BASE_BUTTON_TEXT');
	    },
	    isRagAvailable: function isRagAvailable() {
	      var settings = main_core.Extension.getSettings('bizproc.rag-selector');
	      return settings.get('isAvailable', false);
	    },
	    basesCount: function basesCount() {
	      return this.bases.length;
	    },
	    maxBasesCount: function maxBasesCount() {
	      if (this.isMultiple) {
	        var settings = main_core.Extension.getSettings('bizproc.rag-selector');
	        return settings.get('maxBasesCountPerField', 1);
	      }
	      return 1;
	    },
	    showAddButton: function showAddButton() {
	      return this.basesCount < this.maxBasesCount;
	    },
	    loadingErrorText: function loadingErrorText() {
	      if (this.errorType === ErrorTypes.LOADING) {
	        return this.errorMessage;
	      }
	      return '';
	    },
	    isRequiredError: function isRequiredError() {
	      return this.errorType === ErrorTypes.REQUIRED;
	    }
	  },
	  watch: {
	    modelValue: function modelValue(newIds, oldIds) {
	      if (!deepEqual(newIds, oldIds)) {
	        this.loadInitialBases();
	      }
	    },
	    bases: {
	      handler: function handler() {
	        this.clearError();
	      },
	      deep: true
	    }
	  },
	  mounted: function mounted() {
	    var _this = this;
	    return babelHelpers.asyncToGenerator( /*#__PURE__*/_regeneratorRuntime$1().mark(function _callee() {
	      var slider;
	      return _regeneratorRuntime$1().wrap(function _callee$(_context) {
	        while (1) switch (_context.prev = _context.next) {
	          case 0:
	            main_core_events.EventEmitter.subscribe(BEFORE_SUBMIT_EVENT, _this.onSendAll);
	            slider = BX.SidePanel.Instance.getTopSlider();
	            if (slider) {
	              main_core_events.EventEmitter.subscribe(slider, 'SidePanel.Slider:onClose', _this.cleanupSubscriptions);
	            }
	            _context.next = 5;
	            return _this.loadInitialBases();
	          case 5:
	          case "end":
	            return _context.stop();
	        }
	      }, _callee);
	    }))();
	  },
	  beforeUnmount: function beforeUnmount() {
	    this.cleanupSubscriptions();
	  },
	  methods: {
	    loadInitialBases: function loadInitialBases() {
	      var _this2 = this;
	      return babelHelpers.asyncToGenerator( /*#__PURE__*/_regeneratorRuntime$1().mark(function _callee2() {
	        var initialValues, idsToLoad, promises;
	        return _regeneratorRuntime$1().wrap(function _callee2$(_context2) {
	          while (1) switch (_context2.prev = _context2.next) {
	            case 0:
	              initialValues = main_core.Type.isArray(_this2.modelValue) ? _this2.modelValue : [_this2.modelValue];
	              idsToLoad = initialValues.filter(Boolean);
	              if (!(idsToLoad.length === 0)) {
	                _context2.next = 4;
	                break;
	              }
	              return _context2.abrupt("return");
	            case 4:
	              _this2.isLoading = true;
	              _context2.prev = 5;
	              promises = idsToLoad.map(function (uid) {
	                return KnowledgeBaseApi.get(uid);
	              });
	              _context2.next = 9;
	              return Promise.all(promises);
	            case 9:
	              _this2.bases = _context2.sent;
	              _context2.next = 16;
	              break;
	            case 12:
	              _context2.prev = 12;
	              _context2.t0 = _context2["catch"](5);
	              _this2.errorMessage = _this2.getErrorFromResponse(_context2.t0);
	              _this2.errorType = ErrorTypes.LOADING;
	            case 16:
	              _context2.prev = 16;
	              _this2.isLoading = false;
	              return _context2.finish(16);
	            case 19:
	            case "end":
	              return _context2.stop();
	          }
	        }, _callee2, null, [[5, 12, 16, 19]]);
	      }))();
	    },
	    getErrorFromResponse: function getErrorFromResponse(response) {
	      if (!response.errors) {
	        return '';
	      }
	      if (!main_core.Type.isArrayFilled(response.errors)) {
	        return this.$Bitrix.Loc.getMessage('BIZPROC_JS_RAG_SELECTOR_LOAD_BASES_ERROR');
	      }
	      var _response$errors = babelHelpers.slicedToArray(response.errors, 1),
	        firstError = _response$errors[0];
	      return firstError.message;
	    },
	    onAddBase: function onAddBase() {
	      this.bases.push(this.makeEmptyKnowledgeBase());
	    },
	    makeEmptyKnowledgeBase: function makeEmptyKnowledgeBase() {
	      return {
	        uid: '',
	        name: '',
	        description: '',
	        fileIds: [],
	        fileIdsReplaces: null
	      };
	    },
	    onBasePropertyUpdated: function onBasePropertyUpdated(index, changed) {
	      if (!this.bases[index]) {
	        return;
	      }
	      var baseToUpdate = this.bases[index];
	      var currentValue = baseToUpdate[changed.name];
	      if (deepEqual(currentValue, changed.value)) {
	        return;
	      }
	      var newErrors = babelHelpers.toConsumableArray(this.baseErrors);
	      if (newErrors[index]) {
	        newErrors[index] = '';
	      }
	      this.baseErrors = newErrors;
	      baseToUpdate[changed.name] = changed.value;
	    },
	    onBaseRemove: function onBaseRemove(index) {
	      this.bases.splice(index, 1);
	      this.clearError();
	    },
	    emitIds: function emitIds() {
	      var savedUids = this.bases.map(function (base) {
	        return base.uid;
	      }).filter(Boolean);
	      this.$emit('update:modelValue', savedUids);
	    },
	    validate: function validate() {
	      var _this3 = this;
	      this.clearError();
	      var errors = [];
	      var isAllValid = true;
	      if (this.isRequired && this.bases.length === 0) {
	        this.errorMessage = this.$Bitrix.Loc.getMessage('BIZPROC_JS_RAG_SELECTOR_VALIDATION_REQUIRED');
	        this.errorType = ErrorTypes.REQUIRED;
	        return false;
	      }
	      this.bases.forEach(function (base, index) {
	        if (_this3.isBaseIncomplete(base)) {
	          errors[index] = _this3.$Bitrix.Loc.getMessage('BIZPROC_JS_RAG_SELECTOR_VALIDATION_INCOMPLETE');
	          isAllValid = false;
	        } else {
	          errors[index] = '';
	        }
	      });
	      this.baseErrors = errors;
	      return isAllValid;
	    },
	    isBaseIncomplete: function isBaseIncomplete(base) {
	      return !main_core.Type.isString(base.name) || base.name.trim() === '' || !main_core.Type.isString(base.description) || base.description.trim() === '' || !main_core.Type.isArrayFilled(base.fileIds);
	    },
	    onSendAll: function onSendAll() {
	      var _this4 = this;
	      return babelHelpers.asyncToGenerator( /*#__PURE__*/_regeneratorRuntime$1().mark(function _callee3() {
	        var i, baseToSave, savedBase, currentBases;
	        return _regeneratorRuntime$1().wrap(function _callee3$(_context3) {
	          while (1) switch (_context3.prev = _context3.next) {
	            case 0:
	              if (_this4.validate()) {
	                _context3.next = 2;
	                break;
	              }
	              return _context3.abrupt("return", false);
	            case 2:
	              _this4.isSaving = true;
	              _context3.prev = 3;
	              i = 0;
	            case 5:
	              if (!(i < _this4.bases.length)) {
	                _context3.next = 16;
	                break;
	              }
	              baseToSave = _this4.bases[i]; // eslint-disable-next-line no-await-in-loop
	              _context3.next = 9;
	              return _this4.saveBase(baseToSave);
	            case 9:
	              savedBase = _context3.sent;
	              currentBases = babelHelpers.toConsumableArray(_this4.bases);
	              currentBases[i] = savedBase;
	              _this4.bases = currentBases;
	            case 13:
	              i++;
	              _context3.next = 5;
	              break;
	            case 16:
	              _this4.emitIds();
	            case 17:
	              _context3.prev = 17;
	              _this4.isSaving = false;
	              return _context3.finish(17);
	            case 20:
	              return _context3.abrupt("return", true);
	            case 21:
	            case "end":
	              return _context3.stop();
	          }
	        }, _callee3, null, [[3,, 17, 20]]);
	      }))();
	    },
	    saveBase: function saveBase(base) {
	      if (base.uid) {
	        return this.updateBase(base);
	      }
	      return this.createBase(base);
	    },
	    createBase: function createBase(base) {
	      return babelHelpers.asyncToGenerator( /*#__PURE__*/_regeneratorRuntime$1().mark(function _callee4() {
	        var modifyResult;
	        return _regeneratorRuntime$1().wrap(function _callee4$(_context4) {
	          while (1) switch (_context4.prev = _context4.next) {
	            case 0:
	              _context4.next = 2;
	              return KnowledgeBaseApi.create(base.name, base.description, base.fileIds);
	            case 2:
	              modifyResult = _context4.sent;
	              return _context4.abrupt("return", _objectSpread(_objectSpread({}, base), {}, {
	                fileIds: modifyResult.fileIds,
	                uid: modifyResult.uid,
	                fileIdsReplaces: modifyResult.fileIdsReplaces
	              }));
	            case 4:
	            case "end":
	              return _context4.stop();
	          }
	        }, _callee4);
	      }))();
	    },
	    updateBase: function updateBase(base) {
	      return babelHelpers.asyncToGenerator( /*#__PURE__*/_regeneratorRuntime$1().mark(function _callee5() {
	        var modifyResult;
	        return _regeneratorRuntime$1().wrap(function _callee5$(_context5) {
	          while (1) switch (_context5.prev = _context5.next) {
	            case 0:
	              _context5.next = 2;
	              return KnowledgeBaseApi.update(base.uid, base.name, base.description, base.fileIds);
	            case 2:
	              modifyResult = _context5.sent;
	              return _context5.abrupt("return", _objectSpread(_objectSpread({}, base), {}, {
	                fileIds: modifyResult.fileIds,
	                fileIdsReplaces: modifyResult.fileIdsReplaces
	              }));
	            case 4:
	            case "end":
	              return _context5.stop();
	          }
	        }, _callee5);
	      }))();
	    },
	    clearError: function clearError() {
	      this.errorType = null;
	      this.errorMessage = '';
	      this.baseErrors = [];
	    },
	    cleanupSubscriptions: function cleanupSubscriptions() {
	      main_core_events.EventEmitter.unsubscribe(BEFORE_SUBMIT_EVENT, this.onSendAll);
	      var slider = BX.SidePanel.Instance.getTopSlider();
	      if (slider) {
	        main_core_events.EventEmitter.unsubscribe(slider, 'SidePanel.Slider:onClose', this.cleanupSubscriptions);
	      }
	    }
	  },
	  template: "\n\t\t<div v-if=\"!isRagAvailable\" class=\"ui-alert ui-alert-danger\">\n\t\t\t<span class=\"ui-alert-message\">{{ $Bitrix.Loc.getMessage('BIZPROC_JS_RAG_SELECTOR_NOT_AVAILABLE_ERROR') }}</span>\n\t\t</div>\n\t\t<template v-else>\n\t\t\t<div v-if=\"loadingErrorText\" class=\"ui-alert ui-alert-danger\">\n\t\t\t\t<span class=\"ui-alert-message\">{{ loadingErrorText }}</span>\n\t\t\t</div>\n\t\t\t<KnowledgeBaseComponent\n\t\t\t\tv-for=\"(base, index) in bases\"\n\t\t\t\t:key=\"base.uid\"\n\t\t\t\t:base=\"base\"\n\t\t\t\t:saving=\"isSaving\"\n\t\t\t\t:error=\"baseErrors[index] ?? ''\"\n\t\t\t\t@updated=\"onBasePropertyUpdated(index, $event)\"\n\t\t\t\t@remove=\"onBaseRemove(index)\"\n\t\t\t/>\n\t\t\t<UiButton\n\t\t\t\tv-if=\"showAddButton\"\n\t\t\t\t:text=\"buttonAddBaseText\" \n\t\t\t\t:disabled=\"isSaving\"\n\t\t\t\t:style=\"AirButtonStyle.OUTLINE_ACCENT_2\"\n\t\t\t\t:size=\"ButtonSize.SMALL\"\n\t\t\t\t@click=\"onAddBase\"\n\t\t\t\ttype=\"button\"\n\t\t\t/>\n\t\t\t<div v-if=\"isRequiredError\" class=\"bizproc-setup-template__error-text\">\n\t\t\t\t<div class=\"ui-icon-set --warning\"></div>\n\t\t\t\t{{ errorMessage }}\n\t\t\t</div>\n\t\t</template>\n\t"
	};

	function initRagDevApp(container) {
	  var isMultiple = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
	  var existedKnowledgeBases = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : [];
	  var app = ui_vue3.BitrixVue.createApp(RagAppComponent, {
	    isMultiple: isMultiple,
	    existedKnowledgeBases: existedKnowledgeBases
	  });
	  app.mount(container);
	}

	exports.initRagDevApp = initRagDevApp;
	exports.RagAppComponent = RagAppComponent;

}((this.BX.Bizproc.RagSelector = this.BX.Bizproc.RagSelector || {}),BX.Vue3,BX.Event,BX.Vue3.Components,BX.UI,BX,BX.UI,BX,BX.UI.Uploader,BX.UI.Uploader,BX.UI.IconSet,BX.UI.IconSet,BX.UI.Dialogs));
//# sourceMappingURL=rag-selector.bundle.js.map
