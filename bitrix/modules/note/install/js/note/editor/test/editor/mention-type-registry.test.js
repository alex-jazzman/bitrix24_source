import {
	isSupportedType,
	byType,
	allTypes,
} from '../../src/extensions/mention/mention-type-registry';

describe('mention-type-registry', () => {
	describe('isSupportedType', () => {
		it('accepts all four wire types', () => {
			assert.strictEqual(isSupportedType('user'), true);
			assert.strictEqual(isSupportedType('document'), true);
			assert.strictEqual(isSupportedType('collection'), true);
			assert.strictEqual(isSupportedType('task'), true);
		});

		it('rejects unknown types', () => {
			assert.strictEqual(isSupportedType('folder'), false);
			assert.strictEqual(isSupportedType('User'), false);
			assert.strictEqual(isSupportedType(''), false);
		});

		it('does not treat inherited Object props as types', () => {
			assert.strictEqual(isSupportedType('toString'), false);
			assert.strictEqual(isSupportedType('hasOwnProperty'), false);
			assert.strictEqual(isSupportedType('constructor'), false);
		});
	});

	describe('byType', () => {
		it('maps user to slider navKind and user entityId', () => {
			assert.deepStrictEqual(byType('user'), { entityId: 'user', navKind: 'slider' });
		});

		it('maps document to internal-link navKind and note-document entityId', () => {
			assert.deepStrictEqual(byType('document'), { entityId: 'note-document', navKind: 'internal-link' });
		});

		it('maps collection to internal-link navKind and note-collection entityId', () => {
			assert.deepStrictEqual(byType('collection'), { entityId: 'note-collection', navKind: 'internal-link' });
		});

		it('maps task to slider navKind and task entityId', () => {
			assert.deepStrictEqual(byType('task'), { entityId: 'task', navKind: 'slider' });
		});

		it('returns null for an unknown type', () => {
			assert.strictEqual(byType('folder'), null);
			assert.strictEqual(byType(''), null);
		});
	});

	describe('allTypes', () => {
		it('returns exactly the four supported wire types', () => {
			assert.deepStrictEqual(allTypes().sort(), ['collection', 'document', 'task', 'user']);
		});

		it('is consistent with isSupportedType', () => {
			for (const type of allTypes())
			{
				assert.strictEqual(isSupportedType(type), true, type);
			}
		});
	});
});
