import 'translit';

// Heading anchor slugs (Outline-style): slugify heading text and assign
// collision-free ids across a document, deterministically.
//
// Transliteration (cyrillic/foreign -> latin) is delegated to the kernel
// `BX.translit` (the `translit` extension above) — we don't keep our own table.
// Non-dictionary characters are left untouched (`replace_space_and_other: false`)
// so the local NFKD pass can fold latin accents and the final regex strips the
// rest uniformly.

const MAX_SLUG_LENGTH = 200;
const EMPTY_SLUG = 'heading';

function transliterate(text: string): string
{
	const translit = typeof BX !== 'undefined' && typeof BX?.translit === 'function'
		? BX.translit
		: null;

	if (!translit)
	{
		return text;
	}

	return translit(text, {
		change_case: 'L',
		replace_space: '-',
		replace_space_and_other: false,
		delete_repeat_replace: false,
		max_len: 100000,
	});
}

export function slugify(text: mixed): string
{
	if (typeof text !== 'string' || text === '')
	{
		return EMPTY_SLUG;
	}

	let result = transliterate(text);
	// Fold latin accents (é -> e + combining mark) and drop the marks.
	result = result.normalize('NFKD').replace(/[̀-ͯ]/g, '');
	// Everything that is not a-z0-9 collapses into a single hyphen.
	result = result.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

	if (result.length > MAX_SLUG_LENGTH)
	{
		result = result.slice(0, MAX_SLUG_LENGTH).replace(/-+$/g, '');
	}

	return result === '' ? EMPTY_SLUG : result;
}

export type HeadingEntry = {
	pos: number,
	endPos: number,
	level: number,
	collapsed: boolean,
	// `plain` headings sit inside a table, blockquote or callout. They keep their
	// anchor id but take no part in the collapse mechanic and render without the
	// gutter controls (anchor + collapse). See isPlainHeadingContext.
	plain: boolean,
	// Collapse scope. `containerKey` is a stable id of the block the heading lives
	// in (doc root, blockquote, callout, table cell); two headings share a scope
	// only when their keys match. `containerEnd` is that container's content end —
	// a collapsed section never spills past it. Only top-level headings collapse
	// now, but the scope still bounds a stray collapsed nested heading from an
	// older document deterministically.
	containerKey: number,
	containerEnd: number,
	slug: string,
};

// Block types whose nested headings are "plain": no gutter controls, no part in
// the collapse mechanic. A blockquote/callout heading is decorative section
// structure, not a foldable document section.
const PLAIN_HEADING_CONTAINERS: Set<string> = new Set(['blockquote', 'callout']);

// True when the resolved position sits anywhere inside a table.
export function isInsideTable($pos: Object): boolean
{
	for (let depth = $pos.depth; depth > 0; depth--)
	{
		if ($pos.node(depth).type.name === 'table')
		{
			return true;
		}
	}

	return false;
}

// True when the heading at `$pos` lives inside a blockquote or callout.
export function isInBlockquoteOrCallout($pos: Object): boolean
{
	for (let depth = $pos.depth; depth > 0; depth--)
	{
		if (PLAIN_HEADING_CONTAINERS.has($pos.node(depth).type.name))
		{
			return true;
		}
	}

	return false;
}

// True when the heading at `$pos` sits in any "plain" context — a table,
// blockquote or callout. Plain headings keep their anchor id but take no part in
// the collapse mechanic and render without the gutter controls: they don't hide
// anything, don't terminate an outer collapsed range and carry no anchor/collapse
// buttons.
export function isPlainHeadingContext($pos: Object): boolean
{
	return isInsideTable($pos) || isInBlockquoteOrCallout($pos);
}

// Resolves the collapse container of the heading at `pos`: the block that
// directly holds it. A direct child of the doc reports the root sentinel `-1`
// and the whole document as its end; a heading nested in a blockquote/callout
// (or table cell) reports that node's start as the key and its content end as
// the boundary. Used to scope collapse ranges so they never cross a container.
export function resolveHeadingContainer(doc: Object, pos: number): { containerKey: number, containerEnd: number }
{
	const $pos = doc.resolve(pos);
	const depth = $pos.depth;

	if (depth <= 0)
	{
		return { containerKey: -1, containerEnd: doc.content.size };
	}

	return { containerKey: $pos.before(depth), containerEnd: $pos.end(depth) };
}

// Walks the document, computes a deterministic, collision-free slug for every
// heading. Collisions within one document get an incremental "-2/-3/..." suffix
// in order of appearance, while also avoiding clashes with literal slugs.
export function computeHeadingEntries(doc: Object): HeadingEntry[]
{
	const entries: HeadingEntry[] = [];
	const used: Set<string> = new Set();
	const counts: Map<string, number> = new Map();
	// descendants() walks in document order, so any heading at pos < tableEnd
	// sits inside a table. Container scope still needs a resolve() per heading;
	// headings are few, so the extra cost is negligible.
	let tableEnd = -1;

	doc.descendants((node, pos) => {
		if (node?.type?.name === 'table')
		{
			tableEnd = Math.max(tableEnd, pos + node.nodeSize);

			return undefined;
		}

		if (!node || !node.type || node.type.name !== 'heading')
		{
			return undefined;
		}

		const base = slugify(node.textContent);
		let slug = base;
		if (used.has(slug))
		{
			let next = (counts.get(base) || 1) + 1;
			while (used.has(`${base}-${next}`))
			{
				next += 1;
			}
			slug = `${base}-${next}`;
			counts.set(base, next);
		}
		else
		{
			counts.set(base, 1);
		}
		used.add(slug);

		const { containerKey, containerEnd } = resolveHeadingContainer(doc, pos);

		entries.push({
			pos,
			endPos: pos + node.nodeSize,
			level: Number(node.attrs?.level) || 1,
			collapsed: Boolean(node.attrs?.collapsed),
			// In a table (cheap doc-order check) or in a blockquote/callout (needs a
			// resolve, same one container scope already pays for).
			plain: pos < tableEnd || isInBlockquoteOrCallout(doc.resolve(pos)),
			containerKey,
			containerEnd,
			slug,
		});

		// Headings only hold inline content — no need to descend.
		return false;
	});

	return entries;
}

export function assignAnchorIds(doc: Object): Map<number, string>
{
	const map: Map<number, string> = new Map();
	for (const entry of computeHeadingEntries(doc))
	{
		map.set(entry.pos, entry.slug);
	}

	return map;
}
