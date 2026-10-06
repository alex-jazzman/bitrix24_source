import { Type, Loc } from 'main.core';
import { SetupTemplate, type SetupTemplateData } from 'bizproc.setup-template';

import { ACTION_TYPE, AJAX_REQUEST_TYPE, GRID_API_ACTION } from '../constants';
import type { StartAgentResponse } from '../types';

import type {
	RestartActionParams,
	ActionConfig,
	RestartActionDataType,
} from '../types';

import { BaseAction } from './base-action';

// Template ids whose restart request is currently in flight. A fresh action
// instance is created per grid click, so the guard against a duplicate restart
// of the same click must live outside the instance.
const restartsInFlight: Set<number> = new Set();

export class RestartAction extends BaseAction
{
	templateId: ?number;

	static getActionId(): string
	{
		return ACTION_TYPE.RESTART;
	}

	// Block a duplicate restart while this template's request is still in flight.
	// A legitimate restart after the previous one finished is allowed — the guard
	// is released in the finally below on every exit path, and only for the id
	// this call captured, so a concurrent in-flight restart's guard is untouched.
	async execute(): Promise<void>
	{
		if (this.templateId && restartsInFlight.has(this.templateId))
		{
			return;
		}

		let capturedTemplateId: ?number = null;
		if (this.templateId)
		{
			restartsInFlight.add(this.templateId);
			capturedTemplateId = this.templateId;
		}

		// Releasing the guard in finally is correct only because RestartAction has no
		// confirmation popup: super.execute() awaits the full ajax cycle. If a
		// getConfirmationPopup() is ever added, BaseAction.execute() resolves right after
		// the popup is shown (the ok-callback request is not awaited), so finally would
		// release the guard prematurely. In that case move the release to the request
		// boundary (as UpgradeAction does in onClose).
		try
		{
			await super.execute();
		}
		finally
		{
			if (capturedTemplateId !== null)
			{
				restartsInFlight.delete(capturedTemplateId);
			}
		}
	}

	async run(): void
	{
		await this.sendActionRequest();
	}

	setActionParams(params: RestartActionParams): void
	{
		super.setActionParams(params);

		this.templateId = Number.parseInt(params.templateId, 10);
	}

	getActionConfig(): ActionConfig
	{
		return {
			type: AJAX_REQUEST_TYPE.CONTROLLER,
			name: GRID_API_ACTION.RESTART,
		};
	}

	getActionData(): RestartActionDataType
	{
		const data: RestartActionDataType = {
			...super.getActionData(),
		};

		if (!this.templateId || !Type.isNumber(this.templateId))
		{
			return data;
		}

		data.templateId = this.templateId;

		return data;
	}

	handleSuccess(result: StartAgentResponse): void
	{
		const setupTemplate: ?SetupTemplateData = result?.data?.setupTemplateData;
		if (setupTemplate && Type.isObjectLike(setupTemplate))
		{
			SetupTemplate.showSidePanel(setupTemplate);

			return;
		}

		BX.UI.Notification.Center.notify({
			content: Loc.getMessage('BIZPROC_AI_AGENTS_GRID_RESTART_ACTION_NOTIFICATION_TITLE'),
		});
	}
}
