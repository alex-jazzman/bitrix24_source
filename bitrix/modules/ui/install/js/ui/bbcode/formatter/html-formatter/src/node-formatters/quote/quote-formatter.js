import { Dom } from 'main.core';
import type { BeforeConvertCallbackOptions } from 'ui.bbcode.formatter';
import { NodeFormatter, type NodeFormatterOptions } from 'ui.bbcode.formatter';
import type { BBCodeNode } from 'ui.bbcode.model';
import { normalizeLineBreaks } from '../../helpers/normalize-line-breaks';

export class QuoteNodeFormatter extends NodeFormatter
{
	constructor(options: NodeFormatterOptions = {})
	{
		super({
			name: 'quote',
			convert(): HTMLQuoteElement {
				return Dom.create({
					tag: 'blockquote',
					attrs: {
						className: 'ui-typography-quote',
					},
				});
			},
			before({ node }: BeforeConvertCallbackOptions): BBCodeNode {
				return normalizeLineBreaks(node);
			},
			...options,
		});
	}
}
