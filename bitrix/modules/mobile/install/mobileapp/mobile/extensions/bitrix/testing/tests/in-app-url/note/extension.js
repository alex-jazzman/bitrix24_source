(() => {
	const require = (ext) => jn.require(ext);
	const { extractNoteEntryPath } = require('in-app-url/routes/note');
	const { describe, it, expect } = require('testing');

	describe('in-app-url note entry path normalization', () => {
		it('extracts the document sub-path from a relative link', () => {
			expect(extractNoteEntryPath('/note/document/123/')).toBe('/document/123/');
		});

		it('keeps the hash anchor of a document link', () => {
			expect(extractNoteEntryPath('/note/document/5/#anchor')).toBe('/document/5/#anchor');
		});

		it('keeps the search query', () => {
			expect(extractNoteEntryPath('/note/search/?q=foo')).toBe('/search/?q=foo');
		});

		it('extracts service sub-paths (archive, recyclebin, workspace, shared)', () => {
			expect(extractNoteEntryPath('/note/archive/')).toBe('/archive/');
			expect(extractNoteEntryPath('/note/recyclebin/')).toBe('/recyclebin/');
			expect(extractNoteEntryPath('/note/workspace/42/')).toBe('/workspace/42/');
			expect(extractNoteEntryPath('/note/shared/')).toBe('/shared/');
		});

		it('treats the knowledge base root as home (empty entry path)', () => {
			expect(extractNoteEntryPath('/note/')).toBe('');
			expect(extractNoteEntryPath('/note')).toBe('');
		});

		it('strips scheme and host of a same-portal absolute link', () => {
			expect(extractNoteEntryPath('https://portal.test/note/document/7/')).toBe('/document/7/');
			expect(extractNoteEntryPath('https://portal.test/note/')).toBe('');
		});

		it('returns null for a non-note path that merely contains the substring', () => {
			expect(extractNoteEntryPath('/notebook/page/')).toBe(null);
			expect(extractNoteEntryPath('/crm/deal/details/10/')).toBe(null);
		});

		it('returns null for a foreign link with /note/ only inside the query', () => {
			expect(extractNoteEntryPath('/disk/?redirect=/note/document/1/')).toBe(null);
		});

		it('returns null for empty or invalid input', () => {
			expect(extractNoteEntryPath('')).toBe(null);
			expect(extractNoteEntryPath(null)).toBe(null);
			expect(extractNoteEntryPath(undefined)).toBe(null);
		});
	});
})();
