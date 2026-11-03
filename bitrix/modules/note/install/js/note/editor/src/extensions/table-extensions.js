import {
	renderTableToMarkdown,
	TableKit,
	TableCell,
	TableHeader,
	Table,
} from '@tiptap/extension-table';
import { columnResizing, tableEditing } from 'prosemirror-tables';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { ySyncPluginKey } from '@tiptap/y-tiptap';
import { escapeTableCellPlainPipes, sharedMarked } from './shared-marked';
import { findValidEnrichedAssetMatches, parseAllEnrichedAssets } from './attachments/enriched-asset-parser';
import { findNoteAssetMatches, isEscapedAt } from './attachments/note-asset-parser';
import {
	findTableAtSelection,
	isTableAlignment,
	normalizeTableAlignment,
} from '../utils/table-alignment';

// prosemirror-tables sizes a table to the sum of its column widths ONLY when every
// column carries an explicit width (its `fixedWidth` path). Otherwise the table
// width is auto: a resize just redistributes space inside it (neighbours shrink)
// and cells stop wrapping. A fresh table has no widths, so we give each column an
// equal share of the current wrapper width once it is laid out. Because the widths
// then sum to the wrapper, widening one column pushes the total past the wrapper
// (which scrolls) instead of stealing from its neighbours, and cells keep wrapping.
const tableColwidthKey = new PluginKey('noteTableColwidthDefaults');
const MIN_COLUMN_WIDTH = 25;
const TABLE_ALIGNMENT_MARKER = /^<!--\s*b24-note-table-align:([^\s>]+)\s*-->/;
// border-collapse paints the outer cell borders ~1px beyond the table box, so a
// column-width sum equal to the wrapper overflows it by a hairline. Reserve it.
const TABLE_BORDER_ALLOWANCE = 2;

// Per-column view of the first row (prosemirror-tables sizes columns from it):
// `known` holds every explicit width, `hasMissing` flags any column without one,
// `columns` is the expanded count (colspans unrolled).
function tableColumnState(tableNode)
{
	const firstRow = tableNode.firstChild;
	const known = [];
	let hasMissing = false;
	let columns = 0;

	if (firstRow)
	{
		firstRow.forEach((cell) => {
			const span = cell.attrs.colspan || 1;
			const colwidth = cell.attrs.colwidth;
			for (let i = 0; i < span; i++)
			{
				columns++;
				const width = Array.isArray(colwidth) ? colwidth[i] : 0;
				if (width)
				{
					known.push(width);
				}
				else
				{
					hasMissing = true;
				}
			}
		});
	}

	return { known, hasMissing, columns };
}

// Give only the columns that lack a width one, leaving sized columns untouched:
// - a brand-new table (nothing sized) is filled equally to the wrapper width, so it
//   fills the column with no hairline scroll;
// - a column inserted into an already-sized table gets a base width (the mean of the
//   existing ones) and the table grows by it — the set widths are preserved, not
//   rebuilt to 100%.
// Editable only — a read-only view fills via CSS and must not be mutated.
function applyMeasuredColwidths(view)
{
	if (!view.editable)
	{
		return;
	}

	const { state } = view;
	let tr = null;

	state.doc.descendants((node, pos) => {
		if (node.type.name !== 'table')
		{
			// Tables never live inside a textblock (paragraph/heading/code), so don't
			// walk their text — keeps this off the hot path on large documents.
			return !node.isTextblock;
		}

		const { known, hasMissing, columns } = tableColumnState(node);
		if (!hasMissing || !columns)
		{
			return false;
		}

		let fillWidth;
		if (known.length === 0)
		{
			const dom = view.nodeDOM(pos);
			const wrapper = dom instanceof HTMLElement
				? (dom.classList.contains('tableWrapper') ? dom : dom.closest('.tableWrapper'))
				: null;
			const available = (wrapper ? wrapper.clientWidth : 0) - TABLE_BORDER_ALLOWANCE;
			if (available <= 0)
			{
				return false;
			}

			fillWidth = Math.max(MIN_COLUMN_WIDTH, Math.floor(available / columns));
		}
		else
		{
			const mean = known.reduce((sum, width) => sum + width, 0) / known.length;
			fillWidth = Math.max(MIN_COLUMN_WIDTH, Math.round(mean));
		}

		tr = tr || state.tr;
		state.doc.nodesBetween(pos, pos + node.nodeSize, (cell, cellPos) => {
			if (cell.type.name === 'tableCell' || cell.type.name === 'tableHeader')
			{
				const span = cell.attrs.colspan || 1;
				const colwidth = cell.attrs.colwidth;
				// Preserve existing per-column entries; fill only the missing ones.
				let changed = false;
				const next = Array.from({ length: span }, (_, i) => {
					const width = Array.isArray(colwidth) ? colwidth[i] : 0;
					if (width)
					{
						return width;
					}

					changed = true;

					return fillWidth;
				});
				if (changed)
				{
					tr.setNodeAttribute(cellPos, 'colwidth', next);
				}
			}

			return true;
		});

		return false;
	});

	if (tr)
	{
		// Not an editing step — keep it out of the undo stack.
		tr.setMeta('addToHistory', false);
		view.dispatch(tr);
	}
}

