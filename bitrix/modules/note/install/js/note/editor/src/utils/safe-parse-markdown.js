import { Node as PMNode } from '@tiptap/pm/model';
import { sanitizeUrl } from './url';

// Empty ProseMirror document — schema requires non-empty doc.content,
// so we always fall back to a single empty paragraph when parsing fails or yields nothing.
function emptyDoc(): Object
{
	return {
		type: 'doc',
		content: [{ type: 'paragraph' }],
	};
}

// Normalize markdown text for safer parsing:
//  1. Replace literal \n / \\n outside code fences with markdown hard-break (`  \n`).
//  2. Strip trailing `\` on quoted/empty lines that `marked` interprets as escape.
// Inline code spans and fenced blocks are preserved untouched.
function normalize(text: string): string
{
	let result = text.replaceAll(
		/```[\S\s]*?```|`[^\n`]+`|\\{1,2}n/g,
		(match) => (match[0] === '`' ? match : '  \n'),
	);
	result = result.replaceAll(/^[\t ]*((?:>[\t ]*)*)\\[\t ]*$/gm, '$1');

	return result;
}

// Drop marks that conflict with each other under the editor's schema (e.g. `code` + `link`,
// which is rejected by ProseMirror because Code mark is configured with excludes='code link').
// Without this, the surrounding transaction throws RangeError and nothing inserts.
// Last-wins order matches marked's traversal (innermost mark applied first), so a markdown
// snippet like `[`name`](url)` keeps the link and drops the code styling — link target
// is harder to re-input than re-applying inline code.
function sanitizeMarks(marks: Array<{ type: string, attrs?: Object }>, schema: Object): Array<Object>
{
	const out = [];
	for (const mark of marks)
	{
		const markType = schema.marks[mark.type];
		if (!markType)
		{
			continue;
		}
		// Drop link marks whose href is not in the URL whitelist. Link.validate runs only
		// on inputRules/setLink, not on setContent(JSON), so a markdown link with a
		// javascript: or data: href would otherwise survive in attrs and leak through
		// editor.getJSON(), YJS state and markdown export.
		if (mark.type === 'link')
		{
			const safeHref = sanitizeUrl(mark.attrs?.href);
			if (safeHref === null)
			{
				continue;
			}
			mark.attrs = { ...mark.attrs, href: safeHref };
		}
		for (let i = out.length - 1; i >= 0; i--)
		{
			const existingType = schema.marks[out[i].type];
			if (!existingType)
			{
				continue;
			}
			if (markType.excludes(existingType) || existingType.excludes(markType))
			{
				out.splice(i, 1);
			}
		}
		out.push(mark);
	}

	return out;
}

function sanitizeNode(node: Object, schema: Object): void
{
	if (node.type === 'text' && Array.isArray(node.marks) && node.marks.length > 0)
	{
		const cleaned = sanitizeMarks(node.marks, schema);
		if (cleaned.length === 0)
		{
			delete node.marks;
		}
		else
		{
			node.marks = cleaned;
		}
	}
	if (Array.isArray(node.content))
	{
		for (const child of node.content)
		{
			sanitizeNode(child, schema);
		}
	}
}

// Wrap a top-level inline node in a paragraph. Asset nodes like `imageAttachment` are inline,
// so a stray inline node at the document root (e.g. from a degraded parse or legacy content) is
// schema-illegal: `doc` accepts blocks only. One paragraph wrapper makes it legal without the old
// "lift block out of inline" heuristic, which mis-fired on code blocks and other content.
function normalizeTopLevelInline(blocks: Array<Object>, schema: Object): Array<Object>
{
	const out = [];
	for (const block of blocks)
	{
		const nodeType = schema.nodes[block?.type];
		if (nodeType && nodeType.isInline)
		{
			out.push({ type: 'paragraph', content: [block] });
		}
		else
		{
			out.push(block);
		}
	}

	return out;
}

function extractText(node: Object): string
{
	if (!node)
	{
		return '';
	}
	if (node.type === 'text')
	{
		return node.text || '';
	}
	if (Array.isArray(node.content))
	{
		return node.content.map((c) => extractText(c)).join('');
	}

	return '';
}

// Validate a block against the editor schema. If the block is rejected for any reason
// (unknown node, missing required attrs, content-model violation, residual mark conflict
// that survived sanitizeMarks, etc.), degrade to a plain paragraph carrying the block's
// text. Worst case we lose styling for that single block — neighbours stay intact.
function toValidBlock(block: Object, schema: Object): Object | null
{
	try
	{
		const node = PMNode.fromJSON(schema, block);
		// fromJSON does not recurse into content-model validation; check() does.
		// Catches residual inline-in-block (or block-in-inline) mismatches that flattenInlineBlocks missed.
		node.check();

		return block;
	}
	catch
	{
		const text = extractText(block).trim();
		if (!text)
		{
			return null;
		}
		const paragraph = {
			type: 'paragraph',
			content: [{ type: 'text', text }],
		};
		try
		{
			const node = PMNode.fromJSON(schema, paragraph);
			node.check();

			return paragraph;
		}
		catch
		{
			return null;
		}
	}
}

/**
 * Safely parse a markdown string into a ProseMirror document JSON.
 *
 * Single source of truth for both paste-insertion and DB-load paths.
 * Guarantees:
 *   - Never throws. Any internal failure degrades to an empty doc.
 *   - Mark conflicts are sanitized (last-wins).
 *   - Schema-invalid blocks degrade to plain paragraphs.
 *   - Resulting `doc.content` always contains at least one node (empty paragraph).
 *
 * @param {Object} editor — Tiptap editor instance (must have view + markdown manager).
 * @param {string} text — raw markdown source.
 * @returns {{ doc: Object, degraded: boolean, droppedCount: number }}
 */
export function safeParseMarkdown(
	editor: Object,
	text: string,
): { doc: Object, degraded: boolean, droppedCount: number }
{
	const manager = editor?.markdown;
	if (!manager || typeof manager.parse !== 'function' || !editor.view)
	{
		return { doc: emptyDoc(), degraded: true, droppedCount: 0 };
	}

	const source = typeof text === 'string' ? text : '';
	if (source === '')
	{
		return { doc: emptyDoc(), degraded: false, droppedCount: 0 };
	}

	const normalized = normalize(source);

	let parsed;
	try
	{
		parsed = manager.parse(normalized);
	}
	catch
	{
		return { doc: emptyDoc(), degraded: true, droppedCount: 0 };
	}

	if (!parsed || !Array.isArray(parsed.content) || parsed.content.length === 0)
	{
		return { doc: emptyDoc(), degraded: true, droppedCount: 0 };
	}

	const schema = editor.view.state.schema;
	sanitizeNode(parsed, schema);

	// Image/asset nodes are inline, so `![](url)` lands legally inside its paragraph — no lifting needed.
	// Only guard against a stray inline node at the document root.
	const flatContent = normalizeTopLevelInline(parsed.content, schema);

	const blocks = [];
	let degraded = false;
	let droppedCount = 0;
	for (const block of flatContent)
	{
		const safe = toValidBlock(block, schema);
		if (safe === null)
		{
			degraded = true;
			droppedCount++;
			continue;
		}
		if (safe !== block)
		{
			degraded = true;
		}
		blocks.push(safe);
	}

	if (blocks.length === 0)
	{
		return { doc: emptyDoc(), degraded: true, droppedCount };
	}

	return {
		doc: { type: 'doc', content: blocks },
		degraded,
		droppedCount,
	};
}
