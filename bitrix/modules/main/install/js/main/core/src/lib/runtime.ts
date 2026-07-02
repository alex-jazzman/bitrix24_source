import Type from './type';
import debug from './runtime/debug';
import loadExtension from './runtime/loadextension/load-extension';
import clone from './runtime/clone';
import {
	fetchExternalScripts,
	fetchExternalStyles,
	fetchInlineScripts,
	loadAll,
} from './runtime/loadextension/internal/utils';
import merge from './runtime/merge';
import createComparator from './runtime/create-comparator';
import registerExtension from './runtime/loadextension/internal/register-extension';

export default class Runtime
{
	static debug = debug;
	static loadExtension = loadExtension;
	static registerExtension = registerExtension;
	static clone = clone;

	static debounce(func: Function, wait: number = 0, context: any = null): Function
	{
		let timeoutId: ReturnType<typeof setTimeout> | null = null;

		return function debounced(this: any, ...args: any[])
		{
			if (Type.isNumber(timeoutId))
			{
				clearTimeout(timeoutId);
			}

			timeoutId = setTimeout(() => {
				func.apply(context || this, args);
			}, wait);
		};
	}

	static throttle(func: Function, wait: number = 0, context: any = null): Function
	{
		let timer: ReturnType<typeof setTimeout> | null = null;
		let invoke: boolean = false;

		return function wrapper(this: any, ...args: any[])
		{
			invoke = true;

			if (!timer)
			{
				const q = function q(this: any)
				{
					if (invoke)
					{
						func.apply(context || this, args);
						invoke = false;
						timer = setTimeout(q, wait);
					}
					else
					{
						timer = null;
					}
				};
				q();
			}
		};
	}

	static html(node: HTMLElement, html: any, params: Record<string, any> = {}): Promise<any> | string
	{
		if (Type.isNil(html) && Type.isDomNode(node))
		{
			return node.innerHTML;
		}

		// eslint-disable-next-line @bitrix24/bitrix24-rules/no-bx
		const parsedHtml = BX.processHTML(html);
		const externalCss = parsedHtml.STYLE.reduce((acc: any, item: any) => fetchExternalStyles(acc, item), []);
		const externalJs = parsedHtml.SCRIPT.reduce((acc: any, item: any) => fetchExternalScripts(acc, item), []);
		const inlineJs = parsedHtml.SCRIPT.reduce((acc: any, item: any) => fetchInlineScripts(acc, item), []);

		if (
			Type.isDomNode(node)
			&& (params.htmlFirst || (externalJs.length === 0 && externalCss.length === 0))
		)
		{
			if (params.useAdjacentHTML)
			{
				node.insertAdjacentHTML('beforeend', parsedHtml.HTML);
			}
			else
			{
				node.innerHTML = parsedHtml.HTML;
			}
		}

		return Promise.all([loadAll(externalJs), loadAll(externalCss)]).then(() => {
			if (Type.isDomNode(node) && (externalJs.length > 0 || externalCss.length > 0))
			{
				if (params.useAdjacentHTML)
				{
					node.insertAdjacentHTML('beforeend', parsedHtml.HTML);
				}
				else
				{
					node.innerHTML = parsedHtml.HTML;
				}
			}

			// eslint-disable-next-line @bitrix24/bitrix24-rules/no-bx
			inlineJs.forEach((script: any) => BX.evalGlobal(script));

			if (Type.isFunction(params.callback))
			{
				params.callback();
			}
		});
	}

	/**
	 * Merges objects or arrays
	 * @param targets
	 * @return {any}
	 */
	static merge(...targets: any[])
	{
		if (Type.isArray(targets[0]))
		{
			targets.unshift([]);
		}
		else if (Type.isObject(targets[0]))
		{
			targets.unshift({});
		}

		return targets.reduce((acc, item) => {
			return merge(acc, item);
		}, targets[0]);
	}

	static orderBy(
		collection: Array<{ [key: string]: any }> | { [key: string]: { [key: string]: any } },
		fields: Array<string> = [],
		orders: Array<string> = [],
	)
	{
		const comparator = createComparator(fields, orders);

		return Object.values(collection).sort(comparator);
	}

	static destroy(target: any, errorMessage = 'Object is destroyed')
	{
		if (Type.isObject(target))
		{
			const onPropertyAccess = () => {
				throw new Error(errorMessage);
			};
			const ownProperties = Object.keys(target);
			const prototypeProperties = (() => {
				const targetPrototype = Object.getPrototypeOf(target);
				if (Type.isObject(targetPrototype))
				{
					return Object.getOwnPropertyNames(targetPrototype);
				}

				return [];
			})();

			const uniquePropertiesList = [...new Set([...ownProperties, ...prototypeProperties])];

			uniquePropertiesList
				.filter((name) => {
					const descriptor = Object.getOwnPropertyDescriptor(target, name);

					return !/__(.+)__/.test(name) && (!Type.isObject(descriptor) || descriptor.configurable === true);
				})
				.forEach((name) => {
					Object.defineProperty(target, name, {
						get: onPropertyAccess,
						set: onPropertyAccess,
						configurable: false,
					});
				});

			Object.setPrototypeOf(target, null);
		}
	}
}
