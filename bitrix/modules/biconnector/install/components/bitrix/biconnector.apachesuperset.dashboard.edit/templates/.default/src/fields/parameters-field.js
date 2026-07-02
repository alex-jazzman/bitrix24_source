import { Type } from 'main.core';

type SelectorValues = {
	groups: Set<number | string>,
	scopes: Set<string>,
	params: Set<string>,
};

export class ParametersField
{
	#defaultValues: Object;

	constructor(defaultValues: Object = {})
	{
		this.#defaultValues = Type.isPlainObject(defaultValues) ? defaultValues : {};
	}

	getDefaultScopes(): string[]
	{
		return this.#normalize(this.#defaultValues?.scopes);
	}

	getDefaultParams(): string[]
	{
		return this.#normalize(this.#defaultValues?.params);
	}

	getValue(selectorValues: ?SelectorValues): { scopes: string[], params: string[] }
	{
		const scopes = selectorValues?.scopes;
		const params = selectorValues?.params;

		return {
			scopes: this.#normalize(scopes instanceof Set ? [...scopes] : []),
			params: this.#normalize(params instanceof Set ? [...params] : []),
		};
	}

	#normalize(items: any): string[]
	{
		if (!Type.isArray(items))
		{
			return [];
		}

		return items.filter((item) => Type.isStringFilled(item));
	}
}
