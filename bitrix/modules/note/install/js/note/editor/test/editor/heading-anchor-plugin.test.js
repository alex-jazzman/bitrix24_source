import { getSchema, Node } from '@tiptap/core';
import { Blockquote } from '@tiptap/extension-blockquote';
import { Document } from '@tiptap/extension-document';
import { Paragraph } from '@tiptap/extension-paragraph';
import { Text } from '@tiptap/extension-text';
import { HeadingAnchor } from '../../src/extensions/heading-anchor-extension';
import { buildHeadingDecorationSet } from '../../src/extensions/heading-anchor-plugin';

// Minimal stand-in for the real Callout node. The plain-heading detection keys
// off the node NAME only, and importing the full callout-extension would pull
// `marked` into the unit bundle. This mirrors the real node's name/content.
const Callout = Node.create({
	name: 'callout',
	content: 'block+',
	group: 'block',
	defining: true,
});

const schema = getSchema([
	Document,
	Paragraph,
	Text,
	Blockquote,
	Callout,
	HeadingAnchor.configure({ levels: [1, 2, 3, 4] }),
]);

function heading(level, text, collapsed = false) {
	return schema.node('heading', { level, collapsed }, [schema.text(text)]);
}

function paragraph(text) {
	return schema.node('paragraph', null, text ? [schema.text(text)] : []);
}

function blockquote(...children) {
	return schema.node('blockquote', null, children);
}

function callout(...children) {
	return schema.node('callout', { type: 'info' }, children);
}

function nodeDecorationAttrs(set) {
	// Decoration.node stores its attrs on the internal decoration type.
	return set.find().map((deco) => deco.type?.attrs ?? {});
}

function collapsedBlockDecorations(set) {
	return set.find().filter((deco) => (deco.type?.attrs?.class ?? '') === 'note-heading-collapsed-block');
}

