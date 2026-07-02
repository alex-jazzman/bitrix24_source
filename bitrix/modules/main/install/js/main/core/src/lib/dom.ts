import Type from './type';
import Event from './event';
import encodeAttributeValue from '../internal/encode-attribute-value';
import decodeAttributeValue from '../internal/decode-attribute-value';
import getPageScroll from '../internal/get-page-scroll';

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

/**
 * @memberOf BX
 */
export default class Dom
{
	/**
	 * Replaces old html element to new html element
	 * @param oldElement
	 * @param newElement
	 */
	static replace(oldElement: HTMLElement | null | undefined, newElement: HTMLElement | null | undefined): void
	{
		if (Type.isDomNode(oldElement) && Type.isDomNode(newElement) && Type.isDomNode(oldElement.parentNode))
		{
			oldElement.parentNode.replaceChild(newElement, oldElement);
		}
	}

	/**
	 * Removes element
	 * @param element
	 */
	static remove(element: HTMLElement | null | undefined): void
	{
		if (Type.isDomNode(element) && Type.isDomNode(element.parentNode))
		{
			element.parentNode.removeChild(element);
		}
	}

	/**
	 * Cleans element
	 * @param element
	 */
	static clean(element: HTMLElement | string | null): void
	{
		if (Type.isDomNode(element))
		{
			while (element.firstChild)
			{
				element.removeChild(element.firstChild);
			}

			return;
		}

		if (Type.isString(element))
		{
			Dom.clean(document.getElementById(element));
		}
	}

	/**
	 * Inserts element before target element
	 * @param current
	 * @param target
	 */
	static insertBefore(current: HTMLElement | null | undefined, target: HTMLElement | null | undefined): void
	{
		if (Type.isDomNode(current) && Type.isDomNode(target) && Type.isDomNode(target.parentNode))
		{
			target.parentNode.insertBefore(current, target);
		}
	}

	/**
	 * Inserts element after target element
	 * @param current
	 * @param target
	 */
	static insertAfter(current: HTMLElement | null | undefined, target: HTMLElement | null | undefined): void
	{
		if (Type.isDomNode(current) && Type.isDomNode(target) && Type.isDomNode(target.parentNode))
		{
			const parent = target.parentNode;

			if (Type.isDomNode(target.nextSibling))
			{
				parent.insertBefore(current, target.nextSibling);

				return;
			}

			parent.appendChild(current);
		}
	}

	/**
	 * Appends element to target element
	 * @param current
	 * @param target
	 */
	static append(current: HTMLElement | null | undefined, target: HTMLElement | null | undefined): void
	{
		if (Type.isDomNode(current) && Type.isDomNode(target))
		{
			target.appendChild(current);
		}
	}

	/**
	 * Prepends element to target element
	 * @param current
	 * @param target
	 */
	static prepend(current: HTMLElement | null | undefined, target: HTMLElement | null | undefined): void
	{
		if (Type.isDomNode(current) && Type.isDomNode(target))
		{
			if (Type.isDomNode(target.firstChild))
			{
				target.insertBefore(current, target.firstChild);

				return;
			}

			Dom.append(current, target);
		}
	}

	/**
	 * Checks that element contains class name or class names
	 * @param element
	 * @param className
	 * @return {Boolean}
	 */
	static hasClass(element: unknown, className: string | string[]): boolean
	{
		if (Type.isElementNode(element))
		{
			if (Type.isString(className))
			{
				const preparedClassName = className.trim();

				if (preparedClassName.length > 0)
				{
					if (preparedClassName.includes(' '))
					{
						return preparedClassName.split(' ').every((name) => Dom.hasClass(element, name));
					}

					return element.classList.contains(preparedClassName);
				}
			}

			if (Type.isArray(className) && className.length > 0)
			{
				return className.every((name) => Dom.hasClass(element, name));
			}
		}

		return false;
	}

	/**
	 * Adds class name
	 * @param element
	 * @param className
	 */
	static addClass(element: unknown, className: string | string[]): void
	{
		if (Type.isElementNode(element))
		{
			if (Type.isString(className))
			{
				const preparedClassName = className.trim();

				if (preparedClassName.length > 0)
				{
					if (preparedClassName.includes(' '))
					{
						Dom.addClass(element, preparedClassName.split(' '));

						return;
					}

					element.classList.add(preparedClassName);

					return;
				}
			}

			if (Type.isArray(className))
			{
				className.forEach((name) => Dom.addClass(element, name));
			}
		}
	}

