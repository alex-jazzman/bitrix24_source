import { Router } from 'crm.router';
import { Type } from 'main.core';

import ConfigurableItem from '../../configurable-item';
import { openCallScoringResultV2 } from '../../open-call-scoring-result-v2';
import { type ActionParams, Base } from '../base';

export class CallScoringResult extends Base
{
	onItemAction(item: ConfigurableItem, actionParams: ActionParams): void
	{
		const { action, actionType, actionData } = actionParams;

		if (actionType !== 'jsEvent')
		{
			return;
		}

		if (action === 'CallScoringResult:Open' && actionData)
		{
			this.#open(actionData);
		}

		if (action === 'CallScoringResult:EditPrompt')
		{
			this.#editPrompt(item, actionData);
		}
	}

	async #open(actionData: Object): void
	{
		if (
			!Type.isInteger(actionData.activityId)
			|| !Type.isInteger(actionData.ownerTypeId)
			|| !Type.isInteger(actionData.ownerId)
		)
		{
			return;
		}

		if (actionData.isV2)
		{
			await openCallScoringResultV2(actionData);

			return;
		}

		await top.BX.Runtime.loadExtension('crm.ai.call');

		const callQualityDlg = new top.BX.Crm.AI.Call.CallQuality({
			activityId: actionData.activityId,
			activityCreated: actionData.activityCreated ?? null,
			ownerTypeId: actionData.ownerTypeId,
			ownerId: actionData.ownerId,
			clientDetailUrl: actionData.clientDetailUrl ?? null,
			clientFullName: actionData.clientFullName ?? null,
			userPhotoUrl: actionData.userPhotoUrl ?? null,
			jobId: actionData.jobId ?? null,
		});

		callQualityDlg.open();
	}

	#editPrompt(item: ConfigurableItem, actionData: Object): void
	{
		if (!Type.isInteger(actionData.assessmentSettingId))
		{
			return;
		}

		Router.Instance.openCallAssessmentSlider(actionData.assessmentSettingId, { legacyWidth: 700 });
	}

	static isItemSupported(item: ConfigurableItem): boolean
	{
		const type = item.getType();

		return type === 'AI:CallScoringResult'
			|| type === 'CallScoringEmptyResult'
		;
	}
}
