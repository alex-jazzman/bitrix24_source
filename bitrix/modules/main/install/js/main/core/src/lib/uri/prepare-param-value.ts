import Type from '../type';

export default function prepareParamValue(value: any): string | Array<string> | { [key: string]: unknown }
{
	if (Type.isArray(value))
	{
		return value.map((item) => String(item));
	}

	if (Type.isPlainObject(value))
	{
		return { ...value };
	}

	return String(value);
}
