/* eslint-disable */
interface AdjustData {
	attrs?: Record<string, string>;
	style?: Record<string, string | number>;
	props?: Record<string, unknown>;
	events?: Record<string, EventListenerOrEventListenerObject>;
	dataset?: Record<string, string>;
	children?: string | Array<Node | string>;
	text?: string;
	html?: string;
}

interface CreateOptions extends AdjustData {
	tag?: string;
}

type GlobalEventMap = HTMLElementEventMap & WindowEventMap & DocumentEventMap;

type RegistryEventListener = {
	listener: EventListenerOrEventListenerObject;
	type: string;
};

type LoadExtensionResult = Promise<Array<ExtensionExports>>;

type ExtensionExports = {
	[key: string]: any;
};

type MemoryStorage<K, T> = Map<K, T>;

type ZIndexComponentOptions = {
	alwaysOnTop?: boolean | number;
	overlay?: HTMLElement;
	overlayGap?: number;
	events?: {
		[eventName: string]: (event: BX.BaseEvent) => void;
	};
};

type EasingOptions = {
	duration?: number;
	start?: Record<string, number>;
	finish?: Record<string, number>;
	transition?: TransitionFunction | 'linear' | 'ease-out-linear' | 'ease-in-out-linear' | 'quad' | 'ease-out-quad' | 'ease-in-out-quad' | 'cubic' | 'ease-out-cubic' | 'ease-in-out-cubic' | 'quart' | 'ease-out-quart' | 'ease-in-out-quart' | 'quint' | 'ease-out-quint' | 'ease-in-out-quint' | 'circ' | 'ease-out-circ' | 'ease-in-out-circ' | 'back' | 'ease-out-back' | 'ease-in-out-back' | 'elasti' | 'ease-out-elasti' | 'ease-in-out-elasti' | 'bounce' | 'ease-out-bounce' | 'ease-in-out-bounce';
	begin?: (state: Record<string, number>) => void;
	step?: (state: Record<string, number>) => void;
	complete?: (state: Record<string, number>) => void;
	progress?: (progress: number) => void;
};

type TransitionFunction = (progress: number) => number;

type LocalStorageOptions = {
	prefix?: string;
};

type JsonValue = string | number | boolean | {
	[x: string]: JsonValue;
} | Array<JsonValue>;

type PageRedirectOptions = {
	replaceHistory?: boolean;
	allowedOrigins?: string[];
	newTab?: boolean;
};

interface MessageFunction {
	(value: MessageParam): string | boolean | void;
	[key: string]: any;
}

type MessageParam = string | Record<string, string | number>;

type FXOptions = {
	start: number | Record<string, number>;
	finish: number | Record<string, number>;
	time?: number;
	type?: 'linear' | 'accelerated' | 'decelerated' | Function;
	callback?: Function;
	callback_start?: Function;
	callback_complete?: Function;
	step?: number;
	allowFloat?: boolean;
};

type JsonObject = Record<string, JsonValue>;

type AjaxResponse<DataType> = {
	status: 'success' | 'error' | 'denied';
	errors: AjaxError[];
	data: DataType;
};

type AjaxError = {
	message: string;
	code: string | number;
	customData: JsonObject | null;
};

declare namespace BX {
	/**
	 * @memberOf BX
	 */
	class Type {
		/**
		 * Checks that value is string
		 * @param value
		 * @return {boolean}
		 */
		static isString(value: unknown): value is string;
		/**
		 * Returns true if a value is not empty string
		 * @param value
		 * @returns {boolean}
		 */
		static isStringFilled(value: unknown): value is string;
		/**
		 * Checks that value is function
		 * @param value
		 * @return {boolean}
		 */
		static isFunction(value: unknown): value is Function;
		/**
		 * Checks that value is object
		 * @param value
		 * @return {boolean}
		 */
		static isObject(value: unknown): value is object;
		/**
		 * Checks that value is object like
		 * @param value
		 * @return {boolean}
		 */
		static isObjectLike(value: unknown): value is Record<string, unknown>;
		/**
		 * Checks that value is plain object
		 * @param value
		 * @return {boolean}
		 */
		static isPlainObject(value: unknown): value is Record<string, unknown>;
		/**
		 * Checks that value is boolean
		 * @param value
		 * @return {boolean}
		 */
		static isBoolean(value: unknown): value is boolean;
		/**
		 * Checks that value is number
		 * @param value
		 * @return {boolean}
		 */
		static isNumber(value: unknown): value is number;
		/**
		 * Checks that value is integer
		 * @param value
		 * @return {boolean}
		 */
		static isInteger(value: unknown): value is number;
		/**
		 * Checks that value is float
		 * @param value
		 * @return {boolean}
		 */
		static isFloat(value: unknown): value is number;
		/**
		 * Checks that value is nil
		 * @param value
		 * @return {boolean}
		 */
		static isNil(value: unknown): value is null | undefined;
		/**
		 * Checks that value is array
		 * @param value
		 * @return {boolean}
		 */
		static isArray<T = unknown>(value: unknown): value is T[];
		/**
		 * Returns true if a value is an array, and it has at least one element
		 * @param value
		 * @returns {boolean}
		 */
		static isArrayFilled<T = unknown>(value: unknown): value is [T, ...T[]];
		/**
		 * Checks that value is array like
		 * @param value
		 * @return {boolean}
		 */
		static isArrayLike(value: unknown): value is ArrayLike<unknown>;
		/**
		 * Checks that value is Date
		 * @param value
		 * @return {boolean}
		 */
		static isDate(value: unknown): value is Date;
		/**
		 * Checks that is DOM node
		 * @param value
		 * @return {boolean}
		 */
		static isDomNode(value: unknown): value is Node;
		/**
		 * Checks that value is element node
		 * @param value
		 * @return {boolean}
		 */
		static isElementNode(value: unknown): value is HTMLElement;
		/**
		 * Checks that value is EventTarget like object
		 * @param value
		 * @return {boolean}
		 */
		static isEventTargetLike(value: unknown): value is EventTarget;
		/**
		 * Checks that value is text node
		 * @param value
		 * @return {boolean}
		 */
		static isTextNode(value: unknown): value is Text;
		/**
		 * Checks that value is Map
		 * @param value
		 * @return {boolean}
		 */
		static isMap<K = unknown, V = unknown>(value: unknown): value is Map<K, V>;
		/**
		 * Checks that value is Set
		 * @param value
		 * @return {boolean}
		 */
		static isSet<T = unknown>(value: unknown): value is Set<T>;
		/**
		 * Checks that value is WeakMap
		 * @param value
		 * @return {boolean}
		 */
		static isWeakMap<K extends WeakKey = WeakKey, V = unknown>(value: unknown): value is WeakMap<K, V>;
		/**
		 * Checks that value is WeakSet
		 * @param value
		 * @return {boolean}
		 */
		static isWeakSet<T extends WeakKey = WeakKey>(value: unknown): value is WeakSet<T>;
		/**
		 * Checks that value is prototype
		 * @param value
		 * @return {boolean}
		 */
		static isPrototype(value: unknown): boolean;
		/**
		 * Checks that value is regexp
		 * @param value
		 * @return {boolean}
		 */
		static isRegExp(value: unknown): value is RegExp;
		/**
		 * Checks that value is null
		 * @param value
		 * @return {boolean}
		 */
		static isNull(value: unknown): value is null;
		/**
		 * Checks that value is undefined
		 * @param value
		 * @return {boolean}
		 */
		static isUndefined(value: unknown): value is undefined;
		/**
		 * Checks that value is ArrayBuffer
		 * @param value
		 * @return {boolean}
		 */
		static isArrayBuffer(value: unknown): value is ArrayBuffer;
		/**
		 * Checks that value is typed array
		 * @param value
		 * @return {boolean}
		 */
		static isTypedArray(value: unknown): boolean;
		/**
		 * Checks that value is Blob
		 * @param value
		 * @return {boolean}
		 */
		static isBlob(value: unknown): value is Blob;
		/**
		 * Checks that value is File
		 * @param value
		 * @return {boolean}
		 */
		static isFile(value: unknown): value is File;
		/**
		 * Checks that value is FormData
		 * @param value
		 * @return {boolean}
		 */
		static isFormData(value: unknown): value is FormData;
		static isJsonValue(value: unknown): boolean;
	}

