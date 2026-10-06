import { Router } from 'crm.router';

type CallScoringResultV2Params = {
	activityId: number,
	ownerTypeId: number,
	ownerId: number,
	jobId?: ?number,
	assessmentSettingsId?: ?number,
};

export function openCallScoringResultV2(params: CallScoringResultV2Params): void
{
	void Router.Instance.openAiReportDrawer('call-assessment', {
		activityId: params.activityId,
		ownerTypeId: params.ownerTypeId,
		ownerId: params.ownerId,
		jobId: params.jobId ?? null,
		assessmentSettingsId: params.assessmentSettingsId ?? null,
	});
}
