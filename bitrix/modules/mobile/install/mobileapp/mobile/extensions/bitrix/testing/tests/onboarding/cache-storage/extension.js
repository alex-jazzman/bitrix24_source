(() => {
	const require = (ext) => jn.require(ext);

	const { describe, it, expect, beforeEach } = require('testing');
	const { CacheStorage } = require('onboarding/cache');

	describe('Onboarding: CacheStorage', () => {
		let mockStorage = null;

		beforeEach(() => {
			mockStorage = {
				values: {},
				get(key) {
					return this.values[key];
				},
				set(key, value) {
					this.values[key] = value;
				},
			};

			CacheStorage.setStorage({
				getStorage: () => mockStorage,
			});
		});

		it('should return null if key does not exist', () => {
			const result = CacheStorage.get('missing');
			expect(result).toBeNull();
		});

		it('should return stored value if key exists', () => {
			mockStorage.set('foo', 'bar');

			const result = CacheStorage.get('foo');

			expect(result).toBe('bar');
		});

		it('should set value in storage', () => {
			CacheStorage.set('key1', 123);

			expect(mockStorage.get('key1')).toBe(123);
		});

		it('should overwrite existing value', () => {
			mockStorage.set('key2', 'old');

			CacheStorage.set('key2', 'new');

			expect(mockStorage.get('key2')).toBe('new');
		});

		it('should work if storage returns undefined (get)', () => {
			delete mockStorage.values.superPuper;

			const result = CacheStorage.get('superPuper');

			expect(result).toBeNull();
		});

		it('should reset deps when setStorage() called with null', () => {
			let called = false;

			// set storage
			CacheStorage.setStorage({
				getStorage: () => {
					called = true;

					return mockStorage;
				},
			});

			CacheStorage.get('any');

			expect(called).toBe(true);

			// reset storage
			CacheStorage.setStorage(null);

			// after reset, we returned to the default implementation
			// in tests we can't get the real Application.sharedStorage,
			// so we just check that the call didn't fail
			expect(() => CacheStorage.get('whatever')).not.toThrow();
		});
	});
})();
