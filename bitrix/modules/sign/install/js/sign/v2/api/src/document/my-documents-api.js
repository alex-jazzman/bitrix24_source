export const BulkActionType = Object.freeze({
	approve: 'approve',
	reject: 'reject',
});

export type BulkActionTypeValue = 'approve' | 'reject';

type BulkActionProcessParams = {
	actionType: BulkActionTypeValue,
	memberIds: number[],
};

export class MyDocumentsApi
{
	getBulkActionProcessOptions({ actionType, memberIds }: BulkActionProcessParams): Object
	{
		return {
			controller: 'sign.api_v1.b2e.document.member',
			action: 'processBulk',
			params: {
				data: {
					actionType,
					memberIds: [...memberIds],
				},
			},
		};
	}
}