	/**
	 * @memberOf BX
	 */
	class Reflection {
		/**
		 * Gets link to function by function name
		 * @param className
		 * @return {?Function}
		 */
		static getClass(className: string | Function): Function | null;
		/**
		 * Creates a namespace or returns a link to a previously created one
		 * @param {String} namespaceName
		 * @return {Record<string, any> | Function | null}
		 */
		static namespace(namespaceName: string): Record<string, any> | Function;
	}

	/**
	 * @memberOf BX
	 */
	class Text {
		/**
		 * Encodes all unsafe entities
		 * @param {string} value
		 * @return {string}
		 */
		static encode(value: string): string;
		/**
		 * Decodes all encoded entities
		 * @param {string} value
		 * @return {string}
		 */
		static decode(value: string): string;
		static getRandom(length?: number): string;
		static toNumber(value: unknown): number;
		static toInteger(value: unknown): number;
		static toBoolean(value: unknown, trueValues?: readonly unknown[]): boolean;
		static toCamelCase(str: string): string;
		static toPascalCase(str: string): string;
		static toKebabCase(str: string): string;
		static capitalize(str: string): string;
	}

	/**
	 * @memberOf BX
	 */
	class Dom {
		/**
		 * Replaces old html element to new html element
		 * @param oldElement
		 * @param newElement
		 */
		static replace(oldElement: HTMLElement | null | undefined, newElement: HTMLElement | null | undefined): void;
		/**
		 * Removes element
		 * @param element
		 */
		static remove(element: HTMLElement | null | undefined): void;
		/**
		 * Cleans element
		 * @param element
		 */
		static clean(element: HTMLElement | string | null): void;
		/**
		 * Inserts element before target element
		 * @param current
		 * @param target
		 */
		static insertBefore(current: HTMLElement | null | undefined, target: HTMLElement | null | undefined): void;
		/**
		 * Inserts element after target element
		 * @param current
		 * @param target
		 */
		static insertAfter(current: HTMLElement | null | undefined, target: HTMLElement | null | undefined): void;
		/**
		 * Appends element to target element
		 * @param current
		 * @param target
		 */
		static append(current: HTMLElement | null | undefined, target: HTMLElement | null | undefined): void;
		/**
		 * Prepends element to target element
		 * @param current
		 * @param target
		 */
		static prepend(current: HTMLElement | null | undefined, target: HTMLElement | null | undefined): void;
		/**
		 * Checks that element contains class name or class names
		 * @param element
		 * @param className
		 * @return {Boolean}
		 */
		static hasClass(element: unknown, className: string | string[]): boolean;
		/**
		 * Adds class name
		 * @param element
		 * @param className
		 */
		static addClass(element: unknown, className: string | string[]): void;
		/**
		 * Removes class name
		 * @param element
		 * @param className
		 */
		static removeClass(element: unknown, className: string | string[]): void;
		/**
		 * Toggles class name
		 */
		static toggleClass(element: HTMLElement, className: string | string[], force?: boolean): void;
		/**
		 * Styles element
		 */
		static style(element: HTMLElement | null | undefined, prop: string | null | undefined | Record<string, string | number>, value?: string | number | null): string | number | Element | null | undefined;
		/**
		 * Adjusts element
		 * @param target
		 * @param data
		 * @return {*}
		 */
		static adjust(target: HTMLElement | Document, data?: AdjustData): HTMLElement | null;
		/**
		 * Creates element
		 * @param tag
		 * @param data
		 * @param context
		 * @return {HTMLElement|HTMLBodyElement}
		 */
		static create(tag: string | CreateOptions, data?: AdjustData, context?: Document): HTMLElement | null;
		/**
		 * Shows element
		 * @param element
		 */
		static show(element: HTMLElement | null | undefined): void;
		/**
		 * Hides element
		 * @param element
		 */
		static hide(element: HTMLElement | null | undefined): void;
		/**
		 * Checks that element is shown
		 * @param element
		 * @return {*|boolean}
		 */
		static isShown(element: HTMLElement | null | undefined): boolean;
		/**
		 * Checks if element is shown with recursive check of its ancestors
		 */
		static isShownRecursive(element: HTMLElement | null | undefined): boolean;
		/**
		 * Toggles element visibility
		 * @param element
		 */
		static toggle(element: HTMLElement): void;
		/**
		 * Gets element position relative page
		 * @param {HTMLElement} element
		 * @return {DOMRect}
		 */
		static getPosition(element: HTMLElement): DOMRect;
		/**
		 * Gets element position relative specified element position
		 * @param {HTMLElement} element
		 * @param {HTMLElement} relationElement
		 * @return {DOMRect}
		 */
		static getRelativePosition(element: HTMLElement, relationElement: HTMLElement): DOMRect;
		static attr(element: HTMLElement | null | undefined, attr: string | Record<string, unknown>, value?: unknown): any;
	}

