import Type from './type';
import { evalGlobal } from '../legacy/html';
import extractAssets from './assets/extract-assets';
import debug from './runtime/debug';
import loadExtension from './runtime/loadextension/load-extension';
import clone from './runtime/clone';
import { loadAll } from './runtime/loadextension/internal/utils';
import merge from './runtime/merge';
import createComparator from './runtime/create-comparator';
import registerExtension from './runtime/loadextension/internal/register-extension';

export default class Runtime
{
	static debug: typeof debug = debug;
	static extractAssets: typeof extractAssets = extractAssets;
	static loadExtension: typeof loadExtension = loadExtension;
	static registerExtension: typeof registerExtension = registerExtension;
	static clone: typeof clone = clone;

	static debounce<F extends (...args: any[]) => any>(
		func: F,
		wait: number = 0,
		context: object | null = null,
	): (...args: Parameters<F>) => void
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

	static throttle<F extends (...args: any[]) => any>(
		func: F,
		wait: number = 0,
		context: object | null = null,
	): (...args: Parameters<F>) => void
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

	static html(node: HTMLElement, html: any, params: Record<string, any> = {}): Promise<void> | string
	{
		if (Type.isNil(html) && Type.isDomNode(node))
		{
			return node.innerHTML;
		}

		const assets = extractAssets(html);
		// `ext: 'css'` is not decoration: the loader otherwise guesses the kind of a resource
		// from the extension in its url, and an address collected from `<link rel="stylesheet">`
		// that happens to end in `.js` would be injected as a `<script src>` and run.
		const externalCss = assets.styles.map((item) => ({ url: item.href, ext: 'css' }));
		const externalJs = assets.scripts.filter((item) => !item.isInternal).map((item) => item.src);
		const inlineJs = assets.scripts.filter((item) => item.isInternal).map((item) => item.text);

		if (
			Type.isDomNode(node)
			&& (params.htmlFirst || (externalJs.length === 0 && externalCss.length === 0))
		)
		{
			if (params.useAdjacentHTML)
			{
				node.insertAdjacentHTML('beforeend', assets.html);
			}
			else
			{
				node.innerHTML = assets.html;
			}
		}

		return Promise.all([loadAll(externalJs), loadAll(externalCss)]).then(() => {
			if (Type.isDomNode(node) && (externalJs.length > 0 || externalCss.length > 0))
			{
				if (params.useAdjacentHTML)
				{
					node.insertAdjacentHTML('beforeend', assets.html);
				}
				else
				{
					node.innerHTML = assets.html;
				}
			}

			inlineJs.forEach((script) => evalGlobal(script));

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
	static merge(...targets: any[]): any
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
	): Array<{ [key: string]: any }>
	{
		const comparator = createComparator(fields, orders);

		return Object.values(collection).sort(comparator);
	}

	static destroy(target: any, errorMessage: string = 'Object is destroyed'): void
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
