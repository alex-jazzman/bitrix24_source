import { it, describe } from 'mocha';
import { assert } from 'chai';

import { OnboardingPopup } from '../../src/onboarding-popup';

describe('crm.integration.imopenlines.ai-agent.onboarding-popup', () => {
	it('Should return name', () => {
		const instance = new OnboardingPopup('testName');

		assert.equal(instance.getName(), 'testName');
	});

	it('Should set passed name', () => {
		const instance = new OnboardingPopup('testName');
        assert.equal(instance.getName(), 'testName');

        instance.setName('testName2');
        assert.equal(instance.getName(), 'testName2');
	});
});
