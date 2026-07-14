import { it, describe } from 'mocha';
import { assert } from 'chai';

import { SharingAccessPopup } from '../../src/sharing-access-popup';

describe('disk.sharing-access-popup', () => {
	it('Should return name', () => {
		const instance = new SharingAccessPopup('testName');

		assert.equal(instance.getName(), 'testName');
	});

	it('Should set passed name', () => {
		const instance = new SharingAccessPopup('testName');
        assert.equal(instance.getName(), 'testName');

        instance.setName('testName2');
        assert.equal(instance.getName(), 'testName2');
	});
});
