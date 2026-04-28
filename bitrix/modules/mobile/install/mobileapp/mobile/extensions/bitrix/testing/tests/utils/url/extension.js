(() => {
	const require = (ext) => jn.require(ext);
	const { describe, test, expect } = require('testing');

	describe('utils/url isValidLink', () => {
		const { isValidLink } = require('utils/url');

		test('https URL with valid domain', () => {
			expect(isValidLink('https://example.com')).toBe(true);
		});

		test('http URL with valid domain', () => {
			expect(isValidLink('http://example.com')).toBe(true);
		});

		test('URL with path, query and hash', () => {
			expect(isValidLink('https://example.com/path?foo=bar#section')).toBe(true);
		});

		test('URL without protocol', () => {
			expect(isValidLink('example.com')).toBe(true);
		});

		test('IP address', () => {
			expect(isValidLink('http://192.168.1.1')).toBe(true);
		});

		test('IP address with port', () => {
			expect(isValidLink('http://192.168.1.1:8080')).toBe(true);
		});

		test('domain with port', () => {
			expect(isValidLink('https://example.com:8080')).toBe(true);
		});

		test('subdomain', () => {
			expect(isValidLink('https://sub.example.com')).toBe(true);
		});

		test('multi-level subdomain', () => {
			expect(isValidLink('https://api.v2.example.com')).toBe(true);
		});

		test('domain with hyphens', () => {
			expect(isValidLink('https://my-example-site.com')).toBe(true);
		});

		test('localhost', () => {
			expect(isValidLink('localhost')).toBe(true);
		});

		test('localhost with protocol and port', () => {
			expect(isValidLink('http://localhost:3000')).toBe(true);
		});

		test('plain text without dots', () => {
			expect(isValidLink('abc')).toBe(false);
		});

		test('empty string', () => {
			expect(isValidLink('')).toBe(false);
		});

		test('null', () => {
			expect(isValidLink(null)).toBe(false);
		});

		test('undefined', () => {
			expect(isValidLink(undefined)).toBe(false);
		});

		test('single word with http prefix', () => {
			expect(isValidLink('http://intranet')).toBe(false);
		});
	});
})();