function createTableColwidthPlugin()
{
	return new Plugin({
		key: tableColwidthKey,
		view: (editorView) => {
			const schedule = (targetView) => {
				requestAnimationFrame(() => applyMeasuredColwidths(targetView));
			};

			return {
				update: (updatedView, prevState) => {
					if (updatedView.state.doc === prevState.doc)
					{
						return;
					}

					// Only backfill on a local structural edit (table insert, column add,
					// resize of a legacy table). Skipping remote/initial-load changes keeps
					// this from silently writing width attrs into the shared Yjs document on
					// mere open and from baking one client's screen width into everyone's copy.
					// No ySync plugin (non-collaborative editor) → getState is undefined → local.
					const syncState = ySyncPluginKey.getState(updatedView.state);
					if (syncState?.isChangeOrigin)
					{
						return;
					}

					schedule(updatedView);
				},
			};
		},
	});
}

const tableTouchResizeKey = new PluginKey('noteTableTouchResize');
// Finger-friendly zone around a column border where a touch starts a resize.
const TOUCH_RESIZE_TOLERANCE = 24;

// prosemirror-tables' columnResizing listens to mouse events only, so a touch drag
// on the handle just scrolls the wrapper. This bridges touch → the exact mouse
// events the resize plugin expects: arm the handle at the border, start the drag,
// stream moves, and suppress wrapper scroll while dragging.
// Coupled to prosemirror-tables@1.8.5 internals: the `resize-cursor` class (arm
// signal), drag listeners on the doc's defaultView, and the legacy `!event.which`
// guard. Revisit this bridge if that dependency is bumped.
function createTableTouchResizePlugin()
{
	return new Plugin({
		key: tableTouchResizeKey,
		view: (editorView) => {
			let engaged = false;
			// Resolve against the editor's own document, not the top window — the plugin
			// dispatches its drag listeners on `view.dom.ownerDocument.defaultView`, so an
			// iframe/webview mount must target that window, not the global one.
			const ownerDoc = editorView.dom.ownerDocument;
			const win = ownerDoc.defaultView ?? window;

			const cellAt = (x, y) => {
				let node = ownerDoc.elementFromPoint(x, y);
				while (node && node.nodeName !== 'TD' && node.nodeName !== 'TH')
				{
					if (node.classList && node.classList.contains('ProseMirror'))
					{
						return null;
					}

					node = node.parentNode;
				}

				return node instanceof HTMLElement ? node : null;
			};

			const fireMouse = (target, type, x, y) => {
				const event = new MouseEvent(type, {
					bubbles: true,
					cancelable: true,
					view: win,
					clientX: x,
					clientY: y,
					button: 0,
					buttons: type === 'mouseup' ? 0 : 1,
				});
				// The resize plugin's move handler bails on `!event.which`, and the
				// constructor can't set it — pin it for the held-button events.
				Object.defineProperty(event, 'which', { value: type === 'mouseup' ? 0 : 1 });
				target.dispatchEvent(event);
			};

			const endDrag = (x, y) => {
				engaged = false;
				fireMouse(win, 'mouseup', x, y);
			};

			const onTouchStart = (event) => {
				if (!editorView.editable || event.touches.length !== 1)
				{
					return;
				}

				const touch = event.touches[0];
				const cell = cellAt(touch.clientX, touch.clientY);
				if (!cell)
				{
					return;
				}

				const rect = cell.getBoundingClientRect();
				const nearRight = rect.right - touch.clientX <= TOUCH_RESIZE_TOLERANCE;
				const nearLeft = touch.clientX - rect.left <= TOUCH_RESIZE_TOLERANCE;
				if (!nearRight && !nearLeft)
				{
					return;
				}

				// Snap the arming move to the exact border so the plugin's small
				// handleWidth still catches it regardless of the finger's offset.
				const edgeX = nearRight ? rect.right : rect.left;
				fireMouse(cell, 'mousemove', edgeX, touch.clientY);
				// resize-cursor confirms the plugin armed a handle (e.g. not the last,
				// non-resizable column). If it did not, leave the touch to scroll.
				if (!editorView.dom.classList.contains('resize-cursor'))
				{
					return;
				}

				fireMouse(cell, 'mousedown', edgeX, touch.clientY);
				engaged = true;
				event.preventDefault();
			};

			const onTouchMove = (event) => {
				if (!engaged)
				{
					return;
				}

				// A second finger during the drag: commit at the last point and release,
				// so the column never freezes with the wrapper free to scroll under it.
				if (event.touches.length !== 1)
				{
					const first = event.touches[0];
					endDrag(first ? first.clientX : 0, first ? first.clientY : 0);
					return;
				}

				const touch = event.touches[0];
				// Keep the wrapper from scrolling while a column is being dragged.
				event.preventDefault();
				fireMouse(win, 'mousemove', touch.clientX, touch.clientY);
			};

			const onTouchEnd = (event) => {
				if (!engaged)
				{
					return;
				}

				const touch = event.changedTouches[0];
				endDrag(touch ? touch.clientX : 0, touch ? touch.clientY : 0);
			};

			const { dom } = editorView;
			dom.addEventListener('touchstart', onTouchStart, { passive: false });
			dom.addEventListener('touchmove', onTouchMove, { passive: false });
			dom.addEventListener('touchend', onTouchEnd);
			dom.addEventListener('touchcancel', onTouchEnd);

			return {
				destroy: () => {
					dom.removeEventListener('touchstart', onTouchStart);
					dom.removeEventListener('touchmove', onTouchMove);
					dom.removeEventListener('touchend', onTouchEnd);
					dom.removeEventListener('touchcancel', onTouchEnd);
				},
			};
		},
	});
}

