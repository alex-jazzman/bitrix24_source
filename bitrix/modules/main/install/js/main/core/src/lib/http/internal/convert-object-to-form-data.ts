import Type from '../../type';

export default function objectToFormData(
	source: { [key: string]: any },
	formData: FormData = new FormData(),
	pre: string | null = null,
): FormData
{
	if (Type.isUndefined(source))
	{
		return formData;
	}

	if (Type.isNull(source))
	{
		formData.append(pre!, '');
	}
	else if (Type.isArray(source))
	{
		if (source.length > 0)
		{
			source.forEach((value: any, index: number) => {
				const key = `${pre}[${index}]`;
				objectToFormData(value, formData, key);
			});
		}
		else
		{
			const key = `${pre}[]`;
			formData.append(key, '');
		}
	}
	else if (Type.isDate(source))
	{
		formData.append(pre!, source.toISOString());
	}
	else if (Type.isObject(source) && !Type.isFile(source) && !Type.isBlob(source))
	{
		Object.keys(source).forEach((property) => {
			const value = source[property];
			let preparedProperty = property;

			if (Type.isArray(value))
			{
				while (preparedProperty.length > 2 && preparedProperty.lastIndexOf('[]') === preparedProperty.length - 2)
				{
					preparedProperty = preparedProperty.slice(0, -2);
				}
			}

			const key = pre ? `${pre}[${preparedProperty}]` : preparedProperty;
			objectToFormData(value, formData, key);
		});
	}
	else
	{
		formData.append(pre!, source);
	}

	return formData;
}
