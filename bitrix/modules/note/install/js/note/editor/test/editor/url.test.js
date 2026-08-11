import { sanitizeUrl } from '../../src/utils/url';

describe('url', () => {
	describe('sanitizeUrl', () => {
		it('keeps a valid in-document anchor', () => {
			assert.strictEqual(sanitizeUrl('#slug'), '#slug');
		});

		it('keeps a hyphenated anchor slug', () => {
			assert.strictEqual(sanitizeUrl('#getting-started'), '#getting-started');
		});

		it('rejects an empty anchor', () => {
			assert.strictEqual(sanitizeUrl('#'), null);
		});

		it('rejects an anchor with uppercase characters', () => {
			assert.strictEqual(sanitizeUrl('#Upper'), null);
		});

		it('rejects an anchor with whitespace', () => {
			assert.strictEqual(sanitizeUrl('#with space'), null);
		});

		it('rejects a javascript: scheme', () => {
			assert.strictEqual(sanitizeUrl('javascript:alert(1)'), null);
		});

		it('keeps an external absolute https url', () => {
			assert.strictEqual(sanitizeUrl('https://x.test/a'), 'https://x.test/a');
		});

		it('keeps an internal note document path', () => {
			assert.strictEqual(sanitizeUrl('/note/document/1/'), '/note/document/1/');
		});

		it('canonicalizes a short document path (no /note prefix)', () => {
			assert.strictEqual(sanitizeUrl('/document/5/'), '/note/document/5/');
		});

		it('canonicalizes a workspace (collection) path', () => {
			assert.strictEqual(sanitizeUrl('/workspace/7/'), '/note/workspace/7/');
		});

		it('canonicalizes a legacy /collection/{id}/ path to /note/workspace/{id}/', () => {
			assert.strictEqual(sanitizeUrl('/collection/7/'), '/note/workspace/7/');
		});

		it('preserves search and hash when canonicalizing a short document path', () => {
			assert.strictEqual(sanitizeUrl('/document/5/?foo=bar#slug'), '/note/document/5/?foo=bar#slug');
		});

		it('preserves search and hash when canonicalizing a legacy collection path', () => {
			assert.strictEqual(sanitizeUrl('/collection/7/?foo=bar#slug'), '/note/workspace/7/?foo=bar#slug');
		});

		it('canonicalizes a full same-origin workspace url to a relative path', () => {
			assert.strictEqual(
				sanitizeUrl(`${window.location.origin}/note/workspace/7/`),
				'/note/workspace/7/',
			);
		});
	});
});