type AssetRange = {
	start: number,
	end: number,
};

const TABLE_CELL_ASSET_MARKER_GRAMMAR: string = String.raw`\uE000noteTableAsset(\d+)\uE001`;
const TABLE_CELL_LINE_SEPARATOR = '\u001F';

function rangesOverlap(left: AssetRange, right: AssetRange): boolean
{
	return left.start < right.end && right.start < left.end;
}

function findCanonicalAssetRanges(rawText: string): AssetRange[]
{
	return findNoteAssetMatches(rawText).map(({ start, end }) => ({
		start,
		end,
	}));
}

function findEscapedCanonicalAssetRanges(rawText: string): AssetRange[]
{
	return findNoteAssetMatches(rawText, true)
		.filter(({ start }) => isEscapedAt(rawText, start))
		.map(({ start, end }) => ({ start: start - 1, end }))
	;
}

function findEnrichedAssetRanges(rawText: string): AssetRange[]
{
	return findValidEnrichedAssetMatches(rawText)
		.map(({ start, end }) => ({
			start,
			end,
		}))
	;
}

function findEscapedEnrichedAssetRanges(rawText: string): AssetRange[]
{
	return parseAllEnrichedAssets(rawText)
		.filter(({ start }) => isEscapedAt(rawText, start))
		.map(({ start, end }) => ({ start: start - 1, end }))
	;
}

function excludeContainedRanges(ranges: AssetRange[], containers: AssetRange[]): AssetRange[]
{
	let containerIndex = 0;
	let furthestContainerEnd = -1;

	return ranges.filter((range) => {
		while (
			containerIndex < containers.length
			&& containers[containerIndex].start <= range.start
		)
		{
			furthestContainerEnd = Math.max(
				furthestContainerEnd,
				containers[containerIndex].end,
			);
			containerIndex++;
		}

		return furthestContainerEnd < range.end;
	});
}

// The shared instance is what carries the module's tokenizers, and a Lexer built from it keeps them
// only when it is given the instance defaults. MarkdownManager does that itself since 3.30.5; the
// lexers the module builds for a table cell have to do it here.
function createCellLexer(): Object
{
	return new sharedMarked.Lexer(sharedMarked.defaults);
}

