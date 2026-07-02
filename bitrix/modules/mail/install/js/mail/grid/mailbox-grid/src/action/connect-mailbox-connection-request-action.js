import { BaseAction } from './base-action';

export class ConnectMailboxConnectionRequestAction extends BaseAction
{
	requestId: number;
	requesterId: number;

	static getActionId(): string
	{
		return 'connectMailboxConnectionRequestAction';
	}

	setActionParams(params: Object): void
	{
		this.requestId = params.requestId;
		this.requesterId = params.requesterId;
	}

	async execute(): void
	{
		BX.SidePanel.Instance.open('/mail/config/', {
			cacheable: false,
			requestParams: {
				connectionRequest: {
					requestId: this.requestId,
					requesterId: this.requesterId,
				},
			},
		});
	}
}
