import { NodeFormatter, type NodeFormatterOptions, type BeforeConvertCallbackOptions } from 'ui.bbcode.formatter';
import { type BBCodeNode } from 'ui.bbcode.model';
import { normalizeTextNodes } from '../../helpers/normalize-text-nodes';

export class RootNodeFormatter extends NodeFormatter
{
	constructor(options: NodeFormatterOptions = {})
	{
		super({
			name: '#root',
			convert(): DocumentFragment {
				return document.createDocumentFragment();
			},
			before({ node }: BeforeConvertCallbackOptions): BBCodeNode {
				return normalizeTextNodes(node);
			},
			...options,
		});
	}
}