function mergeAssetRanges(rawText: string, referenceLinks): AssetRange[]
{
	const escapedAssetRanges = [
		...findEscapedCanonicalAssetRanges(rawText),
		...findEscapedEnrichedAssetRanges(rawText),
	].sort((left, right) => left.start - right.start);
	const canonicalRanges = excludeContainedRanges(
		findCanonicalAssetRanges(rawText),
		escapedAssetRanges,
	)
	;
	const enrichedRanges = excludeContainedRanges(
		findEnrichedAssetRanges(rawText),
		escapedAssetRanges,
	)
	;
	const assetRanges: AssetRange[] = [];
	let canonicalIndex = 0;
	let enrichedIndex = 0;

	while (canonicalIndex < canonicalRanges.length && enrichedIndex < enrichedRanges.length)
	{
		const canonicalRange = canonicalRanges[canonicalIndex];
		const enrichedRange = enrichedRanges[enrichedIndex];

		if (rangesOverlap(canonicalRange, enrichedRange))
		{
			assetRanges.push(enrichedRange);
			enrichedIndex++;
			while (
				canonicalIndex < canonicalRanges.length
				&& rangesOverlap(enrichedRange, canonicalRanges[canonicalIndex])
			)
			{
				canonicalIndex++;
			}
		}
		else if (canonicalRange.start < enrichedRange.start)
		{
			assetRanges.push(canonicalRange);
			canonicalIndex++;
		}
		else
		{
			assetRanges.push(enrichedRange);
			enrichedIndex++;
		}
	}

	const mergedRanges = [
		...assetRanges,
		...canonicalRanges.slice(canonicalIndex),
		...enrichedRanges.slice(enrichedIndex),
	];
	const markedCell = replaceTableCellAssetsWithMarkers(rawText, mergedRanges);
	const visibleMarkers: Set<string> = new Set();
	const lexer = createCellLexer();
	lexer.tokens.links = referenceLinks;
	findVisibleAssetMarkers(
		lexer.inlineTokens(markedCell.markdown),
		markedCell.assetByMarker,
		visibleMarkers,
	);
	const markers = Array.from(markedCell.assetByMarker.keys());

	return mergedRanges.filter((range, index) => (
		visibleMarkers.has(markers[index])
	));
}

function replaceTableCellAssetsWithMarkers(
	rawText: string,
	assetRanges: AssetRange[],
): { markdown: string, assetByMarker: Map<string, string> }
{
	const usedMarkerIds: Set<string> = new Set();
	const markerRe = new RegExp(TABLE_CELL_ASSET_MARKER_GRAMMAR, 'g');
	let markerMatch = markerRe.exec(rawText);
	while (markerMatch)
	{
		usedMarkerIds.add(markerMatch[1]);
		markerMatch = markerRe.exec(rawText);
	}

	let markdown = '';
	let lastEnd = 0;
	let nextMarkerId = 0;
	const assetByMarker: Map<string, string> = new Map();
	for (const { start, end } of assetRanges)
	{
		while (usedMarkerIds.has(String(nextMarkerId)))
		{
			nextMarkerId++;
		}

		const marker = `\uE000noteTableAsset${nextMarkerId}\uE001`;
		markdown += rawText.slice(lastEnd, start) + marker;
		assetByMarker.set(marker, rawText.slice(start, end));
		usedMarkerIds.add(String(nextMarkerId));
		nextMarkerId++;
		lastEnd = end;
	}

	return {
		markdown: markdown + rawText.slice(lastEnd),
		assetByMarker,
	};
}

function parseTableCellAsset(assetMarkdown: string, h): Object[]
{
	const tokens = sharedMarked.lexer(`${assetMarkdown}\n`)
		.filter((token) => token.type !== 'space')
	;

	return h.parseChildren(tokens);
}

function findInlineHtmlTagRanges(text: string): AssetRange[]
{
	const ranges = [];
	for (let index = 0; index < text.length; index++)
	{
		if (text[index] !== '<' || !/^(?:[A-Za-z!?]|\/[A-Za-z])/.test(text.slice(index + 1, index + 3)))
		{
			continue;
		}

		let quote = null;
		let closed = false;
		for (let end = index + 1; end < text.length; end++)
		{
			const character = text[end];
			if (quote !== null)
			{
				if (character === quote)
				{
					quote = null;
				}
				continue;
			}

			if (character === '"' || character === "'")
			{
				quote = character;
			}
			else if (character === '>')
			{
				ranges.push({ start: index, end: end + 1 });
				index = end;
				closed = true;
				break;
			}
		}

		if (!closed)
		{
			break;
		}
	}

	return ranges;
}

