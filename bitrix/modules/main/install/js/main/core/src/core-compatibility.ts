/* eslint-disable prefer-rest-params */

import Type from './lib/type';
import Reflection from './lib/reflection';
import Dom from './lib/dom';
import Browser from './lib/browser';
import Event from './lib/event';
import Http from './lib/http';
import { type CookieOptions } from './lib/http/cookie';
import Runtime from './lib/runtime';
import Text from './lib/text';
import messageFunction, { type MessageFunction } from './lib/loc/message';
import * as debugNs from './lib/runtime/debug';
import {isReady} from './lib/event/ready';
import type bindFn from './lib/event/bind';
import type unbindFn from './lib/event/unbind';
import type bindOnceFn from './lib/event/bind-once';
import getElement from './internal/get-element';
import getWindow from './internal/get-window';
import EventEmitter from './lib/event/event-emitter';
import BaseEvent from './lib/event/base-event';
import { Easing } from './lib/animation/easing';
import { FX } from './lib/animation/fx';
import { localStorage } from './lib/local-storage';
import { Page } from './lib/page';

// BX.*
export const getClass: typeof Reflection.getClass = Reflection.getClass;
export const namespace: typeof Reflection.namespace = Reflection.namespace;
export const message: MessageFunction = messageFunction;
export const easing: typeof Easing = Easing;
export const fx: typeof FX = FX;
export const PageObject: typeof Page = Page;

/**
 * @memberOf BX
 */
export const replace: typeof Dom.replace = Dom.replace;
export const remove: typeof Dom.remove = Dom.remove;
export const clean: typeof Dom.clean = Dom.clean;
export const insertBefore: typeof Dom.insertBefore = Dom.insertBefore;
export const insertAfter: typeof Dom.insertAfter = Dom.insertAfter;
export const append: typeof Dom.append = Dom.append;
export const prepend: typeof Dom.prepend = Dom.prepend;
export const style: typeof Dom.style = Dom.style;
export const adjust: typeof Dom.adjust = Dom.adjust;
export const create: typeof Dom.create = Dom.create;
export const isShown: typeof Dom.isShown = Dom.isShown;

export const addClass: (...args: any[]) => void = function addClass() {
	Dom.addClass(...Runtime.merge([], Array.from(arguments), [getElement(arguments[0])]) as [any, any]);
};

export const removeClass: (...args: any[]) => void = function removeClass() {
	Dom.removeClass(...Runtime.merge(Array.from(arguments), [getElement(arguments[0])]) as [any, any]);
};

export const hasClass: (...args: any[]) => boolean = function hasClass() {
	return Dom.hasClass(...Runtime.merge(Array.from(arguments), [getElement(arguments[0])]) as [any, any]);
};

export const toggleClass: (...args: any[]) => void = function toggleClass() {
	Dom.toggleClass(...Runtime.merge(Array.from(arguments), [getElement(arguments[0])]) as [any, any]);
};

export const cleanNode = (element: string | HTMLElement, removeElement: boolean = false): HTMLElement | null => {
	const currentElement = getElement(element);

	if (Type.isDomNode(currentElement))
	{
		Dom.clean(currentElement);

		if (removeElement)
		{
			Dom.remove(currentElement);
			return currentElement;
		}
	}

	return currentElement;
};

export const getCookie: typeof Http.Cookie.get = Http.Cookie.get;
export const setCookie = (name: string, value: any, options: CookieOptions = {}): void => {
	const attributes: Record<string, any> = {...options};

	if (Type.isNumber(attributes.expires))
	{
		attributes.expires /= (3600 * 24);
	}

	Http.Cookie.set(name, value, attributes);
};

export const bind: typeof bindFn = Event.bind;
export const unbind: typeof unbindFn = Event.unbind;
export const unbindAll: (target: any, eventName?: string) => void = Event.unbindAll;
export const bindOnce: typeof bindOnceFn = Event.bindOnce;
export const ready: (handler: () => void) => void = Event.ready;

export {isReady};
export const debugEnableFlag: boolean = debugNs.debugState;
export const debugStatus: typeof debugNs.isDebugEnabled = debugNs.isDebugEnabled;
export const debug: typeof debugNs.default = debugNs.default;

export const debugEnable = (value: any): void => {
	if (value)
	{
		debugNs.enableDebug();
	}
	else
	{
		debugNs.disableDebug();
	}
};

