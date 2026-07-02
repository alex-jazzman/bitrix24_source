(() => {
	const require = (ext) => jn.require(ext);

	const { describe, test, expect } = require('testing');
	const { makeLibraryImagePath, makeLibraryImagePathByModule } = require('asset-manager');

	const RELATIVE_PATH = `${currentDomain}/bitrix/mobileapp`;
	const DEFAULT_ASSETS_PATH = `${RELATIVE_PATH}/mobile/extensions/bitrix/assets`;
	const themeId = require('apptheme').id;

	describe('makeLibraryImagePath', () => {
		test('returns themed path with filename only', () => {
			const result = makeLibraryImagePath('icon.png');

			expect(result).toBe(`${DEFAULT_ASSETS_PATH}/${themeId}/icon.png`);
		});

		test('returns unthemed path with filename only', () => {
			const result = makeLibraryImagePath('icon.png', undefined, undefined, false);

			expect(result).toBe(`${DEFAULT_ASSETS_PATH}/icon.png`);
		});

		test('returns themed path with folder', () => {
			const result = makeLibraryImagePath('icon.png', 'empty-states');

			expect(result).toBe(`${DEFAULT_ASSETS_PATH}/empty-states/${themeId}/icon.png`);
		});

		test('returns unthemed path with folder', () => {
			const result = makeLibraryImagePath('icon.png', 'empty-states', undefined, false);

			expect(result).toBe(`${DEFAULT_ASSETS_PATH}/empty-states/icon.png`);
		});

		test('delegates to makeLibraryImagePathByModule when moduleId is provided', () => {
			const result = makeLibraryImagePath('icon.png', 'empty-states', 'timeman');

			expect(result).toBe(
				`${RELATIVE_PATH}/timemanmobile/extensions/timeman/assets/empty-states/${themeId}/icon.png`,
			);
		});

		test('delegates to makeLibraryImagePathByModule unthemed', () => {
			const result = makeLibraryImagePath('icon.png', 'empty-states', 'timeman', false);

			expect(result).toBe(
				`${RELATIVE_PATH}/timemanmobile/extensions/timeman/assets/empty-states/icon.png`,
			);
		});

		test('uses default bitrix path when moduleId is mobile', () => {
			const result = makeLibraryImagePath('misunderstanding.png', 'marshmallow', 'mobile', false);

			expect(result).toBe(`${DEFAULT_ASSETS_PATH}/marshmallow/misunderstanding.png`);
		});

		test('uses default bitrix path with theme when moduleId is mobile', () => {
			const result = makeLibraryImagePath('misunderstanding.png', 'marshmallow', 'mobile', true);

			expect(result).toBe(`${DEFAULT_ASSETS_PATH}/marshmallow/${themeId}/misunderstanding.png`);
		});
	});

	describe('makeLibraryImagePathByModule', () => {
		test('builds correct themed path for regular module', () => {
			const result = makeLibraryImagePathByModule('icon.png', 'graphic', 'timeman', true);

			expect(result).toBe(
				`${RELATIVE_PATH}/timemanmobile/extensions/timeman/assets/graphic/${themeId}/icon.png`,
			);
		});

		test('builds correct unthemed path for regular module', () => {
			const result = makeLibraryImagePathByModule('icon.png', 'graphic', 'timeman', false);

			expect(result).toBe(
				`${RELATIVE_PATH}/timemanmobile/extensions/timeman/assets/graphic/icon.png`,
			);
		});

		test('does not duplicate mobile suffix when moduleId ends with mobile', () => {
			const result = makeLibraryImagePathByModule('icon.png', 'graphic', 'stafftrackmobile', true);

			expect(result).toBe(
				`${RELATIVE_PATH}/stafftrackmobile/extensions/stafftrackmobile/assets/graphic/${themeId}/icon.png`,
			);
		});

		test('does not duplicate mobile suffix unthemed', () => {
			const result = makeLibraryImagePathByModule('icon.png', 'graphic', 'stafftrackmobile', false);

			expect(result).toBe(
				`${RELATIVE_PATH}/stafftrackmobile/extensions/stafftrackmobile/assets/graphic/icon.png`,
			);
		});

		test('appends mobile suffix for modules without it', () => {
			const result = makeLibraryImagePathByModule('banner.png', 'banners', 'crm', false);

			expect(result).toBe(
				`${RELATIVE_PATH}/crmmobile/extensions/crm/assets/banners/banner.png`,
			);
		});
	});
})();