	/**
	 * @memberOf BX
	 */
	class Browser {
		static isOpera(): boolean;
		static isIE(): boolean;
		static isIE6(): boolean;
		static isIE7(): boolean;
		static isIE8(): boolean;
		static isIE9(): boolean;
		static isIE10(): boolean;
		static isSafari(): boolean;
		static isFirefox(): boolean;
		static isChrome(): boolean;
		static detectIEVersion(): number;
		static isIE11(): boolean;
		static isMac(): boolean;
		static isWin(): boolean;
		static isLinux(): boolean;
		static isAndroid(): boolean;
		static isIPad(): boolean;
		static isIPhone(): boolean;
		static isIOS(): boolean;
		static isMobile(): boolean;
		static isRetina(): boolean;
		static isTouchDevice(): boolean;
		static isDoctype(target?: Document): boolean;
		static isLocalStorageSupported(): boolean;
		static addGlobalClass(target?: Element): void;
		static detectAndroidVersion(): number;
		static isPropertySupported(jsProperty: string, returnCSSName?: boolean): string | false;
		static addGlobalFeatures(features: unknown): void;
	}

	/**
	 * @memberOf BX
	 */
	class Event {
		static bind: typeof bind;
		static bindOnce: typeof bindOnce;
		static unbind: typeof unbind;
		static unbindAll: typeof unbindAll;
		static ready: typeof ready;
		static getEventListeners: typeof getEventListeners;
		static EventEmitter: typeof EventEmitter;
		static BaseEvent: typeof BaseEvent;
	}

	function bind<K extends keyof GlobalEventMap>(target: EventTarget, eventName: K, listener: (event: GlobalEventMap[K]) => void, options?: boolean | AddEventListenerOptions): void;

	function bind(target: EventTarget, eventName: string, handler: EventListenerOrEventListenerObject | null, options?: AddEventListenerOptions | boolean): void;

	function bindOnce<K extends keyof GlobalEventMap>(target: EventTarget, eventName: K, listener: (event: GlobalEventMap[K]) => void, options?: boolean | AddEventListenerOptions): void;

	function bindOnce(target: EventTarget, eventName: string, handler: EventListenerOrEventListenerObject | null, options?: AddEventListenerOptions | boolean): void;

	function unbind<K extends keyof GlobalEventMap>(target: EventTarget, eventName: K, listener: (event: GlobalEventMap[K]) => void, options?: boolean | AddEventListenerOptions): void;

	function unbind(target: EventTarget, eventName: string, handler: EventListenerOrEventListenerObject | null, options?: AddEventListenerOptions | boolean): void;

	function unbindAll(target: any, eventName?: string): void;

	function ready(handler: () => void): void;

	function getEventListeners(target: EventTarget, eventName: string): Array<RegistryEventListener>;

