export function deepEqual(a: any, b: any): boolean
{
	if (a === b)
	{
		return true;
	}

	// eslint-disable-next-line @bitrix24/bitrix24-rules/no-typeof
	if (typeof a !== typeof b)
	{
		return false;
	}

	// eslint-disable-next-line @bitrix24/bitrix24-rules/no-typeof
	if (typeof a !== 'object' || a === null || b === null)
	{
		return false;
	}

	const keysA = Object.keys(a);
	const keysB = Object.keys(b);
	if (keysA.length !== keysB.length)
	{
		return false;
	}

	for (const key of keysA)
	{
		if (!deepEqual(a[key], b[key]))
		{
			return false;
		}
	}

	return true;
}
