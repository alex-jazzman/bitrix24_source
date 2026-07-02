import Type from '../type';

export function renderParam(param: any, value: any): string
{
	if (Type.isNil(value))
	{
		return param;
	}

	return `${param}=${value}`;
}
