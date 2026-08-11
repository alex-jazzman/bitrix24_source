import { NoteMentionNode } from '../../src/extensions/mention/note-mention-node';

// The tokenizer and (de)serializer are pure functions on the node config —
// exercise them directly without booting a full ProseMirror editor.
const { tokenize, start } = NoteMentionNode.config.markdownTokenizer;
const { parseMarkdown, renderMarkdown } = NoteMentionNode.config;

describe('note-mention-node', () => {
	describe('markdownTokenizer.start', () => {
		it('points the lexer at the first "@{" occurrence', () => {
			assert.strictEqual(start('hello @{user:1} world'), 6);
		});

		it('returns -1 when no "@{" is present', () => {
			assert.strictEqual(start('plain @user text'), -1);
		});
	});

	describe('markdownTokenizer.tokenize — valid tokens', () => {
		it('parses @{user:1} into a noteMention token', () => {
			const token = tokenize('@{user:1}');
			assert.deepStrictEqual(token, {
				type: 'noteMention',
				raw: '@{user:1}',
				entityType: 'user',
				entityId: 1,
			});
		});

		it('parses each supported type', () => {
			for (const type of ['user', 'document', 'collection', 'task'])
			{
				const token = tokenize(`@{${type}:42}`);
				assert(token !== null, type);
				assert.strictEqual(token.entityType, type);
				assert.strictEqual(token.entityId, 42);
			}
		});

		it('tokenizes only the leading token, leaving trailing text', () => {
			const token = tokenize('@{task:7} rest of line');
			assert.strictEqual(token.raw, '@{task:7}');
			assert.strictEqual(token.entityId, 7);
		});
	});

	describe('markdownTokenizer.tokenize — rejection (left as plain text)', () => {
		it('rejects an unsupported type', () => {
			assert.strictEqual(tokenize('@{folder:1}'), null);
		});

		it('rejects a CamelCase type', () => {
			assert.strictEqual(tokenize('@{User:1}'), null);
		});

		it('rejects a zero id', () => {
			assert.strictEqual(tokenize('@{user:0}'), null);
		});

		it('rejects a non-numeric id', () => {
			assert.strictEqual(tokenize('@{user:abc}'), null);
		});

		it('rejects a token not at the start of the fragment', () => {
			assert.strictEqual(tokenize('x @{user:1}'), null);
		});

		it('rejects a malformed delimiter', () => {
			assert.strictEqual(tokenize('@user:1'), null);
			assert.strictEqual(tokenize('@{user:1'), null);
		});
	});

	describe('parseMarkdown → node attrs', () => {
		it('maps token fields to entityType / entityId attrs', () => {
			const token = tokenize('@{document:15}');
			assert.deepStrictEqual(parseMarkdown(token), {
				type: 'noteMention',
				attrs: { entityType: 'document', entityId: 15 },
			});
		});
	});

	describe('renderMarkdown — serialization', () => {
		it('serializes a node back to canonical @{type:id}', () => {
			const md = renderMarkdown({ attrs: { entityType: 'collection', entityId: 9 } });
			assert.strictEqual(md, '@{collection:9}');
		});

		it('drops transient resolver attrs, writing only type/id', () => {
			const md = renderMarkdown({
				attrs: {
					entityType: 'user',
					entityId: 3,
					label: 'John Doe',
					avatar: '/upload/x.png',
					available: true,
				},
			});
			assert.strictEqual(md, '@{user:3}');
		});

		it('serializes a numeric-string id', () => {
			assert.strictEqual(renderMarkdown({ attrs: { entityType: 'task', entityId: '4' } }), '@{task:4}');
		});

		it('returns empty string for invalid attrs (no type / bad id)', () => {
			assert.strictEqual(renderMarkdown({ attrs: { entityType: null, entityId: 1 } }), '');
			assert.strictEqual(renderMarkdown({ attrs: { entityType: 'user', entityId: 0 } }), '');
			assert.strictEqual(renderMarkdown({ attrs: { entityType: 'user', entityId: -2 } }), '');
			assert.strictEqual(renderMarkdown({ attrs: { entityType: 'user', entityId: 'abc' } }), '');
		});

		it('returns empty string for a missing node/attrs', () => {
			assert.strictEqual(renderMarkdown(undefined), '');
			assert.strictEqual(renderMarkdown({}), '');
		});
	});

	describe('round-trip token ↔ markdown', () => {
		it('markdown → token → attrs → markdown is stable for every supported type', () => {
			for (const type of ['user', 'document', 'collection', 'task'])
			{
				const original = `@{${type}:123}`;
				const token = tokenize(original);
				const node = parseMarkdown(token);
				assert.strictEqual(renderMarkdown(node), original, type);
			}
		});
	});
});
