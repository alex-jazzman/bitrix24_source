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

type CompatibleListener = (...args: any[]) => void;

type ListenerOptions = {
	useGlobalNaming?: boolean;
	compatMode?: boolean;
	cloneData?: boolean;
	thisArg?: any;
};

type CookieOptions = {
	expires?: number | Date | string;
	path?: string;
	domain?: string;
	secure?: boolean;
	samesite?: string;
	[attribute: string]: unknown;
};

interface ExtractAssetsOptions {
	/**
	 * Marks every script as early-run regardless of its attributes. The legacy parser spelled
	 * this `scriptsRunFirst`.
	 */
	readonly runFirst?: boolean;
	/**
	 * Script types left in the markup instead of being collected. A `<script>` of one of these
	 * types is a template or a settings block, not code to run.
	 */
	readonly templateTypes?: ReadonlyArray<string>;
}

interface ExtractedAssets {
	/**
	 * The markup with the collected scripts and stylesheet links taken out of it, and nothing
	 * else changed: what is not removed is returned byte for byte, unlike a parser that rebuilds
	 * the string from a tree. A `<script>` of a template type stays where it is, uncollected,
	 * because its content is markup for the consumer to read rather than code to run.
	 */
	readonly html: string;
	readonly scripts: ReadonlyArray<AssetScript>;
	readonly styles: ReadonlyArray<AssetStyle>;
}

type AssetScript = ExternalScript | InlineScript;

/**
 * An external script: the markup carried a non-empty `src`, and the address is all the parser
 * keeps. A `<script>` whose `src` is empty counts as an inline script, not an external one.
 */
interface ExternalScript {
	readonly isInternal: false;
	readonly src: string;
	readonly runFirst: boolean;
	readonly type: string | null;
}

/**
 * An inline script: the markup carried the code itself.
 */
interface InlineScript {
	readonly isInternal: true;
	readonly text: string;
	readonly runFirst: boolean;
	readonly type: string | null;
}

interface AssetStyle {
	readonly href: string;
	readonly media: string | null;
}

type LoadExtensionResult = Promise<Array<ExtensionExports>>;

type ExtensionExports = {
	[key: string]: any;
};

/**
 * Backing storage for a cache. Values are held as `unknown`; the value type is applied
 * by the cache methods (BaseCache) on the way in and out, not by the storage itself.
 */
interface ICacheStorage {
	size: number;
	get(key: string): unknown;
	set(key: string, value: unknown): void;
	has(key: string): boolean;
	delete(key: string): void;
	keys(): Array<string>;
	values(): Array<unknown>;
}

type ZIndexComponentOptions = {
	alwaysOnTop?: boolean | number;
	overlay?: HTMLElement;
	overlayGap?: number;
	events?: {
		[eventName: string]: (event: BX.BaseEvent) => void;
	};
};

