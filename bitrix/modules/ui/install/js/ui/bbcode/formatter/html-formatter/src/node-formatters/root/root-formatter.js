import { NodeFormatter, type NodeFormatterOptions } from 'ui.bbcode.formatter';

export class RootNodeFormatter extends NodeFormatter
{
	constructor(options: NodeFormatterOptions = {})
	{
		super({
			name: '#root',
			convert(): DocumentFragment {
				return document.createDocumentFragment();
			},
			...options,
		});
	}
}
