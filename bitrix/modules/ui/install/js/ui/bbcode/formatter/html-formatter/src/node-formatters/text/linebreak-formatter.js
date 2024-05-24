import { NodeFormatter, type NodeFormatterOptions, type ConvertCallbackOptions } from 'ui.bbcode.formatter';
import { BBCodeElementNode } from 'ui.bbcode.model';

export class LinebreakNodeFormatter extends NodeFormatter
{
	constructor(options: NodeFormatterOptions = {}) {
		super({
			name: '#linebreak',
			convert({ node }: ConvertCallbackOptions): Text | HTMLBRElement {
				const nextSibling: ?BBCodeElementNode = node.getNextSibling();
				if (nextSibling && nextSibling.getName() === '#linebreak')
				{
					return document.createElement('br');
				}

				return document.createTextNode(node.getContent());
			},
			...options,
		});
	}
}