	class EventEmitter {
		[key: symbol]: any;
		static GLOBAL_TARGET: {
			GLOBAL_TARGET: string;
		};
		static DEFAULT_MAX_LISTENERS: number;
		/** @private */
		static sequenceValue: number;
		constructor(...args: any[]);
		/**
		 * Makes a target observable
		 * @param {object} target
		 * @param {string} namespace
		 */
		static makeObservable(target: any, namespace: string): void;
		setEventNamespace(namespace: any): void;
		getEventNamespace(): string | null;
		/**
		 * Subscribes listener on specified global event
		 * @param {object} target
		 * @param {string} eventName
		 * @param {Function<BaseEvent>} listener
		 * @param {object} options
		 */
		static subscribe(target: any, eventName: any, listener?: any, options?: any): void;
		/**
		 * Subscribes a listener on a specified event
		 * @param {string} eventName
		 * @param {Function<BaseEvent>} listener
		 * @return {this}
		 */
		subscribe(eventName: string, listener: (event: BaseEvent) => void): this;
		/**
		 *
		 * @param {object} options
		 * @param {object} [aliases]
		 * @param {boolean} [compatMode=false]
		 */
		subscribeFromOptions(options: {
			[eventName: string]: Function;
		} | Array<{
			[eventName: string]: Function;
		}>, aliases?: {
			[alias: string]: {
				eventName: string;
				namespace: string;
			};
		}, compatMode?: boolean): void;
		/**
		 * Subscribes a listener that is called at
		 * most once for a specified event.
		 * @param {object} target
		 * @param {string} eventName
		 * @param {Function<BaseEvent>} listener
		 */
		static subscribeOnce(target: any, eventName: any, listener?: any): void;
		/**
		 * Subscribes a listener that is called at most once for a specified event.
		 * @param {string} eventName
		 * @param {Function<BaseEvent>} listener
		 * @return {this}
		 */
		subscribeOnce(eventName: string, listener: (event: BaseEvent) => void): this;
		/**
		 * Unsubscribes an event listener
		 * @param {object} target
		 * @param {string} eventName
		 * @param {Function<BaseEvent>} listener
		 * @param options
		 */
		static unsubscribe(target: any, eventName: any, listener?: any, options?: any): void;
		/**
		 * Unsubscribes an event listener
		 * @param {string} eventName
		 * @param {Function<BaseEvent>} listener
		 * @return {this}
		 */
		unsubscribe(eventName: string, listener: (event: BaseEvent) => void): this;
		/**
		 * Unsubscribes all event listeners
		 * @param {object} target
		 * @param {string} eventName
		 * @param options
		 */
		static unsubscribeAll(target: any, eventName?: any, options?: any): void;
		/**
		 * Unsubscribes all event listeners
		 * @param {string} [eventName]
		 */
		unsubscribeAll(eventName?: string): void;
		/**
		 *
		 * @param {object} target
		 * @param {string} eventName
		 * @param {BaseEvent | any} event
		 * @param {object} options
		 * @returns {Array}
		 */
		static emit(target: any, eventName?: any, event?: any, options?: any): Array<any>;
		/**
		 * Emits specified event with specified event object
		 * @param {string} eventName
		 * @param {BaseEvent | any} event
		 * @return {this}
		 */
		emit(eventName: string, event?: BaseEvent | {
			[key: string]: any;
		}): this;
		/**
		 * Emits global event and returns a promise that is resolved when
		 * all promise returned from event handlers are resolved,
		 * or rejected when at least one of the returned promise is rejected.
		 * Importantly. You can return any value from synchronous handlers, not just promise
		 * @param {object} target
		 * @param {string} eventName
		 * @param {BaseEvent | any} event
		 * @return {Promise<Array>}
		 */
		static emitAsync(target: any, eventName?: any, event?: any): Promise<Array<any>>;
		/**
		 * Emits event and returns a promise that is resolved when
		 * all promise returned from event handlers are resolved,
		 * or rejected when at least one of the returned promise is rejected.
		 * Importantly. You can return any value from synchronous handlers, not just promise
		 * @param {string} eventName
		 * @param {BaseEvent|any} event
		 * @return {Promise<Array>}
		 */
		emitAsync(eventName: string, event?: BaseEvent | {
			[key: string]: any;
		}): Promise<Array<any>>;
		/**
		 * @private
		 * @param {object} target
		 * @param {string} eventName
		 * @param {BaseEvent|any} event
		 * @returns {BaseEvent}
		 */
		static prepareEvent(target: any, eventName: string, event?: BaseEvent | {
			[key: string]: any;
		}): BaseEvent;
		/**
		 * @private
		 * @returns {number}
		 */
		static getNextSequenceValue(): number;
		/**
		 * Sets max global events listeners count
		 * Event.EventEmitter.setMaxListeners(10) - sets the default value for all events (global target)
		 * Event.EventEmitter.setMaxListeners("onClose", 10) - sets the value for onClose event (global target)
		 * Event.EventEmitter.setMaxListeners(obj, 10) - sets the default value for all events (obj target)
		 * Event.EventEmitter.setMaxListeners(obj, "onClose", 10); - sets the value for onClose event (obj target)
		 * @return {void}
		 * @param args
		 */
		static setMaxListeners(...args: any[]): void;
		/**
		 * Sets max events listeners count
		 * this.setMaxListeners(10) - sets the default value for all events
		 * this.setMaxListeners("onClose", 10) sets the value for onClose event
		 * @return {this}
		 * @param args
		 */
		setMaxListeners(...args: any[]): this;
		/**
		 * Returns max event listeners count
		 * @param {object} target
		 * @param {string} [eventName]
		 * @returns {number}
		 */
		static getMaxListeners(target: any, eventName?: string): number;
		/**
		 * Returns max event listeners count
		 * @param {string} [eventName]
		 * @returns {number}
		 */
		getMaxListeners(eventName?: string): number;
		/**
		 * Adds or subtracts max listeners count
		 * Event.EventEmitter.addMaxListeners() - adds one max listener for all events of global target
		 * Event.EventEmitter.addMaxListeners(3) - adds three max listeners for all events of global target
		 * Event.EventEmitter.addMaxListeners(-1) - subtracts one max listener for all events of global target
		 * Event.EventEmitter.addMaxListeners('onClose') - adds one max listener for onClose event of global target
		 * Event.EventEmitter.addMaxListeners('onClose', 2) - adds two max listeners for onClose event of global target
		 * Event.EventEmitter.addMaxListeners('onClose', -1) - subtracts one max listener for onClose event of global target
		 *
		 * Event.EventEmitter.addMaxListeners(obj) - adds one max listener for all events of 'obj' target
		 * Event.EventEmitter.addMaxListeners(obj, 3) - adds three max listeners for all events of 'obj' target
		 * Event.EventEmitter.addMaxListeners(obj, -1) - subtracts one max listener for all events of 'obj' target
		 * Event.EventEmitter.addMaxListeners(obj, 'onClose') - adds one max listener for onClose event of 'obj' target
		 * Event.EventEmitter.addMaxListeners(obj, 'onClose', 2) - adds two max listeners for onClose event of 'obj' target
		 * Event.EventEmitter.addMaxListeners(obj, 'onClose', -1) - subtracts one max listener
		 *   for onClose event of 'obj' target
		 * @param args
		 * @returns {number}
		 */
		static addMaxListeners(...args: any[]): number;
		/**
		 * Increases max listeners count
		 *
		 * Event.EventEmitter.incrementMaxListeners() - adds one max listener for all events of global target
		 * Event.EventEmitter.incrementMaxListeners(3) - adds three max listeners for all events of global target
		 * Event.EventEmitter.incrementMaxListeners('onClose') - adds one max listener for onClose event of global target
		 * Event.EventEmitter.incrementMaxListeners('onClose', 2) - adds two max listeners for onClose event of global target
		 *
		 * Event.EventEmitter.incrementMaxListeners(obj) - adds one max listener for all events of 'obj' target
		 * Event.EventEmitter.incrementMaxListeners(obj, 3) - adds three max listeners for all events of 'obj' target
		 * Event.EventEmitter.incrementMaxListeners(obj, 'onClose') - adds one max listener for onClose event of 'obj' target
		 * Event.EventEmitter.incrementMaxListeners(obj, 'onClose', 2) - adds two max listeners
		 *   for onClose event of 'obj' target
		 */
		static incrementMaxListeners(...args: any[]): number;
		/**
		 * Increases max listeners count
		 * this.incrementMaxListeners() - adds one max listener for all events
		 * this.incrementMaxListeners(3) - adds three max listeners for all events
		 * this.incrementMaxListeners('onClose') - adds one max listener for onClose event
		 * this.incrementMaxListeners('onClose', 2) - adds two max listeners for onClose event
		 */
		incrementMaxListeners(...args: any[]): number;
		/**
		 * Decreases max listeners count
		 *
		 * Event.EventEmitter.decrementMaxListeners() - subtracts one max listener for all events of global target
		 * Event.EventEmitter.decrementMaxListeners(3) - subtracts three max listeners for all events of global target
		 * Event.EventEmitter.decrementMaxListeners('onClose') - subtracts one max listener for onClose event of global target
		 * Event.EventEmitter.decrementMaxListeners('onClose', 2) - subtracts two max listeners
		 *   for onClose event of global target
		 *
		 * Event.EventEmitter.decrementMaxListeners(obj) - subtracts one max listener
		 *   for all events of 'obj' target
		 * Event.EventEmitter.decrementMaxListeners(obj, 3) - subtracts three max listeners
		 *   for all events of 'obj' target
		 * Event.EventEmitter.decrementMaxListeners(obj, 'onClose') - subtracts one max listener
		 *   for onClose event of 'obj' target
		 * Event.EventEmitter.decrementMaxListeners(obj, 'onClose', 2) - subtracts two max listeners
		 *   for onClose event of 'obj' target
		 */
		static decrementMaxListeners(...args: any[]): number;
		/**
		 * Increases max listeners count
		 * this.decrementMaxListeners() - subtracts one max listener for all events
		 * this.decrementMaxListeners(3) - subtracts three max listeners for all events
		 * this.decrementMaxListeners('onClose') - subtracts one max listener for onClose event
		 * this.decrementMaxListeners('onClose', 2) - subtracts two max listeners for onClose event
		 */
		decrementMaxListeners(...args: any[]): number;
		/**
		 * @private
		 * @param {Array} args
		 * @returns Array
		 */
		static destructMaxListenersArgs(...args: any[]): any[];
		/**
		 * Gets listeners list for a specified event
		 * @param {object} target
		 * @param {string} eventName
		 */
		static getListeners(target: any, eventName?: any): Map<any, any>;
		/**
		 * Gets listeners list for specified event
		 * @param {string} eventName
		 */
		getListeners(eventName: string): Map<any, any>;
		/**
		 * Returns a full event name with namespace
		 * @param {string} eventName
		 * @returns {string}
		 */
		getFullEventName(eventName: string): string;
		/**
		 * Registers aliases (old event names for BX.onCustomEvent)
		 * @param aliases
		 */
		static registerAliases(aliases: any): void;
		/**
		 * @private
		 * @param aliases
		 */
		static normalizeAliases(aliases: any): Record<string, any>;
		/**
		 * @private
		 */
		static mergeEventAliases(aliases: Record<string, any>): void;
		/**
		 * Returns true if the target is an instance of Event.EventEmitter
		 * @param {object} target
		 * @returns {boolean}
		 */
		static isEventEmitter(target: any): boolean;
		/**
		 * @private
		 * @param {string} eventName
		 * @returns {string}
		 */
		static normalizeEventName(eventName: string): string;
		/**
		 * @private
		 */
		static normalizeListener(listener: any): Function;
		/**
		 * @private
		 * @param eventName
		 * @param target
		 * @param useGlobalNaming
		 * @returns {string}
		 */
		static resolveEventName(eventName: string, target: any, useGlobalNaming?: boolean): string;
		/**
		 * @private
		 * @param {string} namespace
		 * @param {string} eventName
		 * @returns {string}
		 */
		static makeFullEventName(namespace: string | null, eventName: string): string;
	}

