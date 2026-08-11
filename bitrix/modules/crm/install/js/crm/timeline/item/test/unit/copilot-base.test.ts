import { afterEach, describe, it } from 'mocha';
import { assert } from 'chai';
import { ajax as Ajax, Extension } from 'main.core';
import { UI } from 'ui.notification';
import { ButtonState } from 'ui.buttons';

import { CopilotBase, type CopilotConfig } from '../../src/controllers/ai/copilot-base';

class TestCopilotController extends CopilotBase
{
	getCopilotConfig(): CopilotConfig
	{
		return {
			actionEndpoint: 'crm.timeline.ai.launchCopilot',
			validEntityTypes: [1],
			agreementContext: 'test',
		};
	}
}

function createUiButton(state: string): Object
{
	return {
		state,
		setState(newState): void
		{
			this.state = newState;
		},
		getState(): string
		{
			return this.state;
		},
	};
}

function createItem(uiButton: Object): Object
{
	return {
		getLayoutFooterButtonById()
		{
			return {
				getUiButton()
				{
					return uiButton;
				},
			};
		},
	};
}

function getActionData(): Object
{
	return {
		activityId: 1,
		ownerId: 2,
		ownerTypeId: 1,
		scenario: 'fill_fields',
	};
}

async function launchCopilot(response: Object, initialButtonState: string): Promise<Object>
{
	const uiButton = createUiButton(initialButtonState);

	sinon.stub(Extension, 'getSettings').returns({ aiScenarioList: ['fill_fields'] });
	sinon.stub(Ajax, 'runAction').rejects(response);
	sinon.stub(UI.Notification.Center, 'notify');

	await (new TestCopilotController())
		.handleCopilotLaunch(createItem(uiButton), getActionData())
		.catch(() => {})
	;

	return uiButton;
}

describe('crm.timeline.item/CopilotBase', () => {
	afterEach(() => {
		sinon.restore();
	});

	it('keeps disabled copilot button disabled after custom data error', async () => {
		const uiButton = await launchCopilot({
			errors: [{
				customData: {
					code: 'blocked_provider',
					msgPlainText: 'Not enough messages',
				},
			}],
		}, ButtonState.DISABLED);

		assert.equal(uiButton.getState(), ButtonState.DISABLED);
	});

	it('keeps active copilot button active after custom data error', async () => {
		const uiButton = await launchCopilot({
			errors: [{
				customData: {
					code: 'blocked_provider',
					msgPlainText: 'Not enough messages',
				},
			}],
		}, ButtonState.ACTIVE);

		assert.equal(uiButton.getState(), ButtonState.ACTIVE);
	});

	it('restores disabled copilot button after generic error cooldown', async () => {
		const clock = sinon.useFakeTimers();
		const uiButton = await launchCopilot({
			errors: [{
				message: 'Error',
			}],
		}, ButtonState.DISABLED);

		assert.equal(uiButton.getState(), ButtonState.DISABLED);

		clock.tick(5000);

		assert.equal(uiButton.getState(), ButtonState.DISABLED);
	});
});
