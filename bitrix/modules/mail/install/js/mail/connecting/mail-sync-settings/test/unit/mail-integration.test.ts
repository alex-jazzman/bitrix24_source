import { describe, it } from 'mocha';
import { assert } from 'chai';
import { shallowMount } from '@vue/test-utils';

import { MailIntegration } from '../../src/components/mail-integration';

const syncPeriodOptions = [
	{ value: '7', label: '1 week' },
	{ value: '30', label: '1 month' },
	{ value: '-1', label: 'all emails' },
];

describe('MailIntegration', () => {
	it('emits updated model when mail sync is disabled', async () => {
		const wrapper = shallowMount(MailIntegration, {
			props: {
				compact: true,
				modelValue: {
					sync: {
						enabled: true,
						periodValue: '7',
					},
				},
				syncPeriodOptions,
			},
		});

		await wrapper.find('[data-test-id="mail_massconnect__mail-sync_checkbox"]').setValue(false);

		const emitted = wrapper.emitted('update:modelValue');
		assert.isArray(emitted);
		assert.deepEqual(emitted?.[0]?.[0], {
			sync: {
				enabled: false,
				periodValue: '7',
			},
		});

		wrapper.unmount();
	});

	it('emits updated model when sync period changes', async () => {
		const wrapper = shallowMount(MailIntegration, {
			props: {
				compact: true,
				modelValue: {
					sync: {
						enabled: true,
						periodValue: '7',
					},
				},
				syncPeriodOptions,
			},
		});

		const selector = wrapper.findComponent({ name: 'bitrix-setting-selector' });
		assert.isTrue(selector.exists());
		selector.vm.$emit('update:modelValue', '-1');
		await wrapper.vm.$nextTick();

		const emitted = wrapper.emitted('update:modelValue');
		assert.isArray(emitted);
		assert.deepEqual(emitted?.[0]?.[0], {
			sync: {
				enabled: true,
				periodValue: '-1',
			},
		});

		wrapper.unmount();
	});
});