	/**
	 * Implements base event object interface
	 */
	class BaseEvent<DataType = any> {
		type: string;
		data: DataType | null;
		target: any;
		compatData: Array<any> | null;
		defaultPrevented: boolean;
		immediatePropagationStopped: boolean;
		errors: Array<BaseError>;
		constructor(options?: {
			data?: any;
			compatData?: Array<any>;
		});
		static create(options: any): BaseEvent;
		/**
		 * Returns the name of the event
		 * @returns {string}
		 */
		getType(): string;
		/**
		 *
		 * @param {string} type
		 */
		setType(type: string): this;
		/**
		 * Returns an event data
		 */
		getData(): DataType | null;
		/**
		 * Sets an event data
		 * @param data
		 */
		setData(data: any): this;
		/**
		 * Returns arguments for BX.addCustomEvent handlers (deprecated).
		 * @returns {array | null}
		 */
		getCompatData(): Array<any> | null;
		/**
		 * Sets arguments for BX.addCustomEvent handlers (deprecated)
		 * @param data
		 */
		setCompatData(data: any): this;
		/**
		 * Sets a event target
		 * @param target
		 */
		setTarget(target: any): this;
		/**
		 * Returns a event target
		 */
		getTarget(): any;
		/**
		 * Returns an array of event errors
		 * @returns {[]}
		 */
		getErrors(): Array<BaseError>;
		/**
		 * Adds an error of the event.
		 * Event listeners can prevent emitter's default action and set the reason of this behavior.
		 * @param error
		 */
		setError(error: BaseError): void;
		/**
		 * Prevents default action
		 */
		preventDefault(): void;
		/**
		 * Checks that is default action prevented
		 * @return {boolean}
		 */
		isDefaultPrevented(): boolean;
		/**
		 * Stops event immediate propagation
		 */
		stopImmediatePropagation(): void;
		/**
		 * Checks that is immediate propagation stopped
		 * @return {boolean}
		 */
		isImmediatePropagationStopped(): boolean;
	}

