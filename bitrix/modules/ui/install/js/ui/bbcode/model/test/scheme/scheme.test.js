import { BBCodeScheme } from '../../src/scheme/bbcode-scheme';
import { BBCodeTagScheme } from '../../src/scheme/node-schemes/tag-scheme';

describe('BBCodeScheme', () => {
	let bbCodeScheme: BBCodeScheme;

	beforeEach(() => {
		const options = {
			tagSchemes: [],
		};

		bbCodeScheme = new BBCodeScheme(options);
	});

	describe('BBCodeScheme.constructor', () => {
		it('should throw a TypeError if options is not an object', () => {
			assert.throws(() => {
				new BBCodeScheme(null);
			}, TypeError);
		});

		it('should set tag schemes with the provided options', () => {
			const tagSchemes = [
				new BBCodeTagScheme({ name: 'p' }),
				new BBCodeTagScheme({ name: ['b', 'u'] }),
			];
			const bbCodeScheme = new BBCodeScheme({
				tagSchemes,
			});

			assert.deepEqual(bbCodeScheme.getTagSchemes(), tagSchemes);
		});
	});

	describe('BBCodeScheme.setTagSchemes', () => {
		it('should set tag schemes with the provided tag schemes', () => {
			const tagSchemes = [new BBCodeTagScheme({ name: 'p' })];
			bbCodeScheme.setTagSchemes(tagSchemes);

			assert.deepEqual(bbCodeScheme.getTagSchemes(), tagSchemes);
		});

		it('should throw a TypeError if any of the provided tag schemes is not an instance of TagScheme', () => {
			const tagSchemes = [new BBCodeTagScheme({ name: 'p' }), {}];

			assert.throws(() => {
				bbCodeScheme.setTagSchemes(tagSchemes);
			}, TypeError);
		});
	});

	describe('BBCodeScheme.setTagScheme', () => {
		it('should add the provided tag schemes to the existing tag schemes', () => {
			const existingTagSchemes = [new BBCodeTagScheme({ name: 'div' })];
			const newTagSchemes = [new BBCodeTagScheme({ name: 'p' })];
			bbCodeScheme.setTagSchemes(existingTagSchemes);
			bbCodeScheme.setTagScheme(...newTagSchemes);

			assert.deepEqual(bbCodeScheme.getTagSchemes(), [...existingTagSchemes, ...newTagSchemes]);
		});

		it('should remove the names of the new tag schemes from the existing tag schemes', () => {
			const existingTagScheme1 = new BBCodeTagScheme({ name: ['p', 'b', 'i'] });
			const existingTagScheme2 = new BBCodeTagScheme({ name: ['s', 'u'] });
			const newTagScheme1 = new BBCodeTagScheme({ name: 'p' });
			const newTagScheme2 = new BBCodeTagScheme({ name: 'u' });

			bbCodeScheme.setTagSchemes([existingTagScheme1, existingTagScheme2]);
			bbCodeScheme.setTagScheme(newTagScheme1, newTagScheme2);

			assert.ok(bbCodeScheme.getTagSchemes().length === 4);
			assert.deepEqual(existingTagScheme1.getName(), ['b', 'i']);
			assert.deepEqual(existingTagScheme2.getName(), ['s']);
			assert.deepEqual(newTagScheme1.getName(), ['p']);
			assert.deepEqual(newTagScheme2.getName(), ['u']);
		});

		it('should throw a TypeError if any of the provided tag schemes is not an instance of TagScheme', () => {
			const tagSchemes = [new BBCodeTagScheme({ name: 'p' }), {}];

			assert.throws(() => {
				bbCodeScheme.setTagScheme(...tagSchemes);
			}, TypeError);
		});
	});

	describe('BBCodeScheme.getTagSchemes', () => {
		it('should return a copy of the tagSchemes property', () => {
			const tagSchemes = [new BBCodeTagScheme({ name: 'p' })];
			bbCodeScheme.setTagSchemes(tagSchemes);

			assert.deepEqual(bbCodeScheme.getTagSchemes(), tagSchemes);
		});
	});

	describe('BBCodeScheme.getTagScheme', () => {
		it('should return the tag scheme with the provided tag name if it exists', () => {
			const tagScheme1 = new BBCodeTagScheme({ name: 'tag1' });
			const tagScheme2 = new BBCodeTagScheme({ name: 'tag2' });
			bbCodeScheme.setTagSchemes([tagScheme1, tagScheme2]);

			assert.deepEqual(bbCodeScheme.getTagScheme('tag1'), tagScheme1);
		});
	});

	describe('BBCodeScheme.setOutputTagCase', () => {
		it('should throw a TypeError if passed not allowed string value', () => {
		    assert.throws(() => {
				bbCodeScheme.setOutputTagCase('test');
			});
		});

		it('should throw a TypeError if passed object', () => {
			assert.throws(() => {
				bbCodeScheme.setOutputTagCase({});
			});
		});

		it('should throw a TypeError if passed number', () => {
			assert.throws(() => {
				bbCodeScheme.setOutputTagCase(2);
			});
		});

		it('should does not throws if passed null', () => {
		    assert.doesNotThrow(() => {
				bbCodeScheme.setOutputTagCase(null);
			});
		});

		it('should does not throws if passed undefined', () => {
			assert.doesNotThrow(() => {
				bbCodeScheme.setOutputTagCase(undefined);
			});
		});

		it('should sets allowed case', () => {
			bbCodeScheme.setOutputTagCase(BBCodeScheme.Case.LOWER);
			assert.equal(bbCodeScheme.getOutputTagCase(), BBCodeScheme.Case.LOWER);

			bbCodeScheme.setOutputTagCase(BBCodeScheme.Case.UPPER);
			assert.equal(bbCodeScheme.getOutputTagCase(), BBCodeScheme.Case.UPPER);
		});
	});

	describe('BBCodeScheme.setUnresolvedNodesHoisting', () => {
	    it('should throw a TypeError if passed string', () => {
			assert.throws(() => {
				bbCodeScheme.setUnresolvedNodesHoisting('111');
			});
	    });

		it('should throw a TypeError if passed object', () => {
			assert.throws(() => {
				bbCodeScheme.setUnresolvedNodesHoisting({});
			});

			assert.throws(() => {
				bbCodeScheme.setUnresolvedNodesHoisting([]);
			});
		});

		it('should does not throws if passed null', () => {
			assert.doesNotThrow(() => {
				bbCodeScheme.setUnresolvedNodesHoisting(null);
			});
		});

		it('should does not throws if passed undefined', () => {
			assert.doesNotThrow(() => {
				bbCodeScheme.setUnresolvedNodesHoisting(undefined);
			});
		});

		it('should sets allowed value', () => {
		    bbCodeScheme.setUnresolvedNodesHoisting(true);
			assert.equal(bbCodeScheme.isAllowedUnresolvedNodesHoisting(), true);

			bbCodeScheme.setUnresolvedNodesHoisting(false);
			assert.equal(bbCodeScheme.isAllowedUnresolvedNodesHoisting(), false);
		});
	});
});