type CollectionsLibrary = {
	OrderedArray: typeof BX.OrderedArray;
	SettingsCollection: typeof BX.SettingsCollection;
	WeakRefMap: typeof BX.WeakRefMap;
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

type WindowSize = {
	innerWidth: number;
	innerHeight: number;
	scrollLeft: number;
	scrollTop: number;
	scrollWidth: number;
	scrollHeight: number;
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

type TypeCompatLibrary = {
	isNotEmptyString: (value: any) => boolean;
	isNotEmptyObject: (value: any) => boolean;
	isMapKey: typeof BX.Type.isObject;
	stringToInt: (value: any) => number;
	[method: string]: any;
};

type BrowserCompat = {
	IsOpera: typeof BX.Browser.isOpera;
	IsIE: typeof BX.Browser.isIE;
	IsIE6: typeof BX.Browser.isIE6;
	IsIE7: typeof BX.Browser.isIE7;
	IsIE8: typeof BX.Browser.isIE8;
	IsIE9: typeof BX.Browser.isIE9;
	IsIE10: typeof BX.Browser.isIE10;
	IsIE11: typeof BX.Browser.isIE11;
	IsSafari: typeof BX.Browser.isSafari;
	IsFirefox: typeof BX.Browser.isFirefox;
	IsChrome: typeof BX.Browser.isChrome;
	DetectIeVersion: typeof BX.Browser.detectIEVersion;
	IsMac: typeof BX.Browser.isMac;
	IsAndroid: typeof BX.Browser.isAndroid;
	isIPad: typeof BX.Browser.isIPad;
	isIPhone: typeof BX.Browser.isIPhone;
	IsIOS: typeof BX.Browser.isIOS;
	IsMobile: typeof BX.Browser.isMobile;
	isRetina: typeof BX.Browser.isRetina;
	IsDoctype: typeof BX.Browser.isDoctype;
	SupportLocalStorage: typeof BX.Browser.isLocalStorageSupported;
	addGlobalClass: typeof BX.Browser.addGlobalClass;
	DetectAndroidVersion: typeof BX.Browser.detectAndroidVersion;
	isPropertySupported: typeof BX.Browser.isPropertySupported;
	addGlobalFeatures: typeof BX.Browser.addGlobalFeatures;
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
		static create(tag: string | CreateOptions, data?: AdjustData, context?: Document): HTMLElement;
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
		 * @param {Function} listener
		 * @param {object} options
		 */
		static subscribe(eventName: string, listener: CompatibleListener, options: ListenerOptions & {
			compatMode: true;
		}): void;
		static subscribe(target: object, eventName: string, listener: CompatibleListener, options: ListenerOptions & {
			compatMode: true;
		}): void;
		static subscribe<T = any>(eventName: string, listener: (event: BaseEvent<T>) => void, options?: ListenerOptions): void;
		static subscribe<T = any>(target: object, eventName: string, listener: (event: BaseEvent<T>) => void, options?: ListenerOptions): void;
		/**
		 * Subscribes a listener on a specified event
		 * @param {string} eventName
		 * @param {Function<BaseEvent>} listener
		 * @return {this}
		 */
		subscribe<T = any>(eventName: string, listener: (event: BaseEvent<T>) => void): this;
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
		static subscribeOnce<T = any>(eventName: string, listener: (event: BaseEvent<T>) => void): void;
		static subscribeOnce<T = any>(target: object, eventName: string, listener: (event: BaseEvent<T>) => void): void;
		/**
		 * Subscribes a listener that is called at most once for a specified event.
		 * @param {string} eventName
		 * @param {Function<BaseEvent>} listener
		 * @return {this}
		 */
		subscribeOnce<T = any>(eventName: string, listener: (event: BaseEvent<T>) => void): this;
		/**
		 * Unsubscribes an event listener
		 * @param {object} target
		 * @param {string} eventName
		 * @param {Function} listener
		 * @param options
		 */
		static unsubscribe(eventName: string, listener: CompatibleListener, options?: ListenerOptions): void;
		static unsubscribe(target: object, eventName: string, listener: CompatibleListener, options?: ListenerOptions): void;
		static unsubscribe<T = any>(eventName: string, listener: (event: BaseEvent<T>) => void, options?: ListenerOptions): void;
		static unsubscribe<T = any>(target: object, eventName: string, listener: (event: BaseEvent<T>) => void, options?: ListenerOptions): void;
		/**
		 * Unsubscribes an event listener
		 * @param {string} eventName
		 * @param {Function<BaseEvent>} listener
		 * @return {this}
		 */
		unsubscribe<T = any>(eventName: string, listener: (event: BaseEvent<T>) => void): this;
		/**
		 * Unsubscribes all event listeners
		 * @param {object} target
		 * @param {string} eventName
		 * @param options
		 */
		static unsubscribeAll(eventName: string, options?: ListenerOptions): void;
		static unsubscribeAll(target: object, eventName?: string, options?: ListenerOptions): void;
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
		static emit<T = any>(eventName: string, event?: BaseEvent<T> | T, options?: ListenerOptions): Array<any>;
		static emit<T = any>(target: object, eventName: string, event?: BaseEvent<T> | T, options?: ListenerOptions): Array<any>;
		/**
		 * Emits specified event with specified event object
		 * @param {string} eventName
		 * @param {BaseEvent | any} event
		 * @return {this}
		 */
		emit<T = any>(eventName: string, event?: BaseEvent<T> | T): this;
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
		static getMaxListeners(target: any, eventName?: string | null): number;
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
		 */
		static destructMaxListenersArgs(...args: any[]): [object, string | null, number];
		/**
		 * Gets listeners list for a specified event
		 * @param {object} target
		 * @param {string} eventName
		 */
		static getListeners(eventName: string): Map<any, any>;
		static getListeners(target: object, eventName?: string): Map<any, any>;
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
	class BaseEvent<DataType = any, TargetType = any> {
		type: string;
		data: DataType | null;
		target: TargetType | null;
		compatData: Array<any> | null;
		defaultPrevented: boolean;
		immediatePropagationStopped: boolean;
		errors: Array<BaseError>;
		constructor(options?: {
			data?: DataType;
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
		setTarget(target: TargetType): this;
		/**
		 * Returns a event target
		 */
		getTarget(): TargetType | null;
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
		static set(name: string, value: any, options?: CookieOptions): void;
		/**
		 * Removes cookie
		 * @param {string} name
		 * @param {object} [options]
		 */
		static remove(name: string, options?: CookieOptions): void;
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
		static extractAssets: typeof extractAssets;
		static loadExtension: typeof loadExtension;
		static registerExtension: typeof registerExtension;
		static clone: typeof clone;
		static debounce<F extends (...args: any[]) => any>(func: F, wait?: number, context?: object | null): (...args: Parameters<F>) => void;
		static throttle<F extends (...args: any[]) => any>(func: F, wait?: number, context?: object | null): (...args: Parameters<F>) => void;
		static html(node: HTMLElement, html: any, params?: Record<string, any>): Promise<void> | string;
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
		}, fields?: Array<string>, orders?: Array<string>): Array<{
			[key: string]: any;
		}>;
		static destroy(target: any, errorMessage?: string): void;
	}

	function debug(...args: any[]): void;

	/**
	 * Scans the markup for scripts and stylesheet links and takes them out of it.
	 *
	 * ## What this does not handle
	 *
	 * The scan is textual, so it cannot tell a `<script>` element from the same characters inside an
	 * attribute value: `<div data-tpl="<script>x()</script>">` is read as a real script, the element
	 * is cut apart, and `x()` is handed back to be run. HTML nests and attribute values may contain
	 * anything, which a pattern over a flat string cannot express - no arrangement of the
	 * expressions below fixes it. Feeding this function markup whose attribute values may carry
	 * angle brackets is therefore unsafe, and the caller must know that before choosing it.
	 *
	 * A parser built on the browser's own tree - `<template>` or `DOMParser` - does not have this
	 * hole, and an earlier version of this function was written that way. It cost 15-30x more per
	 * call (measured: 0.060 ms against 0.004 ms on a typical 3 KB response, 2.3 ms against 0.2 ms at
	 * 100 KB) because it builds every node of the document and serialises the tree back to a string,
	 * whether or not anything is extracted. The speed is why this implementation replaced it; the
	 * hole above is what that speed costs, and the trade belongs to the caller, not to this file.
	 *
	 * ## What it does handle
	 *
	 * The markup is only read, never executed: no element is created and nothing is fetched. Running
	 * the collected scripts is left to the caller, exactly as it is with `BX.processHTML`. The
	 * result is not sanitised either, and it is not meant to be.
	 *
	 * Two defects of `BX.processHTML` are not carried over. The expressions are built per call
	 * rather than shared at module level, so the search position one call leaves behind cannot reach
	 * the next. And the markup is assembled from slices in one pass instead of being rebuilt for
	 * every link removed, which is what makes the legacy loop quadratic in the number of
	 * stylesheets: at 500 of them it takes 18 ms where this takes 0.6 ms.
	 *
	 * @example
	 * const { html, scripts, styles } = extractAssets('<p>text</p><script>run()</script>');
	 * // html === '<p>text</p>', scripts === [{ isInternal: true, text: 'run()', ... }]
	 */
	function extractAssets(data: unknown, options?: ExtractAssetsOptions): ExtractedAssets;

	function loadExtension(...name: Array<string | Array<string>>): LoadExtensionResult;

	function registerExtension(options: any): void;

	/**
	 * Clones any cloneable object
	 * @param value
	 * @return {*}
	 */
	function clone<T>(value: T): T;

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

	/**
	 * Renders an HTML template into DOM nodes.
	 *
	 * The default return type is `HTMLElement` — the common case of a single root
	 * node (`const el = Tag.render\`<div></div>\``). The type parameter `T` lets
	 * callers describe the other shapes the function can produce:
	 * - a specific element type: `Tag.render<HTMLInputElement>\`<input>\``;
	 * - a refs object when the template uses `ref=`:
	 *   `Tag.render<{ root: HTMLElement; title: HTMLElement }>\`...\``;
	 * - an array of nodes for multi-root templates: `Tag.render<HTMLElement[]>\`...\``.
	 */
	function render<T = HTMLElement>(sections: TemplateStringsArray, ...substitutions: Array<any>): T;

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

	/**
	 * A string-keyed cache.
	 *
	 * The class parameter `T` is the default value type of the cache (defaults to `unknown`
	 * so a plain `new MemoryCache()` accepts anything). Different keys may hold different
	 * types, so each method also takes its own type parameter: `cache.get<Popup>('popup')`,
	 * `cache.set('count', 1)`, inferred from the default value or factory when passed. When
	 * a default (or factory) is provided, `get`/`remember` are guaranteed to return a value,
	 * so the return type excludes `undefined`.
	 */
	class BaseCache<T = unknown> {
		/**
		 * @private
		 */
		storage: ICacheStorage;
		/**
		 * Gets a cached value, falling back to the default value (or factory result) when
		 * the key is missing. With a default the return type excludes `undefined`.
		 */
		get<V = T>(key: string): V | undefined;
		get<V = T>(key: string, defaultValue: (() => V) | V): V;
		/**
		 * Sets a cache entry.
		 */
		set<V = T>(key: string, value: V): void;
		/**
		 * Deletes a cache entry.
		 */
		delete(key: string): void;
		/**
		 * Checks that the storage contains an entry with the specified key.
		 */
		has(key: string): boolean;
		/**
		 * Gets a cached value; when the key is missing, stores and returns the default value
		 * (or factory result). With a default the return type excludes `undefined`.
		 */
		remember<V = T>(key: string): V | undefined;
		remember<V = T>(key: string, defaultValue: (() => V) | V): V;
		/**
		 * Gets the storage size.
		 */
		size(): number;
		/**
		 * Gets the storage keys.
		 */
		keys(): Array<string>;
		/**
		 * Gets the storage values.
		 */
		values<V = T>(): Array<V>;
	}

	/**
	 * In-memory cache. BaseCache already uses MemoryStorage by default, so this is a named
	 * alias kept for the public API (`BX.Cache.MemoryCache`).
	 */
	class MemoryCache<T = unknown> extends BaseCache<T> {
	}

	/**
	 * Cache backed by localStorage, so entries survive page reloads.
	 */
	class LocalStorageCache<T = unknown> extends BaseCache<T> {
		/**
		 * @private
		 */
		storage: ICacheStorage;
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
		getByIndex(index: number): T | null;
		getFirst(): T | null;
		getLast(): T | null;
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

	class Extension {
		static getSettings(extensionName: string): SettingsCollection;
	}

	class SettingsCollection {
		constructor(options?: {
			[key: string]: any;
		});
		get(path: string, defaultValue?: any): any;
	}

	const Collections: CollectionsLibrary;

	class WeakRefMap<K, V extends WeakKey> {
		constructor();
		clear(): void;
		delete(key: K): boolean;
		get(key: K): V | undefined;
		has(key: K): boolean;
		set(key: K, value: V): this;
	}

	class Animation {
		/**
		 * Resolves when the transitions of the element are over, whether they finished or were cancelled.
		 * Call it after the change that starts the transition is applied: only the transitions the element
		 * already has are awaited, all of them, including the ones started by somebody else.
		 * `propertyName` narrows the wait to the transitions of the named properties.
		 *
		 * The promise never rejects and resolves right away when there is nothing to wait for: the element
		 * has no transition at all or none of a named property, the list of names is empty, the argument is
		 * not an element, or none of the transitions ends at a finite time (endless or on a progress timeline).
		 * A paused transition neither finishes nor cancels, so waiting for it never resolves.
		 */
		static waitTransitionEnd(element: Element, propertyName?: string | string[] | null): Promise<void>;
		/**
		 * Resolves when the animations of the element are over, whether they finished or were cancelled.
		 * Call it after the change that starts the animation is applied: only the animations the element
		 * already has are awaited, all of them, including the ones started by somebody else. A movement
		 * started from a script by `Element.animate()` is awaited as well.
		 * `animationName` narrows the wait to the animations with the given names. A movement started from
		 * a script has no name of its own, so no given name ever matches it.
		 *
		 * The promise never rejects and resolves right away when there is nothing to wait for: the element
		 * has no animation at all or none with a given name, the list of names is empty, the argument is not
		 * an element, or none of the animations ends at a finite time (endless or on a progress timeline).
		 * A paused animation neither finishes nor cancels, so waiting for it never resolves.
		 */
		static waitAnimationEnd(element: Element, animationName?: string | string[] | null): Promise<void>;
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

	function GetWindowSize(doc?: Document): WindowSize;

	function GetContext(node: Node | null): Window;

	function pos(element: any, relative?: boolean): any;

	function addCustomEvent(eventObject: any, eventName: any, eventHandler: any): void;

	function onCustomEvent(eventObject: any, eventName: any, eventParams?: any, secureParams?: any): void;

	function removeCustomEvent(eventObject: any, eventName: any, eventHandler: any): void;

	function removeAllCustomEvents(eventObject: any, eventName: any): void;

	function onGlobalCustomEvent(eventName: any, arEventParams: any, bSkipSelf: any): void;

	const getClass: typeof Reflection.getClass;

	const namespace: typeof Reflection.namespace;

	const message: MessageFunction;

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
	const replace: typeof Dom.replace;

	const remove: typeof Dom.remove;

	const clean: typeof Dom.clean;

	const insertBefore: typeof Dom.insertBefore;

	const insertAfter: typeof Dom.insertAfter;

	const append: typeof Dom.append;

	const prepend: typeof Dom.prepend;

	const style: typeof Dom.style;

	const adjust: typeof Dom.adjust;

	const create: typeof Dom.create;

	const isShown: typeof Dom.isShown;

	const addClass: (...args: any[]) => void;

	const removeClass: (...args: any[]) => void;

	const hasClass: (...args: any[]) => boolean;

	const toggleClass: (...args: any[]) => void;

	const cleanNode: (element: string | HTMLElement, removeElement?: boolean) => HTMLElement | null;

	const getCookie: typeof Http.Cookie.get;

	const setCookie: (name: string, value: any, options?: CookieOptions) => void;

	const bind: typeof bindFn;

	const unbind: typeof unbindFn;

	const unbindAll: (target: any, eventName?: string) => void;

	const bindOnce: typeof bindOnceFn;

	const ready: (handler: () => void) => void;

	/**
	 * For compatibility only
	 * @type {boolean}
	 */
	let isReady: boolean;

	const debugEnableFlag: boolean;

	const debugStatus: typeof debugNs.isDebugEnabled;

	const debug: typeof debugNs.default;

	const debugEnable: (value: any) => void;

	const clone: <T>(value: T) => T;

	const loadExt: typeof Runtime.loadExtension;

	const debounce: typeof Runtime.debounce;

	const throttle: typeof Runtime.throttle;

	const html: typeof Runtime.html;

	const type: TypeCompatLibrary;

	const browser: BrowserCompat;

	const ajax: any;
}
