import {
	slugify,
	computeHeadingEntries,
	assignAnchorIds,
	isInsideTable,
	isInBlockquoteOrCallout,
	isPlainHeadingContext,
} from '../../src/utils/heading-slug';

function makeDoc(headings) {
	// headings: Array<{ text, level?, collapsed?, type? }>
	const nodes = [];
	let pos = 1;
	for (const heading of headings) {
		const text = String(heading.text ?? '');
		const nodeSize = Math.max(2, text.length + 2);
		nodes.push({
			node: {
				type: { name: heading.type ?? 'heading' },
				textContent: text,
				attrs: { level: heading.level ?? 1, collapsed: heading.collapsed ?? false },
				nodeSize,
			},
			pos,
		});
		pos += nodeSize;
	}

	const contentSize = pos;

	return {
		content: { size: contentSize },
		// These fixtures are flat: every heading is a direct child of the doc
		// (depth 0), so resolveHeadingContainer reports the root container.
		resolve() {
			return { depth: 0, before: () => -1, end: () => contentSize };
		},
		descendants(callback) {
			for (const entry of nodes) {
				callback(entry.node, entry.pos);
			}
		},
	};
}

describe('heading-slug', () => {
	// These cases hold regardless of whether BX.translit is loaded: they only
	// exercise the ASCII shaping that heading-slug.js owns (transliteration of
	// cyrillic is delegated to the kernel and covered by the core itself).
	describe('slugify (shaping)', () => {
		it('slugifies plain latin text', () => {
			assert.strictEqual(slugify('Getting Started'), 'getting-started');
		});

		it('folds latin accents via NFKD', () => {
			assert.strictEqual(slugify('Café'), 'cafe');
			assert.strictEqual(slugify('naïve'), 'naive');
		});

		it('drops emojis and other symbols', () => {
			assert.strictEqual(slugify('🚀 Launch!'), 'launch');
			assert.strictEqual(slugify('Hello, World?'), 'hello-world');
		});

		it('collapses runs of separators into a single hyphen and trims', () => {
			assert.strictEqual(slugify('  a   b  '), 'a-b');
			assert.strictEqual(slugify('--a--b--'), 'a-b');
		});

		it('falls back to "heading" for empty / symbol-only text', () => {
			assert.strictEqual(slugify(''), 'heading');
			assert.strictEqual(slugify('   '), 'heading');
			assert.strictEqual(slugify('🚀'), 'heading');
			assert.strictEqual(slugify('***'), 'heading');
		});

		it('handles non-string input', () => {
			assert.strictEqual(slugify(null), 'heading');
			assert.strictEqual(slugify(undefined), 'heading');
			assert.strictEqual(slugify(123), 'heading');
		});

		it('truncates very long slugs to 200 chars without trailing hyphen', () => {
			const long = `${'a'.repeat(150)} ${'b'.repeat(150)}`;
			const result = slugify(long);
			assert.ok(result.length <= 200, `expected <= 200, got ${result.length}`);
			assert.ok(!result.endsWith('-'), 'must not end with a hyphen');
		});

		it('is idempotent on an already-slugified value', () => {
			const once = slugify('Some Title 123');
			assert.strictEqual(slugify(once), once);
		});
	});

	// Verifies the contract: slugify routes text through BX.translit and then
	// sanitizes whatever it returns. We stub the kernel function to keep the
	// assertion deterministic and independent of the loaded dictionary.
	describe('slugify (transliteration delegated to BX.translit)', () => {
		let original;

		beforeEach(() => {
			if (typeof window.BX === 'undefined') {
				window.BX = {};
			}
			original = window.BX.translit;
		});

		afterEach(() => {
			window.BX.translit = original;
		});

		it('uses the BX.translit output and sanitizes it', () => {
			window.BX.translit = (str) => str.replace(/Привет/g, 'Privet').replace(/мир/g, 'mir');
			assert.strictEqual(slugify('Привет мир'), 'privet-mir');
		});

		it('sanitizes characters the transliterator leaves untouched', () => {
			window.BX.translit = (str) => str;
			assert.strictEqual(slugify('Hello,  World!!!'), 'hello-world');
		});
	});

	describe('computeHeadingEntries', () => {
		it('returns one entry per heading with slug, level, range', () => {
			const doc = makeDoc([
				{ text: 'Intro', level: 1 },
				{ text: 'Details', level: 2, collapsed: true },
			]);
			const entries = computeHeadingEntries(doc);
			assert.strictEqual(entries.length, 2);
			assert.strictEqual(entries[0].slug, 'intro');
			assert.strictEqual(entries[0].level, 1);
			assert.strictEqual(entries[0].collapsed, false);
			assert.strictEqual(entries[1].slug, 'details');
			assert.strictEqual(entries[1].level, 2);
			assert.strictEqual(entries[1].collapsed, true);
			assert.ok(entries[0].endPos > entries[0].pos);
		});

		it('ignores non-heading nodes', () => {
			const doc = makeDoc([
				{ text: 'Title', level: 1 },
				{ text: 'A paragraph', type: 'paragraph' },
			]);
			const entries = computeHeadingEntries(doc);
			assert.strictEqual(entries.length, 1);
			assert.strictEqual(entries[0].slug, 'title');
		});

		it('resolves duplicate slugs with -2/-3 in order of appearance', () => {
			const doc = makeDoc([
				{ text: 'Section', level: 2 },
				{ text: 'Section', level: 2 },
				{ text: 'Section', level: 2 },
			]);
			const slugs = computeHeadingEntries(doc).map((e) => e.slug);
			assert.deepStrictEqual(slugs, ['section', 'section-2', 'section-3']);
		});

		it('avoids collisions with literal numbered slugs', () => {
			const doc = makeDoc([
				{ text: 'Section', level: 2 },
				{ text: 'Section 2', level: 2 },
				{ text: 'Section', level: 2 },
			]);
			const slugs = computeHeadingEntries(doc).map((e) => e.slug);
			assert.deepStrictEqual(slugs, ['section', 'section-2', 'section-3']);
		});

		it('is deterministic for the same document', () => {
			const build = () => makeDoc([
				{ text: 'Repeat', level: 1 },
				{ text: 'Repeat', level: 1 },
			]);
			assert.deepStrictEqual(
				computeHeadingEntries(build()).map((e) => e.slug),
				computeHeadingEntries(build()).map((e) => e.slug),
			);
		});

		it('marks headings inside a table as plain, keeping their slugs', () => {
			// Emulates descendants() document order: a heading, then a table
			// whose cell holds a heading, then a heading after the table.
			const heading = (text, pos) => ({
				node: {
					type: { name: 'heading' },
					textContent: text,
					attrs: { level: 2, collapsed: false },
					nodeSize: text.length + 2,
				},
				pos,
			});
			const visits = [
				heading('Before', 1),
				{ node: { type: { name: 'table' }, nodeSize: 30 }, pos: 9 },
				heading('Inside', 14),
				heading('After', 40),
			];
			const doc = {
				content: { size: 80 },
				resolve() {
					return { depth: 0, before: () => -1, end: () => 80 };
				},
				descendants(callback) {
					for (const entry of visits) {
						callback(entry.node, entry.pos);
					}
				},
			};

			const entries = computeHeadingEntries(doc);
			assert.deepStrictEqual(entries.map((e) => e.slug), ['before', 'inside', 'after']);
			assert.deepStrictEqual(entries.map((e) => e.plain), [false, true, false]);
		});

		it('keeps plain=false for top-level headings', () => {
			const entries = computeHeadingEntries(makeDoc([{ text: 'Solo', level: 1 }]));
			assert.strictEqual(entries[0].plain, false);
		});

		it('marks a heading nested in a blockquote or callout as plain, keeping its slug', () => {
			// A single heading at pos 5 that resolve() reports as sitting one level
			// deep inside the named container.
			const root = {
				depth: 0,
				node() { return { type: { name: 'doc' } }; },
				before() { return -1; },
				end() { return 50; },
			};
			const insideContainer = (containerName) => ({
				depth: 1,
				node(depth) {
					return depth === 1
						? { type: { name: containerName } }
						: { type: { name: 'doc' } };
				},
				before() { return 0; },
				end() { return 50; },
			});
			const makeContainerDoc = (containerName) => ({
				content: { size: 50 },
				resolve(pos) {
					return pos === 5 ? insideContainer(containerName) : root;
				},
				descendants(callback) {
					callback(
						{
							type: { name: 'heading' },
							textContent: 'Nested',
							attrs: { level: 2, collapsed: false },
							nodeSize: 8,
						},
						5,
					);
				},
			});

			for (const containerName of ['blockquote', 'callout']) {
				const entries = computeHeadingEntries(makeContainerDoc(containerName));
				assert.strictEqual(entries.length, 1, containerName);
				assert.strictEqual(entries[0].plain, true, `${containerName} heading is plain`);
				// Plain headings still get an anchor slug (id stays for direct links).
				assert.strictEqual(entries[0].slug, 'nested', containerName);
			}
		});
	});

	// $pos stub: names are listed outermost-first, so names[d-1] is the node at
	// depth d. A depth-0 position (doc root) holds no ancestors.
	describe('plain-context detection', () => {
		const posInside = (...names) => ({
			depth: names.length,
			node(depth) { return { type: { name: names[depth - 1] ?? 'doc' } }; },
		});
		const docRoot = { depth: 0, node() { return { type: { name: 'doc' } }; } };

		it('isInsideTable is true only inside a table', () => {
			assert.strictEqual(isInsideTable(posInside('table', 'tableRow', 'tableCell')), true);
			assert.strictEqual(isInsideTable(posInside('blockquote')), false);
			assert.strictEqual(isInsideTable(docRoot), false);
		});

		it('isInBlockquoteOrCallout is true inside a blockquote or callout', () => {
			assert.strictEqual(isInBlockquoteOrCallout(posInside('blockquote')), true);
			assert.strictEqual(isInBlockquoteOrCallout(posInside('callout')), true);
			assert.strictEqual(isInBlockquoteOrCallout(posInside('table', 'tableCell')), false);
			assert.strictEqual(isInBlockquoteOrCallout(docRoot), false);
		});

		it('isPlainHeadingContext covers table, blockquote and callout, not lists', () => {
			assert.strictEqual(isPlainHeadingContext(posInside('table', 'tableCell')), true);
			assert.strictEqual(isPlainHeadingContext(posInside('blockquote')), true);
			assert.strictEqual(isPlainHeadingContext(posInside('callout')), true);
			assert.strictEqual(isPlainHeadingContext(posInside('bulletList', 'listItem')), false);
			assert.strictEqual(isPlainHeadingContext(docRoot), false);
		});
	});

	describe('assignAnchorIds', () => {
		it('maps heading position -> slug', () => {
			const doc = makeDoc([
				{ text: 'First', level: 1 },
				{ text: 'Second', level: 2 },
			]);
			const map = assignAnchorIds(doc);
			const entries = computeHeadingEntries(doc);
			assert.strictEqual(map.get(entries[0].pos), 'first');
			assert.strictEqual(map.get(entries[1].pos), 'second');
		});
	});
});