function findVisibleAssetMarkers(tokens, assetByMarker: Map<string, string>, markers: Set<string>): void
{
	const markerRe = new RegExp(TABLE_CELL_ASSET_MARKER_GRAMMAR, 'g');
	for (const token of tokens)
	{
		if (token?.type === 'codespan' || token?.type === 'image')
		{
			continue;
		}

		if (Array.isArray(token?.tokens))
		{
			findVisibleAssetMarkers(token.tokens, assetByMarker, markers);
			continue;
		}

		if (typeof token?.text !== 'string')
		{
			continue;
		}

		const htmlTagRanges = findInlineHtmlTagRanges(token.text);
		let htmlTagIndex = 0;
		let markerMatch = markerRe.exec(token.text);
		while (markerMatch)
		{
			while (
				htmlTagIndex < htmlTagRanges.length
				&& htmlTagRanges[htmlTagIndex].end <= markerMatch.index
			)
			{
				htmlTagIndex++;
			}

			const htmlTagRange = htmlTagRanges[htmlTagIndex];
			const isInsideHtmlTag = htmlTagRange
				&& htmlTagRange.start <= markerMatch.index
				&& markerMatch.index < htmlTagRange.end
			;
			if (
				!isInsideHtmlTag
				&& assetByMarker.has(markerMatch[0])
			)
			{
				markers.add(markerMatch[0]);
			}
			markerMatch = markerRe.exec(token.text);
		}
	}
}

function findKnownAssetMarkers(value, assetByMarker: Map<string, string>, markers: Set<string>): void
{
	if (typeof value === 'string')
	{
		const markerRe = new RegExp(TABLE_CELL_ASSET_MARKER_GRAMMAR, 'g');
		let markerMatch = markerRe.exec(value);
		while (markerMatch)
		{
			if (assetByMarker.has(markerMatch[0]))
			{
				markers.add(markerMatch[0]);
			}
			markerMatch = markerRe.exec(value);
		}

		return;
	}

	if (Array.isArray(value))
	{
		for (const item of value)
		{
			findKnownAssetMarkers(item, assetByMarker, markers);
		}

		return;
	}

	if (value && typeof value === 'object')
	{
		for (const nestedValue of Object.values(value))
		{
			findKnownAssetMarkers(nestedValue, assetByMarker, markers);
		}
	}
}

function getReferenceLabel(token): string | null
{
	if (!['link', 'image'].includes(token?.type) || typeof token?.raw !== 'string')
	{
		return null;
	}

	const raw = token.raw.trimEnd();
	if (!raw.endsWith(']'))
	{
		return null;
	}

	let openingBracket = raw.length - 2;
	while (openingBracket >= 0 && (raw[openingBracket] !== '[' || isEscapedAt(raw, openingBracket)))
	{
		openingBracket--;
	}
	if (openingBracket < 0)
	{
		return null;
	}

	const prefix = raw.slice(0, openingBracket).trimEnd();
	let label;
	if (prefix.endsWith(']') && !isEscapedAt(prefix, prefix.length - 1))
	{
		label = raw.slice(openingBracket + 1, -1) || token.text || '';
	}
	else if (openingBracket === (raw.startsWith('!') ? 1 : 0))
	{
		label = raw.slice(openingBracket + 1, -1);
	}
	else
	{
		return null;
	}

	return label.replace(/\s+/g, ' ').toLowerCase();
}

function collectReferenceLinks(tokens, links = Object.create(null))
{
	for (const token of tokens)
	{
		const label = getReferenceLabel(token);
		if (label && typeof token?.href === 'string')
		{
			links[label] = {
				href: token.href,
				title: token.title ?? undefined,
			};
		}

		if (Array.isArray(token?.tokens))
		{
			collectReferenceLinks(token.tokens, links);
		}
	}

	return links;
}

