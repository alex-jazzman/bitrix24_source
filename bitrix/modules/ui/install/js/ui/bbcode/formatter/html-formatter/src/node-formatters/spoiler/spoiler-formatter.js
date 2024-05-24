import { Dom } from 'main.core';
import {
	NodeFormatter,
	type AfterCallbackOptions,
	type NodeFormatterOptions,
	type ConvertCallbackOptions,
} from 'ui.bbcode.formatter';

import './style.css';

export class SpoilerNodeFormatter extends NodeFormatter
{
	constructor(options: NodeFormatterOptions = {})
	{
		super({
			name: 'spoiler',
			convert({ node }: ConvertCallbackOptions): HTMLDetailsElement {
				return Dom.create({
					tag: 'details',
					attrs: {
						className: 'ui-formatter__spoiler ui-icon-set__scope',
					},
					children: [
						Dom.create({
							tag: 'summary',
							attrs: {
								className: 'ui-formatter__spoiler-title',
							},
							text: node.getValue(),
						}),
					],
				});
			},
			after({ element }: AfterCallbackOptions): HTMLElement {
				const [summary, ...content] = element.children;

				element.appendChild(summary);
				element.appendChild(
					Dom.create({
						tag: 'div',
						attrs: {
							className: 'ui-formatter__spoiler-content',
						},
						children: [
							...content,
						],
					}),
				);

				return element;
			},
			...options,
		});
	}
}
