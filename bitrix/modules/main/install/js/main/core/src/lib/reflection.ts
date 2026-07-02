import Type from './type';

/**
 * @memberOf BX
 */
export default class Reflection
{
	/**
	 * Gets link to function by function name
	 * @param className
	 * @return {?Function}
	 */
	static getClass(className: string | Function): Function | null
	{
		if (Type.isString(className) && Boolean(className))
		{
			let classFn: any = null;
			let currentNamespace: any = window;
			const namespaces = className.split('.');

			for (const namespace of namespaces)
			{
				if (!currentNamespace[namespace])
				{
					return null;
				}

				currentNamespace = currentNamespace[namespace];
				classFn = currentNamespace;
			}

			return classFn;
		}

		if (Type.isFunction(className))
		{
			return className;
		}

		return null;
	}

	/**
	 * Creates a namespace or returns a link to a previously created one
	 * @param {String} namespaceName
	 * @return {Record<string, any> | Function | null}
	 */
	static namespace(namespaceName: string): Record<string, any> | Function
	{
		let parts = namespaceName.split('.');
		let parent: any = (window as any).BX;

		if (parts[0] === 'BX')
		{
			parts = parts.slice(1);
		}

		for (const part of parts)
		{
			if (Type.isUndefined(parent[part]))
			{
				parent[part] = {};
			}

			parent = parent[part];
		}

		return parent;
	}
}
