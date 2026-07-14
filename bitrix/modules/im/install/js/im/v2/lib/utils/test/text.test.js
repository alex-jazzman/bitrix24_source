import { Type } from 'main.core';

import { Utils } from 'im.v2.lib.utils';
import 'im.v2.test';

describe('Utils.text', () => {
	describe('convertCamelToSnakeCase', () => {
		it('function exists', () => {
			assert(Type.isFunction(Utils.text.convertCamelToSnakeCase));
		});
		it('converts plain camelCase', () => {
			assert.equal(Utils.text.convertCamelToSnakeCase('helloWorld'), 'hello_world');
			assert.equal(Utils.text.convertCamelToSnakeCase('plainNoAccent'), 'plain_no_accent');
		});
		it('keeps lowercase-only strings untouched', () => {
			assert.equal(Utils.text.convertCamelToSnakeCase('filled'), 'filled');
			assert.equal(Utils.text.convertCamelToSnakeCase(''), '');
		});
		it('inserts underscore before trailing digits', () => {
			assert.equal(Utils.text.convertCamelToSnakeCase('outlineAccent2'), 'outline_accent_2');
			assert.equal(Utils.text.convertCamelToSnakeCase('outlineAccent1'), 'outline_accent_1');
			assert.equal(Utils.text.convertCamelToSnakeCase('shadowOutlineAccent2'), 'shadow_outline_accent_2');
		});
		it('inserts underscore before multi-digit groups', () => {
			assert.equal(Utils.text.convertCamelToSnakeCase('version12Release'), 'version_12_release');
		});
	});
	describe('isUuidV4', () => {
		it('function exists', () => {
			assert(Type.isFunction(Utils.text.isUuidV4));
		});
		it('returns false for incorrect values', () => {
			assert.equal(Utils.text.isUuidV4(), false);
			assert.equal(Utils.text.isUuidV4('1'), false);
			assert.equal(Utils.text.isUuidV4(1), false);
			assert.equal(Utils.text.isUuidV4({}), false);
			assert.equal(Utils.text.isUuidV4('0eb4bcb3149d414e56193031bcdfd3756edc'), false);
		});
		it('returns true for correct uuid v4', () => {
			assert.equal(Utils.text.isUuidV4('0eb4bcb3-49d4-4e56-9303-bcdfd3756edc'), true);
			assert.equal(Utils.text.isUuidV4('0f6d3bf3-6a7a-4768-b5e9-eeb6d41124de'), true);
			assert.equal(Utils.text.isUuidV4('1bd94fe9-f37e-47fd-b32c-8685aab5b37f'), true);
		});
	});
});