	/**
	 * Removes class name
	 * @param element
	 * @param className
	 */
	static removeClass(element: unknown, className: string | string[]): void
	{
		if (Type.isElementNode(element))
		{
			if (Type.isString(className))
			{
				const preparedClassName = className.trim();

				if (preparedClassName.length > 0)
				{
					if (preparedClassName.includes(' '))
					{
						Dom.removeClass(element, preparedClassName.split(' '));

						return;
					}

					element.classList.remove(preparedClassName);

					return;
				}
			}

			if (Type.isArray(className))
			{
				className.forEach((name) => Dom.removeClass(element, name));
			}
		}
	}

	/**
	 * Toggles class name
	 */
	static toggleClass(element: HTMLElement, className: string | string[], force?: boolean): void
	{
		if (!Type.isElementNode(element) || (!Type.isStringFilled(className) && !Type.isArrayFilled(className)))
		{
			return;
		}

		([className].flat() as any[])
			.flatMap((it: any): string[] => it?.trim?.().split(' '))
			.forEach((token: string): void => {
				if (Type.isStringFilled(token))
				{
					element.classList.toggle(token, Type.isBoolean(force) ? force : undefined);
				}
			});
	}

	/**
	 * Styles element
	 */
	static style(
		element: HTMLElement | null | undefined,
		prop: string | null | undefined | Record<string, string | number>,
		value?: string | number | null,
	): string | number | Element | null | undefined
	{
		if (Type.isElementNode(element))
		{
			if (Type.isNull(prop))
			{
				element.removeAttribute('style');

				return element;
			}

			if (Type.isPlainObject(prop))
			{
				Object.entries(prop).forEach(([currentKey, currentValue]) => {
					Dom.style(element, currentKey, currentValue as string | number);
				});

				return element;
			}

			if (Type.isString(prop))
			{
				if (Type.isUndefined(value) && element.nodeType !== Node.DOCUMENT_NODE)
				{
					const computedStyle = getComputedStyle(element);

					if (prop in computedStyle)
					{
						return computedStyle[prop as any];
					}

					return computedStyle.getPropertyValue(prop);
				}

				if (Type.isNull(value) || value === '' || value === 'null')
				{
					if (String(prop).startsWith('--'))
					{
						element.style.removeProperty(prop);

						return element;
					}

					(element.style as any)[prop] = '';

					return element;
				}

				if (Type.isString(value) || Type.isNumber(value))
				{
					if (String(prop).startsWith('--'))
					{
						element.style.setProperty(prop, String(value));

						return element;
					}

					(element.style as any)[prop] = value;

					return element;
				}
			}
		}

		return null;
	}

	/**
	 * Adjusts element
	 * @param target
	 * @param data
	 * @return {*}
	 */
	static adjust(target: HTMLElement | Document, data: AdjustData = {}): HTMLElement | null
	{
		if (!target.nodeType)
		{
			return null;
		}

		let element: HTMLElement = target as HTMLElement;

		if (target.nodeType === Node.DOCUMENT_NODE)
		{
			element = (target as Document).body;
		}

		if (Type.isPlainObject(data))
		{
			if (Type.isPlainObject(data.attrs))
			{
				const attrs = data.attrs as Record<string, string>;
				Object.keys(attrs).forEach((key) => {
					if (key === 'class' || key.toLowerCase() === 'classname')
					{
						element.className = attrs[key];

						return;
					}

					// eslint-disable-next-line eqeqeq
					if (attrs[key] == '')
					{
						element.removeAttribute(key);

						return;
					}

					element.setAttribute(key, attrs[key]);
				});
			}

			if (Type.isPlainObject(data.style))
			{
				Dom.style(element, data.style as Record<string, string | number>);
			}

			if (Type.isPlainObject(data.props))
			{
				const props = data.props as Record<string, unknown>;
				Object.keys(props).forEach((key) => {
					(element as any)[key] = props[key];
				});
			}

			if (Type.isPlainObject(data.events))
			{
				const events = data.events as Record<string, EventListenerOrEventListenerObject>;
				Object.keys(events).forEach((key) => {
					Event.bind(element, key, events[key] as (event: globalThis.Event) => void);
				});
			}

			if (Type.isPlainObject(data.dataset))
			{
				const dataset = data.dataset as Record<string, string>;
				Object.keys(dataset).forEach((key) => {
					element.dataset[key] = dataset[key];
				});
			}

			const children = Type.isString(data.children) ? [data.children] : data.children;

			if (Type.isArray(children) && children.length > 0)
			{
				children.forEach((item) => {
					if (Type.isDomNode(item))
					{
						Dom.append(item as HTMLElement, element);
					}

					if (Type.isString(item))
					{
						element.insertAdjacentHTML('beforeend', item);
					}
				});

				return element;
			}

			if ('text' in data && !Type.isNil(data.text))
			{
				element.textContent = data.text as string;

				return element;
			}

			if ('html' in data && !Type.isNil(data.html))
			{
				element.innerHTML = data.html as string;
			}
		}

		return element;
	}

