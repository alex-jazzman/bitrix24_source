import { BaseAction } from './base-action';

export class OpenSettingsAction extends BaseAction
{
	mailboxId: number;
	url: ?string;

	static getActionId(): string
	{
		return 'openSettingsAction';
	}

	setActionParams(params: Object): void
	{
		this.mailboxId = params.mailboxId;
		this.url = params.url ?? null;
	}

	async execute(): void
	{
		this.sendAnalytics();

		const url = this.url ?? `/mail/config/edit?id=${this.mailboxId}`;
		BX.SidePanel.Instance.open(url);
	}

	sendAnalytics(): void
	{
		BX.UI.Analytics.sendData({
			tool: 'mail',
			event: 'mailbox_grid_edit',
			category: 'mail_mass_ops',
			c_element: 'context_menu',
		});
	}
}
