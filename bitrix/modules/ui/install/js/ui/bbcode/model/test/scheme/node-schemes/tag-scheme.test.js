import { BBCodeTagScheme } from '../../../src/scheme/node-schemes/tag-scheme';

describe('scheme/node-schemes/tag-scheme', () => {
	let tagScheme;

	beforeEach(() => {
		tagScheme = new BBCodeTagScheme({ name: 'p' });
	});

	it('should set the "inline" property', () => {
		tagScheme.setInline(true);
		assert.strictEqual(tagScheme.isInline(), true);

		tagScheme.setInline(false);
		assert.strictEqual(tagScheme.isInline(), false);
	});

	it('should set the "void" property', () => {
		tagScheme.setVoid(true);
		assert.strictEqual(tagScheme.isVoid(), true);

		tagScheme.setVoid(false);
		assert.strictEqual(tagScheme.isVoid(), false);
	});

	it('should set the "childConverter" property', () => {
		const converter = (node) => node;
		tagScheme.setChildConverter(converter);
		assert.strictEqual(tagScheme.getChildConverter(), converter);

		tagScheme.setChildConverter(null);
		assert.strictEqual(tagScheme.getChildConverter(), null);
	});

	it('should set the "allowedChildren" property', () => {
		const allowedChildren = ['div', 'span'];
		tagScheme.setAllowedChildren(allowedChildren);
		assert.deepStrictEqual(tagScheme.getAllowedChildren(), allowedChildren);
	});
});
