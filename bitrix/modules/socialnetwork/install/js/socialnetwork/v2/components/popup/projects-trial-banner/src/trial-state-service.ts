import { ajax, Loc, Type } from 'main.core';
import { DateTimeFormat } from 'main.date';

export type TrialState = {
	isActive: boolean,
	endTs: number | null,
};

export class TrialStateService
{
	async getTrialState(): Promise<TrialState | null>
	{
		try
		{
			const response = await ajax.runAction('socialnetwork.api.workgroup.getProjectsTrialState');

			return response.data;
		}
		catch (error)
		{
			console.error(error);

			return null;
		}
	}
}

export const trialStateService = new TrialStateService();

export function getTrialEndDateLabel(trialState: TrialState | null): string | null
{
	if (!trialState?.isActive || !Type.isNumber(trialState.endTs))
	{
		return null;
	}

	const formattedDate = DateTimeFormat.format(
		DateTimeFormat.getFormat('LONG_DATE_FORMAT'),
		trialState.endTs,
	);

	return Loc.getMessage('SOCNET_POPUP_PROJECTS_TRIAL_END_DATE', { '#DATE#': formattedDate }) ?? null;
}