export const clone: <T>(value: T) => T = Runtime.clone;
export const loadExt: typeof Runtime.loadExtension = Runtime.loadExtension;
export const debounce: typeof Runtime.debounce = Runtime.debounce;
export const throttle: typeof Runtime.throttle = Runtime.throttle;
export const html: typeof Runtime.html = Runtime.html;

type TypeCompatLibrary = {
	isNotEmptyString: (value: any) => boolean,
	isNotEmptyObject: (value: any) => boolean,
	isMapKey: typeof Type.isObject,
	stringToInt: (value: any) => number,
	[method: string]: any,
};

// BX.type
export const type: TypeCompatLibrary = {
	...Object.getOwnPropertyNames(Type)
		.filter(key => !['name', 'length', 'prototype', 'caller', 'arguments'].includes(key))
		.reduce((acc: Record<string, any>, key) => {
			acc[key] = (Type as any)[key];
			return acc;
		}, {}),
	isNotEmptyString: (value: any) => Type.isString(value) && value !== '',
	isNotEmptyObject: (value: any) => Type.isObjectLike(value) && Object.keys(value).length > 0,
	isMapKey: Type.isObject,
	stringToInt: (value: any) => {
		const parsed = parseInt(value);
		return !Number.isNaN(parsed) ? parsed : 0;
	},
};

type WindowSize = {
	innerWidth: number,
	innerHeight: number,
	scrollLeft: number,
	scrollTop: number,
	scrollWidth: number,
	scrollHeight: number,
};

type BrowserCompat = {
	IsOpera: typeof Browser.isOpera,
	IsIE: typeof Browser.isIE,
	IsIE6: typeof Browser.isIE6,
	IsIE7: typeof Browser.isIE7,
	IsIE8: typeof Browser.isIE8,
	IsIE9: typeof Browser.isIE9,
	IsIE10: typeof Browser.isIE10,
	IsIE11: typeof Browser.isIE11,
	IsSafari: typeof Browser.isSafari,
	IsFirefox: typeof Browser.isFirefox,
	IsChrome: typeof Browser.isChrome,
	DetectIeVersion: typeof Browser.detectIEVersion,
	IsMac: typeof Browser.isMac,
	IsAndroid: typeof Browser.isAndroid,
	isIPad: typeof Browser.isIPad,
	isIPhone: typeof Browser.isIPhone,
	IsIOS: typeof Browser.isIOS,
	IsMobile: typeof Browser.isMobile,
	isRetina: typeof Browser.isRetina,
	IsDoctype: typeof Browser.isDoctype,
	SupportLocalStorage: typeof Browser.isLocalStorageSupported,
	addGlobalClass: typeof Browser.addGlobalClass,
	DetectAndroidVersion: typeof Browser.detectAndroidVersion,
	isPropertySupported: typeof Browser.isPropertySupported,
	addGlobalFeatures: typeof Browser.addGlobalFeatures,
};

// BX.browser
export const browser: BrowserCompat = {
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
	addGlobalFeatures: Browser.addGlobalFeatures,
};

// eslint-disable-next-line
const ajax: any = (window as any).BX ? (window as any).BX.ajax : () => {};
export {ajax};

export function GetWindowScrollSize(doc: Document = document): { scrollWidth: number, scrollHeight: number }
{
	return {
		scrollWidth: doc.documentElement.scrollWidth,
		scrollHeight: doc.documentElement.scrollHeight,
	};
}

export function GetWindowScrollPos(doc: Document = document): { scrollLeft: number, scrollTop: number }
{
	const win = getWindow(doc);

	return {
		scrollLeft: win.pageXOffset,
		scrollTop: win.pageYOffset,
	};
}

export function GetWindowInnerSize(doc: Document = document): { innerWidth: number, innerHeight: number }
{
	const win = getWindow(doc);
	return {innerWidth: win.innerWidth, innerHeight: win.innerHeight};
}

export function GetWindowSize(doc: Document = document): WindowSize
{
	return {
		...GetWindowInnerSize(doc),
		...GetWindowScrollPos(doc),
		...GetWindowScrollSize(doc),
	};
}

export function GetContext(node: Node | null): Window
{
	return getWindow(node);
}