describe('heading-anchor-plugin', () => {
	describe('buildHeadingDecorationSet', () => {
		it('returns empty set when there are no headings', () => {
			const doc = schema.node('doc', null, [paragraph('just text')]);
			assert.strictEqual(buildHeadingDecorationSet(doc).find().length, 0);
		});

		it('assigns an id decoration to every heading', () => {
			const doc = schema.node('doc', null, [
				heading(1, 'Intro'),
				paragraph('body'),
				heading(2, 'Setup Guide'),
			]);
			const ids = nodeDecorationAttrs(buildHeadingDecorationSet(doc))
				.map((attrs) => attrs.id)
				.filter(Boolean);
			assert.deepStrictEqual(ids, ['intro', 'setup-guide']);
		});

		it('keeps duplicate-heading ids unique', () => {
			const doc = schema.node('doc', null, [
				heading(2, 'Section'),
				heading(2, 'Section'),
			]);
			const ids = nodeDecorationAttrs(buildHeadingDecorationSet(doc))
				.map((attrs) => attrs.id)
				.filter(Boolean);
			assert.deepStrictEqual(ids, ['section', 'section-2']);
		});

		it('places id decorations at the heading positions', () => {
			const doc = schema.node('doc', null, [
				heading(1, 'Top'),
				paragraph('body'),
			]);
			const set = buildHeadingDecorationSet(doc);
			const idDecos = set.find().filter((deco) => deco.type?.attrs?.id);
			assert.strictEqual(idDecos.length, 1);
			assert.strictEqual(idDecos[0].from, 0);
			assert.strictEqual(idDecos[0].to, doc.child(0).nodeSize);
		});
	});

	describe('collapse mask', () => {
		it('adds no collapse decorations when nothing is collapsed', () => {
			const doc = schema.node('doc', null, [
				heading(2, 'A'),
				paragraph('a1'),
			]);
			assert.strictEqual(collapsedBlockDecorations(buildHeadingDecorationSet(doc)).length, 0);
		});

		it('hides blocks under a collapsed heading up to the next same/shallower heading', () => {
			const doc = schema.node('doc', null, [
				heading(2, 'A', true),
				paragraph('a1'),
				heading(3, 'B'),
				paragraph('b1'),
				heading(2, 'C'),
				paragraph('c1'),
			]);
			// Hidden: a1, B (h3), b1 — but not C (h2) nor c1.
			assert.strictEqual(collapsedBlockDecorations(buildHeadingDecorationSet(doc)).length, 3);
		});

		it('hides everything to the end when the last heading is collapsed', () => {
			const doc = schema.node('doc', null, [
				heading(2, 'A'),
				paragraph('a1'),
				heading(2, 'B', true),
				paragraph('b1'),
				paragraph('b2'),
			]);
			assert.strictEqual(collapsedBlockDecorations(buildHeadingDecorationSet(doc)).length, 2);
		});

		it('a collapsed deeper heading does not swallow a following shallower heading', () => {
			const doc = schema.node('doc', null, [
				heading(3, 'A', true),
				paragraph('a1'),
				heading(2, 'B'),
				paragraph('b1'),
			]);
			// Only a1 is hidden; B (h2) is shallower and ends the range.
			assert.strictEqual(collapsedBlockDecorations(buildHeadingDecorationSet(doc)).length, 1);
		});
	});

	describe('container-aware collapse (blockquote / callout scope)', () => {
		it('an outer collapse hides a quote with a same-level nested heading AND the block after it', () => {
			// Regression: a heading nested in the quote used to terminate the outer
			// range *inside* the quote, so "after" leaked out of the fold.
			const doc = schema.node('doc', null, [
				heading(2, 'Outer', true),
				paragraph('before'),
				blockquote(heading(2, 'Inner'), paragraph('inner body')),
				paragraph('after'),
			]);
			// Top-level blocks of Outer's section: before, the whole blockquote, after.
			assert.strictEqual(collapsedBlockDecorations(buildHeadingDecorationSet(doc)).length, 3);
		});

		it('an outer collapse hides a callout with a same-level nested heading AND the block after it', () => {
			const doc = schema.node('doc', null, [
				heading(2, 'Outer', true),
				paragraph('before'),
				callout(heading(2, 'Inner'), paragraph('inner body')),
				paragraph('after'),
			]);
			// before, the whole callout, after — the nested heading does not cut in.
			assert.strictEqual(collapsedBlockDecorations(buildHeadingDecorationSet(doc)).length, 3);
		});

		it('a heading inside a quote is plain: a collapsed attr produces no mask', () => {
			// The nested heading carries no collapse control, and a stale collapsed
			// attr (e.g. from an older document) is ignored — nothing folds.
			const doc = schema.node('doc', null, [
				blockquote(heading(2, 'Q', true), paragraph('q1'), paragraph('q2')),
				paragraph('outside'),
			]);
			assert.strictEqual(collapsedBlockDecorations(buildHeadingDecorationSet(doc)).length, 0);
		});

		it('a heading inside a callout is plain: a collapsed attr produces no mask', () => {
			const doc = schema.node('doc', null, [
				callout(heading(2, 'C', true), paragraph('c1'), paragraph('c2')),
				paragraph('outside'),
			]);
			assert.strictEqual(collapsedBlockDecorations(buildHeadingDecorationSet(doc)).length, 0);
		});

		it('a deeper nested heading inside a quote does not terminate the outer range', () => {
			const doc = schema.node('doc', null, [
				heading(2, 'Outer', true),
				blockquote(heading(3, 'Deep'), paragraph('deep body')),
				paragraph('tail'),
			]);
			// Whole quote + tail hidden under Outer (Deep is a different scope).
			assert.strictEqual(collapsedBlockDecorations(buildHeadingDecorationSet(doc)).length, 2);
		});

		it('still stamps anchor ids on headings inside a quote and a callout', () => {
			// Plain headings keep their id so existing #slug deep links still resolve.
			const doc = schema.node('doc', null, [
				blockquote(heading(2, 'In Quote')),
				callout(heading(2, 'In Callout')),
			]);
			const ids = nodeDecorationAttrs(buildHeadingDecorationSet(doc))
				.map((attrs) => attrs.id)
				.filter(Boolean);
			assert.deepStrictEqual(ids, ['in-quote', 'in-callout']);
		});
	});

	describe('local reveal override (anchor navigation in view mode)', () => {
		it('a revealed collapsed heading is treated as expanded — no mask', () => {
			const doc = schema.node('doc', null, [
				heading(2, 'A', true),
				paragraph('a1'),
				heading(3, 'B'),
				paragraph('b1'),
			]);
			// Without the override the whole section under A is masked.
			assert.strictEqual(collapsedBlockDecorations(buildHeadingDecorationSet(doc)).length, 3);
			// A sits at the start of the doc → pos 0. Revealing it drops the mask
			// without changing the (still collapsed) attribute.
			const revealed = new Set([0]);
			assert.strictEqual(collapsedBlockDecorations(buildHeadingDecorationSet(doc, revealed)).length, 0);
		});

		it('revealing one heading does not unmask an unrelated collapsed section', () => {
			const doc = schema.node('doc', null, [
				heading(2, 'A', true),
				paragraph('a1'),
				heading(2, 'C', true),
				paragraph('c1'),
			]);
			// Reveal only A (pos 0); C stays collapsed and keeps masking c1.
			const revealed = new Set([0]);
			assert.strictEqual(collapsedBlockDecorations(buildHeadingDecorationSet(doc, revealed)).length, 1);
		});

		it('still stamps anchor ids while revealed', () => {
			const doc = schema.node('doc', null, [
				heading(2, 'A', true),
				paragraph('a1'),
			]);
			const ids = nodeDecorationAttrs(buildHeadingDecorationSet(doc, new Set([0])))
				.map((attrs) => attrs.id)
				.filter(Boolean);
			assert.deepStrictEqual(ids, ['a']);
		});
	});
});