function splitInlineContentAtAssets(inlineContent, assetByMarker: Map<string, string>, h): Object[]
{
	const blocks = [];
	let paragraphContent = [];
	const flushParagraph = () => {
		const hasContent = paragraphContent.some((node) => (
			node?.type !== 'text'
			|| (typeof node.text === 'string' && node.text.trim().length > 0)
		));
		if (hasContent)
		{
			blocks.push({ type: 'paragraph', content: paragraphContent });
		}
		paragraphContent = [];
	};
	const markerRe = new RegExp(TABLE_CELL_ASSET_MARKER_GRAMMAR, 'g');

	for (const node of inlineContent)
	{
		if (node?.type !== 'text' || typeof node.text !== 'string')
		{
			const nestedMarkers: Set<string> = new Set();
			findKnownAssetMarkers(node, assetByMarker, nestedMarkers);
			if (nestedMarkers.size > 0)
			{
				flushParagraph();
				for (const marker of nestedMarkers)
				{
					const assetMarkdown = assetByMarker.get(marker);
					if (assetMarkdown)
					{
						blocks.push(...parseTableCellAsset(assetMarkdown, h));
					}
				}
				continue;
			}

			paragraphContent.push(node);
			continue;
		}

		let lastEnd = 0;
		let markerMatch = markerRe.exec(node.text);
		while (markerMatch)
		{
			const marker = markerMatch[0];
			const assetMarkdown = assetByMarker.get(marker);
			if (!assetMarkdown)
			{
				markerMatch = markerRe.exec(node.text);
				continue;
			}

			const textBefore = node.text.slice(lastEnd, markerMatch.index);
			if (textBefore.length > 0)
			{
				paragraphContent.push({ ...node, text: textBefore });
			}
			flushParagraph();
			blocks.push(...parseTableCellAsset(assetMarkdown, h));
			lastEnd = markerMatch.index + marker.length;
			markerMatch = markerRe.exec(node.text);
		}

		const textAfter = node.text.slice(lastEnd);
		if (textAfter.length > 0)
		{
			paragraphContent.push({ ...node, text: textAfter });
		}
	}

	flushParagraph();

	return blocks;
}

const CELL_BLOCK_BREAK_AT_RE = /^<br\s*\/?>/i;
// Only a cap on the slice the match is tried on. The library writes `<br>`, but a body written
// outside the editor - REST, an import from Outline or a wiki - carries `<br />` with whatever
// spacing its author used.
const CELL_BLOCK_BREAK_MAX_LENGTH = 16;

// Cuts a stored cell at the `<br>` tags the library wrote for its block boundaries, and only at
// those. A `<br>` the author typed into a code span is content, not a boundary: @tiptap/markdown
// returns text under a code mark verbatim - no HTML encoding, no escaping - so it reaches the row
// as a literal tag. Reading it as a boundary tore the span into two paragraphs and turned its
// backticks into text. Plain text cannot reach here as a literal tag: outside code the serializer
// encodes it as `&lt;br&gt;`.
function splitCellAtBreakTags(text: string): string[]
{
	const parts = [];
	let current = '';
	let offset = 0;

	while (offset < text.length)
	{
		const char = text[offset];

		if (char === '\\')
		{
			current += text.slice(offset, offset + 2);
			offset += 2;
			continue;
		}

		if (char === '`')
		{
			let fenceEnd = offset;
			while (text[fenceEnd] === '`')
			{
				fenceEnd += 1;
			}
			const fence = text.slice(offset, fenceEnd);
			const closing = text.indexOf(fence, fenceEnd);
			if (closing === -1)
			{
				// Backticks with no pair are ordinary characters, the way marked reads them - taking
				// them for a span that runs to the end of the cell would hide every block boundary
				// after them.
				current += fence;
				offset = fenceEnd;
				continue;
			}

			const end = closing + fence.length;
			current += text.slice(offset, end);
			offset = end;
			continue;
		}

		if (char === '<')
		{
			const tag = CELL_BLOCK_BREAK_AT_RE.exec(text.slice(offset, offset + CELL_BLOCK_BREAK_MAX_LENGTH));
			if (tag !== null)
			{
				parts.push(current);
				current = '';
				offset += tag[0].length;
				continue;
			}
		}

		current += char;
		offset += 1;
	}

	parts.push(current);

	return parts;
}

function trimEdgeEmptyParts(parts: string[]): string[]
{
	let start = 0;
	let end = parts.length;
	while (start < end && parts[start] === '')
	{
		start += 1;
	}
	while (end > start && parts[end - 1] === '')
	{
		end -= 1;
	}

	return parts.slice(start, end);
}

