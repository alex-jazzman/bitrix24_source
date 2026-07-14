import { parseInternalNoteLink } from '../../src/utils/internal-link';

describe('internal-link', () => {
	describe('parseInternalNoteLink', () => {
		it('parses relative document link with trailing slash', () => {
			assert.deepStrictEqual(parseInternalNoteLink('/note/document/123/'), { type: 'document', id: 123 });
		});

		it('parses relative document link without trailing slash', () => {
			assert.deepStrictEqual(parseInternalNoteLink('/note/document/42'), { type: 'document', id: 42 });
		});

		it('parses relative document link with query string', () => {
			assert.deepStrictEqual(parseInternalNoteLink('/note/document/7/?foo=bar'), { type: 'document', id: 7 });
		});

		it('parses relative document link with hash', () => {
			assert.deepStrictEqual(
				parseInternalNoteLink('/note/document/7/#section'),
				{ type: 'document', id: 7, hash: 'section' },
			);
		});

		it('parses relative document link with query and hash', () => {
			assert.deepStrictEqual(
				parseInternalNoteLink('/note/document/7/?foo=bar#section'),
				{ type: 'document', id: 7, hash: 'section' },
			);
		});

		it('parses same-origin absolute document link with hash', () => {
			assert.deepStrictEqual(
				parseInternalNoteLink('https://portal.test/note/document/9/#intro', 'https://portal.test'),
				{ type: 'document', id: 9, hash: 'intro' },
			);
		});

		it('parses a pure in-document anchor link', () => {
			assert.deepStrictEqual(parseInternalNoteLink('#getting-started'), { type: 'anchor', hash: 'getting-started' });
		});

		it('rejects an empty anchor link', () => {
			assert.strictEqual(parseInternalNoteLink('#'), null);
		});

		it('accepts same-origin absolute https link (backward compat)', () => {
			assert.deepStrictEqual(
				parseInternalNoteLink('https://portal.test/note/document/123/', 'https://portal.test'),
				{ type: 'document', id: 123 },
			);
		});

		it('accepts same-origin absolute http link (backward compat)', () => {
			assert.deepStrictEqual(
				parseInternalNoteLink('http://mysql.dev-b24.bx/note/document/2/', 'http://mysql.dev-b24.bx'),
				{ type: 'document', id: 2 },
			);
		});

		it('rejects different-origin absolute link', () => {
			assert.strictEqual(
				parseInternalNoteLink('https://other-portal/note/document/123/', 'https://portal.test'),
				null,
			);
		});

		it('rejects absolute link when origin is unknown', () => {
			assert.strictEqual(
				parseInternalNoteLink('https://portal.test/note/document/123/', null),
				null,
			);
		});

		it('rejects protocol-relative link', () => {
			assert.strictEqual(parseInternalNoteLink('//portal/note/document/123/', 'https://portal'), null);
		});

		it('rejects collection link (not supported in MVP)', () => {
			assert.strictEqual(parseInternalNoteLink('/note/collection/5/'), null);
		});

		it('rejects non-note paths', () => {
			assert.strictEqual(parseInternalNoteLink('/other/document/1/'), null);
		});

		it('rejects malformed ids', () => {
			assert.strictEqual(parseInternalNoteLink('/note/document/abc/'), null);
		});

		it('rejects zero id', () => {
			assert.strictEqual(parseInternalNoteLink('/note/document/0/'), null);
		});

		it('rejects empty input', () => {
			assert.strictEqual(parseInternalNoteLink(''), null);
		});

		it('rejects non-string input', () => {
			assert.strictEqual(parseInternalNoteLink(null), null);
			assert.strictEqual(parseInternalNoteLink(undefined), null);
			assert.strictEqual(parseInternalNoteLink(123), null);
		});

		it('rejects link with extra path segments', () => {
			assert.strictEqual(parseInternalNoteLink('/note/document/1/extra/'), null);
		});

		it('rejects home path', () => {
			assert.strictEqual(parseInternalNoteLink('/note/'), null);
		});

		it('rejects absolute same-origin collection link (MVP: documents only)', () => {
			assert.strictEqual(
				parseInternalNoteLink('http://portal/note/collection/5/', 'http://portal'),
				null,
			);
		});
	});
});
