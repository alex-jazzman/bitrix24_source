import { Dom } from 'main.core';
import {
	NodeFormatter,
	type NodeFormatterOptions,
	type BeforeConvertCallbackOptions,
	type ForChildCallbackOptions,
} from 'ui.bbcode.formatter';
import {
	BBCodeElementNode,
	BBCodeNewLineNode,
	BBCodeScheme,
	BBCodeTextNode,
} from 'ui.bbcode.model';

import './style.css';

export class CodeNodeFormatter extends NodeFormatter
{
	constructor(options: NodeFormatterOptions = {})
	{
		super({
			name: 'code',
			before({ node }: BeforeConvertCallbackOptions): BBCodeElementNode {
				const scheme: BBCodeScheme = node.getScheme();
				const preparedNode: BBCodeElementNode = CodeNodeFormatter.trimLinebreaks(node);
				const children: Array<BBCodeTextNode> = preparedNode.getChildren();
				const newChildren: Array<BBCodeTextNode> = [];

				let newNode: BBCodeTextNode = scheme.createText();
				children.forEach((child: BBCodeTextNode | BBCodeNewLineNode) => {
					if (scheme.isNewLine(child))
					{
						newChildren.push(newNode, child);
						newNode = scheme.createText();
					}
					else
					{
						newNode.setContent(newNode.getContent() + child.getContent());
					}
				});

				preparedNode.setChildren([...newChildren, newNode]);

				return preparedNode;
			},
			convert(): HTMLPreElement {
				return Dom.create({
					tag: 'pre',
					attrs: {
						className: 'ui-formatter-code-block',
					},
				});
			},
			forChild({ node, element }: ForChildCallbackOptions): Text {
				if (node.getPlainTextLength() === 0)
				{
					return null;
				}

				const scheme: BBCodeScheme = node.getScheme();
				if (scheme.isText(node))
				{
					const preparedLine: string = node.toString().replaceAll(/\t/g, ' '.repeat(4));

					return Dom.create({
						tag: 'span',
						attrs: {
							className: 'ui-formatter-code-line',
						},
						text: preparedLine,
					});
				}

				return element;
			},
			...options,
		});
	}

	static trimLinebreaks(node: BBCodeElementNode): BBCodeElementNode
	{
		const scheme: BBCodeScheme = node.getScheme();

		let firstChild = node.getFirstChild();
		while (scheme.isNewLine(firstChild))
		{
			firstChild.remove();
			firstChild = node.getFirstChild();
		}

		let lastChild = node.getLastChild();
		while (scheme.isNewLine(lastChild))
		{
			lastChild.remove();
			lastChild = node.getFirstChild();
		}

		return node;
	}
}
