import { describe, it, beforeEach, afterEach } from 'mocha';
import { assert } from 'chai';
import { ajax as Ajax } from 'main.core';
import { SendService } from '../../../src/service/send-service';

const SEND_ACTION = 'crm.activity.sms.send';

function createService(): SendService
{
	return new SendService({
		entityTypeId: 2,
		entityId: 10,
		providerFactory: { getProviders: () => [] },
	});
}

function createState(overrides = {}): Object
{
	return {
		channel: {
			isTemplatesBased: false,
			backend: { id: 'sender_1', senderCode: 'edna' },
		},
		from: { id: 'from_1' },
		to: {
			value: '+70000000000',
			customData: { addressSource: { entityTypeId: 3, entityId: 55 } },
		},
		message: { body: 'Hello {NAME}, your order is ready' },
		notificationTemplate: { signed: 'signed-token' },
		template: { ID: 'tpl_1', ORIGINAL_ID: 42, PLACEHOLDERS: { PREVIEW: ['%ph%'] } },
		...overrides,
	};
}

describe('crm.messagesender.editor: SendService', () => {
	let calls;
	let originalRunAction;

	beforeEach(() => {
		calls = [];
		originalRunAction = Ajax.runAction;
		Ajax.runAction = (action, options) => {
			calls.push({ action, options });

			return Promise.resolve({});
		};
	});

	afterEach(() => {
		Ajax.runAction = originalRunAction;
	});

	async function captureParams(state): Object
	{
		await createService().sendMessage(state);

		assert.lengthOf(calls, 1, `${SEND_ACTION} must be called once`);
		assert.strictEqual(calls[0].action, SEND_ACTION);

		return calls[0].options.data.params;
	}

	it('forwards non-empty body for templates-based channel', async () => {
		const state = createState({
			channel: { isTemplatesBased: true, backend: { id: 'edna_1', senderCode: 'edna' } },
		});

		const params = await captureParams(state);

		assert.property(params, 'body');
		assert.strictEqual(params.body, state.message.body);
		assert.isNotEmpty(params.body);
		assert.strictEqual(params.template, 'tpl_1');
		assert.strictEqual(params.isReplacePlaceholders, true);
	});

	it('still forwards body for custom-text channel', async () => {
		const state = createState({
			channel: { isTemplatesBased: false, backend: { id: 'twilio_1', senderCode: 'twilio' } },
			message: { body: 'Plain custom text' },
		});

		const params = await captureParams(state);

		assert.property(params, 'body');
		assert.strictEqual(params.body, 'Plain custom text');
	});

	it('does not send body for bitrix24 notification channel', async () => {
		const state = createState({
			channel: { isTemplatesBased: false, backend: { id: 'b24_1', senderCode: 'bitrix24' } },
		});

		const params = await captureParams(state);

		assert.notProperty(params, 'body');
		assert.strictEqual(params.signedTemplate, 'signed-token');
	});
});