	/**
	 * @memberOf BX
	 */
	class BaseError {
		[isError]: boolean;
		message: string;
		code: string | null;
		customData: unknown;
		constructor(message?: string, code?: string, customData?: unknown);
		/**
		 * Returns a brief description of the error
		 * @returns {string}
		 */
		getMessage(): string;
		/**
		 * Sets a message of the error
		 * @param {string} message
		 * @returns {this}
		 */
		setMessage(message?: string): this;
		/**
		 * Returns a code of the error
		 * @returns {?string}
		 */
		getCode(): string | null;
		/**
		 * Sets a code of the error
		 * @param {string} code
		 * @returns {this}
		 */
		setCode(code?: string | null): this;
		/**
		 * Returns custom data of the error
		 * @returns {null|*}
		 */
		getCustomData(): unknown;
		/**
		 * Sets custom data of the error
		 * @returns {this}
		 */
		setCustomData(customData: unknown): this;
		toString(): string;
		/**
		 * Returns true if the object is an instance of BaseError
		 * @param error
		 * @returns {boolean}
		 */
		static isError(error: unknown): error is BaseError;
	}

	const isError: unique symbol;

	/**
	 * @memberOf BX
	 */
	class Http {
		static Cookie: typeof Cookie;
		static Data: typeof Data;
	}

	class Cookie {
		/**
		 * Gets cookies list for current domain
		 * @return {object}
		 */
		static getList(): {
			[key: string]: string;
		};
		/**
		 * Gets cookie value
		 * @param {string} name
		 * @return {*}
		 */
		static get(name: string): string | undefined;
		/**
		 * Sets cookie
		 * @param {string} name
		 * @param {*} value
		 * @param {object} [options]
		 */
		static set(name: string, value: any, options?: Record<string, any>): void;
		/**
		 * Removes cookie
		 * @param {string} name
		 * @param {object} [options]
		 */
		static remove(name: string, options?: Record<string, any>): void;
	}

	class Data {
		/**
		 * Converts object to FormData
		 * @param source
		 * @return {FormData}
		 */
		static convertObjectToFormData(source: {
			[key: string]: any;
		}): FormData;
	}

	class Runtime {
		static debug: typeof debug;
		static loadExtension: typeof loadExtension;
		static registerExtension: typeof registerExtension;
		static clone: typeof clone;
		static debounce(func: Function, wait?: number, context?: any): Function;
		static throttle(func: Function, wait?: number, context?: any): Function;
		static html(node: HTMLElement, html: any, params?: Record<string, any>): Promise<any> | string;
		/**
		 * Merges objects or arrays
		 * @param targets
		 * @return {any}
		 */
		static merge(...targets: any[]): any;
		static orderBy(collection: Array<{
			[key: string]: any;
		}> | {
			[key: string]: {
				[key: string]: any;
			};
		}, fields?: Array<string>, orders?: Array<string>): {
			[key: string]: any;
		}[];
		static destroy(target: any, errorMessage?: string): void;
	}

	function debug(...args: any[]): void;

	function loadExtension(...name: Array<string | Array<string>>): LoadExtensionResult;

	function registerExtension(options: any): void;

	/**
	 * Clones any cloneable object
	 * @param value
	 * @return {*}
	 */
	function clone(value: any): any;

	/**
	 * Implements interface for works with language messages
	 * @memberOf BX
	 */
	class Loc {
		/**
		 * Gets message by id
		 * @param {string} messageId
		 * @param {object} replacements
		 * @return {?string}
		 */
		static getMessage(messageId: string, replacements?: Record<string, string> | null): string | null | undefined;
		static hasMessage(messageId: string): boolean;
		/**
		 * Sets message or messages
		 * @param {string | Record<string, string>} id
		 * @param {string} [value]
		 */
		static setMessage(id: string | Record<string, string>, value?: string): void;
		/**
		 * Gets plural message by id and number
		 * @param {string} messageId
		 * @param {number} value
		 * @param {object} [replacements]
		 * @return {?string}
		 */
		static getMessagePlural(messageId: string, value: number, replacements?: Record<string, string> | null): string | null | undefined;
		/**
		 * Gets language plural form id by number
		 * see http://docs.translatehouse.org/projects/localization-guide/en/latest/l10n/pluralforms.html
		 * @param {number} value
		 * @param {string} [languageId]
		 * @return {?number}
		 */
		static getPluralForm(value: number, languageId?: string): number;
	}

	/**
	 * @memberOf BX
	 */
	class Tag {
		/**
		 * Encodes all substitutions
		 */
		static safe(sections: TemplateStringsArray, ...substitutions: string[]): string;
		/**
		 * Decodes all substitutions
		 * @param sections
		 * @param substitutions
		 * @return {string}
		 */
		static unsafe(sections: any, ...substitutions: any[]): any;
		/**
		 * Adds styles to specified element
		 * @param {HTMLElement} element
		 * @return {Function}
		 */
		static style(element: HTMLElement): Function;
		/**
		 * Replace all messages identifiers to real messages
		 */
		static message(sections: TemplateStringsArray, ...substitutions: string[]): string;
		static render: typeof render;
		/**
		 * Adds attributes to specified element
		 */
		static attrs(element: HTMLElement): (...args: any[]) => void;
		static attr: typeof Tag.attrs;
	}

	function render(sections: TemplateStringsArray, ...substitutions: Array<any>): any;

	/**
	 * Implements interface for works with URI
	 * @memberOf BX
	 */
	class Uri {
		static addParam(url: string, params?: {}): string;
		static removeParam(url: string, params: Array<string> | string): string;
		constructor(url?: string);
		getSchema(): string | null | undefined;
		setSchema(schema: string): Uri;
		getHost(): string | null | undefined;
		setHost(host: string): Uri;
		getPort(): string;
		setPort(port: string | number): Uri;
		getPath(): string;
		setPath(path: string): Uri;
		getQuery(): string;
		getQueryParam(key: string): string | null | undefined;
		setQueryParam(key: string, value?: string): Uri;
		getQueryParams(): {
			[key: string]: string;
		};
		setQueryParams(params?: {
			[key: string]: string;
		}): Uri;
		removeQueryParam(...keys: Array<string>): Uri;
		getFragment(): string | null | undefined;
		setFragment(hash: string): Uri;
		serialize(): {
			[key: string]: string;
		};
		toString(): string;
	}