	/**
	 * Creates element
	 * @param tag
	 * @param data
	 * @param context
	 * @return {HTMLElement|HTMLBodyElement}
	 */
	static create(tag: string | CreateOptions, data: AdjustData = {}, context: Document = document): HTMLElement | null
	{
		let tagName = tag as string;
		let options = data;

		if (Type.isObjectLike(tag))
		{
			const tagOptions = tag as CreateOptions;
			options = tagOptions;
			tagName = tagOptions.tag as string;
		}

		return Dom.adjust(context.createElement(tagName), options);
	}

	/**
	 * Shows element
	 * @param element
	 */
	static show(element: HTMLElement | null | undefined): void
	{
		if (Type.isDomNode(element))
		{
			element.hidden = false;
		}
	}

	/**
	 * Hides element
	 * @param element
	 */
	static hide(element: HTMLElement | null | undefined): void
	{
		if (Type.isDomNode(element))
		{
			element.hidden = true;
		}
	}

	/**
	 * Checks that element is shown
	 * @param element
	 * @return {*|boolean}
	 */
	static isShown(element: HTMLElement | null | undefined): boolean
	{
		return Type.isDomNode(element) && !element.hidden && element.style.getPropertyValue('display') !== 'none';
	}

	/**
	 * Checks if element is shown with recursive check of its ancestors
	 */
	static isShownRecursive(element: HTMLElement | null | undefined): boolean
	{
		if (!Type.isDomNode(element))
		{
			return false;
		}

		if (element === document.body)
		{
			return Dom.isShown(element);
		}

		return Dom.isShown(element) && Dom.isShownRecursive(element.parentElement);
	}

	/**
	 * Toggles element visibility
	 * @param element
	 */
	static toggle(element: HTMLElement): void
	{
		if (Type.isDomNode(element))
		{
			if (Dom.isShown(element))
			{
				Dom.hide(element);
			}
			else
			{
				Dom.show(element);
			}
		}
	}

	/**
	 * Gets element position relative page
	 * @param {HTMLElement} element
	 * @return {DOMRect}
	 */
	static getPosition(element: HTMLElement): DOMRect
	{
		if (Type.isDomNode(element))
		{
			const elementRect = element.getBoundingClientRect();
			const { scrollLeft, scrollTop } = getPageScroll();

			return new DOMRect(
				elementRect.left + scrollLeft,
				elementRect.top + scrollTop,
				elementRect.width,
				elementRect.height,
			);
		}

		return new DOMRect();
	}

	/**
	 * Gets element position relative specified element position
	 * @param {HTMLElement} element
	 * @param {HTMLElement} relationElement
	 * @return {DOMRect}
	 */
	static getRelativePosition(element: HTMLElement, relationElement: HTMLElement): DOMRect
	{
		if (Type.isDomNode(element) && Type.isDomNode(relationElement))
		{
			const elementPosition = Dom.getPosition(element);
			const relationElementPosition = Dom.getPosition(relationElement);

			return new DOMRect(
				elementPosition.left - relationElementPosition.left,
				elementPosition.top - relationElementPosition.top,
				elementPosition.width,
				elementPosition.height,
			);
		}

		return new DOMRect();
	}

	static attr(element: HTMLElement | null | undefined, attr: string | Record<string, unknown>, value?: unknown): any
	{
		if (Type.isElementNode(element))
		{
			if (Type.isString(attr))
			{
				if (!Type.isNil(value))
				{
					if (Type.isObjectLike(value))
					{
						element.setAttribute(attr, encodeAttributeValue(value));
					}
					else
					{
						element.setAttribute(attr, String(value));
					}
				}
				else if (Type.isNull(value))
				{
					element.removeAttribute(attr);
				}
				else
				{
					return decodeAttributeValue(element.getAttribute(attr));
				}
			}

			if (Type.isPlainObject(attr))
			{
				Object.entries(attr).forEach(([attrKey, attrValue]) => {
					Dom.attr(element, attrKey, attrValue);
				});
			}
		}

		return null;
	}
}
