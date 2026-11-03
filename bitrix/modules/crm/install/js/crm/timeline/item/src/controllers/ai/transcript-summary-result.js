import { Router } from 'crm.router';
import { Type } from 'main.core';

import ConfigurableItem from '../../configurable-item';
import { type ActionParams, Base } from '../base';

export class TranscriptSummaryResult extends Base
{
	onItemAction(item: ConfigurableItem, actionParams: ActionParams): void
	{
		const { action, actionType, actionData } = actionParams;

		if (actionType !== 'jsEvent')
		{
			return;
		}

		if (action === 'TranscriptSummaryResult:Open' && actionData)
		{
			this.#open(actionData);
		}
	}

	async #open(actionData): void
	{
		if (
			!Type.isInteger(actionData.activityId)
			|| !Type.isInteger(actionData.ownerTypeId)
			|| !Type.isInteger(actionData.ownerId)
		)
		{
			return;
		}

		void Router.Instance.openAiReportDrawerOrLegacy(
			'summary-history',
			actionData,
			() => this.#openLegacy(actionData),
		);
	}

	async #openLegacy(actionData): void
	{
		await top.BX.Runtime.loadExtension('crm.ai.call');

		const summary = new top.BX.Crm.AI.Call.Summary({
			activityId: actionData.activityId,
			ownerTypeId: actionData.ownerTypeId,
			ownerId: actionData.ownerId,
			languageTitle: actionData.languageTitle,
			activityProvider: actionData.activityProvider,
			jobId: actionData.jobId,
		});

		summary.open();
	}

	static isItemSupported(item: ConfigurableItem): boolean
	{
		return (item.getType() === 'AI:TranscriptSummaryResult');
	}
}
