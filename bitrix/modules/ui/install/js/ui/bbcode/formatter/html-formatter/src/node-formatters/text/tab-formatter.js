import { NodeFormatter, type NodeFormatterOptions, type ConvertCallbackOptions } from 'ui.bbcode.formatter';

export class TabNodeFormatter extends NodeFormatter
{
	constructor(options: NodeFormatterOptions = {}) {
		super({
			name: '#tab',
			convert({ node }: ConvertCallbackOptions): Text {
				return document.createTextNode(node.toString());
			},
			...options,
		});
	}
}
