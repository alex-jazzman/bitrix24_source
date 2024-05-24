import { NodeFormatter, type NodeFormatterOptions, type ConvertCallbackOptions } from 'ui.bbcode.formatter';

export class TextNodeFormatter extends NodeFormatter
{
	constructor(options: NodeFormatterOptions = {}) {
		super({
			name: '#text',
			convert({ node }: ConvertCallbackOptions): Text {
				return document.createTextNode(node.toString());
			},
			...options,
		});
	}
}
