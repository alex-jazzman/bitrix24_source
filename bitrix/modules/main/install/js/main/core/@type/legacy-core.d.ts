/**
 * Type declarations for legacy APIs from src/old/core.js
 *
 * These functions are added to the BX namespace via concat in bundle.config.ts.
 * Most are deprecated — prefer modern BX.* class-based alternatives where noted.
 */

export {};

type FindNodeParams = {
	tag?: string | RegExp;
	tagName?: string | RegExp;
	class?: string | RegExp;
	className?: string | RegExp;
	attr?: string | string[] | Record<string, string | RegExp>;
	attribute?: string | string[] | Record<string, string | RegExp>;
	attrs?: string | string[] | Record<string, string | RegExp>;
	property?: string | string[] | Record<string, string | RegExp>;
	props?: string | string[] | Record<string, string | RegExp>;
	callback?: (node: HTMLElement) => boolean;
	allowTextNodes?: boolean;
};

type ProcessHTMLResult = {
	HTML: string;
	SCRIPT: Array<{ isInternal: boolean; JS: string }>;
	STYLE: string[];
};

type CHintParams = {
	parent?: HTMLElement | string;
	hint?: string;
	title?: string;
	id?: string;
	show_timeout?: number;
	hide_timeout?: number;
	dx?: number;
	showOnce?: boolean;
	preventHide?: boolean;
	min_width?: number;
};

