import { Type } from 'main.core';

function safeParse(input: string): any[] | null
{
	try
	{
		return JSON.parse(input);
	}
	catch (e)
	{
		console.error('JSON parse error', e);

		return null;
	}
}

export function parseItemsFromBlocksJson(input: any): Array<any>
{
	let blocks = input;

	if (Type.isStringFilled(input))
	{
		blocks = safeParse(input);
	}

	if (Type.isArray(blocks))
	{
		return blocks.flatMap((block) => block.items || []);
	}

	return [];
}
