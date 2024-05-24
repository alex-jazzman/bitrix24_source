import { Dom } from 'main.core';
import { NodeFormatter, type NodeFormatterOptions, type ConvertCallbackOptions } from 'ui.bbcode.formatter';

export class ParagraphNodeFormatter extends NodeFormatter
{
	constructor(options: NodeFormatterOptions = {})
	{
		super({
			name: 'p',
			convert({ node }: ConvertCallbackOptions): HTMLParagraphElement {
				return Dom.create({
					tag: node.getName(),
					attributes: node.getAttributes(),
				});
			},
			...options,
		});
	}
}
