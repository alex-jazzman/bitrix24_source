import { it, describe } from 'mocha';
import { assert } from 'chai';

import { SkipToContent } from '../../src/skip-to-content';

describe('intranet.skip-to-content', () => {
	it('Should return name', () => {
		const instance = new SkipToContent('testName');

		assert.equal(instance.getName(), 'testName');
	});

	it('Should set passed name', () => {
		const instance = new SkipToContent('testName');
        assert.equal(instance.getName(), 'testName');

        instance.setName('testName2');
        assert.equal(instance.getName(), 'testName2');
	});
});
