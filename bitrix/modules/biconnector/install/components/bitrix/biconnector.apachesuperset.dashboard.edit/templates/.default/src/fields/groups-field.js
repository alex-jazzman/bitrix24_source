import { Type } from 'main.core';

type SelectorValues = {
	groups: Set<number | string>,
	scopes: Set<string>,
	params: Set<string>,
};

export class GroupsField
{
	#defaultValues: Object;

	constructor(defaultValues: Object = {})
	{
		this.#defaultValues = Type.isPlainObject(defaultValues) ? defaultValues : {};
	}

	getDefaultValue(): number[]
	{
		const groupIds = this.#defaultValues?.groups;
		if (!Type.isArray(groupIds))
		{
			return [];
		}

		return this.#normalize(groupIds);
	}

	getValue(selectorValues: ?SelectorValues): number[]
	{
		const groups = selectorValues?.groups;
		if (!(groups instanceof Set))
		{
			return [];
		}

		return this.#normalize([...groups]);
	}

	hasValue(selectorValues: ?SelectorValues): boolean
	{
		return this.getValue(selectorValues).length > 0;
	}

	#normalize(groupIds: Array<number | string>): number[]
	{
		return groupIds
			.map((groupId) => Number(groupId))
			.filter((groupId) => Number.isInteger(groupId) && groupId > 0)
		;
	}
}
