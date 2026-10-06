import { Type, Text } from 'main.core';
import { type OrderedArray } from 'main.core.collections';

import { TextNode } from '../common/text-node';
import { type MatchIndex } from './match-index';

export class Highlighter
{
	static mark(text: string | TextNode, matches: OrderedArray<MatchIndex>)
	{
		let encode = true;
		if (text instanceof TextNode)
		{
			if (text.getType() === 'html')
			{
				encode = false;
			}

			text = text.getText()!;
		}

		if (!Type.isStringFilled(text) || !matches || matches.count() === 0)
		{
			return text;
		}

		const str: string = text as string;
		let result = '';
		let offset = 0;
		let chunk = '';
		matches.forEach((match: MatchIndex) => {
			if (offset > match.getStartIndex()!)
			{
				return;
			}

			chunk = str.substring(offset, match.getStartIndex()!);
			result += encode ? Text.encode(chunk) : chunk;

			result += '<span class="ui-selector-highlight-mark">';

			chunk = str.substring(match.getStartIndex()!, match.getEndIndex()!);
			result += encode ? Text.encode(chunk) : chunk;

			result += '</span>';

			offset = match.getEndIndex()!;
		});

		chunk = str.substring(offset);
		result += encode ? Text.encode(chunk) : chunk;

		return result;
	}
}