export function pos(element: any, relative: boolean = false): any
{
	if (!element)
	{
		return (new DOMRect()).toJSON();
	}

	if (element.ownerDocument === document && !relative)
	{
		const clientRect = element.getBoundingClientRect();
		const root = document.documentElement;
		const {body} = document;

		return {
			top: Math.round(clientRect.top + (root.scrollTop || body.scrollTop)),
			left: Math.round(clientRect.left + (root.scrollLeft || body.scrollLeft)),
			width: Math.round(clientRect.right - clientRect.left),
			height: Math.round(clientRect.bottom - clientRect.top),
			right: Math.round(clientRect.right + (root.scrollLeft || body.scrollLeft)),
			bottom: Math.round(clientRect.bottom + (root.scrollTop || body.scrollTop)),
		};
	}

	let x = 0;
	let y = 0;
	const w = element.offsetWidth;
	const h = element.offsetHeight;
	let first = true;

	// eslint-disable-next-line no-param-reassign
	for (; element != null; element = element.offsetParent)
	{
		if (!first && relative && (window as any).BX.is_relative(element))
		{
			break;
		}

		x += element.offsetLeft;
		y += element.offsetTop;

		if (first)
		{
			first = false;
			// eslint-disable-next-line no-continue
			continue;
		}

		x += Text.toNumber(Dom.style(element, 'border-left-width'));
		y += Text.toNumber(Dom.style(element, 'border-top-width'));
	}

	return (new DOMRect(x, y, w, h)).toJSON();
}

export function addCustomEvent(eventObject: any, eventName: any, eventHandler: any): void
{
	if (Type.isString(eventObject))
	{
		eventHandler = eventName;
		eventName = eventObject;
		eventObject = EventEmitter.GLOBAL_TARGET;
	}

	if (eventObject === window)
	{
		eventObject = EventEmitter.GLOBAL_TARGET;
	}

	if (!Type.isObject(eventObject))
	{
		console.error('The "eventObject" argument must be an object. Received type '+ typeof(eventObject) + '.');
		return;
	}

	if (!Type.isStringFilled(eventName))
	{
		console.error('The "eventName" argument must be a string.');
		return;
	}

	if (!Type.isFunction(eventHandler))
	{
		console.error('The "eventHandler" argument must be a function. Received type '+ typeof(eventHandler) + '.');
		return;
	}

	eventName = eventName.toLowerCase();

	EventEmitter.subscribe(eventObject, eventName, eventHandler, { compatMode: true, useGlobalNaming: true });
}

export function onCustomEvent(eventObject: any, eventName: any, eventParams?: any, secureParams?: any): void
{
	if (Type.isString(eventObject))
	{
		secureParams = eventParams;
		eventParams = eventName;
		eventName = eventObject;
		eventObject = EventEmitter.GLOBAL_TARGET;
	}

	if (!Type.isObject(eventObject) || eventObject === window)
	{
		eventObject = EventEmitter.GLOBAL_TARGET;
	}

	if (!eventParams)
	{
		eventParams = [];
	}

	eventName = eventName.toLowerCase();

	const event = new BaseEvent();
	event.setData(eventParams);
	event.setCompatData(eventParams);

	EventEmitter.emit(eventObject, eventName, event, { cloneData: secureParams === true, useGlobalNaming: true });
}

export function removeCustomEvent(eventObject: any, eventName: any, eventHandler: any): void
{
	if (Type.isString(eventObject))
	{
		eventHandler = eventName;
		eventName = eventObject;
		eventObject = EventEmitter.GLOBAL_TARGET;
	}

	if (!Type.isFunction(eventHandler))
	{
		console.error('The "eventHandler" argument must be a function. Received type '+ typeof(eventHandler) + '.');
		return;
	}

	if (eventObject === window)
	{
		eventObject = EventEmitter.GLOBAL_TARGET;
	}

	eventName = eventName.toLowerCase();

	EventEmitter.unsubscribe(eventObject, eventName, eventHandler, { useGlobalNaming: true });
}

export function removeAllCustomEvents(eventObject: any, eventName: any): void
{
	if (Type.isString(eventObject))
	{
		eventName = eventObject;
		eventObject = EventEmitter.GLOBAL_TARGET;
	}

	if (eventObject === window)
	{
		eventObject = EventEmitter.GLOBAL_TARGET;
	}

	eventName = eventName.toLowerCase();

	EventEmitter.unsubscribeAll(eventObject, eventName, { useGlobalNaming: true });
}

export function onGlobalCustomEvent(eventName: any, arEventParams: any, bSkipSelf: any): void
{
	localStorage.set('BXGCE', { e: eventName, p: arEventParams }, 1);

	if (!bSkipSelf)
	{
		onCustomEvent(eventName, arEventParams);
	}
}