// Where the blocks of one cell begin and end.
//
// Since 3.30.5 the library writes `<br>` for every line break inside a cell - both a break the user
// typed and the boundary between two blocks of the cell - because a real newline would split the
// markdown row. So `<br>` is read back as that same boundary: each part becomes a block of its own.
// Left as text it would be re-escaped to `&lt;br&gt;` on the next save and grow with every one; a
// literal `<br>` a user typed is stored as `&lt;br&gt;` and never reaches this split.
function buildCellBlocks(rawText: string, tokens: Object[], h, parsedTokens: ?Object[]): Object[]
{
	if (!rawText.includes('fileId='))
	{
		if (parsedTokens)
		{
			return [{ type: 'paragraph', content: h.parseInline(parsedTokens) }];
		}

		const lexer = createCellLexer();
		lexer.tokens.links = collectReferenceLinks(tokens);

		return [{ type: 'paragraph', content: h.parseInline(lexer.inlineTokens(rawText)) }];
	}

	const referenceLinks = collectReferenceLinks(tokens);
	const assetRanges = mergeAssetRanges(rawText, referenceLinks);
	if (assetRanges.length === 0)
	{
		const lexer = createCellLexer();
		lexer.tokens.links = referenceLinks;

		return [{ type: 'paragraph', content: h.parseInline(lexer.inlineTokens(rawText)) }];
	}

	const lexer = createCellLexer();
	lexer.tokens.links = referenceLinks;
	const markedCell = replaceTableCellAssetsWithMarkers(rawText, assetRanges);
	const inlineContent = h.parseInline(lexer.inlineTokens(markedCell.markdown));
	const children = splitInlineContentAtAssets(inlineContent, markedCell.assetByMarker, h);

	return children.length > 0 ? children : [{ type: 'paragraph', content: [] }];
}

function buildCellChildren(cell, h, textOverride = null)
{
	// Defensive access: fall back gracefully if marked internal API changes
	const hasTextOverride = typeof textOverride === 'string';
	const cellText = hasTextOverride
		? textOverride
		: ((cell && typeof cell === 'object' && 'text' in cell) ? cell.text : '')
	;
	const rawText = cellText.replaceAll(TABLE_CELL_LINE_SEPARATOR, ' ');
	const tokens = (cell && typeof cell === 'object' && 'tokens' in cell) ? cell.tokens : [];

	const parts = splitCellAtBreakTags(rawText);
	if (parts.length > 1)
	{
		// An empty part between two breaks is an empty block of the cell, not nothing: dropping it
		// glued the blocks around it together and the next save stored the cell without it. Only the
		// edges of the split are dropped - there a leading or trailing break means no block at all.
		const inner = trimEdgeEmptyParts(parts.map((part) => part.trim()));
		const blocks = inner.flatMap((part) => (part === ''
			? [{ type: 'paragraph', content: [] }]
			: buildCellBlocks(part, tokens, h, null)
		));

		return blocks.length > 0 ? blocks : [{ type: 'paragraph', content: [] }];
	}

	// The fast path is only valid for the cell as a whole: `tokens` were lexed for the whole cell
	// text, so a part of a split cell must go through the lexer instead.
	// An overridden text is a slice of the cell, so its `tokens` do not match it either.
	const alreadyParsed = (!hasTextOverride && !rawText.includes('\\') && cellText === rawText)
		? tokens
		: null
	;

	return buildCellBlocks(rawText, tokens, h, alreadyParsed);
}

function parseTableAlignment(header): { alignment: string, firstHeaderText: ?string }
{
	const firstCell = Array.isArray(header) ? header[0] : null;
	const text = (firstCell && typeof firstCell === 'object' && typeof firstCell.text === 'string')
		? firstCell.text
		: ''
	;
	const marker = TABLE_ALIGNMENT_MARKER.exec(text);
	if (!marker)
	{
		return { alignment: 'left', firstHeaderText: null };
	}

	return {
		alignment: normalizeTableAlignment(marker[1]),
		firstHeaderText: text.slice(marker[0].length),
	};
}

function applyTableAlignmentToView(view: Object, node: Object): void
{
	const alignment = normalizeTableAlignment(node.attrs.alignment);

	view.table.classList.remove(
		'note-editor-table--align-left',
		'note-editor-table--align-center',
		'note-editor-table--align-right',
	);
	view.table.classList.add(`note-editor-table--align-${alignment}`);
	view.table.setAttribute('data-table-alignment', alignment);
}

