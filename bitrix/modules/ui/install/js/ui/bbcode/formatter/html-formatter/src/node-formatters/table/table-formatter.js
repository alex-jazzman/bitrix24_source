import { Dom, Tag } from 'main.core';
import { NodeFormatter, type NodeFormatterOptions, type AfterCallbackOptions } from 'ui.bbcode.formatter';

export class TableNodeFormatter extends NodeFormatter
{
	constructor(options: NodeFormatterOptions = {})
	{
		super({
			name: 'table',
			convert(): HTMLTableElement {
				return Dom.create({
					tag: 'table',
					attrs: {
						classname: 'ui-typography-table',
					},
				});
			},
			after({ element }: AfterCallbackOptions): HTMLElement {
				const container = Tag.render`<div class="ui-typography-table-scroll"></div>`;
				container.appendChild(element);

				return container;
			},
			...options,
		});
	}
}