declare global {
	namespace BX {

		// ----------------------------------------------------------------
		// Constants
		// ----------------------------------------------------------------

		const MSLEFT: 1;
		const MSMIDDLE: 2;
		const MSRIGHT: 4;
		const AM_PM_UPPER: 1;
		const AM_PM_LOWER: 2;
		const AM_PM_NONE: false;

		// ----------------------------------------------------------------
		// Prototype / inheritance
		// ----------------------------------------------------------------

		/** @deprecated Use ES class `extends` */
		function extend(child: Function, parent: Function): void;
		/** @deprecated Use `instanceof` */
		function is_subclass_of(ob: object, parentClass: Function): boolean;
		function ext(ob: Record<string, any>): void;

		// ----------------------------------------------------------------
		// HTML processing
		// ----------------------------------------------------------------

		function processHTML(data: string, scriptsRunFirst?: boolean): ProcessHTMLResult;
		/** @deprecated Use `BX.Runtime.html()` */
		function evalPack(code: Array<{ TYPE: string; DATA: string }>): void;
		/** @deprecated Use `BX.Runtime.html()` */
		function evalGlobal(data: string): void;

		// ----------------------------------------------------------------
		// DOM helpers
		// ----------------------------------------------------------------

		function createFragment(nodes: Node | Node[] | string): DocumentFragment;
		/** @deprecated Use `element.style.opacity` */
		function setOpacity(element: HTMLElement, opacity: number): void;
		function setUnselectable(node: HTMLElement): void;
		function setSelectable(node: HTMLElement): void;
		function focus(el: HTMLElement): void;
		function firstChild(el: Node): HTMLElement | null;
		function lastChild(el: Node): HTMLElement | null;
		function previousSibling(el: Node): HTMLElement | null;
		function nextSibling(el: Node): HTMLElement | null;

		/** @deprecated Use `element.querySelectorAll` */
		function findChildrenByClassName(obj: Node, className: string, recursive?: boolean): HTMLElement[];
		/** @deprecated Use `element.querySelector` */
		function findChildByClassName(obj: Node, className: string, recursive?: boolean): HTMLElement | null;
		/** @deprecated Use `element.querySelectorAll` */
		function findChildren(obj: Node, params: FindNodeParams, recursive?: boolean): HTMLElement[];
		/** @deprecated Use `element.querySelector` */
		function findChild(obj: Node, params: FindNodeParams, recursive?: boolean, getAll?: boolean): HTMLElement | HTMLElement[] | null;
		/** @deprecated Use `element.closest()` */
		function findParent(obj: Node, params: FindNodeParams | ((node: HTMLElement) => boolean), maxParent?: Node): HTMLElement | null;
		function findNextSibling(obj: Node, params: FindNodeParams): HTMLElement | null;
		function findPreviousSibling(obj: Node, params: FindNodeParams): HTMLElement | null;
		function checkNode(obj: Node, params: FindNodeParams): boolean;
		function findFormElements(form: HTMLFormElement | string): HTMLElement[];
		function isParentForNode(whichNode: Node, forNode: Node): boolean;

		function isNodeInDom(node: Node, doc?: Document): boolean;
		function isNodeHidden(node: Node): boolean;

		function getCaretPosition(node: HTMLInputElement | HTMLTextAreaElement): number;
		function setCaretPosition(node: HTMLInputElement | HTMLTextAreaElement, pos: number): void;

		function clearNodeCache(): void;

		// ----------------------------------------------------------------
		// Display / visibility
		// ----------------------------------------------------------------

		/** @deprecated Use `BX.Dom.show()` */
		function show(ob: HTMLElement, displayType?: string): void;
		/** @deprecated Use `BX.Dom.hide()` */
		function hide(ob: HTMLElement, displayType?: string): void;
		/** @deprecated Use `BX.Dom.toggle()` */
		function toggle(ob: HTMLElement, values?: [string, string]): void;
		function hide_object(ob: HTMLElement): void;

		// ----------------------------------------------------------------
		// Geometry / scroll / position
		// ----------------------------------------------------------------

		function scrollTop(node: HTMLElement | Window): number;
		function scrollTop(node: HTMLElement, val: number): void;
		function scrollLeft(node: HTMLElement | Window): number;
		function scrollLeft(node: HTMLElement, val: number): void;
		function scrollToNode(node: HTMLElement): void;
		function width(node: HTMLElement | Window): number;
		function width(node: HTMLElement, val: number): void;
		function height(node: HTMLElement | Window): number;
		function height(node: HTMLElement, val: number): void;
		function is_relative(el: HTMLElement): boolean;
		function is_float(el: HTMLElement): boolean;
		function is_fixed(el: HTMLElement): boolean;
		function GetDocElement(pDoc?: Document): HTMLElement;
		function align(pos: DOMRect, w: number, h: number, type?: string): { left: number; top: number };

		// ----------------------------------------------------------------
		// Events
		// ----------------------------------------------------------------

		/** @deprecated Use `BX.Event.bind()` */
		function once(el: EventTarget, evname: string, func: (e: Event) => void): void;
		function fireEvent(ob: HTMLElement, ev: string): void;
		function getWheelData(e: WheelEvent): number;
		function getEventButton(e: MouseEvent): number;
		function getEventTarget(e: Event): EventTarget | null;

		/** @deprecated Use `e.preventDefault()` */
		function PreventDefault(e: Event): boolean;
		/** @deprecated Use `e.preventDefault()` */
		function eventReturnFalse(e: Event): boolean;
		/** @deprecated Use `e.stopPropagation()` */
		function eventCancelBubble(e: Event): void;
		function fixEventPageXY(event: MouseEvent): void;
		function fixEventPageX(event: MouseEvent): void;
		function fixEventPageY(event: MouseEvent): void;

		function CaptureEvents(el: HTMLElement, evname: string): void;
		function CaptureEventsGet(): void;

		/** @deprecated Use `BX.Event.bind()` + `BX.Runtime.debounce()` */
		function bindDebouncedChange(
			node: HTMLElement,
			fn: (value: string) => void,
			fnInstant?: (value: string) => void,
			timeout?: number,
			ctx?: object,
		): void;
		function bindDelegate(elem: HTMLElement, eventName: string, isTarget: FindNodeParams | ((el: HTMLElement) => boolean), handler: (e: Event) => void): void;
		function delegateEvent(isTarget: FindNodeParams | ((el: HTMLElement) => boolean), handler: (e: Event) => void): (e: Event) => void;

		function denyEvent(el: HTMLElement, ev: string): void;
		function allowEvent(el: HTMLElement, ev: string): void;

		// ----------------------------------------------------------------
		// Proxy / delegate / defer
		// ----------------------------------------------------------------

		let proxy_context: object | null;

		function proxy<T extends Function>(func: T, thisObject: object): T;
		function delegate(func: Function, thisObject: object): Function;
		function delegateLater(funcName: string, thisObject: object, contextObject?: object): Function;
		function defer(func: Function, thisObject?: object): Function;
		function defer_proxy(func: Function, thisObject?: object): Function;

		function False(): false;
		function DoNothing(): void;

		// ----------------------------------------------------------------
		// Object / data
		// ----------------------------------------------------------------

		/** @deprecated Use `BX.Runtime.merge()` */
		function merge(...objects: any[]): any;
		/** @deprecated Use `BX.Runtime.merge()` */
		function mergeEx(...objects: any[]): any;
		/** @deprecated Use `JSON.parse()` */
		function parseJSON(data: string, context?: Window): any;

		function data(node: Node, key: string, value?: any): any;

		class DataStorage {
			keyOffset: number;
			data: Record<number, Record<string, any>>;
			uniqueTag: string;
			resolve(owner: object, create: boolean): number | undefined;
			get(owner: Node | Document, key: string): any;
			set(owner: Node | Document, key: string, value: any): void;
		}

		// ----------------------------------------------------------------
		// Form / submit
		// ----------------------------------------------------------------

		function submit(obForm: HTMLFormElement, actionName?: string, actionValue?: string, onAfterSubmit?: () => void): void;

		// ----------------------------------------------------------------
		// Asset loading
		// ----------------------------------------------------------------

		function setJSList(scripts: string[]): void;
		function getJSList(): string[];
		function setCSSList(cssFiles: string[]): void;
		function getCSSList(): string[];
		function getJSPath(js: string): string;
		function getCSSPath(css: string): string;
		function getCDNPath(path: string): string;
		/** @deprecated Use `BX.Runtime.loadExtension()` */
		function loadScript(script: string | string[], callback?: () => void, doc?: Document): void;
		function loadCSS(css: string | string[], doc?: Document, win?: Window): HTMLLinkElement | HTMLLinkElement[];
		function load(items: string | string[], callback?: () => void, doc?: Document, reject?: () => void): void;

		// ----------------------------------------------------------------
		// Various helpers
		// ----------------------------------------------------------------

		function bitrix_sessid(): string;
		function reload(backUrl?: string, bAddClearCache?: boolean): void;
		function clearCache(): void;
		function template(tpl: HTMLElement | string, callback: (nodes: Record<string, HTMLElement>) => void, bKillTpl?: boolean): void;
		function isAmPmMode(returnConst?: boolean): boolean | 1 | 2;
		function formatDate(date: Date | null, format?: string): string;
		function formatName(user: Record<string, string>, template?: string, login?: string): string;
		function getNumMonth(month: string): number;
		function parseDate(str: string, bUTC?: boolean, formatDate?: string, formatDatetime?: string): Date | null;
		/** @deprecated Use `BX.Dom.style()` */
		function styleIEPropertyName(name: string): string;
		function showWait(node?: HTMLElement | string, msg?: string): HTMLElement;
		function closeWait(node?: HTMLElement | string, obMsg?: HTMLElement): void;
		function garbage(call: () => void, thisObject?: object): void;

		// ----------------------------------------------------------------
		// Hover / focus helpers
		// ----------------------------------------------------------------

		/** @deprecated Use CSS `:hover` */
		function hoverEvents(el: HTMLElement): void;
		/** @deprecated */
		function hoverEventsHover(this: HTMLElement): void;
		/** @deprecated */
		function hoverEventsHout(this: HTMLElement): void;
		/** @deprecated Use CSS `:focus` */
		function focusEvents(el: HTMLElement): void;
		/** @deprecated */
		function focusEventsFocus(this: HTMLElement): void;
		/** @deprecated */
		function focusEventsBlur(this: HTMLElement): void;

		// ----------------------------------------------------------------
		// BX.util
		// ----------------------------------------------------------------

		namespace util {
			/** @deprecated Use `[].filter(v => !BX.Type.isNil(v))` */
			function array_values(ar: any[] | Record<string, any>): any[];
			/** @deprecated Use `Object.keys()` */
			function array_keys(ar: any[] | Record<string, any>): Array<string | number>;
			function object_keys(obj: Record<string, any>): string[];
			/** @deprecated Use `firstArr.concat(secondArr)` */
			function array_merge<T>(first: T[], second: T[]): T[];
			function array_flip(object: Record<string, string>): Record<string, string>;
			function array_diff<T>(ar1: T[], ar2: T[], hash?: (value: T) => string): T[];
			/** @deprecated Use `new Set()` */
			function array_unique<T>(ar: T[]): T[];
			/** @deprecated Use `myArr.includes(needle)` */
			function in_array(needle: any, haystack: any[]): boolean;
			/** @deprecated Use `myArr.findIndex(item => item === needle)` */
			function array_search(needle: any, haystack: any[]): number;
			function object_search_key(needle: string, haystack: Record<string, any>): any;

			function trim(s: string): string;
			function urlencode(s: string): string;
			function deleteFromArray<T>(ar: T[], ind: number): T[];
			function insertIntoArray<T>(ar: T[], ind: number, el: T): T[];
			/** @deprecated Use `BX.Text.encode()` */
			function htmlspecialchars(str: string): string;
			/** @deprecated Use `BX.Text.decode()` */
			function htmlspecialcharsback(str: string): string;
			function preg_quote(str: string, delimiter?: string): string;
			function jsencode(str: string): string;
			function getCssName(jsName: string): string;
			function getJsName(cssName: string): string;
			function nl2br(str: string): string;
			/** @deprecated Use `.padStart()` / `.padEnd()` */
			function str_pad(input: string | number, padLength: number, padString?: string, padType?: 'left' | 'right'): string;
			function str_pad_left(input: string | number, padLength: number, padString?: string): string;
			function str_pad_right(input: string | number, padLength: number, padString?: string): string;
			function strip_tags(str: string): string;
			function strip_php_tags(str: string): string;
			function popup(url: string, width: number, height: number): Window | null;
			function shuffle<T>(array: T[]): T[];
			function objectSort(object: Record<string, Record<string, any>>, sortBy: string, sortDir?: 'asc' | 'desc'): Array<Record<string, any>>;
			/** @deprecated Use `BX.Runtime.merge()` */
			function objectMerge(...objects: any[]): any;
			/** @deprecated Use `BX.Runtime.clone()` */
			function objectClone<T>(object: T): T;
			function hex2rgb(color: string): { r: number; g: number; b: number };
			/** @deprecated Use `BX.Uri.removeParam()` */
			function remove_url_param(url: string, param: string | string[]): string;
			/** @deprecated Use `BX.Uri.addParam()` */
			function add_url_param(url: string, params: Record<string, string | string[]>): string;
			function buildQueryString(params: Record<string, string | string[]>): string;
			function even(digit: number | string): boolean;
			function hashCode(str: string): number;
			/** @deprecated Use `BX.Text.getRandom()` */
			function getRandomString(length?: number): string;
			function number_format(number: number, decimals?: number, decPoint?: string, thousandsSep?: string): string;
			function getExtension(url: string): string;
			function addObjectToForm(object: Record<string, any>, form: HTMLFormElement, prefix?: string): void;
			function escapeRegExp(str: string): string;
		}

		// ----------------------------------------------------------------
		// BX.validation (legacy)
		// ----------------------------------------------------------------

		namespace validation {
			/** @deprecated Use `BX.Validation.isEmail()` */
			function checkIfEmail(s: string): boolean;
			function checkIfPhone(s: string): boolean;
		}

		// ----------------------------------------------------------------
		// BX.prop
		// ----------------------------------------------------------------

		namespace prop {
			function get<T>(object: Record<string, any>, key: string, defaultValue: T): T;
			function getObject(object: Record<string, any>, key: string, defaultValue: Record<string, any>): Record<string, any>;
			function getElementNode(object: Record<string, any>, key: string, defaultValue: HTMLElement | null): HTMLElement | null;
			function getArray<T>(object: Record<string, any>, key: string, defaultValue: T[]): T[];
			function getFunction(object: Record<string, any>, key: string, defaultValue: Function): Function;
			function getNumber(object: Record<string, any>, key: string, defaultValue: number): number;
			function getInteger(object: Record<string, any>, key: string, defaultValue: number): number;
			function getBoolean(object: Record<string, any>, key: string, defaultValue: boolean): boolean;
			function getString(object: Record<string, any>, key: string, defaultValue: string): string;
			function extractDate(datetime?: Date): Date;
		}

		// ----------------------------------------------------------------
		// BX.selectUtils
		// ----------------------------------------------------------------

		namespace selectUtils {
			function addNewOption(oSelect: HTMLSelectElement | string, optValue: string, optName: string, doSort?: boolean, checkUnique?: boolean): void;
			function deleteOption(oSelect: HTMLSelectElement | string, optValue: string): void;
			function deleteSelectedOptions(oSelect: HTMLSelectElement | string): void;
			function deleteAllOptions(oSelect: HTMLSelectElement | string): void;
			function sortSelect(oSelect: HTMLSelectElement | string): void;
			function selectAllOptions(oSelect: HTMLSelectElement | string): void;
			function selectOption(oSelect: HTMLSelectElement | string, optValue: string): void;
			function addSelectedOptions(oSelect: HTMLSelectElement | string, toSelectId: string, checkUnique?: boolean, doSort?: boolean): void;
			function moveOptionsUp(oSelect: HTMLSelectElement | string): void;
			function moveOptionsDown(oSelect: HTMLSelectElement | string): void;
		}

		// ----------------------------------------------------------------
		// BX.convert
		// ----------------------------------------------------------------

		namespace convert {
			/** @deprecated Use `BX.Text.toNumber()` */
			function toNumber(value: any): number;
			/** @deprecated Use `Array.from()` */
			function nodeListToArray<T extends Element>(nodes: NodeListOf<T> | HTMLCollectionOf<T>): T[];
		}

		// ----------------------------------------------------------------
		// BX.CHint
		// ----------------------------------------------------------------

		class CHint {
			static cssLoaded: boolean;
			static openHints: Set<CHint>;
			static globalDisabled: boolean;
			static handleMenuOpen(): void;
			static handleMenuClose(): void;

			PARENT: HTMLElement | null;
			HINT: string;
			HINT_TITLE: string;
			PARAMS: Required<Pick<CHintParams, 'show_timeout' | 'hide_timeout' | 'dx' | 'showOnce' | 'preventHide' | 'min_width'>>;
			DIV: HTMLElement;
			CONTENT: HTMLElement;
			CONTENT_TEXT: HTMLElement;
			ID: string | null;
			disabled: boolean;

			constructor(params: CHintParams);
			CreateParent(element?: HTMLElement, params?: { type?: 'icon' | 'link'; iconSrc?: string }): HTMLElement;
			Show(): void;
			Hide(): void;
			Init(): void;
			setContent(content: string): void;
			Close(): void;
			Destroy(): void;
			enable(): void;
			disable(): void;
		}

		function hint(el: HTMLElement, hintTitle: string, hintHtml?: string, hintId?: string): void;
		function hint_replace(el: HTMLElement, hintTitle: string, hintHtml?: string): HTMLElement | null;
	}
}
