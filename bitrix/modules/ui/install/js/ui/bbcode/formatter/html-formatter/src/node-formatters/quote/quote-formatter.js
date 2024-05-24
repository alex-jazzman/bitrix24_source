import { Dom } from 'main.core';
import { NodeFormatter, type NodeFormatterOptions } from 'ui.bbcode.formatter';

import './style.css';

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
						className: 'ui-formatter-blockquote',
					},
				});
			},
			...options,
		});
	}
}
