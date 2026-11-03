import { Type } from 'main.core';
import {
	$createLineBreakNode,
	$createTabNode,
	$createTextNode,
	type LineBreakNode,
	type TextNode,
} from 'ui.lexical.core';

export function $createNodesFromText(text: string): Array<TextNode | LineBreakNode>
{
	if (!Type.isStringFilled(text))
	{
		return [];
	}

	const nodes: Array<TextNode | LineBreakNode> = [];
	const parts = text.split(/(\r?\n|\t)/);
	const length = parts.length;
	for (let i = 0; i < length; i++)
	{
		const part = parts[i];
		if (part === '\n' || part === '\r\n')
		{
			nodes.push($createLineBreakNode());
		}
		else if (part === '\t')
		{
			nodes.push($createTabNode());
		}
		else
		{
			nodes.push($createTextNode(part));
		}
	}

	return nodes;
}
