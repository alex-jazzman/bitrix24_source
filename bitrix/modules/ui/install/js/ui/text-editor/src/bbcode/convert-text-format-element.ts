import { $isTextNode, type LexicalNode, type TextFormatType } from 'ui.lexical.core';

import { type BBCodeNode } from 'ui.bbcode.model';
import { type BBCodeConversionOutput } from './types';

const nodeNameToTextFormat: Record<string, TextFormatType> = {
	b: 'bold',
	strong: 'bold',
	i: 'italic',
	em: 'italic',
	s: 'strikethrough',
	del: 'strikethrough',
	u: 'underline',
	sub: 'subscript',
	sup: 'superscript',
};

// the parameter is as wide as BBCodeConversionFn declares it: a narrower one made every
// consumer cast the function back to the contract it already satisfies
export function convertTextFormatElement(node: BBCodeNode): BBCodeConversionOutput
{
	const format: TextFormatType | undefined = nodeNameToTextFormat[node.getName()];
	if (format === undefined)
	{
		return { node: null };
	}

	return {
		forChild: (lexicalNode: LexicalNode): LexicalNode => {
			if ($isTextNode(lexicalNode) && !lexicalNode.hasFormat(format))
			{
				lexicalNode.toggleFormat(format);
			}

			return lexicalNode;
		},
		node: null,
	};
}
