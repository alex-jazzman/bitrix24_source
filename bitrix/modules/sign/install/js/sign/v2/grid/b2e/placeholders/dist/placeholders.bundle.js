/* eslint-disable */
this.BX = this.BX || {};
this.BX.Sign = this.BX.Sign || {};
this.BX.Sign.V2 = this.BX.Sign.V2 || {};
this.BX.Sign.V2.Grid = this.BX.Sign.V2.Grid || {};
(function (exports,sign_v2_b2e_vueUtil,sign_v2_helper,sign_v2_b2e_companySelector,sign_v2_b2e_hcmLinkCompanySelector,main_core,ui_vue3,sign_v2_api,sign_v2_b2e_fieldSelector,ui_buttons,main_loader) {
	'use strict';

	var TabType = {
	  BITRIX24: 'bitrix24',
	  HCM_LINK: 'hcmLink'
	};
	var SectionType = {
	  HCM_LINK: 'hcmLink',
	  EMPLOYEE: 'employee',
	  SMART_B2E_DOC: 'smartB2eDoc',
	  COMPANY: 'company',
	  REPRESENTATIVE: 'representative'
	};
	var SelectorType = {
	  hcmLinkCompany: 'hcmLinkCompany',
	  myCompany: 'myCompany'
	};

	// @vue/component
	var PlaceholderItem = {
	  name: 'PlaceholderItem',
	  mixins: [sign_v2_b2e_vueUtil.LocMixin],
	  props: {
	    placeholder: {
	      type: Object,
	      required: true
	    },
	    dataTestId: {
	      type: String,
	      "default": ''
	    },
	    sectionType: {
	      type: String,
	      "default": ''
	    }
	  },
	  data: function data() {
	    return {
	      isCopied: false
	    };
	  },
	  computed: {
	    placeholderValue: function placeholderValue() {
	      return "{".concat(this.placeholder.value, "}");
	    },
	    containerClasses: function containerClasses() {
	      return {
	        'sign-placeholders-item': true,
	        'sign-placeholders-item--copied': this.isCopied
	      };
	    },
	    typeIconClasses: function typeIconClasses() {
	      var iconType = Object.values(SectionType).includes(this.sectionType) ? this.sectionType : 'default';
	      return babelHelpers.defineProperty({
	        'sign-placeholders-type-icon': true
	      }, "sign-placeholders-type-icon--".concat(iconType), true);
	    }
	  },
	  methods: {
	    copyToClipboard: function copyToClipboard() {
	      var _BX,
	        _BX$clipboard,
	        _this = this;
	      if ((_BX = BX) !== null && _BX !== void 0 && (_BX$clipboard = _BX.clipboard) !== null && _BX$clipboard !== void 0 && _BX$clipboard.copy) {
	        top.BX.clipboard.copy(this.placeholderValue);
	        this.isCopied = true;
	        setTimeout(function () {
	          _this.isCopied = false;
	        }, 1000);
	      }
	      return false;
	    }
	  },
	  template: "\n\t\t<div :class=\"containerClasses\" @click=\"copyToClipboard\" :data-test-id=\"dataTestId\">\n\t\t\t<template v-if=\"isCopied\">\n\t\t\t\t<div class=\"sign-placeholders-copied\">\n\t\t\t\t\t<span class=\"sign-placeholders-copied-icon\"></span>\n\t\t\t\t\t<span class=\"sign-placeholders-copied-message\">\n\t\t\t\t\t\t{{ loc('PLACEHOLDER_LIST_COPIED_LABEL') }}\n\t\t\t\t\t</span>\n\t\t\t\t</div>\n\t\t\t</template>\n\t\t\t<template v-else>\n\t\t\t\t<div class=\"sign-placeholders-item-content\">\n\t\t\t\t\t<span :class=\"typeIconClasses\" :title=\"placeholder.value\"></span>\n\t\t\t\t\t<span class=\"sign-placeholders-item-name\">{{ placeholder.name }}</span>\n\t\t\t\t</div>\n\t\t\t\t<span class=\"sign-placeholders-copy-icon\" :title=\"placeholder.value\"></span>\n\t\t\t</template>\n\t\t</div>\n\t"
	};

	// @vue/component
	var PlaceholderSection = {
	  name: 'PlaceholderSection',
	  components: {
	    PlaceholderItem: PlaceholderItem
	  },
	  mixins: [sign_v2_b2e_vueUtil.LocMixin],
	  props: {
	    section: {
	      type: Object,
	      required: true
	    }
	  },
	  computed: {
	    hasSubsections: function hasSubsections() {
	      return Array.isArray(this.section.subsections) && this.section.subsections.length > 0;
	    },
	    hasItems: function hasItems() {
	      if (this.hasSubsections) {
	        return this.section.subsections.some(function (subsection) {
	          return subsection.items && subsection.items.length > 0;
	        });
	      }
	      return this.section.items && this.section.items.length > 0;
	    }
	  },
	  methods: {
	    getItemDataTestId: function getItemDataTestId() {
	      for (var _len = arguments.length, indices = new Array(_len), _key = 0; _key < _len; _key++) {
	        indices[_key] = arguments[_key];
	      }
	      return ['sign-placeholder-item', this.section.type].concat(indices).join('-');
	    },
	    getItemSectionType: function getItemSectionType() {
	      if (this.section.type === SectionType.HCM_LINK && this.section.subsectionType) {
	        return this.section.subsectionType;
	      }
	      return this.section.type;
	    }
	  },
	  template: "\n\t\t<div v-if=\"hasItems\" class=\"sign-placeholders-section\">\n\t\t\t<div class=\"sign-placeholders-section-title\">{{ section.title }}</div>\n\t\t\t<div v-if=\"!hasSubsections\" class=\"sign-placeholders-section-content\">\n\t\t\t\t<PlaceholderItem\n\t\t\t\t\tv-for=\"(item, index) in section.items\"\n\t\t\t\t\t:key=\"index\"\n\t\t\t\t\t:placeholder=\"item\"\n\t\t\t\t\t:section-type=\"getItemSectionType()\"\n\t\t\t\t\t:data-test-id=\"getItemDataTestId(index)\"\n\t\t\t\t/>\n\t\t\t</div>\n\n\t\t\t<div v-else>\n\t\t\t\t<div v-for=\"(subsection, index) in section.subsections\" :key=\"index\" class=\"sign-placeholders-subsection\">\n\t\t\t\t\t<div class=\"sign-placeholders-subsection-title\">{{ subsection.title }}</div>\n\t\t\t\t\t<div>\n\t\t\t\t\t\t<PlaceholderItem\n\t\t\t\t\t\t\tv-for=\"(item, itemIndex) in subsection.items\"\n\t\t\t\t\t\t\t:key=\"itemIndex\"\n\t\t\t\t\t\t\t:placeholder=\"item\"\n\t\t\t\t\t\t\t:section-type=\"getItemSectionType()\"\n\t\t\t\t\t\t\t:data-test-id=\"getItemDataTestId(index, itemIndex)\"\n\t\t\t\t\t\t/>\n\t\t\t\t\t</div>\n\t\t\t\t</div>\n\t\t\t</div>\n\t\t</div>\n\t"
	};

	// @vue/component
	var PlaceholderTabs = {
	  name: 'PlaceholderTabs',
	  mixins: [sign_v2_b2e_vueUtil.LocMixin],
	  props: {
	    currentTab: {
	      type: String,
	      required: true
	    }
	  },
	  data: function data() {
	    return {
	      TabType: TabType,
	      tabs: [{
	        type: TabType.BITRIX24,
	        locKey: 'PLACEHOLDER_LIST_TAB_BITRIX24'
	      }, {
	        type: TabType.HCM_LINK,
	        locKey: 'PLACEHOLDER_LIST_TAB_1C'
	      }]
	    };
	  },
	  methods: {
	    switchTab: function switchTab(tab) {
	      this.$emit('switch-tab', tab);
	    },
	    getTabDataTestId: function getTabDataTestId(type) {
	      return "sign-placeholder-tab-".concat(type);
	    }
	  },
	  template: "\n\t\t<div class=\"sign-placeholders-tabs\">\n\t\t\t<div\n\t\t\t\tv-for=\"tab in tabs\"\n\t\t\t\t:key=\"tab.type\"\n\t\t\t\tclass=\"sign-placeholders-tab\"\n\t\t\t\t:class=\"{ 'sign-placeholders-tab--active': currentTab === tab.type }\"\n\t\t\t\t@click=\"switchTab(tab.type)\"\n\t\t\t\t:data-test-id=\"getTabDataTestId(tab.type)\"\n\t\t\t>\n\t\t\t\t{{ loc(tab.locKey) }}\n\t\t\t</div>\n\t\t</div>\n\t"
	};

	// @vue/component
	var PlaceholderSearch = {
	  name: 'PlaceholderSearch',
	  mixins: [sign_v2_b2e_vueUtil.LocMixin],
	  props: {
	    searchQuery: {
	      type: String,
	      "default": ''
	    },
	    isHcmLinkTab: {
	      type: Boolean,
	      "default": false
	    }
	  },
	  computed: {
	    searchContainerClass: function searchContainerClass() {
	      return this.isHcmLinkTab ? 'sign-placeholders-search-hcmlink' : 'sign-placeholders-search';
	    }
	  },
	  methods: {
	    onInput: function onInput(event) {
	      this.$emit('update:searchQuery', event.target.value);
	    },
	    clearInput: function clearInput() {
	      this.$emit('update:searchQuery', '');
	    }
	  },
	  template: "\n\t\t<div :class=\"searchContainerClass\">\n\t\t\t<input\n\t\t\t\ttype=\"text\"\n\t\t\t\tclass=\"sign-placeholders-search-input\"\n\t\t\t\t:value=\"searchQuery\"\n\t\t\t\t@input=\"onInput\"\n\t\t\t\t:placeholder=\"loc('PLACEHOLDER_LIST_SEARCH_PLACEHOLDER')\"\n\t\t\t/>\n\t\t\t<div v-if=\"searchQuery\" class=\"sign-placeholders-search-icon-clear\" @click=\"clearInput\"></div>\n\t\t\t<div v-else class=\"sign-placeholders-search-icon-search\"></div>\n\t\t</div>\n\t"
	};

	// @vue/component
	var PlaceholderSearchNotFound = {
	  name: 'PlaceholderSearchNotFound',
	  mixins: [sign_v2_b2e_vueUtil.LocMixin],
	  template: "\n\t\t<div class=\"sign-placeholders-nothing-found-container\">\n\t\t\t<div class=\"sign-placeholders-nothing-found-img\"></div>\n\t\t\t<div class=\"sign-placeholders-nothing-found-text-container\">\n\t\t\t\t<div class=\"sign-placeholders-nothing-found-title\">\n\t\t\t\t\t{{ loc('PLACEHOLDER_LIST_NOTHING_FOUND_TITLE') }}\n\t\t\t\t</div>\n\t\t\t\t<div class=\"sign-placeholders-nothing-found-description\">\n\t\t\t\t\t{{ loc('PLACEHOLDER_LIST_NOTHING_FOUND_DESCRIPTION') }}\n\t\t\t\t</div>\n\t\t\t</div>\n\t\t</div>\n\t"
	};

	// @vue/component
	var PlaceholderSearchNotConfigured = {
	  name: 'PlaceholderSearchNotConfigured',
	  mixins: [sign_v2_b2e_vueUtil.LocMixin],
	  template: "\n\t\t<div class=\"sign-placeholders-nothing-found-container\">\n\t\t\t<div class=\"sign-placeholders-nothing-configured-img\"></div>\n\t\t\t<div class=\"sign-placeholders-nothing-found-text-container\">\n\t\t\t\t<div class=\"sign-placeholders-nothing-found-title\">\n\t\t\t\t\t{{ loc('PLACEHOLDER_LIST_NOTHING_CONFIGURED_TITLE') }}\n\t\t\t\t</div>\n\t\t\t\t<div class=\"sign-placeholders-nothing-found-description\">\n\t\t\t\t\t{{ loc('PLACEHOLDER_LIST_NOTHING_CONFIGURED_DESCRIPTION') }}\n\t\t\t\t</div>\n\t\t\t</div>\n\t\t</div>\n\t"
	};

	function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); enumerableOnly && (symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; })), keys.push.apply(keys, symbols); } return keys; }
	function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = null != arguments[i] ? arguments[i] : {}; i % 2 ? ownKeys(Object(source), !0).forEach(function (key) { babelHelpers.defineProperty(target, key, source[key]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } return target; }
	function _classPrivateMethodInitSpec(obj, privateSet) { _checkPrivateRedeclaration(obj, privateSet); privateSet.add(obj); }
	function _checkPrivateRedeclaration(obj, privateCollection) { if (privateCollection.has(obj)) { throw new TypeError("Cannot initialize the same private elements twice on an object"); } }
	function _classPrivateMethodGet(receiver, privateSet, fn) { if (!privateSet.has(receiver)) { throw new TypeError("attempted to get private field on non-instance"); } return fn; }
	var _hasContent = /*#__PURE__*/new WeakSet();
	var _filterSection = /*#__PURE__*/new WeakSet();
	var _filterNestedSection = /*#__PURE__*/new WeakSet();
	var _filterSimpleSection = /*#__PURE__*/new WeakSet();
	var _filterItems = /*#__PURE__*/new WeakSet();
	var SectionFilter = /*#__PURE__*/function () {
	  function SectionFilter() {
	    babelHelpers.classCallCheck(this, SectionFilter);
	    _classPrivateMethodInitSpec(this, _filterItems);
	    _classPrivateMethodInitSpec(this, _filterSimpleSection);
	    _classPrivateMethodInitSpec(this, _filterNestedSection);
	    _classPrivateMethodInitSpec(this, _filterSection);
	    _classPrivateMethodInitSpec(this, _hasContent);
	  }
	  babelHelpers.createClass(SectionFilter, [{
	    key: "filterBySearchQuery",
	    value: function filterBySearchQuery(sections, searchQuery) {
	      var _this = this;
	      var normalizedQueryValue = searchQuery.toLowerCase().trim();
	      if (!normalizedQueryValue) {
	        return sections;
	      }
	      return sections.map(function (section) {
	        return _classPrivateMethodGet(_this, _filterSection, _filterSection2).call(_this, section, normalizedQueryValue);
	      }).filter(function (section) {
	        return _classPrivateMethodGet(_this, _hasContent, _hasContent2).call(_this, section);
	      });
	    }
	  }]);
	  return SectionFilter;
	}();
	function _hasContent2(section) {
	  if (main_core.Type.isArray(section.subsections)) {
	    return section.subsections.some(function (subsection) {
	      return main_core.Type.isArray(subsection.items) && subsection.items.length > 0;
	    });
	  }
	  return !main_core.Type.isNil(section.items) || !main_core.Type.isNil(section.data);
	}
	function _filterSection2(section, query) {
	  if (main_core.Type.isArray(section.items)) {
	    return _classPrivateMethodGet(this, _filterSimpleSection, _filterSimpleSection2).call(this, section, query);
	  }
	  if (main_core.Type.isArray(section.subsections)) {
	    return _classPrivateMethodGet(this, _filterNestedSection, _filterNestedSection2).call(this, section, query);
	  }
	  return {};
	}
	function _filterNestedSection2(section, query) {
	  var _this2 = this;
	  var matchedSubsections = section.subsections.map(function (subsection) {
	    var matchedItems = _classPrivateMethodGet(_this2, _filterItems, _filterItems2).call(_this2, subsection.items, query);
	    return matchedItems.length > 0 ? _objectSpread(_objectSpread({}, subsection), {}, {
	      items: matchedItems
	    }) : null;
	  }).filter(Boolean);
	  return matchedSubsections.length > 0 ? _objectSpread(_objectSpread({}, section), {}, {
	    subsections: matchedSubsections
	  }) : {};
	}
	function _filterSimpleSection2(section, query) {
	  var matchedItems = _classPrivateMethodGet(this, _filterItems, _filterItems2).call(this, section.items, query);
	  return matchedItems.length > 0 ? _objectSpread(_objectSpread({}, section), {}, {
	    items: matchedItems
	  }) : {};
	}
	function _filterItems2(items, query) {
	  return items.filter(function (item) {
	    return item.name.toLowerCase().includes(query);
	  });
	}

	function _regeneratorRuntime() { /*! regenerator-runtime -- Copyright (c) 2014-present, Facebook, Inc. -- license (MIT): https://github.com/facebook/regenerator/blob/main/LICENSE */ _regeneratorRuntime = function _regeneratorRuntime() { return exports; }; var exports = {}, Op = Object.prototype, hasOwn = Op.hasOwnProperty, defineProperty = Object.defineProperty || function (obj, key, desc) { obj[key] = desc.value; }, $Symbol = "function" == typeof Symbol ? Symbol : {}, iteratorSymbol = $Symbol.iterator || "@@iterator", asyncIteratorSymbol = $Symbol.asyncIterator || "@@asyncIterator", toStringTagSymbol = $Symbol.toStringTag || "@@toStringTag"; function define(obj, key, value) { return Object.defineProperty(obj, key, { value: value, enumerable: !0, configurable: !0, writable: !0 }), obj[key]; } try { define({}, ""); } catch (err) { define = function define(obj, key, value) { return obj[key] = value; }; } function wrap(innerFn, outerFn, self, tryLocsList) { var protoGenerator = outerFn && outerFn.prototype instanceof Generator ? outerFn : Generator, generator = Object.create(protoGenerator.prototype), context = new Context(tryLocsList || []); return defineProperty(generator, "_invoke", { value: makeInvokeMethod(innerFn, self, context) }), generator; } function tryCatch(fn, obj, arg) { try { return { type: "normal", arg: fn.call(obj, arg) }; } catch (err) { return { type: "throw", arg: err }; } } exports.wrap = wrap; var ContinueSentinel = {}; function Generator() {} function GeneratorFunction() {} function GeneratorFunctionPrototype() {} var IteratorPrototype = {}; define(IteratorPrototype, iteratorSymbol, function () { return this; }); var getProto = Object.getPrototypeOf, NativeIteratorPrototype = getProto && getProto(getProto(values([]))); NativeIteratorPrototype && NativeIteratorPrototype !== Op && hasOwn.call(NativeIteratorPrototype, iteratorSymbol) && (IteratorPrototype = NativeIteratorPrototype); var Gp = GeneratorFunctionPrototype.prototype = Generator.prototype = Object.create(IteratorPrototype); function defineIteratorMethods(prototype) { ["next", "throw", "return"].forEach(function (method) { define(prototype, method, function (arg) { return this._invoke(method, arg); }); }); } function AsyncIterator(generator, PromiseImpl) { function invoke(method, arg, resolve, reject) { var record = tryCatch(generator[method], generator, arg); if ("throw" !== record.type) { var result = record.arg, value = result.value; return value && "object" == babelHelpers["typeof"](value) && hasOwn.call(value, "__await") ? PromiseImpl.resolve(value.__await).then(function (value) { invoke("next", value, resolve, reject); }, function (err) { invoke("throw", err, resolve, reject); }) : PromiseImpl.resolve(value).then(function (unwrapped) { result.value = unwrapped, resolve(result); }, function (error) { return invoke("throw", error, resolve, reject); }); } reject(record.arg); } var previousPromise; defineProperty(this, "_invoke", { value: function value(method, arg) { function callInvokeWithMethodAndArg() { return new PromiseImpl(function (resolve, reject) { invoke(method, arg, resolve, reject); }); } return previousPromise = previousPromise ? previousPromise.then(callInvokeWithMethodAndArg, callInvokeWithMethodAndArg) : callInvokeWithMethodAndArg(); } }); } function makeInvokeMethod(innerFn, self, context) { var state = "suspendedStart"; return function (method, arg) { if ("executing" === state) throw new Error("Generator is already running"); if ("completed" === state) { if ("throw" === method) throw arg; return doneResult(); } for (context.method = method, context.arg = arg;;) { var delegate = context.delegate; if (delegate) { var delegateResult = maybeInvokeDelegate(delegate, context); if (delegateResult) { if (delegateResult === ContinueSentinel) continue; return delegateResult; } } if ("next" === context.method) context.sent = context._sent = context.arg;else if ("throw" === context.method) { if ("suspendedStart" === state) throw state = "completed", context.arg; context.dispatchException(context.arg); } else "return" === context.method && context.abrupt("return", context.arg); state = "executing"; var record = tryCatch(innerFn, self, context); if ("normal" === record.type) { if (state = context.done ? "completed" : "suspendedYield", record.arg === ContinueSentinel) continue; return { value: record.arg, done: context.done }; } "throw" === record.type && (state = "completed", context.method = "throw", context.arg = record.arg); } }; } function maybeInvokeDelegate(delegate, context) { var methodName = context.method, method = delegate.iterator[methodName]; if (undefined === method) return context.delegate = null, "throw" === methodName && delegate.iterator["return"] && (context.method = "return", context.arg = undefined, maybeInvokeDelegate(delegate, context), "throw" === context.method) || "return" !== methodName && (context.method = "throw", context.arg = new TypeError("The iterator does not provide a '" + methodName + "' method")), ContinueSentinel; var record = tryCatch(method, delegate.iterator, context.arg); if ("throw" === record.type) return context.method = "throw", context.arg = record.arg, context.delegate = null, ContinueSentinel; var info = record.arg; return info ? info.done ? (context[delegate.resultName] = info.value, context.next = delegate.nextLoc, "return" !== context.method && (context.method = "next", context.arg = undefined), context.delegate = null, ContinueSentinel) : info : (context.method = "throw", context.arg = new TypeError("iterator result is not an object"), context.delegate = null, ContinueSentinel); } function pushTryEntry(locs) { var entry = { tryLoc: locs[0] }; 1 in locs && (entry.catchLoc = locs[1]), 2 in locs && (entry.finallyLoc = locs[2], entry.afterLoc = locs[3]), this.tryEntries.push(entry); } function resetTryEntry(entry) { var record = entry.completion || {}; record.type = "normal", delete record.arg, entry.completion = record; } function Context(tryLocsList) { this.tryEntries = [{ tryLoc: "root" }], tryLocsList.forEach(pushTryEntry, this), this.reset(!0); } function values(iterable) { if (iterable) { var iteratorMethod = iterable[iteratorSymbol]; if (iteratorMethod) return iteratorMethod.call(iterable); if ("function" == typeof iterable.next) return iterable; if (!isNaN(iterable.length)) { var i = -1, next = function next() { for (; ++i < iterable.length;) if (hasOwn.call(iterable, i)) return next.value = iterable[i], next.done = !1, next; return next.value = undefined, next.done = !0, next; }; return next.next = next; } } return { next: doneResult }; } function doneResult() { return { value: undefined, done: !0 }; } return GeneratorFunction.prototype = GeneratorFunctionPrototype, defineProperty(Gp, "constructor", { value: GeneratorFunctionPrototype, configurable: !0 }), defineProperty(GeneratorFunctionPrototype, "constructor", { value: GeneratorFunction, configurable: !0 }), GeneratorFunction.displayName = define(GeneratorFunctionPrototype, toStringTagSymbol, "GeneratorFunction"), exports.isGeneratorFunction = function (genFun) { var ctor = "function" == typeof genFun && genFun.constructor; return !!ctor && (ctor === GeneratorFunction || "GeneratorFunction" === (ctor.displayName || ctor.name)); }, exports.mark = function (genFun) { return Object.setPrototypeOf ? Object.setPrototypeOf(genFun, GeneratorFunctionPrototype) : (genFun.__proto__ = GeneratorFunctionPrototype, define(genFun, toStringTagSymbol, "GeneratorFunction")), genFun.prototype = Object.create(Gp), genFun; }, exports.awrap = function (arg) { return { __await: arg }; }, defineIteratorMethods(AsyncIterator.prototype), define(AsyncIterator.prototype, asyncIteratorSymbol, function () { return this; }), exports.AsyncIterator = AsyncIterator, exports.async = function (innerFn, outerFn, self, tryLocsList, PromiseImpl) { void 0 === PromiseImpl && (PromiseImpl = Promise); var iter = new AsyncIterator(wrap(innerFn, outerFn, self, tryLocsList), PromiseImpl); return exports.isGeneratorFunction(outerFn) ? iter : iter.next().then(function (result) { return result.done ? result.value : iter.next(); }); }, defineIteratorMethods(Gp), define(Gp, toStringTagSymbol, "Generator"), define(Gp, iteratorSymbol, function () { return this; }), define(Gp, "toString", function () { return "[object Generator]"; }), exports.keys = function (val) { var object = Object(val), keys = []; for (var key in object) keys.push(key); return keys.reverse(), function next() { for (; keys.length;) { var key = keys.pop(); if (key in object) return next.value = key, next.done = !1, next; } return next.done = !0, next; }; }, exports.values = values, Context.prototype = { constructor: Context, reset: function reset(skipTempReset) { if (this.prev = 0, this.next = 0, this.sent = this._sent = undefined, this.done = !1, this.delegate = null, this.method = "next", this.arg = undefined, this.tryEntries.forEach(resetTryEntry), !skipTempReset) for (var name in this) "t" === name.charAt(0) && hasOwn.call(this, name) && !isNaN(+name.slice(1)) && (this[name] = undefined); }, stop: function stop() { this.done = !0; var rootRecord = this.tryEntries[0].completion; if ("throw" === rootRecord.type) throw rootRecord.arg; return this.rval; }, dispatchException: function dispatchException(exception) { if (this.done) throw exception; var context = this; function handle(loc, caught) { return record.type = "throw", record.arg = exception, context.next = loc, caught && (context.method = "next", context.arg = undefined), !!caught; } for (var i = this.tryEntries.length - 1; i >= 0; --i) { var entry = this.tryEntries[i], record = entry.completion; if ("root" === entry.tryLoc) return handle("end"); if (entry.tryLoc <= this.prev) { var hasCatch = hasOwn.call(entry, "catchLoc"), hasFinally = hasOwn.call(entry, "finallyLoc"); if (hasCatch && hasFinally) { if (this.prev < entry.catchLoc) return handle(entry.catchLoc, !0); if (this.prev < entry.finallyLoc) return handle(entry.finallyLoc); } else if (hasCatch) { if (this.prev < entry.catchLoc) return handle(entry.catchLoc, !0); } else { if (!hasFinally) throw new Error("try statement without catch or finally"); if (this.prev < entry.finallyLoc) return handle(entry.finallyLoc); } } } }, abrupt: function abrupt(type, arg) { for (var i = this.tryEntries.length - 1; i >= 0; --i) { var entry = this.tryEntries[i]; if (entry.tryLoc <= this.prev && hasOwn.call(entry, "finallyLoc") && this.prev < entry.finallyLoc) { var finallyEntry = entry; break; } } finallyEntry && ("break" === type || "continue" === type) && finallyEntry.tryLoc <= arg && arg <= finallyEntry.finallyLoc && (finallyEntry = null); var record = finallyEntry ? finallyEntry.completion : {}; return record.type = type, record.arg = arg, finallyEntry ? (this.method = "next", this.next = finallyEntry.finallyLoc, ContinueSentinel) : this.complete(record); }, complete: function complete(record, afterLoc) { if ("throw" === record.type) throw record.arg; return "break" === record.type || "continue" === record.type ? this.next = record.arg : "return" === record.type ? (this.rval = this.arg = record.arg, this.method = "return", this.next = "end") : "normal" === record.type && afterLoc && (this.next = afterLoc), ContinueSentinel; }, finish: function finish(finallyLoc) { for (var i = this.tryEntries.length - 1; i >= 0; --i) { var entry = this.tryEntries[i]; if (entry.finallyLoc === finallyLoc) return this.complete(entry.completion, entry.afterLoc), resetTryEntry(entry), ContinueSentinel; } }, "catch": function _catch(tryLoc) { for (var i = this.tryEntries.length - 1; i >= 0; --i) { var entry = this.tryEntries[i]; if (entry.tryLoc === tryLoc) { var record = entry.completion; if ("throw" === record.type) { var thrown = record.arg; resetTryEntry(entry); } return thrown; } } throw new Error("illegal catch attempt"); }, delegateYield: function delegateYield(iterable, resultName, nextLoc) { return this.delegate = { iterator: values(iterable), resultName: resultName, nextLoc: nextLoc }, "next" === this.method && (this.arg = undefined), ContinueSentinel; } }, exports; }
	var HelpdeskCodes = Object.freeze({
	  DocumentEditor: '27216628'
	});

	// @vue/component
	var PlaceholdersApp = {
	  name: 'PlaceholdersApp',
	  components: {
	    PlaceholderSection: PlaceholderSection,
	    PlaceholderTabs: PlaceholderTabs,
	    PlaceholderSearch: PlaceholderSearch,
	    PlaceholderSearchNotFound: PlaceholderSearchNotFound,
	    PlaceholderSearchNotConfigured: PlaceholderSearchNotConfigured
	  },
	  mixins: [sign_v2_b2e_vueUtil.LocMixin],
	  props: {
	    sectionsData: {
	      type: Array,
	      required: true
	    }
	  },
	  data: function data() {
	    return {
	      currentTab: TabType.BITRIX24,
	      companySelector: null,
	      hcmLinkCompanySelector: null,
	      searchQuery: '',
	      hcmLinkSections: null,
	      api: new sign_v2_api.Api(),
	      selectedCompanyId: null,
	      selectedHcmLinkCompanyId: null,
	      hcmLinkPlaceholdersLoader: null,
	      lastSelectedCompanyId: null,
	      lastSelectedHcmLinkCompanyId: null
	    };
	  },
	  computed: {
	    sections: function sections() {
	      if (this.isHcmLinkTab && (!this.selectedCompanyId || !this.selectedHcmLinkCompanyId)) {
	        return [];
	      }
	      var sections = this.currentTab === TabType.BITRIX24 ? this.sectionsData.filter(function (section) {
	        return section.type !== SectionType.HCM_LINK;
	      }) : this.hcmLinkSections;
	      if (!sections) {
	        return [];
	      }
	      return new SectionFilter().filterBySearchQuery(sections, this.searchQuery);
	    },
	    hasItems: function hasItems() {
	      return this.sections.length > 0;
	    },
	    isHcmLinkTab: function isHcmLinkTab() {
	      return this.currentTab === TabType.HCM_LINK;
	    },
	    isRuRegionLicense: function isRuRegionLicense() {
	      return main_core.Extension.getSettings('sign.v2.grid.b2e.placeholders').get('region') === 'ru';
	    },
	    shouldShowSearch: function shouldShowSearch() {
	      if (!this.isHcmLinkTab) {
	        return true;
	      }
	      return this.selectedCompanyId !== null && this.selectedHcmLinkCompanyId !== null;
	    },
	    shouldShowSearchNotFoundState: function shouldShowSearchNotFoundState() {
	      if (!this.hasItems && this.shouldShowSearch) {
	        if (this.searchQuery) {
	          return true;
	        }
	        if (this.isHcmLinkTab && this.hcmLinkSections !== null) {
	          return true;
	        }
	      }
	      return false;
	    },
	    shouldShowSearchNotConfiguredState: function shouldShowSearchNotConfiguredState() {
	      return !this.hasItems && !this.shouldShowSearch;
	    }
	  },
	  mounted: function mounted() {
	    var _this = this;
	    return babelHelpers.asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee() {
	      return _regeneratorRuntime().wrap(function _callee$(_context) {
	        while (1) switch (_context.prev = _context.next) {
	          case 0:
	            _this.initCreateButton();
	            if (!_this.isRuRegionLicense) {
	              _context.next = 6;
	              break;
	            }
	            _this.initHcmLinkCompanySelector();
	            _this.initCompanySelector();
	            _context.next = 6;
	            return _this.loadLastUserSelections();
	          case 6:
	          case "end":
	            return _context.stop();
	        }
	      }, _callee);
	    }))();
	  },
	  methods: {
	    initCreateButton: function initCreateButton() {
	      var createButton = new ui_buttons.CreateButton({
	        text: this.loc('PLACEHOLDER_LIST_ADD_FIELD'),
	        onclick: this.onCreateClick,
	        useAirDesign: true,
	        color: ui_buttons.Button.Color.SUCCESS_DARK,
	        size: ui_buttons.Button.Size.MEDIUM,
	        style: ui_buttons.AirButtonStyle.FILLED_SUCCESS,
	        icon: ui_buttons.ButtonIcon.ADD_M
	      });
	      main_core.Dom.append(createButton.render(), this.$refs.createButtonContainer);
	    },
	    onCreateClick: function onCreateClick() {
	      var _this2 = this;
	      var fieldSelector = new sign_v2_b2e_fieldSelector.FieldSelector({
	        multiple: false,
	        disableSelection: true,
	        fieldsFactory: {
	          filter: {
	            '-types': ['url', 'address']
	          }
	        },
	        controllerOptions: {
	          hideVirtual: true,
	          hideRequisites: false,
	          hideSmartB2eDocument: true
	        },
	        events: {
	          onSliderCloseComplete: function onSliderCloseComplete() {
	            _this2.$emit('listUpdate');
	          }
	        },
	        languages: main_core.Extension.getSettings('sign.v2.grid.b2e.placeholders').get('languages'),
	        filter: {
	          '+categories': ['PROFILE', 'DYNAMIC_MEMBER', 'COMPANY', 'REPRESENTATIVE', 'EMPLOYEE', 'SMART_B2E_DOC'],
	          '+fields': ['list', 'string', 'date', 'typed_string', 'text', 'enumeration', 'address', 'url', 'double', 'integer', 'snils'],
	          allowEmptyFieldList: true
	        },
	        title: main_core.Loc.getMessage('PLACEHOLDER_CREATE_LIST_TITLE'),
	        hint: this.isRuRegionLicense ? main_core.Loc.getMessage('PLACEHOLDER_CREATE_LIST_HINT') : null,
	        categoryCaptions: {
	          PROFILE: main_core.Loc.getMessage('PLACEHOLDER_CREATE_LIST_PROFILE_ITEM'),
	          DYNAMIC_MEMBER: main_core.Loc.getMessage('PLACEHOLDER_CREATE_LIST_DYNAMIC_MEMBER_ITEM')
	        }
	      });
	      fieldSelector.show();
	    },
	    loadLastUserSelections: function loadLastUserSelections() {
	      var _this3 = this;
	      return babelHelpers.asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee2() {
	        var _yield$Promise$all, _yield$Promise$all2, companyData, hcmLinkData;
	        return _regeneratorRuntime().wrap(function _callee2$(_context2) {
	          while (1) switch (_context2.prev = _context2.next) {
	            case 0:
	              _context2.prev = 0;
	              _context2.next = 3;
	              return Promise.all([_this3.api.placeholder.getLastSelectionBySelectorType(SelectorType.myCompany), _this3.api.placeholder.getLastSelectionBySelectorType(SelectorType.hcmLinkCompany)]);
	            case 3:
	              _yield$Promise$all = _context2.sent;
	              _yield$Promise$all2 = babelHelpers.slicedToArray(_yield$Promise$all, 2);
	              companyData = _yield$Promise$all2[0];
	              hcmLinkData = _yield$Promise$all2[1];
	              if (hcmLinkData !== null && hcmLinkData !== void 0 && hcmLinkData.value && _this3.hcmLinkCompanySelector) {
	                _this3.hcmLinkCompanySelector.setLastSavedId(hcmLinkData.value);
	              }
	              if (!(companyData !== null && companyData !== void 0 && companyData.value && _this3.companySelector)) {
	                _context2.next = 11;
	                break;
	              }
	              _context2.next = 11;
	              return _this3.companySelector.load(null, companyData.value);
	            case 11:
	              _context2.next = 16;
	              break;
	            case 13:
	              _context2.prev = 13;
	              _context2.t0 = _context2["catch"](0);
	              console.error('Failed to load last user selections:', _context2.t0);
	            case 16:
	            case "end":
	              return _context2.stop();
	          }
	        }, _callee2, null, [[0, 13]]);
	      }))();
	    },
	    initCompanySelector: function initCompanySelector() {
	      var _this4 = this;
	      if (!this.$refs.companySelectorContainer) {
	        return;
	      }
	      var companySelector = new sign_v2_b2e_companySelector.CompanySelector({
	        canCreateCompany: false,
	        canEditCompany: false,
	        isCompaniesDeselectable: false
	      });
	      companySelector.subscribe('onSelect', /*#__PURE__*/function () {
	        var _ref = babelHelpers.asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee3(event) {
	          var data, companyId;
	          return _regeneratorRuntime().wrap(function _callee3$(_context3) {
	            while (1) switch (_context3.prev = _context3.next) {
	              case 0:
	                data = event.getData ? event.getData() : event.data;
	                companyId = data === null || data === void 0 ? void 0 : data.companyId;
	                if (!(companyId === _this4.lastSelectedCompanyId)) {
	                  _context3.next = 4;
	                  break;
	                }
	                return _context3.abrupt("return");
	              case 4:
	                _this4.lastSelectedCompanyId = companyId;
	                if (!(companyId && _this4.hcmLinkCompanySelector)) {
	                  _context3.next = 13;
	                  break;
	                }
	                _this4.selectedCompanyId = companyId;
	                _this4.selectedHcmLinkCompanyId = null;
	                _this4.hcmLinkCompanySelector.setCompanyId(companyId);
	                _context3.next = 11;
	                return _this4.api.placeholder.saveLastSelectionBySelectorType(SelectorType.myCompany, companyId);
	              case 11:
	                _context3.next = 16;
	                break;
	              case 13:
	                _this4.selectedCompanyId = null;
	                _this4.selectedHcmLinkCompanyId = null;
	                _this4.lastSelectedCompanyId = null;
	              case 16:
	              case "end":
	                return _context3.stop();
	            }
	          }, _callee3);
	        }));
	        return function (_x) {
	          return _ref.apply(this, arguments);
	        };
	      }());
	      this.companySelector = ui_vue3.markRaw(companySelector);
	      main_core.Dom.append(this.companySelector.getLayout(), this.$refs.companySelectorContainer);
	    },
	    initHcmLinkCompanySelector: function initHcmLinkCompanySelector() {
	      var _this5 = this;
	      if (!this.$refs.hcmLinkCompanySelectorContainer) {
	        return;
	      }
	      var hcmLinkCompanySelector = new sign_v2_b2e_hcmLinkCompanySelector.HcmLinkCompanySelector();
	      hcmLinkCompanySelector.setAvailability(true);
	      hcmLinkCompanySelector.subscribe('integrations:loaded', function (event) {
	        var _data$hasIntegrations;
	        var data = event.getData ? event.getData() : event.data;
	        var hasIntegrations = (_data$hasIntegrations = data === null || data === void 0 ? void 0 : data.hasIntegrations) !== null && _data$hasIntegrations !== void 0 ? _data$hasIntegrations : false;
	        if (!hasIntegrations) {
	          _this5.selectedHcmLinkCompanyId = null;
	          _this5.lastSelectedHcmLinkCompanyId = null;
	        }
	      });
	      hcmLinkCompanySelector.subscribe('selected', /*#__PURE__*/function () {
	        var _ref2 = babelHelpers.asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee4(event) {
	          var data, hcmLinkCompanyId;
	          return _regeneratorRuntime().wrap(function _callee4$(_context4) {
	            while (1) switch (_context4.prev = _context4.next) {
	              case 0:
	                data = event.getData ? event.getData() : event.data;
	                hcmLinkCompanyId = data === null || data === void 0 ? void 0 : data.id;
	                if (!(hcmLinkCompanyId === _this5.lastSelectedHcmLinkCompanyId)) {
	                  _context4.next = 4;
	                  break;
	                }
	                return _context4.abrupt("return");
	              case 4:
	                _this5.lastSelectedHcmLinkCompanyId = hcmLinkCompanyId;
	                if (!hcmLinkCompanyId) {
	                  _context4.next = 12;
	                  break;
	                }
	                _this5.selectedHcmLinkCompanyId = hcmLinkCompanyId;
	                _this5.loadHcmLinkPlaceholders(hcmLinkCompanyId);
	                _context4.next = 10;
	                return _this5.api.placeholder.saveLastSelectionBySelectorType(SelectorType.hcmLinkCompany, hcmLinkCompanyId);
	              case 10:
	                _context4.next = 14;
	                break;
	              case 12:
	                _this5.selectedHcmLinkCompanyId = null;
	                _this5.lastSelectedHcmLinkCompanyId = null;
	              case 14:
	              case "end":
	                return _context4.stop();
	            }
	          }, _callee4);
	        }));
	        return function (_x2) {
	          return _ref2.apply(this, arguments);
	        };
	      }());
	      this.hcmLinkCompanySelector = ui_vue3.markRaw(hcmLinkCompanySelector);
	      main_core.Dom.append(this.hcmLinkCompanySelector.render(), this.$refs.hcmLinkCompanySelectorContainer);
	      this.hcmLinkCompanySelector.show();
	    },
	    getDocumentEditorHelpdeskLink: function getDocumentEditorHelpdeskLink() {
	      return sign_v2_helper.Helpdesk.replaceLink(this.loc('PLACEHOLDER_LIST_HELPDESK'), HelpdeskCodes.DocumentEditor);
	    },
	    switchTab: function switchTab(tab) {
	      if (!Object.values(TabType).includes(tab)) {
	        return;
	      }
	      this.currentTab = tab;
	      this.searchQuery = '';
	    },
	    loadHcmLinkPlaceholders: function loadHcmLinkPlaceholders(hcmLinkCompanyId) {
	      var _this6 = this;
	      if (!this.$refs.placeholdersSectionsContainer) {
	        return;
	      }
	      if (!this.hcmLinkPlaceholdersLoader) {
	        this.hcmLinkPlaceholdersLoader = new main_loader.Loader({
	          target: this.$refs.placeholdersSectionsContainer
	        });
	      }
	      void this.hcmLinkPlaceholdersLoader.show();
	      this.api.placeholder.listByHcmLinkCompanyId(hcmLinkCompanyId).then(function (data) {
	        _this6.hcmLinkSections = data;
	      })["catch"](function (error) {
	        console.error('Failed to load hcmLink placeholders:', error);
	      })["finally"](function () {
	        void _this6.hcmLinkPlaceholdersLoader.hide();
	      });
	    }
	  },
	  template: "\n\t\t<div class=\"sign-placeholders-content\">\n\t\t\t<div class=\"sign-placeholders-common-title-container\">\n\t\t\t\t<div class=\"sign-placeholders-common-title-header-container\">\n\t\t\t\t\t<div class=\"sign-placeholders-common-title\">\n\t\t\t\t\t\t{{ loc('PLACEHOLDER_LIST_FIELDS_TITLE_MSGVER_1') }}\n\t\t\t\t\t</div>\n\t\t\t\t\t<div ref=\"createButtonContainer\"></div>\n\t\t\t\t</div>\n\t\t\t\t<div class=\"sign-placeholders-common-subtitle\" v-html=\"getDocumentEditorHelpdeskLink()\"></div>\n\t\t\t</div>\n\t\t\t<div class=\"sign-placeholders-content-body\">\n\t\t\t\t<div class=\"sign-placeholders-header\">\n\t\t\t\t\t<div class=\"sign-placeholders-content-header\">\n\t\t\t\t\t\t<PlaceholderTabs v-show=\"isRuRegionLicense\" :current-tab=\"currentTab\" @switch-tab=\"switchTab\"/>\n\t\t\t\t\t</div>\n\t\t\t\t</div>\n\t\t\t\t<div v-show=\"isHcmLinkTab\" class=\"sign-placeholders-selectors-container\">\n\t\t\t\t\t<div>\n\t\t\t\t\t\t<div class=\"sign-placeholders-selector-title\">\n\t\t\t\t\t\t\t{{ loc('PLACEHOLDER_LIST_COMPANY_SELECTOR') }}\n\t\t\t\t\t\t</div>\n\t\t\t\t\t\t<div ref=\"companySelectorContainer\" class=\"sign-placeholders-company-selector\"></div>\n\t\t\t\t\t</div>\n\t\t\t\t\t<div>\n\t\t\t\t\t\t<div class=\"sign-placeholders-selector-hcmlink-title\">\n\t\t\t\t\t\t\t{{ loc('PLACEHOLDER_LIST_HCMLINK_COMPANY_SELECTOR') }}\n\t\t\t\t\t\t</div>\n\t\t\t\t\t\t<div ref=\"hcmLinkCompanySelectorContainer\" class=\"sign-placeholders-hcm-link-company-selector\"></div>\n\t\t\t\t\t</div>\n\t\t\t\t</div>\n\t\t\t\t<PlaceholderSearch\n\t\t\t\t\tv-show=\"shouldShowSearch\"\n\t\t\t\t\tv-model:searchQuery=\"searchQuery\"\n\t\t\t\t\t:is-hcm-link-tab=\"isHcmLinkTab\"\n\t\t\t\t/>\n\t\t\t\t<div class=\"sign-placeholders-scrollable-content\">\n\t\t\t\t\t<div ref=\"placeholdersSectionsContainer\" class=\"sign-placeholders-sections\">\n\t\t\t\t\t\t<PlaceholderSearchNotFound v-if=\"shouldShowSearchNotFoundState\"/>\n\t\t\t\t\t\t<PlaceholderSearchNotConfigured v-else-if=\"shouldShowSearchNotConfiguredState\"/>\n\t\t\t\t\t\t<PlaceholderSection\n\t\t\t\t\t\t\tv-else\n\t\t\t\t\t\t\tv-for=\"(section, index) in sections\"\n\t\t\t\t\t\t\t:key=\"index\"\n\t\t\t\t\t\t\t:section=\"section\"\n\t\t\t\t\t\t/>\n\t\t\t\t\t</div>\n\t\t\t\t</div>\n\t\t\t</div>\n\t\t</div>\n\t"
	};

	var _templateObject;
	function _regeneratorRuntime$1() { /*! regenerator-runtime -- Copyright (c) 2014-present, Facebook, Inc. -- license (MIT): https://github.com/facebook/regenerator/blob/main/LICENSE */ _regeneratorRuntime$1 = function _regeneratorRuntime() { return exports; }; var exports = {}, Op = Object.prototype, hasOwn = Op.hasOwnProperty, defineProperty = Object.defineProperty || function (obj, key, desc) { obj[key] = desc.value; }, $Symbol = "function" == typeof Symbol ? Symbol : {}, iteratorSymbol = $Symbol.iterator || "@@iterator", asyncIteratorSymbol = $Symbol.asyncIterator || "@@asyncIterator", toStringTagSymbol = $Symbol.toStringTag || "@@toStringTag"; function define(obj, key, value) { return Object.defineProperty(obj, key, { value: value, enumerable: !0, configurable: !0, writable: !0 }), obj[key]; } try { define({}, ""); } catch (err) { define = function define(obj, key, value) { return obj[key] = value; }; } function wrap(innerFn, outerFn, self, tryLocsList) { var protoGenerator = outerFn && outerFn.prototype instanceof Generator ? outerFn : Generator, generator = Object.create(protoGenerator.prototype), context = new Context(tryLocsList || []); return defineProperty(generator, "_invoke", { value: makeInvokeMethod(innerFn, self, context) }), generator; } function tryCatch(fn, obj, arg) { try { return { type: "normal", arg: fn.call(obj, arg) }; } catch (err) { return { type: "throw", arg: err }; } } exports.wrap = wrap; var ContinueSentinel = {}; function Generator() {} function GeneratorFunction() {} function GeneratorFunctionPrototype() {} var IteratorPrototype = {}; define(IteratorPrototype, iteratorSymbol, function () { return this; }); var getProto = Object.getPrototypeOf, NativeIteratorPrototype = getProto && getProto(getProto(values([]))); NativeIteratorPrototype && NativeIteratorPrototype !== Op && hasOwn.call(NativeIteratorPrototype, iteratorSymbol) && (IteratorPrototype = NativeIteratorPrototype); var Gp = GeneratorFunctionPrototype.prototype = Generator.prototype = Object.create(IteratorPrototype); function defineIteratorMethods(prototype) { ["next", "throw", "return"].forEach(function (method) { define(prototype, method, function (arg) { return this._invoke(method, arg); }); }); } function AsyncIterator(generator, PromiseImpl) { function invoke(method, arg, resolve, reject) { var record = tryCatch(generator[method], generator, arg); if ("throw" !== record.type) { var result = record.arg, value = result.value; return value && "object" == babelHelpers["typeof"](value) && hasOwn.call(value, "__await") ? PromiseImpl.resolve(value.__await).then(function (value) { invoke("next", value, resolve, reject); }, function (err) { invoke("throw", err, resolve, reject); }) : PromiseImpl.resolve(value).then(function (unwrapped) { result.value = unwrapped, resolve(result); }, function (error) { return invoke("throw", error, resolve, reject); }); } reject(record.arg); } var previousPromise; defineProperty(this, "_invoke", { value: function value(method, arg) { function callInvokeWithMethodAndArg() { return new PromiseImpl(function (resolve, reject) { invoke(method, arg, resolve, reject); }); } return previousPromise = previousPromise ? previousPromise.then(callInvokeWithMethodAndArg, callInvokeWithMethodAndArg) : callInvokeWithMethodAndArg(); } }); } function makeInvokeMethod(innerFn, self, context) { var state = "suspendedStart"; return function (method, arg) { if ("executing" === state) throw new Error("Generator is already running"); if ("completed" === state) { if ("throw" === method) throw arg; return doneResult(); } for (context.method = method, context.arg = arg;;) { var delegate = context.delegate; if (delegate) { var delegateResult = maybeInvokeDelegate(delegate, context); if (delegateResult) { if (delegateResult === ContinueSentinel) continue; return delegateResult; } } if ("next" === context.method) context.sent = context._sent = context.arg;else if ("throw" === context.method) { if ("suspendedStart" === state) throw state = "completed", context.arg; context.dispatchException(context.arg); } else "return" === context.method && context.abrupt("return", context.arg); state = "executing"; var record = tryCatch(innerFn, self, context); if ("normal" === record.type) { if (state = context.done ? "completed" : "suspendedYield", record.arg === ContinueSentinel) continue; return { value: record.arg, done: context.done }; } "throw" === record.type && (state = "completed", context.method = "throw", context.arg = record.arg); } }; } function maybeInvokeDelegate(delegate, context) { var methodName = context.method, method = delegate.iterator[methodName]; if (undefined === method) return context.delegate = null, "throw" === methodName && delegate.iterator["return"] && (context.method = "return", context.arg = undefined, maybeInvokeDelegate(delegate, context), "throw" === context.method) || "return" !== methodName && (context.method = "throw", context.arg = new TypeError("The iterator does not provide a '" + methodName + "' method")), ContinueSentinel; var record = tryCatch(method, delegate.iterator, context.arg); if ("throw" === record.type) return context.method = "throw", context.arg = record.arg, context.delegate = null, ContinueSentinel; var info = record.arg; return info ? info.done ? (context[delegate.resultName] = info.value, context.next = delegate.nextLoc, "return" !== context.method && (context.method = "next", context.arg = undefined), context.delegate = null, ContinueSentinel) : info : (context.method = "throw", context.arg = new TypeError("iterator result is not an object"), context.delegate = null, ContinueSentinel); } function pushTryEntry(locs) { var entry = { tryLoc: locs[0] }; 1 in locs && (entry.catchLoc = locs[1]), 2 in locs && (entry.finallyLoc = locs[2], entry.afterLoc = locs[3]), this.tryEntries.push(entry); } function resetTryEntry(entry) { var record = entry.completion || {}; record.type = "normal", delete record.arg, entry.completion = record; } function Context(tryLocsList) { this.tryEntries = [{ tryLoc: "root" }], tryLocsList.forEach(pushTryEntry, this), this.reset(!0); } function values(iterable) { if (iterable) { var iteratorMethod = iterable[iteratorSymbol]; if (iteratorMethod) return iteratorMethod.call(iterable); if ("function" == typeof iterable.next) return iterable; if (!isNaN(iterable.length)) { var i = -1, next = function next() { for (; ++i < iterable.length;) if (hasOwn.call(iterable, i)) return next.value = iterable[i], next.done = !1, next; return next.value = undefined, next.done = !0, next; }; return next.next = next; } } return { next: doneResult }; } function doneResult() { return { value: undefined, done: !0 }; } return GeneratorFunction.prototype = GeneratorFunctionPrototype, defineProperty(Gp, "constructor", { value: GeneratorFunctionPrototype, configurable: !0 }), defineProperty(GeneratorFunctionPrototype, "constructor", { value: GeneratorFunction, configurable: !0 }), GeneratorFunction.displayName = define(GeneratorFunctionPrototype, toStringTagSymbol, "GeneratorFunction"), exports.isGeneratorFunction = function (genFun) { var ctor = "function" == typeof genFun && genFun.constructor; return !!ctor && (ctor === GeneratorFunction || "GeneratorFunction" === (ctor.displayName || ctor.name)); }, exports.mark = function (genFun) { return Object.setPrototypeOf ? Object.setPrototypeOf(genFun, GeneratorFunctionPrototype) : (genFun.__proto__ = GeneratorFunctionPrototype, define(genFun, toStringTagSymbol, "GeneratorFunction")), genFun.prototype = Object.create(Gp), genFun; }, exports.awrap = function (arg) { return { __await: arg }; }, defineIteratorMethods(AsyncIterator.prototype), define(AsyncIterator.prototype, asyncIteratorSymbol, function () { return this; }), exports.AsyncIterator = AsyncIterator, exports.async = function (innerFn, outerFn, self, tryLocsList, PromiseImpl) { void 0 === PromiseImpl && (PromiseImpl = Promise); var iter = new AsyncIterator(wrap(innerFn, outerFn, self, tryLocsList), PromiseImpl); return exports.isGeneratorFunction(outerFn) ? iter : iter.next().then(function (result) { return result.done ? result.value : iter.next(); }); }, defineIteratorMethods(Gp), define(Gp, toStringTagSymbol, "Generator"), define(Gp, iteratorSymbol, function () { return this; }), define(Gp, "toString", function () { return "[object Generator]"; }), exports.keys = function (val) { var object = Object(val), keys = []; for (var key in object) keys.push(key); return keys.reverse(), function next() { for (; keys.length;) { var key = keys.pop(); if (key in object) return next.value = key, next.done = !1, next; } return next.done = !0, next; }; }, exports.values = values, Context.prototype = { constructor: Context, reset: function reset(skipTempReset) { if (this.prev = 0, this.next = 0, this.sent = this._sent = undefined, this.done = !1, this.delegate = null, this.method = "next", this.arg = undefined, this.tryEntries.forEach(resetTryEntry), !skipTempReset) for (var name in this) "t" === name.charAt(0) && hasOwn.call(this, name) && !isNaN(+name.slice(1)) && (this[name] = undefined); }, stop: function stop() { this.done = !0; var rootRecord = this.tryEntries[0].completion; if ("throw" === rootRecord.type) throw rootRecord.arg; return this.rval; }, dispatchException: function dispatchException(exception) { if (this.done) throw exception; var context = this; function handle(loc, caught) { return record.type = "throw", record.arg = exception, context.next = loc, caught && (context.method = "next", context.arg = undefined), !!caught; } for (var i = this.tryEntries.length - 1; i >= 0; --i) { var entry = this.tryEntries[i], record = entry.completion; if ("root" === entry.tryLoc) return handle("end"); if (entry.tryLoc <= this.prev) { var hasCatch = hasOwn.call(entry, "catchLoc"), hasFinally = hasOwn.call(entry, "finallyLoc"); if (hasCatch && hasFinally) { if (this.prev < entry.catchLoc) return handle(entry.catchLoc, !0); if (this.prev < entry.finallyLoc) return handle(entry.finallyLoc); } else if (hasCatch) { if (this.prev < entry.catchLoc) return handle(entry.catchLoc, !0); } else { if (!hasFinally) throw new Error("try statement without catch or finally"); if (this.prev < entry.finallyLoc) return handle(entry.finallyLoc); } } } }, abrupt: function abrupt(type, arg) { for (var i = this.tryEntries.length - 1; i >= 0; --i) { var entry = this.tryEntries[i]; if (entry.tryLoc <= this.prev && hasOwn.call(entry, "finallyLoc") && this.prev < entry.finallyLoc) { var finallyEntry = entry; break; } } finallyEntry && ("break" === type || "continue" === type) && finallyEntry.tryLoc <= arg && arg <= finallyEntry.finallyLoc && (finallyEntry = null); var record = finallyEntry ? finallyEntry.completion : {}; return record.type = type, record.arg = arg, finallyEntry ? (this.method = "next", this.next = finallyEntry.finallyLoc, ContinueSentinel) : this.complete(record); }, complete: function complete(record, afterLoc) { if ("throw" === record.type) throw record.arg; return "break" === record.type || "continue" === record.type ? this.next = record.arg : "return" === record.type ? (this.rval = this.arg = record.arg, this.method = "return", this.next = "end") : "normal" === record.type && afterLoc && (this.next = afterLoc), ContinueSentinel; }, finish: function finish(finallyLoc) { for (var i = this.tryEntries.length - 1; i >= 0; --i) { var entry = this.tryEntries[i]; if (entry.finallyLoc === finallyLoc) return this.complete(entry.completion, entry.afterLoc), resetTryEntry(entry), ContinueSentinel; } }, "catch": function _catch(tryLoc) { for (var i = this.tryEntries.length - 1; i >= 0; --i) { var entry = this.tryEntries[i]; if (entry.tryLoc === tryLoc) { var record = entry.completion; if ("throw" === record.type) { var thrown = record.arg; resetTryEntry(entry); } return thrown; } } throw new Error("illegal catch attempt"); }, delegateYield: function delegateYield(iterable, resultName, nextLoc) { return this.delegate = { iterator: values(iterable), resultName: resultName, nextLoc: nextLoc }, "next" === this.method && (this.arg = undefined), ContinueSentinel; } }, exports; }
	function _classPrivateMethodInitSpec$1(obj, privateSet) { _checkPrivateRedeclaration$1(obj, privateSet); privateSet.add(obj); }
	function _classPrivateFieldInitSpec(obj, privateMap, value) { _checkPrivateRedeclaration$1(obj, privateMap); privateMap.set(obj, value); }
	function _checkPrivateRedeclaration$1(obj, privateCollection) { if (privateCollection.has(obj)) { throw new TypeError("Cannot initialize the same private elements twice on an object"); } }
	function _classPrivateMethodGet$1(receiver, privateSet, fn) { if (!privateSet.has(receiver)) { throw new TypeError("attempted to get private field on non-instance"); } return fn; }
	var sidePanelConfig = Object.freeze({
	  link: 'sign:stub:placeholder-list',
	  width: 500
	});
	var _api = /*#__PURE__*/new WeakMap();
	var _app = /*#__PURE__*/new WeakMap();
	var _container = /*#__PURE__*/new WeakMap();
	var _loader = /*#__PURE__*/new WeakMap();
	var _loadPlaceholders = /*#__PURE__*/new WeakSet();
	var _createContainer = /*#__PURE__*/new WeakSet();
	var _createApp = /*#__PURE__*/new WeakSet();
	var _unmount = /*#__PURE__*/new WeakSet();
	var Placeholders = /*#__PURE__*/function () {
	  function Placeholders() {
	    babelHelpers.classCallCheck(this, Placeholders);
	    _classPrivateMethodInitSpec$1(this, _unmount);
	    _classPrivateMethodInitSpec$1(this, _createApp);
	    _classPrivateMethodInitSpec$1(this, _createContainer);
	    _classPrivateMethodInitSpec$1(this, _loadPlaceholders);
	    _classPrivateFieldInitSpec(this, _api, {
	      writable: true,
	      value: new sign_v2_api.Api()
	    });
	    _classPrivateFieldInitSpec(this, _app, {
	      writable: true,
	      value: null
	    });
	    _classPrivateFieldInitSpec(this, _container, {
	      writable: true,
	      value: null
	    });
	    _classPrivateFieldInitSpec(this, _loader, {
	      writable: true,
	      value: null
	    });
	  }
	  babelHelpers.createClass(Placeholders, [{
	    key: "show",
	    value: function () {
	      var _show = babelHelpers.asyncToGenerator( /*#__PURE__*/_regeneratorRuntime$1().mark(function _callee2() {
	        var _this = this;
	        return _regeneratorRuntime$1().wrap(function _callee2$(_context2) {
	          while (1) switch (_context2.prev = _context2.next) {
	            case 0:
	              return _context2.abrupt("return", new Promise(function (resolve) {
	                BX.SidePanel.Instance.open(sidePanelConfig.link, {
	                  width: sidePanelConfig.width,
	                  cacheable: false,
	                  contentCallback: function () {
	                    var _contentCallback = babelHelpers.asyncToGenerator( /*#__PURE__*/_regeneratorRuntime$1().mark(function _callee() {
	                      return _regeneratorRuntime$1().wrap(function _callee$(_context) {
	                        while (1) switch (_context.prev = _context.next) {
	                          case 0:
	                            babelHelpers.classPrivateFieldSet(_this, _container, _classPrivateMethodGet$1(_this, _createContainer, _createContainer2).call(_this));
	                            babelHelpers.classPrivateFieldSet(_this, _loader, new main_loader.Loader({
	                              target: babelHelpers.classPrivateFieldGet(_this, _container)
	                            }));
	                            _context.next = 4;
	                            return _classPrivateMethodGet$1(_this, _loadPlaceholders, _loadPlaceholders2).call(_this);
	                          case 4:
	                            return _context.abrupt("return", babelHelpers.classPrivateFieldGet(_this, _container));
	                          case 5:
	                          case "end":
	                            return _context.stop();
	                        }
	                      }, _callee);
	                    }));
	                    function contentCallback() {
	                      return _contentCallback.apply(this, arguments);
	                    }
	                    return contentCallback;
	                  }(),
	                  events: {
	                    onOpen: function onOpen() {
	                      resolve();
	                    },
	                    onClose: function onClose() {
	                      _classPrivateMethodGet$1(_this, _unmount, _unmount2).call(_this);
	                    }
	                  }
	                });
	              }));
	            case 1:
	            case "end":
	              return _context2.stop();
	          }
	        }, _callee2);
	      }));
	      function show() {
	        return _show.apply(this, arguments);
	      }
	      return show;
	    }()
	  }]);
	  return Placeholders;
	}();
	function _loadPlaceholders2() {
	  return _loadPlaceholders3.apply(this, arguments);
	}
	function _loadPlaceholders3() {
	  _loadPlaceholders3 = babelHelpers.asyncToGenerator( /*#__PURE__*/_regeneratorRuntime$1().mark(function _callee3() {
	    var clearCache,
	      placeholdersData,
	      _args3 = arguments;
	    return _regeneratorRuntime$1().wrap(function _callee3$(_context3) {
	      while (1) switch (_context3.prev = _context3.next) {
	        case 0:
	          clearCache = _args3.length > 0 && _args3[0] !== undefined ? _args3[0] : false;
	          void babelHelpers.classPrivateFieldGet(this, _loader).show();
	          _context3.prev = 2;
	          _context3.next = 5;
	          return babelHelpers.classPrivateFieldGet(this, _api).placeholder.list(clearCache);
	        case 5:
	          placeholdersData = _context3.sent;
	          _classPrivateMethodGet$1(this, _unmount, _unmount2).call(this);
	          _classPrivateMethodGet$1(this, _createApp, _createApp2).call(this, babelHelpers.classPrivateFieldGet(this, _container), placeholdersData);
	          _context3.next = 13;
	          break;
	        case 10:
	          _context3.prev = 10;
	          _context3.t0 = _context3["catch"](2);
	          console.error('Load placeholders data error:', _context3.t0);
	        case 13:
	          _context3.prev = 13;
	          void babelHelpers.classPrivateFieldGet(this, _loader).hide();
	          return _context3.finish(13);
	        case 16:
	        case "end":
	          return _context3.stop();
	      }
	    }, _callee3, this, [[2, 10, 13, 16]]);
	  }));
	  return _loadPlaceholders3.apply(this, arguments);
	}
	function _createContainer2() {
	  return BX.Tag.render(_templateObject || (_templateObject = babelHelpers.taggedTemplateLiteral(["<div class=\"sign-placeholders-container\"></div>"])));
	}
	function _createApp2(container, placeholdersData) {
	  var _this2 = this;
	  babelHelpers.classPrivateFieldSet(this, _app, ui_vue3.BitrixVue.createApp(PlaceholdersApp, {
	    sectionsData: placeholdersData,
	    onListUpdate: function onListUpdate() {
	      void _classPrivateMethodGet$1(_this2, _loadPlaceholders, _loadPlaceholders2).call(_this2, true);
	    }
	  }));
	  babelHelpers.classPrivateFieldGet(this, _app).mount(container);
	}
	function _unmount2() {
	  if (babelHelpers.classPrivateFieldGet(this, _app)) {
	    babelHelpers.classPrivateFieldGet(this, _app).unmount();
	    babelHelpers.classPrivateFieldSet(this, _app, null);
	  }
	}

	exports.Placeholders = Placeholders;

}((this.BX.Sign.V2.Grid.B2e = this.BX.Sign.V2.Grid.B2e || {}),BX.Sign.V2.B2e,BX.Sign.V2,BX.Sign.V2.B2e,BX.Sign.V2.B2e,BX,BX.Vue3,BX.Sign.V2,BX.Sign.B2e,BX.UI,BX));
