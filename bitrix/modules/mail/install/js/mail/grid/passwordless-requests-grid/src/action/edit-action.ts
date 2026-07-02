import { BaseAction } from './base-action';

export class EditAction extends BaseAction
{
	mailboxId!: number;

	static getActionId(): string
	{
		return 'editRequestAction';
	}

	setActionParams(params: { mailboxId: number }): void
	{
		this.mailboxId = params.mailboxId;
	}

	async execute(): Promise<void>
	{
		const url = `/mail/config/edit?id=${this.mailboxId}`;
		BX.SidePanel.Instance.open(url);
	}
}
