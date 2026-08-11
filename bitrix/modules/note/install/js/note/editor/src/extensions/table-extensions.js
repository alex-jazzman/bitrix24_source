import { TableKit, TableCell, TableHeader, Table } from '@tiptap/extension-table';
import { columnResizing, tableEditing } from 'prosemirror-tables';
import { parseEnrichedAssetCell } from './attachments';
import { parseAllEnrichedAssets, parseAttrs, ASSET_TYPE_TO_NODE } from './attachments/enriched-asset-parser';
import { INLINE_ASSET_NODE_TYPES } from './attachments/note-asset-parser';

// A table cell holds block content, so an inline asset node (image) must be wrapped in a paragraph.
function wrapAssetForCell(node)
{
	return INLINE_ASSET_NODE_TYPES.has(node?.type) ? { type: 'paragraph', content: [node] } : node;
}

function buildCellChildren(cell, h, cellNodeType)
{
	// Defensive access: fall back gracefully if marked internal API changes
	const rawText = (cell && typeof cell === 'object' && 'text' in cell) ? cell.text : '';
	const tokens = (cell && typeof cell === 'object' && 'tokens' in cell) ? cell.tokens : [];

	// Fast path: entire cell is a single enriched asset (most common case)
	const singleAsset = parseEnrichedAssetCell(rawText);
	if (singleAsset)
	{
		return [wrapAssetForCell(singleAsset)];
	}

	// Mixed content: scan for enriched assets within the cell text
	const assets = parseAllEnrichedAssets(rawText);
	if (assets.length === 0)
	{
		// No enriched assets: use standard inline token parsing
		return [{ type: 'paragraph', content: h.parseInline(tokens) }];
	}

	// Build children array: interleave text segments with asset nodes.
	// NOTE: text segments are inserted as plain text without inline parsing
	// (bold/italic/links). We don't have marked tokens for individual text
	// fragments between assets, and re-lexing substrings is unreliable.
	// TODO: if mixed content with formatting becomes a real use case, switch
	// to full re-lex via sharedMarked.lexer() or remark preprocessor.
	const children = [];
	let lastEnd = 0;

	for (const { match, start, end } of assets)
	{
		if (start > lastEnd)
		{
			const textBefore = rawText.slice(lastEnd, start).trim();
			if (textBefore.length > 0)
			{
				children.push({ type: 'paragraph', content: [{ type: 'text', text: textBefore }] });
			}
		}

		const attrs = {
			...parseAttrs(match.attrsRaw),
			label: match.label,
			url: match.url,
			isImage: match.isImage,
		};
		const nodeType = ASSET_TYPE_TO_NODE[attrs.type];
		if (nodeType)
		{
			children.push(wrapAssetForCell({
				type: nodeType,
				attrs: {
					fileId: Number(attrs.fileId),
					documentId: Number(attrs.documentId),
					name: attrs.name ?? attrs.label,
					size: attrs.size ? Number(attrs.size) : null,
					mimeType: attrs.mimeType ?? null,
				},
			}));
		}

		lastEnd = end;
	}

	if (lastEnd < rawText.length)
	{
		const textAfter = rawText.slice(lastEnd).trim();
		if (textAfter.length > 0)
		{
			children.push({ type: 'paragraph', content: [{ type: 'text', text: textAfter }] });
		}
	}

	return children.length > 0 ? children : [{ type: 'paragraph', content: [] }];
}

const CustomTable = Table.extend({
	addNodeView()
	{
		return ({ node }) => {
			const View = this.options.View;
			const cellMinWidth = this.options.cellMinWidth;

			return new View(node, cellMinWidth);
		};
	},
	addProseMirrorPlugins()
	{
		const plugins = [];

		if (this.options.resizable)
		{
			plugins.push(columnResizing({
				handleWidth: this.options.handleWidth,
				cellMinWidth: this.options.cellMinWidth,
				defaultCellMinWidth: this.options.cellMinWidth,
				View: this.options.View,
				lastColumnResizable: this.options.lastColumnResizable,
			}));
		}

		plugins.push(tableEditing({
			allowTableNodeSelection: this.options.allowTableNodeSelection,
		}));

		return plugins;
	},
	parseMarkdown(token, h)
	{
		const rows = [];

		if (token.header)
		{
			const headerCells = [];
			token.header.forEach((cell) => {
				headerCells.push(h.createNode('tableHeader', {}, buildCellChildren(cell, h, 'tableHeader')));
			});
			rows.push(h.createNode('tableRow', {}, headerCells));
		}

		if (token.rows)
		{
			token.rows.forEach((row) => {
				const bodyCells = [];
				row.forEach((cell) => {
					bodyCells.push(h.createNode('tableCell', {}, buildCellChildren(cell, h, 'tableCell')));
				});
				rows.push(h.createNode('tableRow', {}, bodyCells));
			});
		}

		return h.createNode('table', undefined, rows);
	},
});

const backgroundColorAttribute = {
	default: null,
	parseHTML: (element) => element.getAttribute('data-background-color') || null,
	renderHTML: (attrs) => {
		if (!attrs.backgroundColor)
		{
			return {};
		}

		return {
			'data-background-color': attrs.backgroundColor,
			style: `background-color: ${attrs.backgroundColor};`,
		};
	},
};

const CustomTableCell = TableCell.extend({
	addAttributes()
	{
		return {
			...this.parent?.(),
			backgroundColor: backgroundColorAttribute,
		};
	},
});

const CustomTableHeader = TableHeader.extend({
	addAttributes()
	{
		return {
			...this.parent?.(),
			backgroundColor: backgroundColorAttribute,
		};
	},
});

export function createTableExtensions(): Object[]
{
	return [
		TableKit.configure({
			table: false,
			tableCell: false,
			tableHeader: false,
		}),
		CustomTable.configure({ resizable: true }),
		CustomTableCell,
		CustomTableHeader,
	];
}