	/**
	 * Checks if the given value is a valid email address.
	 * Supports Cyrillic characters in both local and domain parts.
	 *
	 * @param {any} email The value to validate.
	 * @returns {boolean} True if the value is a valid email, false otherwise.
	 * @memberOf BX
	 */
	class Validation {
		static MAX_EMAIL_LENGTH: number;
		static MAX_LOCAL_LENGTH: number;
		static LOCAL_ALLOWED_CHARS: RegExp;
		static DOMAIN_LABEL_CHARS: RegExp;
		static isEmail(email: unknown): boolean;
	}

	/**
	 * @memberOf BX
	 */
	class Cache {
		static BaseCache: typeof BaseCache;
		static MemoryCache: typeof MemoryCache;
		static LocalStorageCache: typeof LocalStorageCache;
	}

	class BaseCache<T> {
		/**
		 * @private
		 */
		storage: Map<string, T>;
		/**
		 * Gets cached value or default value
		 */
		get(key: string, defaultValue?: T | (() => T)): T | undefined;
		/**
		 * Sets cache entry
		 */
		set(key: string, value: T): void;
		/**
		 * Deletes cache entry
		 */
		delete(key: string): void;
		/**
		 * Checks that storage contains entry with specified key
		 */
		has(key: string): boolean;
		/**
		 * Gets cached value if exists,
		 */
		remember(key: string, defaultValue?: T | (() => T)): T | undefined;
		/**
		 * Gets storage size
		 */
		size(): number;
		/**
		 * Gets storage keys
		 */
		keys(): Array<string>;
		/**
		 * Gets storage values
		 */
		values(): Array<T>;
	}

	class MemoryCache<T> extends BaseCache<T> {
		/**
		 * @private
		 */
		storage: MemoryStorage<string, T>;
	}

	class LocalStorageCache<T> extends BaseCache<T> {
		/**
		 * @private
		 */
		storage: any;
	}

	class Extension {
		static getSettings(extensionName: string): any;
	}

	/**
	 * @memberof BX
	 */
	class ZIndexManager {
		static stacks: WeakMap<HTMLElement, ZIndexStack>;
		static register(element: HTMLElement, options?: ZIndexComponentOptions): ZIndexComponent | null | undefined;
		static unregister(element: HTMLElement): void;
		static addStack(container: HTMLElement): ZIndexStack;
		static getStack(container: HTMLElement): ZIndexStack | null | undefined;
		static getOrAddStack(container: HTMLElement): ZIndexStack | null | undefined;
		static getComponent(element: HTMLElement): ZIndexComponent | null | undefined;
		static bringToFront(element: HTMLElement): ZIndexComponent | null | undefined;
	}

	class ZIndexStack {
		container: HTMLElement;
		components: OrderedArray<ZIndexComponent>;
		elements: WeakMap<HTMLElement, ZIndexComponent>;
		baseIndex: number;
		baseStep: number;
		sortCount: number;
		constructor(container: HTMLElement);
		getBaseIndex(): number;
		setBaseIndex(index: number): void;
		setBaseStep(step: number): void;
		getBaseStep(): number;
		register(element: HTMLElement, options?: ZIndexComponentOptions): ZIndexComponent;
		unregister(element: HTMLElement): void;
		getComponent(element: HTMLElement): ZIndexComponent | null | undefined;
		getComponents(): ZIndexComponent[];
		getMaxZIndex(): number;
		sort(): void;
		bringToFront(element: HTMLElement): ZIndexComponent | null | undefined;
	}

	class OrderedArray<T> {
		comparator: Function | null;
		items: Array<T>;
		constructor(comparator?: Function | null);
		add(item: T): number;
		has(item: T): boolean;
		getIndex(item: T): number;
		getByIndex(index: number): T | null | undefined;
		getFirst(): T | null | undefined;
		getLast(): T | null | undefined;
		count(): number;
		delete(item: T): boolean;
		clear(): void;
		[Symbol.iterator](): ArrayIterator<T>;
		forEach(callbackfn: (value: T, index: number, array: T[]) => void, thisArg?: any): void;
		getAll(): Array<T>;
		getComparator(): Function | null;
		sort(): void;
	}

	class ZIndexComponent extends EventEmitter {
		sort: number;
		alwaysOnTop: boolean | number;
		zIndex: number;
		element: HTMLElement | null;
		overlay: HTMLElement | null;
		overlayGap: number;
		stack: ZIndexStack | null;
		constructor(element: HTMLElement, componentOptions?: ZIndexComponentOptions);
		getSort(): number;
		/**
		 * @internal
		 * @param sort
		 */
		setSort(sort: number): void;
		/**
		 * @internal
		 * @param stack
		 */
		setStack(stack: ZIndexStack): void;
		getStack(): ZIndexStack | null | undefined;
		getZIndex(): number;
		/**
		 * @internal
		 */
		setZIndex(zIndex: number): void;
		getAlwaysOnTop(): boolean | number;
		setAlwaysOnTop(value: boolean | number): void;
		getElement(): HTMLElement | null;
		setOverlay(overlay: HTMLElement, gap?: number): void;
		getOverlay(): HTMLElement | null | undefined;
		setOverlayGap(gap: number): void;
		getOverlayGap(): number;
	}

	const Collections: {
		OrderedArray: typeof OrderedArray;
		SettingsCollection: typeof SettingsCollection;
		WeakRefMap: typeof WeakRefMap;
	};

	class SettingsCollection {
		constructor(options?: {
			[key: string]: any;
		});
		get(path: string, defaultValue?: any): any;
	}

	class WeakRefMap<K, V extends WeakKey> {
		constructor();
		clear(): void;
		delete(key: K): boolean;
		get(key: K): V | undefined;
		has(key: K): boolean;
		set(key: K, value: V): this;
	}

