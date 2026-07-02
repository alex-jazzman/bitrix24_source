import Type from '../lib/type';
import Text from '../lib/text';

export default function decodeAttributeValue(value: unknown): unknown
{
	if (Type.isString(value))
	{
		const decodedValue = Text.decode(value);
		let result: unknown = null;

		try
		{
			result = JSON.parse(decodedValue);
		}
		catch
		{
			result = decodedValue;
		}

		if (result === decodedValue && /^[\d.]+[.]?\d+$/.test(result as string))
		{
			return Number(result);
		}

		if (result === 'true' || result === 'false')
		{
			return Boolean(result);
		}

		return result;
	}

	return value;
}
