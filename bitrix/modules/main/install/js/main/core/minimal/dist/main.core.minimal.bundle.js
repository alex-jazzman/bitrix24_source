/* eslint-disable */
;(function() {

	if (typeof window.BX === 'function')
	{
		return;
	}

/**
 * Babel external helpers
 * (c) 2018 Babel
 * @license MIT
 */
(function (global) {
	var babelHelpers = global.babelHelpers = {};

	function _typeof(obj) {
		if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") {
			babelHelpers.typeof = _typeof = function (obj) {
				return typeof obj;
			};
		} else {
			babelHelpers.typeof = _typeof = function (obj) {
				return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
			};
		}

		return _typeof(obj);
	}

	babelHelpers.typeof = _typeof;
	var REACT_ELEMENT_TYPE;

	function _createRawReactElement(type, props, key, children) {
		if (!REACT_ELEMENT_TYPE) {
			REACT_ELEMENT_TYPE = typeof Symbol === "function" && Symbol.for && Symbol.for("react.element") || 0xeac7;
		}

		var defaultProps = type && type.defaultProps;
		var childrenLength = arguments.length - 3;

		if (!props && childrenLength !== 0) {
			props = {
				children: void 0
			};
		}

		if (props && defaultProps) {
			for (var propName in defaultProps) {
				if (props[propName] === void 0) {
					props[propName] = defaultProps[propName];
				}
			}
		} else if (!props) {
			props = defaultProps || {};
		}

		if (childrenLength === 1) {
			props.children = children;
		} else if (childrenLength > 1) {
			var childArray = new Array(childrenLength);

			for (var i = 0; i < childrenLength; i++) {
				childArray[i] = arguments[i + 3];
			}

			props.children = childArray;
		}

		return {
			$$typeof: REACT_ELEMENT_TYPE,
			type: type,
			key: key === undefined ? null : '' + key,
			ref: null,
			props: props,
			_owner: null
		};
	}

	babelHelpers.jsx = _createRawReactElement;

	function _asyncIterator(iterable) {
		var method;

		if (typeof Symbol === "function") {
			if (Symbol.asyncIterator) {
				method = iterable[Symbol.asyncIterator];
				if (method != null) return method.call(iterable);
			}

			if (Symbol.iterator) {
				method = iterable[Symbol.iterator];
				if (method != null) return method.call(iterable);
			}
		}

		throw new TypeError("Object is not async iterable");
	}

	babelHelpers.asyncIterator = _asyncIterator;

	function _AwaitValue(value) {
		this.wrapped = value;
	}

	babelHelpers.AwaitValue = _AwaitValue;

	function AsyncGenerator(gen) {
		var front, back;

		function send(key, arg) {
			return new Promise(function (resolve, reject) {
				var request = {
					key: key,
					arg: arg,
					resolve: resolve,
					reject: reject,
					next: null
				};

				if (back) {
					back = back.next = request;
				} else {
					front = back = request;
					resume(key, arg);
				}
			});
		}

		function resume(key, arg) {
			try {
				var result = gen[key](arg);
				var value = result.value;
				var wrappedAwait = value instanceof babelHelpers.AwaitValue;
				Promise.resolve(wrappedAwait ? value.wrapped : value).then(function (arg) {
					if (wrappedAwait) {
						resume("next", arg);
						return;
					}

					settle(result.done ? "return" : "normal", arg);
				}, function (err) {
					resume("throw", err);
				});
			} catch (err) {
				settle("throw", err);
			}
		}

		function settle(type, value) {
			switch (type) {
				case "return":
					front.resolve({
						value: value,
						done: true
					});
					break;

				case "throw":
					front.reject(value);
					break;

				default:
					front.resolve({
						value: value,
						done: false
					});
					break;
			}

			front = front.next;

			if (front) {
				resume(front.key, front.arg);
			} else {
				back = null;
			}
		}

		this._invoke = send;

		if (typeof gen.return !== "function") {
			this.return = undefined;
		}
	}

	if (typeof Symbol === "function" && Symbol.asyncIterator) {
		AsyncGenerator.prototype[Symbol.asyncIterator] = function () {
			return this;
		};
	}

	AsyncGenerator.prototype.next = function (arg) {
		return this._invoke("next", arg);
	};

	AsyncGenerator.prototype.throw = function (arg) {
		return this._invoke("throw", arg);
	};

	AsyncGenerator.prototype.return = function (arg) {
		return this._invoke("return", arg);
	};

	babelHelpers.AsyncGenerator = AsyncGenerator;

	function _wrapAsyncGenerator(fn) {
		return function () {
			return new babelHelpers.AsyncGenerator(fn.apply(this, arguments));
		};
	}

	babelHelpers.wrapAsyncGenerator = _wrapAsyncGenerator;

	function _awaitAsyncGenerator(value) {
		return new babelHelpers.AwaitValue(value);
	}

	babelHelpers.awaitAsyncGenerator = _awaitAsyncGenerator;

	function _asyncGeneratorDelegate(inner, awaitWrap) {
		var iter = {},
				waiting = false;

		function pump(key, value) {
			waiting = true;
			value = new Promise(function (resolve) {
				resolve(inner[key](value));
			});
			return {
				done: false,
				value: awaitWrap(value)
			};
		}

		;

		if (typeof Symbol === "function" && Symbol.iterator) {
			iter[Symbol.iterator] = function () {
				return this;
			};
		}

		iter.next = function (value) {
			if (waiting) {
				waiting = false;
				return value;
			}

			return pump("next", value);
		};

		if (typeof inner.throw === "function") {
			iter.throw = function (value) {
				if (waiting) {
					waiting = false;
					throw value;
				}

				return pump("throw", value);
			};
		}

		if (typeof inner.return === "function") {
			iter.return = function (value) {
				return pump("return", value);
			};
		}

		return iter;
	}

	babelHelpers.asyncGeneratorDelegate = _asyncGeneratorDelegate;

	function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) {
		try {
			var info = gen[key](arg);
			var value = info.value;
		} catch (error) {
			reject(error);
			return;
		}

		if (info.done) {
			resolve(value);
		} else {
			Promise.resolve(value).then(_next, _throw);
		}
	}

	function _asyncToGenerator(fn) {
		return function () {
			var self = this,
					args = arguments;
			return new Promise(function (resolve, reject) {
				var gen = fn.apply(self, args);

				function _next(value) {
					asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value);
				}

				function _throw(err) {
					asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err);
				}

				_next(undefined);
			});
		};
	}

	babelHelpers.asyncToGenerator = _asyncToGenerator;

	function _classCallCheck(instance, Constructor) {
		if (!(instance instanceof Constructor)) {
			throw new TypeError("Cannot call a class as a function");
		}
	}

	babelHelpers.classCallCheck = _classCallCheck;

	function _defineProperties(target, props) {
		for (var i = 0; i < props.length; i++) {
			var descriptor = props[i];
			descriptor.enumerable = descriptor.enumerable || false;
			descriptor.configurable = true;
			if ("value" in descriptor) descriptor.writable = true;
			Object.defineProperty(target, descriptor.key, descriptor);
		}
	}

	function _createClass(Constructor, protoProps, staticProps) {
		if (protoProps) _defineProperties(Constructor.prototype, protoProps);
		if (staticProps) _defineProperties(Constructor, staticProps);
		return Constructor;
	}

	babelHelpers.createClass = _createClass;

	function _defineEnumerableProperties(obj, descs) {
		for (var key in descs) {
			var desc = descs[key];
			desc.configurable = desc.enumerable = true;
			if ("value" in desc) desc.writable = true;
			Object.defineProperty(obj, key, desc);
		}

		if (Object.getOwnPropertySymbols) {
			var objectSymbols = Object.getOwnPropertySymbols(descs);

			for (var i = 0; i < objectSymbols.length; i++) {
				var sym = objectSymbols[i];
				var desc = descs[sym];
				desc.configurable = desc.enumerable = true;
				if ("value" in desc) desc.writable = true;
				Object.defineProperty(obj, sym, desc);
			}
		}

		return obj;
	}

	babelHelpers.defineEnumerableProperties = _defineEnumerableProperties;

	function _defaults(obj, defaults) {
		var keys = Object.getOwnPropertyNames(defaults);

		for (var i = 0; i < keys.length; i++) {
			var key = keys[i];
			var value = Object.getOwnPropertyDescriptor(defaults, key);

			if (value && value.configurable && obj[key] === undefined) {
				Object.defineProperty(obj, key, value);
			}
		}

		return obj;
	}

	babelHelpers.defaults = _defaults;

	function _defineProperty(obj, key, value) {
		if (key in obj) {
			Object.defineProperty(obj, key, {
				value: value,
				enumerable: true,
				configurable: true,
				writable: true
			});
		} else {
			obj[key] = value;
		}

		return obj;
	}

	babelHelpers.defineProperty = _defineProperty;

	function _extends() {
		babelHelpers.extends = _extends = Object.assign || function (target) {
			for (var i = 1; i < arguments.length; i++) {
				var source = arguments[i];

				for (var key in source) {
					if (Object.prototype.hasOwnProperty.call(source, key)) {
						target[key] = source[key];
					}
				}
			}

			return target;
		};

		return _extends.apply(this, arguments);
	}

	babelHelpers.extends = _extends;

	function _objectSpread(target) {
		for (var i = 1; i < arguments.length; i++) {
			var source = arguments[i] != null ? arguments[i] : {};
			var ownKeys = Object.keys(source);

			if (typeof Object.getOwnPropertySymbols === 'function') {
				ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function (sym) {
					return Object.getOwnPropertyDescriptor(source, sym).enumerable;
				}));
			}

			ownKeys.forEach(function (key) {
				babelHelpers.defineProperty(target, key, source[key]);
			});
		}

		return target;
	}

	babelHelpers.objectSpread = _objectSpread;

	function _inherits(subClass, superClass) {
		if (typeof superClass !== "function" && superClass !== null) {
			throw new TypeError("Super expression must either be null or a function");
		}

		subClass.prototype = Object.create(superClass && superClass.prototype, {
			constructor: {
				value: subClass,
				writable: true,
				configurable: true
			}
		});
		if (superClass) babelHelpers.setPrototypeOf(subClass, superClass);
	}

	babelHelpers.inherits = _inherits;

	function _inheritsLoose(subClass, superClass) {
		subClass.prototype = Object.create(superClass.prototype);
		subClass.prototype.constructor = subClass;
		subClass.__proto__ = superClass;
	}

	babelHelpers.inheritsLoose = _inheritsLoose;

	function _getPrototypeOf(o) {
		babelHelpers.getPrototypeOf = _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) {
			return o.__proto__ || Object.getPrototypeOf(o);
		};
		return _getPrototypeOf(o);
	}

	babelHelpers.getPrototypeOf = _getPrototypeOf;

	function _setPrototypeOf(o, p) {
		babelHelpers.setPrototypeOf = _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) {
			o.__proto__ = p;
			return o;
		};

		return _setPrototypeOf(o, p);
	}

	babelHelpers.setPrototypeOf = _setPrototypeOf;

	function isNativeReflectConstruct() {
		if (typeof Reflect === "undefined" || !Reflect.construct) return false;
		if (Reflect.construct.sham) return false;
		if (typeof Proxy === "function") return true;

		try {
			Date.prototype.toString.call(Reflect.construct(Date, [], function () {}));
			return true;
		} catch (e) {
			return false;
		}
	}

	function _construct(Parent, args, Class) {
		if (isNativeReflectConstruct()) {
			babelHelpers.construct = _construct = Reflect.construct;
		} else {
			babelHelpers.construct = _construct = function _construct(Parent, args, Class) {
				var a = [null];
				a.push.apply(a, args);
				var Constructor = Function.bind.apply(Parent, a);
				var instance = new Constructor();
				if (Class) babelHelpers.setPrototypeOf(instance, Class.prototype);
				return instance;
			};
		}

		return _construct.apply(null, arguments);
	}

	babelHelpers.construct = _construct;

	function _isNativeFunction(fn) {
		return Function.toString.call(fn).indexOf("[native code]") !== -1;
	}

	babelHelpers.isNativeFunction = _isNativeFunction;

	function _wrapNativeSuper(Class) {
		var _cache = typeof Map === "function" ? new Map() : undefined;

		babelHelpers.wrapNativeSuper = _wrapNativeSuper = function _wrapNativeSuper(Class) {
			if (Class === null || !babelHelpers.isNativeFunction(Class)) return Class;

			if (typeof Class !== "function") {
				throw new TypeError("Super expression must either be null or a function");
			}

			if (typeof _cache !== "undefined") {
				if (_cache.has(Class)) return _cache.get(Class);

				_cache.set(Class, Wrapper);
			}

			function Wrapper() {
				return babelHelpers.construct(Class, arguments, babelHelpers.getPrototypeOf(this).constructor);
			}

			Wrapper.prototype = Object.create(Class.prototype, {
				constructor: {
					value: Wrapper,
					enumerable: false,
					writable: true,
					configurable: true
				}
			});
			return babelHelpers.setPrototypeOf(Wrapper, Class);
		};

		return _wrapNativeSuper(Class);
	}

	babelHelpers.wrapNativeSuper = _wrapNativeSuper;

	function _instanceof(left, right) {
		if (right != null && typeof Symbol !== "undefined" && right[Symbol.hasInstance]) {
			return right[Symbol.hasInstance](left);
		} else {
			return left instanceof right;
		}
	}

	babelHelpers.instanceof = _instanceof;

	function _interopRequireDefault(obj) {
		return obj && obj.__esModule ? obj : {
			default: obj
		};
	}

	babelHelpers.interopRequireDefault = _interopRequireDefault;

	function _interopRequireWildcard(obj) {
		if (obj && obj.__esModule) {
			return obj;
		} else {
			var newObj = {};

			if (obj != null) {
				for (var key in obj) {
					if (Object.prototype.hasOwnProperty.call(obj, key)) {
						var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {};

						if (desc.get || desc.set) {
							Object.defineProperty(newObj, key, desc);
						} else {
							newObj[key] = obj[key];
						}
					}
				}
			}

			newObj.default = obj;
			return newObj;
		}
	}

	babelHelpers.interopRequireWildcard = _interopRequireWildcard;

	function _newArrowCheck(innerThis, boundThis) {
		if (innerThis !== boundThis) {
			throw new TypeError("Cannot instantiate an arrow function");
		}
	}

	babelHelpers.newArrowCheck = _newArrowCheck;

	function _objectDestructuringEmpty(obj) {
		if (obj == null) throw new TypeError("Cannot destructure undefined");
	}

	babelHelpers.objectDestructuringEmpty = _objectDestructuringEmpty;

	function _objectWithoutPropertiesLoose(source, excluded) {
		if (source == null) return {};
		var target = {};
		var sourceKeys = Object.keys(source);
		var key, i;

		for (i = 0; i < sourceKeys.length; i++) {
			key = sourceKeys[i];
			if (excluded.indexOf(key) >= 0) continue;
			target[key] = source[key];
		}

		return target;
	}

	babelHelpers.objectWithoutPropertiesLoose = _objectWithoutPropertiesLoose;

	function _objectWithoutProperties(source, excluded) {
		if (source == null) return {};
		var target = babelHelpers.objectWithoutPropertiesLoose(source, excluded);
		var key, i;

		if (Object.getOwnPropertySymbols) {
			var sourceSymbolKeys = Object.getOwnPropertySymbols(source);

			for (i = 0; i < sourceSymbolKeys.length; i++) {
				key = sourceSymbolKeys[i];
				if (excluded.indexOf(key) >= 0) continue;
				if (!Object.prototype.propertyIsEnumerable.call(source, key)) continue;
				target[key] = source[key];
			}
		}

		return target;
	}

	babelHelpers.objectWithoutProperties = _objectWithoutProperties;

	function _assertThisInitialized(self) {
		if (self === void 0) {
			throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
		}

		return self;
	}

	babelHelpers.assertThisInitialized = _assertThisInitialized;

	function _possibleConstructorReturn(self, call) {
		if (call && (typeof call === "object" || typeof call === "function")) {
			return call;
		}

		return babelHelpers.assertThisInitialized(self);
	}

	babelHelpers.possibleConstructorReturn = _possibleConstructorReturn;

	function _superPropBase(object, property) {
		while (!Object.prototype.hasOwnProperty.call(object, property)) {
			object = babelHelpers.getPrototypeOf(object);
			if (object === null) break;
		}

		return object;
	}

	babelHelpers.superPropBase = _superPropBase;

	function _get(target, property, receiver) {
		if (typeof Reflect !== "undefined" && Reflect.get) {
			babelHelpers.get = _get = Reflect.get;
		} else {
			babelHelpers.get = _get = function _get(target, property, receiver) {
				var base = babelHelpers.superPropBase(target, property);
				if (!base) return;
				var desc = Object.getOwnPropertyDescriptor(base, property);

				if (desc.get) {
					return desc.get.call(receiver);
				}

				return desc.value;
			};
		}

		return _get(target, property, receiver || target);
	}

	babelHelpers.get = _get;

	function set(target, property, value, receiver) {
		if (typeof Reflect !== "undefined" && Reflect.set) {
			set = Reflect.set;
		} else {
			set = function set(target, property, value, receiver) {
				var base = babelHelpers.superPropBase(target, property);
				var desc;

				if (base) {
					desc = Object.getOwnPropertyDescriptor(base, property);

					if (desc.set) {
						desc.set.call(receiver, value);
						return true;
					} else if (!desc.writable) {
						return false;
					}
				}

				desc = Object.getOwnPropertyDescriptor(receiver, property);

				if (desc) {
					if (!desc.writable) {
						return false;
					}

					desc.value = value;
					Object.defineProperty(receiver, property, desc);
				} else {
					babelHelpers.defineProperty(receiver, property, value);
				}

				return true;
			};
		}

		return set(target, property, value, receiver);
	}

	function _set(target, property, value, receiver, isStrict) {
		var s = set(target, property, value, receiver || target);

		if (!s && isStrict) {
			throw new Error('failed to set property');
		}

		return value;
	}

	babelHelpers.set = _set;

	function _taggedTemplateLiteral(strings, raw) {
		if (!raw) {
			raw = strings.slice(0);
		}

		return Object.freeze(Object.defineProperties(strings, {
			raw: {
				value: Object.freeze(raw)
			}
		}));
	}

	babelHelpers.taggedTemplateLiteral = _taggedTemplateLiteral;

	function _taggedTemplateLiteralLoose(strings, raw) {
		if (!raw) {
			raw = strings.slice(0);
		}

		strings.raw = raw;
		return strings;
	}

	babelHelpers.taggedTemplateLiteralLoose = _taggedTemplateLiteralLoose;

	function _temporalRef(val, name) {
		if (val === babelHelpers.temporalUndefined) {
			throw new ReferenceError(name + " is not defined - temporal dead zone");
		} else {
			return val;
		}
	}

	babelHelpers.temporalRef = _temporalRef;

	function _readOnlyError(name) {
		throw new Error("\"" + name + "\" is read-only");
	}

	babelHelpers.readOnlyError = _readOnlyError;

	function _classNameTDZError(name) {
		throw new Error("Class \"" + name + "\" cannot be referenced in computed property keys.");
	}

	babelHelpers.classNameTDZError = _classNameTDZError;
	babelHelpers.temporalUndefined = {};

	function _slicedToArray(arr, i) {
		return babelHelpers.arrayWithHoles(arr) || babelHelpers.iterableToArrayLimit(arr, i) || babelHelpers.nonIterableRest();
	}

	babelHelpers.slicedToArray = _slicedToArray;

	function _slicedToArrayLoose(arr, i) {
		return babelHelpers.arrayWithHoles(arr) || babelHelpers.iterableToArrayLimitLoose(arr, i) || babelHelpers.nonIterableRest();
	}

	babelHelpers.slicedToArrayLoose = _slicedToArrayLoose;

	function _toArray(arr) {
		return babelHelpers.arrayWithHoles(arr) || babelHelpers.iterableToArray(arr) || babelHelpers.nonIterableRest();
	}

	babelHelpers.toArray = _toArray;

	function _toConsumableArray(arr) {
		return babelHelpers.arrayWithoutHoles(arr) || babelHelpers.iterableToArray(arr) || babelHelpers.nonIterableSpread();
	}

	babelHelpers.toConsumableArray = _toConsumableArray;

	function _arrayWithoutHoles(arr) {
		if (Array.isArray(arr)) {
			for (var i = 0, arr2 = new Array(arr.length); i < arr.length; i++) arr2[i] = arr[i];

			return arr2;
		}
	}

	babelHelpers.arrayWithoutHoles = _arrayWithoutHoles;

	function _arrayWithHoles(arr) {
		if (Array.isArray(arr)) return arr;
	}

	babelHelpers.arrayWithHoles = _arrayWithHoles;

	function _iterableToArray(iter) {
		if (Symbol.iterator in Object(iter) || Object.prototype.toString.call(iter) === "[object Arguments]") return Array.from(iter);
	}

	babelHelpers.iterableToArray = _iterableToArray;

	function _iterableToArrayLimit(arr, i) {
		var _arr = [];
		var _n = true;
		var _d = false;
		var _e = undefined;

		try {
			for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) {
				_arr.push(_s.value);

				if (i && _arr.length === i) break;
			}
		} catch (err) {
			_d = true;
			_e = err;
		} finally {
			try {
				if (!_n && _i["return"] != null) _i["return"]();
			} finally {
				if (_d) throw _e;
			}
		}

		return _arr;
	}

	babelHelpers.iterableToArrayLimit = _iterableToArrayLimit;

	function _iterableToArrayLimitLoose(arr, i) {
		var _arr = [];

		for (var _iterator = arr[Symbol.iterator](), _step; !(_step = _iterator.next()).done;) {
			_arr.push(_step.value);

			if (i && _arr.length === i) break;
		}

		return _arr;
	}

	babelHelpers.iterableToArrayLimitLoose = _iterableToArrayLimitLoose;

	function _nonIterableSpread() {
		throw new TypeError("Invalid attempt to spread non-iterable instance");
	}

	babelHelpers.nonIterableSpread = _nonIterableSpread;

	function _nonIterableRest() {
		throw new TypeError("Invalid attempt to destructure non-iterable instance");
	}

	babelHelpers.nonIterableRest = _nonIterableRest;

	function _skipFirstGeneratorNext(fn) {
		return function () {
			var it = fn.apply(this, arguments);
			it.next();
			return it;
		};
	}

	babelHelpers.skipFirstGeneratorNext = _skipFirstGeneratorNext;

	function _toPropertyKey(key) {
		if (typeof key === "symbol") {
			return key;
		} else {
			return String(key);
		}
	}

	babelHelpers.toPropertyKey = _toPropertyKey;

	function _initializerWarningHelper(descriptor, context) {
		throw new Error('Decorating class property failed. Please ensure that ' + 'proposal-class-properties is enabled and set to use loose mode. ' + 'To use proposal-class-properties in spec mode with decorators, wait for ' + 'the next major version of decorators in stage 2.');
	}

	babelHelpers.initializerWarningHelper = _initializerWarningHelper;

	function _initializerDefineProperty(target, property, descriptor, context) {
		if (!descriptor) return;
		Object.defineProperty(target, property, {
			enumerable: descriptor.enumerable,
			configurable: descriptor.configurable,
			writable: descriptor.writable,
			value: descriptor.initializer ? descriptor.initializer.call(context) : void 0
		});
	}

	babelHelpers.initializerDefineProperty = _initializerDefineProperty;

	function _applyDecoratedDescriptor(target, property, decorators, descriptor, context) {
		var desc = {};
		Object['ke' + 'ys'](descriptor).forEach(function (key) {
			desc[key] = descriptor[key];
		});
		desc.enumerable = !!desc.enumerable;
		desc.configurable = !!desc.configurable;

		if ('value' in desc || desc.initializer) {
			desc.writable = true;
		}

		desc = decorators.slice().reverse().reduce(function (desc, decorator) {
			return decorator(target, property, desc) || desc;
		}, desc);

		if (context && desc.initializer !== void 0) {
			desc.value = desc.initializer ? desc.initializer.call(context) : void 0;
			desc.initializer = undefined;
		}

		if (desc.initializer === void 0) {
			Object['define' + 'Property'](target, property, desc);
			desc = null;
		}

		return desc;
	}

	babelHelpers.applyDecoratedDescriptor = _applyDecoratedDescriptor;
	var id = 0;

	function _classPrivateFieldKey(name) {
		return "__private_" + id++ + "_" + name;
	}

	babelHelpers.classPrivateFieldLooseKey = _classPrivateFieldKey;

	function _classPrivateFieldBase(receiver, privateKey) {
		if (!Object.prototype.hasOwnProperty.call(receiver, privateKey)) {
			throw new TypeError("attempted to use private field on non-instance");
		}

		return receiver;
	}

	babelHelpers.classPrivateFieldLooseBase = _classPrivateFieldBase;

	function _classPrivateFieldGet(receiver, privateMap) {
		if (!privateMap.has(receiver)) {
			throw new TypeError("attempted to get private field on non-instance");
		}

		return privateMap.get(receiver).value;
	}

	babelHelpers.classPrivateFieldGet = _classPrivateFieldGet;

	function _classPrivateFieldSet(receiver, privateMap, value) {
		if (!privateMap.has(receiver)) {
			throw new TypeError("attempted to set private field on non-instance");
		}

		var descriptor = privateMap.get(receiver);

		if (!descriptor.writable) {
			throw new TypeError("attempted to set read only private field");
		}

		descriptor.value = value;
		return value;
	}

	babelHelpers.classPrivateFieldSet = _classPrivateFieldSet;
})(typeof global === "undefined" ? window : global);

