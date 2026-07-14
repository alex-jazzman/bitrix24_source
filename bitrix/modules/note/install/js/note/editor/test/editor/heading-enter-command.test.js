import { getSchema } from '@tiptap/core';
import { Blockquote } from '@tiptap/extension-blockquote';
import { Document } from '@tiptap/extension-document';
import { Paragraph } from '@tiptap/extension-paragraph';
import { Text } from '@tiptap/extension-text';
import { EditorState, TextSelection } from '@tiptap/pm/state';
import { HeadingAnchor } from '../../src/extensions/heading-anchor-extension';
import { splitCollapsedHeading } from '../../src/extensions/heading-enter-command';

const schema = getSchema([
	Document,
	Paragraph,
	Text,
	Blockquote,
	HeadingAnchor.configure({ levels: [1, 2, 3, 4] }),
]);

function heading(level, text, collapsed = false) {
	return schema.node('heading', { level, collapsed }, text ? [schema.text(text)] : []);
}

function paragraph(text) {
	return schema.node('paragraph', null, text ? [schema.text(text)] : []);
}

function blockquote(...children) {
	return schema.node('blockquote', null, children);
}

function docOf(...nodes) {
	return schema.node('doc', null, nodes);
}

// Builds a state whose caret sits at the END of the nth heading's text.
function caretAtEndOfHeading(doc, headingIndex) {
	let seen = -1;
	let caret = null;
	doc.descendants((node, pos) => {
		if (node.type.name === 'heading') {
			seen += 1;
			if (seen === headingIndex) {
				caret = pos + node.nodeSize - 1;
			}
			return false;
		}
		return undefined;
	});
	const state = EditorState.create({ doc });
	return state.apply(state.tr.setSelection(TextSelection.create(doc, caret)));
}

// Builds a state whose caret sits at `offset` inside the nth heading's text.
function caretInsideHeading(doc, headingIndex, offset) {
	let seen = -1;
	let caret = null;
	doc.descendants((node, pos) => {
		if (node.type.name === 'heading') {
			seen += 1;
			if (seen === headingIndex) {
				caret = pos + 1 + offset;
			}
			return false;
		}
		return undefined;
	});
	const state = EditorState.create({ doc });
	return state.apply(state.tr.setSelection(TextSelection.create(doc, caret)));
}

function run(state) {
	let tr = null;
	const handled = splitCollapsedHeading(state, (next) => {
		tr = next;
	});
	return { handled, tr };
}

// Node at the caret of a transaction's selection.
function selectionParent(tr) {
	return tr.selection.$from.parent;
}

