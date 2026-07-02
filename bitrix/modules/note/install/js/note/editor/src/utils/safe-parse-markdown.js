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

// Lift block-level nodes that landed inside an inline-only container out to the parent level.
// `@tiptap/markdown` parses `![](url)` (and other block-level extensions with inline markdown tokens)
// as inline children of the surrounding paragraph, producing JSON like `paragraph[text, image, text]`.
// That JSON is schema-illegal because `image` has `inline: false, group: 'block'`. PMNode.fromJSON
// doesn't validate content-model recursively, so the bad block sneaks past toValidBlock and only
// blows up later at editor.commands.insertContent: "Invalid content for node paragraph".
//
// Returned shape:
//   - a single normalized JSON node, OR
//   - an array of JSON nodes when the container had to be split around a block child.
// Callers must spread arrays into the parent's `content`.
function flattenInlineBlocks(node: Object, schema: Object): Object | Array<Object>
{
	if (!node || typeof node !== 'object' || !Array.isArray(node.content) || node.content.length === 0)
	{
		return node;
	}

	const nodeType = schema.nodes[node.type];
	const normalizedChildren = [];
	for (const child of node.content)
	{
		const flat = flattenInlineBlocks(child, schema);
		if (Array.isArray(flat))
		{
			normalizedChildren.push(...flat);
		}
		else if (flat !== null && flat !== undefined)
		{
			normalizedChildren.push(flat);
		}
	}

	if (!nodeType || !nodeType.inlineContent)
	{
		// Container allows blocks (or unknown type — leave structure intact for toValidBlock to handle).
		return { ...node, content: normalizedChildren };
	}

	// Inline-only container. Split around block children.
	const out = [];
	let inlineRun = null;
	let sawAnyChild = false;
	for (const child of normalizedChildren)
	{
		const childType = schema.nodes[child.type];
		const isBlock = Boolean(childType && childType.isBlock);

		if (!isBlock)
		{
			if (inlineRun === null)
			{
				inlineRun = [];
			}
			inlineRun.push(child);
			sawAnyChild = true;
			continue;
		}

		if (inlineRun !== null)
		{
			if (inlineRun.length > 0)
			{
				out.push({ ...node, content: inlineRun });
			}
			inlineRun = null;
		}
		else if (!sawAnyChild)
		{
			// Block child appears with no preceding inline content. Some parents (e.g. listItem with
			// content 'paragraph block*') require a leading inline container; emit an empty clone so
			// downstream schema validation has the canonical first slot filled.
			out.push({ ...node, content: [] });
		}
		out.push(child);
		sawAnyChild = true;
	}
	if (inlineRun !== null && inlineRun.length > 0)
	{
		out.push({ ...node, content: inlineRun });
	}

	if (out.length === 0)
	{
		return { ...node, content: [] };
	}
	if (out.length === 1)
	{
		return out[0];
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

	// Lift block-level nodes out of inline-only containers (e.g. image inside paragraph).
	// Tiptap's markdown lexer emits images as inline tokens, but the editor schema declares
	// image (and other media/attachment nodes) as block — so the raw JSON is schema-illegal.
	// Without flattening, editor.commands.insertContent throws "Invalid content for node paragraph"
	// on the paste path, and prosemirrorJSONToYDoc silently stores bad JSON on the DB→YJS path.
	const flatContent = [];
	for (const block of parsed.content)
	{
		const flat = flattenInlineBlocks(block, schema);
		if (Array.isArray(flat))
		{
			flatContent.push(...flat);
		}
		else if (flat !== null && flat !== undefined)
		{
			flatContent.push(flat);
		}
	}

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
