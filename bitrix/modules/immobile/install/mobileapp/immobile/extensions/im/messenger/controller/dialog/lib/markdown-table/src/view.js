/**
 * @module im/messenger/controller/dialog/lib/markdown-table/view
 */
jn.define('im/messenger/controller/dialog/lib/markdown-table/view', (require, exports, module) => {
	const { Color } = require('tokens');
	const { encodeHtml } = require('im/messenger/lib/utils');

	const MIN_COLUMN_WIDTH = 80;
	const MAX_COLUMN_WIDTH = 180;

	class MarkdownTableView extends LayoutComponent
	{
		render()
		{
			const { tableData } = this.props;
			if (!tableData || !tableData.headers)
			{
				return View({});
			}

			return WebView({
				style: {
					backgroundColor: Color.bgContentPrimary.toHex(),
				},
				data: {
					content: this.buildHtml(tableData),
					mimeType: 'text/html',
					charset: 'UTF-8',
				},
			});
		}

		buildHtml({ headers, rows })
		{
			const tableHtml = this.renderTable(headers, rows);
			const styles = this.getStyles();

			return this.renderDocument(tableHtml, styles);
		}

		renderTable(headers, rows)
		{
			const renderCells = (cells, tag) => (Array.isArray(cells) ? cells : [])
				.map((cell) => `<${tag}>${encodeHtml(String(cell ?? ''))}</${tag}>`)
				.join('');

			const safeRows = Array.isArray(rows) ? rows.filter(Array.isArray) : [];
			const headerRow = `<thead><tr>${renderCells(headers, 'th')}</tr></thead>`;
			const bodyRows = safeRows
				.map((row) => `<tr>${renderCells(row, 'td')}</tr>`)
				.join('');

			return `
				<table>
					${headerRow}
					<tbody>${bodyRows}</tbody>
				</table>
			`;
		}

		renderDocument(bodyHtml, styles)
		{
			return `
				<!DOCTYPE html>
				<html lang="en">
				<head>
					<meta name="viewport" content="width=device-width, initial-scale=1, minimum-scale=1, maximum-scale=1, user-scalable=no">
					<style>${styles}</style>
				</head>
				<body>
					<div class="scroll">
						${bodyHtml}
					</div>
				</body>
				</html>
			`;
		}

		getStyles()
		{
			const bg = Color.bgContentPrimary.toHex();
			const text = Color.base1.toHex();
			const borderPrimary = Color.bgSeparatorPrimary.toHex();
			const borderSecondary = Color.bgSeparatorSecondary.toHex();

			return `
				* {
					box-sizing: border-box;
					-webkit-tap-highlight-color: transparent;
					-webkit-text-size-adjust: 100%;
					text-size-adjust: 100%;
				}
				html, body {
					margin: 0;
					padding: 0;
					background-color: ${bg};
					color: ${text};
					font-family: -apple-system, BlinkMacSystemFont, 'Helvetica Neue', sans-serif;
					font-size: 14px;
					line-height: 1.35;
				}
				.scroll {
					overflow-x: auto;
					-webkit-overflow-scrolling: touch;
					padding: 16px;
				}
				table {
					border-collapse: collapse;
					width: max-content;
				}
				th, td {
					padding: 10px 12px;
					min-width: ${MIN_COLUMN_WIDTH}px;
					max-width: ${MAX_COLUMN_WIDTH}px;
					text-align: left;
					vertical-align: top;
					border-bottom: 1px solid ${borderSecondary};
					word-break: break-word;
				}
				th {
					font-weight: 600;
					border-bottom: 1px solid ${borderPrimary};
					background-color: ${bg};
					position: sticky;
					top: 0;
					z-index: 1;
				}
				tr:last-child td {
					border-bottom: 0;
				}
			`;
		}
	}

	module.exports = {
		MarkdownTableView,
	};
});
