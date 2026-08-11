import { describe, it, afterEach } from 'mocha';
import { assert } from 'chai';
import { shallowMount } from '@vue/test-utils';
import { ButtonState as UiButtonState } from 'ui.vue3.components.button';

import { AdditionalButton } from '../../src/components/layout/footer/add-button';
import { ButtonState } from '../../src/components/enums/button-state';

const bitrix = {
	eventEmitter: {
		subscribe(): void {},
		unsubscribe(): void {},
	},
};

describe('crm.timeline.item/AdditionalButton', () => {
	let wrapper: ReturnType<typeof shallowMount>;

	afterEach(() => {
		wrapper?.unmount();
	});

	it('passes waiting state to UiButton on initial loading render', () => {
		wrapper = shallowMount(AdditionalButton, {
			global: {
				mocks: {
					$Bitrix: bitrix,
				},
			},
			props: {
				state: ButtonState.LOADING,
			},
		});

		const button = wrapper.findComponent({ name: 'UiButton' });

		assert.equal(button.props('state'), UiButtonState.WAITING);
		assert.isTrue(button.props('loading'));
	});

	it('passes ai waiting state without regular loading prop', () => {
		wrapper = shallowMount(AdditionalButton, {
			global: {
				mocks: {
					$Bitrix: bitrix,
				},
			},
			props: {
				state: ButtonState.AI_LOADING,
			},
		});

		const button = wrapper.findComponent({ name: 'UiButton' });

		assert.equal(button.props('state'), UiButtonState.AI_WAITING);
		assert.isFalse(button.props('loading'));
	});
});
