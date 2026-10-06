import { BaseAction } from './base-action';
import { Loc } from 'main.core';
import { showActionReport } from './report-helper';

export class MassCrmConfigureAction extends BaseAction
{
	#mailboxIds: number[] = [];
	#onSliderMessage: ?Function = null;
	#onSliderCloseComplete: ?Function = null;

	static getActionId(): string
	{
		return 'configureCrm';
	}

	setActionParams(params: Object): void
	{
		this.#mailboxIds = params.mailboxIds ?? [];
	}

	#getTopBX(): typeof BX
	{
		return (window.top ?? window).BX ?? BX;
	}

	async execute(): void
	{
		if (!this.#mailboxIds || this.#mailboxIds.length === 0)
		{
			return;
		}

		const idsParam = this.#mailboxIds.join(',');
		const url = `/mail/config/crm-mass?ids=${encodeURIComponent(idsParam)}`;

		this.#subscribeToSliderMessage();

		BX.SidePanel.Instance.open(url, {
			width: 600,
			cacheable: false,
			allowChangeHistory: false,
		});
	}

	#subscribeToSliderMessage(): void
	{
		this.#unsubscribeFromSliderMessage();

		const topBX = this.#getTopBX();

		const messageHandler = (event) =>
		{
			if (!event || typeof event.getEventId !== 'function')
			{
				return;
			}

			if (event.getEventId() !== 'mail-mass-crm-config-apply')
			{
				return;
			}

			const data = event.data ?? null;
			const mailboxIds = (data && Array.isArray(data.mailboxIds)) ? data.mailboxIds : this.#mailboxIds;
			const crmOptions = (data && data.crmOptions) ? data.crmOptions : null;

			this.#unsubscribeFromSliderMessage();
			this.#sendCrmRequest(mailboxIds, crmOptions);
		};

		const closeCompleteHandler = (event) =>
		{
			const slider = event?.getSlider?.();
			if (slider && slider.getUrl && slider.getUrl().includes('/mail/config/crm-mass'))
			{
				this.#unsubscribeFromSliderMessage();
			}
		};

		this.#onSliderMessage = messageHandler;
		this.#onSliderCloseComplete = closeCompleteHandler;

		topBX.addCustomEvent('SidePanel.Slider:onMessage', messageHandler);
		topBX.addCustomEvent('SidePanel.Slider:onCloseComplete', closeCompleteHandler);
	}

	#unsubscribeFromSliderMessage(): void
	{
		const topBX = this.#getTopBX();

		if (this.#onSliderMessage)
		{
			topBX.removeCustomEvent('SidePanel.Slider:onMessage', this.#onSliderMessage);
			this.#onSliderMessage = null;
		}

		if (this.#onSliderCloseComplete)
		{
			topBX.removeCustomEvent('SidePanel.Slider:onCloseComplete', this.#onSliderCloseComplete);
			this.#onSliderCloseComplete = null;
		}
	}

	#sendCrmRequest(mailboxIds: number[], crmOptions: ?Object): void
	{
		this.grid.tableFade();

		BX.ajax.runAction('mail.mailboxconnecting.massSetCrmIntegration', {
			data: {
				mailboxIds,
				enabled: 'Y',
				crmOptions,
			},
		}).then((result) =>
		{
			this.handleSuccess(result);
		}).catch((result) =>
		{
			this.handleError(result);
		});
	}

	handleSuccess(result: Object): void
	{
		this.grid.reload(() =>
		{
			this.grid.tableUnfade();
		});

		showActionReport(result?.data ?? {}, {
			success: 'MAIL_MAILBOX_PANEL_CRM_CONFIGURE_SUCCESS',
			applied: 'MAIL_MAILBOX_PANEL_CRM_CONFIGURE_REPORT_APPLIED',
			skipped: 'MAIL_MAILBOX_PANEL_ACTION_REPORT_SKIPPED',
			failed: 'MAIL_MAILBOX_PANEL_ACTION_REPORT_FAILED',
		});
	}

	handleError(result: Object): void
	{
		const errors = result?.errors ?? [];
		const message = errors[0]?.message ?? Loc.getMessage('MAIL_MAILBOX_PANEL_ACTION_ERROR');

		this.grid.tableUnfade();

		BX.UI.Notification.Center.notify({
			content: message,
			position: 'top-right',
			autoHideDelay: 5000,
		});
	}
}