const CustomTable = Table.extend({
	addAttributes()
	{
		return {
			...this.parent?.(),
			alignment: {
				default: 'left',
				parseHTML: (element) => normalizeTableAlignment(element.getAttribute('data-table-alignment')),
				renderHTML: (attrs) => {
					const alignment = normalizeTableAlignment(attrs.alignment);

					return {
						class: `note-editor-table--align-${alignment}`,
						'data-table-alignment': alignment,
					};
				},
			},
		};
	},
	addCommands()
	{
		return {
			...this.parent?.(),
			setTableAlignment: (alignment: string) => ({ state, dispatch }) => {
				if (!isTableAlignment(alignment))
				{
					return false;
				}

				const table = findTableAtSelection(state.selection);
				if (!table)
				{
					return false;
				}

				if (dispatch)
				{
					dispatch(state.tr.setNodeMarkup(table.pos, undefined, {
						...table.node.attrs,
						alignment,
					}));
				}

				return true;
			},
		};
	},
	addNodeView()
	{
		return ({ node }) => {
			const View = this.options.View;
			const cellMinWidth = this.options.cellMinWidth;
			const view = new View(node, cellMinWidth);
			const update = view.update.bind(view);

			applyTableAlignmentToView(view, node);
			view.update = (nextNode) => {
				const updated = update(nextNode);
				if (updated)
				{
					applyTableAlignmentToView(view, nextNode);
				}

				return updated;
			};

			return view;
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
			plugins.push(createTableColwidthPlugin());
			plugins.push(createTableTouchResizePlugin());
		}

		plugins.push(tableEditing({
			allowTableNodeSelection: this.options.allowTableNodeSelection,
		}));

		return plugins;
	},
	parseMarkdown(token, h)
	{
		const rows = [];
		const header = Array.isArray(token.header) ? token.header : [];
		const { alignment, firstHeaderText } = parseTableAlignment(header);

		// GFM requires a header row, but imported content tables (e.g. landing card lists) carry a
		// deliberately blank header so no label row is shown. Rendering an all-empty <th> row just
		// adds a stray empty line at the top, so skip it - but only when there are body rows to keep
		// the table non-empty; a header-only table falls back to showing the (blank) header.
		const hasBody = Array.isArray(token.rows) && token.rows.length > 0;
		const headerIsBlank = header.length > 0
			&& header.every((cell) => {
				const text = (cell && typeof cell === 'object' && typeof cell.text === 'string') ? cell.text : '';

				return text.trim() === '';
			});

		if (header.length > 0 && !(headerIsBlank && hasBody))
		{
			const headerCells = [];
			header.forEach((cell, index) => {
				headerCells.push(h.createNode('tableHeader', {}, buildCellChildren(
					cell,
					h,
					index === 0 ? firstHeaderText : null,
				)));
			});
			rows.push(h.createNode('tableRow', {}, headerCells));
		}

		if (token.rows)
		{
			token.rows.forEach((row) => {
				const bodyCells = [];
				row.forEach((cell) => {
					bodyCells.push(h.createNode('tableCell', {}, buildCellChildren(cell, h)));
				});
				rows.push(h.createNode('tableRow', {}, bodyCells));
			});
		}

		return h.createNode('table', { alignment }, rows);
	},
	renderMarkdown(node, h): string
	{
		// The bar is escaped in what the library rendered for a cell, not in the table markup it
		// writes around it: wrapping the whole result would escape the cell separators too, and the
		// table would come back as a single paragraph. `renderChildren` is the seam that carries
		// cell content and nothing else.
		const cellRenderer = Object.create(h);
		cellRenderer.renderChildren = (child) => escapeTableCellPlainPipes(h.renderChildren(child));

		// '\n' rather than ' ': since 3.30.5 the library splits the rendered cell on this separator
		// and turns every resulting line break into `<br>`, so a separator of ' ' would put a `<br>`
		// in place of every space in the cell.
		const markdown = renderTableToMarkdown(node, cellRenderer, { cellLineSeparator: '\n' });
		const alignment = normalizeTableAlignment(node.attrs?.alignment);

		if (alignment === 'left')
		{
			return markdown;
		}

		return markdown.replace(
			/^(\n*\|[\t ]*)/,
			`$1<!-- b24-note-table-align:${alignment} -->`,
		);
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