/**
 * Copyright (c) 2014-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

!(function(global) {
	"use strict";

	var Op = Object.prototype;
	var hasOwn = Op.hasOwnProperty;
	var undefined; // More compressible than void 0.
	var $Symbol = typeof Symbol === "function" ? Symbol : {};
	var iteratorSymbol = $Symbol.iterator || "@@iterator";
	var asyncIteratorSymbol = $Symbol.asyncIterator || "@@asyncIterator";
	var toStringTagSymbol = $Symbol.toStringTag || "@@toStringTag";

	// Define the runtime globally (as expected by generated code) as either
	// module.exports (if we're in a module) or a new, empty object.
	var runtime = global.regeneratorRuntime = {};

	function wrap(innerFn, outerFn, self, tryLocsList) {
		// If outerFn provided and outerFn.prototype is a Generator, then outerFn.prototype instanceof Generator.
		var protoGenerator = outerFn && outerFn.prototype instanceof Generator ? outerFn : Generator;
		var generator = Object.create(protoGenerator.prototype);
		var context = new Context(tryLocsList || []);

		// The ._invoke method unifies the implementations of the .next,
		// .throw, and .return methods.
		generator._invoke = makeInvokeMethod(innerFn, self, context);

		return generator;
	}
	runtime.wrap = wrap;

	// Try/catch helper to minimize deoptimizations. Returns a completion
	// record like context.tryEntries[i].completion. This interface could
	// have been (and was previously) designed to take a closure to be
	// invoked without arguments, but in all the cases we care about we
	// already have an existing method we want to call, so there's no need
	// to create a new function object. We can even get away with assuming
	// the method takes exactly one argument, since that happens to be true
	// in every case, so we don't have to touch the arguments object. The
	// only additional allocation required is the completion record, which
	// has a stable shape and so hopefully should be cheap to allocate.
	function tryCatch(fn, obj, arg) {
		try {
			return { type: "normal", arg: fn.call(obj, arg) };
		} catch (err) {
			return { type: "throw", arg: err };
		}
	}

	var GenStateSuspendedStart = "suspendedStart";
	var GenStateSuspendedYield = "suspendedYield";
	var GenStateExecuting = "executing";
	var GenStateCompleted = "completed";

	// Returning this object from the innerFn has the same effect as
	// breaking out of the dispatch switch statement.
	var ContinueSentinel = {};

	// Dummy constructor functions that we use as the .constructor and
	// .constructor.prototype properties for functions that return Generator
	// objects. For full spec compliance, you may wish to configure your
	// minifier not to mangle the names of these two functions.
	function Generator() {}
	function GeneratorFunction() {}
	function GeneratorFunctionPrototype() {}

	// This is a polyfill for %IteratorPrototype% for environments that
	// don't natively support it.
	var IteratorPrototype = {};
	IteratorPrototype[iteratorSymbol] = function () {
		return this;
	};

	var getProto = Object.getPrototypeOf;
	var NativeIteratorPrototype = getProto && getProto(getProto(values([])));
	if (NativeIteratorPrototype &&
		NativeIteratorPrototype !== Op &&
		hasOwn.call(NativeIteratorPrototype, iteratorSymbol)) {
		// This environment has a native %IteratorPrototype%; use it instead
		// of the polyfill.
		IteratorPrototype = NativeIteratorPrototype;
	}

	var Gp = GeneratorFunctionPrototype.prototype =
		Generator.prototype = Object.create(IteratorPrototype);
	GeneratorFunction.prototype = Gp.constructor = GeneratorFunctionPrototype;
	GeneratorFunctionPrototype.constructor = GeneratorFunction;
	GeneratorFunctionPrototype[toStringTagSymbol] =
		GeneratorFunction.displayName = "GeneratorFunction";

	// Helper for defining the .next, .throw, and .return methods of the
	// Iterator interface in terms of a single ._invoke method.
	function defineIteratorMethods(prototype) {
		["next", "throw", "return"].forEach(function(method) {
			prototype[method] = function(arg) {
				return this._invoke(method, arg);
			};
		});
	}

	runtime.isGeneratorFunction = function(genFun) {
		var ctor = typeof genFun === "function" && genFun.constructor;
		return ctor
			? ctor === GeneratorFunction ||
			// For the native GeneratorFunction constructor, the best we can
			// do is to check its .name property.
			(ctor.displayName || ctor.name) === "GeneratorFunction"
			: false;
	};

	runtime.mark = function(genFun) {
		if (Object.setPrototypeOf) {
			Object.setPrototypeOf(genFun, GeneratorFunctionPrototype);
		} else {
			genFun.__proto__ = GeneratorFunctionPrototype;
			if (!(toStringTagSymbol in genFun)) {
				genFun[toStringTagSymbol] = "GeneratorFunction";
			}
		}
		genFun.prototype = Object.create(Gp);
		return genFun;
	};

	// Within the body of any async function, `await x` is transformed to
	// `yield regeneratorRuntime.awrap(x)`, so that the runtime can test
	// `hasOwn.call(value, "__await")` to determine if the yielded value is
	// meant to be awaited.
	runtime.awrap = function(arg) {
		return { __await: arg };
	};

	function AsyncIterator(generator) {
		function invoke(method, arg, resolve, reject) {
			var record = tryCatch(generator[method], generator, arg);
			if (record.type === "throw") {
				reject(record.arg);
			} else {
				var result = record.arg;
				var value = result.value;
				if (value &&
					typeof value === "object" &&
					hasOwn.call(value, "__await")) {
					return Promise.resolve(value.__await).then(function(value) {
						invoke("next", value, resolve, reject);
					}, function(err) {
						invoke("throw", err, resolve, reject);
					});
				}

				return Promise.resolve(value).then(function(unwrapped) {
					// When a yielded Promise is resolved, its final value becomes
					// the .value of the Promise<{value,done}> result for the
					// current iteration. If the Promise is rejected, however, the
					// result for this iteration will be rejected with the same
					// reason. Note that rejections of yielded Promises are not
					// thrown back into the generator function, as is the case
					// when an awaited Promise is rejected. This difference in
					// behavior between yield and await is important, because it
					// allows the consumer to decide what to do with the yielded
					// rejection (swallow it and continue, manually .throw it back
					// into the generator, abandon iteration, whatever). With
					// await, by contrast, there is no opportunity to examine the
					// rejection reason outside the generator function, so the
					// only option is to throw it from the await expression, and
					// let the generator function handle the exception.
					result.value = unwrapped;
					resolve(result);
				}, reject);
			}
		}

		var previousPromise;

		function enqueue(method, arg) {
			function callInvokeWithMethodAndArg() {
				return new Promise(function(resolve, reject) {
					invoke(method, arg, resolve, reject);
				});
			}

			return previousPromise =
				// If enqueue has been called before, then we want to wait until
				// all previous Promises have been resolved before calling invoke,
				// so that results are always delivered in the correct order. If
				// enqueue has not been called before, then it is important to
				// call invoke immediately, without waiting on a callback to fire,
				// so that the async generator function has the opportunity to do
				// any necessary setup in a predictable way. This predictability
				// is why the Promise constructor synchronously invokes its
				// executor callback, and why async functions synchronously
				// execute code before the first await. Since we implement simple
				// async functions in terms of async generators, it is especially
				// important to get this right, even though it requires care.
				previousPromise ? previousPromise.then(
					callInvokeWithMethodAndArg,
					// Avoid propagating failures to Promises returned by later
					// invocations of the iterator.
					callInvokeWithMethodAndArg
				) : callInvokeWithMethodAndArg();
		}

		// Define the unified helper method that is used to implement .next,
		// .throw, and .return (see defineIteratorMethods).
		this._invoke = enqueue;
	}

	defineIteratorMethods(AsyncIterator.prototype);
	AsyncIterator.prototype[asyncIteratorSymbol] = function () {
		return this;
	};
	runtime.AsyncIterator = AsyncIterator;

	// Note that simple async functions are implemented on top of
	// AsyncIterator objects; they just return a Promise for the value of
	// the final result produced by the iterator.
	runtime.async = function(innerFn, outerFn, self, tryLocsList) {
		var iter = new AsyncIterator(
			wrap(innerFn, outerFn, self, tryLocsList)
		);

		return runtime.isGeneratorFunction(outerFn)
			? iter // If outerFn is a generator, return the full iterator.
			: iter.next().then(function(result) {
				return result.done ? result.value : iter.next();
			});
	};

	function makeInvokeMethod(innerFn, self, context) {
		var state = GenStateSuspendedStart;

		return function invoke(method, arg) {
			if (state === GenStateExecuting) {
				throw new Error("Generator is already running");
			}

			if (state === GenStateCompleted) {
				if (method === "throw") {
					throw arg;
				}

				// Be forgiving, per 25.3.3.3.3 of the spec:
				// https://people.mozilla.org/~jorendorff/es6-draft.html#sec-generatorresume
				return doneResult();
			}

			context.method = method;
			context.arg = arg;

			while (true) {
				var delegate = context.delegate;
				if (delegate) {
					var delegateResult = maybeInvokeDelegate(delegate, context);
					if (delegateResult) {
						if (delegateResult === ContinueSentinel) continue;
						return delegateResult;
					}
				}

				if (context.method === "next") {
					// Setting context._sent for legacy support of Babel's
					// function.sent implementation.
					context.sent = context._sent = context.arg;

				} else if (context.method === "throw") {
					if (state === GenStateSuspendedStart) {
						state = GenStateCompleted;
						throw context.arg;
					}

					context.dispatchException(context.arg);

				} else if (context.method === "return") {
					context.abrupt("return", context.arg);
				}

				state = GenStateExecuting;

				var record = tryCatch(innerFn, self, context);
				if (record.type === "normal") {
					// If an exception is thrown from innerFn, we leave state ===
					// GenStateExecuting and loop back for another invocation.
					state = context.done
						? GenStateCompleted
						: GenStateSuspendedYield;

					if (record.arg === ContinueSentinel) {
						continue;
					}

					return {
						value: record.arg,
						done: context.done
					};

				} else if (record.type === "throw") {
					state = GenStateCompleted;
					// Dispatch the exception by looping back around to the
					// context.dispatchException(context.arg) call above.
					context.method = "throw";
					context.arg = record.arg;
				}
			}
		};
	}

	// Call delegate.iterator[context.method](context.arg) and handle the
	// result, either by returning a { value, done } result from the
	// delegate iterator, or by modifying context.method and context.arg,
	// setting context.delegate to null, and returning the ContinueSentinel.
	function maybeInvokeDelegate(delegate, context) {
		var method = delegate.iterator[context.method];
		if (method === undefined) {
			// A .throw or .return when the delegate iterator has no .throw
			// method always terminates the yield* loop.
			context.delegate = null;

			if (context.method === "throw") {
				if (delegate.iterator.return) {
					// If the delegate iterator has a return method, give it a
					// chance to clean up.
					context.method = "return";
					context.arg = undefined;
					maybeInvokeDelegate(delegate, context);

					if (context.method === "throw") {
						// If maybeInvokeDelegate(context) changed context.method from
						// "return" to "throw", let that override the TypeError below.
						return ContinueSentinel;
					}
				}

				context.method = "throw";
				context.arg = new TypeError(
					"The iterator does not provide a 'throw' method");
			}

			return ContinueSentinel;
		}

		var record = tryCatch(method, delegate.iterator, context.arg);

		if (record.type === "throw") {
			context.method = "throw";
			context.arg = record.arg;
			context.delegate = null;
			return ContinueSentinel;
		}

		var info = record.arg;

		if (! info) {
			context.method = "throw";
			context.arg = new TypeError("iterator result is not an object");
			context.delegate = null;
			return ContinueSentinel;
		}

		if (info.done) {
			// Assign the result of the finished delegate to the temporary
			// variable specified by delegate.resultName (see delegateYield).
			context[delegate.resultName] = info.value;

			// Resume execution at the desired location (see delegateYield).
			context.next = delegate.nextLoc;

			// If context.method was "throw" but the delegate handled the
			// exception, let the outer generator proceed normally. If
			// context.method was "next", forget context.arg since it has been
			// "consumed" by the delegate iterator. If context.method was
			// "return", allow the original .return call to continue in the
			// outer generator.
			if (context.method !== "return") {
				context.method = "next";
				context.arg = undefined;
			}

		} else {
			// Re-yield the result returned by the delegate method.
			return info;
		}

		// The delegate iterator is finished, so forget it and continue with
		// the outer generator.
		context.delegate = null;
		return ContinueSentinel;
	}

	// Define Generator.prototype.{next,throw,return} in terms of the
	// unified ._invoke helper method.
	defineIteratorMethods(Gp);

	Gp[toStringTagSymbol] = "Generator";

	// A Generator should always return itself as the iterator object when the
	// @@iterator function is called on it. Some browsers' implementations of the
	// iterator prototype chain incorrectly implement this, causing the Generator
	// object to not be returned from this call. This ensures that doesn't happen.
	// See https://github.com/facebook/regenerator/issues/274 for more details.
	Gp[iteratorSymbol] = function() {
		return this;
	};

	Gp.toString = function() {
		return "[object Generator]";
	};

	function pushTryEntry(locs) {
		var entry = { tryLoc: locs[0] };

		if (1 in locs) {
			entry.catchLoc = locs[1];
		}

		if (2 in locs) {
			entry.finallyLoc = locs[2];
			entry.afterLoc = locs[3];
		}

		this.tryEntries.push(entry);
	}

	function resetTryEntry(entry) {
		var record = entry.completion || {};
		record.type = "normal";
		delete record.arg;
		entry.completion = record;
	}

	function Context(tryLocsList) {
		// The root entry object (effectively a try statement without a catch
		// or a finally block) gives us a place to store values thrown from
		// locations where there is no enclosing try statement.
		this.tryEntries = [{ tryLoc: "root" }];
		tryLocsList.forEach(pushTryEntry, this);
		this.reset(true);
	}

	runtime.keys = function(object) {
		var keys = [];
		for (var key in object) {
			keys.push(key);
		}
		keys.reverse();

		// Rather than returning an object with a next method, we keep
		// things simple and return the next function itself.
		return function next() {
			while (keys.length) {
				var key = keys.pop();
				if (key in object) {
					next.value = key;
					next.done = false;
					return next;
				}
			}

			// To avoid creating an additional object, we just hang the .value
			// and .done properties off the next function object itself. This
			// also ensures that the minifier will not anonymize the function.
			next.done = true;
			return next;
		};
	};

	function values(iterable) {
		if (iterable) {
			var iteratorMethod = iterable[iteratorSymbol];
			if (iteratorMethod) {
				return iteratorMethod.call(iterable);
			}

			if (typeof iterable.next === "function") {
				return iterable;
			}

			if (!isNaN(iterable.length)) {
				var i = -1, next = function next() {
					while (++i < iterable.length) {
						if (hasOwn.call(iterable, i)) {
							next.value = iterable[i];
							next.done = false;
							return next;
						}
					}

					next.value = undefined;
					next.done = true;

					return next;
				};

				return next.next = next;
			}
		}

		// Return an iterator with no values.
		return { next: doneResult };
	}
	runtime.values = values;

	function doneResult() {
		return { value: undefined, done: true };
	}

	Context.prototype = {
		constructor: Context,

		reset: function(skipTempReset) {
			this.prev = 0;
			this.next = 0;
			// Resetting context._sent for legacy support of Babel's
			// function.sent implementation.
			this.sent = this._sent = undefined;
			this.done = false;
			this.delegate = null;

			this.method = "next";
			this.arg = undefined;

			this.tryEntries.forEach(resetTryEntry);

			if (!skipTempReset) {
				for (var name in this) {
					// Not sure about the optimal order of these conditions:
					if (name.charAt(0) === "t" &&
						hasOwn.call(this, name) &&
						!isNaN(+name.slice(1))) {
						this[name] = undefined;
					}
				}
			}
		},

		stop: function() {
			this.done = true;

			var rootEntry = this.tryEntries[0];
			var rootRecord = rootEntry.completion;
			if (rootRecord.type === "throw") {
				throw rootRecord.arg;
			}

			return this.rval;
		},

		dispatchException: function(exception) {
			if (this.done) {
				throw exception;
			}

			var context = this;
			function handle(loc, caught) {
				record.type = "throw";
				record.arg = exception;
				context.next = loc;

				if (caught) {
					// If the dispatched exception was caught by a catch block,
					// then let that catch block handle the exception normally.
					context.method = "next";
					context.arg = undefined;
				}

				return !! caught;
			}

			for (var i = this.tryEntries.length - 1; i >= 0; --i) {
				var entry = this.tryEntries[i];
				var record = entry.completion;

				if (entry.tryLoc === "root") {
					// Exception thrown outside of any try block that could handle
					// it, so set the completion value of the entire function to
					// throw the exception.
					return handle("end");
				}

				if (entry.tryLoc <= this.prev) {
					var hasCatch = hasOwn.call(entry, "catchLoc");
					var hasFinally = hasOwn.call(entry, "finallyLoc");

					if (hasCatch && hasFinally) {
						if (this.prev < entry.catchLoc) {
							return handle(entry.catchLoc, true);
						} else if (this.prev < entry.finallyLoc) {
							return handle(entry.finallyLoc);
						}

					} else if (hasCatch) {
						if (this.prev < entry.catchLoc) {
							return handle(entry.catchLoc, true);
						}

					} else if (hasFinally) {
						if (this.prev < entry.finallyLoc) {
							return handle(entry.finallyLoc);
						}

					} else {
						throw new Error("try statement without catch or finally");
					}
				}
			}
		},

		abrupt: function(type, arg) {
			for (var i = this.tryEntries.length - 1; i >= 0; --i) {
				var entry = this.tryEntries[i];
				if (entry.tryLoc <= this.prev &&
					hasOwn.call(entry, "finallyLoc") &&
					this.prev < entry.finallyLoc) {
					var finallyEntry = entry;
					break;
				}
			}

			if (finallyEntry &&
				(type === "break" ||
					type === "continue") &&
				finallyEntry.tryLoc <= arg &&
				arg <= finallyEntry.finallyLoc) {
				// Ignore the finally entry if control is not jumping to a
				// location outside the try/catch block.
				finallyEntry = null;
			}

			var record = finallyEntry ? finallyEntry.completion : {};
			record.type = type;
			record.arg = arg;

			if (finallyEntry) {
				this.method = "next";
				this.next = finallyEntry.finallyLoc;
				return ContinueSentinel;
			}

			return this.complete(record);
		},

		complete: function(record, afterLoc) {
			if (record.type === "throw") {
				throw record.arg;
			}

			if (record.type === "break" ||
				record.type === "continue") {
				this.next = record.arg;
			} else if (record.type === "return") {
				this.rval = this.arg = record.arg;
				this.method = "return";
				this.next = "end";
			} else if (record.type === "normal" && afterLoc) {
				this.next = afterLoc;
			}

			return ContinueSentinel;
		},

		finish: function(finallyLoc) {
			for (var i = this.tryEntries.length - 1; i >= 0; --i) {
				var entry = this.tryEntries[i];
				if (entry.finallyLoc === finallyLoc) {
					this.complete(entry.completion, entry.afterLoc);
					resetTryEntry(entry);
					return ContinueSentinel;
				}
			}
		},

		"catch": function(tryLoc) {
			for (var i = this.tryEntries.length - 1; i >= 0; --i) {
				var entry = this.tryEntries[i];
				if (entry.tryLoc === tryLoc) {
					var record = entry.completion;
					if (record.type === "throw") {
						var thrown = record.arg;
						resetTryEntry(entry);
					}
					return thrown;
				}
			}

			// The context.catch method must only be called with a location
			// argument that corresponds to a known catch block.
			throw new Error("illegal catch attempt");
		},

		delegateYield: function(iterable, resultName, nextLoc) {
			this.delegate = {
				iterator: values(iterable),
				resultName: resultName,
				nextLoc: nextLoc
			};

			if (this.method === "next") {
				// Deliberately forget the last sent value so that we don't
				// accidentally pass it on to the delegate.
				this.arg = undefined;
			}

			return ContinueSentinel;
		}
	};
})(
	// In sloppy mode, unbound `this` refers to the global object, fallback to
	// Function constructor if we're in global strict mode. That is sadly a form
	// of indirect eval which violates Content Security Policy.
	(function() { return this })() || Function("return this")()
);

if (window._main_polyfill_core)
{
	console.warn('main.polyfill.core is loaded more than once on this page');
}

window._main_polyfill_core = true;


(function (exports) {
	'use strict';

	function getTag(value) {
		return Object.prototype.toString.call(value);
	}

	const objectCtorString = Function.prototype.toString.call(Object);
	class Type {
		static isString(value) {
			return typeof value === 'string';
		}
		static isStringFilled(value) {
			return Type.isString(value) && value !== '';
		}
		static isFunction(value) {
			return typeof value === 'function';
		}
		static isObject(value) {
			return Boolean(value) && (typeof value === 'object' || typeof value === 'function');
		}
		static isObjectLike(value) {
			return Boolean(value) && typeof value === 'object';
		}
		static isPlainObject(value) {
			if (!Type.isObjectLike(value) || getTag(value) !== '[object Object]') {
				return false;
			}
			const proto = Object.getPrototypeOf(value);
			if (proto === null) {
				return true;
			}
			const ctor = proto.hasOwnProperty('constructor') && proto.constructor;
			return typeof ctor === 'function' && Function.prototype.toString.call(ctor) === objectCtorString;
		}
		static isBoolean(value) {
			return value === true || value === false;
		}
		static isNumber(value) {
			return !Number.isNaN(value) && typeof value === 'number';
		}
		static isInteger(value) {
			return Type.isNumber(value) && value % 1 === 0;
		}
		static isFloat(value) {
			return Type.isNumber(value) && !Type.isInteger(value);
		}
		static isNil(value) {
			return value === null || value === undefined;
		}
		static isArray(value) {
			return !Type.isNil(value) && Array.isArray(value);
		}
		static isArrayFilled(value) {
			return Type.isArray(value) && value.length > 0;
		}
		static isArrayLike(value) {
			if (Type.isNil(value) || Type.isFunction(value) || !('length' in value)) {
				return false;
			}
			const {
				length
			} = value;
			return Type.isNumber(length) && length > -1 && length <= Number.MAX_SAFE_INTEGER;
		}
		static isDate(value) {
			return Type.isObjectLike(value) && getTag(value) === '[object Date]';
		}
		static isDomNode(value) {
			return Type.isObjectLike(value) && !Type.isPlainObject(value) && 'nodeType' in value;
		}
		static isElementNode(value) {
			return Type.isDomNode(value) && value.nodeType === Node.ELEMENT_NODE;
		}
		static isEventTargetLike(value) {
			return Type.isObjectLike(value) && Type.isFunction(value.addEventListener) && Type.isFunction(value.removeEventListener) && Type.isFunction(value.dispatchEvent);
		}
		static isTextNode(value) {
			return Type.isDomNode(value) && value.nodeType === Node.TEXT_NODE;
		}
		static isMap(value) {
			return Type.isObjectLike(value) && getTag(value) === '[object Map]';
		}
		static isSet(value) {
			return Type.isObjectLike(value) && getTag(value) === '[object Set]';
		}
		static isWeakMap(value) {
			return Type.isObjectLike(value) && getTag(value) === '[object WeakMap]';
		}
		static isWeakSet(value) {
			return Type.isObjectLike(value) && getTag(value) === '[object WeakSet]';
		}
		static isPrototype(value) {
			if (!Type.isObjectLike(value)) {
				return false;
			}
			const ctor = value.constructor;
			const proto = Type.isFunction(ctor) ? ctor.prototype : Object.prototype;
			return proto === value;
		}
		static isRegExp(value) {
			return Type.isObjectLike(value) && getTag(value) === '[object RegExp]';
		}
		static isNull(value) {
			return value === null;
		}
		static isUndefined(value) {
			return typeof value === 'undefined';
		}
		static isArrayBuffer(value) {
			return Type.isObjectLike(value) && getTag(value) === '[object ArrayBuffer]';
		}
		static isTypedArray(value) {
			const regExpTypedTag = /^\[object (?:Float(?:32|64)|(?:Int|Uint)(?:8|16|32)|Uint8Clamped)]$/;
			return Type.isObjectLike(value) && regExpTypedTag.test(getTag(value));
		}
		static isBlob(value) {
			return Type.isObjectLike(value) && Type.isNumber(value.size) && Type.isString(value.type) && Type.isFunction(value.slice);
		}
		static isFile(value) {
			if (!Type.isBlob(value) || !('name' in value) || !Type.isString(value.name)) {
				return false;
			}
			if ('lastModified' in value && Type.isNumber(value.lastModified)) {
				return true;
			}
			return 'lastModifiedDate' in value && Type.isObjectLike(value.lastModifiedDate);
		}
		static isFormData(value) {
			return value instanceof FormData;
		}
		static isJsonValue(value) {
			return Type.isPlainObject(value) || Type.isString(value) || Type.isNumber(value) || Type.isBoolean(value) || Type.isNull(value) || Type.isArray(value);
		}
	}

	class Reflection {
		static getClass(className) {
			if (Type.isString(className) && Boolean(className)) {
				let classFn = null;
				let currentNamespace = window;
				const namespaces = className.split('.');
				for (const namespace of namespaces) {
					if (!currentNamespace[namespace]) {
						return null;
					}
					currentNamespace = currentNamespace[namespace];
					classFn = currentNamespace;
				}
				return classFn;
			}
			if (Type.isFunction(className)) {
				return className;
			}
			return null;
		}
		static namespace(namespaceName) {
			let parts = namespaceName.split('.');
			let parent = window.BX;
			if (parts[0] === 'BX') {
				parts = parts.slice(1);
			}
			for (const part of parts) {
				if (Type.isUndefined(parent[part])) {
					parent[part] = {};
				}
				parent = parent[part];
			}
			return parent;
		}
	}

	const reEscape = /["&'<>]/g;
	const reUnescape = /&(?:amp|#38|lt|#60|gt|#62|apos|#39|quot|#34);/g;
	const escapeEntities = {
		'&': '&amp;',
		'<': '&lt;',
		'>': '&gt;',
		"'": '&#39;',
		'"': '&quot;'
	};
	const unescapeEntities = {
		'&amp;': '&',
		'&#38;': '&',
		'&lt;': '<',
		'&#60;': '<',
		'&gt;': '>',
		'&#62;': '>',
		'&apos;': "'",
		'&#39;': "'",
		'&quot;': '"',
		'&#34;': '"'
	};
	class Text {
		static encode(value) {
			if (Type.isString(value)) {
				return value.replaceAll(reEscape, item => escapeEntities[item]);
			}
			return value;
		}
		static decode(value) {
			if (Type.isString(value)) {
				return value.replaceAll(reUnescape, item => unescapeEntities[item]);
			}
			return value;
		}
		static getRandom(length = 8) {
			return Array.from({
				length
			}, () => Math.trunc(Math.random() * 36).toString(36)).join('');
		}
		static toNumber(value) {
			const parsedValue = Number.parseFloat(String(value));
			if (Type.isNumber(parsedValue)) {
				return parsedValue;
			}
			return 0;
		}
		static toInteger(value) {
			return Text.toNumber(Number.parseInt(String(value), 10));
		}
		static toBoolean(value, trueValues = []) {
			const transformedValue = Type.isString(value) ? value.toLowerCase() : value;
			const truthyValues = ['true', 'y', '1', 1, true, ...trueValues];
			return truthyValues.includes(transformedValue);
		}
		static toCamelCase(str) {
			if (!Type.isStringFilled(str)) {
				return str;
			}
			const regex = /[\s_-]+(.)?/g;
			if (!regex.test(str)) {
				return /^[A-Z]+$/.test(str) ? str.toLowerCase() : str[0].toLowerCase() + str.slice(1);
			}
			const result = str.toLowerCase().replaceAll(regex, (match, letter) => {
				return letter ? letter.toUpperCase() : '';
			});
			return result[0].toLowerCase() + result.slice(1);
		}
		static toPascalCase(str) {
			if (!Type.isStringFilled(str)) {
				return str;
			}
			return this.capitalize(this.toCamelCase(str));
		}
		static toKebabCase(str) {
			if (!Type.isStringFilled(str)) {
				return str;
			}
			const matches = str.match(/[A-Z]{2,}(?=[A-Z][a-z]+\d*|\b)|[A-Z]?[a-z]+\d*|[A-Z]|\d+/g);
			if (!matches) {
				return str;
			}
			return matches.map(x => x.toLowerCase()).join('-');
		}
		static capitalize(str) {
			if (!Type.isStringFilled(str)) {
				return str;
			}
			return str[0].toUpperCase() + str.slice(1);
		}
	}

	const aliases = {
		mousewheel: ['DOMMouseScroll'],
		bxchange: ['change', 'cut', 'paste', 'drop', 'keyup'],
		animationend: ['animationend', 'oAnimationEnd', 'webkitAnimationEnd', 'MSAnimationEnd'],
		transitionend: ['webkitTransitionEnd', 'otransitionend', 'oTransitionEnd', 'msTransitionEnd', 'transitionend'],
		fullscreenchange: ['fullscreenchange', 'webkitfullscreenchange', 'mozfullscreenchange', 'MSFullscreenChange'],
		fullscreenerror: ['fullscreenerror', 'webkitfullscreenerror', 'mozfullscreenerror', 'MSFullscreenError']
	};

	class Registry {
		registry = new WeakMap();
		set(target, event, listener) {
			if (!Type.isEventTargetLike(target)) {
				return;
			}
			const events = this.get(target);
			if (!Type.isSet(events[event])) {
				events[event] = new Set();
			}
			events[event].add(listener);
			this.registry.set(target, events);
		}
		get(target) {
			return this.registry.get(target) || {};
		}
		has(target, event, listener) {
			if (event && listener) {
				const events = this.registry.get(target);
				return this.registry.has(target) && Boolean(events && events[event]?.has(listener));
			}
			return this.registry.has(target);
		}
		delete(target, event, listener) {
			if (!Type.isEventTargetLike(target)) {
				return;
			}
			if (Type.isString(event) && Type.isFunction(listener)) {
				const events = this.registry.get(target);
				if (Type.isPlainObject(events) && Type.isSet(events[event])) {
					events[event].delete(listener);
				}
				return;
			}
			if (Type.isString(event)) {
				const events = this.registry.get(target);
				if (Type.isPlainObject(events) && Type.isSet(events[event])) {
					events[event] = new Set();
				}
				return;
			}
			this.registry.delete(target);
		}
	}
	var registry = new Registry();

	function isOptionSupported(name) {
		let isSupported = false;
		try {
			const options = Object.defineProperty({}, name, {
				get() {
					isSupported = true;
				}
			});
			window.addEventListener('test', null, options);
		} catch {
		}
		return isSupported;
	}
	function fetchSupportedListenerOptions(options) {
		if (!Type.isPlainObject(options)) {
			return options;
		}
		return Object.keys(options).reduce((acc, name) => {
			if (isOptionSupported(name)) {
				acc[name] = options[name];
			}
			return acc;
		}, {});
	}

	function bind$1(target, eventName, handler, options) {
		if (!Type.isEventTargetLike(target) || handler === null) {
			return;
		}
		const listenerOptions = fetchSupportedListenerOptions(options);
		if (eventName in aliases) {
			aliases[eventName].forEach(key => {
				target.addEventListener(key, handler, listenerOptions);
				registry.set(target, eventName, handler);
			});
			return;
		}
		target.addEventListener(eventName, handler, listenerOptions);
		registry.set(target, eventName, handler);
	}

	function unbind$1(target, eventName, handler, options) {
		if (!Type.isEventTargetLike(target) || handler === null) {
			return;
		}
		const listenerOptions = fetchSupportedListenerOptions(options);
		if (eventName in aliases) {
			aliases[eventName].forEach(key => {
				target.removeEventListener(key, handler, listenerOptions);
				registry.delete(target, key, handler);
			});
			return;
		}
		target.removeEventListener(eventName, handler, listenerOptions);
		registry.delete(target, eventName, handler);
	}

	function unbindAll$1(target, eventName) {
		const events = registry.get(target);
		Object.keys(events).forEach(currentEvent => {
			events[currentEvent].forEach(handler => {
				if (!Type.isString(eventName) || eventName === currentEvent) {
					unbind$1(target, currentEvent, handler);
				}
			});
		});
	}

	function bindOnce$1(target, eventName, handler, options) {
		if (handler === null) {
			return;
		}
		const once = function once(event) {
			unbind$1(target, eventName, once, options);
			if (Type.isFunction(handler)) {
				handler(event);
			} else if (Type.isObject(handler) && Type.isFunction(handler.handleEvent)) {
				handler.handleEvent(event);
			}
		};
		bind$1(target, eventName, once, options);
	}

	let debugState = true;
	function enableDebug() {
		debugState = true;
	}
	function disableDebug() {
		debugState = false;
	}
	function isDebugEnabled() {
		return debugState;
	}
	function debug$1(...args) {
		if (!isDebugEnabled() || !Type.isObject(window.console)) {
			return;
		}
		let limit = 5;
		if (typeof args[args.length - 1] === 'number') {
			limit = args.pop();
		}
		if (Type.isFunction(window.console.log)) {
			window.console.log('BX.debug:', ...args);
			if (args[0] instanceof Error && args[0].stack) {
				const errorStack = args[0].stack.split('\n').slice(0, limit).join('\n');
				window.console.log(`BX.debug error stack trace:\n${errorStack}`);
			}
		}
		const stack = new Error('debug').stack;
		if (stack && Type.isFunction(window.console.log)) {
			const formattedStack = stack.split('\n').slice(1, limit + 1).join('\n');
			window.console.log(`BX.debug trace:\n${formattedStack}`);
		}
	}

	var debugNs = Object.freeze({
		__proto__: null,
		get debugState () { return debugState; },
		default: debug$1,
		disableDebug: disableDebug,
		enableDebug: enableDebug,
		isDebugEnabled: isDebugEnabled
	});

	const extensionsStorage = new Map();

	const ajaxController = 'main.bitrix.main.controller.loadext.getextensions';
	function loadAssets(options) {
		return new Promise((resolve, reject) => {
			const getParameters = {
				e: (options?.extension || []).join(',')
			};
			BX.ajax.runAction(ajaxController, {
				data: options,
				getParameters
			}).then(result => {
				resolve(result?.data);
			}).catch(err => {
				reject(err);
			});
		});
	}

	function fetchInlineScripts(acc, item) {
		if (item.isInternal) {
			acc.push(item.JS);
		}
		return acc;
	}
	function fetchExternalScripts(acc, item) {
		if (!item.isInternal) {
			acc.push(item.JS);
		}
		return acc;
	}
	function fetchExternalStyles(acc, item) {
		if (Type.isString(item) && item !== '') {
			acc.push(item);
		}
		return acc;
	}
	function fetchExtensionSettings(html) {
		if (Type.isStringFilled(html)) {
			const scripts = html.match(/<script type="extension\/settings" \b[^>]*>([\S\s]*?)<\/script>/g);
			if (Type.isArrayFilled(scripts)) {
				return scripts.map(script => {
					const [, extension] = script.match(/data-extension="(.[\d._a-z-]+)"/);
					return {
						extension,
						script
					};
				});
			}
		}
		return [];
	}
	function loadAll(items) {
		const itemsList = Type.isArray(items) ? items : [items];
		if (itemsList.length === 0) {
			return Promise.resolve();
		}
		return new Promise((resolve, reject) => {
			BX.load(itemsList, resolve, document, reject);
		});
	}

	function parseExtensionHtml(html) {
		const result = window.BX.processHTML(html);
		const inlinePreScripts = [];
		const inlineAfterScripts = [];
		result.SCRIPT.reduce((accumulator, element) => {
			return fetchInlineScripts(accumulator, element);
		}, []).forEach(script => {
			if (script.startsWith('BX.Runtime.registerExtension')) {
				inlineAfterScripts.push(script);
			} else {
				inlinePreScripts.push(script);
			}
		});
		return {
			inlinePreScripts,
			inlineAfterScripts,
			externalScripts: result.SCRIPT.reduce((accumulator, element) => {
				return fetchExternalScripts(accumulator, element);
			}, []),
			externalStyles: result.STYLE.reduce((accumulator, element) => {
				return fetchExternalStyles(accumulator, element);
			}, []),
			settingsScripts: fetchExtensionSettings(result.HTML)
		};
	}

	function waitOnline() {
		return new Promise(resolve => {
			Event.bindOnce(window, 'online', () => resolve());
		});
	}

	const TIMEOUTS = [1000, 3000, 5000];
	async function tryLoad(extensions, callback) {
		for (let i = 0; i <= TIMEOUTS.length; i++) {
			try {
				return await callback();
			} catch {
				if (navigator.onLine === false) {
					console.warn(`Wait online for load ${extensions.join(', ')}`);
					await waitOnline();
					i--;
					continue;
				}
				if (i === TIMEOUTS.length) {
					throw new Error(`${extensions.join(', ')} loading failed...`);
				}
				const delay = TIMEOUTS[i];
				const displayRetryCount = i + 1;
				console.warn(`Retry load #${displayRetryCount}: ${extensions.join(', ')}`);
				await new Promise(resolve => {
					setTimeout(resolve, delay);
				});
			}
		}
		throw new Error('Unexpected end of retry loop');
	}

	async function processExtensions(map) {
		const loadableExtensions = [...map.keys()];
		const rawAssets = (await tryLoad(loadableExtensions, () => loadAssets({
			extension: loadableExtensions
		}))) ?? [];
		rawAssets.forEach(rawAsset => {
			const preparedHtml = rawAsset.html ?? '';
			const extensionAssets = parseExtensionHtml(preparedHtml);
			extensionAssets.settingsScripts.forEach(({
				script
			}) => {
				document.body.insertAdjacentHTML('beforeend', script);
			});
			extensionAssets.inlinePreScripts.forEach(script => {
				window.BX.evalGlobal(script);
			});
			const loadableExtensionEntry = map.get(rawAsset.extension);
			void Promise.all([tryLoad(loadableExtensions, () => loadAll(extensionAssets.externalScripts)), tryLoad(loadableExtensions, () => loadAll(extensionAssets.externalStyles))]).then(() => {
				extensionAssets.inlineAfterScripts.forEach(script => {
					window.BX.evalGlobal(script);
				});
				const namespace = rawAsset?.config?.namespace ?? 'window';
				loadableExtensionEntry.resolve(namespace);
			}).catch(error => {
				loadableExtensionEntry.reject(error);
			});
		});
	}

	const queue = new Map();
	let timerId = null;
	async function loadExtension(...name) {
		if (Type.isNumber(timerId)) {
			clearTimeout(timerId);
		}
		const requestedNames = name.flat();
		const extensionsToLoad = requestedNames.filter(extensionName => {
			return !extensionsStorage.has(extensionName);
		});
		extensionsToLoad.forEach(extensionName => {
			let resolve = null;
			let reject = null;
			const loadableExtensionEntry = {
				promise: new Promise((sourceResolve, sourceReject) => {
					resolve = sourceResolve;
					reject = sourceReject;
				}),
				resolve,
				reject
			};
			extensionsStorage.set(extensionName, loadableExtensionEntry.promise);
			queue.set(extensionName, loadableExtensionEntry);
		});
		timerId = setTimeout(() => {
			if (queue.size > 0) {
				void processExtensions(new Map(queue.entries()));
				queue.clear();
			}
		});
		const namespaces = await Promise.all(requestedNames.map(extensionName => {
			return extensionsStorage.get(extensionName);
		}));
		return namespaces.reduce((acc, namespace) => {
			return {
				...acc,
				...Reflection.getClass(namespace)
			};
		}, {});
	}

	const cloneableTags = new Set(['[object Object]', '[object Array]', '[object RegExp]', '[object Arguments]', '[object Date]', '[object Error]', '[object Map]', '[object Set]', '[object ArrayBuffer]', '[object DataView]', '[object Float32Array]', '[object Float64Array]', '[object Int8Array]', '[object Int16Array]', '[object Int32Array]', '[object Uint8Array]', '[object Uint16Array]', '[object Uint32Array]', '[object Uint8ClampedArray]']);
	function isCloneable(value) {
		const isCloneableValue = Type.isObjectLike(value) && cloneableTags.has(getTag(value));
		return isCloneableValue || Type.isDomNode(value);
	}
	function internalClone(value, map) {
		if (map.has(value)) {
			return map.get(value);
		}
		if (isCloneable(value)) {
			if (Type.isArray(value)) {
				const cloned = [...value];
				map.set(value, cloned);
				value.forEach((item, index) => {
					cloned[index] = internalClone(item, map);
				});
				return map.get(value);
			}
			if (Type.isDomNode(value)) {
				return value.cloneNode(true);
			}
			if (Type.isMap(value)) {
				const result = new Map();
				map.set(value, result);
				value.forEach((item, key) => {
					result.set(internalClone(key, map), internalClone(item, map));
				});
				return result;
			}
			if (Type.isSet(value)) {
				const result = new Set();
				map.set(value, result);
				value.forEach(item => {
					result.add(internalClone(item, map));
				});
				return result;
			}
			if (Type.isDate(value)) {
				return new Date(value);
			}
			if (Type.isRegExp(value)) {
				const regExpFlags = /\w*$/;
				const flags = regExpFlags.exec(value);
				let result = new RegExp(value.source);
				if (flags && Type.isArray(flags)) {
					result = new RegExp(value.source, flags[0]);
				}
				result.lastIndex = value.lastIndex;
				return result;
			}
			const proto = Object.getPrototypeOf(value);
			const result = Object.assign(Object.create(proto), value);
			map.set(value, result);
			Object.keys(value).forEach(key => {
				result[key] = internalClone(value[key], map);
			});
			return result;
		}
		return value;
	}
	function clone$1(value) {
		return internalClone(value, new WeakMap());
	}

	function merge(current, target) {
		return Object.entries(target).reduce((acc, [key, value]) => {
			if (!Type.isDomNode(acc[key]) && Type.isObjectLike(acc[key]) && Type.isObjectLike(value)) {
				acc[key] = merge(acc[key], value);
				return acc;
			}
			acc[key] = value;
			return acc;
		}, current);
	}

	function createComparator(fields, orders = []) {
		return (a, b) => {
			const field = fields[0];
			const order = orders[0] || 'asc';
			if (Type.isUndefined(field)) {
				return 0;
			}
			let valueA = a[field];
			let valueB = b[field];
			if (Type.isString(valueA) && Type.isString(valueB)) {
				valueA = valueA.toLowerCase();
				valueB = valueB.toLowerCase();
			}
			if (valueA < valueB) {
				return order === 'asc' ? -1 : 1;
			}
			if (valueA > valueB) {
				return order === 'asc' ? 1 : -1;
			}
			return createComparator(fields.slice(1), orders.slice(1))(a, b);
		};
	}

	function registerExtension(options) {
		if (!extensionsStorage.has(options.name)) {
			const namespace = options?.namespace ?? 'window';
			extensionsStorage.set(options.name, Promise.resolve(namespace));
		}
	}

	class Runtime {
		static debug = debug$1;
		static loadExtension = loadExtension;
		static registerExtension = registerExtension;
		static clone = clone$1;
		static debounce(func, wait = 0, context = null) {
			let timeoutId = null;
			return function debounced(...args) {
				if (Type.isNumber(timeoutId)) {
					clearTimeout(timeoutId);
				}
				timeoutId = setTimeout(() => {
					func.apply(context || this, args);
				}, wait);
			};
		}
		static throttle(func, wait = 0, context = null) {
			let timer = null;
			let invoke = false;
			return function wrapper(...args) {
				invoke = true;
				if (!timer) {
					const q = function q() {
						if (invoke) {
							func.apply(context || this, args);
							invoke = false;
							timer = setTimeout(q, wait);
						} else {
							timer = null;
						}
					};
					q();
				}
			};
		}
		static html(node, html, params = {}) {
			if (Type.isNil(html) && Type.isDomNode(node)) {
				return node.innerHTML;
			}
			const parsedHtml = BX.processHTML(html);
			const externalCss = parsedHtml.STYLE.reduce((acc, item) => fetchExternalStyles(acc, item), []);
			const externalJs = parsedHtml.SCRIPT.reduce((acc, item) => fetchExternalScripts(acc, item), []);
			const inlineJs = parsedHtml.SCRIPT.reduce((acc, item) => fetchInlineScripts(acc, item), []);
			if (Type.isDomNode(node) && (params.htmlFirst || externalJs.length === 0 && externalCss.length === 0)) {
				if (params.useAdjacentHTML) {
					node.insertAdjacentHTML('beforeend', parsedHtml.HTML);
				} else {
					node.innerHTML = parsedHtml.HTML;
				}
			}
			return Promise.all([loadAll(externalJs), loadAll(externalCss)]).then(() => {
				if (Type.isDomNode(node) && (externalJs.length > 0 || externalCss.length > 0)) {
					if (params.useAdjacentHTML) {
						node.insertAdjacentHTML('beforeend', parsedHtml.HTML);
					} else {
						node.innerHTML = parsedHtml.HTML;
					}
				}
				inlineJs.forEach(script => BX.evalGlobal(script));
				if (Type.isFunction(params.callback)) {
					params.callback();
				}
			});
		}
		static merge(...targets) {
			if (Type.isArray(targets[0])) {
				targets.unshift([]);
			} else if (Type.isObject(targets[0])) {
				targets.unshift({});
			}
			return targets.reduce((acc, item) => {
				return merge(acc, item);
			}, targets[0]);
		}
		static orderBy(collection, fields = [], orders = []) {
			const comparator = createComparator(fields, orders);
			return Object.values(collection).sort(comparator);
		}
		static destroy(target, errorMessage = 'Object is destroyed') {
			if (Type.isObject(target)) {
				const onPropertyAccess = () => {
					throw new Error(errorMessage);
				};
				const ownProperties = Object.keys(target);
				const prototypeProperties = (() => {
					const targetPrototype = Object.getPrototypeOf(target);
					if (Type.isObject(targetPrototype)) {
						return Object.getOwnPropertyNames(targetPrototype);
					}
					return [];
				})();
				const uniquePropertiesList = [...new Set([...ownProperties, ...prototypeProperties])];
				uniquePropertiesList.filter(name => {
					const descriptor = Object.getOwnPropertyDescriptor(target, name);
					return !/__(.+)__/.test(name) && (!Type.isObject(descriptor) || descriptor.configurable === true);
				}).forEach(name => {
					Object.defineProperty(target, name, {
						get: onPropertyAccess,
						set: onPropertyAccess,
						configurable: false
					});
				});
				Object.setPrototypeOf(target, null);
			}
		}
	}

	const isError = Symbol.for('BX.BaseError.isError');
	class BaseError {
		[isError];
		message;
		code;
		customData;
		constructor(message, code, customData) {
			this[isError] = true;
			this.message = '';
			this.code = null;
			this.customData = null;
			this.setMessage(message);
			this.setCode(code);
			this.setCustomData(customData);
		}
		getMessage() {
			return this.message;
		}
		setMessage(message) {
			if (Type.isString(message)) {
				this.message = message;
			}
			return this;
		}
		getCode() {
			return this.code;
		}
		setCode(code) {
			if (Type.isStringFilled(code) || code === null) {
				this.code = code;
			}
			return this;
		}
		getCustomData() {
			return this.customData;
		}
		setCustomData(customData) {
			if (!Type.isUndefined(customData)) {
				this.customData = customData;
			}
			return this;
		}
		toString() {
			const code = this.getCode();
			const message = this.getMessage();
			if (!Type.isStringFilled(code) && !Type.isStringFilled(message)) {
				return '';
			}
			if (!Type.isStringFilled(code)) {
				return `Error: ${message}`;
			}
			if (!Type.isStringFilled(message)) {
				return code;
			}
			return `${code}: ${message}`;
		}
		static isError(error) {
			return Type.isObject(error) && error[isError] === true;
		}
	}

	let BaseEvent = function () {
		function BaseEvent(options = {
			data: {}
		}) {
			babelHelpers.classCallCheck(this, BaseEvent);
			babelHelpers.defineProperty(this, "type", '');
			babelHelpers.defineProperty(this, "data", null);
			babelHelpers.defineProperty(this, "target", null);
			babelHelpers.defineProperty(this, "compatData", null);
			babelHelpers.defineProperty(this, "defaultPrevented", false);
			babelHelpers.defineProperty(this, "immediatePropagationStopped", false);
			babelHelpers.defineProperty(this, "errors", []);
			this.setData(options.data);
			this.setCompatData(options.compatData);
		}
		return babelHelpers.createClass(BaseEvent, [{
			key: "getType",
			value:
			function getType() {
				return this.type;
			}
		}, {
			key: "setType",
			value: function setType(type) {
				if (Type.isStringFilled(type)) {
					this.type = type;
				}
				return this;
			}
		}, {
			key: "getData",
			value: function getData() {
				return this.data;
			}
		}, {
			key: "setData",
			value: function setData(data) {
				if (!Type.isUndefined(data)) {
					this.data = data;
				}
				return this;
			}
		}, {
			key: "getCompatData",
			value: function getCompatData() {
				return this.compatData;
			}
		}, {
			key: "setCompatData",
			value: function setCompatData(data) {
				if (Type.isArrayLike(data)) {
					this.compatData = data;
				}
				return this;
			}
		}, {
			key: "setTarget",
			value: function setTarget(target) {
				this.target = target;
				return this;
			}
		}, {
			key: "getTarget",
			value: function getTarget() {
				return this.target;
			}
		}, {
			key: "getErrors",
			value: function getErrors() {
				return this.errors;
			}
		}, {
			key: "setError",
			value: function setError(error) {
				if (BaseError.isError(error)) {
					this.errors.push(error);
				}
			}
		}, {
			key: "preventDefault",
			value: function preventDefault() {
				this.defaultPrevented = true;
			}
		}, {
			key: "isDefaultPrevented",
			value: function isDefaultPrevented() {
				return this.defaultPrevented;
			}
		}, {
			key: "stopImmediatePropagation",
			value: function stopImmediatePropagation() {
				this.immediatePropagationStopped = true;
			}
		}, {
			key: "isImmediatePropagationStopped",
			value: function isImmediatePropagationStopped() {
				return this.immediatePropagationStopped;
			}
		}], [{
			key: "create",
			value: function create(options) {
				return new this(options);
			}
		}]);
	}();

	class EventStore {
		defaultMaxListeners;
		eventStore = new WeakMap();
		constructor(options = {}) {
			this.defaultMaxListeners = Type.isNumber(options.defaultMaxListeners) ? options.defaultMaxListeners : 10;
		}
		add(target, options = {}) {
			const record = this.getRecordScheme();
			if (Type.isNumber(options.maxListeners)) {
				record.maxListeners = options.maxListeners;
			}
			this.eventStore.set(target, record);
			return record;
		}
		get(target) {
			return this.eventStore.get(target);
		}
		getOrAdd(target, options = {}) {
			return this.get(target) || this.add(target, options);
		}
		delete(context) {
			this.eventStore.delete(context);
		}
		getRecordScheme() {
			return {
				eventsMap: new Map(),
				onceMap: new Map(),
				maxListeners: this.getDefaultMaxListeners(),
				eventsMaxListeners: new Map()
			};
		}
		getDefaultMaxListeners() {
			return this.defaultMaxListeners;
		}
	}

	class WarningStore {
		warnings = new Map();
		printDelayed;
		constructor() {
			this.printDelayed = Runtime.debounce(this.print.bind(this), 500);
		}
		add(target, eventName, listeners) {
			let contextWarnings = this.warnings.get(target);
			if (!contextWarnings) {
				contextWarnings = Object.create(null);
				this.warnings.set(target, contextWarnings);
			}
			if (!contextWarnings[eventName]) {
				contextWarnings[eventName] = {};
			}
			contextWarnings[eventName].size = listeners.size;
			if (!Type.isArray(contextWarnings[eventName].errors)) {
				contextWarnings[eventName].errors = [];
			}
			contextWarnings[eventName].errors.push(new Error('EventEmitter warning'));
		}
		print() {
			this.warnings.forEach(warnings => {
				for (const eventName of Object.keys(warnings)) {
					console.groupCollapsed('Possible BX.Event.EventEmitter memory leak detected. ' + `${warnings[eventName].size} "${eventName}" listeners added. ` + 'Use emitter.setMaxListeners() to increase limit.');
					console.dir(warnings[eventName].errors);
					console.groupEnd();
				}
			});
			this.clear();
		}
		clear() {
			this.warnings.clear();
		}
	}

	const eventStore = new EventStore({
		defaultMaxListeners: 10
	});
	const warningStore = new WarningStore();
	const aliasStore = new Map();
	const globalTarget = {
		GLOBAL_TARGET: 'GLOBAL_TARGET'
	};
	eventStore.add(globalTarget, {
		maxListeners: 25
	});
	const isEmitterProperty = Symbol.for('BX.Event.EventEmitter.isEmitter');
	const namespaceProperty = Symbol('namespaceProperty');
	const targetProperty = Symbol('targetProperty');
	let EventEmitter = function () {
		function EventEmitter(...args) {
			babelHelpers.classCallCheck(this, EventEmitter);
			this[targetProperty] = null;
			this[namespaceProperty] = null;
			this[isEmitterProperty] = true;
			let target = this;
			if (Object.getPrototypeOf(this) === EventEmitter.prototype && args.length > 0) {
				if (!Type.isObject(args[0])) {
					throw new TypeError('The "target" argument must be an object.');
				}
				target = args[0];
				this.setEventNamespace(args[1]);
			}
			this[targetProperty] = target;
		}
		return babelHelpers.createClass(EventEmitter, [{
			key: "setEventNamespace",
			value: function setEventNamespace(namespace) {
				if (Type.isStringFilled(namespace)) {
					this[namespaceProperty] = namespace;
				}
			}
		}, {
			key: "getEventNamespace",
			value: function getEventNamespace() {
				return this[namespaceProperty];
			}
		}, {
			key: "subscribe",
			value:
			function subscribe(eventName, listener) {
				EventEmitter.subscribe(this, eventName, listener);
				return this;
			}
		}, {
			key: "subscribeFromOptions",
			value: function subscribeFromOptions(options, aliases, compatMode) {
				if (Type.isArrayFilled(options)) {
					options.forEach(events => {
						this.subscribeFromOptions(events);
					});
					return;
				}
				if (!Type.isPlainObject(options)) {
					return;
				}
				const normalizedAliases = Type.isPlainObject(aliases) ? EventEmitter.normalizeAliases(aliases) : {};
				const optionsRecord = options;
				Object.keys(optionsRecord).forEach(eventName => {
					const listener = EventEmitter.normalizeListener(optionsRecord[eventName]);
					eventName = EventEmitter.normalizeEventName(eventName);
					if (normalizedAliases[eventName]) {
						const {
							eventName: actualName
						} = normalizedAliases[eventName];
						EventEmitter.subscribe(this, actualName, listener, {
							compatMode: compatMode !== false
						});
					} else {
						EventEmitter.subscribe(this, eventName, listener, {
							compatMode: compatMode === true
						});
					}
				});
			}
		}, {
			key: "subscribeOnce",
			value:
			function subscribeOnce(eventName, listener) {
				EventEmitter.subscribeOnce(this, eventName, listener);
				return this;
			}
		}, {
			key: "unsubscribe",
			value:
			function unsubscribe(eventName, listener) {
				EventEmitter.unsubscribe(this, eventName, listener);
				return this;
			}
		}, {
			key: "unsubscribeAll",
			value:
			function unsubscribeAll(eventName) {
				EventEmitter.unsubscribeAll(this, eventName);
			}
		}, {
			key: "emit",
			value:
			function emit(eventName, event) {
				if (this.getEventNamespace() === null) {
					console.warn('The instance of BX.Event.EventEmitter is supposed to have an event namespace. ' + 'Use emitter.setEventNamespace() to make events more unique.');
				}
				EventEmitter.emit(this, eventName, event);
				return this;
			}
		}, {
			key: "emitAsync",
			value:
			function emitAsync(eventName, event) {
				if (this.getEventNamespace() === null) {
					console.warn('The instance of BX.Event.EventEmitter is supposed to have an event namespace. ' + 'Use emitter.setEventNamespace() to make events more unique.');
				}
				return EventEmitter.emitAsync(this, eventName, event);
			}
		}, {
			key: "setMaxListeners",
			value:
			function setMaxListeners(...args) {
				EventEmitter.setMaxListeners(this, ...args);
				return this;
			}
		}, {
			key: "getMaxListeners",
			value:
			function getMaxListeners(eventName) {
				return EventEmitter.getMaxListeners(this, eventName);
			}
		}, {
			key: "incrementMaxListeners",
			value:
			function incrementMaxListeners(...args) {
				return EventEmitter.incrementMaxListeners(this, ...args);
			}
		}, {
			key: "decrementMaxListeners",
			value:
			function decrementMaxListeners(...args) {
				return EventEmitter.decrementMaxListeners(this, ...args);
			}
		}, {
			key: "getListeners",
			value:
			function getListeners(eventName) {
				return EventEmitter.getListeners(this, eventName);
			}
		}, {
			key: "getFullEventName",
			value: function getFullEventName(eventName) {
				if (!Type.isStringFilled(eventName)) {
					throw new TypeError('The "eventName" argument must be a string.');
				}
				return EventEmitter.makeFullEventName(this.getEventNamespace(), eventName);
			}
		}], [{
			key: "makeObservable",
			value: function makeObservable(target, namespace) {
				if (!Type.isObject(target)) {
					throw new TypeError('The "target" argument must be an object.');
				}
				if (!Type.isStringFilled(namespace)) {
					throw new TypeError('The "namespace" must be an non-empty string.');
				}
				if (EventEmitter.isEventEmitter(target)) {
					throw new TypeError('The "target" is an event emitter already.');
				}
				const targetProto = Object.getPrototypeOf(target);
				const emitter = new EventEmitter();
				emitter.setEventNamespace(namespace);
				Object.setPrototypeOf(emitter, targetProto);
				Object.setPrototypeOf(target, emitter);
				Object.getOwnPropertyNames(EventEmitter.prototype).forEach(method => {
					if (['constructor'].includes(method)) {
						return;
					}
					emitter[method] = function (...args) {
						return EventEmitter.prototype[method].apply(target, args);
					};
				});
			}
		}, {
			key: "subscribe",
			value: function subscribe(target, eventName, listener, options) {
				if (Type.isString(target)) {
					options = listener;
					listener = eventName;
					eventName = target;
					target = this.GLOBAL_TARGET;
				}
				if (!Type.isObject(target)) {
					throw new TypeError('The "target" argument must be an object.');
				}
				eventName = this.normalizeEventName(eventName);
				if (!Type.isStringFilled(eventName)) {
					throw new TypeError('The "eventName" argument must be a string.');
				}
				listener = this.normalizeListener(listener);
				options = Type.isPlainObject(options) ? options : {};
				const fullEventName = this.resolveEventName(eventName, target, options.useGlobalNaming === true);
				const {
					eventsMap,
					onceMap
				} = eventStore.getOrAdd(target);
				const onceListeners = onceMap.get(fullEventName);
				let listeners = eventsMap.get(fullEventName);
				if (listeners && listeners.has(listener) || onceListeners && onceListeners.has(listener)) {
					console.error(`You cannot subscribe the same "${fullEventName}" event listener twice.`);
				} else if (listeners) {
					listeners.set(listener, {
						listener,
						options,
						sort: this.getNextSequenceValue()
					});
				} else {
					listeners = new Map([[listener, {
						listener,
						options,
						sort: this.getNextSequenceValue()
					}]]);
					eventsMap.set(fullEventName, listeners);
				}
				const maxListeners = this.getMaxListeners(target, eventName);
				if (listeners.size > maxListeners) {
					warningStore.add(target, fullEventName, listeners);
					warningStore.printDelayed();
				}
			}
		}, {
			key: "subscribeOnce",
			value: function subscribeOnce(target, eventName, listener) {
				if (Type.isString(target)) {
					listener = eventName;
					eventName = target;
					target = this.GLOBAL_TARGET;
				}
				if (!Type.isObject(target)) {
					throw new TypeError('The "target" argument must be an object.');
				}
				eventName = this.normalizeEventName(eventName);
				if (!Type.isStringFilled(eventName)) {
					throw new TypeError('The "eventName" argument must be a string.');
				}
				listener = this.normalizeListener(listener);
				const fullEventName = this.resolveEventName(eventName, target);
				const {
					eventsMap,
					onceMap
				} = eventStore.getOrAdd(target);
				const listeners = eventsMap.get(fullEventName);
				let onceListeners = onceMap.get(fullEventName);
				if (listeners && listeners.has(listener) || onceListeners && onceListeners.has(listener)) {
					console.error(`You cannot subscribe the same "${fullEventName}" event listener twice.`);
				} else {
					const once = (...args) => {
						this.unsubscribe(target, eventName, once);
						onceListeners.delete(listener);
						listener(...args);
					};
					if (onceListeners) {
						onceListeners.set(listener, once);
					} else {
						onceListeners = new Map([[listener, once]]);
						onceMap.set(fullEventName, onceListeners);
					}
					this.subscribe(target, eventName, once);
				}
			}
		}, {
			key: "unsubscribe",
			value: function unsubscribe(target, eventName, listener, options) {
				if (Type.isString(target)) {
					listener = eventName;
					eventName = target;
					target = this.GLOBAL_TARGET;
				}
				eventName = this.normalizeEventName(eventName);
				if (!Type.isStringFilled(eventName)) {
					throw new TypeError('The "eventName" argument must be a string.');
				}
				listener = this.normalizeListener(listener);
				options = Type.isPlainObject(options) ? options : {};
				const fullEventName = this.resolveEventName(eventName, target, options.useGlobalNaming === true);
				const targetInfo = eventStore.get(target);
				const listeners = targetInfo && targetInfo.eventsMap.get(fullEventName);
				const onceListeners = targetInfo && targetInfo.onceMap.get(fullEventName);
				if (listeners) {
					listeners.delete(listener);
				}
				if (onceListeners) {
					const once = onceListeners.get(listener);
					if (once) {
						onceListeners.delete(listener);
						listeners.delete(once);
					}
				}
			}
		}, {
			key: "unsubscribeAll",
			value: function unsubscribeAll(target, eventName, options) {
				if (Type.isString(target)) {
					eventName = target;
					target = this.GLOBAL_TARGET;
				}
				if (Type.isStringFilled(eventName)) {
					const targetInfo = eventStore.get(target);
					if (targetInfo) {
						options = Type.isPlainObject(options) ? options : {};
						const fullEventName = this.resolveEventName(eventName, target, options.useGlobalNaming === true);
						targetInfo.eventsMap.delete(fullEventName);
						targetInfo.onceMap.delete(fullEventName);
					}
				} else if (Type.isNil(eventName)) {
					if (target === this.GLOBAL_TARGET) {
						console.error('You cannot unsubscribe all global listeners.');
					} else {
						eventStore.delete(target);
					}
				}
			}
		}, {
			key: "emit",
			value: function emit(target, eventName, event, options) {
				if (Type.isString(target)) {
					options = event;
					event = eventName;
					eventName = target;
					target = this.GLOBAL_TARGET;
				}
				if (!Type.isObject(target)) {
					throw new TypeError('The "target" argument must be an object.');
				}
				eventName = this.normalizeEventName(eventName);
				if (!Type.isStringFilled(eventName)) {
					throw new TypeError('The "eventName" argument must be a string.');
				}
				options = Type.isPlainObject(options) ? options : {};
				const fullEventName = this.resolveEventName(eventName, target, options.useGlobalNaming === true);
				const globalEvents = eventStore.get(this.GLOBAL_TARGET);
				const globalListeners = globalEvents && globalEvents.eventsMap.get(fullEventName) || new Map();
				let targetListeners = new Set();
				if (target !== this.GLOBAL_TARGET) {
					const targetEvents = eventStore.get(target);
					targetListeners = targetEvents && targetEvents.eventsMap.get(fullEventName) || new Map();
				}
				const listeners = [...globalListeners.values(), ...targetListeners.values()];
				listeners.sort((a, b) => {
					return a.sort - b.sort;
				});
				const preparedEvent = this.prepareEvent(target, fullEventName, event);
				const result = [];
				for (const {
					listener,
					options: listenerOptions
				} of listeners) {
					if (preparedEvent.isImmediatePropagationStopped()) {
						break;
					}
					if (globalListeners.has(listener) || targetListeners.has(listener)) {
						let listenerResult = null;
						if (listenerOptions.compatMode) {
							const compatData = preparedEvent.getCompatData();
							const params = compatData === null ? [preparedEvent] : options.cloneData === true ? Runtime.clone(compatData) : compatData;
							const context = Type.isUndefined(options.thisArg) ? target : options.thisArg;
							listenerResult = listener.apply(context, params);
						} else {
							listenerResult = Type.isUndefined(options.thisArg) ? listener(preparedEvent) : listener.call(options.thisArg, preparedEvent);
						}
						result.push(listenerResult);
					}
				}
				return result;
			}
		}, {
			key: "emitAsync",
			value: function emitAsync(target, eventName, event) {
				if (Type.isString(target)) {
					event = eventName;
					eventName = target;
					target = this.GLOBAL_TARGET;
				}
				return Promise.all(this.emit(target, eventName, event));
			}
		}, {
			key: "prepareEvent",
			value: function prepareEvent(target, eventName, event) {
				const preparedEvent = event instanceof BaseEvent ? event : new BaseEvent();
				if (!(event instanceof BaseEvent)) {
					preparedEvent.setData(event);
				}
				preparedEvent.setTarget(this.isEventEmitter(target) ? target[targetProperty] : target);
				preparedEvent.setType(eventName);
				return preparedEvent;
			}
		}, {
			key: "getNextSequenceValue",
			value: function getNextSequenceValue() {
				return this.sequenceValue++;
			}
		}, {
			key: "setMaxListeners",
			value: function setMaxListeners(...args) {
				let target = this.GLOBAL_TARGET;
				let eventName = null;
				let count = null;
				if (args.length === 1) {
					count = args[0];
				} else if (args.length === 2) {
					if (Type.isString(args[0])) {
						[eventName, count] = args;
					} else {
						[target, count] = args;
					}
				} else if (args.length >= 3) {
					[target, eventName, count] = args;
				}
				if (!Type.isObject(target)) {
					throw new TypeError('The "target" argument must be an object.');
				}
				if (eventName !== null && !Type.isStringFilled(eventName)) {
					throw new TypeError('The "eventName" argument must be a string.');
				}
				if (!Type.isNumber(count) || count < 0) {
					throw new TypeError(`The value of "count" is out of range. It must be a non-negative number. Received ${count}.`);
				}
				const targetInfo = eventStore.getOrAdd(target);
				if (Type.isStringFilled(eventName)) {
					const fullEventName = this.resolveEventName(eventName, target);
					targetInfo.eventsMaxListeners.set(fullEventName, count);
				} else {
					targetInfo.maxListeners = count;
				}
			}
		}, {
			key: "getMaxListeners",
			value: function getMaxListeners(target, eventName) {
				if (Type.isString(target)) {
					eventName = target;
					target = this.GLOBAL_TARGET;
				} else if (Type.isNil(target)) {
					target = this.GLOBAL_TARGET;
				}
				if (!Type.isObject(target)) {
					throw new TypeError('The "target" argument must be an object.');
				}
				const targetInfo = eventStore.get(target);
				if (targetInfo) {
					let maxListeners = targetInfo.maxListeners;
					if (Type.isStringFilled(eventName)) {
						const fullEventName = this.resolveEventName(eventName, target);
						maxListeners = targetInfo.eventsMaxListeners.get(fullEventName) || maxListeners;
					}
					return maxListeners;
				}
				return this.DEFAULT_MAX_LISTENERS;
			}
		}, {
			key: "addMaxListeners",
			value: function addMaxListeners(...args) {
				const [target, eventName, increment] = this.destructMaxListenersArgs(...args);
				const maxListeners = Math.max(this.getMaxListeners(target, eventName) + increment, 0);
				if (Type.isStringFilled(eventName)) {
					EventEmitter.setMaxListeners(target, eventName, maxListeners);
				} else {
					EventEmitter.setMaxListeners(target, maxListeners);
				}
				return maxListeners;
			}
		}, {
			key: "incrementMaxListeners",
			value: function incrementMaxListeners(...args) {
				const [target, eventName, increment] = this.destructMaxListenersArgs(...args);
				return this.addMaxListeners(target, eventName, Math.abs(increment));
			}
		}, {
			key: "decrementMaxListeners",
			value: function decrementMaxListeners(...args) {
				const [target, eventName, increment] = this.destructMaxListenersArgs(...args);
				return this.addMaxListeners(target, eventName, -Math.abs(increment));
			}
		}, {
			key: "destructMaxListenersArgs",
			value: function destructMaxListenersArgs(...args) {
				let eventName = null;
				let increment = 1;
				let target = this.GLOBAL_TARGET;
				if (args.length === 1) {
					if (Type.isNumber(args[0])) {
						increment = args[0];
					} else if (Type.isString(args[0])) {
						eventName = args[0];
					} else {
						target = args[0];
					}
				} else if (args.length === 2) {
					if (Type.isString(args[0])) {
						[eventName, increment] = args;
					} else if (Type.isString(args[1])) {
						[target, eventName] = args;
					} else {
						[target, increment] = args;
					}
				} else if (args.length >= 3) {
					[target, eventName, increment] = args;
				}
				if (!Type.isObject(target)) {
					throw new TypeError('The "target" argument must be an object.');
				}
				if (eventName !== null && !Type.isStringFilled(eventName)) {
					throw new TypeError('The "eventName" argument must be a string.');
				}
				if (!Type.isNumber(increment)) {
					throw new TypeError('The value of "increment" must be a number.');
				}
				return [target, eventName, increment];
			}
		}, {
			key: "getListeners",
			value: function getListeners(target, eventName) {
				if (Type.isString(target)) {
					eventName = target;
					target = this.GLOBAL_TARGET;
				}
				if (!Type.isObject(target)) {
					throw new TypeError('The "target" argument must be an object.');
				}
				eventName = this.normalizeEventName(eventName);
				if (!Type.isStringFilled(eventName)) {
					throw new TypeError('The "eventName" argument must be a string.');
				}
				const targetInfo = eventStore.get(target);
				if (!targetInfo) {
					return new Map();
				}
				const fullEventName = this.resolveEventName(eventName, target);
				return targetInfo.eventsMap.get(fullEventName) || new Map();
			}
		}, {
			key: "registerAliases",
			value: function registerAliases(aliases) {
				const normalizedAliases = this.normalizeAliases(aliases);
				Object.keys(normalizedAliases).forEach(alias => {
					aliasStore.set(alias, {
						eventName: normalizedAliases[alias].eventName,
						namespace: normalizedAliases[alias].namespace
					});
				});
				EventEmitter.mergeEventAliases(normalizedAliases);
			}
		}, {
			key: "normalizeAliases",
			value: function normalizeAliases(aliases) {
				if (!Type.isPlainObject(aliases)) {
					throw new TypeError('The "aliases" argument must be an object.');
				}
				const aliasesRecord = aliases;
				const result = Object.create(null);
				for (const key of Object.keys(aliasesRecord)) {
					if (!Type.isStringFilled(key)) {
						throw new TypeError('The alias must be an non-empty string.');
					}
					const options = aliasesRecord[key];
					if (!options || !Type.isStringFilled(options.eventName) || !Type.isStringFilled(options.namespace)) {
						throw new TypeError('The alias options must set the "eventName" and the "namespace".');
					}
					const normalizedAlias = this.normalizeEventName(key);
					result[normalizedAlias] = {
						eventName: options.eventName,
						namespace: options.namespace
					};
				}
				return result;
			}
		}, {
			key: "mergeEventAliases",
			value: function mergeEventAliases(aliases) {
				const globalEvents = eventStore.get(this.GLOBAL_TARGET);
				if (!globalEvents) {
					return;
				}
				Object.keys(aliases).forEach(alias => {
					const options = aliases[alias];
					alias = this.normalizeEventName(alias);
					const fullEventName = this.makeFullEventName(options.namespace, options.eventName);
					const aliasListeners = globalEvents.eventsMap.get(alias);
					if (aliasListeners) {
						const listeners = globalEvents.eventsMap.get(fullEventName) || new Map();
						globalEvents.eventsMap.set(fullEventName, new Map([...listeners, ...aliasListeners]));
						globalEvents.eventsMap.delete(alias);
					}
					const aliasOnceListeners = globalEvents.onceMap.get(alias);
					if (aliasOnceListeners) {
						const onceListeners = globalEvents.onceMap.get(fullEventName) || new Map();
						globalEvents.onceMap.set(fullEventName, new Map([...onceListeners, ...aliasOnceListeners]));
						globalEvents.onceMap.delete(alias);
					}
					const aliasMaxListeners = globalEvents.eventsMaxListeners.get(alias);
					if (aliasMaxListeners) {
						const eventMaxListeners = globalEvents.eventsMaxListeners.get(fullEventName) || 0;
						globalEvents.eventsMaxListeners.set(fullEventName, Math.max(eventMaxListeners, aliasMaxListeners));
						globalEvents.eventsMaxListeners.delete(alias);
					}
				});
			}
		}, {
			key: "isEventEmitter",
			value: function isEventEmitter(target) {
				return Type.isObject(target) && target[isEmitterProperty] === true;
			}
		}, {
			key: "normalizeEventName",
			value: function normalizeEventName(eventName) {
				if (!Type.isStringFilled(eventName)) {
					return '';
				}
				return eventName.toLowerCase();
			}
		}, {
			key: "normalizeListener",
			value: function normalizeListener(listener) {
				if (Type.isString(listener)) {
					listener = Reflection.getClass(listener);
				}
				if (!Type.isFunction(listener)) {
					throw new TypeError(`The "listener" argument must be of type Function. Received type ${typeof listener}.`);
				}
				return listener;
			}
		}, {
			key: "resolveEventName",
			value: function resolveEventName(eventName, target, useGlobalNaming = false) {
				eventName = this.normalizeEventName(eventName);
				if (!Type.isStringFilled(eventName)) {
					return '';
				}
				if (this.isEventEmitter(target) && useGlobalNaming !== true) {
					if (target.getEventNamespace() !== null && eventName.includes('.')) {
						console.warn(`Possible the wrong event name "${eventName}".`);
					}
					eventName = target.getFullEventName(eventName);
				} else if (aliasStore.has(eventName)) {
					const {
						namespace,
						eventName: actualEventName
					} = aliasStore.get(eventName);
					eventName = this.makeFullEventName(namespace, actualEventName);
				}
				return eventName;
			}
		}, {
			key: "makeFullEventName",
			value: function makeFullEventName(namespace, eventName) {
				const fullName = Type.isStringFilled(namespace) ? `${namespace}:${eventName}` : eventName;
				return Type.isStringFilled(fullName) ? fullName.toLowerCase() : '';
			}
		}]);
	}();
	babelHelpers.defineProperty(EventEmitter, "GLOBAL_TARGET", globalTarget);
	babelHelpers.defineProperty(EventEmitter, "DEFAULT_MAX_LISTENERS", eventStore.getDefaultMaxListeners());
	babelHelpers.defineProperty(EventEmitter, "sequenceValue", 1);

	let stack = [];
	exports.isReady = false;
	function ready$1(handler) {
		if (!Type.isFunction(handler)) {
			return;
		}
		if (exports.isReady) {
			handler();
		} else {
			stack.push(handler);
		}
	}
	bindOnce$1(document, 'DOMContentLoaded', () => {
		exports.isReady = true;
		stack.forEach(handler => {
			handler();
		});
		stack = [];
	});

	function getEventListeners(target, eventName) {
		const listeners = [];
		if (Type.isEventTargetLike(target)) {
			const events = registry.get(target);
			if (events[eventName]) {
				events[eventName].forEach(listener => {
					listeners.push({
						type: eventName,
						listener
					});
				});
			}
		}
		return listeners;
	}

	class Event {
		static bind = bind$1;
		static bindOnce = bindOnce$1;
		static unbind = unbind$1;
		static unbindAll = unbindAll$1;
		static ready = ready$1;
		static getEventListeners = getEventListeners;
		static EventEmitter = EventEmitter;
		static BaseEvent = BaseEvent;
	}

	function encodeAttributeValue(value) {
		if (Type.isPlainObject(value) || Type.isArray(value)) {
			return JSON.stringify(value);
		}
		return Text.encode(Text.decode(value));
	}

	function decodeAttributeValue(value) {
		if (Type.isString(value)) {
			const decodedValue = Text.decode(value);
			let result = null;
			try {
				result = JSON.parse(decodedValue);
			} catch {
				result = decodedValue;
			}
			if (result === decodedValue && /^[\d.]+[.]?\d+$/.test(result)) {
				return Number(result);
			}
			if (result === 'true' || result === 'false') {
				return Boolean(result);
			}
			return result;
		}
		return value;
	}

	function getPageScroll() {
		const {
			documentElement,
			body
		} = document;
		const scrollTop = Math.max(window.pageYOffset || 0, documentElement ? documentElement.scrollTop : 0, body ? body.scrollTop : 0);
		const scrollLeft = Math.max(window.pageXOffset || 0, documentElement ? documentElement.scrollLeft : 0, body ? body.scrollLeft : 0);
		return {
			scrollTop,
			scrollLeft
		};
	}

	class Dom {
		static replace(oldElement, newElement) {
			if (Type.isDomNode(oldElement) && Type.isDomNode(newElement) && Type.isDomNode(oldElement.parentNode)) {
				oldElement.parentNode.replaceChild(newElement, oldElement);
			}
		}
		static remove(element) {
			if (Type.isDomNode(element) && Type.isDomNode(element.parentNode)) {
				element.parentNode.removeChild(element);
			}
		}
		static clean(element) {
			if (Type.isDomNode(element)) {
				while (element.firstChild) {
					element.removeChild(element.firstChild);
				}
				return;
			}
			if (Type.isString(element)) {
				Dom.clean(document.getElementById(element));
			}
		}
		static insertBefore(current, target) {
			if (Type.isDomNode(current) && Type.isDomNode(target) && Type.isDomNode(target.parentNode)) {
				target.parentNode.insertBefore(current, target);
			}
		}
		static insertAfter(current, target) {
			if (Type.isDomNode(current) && Type.isDomNode(target) && Type.isDomNode(target.parentNode)) {
				const parent = target.parentNode;
				if (Type.isDomNode(target.nextSibling)) {
					parent.insertBefore(current, target.nextSibling);
					return;
				}
				parent.appendChild(current);
			}
		}
		static append(current, target) {
			if (Type.isDomNode(current) && Type.isDomNode(target)) {
				target.appendChild(current);
			}
		}
		static prepend(current, target) {
			if (Type.isDomNode(current) && Type.isDomNode(target)) {
				if (Type.isDomNode(target.firstChild)) {
					target.insertBefore(current, target.firstChild);
					return;
				}
				Dom.append(current, target);
			}
		}
		static hasClass(element, className) {
			if (Type.isElementNode(element)) {
				if (Type.isString(className)) {
					const preparedClassName = className.trim();
					if (preparedClassName.length > 0) {
						if (preparedClassName.includes(' ')) {
							return preparedClassName.split(' ').every(name => Dom.hasClass(element, name));
						}
						return element.classList.contains(preparedClassName);
					}
				}
				if (Type.isArray(className) && className.length > 0) {
					return className.every(name => Dom.hasClass(element, name));
				}
			}
			return false;
		}
		static addClass(element, className) {
			if (Type.isElementNode(element)) {
				if (Type.isString(className)) {
					const preparedClassName = className.trim();
					if (preparedClassName.length > 0) {
						if (preparedClassName.includes(' ')) {
							Dom.addClass(element, preparedClassName.split(' '));
							return;
						}
						element.classList.add(preparedClassName);
						return;
					}
				}
				if (Type.isArray(className)) {
					className.forEach(name => Dom.addClass(element, name));
				}
			}
		}
		static removeClass(element, className) {
			if (Type.isElementNode(element)) {
				if (Type.isString(className)) {
					const preparedClassName = className.trim();
					if (preparedClassName.length > 0) {
						if (preparedClassName.includes(' ')) {
							Dom.removeClass(element, preparedClassName.split(' '));
							return;
						}
						element.classList.remove(preparedClassName);
						return;
					}
				}
				if (Type.isArray(className)) {
					className.forEach(name => Dom.removeClass(element, name));
				}
			}
		}
		static toggleClass(element, className, force) {
			if (!Type.isElementNode(element) || !Type.isStringFilled(className) && !Type.isArrayFilled(className)) {
				return;
			}
			[className].flat().flatMap(it => it?.trim?.().split(' ')).forEach(token => {
				if (Type.isStringFilled(token)) {
					element.classList.toggle(token, Type.isBoolean(force) ? force : undefined);
				}
			});
		}
		static style(element, prop, value) {
			if (Type.isElementNode(element)) {
				if (Type.isNull(prop)) {
					element.removeAttribute('style');
					return element;
				}
				if (Type.isPlainObject(prop)) {
					Object.entries(prop).forEach(([currentKey, currentValue]) => {
						Dom.style(element, currentKey, currentValue);
					});
					return element;
				}
				if (Type.isString(prop)) {
					if (Type.isUndefined(value) && element.nodeType !== Node.DOCUMENT_NODE) {
						const computedStyle = getComputedStyle(element);
						if (prop in computedStyle) {
							return computedStyle[prop];
						}
						return computedStyle.getPropertyValue(prop);
					}
					if (Type.isNull(value) || value === '' || value === 'null') {
						if (String(prop).startsWith('--')) {
							element.style.removeProperty(prop);
							return element;
						}
						element.style[prop] = '';
						return element;
					}
					if (Type.isString(value) || Type.isNumber(value)) {
						if (String(prop).startsWith('--')) {
							element.style.setProperty(prop, String(value));
							return element;
						}
						element.style[prop] = value;
						return element;
					}
				}
			}
			return null;
		}
		static adjust(target, data = {}) {
			if (!target.nodeType) {
				return null;
			}
			let element = target;
			if (target.nodeType === Node.DOCUMENT_NODE) {
				element = target.body;
			}
			if (Type.isPlainObject(data)) {
				if (Type.isPlainObject(data.attrs)) {
					const attrs = data.attrs;
					Object.keys(attrs).forEach(key => {
						if (key === 'class' || key.toLowerCase() === 'classname') {
							element.className = attrs[key];
							return;
						}
						if (attrs[key] == '') {
							element.removeAttribute(key);
							return;
						}
						element.setAttribute(key, attrs[key]);
					});
				}
				if (Type.isPlainObject(data.style)) {
					Dom.style(element, data.style);
				}
				if (Type.isPlainObject(data.props)) {
					const props = data.props;
					Object.keys(props).forEach(key => {
						element[key] = props[key];
					});
				}
				if (Type.isPlainObject(data.events)) {
					const events = data.events;
					Object.keys(events).forEach(key => {
						Event.bind(element, key, events[key]);
					});
				}
				if (Type.isPlainObject(data.dataset)) {
					const dataset = data.dataset;
					Object.keys(dataset).forEach(key => {
						element.dataset[key] = dataset[key];
					});
				}
				const children = Type.isString(data.children) ? [data.children] : data.children;
				if (Type.isArray(children) && children.length > 0) {
					children.forEach(item => {
						if (Type.isDomNode(item)) {
							Dom.append(item, element);
						}
						if (Type.isString(item)) {
							element.insertAdjacentHTML('beforeend', item);
						}
					});
					return element;
				}
				if ('text' in data && !Type.isNil(data.text)) {
					element.textContent = data.text;
					return element;
				}
				if ('html' in data && !Type.isNil(data.html)) {
					element.innerHTML = data.html;
				}
			}
			return element;
		}
		static create(tag, data = {}, context = document) {
			let tagName = tag;
			let options = data;
			if (Type.isObjectLike(tag)) {
				const tagOptions = tag;
				options = tagOptions;
				tagName = tagOptions.tag;
			}
			return Dom.adjust(context.createElement(tagName), options);
		}
		static show(element) {
			if (Type.isDomNode(element)) {
				element.hidden = false;
			}
		}
		static hide(element) {
			if (Type.isDomNode(element)) {
				element.hidden = true;
			}
		}
		static isShown(element) {
			return Type.isDomNode(element) && !element.hidden && element.style.getPropertyValue('display') !== 'none';
		}
		static isShownRecursive(element) {
			if (!Type.isDomNode(element)) {
				return false;
			}
			if (element === document.body) {
				return Dom.isShown(element);
			}
			return Dom.isShown(element) && Dom.isShownRecursive(element.parentElement);
		}
		static toggle(element) {
			if (Type.isDomNode(element)) {
				if (Dom.isShown(element)) {
					Dom.hide(element);
				} else {
					Dom.show(element);
				}
			}
		}
		static getPosition(element) {
			if (Type.isDomNode(element)) {
				const elementRect = element.getBoundingClientRect();
				const {
					scrollLeft,
					scrollTop
				} = getPageScroll();
				return new DOMRect(elementRect.left + scrollLeft, elementRect.top + scrollTop, elementRect.width, elementRect.height);
			}
			return new DOMRect();
		}
		static getRelativePosition(element, relationElement) {
			if (Type.isDomNode(element) && Type.isDomNode(relationElement)) {
				const elementPosition = Dom.getPosition(element);
				const relationElementPosition = Dom.getPosition(relationElement);
				return new DOMRect(elementPosition.left - relationElementPosition.left, elementPosition.top - relationElementPosition.top, elementPosition.width, elementPosition.height);
			}
			return new DOMRect();
		}
		static attr(element, attr, value) {
			if (Type.isElementNode(element)) {
				if (Type.isString(attr)) {
					if (!Type.isNil(value)) {
						if (Type.isObjectLike(value)) {
							element.setAttribute(attr, encodeAttributeValue(value));
						} else {
							element.setAttribute(attr, String(value));
						}
					} else if (Type.isNull(value)) {
						element.removeAttribute(attr);
					} else {
						return decodeAttributeValue(element.getAttribute(attr));
					}
				}
				if (Type.isPlainObject(attr)) {
					Object.entries(attr).forEach(([attrKey, attrValue]) => {
						Dom.attr(element, attrKey, attrValue);
					});
				}
			}
			return null;
		}
	}

	const UA = navigator.userAgent.toLowerCase();
	class Browser {
		static isOpera() {
			return UA.includes('opera');
		}
		static isIE() {
			return false;
		}
		static isIE6() {
			return false;
		}
		static isIE7() {
			return false;
		}
		static isIE8() {
			return false;
		}
		static isIE9() {
			return false;
		}
		static isIE10() {
			return false;
		}
		static isSafari() {
			return UA.includes('safari') && !UA.includes('chrome');
		}
		static isFirefox() {
			return UA.includes('firefox');
		}
		static isChrome() {
			return UA.includes('chrome');
		}
		static detectIEVersion() {
			return -1;
		}
		static isIE11() {
			return false;
		}
		static isMac() {
			return UA.includes('macintosh');
		}
		static isWin() {
			return UA.includes('windows');
		}
		static isLinux() {
			return UA.includes('linux') && !Browser.isAndroid();
		}
		static isAndroid() {
			return UA.includes('android');
		}
		static isIPad() {
			return UA.includes('ipad;') || this.isMac() && this.isTouchDevice();
		}
		static isIPhone() {
			return UA.includes('iphone;');
		}
		static isIOS() {
			return Browser.isIPad() || Browser.isIPhone();
		}
		static isMobile() {
			return Browser.isIPhone() || Browser.isIPad() || Browser.isAndroid() || UA.includes('mobile') || UA.includes('touch');
		}
		static isRetina() {
			return window.devicePixelRatio >= 2;
		}
		static isTouchDevice() {
			return 'ontouchstart' in window || navigator.maxTouchPoints > 0 || navigator.msMaxTouchPoints > 0;
		}
		static isDoctype(target) {
			const doc = target || document;
			if (doc.compatMode) {
				return doc.compatMode === 'CSS1Compat';
			}
			return Boolean(doc.documentElement && doc.documentElement.clientHeight);
		}
		static isLocalStorageSupported() {
			return true;
		}
		static addGlobalClass(target) {
			const element = Type.isElementNode(target) ? target : document.documentElement;
			let globalClass = 'bx-core';
			if (Dom.hasClass(element, globalClass)) {
				return;
			}
			if (Browser.isIOS()) {
				globalClass += ' bx-ios';
			} else if (Browser.isWin()) {
				globalClass += ' bx-win';
			} else if (Browser.isMac()) {
				globalClass += ' bx-mac';
			} else if (Browser.isLinux()) {
				globalClass += ' bx-linux';
			} else if (Browser.isAndroid()) {
				globalClass += ' bx-android';
			}
			globalClass += Browser.isMobile() ? ' bx-touch' : ' bx-no-touch';
			globalClass += Browser.isRetina() ? ' bx-retina' : ' bx-no-retina';
			if (Browser.isSafari()) {
				globalClass += ' bx-safari';
			} else if (/AppleWebKit/.test(navigator.userAgent)) {
				globalClass += ' bx-chrome';
			} else if (/Opera/.test(navigator.userAgent)) {
				globalClass += ' bx-opera';
			} else if (Browser.isFirefox()) {
				globalClass += ' bx-firefox';
			}
			Dom.addClass(element, globalClass);
		}
		static detectAndroidVersion() {
			const re = /Android ([\d.]+)/;
			if (re.exec(navigator.userAgent) !== null) {
				const res = navigator.userAgent.match(re);
				if (Type.isArrayLike(res) && res.length > 0) {
					return parseFloat(res[1]);
				}
			}
			return 0;
		}
		static isPropertySupported(jsProperty, returnCSSName) {
			if (jsProperty === '') {
				return false;
			}
			function getCssName(propertyName) {
				return propertyName.replaceAll(/[A-Z]/g, match => `-${match.toLowerCase()}`);
			}
			function getJsName(cssName) {
				const reg = /(\\-([a-z]))/g;
				if (reg.test(cssName)) {
					return cssName.replaceAll(reg, (...args) => args[2].toUpperCase());
				}
				return cssName;
			}
			const property = jsProperty.includes('-') ? getJsName(jsProperty) : jsProperty;
			const bReturnCSSName = Boolean(returnCSSName);
			const ucProperty = property.charAt(0).toUpperCase() + property.slice(1);
			const props = ['Webkit', 'Moz', 'O', 'ms'].join(`${ucProperty} `);
			const properties = `${property} ${props} ${ucProperty}`.split(' ');
			const obj = document.body || document.documentElement;
			for (const prop of properties) {
				if (obj && 'style' in obj && prop in obj.style) {
					const lowerProp = prop.slice(0, prop.length - property.length).toLowerCase();
					const prefix = prop === property ? '' : `-${lowerProp}-`;
					return bReturnCSSName ? prefix + getCssName(property) : prop;
				}
			}
			return false;
		}
		static addGlobalFeatures(features) {
			if (!Type.isArray(features)) {
				return;
			}
			const classNames = [];
			for (const feature of features) {
				const support = Boolean(Browser.isPropertySupported(feature));
				classNames.push(`bx-${support ? '' : 'no-'}${feature.toLowerCase()}`);
			}
			Dom.addClass(document.documentElement, classNames.join(' '));
		}
	}

	class Cookie {
		static getList() {
			return document.cookie.split(';').map(item => item.split('=')).map(item => item.map(subItem => subItem.trim())).reduce((acc, item) => {
				const [key, value] = item;
				acc[decodeURIComponent(key)] = decodeURIComponent(value);
				return acc;
			}, {});
		}
		static get(name) {
			const cookiesList = Cookie.getList();
			if (name in cookiesList) {
				return cookiesList[name];
			}
			return undefined;
		}
		static set(name, value, options = {}) {
			const attributes = {
				expires: '',
				...options
			};
			if (Type.isNumber(attributes.expires)) {
				const now = Date.now();
				const days = attributes.expires;
				const dayInMs = 864e5;
				attributes.expires = new Date(now + days * dayInMs);
			}
			if (Type.isDate(attributes.expires)) {
				attributes.expires = attributes.expires.toUTCString();
			}
			const safeName = decodeURIComponent(String(name)).replaceAll(/%(23|24|26|2B|5E|60|7C)/g, decodeURIComponent).replaceAll(/[()]/g, escape);
			const safeValue = encodeURIComponent(String(value)).replaceAll(/%(23|24|26|2B|3A|3C|3E|3D|2F|3F|40|5B|5D|5E|60|7B|7D|7C)/g, decodeURIComponent);
			const stringifiedAttributes = Object.keys(attributes).reduce((acc, key) => {
				const attributeValue = attributes[key];
				if (!attributeValue) {
					return acc;
				}
				if (attributeValue === true) {
					return `${acc}; ${key}`;
				}
				return `${acc}; ${key}=${attributeValue.split(';')[0]}`;
			}, '');
			document.cookie = `${safeName}=${safeValue}${stringifiedAttributes}`;
		}
		static remove(name, options = {}) {
			Cookie.set(name, '', {
				...options,
				expires: -1
			});
		}
	}

	function objectToFormData(source, formData = new FormData(), pre = null) {
		if (Type.isUndefined(source)) {
			return formData;
		}
		if (Type.isNull(source)) {
			formData.append(pre, '');
		} else if (Type.isArray(source)) {
			if (source.length > 0) {
				source.forEach((value, index) => {
					const key = `${pre}[${index}]`;
					objectToFormData(value, formData, key);
				});
			} else {
				const key = `${pre}[]`;
				formData.append(key, '');
			}
		} else if (Type.isDate(source)) {
			formData.append(pre, source.toISOString());
		} else if (Type.isObject(source) && !Type.isFile(source) && !Type.isBlob(source)) {
			Object.keys(source).forEach(property => {
				const value = source[property];
				let preparedProperty = property;
				if (Type.isArray(value)) {
					while (preparedProperty.length > 2 && preparedProperty.lastIndexOf('[]') === preparedProperty.length - 2) {
						preparedProperty = preparedProperty.slice(0, -2);
					}
				}
				const key = pre ? `${pre}[${preparedProperty}]` : preparedProperty;
				objectToFormData(value, formData, key);
			});
		} else {
			formData.append(pre, source);
		}
		return formData;
	}

	class Data {
		static convertObjectToFormData(source) {
			return objectToFormData(source);
		}
	}

	class Http {
		static Cookie = Cookie;
		static Data = Data;
	}

	const message$1 = function (value) {
		if (Type.isString(value)) {
			if (Type.isNil(message$1[value])) {
				EventEmitter.emit('onBXMessageNotFound', new BaseEvent({
					compatData: [value]
				}));
				if (Type.isNil(message$1[value])) {
					Runtime.debug(`message undefined: ${value}`);
					message$1[value] = '';
				}
			}
			return message$1[value];
		}
		if (Type.isPlainObject(value)) {
			Object.keys(value).forEach(key => {
				message$1[key] = value[key];
			});
		}
		return undefined;
	};
	if (!Type.isNil(window.BX) && Type.isFunction(window.BX.message)) {
		Object.keys(window.BX.message).forEach(key => {
			message$1({
				[key]: window.BX.message[key]
			});
		});
	}

	class Loc {
		static getMessage(messageId, replacements = null) {
			let mess = message$1(messageId);
			if (Type.isString(mess) && Type.isPlainObject(replacements)) {
				const escape = str => String(str).replaceAll(/[$()*+.?[\\\]^{|}]/g, '\\$&');
				Object.keys(replacements).forEach(replacement => {
					const globalRegexp = new RegExp(escape(replacement), 'gi');
					mess = mess.replaceAll(globalRegexp, () => {
						return Type.isNil(replacements[replacement]) ? '' : String(replacements[replacement]);
					});
				});
			}
			return mess;
		}
		static hasMessage(messageId) {
			return Type.isString(messageId) && !Type.isNil(message$1[messageId]);
		}
		static setMessage(id, value) {
			if (Type.isString(id) && Type.isString(value)) {
				message$1({
					[id]: value
				});
			}
			if (Type.isObject(id)) {
				message$1(id);
			}
		}
		static getMessagePlural(messageId, value, replacements = null) {
			let result = '';
			if (Type.isNumber(value)) {
				if (this.hasMessage(`${messageId}_PLURAL_${this.getPluralForm(value)}`)) {
					result = this.getMessage(`${messageId}_PLURAL_${this.getPluralForm(value)}`, replacements);
				} else {
					result = this.getMessage(`${messageId}_PLURAL_1`, replacements);
				}
			} else {
				result = this.getMessage(messageId, replacements);
			}
			return result;
		}
		static getPluralForm(value, languageId) {
			let pluralForm = 1;
			let lang = languageId;
			if (!Type.isStringFilled(lang)) {
				lang = message$1('LANGUAGE_ID');
			}
			const absValue = Math.abs(value);
			switch (lang) {
				case 'ar':
					pluralForm = absValue === 1 ? 0 : 1;
					break;
				case 'br':
				case 'fr':
				case 'tr':
					pluralForm = absValue > 1 ? 1 : 0;
					break;
				case 'de':
				case 'en':
				case 'hi':
				case 'it':
				case 'la':
					pluralForm = absValue === 1 ? 0 : 1;
					break;
				case 'ru':
				case 'ua':
					if (absValue % 10 === 1 && absValue % 100 !== 11) {
						pluralForm = 0;
					} else if (absValue % 10 >= 2 && absValue % 10 <= 4 && (absValue % 100 < 10 || absValue % 100 >= 20)) {
						pluralForm = 1;
					} else {
						pluralForm = 2;
					}
					break;
				case 'pl':
					if (absValue === 1) {
						pluralForm = 0;
					} else if (absValue % 10 >= 2 && absValue % 10 <= 4 && (absValue % 100 < 10 || absValue % 100 >= 20)) {
						pluralForm = 1;
					} else {
						pluralForm = 2;
					}
					break;
				case 'id':
				case 'ja':
				case 'ms':
				case 'sc':
				case 'tc':
				case 'th':
				case 'vn':
					pluralForm = 0;
					break;
				default:
					pluralForm = 1;
					break;
			}
			return pluralForm;
		}
	}

	const voidElements = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr']);
	function isVoidElement(element) {
		return voidElements.has(element);
	}

	const matchers = {
		tag: /<[\d!/A-Za-z-](?:"[^"]*"|'[^']*'|[^"'>])*>|{{uid\d+}}/g,
		comment: /<!--(?!<!)[^>[].*?-->/g,
		tagName: /<\/?(\S+?)[\s/>]/,
		attributes: /\s([\w.:-]+)\s?\n?=\s?\n?"([^"]+)?"|\s([\w.:-]+)\s?\n?=\s?\n?'([^']+)?'|\s([\w.:-]+)/gs,
		placeholder: /{{uid\d+}}/g
	};

	function parseTag(tag) {
		const tagResult = {
			type: 'tag',
			name: '',
			svg: false,
			attrs: {},
			children: [],
			voidElement: false
		};
		if (tag.startsWith('<!--')) {
			const endIndex = tag.indexOf('-->');
			const openTagLength = '<!--'.length;
			return {
				type: 'comment',
				content: endIndex === -1 ? '' : tag.slice(openTagLength, endIndex)
			};
		}
		const tagNameMatch = tag.match(matchers.tagName);
		if (Type.isArrayFilled(tagNameMatch)) {
			const [, tagName] = tagNameMatch;
			tagResult.name = tagName;
			tagResult.svg = tagName === 'svg';
			tagResult.voidElement = isVoidElement(tagName) || tag.trim().endsWith('/>');
		}
		const reg = new RegExp(matchers.attributes);
		for (;;) {
			const result = reg.exec(tag);
			if (Type.isNil(result)) {
				break;
			}
			const [, doubleQuoteName, doubleQuoteValue] = result;
			if (Type.isNil(doubleQuoteName)) {
				const singleQuoteName = result[3];
				const singleQuoteValue = result[4];
				if (Type.isNil(singleQuoteName)) {
					const booleanAttrName = result[5];
					tagResult.attrs[booleanAttrName] = '';
				} else {
					tagResult.attrs[singleQuoteName] = Type.isStringFilled(singleQuoteValue) ? singleQuoteValue : '';
				}
			} else {
				tagResult.attrs[doubleQuoteName] = Type.isStringFilled(doubleQuoteValue) ? doubleQuoteValue : '';
			}
		}
		return tagResult;
	}

	function parseText(input) {
		const preparedText = input.replace(/[\t\n\r]$/, '');
		const placeholders = preparedText.match(matchers.placeholder);
		return preparedText.split(matchers.placeholder).reduce((acc, item, index) => {
			if (Type.isStringFilled(item)) {
				acc.push(...item.split(/\n/).reduce((textAcc, text) => {
					const preparedItemText = text.replaceAll(/[\t\r]/g, '');
					if (Type.isStringFilled(preparedItemText)) {
						textAcc.push({
							type: 'text',
							content: preparedItemText
						});
					}
					return textAcc;
				}, []));
			}
			if (placeholders && placeholders[index]) {
				acc.push({
					type: 'placeholder',
					uid: parseInt(placeholders[index].replace(/{{uid|}}/, ''), 10)
				});
			}
			return acc;
		}, []);
	}

	function parse(html, substitutions) {
		const result = [];
		if (html.indexOf('<') !== 0 && !html.startsWith('{{')) {
			const end = html.indexOf('<');
			result.push(...parseText(end === -1 ? html : html.slice(0, end)));
		}
		const commentsContent = [];
		let commentIndex = -1;
		html = html.replace(matchers.comment, tag => {
			commentIndex += 1;
			commentsContent.push(tag.replaceAll(/^<!--|-->$/g, ''));
			return `<!--{{cUid${commentIndex}}}-->`;
		});
		const arr = [];
		let level = -1;
		let current = null;
		html.replace(matchers.tag, (tag, index) => {
			const start = index + tag.length;
			const nextChar = html.charAt(start);
			let parent = null;
			if (tag.startsWith('<!--')) {
				const comment = parseTag(tag);
				comment.content = commentsContent[tag.replaceAll(/<!--{{cUid|}}-->/g, '')];
				if (level < 0) {
					result.push(comment);
					return result;
				}
				parent = arr[level];
				parent.children.push(comment);
				return result;
			}
			if (tag.startsWith('{{')) {
				const [placeholder] = parseText(tag);
				if (level < 0) {
					result.push(placeholder);
					return result;
				}
				parent = arr[level];
				parent.children.push(placeholder);
				return result;
			}
			if (!tag.startsWith('</')) {
				level++;
				current = parseTag(tag);
				if (!current.voidElement && nextChar && nextChar !== '<') {
					current.children.push(...parseText(html.slice(start, html.indexOf('<', start))));
				}
				if (level === 0) {
					result.push(current);
				}
				parent = arr[level - 1];
				if (parent) {
					if (!current.svg) {
						current.svg = parent.svg;
					}
					parent.children.push(current);
				}
				arr[level] = current;
			}
			if (tag.startsWith('</') || current.voidElement) {
				if (level > -1 && (current.voidElement || current.name === tag.slice(2, -1))) {
					level--;
					current = level === -1 ? result : arr[level];
				}
				if (nextChar && nextChar !== '<') {
					parent = level === -1 ? result : arr[level].children;
					const end = html.indexOf('<', start);
					const content = html.slice(start, end === -1 ? undefined : end);
					if (end > -1 && level + parent.length >= 0 || content !== ' ') {
						parent.push(...parseText(content));
					}
				}
			}
			return result;
		});
		return result;
	}

	const appendElement = (current, target) => {
		if (Type.isDomNode(current) && Type.isDomNode(target)) {
			if (target.nodeName === 'TEMPLATE') {
				target.content.append(current);
			} else {
				Dom.append(current, target);
			}
		}
	};
	function renderNode(options) {
		const {
			node,
			parentElement,
			substitutions,
			refs = []
		} = options;
		if (node.type === 'tag') {
			const element = (() => {
				if (node.svg) {
					return document.createElementNS('http://www.w3.org/2000/svg', node.name);
				}
				return document.createElement(node.name);
			})();
			if (Object.hasOwn(node.attrs, 'ref')) {
				refs.push([node.attrs.ref, element]);
				delete node.attrs.ref;
			}
			Object.entries(node.attrs).forEach(([key, value]) => {
				if (key.startsWith('on') && new RegExp(`^${matchers.placeholder.source}$`).test(String(value).trim())) {
					const substitution = substitutions[parseInt(String(value).trim().replace('{{uid', ''), 10) - 1];
					if (Type.isFunction(substitution)) {
						const bindFunctionName = key.endsWith('once') ? 'bindOnce' : 'bind';
						Event[bindFunctionName](element, key.replaceAll(/^on|once$/g, ''), substitution);
					} else {
						element.setAttribute(key, substitution);
					}
				} else if (new RegExp(matchers.placeholder).test(value)) {
					const preparedValue = value.split(/{{|}}/).reduce((acc, item) => {
						if (item.startsWith('uid')) {
							const substitution = substitutions[parseInt(item.replace('uid', ''), 10) - 1];
							return `${acc}${Text.decode(String(substitution))}`;
						}
						return `${acc}${Text.decode(item)}`;
					}, '');
					element.setAttribute(key, preparedValue);
				} else {
					element.setAttribute(key, Text.decode(value));
				}
			});
			node.children.forEach(childNode => {
				const result = renderNode({
					node: childNode,
					parentElement: element,
					substitutions,
					refs
				});
				if (Type.isArray(result)) {
					result.forEach(subChildElement => {
						appendElement(subChildElement, element);
					});
				} else {
					appendElement(result, element);
				}
			});
			return element;
		}
		if (node.type === 'comment') {
			return document.createComment(node.content);
		}
		if (node.type === 'text') {
			if (parentElement) {
				if (parentElement.nodeName === 'TEMPLATE') {
					parentElement.content.append(node.content);
				} else {
					parentElement.insertAdjacentHTML('beforeend', node.content);
				}
				return undefined;
			}
			return document.createTextNode(node.content);
		}
		if (node.type === 'placeholder') {
			return substitutions[node.uid - 1];
		}
		return undefined;
	}

	const SECTION_STATE_OUTSIDE_TAG = 0;
	const SECTION_STATE_IN_TAG = 1;
	const SECTION_STATE_IN_ATTR_VALUE_DOUBLE = 2;
	const SECTION_STATE_IN_ATTR_VALUE_SINGLE = 3;
	const tagNameStart = /[A-Za-z]/;
	function transitionFromOutsideTag(section, position) {
		if (section.charAt(position) === '<') {
			const next = section.charAt(position + 1);
			if (next === '!' || next === '/' || tagNameStart.test(next)) {
				return SECTION_STATE_IN_TAG;
			}
		}
		return SECTION_STATE_OUTSIDE_TAG;
	}
	function transitionFromInTag(char) {
		if (char === '"') {
			return SECTION_STATE_IN_ATTR_VALUE_DOUBLE;
		}
		if (char === '\'') {
			return SECTION_STATE_IN_ATTR_VALUE_SINGLE;
		}
		if (char === '>') {
			return SECTION_STATE_OUTSIDE_TAG;
		}
		return SECTION_STATE_IN_TAG;
	}
	function advanceState(state, section, position) {
		const char = section.charAt(position);
		switch (state) {
			case SECTION_STATE_OUTSIDE_TAG:
				return transitionFromOutsideTag(section, position);
			case SECTION_STATE_IN_TAG:
				return transitionFromInTag(char);
			case SECTION_STATE_IN_ATTR_VALUE_DOUBLE:
				return char === '"' ? SECTION_STATE_IN_TAG : state;
			case SECTION_STATE_IN_ATTR_VALUE_SINGLE:
				return char === '\'' ? SECTION_STATE_IN_TAG : state;
			default:
				return state;
		}
	}
	function computeSectionStates(sections) {
		const states = [];
		let state = SECTION_STATE_OUTSIDE_TAG;
		for (const section of sections) {
			for (let position = 0; position < section.length; position++) {
				state = advanceState(state, section, position);
			}
			states.push(state);
		}
		return states;
	}
	function render(sections, ...substitutions) {
		const sectionStates = computeSectionStates(sections);
		const html = sections.reduce((acc, item, index) => {
			if (index > 0) {
				const substitution = substitutions[index - 1];
				const previousSectionState = sectionStates[index - 1];
				const isInsideAttributeValue = previousSectionState === SECTION_STATE_IN_ATTR_VALUE_DOUBLE || previousSectionState === SECTION_STATE_IN_ATTR_VALUE_SINGLE;
				if (!isInsideAttributeValue && (Type.isString(substitution) || Type.isNumber(substitution))) {
					return `${acc}${substitution}${item}`;
				}
				return `${acc}{{uid${index}}}${item}`;
			}
			return acc;
		}, sections[0]).replaceAll(/^\s+/gm, '').replaceAll(/>\n+/g, '>').replaceAll(/}\n+/g, '}');
		const ast = parse(html);
		if (ast.length === 1) {
			const refs = [];
			const renderedNode = renderNode({
				node: ast[0],
				substitutions,
				refs
			});
			if (Type.isArrayFilled(refs)) {
				return Object.fromEntries([['root', renderedNode], ...refs]);
			}
			return renderedNode;
		}
		if (ast.length > 1) {
			const refs = [];
			const renderedNodes = ast.map(node => {
				return renderNode({
					node,
					substitutions,
					refs
				});
			});
			if (Type.isArrayFilled(refs)) {
				return Object.fromEntries([['root', renderedNodes], ...refs]);
			}
			return renderedNodes;
		}
		return false;
	}

	function parseProps(...args) {
		const [sections, ...substitutions] = args;
		return substitutions.reduce((acc, item, index) => {
			const nextSectionIndex = index + 1;
			if (!Type.isPlainObject(item) && !Type.isArray(item)) {
				return acc + item + sections[nextSectionIndex];
			}
			return `${acc}__s${index}${sections[nextSectionIndex]}`;
		}, sections[0]).replaceAll(/[\t\r]/gm, '').split(';\n').map(item => item.replace(/\n/, '')).reduce((acc, item) => {
			if (item !== '') {
				const matches = item.match(/^[\w-. ]+:/);
				const splitted = item.split(/^[\w-. ]+:/);
				const key = matches[0].replace(':', '').trim();
				const value = splitted[1].trim();
				const substitutionPlaceholderExp = /^__s\d+/;
				if (substitutionPlaceholderExp.test(value)) {
					acc[key] = substitutions[value.replace('__s', '')];
					return acc;
				}
				acc[key] = value;
			}
			return acc;
		}, {});
	}
	class Tag {
		static safe(sections, ...substitutions) {
			return substitutions.reduce((acc, item, index) => acc + Text.encode(item) + sections[index + 1], sections[0]);
		}
		static unsafe(sections, ...substitutions) {
			return substitutions.reduce((acc, item, index) => acc + Text.decode(item) + sections[index + 1], sections[0]);
		}
		static style(element) {
			if (!Type.isDomNode(element)) {
				throw new Error('element is not HTMLElement');
			}
			return function styleTagHandler(...args) {
				Dom.style(element, parseProps(...args));
			};
		}
		static message(sections, ...substitutions) {
			return substitutions.reduce((acc, item, index) => acc + Loc.getMessage(item) + sections[index + 1], sections[0]);
		}
		static render = render;
		static attrs(element) {
			if (!Type.isDomNode(element)) {
				throw new Error('element is not HTMLElement');
			}
			return function attrsTagHandler(...args) {
				Dom.attr(element, parseProps(...args));
			};
		}
		static attr = Tag.attrs;
	}

	function getParser(format) {
		switch (format) {
			case 'index':
				return (sourceKey, value, accumulator) => {
					const result = /\[(\w*)]$/.exec(sourceKey);
					const key = sourceKey.replace(/\[\w*]$/, '');
					if (Type.isNil(result)) {
						accumulator[key] = value;
						return;
					}
					if (Type.isUndefined(accumulator[key])) {
						accumulator[key] = {};
					}
					accumulator[key][result[1]] = value;
				};
			case 'bracket':
				return (sourceKey, value, accumulator) => {
					const result = /(\[])$/.exec(sourceKey);
					const key = sourceKey.replace(/\[]$/, '');
					if (Type.isNil(result)) {
						accumulator[key] = value;
						return;
					}
					if (Type.isUndefined(accumulator[key])) {
						accumulator[key] = Type.isNil(value) ? [] : [value];
						return;
					}
					accumulator[key] = [].concat(accumulator[key], value);
				};
			default:
				return (sourceKey, value, accumulator) => {
					const key = sourceKey.replace(/\[]$/, '');
					accumulator[key] = value;
				};
		}
	}
	function getKeyFormat(key) {
		if (/^\w+\[(\w+)]$/.test(key)) {
			return 'index';
		}
		if (/^\w+\[]$/.test(key)) {
			return 'bracket';
		}
		return 'default';
	}
	function isAllowedKey(key) {
		return !String(key).startsWith('__proto__');
	}
	function parseQuery(input) {
		if (!Type.isString(input)) {
			return {};
		}
		const url = input.trim().replace(/^[#&?]/, '');
		if (!url) {
			return {};
		}
		return {
			...url.split('&').reduce((acc, param) => {
				const [key, value] = param.replaceAll('+', ' ').split('=');
				if (isAllowedKey(key)) {
					const keyFormat = getKeyFormat(key);
					const formatter = getParser(keyFormat);
					formatter(key, value, acc);
				}
				return acc;
			}, Object.create(null))
		};
	}
	const urlExp = /^((\w+):)?(\/\/((\w+)?(:(\w+))?@)?([^/:?]+)(:(\d+))?)?(\/?([^#/?][^#?]*)?)?(\?([^#]+))?(#((?:[\w-?/:@.~!$&'()*+,;=]|%\w{2})*))?/;
	function prepareParams(params) {
		const paramsEntries = Object.entries(params);
		return paramsEntries.reduce((acc, [key, value]) => {
			if (Type.isNil(value)) {
				acc[key] = '';
			} else if (Type.isPlainObject(value)) {
				acc[key] = prepareParams(value);
			} else {
				acc[key] = value;
			}
			return acc;
		}, {});
	}
	function parseUrl(url) {
		const result = url.match(urlExp);
		if (Type.isArray(result)) {
			const sourceParams = parseQuery(result[14]);
			const preparedParams = prepareParams(sourceParams);
			return {
				useShort: /^\/\//.test(url),
				href: result[0] || '',
				schema: result[2] || '',
				host: result[8] || '',
				port: result[10] || '',
				path: result[11] || '',
				query: result[14] || '',
				sourceQueryParams: sourceParams,
				queryParams: preparedParams,
				hash: result[16] || '',
				username: result[5] || '',
				password: result[7] || '',
				origin: result[8] || ''
			};
		}
		return {};
	}

	function renderParam(param, value) {
		if (Type.isNil(value)) {
			return param;
		}
		return `${param}=${value}`;
	}

	function buildQueryString(params = {}) {
		const queryString = Object.keys(params).reduce((acc, key) => {
			if (Type.isArray(params[key])) {
				if (Type.isArrayFilled(params[key])) {
					params[key].forEach(paramValue => {
						acc.push(renderParam(`${key}[]`, paramValue));
					});
				} else {
					acc.push(renderParam(`${key}[]`, null));
				}
			}
			if (Type.isPlainObject(params[key])) {
				Object.keys(params[key]).forEach(paramIndex => {
					acc.push(renderParam(`${key}[${paramIndex}]`, params[key][paramIndex]));
				});
			}
			if (!Type.isObject(params[key]) && !Type.isArray(params[key])) {
				acc.push(renderParam(key, params[key]));
			}
			return acc;
		}, []).join('&');
		if (queryString.length > 0) {
			return `?${queryString}`;
		}
		return queryString;
	}

	function prepareParamValue(value) {
		if (Type.isArray(value)) {
			return value.map(item => String(item));
		}
		if (Type.isPlainObject(value)) {
			return {
				...value
			};
		}
		return String(value);
	}

	const map = new WeakMap();
	class Uri {
		static addParam(url, params = {}) {
			return new Uri(url).setQueryParams(params).toString();
		}
		static removeParam(url, params) {
			const removableParams = Type.isArray(params) ? params : [params];
			return new Uri(url).removeQueryParam(...removableParams).toString();
		}
		constructor(url = '') {
			map.set(this, parseUrl(url));
		}
		getSchema() {
			return map.get(this).schema;
		}
		setSchema(schema) {
			map.get(this).schema = String(schema);
			return this;
		}
		getHost() {
			return map.get(this).host;
		}
		setHost(host) {
			map.get(this).host = String(host);
			return this;
		}
		getPort() {
			return map.get(this).port;
		}
		setPort(port) {
			map.get(this).port = String(port);
			return this;
		}
		getPath() {
			return map.get(this).path;
		}
		setPath(path) {
			if (!/^\//.test(path)) {
				map.get(this).path = `/${String(path)}`;
				return this;
			}
			map.get(this).path = String(path);
			return this;
		}
		getQuery() {
			return buildQueryString(map.get(this).queryParams);
		}
		getQueryParam(key) {
			const params = this.getQueryParams();
			if (Object.hasOwn(params, key)) {
				return params[key];
			}
			return null;
		}
		setQueryParam(key, value = '') {
			map.get(this).queryParams[key] = prepareParamValue(value);
			map.get(this).sourceQueryParams[key] = prepareParamValue(value);
			return this;
		}
		getQueryParams() {
			return {
				...map.get(this).queryParams
			};
		}
		setQueryParams(params = {}) {
			if (Type.isPlainObject(params)) {
				const {
					queryParams,
					sourceQueryParams
				} = map.get(this);
				Object.entries(params).forEach(([key, value]) => {
					const preparedValue = prepareParamValue(value);
					queryParams[key] = preparedValue;
					sourceQueryParams[key] = preparedValue;
				});
			}
			return this;
		}
		removeQueryParam(...keys) {
			const {
				queryParams,
				sourceQueryParams
			} = map.get(this);
			keys.forEach(key => {
				delete queryParams[key];
				delete sourceQueryParams[key];
			});
			return this;
		}
		getFragment() {
			return map.get(this).hash;
		}
		setFragment(hash) {
			map.get(this).hash = String(hash);
			return this;
		}
		serialize() {
			const serialized = {
				...map.get(this)
			};
			delete serialized.sourceQueryParams;
			serialized.href = this.toString();
			return serialized;
		}
		toString() {
			const data = {
				...map.get(this)
			};
			let protocol = data.schema ? `${data.schema}://` : '';
			if (data.useShort) {
				protocol = '//';
			}
			const port = (() => {
				if (Type.isString(data.port) && !['', '80'].includes(data.port)) {
					return `:${data.port}`;
				}
				return '';
			})();
			const host = this.getHost();
			const path = this.getPath();
			const query = buildQueryString(data.sourceQueryParams);
			const hash = data.hash ? `#${data.hash}` : '';
			return `${host ? protocol : ''}${host}${host ? port : ''}${path}${query}${hash}`;
		}
	}

	class Validation {
		static MAX_EMAIL_LENGTH = 254;
		static MAX_LOCAL_LENGTH = 64;
		static LOCAL_ALLOWED_CHARS = /^[\w%+.ЁА-яё-]+$/;
		static DOMAIN_LABEL_CHARS = /^[\w.ЁА-яё-]+$/;
		static isEmail(email) {
			if (!Type.isStringFilled(email)) {
				return false;
			}
			if (email.length > Validation.MAX_EMAIL_LENGTH) {
				return false;
			}
			const atPos = email.indexOf('@');
			if (atPos <= 0 || atPos === email.length - 1 || email.includes('@', atPos + 1)) {
				return false;
			}
			const local = email.slice(0, atPos);
			const domain = email.slice(atPos + 1);
			if (!Validation.LOCAL_ALLOWED_CHARS.test(local)) {
				return false;
			}
			if (local.startsWith('.') || local.endsWith('.') || local.startsWith('-') || local.endsWith('-') || local.includes('..') || local.length > Validation.MAX_LOCAL_LENGTH) {
				return false;
			}
			if (!Validation.DOMAIN_LABEL_CHARS.test(domain)) {
				return false;
			}
			if (domain.startsWith('.') || domain.endsWith('.') || domain.includes('..')) {
				return false;
			}
			const labels = domain.split('.');
			if (labels.length < 2) {
				return false;
			}
			const tld = labels[labels.length - 1];
			if (tld.length < 2 || tld.length > 24) {
				return false;
			}
			for (const label of labels) {
				if (label.startsWith('-') || label.endsWith('-')) {
					return false;
				}
				const startsWithLetterOrDigit = /^[\dA-Za-zЁА-яё]/.test(label);
				const endsWithLetterOrDigit = /[\dA-Za-zЁА-яё]$/.test(label);
				if (!startsWithLetterOrDigit || !endsWithLetterOrDigit) {
					return false;
				}
			}
			return true;
		}
	}

	class BaseCache {
		storage = new Map();
		get(key, defaultValue) {
			if (!this.storage.has(key)) {
				if (Type.isFunction(defaultValue)) {
					return defaultValue();
				}
				if (!Type.isUndefined(defaultValue)) {
					return defaultValue;
				}
			}
			return this.storage.get(key);
		}
		set(key, value) {
			this.storage.set(key, value);
		}
		delete(key) {
			this.storage.delete(key);
		}
		has(key) {
			return this.storage.has(key);
		}
		remember(key, defaultValue) {
			if (!this.storage.has(key)) {
				if (Type.isFunction(defaultValue)) {
					this.storage.set(key, defaultValue());
				} else if (!Type.isUndefined(defaultValue)) {
					this.storage.set(key, defaultValue);
				}
			}
			return this.storage.get(key);
		}
		size() {
			return this.storage.size;
		}
		keys() {
			return [...this.storage.keys()];
		}
		values() {
			return [...this.storage.values()];
		}
	}

	var MemoryStorage = Map;

	class MemoryCache extends BaseCache {
		storage = new MemoryStorage();
	}

	class LsStorage {
		stackKey = 'BX.Cache.Storage.LsStorage.stack';
		stack = null;
		getStack() {
			if (Type.isPlainObject(this.stack)) {
				return this.stack;
			}
			const stack = localStorage.getItem(this.stackKey);
			if (Type.isString(stack) && stack !== '') {
				const parsedStack = JSON.parse(stack);
				if (Type.isPlainObject(parsedStack)) {
					this.stack = parsedStack;
					return this.stack;
				}
			}
			this.stack = {};
			return this.stack;
		}
		saveStack() {
			if (Type.isPlainObject(this.stack)) {
				const preparedStack = JSON.stringify(this.stack);
				localStorage.setItem(this.stackKey, preparedStack);
			}
		}
		get(key) {
			const stack = this.getStack();
			return stack[key];
		}
		set(key, value) {
			const stack = this.getStack();
			stack[key] = value;
			this.saveStack();
		}
		delete(key) {
			const stack = this.getStack();
			if (key in stack) {
				delete stack[key];
			}
		}
		has(key) {
			const stack = this.getStack();
			return key in stack;
		}
		get size() {
			const stack = this.getStack();
			return Object.keys(stack).length;
		}
		keys() {
			const stack = this.getStack();
			return Object.keys(stack);
		}
		values() {
			const stack = this.getStack();
			return Object.values(stack);
		}
	}

	class LocalStorageCache extends BaseCache {
		storage = new LsStorage();
	}

	class Cache {
		static BaseCache = BaseCache;
		static MemoryCache = MemoryCache;
		static LocalStorageCache = LocalStorageCache;
	}

	function _classPrivateMethodInitSpec(e, a) { _checkPrivateRedeclaration(e, a), a.add(e); }
	function _checkPrivateRedeclaration(e, t) { if (t.has(e)) throw new TypeError("Cannot initialize the same private elements twice on an object"); }
	function _assertClassBrand(e, t, n) { if ("function" == typeof e ? e === t : e.has(t)) return arguments.length < 3 ? t : n; throw new TypeError("Private element is not present on this object"); }
	var _OrderedArray_brand = new WeakSet();
	let OrderedArray = function () {
		function OrderedArray(comparator = null) {
			babelHelpers.classCallCheck(this, OrderedArray);
			_classPrivateMethodInitSpec(this, _OrderedArray_brand);
			babelHelpers.defineProperty(this, "comparator", null);
			babelHelpers.defineProperty(this, "items", []);
			this.comparator = Type.isFunction(comparator) ? comparator : null;
		}
		return babelHelpers.createClass(OrderedArray, [{
			key: "add",
			value: function add(item) {
				let index = -1;
				if (this.comparator) {
					index = _assertClassBrand(_OrderedArray_brand, this, _searchIndexToInsert).call(this, item);
					this.items.splice(index, 0, item);
				} else {
					this.items.push(item);
				}
				return index;
			}
		}, {
			key: "has",
			value: function has(item) {
				return this.items.includes(item);
			}
		}, {
			key: "getIndex",
			value: function getIndex(item) {
				return this.items.indexOf(item);
			}
		}, {
			key: "getByIndex",
			value: function getByIndex(index) {
				if (Type.isNumber(index) && index >= 0) {
					const item = this.items[index];
					return Type.isUndefined(item) ? null : item;
				}
				return null;
			}
		}, {
			key: "getFirst",
			value: function getFirst() {
				const first = this.items[0];
				return Type.isUndefined(first) ? null : first;
			}
		}, {
			key: "getLast",
			value: function getLast() {
				const last = this.items[this.count() - 1];
				return Type.isUndefined(last) ? null : last;
			}
		}, {
			key: "count",
			value: function count() {
				return this.items.length;
			}
		}, {
			key: "delete",
			value: function _delete(item) {
				const index = this.getIndex(item);
				if (index !== -1) {
					this.items.splice(index, 1);
					return true;
				}
				return false;
			}
		}, {
			key: "clear",
			value: function clear() {
				this.items = [];
			}
		}, {
			key: Symbol.iterator,
			value: function () {
				return this.items[Symbol.iterator]();
			}
		}, {
			key: "forEach",
			value: function forEach(callbackfn, thisArg) {
				const callback = thisArg ? callbackfn.bind(thisArg) : callbackfn;
				this.items.forEach((value, index, array) => {
					callback(value, index, array);
				});
			}
		}, {
			key: "getAll",
			value: function getAll() {
				return this.items;
			}
		}, {
			key: "getComparator",
			value: function getComparator() {
				return this.comparator;
			}
		}, {
			key: "sort",
			value: function sort() {
				const comparator = this.getComparator();
				if (comparator === null) {
					return;
				}
				const length = this.items.length;
				const indexes = Array.from({
					length
				}, (_, i) => i);
				indexes.sort((index1, index2) => {
					return comparator(this.items[index1], this.items[index2]) || index1 - index2;
				});
				for (let i = 0; i < length; i++) {
					indexes[i] = this.items[indexes[i]];
				}
				for (let i = 0; i < length; i++) {
					this.items[i] = indexes[i];
				}
			}
		}]);
	}();
	function _searchIndexToInsert(value) {
		let low = 0;
		let high = this.items.length;
		while (low < high) {
			const mid = Math.floor((low + high) / 2);
			if (this.comparator(this.items[mid], value) >= 0) {
				high = mid;
			} else {
				low = mid + 1;
			}
		}
		return low;
	}

	class ZIndexComponent extends EventEmitter {
		sort = 0;
		alwaysOnTop = false;
		zIndex = 0;
		element = null;
		overlay = null;
		overlayGap = -5;
		stack = null;
		constructor(element, componentOptions = {}) {
			super();
			this.setEventNamespace('BX.Main.ZIndexManager.Component');
			if (!Type.isElementNode(element)) {
				throw new Error("ZIndexManager.Component: The argument 'element' must be a DOM element.");
			}
			this.element = element;
			const options = Type.isPlainObject(componentOptions) ? componentOptions : {};
			this.setAlwaysOnTop(options.alwaysOnTop);
			this.setOverlay(options.overlay);
			this.setOverlayGap(options.overlayGap);
			this.subscribeFromOptions(options.events);
		}
		getSort() {
			return this.sort;
		}
		setSort(sort) {
			if (Type.isNumber(sort)) {
				this.sort = sort;
			}
		}
		setStack(stack) {
			this.stack = stack;
		}
		getStack() {
			return this.stack;
		}
		getZIndex() {
			return this.zIndex;
		}
		setZIndex(zIndex) {
			const changed = this.getZIndex() !== zIndex;
			this.getElement().style.setProperty('z-index', String(zIndex), 'important');
			this.zIndex = zIndex;
			if (this.getOverlay() !== null) {
				this.getOverlay().style.setProperty('z-index', String(zIndex + this.getOverlayGap()), 'important');
			}
			if (changed) {
				this.emit('onZIndexChange', {
					component: this
				});
			}
		}
		getAlwaysOnTop() {
			return this.alwaysOnTop;
		}
		setAlwaysOnTop(value) {
			if (Type.isNumber(value) || Type.isBoolean(value)) {
				this.alwaysOnTop = value;
			}
		}
		getElement() {
			return this.element;
		}
		setOverlay(overlay, gap) {
			if (Type.isElementNode(overlay) || overlay === null) {
				this.overlay = overlay;
				this.setOverlayGap(gap);
				if (this.getStack()) {
					this.getStack().sort();
				}
			}
		}
		getOverlay() {
			return this.overlay;
		}
		setOverlayGap(gap) {
			if (Type.isNumber(gap)) {
				this.overlayGap = gap;
			}
		}
		getOverlayGap() {
			return this.overlayGap;
		}
	}

	class ZIndexStack {
		container;
		components;
		elements = new WeakMap();
		baseIndex = 1000;
		baseStep = 50;
		sortCount = 0;
		constructor(container) {
			if (!Type.isDomNode(container)) {
				throw new Error("ZIndexManager.Stack: The 'container' argument must be a DOM element.");
			}
			this.container = container;
			const comparator = (componentA, componentB) => {
				let result = (Number(componentA.getAlwaysOnTop()) || 0) - (Number(componentB.getAlwaysOnTop()) || 0);
				if (!result) {
					result = componentA.getSort() - componentB.getSort();
				}
				return result;
			};
			this.components = new OrderedArray(comparator);
		}
		getBaseIndex() {
			return this.baseIndex;
		}
		setBaseIndex(index) {
			if (Type.isNumber(index) && index >= 0) {
				this.baseIndex = index;
				this.sort();
			}
		}
		setBaseStep(step) {
			if (Type.isNumber(step) && step > 0) {
				this.baseStep = step;
				this.sort();
			}
		}
		getBaseStep() {
			return this.baseStep;
		}
		register(element, options = {}) {
			if (this.getComponent(element)) {
				console.warn('ZIndexManager: You cannot register the element twice.', element);
				return this.getComponent(element);
			}
			const component = new ZIndexComponent(element, options);
			component.setStack(this);
			component.setSort(++this.sortCount);
			this.elements.set(element, component);
			this.components.add(component);
			this.sort();
			return component;
		}
		unregister(element) {
			const component = this.elements.get(element);
			this.components.delete(component);
			this.elements.delete(element);
			this.sort();
		}
		getComponent(element) {
			return this.elements.get(element) || null;
		}
		getComponents() {
			return this.components.getAll();
		}
		getMaxZIndex() {
			const last = this.components.getLast();
			return last ? last.getZIndex() : this.baseIndex;
		}
		sort() {
			this.components.sort();
			let zIndex = this.baseIndex;
			this.components.forEach(component => {
				component.setZIndex(zIndex);
				zIndex += this.baseStep;
			});
		}
		bringToFront(element) {
			const component = this.getComponent(element);
			if (!component) {
				console.error('ZIndexManager: element was not found in the stack.', element);
				return null;
			}
			component.setSort(++this.sortCount);
			this.sort();
			return component;
		}
	}

	class ZIndexManager {
		static stacks = new WeakMap();
		static register(element, options = {}) {
			const parentNode = this.#getParentNode(element);
			if (!parentNode) {
				return null;
			}
			const stack = this.getOrAddStack(parentNode);
			return stack.register(element, options);
		}
		static unregister(element) {
			const parentNode = this.#getParentNode(element);
			const stack = this.getStack(parentNode);
			if (stack) {
				stack.unregister(element);
			}
		}
		static addStack(container) {
			const stack = new ZIndexStack(container);
			this.stacks.set(container, stack);
			return stack;
		}
		static getStack(container) {
			return this.stacks.get(container) || null;
		}
		static getOrAddStack(container) {
			return this.getStack(container) || this.addStack(container);
		}
		static getComponent(element) {
			const parentNode = this.#getParentNode(element, true);
			if (!parentNode) {
				return null;
			}
			const stack = this.getStack(parentNode);
			return stack ? stack.getComponent(element) : null;
		}
		static bringToFront(element) {
			const parentNode = this.#getParentNode(element);
			const stack = this.getStack(parentNode);
			if (stack) {
				return stack.bringToFront(element);
			}
			return null;
		}
		static #getParentNode(element, suppressWarnings = false) {
			if (!Type.isElementNode(element)) {
				if (!suppressWarnings) {
					console.error("ZIndexManager: The argument 'element' must be a DOM element.", element);
				}
				return null;
			}
			if (!Type.isElementNode(element.parentNode)) {
				if (!suppressWarnings) {
					console.error("ZIndexManager: The 'element' doesn't have a parent node.", element);
				}
				return null;
			}
			return element.parentNode;
		}
	}

	function convertPath(path) {
		if (Type.isStringFilled(path)) {
			return path.split('.').reduce((acc, item) => {
				item.split(/\[["']?(.+?)["']?]/g).forEach(key => {
					if (Type.isStringFilled(key)) {
						acc.push(key);
					}
				});
				return acc;
			}, []);
		}
		return [];
	}

	class SettingsCollection {
		constructor(options = {}) {
			if (Type.isPlainObject(options)) {
				Object.assign(this, options);
			}
		}
		get(path, defaultValue = null) {
			const convertedPath = convertPath(path);
			return convertedPath.reduce((acc, key) => {
				if (!Type.isNil(acc) && acc !== defaultValue) {
					if (!Type.isUndefined(acc[key])) {
						return acc[key];
					}
					return defaultValue;
				}
				return acc;
			}, this);
		}
	}

	function deepFreeze(target) {
		if (Type.isObject(target)) {
			Object.values(target).forEach(value => {
				deepFreeze(value);
			});
			return Object.freeze(target);
		}
		return target;
	}

	const settingsStorage = new Map();
	class Extension {
		static getSettings(extensionName) {
			if (Type.isStringFilled(extensionName)) {
				if (settingsStorage.has(extensionName)) {
					return settingsStorage.get(extensionName);
				}
				const settingsScriptNode = document.querySelector(`script[data-extension="${extensionName}"]`);
				if (Type.isDomNode(settingsScriptNode)) {
					const decodedSettings = (() => {
						try {
							return new SettingsCollection(JSON.parse(settingsScriptNode.innerHTML));
						} catch {
							return new SettingsCollection();
						}
					})();
					const frozenSettings = deepFreeze(decodedSettings);
					settingsStorage.set(extensionName, frozenSettings);
					return frozenSettings;
				}
			}
			return deepFreeze(new SettingsCollection());
		}
	}

	const IS_WEAK_REF_SUPPORTED = typeof WeakRef !== 'undefined';
	class WeakRefMap {
		#refs = new Map();
		#registry = null;
		constructor() {
			if (IS_WEAK_REF_SUPPORTED) {
				this.#registry = new FinalizationRegistry(this.#cleanupCallback.bind(this));
			}
		}
		clear() {
			if (!IS_WEAK_REF_SUPPORTED) {
				this.#refs.clear();
				return;
			}
			this.#refs.forEach(ref => {
				const value = ref.deref();
				if (!Type.isUndefined(value)) {
					this.#registry.unregister(value);
				}
			});
			this.#refs.clear();
		}
		delete(key) {
			if (!IS_WEAK_REF_SUPPORTED) {
				return this.#refs.delete(key);
			}
			const value = this.get(key);
			if (!Type.isUndefined(value)) {
				this.#registry.unregister(value);
			}
			return this.#refs.delete(key);
		}
		get(key) {
			if (!IS_WEAK_REF_SUPPORTED) {
				return this.#refs.get(key);
			}
			return this.#refs.get(key)?.deref();
		}
		has(key) {
			if (!IS_WEAK_REF_SUPPORTED) {
				return this.#refs.has(key);
			}
			return !Type.isUndefined(this.#refs.get(key)?.deref());
		}
		set(key, value) {
			if (!IS_WEAK_REF_SUPPORTED) {
				this.#refs.set(key, value);
				return this;
			}
			this.#refs.set(key, new WeakRef(value));
			this.#registry.register(value, key, value);
			return this;
		}
		#cleanupCallback(key) {
			const ref = this.#refs.get(key);
			if (ref && !ref.deref()) {
				this.#refs.delete(key);
			}
		}
	}

	var collections = {
		OrderedArray,
		SettingsCollection,
		WeakRefMap
	};

	class Transition {
		static linear(progress) {
			return progress;
		}
		static quad(progress) {
			return progress ** 2;
		}
		static cubic(progress) {
			return progress ** 3;
		}
		static quart(progress) {
			return progress ** 4;
		}
		static quint(progress) {
			return progress ** 5;
		}
		static circ(progress) {
			return 1 - Math.sin(Math.acos(progress));
		}
		static back(progress) {
			return progress ** 2 * ((1.5 + 1) * progress - 1.5);
		}
		static elasti(progress) {
			return 2 ** (10 * (progress - 1)) * Math.cos(20 * Math.PI * 1.5 / 3 * progress);
		}
		static bounce(progress) {
			for (let a = 0, b = 1;; a += b, b /= 2) {
				if (progress >= (7 - 4 * a) / 11) {
					return -(((11 - 6 * a - 11 * progress) / 4) ** 2) + b ** 2;
				}
			}
		}
	}

	class Easing {
		#duration = 1000;
		#transition = Transition.linear;
		#begin = null;
		#step = null;
		#complete = null;
		#start = {};
		#finish = {};
		#currentState = {};
		#progress = null;
		#timer = null;
		#options = null;
		constructor(easingOptions) {
			this.setOptions(easingOptions);
		}
		setOptions(easingOptions) {
			const options = Type.isPlainObject(easingOptions) ? easingOptions : {};
			this.#duration = Type.isNumber(options.duration) && options.duration > 0 ? options.duration : this.#duration;
			this.#begin = Type.isFunction(options.begin) || options.begin === null ? options.begin : this.#begin;
			this.#step = Type.isFunction(options.step) || options.step === null ? options.step : this.#step;
			this.#complete = Type.isFunction(options.complete) || options.complete === null ? options.complete : this.#complete;
			this.#progress = Type.isFunction(options.progress) || options.progress === null ? options.progress : this.#progress;
			this.#start = Type.isPlainObject(options.start) ? {
				...options.start
			} : this.#start;
			this.#finish = Type.isPlainObject(options.finish) ? {
				...options.finish
			} : this.#finish;
		}
		setTransition(transition) {
			if (Type.isFunction(transition)) {
				this.#transition = transition;
			} else if (Type.isStringFilled(transition)) {
				let funcName = transition;
				let decorator = null;
				if (transition.startsWith('ease-out-')) {
					funcName = funcName.replace('ease-out-', '');
					decorator = Easing.makeEaseOut;
				} else if (transition.startsWith('ease-in-out-')) {
					funcName = funcName.replace('ease-in-out-', '');
					decorator = Easing.makeEaseInOut;
				}
				if (Type.isFunction(Transition[funcName])) {
					this.#transition = decorator === null ? Transition[funcName] : decorator(Transition[funcName]);
				}
			}
		}
		animateProgress() {
			this.#animate();
		}
		animate() {
			this.#progress = progress => {
				this.#currentState = {};
				for (const propName of Object.keys(this.#start)) {
					this.#currentState[propName] = Math.round(this.#start[propName] + (this.#finish[propName] - this.#start[propName]) * progress);
				}
				if (this.#step !== null) {
					this.#step(this.#currentState);
				}
			};
			this.#animate();
		}
		#animate() {
			for (const propName of Object.keys(this.#start)) {
				if (Type.isUndefined(this.#finish[propName])) {
					delete this.#start[propName];
				}
			}
			let start = null;
			const animation = time => {
				if (start === null) {
					start = time;
				}
				let progress = (time - start) / this.#duration;
				if (progress > 1) {
					progress = 1;
				}
				const delta = this.#transition(progress);
				this.#progress(delta);
				if (progress === 1) {
					this.stop(true);
				} else {
					this.#timer = requestAnimationFrame(animation);
				}
			};
			if (this.#begin !== null) {
				this.#begin(this.#currentState);
			}
			this.#timer = requestAnimationFrame(animation);
		}
		get options() {
			if (this.#options === null) {
				this.#options = new Proxy(this, {
					get(target, property, receiver) {
						switch (property) {
							case 'transition':
								return target.#transition;
							case 'start':
								return target.#start;
							case 'finish':
								return target.#finish;
							case 'duration':
								return target.#duration;
							default:
								return null;
						}
					},
					set(target, property, value, receiver) {
						target.setOptions({
							[property]: value
						});
						return true;
					}
				});
			}
			return this.#options;
		}
		stop(completed = false) {
			if (this.#timer !== null) {
				cancelAnimationFrame(this.#timer);
				this.#timer = null;
				if (completed && this.#complete !== null) {
					this.#complete(this.#currentState);
				}
			}
		}
		static makeEaseInOut(delta) {
			return progress => {
				if (progress < 0.5) {
					return delta(2 * progress) / 2;
				}
				return (2 - delta(2 * (1 - progress))) / 2;
			};
		}
		static makeEaseOut(delta) {
			return progress => {
				return 1 - delta(1 - progress);
			};
		}
		static get transitions() {
			return Transition;
		}
	}

	class LocalStorage {
		#prefix = null;
		constructor(storageOptions = {}) {
			const options = Type.isPlainObject(storageOptions) ? storageOptions : {};
			this.#setPrefix(options.prefix);
			Event.bind(window, 'storage', this.#handleStorageChange.bind(this));
			setInterval(this.#clear.bind(this), 5000);
		}
		set(key, value, ttl = 60) {
			if (!Type.isStringFilled(key) || Type.isNil(value)) {
				return false;
			}
			try {
				window.localStorage.setItem(this.getPrefix() + key, `${Math.round(Date.now() / 1000) + ttl}:${this.#encode(value)}`);
			} catch {
				console.error('LocalStorage error', key, ttl);
				return false;
			}
			return true;
		}
		get(key) {
			const storageValue = window.localStorage.getItem(this.getPrefix() + key);
			if (storageValue) {
				const valueParts = this.#parseValue(storageValue);
				if (valueParts === null) {
					return null;
				}
				const [ttl, value] = valueParts;
				if (Date.now() <= ttl) {
					return this.#decode(value);
				}
				this.remove(key);
			}
			return null;
		}
		remove(key) {
			window.localStorage.removeItem(this.getPrefix() + key);
		}
		getPrefix() {
			if (this.#prefix === null) {
				const userId = Loc.hasMessage('USER_ID') ? Loc.getMessage('USER_ID') : '';
				const siteId = Loc.hasMessage('SITE_ID') ? Loc.getMessage('SITE_ID') : 'admin';
				this.#prefix = `${this.getBasePrefix()}${userId}-${siteId}-`;
			}
			return this.#prefix;
		}
		getBasePrefix() {
			return 'bx';
		}
		#setPrefix(prefix) {
			if (Type.isString(prefix)) {
				this.#prefix = `${this.getBasePrefix()}-${prefix}`;
			}
		}
		#handleStorageChange(event) {
			if (!Type.isStringFilled(event.key) || !event.key.startsWith(this.getPrefix())) {
				return;
			}
			const key = event.key.slice(this.getPrefix().length);
			const value = this.#getRealValue(event.newValue);
			const oldValue = this.#getRealValue(event.oldValue);
			const data = {
				key,
				value,
				oldValue
			};
			if (key === 'BXGCE') {
				if (value) {
					const val = data.value;
					EventEmitter.emit(val.e, new BaseEvent({
						data: val.p,
						compatData: val.p
					}));
				}
			} else {
				if (event.newValue) {
					EventEmitter.emit('onLocalStorageSet', new BaseEvent({
						data: [data],
						compatData: [data]
					}));
				}
				if (event.oldValue && !event.newValue) {
					EventEmitter.emit('onLocalStorageRemove', new BaseEvent({
						data: [data],
						compatData: [data]
					}));
				}
				EventEmitter.emit('onLocalStorageChange', new BaseEvent({
					data: [data],
					compatData: [data]
				}));
			}
		}
		#clear() {
			const curDate = Date.now();
			for (let i = 0; i < window.localStorage.length; i++) {
				const key = window.localStorage.key(i);
				if (key !== null && key.startsWith(this.getBasePrefix())) {
					const value = window.localStorage.getItem(key);
					const valueParts = this.#parseValue(value);
					if (valueParts === null) {
						continue;
					}
					const [ttl] = valueParts;
					if (curDate >= ttl) {
						window.localStorage.removeItem(key);
					}
				}
			}
		}
		#encode(value) {
			if (Type.isJsonValue(value)) {
				return JSON.stringify(value);
			}
			return value.toString();
		}
		#decode(value) {
			let result = null;
			if (Type.isStringFilled(value)) {
				try {
					result = JSON.parse(value);
				} catch {
					result = value;
				}
			}
			return result;
		}
		#getRealValue(value) {
			const valueParts = this.#parseValue(value);
			if (valueParts === null) {
				return null;
			}
			return this.#decode(valueParts[1]);
		}
		#parseValue(value) {
			if (!this.#isValueValid(value)) {
				return null;
			}
			const [ttl] = value.split(':', 1);
			const realValue = value.slice(ttl.length + 1);
			return [parseInt(ttl, 10) * 1000, realValue];
		}
		#isValueValid(value) {
			return Type.isStringFilled(value) && /^\d{10}:/.test(value);
		}
	}
	const localStorage$1 = new LocalStorage();

	class Page {
		static getRootWindow() {
			return this.getTopWindowOfCurrentHost(window);
		}
		static isCrossOriginObject(currentWindow) {
			try {
				void currentWindow.location.host;
			} catch {
				return true;
			}
			return false;
		}
		static getTopWindowOfCurrentHost(currentWindow) {
			if (!this.isCrossOriginObject(currentWindow.parent) && currentWindow.parent !== currentWindow && currentWindow.parent.location.host === currentWindow.location.host) {
				return this.getTopWindowOfCurrentHost(currentWindow.parent);
			}
			return currentWindow;
		}
		static getParentWindowOfCurrentHost(currentWindow) {
			if (this.isCrossOriginObject(currentWindow.parent)) {
				return currentWindow;
			}
			return currentWindow.parent;
		}
		static redirect(redirectUrl, redirectOptions = {}) {
			if (!Type.isStringFilled(redirectUrl)) {
				throw new Error('Redirect: "url" must be a non-empty string.');
			}
			const rootWindow = this.getRootWindow();
			let url = null;
			try {
				url = new URL(redirectUrl, rootWindow.location.origin);
			} catch {
				throw new Error(`Redirect: invalid URL: ${redirectUrl}`);
			}
			const options = Type.isPlainObject(redirectOptions) ? redirectOptions : {};
			if (!this.#isSafeUrl(url, options.allowedOrigins)) {
				console.error(`Redirect: blocked potentially unsafe URL: ${url}`);
				return;
			}
			const wholeUrl = url.toString();
			if (options.newTab === true) {
				const win = rootWindow.open(wholeUrl, '_blank', 'noopener,noreferrer');
				if (win) {
					win.opener = null;
				}
				return;
			}
			if (options.replaceHistory === true) {
				rootWindow.location.replace(wholeUrl);
			} else {
				rootWindow.location.assign(wholeUrl);
			}
		}
		static reload() {
			const rootWindow = this.getRootWindow();
			rootWindow.location.reload();
		}
		static #isSafeUrl(url, allowedOrigins = []) {
			if (!(url instanceof URL)) {
				return false;
			}
			const allowedProtocols = ['http:', 'https:'];
			if (!allowedProtocols.includes(url.protocol)) {
				return false;
			}
			const rootWindow = this.getRootWindow();
			if (url.origin === rootWindow.location.origin) {
				return true;
			}
			if (Type.isArray(allowedOrigins) && allowedOrigins.length > 0) {
				return allowedOrigins.includes(url.origin);
			}
			return false;
		}
	}

	function getElement(element) {
		if (Type.isString(element)) {
			return document.getElementById(element);
		}
		return element;
	}

	function getWindow(element) {
		if (Type.isElementNode(element)) {
			return element.ownerDocument.parentWindow || element.ownerDocument.defaultView || window;
		}
		if (Type.isDomNode(element)) {
			return element.parentWindow || element.defaultView || window;
		}
		return window;
	}

	class FX {
		#easing = null;
		constructor(options) {
			const fxOptions = Type.isPlainObject(options) ? options : {};
			const callback = Type.isFunction(fxOptions.callback) ? fxOptions.callback : null;
			const callbackStart = Type.isFunction(fxOptions.callback_start) ? fxOptions.callback_start : null;
			const callbackComplete = Type.isFunction(fxOptions.callback_complete) ? fxOptions.callback_complete : null;
			const easingOptions = {
				transition: 'linear',
				duration: Type.isNumber(fxOptions.time) && fxOptions.time > 0 ? fxOptions.time * 1000 : 1000,
				begin: state => {
					if (callbackStart !== null) {
						callbackStart(Type.isUndefined(state._param) ? state : state._param);
					}
				},
				step: state => {
					if (callback !== null) {
						callback(Type.isUndefined(state._param) ? state : state._param);
					}
				},
				complete: state => {
					if (callbackComplete !== null) {
						callbackComplete(Type.isUndefined(state._param) ? state : state._param);
					}
				}
			};
			if (Type.isPlainObject(fxOptions.start)) {
				easingOptions.start = fxOptions.start;
				easingOptions.finish = fxOptions.finish;
			} else {
				easingOptions.start = {
					_param: fxOptions.start
				};
				easingOptions.finish = {
					_param: fxOptions.finish
				};
			}
			if (fxOptions.type === 'accelerated') {
				easingOptions.transition = 'quint';
			} else if (fxOptions.type === 'decelerated') {
				fxOptions.transition = 'ease-out-quint';
			}
			this.#easing = new Easing(easingOptions);
		}
		start() {
			this.#easing.animate();
			return this;
		}
		stop(silent = false) {
			this.#easing.stop(silent);
		}
		pause() {
		}
		static hide(el, type, opts) {
			return this.#toggle('hide', el, type, opts);
		}
		static show(el, type, opts) {
			return this.#toggle('show', el, type, opts);
		}
		static #toggle(mode, el, type, opts) {
			let options = {};
			let effect = null;
			const element = Type.isStringFilled(el) ? document.getElementById(el) : el;
			if (Type.isPlainObject(type) && Type.isNil(opts)) {
				options = type;
				effect = options.type;
			} else if (Type.isPlainObject(opts)) {
				options = opts;
				effect = type;
			}
			if (!Type.isStringFilled(effect)) {
				Dom.style(element, 'display', mode === 'show' ? 'block' : 'none');
				return undefined;
			}
			const fxOptions = effect === 'scroll' ? this.#scroll(element, options, mode) : this.#fade(element, options, mode);
			fxOptions.callback_complete = () => {
				if (options.show !== false && options.hide !== false) {
					Dom.style(element, 'display', mode === 'show' ? 'block' : 'none');
				}
				if (options.callback_complete) {
					options.callback_complete();
				}
			};
			return new FX(fxOptions).start();
		}
		static #scroll(el, opts, mode) {
			const param = opts.direction === 'horizontal' ? 'width' : 'height';
			let currentValue = parseInt(String(Dom.style(el, param)), 10);
			if (Number.isNaN(currentValue)) {
				currentValue = Dom.getPosition(el)[param];
			}
			const start = currentValue;
			const finish = opts.min_height ? parseInt(opts.min_height, 10) : 0;
			return {
				start,
				finish,
				time: opts.time || 1,
				type: 'linear',
				callback_start: () => {
					if (Dom.style(el, 'position') === 'static') {
						Dom.style(el, 'position', 'relative');
					}
					Dom.style(el, 'overflow', 'hidden');
					Dom.style(el, param, `${start}px`);
					Dom.style(el, 'display', 'block');
				},
				callback: value => {
					Dom.style(el, param, `${value}px`);
				}
			};
		}
		static #fade(element, opts, mode) {
			return {
				time: opts.time || 1,
				type: mode === 'show' ? 'linear' : 'decelerated',
				start: mode === 'show' ? 0 : 100,
				finish: mode === 'show' ? 100 : 0,
				callback_start: () => {
					Dom.style(element, 'display', 'block');
				},
				callback: val => {
					Dom.style(element, 'opacity', val / 100);
				}
			};
		}
	}

	const {
		getClass,
		namespace
	} = Reflection;
	const message = message$1;
	const easing = Easing;
	const fx = FX;
	const PageObject = Page;
	const {
		replace,
		remove,
		clean,
		insertBefore,
		insertAfter,
		append,
		prepend,
		style,
		adjust,
		create,
		isShown
	} = Dom;
	const addClass = function addClass() {
		Dom.addClass(...Runtime.merge([], Array.from(arguments), [getElement(arguments[0])]));
	};
	const removeClass = function removeClass() {
		Dom.removeClass(...Runtime.merge(Array.from(arguments), [getElement(arguments[0])]));
	};
	const hasClass = function hasClass() {
		return Dom.hasClass(...Runtime.merge(Array.from(arguments), [getElement(arguments[0])]));
	};
	const toggleClass = function toggleClass() {
		Dom.toggleClass(...Runtime.merge(Array.from(arguments), [getElement(arguments[0])]));
	};
	const cleanNode = (element, removeElement = false) => {
		const currentElement = getElement(element);
		if (Type.isDomNode(currentElement)) {
			Dom.clean(currentElement);
			if (removeElement) {
				Dom.remove(currentElement);
				return currentElement;
			}
		}
		return currentElement;
	};
	const getCookie = Http.Cookie.get;
	const setCookie = (name, value, options = {}) => {
		const attributes = {
			...options
		};
		if (Type.isNumber(attributes.expires)) {
			attributes.expires /= 3600 * 24;
		}
		Http.Cookie.set(name, value, attributes);
	};
	const {
		bind,
		unbind,
		unbindAll,
		bindOnce,
		ready
	} = Event;
	const {
		debugState: debugEnableFlag,
		isDebugEnabled: debugStatus,
		default: debug
	} = debugNs;
	const debugEnable = value => {
		if (value) {
			enableDebug();
		} else {
			disableDebug();
		}
	};
	const {
		clone,
		loadExtension: loadExt,
		debounce,
		throttle,
		html
	} = Runtime;
	const type = {
		...Object.getOwnPropertyNames(Type).filter(key => !['name', 'length', 'prototype', 'caller', 'arguments'].includes(key)).reduce((acc, key) => {
			acc[key] = Type[key];
			return acc;
		}, {}),
		isNotEmptyString: value => Type.isString(value) && value !== '',
		isNotEmptyObject: value => Type.isObjectLike(value) && Object.keys(value).length > 0,
		isMapKey: Type.isObject,
		stringToInt: value => {
			const parsed = parseInt(value);
			return !Number.isNaN(parsed) ? parsed : 0;
		}
	};
	const browser = {
		IsOpera: Browser.isOpera,
		IsIE: Browser.isIE,
		IsIE6: Browser.isIE6,
		IsIE7: Browser.isIE7,
		IsIE8: Browser.isIE8,
		IsIE9: Browser.isIE9,
		IsIE10: Browser.isIE10,
		IsIE11: Browser.isIE11,
		IsSafari: Browser.isSafari,
		IsFirefox: Browser.isFirefox,
		IsChrome: Browser.isChrome,
		DetectIeVersion: Browser.detectIEVersion,
		IsMac: Browser.isMac,
		IsAndroid: Browser.isAndroid,
		isIPad: Browser.isIPad,
		isIPhone: Browser.isIPhone,
		IsIOS: Browser.isIOS,
		IsMobile: Browser.isMobile,
		isRetina: Browser.isRetina,
		IsDoctype: Browser.isDoctype,
		SupportLocalStorage: Browser.isLocalStorageSupported,
		addGlobalClass: Browser.addGlobalClass,
		DetectAndroidVersion: Browser.detectAndroidVersion,
		isPropertySupported: Browser.isPropertySupported,
		addGlobalFeatures: Browser.addGlobalFeatures
	};
	const ajax = window.BX ? window.BX.ajax : () => {};
	function GetWindowScrollSize(doc = document) {
		return {
			scrollWidth: doc.documentElement.scrollWidth,
			scrollHeight: doc.documentElement.scrollHeight
		};
	}
	function GetWindowScrollPos(doc = document) {
		const win = getWindow(doc);
		return {
			scrollLeft: win.pageXOffset,
			scrollTop: win.pageYOffset
		};
	}
	function GetWindowInnerSize(doc = document) {
		const win = getWindow(doc);
		return {
			innerWidth: win.innerWidth,
			innerHeight: win.innerHeight
		};
	}
	function GetWindowSize(doc = document) {
		return {
			...GetWindowInnerSize(doc),
			...GetWindowScrollPos(doc),
			...GetWindowScrollSize(doc)
		};
	}
	function GetContext(node) {
		return getWindow(node);
	}
	function pos(element, relative = false) {
		if (!element) {
			return new DOMRect().toJSON();
		}
		if (element.ownerDocument === document && !relative) {
			const clientRect = element.getBoundingClientRect();
			const root = document.documentElement;
			const {
				body
			} = document;
			return {
				top: Math.round(clientRect.top + (root.scrollTop || body.scrollTop)),
				left: Math.round(clientRect.left + (root.scrollLeft || body.scrollLeft)),
				width: Math.round(clientRect.right - clientRect.left),
				height: Math.round(clientRect.bottom - clientRect.top),
				right: Math.round(clientRect.right + (root.scrollLeft || body.scrollLeft)),
				bottom: Math.round(clientRect.bottom + (root.scrollTop || body.scrollTop))
			};
		}
		let x = 0;
		let y = 0;
		const w = element.offsetWidth;
		const h = element.offsetHeight;
		let first = true;
		for (; element != null; element = element.offsetParent) {
			if (!first && relative && window.BX.is_relative(element)) {
				break;
			}
			x += element.offsetLeft;
			y += element.offsetTop;
			if (first) {
				first = false;
				continue;
			}
			x += Text.toNumber(Dom.style(element, 'border-left-width'));
			y += Text.toNumber(Dom.style(element, 'border-top-width'));
		}
		return new DOMRect(x, y, w, h).toJSON();
	}
	function addCustomEvent(eventObject, eventName, eventHandler) {
		if (Type.isString(eventObject)) {
			eventHandler = eventName;
			eventName = eventObject;
			eventObject = EventEmitter.GLOBAL_TARGET;
		}
		if (eventObject === window) {
			eventObject = EventEmitter.GLOBAL_TARGET;
		}
		if (!Type.isObject(eventObject)) {
			console.error('The "eventObject" argument must be an object. Received type ' + typeof eventObject + '.');
			return;
		}
		if (!Type.isStringFilled(eventName)) {
			console.error('The "eventName" argument must be a string.');
			return;
		}
		if (!Type.isFunction(eventHandler)) {
			console.error('The "eventHandler" argument must be a function. Received type ' + typeof eventHandler + '.');
			return;
		}
		eventName = eventName.toLowerCase();
		EventEmitter.subscribe(eventObject, eventName, eventHandler, {
			compatMode: true,
			useGlobalNaming: true
		});
	}
	function onCustomEvent(eventObject, eventName, eventParams, secureParams) {
		if (Type.isString(eventObject)) {
			secureParams = eventParams;
			eventParams = eventName;
			eventName = eventObject;
			eventObject = EventEmitter.GLOBAL_TARGET;
		}
		if (!Type.isObject(eventObject) || eventObject === window) {
			eventObject = EventEmitter.GLOBAL_TARGET;
		}
		if (!eventParams) {
			eventParams = [];
		}
		eventName = eventName.toLowerCase();
		const event = new BaseEvent();
		event.setData(eventParams);
		event.setCompatData(eventParams);
		EventEmitter.emit(eventObject, eventName, event, {
			cloneData: secureParams === true,
			useGlobalNaming: true
		});
	}
	function removeCustomEvent(eventObject, eventName, eventHandler) {
		if (Type.isString(eventObject)) {
			eventHandler = eventName;
			eventName = eventObject;
			eventObject = EventEmitter.GLOBAL_TARGET;
		}
		if (!Type.isFunction(eventHandler)) {
			console.error('The "eventHandler" argument must be a function. Received type ' + typeof eventHandler + '.');
			return;
		}
		if (eventObject === window) {
			eventObject = EventEmitter.GLOBAL_TARGET;
		}
		eventName = eventName.toLowerCase();
		EventEmitter.unsubscribe(eventObject, eventName, eventHandler, {
			useGlobalNaming: true
		});
	}
	function removeAllCustomEvents(eventObject, eventName) {
		if (Type.isString(eventObject)) {
			eventName = eventObject;
			eventObject = EventEmitter.GLOBAL_TARGET;
		}
		if (eventObject === window) {
			eventObject = EventEmitter.GLOBAL_TARGET;
		}
		eventName = eventName.toLowerCase();
		EventEmitter.unsubscribeAll(eventObject, eventName, {
			useGlobalNaming: true
		});
	}
	function onGlobalCustomEvent(eventName, arEventParams, bSkipSelf) {
		localStorage$1.set('BXGCE', {
			e: eventName,
			p: arEventParams
		}, 1);
		if (!bSkipSelf) {
			onCustomEvent(eventName, arEventParams);
		}
	}

	exports.BaseError = BaseError;
	exports.Browser = Browser;
	exports.Cache = Cache;
	exports.Collections = collections;
	exports.Dom = Dom;
	exports.Easing = Easing;
	exports.Event = Event;
	exports.Extension = Extension;
	exports.GetContext = GetContext;
	exports.GetWindowInnerSize = GetWindowInnerSize;
	exports.GetWindowScrollPos = GetWindowScrollPos;
	exports.GetWindowScrollSize = GetWindowScrollSize;
	exports.GetWindowSize = GetWindowSize;
	exports.Http = Http;
	exports.Loc = Loc;
	exports.LocalStorage = LocalStorage;
	exports.Page = Page;
	exports.PageObject = PageObject;
	exports.Reflection = Reflection;
	exports.Runtime = Runtime;
	exports.Tag = Tag;
	exports.Text = Text;
	exports.Type = Type;
	exports.Uri = Uri;
	exports.Validation = Validation;
	exports.ZIndexManager = ZIndexManager;
	exports.addClass = addClass;
	exports.addCustomEvent = addCustomEvent;
	exports.adjust = adjust;
	exports.ajax = ajax;
	exports.append = append;
	exports.bind = bind;
	exports.bindOnce = bindOnce;
	exports.browser = browser;
	exports.clean = clean;
	exports.cleanNode = cleanNode;
	exports.clone = clone;
	exports.create = create;
	exports.debounce = debounce;
	exports.debug = debug;
	exports.debugEnable = debugEnable;
	exports.debugEnableFlag = debugEnableFlag;
	exports.debugStatus = debugStatus;
	exports.easing = easing;
	exports.fx = fx;
	exports.getClass = getClass;
	exports.getCookie = getCookie;
	exports.hasClass = hasClass;
	exports.html = html;
	exports.insertAfter = insertAfter;
	exports.insertBefore = insertBefore;
	exports.isShown = isShown;
	exports.loadExt = loadExt;
	exports.localStorage = localStorage$1;
	exports.message = message;
	exports.namespace = namespace;
	exports.onCustomEvent = onCustomEvent;
	exports.onGlobalCustomEvent = onGlobalCustomEvent;
	exports.pos = pos;
	exports.prepend = prepend;
	exports.ready = ready;
	exports.remove = remove;
	exports.removeAllCustomEvents = removeAllCustomEvents;
	exports.removeClass = removeClass;
	exports.removeCustomEvent = removeCustomEvent;
	exports.replace = replace;
	exports.setCookie = setCookie;
	exports.style = style;
	exports.throttle = throttle;
	exports.toggleClass = toggleClass;
	exports.type = type;
	exports.unbind = unbind;
	exports.unbindAll = unbindAll;

})(this.BX = this.BX || {});



})();
//# sourceMappingURL=main.core.minimal.bundle.js.map