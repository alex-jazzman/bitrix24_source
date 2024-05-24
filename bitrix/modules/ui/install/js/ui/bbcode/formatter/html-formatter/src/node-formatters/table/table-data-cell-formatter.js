import { Dom } from 'main.core';
import { NodeFormatter, type NodeFormatterOptions } from 'ui.bbcode.formatter';

export class TableDataCellNodeFormatter extends NodeFormatter
{
	constructor(options: NodeFormatterOptions = {})
	{
		super({
			name: 'td',
			convert(): HTMLTableElement {
				return Dom.create({
					tag: 'td',
					attrs: {
						classname: 'ui-formatter-table-data-cell',
					},
				});
			},
			...options,
		});
	}
}
