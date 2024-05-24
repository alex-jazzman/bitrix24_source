import { Dom } from 'main.core';
import { NodeFormatter, type NodeFormatterOptions } from 'ui.bbcode.formatter';

export class TableHeadCellNodeFormatter extends NodeFormatter
{
	constructor(options: NodeFormatterOptions = {})
	{
		super({
			name: 'th',
			convert(): HTMLTableElement {
				return Dom.create({
					tag: 'th',
					attrs: {
						classname: 'ui-formatter-table-head-cell',
					},
				});
			},
			...options,
		});
	}
}