describe('splitCollapsedHeading', () => {
	it('inserts a new same-level heading after a collapsed section ending at the next same-level heading', () => {
		const state = caretAtEndOfHeading(
			docOf(heading(2, 'A', true), paragraph('a1'), heading(2, 'B')),
			0,
		);
		const { handled, tr } = run(state);

		assert.strictEqual(handled, true);
		assert.ok(tr, 'a transaction should be dispatched');
		// A, a1, <new empty h2>, B
		assert.strictEqual(tr.doc.childCount, 4);
		assert.strictEqual(tr.doc.child(0).attrs.collapsed, true, 'original heading stays collapsed');
		assert.strictEqual(tr.doc.child(2).type.name, 'heading');
		assert.strictEqual(tr.doc.child(2).attrs.level, 2);
		assert.strictEqual(tr.doc.child(2).attrs.collapsed, false);
		assert.strictEqual(tr.doc.child(2).textContent, '');
		assert.strictEqual(tr.doc.child(3).textContent, 'B');
	});

	it('places the caret inside the newly created heading', () => {
		const state = caretAtEndOfHeading(
			docOf(heading(2, 'A', true), paragraph('a1'), heading(2, 'B')),
			0,
		);
		const { tr } = run(state);

		const parent = selectionParent(tr);
		assert.strictEqual(parent.type.name, 'heading');
		assert.strictEqual(parent.textContent, '', 'caret is in the empty new heading, not in B');
		assert.strictEqual(tr.selection.empty, true);
	});

	it('inserts after the whole collapsed subtree, past deeper headings', () => {
		const state = caretAtEndOfHeading(
			docOf(
				heading(2, 'A', true),
				paragraph('a1'),
				heading(3, 'Sub'),
				paragraph('s1'),
				heading(2, 'B'),
			),
			0,
		);
		const { handled, tr } = run(state);

		assert.strictEqual(handled, true);
		// A, a1, Sub, s1, <new h2>, B
		assert.strictEqual(tr.doc.childCount, 6);
		assert.strictEqual(tr.doc.child(4).type.name, 'heading');
		assert.strictEqual(tr.doc.child(4).attrs.level, 2);
		assert.strictEqual(tr.doc.child(4).textContent, '');
		assert.strictEqual(tr.doc.child(5).textContent, 'B');
	});

	it('appends at document end when no following same/shallower heading exists', () => {
		const state = caretAtEndOfHeading(
			docOf(paragraph('intro'), heading(2, 'A', true), paragraph('a1'), paragraph('a2')),
			0,
		);
		const { handled, tr } = run(state);

		assert.strictEqual(handled, true);
		// intro, A, a1, a2, <new h2>
		assert.strictEqual(tr.doc.childCount, 5);
		assert.strictEqual(tr.doc.child(4).type.name, 'heading');
		assert.strictEqual(tr.doc.child(4).attrs.level, 2);
		assert.strictEqual(tr.doc.child(4).textContent, '');
	});

	it('preserves the heading level (h3 stays h3)', () => {
		const state = caretAtEndOfHeading(
			docOf(heading(3, 'A', true), paragraph('a1')),
			0,
		);
		const { tr } = run(state);

		assert.strictEqual(tr.doc.child(2).type.name, 'heading');
		assert.strictEqual(tr.doc.child(2).attrs.level, 3);
	});

	it('does not split the title when the caret is in the middle of a collapsed heading', () => {
		const state = caretInsideHeading(
			docOf(heading(2, 'Hello', true), paragraph('a1')),
			0,
			2,
		);
		const { handled, tr } = run(state);

		assert.strictEqual(handled, true);
		// Title is intact; a new empty heading is appended after the subtree.
		assert.strictEqual(tr.doc.child(0).textContent, 'Hello');
		assert.strictEqual(tr.doc.childCount, 3);
		assert.strictEqual(tr.doc.child(2).type.name, 'heading');
		assert.strictEqual(tr.doc.child(2).textContent, '');
	});

	it('returns false for an expanded heading (default split behaviour)', () => {
		const state = caretAtEndOfHeading(
			docOf(heading(2, 'A', false), paragraph('a1')),
			0,
		);
		const { handled, tr } = run(state);

		assert.strictEqual(handled, false);
		assert.strictEqual(tr, null, 'no transaction is dispatched for an expanded heading');
	});

	it('returns false when the caret is not inside a heading', () => {
		const doc = docOf(heading(2, 'A', true), paragraph('a1'));
		let caret = null;
		doc.descendants((node, pos) => {
			if (node.type.name === 'paragraph') {
				caret = pos + 1;
				return false;
			}
			return undefined;
		});
		const base = EditorState.create({ doc });
		const state = base.apply(base.tr.setSelection(TextSelection.create(doc, caret)));
		const { handled } = run(state);

		assert.strictEqual(handled, false);
	});

	it('returns false when the selection is not empty', () => {
		const doc = docOf(heading(2, 'A', true), paragraph('a1'));
		const base = EditorState.create({ doc });
		// Select the whole heading text "A".
		const state = base.apply(base.tr.setSelection(TextSelection.create(doc, 1, 2)));
		const { handled } = run(state);

		assert.strictEqual(handled, false);
	});

	it('inserts after a nested blockquote, never inside it', () => {
		// A blockquote is opaque to the section structure: its same-level inner
		// heading must not become the insert position, so the new heading lands
		// after the whole quote (here: at document end).
		const state = caretAtEndOfHeading(
			docOf(
				heading(2, 'A', true),
				blockquote(heading(2, 'Inner'), paragraph('q body')),
				paragraph('tail'),
			),
			0,
		);
		const { handled, tr } = run(state);

		assert.strictEqual(handled, true);
		// A, blockquote, tail, <new empty h2>
		assert.strictEqual(tr.doc.childCount, 4);
		assert.strictEqual(tr.doc.child(1).type.name, 'blockquote');
		// The quote is untouched: it still holds its inner heading + body.
		assert.strictEqual(tr.doc.child(1).childCount, 2);
		assert.strictEqual(tr.doc.child(3).type.name, 'heading');
		assert.strictEqual(tr.doc.child(3).attrs.level, 2);
		assert.strictEqual(tr.doc.child(3).textContent, '');
	});
});
