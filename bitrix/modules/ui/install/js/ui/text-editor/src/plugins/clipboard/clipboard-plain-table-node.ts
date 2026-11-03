import {
	$createLineBreakNode,
	$createTextNode,
	ElementNode,
	type DOMConversion,
	type DOMConversionFn,
	type DOMConversionMap,
	type DOMConversionOutput,
	type SerializedElementNode,
} from 'ui.lexical.core';

export class ClipboardPlainTableNode extends ElementNode
{
	$config()
	{
		return this.config('plain-table-node', { extends: ElementNode });
	}

	exportJSON(): SerializedElementNode
	{
		throw new Error('Not implemented');
	}

	static importDOM(): DOMConversionMap | null
	{
		return {
			table: (): DOMConversion => {
				return {
					conversion: convertTableToPlainText as DOMConversionFn,
					priority: 0,
				};
			},
			tr: (): DOMConversion => {
				return {
					conversion: () => ({ node: null }),
					priority: 0,
				};
			},
			td: (): DOMConversion => {
				return {
					conversion: () => ({ node: null }),
					priority: 0,
				};
			},
			th: (): DOMConversion => {
				return {
					conversion: () => ({ node: null }),
					priority: 0,
				};
			},
		};
	}
}

function convertTableToPlainText(table: HTMLTableElement): DOMConversionOutput
{
	const nodes = [];
	const rows = [...table.rows];
	for (const row of rows)
	{
		if (nodes.length > 0)
		{
			nodes.push($createLineBreakNode());
		}

		const cells = [];
		for (const cell of row.cells)
		{
			if (cells.length > 0)
			{
				cells.push($createTextNode(' '));
			}

			cells.push($createTextNode(cell.textContent.trim()));
		}

		nodes.push(...cells);
	}

	return {
		node: nodes,
	};
}
