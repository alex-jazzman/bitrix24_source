(() => {
	const require = (ext) => jn.require(ext);
	const { describe, test, expect } = require('testing');

	describe('Global env', () => {
		test('should have env object', () => {
			expect(env).toBeDefined();
			expect(typeof env).toBe('object');
		});

		test('should have extranet boolean field', () => {
			expect(env.extranet).toBeDefined();
			expect(typeof env.extranet).toBe('boolean');
		});

		test('should have installedModules object field', () => {
			expect(env.installedModules).toBeDefined();
			expect(typeof env.installedModules).toBe('object');
		});

		test('should have isAdmin boolean field', () => {
			expect(env.isAdmin).toBeDefined();
			expect(typeof env.isAdmin).toBe('boolean');
		});

		test('should have isCollaber boolean field', () => {
			expect(env.isCollaber).toBeDefined();
			expect(typeof env.isCollaber).toBe('boolean');
		});

		test('should have languageId string field', () => {
			expect(env.languageId).toBeDefined();
			expect(typeof env.languageId).toBe('string');
		});

		test('should have region string field', () => {
			expect(env.region).toBeDefined();
			expect(typeof env.region).toBe('string');
		});

		test('should have siteDir string field', () => {
			expect(env.siteDir).toBeDefined();
			expect(typeof env.siteDir).toBe('string');
		});

		test('should have siteId string field', () => {
			expect(env.siteId).toBeDefined();
			expect(typeof env.siteId).toBe('string');
		});

		test('should have userId string field', () => {
			expect(env.userId).toBeDefined();
			expect(typeof env.userId).toBe('string');
		});
	});
})();