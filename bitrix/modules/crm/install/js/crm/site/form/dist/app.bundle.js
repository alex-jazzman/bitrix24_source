/* eslint-disable */
(function (exports) {
		'use strict';

		/**
		 * Babel external helpers
		 * (c) 2018 Babel
		 * @license MIT
		 */
		(function (global) {
			if (global.babelHelpers)
			{
				return;
			}

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


		/*!
		 * Vue.js v2.6.12
		 * (c) 2014-2020 Evan You
		 * Released under the MIT License.
		 */

		/**
		 * Modify list for integration with Bitrix Framework:
		 * - change default export to local for work in Bitrix CoreJS extensions;
		 * - rename local `exports` to `__vueExports` so it does not shadow the
		 *   chef bundle IIFE `exports` parameter (used for the b24form namespace).
		 */
		var __vueExports = {};

		!function(e,t){"object"==typeof exports&&"undefined"!=typeof module?module.exports=t():"function"==typeof define&&define.amd?define(t):(e=e||self).Vue=t()}(__vueExports,function(){"use strict";var e=Object.freeze({});function t(e){return null==e}function n(e){return null!=e}function r(e){return!0===e}function i(e){return"string"==typeof e||"number"==typeof e||"symbol"==typeof e||"boolean"==typeof e}function o(e){return null!==e&&"object"==typeof e}var a=Object.prototype.toString;function s(e){return"[object Object]"===a.call(e)}function c(e){var t=parseFloat(String(e));return t>=0&&Math.floor(t)===t&&isFinite(e)}function u(e){return n(e)&&"function"==typeof e.then&&"function"==typeof e.catch}function l(e){return null==e?"":Array.isArray(e)||s(e)&&e.toString===a?JSON.stringify(e,null,2):String(e)}function f(e){var t=parseFloat(e);return isNaN(t)?e:t}function p(e,t){for(var n=Object.create(null),r=e.split(","),i=0;i<r.length;i++)n[r[i]]=!0;return t?function(e){return n[e.toLowerCase()]}:function(e){return n[e]}}var d=p("slot,component",!0),v=p("key,ref,slot,slot-scope,is");function h(e,t){if(e.length){var n=e.indexOf(t);if(n>-1)return e.splice(n,1)}}var m=Object.prototype.hasOwnProperty;function y(e,t){return m.call(e,t)}function g(e){var t=Object.create(null);return function(n){return t[n]||(t[n]=e(n))}}var _=/-(\w)/g,b=g(function(e){return e.replace(_,function(e,t){return t?t.toUpperCase():""})}),$=g(function(e){return e.charAt(0).toUpperCase()+e.slice(1)}),w=/\B([A-Z])/g,C=g(function(e){return e.replace(w,"-$1").toLowerCase()});var x=Function.prototype.bind?function(e,t){return e.bind(t)}:function(e,t){function n(n){var r=arguments.length;return r?r>1?e.apply(t,arguments):e.call(t,n):e.call(t)}return n._length=e.length,n};function k(e,t){t=t||0;for(var n=e.length-t,r=new Array(n);n--;)r[n]=e[n+t];return r}function A(e,t){for(var n in t)e[n]=t[n];return e}function O(e){for(var t={},n=0;n<e.length;n++)e[n]&&A(t,e[n]);return t}function S(e,t,n){}var T=function(e,t,n){return!1},E=function(e){return e};function N(e,t){if(e===t)return!0;var n=o(e),r=o(t);if(!n||!r)return!n&&!r&&String(e)===String(t);try{var i=Array.isArray(e),a=Array.isArray(t);if(i&&a)return e.length===t.length&&e.every(function(e,n){return N(e,t[n])});if(e instanceof Date&&t instanceof Date)return e.getTime()===t.getTime();if(i||a)return!1;var s=Object.keys(e),c=Object.keys(t);return s.length===c.length&&s.every(function(n){return N(e[n],t[n])})}catch(e){return!1}}function j(e,t){for(var n=0;n<e.length;n++)if(N(e[n],t))return n;return-1}function D(e){var t=!1;return function(){t||(t=!0,e.apply(this,arguments))}}var L="data-server-rendered",M=["component","directive","filter"],I=["beforeCreate","created","beforeMount","mounted","beforeUpdate","updated","beforeDestroy","destroyed","activated","deactivated","errorCaptured","serverPrefetch"],F={optionMergeStrategies:Object.create(null),silent:!1,productionTip:!1,devtools:!1,performance:!1,errorHandler:null,warnHandler:null,ignoredElements:[],keyCodes:Object.create(null),isReservedTag:T,isReservedAttr:T,isUnknownElement:T,getTagNamespace:S,parsePlatformTagName:E,mustUseProp:T,async:!0,_lifecycleHooks:I},P=/a-zA-Z\u00B7\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u037D\u037F-\u1FFF\u200C-\u200D\u203F-\u2040\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD/;function R(e,t,n,r){Object.defineProperty(e,t,{value:n,enumerable:!!r,writable:!0,configurable:!0})}var H=new RegExp("[^"+P.source+".$_\\d]");var B,U="__proto__"in{},z="undefined"!=typeof window,V="undefined"!=typeof WXEnvironment&&!!WXEnvironment.platform,K=V&&WXEnvironment.platform.toLowerCase(),J=z&&window.navigator.userAgent.toLowerCase(),q=J&&/msie|trident/.test(J),W=J&&J.indexOf("msie 9.0")>0,Z=J&&J.indexOf("edge/")>0,G=(J&&J.indexOf("android"),J&&/iphone|ipad|ipod|ios/.test(J)||"ios"===K),X=(J&&/chrome\/\d+/.test(J),J&&/phantomjs/.test(J),J&&J.match(/firefox\/(\d+)/)),Y={}.watch,Q=!1;if(z)try{var ee={};Object.defineProperty(ee,"passive",{get:function(){Q=!0}}),window.addEventListener("test-passive",null,ee)}catch(e){}var te=function(){return void 0===B&&(B=!z&&!V&&"undefined"!=typeof global&&(global.process&&"server"===global.process.env.VUE_ENV)),B},ne=z&&window.__VUE_DEVTOOLS_GLOBAL_HOOK__;function re(e){return"function"==typeof e&&/native code/.test(e.toString())}var ie,oe="undefined"!=typeof Symbol&&re(Symbol)&&"undefined"!=typeof Reflect&&re(Reflect.ownKeys);ie="undefined"!=typeof Set&&re(Set)?Set:function(){function e(){this.set=Object.create(null)}return e.prototype.has=function(e){return!0===this.set[e]},e.prototype.add=function(e){this.set[e]=!0},e.prototype.clear=function(){this.set=Object.create(null)},e}();var ae=S,se=0,ce=function(){this.id=se++,this.subs=[]};ce.prototype.addSub=function(e){this.subs.push(e)},ce.prototype.removeSub=function(e){h(this.subs,e)},ce.prototype.depend=function(){ce.target&&ce.target.addDep(this)},ce.prototype.notify=function(){for(var e=this.subs.slice(),t=0,n=e.length;t<n;t++)e[t].update()},ce.target=null;var ue=[];function le(e){ue.push(e),ce.target=e}function fe(){ue.pop(),ce.target=ue[ue.length-1]}var pe=function(e,t,n,r,i,o,a,s){this.tag=e,this.data=t,this.children=n,this.text=r,this.elm=i,this.ns=void 0,this.context=o,this.fnContext=void 0,this.fnOptions=void 0,this.fnScopeId=void 0,this.key=t&&t.key,this.componentOptions=a,this.componentInstance=void 0,this.parent=void 0,this.raw=!1,this.isStatic=!1,this.isRootInsert=!0,this.isComment=!1,this.isCloned=!1,this.isOnce=!1,this.asyncFactory=s,this.asyncMeta=void 0,this.isAsyncPlaceholder=!1},de={child:{configurable:!0}};de.child.get=function(){return this.componentInstance},Object.defineProperties(pe.prototype,de);var ve=function(e){void 0===e&&(e="");var t=new pe;return t.text=e,t.isComment=!0,t};function he(e){return new pe(void 0,void 0,void 0,String(e))}function me(e){var t=new pe(e.tag,e.data,e.children&&e.children.slice(),e.text,e.elm,e.context,e.componentOptions,e.asyncFactory);return t.ns=e.ns,t.isStatic=e.isStatic,t.key=e.key,t.isComment=e.isComment,t.fnContext=e.fnContext,t.fnOptions=e.fnOptions,t.fnScopeId=e.fnScopeId,t.asyncMeta=e.asyncMeta,t.isCloned=!0,t}var ye=Array.prototype,ge=Object.create(ye);["push","pop","shift","unshift","splice","sort","reverse"].forEach(function(e){var t=ye[e];R(ge,e,function(){for(var n=[],r=arguments.length;r--;)n[r]=arguments[r];var i,o=t.apply(this,n),a=this.__ob__;switch(e){case"push":case"unshift":i=n;break;case"splice":i=n.slice(2)}return i&&a.observeArray(i),a.dep.notify(),o})});var _e=Object.getOwnPropertyNames(ge),be=!0;function $e(e){be=e}var we=function(e){var t;this.value=e,this.dep=new ce,this.vmCount=0,R(e,"__ob__",this),Array.isArray(e)?(U?(t=ge,e.__proto__=t):function(e,t,n){for(var r=0,i=n.length;r<i;r++){var o=n[r];R(e,o,t[o])}}(e,ge,_e),this.observeArray(e)):this.walk(e)};function Ce(e,t){var n;if(o(e)&&!(e instanceof pe))return y(e,"__ob__")&&e.__ob__ instanceof we?n=e.__ob__:be&&!te()&&(Array.isArray(e)||s(e))&&Object.isExtensible(e)&&!e._isVue&&(n=new we(e)),t&&n&&n.vmCount++,n}function xe(e,t,n,r,i){var o=new ce,a=Object.getOwnPropertyDescriptor(e,t);if(!a||!1!==a.configurable){var s=a&&a.get,c=a&&a.set;s&&!c||2!==arguments.length||(n=e[t]);var u=!i&&Ce(n);Object.defineProperty(e,t,{enumerable:!0,configurable:!0,get:function(){var t=s?s.call(e):n;return ce.target&&(o.depend(),u&&(u.dep.depend(),Array.isArray(t)&&function e(t){for(var n=void 0,r=0,i=t.length;r<i;r++)(n=t[r])&&n.__ob__&&n.__ob__.dep.depend(),Array.isArray(n)&&e(n)}(t))),t},set:function(t){var r=s?s.call(e):n;t===r||t!=t&&r!=r||s&&!c||(c?c.call(e,t):n=t,u=!i&&Ce(t),o.notify())}})}}function ke(e,t,n){if(Array.isArray(e)&&c(t))return e.length=Math.max(e.length,t),e.splice(t,1,n),n;if(t in e&&!(t in Object.prototype))return e[t]=n,n;var r=e.__ob__;return e._isVue||r&&r.vmCount?n:r?(xe(r.value,t,n),r.dep.notify(),n):(e[t]=n,n)}function Ae(e,t){if(Array.isArray(e)&&c(t))e.splice(t,1);else{var n=e.__ob__;e._isVue||n&&n.vmCount||y(e,t)&&(delete e[t],n&&n.dep.notify())}}we.prototype.walk=function(e){for(var t=Object.keys(e),n=0;n<t.length;n++)xe(e,t[n])},we.prototype.observeArray=function(e){for(var t=0,n=e.length;t<n;t++)Ce(e[t])};var Oe=F.optionMergeStrategies;function Se(e,t){if(!t)return e;for(var n,r,i,o=oe?Reflect.ownKeys(t):Object.keys(t),a=0;a<o.length;a++)"__ob__"!==(n=o[a])&&(r=e[n],i=t[n],y(e,n)?r!==i&&s(r)&&s(i)&&Se(r,i):ke(e,n,i));return e}function Te(e,t,n){return n?function(){var r="function"==typeof t?t.call(n,n):t,i="function"==typeof e?e.call(n,n):e;return r?Se(r,i):i}:t?e?function(){return Se("function"==typeof t?t.call(this,this):t,"function"==typeof e?e.call(this,this):e)}:t:e}function Ee(e,t){var n=t?e?e.concat(t):Array.isArray(t)?t:[t]:e;return n?function(e){for(var t=[],n=0;n<e.length;n++)-1===t.indexOf(e[n])&&t.push(e[n]);return t}(n):n}function Ne(e,t,n,r){var i=Object.create(e||null);return t?A(i,t):i}Oe.data=function(e,t,n){return n?Te(e,t,n):t&&"function"!=typeof t?e:Te(e,t)},I.forEach(function(e){Oe[e]=Ee}),M.forEach(function(e){Oe[e+"s"]=Ne}),Oe.watch=function(e,t,n,r){if(e===Y&&(e=void 0),t===Y&&(t=void 0),!t)return Object.create(e||null);if(!e)return t;var i={};for(var o in A(i,e),t){var a=i[o],s=t[o];a&&!Array.isArray(a)&&(a=[a]),i[o]=a?a.concat(s):Array.isArray(s)?s:[s]}return i},Oe.props=Oe.methods=Oe.inject=Oe.computed=function(e,t,n,r){if(!e)return t;var i=Object.create(null);return A(i,e),t&&A(i,t),i},Oe.provide=Te;var je=function(e,t){return void 0===t?e:t};function De(e,t,n){if("function"==typeof t&&(t=t.options),function(e,t){var n=e.props;if(n){var r,i,o={};if(Array.isArray(n))for(r=n.length;r--;)"string"==typeof(i=n[r])&&(o[b(i)]={type:null});else if(s(n))for(var a in n)i=n[a],o[b(a)]=s(i)?i:{type:i};e.props=o}}(t),function(e,t){var n=e.inject;if(n){var r=e.inject={};if(Array.isArray(n))for(var i=0;i<n.length;i++)r[n[i]]={from:n[i]};else if(s(n))for(var o in n){var a=n[o];r[o]=s(a)?A({from:o},a):{from:a}}}}(t),function(e){var t=e.directives;if(t)for(var n in t){var r=t[n];"function"==typeof r&&(t[n]={bind:r,update:r})}}(t),!t._base&&(t.extends&&(e=De(e,t.extends,n)),t.mixins))for(var r=0,i=t.mixins.length;r<i;r++)e=De(e,t.mixins[r],n);var o,a={};for(o in e)c(o);for(o in t)y(e,o)||c(o);function c(r){var i=Oe[r]||je;a[r]=i(e[r],t[r],n,r)}return a}function Le(e,t,n,r){if("string"==typeof n){var i=e[t];if(y(i,n))return i[n];var o=b(n);if(y(i,o))return i[o];var a=$(o);return y(i,a)?i[a]:i[n]||i[o]||i[a]}}function Me(e,t,n,r){var i=t[e],o=!y(n,e),a=n[e],s=Pe(Boolean,i.type);if(s>-1)if(o&&!y(i,"default"))a=!1;else if(""===a||a===C(e)){var c=Pe(String,i.type);(c<0||s<c)&&(a=!0)}if(void 0===a){a=function(e,t,n){if(!y(t,"default"))return;var r=t.default;if(e&&e.$options.propsData&&void 0===e.$options.propsData[n]&&void 0!==e._props[n])return e._props[n];return"function"==typeof r&&"Function"!==Ie(t.type)?r.call(e):r}(r,i,e);var u=be;$e(!0),Ce(a),$e(u)}return a}function Ie(e){var t=e&&e.toString().match(/^\s*function (\w+)/);return t?t[1]:""}function Fe(e,t){return Ie(e)===Ie(t)}function Pe(e,t){if(!Array.isArray(t))return Fe(t,e)?0:-1;for(var n=0,r=t.length;n<r;n++)if(Fe(t[n],e))return n;return-1}function Re(e,t,n){le();try{if(t)for(var r=t;r=r.$parent;){var i=r.$options.errorCaptured;if(i)for(var o=0;o<i.length;o++)try{if(!1===i[o].call(r,e,t,n))return}catch(e){Be(e,r,"errorCaptured hook")}}Be(e,t,n)}finally{fe()}}function He(e,t,n,r,i){var o;try{(o=n?e.apply(t,n):e.call(t))&&!o._isVue&&u(o)&&!o._handled&&(o.catch(function(e){return Re(e,r,i+" (Promise/async)")}),o._handled=!0)}catch(e){Re(e,r,i)}return o}function Be(e,t,n){if(F.errorHandler)try{return F.errorHandler.call(null,e,t,n)}catch(t){t!==e&&Ue(t,null,"config.errorHandler")}Ue(e,t,n)}function Ue(e,t,n){if(!z&&!V||"undefined"==typeof console)throw e;console.error(e)}var ze,Ve=!1,Ke=[],Je=!1;function qe(){Je=!1;var e=Ke.slice(0);Ke.length=0;for(var t=0;t<e.length;t++)e[t]()}if("undefined"!=typeof Promise&&re(Promise)){var We=Promise.resolve();ze=function(){We.then(qe),G&&setTimeout(S)},Ve=!0}else if(q||"undefined"==typeof MutationObserver||!re(MutationObserver)&&"[object MutationObserverConstructor]"!==MutationObserver.toString())ze="undefined"!=typeof setImmediate&&re(setImmediate)?function(){setImmediate(qe)}:function(){setTimeout(qe,0)};else{var Ze=1,Ge=new MutationObserver(qe),Xe=document.createTextNode(String(Ze));Ge.observe(Xe,{characterData:!0}),ze=function(){Ze=(Ze+1)%2,Xe.data=String(Ze)},Ve=!0}function Ye(e,t){var n;if(Ke.push(function(){if(e)try{e.call(t)}catch(e){Re(e,t,"nextTick")}else n&&n(t)}),Je||(Je=!0,ze()),!e&&"undefined"!=typeof Promise)return new Promise(function(e){n=e})}var Qe=new ie;function et(e){!function e(t,n){var r,i;var a=Array.isArray(t);if(!a&&!o(t)||Object.isFrozen(t)||t instanceof pe)return;if(t.__ob__){var s=t.__ob__.dep.id;if(n.has(s))return;n.add(s)}if(a)for(r=t.length;r--;)e(t[r],n);else for(i=Object.keys(t),r=i.length;r--;)e(t[i[r]],n)}(e,Qe),Qe.clear()}var tt=g(function(e){var t="&"===e.charAt(0),n="~"===(e=t?e.slice(1):e).charAt(0),r="!"===(e=n?e.slice(1):e).charAt(0);return{name:e=r?e.slice(1):e,once:n,capture:r,passive:t}});function nt(e,t){function n(){var e=arguments,r=n.fns;if(!Array.isArray(r))return He(r,null,arguments,t,"v-on handler");for(var i=r.slice(),o=0;o<i.length;o++)He(i[o],null,e,t,"v-on handler")}return n.fns=e,n}function rt(e,n,i,o,a,s){var c,u,l,f;for(c in e)u=e[c],l=n[c],f=tt(c),t(u)||(t(l)?(t(u.fns)&&(u=e[c]=nt(u,s)),r(f.once)&&(u=e[c]=a(f.name,u,f.capture)),i(f.name,u,f.capture,f.passive,f.params)):u!==l&&(l.fns=u,e[c]=l));for(c in n)t(e[c])&&o((f=tt(c)).name,n[c],f.capture)}function it(e,i,o){var a;e instanceof pe&&(e=e.data.hook||(e.data.hook={}));var s=e[i];function c(){o.apply(this,arguments),h(a.fns,c)}t(s)?a=nt([c]):n(s.fns)&&r(s.merged)?(a=s).fns.push(c):a=nt([s,c]),a.merged=!0,e[i]=a}function ot(e,t,r,i,o){if(n(t)){if(y(t,r))return e[r]=t[r],o||delete t[r],!0;if(y(t,i))return e[r]=t[i],o||delete t[i],!0}return!1}function at(e){return i(e)?[he(e)]:Array.isArray(e)?function e(o,a){var s=[];var c,u,l,f;for(c=0;c<o.length;c++)t(u=o[c])||"boolean"==typeof u||(l=s.length-1,f=s[l],Array.isArray(u)?u.length>0&&(st((u=e(u,(a||"")+"_"+c))[0])&&st(f)&&(s[l]=he(f.text+u[0].text),u.shift()),s.push.apply(s,u)):i(u)?st(f)?s[l]=he(f.text+u):""!==u&&s.push(he(u)):st(u)&&st(f)?s[l]=he(f.text+u.text):(r(o._isVList)&&n(u.tag)&&t(u.key)&&n(a)&&(u.key="__vlist"+a+"_"+c+"__"),s.push(u)));return s}(e):void 0}function st(e){return n(e)&&n(e.text)&&!1===e.isComment}function ct(e,t){if(e){for(var n=Object.create(null),r=oe?Reflect.ownKeys(e):Object.keys(e),i=0;i<r.length;i++){var o=r[i];if("__ob__"!==o){for(var a=e[o].from,s=t;s;){if(s._provided&&y(s._provided,a)){n[o]=s._provided[a];break}s=s.$parent}if(!s&&"default"in e[o]){var c=e[o].default;n[o]="function"==typeof c?c.call(t):c}}}return n}}function ut(e,t){if(!e||!e.length)return{};for(var n={},r=0,i=e.length;r<i;r++){var o=e[r],a=o.data;if(a&&a.attrs&&a.attrs.slot&&delete a.attrs.slot,o.context!==t&&o.fnContext!==t||!a||null==a.slot)(n.default||(n.default=[])).push(o);else{var s=a.slot,c=n[s]||(n[s]=[]);"template"===o.tag?c.push.apply(c,o.children||[]):c.push(o)}}for(var u in n)n[u].every(lt)&&delete n[u];return n}function lt(e){return e.isComment&&!e.asyncFactory||" "===e.text}function ft(t,n,r){var i,o=Object.keys(n).length>0,a=t?!!t.$stable:!o,s=t&&t.$key;if(t){if(t._normalized)return t._normalized;if(a&&r&&r!==e&&s===r.$key&&!o&&!r.$hasNormal)return r;for(var c in i={},t)t[c]&&"$"!==c[0]&&(i[c]=pt(n,c,t[c]))}else i={};for(var u in n)u in i||(i[u]=dt(n,u));return t&&Object.isExtensible(t)&&(t._normalized=i),R(i,"$stable",a),R(i,"$key",s),R(i,"$hasNormal",o),i}function pt(e,t,n){var r=function(){var e=arguments.length?n.apply(null,arguments):n({});return(e=e&&"object"==typeof e&&!Array.isArray(e)?[e]:at(e))&&(0===e.length||1===e.length&&e[0].isComment)?void 0:e};return n.proxy&&Object.defineProperty(e,t,{get:r,enumerable:!0,configurable:!0}),r}function dt(e,t){return function(){return e[t]}}function vt(e,t){var r,i,a,s,c;if(Array.isArray(e)||"string"==typeof e)for(r=new Array(e.length),i=0,a=e.length;i<a;i++)r[i]=t(e[i],i);else if("number"==typeof e)for(r=new Array(e),i=0;i<e;i++)r[i]=t(i+1,i);else if(o(e))if(oe&&e[Symbol.iterator]){r=[];for(var u=e[Symbol.iterator](),l=u.next();!l.done;)r.push(t(l.value,r.length)),l=u.next()}else for(s=Object.keys(e),r=new Array(s.length),i=0,a=s.length;i<a;i++)c=s[i],r[i]=t(e[c],c,i);return n(r)||(r=[]),r._isVList=!0,r}function ht(e,t,n,r){var i,o=this.$scopedSlots[e];o?(n=n||{},r&&(n=A(A({},r),n)),i=o(n)||t):i=this.$slots[e]||t;var a=n&&n.slot;return a?this.$createElement("template",{slot:a},i):i}function mt(e){return Le(this.$options,"filters",e)||E}function yt(e,t){return Array.isArray(e)?-1===e.indexOf(t):e!==t}function gt(e,t,n,r,i){var o=F.keyCodes[t]||n;return i&&r&&!F.keyCodes[t]?yt(i,r):o?yt(o,e):r?C(r)!==t:void 0}function _t(e,t,n,r,i){if(n)if(o(n)){var a;Array.isArray(n)&&(n=O(n));var s=function(o){if("class"===o||"style"===o||v(o))a=e;else{var s=e.attrs&&e.attrs.type;a=r||F.mustUseProp(t,s,o)?e.domProps||(e.domProps={}):e.attrs||(e.attrs={})}var c=b(o),u=C(o);c in a||u in a||(a[o]=n[o],i&&((e.on||(e.on={}))["update:"+o]=function(e){n[o]=e}))};for(var c in n)s(c)}else;return e}function bt(e,t){var n=this._staticTrees||(this._staticTrees=[]),r=n[e];return r&&!t?r:(wt(r=n[e]=this.$options.staticRenderFns[e].call(this._renderProxy,null,this),"__static__"+e,!1),r)}function $t(e,t,n){return wt(e,"__once__"+t+(n?"_"+n:""),!0),e}function wt(e,t,n){if(Array.isArray(e))for(var r=0;r<e.length;r++)e[r]&&"string"!=typeof e[r]&&Ct(e[r],t+"_"+r,n);else Ct(e,t,n)}function Ct(e,t,n){e.isStatic=!0,e.key=t,e.isOnce=n}function xt(e,t){if(t)if(s(t)){var n=e.on=e.on?A({},e.on):{};for(var r in t){var i=n[r],o=t[r];n[r]=i?[].concat(i,o):o}}else;return e}function kt(e,t,n,r){t=t||{$stable:!n};for(var i=0;i<e.length;i++){var o=e[i];Array.isArray(o)?kt(o,t,n):o&&(o.proxy&&(o.fn.proxy=!0),t[o.key]=o.fn)}return r&&(t.$key=r),t}function At(e,t){for(var n=0;n<t.length;n+=2){var r=t[n];"string"==typeof r&&r&&(e[t[n]]=t[n+1])}return e}function Ot(e,t){return"string"==typeof e?t+e:e}function St(e){e._o=$t,e._n=f,e._s=l,e._l=vt,e._t=ht,e._q=N,e._i=j,e._m=bt,e._f=mt,e._k=gt,e._b=_t,e._v=he,e._e=ve,e._u=kt,e._g=xt,e._d=At,e._p=Ot}function Tt(t,n,i,o,a){var s,c=this,u=a.options;y(o,"_uid")?(s=Object.create(o))._original=o:(s=o,o=o._original);var l=r(u._compiled),f=!l;this.data=t,this.props=n,this.children=i,this.parent=o,this.listeners=t.on||e,this.injections=ct(u.inject,o),this.slots=function(){return c.$slots||ft(t.scopedSlots,c.$slots=ut(i,o)),c.$slots},Object.defineProperty(this,"scopedSlots",{enumerable:!0,get:function(){return ft(t.scopedSlots,this.slots())}}),l&&(this.$options=u,this.$slots=this.slots(),this.$scopedSlots=ft(t.scopedSlots,this.$slots)),u._scopeId?this._c=function(e,t,n,r){var i=Pt(s,e,t,n,r,f);return i&&!Array.isArray(i)&&(i.fnScopeId=u._scopeId,i.fnContext=o),i}:this._c=function(e,t,n,r){return Pt(s,e,t,n,r,f)}}function Et(e,t,n,r,i){var o=me(e);return o.fnContext=n,o.fnOptions=r,t.slot&&((o.data||(o.data={})).slot=t.slot),o}function Nt(e,t){for(var n in t)e[b(n)]=t[n]}St(Tt.prototype);var jt={init:function(e,t){if(e.componentInstance&&!e.componentInstance._isDestroyed&&e.data.keepAlive){var r=e;jt.prepatch(r,r)}else{(e.componentInstance=function(e,t){var r={_isComponent:!0,_parentVnode:e,parent:t},i=e.data.inlineTemplate;n(i)&&(r.render=i.render,r.staticRenderFns=i.staticRenderFns);return new e.componentOptions.Ctor(r)}(e,Wt)).$mount(t?e.elm:void 0,t)}},prepatch:function(t,n){var r=n.componentOptions;!function(t,n,r,i,o){var a=i.data.scopedSlots,s=t.$scopedSlots,c=!!(a&&!a.$stable||s!==e&&!s.$stable||a&&t.$scopedSlots.$key!==a.$key),u=!!(o||t.$options._renderChildren||c);t.$options._parentVnode=i,t.$vnode=i,t._vnode&&(t._vnode.parent=i);if(t.$options._renderChildren=o,t.$attrs=i.data.attrs||e,t.$listeners=r||e,n&&t.$options.props){$e(!1);for(var l=t._props,f=t.$options._propKeys||[],p=0;p<f.length;p++){var d=f[p],v=t.$options.props;l[d]=Me(d,v,n,t)}$e(!0),t.$options.propsData=n}r=r||e;var h=t.$options._parentListeners;t.$options._parentListeners=r,qt(t,r,h),u&&(t.$slots=ut(o,i.context),t.$forceUpdate())}(n.componentInstance=t.componentInstance,r.propsData,r.listeners,n,r.children)},insert:function(e){var t,n=e.context,r=e.componentInstance;r._isMounted||(r._isMounted=!0,Yt(r,"mounted")),e.data.keepAlive&&(n._isMounted?((t=r)._inactive=!1,en.push(t)):Xt(r,!0))},destroy:function(e){var t=e.componentInstance;t._isDestroyed||(e.data.keepAlive?function e(t,n){if(n&&(t._directInactive=!0,Gt(t)))return;if(!t._inactive){t._inactive=!0;for(var r=0;r<t.$children.length;r++)e(t.$children[r]);Yt(t,"deactivated")}}(t,!0):t.$destroy())}},Dt=Object.keys(jt);function Lt(i,a,s,c,l){if(!t(i)){var f=s.$options._base;if(o(i)&&(i=f.extend(i)),"function"==typeof i){var p;if(t(i.cid)&&void 0===(i=function(e,i){if(r(e.error)&&n(e.errorComp))return e.errorComp;if(n(e.resolved))return e.resolved;var a=Ht;a&&n(e.owners)&&-1===e.owners.indexOf(a)&&e.owners.push(a);if(r(e.loading)&&n(e.loadingComp))return e.loadingComp;if(a&&!n(e.owners)){var s=e.owners=[a],c=!0,l=null,f=null;a.$on("hook:destroyed",function(){return h(s,a)});var p=function(e){for(var t=0,n=s.length;t<n;t++)s[t].$forceUpdate();e&&(s.length=0,null!==l&&(clearTimeout(l),l=null),null!==f&&(clearTimeout(f),f=null))},d=D(function(t){e.resolved=Bt(t,i),c?s.length=0:p(!0)}),v=D(function(t){n(e.errorComp)&&(e.error=!0,p(!0))}),m=e(d,v);return o(m)&&(u(m)?t(e.resolved)&&m.then(d,v):u(m.component)&&(m.component.then(d,v),n(m.error)&&(e.errorComp=Bt(m.error,i)),n(m.loading)&&(e.loadingComp=Bt(m.loading,i),0===m.delay?e.loading=!0:l=setTimeout(function(){l=null,t(e.resolved)&&t(e.error)&&(e.loading=!0,p(!1))},m.delay||200)),n(m.timeout)&&(f=setTimeout(function(){f=null,t(e.resolved)&&v(null)},m.timeout)))),c=!1,e.loading?e.loadingComp:e.resolved}}(p=i,f)))return function(e,t,n,r,i){var o=ve();return o.asyncFactory=e,o.asyncMeta={data:t,context:n,children:r,tag:i},o}(p,a,s,c,l);a=a||{},$n(i),n(a.model)&&function(e,t){var r=e.model&&e.model.prop||"value",i=e.model&&e.model.event||"input";(t.attrs||(t.attrs={}))[r]=t.model.value;var o=t.on||(t.on={}),a=o[i],s=t.model.callback;n(a)?(Array.isArray(a)?-1===a.indexOf(s):a!==s)&&(o[i]=[s].concat(a)):o[i]=s}(i.options,a);var d=function(e,r,i){var o=r.options.props;if(!t(o)){var a={},s=e.attrs,c=e.props;if(n(s)||n(c))for(var u in o){var l=C(u);ot(a,c,u,l,!0)||ot(a,s,u,l,!1)}return a}}(a,i);if(r(i.options.functional))return function(t,r,i,o,a){var s=t.options,c={},u=s.props;if(n(u))for(var l in u)c[l]=Me(l,u,r||e);else n(i.attrs)&&Nt(c,i.attrs),n(i.props)&&Nt(c,i.props);var f=new Tt(i,c,a,o,t),p=s.render.call(null,f._c,f);if(p instanceof pe)return Et(p,i,f.parent,s);if(Array.isArray(p)){for(var d=at(p)||[],v=new Array(d.length),h=0;h<d.length;h++)v[h]=Et(d[h],i,f.parent,s);return v}}(i,d,a,s,c);var v=a.on;if(a.on=a.nativeOn,r(i.options.abstract)){var m=a.slot;a={},m&&(a.slot=m)}!function(e){for(var t=e.hook||(e.hook={}),n=0;n<Dt.length;n++){var r=Dt[n],i=t[r],o=jt[r];i===o||i&&i._merged||(t[r]=i?Mt(o,i):o)}}(a);var y=i.options.name||l;return new pe("vue-component-"+i.cid+(y?"-"+y:""),a,void 0,void 0,void 0,s,{Ctor:i,propsData:d,listeners:v,tag:l,children:c},p)}}}function Mt(e,t){var n=function(n,r){e(n,r),t(n,r)};return n._merged=!0,n}var It=1,Ft=2;function Pt(e,a,s,c,u,l){return(Array.isArray(s)||i(s))&&(u=c,c=s,s=void 0),r(l)&&(u=Ft),function(e,i,a,s,c){if(n(a)&&n(a.__ob__))return ve();n(a)&&n(a.is)&&(i=a.is);if(!i)return ve();Array.isArray(s)&&"function"==typeof s[0]&&((a=a||{}).scopedSlots={default:s[0]},s.length=0);c===Ft?s=at(s):c===It&&(s=function(e){for(var t=0;t<e.length;t++)if(Array.isArray(e[t]))return Array.prototype.concat.apply([],e);return e}(s));var u,l;if("string"==typeof i){var f;l=e.$vnode&&e.$vnode.ns||F.getTagNamespace(i),u=F.isReservedTag(i)?new pe(F.parsePlatformTagName(i),a,s,void 0,void 0,e):a&&a.pre||!n(f=Le(e.$options,"components",i))?new pe(i,a,s,void 0,void 0,e):Lt(f,a,e,s,i)}else u=Lt(i,a,e,s);return Array.isArray(u)?u:n(u)?(n(l)&&function e(i,o,a){i.ns=o;"foreignObject"===i.tag&&(o=void 0,a=!0);if(n(i.children))for(var s=0,c=i.children.length;s<c;s++){var u=i.children[s];n(u.tag)&&(t(u.ns)||r(a)&&"svg"!==u.tag)&&e(u,o,a)}}(u,l),n(a)&&function(e){o(e.style)&&et(e.style);o(e.class)&&et(e.class)}(a),u):ve()}(e,a,s,c,u)}var Rt,Ht=null;function Bt(e,t){return(e.__esModule||oe&&"Module"===e[Symbol.toStringTag])&&(e=e.default),o(e)?t.extend(e):e}function Ut(e){return e.isComment&&e.asyncFactory}function zt(e){if(Array.isArray(e))for(var t=0;t<e.length;t++){var r=e[t];if(n(r)&&(n(r.componentOptions)||Ut(r)))return r}}function Vt(e,t){Rt.$on(e,t)}function Kt(e,t){Rt.$off(e,t)}function Jt(e,t){var n=Rt;return function r(){null!==t.apply(null,arguments)&&n.$off(e,r)}}function qt(e,t,n){Rt=e,rt(t,n||{},Vt,Kt,Jt,e),Rt=void 0}var Wt=null;function Zt(e){var t=Wt;return Wt=e,function(){Wt=t}}function Gt(e){for(;e&&(e=e.$parent);)if(e._inactive)return!0;return!1}function Xt(e,t){if(t){if(e._directInactive=!1,Gt(e))return}else if(e._directInactive)return;if(e._inactive||null===e._inactive){e._inactive=!1;for(var n=0;n<e.$children.length;n++)Xt(e.$children[n]);Yt(e,"activated")}}function Yt(e,t){le();var n=e.$options[t],r=t+" hook";if(n)for(var i=0,o=n.length;i<o;i++)He(n[i],e,null,e,r);e._hasHookEvent&&e.$emit("hook:"+t),fe()}var Qt=[],en=[],tn={},nn=!1,rn=!1,on=0;var an=0,sn=Date.now;if(z&&!q){var cn=window.performance;cn&&"function"==typeof cn.now&&sn()>document.createEvent("Event").timeStamp&&(sn=function(){return cn.now()})}function un(){var e,t;for(an=sn(),rn=!0,Qt.sort(function(e,t){return e.id-t.id}),on=0;on<Qt.length;on++)(e=Qt[on]).before&&e.before(),t=e.id,tn[t]=null,e.run();var n=en.slice(),r=Qt.slice();on=Qt.length=en.length=0,tn={},nn=rn=!1,function(e){for(var t=0;t<e.length;t++)e[t]._inactive=!0,Xt(e[t],!0)}(n),function(e){var t=e.length;for(;t--;){var n=e[t],r=n.vm;r._watcher===n&&r._isMounted&&!r._isDestroyed&&Yt(r,"updated")}}(r),ne&&F.devtools&&ne.emit("flush")}var ln=0,fn=function(e,t,n,r,i){this.vm=e,i&&(e._watcher=this),e._watchers.push(this),r?(this.deep=!!r.deep,this.user=!!r.user,this.lazy=!!r.lazy,this.sync=!!r.sync,this.before=r.before):this.deep=this.user=this.lazy=this.sync=!1,this.cb=n,this.id=++ln,this.active=!0,this.dirty=this.lazy,this.deps=[],this.newDeps=[],this.depIds=new ie,this.newDepIds=new ie,this.expression="","function"==typeof t?this.getter=t:(this.getter=function(e){if(!H.test(e)){var t=e.split(".");return function(e){for(var n=0;n<t.length;n++){if(!e)return;e=e[t[n]]}return e}}}(t),this.getter||(this.getter=S)),this.value=this.lazy?void 0:this.get()};fn.prototype.get=function(){var e;le(this);var t=this.vm;try{e=this.getter.call(t,t)}catch(e){if(!this.user)throw e;Re(e,t,'getter for watcher "'+this.expression+'"')}finally{this.deep&&et(e),fe(),this.cleanupDeps()}return e},fn.prototype.addDep=function(e){var t=e.id;this.newDepIds.has(t)||(this.newDepIds.add(t),this.newDeps.push(e),this.depIds.has(t)||e.addSub(this))},fn.prototype.cleanupDeps=function(){for(var e=this.deps.length;e--;){var t=this.deps[e];this.newDepIds.has(t.id)||t.removeSub(this)}var n=this.depIds;this.depIds=this.newDepIds,this.newDepIds=n,this.newDepIds.clear(),n=this.deps,this.deps=this.newDeps,this.newDeps=n,this.newDeps.length=0},fn.prototype.update=function(){this.lazy?this.dirty=!0:this.sync?this.run():function(e){var t=e.id;if(null==tn[t]){if(tn[t]=!0,rn){for(var n=Qt.length-1;n>on&&Qt[n].id>e.id;)n--;Qt.splice(n+1,0,e)}else Qt.push(e);nn||(nn=!0,Ye(un))}}(this)},fn.prototype.run=function(){if(this.active){var e=this.get();if(e!==this.value||o(e)||this.deep){var t=this.value;if(this.value=e,this.user)try{this.cb.call(this.vm,e,t)}catch(e){Re(e,this.vm,'callback for watcher "'+this.expression+'"')}else this.cb.call(this.vm,e,t)}}},fn.prototype.evaluate=function(){this.value=this.get(),this.dirty=!1},fn.prototype.depend=function(){for(var e=this.deps.length;e--;)this.deps[e].depend()},fn.prototype.teardown=function(){if(this.active){this.vm._isBeingDestroyed||h(this.vm._watchers,this);for(var e=this.deps.length;e--;)this.deps[e].removeSub(this);this.active=!1}};var pn={enumerable:!0,configurable:!0,get:S,set:S};function dn(e,t,n){pn.get=function(){return this[t][n]},pn.set=function(e){this[t][n]=e},Object.defineProperty(e,n,pn)}function vn(e){e._watchers=[];var t=e.$options;t.props&&function(e,t){var n=e.$options.propsData||{},r=e._props={},i=e.$options._propKeys=[];e.$parent&&$e(!1);var o=function(o){i.push(o);var a=Me(o,t,n,e);xe(r,o,a),o in e||dn(e,"_props",o)};for(var a in t)o(a);$e(!0)}(e,t.props),t.methods&&function(e,t){e.$options.props;for(var n in t)e[n]="function"!=typeof t[n]?S:x(t[n],e)}(e,t.methods),t.data?function(e){var t=e.$options.data;s(t=e._data="function"==typeof t?function(e,t){le();try{return e.call(t,t)}catch(e){return Re(e,t,"data()"),{}}finally{fe()}}(t,e):t||{})||(t={});var n=Object.keys(t),r=e.$options.props,i=(e.$options.methods,n.length);for(;i--;){var o=n[i];r&&y(r,o)||(a=void 0,36!==(a=(o+"").charCodeAt(0))&&95!==a&&dn(e,"_data",o))}var a;Ce(t,!0)}(e):Ce(e._data={},!0),t.computed&&function(e,t){var n=e._computedWatchers=Object.create(null),r=te();for(var i in t){var o=t[i],a="function"==typeof o?o:o.get;r||(n[i]=new fn(e,a||S,S,hn)),i in e||mn(e,i,o)}}(e,t.computed),t.watch&&t.watch!==Y&&function(e,t){for(var n in t){var r=t[n];if(Array.isArray(r))for(var i=0;i<r.length;i++)_n(e,n,r[i]);else _n(e,n,r)}}(e,t.watch)}var hn={lazy:!0};function mn(e,t,n){var r=!te();"function"==typeof n?(pn.get=r?yn(t):gn(n),pn.set=S):(pn.get=n.get?r&&!1!==n.cache?yn(t):gn(n.get):S,pn.set=n.set||S),Object.defineProperty(e,t,pn)}function yn(e){return function(){var t=this._computedWatchers&&this._computedWatchers[e];if(t)return t.dirty&&t.evaluate(),ce.target&&t.depend(),t.value}}function gn(e){return function(){return e.call(this,this)}}function _n(e,t,n,r){return s(n)&&(r=n,n=n.handler),"string"==typeof n&&(n=e[n]),e.$watch(t,n,r)}var bn=0;function $n(e){var t=e.options;if(e.super){var n=$n(e.super);if(n!==e.superOptions){e.superOptions=n;var r=function(e){var t,n=e.options,r=e.sealedOptions;for(var i in n)n[i]!==r[i]&&(t||(t={}),t[i]=n[i]);return t}(e);r&&A(e.extendOptions,r),(t=e.options=De(n,e.extendOptions)).name&&(t.components[t.name]=e)}}return t}function wn(e){this._init(e)}function Cn(e){e.cid=0;var t=1;e.extend=function(e){e=e||{};var n=this,r=n.cid,i=e._Ctor||(e._Ctor={});if(i[r])return i[r];var o=e.name||n.options.name,a=function(e){this._init(e)};return(a.prototype=Object.create(n.prototype)).constructor=a,a.cid=t++,a.options=De(n.options,e),a.super=n,a.options.props&&function(e){var t=e.options.props;for(var n in t)dn(e.prototype,"_props",n)}(a),a.options.computed&&function(e){var t=e.options.computed;for(var n in t)mn(e.prototype,n,t[n])}(a),a.extend=n.extend,a.mixin=n.mixin,a.use=n.use,M.forEach(function(e){a[e]=n[e]}),o&&(a.options.components[o]=a),a.superOptions=n.options,a.extendOptions=e,a.sealedOptions=A({},a.options),i[r]=a,a}}function xn(e){return e&&(e.Ctor.options.name||e.tag)}function kn(e,t){return Array.isArray(e)?e.indexOf(t)>-1:"string"==typeof e?e.split(",").indexOf(t)>-1:(n=e,"[object RegExp]"===a.call(n)&&e.test(t));var n}function An(e,t){var n=e.cache,r=e.keys,i=e._vnode;for(var o in n){var a=n[o];if(a){var s=xn(a.componentOptions);s&&!t(s)&&On(n,o,r,i)}}}function On(e,t,n,r){var i=e[t];!i||r&&i.tag===r.tag||i.componentInstance.$destroy(),e[t]=null,h(n,t)}!function(t){t.prototype._init=function(t){var n=this;n._uid=bn++,n._isVue=!0,t&&t._isComponent?function(e,t){var n=e.$options=Object.create(e.constructor.options),r=t._parentVnode;n.parent=t.parent,n._parentVnode=r;var i=r.componentOptions;n.propsData=i.propsData,n._parentListeners=i.listeners,n._renderChildren=i.children,n._componentTag=i.tag,t.render&&(n.render=t.render,n.staticRenderFns=t.staticRenderFns)}(n,t):n.$options=De($n(n.constructor),t||{},n),n._renderProxy=n,n._self=n,function(e){var t=e.$options,n=t.parent;if(n&&!t.abstract){for(;n.$options.abstract&&n.$parent;)n=n.$parent;n.$children.push(e)}e.$parent=n,e.$root=n?n.$root:e,e.$children=[],e.$refs={},e._watcher=null,e._inactive=null,e._directInactive=!1,e._isMounted=!1,e._isDestroyed=!1,e._isBeingDestroyed=!1}(n),function(e){e._events=Object.create(null),e._hasHookEvent=!1;var t=e.$options._parentListeners;t&&qt(e,t)}(n),function(t){t._vnode=null,t._staticTrees=null;var n=t.$options,r=t.$vnode=n._parentVnode,i=r&&r.context;t.$slots=ut(n._renderChildren,i),t.$scopedSlots=e,t._c=function(e,n,r,i){return Pt(t,e,n,r,i,!1)},t.$createElement=function(e,n,r,i){return Pt(t,e,n,r,i,!0)};var o=r&&r.data;xe(t,"$attrs",o&&o.attrs||e,null,!0),xe(t,"$listeners",n._parentListeners||e,null,!0)}(n),Yt(n,"beforeCreate"),function(e){var t=ct(e.$options.inject,e);t&&($e(!1),Object.keys(t).forEach(function(n){xe(e,n,t[n])}),$e(!0))}(n),vn(n),function(e){var t=e.$options.provide;t&&(e._provided="function"==typeof t?t.call(e):t)}(n),Yt(n,"created"),n.$options.el&&n.$mount(n.$options.el)}}(wn),function(e){var t={get:function(){return this._data}},n={get:function(){return this._props}};Object.defineProperty(e.prototype,"$data",t),Object.defineProperty(e.prototype,"$props",n),e.prototype.$set=ke,e.prototype.$delete=Ae,e.prototype.$watch=function(e,t,n){if(s(t))return _n(this,e,t,n);(n=n||{}).user=!0;var r=new fn(this,e,t,n);if(n.immediate)try{t.call(this,r.value)}catch(e){Re(e,this,'callback for immediate watcher "'+r.expression+'"')}return function(){r.teardown()}}}(wn),function(e){var t=/^hook:/;e.prototype.$on=function(e,n){var r=this;if(Array.isArray(e))for(var i=0,o=e.length;i<o;i++)r.$on(e[i],n);else(r._events[e]||(r._events[e]=[])).push(n),t.test(e)&&(r._hasHookEvent=!0);return r},e.prototype.$once=function(e,t){var n=this;function r(){n.$off(e,r),t.apply(n,arguments)}return r.fn=t,n.$on(e,r),n},e.prototype.$off=function(e,t){var n=this;if(!arguments.length)return n._events=Object.create(null),n;if(Array.isArray(e)){for(var r=0,i=e.length;r<i;r++)n.$off(e[r],t);return n}var o,a=n._events[e];if(!a)return n;if(!t)return n._events[e]=null,n;for(var s=a.length;s--;)if((o=a[s])===t||o.fn===t){a.splice(s,1);break}return n},e.prototype.$emit=function(e){var t=this._events[e];if(t){t=t.length>1?k(t):t;for(var n=k(arguments,1),r='event handler for "'+e+'"',i=0,o=t.length;i<o;i++)He(t[i],this,n,this,r)}return this}}(wn),function(e){e.prototype._update=function(e,t){var n=this,r=n.$el,i=n._vnode,o=Zt(n);n._vnode=e,n.$el=i?n.__patch__(i,e):n.__patch__(n.$el,e,t,!1),o(),r&&(r.__vue__=null),n.$el&&(n.$el.__vue__=n),n.$vnode&&n.$parent&&n.$vnode===n.$parent._vnode&&(n.$parent.$el=n.$el)},e.prototype.$forceUpdate=function(){this._watcher&&this._watcher.update()},e.prototype.$destroy=function(){var e=this;if(!e._isBeingDestroyed){Yt(e,"beforeDestroy"),e._isBeingDestroyed=!0;var t=e.$parent;!t||t._isBeingDestroyed||e.$options.abstract||h(t.$children,e),e._watcher&&e._watcher.teardown();for(var n=e._watchers.length;n--;)e._watchers[n].teardown();e._data.__ob__&&e._data.__ob__.vmCount--,e._isDestroyed=!0,e.__patch__(e._vnode,null),Yt(e,"destroyed"),e.$off(),e.$el&&(e.$el.__vue__=null),e.$vnode&&(e.$vnode.parent=null)}}}(wn),function(e){St(e.prototype),e.prototype.$nextTick=function(e){return Ye(e,this)},e.prototype._render=function(){var e,t=this,n=t.$options,r=n.render,i=n._parentVnode;i&&(t.$scopedSlots=ft(i.data.scopedSlots,t.$slots,t.$scopedSlots)),t.$vnode=i;try{Ht=t,e=r.call(t._renderProxy,t.$createElement)}catch(n){Re(n,t,"render"),e=t._vnode}finally{Ht=null}return Array.isArray(e)&&1===e.length&&(e=e[0]),e instanceof pe||(e=ve()),e.parent=i,e}}(wn);var Sn=[String,RegExp,Array],Tn={KeepAlive:{name:"keep-alive",abstract:!0,props:{include:Sn,exclude:Sn,max:[String,Number]},created:function(){this.cache=Object.create(null),this.keys=[]},destroyed:function(){for(var e in this.cache)On(this.cache,e,this.keys)},mounted:function(){var e=this;this.$watch("include",function(t){An(e,function(e){return kn(t,e)})}),this.$watch("exclude",function(t){An(e,function(e){return!kn(t,e)})})},render:function(){var e=this.$slots.default,t=zt(e),n=t&&t.componentOptions;if(n){var r=xn(n),i=this.include,o=this.exclude;if(i&&(!r||!kn(i,r))||o&&r&&kn(o,r))return t;var a=this.cache,s=this.keys,c=null==t.key?n.Ctor.cid+(n.tag?"::"+n.tag:""):t.key;a[c]?(t.componentInstance=a[c].componentInstance,h(s,c),s.push(c)):(a[c]=t,s.push(c),this.max&&s.length>parseInt(this.max)&&On(a,s[0],s,this._vnode)),t.data.keepAlive=!0}return t||e&&e[0]}}};!function(e){var t={get:function(){return F}};Object.defineProperty(e,"config",t),e.util={warn:ae,extend:A,mergeOptions:De,defineReactive:xe},e.set=ke,e.delete=Ae,e.nextTick=Ye,e.observable=function(e){return Ce(e),e},e.options=Object.create(null),M.forEach(function(t){e.options[t+"s"]=Object.create(null)}),e.options._base=e,A(e.options.components,Tn),function(e){e.use=function(e){var t=this._installedPlugins||(this._installedPlugins=[]);if(t.indexOf(e)>-1)return this;var n=k(arguments,1);return n.unshift(this),"function"==typeof e.install?e.install.apply(e,n):"function"==typeof e&&e.apply(null,n),t.push(e),this}}(e),function(e){e.mixin=function(e){return this.options=De(this.options,e),this}}(e),Cn(e),function(e){M.forEach(function(t){e[t]=function(e,n){return n?("component"===t&&s(n)&&(n.name=n.name||e,n=this.options._base.extend(n)),"directive"===t&&"function"==typeof n&&(n={bind:n,update:n}),this.options[t+"s"][e]=n,n):this.options[t+"s"][e]}})}(e)}(wn),Object.defineProperty(wn.prototype,"$isServer",{get:te}),Object.defineProperty(wn.prototype,"$ssrContext",{get:function(){return this.$vnode&&this.$vnode.ssrContext}}),Object.defineProperty(wn,"FunctionalRenderContext",{value:Tt}),wn.version="2.6.12";var En=p("style,class"),Nn=p("input,textarea,option,select,progress"),jn=function(e,t,n){return"value"===n&&Nn(e)&&"button"!==t||"selected"===n&&"option"===e||"checked"===n&&"input"===e||"muted"===n&&"video"===e},Dn=p("contenteditable,draggable,spellcheck"),Ln=p("events,caret,typing,plaintext-only"),Mn=function(e,t){return Hn(t)||"false"===t?"false":"contenteditable"===e&&Ln(t)?t:"true"},In=p("allowfullscreen,async,autofocus,autoplay,checked,compact,controls,declare,default,defaultchecked,defaultmuted,defaultselected,defer,disabled,enabled,formnovalidate,hidden,indeterminate,inert,ismap,itemscope,loop,multiple,muted,nohref,noresize,noshade,novalidate,nowrap,open,pauseonexit,readonly,required,reversed,scoped,seamless,selected,sortable,translate,truespeed,typemustmatch,visible"),Fn="http://www.w3.org/1999/xlink",Pn=function(e){return":"===e.charAt(5)&&"xlink"===e.slice(0,5)},Rn=function(e){return Pn(e)?e.slice(6,e.length):""},Hn=function(e){return null==e||!1===e};function Bn(e){for(var t=e.data,r=e,i=e;n(i.componentInstance);)(i=i.componentInstance._vnode)&&i.data&&(t=Un(i.data,t));for(;n(r=r.parent);)r&&r.data&&(t=Un(t,r.data));return function(e,t){if(n(e)||n(t))return zn(e,Vn(t));return""}(t.staticClass,t.class)}function Un(e,t){return{staticClass:zn(e.staticClass,t.staticClass),class:n(e.class)?[e.class,t.class]:t.class}}function zn(e,t){return e?t?e+" "+t:e:t||""}function Vn(e){return Array.isArray(e)?function(e){for(var t,r="",i=0,o=e.length;i<o;i++)n(t=Vn(e[i]))&&""!==t&&(r&&(r+=" "),r+=t);return r}(e):o(e)?function(e){var t="";for(var n in e)e[n]&&(t&&(t+=" "),t+=n);return t}(e):"string"==typeof e?e:""}var Kn={svg:"http://www.w3.org/2000/svg",math:"http://www.w3.org/1998/Math/MathML"},Jn=p("html,body,base,head,link,meta,style,title,address,article,aside,footer,header,h1,h2,h3,h4,h5,h6,hgroup,nav,section,div,dd,dl,dt,figcaption,figure,picture,hr,img,li,main,ol,p,pre,ul,a,b,abbr,bdi,bdo,br,cite,code,data,dfn,em,i,kbd,mark,q,rp,rt,rtc,ruby,s,samp,small,span,strong,sub,sup,time,u,var,wbr,area,audio,map,track,video,embed,object,param,source,canvas,script,noscript,del,ins,caption,col,colgroup,table,thead,tbody,td,th,tr,button,datalist,fieldset,form,input,label,legend,meter,optgroup,option,output,progress,select,textarea,details,dialog,menu,menuitem,summary,content,element,shadow,template,blockquote,iframe,tfoot"),qn=p("svg,animate,circle,clippath,cursor,defs,desc,ellipse,filter,font-face,foreignObject,g,glyph,image,line,marker,mask,missing-glyph,path,pattern,polygon,polyline,rect,switch,symbol,text,textpath,tspan,use,view",!0),Wn=function(e){return Jn(e)||qn(e)};function Zn(e){return qn(e)?"svg":"math"===e?"math":void 0}var Gn=Object.create(null);var Xn=p("text,number,password,search,email,tel,url");function Yn(e){if("string"==typeof e){var t=document.querySelector(e);return t||document.createElement("div")}return e}var Qn=Object.freeze({createElement:function(e,t){var n=document.createElement(e);return"select"!==e?n:(t.data&&t.data.attrs&&void 0!==t.data.attrs.multiple&&n.setAttribute("multiple","multiple"),n)},createElementNS:function(e,t){return document.createElementNS(Kn[e],t)},createTextNode:function(e){return document.createTextNode(e)},createComment:function(e){return document.createComment(e)},insertBefore:function(e,t,n){e.insertBefore(t,n)},removeChild:function(e,t){e.removeChild(t)},appendChild:function(e,t){e.appendChild(t)},parentNode:function(e){return e.parentNode},nextSibling:function(e){return e.nextSibling},tagName:function(e){return e.tagName},setTextContent:function(e,t){e.textContent=t},setStyleScope:function(e,t){e.setAttribute(t,"")}}),er={create:function(e,t){tr(t)},update:function(e,t){e.data.ref!==t.data.ref&&(tr(e,!0),tr(t))},destroy:function(e){tr(e,!0)}};function tr(e,t){var r=e.data.ref;if(n(r)){var i=e.context,o=e.componentInstance||e.elm,a=i.$refs;t?Array.isArray(a[r])?h(a[r],o):a[r]===o&&(a[r]=void 0):e.data.refInFor?Array.isArray(a[r])?a[r].indexOf(o)<0&&a[r].push(o):a[r]=[o]:a[r]=o}}var nr=new pe("",{},[]),rr=["create","activate","update","remove","destroy"];function ir(e,i){return e.key===i.key&&(e.tag===i.tag&&e.isComment===i.isComment&&n(e.data)===n(i.data)&&function(e,t){if("input"!==e.tag)return!0;var r,i=n(r=e.data)&&n(r=r.attrs)&&r.type,o=n(r=t.data)&&n(r=r.attrs)&&r.type;return i===o||Xn(i)&&Xn(o)}(e,i)||r(e.isAsyncPlaceholder)&&e.asyncFactory===i.asyncFactory&&t(i.asyncFactory.error))}function or(e,t,r){var i,o,a={};for(i=t;i<=r;++i)n(o=e[i].key)&&(a[o]=i);return a}var ar={create:sr,update:sr,destroy:function(e){sr(e,nr)}};function sr(e,t){(e.data.directives||t.data.directives)&&function(e,t){var n,r,i,o=e===nr,a=t===nr,s=ur(e.data.directives,e.context),c=ur(t.data.directives,t.context),u=[],l=[];for(n in c)r=s[n],i=c[n],r?(i.oldValue=r.value,i.oldArg=r.arg,fr(i,"update",t,e),i.def&&i.def.componentUpdated&&l.push(i)):(fr(i,"bind",t,e),i.def&&i.def.inserted&&u.push(i));if(u.length){var f=function(){for(var n=0;n<u.length;n++)fr(u[n],"inserted",t,e)};o?it(t,"insert",f):f()}l.length&&it(t,"postpatch",function(){for(var n=0;n<l.length;n++)fr(l[n],"componentUpdated",t,e)});if(!o)for(n in s)c[n]||fr(s[n],"unbind",e,e,a)}(e,t)}var cr=Object.create(null);function ur(e,t){var n,r,i=Object.create(null);if(!e)return i;for(n=0;n<e.length;n++)(r=e[n]).modifiers||(r.modifiers=cr),i[lr(r)]=r,r.def=Le(t.$options,"directives",r.name);return i}function lr(e){return e.rawName||e.name+"."+Object.keys(e.modifiers||{}).join(".")}function fr(e,t,n,r,i){var o=e.def&&e.def[t];if(o)try{o(n.elm,e,n,r,i)}catch(r){Re(r,n.context,"directive "+e.name+" "+t+" hook")}}var pr=[er,ar];function dr(e,r){var i=r.componentOptions;if(!(n(i)&&!1===i.Ctor.options.inheritAttrs||t(e.data.attrs)&&t(r.data.attrs))){var o,a,s=r.elm,c=e.data.attrs||{},u=r.data.attrs||{};for(o in n(u.__ob__)&&(u=r.data.attrs=A({},u)),u)a=u[o],c[o]!==a&&vr(s,o,a);for(o in(q||Z)&&u.value!==c.value&&vr(s,"value",u.value),c)t(u[o])&&(Pn(o)?s.removeAttributeNS(Fn,Rn(o)):Dn(o)||s.removeAttribute(o))}}function vr(e,t,n){e.tagName.indexOf("-")>-1?hr(e,t,n):In(t)?Hn(n)?e.removeAttribute(t):(n="allowfullscreen"===t&&"EMBED"===e.tagName?"true":t,e.setAttribute(t,n)):Dn(t)?e.setAttribute(t,Mn(t,n)):Pn(t)?Hn(n)?e.removeAttributeNS(Fn,Rn(t)):e.setAttributeNS(Fn,t,n):hr(e,t,n)}function hr(e,t,n){if(Hn(n))e.removeAttribute(t);else{if(q&&!W&&"TEXTAREA"===e.tagName&&"placeholder"===t&&""!==n&&!e.__ieph){var r=function(t){t.stopImmediatePropagation(),e.removeEventListener("input",r)};e.addEventListener("input",r),e.__ieph=!0}e.setAttribute(t,n)}}var mr={create:dr,update:dr};function yr(e,r){var i=r.elm,o=r.data,a=e.data;if(!(t(o.staticClass)&&t(o.class)&&(t(a)||t(a.staticClass)&&t(a.class)))){var s=Bn(r),c=i._transitionClasses;n(c)&&(s=zn(s,Vn(c))),s!==i._prevClass&&(i.setAttribute("class",s),i._prevClass=s)}}var gr,_r,br,$r,wr,Cr,xr={create:yr,update:yr},kr=/[\w).+\-_$\]]/;function Ar(e){var t,n,r,i,o,a=!1,s=!1,c=!1,u=!1,l=0,f=0,p=0,d=0;for(r=0;r<e.length;r++)if(n=t,t=e.charCodeAt(r),a)39===t&&92!==n&&(a=!1);else if(s)34===t&&92!==n&&(s=!1);else if(c)96===t&&92!==n&&(c=!1);else if(u)47===t&&92!==n&&(u=!1);else if(124!==t||124===e.charCodeAt(r+1)||124===e.charCodeAt(r-1)||l||f||p){switch(t){case 34:s=!0;break;case 39:a=!0;break;case 96:c=!0;break;case 40:p++;break;case 41:p--;break;case 91:f++;break;case 93:f--;break;case 123:l++;break;case 125:l--}if(47===t){for(var v=r-1,h=void 0;v>=0&&" "===(h=e.charAt(v));v--);h&&kr.test(h)||(u=!0)}}else void 0===i?(d=r+1,i=e.slice(0,r).trim()):m();function m(){(o||(o=[])).push(e.slice(d,r).trim()),d=r+1}if(void 0===i?i=e.slice(0,r).trim():0!==d&&m(),o)for(r=0;r<o.length;r++)i=Or(i,o[r]);return i}function Or(e,t){var n=t.indexOf("(");if(n<0)return'_f("'+t+'")('+e+")";var r=t.slice(0,n),i=t.slice(n+1);return'_f("'+r+'")('+e+(")"!==i?","+i:i)}function Sr(e,t){console.error("[Vue compiler]: "+e)}function Tr(e,t){return e?e.map(function(e){return e[t]}).filter(function(e){return e}):[]}function Er(e,t,n,r,i){(e.props||(e.props=[])).push(Rr({name:t,value:n,dynamic:i},r)),e.plain=!1}function Nr(e,t,n,r,i){(i?e.dynamicAttrs||(e.dynamicAttrs=[]):e.attrs||(e.attrs=[])).push(Rr({name:t,value:n,dynamic:i},r)),e.plain=!1}function jr(e,t,n,r){e.attrsMap[t]=n,e.attrsList.push(Rr({name:t,value:n},r))}function Dr(e,t,n,r,i,o,a,s){(e.directives||(e.directives=[])).push(Rr({name:t,rawName:n,value:r,arg:i,isDynamicArg:o,modifiers:a},s)),e.plain=!1}function Lr(e,t,n){return n?"_p("+t+',"'+e+'")':e+t}function Mr(t,n,r,i,o,a,s,c){var u;(i=i||e).right?c?n="("+n+")==='click'?'contextmenu':("+n+")":"click"===n&&(n="contextmenu",delete i.right):i.middle&&(c?n="("+n+")==='click'?'mouseup':("+n+")":"click"===n&&(n="mouseup")),i.capture&&(delete i.capture,n=Lr("!",n,c)),i.once&&(delete i.once,n=Lr("~",n,c)),i.passive&&(delete i.passive,n=Lr("&",n,c)),i.native?(delete i.native,u=t.nativeEvents||(t.nativeEvents={})):u=t.events||(t.events={});var l=Rr({value:r.trim(),dynamic:c},s);i!==e&&(l.modifiers=i);var f=u[n];Array.isArray(f)?o?f.unshift(l):f.push(l):u[n]=f?o?[l,f]:[f,l]:l,t.plain=!1}function Ir(e,t,n){var r=Fr(e,":"+t)||Fr(e,"v-bind:"+t);if(null!=r)return Ar(r);if(!1!==n){var i=Fr(e,t);if(null!=i)return JSON.stringify(i)}}function Fr(e,t,n){var r;if(null!=(r=e.attrsMap[t]))for(var i=e.attrsList,o=0,a=i.length;o<a;o++)if(i[o].name===t){i.splice(o,1);break}return n&&delete e.attrsMap[t],r}function Pr(e,t){for(var n=e.attrsList,r=0,i=n.length;r<i;r++){var o=n[r];if(t.test(o.name))return n.splice(r,1),o}}function Rr(e,t){return t&&(null!=t.start&&(e.start=t.start),null!=t.end&&(e.end=t.end)),e}function Hr(e,t,n){var r=n||{},i=r.number,o="$$v";r.trim&&(o="(typeof $$v === 'string'? $$v.trim(): $$v)"),i&&(o="_n("+o+")");var a=Br(t,o);e.model={value:"("+t+")",expression:JSON.stringify(t),callback:"function ($$v) {"+a+"}"}}function Br(e,t){var n=function(e){if(e=e.trim(),gr=e.length,e.indexOf("[")<0||e.lastIndexOf("]")<gr-1)return($r=e.lastIndexOf("."))>-1?{exp:e.slice(0,$r),key:'"'+e.slice($r+1)+'"'}:{exp:e,key:null};_r=e,$r=wr=Cr=0;for(;!zr();)Vr(br=Ur())?Jr(br):91===br&&Kr(br);return{exp:e.slice(0,wr),key:e.slice(wr+1,Cr)}}(e);return null===n.key?e+"="+t:"$set("+n.exp+", "+n.key+", "+t+")"}function Ur(){return _r.charCodeAt(++$r)}function zr(){return $r>=gr}function Vr(e){return 34===e||39===e}function Kr(e){var t=1;for(wr=$r;!zr();)if(Vr(e=Ur()))Jr(e);else if(91===e&&t++,93===e&&t--,0===t){Cr=$r;break}}function Jr(e){for(var t=e;!zr()&&(e=Ur())!==t;);}var qr,Wr="__r",Zr="__c";function Gr(e,t,n){var r=qr;return function i(){null!==t.apply(null,arguments)&&Qr(e,i,n,r)}}var Xr=Ve&&!(X&&Number(X[1])<=53);function Yr(e,t,n,r){if(Xr){var i=an,o=t;t=o._wrapper=function(e){if(e.target===e.currentTarget||e.timeStamp>=i||e.timeStamp<=0||e.target.ownerDocument!==document)return o.apply(this,arguments)}}qr.addEventListener(e,t,Q?{capture:n,passive:r}:n)}function Qr(e,t,n,r){(r||qr).removeEventListener(e,t._wrapper||t,n)}function ei(e,r){if(!t(e.data.on)||!t(r.data.on)){var i=r.data.on||{},o=e.data.on||{};qr=r.elm,function(e){if(n(e[Wr])){var t=q?"change":"input";e[t]=[].concat(e[Wr],e[t]||[]),delete e[Wr]}n(e[Zr])&&(e.change=[].concat(e[Zr],e.change||[]),delete e[Zr])}(i),rt(i,o,Yr,Qr,Gr,r.context),qr=void 0}}var ti,ni={create:ei,update:ei};function ri(e,r){if(!t(e.data.domProps)||!t(r.data.domProps)){var i,o,a=r.elm,s=e.data.domProps||{},c=r.data.domProps||{};for(i in n(c.__ob__)&&(c=r.data.domProps=A({},c)),s)i in c||(a[i]="");for(i in c){if(o=c[i],"textContent"===i||"innerHTML"===i){if(r.children&&(r.children.length=0),o===s[i])continue;1===a.childNodes.length&&a.removeChild(a.childNodes[0])}if("value"===i&&"PROGRESS"!==a.tagName){a._value=o;var u=t(o)?"":String(o);ii(a,u)&&(a.value=u)}else if("innerHTML"===i&&qn(a.tagName)&&t(a.innerHTML)){(ti=ti||document.createElement("div")).innerHTML="<svg>"+o+"</svg>";for(var l=ti.firstChild;a.firstChild;)a.removeChild(a.firstChild);for(;l.firstChild;)a.appendChild(l.firstChild)}else if(o!==s[i])try{a[i]=o}catch(e){}}}}function ii(e,t){return!e.composing&&("OPTION"===e.tagName||function(e,t){var n=!0;try{n=document.activeElement!==e}catch(e){}return n&&e.value!==t}(e,t)||function(e,t){var r=e.value,i=e._vModifiers;if(n(i)){if(i.number)return f(r)!==f(t);if(i.trim)return r.trim()!==t.trim()}return r!==t}(e,t))}var oi={create:ri,update:ri},ai=g(function(e){var t={},n=/:(.+)/;return e.split(/;(?![^(]*\))/g).forEach(function(e){if(e){var r=e.split(n);r.length>1&&(t[r[0].trim()]=r[1].trim())}}),t});function si(e){var t=ci(e.style);return e.staticStyle?A(e.staticStyle,t):t}function ci(e){return Array.isArray(e)?O(e):"string"==typeof e?ai(e):e}var ui,li=/^--/,fi=/\s*!important$/,pi=function(e,t,n){if(li.test(t))e.style.setProperty(t,n);else if(fi.test(n))e.style.setProperty(C(t),n.replace(fi,""),"important");else{var r=vi(t);if(Array.isArray(n))for(var i=0,o=n.length;i<o;i++)e.style[r]=n[i];else e.style[r]=n}},di=["Webkit","Moz","ms"],vi=g(function(e){if(ui=ui||document.createElement("div").style,"filter"!==(e=b(e))&&e in ui)return e;for(var t=e.charAt(0).toUpperCase()+e.slice(1),n=0;n<di.length;n++){var r=di[n]+t;if(r in ui)return r}});function hi(e,r){var i=r.data,o=e.data;if(!(t(i.staticStyle)&&t(i.style)&&t(o.staticStyle)&&t(o.style))){var a,s,c=r.elm,u=o.staticStyle,l=o.normalizedStyle||o.style||{},f=u||l,p=ci(r.data.style)||{};r.data.normalizedStyle=n(p.__ob__)?A({},p):p;var d=function(e,t){var n,r={};if(t)for(var i=e;i.componentInstance;)(i=i.componentInstance._vnode)&&i.data&&(n=si(i.data))&&A(r,n);(n=si(e.data))&&A(r,n);for(var o=e;o=o.parent;)o.data&&(n=si(o.data))&&A(r,n);return r}(r,!0);for(s in f)t(d[s])&&pi(c,s,"");for(s in d)(a=d[s])!==f[s]&&pi(c,s,null==a?"":a)}}var mi={create:hi,update:hi},yi=/\s+/;function gi(e,t){if(t&&(t=t.trim()))if(e.classList)t.indexOf(" ")>-1?t.split(yi).forEach(function(t){return e.classList.add(t)}):e.classList.add(t);else{var n=" "+(e.getAttribute("class")||"")+" ";n.indexOf(" "+t+" ")<0&&e.setAttribute("class",(n+t).trim())}}function _i(e,t){if(t&&(t=t.trim()))if(e.classList)t.indexOf(" ")>-1?t.split(yi).forEach(function(t){return e.classList.remove(t)}):e.classList.remove(t),e.classList.length||e.removeAttribute("class");else{for(var n=" "+(e.getAttribute("class")||"")+" ",r=" "+t+" ";n.indexOf(r)>=0;)n=n.replace(r," ");(n=n.trim())?e.setAttribute("class",n):e.removeAttribute("class")}}function bi(e){if(e){if("object"==typeof e){var t={};return!1!==e.css&&A(t,$i(e.name||"v")),A(t,e),t}return"string"==typeof e?$i(e):void 0}}var $i=g(function(e){return{enterClass:e+"-enter",enterToClass:e+"-enter-to",enterActiveClass:e+"-enter-active",leaveClass:e+"-leave",leaveToClass:e+"-leave-to",leaveActiveClass:e+"-leave-active"}}),wi=z&&!W,Ci="transition",xi="animation",ki="transition",Ai="transitionend",Oi="animation",Si="animationend";wi&&(void 0===window.ontransitionend&&void 0!==window.onwebkittransitionend&&(ki="WebkitTransition",Ai="webkitTransitionEnd"),void 0===window.onanimationend&&void 0!==window.onwebkitanimationend&&(Oi="WebkitAnimation",Si="webkitAnimationEnd"));var Ti=z?window.requestAnimationFrame?window.requestAnimationFrame.bind(window):setTimeout:function(e){return e()};function Ei(e){Ti(function(){Ti(e)})}function Ni(e,t){var n=e._transitionClasses||(e._transitionClasses=[]);n.indexOf(t)<0&&(n.push(t),gi(e,t))}function ji(e,t){e._transitionClasses&&h(e._transitionClasses,t),_i(e,t)}function Di(e,t,n){var r=Mi(e,t),i=r.type,o=r.timeout,a=r.propCount;if(!i)return n();var s=i===Ci?Ai:Si,c=0,u=function(){e.removeEventListener(s,l),n()},l=function(t){t.target===e&&++c>=a&&u()};setTimeout(function(){c<a&&u()},o+1),e.addEventListener(s,l)}var Li=/\b(transform|all)(,|$)/;function Mi(e,t){var n,r=window.getComputedStyle(e),i=(r[ki+"Delay"]||"").split(", "),o=(r[ki+"Duration"]||"").split(", "),a=Ii(i,o),s=(r[Oi+"Delay"]||"").split(", "),c=(r[Oi+"Duration"]||"").split(", "),u=Ii(s,c),l=0,f=0;return t===Ci?a>0&&(n=Ci,l=a,f=o.length):t===xi?u>0&&(n=xi,l=u,f=c.length):f=(n=(l=Math.max(a,u))>0?a>u?Ci:xi:null)?n===Ci?o.length:c.length:0,{type:n,timeout:l,propCount:f,hasTransform:n===Ci&&Li.test(r[ki+"Property"])}}function Ii(e,t){for(;e.length<t.length;)e=e.concat(e);return Math.max.apply(null,t.map(function(t,n){return Fi(t)+Fi(e[n])}))}function Fi(e){return 1e3*Number(e.slice(0,-1).replace(",","."))}function Pi(e,r){var i=e.elm;n(i._leaveCb)&&(i._leaveCb.cancelled=!0,i._leaveCb());var a=bi(e.data.transition);if(!t(a)&&!n(i._enterCb)&&1===i.nodeType){for(var s=a.css,c=a.type,u=a.enterClass,l=a.enterToClass,p=a.enterActiveClass,d=a.appearClass,v=a.appearToClass,h=a.appearActiveClass,m=a.beforeEnter,y=a.enter,g=a.afterEnter,_=a.enterCancelled,b=a.beforeAppear,$=a.appear,w=a.afterAppear,C=a.appearCancelled,x=a.duration,k=Wt,A=Wt.$vnode;A&&A.parent;)k=A.context,A=A.parent;var O=!k._isMounted||!e.isRootInsert;if(!O||$||""===$){var S=O&&d?d:u,T=O&&h?h:p,E=O&&v?v:l,N=O&&b||m,j=O&&"function"==typeof $?$:y,L=O&&w||g,M=O&&C||_,I=f(o(x)?x.enter:x),F=!1!==s&&!W,P=Bi(j),R=i._enterCb=D(function(){F&&(ji(i,E),ji(i,T)),R.cancelled?(F&&ji(i,S),M&&M(i)):L&&L(i),i._enterCb=null});e.data.show||it(e,"insert",function(){var t=i.parentNode,n=t&&t._pending&&t._pending[e.key];n&&n.tag===e.tag&&n.elm._leaveCb&&n.elm._leaveCb(),j&&j(i,R)}),N&&N(i),F&&(Ni(i,S),Ni(i,T),Ei(function(){ji(i,S),R.cancelled||(Ni(i,E),P||(Hi(I)?setTimeout(R,I):Di(i,c,R)))})),e.data.show&&(r&&r(),j&&j(i,R)),F||P||R()}}}function Ri(e,r){var i=e.elm;n(i._enterCb)&&(i._enterCb.cancelled=!0,i._enterCb());var a=bi(e.data.transition);if(t(a)||1!==i.nodeType)return r();if(!n(i._leaveCb)){var s=a.css,c=a.type,u=a.leaveClass,l=a.leaveToClass,p=a.leaveActiveClass,d=a.beforeLeave,v=a.leave,h=a.afterLeave,m=a.leaveCancelled,y=a.delayLeave,g=a.duration,_=!1!==s&&!W,b=Bi(v),$=f(o(g)?g.leave:g),w=i._leaveCb=D(function(){i.parentNode&&i.parentNode._pending&&(i.parentNode._pending[e.key]=null),_&&(ji(i,l),ji(i,p)),w.cancelled?(_&&ji(i,u),m&&m(i)):(r(),h&&h(i)),i._leaveCb=null});y?y(C):C()}function C(){w.cancelled||(!e.data.show&&i.parentNode&&((i.parentNode._pending||(i.parentNode._pending={}))[e.key]=e),d&&d(i),_&&(Ni(i,u),Ni(i,p),Ei(function(){ji(i,u),w.cancelled||(Ni(i,l),b||(Hi($)?setTimeout(w,$):Di(i,c,w)))})),v&&v(i,w),_||b||w())}}function Hi(e){return"number"==typeof e&&!isNaN(e)}function Bi(e){if(t(e))return!1;var r=e.fns;return n(r)?Bi(Array.isArray(r)?r[0]:r):(e._length||e.length)>1}function Ui(e,t){!0!==t.data.show&&Pi(t)}var zi=function(e){var o,a,s={},c=e.modules,u=e.nodeOps;for(o=0;o<rr.length;++o)for(s[rr[o]]=[],a=0;a<c.length;++a)n(c[a][rr[o]])&&s[rr[o]].push(c[a][rr[o]]);function l(e){var t=u.parentNode(e);n(t)&&u.removeChild(t,e)}function f(e,t,i,o,a,c,l){if(n(e.elm)&&n(c)&&(e=c[l]=me(e)),e.isRootInsert=!a,!function(e,t,i,o){var a=e.data;if(n(a)){var c=n(e.componentInstance)&&a.keepAlive;if(n(a=a.hook)&&n(a=a.init)&&a(e,!1),n(e.componentInstance))return d(e,t),v(i,e.elm,o),r(c)&&function(e,t,r,i){for(var o,a=e;a.componentInstance;)if(a=a.componentInstance._vnode,n(o=a.data)&&n(o=o.transition)){for(o=0;o<s.activate.length;++o)s.activate[o](nr,a);t.push(a);break}v(r,e.elm,i)}(e,t,i,o),!0}}(e,t,i,o)){var f=e.data,p=e.children,m=e.tag;n(m)?(e.elm=e.ns?u.createElementNS(e.ns,m):u.createElement(m,e),g(e),h(e,p,t),n(f)&&y(e,t),v(i,e.elm,o)):r(e.isComment)?(e.elm=u.createComment(e.text),v(i,e.elm,o)):(e.elm=u.createTextNode(e.text),v(i,e.elm,o))}}function d(e,t){n(e.data.pendingInsert)&&(t.push.apply(t,e.data.pendingInsert),e.data.pendingInsert=null),e.elm=e.componentInstance.$el,m(e)?(y(e,t),g(e)):(tr(e),t.push(e))}function v(e,t,r){n(e)&&(n(r)?u.parentNode(r)===e&&u.insertBefore(e,t,r):u.appendChild(e,t))}function h(e,t,n){if(Array.isArray(t))for(var r=0;r<t.length;++r)f(t[r],n,e.elm,null,!0,t,r);else i(e.text)&&u.appendChild(e.elm,u.createTextNode(String(e.text)))}function m(e){for(;e.componentInstance;)e=e.componentInstance._vnode;return n(e.tag)}function y(e,t){for(var r=0;r<s.create.length;++r)s.create[r](nr,e);n(o=e.data.hook)&&(n(o.create)&&o.create(nr,e),n(o.insert)&&t.push(e))}function g(e){var t;if(n(t=e.fnScopeId))u.setStyleScope(e.elm,t);else for(var r=e;r;)n(t=r.context)&&n(t=t.$options._scopeId)&&u.setStyleScope(e.elm,t),r=r.parent;n(t=Wt)&&t!==e.context&&t!==e.fnContext&&n(t=t.$options._scopeId)&&u.setStyleScope(e.elm,t)}function _(e,t,n,r,i,o){for(;r<=i;++r)f(n[r],o,e,t,!1,n,r)}function b(e){var t,r,i=e.data;if(n(i))for(n(t=i.hook)&&n(t=t.destroy)&&t(e),t=0;t<s.destroy.length;++t)s.destroy[t](e);if(n(t=e.children))for(r=0;r<e.children.length;++r)b(e.children[r])}function $(e,t,r){for(;t<=r;++t){var i=e[t];n(i)&&(n(i.tag)?(w(i),b(i)):l(i.elm))}}function w(e,t){if(n(t)||n(e.data)){var r,i=s.remove.length+1;for(n(t)?t.listeners+=i:t=function(e,t){function n(){0==--n.listeners&&l(e)}return n.listeners=t,n}(e.elm,i),n(r=e.componentInstance)&&n(r=r._vnode)&&n(r.data)&&w(r,t),r=0;r<s.remove.length;++r)s.remove[r](e,t);n(r=e.data.hook)&&n(r=r.remove)?r(e,t):t()}else l(e.elm)}function C(e,t,r,i){for(var o=r;o<i;o++){var a=t[o];if(n(a)&&ir(e,a))return o}}function x(e,i,o,a,c,l){if(e!==i){n(i.elm)&&n(a)&&(i=a[c]=me(i));var p=i.elm=e.elm;if(r(e.isAsyncPlaceholder))n(i.asyncFactory.resolved)?O(e.elm,i,o):i.isAsyncPlaceholder=!0;else if(r(i.isStatic)&&r(e.isStatic)&&i.key===e.key&&(r(i.isCloned)||r(i.isOnce)))i.componentInstance=e.componentInstance;else{var d,v=i.data;n(v)&&n(d=v.hook)&&n(d=d.prepatch)&&d(e,i);var h=e.children,y=i.children;if(n(v)&&m(i)){for(d=0;d<s.update.length;++d)s.update[d](e,i);n(d=v.hook)&&n(d=d.update)&&d(e,i)}t(i.text)?n(h)&&n(y)?h!==y&&function(e,r,i,o,a){for(var s,c,l,p=0,d=0,v=r.length-1,h=r[0],m=r[v],y=i.length-1,g=i[0],b=i[y],w=!a;p<=v&&d<=y;)t(h)?h=r[++p]:t(m)?m=r[--v]:ir(h,g)?(x(h,g,o,i,d),h=r[++p],g=i[++d]):ir(m,b)?(x(m,b,o,i,y),m=r[--v],b=i[--y]):ir(h,b)?(x(h,b,o,i,y),w&&u.insertBefore(e,h.elm,u.nextSibling(m.elm)),h=r[++p],b=i[--y]):ir(m,g)?(x(m,g,o,i,d),w&&u.insertBefore(e,m.elm,h.elm),m=r[--v],g=i[++d]):(t(s)&&(s=or(r,p,v)),t(c=n(g.key)?s[g.key]:C(g,r,p,v))?f(g,o,e,h.elm,!1,i,d):ir(l=r[c],g)?(x(l,g,o,i,d),r[c]=void 0,w&&u.insertBefore(e,l.elm,h.elm)):f(g,o,e,h.elm,!1,i,d),g=i[++d]);p>v?_(e,t(i[y+1])?null:i[y+1].elm,i,d,y,o):d>y&&$(r,p,v)}(p,h,y,o,l):n(y)?(n(e.text)&&u.setTextContent(p,""),_(p,null,y,0,y.length-1,o)):n(h)?$(h,0,h.length-1):n(e.text)&&u.setTextContent(p,""):e.text!==i.text&&u.setTextContent(p,i.text),n(v)&&n(d=v.hook)&&n(d=d.postpatch)&&d(e,i)}}}function k(e,t,i){if(r(i)&&n(e.parent))e.parent.data.pendingInsert=t;else for(var o=0;o<t.length;++o)t[o].data.hook.insert(t[o])}var A=p("attrs,class,staticClass,staticStyle,key");function O(e,t,i,o){var a,s=t.tag,c=t.data,u=t.children;if(o=o||c&&c.pre,t.elm=e,r(t.isComment)&&n(t.asyncFactory))return t.isAsyncPlaceholder=!0,!0;if(n(c)&&(n(a=c.hook)&&n(a=a.init)&&a(t,!0),n(a=t.componentInstance)))return d(t,i),!0;if(n(s)){if(n(u))if(e.hasChildNodes())if(n(a=c)&&n(a=a.domProps)&&n(a=a.innerHTML)){if(a!==e.innerHTML)return!1}else{for(var l=!0,f=e.firstChild,p=0;p<u.length;p++){if(!f||!O(f,u[p],i,o)){l=!1;break}f=f.nextSibling}if(!l||f)return!1}else h(t,u,i);if(n(c)){var v=!1;for(var m in c)if(!A(m)){v=!0,y(t,i);break}!v&&c.class&&et(c.class)}}else e.data!==t.text&&(e.data=t.text);return!0}return function(e,i,o,a){if(!t(i)){var c,l=!1,p=[];if(t(e))l=!0,f(i,p);else{var d=n(e.nodeType);if(!d&&ir(e,i))x(e,i,p,null,null,a);else{if(d){if(1===e.nodeType&&e.hasAttribute(L)&&(e.removeAttribute(L),o=!0),r(o)&&O(e,i,p))return k(i,p,!0),e;c=e,e=new pe(u.tagName(c).toLowerCase(),{},[],void 0,c)}var v=e.elm,h=u.parentNode(v);if(f(i,p,v._leaveCb?null:h,u.nextSibling(v)),n(i.parent))for(var y=i.parent,g=m(i);y;){for(var _=0;_<s.destroy.length;++_)s.destroy[_](y);if(y.elm=i.elm,g){for(var w=0;w<s.create.length;++w)s.create[w](nr,y);var C=y.data.hook.insert;if(C.merged)for(var A=1;A<C.fns.length;A++)C.fns[A]()}else tr(y);y=y.parent}n(h)?$([e],0,0):n(e.tag)&&b(e)}}return k(i,p,l),i.elm}n(e)&&b(e)}}({nodeOps:Qn,modules:[mr,xr,ni,oi,mi,z?{create:Ui,activate:Ui,remove:function(e,t){!0!==e.data.show?Ri(e,t):t()}}:{}].concat(pr)});W&&document.addEventListener("selectionchange",function(){var e=document.activeElement;e&&e.vmodel&&Xi(e,"input")});var Vi={inserted:function(e,t,n,r){"select"===n.tag?(r.elm&&!r.elm._vOptions?it(n,"postpatch",function(){Vi.componentUpdated(e,t,n)}):Ki(e,t,n.context),e._vOptions=[].map.call(e.options,Wi)):("textarea"===n.tag||Xn(e.type))&&(e._vModifiers=t.modifiers,t.modifiers.lazy||(e.addEventListener("compositionstart",Zi),e.addEventListener("compositionend",Gi),e.addEventListener("change",Gi),W&&(e.vmodel=!0)))},componentUpdated:function(e,t,n){if("select"===n.tag){Ki(e,t,n.context);var r=e._vOptions,i=e._vOptions=[].map.call(e.options,Wi);if(i.some(function(e,t){return!N(e,r[t])}))(e.multiple?t.value.some(function(e){return qi(e,i)}):t.value!==t.oldValue&&qi(t.value,i))&&Xi(e,"change")}}};function Ki(e,t,n){Ji(e,t,n),(q||Z)&&setTimeout(function(){Ji(e,t,n)},0)}function Ji(e,t,n){var r=t.value,i=e.multiple;if(!i||Array.isArray(r)){for(var o,a,s=0,c=e.options.length;s<c;s++)if(a=e.options[s],i)o=j(r,Wi(a))>-1,a.selected!==o&&(a.selected=o);else if(N(Wi(a),r))return void(e.selectedIndex!==s&&(e.selectedIndex=s));i||(e.selectedIndex=-1)}}function qi(e,t){return t.every(function(t){return!N(t,e)})}function Wi(e){return"_value"in e?e._value:e.value}function Zi(e){e.target.composing=!0}function Gi(e){e.target.composing&&(e.target.composing=!1,Xi(e.target,"input"))}function Xi(e,t){var n=document.createEvent("HTMLEvents");n.initEvent(t,!0,!0),e.dispatchEvent(n)}function Yi(e){return!e.componentInstance||e.data&&e.data.transition?e:Yi(e.componentInstance._vnode)}var Qi={model:Vi,show:{bind:function(e,t,n){var r=t.value,i=(n=Yi(n)).data&&n.data.transition,o=e.__vOriginalDisplay="none"===e.style.display?"":e.style.display;r&&i?(n.data.show=!0,Pi(n,function(){e.style.display=o})):e.style.display=r?o:"none"},update:function(e,t,n){var r=t.value;!r!=!t.oldValue&&((n=Yi(n)).data&&n.data.transition?(n.data.show=!0,r?Pi(n,function(){e.style.display=e.__vOriginalDisplay}):Ri(n,function(){e.style.display="none"})):e.style.display=r?e.__vOriginalDisplay:"none")},unbind:function(e,t,n,r,i){i||(e.style.display=e.__vOriginalDisplay)}}},eo={name:String,appear:Boolean,css:Boolean,mode:String,type:String,enterClass:String,leaveClass:String,enterToClass:String,leaveToClass:String,enterActiveClass:String,leaveActiveClass:String,appearClass:String,appearActiveClass:String,appearToClass:String,duration:[Number,String,Object]};function to(e){var t=e&&e.componentOptions;return t&&t.Ctor.options.abstract?to(zt(t.children)):e}function no(e){var t={},n=e.$options;for(var r in n.propsData)t[r]=e[r];var i=n._parentListeners;for(var o in i)t[b(o)]=i[o];return t}function ro(e,t){if(/\d-keep-alive$/.test(t.tag))return e("keep-alive",{props:t.componentOptions.propsData})}var io=function(e){return e.tag||Ut(e)},oo=function(e){return"show"===e.name},ao={name:"transition",props:eo,abstract:!0,render:function(e){var t=this,n=this.$slots.default;if(n&&(n=n.filter(io)).length){var r=this.mode,o=n[0];if(function(e){for(;e=e.parent;)if(e.data.transition)return!0}(this.$vnode))return o;var a=to(o);if(!a)return o;if(this._leaving)return ro(e,o);var s="__transition-"+this._uid+"-";a.key=null==a.key?a.isComment?s+"comment":s+a.tag:i(a.key)?0===String(a.key).indexOf(s)?a.key:s+a.key:a.key;var c=(a.data||(a.data={})).transition=no(this),u=this._vnode,l=to(u);if(a.data.directives&&a.data.directives.some(oo)&&(a.data.show=!0),l&&l.data&&!function(e,t){return t.key===e.key&&t.tag===e.tag}(a,l)&&!Ut(l)&&(!l.componentInstance||!l.componentInstance._vnode.isComment)){var f=l.data.transition=A({},c);if("out-in"===r)return this._leaving=!0,it(f,"afterLeave",function(){t._leaving=!1,t.$forceUpdate()}),ro(e,o);if("in-out"===r){if(Ut(a))return u;var p,d=function(){p()};it(c,"afterEnter",d),it(c,"enterCancelled",d),it(f,"delayLeave",function(e){p=e})}}return o}}},so=A({tag:String,moveClass:String},eo);function co(e){e.elm._moveCb&&e.elm._moveCb(),e.elm._enterCb&&e.elm._enterCb()}function uo(e){e.data.newPos=e.elm.getBoundingClientRect()}function lo(e){var t=e.data.pos,n=e.data.newPos,r=t.left-n.left,i=t.top-n.top;if(r||i){e.data.moved=!0;var o=e.elm.style;o.transform=o.WebkitTransform="translate("+r+"px,"+i+"px)",o.transitionDuration="0s"}}delete so.mode;var fo={Transition:ao,TransitionGroup:{props:so,beforeMount:function(){var e=this,t=this._update;this._update=function(n,r){var i=Zt(e);e.__patch__(e._vnode,e.kept,!1,!0),e._vnode=e.kept,i(),t.call(e,n,r)}},render:function(e){for(var t=this.tag||this.$vnode.data.tag||"span",n=Object.create(null),r=this.prevChildren=this.children,i=this.$slots.default||[],o=this.children=[],a=no(this),s=0;s<i.length;s++){var c=i[s];c.tag&&null!=c.key&&0!==String(c.key).indexOf("__vlist")&&(o.push(c),n[c.key]=c,(c.data||(c.data={})).transition=a)}if(r){for(var u=[],l=[],f=0;f<r.length;f++){var p=r[f];p.data.transition=a,p.data.pos=p.elm.getBoundingClientRect(),n[p.key]?u.push(p):l.push(p)}this.kept=e(t,null,u),this.removed=l}return e(t,null,o)},updated:function(){var e=this.prevChildren,t=this.moveClass||(this.name||"v")+"-move";e.length&&this.hasMove(e[0].elm,t)&&(e.forEach(co),e.forEach(uo),e.forEach(lo),this._reflow=document.body.offsetHeight,e.forEach(function(e){if(e.data.moved){var n=e.elm,r=n.style;Ni(n,t),r.transform=r.WebkitTransform=r.transitionDuration="",n.addEventListener(Ai,n._moveCb=function e(r){r&&r.target!==n||r&&!/transform$/.test(r.propertyName)||(n.removeEventListener(Ai,e),n._moveCb=null,ji(n,t))})}}))},methods:{hasMove:function(e,t){if(!wi)return!1;if(this._hasMove)return this._hasMove;var n=e.cloneNode();e._transitionClasses&&e._transitionClasses.forEach(function(e){_i(n,e)}),gi(n,t),n.style.display="none",this.$el.appendChild(n);var r=Mi(n);return this.$el.removeChild(n),this._hasMove=r.hasTransform}}}};wn.config.mustUseProp=jn,wn.config.isReservedTag=Wn,wn.config.isReservedAttr=En,wn.config.getTagNamespace=Zn,wn.config.isUnknownElement=function(e){if(!z)return!0;if(Wn(e))return!1;if(e=e.toLowerCase(),null!=Gn[e])return Gn[e];var t=document.createElement(e);return e.indexOf("-")>-1?Gn[e]=t.constructor===window.HTMLUnknownElement||t.constructor===window.HTMLElement:Gn[e]=/HTMLUnknownElement/.test(t.toString())},A(wn.options.directives,Qi),A(wn.options.components,fo),wn.prototype.__patch__=z?zi:S,wn.prototype.$mount=function(e,t){return function(e,t,n){var r;return e.$el=t,e.$options.render||(e.$options.render=ve),Yt(e,"beforeMount"),r=function(){e._update(e._render(),n)},new fn(e,r,S,{before:function(){e._isMounted&&!e._isDestroyed&&Yt(e,"beforeUpdate")}},!0),n=!1,null==e.$vnode&&(e._isMounted=!0,Yt(e,"mounted")),e}(this,e=e&&z?Yn(e):void 0,t)},z&&setTimeout(function(){F.devtools&&ne&&ne.emit("init",wn)},0);var po=/\{\{((?:.|\r?\n)+?)\}\}/g,vo=/[-.*+?^${}()|[\]\/\\]/g,ho=g(function(e){var t=e[0].replace(vo,"\\$&"),n=e[1].replace(vo,"\\$&");return new RegExp(t+"((?:.|\\n)+?)"+n,"g")});var mo={staticKeys:["staticClass"],transformNode:function(e,t){t.warn;var n=Fr(e,"class");n&&(e.staticClass=JSON.stringify(n));var r=Ir(e,"class",!1);r&&(e.classBinding=r)},genData:function(e){var t="";return e.staticClass&&(t+="staticClass:"+e.staticClass+","),e.classBinding&&(t+="class:"+e.classBinding+","),t}};var yo,go={staticKeys:["staticStyle"],transformNode:function(e,t){t.warn;var n=Fr(e,"style");n&&(e.staticStyle=JSON.stringify(ai(n)));var r=Ir(e,"style",!1);r&&(e.styleBinding=r)},genData:function(e){var t="";return e.staticStyle&&(t+="staticStyle:"+e.staticStyle+","),e.styleBinding&&(t+="style:("+e.styleBinding+"),"),t}},_o=function(e){return(yo=yo||document.createElement("div")).innerHTML=e,yo.textContent},bo=p("area,base,br,col,embed,frame,hr,img,input,isindex,keygen,link,meta,param,source,track,wbr"),$o=p("colgroup,dd,dt,li,options,p,td,tfoot,th,thead,tr,source"),wo=p("address,article,aside,base,blockquote,body,caption,col,colgroup,dd,details,dialog,div,dl,dt,fieldset,figcaption,figure,footer,form,h1,h2,h3,h4,h5,h6,head,header,hgroup,hr,html,legend,li,menuitem,meta,optgroup,option,param,rp,rt,source,style,summary,tbody,td,tfoot,th,thead,title,tr,track"),Co=/^\s*([^\s"'<>\/=]+)(?:\s*(=)\s*(?:"([^"]*)"+|'([^']*)'+|([^\s"'=<>`]+)))?/,xo=/^\s*((?:v-[\w-]+:|@|:|#)\[[^=]+\][^\s"'<>\/=]*)(?:\s*(=)\s*(?:"([^"]*)"+|'([^']*)'+|([^\s"'=<>`]+)))?/,ko="[a-zA-Z_][\\-\\.0-9_a-zA-Z"+P.source+"]*",Ao="((?:"+ko+"\\:)?"+ko+")",Oo=new RegExp("^<"+Ao),So=/^\s*(\/?)>/,To=new RegExp("^<\\/"+Ao+"[^>]*>"),Eo=/^<!DOCTYPE [^>]+>/i,No=/^<!\--/,jo=/^<!\[/,Do=p("script,style,textarea",!0),Lo={},Mo={"&lt;":"<","&gt;":">","&quot;":'"',"&amp;":"&","&#10;":"\n","&#9;":"\t","&#39;":"'"},Io=/&(?:lt|gt|quot|amp|#39);/g,Fo=/&(?:lt|gt|quot|amp|#39|#10|#9);/g,Po=p("pre,textarea",!0),Ro=function(e,t){return e&&Po(e)&&"\n"===t[0]};function Ho(e,t){var n=t?Fo:Io;return e.replace(n,function(e){return Mo[e]})}var Bo,Uo,zo,Vo,Ko,Jo,qo,Wo,Zo=/^@|^v-on:/,Go=/^v-|^@|^:|^#/,Xo=/([\s\S]*?)\s+(?:in|of)\s+([\s\S]*)/,Yo=/,([^,\}\]]*)(?:,([^,\}\]]*))?$/,Qo=/^\(|\)$/g,ea=/^\[.*\]$/,ta=/:(.*)$/,na=/^:|^\.|^v-bind:/,ra=/\.[^.\]]+(?=[^\]]*$)/g,ia=/^v-slot(:|$)|^#/,oa=/[\r\n]/,aa=/\s+/g,sa=g(_o),ca="_empty_";function ua(e,t,n){return{type:1,tag:e,attrsList:t,attrsMap:ma(t),rawAttrsMap:{},parent:n,children:[]}}function la(e,t){Bo=t.warn||Sr,Jo=t.isPreTag||T,qo=t.mustUseProp||T,Wo=t.getTagNamespace||T;t.isReservedTag;zo=Tr(t.modules,"transformNode"),Vo=Tr(t.modules,"preTransformNode"),Ko=Tr(t.modules,"postTransformNode"),Uo=t.delimiters;var n,r,i=[],o=!1!==t.preserveWhitespace,a=t.whitespace,s=!1,c=!1;function u(e){if(l(e),s||e.processed||(e=fa(e,t)),i.length||e===n||n.if&&(e.elseif||e.else)&&da(n,{exp:e.elseif,block:e}),r&&!e.forbidden)if(e.elseif||e.else)a=e,(u=function(e){var t=e.length;for(;t--;){if(1===e[t].type)return e[t];e.pop()}}(r.children))&&u.if&&da(u,{exp:a.elseif,block:a});else{if(e.slotScope){var o=e.slotTarget||'"default"';(r.scopedSlots||(r.scopedSlots={}))[o]=e}r.children.push(e),e.parent=r}var a,u;e.children=e.children.filter(function(e){return!e.slotScope}),l(e),e.pre&&(s=!1),Jo(e.tag)&&(c=!1);for(var f=0;f<Ko.length;f++)Ko[f](e,t)}function l(e){if(!c)for(var t;(t=e.children[e.children.length-1])&&3===t.type&&" "===t.text;)e.children.pop()}return function(e,t){for(var n,r,i=[],o=t.expectHTML,a=t.isUnaryTag||T,s=t.canBeLeftOpenTag||T,c=0;e;){if(n=e,r&&Do(r)){var u=0,l=r.toLowerCase(),f=Lo[l]||(Lo[l]=new RegExp("([\\s\\S]*?)(</"+l+"[^>]*>)","i")),p=e.replace(f,function(e,n,r){return u=r.length,Do(l)||"noscript"===l||(n=n.replace(/<!\--([\s\S]*?)-->/g,"$1").replace(/<!\[CDATA\[([\s\S]*?)]]>/g,"$1")),Ro(l,n)&&(n=n.slice(1)),t.chars&&t.chars(n),""});c+=e.length-p.length,e=p,A(l,c-u,c)}else{var d=e.indexOf("<");if(0===d){if(No.test(e)){var v=e.indexOf("--\x3e");if(v>=0){t.shouldKeepComment&&t.comment(e.substring(4,v),c,c+v+3),C(v+3);continue}}if(jo.test(e)){var h=e.indexOf("]>");if(h>=0){C(h+2);continue}}var m=e.match(Eo);if(m){C(m[0].length);continue}var y=e.match(To);if(y){var g=c;C(y[0].length),A(y[1],g,c);continue}var _=x();if(_){k(_),Ro(_.tagName,e)&&C(1);continue}}var b=void 0,$=void 0,w=void 0;if(d>=0){for($=e.slice(d);!(To.test($)||Oo.test($)||No.test($)||jo.test($)||(w=$.indexOf("<",1))<0);)d+=w,$=e.slice(d);b=e.substring(0,d)}d<0&&(b=e),b&&C(b.length),t.chars&&b&&t.chars(b,c-b.length,c)}if(e===n){t.chars&&t.chars(e);break}}function C(t){c+=t,e=e.substring(t)}function x(){var t=e.match(Oo);if(t){var n,r,i={tagName:t[1],attrs:[],start:c};for(C(t[0].length);!(n=e.match(So))&&(r=e.match(xo)||e.match(Co));)r.start=c,C(r[0].length),r.end=c,i.attrs.push(r);if(n)return i.unarySlash=n[1],C(n[0].length),i.end=c,i}}function k(e){var n=e.tagName,c=e.unarySlash;o&&("p"===r&&wo(n)&&A(r),s(n)&&r===n&&A(n));for(var u=a(n)||!!c,l=e.attrs.length,f=new Array(l),p=0;p<l;p++){var d=e.attrs[p],v=d[3]||d[4]||d[5]||"",h="a"===n&&"href"===d[1]?t.shouldDecodeNewlinesForHref:t.shouldDecodeNewlines;f[p]={name:d[1],value:Ho(v,h)}}u||(i.push({tag:n,lowerCasedTag:n.toLowerCase(),attrs:f,start:e.start,end:e.end}),r=n),t.start&&t.start(n,f,u,e.start,e.end)}function A(e,n,o){var a,s;if(null==n&&(n=c),null==o&&(o=c),e)for(s=e.toLowerCase(),a=i.length-1;a>=0&&i[a].lowerCasedTag!==s;a--);else a=0;if(a>=0){for(var u=i.length-1;u>=a;u--)t.end&&t.end(i[u].tag,n,o);i.length=a,r=a&&i[a-1].tag}else"br"===s?t.start&&t.start(e,[],!0,n,o):"p"===s&&(t.start&&t.start(e,[],!1,n,o),t.end&&t.end(e,n,o))}A()}(e,{warn:Bo,expectHTML:t.expectHTML,isUnaryTag:t.isUnaryTag,canBeLeftOpenTag:t.canBeLeftOpenTag,shouldDecodeNewlines:t.shouldDecodeNewlines,shouldDecodeNewlinesForHref:t.shouldDecodeNewlinesForHref,shouldKeepComment:t.comments,outputSourceRange:t.outputSourceRange,start:function(e,o,a,l,f){var p=r&&r.ns||Wo(e);q&&"svg"===p&&(o=function(e){for(var t=[],n=0;n<e.length;n++){var r=e[n];ya.test(r.name)||(r.name=r.name.replace(ga,""),t.push(r))}return t}(o));var d,v=ua(e,o,r);p&&(v.ns=p),"style"!==(d=v).tag&&("script"!==d.tag||d.attrsMap.type&&"text/javascript"!==d.attrsMap.type)||te()||(v.forbidden=!0);for(var h=0;h<Vo.length;h++)v=Vo[h](v,t)||v;s||(!function(e){null!=Fr(e,"v-pre")&&(e.pre=!0)}(v),v.pre&&(s=!0)),Jo(v.tag)&&(c=!0),s?function(e){var t=e.attrsList,n=t.length;if(n)for(var r=e.attrs=new Array(n),i=0;i<n;i++)r[i]={name:t[i].name,value:JSON.stringify(t[i].value)},null!=t[i].start&&(r[i].start=t[i].start,r[i].end=t[i].end);else e.pre||(e.plain=!0)}(v):v.processed||(pa(v),function(e){var t=Fr(e,"v-if");if(t)e.if=t,da(e,{exp:t,block:e});else{null!=Fr(e,"v-else")&&(e.else=!0);var n=Fr(e,"v-else-if");n&&(e.elseif=n)}}(v),function(e){null!=Fr(e,"v-once")&&(e.once=!0)}(v)),n||(n=v),a?u(v):(r=v,i.push(v))},end:function(e,t,n){var o=i[i.length-1];i.length-=1,r=i[i.length-1],u(o)},chars:function(e,t,n){if(r&&(!q||"textarea"!==r.tag||r.attrsMap.placeholder!==e)){var i,u,l,f=r.children;if(e=c||e.trim()?"script"===(i=r).tag||"style"===i.tag?e:sa(e):f.length?a?"condense"===a&&oa.test(e)?"":" ":o?" ":"":"")c||"condense"!==a||(e=e.replace(aa," ")),!s&&" "!==e&&(u=function(e,t){var n=t?ho(t):po;if(n.test(e)){for(var r,i,o,a=[],s=[],c=n.lastIndex=0;r=n.exec(e);){(i=r.index)>c&&(s.push(o=e.slice(c,i)),a.push(JSON.stringify(o)));var u=Ar(r[1].trim());a.push("_s("+u+")"),s.push({"@binding":u}),c=i+r[0].length}return c<e.length&&(s.push(o=e.slice(c)),a.push(JSON.stringify(o))),{expression:a.join("+"),tokens:s}}}(e,Uo))?l={type:2,expression:u.expression,tokens:u.tokens,text:e}:" "===e&&f.length&&" "===f[f.length-1].text||(l={type:3,text:e}),l&&f.push(l)}},comment:function(e,t,n){if(r){var i={type:3,text:e,isComment:!0};r.children.push(i)}}}),n}function fa(e,t){var n,r;(r=Ir(n=e,"key"))&&(n.key=r),e.plain=!e.key&&!e.scopedSlots&&!e.attrsList.length,function(e){var t=Ir(e,"ref");t&&(e.ref=t,e.refInFor=function(e){var t=e;for(;t;){if(void 0!==t.for)return!0;t=t.parent}return!1}(e))}(e),function(e){var t;"template"===e.tag?(t=Fr(e,"scope"),e.slotScope=t||Fr(e,"slot-scope")):(t=Fr(e,"slot-scope"))&&(e.slotScope=t);var n=Ir(e,"slot");n&&(e.slotTarget='""'===n?'"default"':n,e.slotTargetDynamic=!(!e.attrsMap[":slot"]&&!e.attrsMap["v-bind:slot"]),"template"===e.tag||e.slotScope||Nr(e,"slot",n,function(e,t){return e.rawAttrsMap[":"+t]||e.rawAttrsMap["v-bind:"+t]||e.rawAttrsMap[t]}(e,"slot")));if("template"===e.tag){var r=Pr(e,ia);if(r){var i=va(r),o=i.name,a=i.dynamic;e.slotTarget=o,e.slotTargetDynamic=a,e.slotScope=r.value||ca}}else{var s=Pr(e,ia);if(s){var c=e.scopedSlots||(e.scopedSlots={}),u=va(s),l=u.name,f=u.dynamic,p=c[l]=ua("template",[],e);p.slotTarget=l,p.slotTargetDynamic=f,p.children=e.children.filter(function(e){if(!e.slotScope)return e.parent=p,!0}),p.slotScope=s.value||ca,e.children=[],e.plain=!1}}}(e),function(e){"slot"===e.tag&&(e.slotName=Ir(e,"name"))}(e),function(e){var t;(t=Ir(e,"is"))&&(e.component=t);null!=Fr(e,"inline-template")&&(e.inlineTemplate=!0)}(e);for(var i=0;i<zo.length;i++)e=zo[i](e,t)||e;return function(e){var t,n,r,i,o,a,s,c,u=e.attrsList;for(t=0,n=u.length;t<n;t++)if(r=i=u[t].name,o=u[t].value,Go.test(r))if(e.hasBindings=!0,(a=ha(r.replace(Go,"")))&&(r=r.replace(ra,"")),na.test(r))r=r.replace(na,""),o=Ar(o),(c=ea.test(r))&&(r=r.slice(1,-1)),a&&(a.prop&&!c&&"innerHtml"===(r=b(r))&&(r="innerHTML"),a.camel&&!c&&(r=b(r)),a.sync&&(s=Br(o,"$event"),c?Mr(e,'"update:"+('+r+")",s,null,!1,0,u[t],!0):(Mr(e,"update:"+b(r),s,null,!1,0,u[t]),C(r)!==b(r)&&Mr(e,"update:"+C(r),s,null,!1,0,u[t])))),a&&a.prop||!e.component&&qo(e.tag,e.attrsMap.type,r)?Er(e,r,o,u[t],c):Nr(e,r,o,u[t],c);else if(Zo.test(r))r=r.replace(Zo,""),(c=ea.test(r))&&(r=r.slice(1,-1)),Mr(e,r,o,a,!1,0,u[t],c);else{var l=(r=r.replace(Go,"")).match(ta),f=l&&l[1];c=!1,f&&(r=r.slice(0,-(f.length+1)),ea.test(f)&&(f=f.slice(1,-1),c=!0)),Dr(e,r,i,o,f,c,a,u[t])}else Nr(e,r,JSON.stringify(o),u[t]),!e.component&&"muted"===r&&qo(e.tag,e.attrsMap.type,r)&&Er(e,r,"true",u[t])}(e),e}function pa(e){var t;if(t=Fr(e,"v-for")){var n=function(e){var t=e.match(Xo);if(!t)return;var n={};n.for=t[2].trim();var r=t[1].trim().replace(Qo,""),i=r.match(Yo);i?(n.alias=r.replace(Yo,"").trim(),n.iterator1=i[1].trim(),i[2]&&(n.iterator2=i[2].trim())):n.alias=r;return n}(t);n&&A(e,n)}}function da(e,t){e.ifConditions||(e.ifConditions=[]),e.ifConditions.push(t)}function va(e){var t=e.name.replace(ia,"");return t||"#"!==e.name[0]&&(t="default"),ea.test(t)?{name:t.slice(1,-1),dynamic:!0}:{name:'"'+t+'"',dynamic:!1}}function ha(e){var t=e.match(ra);if(t){var n={};return t.forEach(function(e){n[e.slice(1)]=!0}),n}}function ma(e){for(var t={},n=0,r=e.length;n<r;n++)t[e[n].name]=e[n].value;return t}var ya=/^xmlns:NS\d+/,ga=/^NS\d+:/;function _a(e){return ua(e.tag,e.attrsList.slice(),e.parent)}var ba=[mo,go,{preTransformNode:function(e,t){if("input"===e.tag){var n,r=e.attrsMap;if(!r["v-model"])return;if((r[":type"]||r["v-bind:type"])&&(n=Ir(e,"type")),r.type||n||!r["v-bind"]||(n="("+r["v-bind"]+").type"),n){var i=Fr(e,"v-if",!0),o=i?"&&("+i+")":"",a=null!=Fr(e,"v-else",!0),s=Fr(e,"v-else-if",!0),c=_a(e);pa(c),jr(c,"type","checkbox"),fa(c,t),c.processed=!0,c.if="("+n+")==='checkbox'"+o,da(c,{exp:c.if,block:c});var u=_a(e);Fr(u,"v-for",!0),jr(u,"type","radio"),fa(u,t),da(c,{exp:"("+n+")==='radio'"+o,block:u});var l=_a(e);return Fr(l,"v-for",!0),jr(l,":type",n),fa(l,t),da(c,{exp:i,block:l}),a?c.else=!0:s&&(c.elseif=s),c}}}}];var $a,wa,Ca={expectHTML:!0,modules:ba,directives:{model:function(e,t,n){var r=t.value,i=t.modifiers,o=e.tag,a=e.attrsMap.type;if(e.component)return Hr(e,r,i),!1;if("select"===o)!function(e,t,n){var r='var $$selectedVal = Array.prototype.filter.call($event.target.options,function(o){return o.selected}).map(function(o){var val = "_value" in o ? o._value : o.value;return '+(n&&n.number?"_n(val)":"val")+"});";r=r+" "+Br(t,"$event.target.multiple ? $$selectedVal : $$selectedVal[0]"),Mr(e,"change",r,null,!0)}(e,r,i);else if("input"===o&&"checkbox"===a)!function(e,t,n){var r=n&&n.number,i=Ir(e,"value")||"null",o=Ir(e,"true-value")||"true",a=Ir(e,"false-value")||"false";Er(e,"checked","Array.isArray("+t+")?_i("+t+","+i+")>-1"+("true"===o?":("+t+")":":_q("+t+","+o+")")),Mr(e,"change","var $$a="+t+",$$el=$event.target,$$c=$$el.checked?("+o+"):("+a+");if(Array.isArray($$a)){var $$v="+(r?"_n("+i+")":i)+",$$i=_i($$a,$$v);if($$el.checked){$$i<0&&("+Br(t,"$$a.concat([$$v])")+")}else{$$i>-1&&("+Br(t,"$$a.slice(0,$$i).concat($$a.slice($$i+1))")+")}}else{"+Br(t,"$$c")+"}",null,!0)}(e,r,i);else if("input"===o&&"radio"===a)!function(e,t,n){var r=n&&n.number,i=Ir(e,"value")||"null";Er(e,"checked","_q("+t+","+(i=r?"_n("+i+")":i)+")"),Mr(e,"change",Br(t,i),null,!0)}(e,r,i);else if("input"===o||"textarea"===o)!function(e,t,n){var r=e.attrsMap.type,i=n||{},o=i.lazy,a=i.number,s=i.trim,c=!o&&"range"!==r,u=o?"change":"range"===r?Wr:"input",l="$event.target.value";s&&(l="$event.target.value.trim()"),a&&(l="_n("+l+")");var f=Br(t,l);c&&(f="if($event.target.composing)return;"+f),Er(e,"value","("+t+")"),Mr(e,u,f,null,!0),(s||a)&&Mr(e,"blur","$forceUpdate()")}(e,r,i);else if(!F.isReservedTag(o))return Hr(e,r,i),!1;return!0},text:function(e,t){t.value&&Er(e,"textContent","_s("+t.value+")",t)},html:function(e,t){t.value&&Er(e,"innerHTML","_s("+t.value+")",t)}},isPreTag:function(e){return"pre"===e},isUnaryTag:bo,mustUseProp:jn,canBeLeftOpenTag:$o,isReservedTag:Wn,getTagNamespace:Zn,staticKeys:function(e){return e.reduce(function(e,t){return e.concat(t.staticKeys||[])},[]).join(",")}(ba)},xa=g(function(e){return p("type,tag,attrsList,attrsMap,plain,parent,children,attrs,start,end,rawAttrsMap"+(e?","+e:""))});function ka(e,t){e&&($a=xa(t.staticKeys||""),wa=t.isReservedTag||T,function e(t){t.static=function(e){if(2===e.type)return!1;if(3===e.type)return!0;return!(!e.pre&&(e.hasBindings||e.if||e.for||d(e.tag)||!wa(e.tag)||function(e){for(;e.parent;){if("template"!==(e=e.parent).tag)return!1;if(e.for)return!0}return!1}(e)||!Object.keys(e).every($a)))}(t);if(1===t.type){if(!wa(t.tag)&&"slot"!==t.tag&&null==t.attrsMap["inline-template"])return;for(var n=0,r=t.children.length;n<r;n++){var i=t.children[n];e(i),i.static||(t.static=!1)}if(t.ifConditions)for(var o=1,a=t.ifConditions.length;o<a;o++){var s=t.ifConditions[o].block;e(s),s.static||(t.static=!1)}}}(e),function e(t,n){if(1===t.type){if((t.static||t.once)&&(t.staticInFor=n),t.static&&t.children.length&&(1!==t.children.length||3!==t.children[0].type))return void(t.staticRoot=!0);if(t.staticRoot=!1,t.children)for(var r=0,i=t.children.length;r<i;r++)e(t.children[r],n||!!t.for);if(t.ifConditions)for(var o=1,a=t.ifConditions.length;o<a;o++)e(t.ifConditions[o].block,n)}}(e,!1))}var Aa=/^([\w$_]+|\([^)]*?\))\s*=>|^function(?:\s+[\w$]+)?\s*\(/,Oa=/\([^)]*?\);*$/,Sa=/^[A-Za-z_$][\w$]*(?:\.[A-Za-z_$][\w$]*|\['[^']*?']|\["[^"]*?"]|\[\d+]|\[[A-Za-z_$][\w$]*])*$/,Ta={esc:27,tab:9,enter:13,space:32,up:38,left:37,right:39,down:40,delete:[8,46]},Ea={esc:["Esc","Escape"],tab:"Tab",enter:"Enter",space:[" ","Spacebar"],up:["Up","ArrowUp"],left:["Left","ArrowLeft"],right:["Right","ArrowRight"],down:["Down","ArrowDown"],delete:["Backspace","Delete","Del"]},Na=function(e){return"if("+e+")return null;"},ja={stop:"$event.stopPropagation();",prevent:"$event.preventDefault();",self:Na("$event.target !== $event.currentTarget"),ctrl:Na("!$event.ctrlKey"),shift:Na("!$event.shiftKey"),alt:Na("!$event.altKey"),meta:Na("!$event.metaKey"),left:Na("'button' in $event && $event.button !== 0"),middle:Na("'button' in $event && $event.button !== 1"),right:Na("'button' in $event && $event.button !== 2")};function Da(e,t){var n=t?"nativeOn:":"on:",r="",i="";for(var o in e){var a=La(e[o]);e[o]&&e[o].dynamic?i+=o+","+a+",":r+='"'+o+'":'+a+","}return r="{"+r.slice(0,-1)+"}",i?n+"_d("+r+",["+i.slice(0,-1)+"])":n+r}function La(e){if(!e)return"function(){}";if(Array.isArray(e))return"["+e.map(function(e){return La(e)}).join(",")+"]";var t=Sa.test(e.value),n=Aa.test(e.value),r=Sa.test(e.value.replace(Oa,""));if(e.modifiers){var i="",o="",a=[];for(var s in e.modifiers)if(ja[s])o+=ja[s],Ta[s]&&a.push(s);else if("exact"===s){var c=e.modifiers;o+=Na(["ctrl","shift","alt","meta"].filter(function(e){return!c[e]}).map(function(e){return"$event."+e+"Key"}).join("||"))}else a.push(s);return a.length&&(i+=function(e){return"if(!$event.type.indexOf('key')&&"+e.map(Ma).join("&&")+")return null;"}(a)),o&&(i+=o),"function($event){"+i+(t?"return "+e.value+"($event)":n?"return ("+e.value+")($event)":r?"return "+e.value:e.value)+"}"}return t||n?e.value:"function($event){"+(r?"return "+e.value:e.value)+"}"}function Ma(e){var t=parseInt(e,10);if(t)return"$event.keyCode!=="+t;var n=Ta[e],r=Ea[e];return"_k($event.keyCode,"+JSON.stringify(e)+","+JSON.stringify(n)+",$event.key,"+JSON.stringify(r)+")"}var Ia={on:function(e,t){e.wrapListeners=function(e){return"_g("+e+","+t.value+")"}},bind:function(e,t){e.wrapData=function(n){return"_b("+n+",'"+e.tag+"',"+t.value+","+(t.modifiers&&t.modifiers.prop?"true":"false")+(t.modifiers&&t.modifiers.sync?",true":"")+")"}},cloak:S},Fa=function(e){this.options=e,this.warn=e.warn||Sr,this.transforms=Tr(e.modules,"transformCode"),this.dataGenFns=Tr(e.modules,"genData"),this.directives=A(A({},Ia),e.directives);var t=e.isReservedTag||T;this.maybeComponent=function(e){return!!e.component||!t(e.tag)},this.onceId=0,this.staticRenderFns=[],this.pre=!1};function Pa(e,t){var n=new Fa(t);return{render:"with(this){return "+(e?Ra(e,n):'_c("div")')+"}",staticRenderFns:n.staticRenderFns}}function Ra(e,t){if(e.parent&&(e.pre=e.pre||e.parent.pre),e.staticRoot&&!e.staticProcessed)return Ha(e,t);if(e.once&&!e.onceProcessed)return Ba(e,t);if(e.for&&!e.forProcessed)return za(e,t);if(e.if&&!e.ifProcessed)return Ua(e,t);if("template"!==e.tag||e.slotTarget||t.pre){if("slot"===e.tag)return function(e,t){var n=e.slotName||'"default"',r=qa(e,t),i="_t("+n+(r?","+r:""),o=e.attrs||e.dynamicAttrs?Ga((e.attrs||[]).concat(e.dynamicAttrs||[]).map(function(e){return{name:b(e.name),value:e.value,dynamic:e.dynamic}})):null,a=e.attrsMap["v-bind"];!o&&!a||r||(i+=",null");o&&(i+=","+o);a&&(i+=(o?"":",null")+","+a);return i+")"}(e,t);var n;if(e.component)n=function(e,t,n){var r=t.inlineTemplate?null:qa(t,n,!0);return"_c("+e+","+Va(t,n)+(r?","+r:"")+")"}(e.component,e,t);else{var r;(!e.plain||e.pre&&t.maybeComponent(e))&&(r=Va(e,t));var i=e.inlineTemplate?null:qa(e,t,!0);n="_c('"+e.tag+"'"+(r?","+r:"")+(i?","+i:"")+")"}for(var o=0;o<t.transforms.length;o++)n=t.transforms[o](e,n);return n}return qa(e,t)||"void 0"}function Ha(e,t){e.staticProcessed=!0;var n=t.pre;return e.pre&&(t.pre=e.pre),t.staticRenderFns.push("with(this){return "+Ra(e,t)+"}"),t.pre=n,"_m("+(t.staticRenderFns.length-1)+(e.staticInFor?",true":"")+")"}function Ba(e,t){if(e.onceProcessed=!0,e.if&&!e.ifProcessed)return Ua(e,t);if(e.staticInFor){for(var n="",r=e.parent;r;){if(r.for){n=r.key;break}r=r.parent}return n?"_o("+Ra(e,t)+","+t.onceId+++","+n+")":Ra(e,t)}return Ha(e,t)}function Ua(e,t,n,r){return e.ifProcessed=!0,function e(t,n,r,i){if(!t.length)return i||"_e()";var o=t.shift();return o.exp?"("+o.exp+")?"+a(o.block)+":"+e(t,n,r,i):""+a(o.block);function a(e){return r?r(e,n):e.once?Ba(e,n):Ra(e,n)}}(e.ifConditions.slice(),t,n,r)}function za(e,t,n,r){var i=e.for,o=e.alias,a=e.iterator1?","+e.iterator1:"",s=e.iterator2?","+e.iterator2:"";return e.forProcessed=!0,(r||"_l")+"(("+i+"),function("+o+a+s+"){return "+(n||Ra)(e,t)+"})"}function Va(e,t){var n="{",r=function(e,t){var n=e.directives;if(!n)return;var r,i,o,a,s="directives:[",c=!1;for(r=0,i=n.length;r<i;r++){o=n[r],a=!0;var u=t.directives[o.name];u&&(a=!!u(e,o,t.warn)),a&&(c=!0,s+='{name:"'+o.name+'",rawName:"'+o.rawName+'"'+(o.value?",value:("+o.value+"),expression:"+JSON.stringify(o.value):"")+(o.arg?",arg:"+(o.isDynamicArg?o.arg:'"'+o.arg+'"'):"")+(o.modifiers?",modifiers:"+JSON.stringify(o.modifiers):"")+"},")}if(c)return s.slice(0,-1)+"]"}(e,t);r&&(n+=r+","),e.key&&(n+="key:"+e.key+","),e.ref&&(n+="ref:"+e.ref+","),e.refInFor&&(n+="refInFor:true,"),e.pre&&(n+="pre:true,"),e.component&&(n+='tag:"'+e.tag+'",');for(var i=0;i<t.dataGenFns.length;i++)n+=t.dataGenFns[i](e);if(e.attrs&&(n+="attrs:"+Ga(e.attrs)+","),e.props&&(n+="domProps:"+Ga(e.props)+","),e.events&&(n+=Da(e.events,!1)+","),e.nativeEvents&&(n+=Da(e.nativeEvents,!0)+","),e.slotTarget&&!e.slotScope&&(n+="slot:"+e.slotTarget+","),e.scopedSlots&&(n+=function(e,t,n){var r=e.for||Object.keys(t).some(function(e){var n=t[e];return n.slotTargetDynamic||n.if||n.for||Ka(n)}),i=!!e.if;if(!r)for(var o=e.parent;o;){if(o.slotScope&&o.slotScope!==ca||o.for){r=!0;break}o.if&&(i=!0),o=o.parent}var a=Object.keys(t).map(function(e){return Ja(t[e],n)}).join(",");return"scopedSlots:_u(["+a+"]"+(r?",null,true":"")+(!r&&i?",null,false,"+function(e){var t=5381,n=e.length;for(;n;)t=33*t^e.charCodeAt(--n);return t>>>0}(a):"")+")"}(e,e.scopedSlots,t)+","),e.model&&(n+="model:{value:"+e.model.value+",callback:"+e.model.callback+",expression:"+e.model.expression+"},"),e.inlineTemplate){var o=function(e,t){var n=e.children[0];if(n&&1===n.type){var r=Pa(n,t.options);return"inlineTemplate:{render:function(){"+r.render+"},staticRenderFns:["+r.staticRenderFns.map(function(e){return"function(){"+e+"}"}).join(",")+"]}"}}(e,t);o&&(n+=o+",")}return n=n.replace(/,$/,"")+"}",e.dynamicAttrs&&(n="_b("+n+',"'+e.tag+'",'+Ga(e.dynamicAttrs)+")"),e.wrapData&&(n=e.wrapData(n)),e.wrapListeners&&(n=e.wrapListeners(n)),n}function Ka(e){return 1===e.type&&("slot"===e.tag||e.children.some(Ka))}function Ja(e,t){var n=e.attrsMap["slot-scope"];if(e.if&&!e.ifProcessed&&!n)return Ua(e,t,Ja,"null");if(e.for&&!e.forProcessed)return za(e,t,Ja);var r=e.slotScope===ca?"":String(e.slotScope),i="function("+r+"){return "+("template"===e.tag?e.if&&n?"("+e.if+")?"+(qa(e,t)||"undefined")+":undefined":qa(e,t)||"undefined":Ra(e,t))+"}",o=r?"":",proxy:true";return"{key:"+(e.slotTarget||'"default"')+",fn:"+i+o+"}"}function qa(e,t,n,r,i){var o=e.children;if(o.length){var a=o[0];if(1===o.length&&a.for&&"template"!==a.tag&&"slot"!==a.tag){var s=n?t.maybeComponent(a)?",1":",0":"";return""+(r||Ra)(a,t)+s}var c=n?function(e,t){for(var n=0,r=0;r<e.length;r++){var i=e[r];if(1===i.type){if(Wa(i)||i.ifConditions&&i.ifConditions.some(function(e){return Wa(e.block)})){n=2;break}(t(i)||i.ifConditions&&i.ifConditions.some(function(e){return t(e.block)}))&&(n=1)}}return n}(o,t.maybeComponent):0,u=i||Za;return"["+o.map(function(e){return u(e,t)}).join(",")+"]"+(c?","+c:"")}}function Wa(e){return void 0!==e.for||"template"===e.tag||"slot"===e.tag}function Za(e,t){return 1===e.type?Ra(e,t):3===e.type&&e.isComment?(r=e,"_e("+JSON.stringify(r.text)+")"):"_v("+(2===(n=e).type?n.expression:Xa(JSON.stringify(n.text)))+")";var n,r}function Ga(e){for(var t="",n="",r=0;r<e.length;r++){var i=e[r],o=Xa(i.value);i.dynamic?n+=i.name+","+o+",":t+='"'+i.name+'":'+o+","}return t="{"+t.slice(0,-1)+"}",n?"_d("+t+",["+n.slice(0,-1)+"])":t}function Xa(e){return e.replace(/\u2028/g,"\\u2028").replace(/\u2029/g,"\\u2029")}new RegExp("\\b"+"do,if,for,let,new,try,var,case,else,with,await,break,catch,class,const,super,throw,while,yield,delete,export,import,return,switch,default,extends,finally,continue,debugger,function,arguments".split(",").join("\\b|\\b")+"\\b");function Ya(e,t){try{return new Function(e)}catch(n){return t.push({err:n,code:e}),S}}function Qa(e){var t=Object.create(null);return function(n,r,i){(r=A({},r)).warn;delete r.warn;var o=r.delimiters?String(r.delimiters)+n:n;if(t[o])return t[o];var a=e(n,r),s={},c=[];return s.render=Ya(a.render,c),s.staticRenderFns=a.staticRenderFns.map(function(e){return Ya(e,c)}),t[o]=s}}var es,ts,ns=(es=function(e,t){var n=la(e.trim(),t);!1!==t.optimize&&ka(n,t);var r=Pa(n,t);return{ast:n,render:r.render,staticRenderFns:r.staticRenderFns}},function(e){function t(t,n){var r=Object.create(e),i=[],o=[];if(n)for(var a in n.modules&&(r.modules=(e.modules||[]).concat(n.modules)),n.directives&&(r.directives=A(Object.create(e.directives||null),n.directives)),n)"modules"!==a&&"directives"!==a&&(r[a]=n[a]);r.warn=function(e,t,n){(n?o:i).push(e)};var s=es(t.trim(),r);return s.errors=i,s.tips=o,s}return{compile:t,compileToFunctions:Qa(t)}})(Ca),rs=(ns.compile,ns.compileToFunctions);function is(e){return(ts=ts||document.createElement("div")).innerHTML=e?'<a href="\n"/>':'<div a="\n"/>',ts.innerHTML.indexOf("&#10;")>0}var os=!!z&&is(!1),as=!!z&&is(!0),ss=g(function(e){var t=Yn(e);return t&&t.innerHTML}),cs=wn.prototype.$mount;return wn.prototype.$mount=function(e,t){if((e=e&&Yn(e))===document.body||e===document.documentElement)return this;var n=this.$options;if(!n.render){var r=n.template;if(r)if("string"==typeof r)"#"===r.charAt(0)&&(r=ss(r));else{if(!r.nodeType)return this;r=r.innerHTML}else e&&(r=function(e){if(e.outerHTML)return e.outerHTML;var t=document.createElement("div");return t.appendChild(e.cloneNode(!0)),t.innerHTML}(e));if(r){var i=rs(r,{outputSourceRange:!1,shouldDecodeNewlines:os,shouldDecodeNewlinesForHref:as,delimiters:n.delimiters,comments:n.comments},this),o=i.render,a=i.staticRenderFns;n.render=o,n.staticRenderFns=a}}return cs.call(this,e,t)},wn.compile=rs,wn});

		var Vue = __vueExports.Vue;

		const argumentAsArray = argument => Array.isArray(argument) ? argument : [argument];
		const isElement = target => target instanceof Node;
		const isElementList = nodeList => nodeList instanceof NodeList;
		const eachNode = (nodeList, callback) => {
			if (nodeList && callback) {
				nodeList = isElementList(nodeList) ? nodeList : [nodeList];
				for (let i = 0; i < nodeList.length; i++) {
					if (callback(nodeList[i], i, nodeList.length) === true) {
						break;
					}
				}
			}
		};
		const throwError = message => console.error(`[scroll-lock] ${message}`);
		const arrayAsSelector = array => {
			if (Array.isArray(array)) {
				const selector = array.join(', ');
				return selector;
			}
		};
		const nodeListAsArray = nodeList => {
			const nodes = [];
			eachNode(nodeList, node => nodes.push(node));
			return nodes;
		};
		const findParentBySelector = ($el, selector, self = true, $root = document) => {
			if (self && nodeListAsArray($root.querySelectorAll(selector)).indexOf($el) !== -1) {
				return $el;
			}
			while (($el = $el.parentElement) && nodeListAsArray($root.querySelectorAll(selector)).indexOf($el) === -1);
			return $el;
		};
		const elementHasSelector = ($el, selector, $root = document) => {
			const has = nodeListAsArray($root.querySelectorAll(selector)).indexOf($el) !== -1;
			return has;
		};
		const elementHasOverflowHidden = $el => {
			if ($el) {
				const computedStyle = getComputedStyle($el);
				const overflowIsHidden = computedStyle.overflow === 'hidden';
				return overflowIsHidden;
			}
		};
		const elementScrollTopOnStart = $el => {
			if ($el) {
				if (elementHasOverflowHidden($el)) {
					return true;
				}
				const scrollTop = $el.scrollTop;
				return scrollTop <= 0;
			}
		};
		const elementScrollTopOnEnd = $el => {
			if ($el) {
				if (elementHasOverflowHidden($el)) {
					return true;
				}
				const scrollTop = $el.scrollTop;
				const scrollHeight = $el.scrollHeight;
				const scrollTopWithHeight = scrollTop + $el.offsetHeight;
				return scrollTopWithHeight >= scrollHeight;
			}
		};
		const elementScrollLeftOnStart = $el => {
			if ($el) {
				if (elementHasOverflowHidden($el)) {
					return true;
				}
				const scrollLeft = $el.scrollLeft;
				return scrollLeft <= 0;
			}
		};
		const elementScrollLeftOnEnd = $el => {
			if ($el) {
				if (elementHasOverflowHidden($el)) {
					return true;
				}
				const scrollLeft = $el.scrollLeft;
				const scrollWidth = $el.scrollWidth;
				const scrollLeftWithWidth = scrollLeft + $el.offsetWidth;
				return scrollLeftWithWidth >= scrollWidth;
			}
		};
		const elementIsScrollableField = $el => {
			const selector = 'textarea, [contenteditable="true"]';
			return elementHasSelector($el, selector);
		};
		const elementIsInputRange = $el => {
			const selector = 'input[type="range"]';
			return elementHasSelector($el, selector);
		};

		const FILL_GAP_AVAILABLE_METHODS = ['padding', 'margin', 'width', 'max-width', 'none'];
		const TOUCH_DIRECTION_DETECT_OFFSET = 3;
		const state = {
			scroll: true,
			queue: 0,
			scrollableSelectors: ['[data-scroll-lock-scrollable]'],
			lockableSelectors: ['body', '[data-scroll-lock-lockable]'],
			fillGapSelectors: ['body', '[data-scroll-lock-fill-gap]', '[data-scroll-lock-lockable]'],
			fillGapMethod: FILL_GAP_AVAILABLE_METHODS[0],
			//
			startTouchY: 0,
			startTouchX: 0
		};
		const disablePageScroll = target => {
			if (state.queue <= 0) {
				state.scroll = false;
				hideLockableOverflow();
				fillGaps();
			}
			addScrollableTarget(target);
			state.queue++;
		};
		const enablePageScroll = target => {
			state.queue > 0 && state.queue--;
			if (state.queue <= 0) {
				state.scroll = true;
				showLockableOverflow();
				unfillGaps();
			}
			removeScrollableTarget(target);
		};
		const getScrollState = () => {
			return state.scroll;
		};
		const getTargetScrollBarWidth = ($target, onlyExists = false) => {
			if (isElement($target)) {
				const currentOverflowYProperty = $target.style.overflowY;
				if (onlyExists) {
					if (!getScrollState()) {
						$target.style.overflowY = $target.dataset.scrollLockSavedOverflowYProperty;
					}
				} else {
					$target.style.overflowY = 'scroll';
				}
				const width = getCurrentTargetScrollBarWidth($target);
				$target.style.overflowY = currentOverflowYProperty;
				return width;
			} else {
				return 0;
			}
		};
		const getCurrentTargetScrollBarWidth = $target => {
			if (isElement($target)) {
				if ($target === document.body) {
					const documentWidth = document.documentElement.clientWidth;
					const windowWidth = window.innerWidth;
					const currentWidth = windowWidth - documentWidth;
					return currentWidth;
				} else {
					const borderLeftWidthCurrentProperty = $target.style.borderLeftWidth;
					const borderRightWidthCurrentProperty = $target.style.borderRightWidth;
					$target.style.borderLeftWidth = '0px';
					$target.style.borderRightWidth = '0px';
					const currentWidth = $target.offsetWidth - $target.clientWidth;
					$target.style.borderLeftWidth = borderLeftWidthCurrentProperty;
					$target.style.borderRightWidth = borderRightWidthCurrentProperty;
					return currentWidth;
				}
			} else {
				return 0;
			}
		};
		const addScrollableTarget = target => {
			if (target) {
				const targets = argumentAsArray(target);
				targets.map($targets => {
					eachNode($targets, $target => {
						if (isElement($target)) {
							$target.dataset.scrollLockScrollable = '';
						} else {
							throwError(`"${$target}" is not a Element.`);
						}
					});
				});
			}
		};
		const removeScrollableTarget = target => {
			if (target) {
				const targets = argumentAsArray(target);
				targets.map($targets => {
					eachNode($targets, $target => {
						if (isElement($target)) {
							delete $target.dataset.scrollLockScrollable;
						} else {
							throwError(`"${$target}" is not a Element.`);
						}
					});
				});
			}
		};
		const addLockableTarget = target => {
			if (target) {
				const targets = argumentAsArray(target);
				targets.map($targets => {
					eachNode($targets, $target => {
						if (isElement($target)) {
							$target.dataset.scrollLockLockable = '';
						} else {
							throwError(`"${$target}" is not a Element.`);
						}
					});
				});
				if (!getScrollState()) {
					hideLockableOverflow();
				}
			}
		};
		const removeLockableTarget = target => {
			if (target) {
				const targets = argumentAsArray(target);
				targets.map($targets => {
					eachNode($targets, $target => {
						if (isElement($target)) {
							delete $target.dataset.scrollLockLockable;
							showLockableOverflowTarget($target);
						} else {
							throwError(`"${$target}" is not a Element.`);
						}
					});
				});
			}
		};
		const addFillGapTarget = target => {
			if (target) {
				const targets = argumentAsArray(target);
				targets.map($targets => {
					eachNode($targets, $target => {
						if (isElement($target)) {
							$target.dataset.scrollLockFillGap = '';
							if (!state.scroll) {
								fillGapTarget($target);
							}
						} else {
							throwError(`"${$target}" is not a Element.`);
						}
					});
				});
			}
		};
		const removeFillGapTarget = target => {
			if (target) {
				const targets = argumentAsArray(target);
				targets.map($targets => {
					eachNode($targets, $target => {
						if (isElement($target)) {
							delete $target.dataset.scrollLockFillGap;
							if (!state.scroll) {
								unfillGapTarget($target);
							}
						} else {
							throwError(`"${$target}" is not a Element.`);
						}
					});
				});
			}
		};
		const refillGaps = () => {
			if (!state.scroll) {
				fillGaps();
			}
		};
		const hideLockableOverflow = () => {
			const selector = arrayAsSelector(state.lockableSelectors);
			hideLockableOverflowSelector(selector);
		};
		const showLockableOverflow = () => {
			const selector = arrayAsSelector(state.lockableSelectors);
			showLockableOverflowSelector(selector);
		};
		const hideLockableOverflowSelector = selector => {
			const $targets = document.querySelectorAll(selector);
			eachNode($targets, $target => {
				hideLockableOverflowTarget($target);
			});
		};
		const showLockableOverflowSelector = selector => {
			const $targets = document.querySelectorAll(selector);
			eachNode($targets, $target => {
				showLockableOverflowTarget($target);
			});
		};
		const hideLockableOverflowTarget = $target => {
			if (isElement($target) && $target.dataset.scrollLockLocked !== 'true') {
				const computedStyle = window.getComputedStyle($target);
				$target.dataset.scrollLockSavedOverflowYProperty = computedStyle.overflowY;
				$target.dataset.scrollLockSavedInlineOverflowProperty = $target.style.overflow;
				$target.dataset.scrollLockSavedInlineOverflowYProperty = $target.style.overflowY;
				$target.style.overflow = 'hidden';
				$target.dataset.scrollLockLocked = 'true';
			}
		};
		const showLockableOverflowTarget = $target => {
			if (isElement($target) && $target.dataset.scrollLockLocked === 'true') {
				$target.style.overflow = $target.dataset.scrollLockSavedInlineOverflowProperty;
				$target.style.overflowY = $target.dataset.scrollLockSavedInlineOverflowYProperty;
				delete $target.dataset.scrollLockSavedOverflowYProperty;
				delete $target.dataset.scrollLockSavedInlineOverflowProperty;
				delete $target.dataset.scrollLockSavedInlineOverflowYProperty;
				delete $target.dataset.scrollLockLocked;
			}
		};
		const fillGaps = () => {
			state.fillGapSelectors.map(selector => {
				fillGapSelector(selector);
			});
		};
		const unfillGaps = () => {
			state.fillGapSelectors.map(selector => {
				unfillGapSelector(selector);
			});
		};
		const fillGapSelector = selector => {
			const $targets = document.querySelectorAll(selector);
			const isLockable = state.lockableSelectors.indexOf(selector) !== -1;
			eachNode($targets, $target => {
				fillGapTarget($target, isLockable);
			});
		};
		const fillGapTarget = ($target, isLockable = false) => {
			if (isElement($target)) {
				let scrollBarWidth;
				if ($target.dataset.scrollLockLockable === '' || isLockable) {
					scrollBarWidth = getTargetScrollBarWidth($target, true);
				} else {
					const $lockableParent = findParentBySelector($target, arrayAsSelector(state.lockableSelectors));
					scrollBarWidth = getTargetScrollBarWidth($lockableParent, true);
				}
				if ($target.dataset.scrollLockFilledGap === 'true') {
					unfillGapTarget($target);
				}
				const computedStyle = window.getComputedStyle($target);
				$target.dataset.scrollLockFilledGap = 'true';
				$target.dataset.scrollLockCurrentFillGapMethod = state.fillGapMethod;
				{
					const currentPadding = parseFloat(computedStyle.paddingRight);
					$target.style.paddingRight = `${currentPadding + scrollBarWidth}px`;
				}
			}
		};
		const unfillGapSelector = selector => {
			const $targets = document.querySelectorAll(selector);
			eachNode($targets, $target => {
				unfillGapTarget($target);
			});
		};
		const unfillGapTarget = $target => {
			if (isElement($target)) {
				if ($target.dataset.scrollLockFilledGap === 'true') {
					const currentFillGapMethod = $target.dataset.scrollLockCurrentFillGapMethod;
					delete $target.dataset.scrollLockFilledGap;
					delete $target.dataset.scrollLockCurrentFillGapMethod;
					if (currentFillGapMethod === 'margin') {
						$target.style.marginRight = ``;
					} else if (currentFillGapMethod === 'width') {
						$target.style.width = ``;
					} else if (currentFillGapMethod === 'max-width') {
						$target.style.maxWidth = ``;
					} else if (currentFillGapMethod === 'padding') {
						$target.style.paddingRight = ``;
					}
				}
			}
		};
		const onResize = e => {
			refillGaps();
		};
		const onTouchStart = e => {
			if (!state.scroll) {
				state.startTouchY = e.touches[0].clientY;
				state.startTouchX = e.touches[0].clientX;
			}
		};
		const onTouchMove = e => {
			if (!state.scroll) {
				const {
					startTouchY,
					startTouchX
				} = state;
				const currentClientY = e.touches[0].clientY;
				const currentClientX = e.touches[0].clientX;
				if (e.touches.length < 2) {
					const selector = arrayAsSelector(state.scrollableSelectors);
					const direction = {
						up: startTouchY < currentClientY,
						down: startTouchY > currentClientY,
						left: startTouchX < currentClientX,
						right: startTouchX > currentClientX
					};
					const directionWithOffset = {
						up: startTouchY + TOUCH_DIRECTION_DETECT_OFFSET < currentClientY,
						down: startTouchY - TOUCH_DIRECTION_DETECT_OFFSET > currentClientY,
						left: startTouchX + TOUCH_DIRECTION_DETECT_OFFSET < currentClientX,
						right: startTouchX - TOUCH_DIRECTION_DETECT_OFFSET > currentClientX
					};
					const handle = ($el, skip = false) => {
						if ($el) {
							const parentScrollableEl = findParentBySelector($el, selector, false);
							if (elementIsInputRange($el)) {
								return false;
							}
							if (skip || elementIsScrollableField($el) && findParentBySelector($el, selector) || elementHasSelector($el, selector)) {
								let prevent = false;
								if (elementScrollLeftOnStart($el) && elementScrollLeftOnEnd($el)) {
									if (direction.up && elementScrollTopOnStart($el) || direction.down && elementScrollTopOnEnd($el)) {
										prevent = true;
									}
								} else if (elementScrollTopOnStart($el) && elementScrollTopOnEnd($el)) {
									if (direction.left && elementScrollLeftOnStart($el) || direction.right && elementScrollLeftOnEnd($el)) {
										prevent = true;
									}
								} else if (directionWithOffset.up && elementScrollTopOnStart($el) || directionWithOffset.down && elementScrollTopOnEnd($el) || directionWithOffset.left && elementScrollLeftOnStart($el) || directionWithOffset.right && elementScrollLeftOnEnd($el)) {
									prevent = true;
								}
								if (prevent) {
									if (parentScrollableEl) {
										handle(parentScrollableEl, true);
									} else {
										e.preventDefault();
									}
								}
							} else {
								handle(parentScrollableEl);
							}
						} else {
							e.preventDefault();
						}
					};
					handle(e.target);
				}
			}
		};
		const onTouchEnd = e => {
			if (!state.scroll) {
				state.startTouchY = 0;
				state.startTouchX = 0;
			}
		};
		if (typeof window !== 'undefined') {
			window.addEventListener('resize', onResize);
		}
		if (typeof document !== 'undefined') {
			document.addEventListener('touchstart', onTouchStart);
			document.addEventListener('touchmove', onTouchMove, {
				passive: false
			});
			document.addEventListener('touchend', onTouchEnd);
		}

		let MoveObserver = /*#__PURE__*/function () {
			function MoveObserver(handler, element) {
				babelHelpers.classCallCheck(this, MoveObserver);
				babelHelpers.defineProperty(this, "detecting", false);
				babelHelpers.defineProperty(this, "x", 0);
				babelHelpers.defineProperty(this, "y", 0);
				babelHelpers.defineProperty(this, "deltaX", 0);
				babelHelpers.defineProperty(this, "deltaY", 0);
				this.element = element;
				this.handler = handler;
				this.listeners = {
					start: this.onTouchStart.bind(this),
					move: this.onTouchMove.bind(this),
					end: this.onTouchEnd.bind(this)
				};
			}
			return babelHelpers.createClass(MoveObserver, [{
				key: "toggle",
				value: function toggle(mode, element) {
					if (element) {
						this.element = element;
					}
					mode ? this.run() : this.stop();
				}
			}, {
				key: "run",
				value: function run() {
					this.element.setAttribute('draggable', false);
					this.element.addEventListener('touchstart', this.listeners.start);
					this.element.addEventListener('touchmove', this.listeners.move);
					this.element.addEventListener('touchend', this.listeners.end);
					this.element.addEventListener('touchcancel', this.listeners.end);
				}
			}, {
				key: "stop",
				value: function stop() {
					this.element.removeAttribute('draggable');
					this.element.removeEventListener('touchstart', this.listeners.start);
					this.element.removeEventListener('touchmove', this.listeners.move);
					this.element.removeEventListener('touchend', this.listeners.end);
					this.element.removeEventListener('touchcancel', this.listeners.end);
				}
			}, {
				key: "onTouchStart",
				value: function onTouchStart(e) {
					if (e.touches.length !== 1 || this.detecting) {
						return;
					}
					let touch = e.changedTouches[0];
					this.detecting = true;
					this.x = touch.pageX;
					this.y = touch.pageY;
					this.deltaX = 0;
					this.deltaY = 0;
					this.touch = touch;
				}
			}, {
				key: "onTouchMove",
				value: function onTouchMove(e) {
					if (!this.detecting) {
						return;
					}
					let touch = e.changedTouches[0];
					let newX = touch.pageX;
					let newY = touch.pageY;
					if (!this.hasTouch(e.changedTouches, touch)) {
						return;
					}
					if (!this.detecting) {
						return;
					}
					e.preventDefault();
					this.deltaX = this.x - newX;
					this.deltaY = this.y - newY;
					this.handler(this, false);
				}
			}, {
				key: "onTouchEnd",
				value: function onTouchEnd(e) {
					if (!this.hasTouch(e.changedTouches, this.touch) || !this.detecting) {
						return;
					}
					if (this.deltaY > 2 && this.deltaX > 2) {
						e.preventDefault();
					}
					this.detecting = false;
					this.handler(this, true);
				}
			}, {
				key: "hasTouch",
				value: function hasTouch(list, item) {
					for (let i = 0; i < list.length; i++) {
						if (list.item(i).identifier === item.identifier) {
							return true;
						}
					}
					return false;
				}
			}]);
		}();

		function _classPrivateMethodInitSpec$5(e, a) { _checkPrivateRedeclaration$e(e, a), a.add(e); }
		function _classPrivateFieldInitSpec$c(e, t, a) { _checkPrivateRedeclaration$e(e, t), t.set(e, a); }
		function _checkPrivateRedeclaration$e(e, t) { if (t.has(e)) throw new TypeError("Cannot initialize the same private elements twice on an object"); }
		function _classPrivateFieldGet$c(s, a) { return s.get(_assertClassBrand$e(s, a)); }
		function _classPrivateFieldSet$c(s, a, r) { return s.set(_assertClassBrand$e(s, a), r), r; }
		function _assertClassBrand$e(e, t, n) { if ("function" == typeof e ? e === t : e.has(t)) return arguments.length < 3 ? t : n; throw new TypeError("Private element is not present on this object"); }
		var _element = /*#__PURE__*/new WeakMap();
		var _handler = /*#__PURE__*/new WeakMap();
		var _observer = /*#__PURE__*/new WeakMap();
		var _ViewObserver_brand = /*#__PURE__*/new WeakSet();
		let ViewObserver = /*#__PURE__*/function () {
			function ViewObserver(element, handler) {
				babelHelpers.classCallCheck(this, ViewObserver);
				_classPrivateMethodInitSpec$5(this, _ViewObserver_brand);
				_classPrivateFieldInitSpec$c(this, _element, void 0);
				_classPrivateFieldInitSpec$c(this, _handler, void 0);
				_classPrivateFieldInitSpec$c(this, _observer, void 0);
				_classPrivateFieldSet$c(_element, this, element);
				_classPrivateFieldSet$c(_handler, this, handler);
			}
			return babelHelpers.createClass(ViewObserver, null, [{
				key: "observe",
				value: function observe(element, handler) {
					const instance = new ViewObserver(element, handler);
					_assertClassBrand$e(_ViewObserver_brand, instance, _init).call(instance);
				}
			}]);
		}();
		function _init() {
			_classPrivateFieldSet$c(_observer, this, new IntersectionObserver((entries, observer) => {
				entries.forEach(entry => {
					if (entry.isIntersecting) {
						_classPrivateFieldGet$c(_handler, this).call(this);
						observer.unobserve(entry.target);
					}
				});
			}, {
				threshold: 0.5
			}));
			_classPrivateFieldGet$c(_observer, this).observe(_classPrivateFieldGet$c(_element, this));
		}

		const ElementType = {
			FIELD: 'field',
			LABEL: 'label',
			HINT: 'hint',
			ERROR: 'error'
		};
		const ARIA_ID_PREFIX = 'b24-form';
		const idIndexMap = new Map();
		let idCounter = 0;
		const Aria = {
			ElementType,
			generateElementId(prefix, fieldId, itemIndex = null) {
				if (!idIndexMap.has(fieldId)) {
					idIndexMap.set(fieldId, ++idCounter);
				}
				const shortId = idIndexMap.get(fieldId);
				const base = `${ARIA_ID_PREFIX}-${prefix}-${shortId}`;
				return itemIndex !== null && itemIndex > 0 ? `${base}-${itemIndex}` : base;
			},
			getFormElementId(formId, suffix) {
				if (!idIndexMap.has(formId)) {
					idIndexMap.set(formId, ++idCounter);
				}
				const shortFormId = idIndexMap.get(formId);
				return `${ARIA_ID_PREFIX}-form-${shortFormId}-${suffix}`;
			},
			generateDescribedBy(ids) {
				const filtered = ids.filter(id => id);
				return filtered.length > 0 ? filtered.join(' ') : null;
			},
			getFieldId(field, itemIndex = null) {
				return this.generateElementId(ElementType.FIELD, field.id, itemIndex);
			},
			getLabelId(field, itemIndex = null) {
				return this.generateElementId(ElementType.LABEL, field.id, itemIndex);
			},
			getHintId(field, itemIndex = null) {
				return this.generateElementId(ElementType.HINT, field.id, itemIndex);
			},
			getErrorId(field, itemIndex = null) {
				return this.generateElementId(ElementType.ERROR, field.id, itemIndex);
			},
			getAriaRequired(field) {
				return field.required ? 'true' : null;
			},
			getAriaInvalid(field) {
				return this.hasErrors(field) ? 'true' : null;
			},
			getAriaDescribedBy(field, itemIndex = null) {
				const hasHint = Boolean(field.hint);
				const ids = [];
				if (hasHint) {
					ids.push(this.getHintId(field, itemIndex));
				}
				if (this.hasErrors(field)) {
					ids.push(this.getErrorId(field, itemIndex));
				}
				return this.generateDescribedBy(ids);
			},
			hasErrors(field) {
				return field.validated && !field.focused && !field.valid();
			}
		};

		const Scroll = {
			items: [],
			toggle(element, mode) {
				mode ? this.enable(element) : this.disable(element);
			},
			getLastItem() {
				return this.items.length > 0 ? this.items[this.items.length - 1] : null;
			},
			disable(element) {
				let prevElement = this.getLastItem();
				if (prevElement) {
					addLockableTarget(prevElement);
					addFillGapTarget(prevElement);
				}
				disablePageScroll(element);
				this.items.push(element);
			},
			enable() {
				setTimeout(() => {
					let element = this.items.pop();
					enablePageScroll(element);
					let prevElement = this.getLastItem();
					if (prevElement) {
						removeFillGapTarget(prevElement);
						removeLockableTarget(prevElement);
					}
				}, 300);
			}
		};
		const Type = {
			defined(val) {
				return typeof val !== 'undefined';
			},
			object(val) {
				if (!val || typeof val !== 'object' || Object.prototype.toString.call(val) !== '[object Object]') {
					return false;
				}
				const proto = Object.getPrototypeOf(val);
				if (proto === null) {
					return true;
				}
				const objectCtorString = Function.prototype.toString.call(Object);
				const ctor = proto.hasOwnProperty('constructor') && proto.constructor;
				return typeof ctor === 'function' && Function.prototype.toString.call(ctor) === objectCtorString;
			},
			string(val) {
				return typeof val === 'string';
			}
		};
		const Conv = {
			number(value) {
				value = parseFloat(value);
				return isNaN(value) ? 0 : value;
			},
			string() {},
			formatMoney(val, format) {
				val = this.number(val).toFixed(2) || 0;
				return (format || '#').replace('&#', '|||||').replace('&amp;#', '|-|||-|').replace('#', val).replace('|-|||-|', '&amp;#').replace('|||||', '&#');
			},
			replaceText(text, fields) {
				text = text + '';
				fields = fields || {};
				let holders = text.match(/{{[ -.a-zA-Z]+}}/g);
				if (!holders || holders.length === 0) {
					return text;
				}
				let result = holders.reduce(function (s, item) {
					let value = item.replace(/^{+/, '').replace(/}+$/, '').trim();
					value = fields[value] ? fields[value] : '';
					let parts = s.split(item);
					for (let i = 0; i < parts.length; i = i + 1) {
						if (i === parts.length - 1 && parts.length > 1) {
							continue;
						}
						let left = parts[i].replace(/[ \t]+$/, '');
						if (!value) {
							left = left.replace(/[,]+$/, '');
						}
						left += (value ? ' ' : '') + value;
						parts[i] = left;
						if (i + 1 >= parts.length) {
							continue;
						}
						let right = parts[i + 1].replace(/^[ \t]+/, '');
						if (!/^[<!?.\n]+/.test(right)) {
							let isLeftClosed = !left || /[<!?.\n]+$/.test(left);
							if (isLeftClosed) {
								right = right.replace(/^[ \t,]+/, '');
							}
							if (!/^[,]+/.test(right)) {
								if (isLeftClosed) {
									right = right.charAt(0).toUpperCase() + right.slice(1);
								}
								right = ' ' + right;
							}
						}
						parts[i + 1] = right;
					}
					return parts.join('').trim();
				}, text);
				return result ? result : text;
			},
			cloneDeep(object) {
				return JSON.parse(JSON.stringify(object));
			}
		};
		const Color = {
			parseHex(hex) {
				hex = this.fillHex(hex);
				let parts = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})?$/i.exec(hex);
				if (!parts) {
					parts = [0, 0, 0, 1];
				} else {
					parts = [parseInt(parts[1], 16), parseInt(parts[2], 16), parseInt(parts[3], 16), parseInt(100 * (parseInt(parts[4] || 'ff', 16) / 255)) / 100];
				}
				return parts;
			},
			hexToRgba(hex) {
				return 'rgba(' + this.parseHex(hex).join(', ') + ')';
			},
			toRgba(numbers) {
				return 'rgba(' + numbers.join(', ') + ')';
			},
			fillHex(hex, fillAlpha = false, alpha = null) {
				if (hex.length === 4 || fillAlpha && hex.length === 5) {
					hex = hex.replace(/([a-f0-9])/gi, "$1$1");
				}
				if (fillAlpha && hex.length === 7) {
					hex += 'ff';
				}
				if (alpha) {
					hex = hex.substr(0, 7) + (alpha.toLowerCase() + 'ff').substr(0, 2);
				}
				return hex;
			},
			isHexDark(hex) {
				hex = this.parseHex(hex);
				const r = hex[0];
				const g = hex[1];
				const b = hex[2];
				const brightness = (r * 299 + g * 587 + b * 114) / 1000;
				return brightness < 155;
			}
		};
		const Browser = {
			isMobile() {
				return window.innerWidth <= 530;
			}
		};
		const fontsLoaded = [];
		const Font = {
			load(font) {
				if (fontsLoaded.includes(font)) {
					return;
				}
				let fontUrl = null;
				switch (font) {
					case 'lobster':
						fontUrl = 'https://fonts.googleapis.com/css2?family=Lobster:wght@100;200;300;400;500;600;700;800;900&subset=cyrillic-ext,latin-ext';
						break;
					default:
					case 'opensans':
						fontUrl = 'https://fonts.googleapis.com/css2?family=Open+Sans:wght@100;200;300;400;500;600;700;800;900&subset=cyrillic';
						break;
				}
				if (fontUrl) {
					const link = document.createElement('link');
					link.rel = 'stylesheet';
					link.href = fontUrl;
					document.getElementsByTagName('head')[0].appendChild(link);
					fontsLoaded.push(font);
				}
			}
		};

		let Button = /*#__PURE__*/function () {
			function Button() {
				babelHelpers.classCallCheck(this, Button);
			}
			return babelHelpers.createClass(Button, null, [{
				key: "create",
				value: function create(b24options) {
					const btnOptions = Type.object(b24options?.views?.click?.button) ? b24options?.views?.click?.button : {};
					const outlined = btnOptions?.outlined === '1',
						plain = btnOptions?.plain === '1',
						rounded = btnOptions?.rounded === '1';
					const newButton = plain ? document.createElement("a") : document.createElement("button");
					newButton.classList.add('b24-form-click-btn');
					newButton.classList.add('b24-form-click-btn-' + b24options.id);
					const wrapper = document.createElement("div");
					wrapper.classList.add('b24-form-click-btn-wrapper');
					wrapper.classList.add('b24-form-click-btn-wrapper-' + b24options.id);
					wrapper.appendChild(newButton);
					newButton.textContent = btnOptions?.text || 'Click';
					wrapper.classList.add(plain ? '--b24-mod-plain' : '--b24-mod-button');
					if (outlined) {
						wrapper.classList.add('--b24-mod-outlined');
					}
					if (rounded) {
						wrapper.classList.add('--b24-mod-rounded');
					}
					_applyDecoration.call(Button, wrapper, btnOptions?.decoration);
					_applyAlign.call(Button, wrapper, btnOptions?.align);
					const fontStyle = btnOptions?.font;
					_loadFont.call(Button, fontStyle);
					_applyFont.call(Button, newButton, fontStyle);
					_applyColors.call(Button, newButton, btnOptions, b24options);
					return wrapper;
				}
			}]);
		}();
		function _applyDecoration(button, decoration) {
			switch (decoration) {
				case 'dotted':
				case 'solid':
					button.classList.add('--b24-mod-' + decoration);
					break;
			}
		}
		function _applyAlign(button, align) {
			switch (align) {
				case 'center':
				case 'left':
				case 'right':
				case 'inline':
					button.classList.add('--b24-mod-' + align);
					break;
			}
		}
		function _loadFont(fontStyle) {
			switch (fontStyle) {
				case 'modern':
				default:
					Font.load('opensans');
					break;
			}
		}
		function _applyFont(button, fontStyle) {
			switch (fontStyle) {
				case 'classic':
				case 'elegant':
				case 'modern':
					button.classList.add("b24-form-click-btn-font-" + fontStyle);
					break;
			}
		}
		function _applyColors(button, buttonParams = {}, b24options) {
			const outlined = buttonParams?.outlined === '1',
				plain = buttonParams?.plain === '1';
			const colorText = buttonParams?.color?.text || '#fff',
				colorTextHover = buttonParams?.color?.textHover || '#fff',
				colorBackground = buttonParams?.color?.background || '#3bc8f5',
				colorBackgroundHover = buttonParams?.color?.backgroundHover || '#3eddff',
				colorBorder = colorBackground,
				colorBorderHover = colorBackgroundHover;
			const outlinedColorText = buttonParams?.color?.text || '#535b69',
				outlinedColorTextHover = buttonParams?.color?.textHover || '#535b69',
				outlinedColorBackground = 'transparent',
				outlinedColorBackgroundHover = buttonParams?.color?.backgroundHover || '#cfd4d8',
				outlinedColorBorder = buttonParams?.color?.background || '#c6cdd3',
				outlinedColorBorderHover = buttonParams?.color?.backgroundHover || '#c6cdd3';
			button.style.color = outlined ? outlinedColorText : colorText;
			if (!plain) {
				button.style.borderColor = outlined ? outlinedColorBorder : colorBorder;
				button.style.backgroundColor = outlined ? outlinedColorBackground : colorBackground;
			}
			const hoverStyle = `
			.b24-form-click-btn-wrapper-${b24options.id} > button:hover {
				color: ${outlined ? outlinedColorTextHover : colorTextHover} !important;
				background-color: ${outlined ? outlinedColorBackgroundHover : colorBackgroundHover} !important;
				border-color: ${outlined ? outlinedColorBorderHover : colorBorderHover} !important;
			}
			.b24-form-click-btn-wrapper-${b24options.id} > a:hover {
				color: ${outlined ? outlinedColorTextHover : colorTextHover} !important;
			}
		`;
			const styleElem = document.createElement('style');
			if (styleElem.styleSheet) {
				styleElem.styleSheet.cssText = hoverStyle;
			} else {
				styleElem.appendChild(document.createTextNode(hoverStyle));
			}
			document.getElementsByTagName('head')[0].appendChild(styleElem);
		}

		function _classPrivateFieldInitSpec$b(e, t, a) { _checkPrivateRedeclaration$d(e, t), t.set(e, a); }
		function _checkPrivateRedeclaration$d(e, t) { if (t.has(e)) throw new TypeError("Cannot initialize the same private elements twice on an object"); }
		function _classPrivateFieldGet$b(s, a) { return s.get(_assertClassBrand$d(s, a)); }
		function _classPrivateFieldSet$b(s, a, r) { return s.set(_assertClassBrand$d(s, a), r), r; }
		function _assertClassBrand$d(e, t, n) { if ("function" == typeof e ? e === t : e.has(t)) return arguments.length < 3 ? t : n; throw new TypeError("Private element is not present on this object"); }
		var _namespace = /*#__PURE__*/new WeakMap();
		var _subscribers = /*#__PURE__*/new WeakMap();
		var _emittedOnce = /*#__PURE__*/new WeakMap();
		let Event = /*#__PURE__*/function () {
			function Event() {
				babelHelpers.classCallCheck(this, Event);
				_classPrivateFieldInitSpec$b(this, _namespace, []);
				_classPrivateFieldInitSpec$b(this, _subscribers, []);
				_classPrivateFieldInitSpec$b(this, _emittedOnce, []);
			}
			return babelHelpers.createClass(Event, [{
				key: "setGlobalEventNamespace",
				value: function setGlobalEventNamespace(...args) {
					_classPrivateFieldSet$b(_namespace, this, args);
				}
			}, {
				key: "emitOnce",
				value: function emitOnce(type, data) {
					if (_classPrivateFieldGet$b(_emittedOnce, this).indexOf(type) < 0) {
						this.emit(type, data);
					}
				}
			}, {
				key: "emit",
				value: function emit(type, data) {
					_classPrivateFieldGet$b(_emittedOnce, this).push(type);
					_classPrivateFieldGet$b(_subscribers, this).forEach(subscriber => {
						if (!subscriber.type || subscriber.type === type) {
							subscriber.callback.call(this, data, this, type);
						}
					});
					if (_classPrivateFieldGet$b(_namespace, this).length === 0) {
						return;
					}
					window.dispatchEvent(new window.CustomEvent([..._classPrivateFieldGet$b(_namespace, this), type].join(':'), {
						detail: {
							object: this,
							type,
							data
						}
					}));
				}
			}, {
				key: "subscribe",
				value: function subscribe(type, callback) {
					if (!type || typeof callback !== 'function') {
						return;
					}
					_classPrivateFieldGet$b(_subscribers, this).push({
						type,
						callback
					});
				}
			}, {
				key: "subscribeAll",
				value: function subscribeAll(callback) {
					_classPrivateFieldGet$b(_subscribers, this).push({
						type: null,
						callback
					});
				}
			}, {
				key: "unsubscribe",
				value: function unsubscribe(type, callback) {
					_classPrivateFieldSet$b(_subscribers, this, _classPrivateFieldGet$b(_subscribers, this).filter(subscriber => {
						return subscriber.type !== type || subscriber.callback !== callback;
					}));
				}
			}, {
				key: "unsubscribeAll",
				value: function unsubscribeAll() {
					_classPrivateFieldSet$b(_subscribers, this, []);
				}
			}]);
		}();

		function _callSuper$x(t, o, e) { return o = babelHelpers.getPrototypeOf(o), babelHelpers.possibleConstructorReturn(t, _isNativeReflectConstruct$x() ? Reflect.construct(o, e || [], babelHelpers.getPrototypeOf(t).constructor) : o.apply(t, e)); }
		function _isNativeReflectConstruct$x() { try { var t = !Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); } catch (t) {} return (_isNativeReflectConstruct$x = function () { return !!t; })(); }
		let Item$3 = /*#__PURE__*/function (_Event) {
			function Item(options) {
				var _this;
				babelHelpers.classCallCheck(this, Item);
				_this = _callSuper$x(this, Item, [options]);
				babelHelpers.defineProperty(_this, "events", {
					changeSelected: 'change:selected'
				});
				babelHelpers.defineProperty(_this, "value", '');
				babelHelpers.defineProperty(_this, "label", '');
				babelHelpers.defineProperty(_this, "_selectedInternal", false);
				_this._selectedInternal = !!options.selected;
				if (Type.defined(options.label)) {
					_this.label = options.label;
				}
				if (Type.defined(options.value)) {
					_this.value = options.value;
				}
				return _this;
			}
			babelHelpers.inherits(Item, _Event);
			return babelHelpers.createClass(Item, [{
				key: "selected",
				get: function () {
					return this._selectedInternal;
				},
				set: function (value) {
					this._selectedInternal = this.onSelect(value);
					this.emit(this.events.changeSelected);
				}
			}, {
				key: "onSelect",
				value: function onSelect(value) {
					return value;
				}
			}, {
				key: "getComparableValue",
				value: function getComparableValue() {
					return this.value;
				}
			}]);
		}(Event);

		// Expected: an instance of field/base/controller#Controller. We avoid importing
		// the class to keep this module out of the controller.js cycle (CF1006).
		// Duck-typing via known methods preserves the dev-time validation intent.
		const isFieldController = v => v && typeof v.getType === 'function' && typeof v.getComponentName === 'function';
		const Field = {
			props: {
				field: {
					validator: isFieldController,
					required: true
				}
			},
			template: `
		<transition name="b24-form-field-a-slide">
			<div class="b24-form-field"
				:class="classes"
				v-show="field.visible"
			>
				<div v-if="field.isComponentDuplicable">
				<transition-group name="b24-form-field-a-slide" tag="div">
					<component v-bind:is="field.getComponentName()"
						v-for="(item, itemIndex) in field.items"
						v-bind:key="field.id"
						v-bind:field="field"
						v-bind:itemIndex="itemIndex"
						v-bind:item="item"
						@input-blur="onBlur"
						@input-focus="onFocus"
						@input-key-down="onKeyDown"
					></component>
				</transition-group>
					<button 
						type="button"
						class="b24-form-control-add-btn"
						v-if="field.multiple"
						@click="addItem"
						:aria-label="field.messages.get('fieldAdd')"
					>
						{{ field.messages.get('fieldAdd') }}
					</button>
					<div
						class="b24-form-control-comment"
						:id="hintId"
						v-if="field.hint && !field.hintOnFocus || field.hint && field.hintOnFocus && field.focused"
						>{{field.hint}}</div>
				</div>
				<div v-if="!field.isComponentDuplicable">
					<component v-bind:is="field.getComponentName()"
						v-bind:key="field.id"
						v-bind:field="field"
						@input-blur="onBlur"
						@input-focus="onFocus"
						@input-key-down="onKeyDown"
					></component>
					<div
						class="b24-form-control-comment"
						:id="hintId"
						v-if="field.hint && !field.hintOnFocus || field.hint && field.hintOnFocus && field.focused"
						>{{field.hint}}</div>
				</div>
			</div>
		</transition>
	`,
			computed: {
				hintId() {
					return Aria.getHintId(this.field);
				},
				hasErrors() {
					return Aria.hasErrors(this.field);
				},
				classes() {
					const list = [`b24-form-field-${this.field.type}`, `b24-form-control-${this.field.getOriginalType()}`];
					/*
					if (this.field.design.dark)
					{
						list.push('b24-form-field-dark');
					}
					*/
					if (this.field.multiple) {
						list.push('b24-form-control-group');
					}
					if (this.hasErrors) {
						list.push('b24-form-control-alert');
					}
					return list;
				}
			},
			methods: {
				addItem() {
					this.field.addItem({});
				},
				onFocus() {
					this.field.focused = true;
					this.field.emit(this.field.events.focus);
				},
				onBlur() {
					this.field.focused = false;
					this.field.valid();
					setTimeout(() => {
						this.field.emit(this.field.events.blur);
					}, 350);
				},
				onKeyDown(e) {
					const key = e.key;
					if (e.ctrlKey || e.metaKey) {
						return;
					}
					if (key.length === 1) {
						// eslint-disable-next-line unicorn/no-array-callback-reference
						const filteredValue = this.field.filter(key);
						if (filteredValue !== key) {
							e.preventDefault();
							return;
						}
					}
					if (['Escape', 'Esc', 'Delete', 'Backspace', 'Tab', 'Enter', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(key)) {
						return;
					}
				}
			}
		};

		let Storage = /*#__PURE__*/function () {
			function Storage() {
				babelHelpers.classCallCheck(this, Storage);
				babelHelpers.defineProperty(this, "language", 'en');
				babelHelpers.defineProperty(this, "messages", {});
			}
			return babelHelpers.createClass(Storage, [{
				key: "setMessages",
				value: function setMessages(messages) {
					this.messages = messages;
				}
			}, {
				key: "setLanguage",
				value: function setLanguage(language) {
					this.language = language;
				}
			}, {
				key: "get",
				value: function get(code) {
					let mess = this.messages;
					let lang = this.language || 'en';
					if (mess[lang] && mess[lang][code]) {
						return mess[lang][code];
					}
					lang = 'en';
					if (mess[lang] && mess[lang][code]) {
						return mess[lang][code];
					}
					return mess[code] || '';
				}
			}]);
		}();

		function _classPrivateMethodInitSpec$4(e, a) { _checkPrivateRedeclaration$c(e, a), a.add(e); }
		function _checkPrivateRedeclaration$c(e, t) { if (t.has(e)) throw new TypeError("Cannot initialize the same private elements twice on an object"); }
		function _assertClassBrand$c(e, t, n) { if ("function" == typeof e ? e === t : e.has(t)) return arguments.length < 3 ? t : n; throw new TypeError("Private element is not present on this object"); }
		const Themes = {
			'modern-light': {
				dark: false,
				style: 'modern',
				font: {
					uri: 'https://fonts.googleapis.com/css?family=Open+Sans:400,600&display=swap&subset=cyrillic',
					family: 'Open Sans'
				}
			},
			'modern-dark': {
				dark: true,
				style: 'modern',
				font: {
					uri: 'https://fonts.googleapis.com/css?family=Open+Sans:400,600&display=swap&subset=cyrillic',
					family: 'Open Sans'
				}
			},
			'classic-light': {
				dark: false,
				style: 'classic',
				font: {
					uri: 'https://fonts.googleapis.com/css?family=PT+Serif:400,700&display=swap&subset=cyrillic',
					family: 'PT Serif'
				}
			},
			'classic-dark': {
				dark: true,
				style: 'classic',
				font: {
					uri: 'https://fonts.googleapis.com/css?family=PT+Serif:400,700&display=swap&subset=cyrillic',
					family: 'PT Serif'
				}
			},
			'fun-light': {
				dark: false,
				style: 'fun',
				font: {
					uri: 'https://fonts.googleapis.com/css?family=Pangolin&display=swap&subset=cyrillic',
					family: 'Pangolin'
				}
			},
			'fun-dark': {
				dark: true,
				style: 'fun',
				font: {
					uri: 'https://fonts.googleapis.com/css?family=Pangolin&display=swap&subset=cyrillic',
					family: 'Pangolin'
				}
			},
			pixel: {
				font: {
					uri: 'https://fonts.googleapis.com/css?family=Press+Start+2P&display=swap&subset=cyrillic',
					family: 'Press Start 2P'
				},
				dark: true,
				color: {
					text: '#90ee90'
				}
			},
			old: {
				font: {
					uri: 'https://fonts.googleapis.com/css?family=Ruslan+Display&display=swap&subset=cyrillic',
					family: 'Ruslan Display'
				},
				color: {
					background: '#f1eddf'
				}
			},
			writing: {
				font: {
					uri: 'https://fonts.googleapis.com/css?family=Marck+Script&display=swap&subset=cyrillic',
					family: 'Marck Script'
				}
			}
		};
		var _Model_brand = /*#__PURE__*/new WeakSet();
		let Model = /*#__PURE__*/function () {
			function Model(options) {
				babelHelpers.classCallCheck(this, Model);
				_classPrivateMethodInitSpec$4(this, _Model_brand);
				babelHelpers.defineProperty(this, "dark", null);
				babelHelpers.defineProperty(this, "font", {
					uri: '',
					family: ''
				});
				babelHelpers.defineProperty(this, "color", {
					primary: '',
					primaryText: '',
					text: '',
					background: '',
					fieldBorder: '',
					fieldBackground: '',
					fieldFocusBackground: '',
					popupBackground: ''
				});
				babelHelpers.defineProperty(this, "border", {
					top: false,
					left: false,
					bottom: true,
					right: false
				});
				babelHelpers.defineProperty(this, "shadow", false);
				babelHelpers.defineProperty(this, "compact", false);
				babelHelpers.defineProperty(this, "style", null);
				babelHelpers.defineProperty(this, "backgroundImage", null);
				babelHelpers.defineProperty(this, "proxy", {
					fonts: []
				});
				this.adjust(options);
			}
			return babelHelpers.createClass(Model, [{
				key: "adjust",
				value: function adjust(options) {
					options = options || {};
					if (typeof options.proxy === 'object') {
						this.setProxy(options.proxy);
					}
					if (typeof options.theme !== 'undefined') {
						this.theme = options.theme;
						let theme = Themes[options.theme] || {};
						this.setStyle(theme.style || '');
						this.setDark(theme.dark || false);
						this.setFont(theme.font || {});
						this.setBorder(theme.border || {});
						this.setShadow(theme.shadow || false);
						this.setCompact(theme.compact || false);
						this.setColor(Object.assign({
							primary: '',
							primaryText: '',
							text: '',
							background: '',
							fieldBorder: '',
							fieldBackground: '',
							fieldFocusBackground: '',
							popupBackground: ''
						}, theme.color));

						/*
						options.font = this.getEffectiveOption(options.font);
						options.dark = options.dark === 'auto'
							? undefined
							: this.getEffectiveOption(options.dark);
						options.style = this.getEffectiveOption(options.style);
						options.color = this.getEffectiveOption(options.color);
						*/
					}
					if (typeof options.font === 'string' || typeof options.font === 'object') {
						this.setFont(options.font);
					}
					if (typeof options.dark !== 'undefined') {
						this.setDark(options.dark);
					}
					if (typeof options.color === 'object') {
						this.setColor(options.color);
					}
					if (typeof options.shadow !== 'undefined') {
						this.setShadow(options.shadow);
					}
					if (typeof options.compact !== 'undefined') {
						this.setCompact(options.compact);
					}
					if (typeof options.border !== 'undefined') {
						this.setBorder(options.border);
					}
					if (typeof options.style !== 'undefined') {
						this.setStyle(options.style);
					}
					if (typeof options.backgroundImage !== 'undefined') {
						this.setBackgroundImage(options.backgroundImage);
					}
				}
			}, {
				key: "setProxy",
				value: function setProxy({
					fonts
				}) {
					if (typeof fonts !== 'undefined') {
						this.proxy.fonts = Array.isArray(fonts) ? fonts : [];
					}
					return this;
				}
			}, {
				key: "setFont",
				value: function setFont(family, uri) {
					if (typeof family === 'object') {
						uri = family.uri;
						family = family.family;
					}
					this.font.family = family || '';
					this.font.uri = this.font.family ? uri || '' : '';
				}
			}, {
				key: "setShadow",
				value: function setShadow(shadow) {
					this.shadow = !!shadow;
				}
			}, {
				key: "setCompact",
				value: function setCompact(compact) {
					this.compact = !!compact;
				}
			}, {
				key: "setBackgroundImage",
				value: function setBackgroundImage(url) {
					this.backgroundImage = url;
				}
			}, {
				key: "setBorder",
				value: function setBorder(border) {
					if (typeof border === 'object') {
						if (typeof border.top !== 'undefined') {
							this.border.top = !!border.top;
						}
						if (typeof border.right !== 'undefined') {
							this.border.right = !!border.right;
						}
						if (typeof border.bottom !== 'undefined') {
							this.border.bottom = !!border.bottom;
						}
						if (typeof border.left !== 'undefined') {
							this.border.left = !!border.left;
						}
					} else {
						border = !!border;
						this.border.top = border;
						this.border.right = border;
						this.border.bottom = border;
						this.border.left = border;
					}
				}
			}, {
				key: "setDark",
				value: function setDark(dark) {
					this.dark = typeof dark === 'boolean' ? dark : null;
				}
			}, {
				key: "setColor",
				value: function setColor(color) {
					if (typeof color.primary !== 'undefined') {
						this.color.primary = Color.fillHex(color.primary, true);
					}
					if (typeof color.primaryText !== 'undefined') {
						this.color.primaryText = Color.fillHex(color.primaryText, true);
					}
					if (typeof color.text !== 'undefined') {
						this.color.text = Color.fillHex(color.text, true);
					}
					if (typeof color.background !== 'undefined') {
						const isPopupColorDepend = this.color.popupBackground === this.color.background;
						this.color.background = Color.fillHex(color.background, true);
						if (isPopupColorDepend || this.color.popupBackground.length === 0) {
							this.color.popupBackground = Color.fillHex(color.background, true, 'ff');
						}
					}
					if (typeof color.fieldBorder !== 'undefined') {
						this.color.fieldBorder = Color.fillHex(color.fieldBorder, true);
					}
					if (typeof color.fieldBackground !== 'undefined') {
						this.color.fieldBackground = Color.fillHex(color.fieldBackground, true);
					}
					if (typeof color.fieldFocusBackground !== 'undefined') {
						this.color.fieldFocusBackground = Color.fillHex(color.fieldFocusBackground, true);
					}
					if (typeof color.popupBackground !== 'undefined') {
						this.color.popupBackground = Color.fillHex(color.popupBackground, true);
					}
				}
			}, {
				key: "setStyle",
				value: function setStyle(style) {
					this.style = style;
				}
			}, {
				key: "getFontUri",
				value: function getFontUri() {
					return _assertClassBrand$c(_Model_brand, this, _replaceFontUriByProxy).call(this, this.font.uri);
				}
			}, {
				key: "getFontFamily",
				value: function getFontFamily() {
					return this.font.family;
				}
			}, {
				key: "getEffectiveOption",
				value: function getEffectiveOption(option) {
					switch (typeof option) {
						case "object":
							let result = undefined;
							for (let key in option) {
								if (option.hasOwnProperty(key)) {
									continue;
								}
								let value = this.getEffectiveOption(option);
								if (value) {
									result = result || {};
									result[key] = option;
								}
							}
							return result;
						case "string":
							if (option) {
								return option;
							}
							break;
					}
					return undefined;
				}
			}, {
				key: "isDark",
				value: function isDark() {
					if (this.dark !== null) {
						return this.dark;
					}
					if (!this.color.background) {
						return false;
					}
					if (this.color.background.indexOf('#') !== 0) {
						return false;
					}
					return Color.isHexDark(this.color.background);
				}
			}, {
				key: "isAutoDark",
				value: function isAutoDark() {
					return this.dark === null;
				}
			}]);
		}();
		function _replaceFontUriByProxy(uri) {
			if (typeof uri !== 'string' || !uri) {
				return uri;
			}
			this.proxy.fonts.forEach(item => {
				if (!item.source || !item.target) {
					return;
				}
				uri = uri.replace('https://' + item.source, 'https://' + item.target);
			});
			return uri;
		}

		let storedValues = null;
		const lsStoredValuesKey = 'b24-form-field-stored-values';
		function restore() {
			if (storedValues !== null) {
				return storedValues;
			}
			if (window.localStorage) {
				let stored = window.localStorage.getItem(lsStoredValuesKey);
				if (stored) {
					try {
						storedValues = JSON.parse(stored);
					} catch (e) {}
				}
			}
			storedValues = storedValues || {};
			storedValues.type = storedValues.type || {};
			storedValues.name = storedValues.name || {};
			return storedValues;
		}
		function storeFieldValues(fields) {
			try {
				if (!window.localStorage) {
					return storedValues;
				}
				const storedTypes = ['name', 'second-name', 'last-name', 'email', 'phone'];
				const stored = fields.reduce((result, field) => {
					if (storedTypes.indexOf(field.getType()) >= 0 && field.autocomplete || field.autocomplete === true) {
						const value = field.value();
						if (value) {
							if (storedTypes.indexOf(field.getType()) >= 0 && field.autocomplete) {
								result.type[field.getType()] = value;
							}
							result.name[field.name] = value;
						}
					}
					return result;
				}, restore());
				window.localStorage.setItem(lsStoredValuesKey, JSON.stringify(stored));
			} catch (e) {}
		}
		function getStoredFieldValue(fieldType) {
			const storedTypes = ['name', 'second-name', 'last-name', 'email', 'phone'];
			if (storedTypes.indexOf(fieldType) < 0) {
				return '';
			}
			return restore()['type'][fieldType] || '';
		}
		function getStoredFieldValueByFieldName(fieldName) {
			return restore()['name'][fieldName] || '';
		}

		function _callSuper$w(t, o, e) { return o = babelHelpers.getPrototypeOf(o), babelHelpers.possibleConstructorReturn(t, _isNativeReflectConstruct$w() ? Reflect.construct(o, e || [], babelHelpers.getPrototypeOf(t).constructor) : o.apply(t, e)); }
		function _isNativeReflectConstruct$w() { try { var t = !Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); } catch (t) {} return (_isNativeReflectConstruct$w = function () { return !!t; })(); }
		function _classPrivateMethodInitSpec$3(e, a) { _checkPrivateRedeclaration$b(e, a), a.add(e); }
		function _checkPrivateRedeclaration$b(e, t) { if (t.has(e)) throw new TypeError("Cannot initialize the same private elements twice on an object"); }
		function _assertClassBrand$b(e, t, n) { if ("function" == typeof e ? e === t : e.has(t)) return arguments.length < 3 ? t : n; throw new TypeError("Private element is not present on this object"); }
		let DefaultOptions$2 = {
			type: 'string',
			label: 'Default field name',
			multiple: false,
			autocomplete: null,
			visible: true,
			required: false
		};
		var _Controller_brand$1 = /*#__PURE__*/new WeakSet();
		let Controller$s = /*#__PURE__*/function (_Event) {
			function Controller(options = DefaultOptions$2) {
				var _this;
				babelHelpers.classCallCheck(this, Controller);
				_this = _callSuper$w(this, Controller, [options]);
				_classPrivateMethodInitSpec$3(_this, _Controller_brand$1);
				babelHelpers.defineProperty(_this, "events", {
					blur: 'blur',
					focus: 'focus',
					changeSelected: 'change:selected'
				});
				babelHelpers.defineProperty(_this, "options", DefaultOptions$2);
				babelHelpers.defineProperty(_this, "items", []);
				babelHelpers.defineProperty(_this, "validated", false);
				babelHelpers.defineProperty(_this, "focused", false);
				//#baseType: string;
				babelHelpers.defineProperty(_this, "validators", []);
				babelHelpers.defineProperty(_this, "normalizers", []);
				babelHelpers.defineProperty(_this, "formatters", []);
				babelHelpers.defineProperty(_this, "filters", []);
				_this.visible = !!options.visible;
				_this.adjust(options);
				return _this;
			}
			babelHelpers.inherits(Controller, _Event);
			return babelHelpers.createClass(Controller, [{
				key: "getComponentName",
				value: function getComponentName() {
					return 'field-' + this.getType();
				}
			}, {
				key: "isComponentDuplicable",
				get: function () {
					return false;
				}
			}, {
				key: "getType",
				value: function getType() {
					return this.constructor.type();
				}
			}, {
				key: "reset",
				value: function reset() {
					this.items = [];
					this.adjust(this.options, false);
				}
			}, {
				key: "selectedItems",
				value: function selectedItems() {
					return this.items.filter(item => item.selected);
				}
			}, {
				key: "selectedItem",
				value: function selectedItem() {
					return this.selectedItems()[0];
				}
			}, {
				key: "unselectedItems",
				value: function unselectedItems() {
					return this.items.filter(item => !item.selected);
				}
			}, {
				key: "unselectedItem",
				value: function unselectedItem() {
					return this.unselectedItems()[0];
				}
			}, {
				key: "item",
				value: function item() {
					return this.items[0];
				}
			}, {
				key: "value",
				value: function value() {
					return this.values()[0];
				}
			}, {
				key: "values",
				value: function values() {
					return this.selectedItems().map(item => item.value);
				}
			}, {
				key: "getComparableValues",
				value: function getComparableValues() {
					return this.selectedItems().map(item => item.getComparableValue());
				}
			}, {
				key: "normalize",
				value: function normalize(value) {
					return this.normalizers.reduce((v, f) => f(v), value);
				}
			}, {
				key: "filter",
				value: function filter(value) {
					return this.filters.reduce((v, f) => f(v), value);
				}
			}, {
				key: "format",
				value: function format(value) {
					return this.formatters.reduce((v, f) => f(v), value);
				}
			}, {
				key: "validate",
				value: function validate(value) {
					if (value === '') {
						return true;
					}
					return !this.validators.some(validator => !validator.call(this, value));
				}
			}, {
				key: "hasValidValue",
				value: function hasValidValue() {
					return this.values().some(value => value !== '' && this.validate(value));
				}
			}, {
				key: "isEmptyRequired",
				value: function isEmptyRequired() {
					let items = this.selectedItems();
					if (this.required) {
						if (items.length === 0 || !items[0] || !items[0].selected || (items[0].value + '').trim() === '') {
							return true;
						}
					}
					return false;
				}
			}, {
				key: "valid",
				value: function valid() {
					if (!this.visible) {
						return true;
					}
					this.validated = true;
					let items = this.selectedItems();
					if (this.isEmptyRequired()) {
						return false;
					}
					return !items.some(item => !this.validate(item.value));
				}
			}, {
				key: "getOriginalType",
				value: function getOriginalType() {
					return this.type;
				}
			}, {
				key: "addItem",
				value: function addItem(options) {
					if (options.selected && !this.multiple && this.values().length > 0) {
						options.selected = false;
					}
					let item = this.constructor.createItem(options);
					if (item) {
						item.subscribe(item.events.changeSelected, (data, obj, type) => {
							this.emit(this.events.changeSelected, {
								data,
								type,
								item: obj
							});
						});
						this.items.push(item);
					}
					return item;
				}
			}, {
				key: "addSingleEmptyItem",
				value: function addSingleEmptyItem() {
					if (this.items.length > this.values().length) {
						return;
					}
					if (this.items.length > 0 && !this.multiple) {
						return;
					}
					this.addItem({});
				}
			}, {
				key: "removeItem",
				value: function removeItem(itemIndex) {
					this.items.splice(itemIndex, 1);
					this.addSingleEmptyItem();
				}
			}, {
				key: "removeFirstEmptyItems",
				value: function removeFirstEmptyItems() {}
			}, {
				key: "setValues",
				value: function setValues(values) {
					values = _assertClassBrand$b(_Controller_brand$1, this, _prepareValues).call(this, values);
					if (values.length === 0) {
						return this;
					}
					if (!this.multiple) {
						values = [values[0]];
					}
					if (this.isComponentDuplicable) {
						if (this.items.length > values.length) {
							this.items = this.items.slice(0, values.length - 1);
						}
						values.forEach((value, index) => {
							let item = this.items[index];
							if (!item) {
								item = this.addItem({
									value
								});
							}
							item.value = value;
						});
					}
					this.items.forEach(item => {
						item.selected = values.indexOf(item.getComparableValue()) >= 0;
					});
					return this;
				}
			}, {
				key: "adjust",
				value: function adjust(options = DefaultOptions$2, autocomplete = true) {
					this.options = Object.assign({}, this.options, options);
					this.id = this.options.id || '';
					this.name = this.options.name || '';
					this.type = this.options.type;
					this.label = this.options.label;
					this.multiple = !!this.options.multiple;
					this.autocomplete = !!this.options.autocomplete;
					this.required = !!this.options.required;
					this.hint = this.options.hint || '';
					this.hintOnFocus = !!this.options.hintOnFocus;
					this.placeholder = this.options.placeholder || '';
					if (options.messages || !this.messages) {
						if (options.messages instanceof Storage) {
							this.messages = options.messages;
						} else {
							this.messages = new Storage();
							this.messages.setMessages(options.messages || {});
						}
					}
					if (options.design || !this.design) {
						if (options.design instanceof Model) {
							this.design = options.design;
						} else {
							this.design = new Model();
							this.design.adjust(options.design || {});
						}
					}
					let values = this.options.values || [];
					let value = this.options.value || values[0];
					if (autocomplete) {
						value = value || (this.autocomplete ? getStoredFieldValueByFieldName(this.name) : null) || (this.autocomplete ? getStoredFieldValue(this.getType()) : null) || '';
					}
					let items = this.options.items || [];
					let selected = !this.multiple || values.length > 0;
					if (values.length === 0) {
						values.push(value);
						selected = typeof value !== 'undefined' && value !== '';
					}

					// empty single
					if (items.length === 0 && !this.multiple) {
						if (typeof this.options.checked !== "undefined") {
							selected = !!this.options.checked;
						}
						items.push({
							value: value,
							selected: selected
						});
					}

					// empty multi
					if (items.length === 0 && this.multiple) {
						values.forEach(value => items.push({
							value: value,
							selected: selected
						}));
					}
					items.forEach(item => this.addItem(item));
				}
			}], [{
				key: "type",
				value: function type() {
					return '';
				}
			}, {
				key: "component",
				value: function component() {
					return Field;
				}
			}, {
				key: "createItem",
				value: function createItem(options) {
					return new Item$3(options);
				}
			}]);
		}(Event);
		function _prepareValues(values) {
			return values.filter(value => typeof value !== 'undefined').map(value => this.normalize(value + '')).map(value => this.format(value)).filter(value => this.validate(value));
		}

		const Dropdown = {
			props: ['marginTop', 'maxHeight', 'width', 'visible', 'title', 'messages'],
			template: `
		<div class="b24-form-dropdown">
			<transition name="b24-form-dropdown-slide" appear>
			<div class="b24-form-dropdown-container" 
				:style="{marginTop: marginTop, maxHeight: maxHeight, width: width, minWidth: width}"
				v-if="visible"
			>
				<div class="b24-form-dropdown-header" ref="header">
					<button @click="close()" type="button" class="b24-window-close" :aria-label="closeButtonLabel"></button>
					<div class="b24-form-dropdown-title">{{ title }}</div>
				</div>			
				<slot></slot>
			</div>
			</transition>
		</div>
	`,
			data: function () {
				return {
					listenerBind: null,
					observers: {}
				};
			},
			created() {
				this.listenerBind = this.listener.bind(this);
			},
			mounted() {
				this.observers.move = new MoveObserver(this.observeMove.bind(this));
			},
			beforeDestroy() {
				document.removeEventListener('mouseup', this.listenerBind);
			},
			watch: {
				visible(val) {
					if (val) {
						this.$emit('visible:on');
						document.addEventListener('mouseup', this.listenerBind);
					} else {
						setTimeout(() => this.$emit('visible:off'), 0);
						document.removeEventListener('mouseup', this.listenerBind);
					}
					if (window.innerWidth <= 530) {
						setTimeout(() => {
							Scroll.toggle(this.$el.querySelector('.b24-form-dropdown-container'), !val);
							this.observers.move.toggle(val, this.$refs.header);
						}, 0);
					}
					if (this.$root.flags) {
						this.$root.flags.hideEars = val;
					}
				}
			},
			computed: {
				closeButtonLabel() {
					return this.messages?.get('fieldDateClose');
				}
			},
			methods: {
				close() {
					this.$emit('close');
				},
				listener(e) {
					let el = e.target;
					if (this.$el !== el && !this.$el.contains(el)) {
						this.close();
					}
				},
				observeMove(observer, isEnd) {
					let target = observer.element.parentElement;
					if (!isEnd) {
						if (!target.dataset.height) {
							target.dataset.height = target.clientHeight;
						}
						target.style.height = target.style.minHeight = parseInt(target.dataset.height) + parseInt(observer.deltaY) + 'px';
					}
					if (isEnd) {
						if (observer.deltaY < 0 && Math.abs(observer.deltaY) > target.dataset.height / 2) {
							if (document.activeElement) {
								document.activeElement.blur();
							}
							this.close();
							setTimeout(() => {
								if (!target) {
									return;
								}
								target.dataset.height = null;
								target.style.height = null;
								target.style.minHeight = null;
							}, 300);
						} else {
							target.style.transition = "all 0.4s ease 0s";
							target.style.height = target.style.minHeight = target.dataset.height + 'px';
							setTimeout(() => target.style.transition = null, 400);
						}
					}
				}
			}
		};
		const Alert = {
			props: ['field', 'item', 'itemIndex'],
			template: `
		<div class="b24-form-control-alert-message"
			:id="errorId"
			role="alert"
			v-show="hasErrors"
		>
			<span class="b24-form-sr-only">{{ field.label }}: </span>{{ message }}
		</div>
	`,
			computed: {
				errorId() {
					const index = this.itemIndex === undefined ? null : this.itemIndex;
					return Aria.getErrorId(this.field, index);
				},
				hasErrors() {
					return Aria.hasErrors(this.field);
				},
				message() {
					if (this.field.isEmptyRequired()) {
						return this.field.messages.get('fieldErrorRequired');
					}
					if (this.field.validated && !this.field.valid()) {
						let type = this.field.type;
						type = type.charAt(0).toUpperCase() + type.slice(1);
						return this.field.messages.get('fieldErrorInvalid' + type) || this.field.messages.get('fieldErrorInvalid');
					}
					return '';
				}
			}
		};
		const Slider = {
			props: ['field', 'item'],
			data: function () {
				return {
					index: 0,
					lastItem: null,
					minHeight: 100,
					indexHeight: 100,
					heights: {},
					touch: {
						started: false,
						detecting: false,
						x: 0,
						y: 0
					}
				};
			},
			template: `
		<div v-if="hasPics" class="b24-from-slider">
			<div class="b24-form-slider-wrapper">
				<div class="b24-form-slider-container" 
					:style="{ height: height + 'px', width: width + '%', left: left + '%'}"
					v-swipe="move"
				>
					<div class="b24-form-slider-item"
						v-for="(pic, picIndex) in getItem().pics"
					>
						<img class="b24-form-slider-item-image" 
							:src="pic"
							@load="saveHeight($event, picIndex)"
						>
					</div>
				</div>
					<div class="b24-form-slider-control-prev"
						@click.stop="prev"
						:style="{ visibility: prevable() ? 'visible' : 'hidden'}"
					><div class="b24-form-slider-control-prev-icon"></div></div>
					<div class="b24-form-slider-control-next"
						@click.stop="next"
						:style="{ visibility: nextable() ? 'visible' : 'hidden'}"
					><div class="b24-form-slider-control-next-icon"></div></div>
			</div>
		</div>
	`,
			directives: {
				swipe: {
					inserted: function (el, binding) {
						let data = {
							started: false,
							detecting: false,
							x: 0,
							y: 0,
							touch: null
						};
						let hasTouch = (list, item) => {
							for (let i = 0; i < list.length; i++) {
								if (list.item(i).identifier === item.identifier) {
									return true;
								}
							}
							return false;
						};
						el.addEventListener('touchstart', e => {
							if (e.touches.length !== 1 || data.started) {
								return;
							}
							let touch = e.changedTouches[0];
							data.detecting = true;
							data.x = touch.pageX;
							data.y = touch.pageY;
							data.touch = touch;
						});
						el.addEventListener('touchmove', e => {
							if (!data.started && !data.detecting) {
								return;
							}
							let touch = e.changedTouches[0];
							let newX = touch.pageX;
							let newY = touch.pageY;
							if (!hasTouch(e.changedTouches, touch)) {
								return;
							}
							if (data.detecting) {
								if (Math.abs(data.x - newX) >= Math.abs(data.y - newY)) {
									e.preventDefault();
									data.started = true;
								}
								data.detecting = false;
							}
							if (data.started) {
								e.preventDefault();
								data.delta = data.x - newX;
							}
						});
						let onEnd = e => {
							if (!hasTouch(e.changedTouches, data.touch) || !data.started) {
								return;
							}
							e.preventDefault();
							if (data.delta > 0) {
								binding.value(true);
							} else if (data.delta < 0) {
								binding.value(false);
							}
							data.started = false;
							data.detecting = false;
						};
						el.addEventListener('touchend', onEnd);
						el.addEventListener('touchcancel', onEnd);
					}
				}
			},
			computed: {
				height() {
					if (this.indexHeight && this.indexHeight > this.minHeight) {
						return this.indexHeight;
					}
					return this.minHeight;
				},
				width() {
					return this.getItem().pics.length * 100;
				},
				left() {
					return this.index * -100;
				},
				hasPics() {
					return this.getItem() && this.getItem().pics && Array.isArray(this.getItem().pics) && this.getItem().pics.length > 0;
				}
			},
			methods: {
				saveHeight(e, picIndex) {
					this.heights[picIndex] = e.target.clientHeight;
					this.applyIndexHeight();
				},
				applyIndexHeight() {
					this.indexHeight = this.heights[this.index];
				},
				getItem() {
					let item = this.item || this.field.selectedItem();
					if (this.lastItem !== item) {
						this.lastItem = item;
						this.index = 0;
						this.heights = {};
					}
					return this.lastItem;
				},
				nextable() {
					return this.index < this.getItem().pics.length - 1;
				},
				prevable() {
					return this.index > 0;
				},
				next() {
					if (this.nextable()) {
						this.index++;
						this.applyIndexHeight();
					}
				},
				prev() {
					if (this.prevable()) {
						this.index--;
						this.applyIndexHeight();
					}
				},
				move(next) {
					next ? this.next() : this.prev();
				}
			}
		};
		const Definition$2 = {
			'field-item-alert': Alert,
			'field-item-image-slider': Slider,
			'field-item-dropdown': Dropdown
		};

		const MixinField = {
			props: {
				field: {},
				itemIndex: {
					default: null
				}
			},
			components: Object.assign({}, Definition$2),
			computed: {
				fieldId() {
					return Aria.getFieldId(this.field, this.itemIndex);
				},
				labelId() {
					return Aria.getLabelId(this.field, this.itemIndex);
				},
				hintId() {
					return Aria.getHintId(this.field, this.itemIndex);
				},
				errorId() {
					return Aria.getErrorId(this.field, this.itemIndex);
				},
				ariaRequired() {
					return Aria.getAriaRequired(this.field);
				},
				ariaInvalid() {
					return Aria.getAriaInvalid(this.field);
				},
				ariaDescribedby() {
					return Aria.getAriaDescribedBy(this.field, this.itemIndex);
				},
				hasErrors() {
					return Aria.hasErrors(this.field);
				},
				selected: {
					get: function () {
						return this.field.multiple ? this.field.values() : this.field.values()[0];
					},
					set: function (newValue) {
						this.field.items.forEach(item => {
							item.selected = Array.isArray(newValue) ? newValue.includes(item.value) : newValue === item.value;
						});
					}
				}
			},
			methods: {
				controlClasses() {
					//b24-form-control-checked
				}
			}
		};
		let MixinDropDown = {
			components: {
				'field-item-dropdown': Dropdown
			},
			data: function () {
				return {
					dropDownOpened: false
				};
			},
			methods: {
				toggleDropDown() {
					if (this.dropDownOpened) {
						this.closeDropDown();
					} else {
						this.dropDownOpened = true;
					}
				},
				closeDropDown() {
					setTimeout(() => {
						this.dropDownOpened = false;
					}, 0);
				}
			}
		};

		let MixinString = {
			props: ['field', 'itemIndex', 'item', 'readonly', 'buttonClear'],
			mixins: [MixinField],
			computed: {
				label() {
					return this.item.label ? this.item.label : this.field.label + (this.itemIndex > 0 ? ' (' + this.itemIndex + ')' : '');
				},
				value: {
					get() {
						return this.item.value;
					},
					set(newValue) {
						this.item.value = newValue;
						this.item.selected = !!this.item.value;
					}
				},
				inputClasses() {
					let list = [];
					if (this.item.value) {
						list.push('b24-form-control-not-empty');
					}
					return list;
				}
			},
			methods: {
				deleteItem() {
					this.field.items.splice(this.itemIndex, 1);
				},
				clearItem() {
					this.value = '';
				}
			},
			watch: {}
		};
		const FieldString = {
			mixins: [MixinString],
			template: `
		<div class="b24-form-control-container b24-form-control-icon-after">
			<input class="b24-form-control"
				:id="fieldId"
				:type="field.getInputType()"
				:name="field.getInputName()"
				:class="inputClasses"
				:readonly="readonly || field.isReadonly()"
				:autocomplete="field.getInputAutocomplete()"
				:aria-required="ariaRequired"
				:aria-invalid="ariaInvalid"
				:aria-describedby="ariaDescribedby"
				v-model="value"
				@blur="$emit('input-blur', $event)"
				@focus="$emit('input-focus', $event)"
				@click="$emit('input-click', $event)"
				@input="onInput"
				@keydown="$emit('input-key-down', $event)"
			>
			<label class="b24-form-control-label" :for="fieldId">
				{{ label }} 
				<span class="b24-form-control-required"
					v-show="field.required"
					aria-hidden="true"
				>*</span>
			</label>
			<div class="b24-form-icon-after b24-form-icon-remove"
				:title="field.messages.get('fieldRemove')"
				:aria-label="field.messages.get('fieldRemove')"
				role="button"
				tabindex="0"
				v-if="itemIndex > 0"
				@click="deleteItem"
				@keydown.enter="deleteItem"
				@keydown.space.prevent="deleteItem"
			></div>
			<div class="b24-form-icon-after b24-form-icon-remove"
				:title="buttonClear"
				:aria-label="buttonClear"
				role="button"
				tabindex="0"
				v-if="buttonClear && itemIndex === 0 && value"
				@click="clearItem"
				@keydown.enter="clearItem"
				@keydown.space.prevent="clearItem"
			></div>
			<field-item-alert
				v-bind:field="field"
				v-bind:item="item"
				v-bind:itemIndex="itemIndex"
			></field-item-alert>
		</div>
	`,
			methods: {
				onInput() {
					let value = this.field.normalize(this.value);
					value = this.field.format(value);
					if (this.value !== value) {
						this.value = value;
					}
				}
			}
		};

		const Filter = {
			Email: value => {
				return (value || '').replace(/[^\w.\d-_@]/g, '');
			},
			Double: value => {
				return (value || '').replace(/[^\-,.\d]/g, '');
			},
			Integer: value => {
				return (value || '').replace(/[^\-\d]/g, '');
			},
			Phone: value => {
				return (value || '').replace(/[^+\d]/g, '');
			},
			Money: value => {
				return (value || '').replace(/[^,.\d]/g, '');
			}
		};
		const Normalizer = {
			Email: value => {
				return Filter.Email(value).replace(/\.{2,}/g, '.').replace(/^\.+/g, '');
			},
			Double: value => {
				return Filter.Double(value).replace(/,/g, '.');
			},
			Integer: value => {
				return Filter.Integer(value);
			},
			Phone: value => {
				return value;
			},
			Money: value => {
				return Filter.Money(value).replace(/,/g, '.');
			},
			makeStringLengthNormalizer: (max = 0) => {
				return value => {
					value = value + '';
					return value.length > max ? value.substring(0, max) : value;
				};
			}
		};
		const Validator = {
			Email: value => {
				return null !== (value || '').match(/^[\w.\d-_]+@[\w.\d-_]+\.\w{2,15}$/i);
			},
			Double: value => {
				value = (value || '').replace(/,/g, '.');
				let dotIndex = value.indexOf('.');
				if (dotIndex === 0) {
					value = '0' + value;
				} else if (dotIndex < 0) {
					value += '.0';
				}
				return value.match(/^\d+\.\d+$/);
			},
			Integer: value => {
				return value && value.match(/^-?\d+$/);
			},
			Phone: value => {
				return Filter.Phone(value).length > 5;
			},
			Money: value => {
				return Validator.Double(value);
			},
			makeStringLengthValidator: (min = 0, max = 0) => {
				return value => {
					const len = (value + '').length;
					return (!min || len >= min) && (!max || len <= max);
				};
			}
		};
		let phoneDb = {
			list: null,
			findMask: value => {
				let r = phoneDb.list.filter(item => {
					return value.indexOf(item.code) === 0;
				}).sort((a, b) => {
					return b.code.length - a.code.length;
				})[0];
				return r ? r.mask : '_ ___ __ __ __';
			}
		};
		const Formatter = {
			Phone: value => {
				value = value || '';
				let hasPlus = value.indexOf('+') === 0;
				value = value.replace(/[^\d]/g, '');
				if (!hasPlus && value.substr(0, 1) === '8') {
					if (window.navigator && (window.navigator.language || '').substring(0, 2) === 'ru') {
						value = '7' + value.substr(1);
					}
				}
				if (!phoneDb.list) {
					phoneDb.list = "247,ac,___-____|376,ad,___-___-___|971,ae,___-_-___-____|93,af,__-__-___-____|1268,ag,_ (___) ___-____|1264,ai,_ (___) ___-____|355,al,___ (___) ___-___|374,am,___-__-___-___|599,bq,___-___-____|244,ao,___ (___) ___-___|6721,aq,___-___-___|54,ar,__ (___) ___-____|1684,as,_ (___) ___-____|43,at,__ (___) ___-____|61,au,__-_-____-____|297,aw,___-___-____|994,az,___ (__) ___-__-__|387,ba,___-__-____|1246,bb,_ (___) ___-____|880,bd,___-__-___-___|32,be,__ (___) ___-___|226,bf,___-__-__-____|359,bg,___ (___) ___-___|973,bh,___-____-____|257,bi,___-__-__-____|229,bj,___-__-__-____|1441,bm,_ (___) ___-____|673,bn,___-___-____|591,bo,___-_-___-____|55,br,__-(__)-____-____|1242,bs,_ (___) ___-____|975,bt,___-_-___-___|267,bw,___-__-___-___|375,by,___ (__) ___-__-__|501,bz,___-___-____|243,cd,___ (___) ___-___|236,cf,___-__-__-____|242,cg,___-__-___-____|41,ch,__-__-___-____|225,ci,___-__-___-___|682,ck,___-__-___|56,cl,__-_-____-____|237,cm,___-____-____|86,cn,__ (___) ____-___|57,co,__ (___) ___-____|506,cr,___-____-____|53,cu,__-_-___-____|238,cv,___ (___) __-__|357,cy,___-__-___-___|420,cz,___ (___) ___-___|49,de,__-___-___|253,dj,___-__-__-__-__|45,dk,__-__-__-__-__|1767,dm,_ (___) ___-____|1809,do,_ (___) ___-____|,do,_ (___) ___-____|213,dz,___-__-___-____|593,ec,___-_-___-____|372,ee,___-___-____|20,eg,__ (___) ___-____|291,er,___-_-___-___|34,es,__ (___) ___-___|251,et,___-__-___-____|358,fi,___ (___) ___-__-__|679,fj,___-__-_____|500,fk,___-_____|691,fm,___-___-____|298,fo,___-___-___|262,fr,___-_____-____|33,fr,__ (___) ___-___|508,fr,___-__-____|590,fr,___ (___) ___-___|241,ga,___-_-__-__-__|1473,gd,_ (___) ___-____|995,ge,___ (___) ___-___|594,gf,___-_____-____|233,gh,___ (___) ___-___|350,gi,___-___-_____|299,gl,___-__-__-__|220,gm,___ (___) __-__|224,gn,___-__-___-___|240,gq,___-__-___-____|30,gr,__ (___) ___-____|502,gt,___-_-___-____|1671,gu,_ (___) ___-____|245,gw,___-_-______|592,gy,___-___-____|852,hk,___-____-____|504,hn,___-____-____|385,hr,___-__-___-___|509,ht,___-__-__-____|36,hu,__ (___) ___-___|62,id,__-__-___-__|353,ie,___ (___) ___-___|972,il,___-_-___-____|91,in,__ (____) ___-___|246,io,___-___-____|964,iq,___ (___) ___-____|98,ir,__ (___) ___-____|354,is,___-___-____|39,it,__ (___) ____-___|1876,jm,_ (___) ___-____|962,jo,___-_-____-____|81,jp,__ (___) ___-___|254,ke,___-___-______|996,kg,___ (___) ___-___|855,kh,___ (__) ___-___|686,ki,___-__-___|269,km,___-__-_____|1869,kn,_ (___) ___-____|850,kp,___-___-___|82,kr,__-__-___-____|965,kw,___-____-____|1345,ky,_ (___) ___-____|77,kz,_ (___) ___-__-__|856,la,___-__-___-___|961,lb,___-_-___-___|1758,lc,_ (___) ___-____|423,li,___ (___) ___-____|94,lk,__-__-___-____|231,lr,___-__-___-___|266,ls,___-_-___-____|370,lt,___ (___) __-___|352,lu,___ (___) ___-___|371,lv,___-__-___-___|218,ly,___-__-___-___|212,ma,___-__-____-___|377,mc,___-__-___-___|373,md,___-____-____|382,me,___-__-___-___|261,mg,___-__-__-_____|692,mh,___-___-____|389,mk,___-__-___-___|223,ml,___-__-__-____|95,mm,__-___-___|976,mn,___-__-__-____|853,mo,___-____-____|1670,mp,_ (___) ___-____|596,mq,___ (___) __-__-__|222,mr,___ (__) __-____|1664,ms,_ (___) ___-____|356,mt,___-____-____|230,mu,___-___-____|960,mv,___-___-____|265,mw,___-_-____-____|52,mx,__-__-__-____|60,my,__-_-___-___|258,mz,___-__-___-___|264,na,___-__-___-____|687,nc,___-__-____|227,ne,___-__-__-____|6723,nf,___-___-___|234,ng,___-__-___-__|505,ni,___-____-____|31,nl,__-__-___-____|47,no,__ (___) __-___|977,np,___-__-___-___|674,nr,___-___-____|683,nu,___-____|64,nz,__-__-___-___|968,om,___-__-___-___|507,pa,___-___-____|51,pe,__ (___) ___-___|689,pf,___-__-__-__|675,pg,___ (___) __-___|63,ph,__ (___) ___-____|92,pk,__ (___) ___-____|48,pl,__ (___) ___-___|970,ps,___-__-___-____|351,pt,___-__-___-____|680,pw,___-___-____|595,py,___ (___) ___-___|974,qa,___-____-____|40,ro,__-__-___-____|381,rs,___-__-___-____|7,ru,_ (___) ___-__-__|250,rw,___ (___) ___-___|966,sa,___-_-___-____|677,sb,___-_____|248,sc,___-_-___-___|249,sd,___-__-___-____|46,se,__-__-___-____|65,sg,__-____-____|386,si,___-__-___-___|421,sk,___ (___) ___-___|232,sl,___-__-______|378,sm,___-____-______|221,sn,___-__-___-____|252,so,___-_-___-___|597,sr,___-___-___|211,ss,___-__-___-____|239,st,___-__-_____|503,sv,___-__-__-____|1721,sx,_ (___) ___-____|963,sy,___-__-____-___|268,sz,___ (__) __-____|1649,tc,_ (___) ___-____|235,td,___-__-__-__-__|228,tg,___-__-___-___|66,th,__-__-___-___|992,tj,___-__-___-____|690,tk,___-____|670,tl,___-___-____|993,tm,___-_-___-____|216,tn,___-__-___-___|676,to,___-_____|90,tr,__ (___) ___-____|1868,tt,_ (___) ___-____|688,tv,___-_____|886,tw,___-____-____|255,tz,___-__-___-____|380,ua,___ (__) ___-__-__|256,ug,___ (___) ___-___|44,gb,__-__-____-____|598,uy,___-_-___-__-__|998,uz,___-__-___-____|396698,va,__-_-___-_____|1784,vc,_ (___) ___-____|58,ve,__ (___) ___-____|1284,vg,_ (___) ___-____|1340,vi,_ (___) ___-____|84,vn,__-__-____-___|678,vu,___-_____|681,wf,___-__-____|685,ws,___-__-____|967,ye,___-_-___-___|27,za,__-__-___-____|260,zm,___ (__) ___-____|263,zw,___-_-______|1,us,_ (___) ___-____|".split('|').map(item => {
						item = item.split(',');
						return {
							code: item[0],
							id: item[1],
							mask: item[2]
						};
					});
				}
				if (value.length > 0) {
					let mask = phoneDb.findMask(value);
					mask += ((mask.indexOf('-') >= 0 ? '-' : ' ') + '__').repeat(10);
					for (let i = 0; i < value.length; i++) {
						mask = mask.replace('_', value.substr(i, 1));
					}
					value = mask.replace(/[^\d]+$/, '').replace(/_/g, '0');
				}
				if (hasPlus || value.length > 0) {
					value = '+' + value;
				}
				return value;
			}
		};

		function _callSuper$v(t, o, e) { return o = babelHelpers.getPrototypeOf(o), babelHelpers.possibleConstructorReturn(t, _isNativeReflectConstruct$v() ? Reflect.construct(o, e || [], babelHelpers.getPrototypeOf(t).constructor) : o.apply(t, e)); }
		function _isNativeReflectConstruct$v() { try { var t = !Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); } catch (t) {} return (_isNativeReflectConstruct$v = function () { return !!t; })(); }
		function _classPrivateFieldInitSpec$a(e, t, a) { _checkPrivateRedeclaration$a(e, t), t.set(e, a); }
		function _checkPrivateRedeclaration$a(e, t) { if (t.has(e)) throw new TypeError("Cannot initialize the same private elements twice on an object"); }
		function _classPrivateFieldGet$a(s, a) { return s.get(_assertClassBrand$a(s, a)); }
		function _classPrivateFieldSet$a(s, a, r) { return s.set(_assertClassBrand$a(s, a), r), r; }
		function _assertClassBrand$a(e, t, n) { if ("function" == typeof e ? e === t : e.has(t)) return arguments.length < 3 ? t : n; throw new TypeError("Private element is not present on this object"); }
		var _readonly = /*#__PURE__*/new WeakMap();
		let Controller$r = /*#__PURE__*/function (_BaseField$Controller) {
			function Controller(options) {
				var _this;
				babelHelpers.classCallCheck(this, Controller);
				_this = _callSuper$v(this, Controller, [options]);
				_classPrivateFieldInitSpec$a(_this, _readonly, void 0);
				const minSize = (options.size || {}).min || 0;
				const maxSize = (options.size || {}).max || 0;
				if (minSize || maxSize) {
					_this.validators.push(Validator.makeStringLengthValidator(minSize, maxSize));
					_this.normalizers.push(Normalizer.makeStringLengthNormalizer(maxSize));
				}
				_classPrivateFieldSet$a(_readonly, _this, Boolean(options.readonly));
				return _this;
			}
			babelHelpers.inherits(Controller, _BaseField$Controller);
			return babelHelpers.createClass(Controller, [{
				key: "isComponentDuplicable",
				get: function () {
					return true;
				}
			}, {
				key: "getOriginalType",
				value: function getOriginalType() {
					return 'string';
				}
			}, {
				key: "getInputType",
				value: function getInputType() {
					return 'string';
				}
			}, {
				key: "getInputName",
				value: function getInputName() {
					return null;
				}
			}, {
				key: "getInputAutocomplete",
				value: function getInputAutocomplete() {
					return null;
				}
			}, {
				key: "isReadonly",
				value: function isReadonly() {
					return _classPrivateFieldGet$a(_readonly, this) === true;
				}
			}], [{
				key: "type",
				value: function type() {
					return 'string';
				}
			}, {
				key: "component",
				value: function component() {
					return FieldString;
				}
			}]);
		}(Controller$s);

		function _callSuper$u(t, o, e) { return o = babelHelpers.getPrototypeOf(o), babelHelpers.possibleConstructorReturn(t, _isNativeReflectConstruct$u() ? Reflect.construct(o, e || [], babelHelpers.getPrototypeOf(t).constructor) : o.apply(t, e)); }
		function _isNativeReflectConstruct$u() { try { var t = !Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); } catch (t) {} return (_isNativeReflectConstruct$u = function () { return !!t; })(); }
		let Controller$q = /*#__PURE__*/function (_StringField$Controll) {
			function Controller(options) {
				var _this;
				babelHelpers.classCallCheck(this, Controller);
				_this = _callSuper$u(this, Controller, [options]);
				_this.validators.push(Validator.Email);
				_this.normalizers.push(Normalizer.Email);
				_this.filters.push(Filter.Email);
				return _this;
			}
			babelHelpers.inherits(Controller, _StringField$Controll);
			return babelHelpers.createClass(Controller, [{
				key: "getInputType",
				value: function getInputType() {
					return 'email';
				}
			}, {
				key: "getInputName",
				value: function getInputName() {
					return 'email';
				}
			}, {
				key: "getInputAutocomplete",
				value: function getInputAutocomplete() {
					return 'email';
				}
			}], [{
				key: "type",
				value: function type() {
					return 'email';
				}
			}]);
		}(Controller$r);

		function _callSuper$t(t, o, e) { return o = babelHelpers.getPrototypeOf(o), babelHelpers.possibleConstructorReturn(t, _isNativeReflectConstruct$t() ? Reflect.construct(o, e || [], babelHelpers.getPrototypeOf(t).constructor) : o.apply(t, e)); }
		function _isNativeReflectConstruct$t() { try { var t = !Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); } catch (t) {} return (_isNativeReflectConstruct$t = function () { return !!t; })(); }
		let Controller$p = /*#__PURE__*/function (_StringField$Controll) {
			function Controller(options) {
				var _this;
				babelHelpers.classCallCheck(this, Controller);
				_this = _callSuper$t(this, Controller, [options]);
				_this.formatters.push(Formatter.Phone);
				_this.validators.push(Validator.Phone);
				_this.normalizers.push(Normalizer.Phone);
				_this.filters.push(Filter.Phone);
				return _this;
			}
			babelHelpers.inherits(Controller, _StringField$Controll);
			return babelHelpers.createClass(Controller, [{
				key: "getInputType",
				value: function getInputType() {
					return 'tel';
				}
			}, {
				key: "getInputName",
				value: function getInputName() {
					return 'phone';
				}
			}, {
				key: "getInputAutocomplete",
				value: function getInputAutocomplete() {
					return 'tel';
				}
			}], [{
				key: "type",
				value: function type() {
					return 'phone';
				}
			}]);
		}(Controller$r);

		function _callSuper$s(t, o, e) { return o = babelHelpers.getPrototypeOf(o), babelHelpers.possibleConstructorReturn(t, _isNativeReflectConstruct$s() ? Reflect.construct(o, e || [], babelHelpers.getPrototypeOf(t).constructor) : o.apply(t, e)); }
		function _isNativeReflectConstruct$s() { try { var t = !Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); } catch (t) {} return (_isNativeReflectConstruct$s = function () { return !!t; })(); }
		let Controller$o = /*#__PURE__*/function (_StringField$Controll) {
			function Controller(options) {
				var _this;
				babelHelpers.classCallCheck(this, Controller);
				_this = _callSuper$s(this, Controller, [options]);
				_this.validators.push(Validator.Integer);
				_this.normalizers.push(Normalizer.Integer);
				_this.filters.push(Normalizer.Integer);
				return _this;
			}
			babelHelpers.inherits(Controller, _StringField$Controll);
			return babelHelpers.createClass(Controller, [{
				key: "getInputType",
				value: function getInputType() {
					return 'number';
				}
			}], [{
				key: "type",
				value: function type() {
					return 'integer';
				}
			}]);
		}(Controller$r);

		function _callSuper$r(t, o, e) { return o = babelHelpers.getPrototypeOf(o), babelHelpers.possibleConstructorReturn(t, _isNativeReflectConstruct$r() ? Reflect.construct(o, e || [], babelHelpers.getPrototypeOf(t).constructor) : o.apply(t, e)); }
		function _isNativeReflectConstruct$r() { try { var t = !Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); } catch (t) {} return (_isNativeReflectConstruct$r = function () { return !!t; })(); }
		let Controller$n = /*#__PURE__*/function (_StringField$Controll) {
			function Controller(options) {
				var _this;
				babelHelpers.classCallCheck(this, Controller);
				_this = _callSuper$r(this, Controller, [options]);
				_this.validators.push(Validator.Double);
				_this.normalizers.push(Normalizer.Double);
				_this.filters.push(Normalizer.Double);
				return _this;
			}
			babelHelpers.inherits(Controller, _StringField$Controll);
			return babelHelpers.createClass(Controller, [{
				key: "getInputType",
				value: function getInputType() {
					return 'number';
				}
			}], [{
				key: "type",
				value: function type() {
					return 'double';
				}
			}]);
		}(Controller$r);

		function _callSuper$q(t, o, e) { return o = babelHelpers.getPrototypeOf(o), babelHelpers.possibleConstructorReturn(t, _isNativeReflectConstruct$q() ? Reflect.construct(o, e || [], babelHelpers.getPrototypeOf(t).constructor) : o.apply(t, e)); }
		function _isNativeReflectConstruct$q() { try { var t = !Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); } catch (t) {} return (_isNativeReflectConstruct$q = function () { return !!t; })(); }
		let Controller$m = /*#__PURE__*/function (_StringField$Controll) {
			function Controller(options) {
				var _this;
				babelHelpers.classCallCheck(this, Controller);
				_this = _callSuper$q(this, Controller, [options]);
				_this.validators.push(Validator.Double);
				_this.normalizers.push(Normalizer.Double);
				_this.filters.push(Normalizer.Double);
				return _this;
			}
			babelHelpers.inherits(Controller, _StringField$Controll);
			return babelHelpers.createClass(Controller, [{
				key: "getInputType",
				value: function getInputType() {
					return 'number';
				}
			}], [{
				key: "type",
				value: function type() {
					return 'money';
				}
			}]);
		}(Controller$r);

		const FieldText = {
			mixins: [MixinString],
			template: `
		<div class="b24-form-control-container b24-form-control-icon-after">
			<textarea class="b24-form-control"
				:id="fieldId"
				:class="inputClasses"
				:aria-required="ariaRequired"
				:aria-invalid="ariaInvalid"
				:aria-describedby="ariaDescribedby"
				v-model="value"
				@blur="$emit('input-blur', this)"
				@focus="$emit('input-focus', this)"
			></textarea>
			<label class="b24-form-control-label" :for="fieldId">
				{{ label }} 
				<span v-show="field.required" class="b24-form-control-required" aria-hidden="true">*</span>			
			</label>
			<div class="b24-form-icon-after b24-form-icon-remove"
				:title="field.messages.get('fieldRemove')"
				:aria-label="field.messages.get('fieldRemove')"
				role="button"
				tabindex="0"
				v-if="itemIndex > 0"
				@click="deleteItem"
				@keydown.enter="deleteItem"
				@keydown.space.prevent="deleteItem"
			></div>
			<field-item-alert
				v-bind:field="field"
				v-bind:item="item"
				v-bind:itemIndex="itemIndex"
			></field-item-alert>
		</div>
	`
		};

		function _callSuper$p(t, o, e) { return o = babelHelpers.getPrototypeOf(o), babelHelpers.possibleConstructorReturn(t, _isNativeReflectConstruct$p() ? Reflect.construct(o, e || [], babelHelpers.getPrototypeOf(t).constructor) : o.apply(t, e)); }
		function _isNativeReflectConstruct$p() { try { var t = !Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); } catch (t) {} return (_isNativeReflectConstruct$p = function () { return !!t; })(); }
		let Controller$l = /*#__PURE__*/function (_BaseField$Controller) {
			function Controller() {
				babelHelpers.classCallCheck(this, Controller);
				return _callSuper$p(this, Controller, arguments);
			}
			babelHelpers.inherits(Controller, _BaseField$Controller);
			return babelHelpers.createClass(Controller, [{
				key: "isComponentDuplicable",
				get: function () {
					return true;
				}
			}], [{
				key: "type",
				value: function type() {
					return 'text';
				}
			}, {
				key: "component",
				value: function component() {
					return FieldText;
				}
			}]);
		}(Controller$s);

		const FieldBool = {
			mixins: [MixinField],
			template: `	
		<div class="b24-form-control-container">
			<label @click.capture="$emit('input-click', $event)">
				<input type="checkbox" 
					:id="fieldId"
					:aria-required="ariaRequired"
					:aria-invalid="ariaInvalid"
					:aria-describedby="ariaDescribedby"
					v-model="field.item().selected"
					@blur="$emit('input-blur')"
					@focus="$emit('input-focus')"
					@keydown.enter.prevent
				>
				<span class="b24-form-control-desc">{{ field.label }}</span>
				<span v-show="field.required" class="b24-form-control-required" aria-hidden="true">*</span>
			</label>
			<field-item-alert v-bind:field="field"></field-item-alert>
		</div>
	`
		};

		function _callSuper$o(t, o, e) { return o = babelHelpers.getPrototypeOf(o), babelHelpers.possibleConstructorReturn(t, _isNativeReflectConstruct$o() ? Reflect.construct(o, e || [], babelHelpers.getPrototypeOf(t).constructor) : o.apply(t, e)); }
		function _isNativeReflectConstruct$o() { try { var t = !Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); } catch (t) {} return (_isNativeReflectConstruct$o = function () { return !!t; })(); }
		let Controller$k = /*#__PURE__*/function (_BaseField$Controller) {
			function Controller(options) {
				babelHelpers.classCallCheck(this, Controller);
				options.multiple = false;
				return _callSuper$o(this, Controller, [options]);
			}
			babelHelpers.inherits(Controller, _BaseField$Controller);
			return babelHelpers.createClass(Controller, null, [{
				key: "type",
				value: function type() {
					return 'bool';
				}
			}, {
				key: "component",
				value: function component() {
					return FieldBool;
				}
			}]);
		}(Controller$s);

		const FieldCheckbox = {
			mixins: [MixinField],
			template: `
		<div class="b24-form-control-container">
			<fieldset :aria-describedby="ariaDescribedby">
				<legend class="b24-form-control-label">
					{{ field.label }} 
					<span v-show="field.required" class="b24-form-control-required" aria-hidden="true">*</span>
				</legend>

				<label class="b24-form-control"
					v-for="(item, index) in field.items"
					:class="{'b24-form-control-checked': item.selected}"
				>
					<input :type="field.type" 
						:id="fieldId + '-' + index"
						:value="item.value"
						:aria-required="ariaRequired"
						:aria-invalid="ariaInvalid"
						v-model="selected"
						@blur="$emit('input-blur')"
						@focus="$emit('input-focus')"
						@keydown.enter.prevent
					>
					<span class="b24-form-control-desc">{{ item.label }}</span>
				</label>
			</fieldset>
			<field-item-image-slider v-bind:field="field"></field-item-image-slider>
			<field-item-alert v-bind:field="field"></field-item-alert>
		</div>
	`
		};

		function _callSuper$n(t, o, e) { return o = babelHelpers.getPrototypeOf(o), babelHelpers.possibleConstructorReturn(t, _isNativeReflectConstruct$n() ? Reflect.construct(o, e || [], babelHelpers.getPrototypeOf(t).constructor) : o.apply(t, e)); }
		function _isNativeReflectConstruct$n() { try { var t = !Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); } catch (t) {} return (_isNativeReflectConstruct$n = function () { return !!t; })(); }
		let Controller$j = /*#__PURE__*/function (_BaseField$Controller) {
			function Controller(options) {
				babelHelpers.classCallCheck(this, Controller);
				options.multiple = false;
				return _callSuper$n(this, Controller, [options]);
			}
			babelHelpers.inherits(Controller, _BaseField$Controller);
			return babelHelpers.createClass(Controller, null, [{
				key: "type",
				value: function type() {
					return 'radio';
				}
			}, {
				key: "component",
				value: function component() {
					return FieldCheckbox;
				}
			}]);
		}(Controller$s);

		function _callSuper$m(t, o, e) { return o = babelHelpers.getPrototypeOf(o), babelHelpers.possibleConstructorReturn(t, _isNativeReflectConstruct$m() ? Reflect.construct(o, e || [], babelHelpers.getPrototypeOf(t).constructor) : o.apply(t, e)); }
		function _isNativeReflectConstruct$m() { try { var t = !Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); } catch (t) {} return (_isNativeReflectConstruct$m = function () { return !!t; })(); }
		let Controller$i = /*#__PURE__*/function (_BaseField$Controller) {
			function Controller(options) {
				babelHelpers.classCallCheck(this, Controller);
				options.multiple = true;
				return _callSuper$m(this, Controller, [options]);
			}
			babelHelpers.inherits(Controller, _BaseField$Controller);
			return babelHelpers.createClass(Controller, null, [{
				key: "type",
				value: function type() {
					return 'checkbox';
				}
			}, {
				key: "component",
				value: function component() {
					return FieldCheckbox;
				}
			}]);
		}(Controller$s);

		const FieldSelect = {
			mixins: [MixinField],
			template: `
		<div class="field-item">
			<label class="b24-form-control-select-label" :for="fieldId">
				{{ field.label }} 
				<span v-show="field.required" class="b24-form-control-required" aria-hidden="true">*</span>
			</label>
			<div>
				<select 
					:id="fieldId"
					v-model="selected"
					v-bind:multiple="field.multiple"
					:aria-required="ariaRequired"
					:aria-invalid="ariaInvalid"
					:aria-describedby="ariaDescribedby"
					@blur="$emit('input-blur', this)"
					@focus="$emit('input-focus', this)"
				>
					<option v-for="item in field.items" 
						v-bind:value="item.value"																
					>
						{{ item.label }}
					</option>
				</select>
			</div>
			<field-item-image-slider v-bind:field="field"></field-item-image-slider>
			<field-item-alert v-bind:field="field"></field-item-alert>
		</div>
	`
		};

		function _callSuper$l(t, o, e) { return o = babelHelpers.getPrototypeOf(o), babelHelpers.possibleConstructorReturn(t, _isNativeReflectConstruct$l() ? Reflect.construct(o, e || [], babelHelpers.getPrototypeOf(t).constructor) : o.apply(t, e)); }
		function _isNativeReflectConstruct$l() { try { var t = !Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); } catch (t) {} return (_isNativeReflectConstruct$l = function () { return !!t; })(); }
		let Controller$h = /*#__PURE__*/function (_BaseField$Controller) {
			function Controller() {
				babelHelpers.classCallCheck(this, Controller);
				return _callSuper$l(this, Controller, arguments);
			}
			babelHelpers.inherits(Controller, _BaseField$Controller);
			return babelHelpers.createClass(Controller, null, [{
				key: "type",
				value: function type() {
					return 'select';
				}
			}, {
				key: "component",
				value: function component() {
					return FieldSelect;
				}
			}]);
		}(Controller$s);

		function _callSuper$k(t, o, e) { return o = babelHelpers.getPrototypeOf(o), babelHelpers.possibleConstructorReturn(t, _isNativeReflectConstruct$k() ? Reflect.construct(o, e || [], babelHelpers.getPrototypeOf(t).constructor) : o.apply(t, e)); }
		function _isNativeReflectConstruct$k() { try { var t = !Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); } catch (t) {} return (_isNativeReflectConstruct$k = function () { return !!t; })(); }
		let Item$2 = /*#__PURE__*/function (_BaseItem) {
			function Item(options) {
				babelHelpers.classCallCheck(this, Item);
				return _callSuper$k(this, Item, [options]);
				/*
				let value;
				if (Util.Type.object(options.value))
				{
					value = options.value;
					value.quantity = value.quantity ? Util.Conv.number(value.quantity) : 0;
				}
				else
				{
					value = {id: options.value};
				}
				this.value = {
					id: value.id || '',
					quantity: value.quantity || this.quantity.min || this.quantity.step,
				};
				*/
			}
			babelHelpers.inherits(Item, _BaseItem);
			return babelHelpers.createClass(Item, [{
				key: "getFileData",
				value: function getFileData() {}
			}, {
				key: "setFileData",
				value: function setFileData(data) {}
			}, {
				key: "clearFileData",
				value: function clearFileData() {
					this.value = null;
				}
			}]);
		}(Item$3);

		const FieldFileItem = {
			props: ['field', 'itemIndex', 'item'],
			data() {
				return {
					errorTextTypeFile: null,
					isLoading: false
				};
			},
			template: `
		<div>
			<div v-if="file.content" class="b24-form-control-file-item">
				<div class="b24-form-control-file-item-preview">
					<img class="b24-form-control-file-item-preview-image" 
						:src="fileIcon"
						v-if="hasIcon"
					>
				</div>
				<div class="b24-form-control-file-item-name">
					<span class="b24-form-control-file-item-name-text">
						{{ file.name }}
					</span>
					<div style="display: none;" class="b24-form-control-file-item-preview-image-popup">
						<img>
					</div>
					<span hidden="hidden" v-show="file.size" :v-bind="file.size" class="b24-form-control-file-item-size-text">
						{{ fileSize }} {{ field.messages.get('fieldFileSizeUnitMb') }}
					</span>
				</div>
				<button 
					type="button"
					@click="removeFile"
					class="b24-form-control-file-item-remove"
					:aria-label="field.messages.get('fieldFileRemove')"
				></button>
			</div>
			<div
				class="b24-form-control-file-item-empty"
				v-show="isLoading"
			>
				<span class="b24-form-control-string">{{ field.messages.get('fieldFileLoading') }}...</span>
			</div>
			<div 
				class="b24-form-control-file-item-empty"
				:class="{'b24-form-control-alert': !!errorTextTypeFile}"
				v-show="!file.content && !isLoading" 
			>
				<button
					type="button"
					class="b24-form-control b24-form-control-file-button"
					@click="openFileDialog"
					:aria-label="field.messages.get('fieldFileChoose')"
				>
					{{ field.messages.get('fieldFileChoose') }}
				</button>
				<input type="file" style="display: none;"
					ref="inputFiles"
					:accept="field.getAcceptTypes()"
					@change="setFiles"
					@blur="$emit('input-blur')"
					@focus="$emit('input-focus')"
				>
				<div class="b24-form-control-alert-message"
					@click="errorTextTypeFile = null"
				>{{errorTextTypeFile}}</div>
			</div>
		</div>
	`,
			computed: {
				value: {
					get: function () {
						let value = this.item.value || {};
						if (value.content) {
							return JSON.stringify(this.item.value);
						}
						return '';
					},
					set: function (newValue) {
						newValue = newValue || {};
						if (typeof newValue === 'string') {
							newValue = JSON.parse(newValue);
						}
						this.item.value = newValue;
						this.item.selected = !!newValue.content;
						this.field.addSingleEmptyItem();
					}
				},
				file: function () {
					return this.item.value || {};
				},
				hasIcon() {
					return this.file.type.split('/')[0] === 'image' && this.file.isContentFull;
				},
				fileIcon() {
					return this.hasIcon ? 'data:' + this.file.type + ';base64,' + this.file.content : null;
				},
				fileSize() {
					const kb = this.file.size / 1024;
					const mb = kb / 1024;
					return mb.toFixed(2);
				}
			},
			methods: {
				openFileDialog() {
					if (this.$refs.inputFiles) {
						this.$refs.inputFiles.click();
					}
				},
				setFiles() {
					this.errorTextTypeFile = null;
					let file = this.$refs.inputFiles.files[0];
					if (!file) {
						return;
					}
					const fileSize = file.size;
					if (file.size === 0) {
						this.errorTextTypeFile = this.field.messages.get('fieldFileErrorEmptyContent');
						return;
					}
					if (typeof this.field.maxSizeMb == "number" && this.field.maxSizeMb > 0) {
						if (this.field.getSummaryFilesSize() + fileSize > this.field.maxSizeMb * (1024 * 1024)) {
							this.errorTextTypeFile = this.field.messages.get('fieldSummaryFilesSizeExceeded').replace('%summaryMaxFileSize%', this.field.maxSizeMb);
							return;
						}
					}
					const fileType = file.type || '';
					const fileExt = (file.name || '').split('.').pop();
					let acceptTypes = this.field.getAcceptTypes();
					acceptTypes = acceptTypes ? acceptTypes.split(',') : [];
					if (file && acceptTypes.length > 0) {
						const isTypeValid = acceptTypes.some(type => {
							type = type || '';
							if (type === fileType) {
								return true;
							}
							if (type.indexOf('*') >= 0) {
								return fileType.indexOf(type.replace(/\*/g, '')) >= 0;
							} else if (type.indexOf('.') === 0) {
								return type === '.' + fileExt;
							}
							return false;
						});
						if (!isTypeValid) {
							file = null;
							const extensions = acceptTypes.filter(item => item.indexOf('/') < 0).join(', ');
							this.errorTextTypeFile = (this.field.messages.get('fieldFileErrorType') || this.field.messages.get('fieldErrorInvalid')).replace('%extensions%', extensions);
							setTimeout(() => this.errorTextTypeFile = null, 15000);
						}
					}
					if (!file) {
						this.value = null;
					} else {
						let reader = new FileReader();
						const newValue = {
							name: file.name,
							size: file.size,
							file
						};
						reader.onloadend = () => {
							const result = reader.result.split(';');
							this.value = {
								...newValue,
								type: result[0].split(':')[1],
								content: result[1].split(',')[1]
							};
							this.$refs.inputFiles.value = null;
							this.isLoading = false;
							this.field.refresh();
						};
						this.isLoading = true;
						const chunkSize = 30 * 1024 * 1024;

						// Reading only first chunk
						if (file.size > chunkSize) {
							newValue.isContentFull = false;
							const blob = file.slice(0, chunkSize);
							reader.readAsDataURL(blob);
						} else {
							newValue.isContentFull = true;
							reader.readAsDataURL(file);
						}
					}
				},
				removeFile() {
					this.value = null;
					this.field.removeItem(this.itemIndex);
					this.field.refresh();
					this.$refs.inputFiles.value = null;
				}
			}
		};
		const FieldFile = {
			mixins: [MixinField],
			components: {
				'field-file-item': FieldFileItem
			},
			template: `
		<div class="b24-form-control-container">
			<div class="b24-form-control-label">
				{{ field.label }}
				<span v-show="field.required" class="b24-form-control-required">*</span>
				<div hidden="hidden" v-show="field.maxSizeMb && field.summarySize >= 0" :v-bind="field.summarySize" class="b24-form-control-field-file-summary-size">
					<span class="b24-form-control-field-file-summary-size-text">
						{{ summarySize }} / {{field.maxSizeMb}} {{ field.messages.get('fieldFileSizeUnitMb') }}
					</span>
				</div>
			</div>
			<div class="b24-form-control-filelist">
				<field-file-item
					v-for="(item, itemIndex) in field.items"
					v-bind:key="field.id"
					v-bind:field="field"
					v-bind:itemIndex="itemIndex"
					v-bind:item="item"
					@input-blur="$emit('input-blur')"
					@input-focus="$emit('input-focus')"
				></field-file-item>
				<field-item-alert v-bind:field="field"></field-item-alert>
			</div>
		</div>
	`,
			created() {
				if (this.field.multiple) {
					this.field.addSingleEmptyItem();
				}
			},
			computed: {
				summarySize() {
					const summary = this.field.summarySize;
					return (summary / (1024 * 1024)).toFixed(2);
				}
			},
			methods: {}
		};

		const KEY_SPACE$1 = ' ';
		const ItemSelector = {
			props: ['field', 'listboxId', 'focusedIndex'],
			template: `
		<div 
			ref="container"
			:id="listboxId"
			role="listbox"
		>
			<div class="b24-form-control-list-selector-item"
				v-for="(item, itemIndex) in field.items"
				:key="item.value"
				:id="getItemId(itemIndex)"
				:class="{'b24-form-control-list-selector-item-focused': itemIndex === focusedIndex}"
				role="option"
				@click="selectItem(item)"
			>
				<img class="b24-form-control-list-selector-item-image"
					v-if="pic(item)" 
					:src="pic(item)"
					alt=""
				>
				<div class="b24-form-control-list-selector-item-title">
					<span >{{ item.label }}</span>
				</div>
	
				<div class="b24-form-control-list-selector-item-price"
					v-if="hasPrice(item)"
				>
					<div class="b24-form-control-list-selector-item-price-old"
						v-if="item.discount"
						v-html="field.formatMoney(item.price + item.discount)"
						aria-hidden="true"
					></div>
					<div class="b24-form-control-list-selector-item-price-current"
						v-if="item.price || item.price === 0"
						v-html="field.formatMoney(item.price)"
					></div> 
				</div>
			</div>
		</div>
	`,
			watch: {
				focusedIndex() {
					this.scrollToFocused();
				}
			},
			methods: {
				getItemId(index) {
					return `${this.field.id}-option-${index}`;
				},
				hasPrice(item) {
					return item.price || item.price === 0 || item.discount;
				},
				pic(item) {
					return item && item.pics && item.pics.length > 0 ? item.pics[0] : '';
				},
				selectItem(item) {
					this.$emit('select', item);
				},
				scrollToFocused() {
					this.$nextTick(() => {
						const container = this.$refs.container;
						if (!container) {
							return;
						}
						const focusedElement = container.children[this.focusedIndex];
						if (focusedElement) {
							focusedElement.scrollIntoView({
								block: 'nearest',
								behavior: 'smooth'
							});
						}
					});
				}
			}
		};
		const fieldListMixin = {
			props: ['field'],
			mixins: [MixinField, MixinDropDown],
			components: {
				'item-selector': ItemSelector
			},
			data() {
				return {
					focusedItemIndex: 0
				};
			},
			methods: {
				toggleSelector() {
					this.toggleDropDown();
				},
				select(item) {
					const select = () => {
						if (this.item) {
							this.item.selected = false;
						}
						item.selected = true;
						this.closeDropDown();
					};
					if (this.item && this.item.selected) {
						select();
					} else {
						setTimeout(select, 0);
					}
				},
				unselect() {
					this.item.selected = false;
				},
				handleKeydown(event) {
					const {
						key
					} = event;
					if (this.dropDownOpened) {
						const items = this.field.items;

						// eslint-disable-next-line default-case
						switch (key) {
							case 'ArrowDown':
								{
									event.preventDefault();
									this.focusedItemIndex = Math.min(this.focusedItemIndex + 1, items.length - 1);
									break;
								}
							case 'ArrowUp':
								{
									event.preventDefault();
									this.focusedItemIndex = Math.max(this.focusedItemIndex - 1, 0);
									break;
								}
							case 'Enter':
							case KEY_SPACE$1:
								{
									event.preventDefault();
									if (items[this.focusedItemIndex]) {
										this.select(items[this.focusedItemIndex]);
									}
									break;
								}
							case 'Escape':
							case 'Esc':
								{
									event.preventDefault();
									this.closeDropDown();
									break;
								}
						}
						return;
					}
					if (['Enter', KEY_SPACE$1, 'ArrowDown', 'ArrowUp'].includes(key)) {
						event.preventDefault();
						this.toggleDropDown();
					}
				},
				onDropdownMousedown() {
					this.isInteractingWithDropdown = true;
				},
				handleBlur() {
					if (this.isInteractingWithDropdown) {
						this.isInteractingWithDropdown = false;
						return;
					}
					if (this.dropDownOpened) {
						this.closeDropDown();
					}
				}
			}
		};
		const FieldListItem = {
			mixins: [fieldListMixin],
			props: ['field', 'item', 'itemIndex', 'itemSubComponent'],
			template: `
		<div class="b24-form-control-container b24-form-control-icon-after"
			:id="fieldId"
			tabindex="0"
			@click="toggleSelector"
			@keydown="onKeydown"
			@blur="onBlur"
			:aria-label="field.label"
			:aria-invalid="ariaInvalid"
			:aria-describedby="ariaDescribedby"
			:aria-expanded="dropDownOpened ? 'true' : 'false'"
			:aria-controls="getDropdownId()"
			:aria-activedescendant="dropDownOpened ? getActiveDescendantId() : ''"
			role="combobox"
		>
			<input readonly="" type="text" class="b24-form-control"
				:value="itemLabel"
				:class="classes"
				tabindex="-1"
			>
			<div class="b24-form-control-label" aria-hidden="true">
				{{ field.label }}
				<span v-show="field.required" class="b24-form-control-required">*</span>
			</div>
			<button
				type="button"
				class="b24-form-icon-after b24-form-icon-remove"
				v-if="item.selected"
				@click.stop="unselect"
				@keydown.stop="onRemoveKeydown"
				:aria-label="field.messages.get('fieldListUnselect')"
			></button>
			<field-item-alert 
				v-bind:field="field"
				v-bind:item="item"
				v-bind:itemIndex="itemIndex"
			></field-item-alert>
			<field-item-dropdown 
				:marginTop="0" 
				:visible="dropDownOpened"
				:title="field.label"
				:messages="field.messages"
				@close="closeDropDown()"
				@visible:on="$emit('visible:on')"
				@visible:off="$emit('visible:off')"
				@mousedown.native="onDropdownMousedown"
			>
				<item-selector
					:field="field"
					:listboxId="getDropdownId()"
					:focusedIndex="focusedItemIndex"
					@select="select"
					@close="closeDropDown"
				></item-selector>
			</field-item-dropdown>
			<field-item-image-slider 
				v-if="item.selected && field.bigPic" 
				:field="field" 
				:item="item"
			></field-item-image-slider>
			<component v-if="item.selected && itemSubComponent" :is="itemSubComponent"
				:key="field.id"
				:field="field"
				:item="item"
			></component>
		</div>
	`,
			computed: {
				itemLabel() {
					if (!this.item || !this.item.selected) {
						return '';
					}
					return this.item.label;
				},
				classes() {
					const list = [];
					if (this.itemLabel) {
						list.push('b24-form-control-not-empty');
					}
					return list;
				}
			},
			methods: {
				getDropdownId() {
					return `${this.fieldId}-listbox`;
				},
				getActiveDescendantId() {
					if (!this.dropDownOpened || this.field.items.length === 0) {
						return '';
					}
					return `${this.field.id}-option-${this.focusedItemIndex}`;
				},
				onKeydown(event) {
					this.handleKeydown(event);
				},
				onBlur() {
					this.handleBlur();
				},
				onRemoveKeydown(event) {
					if (event.key === 'Enter' || event.key === KEY_SPACE$1) {
						event.preventDefault();
						this.unselect();
					}
				}
			}
		};
		const FieldList = {
			mixins: [fieldListMixin],
			components: {
				'field-list-item': FieldListItem
			},
			template: `
		<div>
			<field-list-item
				v-for="(item, itemIndex) in getItems()"
				:key="itemIndex"
				:field="field"
				:item="item"
				:itemIndex="itemIndex"
				:itemSubComponent="itemSubComponent"
				@visible:on="$emit('input-focus')"
				@visible:off="$emit('input-blur')"
			></field-list-item>
			<button 
				type="button"
				class="b24-form-control-add-btn"
				v-if="isAddVisible()"
				@click="toggleSelector"
				@keydown="handleKeydown"
				@blur="handleBlur"
				:aria-label="field.messages.get('fieldAdd')"
				:aria-expanded="dropDownOpened ? 'true' : 'false'"
				:aria-controls="getAddListboxId()"
				:aria-activedescendant="dropDownOpened ? getActiveDescendantId() : ''"
			>
				{{ field.messages.get('fieldAdd') }}
			</button>
			<field-item-dropdown 
				:marginTop="0" 
				:visible="dropDownOpened"
				:title="field.label"
				:messages="field.messages"
				@close="closeDropDown()"
				@visible:on="$emit('input-focus')"
				@visible:off="$emit('input-blur')"
				@mousedown.native="onDropdownMousedown"
			>
				<item-selector
					:field="field"
					:listboxId="getAddListboxId()"
					:focusedIndex="focusedItemIndex"
					@select="select"
					@close="closeDropDown"
				></item-selector>
			</field-item-dropdown>
		</div>
	`,
			computed: {
				itemSubComponent() {
					return null;
				}
			},
			methods: {
				getAddListboxId() {
					return `${this.field.id}-add-listbox`;
				},
				getActiveDescendantId() {
					if (!this.dropDownOpened || this.field.items.length === 0) {
						return '';
					}
					return `${this.field.id}-option-${this.focusedItemIndex}`;
				},
				getItems() {
					return this.field.selectedItem() ? this.field.selectedItems() : this.field.item() ? [this.field.item()] : [];
				},
				isAddVisible() {
					return this.field.multiple && this.field.item() && this.field.selectedItem() && this.field.unselectedItem();
				}
			}
		};

		function _callSuper$j(t, o, e) { return o = babelHelpers.getPrototypeOf(o), babelHelpers.possibleConstructorReturn(t, _isNativeReflectConstruct$j() ? Reflect.construct(o, e || [], babelHelpers.getPrototypeOf(t).constructor) : o.apply(t, e)); }
		function _isNativeReflectConstruct$j() { try { var t = !Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); } catch (t) {} return (_isNativeReflectConstruct$j = function () { return !!t; })(); }
		let DefaultOptions$1 = {
			type: 'string',
			label: 'Default field name',
			multiple: false,
			visible: true,
			required: false,
			bigPic: true
		};
		let Controller$g = /*#__PURE__*/function (_BaseField$Controller) {
			function Controller(options = DefaultOptions$1) {
				var _this;
				babelHelpers.classCallCheck(this, Controller);
				_this = _callSuper$j(this, Controller, [options]);
				babelHelpers.defineProperty(_this, "bigPic", false);
				_this.bigPic = !!options.bigPic;
				return _this;
			}

			/*
			adjust(options: Options = DefaultOptions)
			{
				super.adjust(options);
			}
			*/
			babelHelpers.inherits(Controller, _BaseField$Controller);
			return babelHelpers.createClass(Controller, [{
				key: "getOriginalType",
				value: function getOriginalType() {
					return 'list';
				}
			}], [{
				key: "type",
				value: function type() {
					return 'list';
				}
			}, {
				key: "component",
				value: function component() {
					return FieldList;
				}
			}]);
		}(Controller$s);

		function _callSuper$i(t, o, e) { return o = babelHelpers.getPrototypeOf(o), babelHelpers.possibleConstructorReturn(t, _isNativeReflectConstruct$i() ? Reflect.construct(o, e || [], babelHelpers.getPrototypeOf(t).constructor) : o.apply(t, e)); }
		function _isNativeReflectConstruct$i() { try { var t = !Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); } catch (t) {} return (_isNativeReflectConstruct$i = function () { return !!t; })(); }
		let Controller$f = /*#__PURE__*/function (_BaseField$Controller) {
			function Controller(options = DefaultOptions$1) {
				var _this;
				babelHelpers.classCallCheck(this, Controller);
				_this = _callSuper$i(this, Controller, [options]);
				babelHelpers.defineProperty(_this, "contentTypes", []);
				babelHelpers.defineProperty(_this, "maxSizeMb", null);
				babelHelpers.defineProperty(_this, "summarySize", 0);
				_this.contentTypes = (Array.isArray(options.contentTypes) ? options.contentTypes : []) || [];
				_this.maxSizeMb = Number.isInteger(options.maxSizeMb) ? options.maxSizeMb : null;
				return _this;
			}
			babelHelpers.inherits(Controller, _BaseField$Controller);
			return babelHelpers.createClass(Controller, [{
				key: "getAcceptTypes",
				value: function getAcceptTypes() {
					return this.contentTypes.map(item => {
						switch (item) {
							case 'image/*':
								return [item, '.jpeg', '.png', '.ico'];
							case 'video/*':
								return [item, '.mp4', '.avi'];
							case 'audio/*':
								return [item, '.mp3', '.ogg', '.wav'];
							case 'x-bx/doc':
								return ['application/pdf', 'application/msword', 'text/csv', 'text/plain', 'application/vnd.*', '.pdf', '.doc', '.docx', '.txt', '.ppt', '.pptx', '.xls', '.xlsx', '.csv', '.vsd', '.vsdx'].join(',');
							case 'x-bx/arc':
								return ['application/zip', 'application/gzip', 'application/x-tar', 'application/x-rar-compressed', '.zip', '.7z', '.tar', '.gzip', '.rar'].join(',');
							default:
								return item;
						}
					}).join(',');
				}
			}, {
				key: "getSummaryFilesSize",
				value: function getSummaryFilesSize() {
					let size = 0;
					this.items.forEach(item => {
						size += item.value?.size || 0;
					});
					return size;
				}
			}, {
				key: "refresh",
				value: function refresh() {
					this.summarySize = this.getSummaryFilesSize();
				}
			}], [{
				key: "type",
				value: function type() {
					return 'file';
				}
			}, {
				key: "component",
				value: function component() {
					return FieldFile;
				}
			}, {
				key: "createItem",
				value: function createItem(options) {
					return new Item$2(options);
				}
			}]);
		}(Controller$s);

		function _callSuper$h(t, o, e) { return o = babelHelpers.getPrototypeOf(o), babelHelpers.possibleConstructorReturn(t, _isNativeReflectConstruct$h() ? Reflect.construct(o, e || [], babelHelpers.getPrototypeOf(t).constructor) : o.apply(t, e)); }
		function _isNativeReflectConstruct$h() { try { var t = !Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); } catch (t) {} return (_isNativeReflectConstruct$h = function () { return !!t; })(); }
		let Item$1 = /*#__PURE__*/function (_BaseItem) {
			function Item(options) {
				var _this;
				babelHelpers.classCallCheck(this, Item);
				_this = _callSuper$h(this, Item, [options]);
				babelHelpers.defineProperty(_this, "pics", []);
				babelHelpers.defineProperty(_this, "discount", 0);
				babelHelpers.defineProperty(_this, "changeablePrice", false);
				if (Array.isArray(options.pics)) {
					_this.pics = options.pics;
				}
				let price = Conv.number(options.price);
				_this.changeablePrice = !!options.changeablePrice;
				if (_this.changeablePrice) {
					price = null;
				}
				_this.discount = Conv.number(options.discount);
				let quantity = Type.object(options.quantity) ? options.quantity : {};
				_this.quantity = {
					min: quantity.min ? Conv.number(quantity.min) : 0,
					max: quantity.max ? Conv.number(quantity.max) : 0,
					step: quantity.step ? Conv.number(quantity.step) : 1,
					unit: quantity.unit || ''
				};
				let value;
				if (Type.object(options.value)) {
					value = options.value;
					value.quantity = value.quantity ? Conv.number(value.quantity) : 0;
				} else {
					value = {
						id: options.value
					};
				}
				_this.value = {
					id: value.id || '',
					quantity: value.quantity || _this.quantity.min || _this.quantity.step,
					price: price
				};
				if (_this.changeablePrice) {
					_this.value.changeablePrice = true;
				}
				if (!options.price && !options.label && !options.value) {
					_this.selected = false;
				}
				return _this;
			}
			babelHelpers.inherits(Item, _BaseItem);
			return babelHelpers.createClass(Item, [{
				key: "price",
				get: function () {
					return this.value.price;
				},
				set: function (val) {
					this.value.price = val;
				}
			}, {
				key: "onSelect",
				value: function onSelect(value) {
					return !this.value.id && !this.value.price && !this.label ? false : value;
				}
			}, {
				key: "getNextIncQuantity",
				value: function getNextIncQuantity() {
					let q = this.value.quantity + this.quantity.step;
					let max = this.quantity.max;
					return max <= 0 || max >= q ? q : 0;
				}
			}, {
				key: "getNextDecQuantity",
				value: function getNextDecQuantity() {
					let q = this.value.quantity - this.quantity.step;
					let min = this.quantity.min;
					return q > 0 && (min <= 0 || min <= q) ? q : 0;
				}
			}, {
				key: "incQuantity",
				value: function incQuantity() {
					this.value.quantity = this.getNextIncQuantity();
				}
			}, {
				key: "decQuantity",
				value: function decQuantity() {
					this.value.quantity = this.getNextDecQuantity();
				}
			}, {
				key: "getSummary",
				value: function getSummary() {
					return (this.price + this.discount) * this.value.quantity;
				}
			}, {
				key: "getTotal",
				value: function getTotal() {
					return this.price * this.value.quantity;
				}
			}, {
				key: "getDiscounts",
				value: function getDiscounts() {
					return this.discount * this.value.quantity;
				}
			}, {
				key: "getComparableValue",
				value: function getComparableValue() {
					return this.value.id + '';
				}
			}]);
		}(Item$3);

		const FieldProductSubItem = {
			props: ['field', 'item'],
			template: `
		<div class="b24-form-control-product-info" @click.stop>
			<input type="hidden" 
				v-model="item.value.quantity"
			>
			<div class="b24-form-control-product-icon">
				<svg v-if="!pic" width="28px" height="24px" viewBox="0 0 28 24" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
					<g transform="translate(-14, -17)" fill="#333" stroke="none" stroke-width="1" fill-rule="evenodd" opacity="0.2">
						<path d="M29,38.5006415 C29,39.8807379 27.8807708,41 26.4993585,41 C25.1192621,41 24,39.8807708 24,38.5006415 C24,37.1192621 25.1192292,36 26.4993585,36 C27.8807379,36 29,37.1192292 29,38.5006415 Z M39,38.5006415 C39,39.8807379 37.8807708,41 36.4993585,41 C35.1192621,41 34,39.8807708 34,38.5006415 C34,37.1192621 35.1192292,36 36.4993585,36 C37.8807379,36 39,37.1192292 39,38.5006415 Z M20.9307332,21.110867 L40.9173504,21.0753348 C41.2504348,21.0766934 41.5636721,21.2250055 41.767768,21.4753856 C41.97328,21.7271418 42.046982,22.0537176 41.9704452,22.3639694 L39.9379768,33.1985049 C39.8217601,33.6666139 39.3866458,33.9972787 38.8863297,34 L22.7805131,34 C22.280197,33.9972828 21.8450864,33.6666243 21.728866,33.1985049 L18.2096362,19.0901297 L15,19.0901297 C14.4477153,19.0901297 14,18.6424144 14,18.0901297 L14,18 C14,17.4477153 14.4477153,17 15,17 L19.0797196,17 C19.5814508,17.0027172 20.0151428,17.3333757 20.1327818,17.8014951 L20.9307332,21.110867 Z" id="Icon"></path>
					</g>
				</svg>
				<img v-if="pic" :src="pic" style="height: 24px;">
			</div>
			
			<div class="b24-form-control-product-quantity"
				v-if="item.selected"
			>
				<div class="b24-form-control-product-quantity-remove"
					:style="{visibility: item.getNextDecQuantity() ? 'visible' : 'hidden'}"
					@click.stop="item.decQuantity()"
				></div>
				<div class="b24-form-control-product-quantity-counter">
					{{ item.value.quantity }}
					<span
						v-if="item.quantity.unit"
					>{{ item.quantity.unit }}</span>
				</div>
				<div class="b24-form-control-product-quantity-add"
					:style="{visibility: item.getNextIncQuantity() ? 'visible' : 'hidden'}"
					@click.stop="item.incQuantity()"
				></div>
			</div>
			<div class="b24-form-control-product-price">
				<div>
					<div class="b24-form-control-product-price-old"
						v-if="item.discount"
						v-html="field.formatMoney(item.getSummary())"
					></div>
					<div class="b24-form-control-product-price-current"
						v-html="field.formatMoney(item.getTotal())"
					></div>
				</div>
			</div>
		</div>
	`,
			computed: {
				pic() {
					return !this.field.bigPic && this.item && this.item.pics && this.item.pics.length > 0 ? this.item.pics[0] : '';
				}
			}
		};
		const FieldProductItem = {
			mixins: [FieldListItem],
			components: {
				'field-list-sub-item': FieldProductSubItem
			}
		};
		const FieldProductPriceOnly = {
			mixins: [MixinField],
			template: `
		<div class="b24-form-control-container">
			<span class="b24-form-control-label">
				{{ field.label }} 
				<span v-show="field.required" class="b24-form-control-required">*</span>
			</span>
			
			<label class="b24-form-control"
				v-for="(item, itemIndex) in field.items"
				:key="itemIndex"
				:class="{'b24-form-control-checked': item.selected, 'b24-form-control-product-custom-price': item.changeablePrice}"
				@click="onItemClick"
			>
				<input 
					:type="field.multiple ? 'checkbox' : 'radio'"
					:value="item.value"
					v-model="selected"
					@blur="$emit('input-blur')"
					@focus="$emit('input-focus')"
					v-show="!field.hasChangeablePrice()"
				>
				<span class="b24-form-control-desc"
					v-show="!item.changeablePrice"
					v-html="field.formatMoney(item.price)"
				></span> 

				<span class="b24-form-control-desc"
					v-if="item.changeablePrice && getCurrencyLeft()"
					:style="getCurrencyStyles(item)" 
					v-html="getCurrencyLeft()"
				></span>
				<input type="number" step="1" class="b24-form-control-input-text"
					v-if="item.changeablePrice"
					:placeholder="isFocused(item) ? '' : field.messages.get('fieldProductAnotherSum')"
					v-model="item.price"
					@input="onInput"
					@focus="onFocus(item)"
					@blur="onBlur"
					@keydown="onKeyDown"
				>
				<span class="b24-form-control-desc"
					v-if="item.changeablePrice && getCurrencyRight()"
					:style="getCurrencyStyles(item)"
					v-html="getCurrencyRight()"
				></span>
				
				<field-item-alert
					v-if="item.changeablePrice"
					:field="field"
					:item="item"
				></field-item-alert>
			</label>
		</div>
	`,
			data() {
				return {
					focusedItem: null
				};
			},
			computed: {
				itemSubComponent() {
					return null;
				}
			},
			methods: {
				onItemClick(e) {
					const node = e.target.querySelector('.b24-form-control-input-text');
					if (node) {
						node.focus();
					}
				},
				getCurrencyLeft() {
					return this.field.getCurrencyFormatArray()[0] || '';
				},
				getCurrencyRight() {
					return this.field.getCurrencyFormatArray()[1] || '';
				},
				getCurrencyStyles(item) {
					return {
						visibility: item.price || this.isFocused(item) ? null : 'hidden'
					};
				},
				isFocused(item) {
					return this.focusedItem === item;
				},
				onFocus(item) {
					this.selected = item.value;
					this.focusedItem = item;
				},
				onBlur() {
					this.focusedItem = null;
				},
				onInput(event) {
					let value = this.field.normalize(event.target.value);
					value = this.field.format(value);
					if (this.value !== value) {
						this.value = value;
					}
				},
				onKeyDown(e) {
					if (e.ctrlKey || e.metaKey) {
						return;
					}
					let val = e.key;
					if (!/[^\d]/.test(val || '')) {
						return;
					}
					if (val === 'Esc' || val === 'Delete' || val === 'Backspace') {
						return;
					}
					e.preventDefault();
				}
			}
		};
		const FieldProductStandard = {
			mixins: [FieldList],
			components: {
				'field-list-item': FieldProductItem
			},
			computed: {
				itemSubComponent() {
					return 'field-list-sub-item';
				}
			}
		};
		const FieldProduct = {
			mixins: [MixinField],
			components: {
				FieldProductStandard,
				FieldProductPriceOnly
			},
			methods: {
				getProductComponent() {
					return this.field.hasChangeablePrice() ? 'FieldProductPriceOnly' : 'FieldProductStandard';
				}
			},
			template: `<component :is="getProductComponent()" :field="field"></component>`
		};

		function _callSuper$g(t, o, e) { return o = babelHelpers.getPrototypeOf(o), babelHelpers.possibleConstructorReturn(t, _isNativeReflectConstruct$g() ? Reflect.construct(o, e || [], babelHelpers.getPrototypeOf(t).constructor) : o.apply(t, e)); }
		function _isNativeReflectConstruct$g() { try { var t = !Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); } catch (t) {} return (_isNativeReflectConstruct$g = function () { return !!t; })(); }
		function _superPropGet$1(t, o, e, r) { var p = babelHelpers.get(babelHelpers.getPrototypeOf(t.prototype ), o, e); return 2 & r && "function" == typeof p ? function (t) { return p.apply(e, t); } : p; }
		let Controller$e = /*#__PURE__*/function (_ListField$Controller) {
			function Controller(options) {
				var _this;
				babelHelpers.classCallCheck(this, Controller);
				_this = _callSuper$g(this, Controller, [options]);
				if (_this.hasChangeablePrice()) {
					_this.multiple = false;
				}
				_this.currency = options.currency;
				_this.validators.push(value => !value.changeablePrice || value.price > 0);
				_this.validators.push(value => !value.changeablePrice || Validator.Money(value.price));
				_this.filters.push(value => !value.changeablePrice || Filter.Money(value.price));
				_this.normalizers.push(value => !value.changeablePrice ? value : Normalizer.Money(value.price));
				return _this;
			}
			babelHelpers.inherits(Controller, _ListField$Controller);
			return babelHelpers.createClass(Controller, [{
				key: "getOriginalType",
				value: function getOriginalType() {
					return this.hasChangeablePrice() ? 'product' : 'list';
				}
			}, {
				key: "hasChangeablePrice",
				value: function hasChangeablePrice() {
					return this.items.some(item => item.changeablePrice);
				}
			}, {
				key: "formatMoney",
				value: function formatMoney(val) {
					return Conv.formatMoney(val, this.currency.format);
				}
			}, {
				key: "getCurrencyFormatArray",
				value: function getCurrencyFormatArray() {
					return this.currency.format.replace('&#', '|||||').replace('&amp;#', '|-|||-|').split('#').map(item => item.replace('|-|||-|', '&amp;#').replace('|||||', '&#'));
				}
			}, {
				key: "addItem",
				value: function addItem(options) {
					if (!options.value && !options.label && !options.price) {
						options.selected = false;
					}
					return _superPropGet$1(Controller, "addItem", this, 3)([options]);
				}
			}], [{
				key: "type",
				value: function type() {
					return 'product';
				}
			}, {
				key: "component",
				value: function component() {
					return FieldProduct;
				}
			}, {
				key: "createItem",
				value: function createItem(options) {
					return new Item$1(options);
				}
			}]);
		}(Controller$g);

		const Format = {
			re: /[,.\- :\/\\]/,
			year: 'YYYY',
			month: 'MM',
			day: 'DD',
			hours: 'HH',
			hours12: 'H',
			hoursZeroFree: 'GG',
			hoursZeroFree12: 'G',
			minutes: 'MI',
			seconds: 'SS',
			ampm: 'TT',
			ampmLower: 'T',
			format(date, dateFormat) {
				let hours12 = date.getHours();
				if (hours12 === 0) {
					hours12 = 12;
				} else if (hours12 > 12) {
					hours12 -= 12;
				}
				let ampm = date.getHours() > 11 ? 'PM' : 'AM';
				return dateFormat.replace(this.year, () => date.getFullYear()).replace(this.month, match => paddNum(date.getMonth() + 1, match.length)).replace(this.day, match => paddNum(date.getDate(), match.length)).replace(this.hours, () => paddNum(date.getHours(), 2)).replace(this.hoursZeroFree, () => date.getHours()).replace(this.hours12, () => paddNum(hours12, 2)).replace(this.hoursZeroFree12, () => hours12).replace(this.minutes, match => paddNum(date.getMinutes(), match.length)).replace(this.seconds, match => paddNum(date.getSeconds(), match.length)).replace(this.ampm, () => ampm).replace(this.ampmLower, () => ampm.toLowerCase());
			},
			parse(dateString, dateFormat) {
				let r = {
					day: 1,
					month: 1,
					year: 1970,
					hours: 0,
					minutes: 0,
					seconds: 0
				};
				const dateParts = dateString.split(this.re);
				const formatParts = dateFormat.split(this.re);
				const partsSize = formatParts.length;
				let isPm = false;
				for (let i = 0; i < partsSize; i++) {
					let part = dateParts[i];
					switch (formatParts[i]) {
						case this.ampm:
						case this.ampmLower:
							isPm = part.toUpperCase() === 'PM';
							break;
					}
				}
				for (let i = 0; i < partsSize; i++) {
					let part = dateParts[i];
					let partInt = parseInt(part);
					switch (formatParts[i]) {
						case this.year:
							r.year = partInt;
							break;
						case this.month:
							r.month = partInt;
							break;
						case this.day:
							r.day = partInt;
							break;
						case this.hours:
						case this.hoursZeroFree:
							r.hours = partInt;
							break;
						case this.hours12:
						case this.hoursZeroFree12:
							r.hours = isPm ? (partInt > 11 ? 11 : partInt) + 12 : partInt > 11 ? 0 : partInt;
							break;
						case this.minutes:
							r.minutes = partInt;
							break;
						case this.seconds:
							r.seconds = partInt;
							break;
					}
				}
				return r;
			},
			isAmPm(dateFormat) {
				return dateFormat.indexOf(this.ampm) >= 0 || dateFormat.indexOf(this.ampmLower) >= 0;
			},
			convertHoursToAmPm(hours, isPm) {
				return isPm ? (hours > 11 ? 11 : hours) + 12 : hours > 11 ? 0 : hours;
			}
		};
		const VueDatePick = {
			props: {
				show: {
					type: Boolean,
					default: true
				},
				value: {
					type: String,
					default: ''
				},
				format: {
					type: String,
					default: 'MM/DD/YYYY'
				},
				displayFormat: {
					type: String
				},
				editable: {
					type: Boolean,
					default: true
				},
				hasInputElement: {
					type: Boolean,
					default: true
				},
				inputAttributes: {
					type: Object
				},
				selectableYearRange: {
					type: Number,
					default: 40
				},
				parseDate: {
					type: Function
				},
				formatDate: {
					type: Function
				},
				pickTime: {
					type: Boolean,
					default: false
				},
				pickMinutes: {
					type: Boolean,
					default: true
				},
				pickSeconds: {
					type: Boolean,
					default: false
				},
				isDateDisabled: {
					type: Function,
					default: () => false
				},
				nextMonthCaption: {
					type: String,
					default: 'Next month'
				},
				prevMonthCaption: {
					type: String,
					default: 'Previous month'
				},
				setTimeCaption: {
					type: String,
					default: 'Set time'
				},
				closeButtonCaption: {
					type: String,
					default: 'Close'
				},
				mobileBreakpointWidth: {
					type: Number,
					default: 530
				},
				weekdays: {
					type: Array,
					default: () => ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
				},
				months: {
					type: Array,
					default: () => ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
				},
				startWeekOnSunday: {
					type: Boolean,
					default: false
				}
			},
			data() {
				return {
					inputValue: this.valueToInputFormat(this.value),
					currentPeriod: this.getPeriodFromValue(this.value, this.format),
					direction: undefined,
					positionClass: undefined,
					opened: !this.hasInputElement && this.show
				};
			},
			computed: {
				valueDate() {
					const value = this.value;
					const format = this.format;
					return value ? this.parseDateString(value, format) : undefined;
				},
				isReadOnly() {
					return !this.editable || this.inputAttributes && this.inputAttributes.readonly;
				},
				isValidValue() {
					const valueDate = this.valueDate;
					return this.value ? Boolean(valueDate) : true;
				},
				currentPeriodDates() {
					const {
						year,
						month
					} = this.currentPeriod;
					const days = [];
					const date = new Date(year, month, 1);
					const today = new Date();
					const offset = this.startWeekOnSunday ? 1 : 0;

					// append prev month dates
					const startDay = date.getDay() || 7;
					if (startDay > 1 - offset) {
						for (let i = startDay - (2 - offset); i >= 0; i--) {
							const prevDate = new Date(date);
							prevDate.setDate(-i);
							days.push({
								outOfRange: true,
								date: prevDate
							});
						}
					}
					while (date.getMonth() === month) {
						days.push({
							date: new Date(date)
						});
						date.setDate(date.getDate() + 1);
					}

					// append next month dates
					const daysLeft = 7 - days.length % 7;
					for (let i = 1; i <= daysLeft; i++) {
						const nextDate = new Date(date);
						nextDate.setDate(i);
						days.push({
							outOfRange: true,
							date: nextDate
						});
					}

					// define day states
					days.forEach(day => {
						day.disabled = this.isDateDisabled(day.date);
						day.today = areSameDates(day.date, today);
						day.dateKey = [day.date.getFullYear(), day.date.getMonth() + 1, day.date.getDate()].join('-');
						day.selected = this.valueDate ? areSameDates(day.date, this.valueDate) : false;
					});
					return chunkArray(days, 7);
				},
				yearRange() {
					const years = [];
					const currentYear = this.currentPeriod.year;
					const startYear = currentYear - this.selectableYearRange;
					const endYear = currentYear + this.selectableYearRange;
					for (let i = startYear; i <= endYear; i++) {
						years.push(i);
					}
					return years;
				},
				hasCurrentTime() {
					return !!this.valueDate;
				},
				currentTime() {
					const currentDate = this.valueDate;
					let hours = currentDate ? currentDate.getHours() : 12;
					let minutes = currentDate ? currentDate.getMinutes() : 0;
					let seconds = currentDate ? currentDate.getSeconds() : 0;
					return {
						hours: hours,
						minutes: minutes,
						seconds: seconds,
						hoursPadded: paddNum(hours, 1),
						minutesPadded: paddNum(minutes, 2),
						secondsPadded: paddNum(seconds, 2)
					};
				},
				directionClass() {
					return this.direction ? `vdp${this.direction}Direction` : undefined;
				},
				weekdaysSorted() {
					if (this.startWeekOnSunday) {
						const weekdays = this.weekdays.slice();
						weekdays.unshift(weekdays.pop());
						return weekdays;
					} else {
						return this.weekdays;
					}
				}
			},
			watch: {
				show(value) {
					this.opened = value;
				},
				value(value) {
					if (this.isValidValue) {
						this.inputValue = this.valueToInputFormat(value);
						this.currentPeriod = this.getPeriodFromValue(value, this.format);
					}
				},
				currentPeriod(currentPeriod, oldPeriod) {
					const currentDate = new Date(currentPeriod.year, currentPeriod.month).getTime();
					const oldDate = new Date(oldPeriod.year, oldPeriod.month).getTime();
					this.direction = currentDate !== oldDate ? currentDate > oldDate ? 'Next' : 'Prev' : undefined;
				}
			},
			beforeDestroy() {
				this.removeCloseEvents();
				this.teardownPosition();
			},
			methods: {
				valueToInputFormat(value) {
					return !this.displayFormat ? value : this.formatDateToString(this.parseDateString(value, this.format), this.displayFormat) || value;
				},
				getPeriodFromValue(dateString, format) {
					const date = this.parseDateString(dateString, format) || new Date();
					return {
						month: date.getMonth(),
						year: date.getFullYear()
					};
				},
				parseDateString(dateString, dateFormat) {
					return !dateString ? undefined : this.parseDate ? this.parseDate(dateString, dateFormat) : this.parseSimpleDateString(dateString, dateFormat);
				},
				formatDateToString(date, dateFormat) {
					return !date ? '' : this.formatDate ? this.formatDate(date, dateFormat) : this.formatSimpleDateToString(date, dateFormat);
				},
				parseSimpleDateString(dateString, dateFormat) {
					let r = Format.parse(dateString, dateFormat);
					let day = r.day,
						month = r.month,
						year = r.year,
						hours = r.hours,
						minutes = r.minutes,
						seconds = r.seconds;
					const resolvedDate = new Date([paddNum(year, 4), paddNum(month, 2), paddNum(day, 2)].join('-'));
					if (isNaN(resolvedDate)) {
						return undefined;
					} else {
						const date = new Date(year, month - 1, day);
						[[year, 'setFullYear'], [hours, 'setHours'], [minutes, 'setMinutes'], [seconds, 'setSeconds']].forEach(([value, method]) => {
							typeof value !== 'undefined' && date[method](value);
						});
						return date;
					}
				},
				formatSimpleDateToString(date, dateFormat) {
					return Format.format(date, dateFormat);
				},
				getHourList() {
					let list = [];
					let isAmPm = Format.isAmPm(this.displayFormat || this.format);
					for (let hours = 0; hours < 24; hours++) {
						let hoursDisplay = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
						hoursDisplay += hours > 11 ? ' pm' : ' am';
						list.push({
							value: hours,
							name: isAmPm ? hoursDisplay : hours
						});
					}
					return list;
				},
				getMinuteList() {
					let list = [];
					for (let i = 0; i <= 60; i++) {
						list.push({
							value: paddNum(i, 2),
							name: paddNum(i, 2)
						});
					}
					return list;
				},
				incrementMonth(increment = 1) {
					const refDate = new Date(this.currentPeriod.year, this.currentPeriod.month);
					const incrementDate = new Date(refDate.getFullYear(), refDate.getMonth() + increment);
					this.currentPeriod = {
						month: incrementDate.getMonth(),
						year: incrementDate.getFullYear()
					};
				},
				processUserInput(userText) {
					const userDate = this.parseDateString(userText, this.displayFormat || this.format);
					this.inputValue = userText;
					this.$emit('input', userDate ? this.formatDateToString(userDate, this.format) : userText);
				},
				open() {
					if (!this.opened) {
						this.opened = true;
						this.currentPeriod = this.getPeriodFromValue(this.value, this.format);
						this.addCloseEvents();
						this.setupPosition();
					}
					this.direction = undefined;
				},
				close() {
					if (this.opened) {
						this.opened = false;
						this.direction = undefined;
						this.removeCloseEvents();
						this.teardownPosition();
					}
					this.$emit('close');
				},
				closeViaOverlay(e) {
					if (this.hasInputElement && e.target === this.$refs.outerWrap) {
						this.close();
					}
				},
				addCloseEvents() {
					if (!this.closeEventListener) {
						this.closeEventListener = e => this.inspectCloseEvent(e);
						['click', 'keyup', 'focusin'].forEach(eventName => document.addEventListener(eventName, this.closeEventListener));
					}
				},
				inspectCloseEvent(event) {
					if (event.keyCode) {
						event.keyCode === 27 && this.close();
					} else if (!(event.target === this.$el) && !this.$el.contains(event.target)) {
						this.close();
					}
				},
				removeCloseEvents() {
					if (this.closeEventListener) {
						['click', 'keyup'].forEach(eventName => document.removeEventListener(eventName, this.closeEventListener));
						delete this.closeEventListener;
					}
				},
				setupPosition() {
					if (!this.positionEventListener) {
						this.positionEventListener = () => this.positionFloater();
						window.addEventListener('resize', this.positionEventListener);
					}
					this.positionFloater();
				},
				positionFloater() {
					const inputRect = this.$el.getBoundingClientRect();
					let verticalClass = 'vdpPositionTop';
					let horizontalClass = 'vdpPositionLeft';
					const calculate = () => {
						const rect = this.$refs.outerWrap.getBoundingClientRect();
						const floaterHeight = rect.height;
						const floaterWidth = rect.width;
						if (window.innerWidth > this.mobileBreakpointWidth) {
							// vertical
							if (inputRect.top + inputRect.height + floaterHeight > window.innerHeight && inputRect.top - floaterHeight > 0) {
								verticalClass = 'vdpPositionBottom';
							}

							// horizontal
							if (inputRect.left + floaterWidth > window.innerWidth) {
								horizontalClass = 'vdpPositionRight';
							}
							this.positionClass = ['vdpPositionReady', verticalClass, horizontalClass].join(' ');
						} else {
							this.positionClass = 'vdpPositionFixed';
						}
					};
					this.$refs.outerWrap ? calculate() : this.$nextTick(calculate);
				},
				teardownPosition() {
					if (this.positionEventListener) {
						this.positionClass = undefined;
						window.removeEventListener('resize', this.positionEventListener);
						delete this.positionEventListener;
					}
				},
				clear() {
					this.$emit('input', '');
				},
				selectDateItem(item) {
					if (!item.disabled) {
						const newDate = new Date(item.date);
						if (this.hasCurrentTime) {
							newDate.setHours(this.currentTime.hours);
							newDate.setMinutes(this.currentTime.minutes);
							newDate.setSeconds(this.currentTime.seconds);
						}
						this.$emit('input', this.formatDateToString(newDate, this.format));
						if (this.hasInputElement && !this.pickTime) {
							this.close();
						}
					}
				},
				inputTime(method, event) {
					const currentDate = this.valueDate || new Date();
					const maxValues = {
						setHours: 23,
						setMinutes: 59,
						setSeconds: 59
					};
					let numValue = parseInt(event.target.value, 10) || 0;
					if (numValue > maxValues[method]) {
						numValue = maxValues[method];
					} else if (numValue < 0) {
						numValue = 0;
					}
					event.target.value = paddNum(numValue, method === 'setHours' ? 1 : 2);
					currentDate[method](numValue);
					this.$emit('input', this.formatDateToString(currentDate, this.format), true);
				}
			},
			template: `
		<div class="vdpComponent" v-bind:class="{vdpWithInput: hasInputElement}">
				<input
						v-if="hasInputElement"
						type="text"
						v-bind="inputAttributes"
						v-bind:readonly="isReadOnly"
						v-bind:value="inputValue"
						v-on:input="editable && processUserInput($event.target.value)"
						v-on:focus="editable && open()"
						v-on:click="editable && open()"
				>
				<button
						v-if="editable && hasInputElement && inputValue"
						class="vdpClearInput"
						type="button"
						v-on:click="clear"
				></button>
						<div
								v-if="opened"
								class="vdpOuterWrap"
								ref="outerWrap"
								v-on:click="closeViaOverlay"
								v-bind:class="[positionClass, {vdpFloating: hasInputElement}]"
						>
								<div class="vdpInnerWrap">
										<header class="vdpHeader">
												<button
														class="vdpArrow vdpArrowPrev"
														v-bind:title="prevMonthCaption"
														type="button"
														v-on:click="incrementMonth(-1)"
												>{{ prevMonthCaption }}</button>
												<button
														class="vdpArrow vdpArrowNext"
														type="button"
														v-bind:title="nextMonthCaption"
														v-on:click="incrementMonth(1)"
												>{{ nextMonthCaption }}</button>
												<div class="vdpPeriodControls">
														<div class="vdpPeriodControl">
																<button v-bind:class="directionClass" v-bind:key="currentPeriod.month" type="button">
																		{{ months[currentPeriod.month] }}
																</button>
																<select v-model="currentPeriod.month">
																		<option v-for="(month, index) in months" v-bind:value="index" v-bind:key="month">
																				{{ month }}
																		</option>
																</select>
														</div>
														<div class="vdpPeriodControl">
																<button v-bind:class="directionClass" v-bind:key="currentPeriod.year" type="button">
																		{{ currentPeriod.year }}
																</button>
																<select v-model="currentPeriod.year">
																		<option v-for="year in yearRange" v-bind:value="year" v-bind:key="year">
																				{{ year }}
																		</option>
																</select>
														</div>
												</div>
										</header>
										<table class="vdpTable">
												<thead>
														<tr>
																<th class="vdpHeadCell" v-for="weekday in weekdaysSorted" v-bind:key="weekday">
																		<span class="vdpHeadCellContent">{{weekday}}</span>
																</th>
														</tr>
												</thead>
												<tbody
														v-bind:key="currentPeriod.year + '-' + currentPeriod.month"
														v-bind:class="directionClass"
												>
														<tr class="vdpRow" v-for="(week, weekIndex) in currentPeriodDates" v-bind:key="weekIndex">
																<td
																		class="vdpCell"
																		v-for="item in week"
																		v-bind:class="{
																				selectable: !item.disabled,
																				selected: item.selected,
																				disabled: item.disabled,
																				today: item.today,
																				outOfRange: item.outOfRange
																		}"
																		v-bind:data-id="item.dateKey"
																		v-bind:key="item.dateKey"
																		v-on:click="selectDateItem(item)"
																>
																		<div
																				class="vdpCellContent"
																		>{{ item.date.getDate() }}</div>
																</td>
														</tr>
												</tbody>
										</table>
										<div v-if="pickTime" class="vdpTimeControls">
												<span class="vdpTimeCaption">{{ setTimeCaption }}</span>
												<div class="vdpTimeUnit">
														<select class="vdpHoursInput"
																v-if="pickMinutes"
																v-on:input="inputTime('setHours', $event)"
																v-on:change="inputTime('setHours', $event)"
																v-bind:value="currentTime.hours"
														>
																<option
																		v-for="item in getHourList()"
																		:value="item.value"
																>{{ item.name }}</option>
														</select>
												</div>
												<span v-if="pickMinutes" class="vdpTimeSeparator">:</span>
												<div v-if="pickMinutes" class="vdpTimeUnit">
														<select class="vdpHoursInput"
																v-if="pickMinutes"
																v-on:input="inputTime('setMinutes', $event)"
																v-on:change="inputTime('setMinutes', $event)"
																v-bind:value="currentTime.minutesPadded"
														>
																<option
																		v-for="item in getMinuteList()"
																		:value="item.value"
																>{{ item.name }}</option>
														</select>
												</div>
												<span v-if="pickSeconds" class="vdpTimeSeparator">:</span>
												<div v-if="pickSeconds" class="vdpTimeUnit">
														<input
																v-if="pickSeconds"
																type="number" pattern="\\d*" class="vdpSecondsInput"
																v-on:input="inputTime('setSeconds', $event)"
																v-bind:value="currentTime.secondsPadded"
														>
												</div>
												<span class="vdpTimeCloseBtn" @click="$emit('close');">{{ closeButtonCaption }}</span>
										</div>
								</div>
						</div>
		</div>
		`
		};
		function paddNum(num, padsize) {
			return typeof num !== 'undefined' ? num.toString().length > padsize ? num : new Array(padsize - num.toString().length + 1).join('0') + num : undefined;
		}
		function chunkArray(inputArray, chunkSize) {
			const results = [];
			while (inputArray.length) {
				results.push(inputArray.splice(0, chunkSize));
			}
			return results;
		}
		function areSameDates(date1, date2) {
			return date1.getDate() === date2.getDate() && date1.getMonth() === date2.getMonth() && date1.getFullYear() === date2.getFullYear();
		}

		const KEY_SPACE = ' ';
		const FieldDateTime = {
			mixins: [MixinString, MixinDropDown],
			components: {
				'date-pick': VueDatePick,
				'field-string': FieldString
			},
			data: function () {
				return {
					format: null
				};
			},
			template: `
		<div>
			<field-string
				:field="field"
				:item="item"
				:itemIndex="itemIndex"
				:readonly="true"
				:buttonClear="field.messages.get('fieldListUnselect')"
				@input-click="toggleDropDown()"
				@input-key-down="onInputKeyDown"
				@input-blur="onInputBlur"
			></field-string>
			<field-item-dropdown 
				:marginTop="'-14px'" 
				:maxHeight="'none'" 
				:width="'auto'" 
				:visible="dropDownOpened"
				:title="field.label"
				:messages="field.messages"
				@close="closeDropDown()"
				@mousedown.native="onDropdownMousedown"
			>
				<date-pick 
					:value="item.value"
					:show="true"
					:hasInputElement="false"
					:pickTime="field.hasTime"
					:startWeekOnSunday="field.sundayFirstly"
					:format="field.dateFormat"
					:weekdays="getWeekdays()"
					:months="getMonths()"
					:setTimeCaption="field.messages.get('fieldDateTime')"
					:closeButtonCaption="field.messages.get('fieldDateClose')"
					:selectableYearRange="120"
					@input="setDate"
					@close="closeDropDown()"
				></date-pick>
			</field-item-dropdown>
		</div>
	`,
			methods: {
				onDropdownMousedown() {
					this.isInteractingWithDropdown = true;
				},
				onInputBlur() {
					if (this.isInteractingWithDropdown) {
						this.isInteractingWithDropdown = false;
						return;
					}
					this.closeDropDown();
				},
				onInputKeyDown(event) {
					if (event.key === 'Enter' || event.key === KEY_SPACE) {
						event.preventDefault();
						this.toggleDropDown();
					} else if ((event.key === 'Escape' || event.key === 'Esc') && this.dropDownOpened) {
						event.preventDefault();
						this.closeDropDown();
					}
				},
				setDate(value, stopClose) {
					this.value = value;
					if (!stopClose) {
						this.closeDropDown();
					}
				},
				getWeekdays() {
					let list = [];
					for (let n = 1; n <= 7; n++) {
						list.push(this.field.messages.get('fieldDateDay' + n));
					}
					return list;
				},
				getMonths() {
					let list = [];
					for (let n = 1; n <= 12; n++) {
						list.push(this.field.messages.get('fieldDateMonth' + n));
					}
					return list;
				}
			}
		};

		function _callSuper$f(t, o, e) { return o = babelHelpers.getPrototypeOf(o), babelHelpers.possibleConstructorReturn(t, _isNativeReflectConstruct$f() ? Reflect.construct(o, e || [], babelHelpers.getPrototypeOf(t).constructor) : o.apply(t, e)); }
		function _isNativeReflectConstruct$f() { try { var t = !Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); } catch (t) {} return (_isNativeReflectConstruct$f = function () { return !!t; })(); }
		let Controller$d = /*#__PURE__*/function (_BaseField$Controller) {
			function Controller(options) {
				var _this;
				babelHelpers.classCallCheck(this, Controller);
				_this = _callSuper$f(this, Controller, [options]);
				_this.dateFormat = options.format;
				_this.sundayFirstly = !!options.sundayFirstly;
				return _this;
			}
			babelHelpers.inherits(Controller, _BaseField$Controller);
			return babelHelpers.createClass(Controller, [{
				key: "isComponentDuplicable",
				get: function () {
					return true;
				}
			}, {
				key: "hasTime",
				get: function () {
					return true;
				}
			}, {
				key: "getOriginalType",
				value: function getOriginalType() {
					return 'string';
				}
			}, {
				key: "getInputType",
				value: function getInputType() {
					return 'string';
				}
			}, {
				key: "getInputName",
				value: function getInputName() {
					return null;
				}
			}, {
				key: "getInputAutocomplete",
				value: function getInputAutocomplete() {
					return null;
				}
			}], [{
				key: "type",
				value: function type() {
					return 'datetime';
				}
			}, {
				key: "component",
				value: function component() {
					return FieldDateTime;
				}
			}]);
		}(Controller$s);

		function _callSuper$e(t, o, e) { return o = babelHelpers.getPrototypeOf(o), babelHelpers.possibleConstructorReturn(t, _isNativeReflectConstruct$e() ? Reflect.construct(o, e || [], babelHelpers.getPrototypeOf(t).constructor) : o.apply(t, e)); }
		function _isNativeReflectConstruct$e() { try { var t = !Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); } catch (t) {} return (_isNativeReflectConstruct$e = function () { return !!t; })(); }
		let Controller$c = /*#__PURE__*/function (_DateTimeField$Contro) {
			function Controller() {
				babelHelpers.classCallCheck(this, Controller);
				return _callSuper$e(this, Controller, arguments);
			}
			babelHelpers.inherits(Controller, _DateTimeField$Contro);
			return babelHelpers.createClass(Controller, [{
				key: "hasTime",
				get: function () {
					return false;
				}
			}], [{
				key: "type",
				value: function type() {
					return 'date';
				}
			}]);
		}(Controller$d);

		const FieldAgreement = {
			mixins: [MixinField],
			template: `
		<div class="b24-form-control-container">
			<label>
				<input type="checkbox" 
					:id="fieldId"
					:aria-required="ariaRequired"
					:aria-invalid="ariaInvalid"
					:aria-describedby="ariaDescribedby"
					v-model="field.item().selected"
					@blur="$emit('input-blur', this)"
					@focus="$emit('input-focus', this)"
					@click.capture="requestConsent"
					onclick="this.blur()"
				>
				<span v-if="field.isLink()" class="b24-form-control-desc">{{ linkParts.before }}<a :href="linkUrl" target="_blank" rel="noopener noreferrer" class="b24-form-field-agreement-link">{{ linkParts.text }}</a>{{ linkParts.after }}</span>
				<span v-else class="b24-form-control-desc">
					<span class="b24-form-field-agreement-link">{{ field.label }}</span>
				</span>
				<span v-show="field.required" class="b24-form-control-required" aria-hidden="true">*</span>
			</label>
			<field-item-alert v-bind:field="field"></field-item-alert>
		</div>
	`,
			computed: {
				linkUrl() {
					let url = this.field.options.content.url.trim();
					if (!/^http:|^https:/.test(url)) {
						url = `https://${url}`;
					}
					return url;
				},
				linkParts() {
					const parts = String(this.field.label).split('%');
					return {
						before: parts[0] || '',
						text: parts.length > 1 ? parts[1] : '',
						after: parts.length > 2 ? parts.slice(2).join('%') : ''
					};
				}
			},
			methods: {
				requestConsent(e) {
					this.field.consentRequested = true;
					if (this.field.isLink()) {
						this.field.applyConsent();
						return true;
					}
					e ? e.preventDefault() : null;
					e ? e.stopPropagation() : null;
					this.$root.$emit('consent:request', this.field);
					return false;
				}
			}
		};

		function _callSuper$d(t, o, e) { return o = babelHelpers.getPrototypeOf(o), babelHelpers.possibleConstructorReturn(t, _isNativeReflectConstruct$d() ? Reflect.construct(o, e || [], babelHelpers.getPrototypeOf(t).constructor) : o.apply(t, e)); }
		function _isNativeReflectConstruct$d() { try { var t = !Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); } catch (t) {} return (_isNativeReflectConstruct$d = function () { return !!t; })(); }
		let Controller$b = /*#__PURE__*/function (_BaseField$Controller) {
			function Controller(options) {
				var _this;
				babelHelpers.classCallCheck(this, Controller);
				options.type = 'agreement';
				options.visible = true;
				options.multiple = false;
				options.items = null;
				options.values = null;
				_this = _callSuper$d(this, Controller, [options]);
				babelHelpers.defineProperty(_this, "consentRequested", false);
				return _this;
			}
			babelHelpers.inherits(Controller, _BaseField$Controller);
			return babelHelpers.createClass(Controller, [{
				key: "isLink",
				value: function isLink() {
					return !!this.options.content.url;
				}
			}, {
				key: "applyConsent",
				value: function applyConsent() {
					this.consentRequested = false;
					this.item().selected = true;
				}
			}, {
				key: "rejectConsent",
				value: function rejectConsent() {
					this.consentRequested = false;
					this.item().selected = false;
				}
			}, {
				key: "requestConsent",
				value: function requestConsent() {
					this.consentRequested = false;
					if (!this.required || this.valid()) {
						return true;
					}
					if (!this.isLink()) {
						this.consentRequested = true;
					}
					return false;
				}
			}], [{
				key: "type",
				value: function type() {
					return 'agreement';
				}
			}, {
				key: "component",
				value: function component() {
					return FieldAgreement;
				}
			}]);
		}(Controller$s);

		function _callSuper$c(t, o, e) { return o = babelHelpers.getPrototypeOf(o), babelHelpers.possibleConstructorReturn(t, _isNativeReflectConstruct$c() ? Reflect.construct(o, e || [], babelHelpers.getPrototypeOf(t).constructor) : o.apply(t, e)); }
		function _isNativeReflectConstruct$c() { try { var t = !Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); } catch (t) {} return (_isNativeReflectConstruct$c = function () { return !!t; })(); }
		let Controller$a = /*#__PURE__*/function (_StringField$Controll) {
			function Controller(options) {
				babelHelpers.classCallCheck(this, Controller);
				return _callSuper$c(this, Controller, [options]);
			}
			babelHelpers.inherits(Controller, _StringField$Controll);
			return babelHelpers.createClass(Controller, [{
				key: "getInputName",
				value: function getInputName() {
					return 'name';
				}
			}, {
				key: "getInputAutocomplete",
				value: function getInputAutocomplete() {
					return 'given-name';
				}
			}], [{
				key: "type",
				value: function type() {
					return 'name';
				}
			}]);
		}(Controller$r);

		function _callSuper$b(t, o, e) { return o = babelHelpers.getPrototypeOf(o), babelHelpers.possibleConstructorReturn(t, _isNativeReflectConstruct$b() ? Reflect.construct(o, e || [], babelHelpers.getPrototypeOf(t).constructor) : o.apply(t, e)); }
		function _isNativeReflectConstruct$b() { try { var t = !Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); } catch (t) {} return (_isNativeReflectConstruct$b = function () { return !!t; })(); }
		let Controller$9 = /*#__PURE__*/function (_StringField$Controll) {
			function Controller(options) {
				babelHelpers.classCallCheck(this, Controller);
				return _callSuper$b(this, Controller, [options]);
			}
			babelHelpers.inherits(Controller, _StringField$Controll);
			return babelHelpers.createClass(Controller, [{
				key: "getInputName",
				value: function getInputName() {
					return 'secondname';
				}
			}, {
				key: "getInputAutocomplete",
				value: function getInputAutocomplete() {
					return 'additional-name';
				}
			}], [{
				key: "type",
				value: function type() {
					return 'second-name';
				}
			}]);
		}(Controller$r);

		function _callSuper$a(t, o, e) { return o = babelHelpers.getPrototypeOf(o), babelHelpers.possibleConstructorReturn(t, _isNativeReflectConstruct$a() ? Reflect.construct(o, e || [], babelHelpers.getPrototypeOf(t).constructor) : o.apply(t, e)); }
		function _isNativeReflectConstruct$a() { try { var t = !Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); } catch (t) {} return (_isNativeReflectConstruct$a = function () { return !!t; })(); }
		let Controller$8 = /*#__PURE__*/function (_StringField$Controll) {
			function Controller(options) {
				babelHelpers.classCallCheck(this, Controller);
				return _callSuper$a(this, Controller, [options]);
			}
			babelHelpers.inherits(Controller, _StringField$Controll);
			return babelHelpers.createClass(Controller, [{
				key: "getInputName",
				value: function getInputName() {
					return 'lastname';
				}
			}, {
				key: "getInputAutocomplete",
				value: function getInputAutocomplete() {
					return 'family-name';
				}
			}], [{
				key: "type",
				value: function type() {
					return 'last-name';
				}
			}]);
		}(Controller$r);

		function _callSuper$9(t, o, e) { return o = babelHelpers.getPrototypeOf(o), babelHelpers.possibleConstructorReturn(t, _isNativeReflectConstruct$9() ? Reflect.construct(o, e || [], babelHelpers.getPrototypeOf(t).constructor) : o.apply(t, e)); }
		function _isNativeReflectConstruct$9() { try { var t = !Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); } catch (t) {} return (_isNativeReflectConstruct$9 = function () { return !!t; })(); }
		let Controller$7 = /*#__PURE__*/function (_StringField$Controll) {
			function Controller(options) {
				babelHelpers.classCallCheck(this, Controller);
				return _callSuper$9(this, Controller, [options]);
			}
			babelHelpers.inherits(Controller, _StringField$Controll);
			return babelHelpers.createClass(Controller, null, [{
				key: "type",
				value: function type() {
					return 'company-name';
				}
			}]);
		}(Controller$r);

		const FieldLayout = {
			props: ['field'],
			template: `
		<hr v-if="field.content.type=='hr'" class="b24-form-field-layout-hr">
		<div v-else-if="field.content.type=='br'" class="b24-form-field-layout-br"></div>
		<div v-else-if="field.content.type=='section'" class="b24-form-field-layout-section">
			{{ field.label }}
		</div>
		<div v-else-if="field.content.html" v-html="field.content.html"></div>
	`
		};

		function _callSuper$8(t, o, e) { return o = babelHelpers.getPrototypeOf(o), babelHelpers.possibleConstructorReturn(t, _isNativeReflectConstruct$8() ? Reflect.construct(o, e || [], babelHelpers.getPrototypeOf(t).constructor) : o.apply(t, e)); }
		function _isNativeReflectConstruct$8() { try { var t = !Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); } catch (t) {} return (_isNativeReflectConstruct$8 = function () { return !!t; })(); }
		let Controller$6 = /*#__PURE__*/function (_BaseField$Controller) {
			function Controller(options) {
				var _this;
				babelHelpers.classCallCheck(this, Controller);
				_this = _callSuper$8(this, Controller, [options]);
				babelHelpers.defineProperty(_this, "content", {
					type: '',
					html: ''
				});
				_this.multiple = false;
				_this.required = false;
				if (typeof options.content === 'object') {
					if (options.content.type) {
						_this.content.type = options.content.type;
					}
					if (options.content.html) {
						_this.content.html = options.content.html;
					}
				}
				return _this;
			}
			babelHelpers.inherits(Controller, _BaseField$Controller);
			return babelHelpers.createClass(Controller, null, [{
				key: "type",
				value: function type() {
					return 'layout';
				}
			}, {
				key: "component",
				value: function component() {
					return FieldLayout;
				}
			}]);
		}(Controller$s);

		let loadAppPromise = null;
		let isValidatorAdded = false;
		const FieldResourceBooking = {
			props: ['field'],
			template: `
		<div :key="field.randomId"></div>
	`,
			data: function () {
				return {
					randomId: Math.random()
				};
			},
			mounted() {
				this.load();
			},
			watch: {
				field(field) {
					if (field.randomId !== this.randomId) {
						this.randomId = field.randomId;
						this.load();
					}
				}
			},
			methods: {
				load() {
					const loadField = () => {
						if (!window.BX || !window.BX.Calendar || !window.BX.Calendar.Resourcebooking) {
							return;
						}
						this.liveFieldController = BX.Calendar.Resourcebooking.getLiveField({
							wrap: this.$el,
							field: this.field.booking,
							actionAgent: (action, options) => {
								let formData = new FormData();
								const data = options.data || {};
								for (let key in data) {
									if (!data.hasOwnProperty(key)) {
										continue;
									}
									let value = data[key];
									if (typeof value === 'object') {
										value = JSON.stringify(value);
									}
									formData.set(key, value);
								}
								return window.b24form.App.post(this.$root.form.identification.address + '/bitrix/services/main/ajax.php?action=' + action, formData).then(response => {
									return response.json();
								});
							}
						});
						if (this.liveFieldController && typeof this.liveFieldController.check === 'function' && !isValidatorAdded) {
							this.field.validators.push(() => this.liveFieldController.check());
							isValidatorAdded = true;
						}
						this.liveFieldController.subscribe('change', event => {
							this.field.items = [];
							(event.data || []).filter(value => !!value).forEach(value => {
								this.field.addItem({
									value,
									selected: true
								});
							});
						});
					};
					let scriptLink = b24form.common.properties && b24form.common.properties.resourcebooking ? b24form.common.properties.resourcebooking.link : null;
					if (!loadAppPromise) {
						loadAppPromise = new Promise((resolve, reject) => {
							const node = document.createElement('script');
							node.src = scriptLink + '?' + (Date.now() / 60000 | 0);
							node.onload = resolve;
							node.onerror = reject;
							document.head.appendChild(node);
						});
					}
					loadAppPromise.then(loadField)
					/*.catch((e) => {
						this.message = 'App load failed:' + e;
					})*/;
				}
			}
		};

		function _callSuper$7(t, o, e) { return o = babelHelpers.getPrototypeOf(o), babelHelpers.possibleConstructorReturn(t, _isNativeReflectConstruct$7() ? Reflect.construct(o, e || [], babelHelpers.getPrototypeOf(t).constructor) : o.apply(t, e)); }
		function _isNativeReflectConstruct$7() { try { var t = !Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); } catch (t) {} return (_isNativeReflectConstruct$7 = function () { return !!t; })(); }
		let Controller$5 = /*#__PURE__*/function (_BaseField$Controller) {
			function Controller(options) {
				var _this;
				babelHelpers.classCallCheck(this, Controller);
				_this = _callSuper$7(this, Controller, [options]);
				_this.booking = options.booking;
				_this.multiple = true;
				_this.randomId = Math.random();
				return _this;
			}
			babelHelpers.inherits(Controller, _BaseField$Controller);
			return babelHelpers.createClass(Controller, null, [{
				key: "type",
				value: function type() {
					return 'resourcebooking';
				}
			}, {
				key: "component",
				value: function component() {
					return FieldResourceBooking;
				}
			}]);
		}(Controller$s);

		// @vue/component
		const BookingField = {
			name: 'BookingField',
			props: {
				field: {
					type: Object,
					required: true
				}
			},
			data() {
				return {
					component: null,
					dependencies: null
				};
			},
			async mounted() {
				const scriptLink = b24form.common?.properties?.booking?.link;
				if (!scriptLink) {
					return;
				}
				const formLanguage = this.$root?.form?.language;
				if (formLanguage) {
					b24form.common.language = formLanguage;
				}
				await new Promise(resolve => {
					const node = document.createElement('script');
					node.src = `${scriptLink}?${Math.trunc(Date.now() / 60000)}`;
					node.onload = resolve;
					document.head.append(node);
				});
				this.component = BX.Booking.CrmForms.Field;
				this.dependencies = {
					mixinDropdown: MixinDropDown,
					mixinField: MixinField,
					componentFieldProduct: {
						FieldProduct,
						Item: Item$1
					}
				};
			},
			methods: {
				onChange(value) {
					const selected = true;
					this.field.items = [];
					if (value) {
						this.field.addItem({
							value,
							selected
						});
					}
				},
				async runAction(action, options) {
					const formData = this.createFormData(options?.data ?? {});
					const identification = this.$root.form.identification;
					formData.set('formId', identification.id);
					formData.set('sec', identification.sec);
					const host = identification.address;
					const url = `${host}/bitrix/services/main/ajax.php?action=${action}`;
					const response = await window.b24form.App.post(url, formData);
					return response.json();
				},
				createFormData(data) {
					if (data instanceof FormData) {
						return data;
					}
					const formData = new FormData();
					Object.keys(data).forEach(key => {
						const value = data[key];
						if (Array.isArray(value)) {
							value.forEach(it => formData.append(`${key}[]`, it));
						} else {
							formData.set(key, JSON.stringify(value));
						}
					});
					return formData;
				}
			},
			template: `
		<div>
			<component
				v-if="component"
				v-bind="{ field, runAction, dependencies }"
				:is="component"
				@change="onChange"
			/>
		</div>
	`
		};

		function _callSuper$6(t, o, e) { return o = babelHelpers.getPrototypeOf(o), babelHelpers.possibleConstructorReturn(t, _isNativeReflectConstruct$6() ? Reflect.construct(o, e || [], babelHelpers.getPrototypeOf(t).constructor) : o.apply(t, e)); }
		function _isNativeReflectConstruct$6() { try { var t = !Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); } catch (t) {} return (_isNativeReflectConstruct$6 = function () { return !!t; })(); }
		let Controller$4 = /*#__PURE__*/function (_BaseField$Controller) {
			function Controller() {
				babelHelpers.classCallCheck(this, Controller);
				return _callSuper$6(this, Controller, arguments);
			}
			babelHelpers.inherits(Controller, _BaseField$Controller);
			return babelHelpers.createClass(Controller, null, [{
				key: "type",
				value: function type() {
					return 'booking';
				}
			}, {
				key: "component",
				value: function component() {
					return BookingField;
				}
			}]);
		}(Controller$s);

		function _callSuper$5(t, o, e) { return o = babelHelpers.getPrototypeOf(o), babelHelpers.possibleConstructorReturn(t, _isNativeReflectConstruct$5() ? Reflect.construct(o, e || [], babelHelpers.getPrototypeOf(t).constructor) : o.apply(t, e)); }
		function _isNativeReflectConstruct$5() { try { var t = !Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); } catch (t) {} return (_isNativeReflectConstruct$5 = function () { return !!t; })(); }
		let Item = /*#__PURE__*/function (_BaseItem) {
			function Item(options) {
				var _this;
				babelHelpers.classCallCheck(this, Item);
				_this = _callSuper$5(this, Item, [options]);
				_this.value = {};
				_this.selected = false;
				return _this;
			}
			babelHelpers.inherits(Item, _BaseItem);
			return babelHelpers.createClass(Item);
		}(Item$3);

		const FieldsContainer = {
			name: 'field-container',
			// for recurrence
			mixins: [MixinField],
			components: {
				Field
			},
			template: `
		<transition-group name="b24-form-field-a-slide" tag="div"
			v-if="field.nestedFields.length > 0"		
		>
			<Field
				v-for="nestedField in field.nestedFields"
				:field="nestedField"
				:key="field.name + '-' + nestedField.name"
				@input-blur=""
				@input-focus=""
				@input-key-down=""
			/>
		</transition-group>
	`
		};

		function _callSuper$4(t, o, e) { return o = babelHelpers.getPrototypeOf(o), babelHelpers.possibleConstructorReturn(t, _isNativeReflectConstruct$4() ? Reflect.construct(o, e || [], babelHelpers.getPrototypeOf(t).constructor) : o.apply(t, e)); }
		function _isNativeReflectConstruct$4() { try { var t = !Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); } catch (t) {} return (_isNativeReflectConstruct$4 = function () { return !!t; })(); }
		function _superPropGet(t, o, e, r) { var p = babelHelpers.get(babelHelpers.getPrototypeOf(t.prototype ), o, e); return "function" == typeof p ? function (t) { return p.apply(e, t); } : p; }
		let Controller$3 = /*#__PURE__*/function (_BaseField$Controller) {
			function Controller(options) {
				var _this;
				babelHelpers.classCallCheck(this, Controller);
				_this = _callSuper$4(this, Controller, [options]);
				//this.nestedFields = [];
				babelHelpers.defineProperty(_this, "nestedFields", []);
				return _this;
			}
			babelHelpers.inherits(Controller, _BaseField$Controller);
			return babelHelpers.createClass(Controller, [{
				key: "adjust",
				value: function adjust(options, autocomplete = true) {
					_superPropGet(Controller, "adjust", this)([options]);
					setTimeout(() => {
						this.actualizeFields();
						this.actualizeValues();
					}, 0);
				}
			}, {
				key: "setValues",
				value: function setValues(values) {
					values = values[0] || {};
					this.nestedFields.forEach(field => {
						const value = values[field.name];
						if (typeof value === 'undefined') {
							return;
						}
						field.setValues(Array.isArray(value) ? value : [value]);
					});
				}
			}, {
				key: "actualizeFields",
				value: function actualizeFields() {
					this.nestedFields = this.makeFields(this.options.fields || []);
				}
			}, {
				key: "makeFields",
				value: function makeFields(list = []) {
					return list.map(options => {
						options.messages = this.options.messages;
						options.design = this.options.design;
						options.format = this.options.format;
						options.sundayFirstly = this.options.sundayFirstly;
						const field = new Factory.create(Object.assign({
							visible: true,
							id: this.id + '-' + options.name
						}, options));
						field.subscribe(field.events.changeSelected, () => this.actualizeValues());
						return field;
					});
				}
			}, {
				key: "valid",
				value: function valid() {
					if (!this.visible) {
						return true;
					}
					this.validated = true;
					let valid = true;
					this.nestedFields.forEach(field => {
						if (!field.valid()) {
							valid = false;
						}
					});
					return valid;
				}
			}, {
				key: "actualizeValues",
				value: function actualizeValues() {
					const value = (this.nestedFields || []).reduce((acc, field) => {
						const key = field.name || '';
						const val = field.value();
						if (key.length > 0) {
							acc[key] = val;
						}
						return acc;
					}, {});
					const item = this.item();
					item.value = value;
					item.selected = true;
					console.log('value', value);
				}
			}], [{
				key: "type",
				value: function type() {
					return 'container';
				}
			}, {
				key: "component",
				value: function component() {
					return FieldsContainer;
				}
			}, {
				key: "createItem",
				value: function createItem(options) {
					return new Item(options);
				}
			}]);
		}(Controller$s);

		function _callSuper$3(t, o, e) { return o = babelHelpers.getPrototypeOf(o), babelHelpers.possibleConstructorReturn(t, _isNativeReflectConstruct$3() ? Reflect.construct(o, e || [], babelHelpers.getPrototypeOf(t).constructor) : o.apply(t, e)); }
		function _isNativeReflectConstruct$3() { try { var t = !Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); } catch (t) {} return (_isNativeReflectConstruct$3 = function () { return !!t; })(); }
		let Controller$2 = /*#__PURE__*/function (_ContainerController) {
			function Controller() {
				babelHelpers.classCallCheck(this, Controller);
				return _callSuper$3(this, Controller, arguments);
			}
			babelHelpers.inherits(Controller, _ContainerController);
			return babelHelpers.createClass(Controller, [{
				key: "actualizeFields11",
				value: function actualizeFields11() {
					//this.nestedFields = [].concat([this.searchField], this.makeFields(fields));
				}
			}], [{
				key: "type",
				value: function type() {
					return 'address';
				}
			}]);
		}(Controller$3);

		function _callSuper$2(t, o, e) { return o = babelHelpers.getPrototypeOf(o), babelHelpers.possibleConstructorReturn(t, _isNativeReflectConstruct$2() ? Reflect.construct(o, e || [], babelHelpers.getPrototypeOf(t).constructor) : o.apply(t, e)); }
		function _isNativeReflectConstruct$2() { try { var t = !Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); } catch (t) {} return (_isNativeReflectConstruct$2 = function () { return !!t; })(); }
		let Controller$1 = /*#__PURE__*/function (_ContainerController) {
			function Controller() {
				babelHelpers.classCallCheck(this, Controller);
				return _callSuper$2(this, Controller, arguments);
			}
			babelHelpers.inherits(Controller, _ContainerController);
			return babelHelpers.createClass(Controller, [{
				key: "actualizeFields",
				value: function actualizeFields() {
					if (!this.presetField) {
						this.options.requisite = this.options.requisite || {};
						this.options.requisite.presets = (this.options.requisite.presets || []).filter(preset => !preset.disabled);
						this.presetField = new Factory.create({
							type: 'radio',
							name: 'presetId',
							label: this.label,
							items: this.options.requisite.presets.map(preset => {
								return {
									value: preset.id,
									label: preset.label
								};
							}),
							visible: true
						});
						this.presetField.subscribe(this.presetField.events.changeSelected, () => {
							this.actualizeFields();
							this.actualizeValues();
						});
					}
					const v = this.presetField.value();
					const presets = this.options.requisite.presets;
					const preset = presets.filter(preset => preset.id === v)[0] || {};
					const fields = [];
					(preset.fields || []).filter(options => !options.disabled).forEach(options => {
						options = JSON.parse(JSON.stringify(options));
						if (options.fields && options.fields.length > 0) {
							if (['address', 'account'].includes(options.type)) {
								fields.push({
									type: 'layout',
									label: options.label,
									content: {
										type: 'section'
									}
								});
							}
							options.type = 'container';
						}
						fields.push(options);
					});
					this.nestedFields = [].concat([this.presetField], this.makeFields(fields));
				}
			}], [{
				key: "type",
				value: function type() {
					return 'rq';
				}
			}]);
		}(Controller$3);

		const controllers = [Controller$r, Controller$p, Controller$q, Controller$o, Controller$n, Controller$m, Controller$l, Controller$k, Controller$j, Controller$h, Controller$i, Controller$f, Controller$g, Controller$e, Controller$d, Controller$c, Controller$b, Controller$a, Controller$9, Controller$8, Controller$7, Controller$6, Controller$5, Controller$4, Controller$3, Controller$2, Controller$1];
		const component = Controller$s.component();
		component.components = {
			...component.components,
			...controllers.reduce((acc, controller) => ({
				...acc,
				[`field-${controller.type()}`]: controller.component()
			}), {})
		};
		let Factory = /*#__PURE__*/function () {
			function Factory() {
				babelHelpers.classCallCheck(this, Factory);
			}
			return babelHelpers.createClass(Factory, null, [{
				key: "create",
				value: function create(options) {
					const Controller = controllers.find(it => options.type === it.type());
					if (!Controller) {
						throw new Error(`Unknown field type '${options.type}'`);
					}
					return new Controller(options);
				}
			}, {
				key: "getControllers",
				value: function getControllers() {
					return controllers;
				}
			}, {
				key: "getComponent",
				value: function getComponent() {
					return component;
				}
			}]);
		}();

		const EventTypes = {
			initBefore: 'init:before',
			init: 'init',
			show: 'show',
			showFirst: 'show:first',
			hide: 'hide',
			submit: 'submit',
			sendSuccess: 'send:success',
			sendError: 'send:error',
			destroy: 'destroy',
			fieldFocus: 'field:focus',
			fieldBlur: 'field:blur',
			fieldChangeSelected: 'field:change:selected',
			view: 'view'
		};
		const ViewTypes = ['inline', 'popup', 'panel', 'widget'];
		const ViewPositions = ['left', 'center', 'right'];
		const ViewVerticals = ['top', 'bottom'];

		let Navigation = /*#__PURE__*/function () {
			function Navigation() {
				babelHelpers.classCallCheck(this, Navigation);
				babelHelpers.defineProperty(this, "index", 1);
				babelHelpers.defineProperty(this, "pages", []);
			}
			return babelHelpers.createClass(Navigation, [{
				key: "add",
				value: function add(page) {
					this.pages.push(page);
				}
			}, {
				key: "next",
				value: function next() {
					if (this.current().validate()) {
						this.index += this.index >= this.count() ? 0 : 1;
					}
				}
			}, {
				key: "prev",
				value: function prev() {
					this.index -= this.index > 1 ? 1 : 0;
				}
			}, {
				key: "first",
				value: function first() {
					this.index = 1;
				}
			}, {
				key: "last",
				value: function last(validate = true) {
					if (!validate || this.current().validate()) {
						this.index = this.count();
					}
				}
			}, {
				key: "current",
				value: function current() {
					return this.pages[this.index - 1];
				}
			}, {
				key: "iterable",
				value: function iterable() {
					return this.count() > 1;
				}
			}, {
				key: "ended",
				value: function ended() {
					return this.index >= this.count();
				}
			}, {
				key: "beginning",
				value: function beginning() {
					return this.index === 1;
				}
			}, {
				key: "count",
				value: function count() {
					return this.pages.length;
				}
			}, {
				key: "removeEmpty",
				value: function removeEmpty() {
					if (this.count() <= 1) {
						return;
					}
					this.pages = this.pages.filter(page => {
						return page.fields.length > 0;
					});
				}
			}, {
				key: "validate",
				value: function validate() {
					return this.pages.filter(page => !page.validate()).length === 0;
				}
			}]);
		}();
		let Page = /*#__PURE__*/function () {
			function Page(title) {
				babelHelpers.classCallCheck(this, Page);
				babelHelpers.defineProperty(this, "fields", []);
				this.title = title;
			}
			return babelHelpers.createClass(Page, [{
				key: "addField",
				value: function addField(field) {
					this.fields.push(field);
				}
			}, {
				key: "getTitle",
				value: function getTitle() {
					return this.title;
				}
			}, {
				key: "validate",
				value: function validate() {
					return this.fields.filter(field => !field.valid()).length === 0;
				}
			}]);
		}();

		function _classPrivateFieldInitSpec$9(e, t, a) { _checkPrivateRedeclaration$9(e, t), t.set(e, a); }
		function _checkPrivateRedeclaration$9(e, t) { if (t.has(e)) throw new TypeError("Cannot initialize the same private elements twice on an object"); }
		function _classPrivateFieldGet$9(s, a) { return s.get(_assertClassBrand$9(s, a)); }
		function _classPrivateFieldSet$9(s, a, r) { return s.set(_assertClassBrand$9(s, a), r), r; }
		function _assertClassBrand$9(e, t, n) { if ("function" == typeof e ? e === t : e.has(t)) return arguments.length < 3 ? t : n; throw new TypeError("Private element is not present on this object"); }
		const ConditionEvents = {
			change: 'change'
		};
		const Operations = {
			equal: '=',
			notEqual: '!=',
			greater: '>',
			greaterOrEqual: '>=',
			less: '<',
			lessOrEqual: '<=',
			empty: 'empty',
			any: 'any',
			contain: 'contain',
			notContain: '!contain'
		};
		const OperationAliases = {
			notEqual: '<>'
		};
		const ActionTypes = {
			show: 'show',
			hide: 'hide',
			change: 'change'
		};
		const OppositeActionTypes = {
			[ActionTypes.hide]: ActionTypes.show,
			[ActionTypes.show]: ActionTypes.hide
		};
		var _form$2 = /*#__PURE__*/new WeakMap();
		var _list = /*#__PURE__*/new WeakMap();
		var _groups = /*#__PURE__*/new WeakMap();
		let Manager = /*#__PURE__*/function () {
			function Manager(form) {
				babelHelpers.classCallCheck(this, Manager);
				_classPrivateFieldInitSpec$9(this, _form$2, void 0);
				_classPrivateFieldInitSpec$9(this, _list, []);
				_classPrivateFieldInitSpec$9(this, _groups, []);
				_classPrivateFieldSet$9(_form$2, this, form);
				_classPrivateFieldGet$9(_form$2, this).subscribeAll(this.onFormEvent.bind(this));
			}
			return babelHelpers.createClass(Manager, [{
				key: "onFormEvent",
				value: function onFormEvent(data, obj, type) {
					if (_classPrivateFieldGet$9(_list, this).length === 0) {
						return;
					}
					let event;
					switch (type) {
						case EventTypes.fieldChangeSelected:
							event = ConditionEvents.change;
							break;
						case EventTypes.fieldBlur:
						default:
							return;
					}
					this.trigger(data.field, event);
				}
			}, {
				key: "setDependencies",
				value: function setDependencies(depGroups = []) {
					_classPrivateFieldSet$9(_list, this, []);
					_classPrivateFieldSet$9(_groups, this, depGroups.filter(depGroup => {
						return Array.isArray(depGroup.list) && depGroup.list.length > 0;
					}).map(depGroup => {
						const group = {
							logic: depGroup.logic || 'or',
							list: [],
							typeId: depGroup.typeId || 0
						};
						depGroup.list.forEach(dep => this.addDependence(dep, group));
						return group;
					}).filter(group => group.list.length > 0));
					_classPrivateFieldGet$9(_form$2, this).getFields().forEach(field => this.trigger(field, ConditionEvents.change));
				}
			}, {
				key: "addDependence",
				value: function addDependence(dep, group) {
					if (typeof dep !== 'object' || typeof dep.condition !== 'object' || typeof dep.action !== 'object') {
						return;
					}
					if (!dep.condition.target || !dep.condition.event || !ConditionEvents[dep.condition.event]) {
						return;
					}
					if (!dep.action.target || !dep.action.type || !ActionTypes[dep.action.type]) {
						return;
					}
					dep.condition.operation = ConditionOperations.indexOf(dep.condition.operation) > 0 ? dep.condition.operation : Operations.equal;
					const item = {
						condition: {
							target: '',
							event: '',
							value: '',
							operation: '',
							...dep.condition
						},
						action: {
							target: '',
							type: '',
							value: '',
							...dep.action
						}
					};
					_classPrivateFieldGet$9(_list, this).push(item);
					if (group) {
						group.list.push(item);
						item.group = group;
					}
					return item;
				}
			}, {
				key: "trigger",
				value: function trigger(field, event) {
					_classPrivateFieldGet$9(_list, this).filter(dep => {
						// 1. check event
						if (dep.condition.event !== event) {
							return false;
						}

						// 2. check target
						if (dep.condition.target !== field.name) {
							return false;
						}

						// 3. check group

						return true;
					}).forEach(dep => {
						let list;
						let logicAnd = true;
						if (dep.group && dep.group.typeId > 0) {
							logicAnd = dep.group.logic === 'and';
							list = dep.group.list.map(dep => {
								let field = _classPrivateFieldGet$9(_form$2, this).getFields().filter(field => dep.condition.target === field.name)[0];
								return {
									dep,
									field
								};
							});
						} else {
							list = [{
								dep,
								field
							}];
						}

						// 3.check value&operation
						const checkFunction = item => {
							const dep = item.dep;
							const field = item.field;
							const values = field.getComparableValues();
							if (values.length === 0) {
								values.push('');
							}
							return values.filter(value => this.compare(value, dep.condition.value, dep.condition.operation)).length === 0;
						};
						const isOpposite = logicAnd ? list.some(checkFunction) : list.every(checkFunction);

						// 4. run action
						this.getFieldsByTarget(dep.action.target).forEach(field => {
							let actionType = dep.action.type;
							if (isOpposite) {
								actionType = OppositeActionTypes[dep.action.type];
								if (!actionType) {
									return;
								}
							}
							this.runAction({
								...dep.action,
								type: actionType
							}, field);
						});
					});
				}
			}, {
				key: "getFieldsByTarget",
				value: function getFieldsByTarget(target) {
					const fields = [];
					_classPrivateFieldGet$9(_form$2, this).pager.pages.forEach(page => {
						let currentSectionEquals = false;
						page.fields.forEach(field => {
							const equals = target === field.name;
							if (field.type === 'layout' && field.content.type === 'section') {
								if (equals) {
									currentSectionEquals = true;
								} else {
									currentSectionEquals = false;
									return;
								}
							} else if (!equals && !currentSectionEquals) {
								return;
							}
							fields.push(field);
						});
					});
					return fields;
				}
			}, {
				key: "runAction",
				value: function runAction(action, field) {
					switch (action.type) {
						case ActionTypes.change:
							//field.visible = true;
							return;
						case ActionTypes.show:
							field.visible = true;
							return;
						case ActionTypes.hide:
							field.visible = false;
							return;
					}
				}
			}, {
				key: "compare",
				value: function compare(a, b, operation) {
					a = a === null ? '' : a;
					b = b === null ? '' : b;
					switch (operation) {
						case Operations.greater:
							return parseFloat(a) > parseFloat(b);
						case Operations.greaterOrEqual:
							return parseFloat(a) >= parseFloat(b);
						case Operations.less:
							return parseFloat(a) < parseFloat(b);
						case Operations.lessOrEqual:
							return parseFloat(a) <= parseFloat(b);
						case Operations.empty:
							return !a;
						case Operations.any:
							return !!a;
						case Operations.contain:
							return a.indexOf(b) >= 0;
						case Operations.notContain:
							return a.indexOf(b) < 0;
						case Operations.notEqual:
							return a !== b;
						case Operations.equal:
						default:
							return a === b;
					}
				}
			}]);
		}();
		const ConditionOperations = [];
		for (let operationName in Operations) {
			ConditionOperations.push(Operations[operationName]);
		}
		for (let operationName in OperationAliases) {
			ConditionOperations.push(Operations[operationName]);
		}

		function _classPrivateFieldInitSpec$8(e, t, a) { _checkPrivateRedeclaration$8(e, t), t.set(e, a); }
		function _checkPrivateRedeclaration$8(e, t) { if (t.has(e)) throw new TypeError("Cannot initialize the same private elements twice on an object"); }
		function _classPrivateFieldGet$8(s, a) { return s.get(_assertClassBrand$8(s, a)); }
		function _classPrivateFieldSet$8(s, a, r) { return s.set(_assertClassBrand$8(s, a), r), r; }
		function _assertClassBrand$8(e, t, n) { if ("function" == typeof e ? e === t : e.has(t)) return arguments.length < 3 ? t : n; throw new TypeError("Private element is not present on this object"); }
		var _form$1 = /*#__PURE__*/new WeakMap();
		var _isStartSent = /*#__PURE__*/new WeakMap();
		var _filledFields = /*#__PURE__*/new WeakMap();
		let Analytics = /*#__PURE__*/function () {
			function Analytics(form) {
				babelHelpers.classCallCheck(this, Analytics);
				_classPrivateFieldInitSpec$8(this, _form$1, void 0);
				_classPrivateFieldInitSpec$8(this, _isStartSent, false);
				_classPrivateFieldInitSpec$8(this, _filledFields, []);
				_classPrivateFieldSet$8(_form$1, this, form);
				_classPrivateFieldGet$8(_form$1, this).subscribeAll(this.onFormEvent.bind(this));
			}
			return babelHelpers.createClass(Analytics, [{
				key: "onFormEvent",
				value: function onFormEvent(data, obj, type) {
					if (_classPrivateFieldGet$8(_form$1, this).disabled) {
						return;
					}
					if (_classPrivateFieldGet$8(_form$1, this).editMode) {
						return; // don't handle analytics in form editor mode
					}
					switch (type) {
						case EventTypes.showFirst:
							this.send('view');
							break;
						case EventTypes.view:
							// form
							_classPrivateFieldGet$8(_form$1, this).analyticsHandler('view', _classPrivateFieldGet$8(_form$1, this).identification.id);
							break;
						case EventTypes.fieldFocus:
							if (!_classPrivateFieldGet$8(_isStartSent, this)) {
								_classPrivateFieldSet$8(_isStartSent, this, true);
								this.send('start');
								_classPrivateFieldGet$8(_form$1, this).analyticsHandler('start', _classPrivateFieldGet$8(_form$1, this).identification.id);
							}
							break;
						case EventTypes.fieldBlur:
							const field = data.field;
							if (_classPrivateFieldGet$8(_filledFields, this).indexOf(field.name) < 0 && field.hasValidValue()) {
								_classPrivateFieldGet$8(_filledFields, this).push(field.name);
								this.send('field', [{
									from: '%name%',
									to: field.label
								}, {
									from: '%code%',
									to: field.name
								}]);
							}
							break;
						case EventTypes.sendSuccess:
							this.send('end');
							break;
					}
				}
			}, {
				key: "send",
				value: function send(type, replace = []) {
					if (!b24form.common || !type) {
						return;
					}

					/**	@var Object[Type.Analytics] opt */
					const opt = b24form.common.properties.analytics;
					if (!opt || !opt[type]) {
						return;
					}
					let action = opt[type].name;
					let page = opt[type].code;
					replace.forEach(item => {
						action = action.replace(item.from, item.to);
						page = page.replace(item.from, item.to);
					});

					//////////// google
					let gaEventCategory = opt.category.replace('%name%', _classPrivateFieldGet$8(_form$1, this).title).replace('%form_id%', _classPrivateFieldGet$8(_form$1, this).identification.id);
					let gaEventAction = opt.template.name.replace('%name%', action).replace('%form_id%', _classPrivateFieldGet$8(_form$1, this).identification.id);
					b24form.util.analytics.trackGa('event', gaEventCategory, gaEventAction);
					if (page) {
						const gaPageName = opt.template.code.replace('%code%', page).replace('%form_id%', _classPrivateFieldGet$8(_form$1, this).identification.id);
						b24form.util.analytics.trackGa('pageview', gaPageName);
					}

					//////////// yandex
					const yaEventName = opt.eventTemplate.code.replace('%code%', page).replace('%form_id%', _classPrivateFieldGet$8(_form$1, this).identification.id);
					b24form.util.analytics.trackYa(yaEventName);
				}
			}]);
		}();

		function _classPrivateFieldInitSpec$7(e, t, a) { _checkPrivateRedeclaration$7(e, t), t.set(e, a); }
		function _checkPrivateRedeclaration$7(e, t) { if (t.has(e)) throw new TypeError("Cannot initialize the same private elements twice on an object"); }
		function _classPrivateFieldGet$7(s, a) { return s.get(_assertClassBrand$7(s, a)); }
		function _classPrivateFieldSet$7(s, a, r) { return s.set(_assertClassBrand$7(s, a), r), r; }
		function _assertClassBrand$7(e, t, n) { if ("function" == typeof e ? e === t : e.has(t)) return arguments.length < 3 ? t : n; throw new TypeError("Private element is not present on this object"); }
		var _key$1 = /*#__PURE__*/new WeakMap();
		var _use$1 = /*#__PURE__*/new WeakMap();
		var _widgetId$1 = /*#__PURE__*/new WeakMap();
		var _response$1 = /*#__PURE__*/new WeakMap();
		var _target$1 = /*#__PURE__*/new WeakMap();
		var _callback$1 = /*#__PURE__*/new WeakMap();
		let ReCaptcha$1 = /*#__PURE__*/function () {
			function ReCaptcha() {
				babelHelpers.classCallCheck(this, ReCaptcha);
				_classPrivateFieldInitSpec$7(this, _key$1, void 0);
				_classPrivateFieldInitSpec$7(this, _use$1, false);
				_classPrivateFieldInitSpec$7(this, _widgetId$1, void 0);
				_classPrivateFieldInitSpec$7(this, _response$1, void 0);
				_classPrivateFieldInitSpec$7(this, _target$1, void 0);
				_classPrivateFieldInitSpec$7(this, _callback$1, void 0);
			}
			return babelHelpers.createClass(ReCaptcha, [{
				key: "adjust",
				value: function adjust(options) {
					if (typeof options.key !== 'undefined') {
						_classPrivateFieldSet$7(_key$1, this, options.key);
					}
					if (typeof options.use !== 'undefined') {
						_classPrivateFieldSet$7(_use$1, this, options.use);
					}
				}
			}, {
				key: "canUse",
				value: function canUse() {
					return _classPrivateFieldGet$7(_use$1, this) && this.getKey();
				}
			}, {
				key: "isVerified",
				value: function isVerified() {
					return !this.canUse() || Boolean(_classPrivateFieldGet$7(_response$1, this));
				}
			}, {
				key: "getKey",
				value: function getKey() {
					if (_classPrivateFieldGet$7(_key$1, this)) {
						return _classPrivateFieldGet$7(_key$1, this);
					}

					// eslint-disable-next-line no-undef
					if (b24form && b24form.common) {
						// eslint-disable-next-line no-undef
						return (b24form.common.properties.captcha.recaptcha || {}).key;
					}
					return null;
				}
			}, {
				key: "getResponse",
				value: function getResponse() {
					return _classPrivateFieldGet$7(_response$1, this);
				}
			}, {
				key: "verify",
				value: function verify(callback) {
					if (!window.grecaptcha) {
						return;
					}
					if (callback) {
						_classPrivateFieldSet$7(_callback$1, this, callback);
					}
					_classPrivateFieldSet$7(_response$1, this, '');
					window.grecaptcha.execute(_classPrivateFieldGet$7(_widgetId$1, this));
				}
			}, {
				key: "render",
				value: function render(target) {
					if (!window.grecaptcha) {
						return;
					}
					_classPrivateFieldSet$7(_target$1, this, target);
					_classPrivateFieldSet$7(_widgetId$1, this, window.grecaptcha.render(target, {
						sitekey: this.getKey(),
						// this.#key,
						badge: 'inline',
						size: 'invisible',
						callback: response => {
							_classPrivateFieldSet$7(_response$1, this, response);
							if (_classPrivateFieldGet$7(_callback$1, this)) {
								_classPrivateFieldGet$7(_callback$1, this).call(this);
								_classPrivateFieldSet$7(_callback$1, this, null);
							}
						},
						'error-callback': () => {
							_classPrivateFieldSet$7(_response$1, this, '');
						},
						'expired-callback': () => {
							_classPrivateFieldSet$7(_response$1, this, '');
						}
					}));
				}
			}]);
		}();

		function _classPrivateFieldInitSpec$6(e, t, a) { _checkPrivateRedeclaration$6(e, t), t.set(e, a); }
		function _checkPrivateRedeclaration$6(e, t) { if (t.has(e)) throw new TypeError("Cannot initialize the same private elements twice on an object"); }
		function _classPrivateFieldGet$6(s, a) { return s.get(_assertClassBrand$6(s, a)); }
		function _classPrivateFieldSet$6(s, a, r) { return s.set(_assertClassBrand$6(s, a), r), r; }
		function _assertClassBrand$6(e, t, n) { if ("function" == typeof e ? e === t : e.has(t)) return arguments.length < 3 ? t : n; throw new TypeError("Private element is not present on this object"); }
		var _key = /*#__PURE__*/new WeakMap();
		var _use = /*#__PURE__*/new WeakMap();
		var _widgetId = /*#__PURE__*/new WeakMap();
		var _response = /*#__PURE__*/new WeakMap();
		var _target = /*#__PURE__*/new WeakMap();
		var _callback = /*#__PURE__*/new WeakMap();
		let YandexCaptcha$1 = /*#__PURE__*/function () {
			function YandexCaptcha() {
				babelHelpers.classCallCheck(this, YandexCaptcha);
				_classPrivateFieldInitSpec$6(this, _key, void 0);
				_classPrivateFieldInitSpec$6(this, _use, false);
				_classPrivateFieldInitSpec$6(this, _widgetId, void 0);
				_classPrivateFieldInitSpec$6(this, _response, void 0);
				_classPrivateFieldInitSpec$6(this, _target, void 0);
				_classPrivateFieldInitSpec$6(this, _callback, void 0);
			}
			return babelHelpers.createClass(YandexCaptcha, [{
				key: "adjust",
				value: function adjust(options) {
					if (typeof options.key !== 'undefined') {
						_classPrivateFieldSet$6(_key, this, options.key);
					}
					if (typeof options.use !== 'undefined') {
						_classPrivateFieldSet$6(_use, this, options.use);
					}
				}
			}, {
				key: "canUse",
				value: function canUse() {
					return _classPrivateFieldGet$6(_use, this) && this.getKey();
				}
			}, {
				key: "isVerified",
				value: function isVerified() {
					return !this.canUse() || Boolean(_classPrivateFieldGet$6(_response, this));
				}
			}, {
				key: "getKey",
				value: function getKey() {
					if (_classPrivateFieldGet$6(_key, this)) {
						return _classPrivateFieldGet$6(_key, this);
					}

					// eslint-disable-next-line no-undef
					if (b24form && b24form.common) {
						// eslint-disable-next-line no-undef
						return (b24form.common.properties.captcha.yandexCaptcha || {}).key;
					}
					return null;
				}
			}, {
				key: "getResponse",
				value: function getResponse() {
					return _classPrivateFieldGet$6(_response, this);
				}
			}, {
				key: "verify",
				value: function verify(callback) {
					if (!window.smartCaptcha) {
						return;
					}
					if (callback) {
						_classPrivateFieldSet$6(_callback, this, callback);
					}
					_classPrivateFieldSet$6(_response, this, '');
					window.smartCaptcha.execute(_classPrivateFieldGet$6(_widgetId, this));
				}
			}, {
				key: "render",
				value: function render(target) {
					if (!window.smartCaptcha) {
						return;
					}
					_classPrivateFieldSet$6(_target, this, target);
					_classPrivateFieldSet$6(_widgetId, this, window.smartCaptcha.render(target, {
						sitekey: this.getKey(),
						invisible: true,
						callback: response => {
							_classPrivateFieldSet$6(_response, this, response);
							if (_classPrivateFieldGet$6(_callback, this)) {
								_classPrivateFieldGet$6(_callback, this).call(this);
								_classPrivateFieldSet$6(_callback, this, null);
							}
						}
					}));
				}
			}]);
		}();

		function _classPrivateFieldInitSpec$5(e, t, a) { _checkPrivateRedeclaration$5(e, t), t.set(e, a); }
		function _checkPrivateRedeclaration$5(e, t) { if (t.has(e)) throw new TypeError("Cannot initialize the same private elements twice on an object"); }
		function _classPrivateFieldGet$5(s, a) { return s.get(_assertClassBrand$5(s, a)); }
		function _classPrivateFieldSet$5(s, a, r) { return s.set(_assertClassBrand$5(s, a), r), r; }
		function _assertClassBrand$5(e, t, n) { if ("function" == typeof e ? e === t : e.has(t)) return arguments.length < 3 ? t : n; throw new TypeError("Private element is not present on this object"); }
		var _currency = /*#__PURE__*/new WeakMap();
		var _fields$1 = /*#__PURE__*/new WeakMap();
		let Basket = /*#__PURE__*/function () {
			function Basket(fields, currency) {
				babelHelpers.classCallCheck(this, Basket);
				_classPrivateFieldInitSpec$5(this, _currency, void 0);
				_classPrivateFieldInitSpec$5(this, _fields$1, []);
				_classPrivateFieldSet$5(_currency, this, currency);
				_classPrivateFieldSet$5(_fields$1, this, fields.filter(field => field.type === 'product'));
			}
			return babelHelpers.createClass(Basket, [{
				key: "has",
				value: function has() {
					if (_classPrivateFieldGet$5(_fields$1, this).some(field => field.hasChangeablePrice())) {
						return false;
					}
					return _classPrivateFieldGet$5(_fields$1, this).length > 0;
				}
			}, {
				key: "items",
				value: function items() {
					return _classPrivateFieldGet$5(_fields$1, this).filter(field => field.visible).reduce((accumulator, field) => {
						return accumulator.concat(field.selectedItems());
					}, []).filter(item => item.price);
				}
			}, {
				key: "formatMoney",
				value: function formatMoney(val) {
					return Conv.formatMoney(val.toFixed(2), _classPrivateFieldGet$5(_currency, this).format);
				}
			}, {
				key: "sum",
				value: function sum() {
					return this.items().reduce((sum, item) => sum + item.getSummary(), 0);
				}
			}, {
				key: "total",
				value: function total() {
					return this.items().reduce((sum, item) => sum + item.getTotal(), 0);
				}
			}, {
				key: "discount",
				value: function discount() {
					return this.items().reduce((sum, item) => sum + item.getDiscounts(), 0);
				}
			}, {
				key: "printSum",
				value: function printSum() {
					return this.formatMoney(this.sum());
				}
			}, {
				key: "printTotal",
				value: function printTotal() {
					return this.formatMoney(this.total());
				}
			}, {
				key: "printDiscount",
				value: function printDiscount() {
					return this.formatMoney(this.discount());
				}
			}]);
		}();

		/*! 
		 * portal-vue © Thorsten Lünborg, 2019 
		 * 
		 * Version: 2.1.7
		 * 
		 * LICENCE: MIT 
		 * 
		 * https://github.com/linusborg/portal-vue
		 * 
		*/

		function _typeof(obj) {
			if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") {
				_typeof = function (obj) {
					return typeof obj;
				};
			} else {
				_typeof = function (obj) {
					return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
				};
			}
			return _typeof(obj);
		}
		function _toConsumableArray(arr) {
			return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _nonIterableSpread();
		}
		function _arrayWithoutHoles(arr) {
			if (Array.isArray(arr)) {
				for (var i = 0, arr2 = new Array(arr.length); i < arr.length; i++) arr2[i] = arr[i];
				return arr2;
			}
		}
		function _iterableToArray(iter) {
			if (Symbol.iterator in Object(iter) || Object.prototype.toString.call(iter) === "[object Arguments]") return Array.from(iter);
		}
		function _nonIterableSpread() {
			throw new TypeError("Invalid attempt to spread non-iterable instance");
		}
		var inBrowser = typeof window !== 'undefined';
		function freeze(item) {
			if (Array.isArray(item) || _typeof(item) === 'object') {
				return Object.freeze(item);
			}
			return item;
		}
		function combinePassengers(transports) {
			var slotProps = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
			return transports.reduce(function (passengers, transport) {
				var temp = transport.passengers[0];
				var newPassengers = typeof temp === 'function' ? temp(slotProps) : transport.passengers;
				return passengers.concat(newPassengers);
			}, []);
		}
		function stableSort(array, compareFn) {
			return array.map(function (v, idx) {
				return [idx, v];
			}).sort(function (a, b) {
				return compareFn(a[1], b[1]) || a[0] - b[0];
			}).map(function (c) {
				return c[1];
			});
		}
		function pick(obj, keys) {
			return keys.reduce(function (acc, key) {
				if (obj.hasOwnProperty(key)) {
					acc[key] = obj[key];
				}
				return acc;
			}, {});
		}
		var transports = {};
		var targets = {};
		var sources = {};
		var Wormhole = Vue.extend({
			data: function data() {
				return {
					transports: transports,
					targets: targets,
					sources: sources,
					trackInstances: inBrowser
				};
			},
			methods: {
				open: function open(transport) {
					if (!inBrowser) return;
					var to = transport.to,
						from = transport.from,
						passengers = transport.passengers,
						_transport$order = transport.order,
						order = _transport$order === void 0 ? Infinity : _transport$order;
					if (!to || !from || !passengers) return;
					var newTransport = {
						to: to,
						from: from,
						passengers: freeze(passengers),
						order: order
					};
					var keys = Object.keys(this.transports);
					if (keys.indexOf(to) === -1) {
						Vue.set(this.transports, to, []);
					}
					var currentIndex = this.$_getTransportIndex(newTransport); // Copying the array here so that the PortalTarget change event will actually contain two distinct arrays

					var newTransports = this.transports[to].slice(0);
					if (currentIndex === -1) {
						newTransports.push(newTransport);
					} else {
						newTransports[currentIndex] = newTransport;
					}
					this.transports[to] = stableSort(newTransports, function (a, b) {
						return a.order - b.order;
					});
				},
				close: function close(transport) {
					var force = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
					var to = transport.to,
						from = transport.from;
					if (!to || !from && force === false) return;
					if (!this.transports[to]) {
						return;
					}
					if (force) {
						this.transports[to] = [];
					} else {
						var index = this.$_getTransportIndex(transport);
						if (index >= 0) {
							// Copying the array here so that the PortalTarget change event will actually contain two distinct arrays
							var newTransports = this.transports[to].slice(0);
							newTransports.splice(index, 1);
							this.transports[to] = newTransports;
						}
					}
				},
				registerTarget: function registerTarget(target, vm, force) {
					if (!inBrowser) return;
					if (this.trackInstances && !force && this.targets[target]) {
						console.warn("[portal-vue]: Target ".concat(target, " already exists"));
					}
					this.$set(this.targets, target, Object.freeze([vm]));
				},
				unregisterTarget: function unregisterTarget(target) {
					this.$delete(this.targets, target);
				},
				registerSource: function registerSource(source, vm, force) {
					if (!inBrowser) return;
					if (this.trackInstances && !force && this.sources[source]) {
						console.warn("[portal-vue]: source ".concat(source, " already exists"));
					}
					this.$set(this.sources, source, Object.freeze([vm]));
				},
				unregisterSource: function unregisterSource(source) {
					this.$delete(this.sources, source);
				},
				hasTarget: function hasTarget(to) {
					return !!(this.targets[to] && this.targets[to][0]);
				},
				hasSource: function hasSource(to) {
					return !!(this.sources[to] && this.sources[to][0]);
				},
				hasContentFor: function hasContentFor(to) {
					return !!this.transports[to] && !!this.transports[to].length;
				},
				// Internal
				$_getTransportIndex: function $_getTransportIndex(_ref) {
					var to = _ref.to,
						from = _ref.from;
					for (var i in this.transports[to]) {
						if (this.transports[to][i].from === from) {
							return +i;
						}
					}
					return -1;
				}
			}
		});
		var wormhole = new Wormhole(transports);
		var _id$1 = 1;
		var Portal = Vue.extend({
			name: 'portal',
			props: {
				disabled: {
					type: Boolean
				},
				name: {
					type: String,
					default: function _default() {
						return String(_id$1++);
					}
				},
				order: {
					type: Number,
					default: 0
				},
				slim: {
					type: Boolean
				},
				slotProps: {
					type: Object,
					default: function _default() {
						return {};
					}
				},
				tag: {
					type: String,
					default: 'DIV'
				},
				to: {
					type: String,
					default: function _default() {
						return String(Math.round(Math.random() * 10000000));
					}
				}
			},
			created: function created() {
				var _this = this;
				this.$nextTick(function () {
					wormhole.registerSource(_this.name, _this);
				});
			},
			mounted: function mounted() {
				if (!this.disabled) {
					this.sendUpdate();
				}
			},
			updated: function updated() {
				if (this.disabled) {
					this.clear();
				} else {
					this.sendUpdate();
				}
			},
			beforeDestroy: function beforeDestroy() {
				wormhole.unregisterSource(this.name);
				this.clear();
			},
			watch: {
				to: function to(newValue, oldValue) {
					oldValue && oldValue !== newValue && this.clear(oldValue);
					this.sendUpdate();
				}
			},
			methods: {
				clear: function clear(target) {
					var closer = {
						from: this.name,
						to: target || this.to
					};
					wormhole.close(closer);
				},
				normalizeSlots: function normalizeSlots() {
					return this.$scopedSlots.default ? [this.$scopedSlots.default] : this.$slots.default;
				},
				normalizeOwnChildren: function normalizeOwnChildren(children) {
					return typeof children === 'function' ? children(this.slotProps) : children;
				},
				sendUpdate: function sendUpdate() {
					var slotContent = this.normalizeSlots();
					if (slotContent) {
						var transport = {
							from: this.name,
							to: this.to,
							passengers: _toConsumableArray(slotContent),
							order: this.order
						};
						wormhole.open(transport);
					} else {
						this.clear();
					}
				}
			},
			render: function render(h) {
				var children = this.$slots.default || this.$scopedSlots.default || [];
				var Tag = this.tag;
				if (children && this.disabled) {
					return children.length <= 1 && this.slim ? this.normalizeOwnChildren(children)[0] : h(Tag, [this.normalizeOwnChildren(children)]);
				} else {
					return this.slim ? h() : h(Tag, {
						class: {
							'v-portal': true
						},
						style: {
							display: 'none'
						},
						key: 'v-portal-placeholder'
					});
				}
			}
		});
		var PortalTarget = Vue.extend({
			name: 'portalTarget',
			props: {
				multiple: {
					type: Boolean,
					default: false
				},
				name: {
					type: String,
					required: true
				},
				slim: {
					type: Boolean,
					default: false
				},
				slotProps: {
					type: Object,
					default: function _default() {
						return {};
					}
				},
				tag: {
					type: String,
					default: 'div'
				},
				transition: {
					type: [String, Object, Function]
				}
			},
			data: function data() {
				return {
					transports: wormhole.transports,
					firstRender: true
				};
			},
			created: function created() {
				var _this = this;
				this.$nextTick(function () {
					wormhole.registerTarget(_this.name, _this);
				});
			},
			watch: {
				ownTransports: function ownTransports() {
					this.$emit('change', this.children().length > 0);
				},
				name: function name(newVal, oldVal) {
					/**
					 * TODO
					 * This should warn as well ...
					 */
					wormhole.unregisterTarget(oldVal);
					wormhole.registerTarget(newVal, this);
				}
			},
			mounted: function mounted() {
				var _this2 = this;
				if (this.transition) {
					this.$nextTick(function () {
						// only when we have a transition, because it causes a re-render
						_this2.firstRender = false;
					});
				}
			},
			beforeDestroy: function beforeDestroy() {
				wormhole.unregisterTarget(this.name);
			},
			computed: {
				ownTransports: function ownTransports() {
					var transports = this.transports[this.name] || [];
					if (this.multiple) {
						return transports;
					}
					return transports.length === 0 ? [] : [transports[transports.length - 1]];
				},
				passengers: function passengers() {
					return combinePassengers(this.ownTransports, this.slotProps);
				}
			},
			methods: {
				// can't be a computed prop because it has to "react" to $slot changes.
				children: function children() {
					return this.passengers.length !== 0 ? this.passengers : this.$scopedSlots.default ? this.$scopedSlots.default(this.slotProps) : this.$slots.default || [];
				},
				// can't be a computed prop because it has to "react" to this.children().
				noWrapper: function noWrapper() {
					var noWrapper = this.slim && !this.transition;
					if (noWrapper && this.children().length > 1) {
						console.warn('[portal-vue]: PortalTarget with `slim` option received more than one child element.');
					}
					return noWrapper;
				}
			},
			render: function render(h) {
				var noWrapper = this.noWrapper();
				var children = this.children();
				var Tag = this.transition || this.tag;
				return noWrapper ? children[0] : this.slim && !Tag ? h() : h(Tag, {
					props: {
						// if we have a transition component, pass the tag if it exists
						tag: this.transition && this.tag ? this.tag : undefined
					},
					class: {
						'vue-portal-target': true
					}
				}, children);
			}
		});
		var _id$1$1 = 0;
		var portalProps = ['disabled', 'name', 'order', 'slim', 'slotProps', 'tag', 'to'];
		var targetProps = ['multiple', 'transition'];
		var MountingPortal = Vue.extend({
			name: 'MountingPortal',
			inheritAttrs: false,
			props: {
				append: {
					type: [Boolean, String]
				},
				bail: {
					type: Boolean
				},
				mountTo: {
					type: String,
					required: true
				},
				// Portal
				disabled: {
					type: Boolean
				},
				// name for the portal
				name: {
					type: String,
					default: function _default() {
						return 'mounted_' + String(_id$1$1++);
					}
				},
				order: {
					type: Number,
					default: 0
				},
				slim: {
					type: Boolean
				},
				slotProps: {
					type: Object,
					default: function _default() {
						return {};
					}
				},
				tag: {
					type: String,
					default: 'DIV'
				},
				// name for the target
				to: {
					type: String,
					default: function _default() {
						return String(Math.round(Math.random() * 10000000));
					}
				},
				// Target
				multiple: {
					type: Boolean,
					default: false
				},
				targetSlim: {
					type: Boolean
				},
				targetSlotProps: {
					type: Object,
					default: function _default() {
						return {};
					}
				},
				targetTag: {
					type: String,
					default: 'div'
				},
				transition: {
					type: [String, Object, Function]
				}
			},
			created: function created() {
				if (typeof document === 'undefined') return;
				var el = document.querySelector(this.mountTo);
				if (!el) {
					console.error("[portal-vue]: Mount Point '".concat(this.mountTo, "' not found in document"));
					return;
				}
				var props = this.$props; // Target already exists

				if (wormhole.targets[props.name]) {
					if (props.bail) {
						console.warn("[portal-vue]: Target ".concat(props.name, " is already mounted.\n        Aborting because 'bail: true' is set"));
					} else {
						this.portalTarget = wormhole.targets[props.name];
					}
					return;
				}
				var append = props.append;
				if (append) {
					var type = typeof append === 'string' ? append : 'DIV';
					var mountEl = document.createElement(type);
					el.appendChild(mountEl);
					el = mountEl;
				} // get props for target from $props
				// we have to rename a few of them

				var _props = pick(this.$props, targetProps);
				_props.slim = this.targetSlim;
				_props.tag = this.targetTag;
				_props.slotProps = this.targetSlotProps;
				_props.name = this.to;
				this.portalTarget = new PortalTarget({
					el: el,
					parent: this.$parent || this,
					propsData: _props
				});
			},
			beforeDestroy: function beforeDestroy() {
				var target = this.portalTarget;
				if (this.append) {
					var el = target.$el;
					el.parentNode.removeChild(el);
				}
				target.$destroy();
			},
			render: function render(h) {
				if (!this.portalTarget) {
					console.warn("[portal-vue] Target wasn't mounted");
					return h();
				} // if there's no "manual" scoped slot, so we create a <Portal> ourselves

				if (!this.$scopedSlots.manual) {
					var props = pick(this.$props, portalProps);
					return h(Portal, {
						props: props,
						attrs: this.$attrs,
						on: this.$listeners,
						scopedSlots: this.$scopedSlots
					}, this.$slots.default);
				} // else, we render the scoped slot

				var content = this.$scopedSlots.manual({
					to: this.to
				}); // if user used <template> for the scoped slot
				// content will be an array

				if (Array.isArray(content)) {
					content = content[0];
				}
				if (!content) return h();
				return content;
			}
		});

		const Scrollable = {
			props: ['show', 'enabled', 'zIndex', 'text', 'topIntersected', 'bottomIntersected'],
			template: `
		<div>
			<transition name="b24-a-fade">
				<div class="b24-window-scroll-arrow-up-box"
					v-if="enabled && !text && !anchorTopIntersected"
					:style="{ zIndex: zIndexComputed + 10}"
					@click="scrollTo(false)"
				>
					<button type="button" class="b24-window-scroll-arrow-up"></button>
				</div>
			</transition>
			<div class="b24-window-scrollable" :style="{ zIndex: zIndexComputed }">
				<div v-show="enabled" class="b24-window-scroll-anchor"></div>
				<slot></slot>
				<div v-show="enabled" class="b24-window-scroll-anchor"></div>
			</div>
			<transition name="b24-a-fade">
				<div class="b24-window-scroll-arrow-down-box"
					v-if="enabled && !text && !anchorBottomIntersected && !hideEars"
					:style="{ zIndex: zIndexComputed + 10}"
					@click="scrollTo(true)"
				>
					<button type="button" class="b24-window-scroll-arrow-down"></button>
				</div>
				<div class="b24-form-scroll-textable"
					v-if="enabled && text && !anchorBottomIntersected && !hideEars"
					:style="{ zIndex: zIndexComputed + 10}"
					@click="scrollTo(true)"
				>
					<p class="b24-form-scroll-textable-text">{{ text }}</p>
					<div class="b24-form-scroll-textable-arrow">
						<div class="b24-form-scroll-textable-arrow-item"></div>
						<div class="b24-form-scroll-textable-arrow-item"></div>
						<div class="b24-form-scroll-textable-arrow-item"></div>
					</div>
				</div>
			</transition>
		</div>
	`,
			data: function () {
				return {
					showed: false,
					anchorObserver: null,
					anchorTopIntersected: true,
					anchorBottomIntersected: true
				};
			},
			computed: {
				zIndexComputed() {
					return this.zIndex || 200;
				},
				hideEars() {
					return this.$root.flags ? this.$root.flags.hideEars : false;
				}
			},
			methods: {
				getScrollNode() {
					return this.$el.querySelector('.b24-window-scrollable');
				},
				scrollTo(toDown) {
					toDown = toDown || false;
					let el = this.getScrollNode();
					let interval = 10;
					let duration = 100;
					let diff = toDown ? el.scrollHeight - el.offsetHeight - el.scrollTop : el.scrollTop;
					let step = diff / (duration / interval);
					let scroller = () => {
						diff -= step;
						el.scrollTop += toDown ? +step : -step;
						if (diff > 0) {
							setTimeout(scroller, interval);
						}
					};
					scroller();
				},
				toggleScroll() {
					Scroll.toggle(this.getScrollNode(), !this.show);
				},
				toggleObservingScrollHint() {
					if (!window.IntersectionObserver) {
						return;
					}
					let scrollable = this.getScrollNode();
					if (!scrollable) {
						return;
					}
					let topAnchor = scrollable.firstElementChild;
					let bottomAnchor = scrollable.lastElementChild;
					if (!topAnchor && !bottomAnchor) {
						return;
					}
					if (this.anchorObserver) {
						topAnchor ? this.anchorObserver.unobserve(topAnchor) : null;
						bottomAnchor ? this.anchorObserver.unobserve(bottomAnchor) : null;
						this.anchorObserver = null;
						return;
					}
					this.anchorObserver = new IntersectionObserver(entries => {
						entries.forEach(entry => {
							if (entry.target === topAnchor) {
								this.anchorTopIntersected = !!entry.isIntersecting;
							} else if (entry.target === bottomAnchor) {
								this.anchorBottomIntersected = !!entry.isIntersecting;
							}
						});
					}, {
						root: scrollable,
						rootMargin: this.scrollDownText ? '80px' : '60px',
						threshold: 0.1
					});
					topAnchor ? this.anchorObserver.observe(topAnchor) : null;
					bottomAnchor ? this.anchorObserver.observe(bottomAnchor) : null;
				}
			},
			beforeDestroy() {
				if (this.show) {
					Scroll.enable();
				}
			},
			mounted() {
				if (this.show) {
					this.toggleScroll();
					this.toggleObservingScrollHint();
				}
			},
			watch: {
				show(val) {
					if (val && !this.showed) {
						this.showed = true;
					}
					this.toggleScroll();
					this.toggleObservingScrollHint();
				}
			}
		};

		function getPortalSelector(mountId) {
			const className = 'b24-window-mounts';
			mountId = mountId || `empty`;
			mountId = `b24-window-mount-${mountId}`;
			const selector = `#${mountId}`;
			if (document.getElementById(mountId)) {
				return selector;
			}
			let wrapper = document.querySelector(`.${className}`);
			if (!wrapper) {
				wrapper = document.createElement('div');
				wrapper.classList.add(className);
				document.body.appendChild(wrapper);
			}
			const container = document.createElement('div');
			container.id = mountId;
			container.classList.add('b24-form');
			wrapper.appendChild(container);
			return selector;
		}
		const Overlay = {
			props: ['show', 'background'],
			components: {},
			template: `
		<transition name="b24-a-fade" appear>
			<div class="b24-window-overlay"
				:style="{ backgroundColor: background }" 
				@click="$emit('click')"
				v-show="show"
			></div>
		</transition>
	`
		};
		let windowMixin = {
			props: ['show', 'title', 'position', 'vertical', 'maxWidth', 'zIndex', 'scrollDown', 'scrollDownText', 'mountId', 'hideOnOverlayClick', 'messages'],
			components: {
				'b24-overlay': Overlay,
				'b24-scrollable': Scrollable,
				MountingPortal
			},
			data() {
				return {
					escHandler: null,
					previousActiveElement: null
				};
			},
			methods: {
				onOverlayClick() {
					if (this.hideOnOverlayClick) {
						this.hide();
					}
				},
				hide() {
					this.show = false;
					this.$emit('hide');
				},
				listenEsc() {
					if (!this.escHandler) {
						this.escHandler = e => {
							if (this.show && e.key === 'Escape') {
								e.preventDefault();
								e.stopPropagation();
								this.hide();
							}
						};
					}
					this.show ? document.addEventListener('keydown', this.escHandler) : document.removeEventListener('keydown', this.escHandler);
				},
				getMountTo(mountId) {
					return getPortalSelector(mountId);
				},
				setFocusToPopup() {
					if (!this.previousActiveElement && document.activeElement) {
						this.previousActiveElement = document.activeElement;
					}
					this.$refs.closeButton?.focus();
				},
				restoreFocus() {
					this.previousActiveElement?.focus();
					this.previousActiveElement = null;
				}
			},
			mounted() {
				this.listenEsc();
			},
			updated() {
				if (this.show) {
					this.$nextTick(() => {
						this.setFocusToPopup();
					});
				}
			},
			watch: {
				show() {
					this.listenEsc();
					if (!this.show) {
						this.$nextTick(() => {
							this.restoreFocus();
						});
					}
				}
			},
			computed: {
				zIndexComputed() {
					return this.zIndex || 200;
				},
				closeButtonLabel() {
					return this.messages?.get('fieldDateClose') || '';
				}
			}
		};
		const Popup$1 = {
			mixins: [windowMixin],
			props: ['isOnTop'],
			template: `
		<MountingPortal
			append
			:disabled="!mountId"
			:mountTo="getMountTo(mountId)"
		>
			<div class="b24-window">
				<b24-overlay :show="show" @click="onOverlayClick()"></b24-overlay>
				<transition :name="getTransitionName()" appear>
					<div class="b24-window-popup" 
						:class="classes()"
						@click.self.prevent="onOverlayClick()"
						v-show="show"
					>
						<div class="b24-window-popup-wrapper" 
							:style="{ maxWidth: maxWidth + 'px' }"
						>
							<button ref="closeButton" @click="hide()" type="button" class="b24-window-close" :style="{ zIndex: zIndexComputed + 20}" :aria-label="closeButtonLabel"></button>
							<b24-scrollable
								:show="show"
								:enabled="scrollDown"
								:zIndex="zIndex"
								:text="scrollDownText"
							>
								<div v-if="title" class="b24-window-popup-head">
									<div class="b24-window-popup-title">{{ title }}</div>
								</div>
								<div class="b24-window-popup-body">
									<slot></slot>
								</div>
							</b24-scrollable>
						</div>
					</div>
				</transition>
			</div>
		</MountingPortal>
	`,
			methods: {
				getTransitionName() {
					return `b24-a-slide-${this.vertical || 'bottom'}`;
				},
				classes() {
					const classes = this.isOnTop ? ['b24-window-popup-on-top'] : [];
					classes.push(`b24-window-popup-p-${this.position || 'center'}`);
					return classes;
				}
			}
		};
		const Panel$1 = {
			mixins: [windowMixin],
			template: `
		<div class="b24-window">
			<b24-overlay :show="show" @click="hide()"></b24-overlay>
			<transition :name="getTransitionName()" appear>
				<div class="b24-window-panel"
					:class="classes()"
					v-show="show"
				>
					<button ref="closeButton" @click="hide()" type="button" class="b24-window-close" :style="{ zIndex: zIndexComputed + 20}" :aria-label="closeButtonLabel"></button>
					<b24-scrollable
						:show="show"
						:enabled="scrollDown"
						:zIndex="zIndex"
						:text="scrollDownText"
					>
						<slot></slot>
					</b24-scrollable>
				</div>
			</transition>
		</div>
	`,
			methods: {
				getTransitionName() {
					return 'b24-a-slide-' + (this.vertical || 'bottom');
				},
				classes() {
					return ['b24-window-panel-pos-' + (this.position || 'right')];
				}
			}
		};
		const Widget$1 = {
			mixins: [windowMixin],
			template: `
		<div class="b24-window">
			<b24-overlay :show="show" @click="hide()" :background="'transparent'"></b24-overlay>
			<transition :name="getTransitionName()" appear>
				<div class="b24-window-widget" 
					:class="classes()" 
					v-show="show"
				>
					<button ref="closeButton" @click="hide()" type="button" class="b24-window-close" :aria-label="closeButtonLabel"></button>
					<div class="b24-window-widget-body">
						<slot></slot>
					</div>
				</div>
			</transition>
		</div>
	`,
			methods: {
				getTransitionName() {
					return 'b24-a-slide-short-' + (this.vertical || 'bottom');
				},
				classes() {
					return ['b24-window-widget-p-' + (this.vertical || 'bottom') + '-' + (this.position || 'right')];
				}
			}
		};
		const Definition$1 = {
			'b24-overlay': Overlay,
			'b24-popup': Popup$1,
			'b24-panel': Panel$1,
			'b24-widget': Widget$1
		};

		//import {ScrollDown} from "./components/scrolldown";
		const Components = {
			Definition: Definition$1
		};

		const AbuseBlock = {
			props: ['messages', 'abuseLink'],
			components: Object.assign(Components.Definition, {
				field: Factory.getComponent()
			}),
			data: function () {
				return {
					popupShown: false
				};
			},
			template: `
		<div>
			<span class="b24-form-sign-abuse">
				<!--noindex--><a :href="abuseLink" target="_blank" rel="nofollow" class="b24-form-sign-abuse-link">
					{{ messages.get('abuseLink') }}
				</a><!--/noindex-->
				<span class="b24-form-sign-abuse-help"
					:title="messages.get('abuseInfoHint')"
					@click.capture="showPopup"
				></span>
			</span>

			<b24-popup
				:show="popupShown"
				:title="this.messages.get('abuseLink')"
				:scrollDown="false"
				:hideOnOverlayClick="true"
				@hide="hidePopup"
			>
				<div class="b24-form-sign-abuse-popup">
					{{this.messages.get('abuseInfoHint')}}
				</div>
			</b24-popup>
		</div>
	`,
			methods: {
				showPopup() {
					this.popupShown = true;
				},
				hidePopup() {
					this.popupShown = false;
				}
			}
		};

		const AgreementBlock = {
			mixins: [],
			props: ['messages', 'view', 'fields', 'visible', 'title', 'html', 'field', 'formId'],
			components: Object.assign(Components.Definition, {
				'field': Factory.getComponent()
			}),
			data: function () {
				return {
					field: null,
					visible: false,
					title: '',
					html: '',
					maxWidth: 600
				};
			},
			template: `
		<div>
			<component v-bind:is="'field'"
				v-for="field in fields"
				v-bind:key="field.id"
				v-bind:field="field"
			></component>

			<b24-popup
				:mountId="formId"
				:show="visible" 
				:title="title" 
				:maxWidth="maxWidth" 
				:zIndex="199999"
				:isOnTop="true"
				:scrollDown="true"
				:scrollDownText="messages.get('consentReadAll')"
				@hide="reject"
			>
				<div style="padding: 0 12px 12px;">
					<div v-html="html"></div>
					
					<div class="b24-form-btn-container" style="padding: 12px 0 0;">
						<div class="b24-form-btn-block"
							@click.prevent="apply"						
						>
							<button type="button" class="b24-form-btn">
								{{ messages.get('consentAccept') }}
							</button>
						</div>
						<div class="b24-form-btn-block"
							@click.prevent="reject"						
						>
							<button type="button" class="b24-form-btn b24-form-btn-white b24-form-btn-border">
								{{ messages.get('consentReject') }}
							</button>
						</div>
					</div>
				</div>
			</b24-popup>
		</div>
	`,
			mounted() {
				this.$root.$on('consent:request', this.showPopup);
			},
			computed: {
				position() {
					return this.view.position;
				}
			},
			methods: {
				apply() {
					this.field.applyConsent();
					this.field = null;
					this.hidePopup();
				},
				reject() {
					this.field.rejectConsent();
					this.field = null;
					this.hidePopup();
				},
				hidePopup() {
					this.visible = false;
				},
				showPopup(field) {
					let text = field.options.content.text || '';
					let div = document.createElement('div');
					div.textContent = text;
					text = div.innerHTML.replace(/[\n]/g, '<br>');
					this.field = field;
					this.title = field.options.content.title;
					this.html = text || field.options.content.html;
					this.visible = true;
					setTimeout(() => {
						this.$root.$emit('resize');
					}, 0);
				}
			}
		};

		const ProgressBar = {
			props: ['uploadingProgress', 'timeLeft', 'messages'],
			data() {
				return {
					displayProgress: 0,
					interval: false
				};
			},
			mounted() {},
			watch: {
				uploadingProgress() {
					clearInterval(this.interval);
					const normalizedProgress = this.uploadingProgress * 100;
					if (normalizedProgress === Math.ceil(this.displayProgress)) {
						return;
					}
					this.interval = window.setInterval(() => {
						if (this.displayProgress !== Math.ceil(normalizedProgress)) {
							let delta = (normalizedProgress - this.displayProgress) / 10;
							delta = delta >= 0 ? Math.ceil(delta) : Math.floor(delta);
							this.displayProgress = this.displayProgress + delta;
						}
					}, 20);
				}
			},
			template: `
		<div class="b24-form-loader-progress-wrapper">
			<div class="b24-form-loader-progress-time-left"
				 v-show="this.timeLeft"
			>
				<span class="b24-form-loader-progress-time-left-value">{{ normalizedTime }}</span>
			</div>
			<div class="b24-form-loader-progress">
				<span class="b24-form-loader-progress-value">{{ normalizedProgress }}</span>
			</div>
		</div>
	`,
			computed: {
				normalizedProgress() {
					return Math.round(this.displayProgress);
				},
				normalizedTime() {
					let message = '';
					if (this.timeLeft >= 60) {
						message = this.messages?.get('filesLoadingTimeLeftFewMinutes');
					} else if (this.timeLeft > 30) {
						message = this.messages?.get('filesLoadingTimeLeftLessThanMinute');
					} else {
						message = this.messages?.get('filesLoadingTimeLeftFewSeconds');
					}
					return message;
				}
			},
			methods: {}
		};

		const StateBlock = {
			props: ['form'],
			data() {
				return {
					isSmallHeight: false
				};
			},
			mounted() {
				this.isSmallHeight = this.$el.parentElement.offsetHeight >= 1000;
			},
			template: `
		<div class="b24-form-state-container" :class="{'b24-form-state--sticky': isSmallHeight}">
				<transition name="b24-a-fade">
					<div v-show="form.loading" class="b24-form-loader" role="status" :aria-label="form.messages.get('stateLoading')">
						<ProgressBar
							v-if="form.loading && form.uploader.running"
							:uploadingProgress="form.uploader.progressToShow"
							:timeLeft="form.uploader.timeLeft"
							:messages="form.messages"
						/>
						<div class="b24-form-loader-icon">
							<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 263 174">
								<g transform=translate(52.5,7)>
									<path class="bx-sun-lines-animate" id="bxSunLines" d="M79,0 C80.6568542,0 82,1.34314575 82,3 L82,22 C82,23.6568542 80.6568542,25 79,25 C77.3431458,25 76,23.6568542 76,22 L76,3 C76,1.34314575 77.3431458,0 79,0 Z M134.861,23.139 C136.032146,24.3104996 136.032146,26.2095004 134.861,27.381 L121.426,40.816 C120.248863,41.9529166 118.377746,41.9366571 117.220544,40.7794557 C116.063343,39.6222543 116.047083,37.7511367 117.184,36.574 L130.619,23.139 C131.7905,21.9678542 133.6895,21.9678542 134.861,23.139 L134.861,23.139 Z M158,79 C158,80.6568542 156.656854,82 155,82 L136,82 C134.343146,82 133,80.6568542 133,79 C133,77.3431458 134.343146,76 136,76 L155,76 C156.656854,76 158,77.3431458 158,79 Z M134.861,134.861 C133.6895,136.032146 131.7905,136.032146 130.619,134.861 L117.184,121.426 C116.40413,120.672777 116.091362,119.557366 116.365909,118.508478 C116.640455,117.45959 117.45959,116.640455 118.508478,116.365909 C119.557366,116.091362 120.672777,116.40413 121.426,117.184 L134.861,130.619 C136.032146,131.7905 136.032146,133.6895 134.861,134.861 Z M79,158 C77.3431458,158 76,156.656854 76,155 L76,136 C76,134.343146 77.3431458,133 79,133 C80.6568542,133 82,134.343146 82,136 L82,155 C82,156.656854 80.6568542,158 79,158 Z M23.139,134.861 C21.9678542,133.6895 21.9678542,131.7905 23.139,130.619 L36.574,117.184 C37.3272234,116.40413 38.4426337,116.091362 39.491522,116.365909 C40.5404103,116.640455 41.3595451,117.45959 41.6340915,118.508478 C41.9086378,119.557366 41.5958698,120.672777 40.816,121.426 L27.381,134.861 C26.2095004,136.032146 24.3104996,136.032146 23.139,134.861 Z M0,79 C0,77.3431458 1.34314575,76 3,76 L22,76 C23.6568542,76 25,77.3431458 25,79 C25,80.6568542 23.6568542,82 22,82 L3,82 C1.34314575,82 0,80.6568542 0,79 L0,79 Z M23.139,23.139 C24.3104996,21.9678542 26.2095004,21.9678542 27.381,23.139 L40.816,36.574 C41.5958698,37.3272234 41.9086378,38.4426337 41.6340915,39.491522 C41.3595451,40.5404103 40.5404103,41.3595451 39.491522,41.6340915 C38.4426337,41.9086378 37.3272234,41.5958698 36.574,40.816 L23.139,27.381 C21.9678542,26.2095004 21.9678542,24.3104996 23.139,23.139 Z" fill="#FFD110"></path>
								</g>
								<g fill="none" fill-rule="evenodd">
									<path d="M65.745 160.5l.245-.005c13.047-.261 23.51-10.923 23.51-23.995 0-13.255-10.745-24-24-24-3.404 0-6.706.709-9.748 2.062l-.47.21-.196-.477A19.004 19.004 0 0 0 37.5 102.5c-10.493 0-19 8.507-19 19 0 1.154.103 2.295.306 3.413l.108.6-.609-.01A17.856 17.856 0 0 0 18 125.5C8.335 125.5.5 133.335.5 143s7.835 17.5 17.5 17.5h47.745zM166.5 85.5h69v-.316l.422-.066C251.14 82.73 262.5 69.564 262.5 54c0-17.397-14.103-31.5-31.5-31.5-.347 0-.694.006-1.04.017l-.395.013-.103-.382C226.025 9.455 214.63.5 201.5.5c-15.014 0-27.512 11.658-28.877 26.765l-.047.515-.512-.063a29.296 29.296 0 0 0-3.564-.217c-16.016 0-29 12.984-29 29 0 15.101 11.59 27.643 26.542 28.897l.458.039v.064z" stroke-opacity=".05" stroke="#000" fill="#000"></path>
									<circle stroke="#FFD110" stroke-width="6" cx="131.5" cy="86.5" r="44.5" class="b24-form-loader-icon-sun-ring"></circle>
								</g>
							</svg>
						</div>
					</div>
				</transition>
				
				<div v-show="form.sent" class="b24-form-state b24-form-success" role="status">
					<div class="b24-form-state-inner">
						<div class="b24-form-state-icon b24-form-success-icon"></div>
						<div class="b24-form-state-text">
							<p v-if="!form.stateText">{{ form.messages.get('stateSuccessTitle') }}</p>
							<p>{{ form.stateText }}</p>
						</div>
						<button class="b24-form-btn b24-form-btn-border b24-form-btn-tight"
							v-if="form.stateButton.text" 
							:aria-label="form.stateButton.text"
							@click="form.stateButton.handler" 
						>
							{{ form.stateButton.text }}						
						</button>
					</div>
					<div class="b24-form-inner-box"></div>
				</div>
			
				<div v-show="form.error" class="b24-form-state b24-form-error" role="alert">
					<div class="b24-form-state-inner">
						<div class="b24-form-state-icon b24-form-error-icon" aria-hidden="true"></div>
						<div class="b24-form-state-text">
							<p>{{ form.stateText }}</p>
						</div>
						
						<button class="b24-form-btn b24-form-btn-border b24-form-btn-tight"
							:aria-label="form.messages.get('stateButtonResend')"
							@click="form.submit()" 
						>
							{{ form.messages.get('stateButtonResend') }}						
						</button>
					</div>
					<div class="b24-form-inner-box"></div>
				</div>
				
				<div v-show="form.disabled" class="b24-form-state b24-form-warning" role="status">
					<div class="b24-form-state-inner">
						<div class="b24-form-state-icon b24-form-warning-icon">
							<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 169 169"><defs><circle id="a" cx="84.5" cy="84.5" r="65.5"/><filter x="-.8%" y="-.8%" width="101.5%" height="101.5%" filterUnits="objectBoundingBox" id="b"><feGaussianBlur stdDeviation=".5" in="SourceAlpha" result="shadowBlurInner1"/><feOffset dx="-1" dy="-1" in="shadowBlurInner1" result="shadowOffsetInner1"/><feComposite in="shadowOffsetInner1" in2="SourceAlpha" operator="arithmetic" k2="-1" k3="1" result="shadowInnerInner1"/><feColorMatrix values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.0886691434 0" in="shadowInnerInner1" result="shadowMatrixInner1"/><feGaussianBlur stdDeviation=".5" in="SourceAlpha" result="shadowBlurInner2"/><feOffset dx="1" dy="1" in="shadowBlurInner2" result="shadowOffsetInner2"/><feComposite in="shadowOffsetInner2" in2="SourceAlpha" operator="arithmetic" k2="-1" k3="1" result="shadowInnerInner2"/><feColorMatrix values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0.292285839 0" in="shadowInnerInner2" result="shadowMatrixInner2"/><feMerge><feMergeNode in="shadowMatrixInner1"/><feMergeNode in="shadowMatrixInner2"/></feMerge></filter></defs><g fill="none" fill-rule="evenodd"><circle stroke-opacity=".05" stroke="#000" fill-opacity=".07" fill="#000" cx="84.5" cy="84.5" r="84"/><use fill="#FFF" xlink:href="#a"/><use fill="#000" filter="url(#b)" xlink:href="#a"/><path d="M114.29 99.648L89.214 58.376c-1.932-3.168-6.536-3.168-8.427 0L55.709 99.648c-1.974 3.25.41 7.352 4.234 7.352h50.155c3.782 0 6.166-4.103 4.193-7.352zM81.404 72.756c0-1.828 1.48-3.29 3.33-3.29h.452c1.85 0 3.33 1.462 3.33 3.29v12.309c0 1.827-1.48 3.29-3.33 3.29h-.453c-1.85 0-3.33-1.463-3.33-3.29V72.756zm7.77 23.886c0 2.274-1.892 4.143-4.194 4.143s-4.193-1.869-4.193-4.143c0-2.275 1.891-4.144 4.193-4.144 2.302 0 4.193 1.869 4.193 4.144z" fill="#000" opacity=".4"/></g></svg>
						</div>
						<div class="b24-form-state-text">
							<p>{{ form.messages.get('stateDisabled') }}</p>
						</div>
					</div>
					<div class="b24-form-inner-box"></div>
				</div>
		</div>
	`,
			computed: {},
			methods: {},
			components: {
				ProgressBar
			}
		};

		const PagerBlock = {
			props: {
				pager: {
					type: Object,
					required: true
				},
				diameter: {
					type: Number,
					default: 44
				},
				border: {
					type: Number,
					default: 4
				}
			},
			template: `
		<div class="b24-form-progress-container"
			v-if="pager.iterable()"
		>
			<div class="b24-form-progress-bar-container">
				<svg class="b24-form-progress" 
					:viewport="'0 0 ' + diameter + ' ' + diameter" 
					:width="diameter" :height="diameter"
				>
					<circle class="b24-form-progress-track"
						:r="(diameter - border) / 2" 
						:cx="diameter / 2" :cy="diameter / 2" 
						:stroke-width="border" 
					></circle>
					<circle class="b24-form-progress-bar"
						:r="(diameter - border) / 2"
						:cx="diameter / 2" :cy="diameter / 2"
						:stroke-width="border"
						:stroke-dasharray="strokeDasharray" 
						:stroke-dashoffset="strokeDashoffset"
					></circle>
				</svg>
				<div class="b24-form-progress-bar-counter">
					<strong>{{ pager.index}}</strong>/{{ pager.count() }}
				</div>
			</div>
			<div class="b24-form-progress-bar-title">
				{{ pager.current().getTitle() }}
			</div>

		</div>
	`,
			computed: {
				strokeDasharray() {
					return this.getCircuit();
				},
				strokeDashoffset() {
					return this.getCircuit() - this.getCircuit() / this.pager.count() * this.pager.index;
				}
			},
			methods: {
				getCircuit() {
					return (this.diameter - this.border) * 3.14;
				}
			}
		};

		const BasketBlock = {
			props: ['basket', 'messages'],
			template: `
		<div v-if="basket.has()" class="b24-form-basket">
			<table>
				<tbody>
					<tr v-if="basket.discount()" class="b24-form-basket-sum">
						<td class="b24-form-basket-label">
							{{ messages.get('basketSum') }}:
						</td>
						<td class="b24-form-basket-value" v-html="basket.printSum()"></td>
					</tr>
					<tr v-if="basket.discount()" class="b24-form-basket-discount">
						<td class="b24-form-basket-label">
							{{ messages.get('basketDiscount') }}:
						</td>
						<td class="b24-form-basket-value" v-html="basket.printDiscount()"></td>
					</tr>
					<tr class="b24-form-basket-pay">
						<td class="b24-form-basket-label">
							{{ messages.get('basketTotal') }}:
						</td>
						<td class="b24-form-basket-value" v-html="basket.printTotal()"></td>
					</tr>
				</tbody>
			</table>
		</div>
	`,
			computed: {},
			methods: {}
		};

		let loaded$1 = null;
		const callbacks$1 = [];
		function load$1(callback) {
			if (loaded$1) {
				callback();
				return;
			}
			callbacks$1.push(callback);
			if (loaded$1 === false) {
				return;
			}
			loaded$1 = false;
			const node = document.createElement('SCRIPT');
			node.setAttribute('type', 'text/javascript');
			node.setAttribute('async', '');
			node.setAttribute('src', 'https://www.google.com/recaptcha/api.js');
			node.onload = () => window.grecaptcha.ready(() => {
				loaded$1 = true;
				callbacks$1.forEach(callback => callback());
			});
			(document.getElementsByTagName('head')[0] || document.documentElement).appendChild(node);
		}
		var ReCaptcha = {
			props: ['form'],
			methods: {
				canUse() {
					return this.form.recaptcha.canUse();
				},
				renderCaptcha() {
					this.form.recaptcha.render(this.$el.children[0]);
				}
			},
			mounted() {
				if (!this.canUse()) {
					return;
				}
				load$1(() => this.renderCaptcha());
			},
			template: `
		<div v-if="canUse()" class="b24-form-recaptcha"><div></div></div>
	`
		};

		let loaded = null;
		const callbacks = [];
		function load(callback) {
			if (loaded) {
				callback();
				return;
			}
			callbacks.push(callback);
			if (loaded === false) {
				return;
			}
			loaded = false;
			const node = document.createElement('SCRIPT');
			node.setAttribute('type', 'text/javascript');
			node.setAttribute('defer', '');
			node.setAttribute('src', 'https://smartcaptcha.yandexcloud.net/captcha.js?render=onload&onload=onloadFunction');
			node.onload = () => {
				loaded = true;
				callbacks.forEach(innerCallback => innerCallback());
			};
			(document.getElementsByTagName('head')[0] || document.documentElement).appendChild(node);
		}
		var YandexCaptcha = {
			props: ['form'],
			methods: {
				canUse() {
					return this.form.yandexCaptcha.canUse();
				},
				renderCaptcha() {
					this.form.yandexCaptcha.render(this.$el.children[0]);
				}
			},
			mounted() {
				if (!this.canUse()) {
					return;
				}
				load(() => this.renderCaptcha());
			},
			template: `
		<div v-if="canUse()" class="b24-form-yandex-captcha"><div></div></div>
	`
		};

		// Expected: an instance of form/controller#Controller. We avoid importing
		// the class to keep this module out of the controller.js cycle (CF1006).
		// Duck-typing via known methods preserves the dev-time validation intent.
		const isFormController = v => v && typeof v.submit === 'function' && typeof v.getId === 'function';
		const Form = {
			props: {
				form: {
					validator: isFormController
				}
			},
			components: {
				field: Factory.getComponent(),
				'abuse-block': AbuseBlock,
				'agreement-block': AgreementBlock,
				'state-block': StateBlock,
				'pager-block': PagerBlock,
				'basket-block': BasketBlock,
				'recaptcha-block': ReCaptcha,
				'yandex-captcha-block': YandexCaptcha
			},
			computed: {
				hasErrors() {
					return this.form.validated && !this.form.valid();
				},
				abuseEnabled() {
					return Boolean(this.form?.abuse?.link);
				},
				abuseLink() {
					return this.abuseEnabled ? this.getQueryParametersForAbuseLink() : '';
				},
				isDark() {
					return Boolean(this.form?.design?.isDark());
				},
				titleId() {
					return Aria.getFormElementId(this.form.getId(), 'title');
				},
				descId() {
					return Aria.getFormElementId(this.form.getId(), 'desc');
				}
			},
			methods: {
				getQueryParametersForAbuseLink() {
					const url = new URL(this.form.abuse.link);
					url.searchParams.set('b24_form_id', this.form.identification.id);
					url.searchParams.set('b24_address', this.form.identification.address);
					url.searchParams.set('b24_form_address', window.location.href);
					return url;
				},
				prevPage() {
					this.form.loading = true;
					setTimeout(() => {
						this.form.loading = false;
						this.form.pager.prev();
					}, 300);
				},
				nextPage() {
					if (this.form.pager.current().validate()) {
						this.form.loading = true;
					}
					setTimeout(() => {
						this.form.loading = false;
						this.form.pager.next();
					}, 300);
				},
				getSignBy() {
					return this.form.messages.get('signBy').replace('24', '');
				},
				submit(e) {
					if (!this.form.submit()) {
						e.preventDefault();
					}
				},
				classes() {
					const list = [];
					if (this.form.view.type === 'inline' && this.form.design.shadow) {
						list.push('b24-form-shadow');
					}
					if (this.form.design.compact) {
						list.push('b24-form-compact');
					}
					const border = this.form.design.border;
					for (const pos in border) {
						if (!border.hasOwnProperty(pos) || !border[pos]) {
							continue;
						}
						list.push(`b24-form-border-${pos}`);
					}
					if (this.form.loading || this.form.sent || this.form.error || this.form.disabled) {
						list.push('b24-from-state-on');
					}
					return list;
				}
			},
			template: `
		<div class="b24-form-wrapper"
			:class="classes()"
		>
			<div v-if="form.title || form.desc"
				class="b24-form-header b24-form-padding-side"
				role="region"
				:aria-labelledby="form.title ? titleId : null"
				:aria-describedby="form.desc ? descId : null"
			>
				<h2 v-if="form.title" :id="titleId" class="b24-form-header-title" v-text="form.title"></h2>
				<p v-if="form.desc" :id="descId" class="b24-form-header-description" v-html="form.desc"></p>
			</div>
			<div v-else class="b24-form-header-padding"></div>

			<div class="b24-form-content b24-form-padding-side">
				<form
					method="post"
					novalidate
					@submit="submit"
					v-if="form.pager"
				>
					<component
						:is="'pager-block'"
						:pager="form.pager"
						v-if="form.pager.iterable()"
					></component>

					<div v-if="!form.disabled">
						<component
							:is="'field'"
							v-for="field in form.pager.current().fields"
							:key="field.id"
							:field="field"
						></component>
					</div>

					<component
						:is="'agreement-block'"
						:formId="form.getId()"
						:fields="form.agreements"
						:view="form.view"
						:messages="form.messages"
						v-if="form.pager.ended()"
					></component>

					<component
						:is="'basket-block'"
						:basket="form.basket"
						:messages="form.messages"
					></component>

					<div class="b24-form-btn-container">
						<div class="b24-form-btn-block"
							v-if="!form.pager.beginning()"
							@click.prevent="prevPage()"
						>
							<button type="button" 
								class="b24-form-btn b24-form-btn-white b24-form-btn-border"
								:aria-label="form.messages.get('navBack')"
							>
								{{ form.messages.get('navBack') }}
							</button>
						</div>

						<div class="b24-form-btn-block"
							v-if="!form.pager.ended()"
							@click.prevent="nextPage()"
						>
							<button type="button" 
								class="b24-form-btn"
								:aria-label="form.messages.get('navNext')"
							>
								{{ form.messages.get('navNext') }}
							</button>
						</div>
						<div class="b24-form-btn-block"
							v-if="form.pager.ended()"
						>
							<button type="submit" 
								class="b24-form-btn"
								:aria-label="form.buttonCaption || form.messages.get('defButton')" 
								:aria-disabled="(form.loading || form.disabled) ? 'true' : null"
							>
								{{ form.buttonCaption || form.messages.get('defButton') }}
							</button>
						</div>
					</div>

					<span style="color: red;" v-show="false && hasErrors">
						Debug: fill fields
					</span>
				</form>
			</div>

			<state-block :form="form" />

			<recaptcha-block :form="form" />

			<yandex-captcha-block :form="form" />

			<div class="b24-form-sign">
				<select v-show="false" v-model="form.messages.language">
					<option
						v-for="language in form.languages"
						:value="language"
					>
						{{ language }}
					</option>
				</select>

				<component
					v-if="abuseEnabled"
					:is="'abuse-block'"
					:messages="form.messages"
					:abuseLink="abuseLink"
				></component>

				<div class="b24-form-sign-info" v-if="form.useSign">
					<span class="b24-form-sign-text">{{ form.messages.get('sign') }}</span>
					<span class="b24-form-sign-bx">{{ getSignBy() }}</span>
					<span class="b24-form-sign-24">24</span>
				</div>
			</div>
		</div>
	`
		};

		const Wrapper = {
			props: ['form'],
			data: function () {
				return {
					designStyleNode: null
				};
			},
			beforeDestroy() {
				if (this.designStyleNode) {
					this.designStyleNode.parentElement.removeChild(this.designStyleNode);
				}
			},
			methods: {
				classes() {
					let list = [];
					if (this.form.design.isDark()) {
						list.push('b24-form-dark');
					} else if (this.form.design.isAutoDark()) ;
					if (this.form.design.style) {
						list.push('b24-form-style-' + this.form.design.style);
					}
					return list;
				},
				isDesignStylesApplied() {
					let color = this.form.design.color;
					let css = [];
					let fontFamily = this.form.design.getFontFamily();
					if (fontFamily) {
						fontFamily = fontFamily.trim();
						fontFamily = fontFamily.indexOf(' ') > 0 ? `"${fontFamily}"` : fontFamily;
						css.push('--b24-font-family: ' + fontFamily + ', var(--b24-font-family-default);');
					}
					let fontUri = this.form.design.getFontUri();
					if (fontUri) {
						let link = document.createElement('LINK');
						link.setAttribute('href', fontUri);
						link.setAttribute('rel', 'stylesheet');
						document.head.appendChild(link);
					}
					let colorMap = {
						style: '--b24-font-family',
						primary: '--b24-primary-color',
						primaryText: '--b24-primary-text-color',
						primaryHover: '--b24-primary-hover-color',
						text: '--b24-text-color',
						background: '--b24-background-color',
						fieldBorder: '--b24-field-border-color',
						fieldBackground: '--b24-field-background-color',
						fieldFocusBackground: '--b24-field-focus-background-color',
						popupBackground: '--b24-popup-background-color'
					};
					for (let key in color) {
						if (!color.hasOwnProperty(key) || !color[key]) {
							continue;
						}
						if (!colorMap.hasOwnProperty(key) || !colorMap[key]) {
							continue;
						}
						let rgba = Color.hexToRgba(color[key]);
						css.push(colorMap[key] + ': ' + rgba + ';');
					}
					let primaryHover = Color.parseHex(color.primary);
					primaryHover[3] -= 0.3;
					primaryHover = Color.toRgba(primaryHover);
					css.push(colorMap.primaryHover + ': ' + primaryHover + ';');
					if (this.form.design.backgroundImage) {
						css.push(`background-image: url(${this.form.design.backgroundImage});`);
						css.push(`background-size: cover;`);
						css.push(`background-position: center;`);
						//css.push(`padding: 20px 0;`);
					}
					/*
					if (this.form.view.type === 'inline' && this.form.design.shadow)
					{
						(document.documentElement.clientWidth <= 530)
							? css.push('padding: 3px;')
							: css.push('padding: 20px;')
					}
					*/

					css = css.join("\n");
					if (!this.designStyleNode) {
						this.designStyleNode = document.createElement('STYLE');
						this.designStyleNode.setAttribute('type', 'text/css');
					}
					if (css) {
						css = `
				.b24-window-mounts #b24-window-mount-${this.form.getId()},
				.b24-form #b24-${this.form.getId()}, 
				.b24-form #b24-${this.form.getId()}.b24-form-dark {
					${css}
				}`;
						this.designStyleNode.textContent = '';
						this.designStyleNode.appendChild(document.createTextNode(css));
						document.head.appendChild(this.designStyleNode);
						return true;
					}
					if (!css) {
						if (this.designStyleNode && this.designStyleNode.parentElement) {
							this.designStyleNode.parentElement.removeChild(this.designStyleNode);
						}
						return false;
					}
				}
			},
			template: `
		<div class="b24-form">
			<div
			 	:class="classes()"
				:id="'b24-' + form.getId()"
				:data-styles-apllied="isDesignStylesApplied()"
			>
				<slot></slot>
			</div>
		</div>
	`
		};
		const viewMixin = {
			props: ['form'],
			components: Object.assign(Components.Definition, {
				'b24-form-container': Wrapper
			}),
			computed: {
				scrollDownText() {
					return Browser.isMobile() ? this.form.messages.get('moreFieldsYet') : null;
				}
			}
		};
		const Inline = {
			mixins: [viewMixin],
			template: `
		<b24-form-container :form="form" v-show="form.visible">
			<slot></slot>
		</b24-form-container>
	`
		};
		const Popup = {
			mixins: [viewMixin],
			template: `
		<b24-form-container :form="form">
			<b24-popup v-bind:key="form.id" 
				:show="form.visible"
				:position="form.view.position"  
				:scrollDown="!this.form.isOnState()"  
				:scrollDownText="scrollDownText"
				:messages="form.messages"
				@hide="form.hide()"
				:hideOnOverlayClick="form.view.hideOnOverlayClick"
			>
				<div v-if="form.view.title" class="b24-window-header">
					<div class="b24-window-header-title">{{ form.view.title }}</div>
				</div>
				<slot></slot>
			</b24-popup>
		</b24-form-container>
	`
		};
		const Panel = {
			mixins: [viewMixin],
			template: `
		<b24-form-container :form="form">
			<b24-panel v-bind:key="form.id" 
				:show="form.visible"
				:position="form.view.position"
				:vertical="form.view.vertical"
				:scrollDown="!this.form.isOnState()"
				:scrollDownText="scrollDownText"
				:messages="form.messages"
				@hide="form.hide()"
			>
				<div v-if="form.view.title" class="b24-window-header">
					<div class="b24-window-header-title">{{ form.view.title }}</div>
				</div>
				<slot></slot>
			</b24-panel>
		</b24-form-container>
	`
		};
		const Widget = {
			mixins: [viewMixin],
			template: `
		<b24-form-container :form="form">
			<b24-widget v-bind:key="form.id" 
				v-bind:show="form.visible" 
				v-bind:position="form.view.position" 
				v-bind:vertical="form.view.vertical"
				:messages="form.messages"
				@hide="form.hide()"
			>
				<slot></slot>
			</b24-widget>
		</b24-form-container>
	`
		};
		const Definition = {
			'b24-form': Form,
			'b24-form-inline': Inline,
			'b24-form-panel': Panel,
			'b24-form-popup': Popup,
			'b24-form-widget': Widget
		};

		function _classPrivateFieldInitSpec$4(e, t, a) { _checkPrivateRedeclaration$4(e, t), t.set(e, a); }
		function _checkPrivateRedeclaration$4(e, t) { if (t.has(e)) throw new TypeError("Cannot initialize the same private elements twice on an object"); }
		function _classPrivateFieldGet$4(s, a) { return s.get(_assertClassBrand$4(s, a)); }
		function _classPrivateFieldSet$4(s, a, r) { return s.set(_assertClassBrand$4(s, a), r), r; }
		function _assertClassBrand$4(e, t, n) { if ("function" == typeof e ? e === t : e.has(t)) return arguments.length < 3 ? t : n; throw new TypeError("Private element is not present on this object"); }
		var _data = /*#__PURE__*/new WeakMap();
		var _offset = /*#__PURE__*/new WeakMap();
		let Chunk = /*#__PURE__*/function () {
			function Chunk(data, offset) {
				babelHelpers.classCallCheck(this, Chunk);
				_classPrivateFieldInitSpec$4(this, _data, null);
				_classPrivateFieldInitSpec$4(this, _offset, 0);
				_classPrivateFieldSet$4(_data, this, data);
				_classPrivateFieldSet$4(_offset, this, offset);
			}
			return babelHelpers.createClass(Chunk, [{
				key: "getData",
				value: function getData() {
					return _classPrivateFieldGet$4(_data, this);
				}
			}, {
				key: "getOffset",
				value: function getOffset() {
					return _classPrivateFieldGet$4(_offset, this);
				}
			}, {
				key: "getSize",
				value: function getSize() {
					return this.getData().size;
				}
			}]);
		}();

		function _callSuper$1(t, o, e) { return o = babelHelpers.getPrototypeOf(o), babelHelpers.possibleConstructorReturn(t, _isNativeReflectConstruct$1() ? Reflect.construct(o, [], babelHelpers.getPrototypeOf(t).constructor) : o.apply(t, e)); }
		function _isNativeReflectConstruct$1() { try { var t = !Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); } catch (t) {} return (_isNativeReflectConstruct$1 = function () { return !!t; })(); }
		function _classPrivateMethodInitSpec$2(e, a) { _checkPrivateRedeclaration$3(e, a), a.add(e); }
		function _classPrivateFieldInitSpec$3(e, t, a) { _checkPrivateRedeclaration$3(e, t), t.set(e, a); }
		function _checkPrivateRedeclaration$3(e, t) { if (t.has(e)) throw new TypeError("Cannot initialize the same private elements twice on an object"); }
		function _classPrivateFieldGet$3(s, a) { return s.get(_assertClassBrand$3(s, a)); }
		function _classPrivateFieldSet$3(s, a, r) { return s.set(_assertClassBrand$3(s, a), r), r; }
		function _assertClassBrand$3(e, t, n) { if ("function" == typeof e ? e === t : e.has(t)) return arguments.length < 3 ? t : n; throw new TypeError("Private element is not present on this object"); }
		var _file = /*#__PURE__*/new WeakMap();
		var _fileData = /*#__PURE__*/new WeakMap();
		var _fieldId = /*#__PURE__*/new WeakMap();
		var _chunkOffset = /*#__PURE__*/new WeakMap();
		var _fileToken = /*#__PURE__*/new WeakMap();
		var _identification = /*#__PURE__*/new WeakMap();
		var _controller = /*#__PURE__*/new WeakMap();
		var _action = /*#__PURE__*/new WeakMap();
		var _currentChunk = /*#__PURE__*/new WeakMap();
		var _started = /*#__PURE__*/new WeakMap();
		var _uploaded = /*#__PURE__*/new WeakMap();
		var _chunkOptions = /*#__PURE__*/new WeakMap();
		var _additionalControllerOptions = /*#__PURE__*/new WeakMap();
		var _FileUploader_brand = /*#__PURE__*/new WeakSet();
		let FileUploader = /*#__PURE__*/function (_Event) {
			function FileUploader(options) {
				var _this;
				babelHelpers.classCallCheck(this, FileUploader);
				_this = _callSuper$1(this, FileUploader);
				_classPrivateMethodInitSpec$2(_this, _FileUploader_brand);
				_classPrivateFieldInitSpec$3(_this, _file, void 0);
				_classPrivateFieldInitSpec$3(_this, _fileData, void 0);
				_classPrivateFieldInitSpec$3(_this, _fieldId, void 0);
				_classPrivateFieldInitSpec$3(_this, _chunkOffset, null);
				_classPrivateFieldInitSpec$3(_this, _fileToken, null);
				_classPrivateFieldInitSpec$3(_this, _identification, void 0);
				_classPrivateFieldInitSpec$3(_this, _controller, 'crm.fileUploader.siteFormFileUploaderController');
				_classPrivateFieldInitSpec$3(_this, _action, 'crm.site.fileUploader.upload');
				_classPrivateFieldInitSpec$3(_this, _currentChunk, void 0);
				_classPrivateFieldInitSpec$3(_this, _started, false);
				_classPrivateFieldInitSpec$3(_this, _uploaded, false);
				_classPrivateFieldInitSpec$3(_this, _chunkOptions, void 0);
				_classPrivateFieldInitSpec$3(_this, _additionalControllerOptions, []);
				_classPrivateFieldSet$3(_identification, _this, options.identification);
				const serverOptions = window?.b24form?.common?.properties?.uploader || {};
				_classPrivateFieldSet$3(_chunkOptions, _this, {
					minSize: serverOptions.chunkMinSize || 1024 * 1024,
					defaultSize: serverOptions.chunkDefaultSize || 5 * 1024 * 1024
				});
				return _this;
			}
			babelHelpers.inherits(FileUploader, _Event);
			return babelHelpers.createClass(FileUploader, [{
				key: "upload",
				value: function upload(fileData) {
					if (_classPrivateFieldGet$3(_chunkOffset, this) !== null) {
						return;
					}
					_classPrivateFieldSet$3(_uploaded, this, false);
					_classPrivateFieldSet$3(_fileData, this, fileData);
					_classPrivateFieldSet$3(_file, this, fileData.file);
					let uploadingPromise = Promise.resolve();
					const nextChunk = _assertClassBrand$3(_FileUploader_brand, this, _getNextChunk).call(this);
					_classPrivateFieldSet$3(_currentChunk, this, nextChunk);
					if (nextChunk) {
						uploadingPromise = uploadingPromise.then(() => {
							return _assertClassBrand$3(_FileUploader_brand, this, _uploadChunk).call(this, nextChunk);
						});
					}
					return uploadingPromise.then(() => {
						return {
							'uploaded': _classPrivateFieldGet$3(_uploaded, this),
							'token': _classPrivateFieldGet$3(_fileToken, this)
						};
					});
				}
			}, {
				key: "continueUpload",
				value: function continueUpload() {
					let uploadingPromise = Promise.resolve();
					if (!_classPrivateFieldGet$3(_currentChunk, this) || !_classPrivateFieldGet$3(_started, this) || _classPrivateFieldGet$3(_uploaded, this)) {
						return uploadingPromise;
					}
					uploadingPromise = uploadingPromise.then(() => {
						return _assertClassBrand$3(_FileUploader_brand, this, _uploadChunk).call(this, _classPrivateFieldGet$3(_currentChunk, this));
					});
					return uploadingPromise.then(() => {
						return {
							'uploaded': _classPrivateFieldGet$3(_uploaded, this),
							'token': _classPrivateFieldGet$3(_fileToken, this)
						};
					});
				}
			}, {
				key: "isStarted",
				value: function isStarted() {
					return _classPrivateFieldGet$3(_started, this);
				}
			}, {
				key: "onUploadProgress",
				value: function onUploadProgress(uploadedBytes) {
					let leftToSent = _classPrivateFieldGet$3(_currentChunk, this).getSize() - uploadedBytes;
					let uploadedDataBytes = _classPrivateFieldGet$3(_chunkOffset, this) - leftToSent;
					this.progress = Math.floor(uploadedDataBytes / _classPrivateFieldGet$3(_file, this).size * 1000) / 10;
					this.emit('onChunkUploaded', uploadedDataBytes / _classPrivateFieldGet$3(_file, this).size);
				}
			}, {
				key: "onChunkUploaded",
				value: function onChunkUploaded() {
					this.progress = Math.floor(_classPrivateFieldGet$3(_chunkOffset, this) / _classPrivateFieldGet$3(_file, this).size * 1000) / 10;
					this.emit('onChunkUploaded', _classPrivateFieldGet$3(_chunkOffset, this) / _classPrivateFieldGet$3(_file, this).size);
				}
			}, {
				key: "onDone",
				value: function onDone() {
					_classPrivateFieldGet$3(_fileData, this).token = _classPrivateFieldGet$3(_fileToken, this);
					_classPrivateFieldGet$3(_fileData, this).content = '';
					_classPrivateFieldSet$3(_uploaded, this, true);
					this.refresh();
				}
			}, {
				key: "refresh",
				value: function refresh() {
					_classPrivateFieldSet$3(_file, this, null);
					_classPrivateFieldSet$3(_fileData, this, null);
					_classPrivateFieldSet$3(_fileToken, this, null);
					_classPrivateFieldSet$3(_chunkOffset, this, null);
					_classPrivateFieldSet$3(_started, this, false);
				}
			}, {
				key: "getChunkSize",
				value: function getChunkSize() {
					return _classPrivateFieldGet$3(_chunkOptions, this).defaultSize;
				}
			}, {
				key: "getFile",
				value: function getFile() {
					return _classPrivateFieldGet$3(_file, this);
				}
			}, {
				key: "setToken",
				value: function setToken(token) {
					_classPrivateFieldSet$3(_fileToken, this, token);
				}
			}, {
				key: "getChunkOffset",
				value: function getChunkOffset() {
					return _classPrivateFieldGet$3(_chunkOffset, this);
				}
			}, {
				key: "setFieldId",
				value: function setFieldId(fieldId) {
					_classPrivateFieldSet$3(_fieldId, this, fieldId);
				}
			}, {
				key: "getFieldId",
				value: function getFieldId() {
					return _classPrivateFieldGet$3(_fieldId, this) || null;
				}
			}, {
				key: "addControllerOption",
				value: function addControllerOption(parameter) {
					_classPrivateFieldGet$3(_additionalControllerOptions, this).push(parameter);
				}
			}]);
		}(Event);
		function _getNextChunk() {
			if (this.getChunkOffset() !== null && this.getChunkOffset() >= this.getFile().size) {
				// End of File
				return null;
			}
			if (this.getChunkOffset() === null) {
				// First call
				_classPrivateFieldSet$3(_chunkOffset, this, 0);
			}
			let chunk;
			if (this.getChunkOffset() === 0 && this.getFile().size <= this.getChunkSize()) {
				chunk = new Chunk(this.getFile(), this.getChunkOffset());
				_classPrivateFieldSet$3(_chunkOffset, this, this.getFile().size);
			} else {
				const currentChunkSize = Math.min(this.getChunkSize(), this.getFile().size - this.getChunkOffset());
				const nextOffset = this.getChunkOffset() + currentChunkSize;
				const fileRange = this.getFile().slice(this.getChunkOffset(), nextOffset);
				chunk = new Chunk(fileRange, this.getChunkOffset());
				_classPrivateFieldSet$3(_chunkOffset, this, nextOffset);
			}
			return chunk;
		}
		function _uploadChunk(chunk) {
			_classPrivateFieldSet$3(_started, this, true);
			_classPrivateFieldSet$3(_currentChunk, this, chunk);
			const totalSize = this.getFile().size;
			const isOnlyOneChunk = chunk.getOffset() === 0 && totalSize === chunk.getSize();
			let fileName = this.getFile().name;
			if (fileName.normalize) {
				fileName = fileName.normalize();
			}
			let headers = new Headers({
				'Content-Type': this.getFile().type || 'application/octet-stream',
				'X-Upload-Content-Name': encodeURIComponent(fileName),
				'Crm-Webform-Cors': 'Y'
			});
			if (!isOnlyOneChunk) {
				const rangeStart = chunk.getOffset();
				const rangeEnd = chunk.getOffset() + chunk.getSize() - 1;
				const rangeHeader = `bytes ${rangeStart}-${rangeEnd}/${totalSize}`;
				headers.append('Content-Range', rangeHeader);
			}
			return _assertClassBrand$3(_FileUploader_brand, this, _postChunk).call(this, {
				data: chunk.getData(),
				headers: headers,
				address: _classPrivateFieldGet$3(_identification, this).address + `/bitrix/services/main/ajax.php?action=${_classPrivateFieldGet$3(_action, this)}`
			});
		}
		function _postChunk(config) {
			let controllerOptions = {
				'formId': _classPrivateFieldGet$3(_identification, this).id,
				'secCode': _classPrivateFieldGet$3(_identification, this).sec,
				'fieldId': this.getFieldId()
			};
			_classPrivateFieldGet$3(_additionalControllerOptions, this).forEach(parameter => {
				controllerOptions[parameter.key] = parameter.value;
			});
			const getParameters = `&controller=${_classPrivateFieldGet$3(_controller, this)}` + `&token=${_classPrivateFieldGet$3(_fileToken, this) || 0}` + `&controllerOptions=${JSON.stringify(controllerOptions)}`;
			config.address += getParameters;
			return new Promise((resolve, reject) => {
				let xhr = new XMLHttpRequest();
				xhr.open('POST', config.address);
				xhr.withCredentials = true;
				config.headers.forEach((value, key) => {
					xhr.setRequestHeader(key, value);
				});
				xhr.upload.onprogress = event => {
					if (event.lengthComputable) {
						this.onUploadProgress(event.loaded);
					}
				};
				xhr.onload = () => {
					if (xhr.status >= 200 && xhr.status < 300) {
						resolve(xhr.response);
					} else {
						reject(xhr.response);
					}
				};
				xhr.onerror = () => reject(xhr.statusText);
				xhr.send(config.data);
			}).then(response => {
				return JSON.parse(response);
			}).then(response => {
				if (response.status === "error") {
					response.errors[0] = response.errors[0] || {
						message: 'Unknown error'
					};
					throw new Error(response.errors[0].message);
				}
				if (response.data.token) {
					this.setToken(response.data.token);
					let promise = Promise.resolve();
					if (!response.data.done) {
						// Upload next chunk
						const nextChunk = _assertClassBrand$3(_FileUploader_brand, this, _getNextChunk).call(this);
						if (nextChunk) {
							promise = promise.then(() => {
								return _assertClassBrand$3(_FileUploader_brand, this, _uploadChunk).call(this, nextChunk);
							});
						}
					} else {
						this.onDone();
					}
					return promise;
				} else {
					throw new Error('Chunk not Uploaded');
				}
			});
		}

		function _classPrivateMethodInitSpec$1(e, a) { _checkPrivateRedeclaration$2(e, a), a.add(e); }
		function _classPrivateFieldInitSpec$2(e, t, a) { _checkPrivateRedeclaration$2(e, t), t.set(e, a); }
		function _checkPrivateRedeclaration$2(e, t) { if (t.has(e)) throw new TypeError("Cannot initialize the same private elements twice on an object"); }
		function _classPrivateFieldGet$2(s, a) { return s.get(_assertClassBrand$2(s, a)); }
		function _classPrivateFieldSet$2(s, a, r) { return s.set(_assertClassBrand$2(s, a), r), r; }
		function _assertClassBrand$2(e, t, n) { if ("function" == typeof e ? e === t : e.has(t)) return arguments.length < 3 ? t : n; throw new TypeError("Private element is not present on this object"); }
		var _form = /*#__PURE__*/new WeakMap();
		var _files = /*#__PURE__*/new WeakMap();
		var _fileUploader = /*#__PURE__*/new WeakMap();
		var _filesControllers = /*#__PURE__*/new WeakMap();
		var _currentFileIndex = /*#__PURE__*/new WeakMap();
		var _summarySize = /*#__PURE__*/new WeakMap();
		var _allProgress = /*#__PURE__*/new WeakMap();
		var _lastUpdateTime = /*#__PURE__*/new WeakMap();
		var _Uploader_brand = /*#__PURE__*/new WeakSet();
		let Uploader = /*#__PURE__*/function () {
			function Uploader(form) {
				babelHelpers.classCallCheck(this, Uploader);
				_classPrivateMethodInitSpec$1(this, _Uploader_brand);
				_classPrivateFieldInitSpec$2(this, _form, void 0);
				_classPrivateFieldInitSpec$2(this, _files, void 0);
				_classPrivateFieldInitSpec$2(this, _fileUploader, void 0);
				_classPrivateFieldInitSpec$2(this, _filesControllers, void 0);
				_classPrivateFieldInitSpec$2(this, _currentFileIndex, 0);
				_classPrivateFieldInitSpec$2(this, _summarySize, 0);
				_classPrivateFieldInitSpec$2(this, _allProgress, 0);
				_classPrivateFieldInitSpec$2(this, _lastUpdateTime, null);
				babelHelpers.defineProperty(this, "progressToShow", 0);
				babelHelpers.defineProperty(this, "timeLeft", null);
				babelHelpers.defineProperty(this, "alreadyStarted", false);
				babelHelpers.defineProperty(this, "running", false);
				_classPrivateFieldSet$2(_form, this, form);
				_classPrivateFieldSet$2(_fileUploader, this, new FileUploader({
					identification: _classPrivateFieldGet$2(_form, this).identification || ""
				}));
				_classPrivateFieldGet$2(_fileUploader, this).subscribe('onChunkUploaded', this.updateProgress.bind(this));
			}
			return babelHelpers.createClass(Uploader, [{
				key: "upload",
				value: function upload() {
					this.alreadyStarted = true;
					let uploadingPromise = Promise.resolve();
					uploadingPromise = uploadingPromise.then(() => {
						return _assertClassBrand$2(_Uploader_brand, this, _uploadNext).call(this);
					});
					return uploadingPromise;
				}
			}, {
				key: "onFileUploaded",
				value: function onFileUploaded() {
					var _this$currentFileInde;
					_classPrivateFieldSet$2(_currentFileIndex, this, (_this$currentFileInde = _classPrivateFieldGet$2(_currentFileIndex, this), _this$currentFileInde++, _this$currentFileInde));
					_classPrivateFieldSet$2(_allProgress, this, this.progressToShow);
					_classPrivateFieldSet$2(_lastUpdateTime, this, null);
				}
			}, {
				key: "updateProgress",
				value: function updateProgress(currentFileProgress) {
					const cur = _assertClassBrand$2(_Uploader_brand, this, _getCurrentUploadingFile).call(this).fileData;
					const currentProgress = _classPrivateFieldGet$2(_allProgress, this) + currentFileProgress * cur.size / this.getSummarySize();
					if (_classPrivateFieldGet$2(_lastUpdateTime, this)) {
						const timePassed = new Date() - _classPrivateFieldGet$2(_lastUpdateTime, this);
						const progressDelta = currentProgress - this.progressToShow;
						const speed = progressDelta / timePassed; // uploading progress per millisecond

						this.timeLeft = Math.round((1 - currentProgress) / (1000 * speed));
					}
					this.progressToShow = currentProgress;
					_classPrivateFieldSet$2(_lastUpdateTime, this, new Date());
				}
			}, {
				key: "hasFilesToSend",
				value: function hasFilesToSend() {
					if (this.alreadyStarted) {
						return _classPrivateFieldGet$2(_files, this).length > 0;
					}
					_classPrivateFieldSet$2(_filesControllers, this, _classPrivateFieldGet$2(_form, this).getFields().filter(e => e.type === 'file' && e.values().length > 0));
					_classPrivateFieldSet$2(_files, this, _classPrivateFieldGet$2(_filesControllers, this).reduce((ar, e) => {
						e.values().forEach(value => {
							const item = {
								fieldId: e.id,
								fileData: value
							};
							ar.push(item);
						});
						return ar;
					}, []));
					let fieldsSizeMap = {};
					_classPrivateFieldGet$2(_files, this).forEach(value => {
						if (value.fieldId in fieldsSizeMap) {
							fieldsSizeMap[value.fieldId] += value.fileData.size;
						} else {
							fieldsSizeMap[value.fieldId] = value.fileData.size;
						}
					});
					const option = {
						value: fieldsSizeMap,
						key: 'fieldsSize'
					};
					_classPrivateFieldGet$2(_fileUploader, this).addControllerOption(option);
					_classPrivateFieldSet$2(_currentFileIndex, this, 0);
					this.refreshSummarySize();
					return _classPrivateFieldGet$2(_files, this).length > 0;
				}
			}, {
				key: "refreshSummarySize",
				value: function refreshSummarySize() {
					_classPrivateFieldSet$2(_summarySize, this, _classPrivateFieldGet$2(_files, this).reduce((ac, e) => {
						return ac + e.fileData.size;
					}, 0));
				}
			}, {
				key: "getSummarySize",
				value: function getSummarySize() {
					return _classPrivateFieldGet$2(_summarySize, this);
				}
			}]);
		}();
		function _uploadNext() {
			let promise = Promise.resolve();
			if (_classPrivateFieldGet$2(_currentFileIndex, this) < _classPrivateFieldGet$2(_files, this).length) {
				promise = promise.then(() => {
					const currentFile = _classPrivateFieldGet$2(_files, this)[_classPrivateFieldGet$2(_currentFileIndex, this)];
					this.running = true;
					if (_classPrivateFieldGet$2(_fileUploader, this).isStarted()) {
						return _classPrivateFieldGet$2(_fileUploader, this).continueUpload();
					} else {
						_classPrivateFieldGet$2(_fileUploader, this).setFieldId(currentFile.fieldId);
						return _classPrivateFieldGet$2(_fileUploader, this).upload(currentFile.fileData);
					}
				}).then(response => {
					if (response.uploaded) {
						this.onFileUploaded();
						return _assertClassBrand$2(_Uploader_brand, this, _uploadNext).call(this);
					} else {
						throw new Error('file not uploaded');
					}
				});
				this.running = false;
			}
			promise.catch(err => {
				this.running = false;
				throw err;
			});
			return promise;
		}
		function _getCurrentUploadingFile() {
			return _classPrivateFieldGet$2(_files, this)[_classPrivateFieldGet$2(_currentFileIndex, this)];
		}

		function _callSuper(t, o, e) { return o = babelHelpers.getPrototypeOf(o), babelHelpers.possibleConstructorReturn(t, _isNativeReflectConstruct() ? Reflect.construct(o, e || [], babelHelpers.getPrototypeOf(t).constructor) : o.apply(t, e)); }
		function _isNativeReflectConstruct() { try { var t = !Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); } catch (t) {} return (_isNativeReflectConstruct = function () { return !!t; })(); }
		function _classPrivateMethodInitSpec(e, a) { _checkPrivateRedeclaration$1(e, a), a.add(e); }
		function _classPrivateFieldInitSpec$1(e, t, a) { _checkPrivateRedeclaration$1(e, t), t.set(e, a); }
		function _checkPrivateRedeclaration$1(e, t) { if (t.has(e)) throw new TypeError("Cannot initialize the same private elements twice on an object"); }
		function _classPrivateFieldGet$1(s, a) { return s.get(_assertClassBrand$1(s, a)); }
		function _classPrivateFieldSet$1(s, a, r) { return s.set(_assertClassBrand$1(s, a), r), r; }
		function _assertClassBrand$1(e, t, n) { if ("function" == typeof e ? e === t : e.has(t)) return arguments.length < 3 ? t : n; throw new TypeError("Private element is not present on this object"); }
		const DefaultOptions = {
			view: 'inline'
		};
		var _id = /*#__PURE__*/new WeakMap();
		var _fields = /*#__PURE__*/new WeakMap();
		var _dependence = /*#__PURE__*/new WeakMap();
		var _properties = /*#__PURE__*/new WeakMap();
		var _personalisation = /*#__PURE__*/new WeakMap();
		var _vue = /*#__PURE__*/new WeakMap();
		var _Controller_brand = /*#__PURE__*/new WeakSet();
		let Controller = /*#__PURE__*/function (_Event) {
			function Controller(options = DefaultOptions) {
				var _this;
				babelHelpers.classCallCheck(this, Controller);
				_this = _callSuper(this, Controller, [options]);
				_classPrivateMethodInitSpec(_this, _Controller_brand);
				_classPrivateFieldInitSpec$1(_this, _id, void 0);
				babelHelpers.defineProperty(_this, "identification", {});
				babelHelpers.defineProperty(_this, "view", {
					type: 'inline'
				});
				babelHelpers.defineProperty(_this, "provider", {});
				babelHelpers.defineProperty(_this, "analyticsHandler", {});
				babelHelpers.defineProperty(_this, "languages", []);
				babelHelpers.defineProperty(_this, "language", 'en');
				_classPrivateFieldInitSpec$1(_this, _fields, []);
				_classPrivateFieldInitSpec$1(_this, _dependence, void 0);
				_classPrivateFieldInitSpec$1(_this, _properties, {});
				babelHelpers.defineProperty(_this, "agreements", []);
				babelHelpers.defineProperty(_this, "useSign", false);
				babelHelpers.defineProperty(_this, "date", {
					dateFormat: 'DD.MM.YYYY',
					dateTimeFormat: 'DD.MM.YYYY HH:mm:ss',
					sundayFirstly: false
				});
				babelHelpers.defineProperty(_this, "currency", {
					code: 'USD',
					title: '$',
					format: '$#'
				});
				_classPrivateFieldInitSpec$1(_this, _personalisation, {
					title: '',
					desc: ''
				});
				babelHelpers.defineProperty(_this, "validated", false);
				babelHelpers.defineProperty(_this, "visible", true);
				babelHelpers.defineProperty(_this, "loading", false);
				babelHelpers.defineProperty(_this, "disabled", false);
				babelHelpers.defineProperty(_this, "sent", false);
				babelHelpers.defineProperty(_this, "error", false);
				babelHelpers.defineProperty(_this, "stateText", '');
				babelHelpers.defineProperty(_this, "stateButton", {
					text: '',
					handler: null
				});
				_classPrivateFieldInitSpec$1(_this, _vue, void 0);
				_this.setGlobalEventNamespace('b24:form');
				_this.messages = new Storage();
				_this.design = new Model();
				_classPrivateFieldSet$1(_dependence, _this, new Manager(_this));
				_this.analytics = new Analytics(_this);
				_this.recaptcha = new ReCaptcha$1();
				_this.yandexCaptcha = new YandexCaptcha$1();
				_this.abuse = options.abuse;
				_this.emit(EventTypes.initBefore, options);

				// eslint-disable-next-line no-param-reassign
				options = _this.adjust(options);
				_this.uploader = new Uploader(_this);
				_classPrivateFieldSet$1(_id, _this, options.id || Math.random().toString().split('.')[1] + Math.random().toString().split('.')[1]);
				_this.provider = options.provider || {};
				_this.analyticsHandler = options.analyticsHandler || {};
				_this.editMode = options.editMode ?? false;
				if (_this.provider.form) {
					_this.loading = true;
					if (_this.provider.form) {
						if (typeof _this.provider.form === 'string') ; else if (typeof _this.provider.form === 'function') {
							_this.provider.form().then(options => {
								_this.adjust(options);
								_this.load();
							}).catch(e => {
								if (window.console && console.log) {
									console.log('b24form get `form` error:', e.message);
								}
							});
						}
					}
				} else {
					_this.load();
					if (_this.provider.user) {
						if (typeof _this.provider.user === 'string') ; else if (_this.provider.user instanceof Promise) {
							_this.provider.user.then(user => {
								_this.setValues(user);
								return user;
							}).catch(e => {
								if (window.console && console.log) {
									console.log('b24form get `user` error:', e.message);
								}
							});
						} else if (typeof _this.provider.user === 'object') {
							_this.setValues(_this.provider.user);
						}
					}
				}
				_this.emit(EventTypes.init);
				_this.render();

				// track form views
				ViewObserver.observe(document.querySelector('#b24-' + _this.getId() + ' .b24-form-wrapper'), () => {
					_this.emit(EventTypes.view);
				});
				return _this;
			}
			babelHelpers.inherits(Controller, _Event);
			return babelHelpers.createClass(Controller, [{
				key: "load",
				value: function load() {
					if (this.visible) {
						this.show();
					}
				}
			}, {
				key: "reset",
				value: function reset() {
					_classPrivateFieldGet$1(_fields, this).forEach(field => {
						field.reset();
						if (_classPrivateFieldGet$1(_dependence, this)) {
							_classPrivateFieldGet$1(_dependence, this).trigger(field, 'change');
						}
					});
					this.pager.first();
				}
			}, {
				key: "show",
				value: function show() {
					this.visible = true;
					this.emitOnce(EventTypes.showFirst);
					this.emit(EventTypes.show);
				}
			}, {
				key: "hide",
				value: function hide() {
					this.visible = false;
					this.emit(EventTypes.hide);
				}
			}, {
				key: "submit",
				value: function submit() {
					this.error = false;
					this.sent = false;
					if (!this.valid()) {
						const firstInvalidField = _classPrivateFieldGet$1(_fields, this).find(field => !field.valid());
						if (firstInvalidField) {
							_assertClassBrand$1(_Controller_brand, this, _focusFirstInvalidField).call(this, firstInvalidField);
						}
						return false;
					}
					storeFieldValues(this.getFields());
					if (this.recaptcha.canUse() && !this.recaptcha.isVerified()) {
						this.recaptcha.verify(() => this.submit());
						return false;
					}
					if (this.yandexCaptcha.canUse() && !this.yandexCaptcha.isVerified()) {
						this.yandexCaptcha.verify(() => this.submit());
						return false;
					}
					this.loading = true;
					let promise = Promise.resolve();
					const eventData = {
						promise
					};
					this.emit(EventTypes.submit, eventData);
					promise = eventData.promise || promise;
					if (!this.provider.submit) {
						this.loading = false;
						return true;
					}
					if (this.uploader.hasFilesToSend()) {
						promise = promise.then(() => {
							return this.uploader.upload();
						});
					}
					const consents = this.agreements.reduce((acc, field) => {
						acc[field.name] = field.value();
						return acc;
					}, {});
					const formData = new FormData();
					formData.set('properties', JSON.stringify(_classPrivateFieldGet$1(_properties, this)));
					formData.set('consents', JSON.stringify(consents));
					formData.set('recaptcha', this.recaptcha.getResponse());
					formData.set('yandexSmartCaptcha', this.yandexCaptcha.getResponse());
					formData.set('timeZoneOffset', new Date().getTimezoneOffset());

					// eslint-disable-next-line promise/catch-or-return
					promise.then(() => {
						formData.set('values', JSON.stringify(this.values()));
					});
					if (typeof this.provider.submit === 'string') {
						promise = promise.then(() => window.fetch(this.provider.submit, {
							method: 'POST',
							mode: 'cors',
							cache: 'no-cache',
							headers: {
								'Origin': window.location.origin
							},
							body: formData
						}));
					} else if (typeof this.provider.submit === 'function') {
						promise = promise.then(() => {
							formData.set('properties', JSON.stringify(_classPrivateFieldGet$1(_properties, this)));
							return this.provider.submit(this, formData);
						});
					}
					promise.then(data => {
						this.sent = true;
						this.loading = false;
						this.stateText = data.message || this.messages.get('stateSuccess');
						if (!data.resultId) {
							this.error = true;
							return;
						}
						this.emit(EventTypes.sendSuccess, data);
						const redirect = data.redirect || {};
						if (redirect.url) {
							const handler = () => {
								try {
									top.location = redirect.url;
								} catch (e) {}
								window.location = redirect.url;
							};
							if (data.pay) {
								this.stateButton.text = this.messages.get('stateButtonPay');
								this.stateButton.handler = handler;
							}
							setTimeout(handler, (redirect.delay || 0) * 1000);
						} else if (data.refill.active) {
							this.stateButton.text = data.refill.caption;
							this.stateButton.handler = () => {
								this.sent = false;
								this.reset();
							};
						}
					}).catch(e => {
						this.error = true;
						this.loading = false;
						this.stateText = this.messages.get('stateError');
						this.emit(EventTypes.sendError, e);
					});
					return false;
				}
			}, {
				key: "setValues",
				value: function setValues(values) {
					if (!values || typeof values !== 'object') {
						return;
					}
					if (_classPrivateFieldGet$1(_personalisation, this).title) {
						this.title = Conv.replaceText(_classPrivateFieldGet$1(_personalisation, this).title, values);
					}
					if (_classPrivateFieldGet$1(_personalisation, this).desc) {
						this.desc = Conv.replaceText(_classPrivateFieldGet$1(_personalisation, this).desc, values);
					}
					_classPrivateFieldGet$1(_fields, this).forEach(field => {
						const value = values[field.type] || values[field.name];
						if (typeof value === 'undefined' || !field.item()) {
							return;
						}
						field.setValues(Array.isArray(value) ? value : [value]);
					});
				}
			}, {
				key: "adjust",
				value: function adjust(options = DefaultOptions) {
					options = Object.assign({}, DefaultOptions, options);
					if (typeof options.identification === 'object') {
						this.identification = options.identification;
					}
					if (options.messages) {
						this.messages.setMessages(options.messages || {});
					}
					if (options.language) {
						this.language = options.language;
						this.messages.setLanguage(this.language);
					}
					if (options.languages) {
						this.languages = options.languages;
					}
					////////////////////////////////////////

					if (options.handlers && typeof options.handlers === 'object') {
						Object.keys(options.handlers).forEach(key => this.subscribe(key, options.handlers[key]));
					}
					if (options.properties && typeof options.properties === 'object') {
						Object.keys(options.properties).forEach(key => this.setProperty(key, options.properties[key]));
					}
					if (typeof options.title !== 'undefined') {
						_classPrivateFieldGet$1(_personalisation, this).title = options.title;
						this.title = Conv.replaceText(options.title, {});
					}
					if (typeof options.desc !== 'undefined') {
						_classPrivateFieldGet$1(_personalisation, this).desc = options.desc;
						this.desc = Conv.replaceText(options.desc, {});
					}
					if (typeof options.useSign !== 'undefined') {
						this.useSign = !!options.useSign;
					}
					if (typeof options.date === 'object') {
						this.setDate(options.date);
					}
					if (typeof options.currency === 'object') {
						this.setCurrency(options.currency);
					}
					if (Array.isArray(options.fields)) {
						this.setFields(options.fields);
					}
					if (Array.isArray(options.agreements)) {
						this.agreements = [];
						options.agreements.forEach(fieldOptions => {
							fieldOptions.messages = this.messages;
							fieldOptions.design = this.design;
							this.agreements.push(new Controller$b(fieldOptions));
						});
					}
					this.setView(options.view);
					if (typeof options.buttonCaption !== 'undefined') {
						this.buttonCaption = options.buttonCaption;
					}
					if (typeof options.visible !== 'undefined') {
						this.visible = !!options.visible;
					}
					if (typeof options.design !== 'undefined') {
						this.design.adjust({
							proxy: options.proxy,
							...options.design
						});
					}
					if (typeof options.captcha !== 'undefined' && options.captcha.service === 'google' && typeof options.captcha.recaptcha !== 'undefined') {
						this.recaptcha.adjust(options.captcha.recaptcha);
					}
					if (typeof options.captcha !== 'undefined' && options.captcha.service === 'yandex' && typeof options.captcha.yandexCaptcha !== 'undefined') {
						this.yandexCaptcha.adjust(options.captcha.yandexCaptcha);
					}
					if (Array.isArray(options.dependencies)) {
						_classPrivateFieldGet$1(_dependence, this).setDependencies(options.dependencies);
					}
					if (options.node) {
						this.node = options.node;
					}
					if (!this.node) {
						this.node = document.createElement('div');
						document.body.appendChild(this.node);
					}
					return options;
				}
			}, {
				key: "setView",
				value: function setView(options) {
					let view = typeof (options || '') === 'string' ? {
						type: options
					} : options;
					if (typeof view.type !== 'undefined') {
						this.view.type = ViewTypes.includes(view.type) ? view.type : 'inline';
					}
					if (typeof view.position !== 'undefined') {
						this.view.position = ViewPositions.includes(view.position) ? view.position : null;
					}
					if (typeof view.vertical !== 'undefined') {
						this.view.vertical = ViewVerticals.includes(view.vertical) ? view.vertical : null;
					}
					if (typeof view.title !== 'undefined') {
						this.view.title = view.title;
					}
					if (typeof view.delay !== 'undefined') {
						this.view.delay = parseInt(view.delay);
						this.view.delay = isNaN(this.view.delay) ? 0 : this.view.delay;
					}
					this.view.hideOnOverlayClick = typeof view.hideOnOverlayClick !== "undefined" ? Boolean(view.hideOnOverlayClick) : true;
				}
			}, {
				key: "setDate",
				value: function setDate(date) {
					if (typeof date !== 'object') {
						return;
					}
					if (date.dateFormat) {
						this.date.dateFormat = date.dateFormat;
					}
					if (date.dateTimeFormat) {
						this.date.dateTimeFormat = date.dateTimeFormat;
					}
					if (typeof date.sundayFirstly !== 'undefined') {
						this.date.sundayFirstly = date.sundayFirstly;
					}
				}
			}, {
				key: "setCurrency",
				value: function setCurrency(currency) {
					if (typeof currency !== 'object') {
						return;
					}
					if (currency.code) {
						this.currency.code = currency.code;
					}
					if (currency.title) {
						this.currency.title = currency.title;
					}
					if (currency.format) {
						this.currency.format = currency.format;
					}
				}
			}, {
				key: "setFields",
				value: function setFields(fieldOptionsList) {
					_classPrivateFieldSet$1(_fields, this, []);
					let page = new Page(this.title);
					this.pager = new Navigation();
					this.pager.add(page);
					fieldOptionsList.forEach(options => {
						switch (options.type) {
							case 'page':
								page = new Page(options.label || this.title);
								this.pager.add(page);
								return;
							case 'date':
							case 'datetime':
							case 'rq':
								options.format = options.type === 'date' ? this.date.dateFormat : this.date.dateTimeFormat;
								options.sundayFirstly = this.date.sundayFirstly;
								break;
							case 'product':
								options.currency = this.currency;
								break;
						}
						if (Array.isArray(options.items) && options.items.length > 0) {
							options.items = options.items.filter(item => !item.disabled);
						}
						options.messages = this.messages;
						options.design = this.design;
						let field = Factory.create(options);
						field.subscribeAll((data, obj, type) => {
							this.emit('field:' + type, {
								data,
								type,
								field: obj
							});
						});
						page.fields.push(field);
						_classPrivateFieldGet$1(_fields, this).push(field);
					});
					this.pager.removeEmpty();
					this.basket = new Basket(_classPrivateFieldGet$1(_fields, this), this.currency);
					this.disabled = !this.pager.current() || this.pager.current().fields.length === 0;
				}
			}, {
				key: "getId",
				value: function getId() {
					return _classPrivateFieldGet$1(_id, this);
				}
			}, {
				key: "valid",
				value: function valid() {
					this.validated = true;
					return _classPrivateFieldGet$1(_fields, this).filter(field => !field.valid()).length === 0 && this.agreements.every(field => field.requestConsent());
				}
			}, {
				key: "values",
				value: function values() {
					return _classPrivateFieldGet$1(_fields, this).filter(field => field.visible).reduce((acc, field) => {
						acc[field.name] = field.values();
						return acc;
					}, {});
				}
			}, {
				key: "getFields",
				value: function getFields() {
					return _classPrivateFieldGet$1(_fields, this);
				}
			}, {
				key: "setProperty",
				value: function setProperty(key, value) {
					if (!key || typeof key !== 'string') {
						return;
					}
					if (value && value.toString) {
						value = value.toString();
					}
					if (typeof value !== 'string') {
						value = '';
					}
					_classPrivateFieldGet$1(_properties, this)[key] = value;
				}
			}, {
				key: "getProperty",
				value: function getProperty(key) {
					return _classPrivateFieldGet$1(_properties, this)[key];
				}
			}, {
				key: "getProperties",
				value: function getProperties() {
					return _classPrivateFieldGet$1(_properties, this);
				}
			}, {
				key: "isOnState",
				value: function isOnState() {
					return this.disabled || this.error || this.sent || this.loading;
				}
			}, {
				key: "render",
				value: function render() {
					//this.node.innerHTML = '';
					_classPrivateFieldSet$1(_vue, this, new Vue({
						el: this.node,
						components: Definition,
						data: {
							form: this,
							flags: {
								hideEars: false
							}
						},
						template: `
				<component v-bind:is="'b24-form-' + form.view.type"
					:key="form.id"
					:form="form"
				>
					<b24-form
						v-bind:key="form.id"
						v-bind:form="form"
					></b24-form>
				</component>			
			`
					}));
				}
			}, {
				key: "destroy",
				value: function destroy() {
					this.emit(EventTypes.destroy);
					this.unsubscribeAll();
					_classPrivateFieldGet$1(_vue, this).$destroy();
					_classPrivateFieldGet$1(_vue, this).$el.remove();
					_classPrivateFieldSet$1(_vue, this, null);
				}
			}]);
		}(Event);
		function _focusFirstInvalidField(field) {
			setTimeout(() => {
				const fieldId = Aria.getFieldId(field);
				const fieldElement = document.getElementById(fieldId);
				const focusableElement = fieldElement?.querySelector('input, textarea, select, [tabindex="0"]') || fieldElement;
				focusableElement?.focus();
			}, 100);
		}

		function performEventOfWidgetFormInit(b24options, options) {
			const compatibleData = createEventData(b24options);
			BX.SiteButton.onWidgetFormInit(compatibleData);
			applyOldenLoaderData(options, compatibleData);
		}
		function applyOldenLoaderData(options, oldenLoaderData) {
			if (options.fields && typeof oldenLoaderData.fields === 'object' && typeof oldenLoaderData.fields.values === 'object') {
				Object.keys(oldenLoaderData.fields.values).forEach(key => {
					options.fields.filter(field => field.name === key).forEach(field => field.value = oldenLoaderData.fields.values[key]);
				});
			}
			if (typeof oldenLoaderData.presets === 'object') {
				options.properties = options.properties || {};
				Object.keys(oldenLoaderData.presets).forEach(key => {
					options.properties[key] = oldenLoaderData.presets[key];
				});
			}
			if (oldenLoaderData.type === 'auto' && oldenLoaderData.delay) {
				if (typeof options.view === 'object' && parseInt(oldenLoaderData.delay) > 0) {
					options.view.delay = parseInt(oldenLoaderData.delay);
				}
			}
			if (typeof oldenLoaderData.handlers === 'object') {
				options.handlers = options.handlers || {};
				Object.keys(oldenLoaderData.handlers).forEach(key => {
					const value = oldenLoaderData.handlers[key];
					if (typeof value !== "function") {
						return;
					}
					let type;
					let handler;
					switch (key) {
						case 'load':
							type = EventTypes.init;
							handler = (data, form) => {
								value(oldenLoaderData, form);
							};
							break;
						case 'fill':
							type = EventTypes.fieldBlur;
							handler = data => {
								const field = data.field;
								value(field.name, field.values());
							};
							break;
						case 'send':
							type = EventTypes.sendSuccess;
							if (typeof value === "function") {
								handler = (data, form) => {
									value(Object.assign(form.getFields().reduce((acc, field) => {
										acc[field.name] = field.multiple ? field.values() : field.value();
										return acc;
									}, {}), data || {}), form);
								};
							}
							break;
						case 'unload':
							type = EventTypes.destroy;
							handler = (data, form) => {
								value(oldenLoaderData, form);
							};
							break;
					}
					if (type) {
						options.handlers[type] = handler ? handler : value;
					}
				});
			}
		}
		function createEventData(b24options) {
			return {
				id: b24options.id,
				sec: b24options.sec,
				lang: b24options.lang,
				address: b24options.address,
				handlers: {},
				presets: {},
				fields: {
					values: {}
				}
			};
		}

		var compatibility = /*#__PURE__*/Object.freeze({
				__proto__: null,
				applyOldenLoaderData: applyOldenLoaderData,
				performEventOfWidgetFormInit: performEventOfWidgetFormInit
		});

		function _classPrivateFieldInitSpec(e, t, a) { _checkPrivateRedeclaration(e, t), t.set(e, a); }
		function _checkPrivateRedeclaration(e, t) { if (t.has(e)) throw new TypeError("Cannot initialize the same private elements twice on an object"); }
		function _classPrivateFieldSet(s, a, r) { return s.set(_assertClassBrand(s, a), r), r; }
		function _classPrivateFieldGet(s, a) { return s.get(_assertClassBrand(s, a)); }
		function _assertClassBrand(e, t, n) { if ("function" == typeof e ? e === t : e.has(t)) return arguments.length < 3 ? t : n; throw new TypeError("Private element is not present on this object"); }
		var _forms = /*#__PURE__*/new WeakMap();
		var _userProviderPromise = /*#__PURE__*/new WeakMap();
		let Application = /*#__PURE__*/function () {
			function Application() {
				babelHelpers.classCallCheck(this, Application);
				_classPrivateFieldInitSpec(this, _forms, []);
				_classPrivateFieldInitSpec(this, _userProviderPromise, void 0);
			}
			return babelHelpers.createClass(Application, [{
				key: "list",
				value: function list() {
					return _classPrivateFieldGet(_forms, this);
				}
			}, {
				key: "get",
				value: function get(id) {
					return _classPrivateFieldGet(_forms, this).filter(form => {
						return form.getId() === id;
					})[0];
				}
			}, {
				key: "create",
				value: function create(options) {
					const form = new Controller(options);
					_classPrivateFieldGet(_forms, this).push(form);
					return form;
				}
			}, {
				key: "remove",
				value: function remove(id) {
					_classPrivateFieldSet(_forms, this, _classPrivateFieldGet(_forms, this).filter(form => form.getId() !== id));
				}
			}, {
				key: "post",
				value: function post(uri, body, headers) {
					return window.fetch(uri, {
						method: 'POST',
						mode: 'cors',
						cache: 'no-cache',
						headers: Object.assign(headers || {}, {
							'Origin': window.location.origin
						}),
						body: body
					});
				}
			}, {
				key: "createForm24",
				value: function createForm24(b24options, options) {
					options.provider = options.provider || {};
					if (!options.provider.user) {
						options.provider.user = this.getUserProvider24(b24options, options);
					}
					if (!options.provider.entities) {
						let entities = b24form.util.url.parameter.get('b24form_entities');
						if (entities) {
							entities = JSON.parse(entities);
							if (typeof entities === 'object') {
								options.provider.entities = entities;
							}
						}
					}
					options.provider.submit = this.getSubmitProvider24(b24options);
					options.analyticsHandler = this.getAnalyticsSender(b24options);
					if (b24options.lang) {
						options.language = b24options.lang;
					}
					options.proxy = b24form.common?.properties?.proxy || {};
					options.abuse = b24form.common?.properties?.abuse || {};
					options.languages = b24form.common.languages || [];
					options.messages = options.messages || {};
					options.messages = Object.assign(b24form.common.messages, options.messages || {});
					options.identification = {
						type: 'b24',
						id: b24options.id,
						sec: b24options.sec,
						address: b24options.address
					};
					const instance = this.create(options);
					instance.subscribe(EventTypes.destroy, () => this.remove(instance.getId()));
					return instance;
				}
			}, {
				key: "createWidgetForm24",
				value: function createWidgetForm24(b24options, options) {
					let pos = parseInt(BX.SiteButton.config.location) || 4;
					let positions = {
						1: ['left', 'top'],
						2: ['center', 'top'],
						3: ['right', 'top'],
						4: ['right', 'bottom'],
						5: ['center', 'bottom'],
						6: ['left', 'bottom']
					};
					options.view = {
						type: (options.fields || []).length + (options.agreements || []).length <= 3 ? 'widget' : 'panel',
						position: positions[pos][0],
						vertical: positions[pos][1]
					};
					performEventOfWidgetFormInit(b24options, options);
					const instance = this.createForm24(b24options, options);
					instance.subscribe(EventTypes.hide, () => BX.SiteButton.onWidgetClose());
					return instance;
				}
			}, {
				key: "getUserProvider24",
				value: function getUserProvider24(b24options) {
					let signTtl = 3600 * 24;
					let sign = b24form.util.url.parameter.get('b24form_data');
					if (!sign) {
						sign = b24form.util.url.parameter.get('b24form_user');
						if (sign) {
							b24options.sign = sign;
							if (b24form.util.ls.getItem('b24-form-sign', signTtl)) {
								sign = null;
							}
						}
					}
					const eventData = {
						sign
					};
					dispatchEvent(new CustomEvent('b24:form:app:user:init', {
						detail: {
							object: this,
							data: eventData
						}
					}));
					sign = eventData.sign;
					let ttl = 3600 * 24 * 28;
					if (!sign) {
						if (b24form.user && typeof b24form.user === 'object') {
							b24options.entities = b24options.entities || b24form.user.entities || [];
							return b24form.user.fields || {};
						}
						try {
							let user = b24form.util.ls.getItem('b24-form-user', ttl);
							if (user !== null && typeof user === 'object') {
								return user.fields || {};
							}
						} catch (e) {}
					}
					if (_classPrivateFieldGet(_userProviderPromise, this)) {
						return _classPrivateFieldGet(_userProviderPromise, this);
					}
					if (!sign) {
						return null;
					}
					b24options.sign = sign;
					b24form.util.ls.setItem('b24-form-sign', sign, signTtl);
					let formData = new FormData();
					formData.set('id', b24options.id);
					formData.set('sec', b24options.sec);
					formData.set('security_sign', b24options.sign);
					_classPrivateFieldSet(_userProviderPromise, this, this.post(b24options.address + '/bitrix/services/main/ajax.php?action=crm.site.user.get', formData).then(response => {
						return response.json();
					}).then(data => {
						if (data.error) {
							throw new Error(data.error_description || data.error);
						}
						data = data.result;
						data = data && typeof data === 'object' ? data : {};
						data.fields = data && typeof data.fields === 'object' ? data.fields : {};
						let properties = data.properties || {};
						delete data.properties;
						this.list().filter(form => form.identification.id === b24options.id).forEach(form => {
							Object.keys(properties).forEach(key => form.setProperty(key, properties[key]));
						});
						b24form.util.ls.setItem('b24-form-user', data, ttl);
						dispatchEvent(new CustomEvent('b24:form:app:user:loaded', {
							detail: {
								object: this,
								data: {}
							}
						}));
						return data.fields;
					}));
					return _classPrivateFieldGet(_userProviderPromise, this);
				}
			}, {
				key: "getSubmitProvider24",
				value: function getSubmitProvider24(b24options) {
					return (form, formData) => {
						let trace = b24options.usedBySiteButton && BX.SiteButton ? BX.SiteButton.getTrace() : window.b24Tracker && b24Tracker.guest ? b24Tracker.guest.getTrace() : null;
						const eventData = {
							id: b24options.id,
							sec: b24options.sec,
							language: b24options.language,
							sign: b24options.sign
						};
						form.emit('submit:post:before', eventData);
						formData.set('id', b24options.id);
						formData.set('sec', b24options.sec);
						formData.set('lang', form.language);
						formData.set('trace', trace);
						formData.set('entities', JSON.stringify(b24options.entities || []));
						formData.set('security_sign', eventData.sign || b24options.sign);
						return this.post(b24options.address + '/bitrix/services/main/ajax.php?action=crm.site.form.fill', formData).then(response => {
							return response.json();
						}).then(data => {
							if (data.error) {
								throw new Error(data.error_description || data.error);
							}
							data = data.result;
							if (data && data.gid && window.b24Tracker && b24Tracker.guest && b24Tracker.guest.setGid) {
								b24Tracker.guest.setGid(data.gid);
							}
							return new Promise(resolve => {
								resolve(data);
							});
						});
					};
				}
			}, {
				key: "initFormScript24",
				value: function initFormScript24(b24options) {
					if (b24options.usedBySiteButton) {
						this.createWidgetForm24(b24options, Conv.cloneDeep(b24options.data));
						return;
					}
					let nodes = document.querySelectorAll('script[data-b24-form]');
					nodes = Array.prototype.slice.call(nodes);
					nodes.forEach(node => {
						if (node.hasAttribute('data-b24-loaded')) {
							return;
						}
						let attributes = node.getAttribute('data-b24-form').split('/');
						if (attributes[1] !== b24options.id || attributes[2] !== b24options.sec) {
							return;
						}
						node.setAttribute('data-b24-loaded', true);
						const options = Conv.cloneDeep(b24options.data);
						const id = node.getAttribute('data-b24-id');
						if (id) {
							options.id = id;
						}
						switch (attributes[0]) {
							case 'auto':
								setTimeout(() => {
									this.createForm24(b24options, Object.assign(options, {
										view: b24options.views.auto
									})).show();
								}, (b24options.views.auto.delay || 1) * 1000);
								break;
							case 'click':
								let clickElement = node.nextElementSibling;
								const buttonUseMode = b24options?.views?.click?.button?.use === '1';
								if (buttonUseMode) {
									const newButton = Button.create(b24options);
									node.after(newButton);
									clickElement = newButton.querySelector('.b24-form-click-btn');
								}
								if (clickElement) {
									let form;
									clickElement.addEventListener('click', () => {
										if (!form) {
											form = this.createForm24(b24options, Object.assign(options, {
												view: b24options.views.click
											}));
										}
										form.show();
									});
								}
								break;
							default:
								let target = document.createElement('div');
								node.parentElement.insertBefore(target, node);
								this.createForm24(b24options, Object.assign(options, {
									node: target
								}));
								break;
						}
					});
				}
			}, {
				key: "getAnalyticsSender",
				value: function getAnalyticsSender(b24options) {
					return (counter, formId) => {
						if (window.sessionStorage) {
							const key = `b24-analytics-counter-${formId}-${counter}`;
							if (sessionStorage.getItem(key) === 'y') {
								return Promise.resolve([]);
							}
							sessionStorage.setItem(key, 'y');
						}
						const formData = new FormData();
						formData.append('counter', counter);
						formData.append('formId', formId);
						return this.post(b24options.address + '/bitrix/services/main/ajax.php?action=crm.site.form.handleAnalytics', formData).then(response => {
							return response.json();
						}).then(data => {
							if (data.error) {
								throw new Error(data.error_description || data.error);
							}
							return new Promise(resolve => {
								resolve(data);
							});
						});
					};
				}
			}]);
		}();
		const App = new Application();

		exports.App = App;
		exports.Compatibility = compatibility;

})(this.b24form = this.b24form || {});
