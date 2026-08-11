(() => {
	const require = (ext) => jn.require(ext);
	const { describe, it, expect, beforeEach, afterEach } = require('testing');
	const { openInApp } = require('vibecode/catalog/src/open-in-app');

	describe('vibecode/catalog open-in-app', () => {
		let originalOpenPage = null;
		let openPageCalls = [];

		beforeEach(() => {
			openPageCalls = [];
			originalOpenPage = PageManager.openPage;
			PageManager.openPage = (params) => {
				openPageCalls.push(params);
			};
		});

		afterEach(() => {
			PageManager.openPage = originalOpenPage;
		});

		it('opens an embedded page in backdrop mode with the given url and title', () => {
			openInApp('https://portal.test/entry', { title: 'My App' });

			expect(openPageCalls.length).toBe(1);
			expect(openPageCalls[0]).toEqual({
				url: 'https://portal.test/entry',
				bx24ModernStyle: true,
				backdrop: {
					showOnTop: true,
				},
				titleParams: { text: 'My App' },
			});
		});

		it('passes an undefined title through when options are omitted', () => {
			openInApp('https://portal.test/entry');

			expect(openPageCalls.length).toBe(1);
			expect(openPageCalls[0].url).toBe('https://portal.test/entry');
			expect(openPageCalls[0].bx24ModernStyle).toBe(true);
			expect(openPageCalls[0].titleParams.text).toBeUndefined();
		});
	});
})();
