import Type from './type';
import Dom from './dom';

const UA = navigator.userAgent.toLowerCase();

/**
 * @memberOf BX
 */
export default class Browser
{
	static isOpera(): boolean
	{
		return UA.includes('opera');
	}

	static isIE(): boolean
	{
		return false;
	}

	static isIE6(): boolean
	{
		return false;
	}

	static isIE7(): boolean
	{
		return false;
	}

	static isIE8(): boolean
	{
		return false;
	}

	static isIE9(): boolean
	{
		return false;
	}

	static isIE10(): boolean
	{
		return false;
	}

	static isSafari(): boolean
	{
		return UA.includes('safari') && !UA.includes('chrome');
	}

	static isFirefox(): boolean
	{
		return UA.includes('firefox');
	}

	static isChrome(): boolean
	{
		return UA.includes('chrome');
	}

	static detectIEVersion(): number
	{
		return -1;
	}

	static isIE11(): boolean
	{
		return false;
	}

	static isMac(): boolean
	{
		return UA.includes('macintosh');
	}

	static isWin(): boolean
	{
		return UA.includes('windows');
	}

	static isLinux(): boolean
	{
		return UA.includes('linux') && !Browser.isAndroid();
	}

	static isAndroid(): boolean
	{
		return UA.includes('android');
	}

	static isIPad(): boolean
	{
		return UA.includes('ipad;') || (this.isMac() && this.isTouchDevice());
	}

	static isIPhone(): boolean
	{
		return UA.includes('iphone;');
	}

	static isIOS(): boolean
	{
		return Browser.isIPad() || Browser.isIPhone();
	}

	static isMobile(): boolean
	{
		return (
			Browser.isIPhone() || Browser.isIPad() || Browser.isAndroid() || UA.includes('mobile') || UA.includes('touch')
		);
	}

	static isRetina(): boolean
	{
		return window.devicePixelRatio >= 2;
	}

	static isTouchDevice(): boolean
	{
		return 'ontouchstart' in window || navigator.maxTouchPoints > 0 || (navigator as any).msMaxTouchPoints > 0;
	}

	static isDoctype(target?: Document): boolean
	{
		const doc = target || document;

		if (doc.compatMode)
		{
			return doc.compatMode === 'CSS1Compat';
		}

		return Boolean(doc.documentElement && doc.documentElement.clientHeight);
	}

	static isLocalStorageSupported(): boolean
	{
		return true;
	}

	static addGlobalClass(target?: Element): void
	{
		const element = Type.isElementNode(target) ? target : document.documentElement;
		let globalClass = 'bx-core';

		if (Dom.hasClass(element, globalClass))
		{
			return;
		}

		if (Browser.isIOS())
		{
			globalClass += ' bx-ios';
		}
		else if (Browser.isWin())
		{
			globalClass += ' bx-win';
		}
		else if (Browser.isMac())
		{
			globalClass += ' bx-mac';
		}
		else if (Browser.isLinux())
		{
			globalClass += ' bx-linux';
		}
		else if (Browser.isAndroid())
		{
			globalClass += ' bx-android';
		}

		globalClass += Browser.isMobile() ? ' bx-touch' : ' bx-no-touch';
		globalClass += Browser.isRetina() ? ' bx-retina' : ' bx-no-retina';

		if (Browser.isSafari())
		{
			globalClass += ' bx-safari';
		}
		else if (/AppleWebKit/.test(navigator.userAgent))
		{
			globalClass += ' bx-chrome';
		}
		else if (/Opera/.test(navigator.userAgent))
		{
			globalClass += ' bx-opera';
		}
		else if (Browser.isFirefox())
		{
			globalClass += ' bx-firefox';
		}

		Dom.addClass(element, globalClass);
	}

	static detectAndroidVersion(): number
	{
		const re = /Android ([\d.]+)/;

		if (re.exec(navigator.userAgent) !== null)
		{
			const res = navigator.userAgent.match(re);

			if (Type.isArrayLike(res) && res.length > 0)
			{
				return parseFloat(res[1]);
			}
		}

		return 0;
	}

	static isPropertySupported(jsProperty: string, returnCSSName?: boolean): string | false
	{
		if (jsProperty === '')
		{
			return false;
		}

		function getCssName(propertyName: string): string
		{
			return propertyName.replaceAll(/[A-Z]/g, (match) => `-${match.toLowerCase()}`);
		}

		function getJsName(cssName: string): string
		{
			const reg = /(\\-([a-z]))/g;

			if (reg.test(cssName))
			{
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

		for (const prop of properties)
		{
			if (obj && 'style' in obj && prop in obj.style)
			{
				const lowerProp = prop.slice(0, prop.length - property.length).toLowerCase();
				const prefix = prop === property ? '' : `-${lowerProp}-`;

				return bReturnCSSName ? prefix + getCssName(property) : prop;
			}
		}

		return false;
	}

	static addGlobalFeatures(features: unknown): void
	{
		if (!Type.isArray<string>(features))
		{
			return;
		}

		const classNames: string[] = [];

		for (const feature of features)
		{
			const support = Boolean(Browser.isPropertySupported(feature));
			classNames.push(`bx-${support ? '' : 'no-'}${feature.toLowerCase()}`);
		}

		Dom.addClass(document.documentElement, classNames.join(' '));
	}
}
