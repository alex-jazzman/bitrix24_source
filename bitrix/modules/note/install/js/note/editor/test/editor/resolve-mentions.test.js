import { collectUnresolvedMentions } from '../../src/utils/resolve-mentions';

// Minimal ProseMirror doc stub: descendants(cb) visits each provided node.
// A "node" here only needs { type: { name }, attrs }.
function makeDoc(nodes) {
	return {
		descendants(callback) {
			for (const node of nodes) {
				callback(node);
			}
		},
	};
}

function mention(entityType, entityId, extra = {}) {
	return {
		type: { name: 'noteMention' },
		attrs: { entityType, entityId, available: null, ...extra },
	};
}

describe('resolve-mentions', () => {
	describe('collectUnresolvedMentions', () => {
		it('collects unresolved mentions as { type, id } request items', () => {
			const doc = makeDoc([
				mention('user', 1),
				mention('document', 2),
			]);
			assert.deepStrictEqual(collectUnresolvedMentions(doc, new Set()), [
				{ type: 'user', id: 1 },
				{ type: 'document', id: 2 },
			]);
		});

		it('dedupes by "type:id" pair, preserving first-seen order', () => {
			const doc = makeDoc([
				mention('user', 1),
				mention('user', 1),
				mention('document', 1),
				mention('user', 1),
			]);
			assert.deepStrictEqual(collectUnresolvedMentions(doc, new Set()), [
				{ type: 'user', id: 1 },
				{ type: 'document', id: 1 },
			]);
		});

		it('does not treat same id under different types as a duplicate', () => {
			const doc = makeDoc([
				mention('user', 5),
				mention('task', 5),
			]);
			assert.strictEqual(collectUnresolvedMentions(doc, new Set()).length, 2);
		});

		it('skips already-resolved nodes (available !== null)', () => {
			const doc = makeDoc([
				mention('user', 1, { available: true }),
				mention('user', 2, { available: false }),
				mention('user', 3),
			]);
			assert.deepStrictEqual(collectUnresolvedMentions(doc, new Set()), [
				{ type: 'user', id: 3 },
			]);
		});

		it('honours the failed-set (skip), excluding those keys', () => {
			const doc = makeDoc([
				mention('user', 1),
				mention('document', 2),
			]);
			const skip = new Set(['user:1']);
			assert.deepStrictEqual(collectUnresolvedMentions(doc, skip), [
				{ type: 'document', id: 2 },
			]);
		});

		it('ignores non-mention nodes', () => {
			const doc = makeDoc([
				{ type: { name: 'paragraph' }, attrs: {} },
				mention('user', 1),
				{ type: { name: 'imageAttachment' }, attrs: { fileId: 9 } },
			]);
			assert.deepStrictEqual(collectUnresolvedMentions(doc, new Set()), [
				{ type: 'user', id: 1 },
			]);
		});

		it('skips nodes with an invalid id or missing type', () => {
			const doc = makeDoc([
				mention('user', 0),
				mention('user', -1),
				mention(null, 5),
				mention('task', 7),
			]);
			assert.deepStrictEqual(collectUnresolvedMentions(doc, new Set()), [
				{ type: 'task', id: 7 },
			]);
		});

		it('emits a numeric id even when the attr is a numeric string', () => {
			const doc = makeDoc([mention('user', '8')]);
			const [item] = collectUnresolvedMentions(doc, new Set());
			assert.strictEqual(item.id, 8);
			assert.strictEqual(typeof item.id, 'number');
		});

		it('returns an empty array for a document without mentions', () => {
			const doc = makeDoc([{ type: { name: 'paragraph' }, attrs: {} }]);
			assert.deepStrictEqual(collectUnresolvedMentions(doc, new Set()), []);
		});
	});
});