	class Easing {
		constructor(easingOptions: EasingOptions);
		setOptions(easingOptions: EasingOptions): void;
		setTransition(transition: TransitionFunction | string): void;
		animateProgress(): void;
		animate(): void;
		/**
		 * @private
		 * Compatible proxy for options
		 */
		get options(): EasingOptions;
		stop(completed?: boolean): void;
		static makeEaseInOut(delta: TransitionFunction): TransitionFunction;
		static makeEaseOut(delta: TransitionFunction): TransitionFunction;
		static get transitions(): Record<string, Function>;
	}

	class LocalStorage {
		constructor(storageOptions?: LocalStorageOptions);
		set(key: string, value: any, ttl?: number): boolean;
		get(key: string): JsonValue | null;
		remove(key: string): void;
		getPrefix(): string;
		getBasePrefix(): string;
	}

	const localStorage: LocalStorage;

	class Page {
		static getRootWindow(): Window;
		static isCrossOriginObject(currentWindow: any): boolean;
		static getTopWindowOfCurrentHost(currentWindow: any): Window;
		static getParentWindowOfCurrentHost(currentWindow: any): Window;
		static redirect(redirectUrl: string, redirectOptions?: PageRedirectOptions): void;
		static reload(): void;
	}

	function GetWindowScrollSize(doc?: Document): {
		scrollWidth: number;
		scrollHeight: number;
	};

	function GetWindowScrollPos(doc?: Document): {
		scrollLeft: number;
		scrollTop: number;
	};

	function GetWindowInnerSize(doc?: Document): {
		innerWidth: number;
		innerHeight: number;
	};

	function GetWindowSize(doc?: Document): {
		scrollWidth: number;
		scrollHeight: number;
		scrollLeft: number;
		scrollTop: number;
		innerWidth: number;
		innerHeight: number;
	};

	function GetContext(node: any): Window;

	function pos(element: any, relative?: boolean): any;

	function addCustomEvent(eventObject: any, eventName: any, eventHandler: any): void;

	function onCustomEvent(eventObject: any, eventName: any, eventParams?: any, secureParams?: any): void;

	function removeCustomEvent(eventObject: any, eventName: any, eventHandler: any): void;

	function removeAllCustomEvents(eventObject: any, eventName: any): void;

	function onGlobalCustomEvent(eventName: any, arEventParams: any, bSkipSelf: any): void;

	const getClass: typeof Reflection.getClass, namespace: typeof Reflection.namespace;

	const message: import("./lib/loc/message").MessageFunction;

	const easing: typeof Easing;

	const fx: typeof FX;

	/**
	 * @deprecated
	 */
	class FX {
		constructor(options: FXOptions);
		start(): this;
		stop(silent?: boolean): void;
		pause(): void;
		/**
		 * @deprecated
		 */
		static hide(el: any, type: any, opts: any): FX | void;
		/**
		 * @deprecated
		 */
		static show(el: HTMLElement | string, type: 'fade' | 'scroll', opts: any): FX | void;
	}

	const PageObject: typeof Page;

	/**
	 * @memberOf BX
	 */
	const replace: typeof Dom.replace, remove: typeof Dom.remove, clean: typeof Dom.clean, insertBefore: typeof Dom.insertBefore, insertAfter: typeof Dom.insertAfter, append: typeof Dom.append, prepend: typeof Dom.prepend, style: typeof Dom.style, adjust: typeof Dom.adjust, create: typeof Dom.create, isShown: typeof Dom.isShown;

	const addClass: () => void;

	const removeClass: () => void;

	const hasClass: () => boolean;

	const toggleClass: () => void;

	const cleanNode: (element: any, removeElement?: boolean) => HTMLElement | null;

	const getCookie: typeof import("./lib/http/cookie").default.get;

	const setCookie: (name: any, value: any, options?: Record<string, any>) => void;

	const bind: typeof import("./lib/event/bind").default, unbind: typeof import("./lib/event/unbind").default, unbindAll: typeof import("./lib/event/unbind-all").default, bindOnce: typeof import("./lib/event/bind-once").default, ready: typeof import("./lib/event/ready").default;

	/**
	 * For compatibility only
	 * @type {boolean}
	 */
	let isReady: boolean;

	const debugEnableFlag: boolean, debugStatus: typeof debugNs.isDebugEnabled, debug: typeof debugNs.default;

	const debugEnable: (value: any) => void;

	const clone: typeof import("./lib/runtime/clone").default, loadExt: typeof import("./lib/runtime/loadextension/load-extension").default, debounce: typeof Runtime.debounce, throttle: typeof Runtime.throttle, html: typeof Runtime.html;

	const type: {
		isNotEmptyString: (value: any) => boolean;
		isNotEmptyObject: (value: any) => boolean;
		isMapKey: typeof Type.isObject;
		stringToInt: (value: any) => number;
	};

	const browser: {
		IsOpera: typeof Browser.isOpera;
		IsIE: typeof Browser.isIE;
		IsIE6: typeof Browser.isIE6;
		IsIE7: typeof Browser.isIE7;
		IsIE8: typeof Browser.isIE8;
		IsIE9: typeof Browser.isIE9;
		IsIE10: typeof Browser.isIE10;
		IsIE11: typeof Browser.isIE11;
		IsSafari: typeof Browser.isSafari;
		IsFirefox: typeof Browser.isFirefox;
		IsChrome: typeof Browser.isChrome;
		DetectIeVersion: typeof Browser.detectIEVersion;
		IsMac: typeof Browser.isMac;
		IsAndroid: typeof Browser.isAndroid;
		isIPad: typeof Browser.isIPad;
		isIPhone: typeof Browser.isIPhone;
		IsIOS: typeof Browser.isIOS;
		IsMobile: typeof Browser.isMobile;
		isRetina: typeof Browser.isRetina;
		IsDoctype: typeof Browser.isDoctype;
		SupportLocalStorage: typeof Browser.isLocalStorageSupported;
		addGlobalClass: typeof Browser.addGlobalClass;
		DetectAndroidVersion: typeof Browser.detectAndroidVersion;
		isPropertySupported: typeof Browser.isPropertySupported;
		addGlobalFeatures: typeof Browser.addGlobalFeatures;
	};

	const ajax: any;
}
