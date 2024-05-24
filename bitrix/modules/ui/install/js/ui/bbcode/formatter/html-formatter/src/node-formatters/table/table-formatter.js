import { Dom } from 'main.core';
import { NodeFormatter, type NodeFormatterOptions } from 'ui.bbcode.formatter';

import './style.css';

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
						classname: 'ui-formatter-table',
					},
				});
			},
			...options,
		});
	}
}
