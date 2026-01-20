import { Loc } from 'main.core';
import { BaseContent } from './base-content';
import { DateTimeFormat } from 'main.date';

export class MandatoryEnablePushOtp extends BaseContent
{
	#endDateTs: string;
	#promoteMode: string;
	#formatEndDate: string;

	constructor(options: Object)
	{
		super(options);
		this.#promoteMode = options.promoteMode;
		this.#endDateTs = options.endDate;
		this.#formatEndDate = options.formatEndDate;
	}

	getId(): string
	{
		return 'mandatory-enable-push-otp';
	}

	getTitle(): string
	{
		return Loc.getMessage('NOTIFY_BANNER_INFO_CONFIRM_WITHOUT_TITLE_MSGVER_1', {
			'[SPAN]': '<span class="intranet-otp-motivating-popup__title--accent">',
			'[/SPAN]': '</span>',
		});
	}

	getFirstContentBlock(): string
	{
		return Loc.getMessage('NOTIFY_BANNER_INFO_EXIST_BLOCK_MSGVER_1');
	}

	getAlertContentBlock(): string
	{
		if (this.#promoteMode === 'high')
		{
			return Loc.getMessage('NOTIFY_BANNER_INFO_REQ_BLOCK_HIGH_PROMOTE', { '#END_DATE#': DateTimeFormat.format(this.#formatEndDate, this.#endDateTs) });
		}

		return Loc.getMessage('NOTIFY_BANNER_INFO_REQ_BLOCK', { '#END_DATE#': DateTimeFormat.format(this.#formatEndDate, this.#endDateTs) });
	}

	isTimeEnd(): boolean
	{
		const endDate = new Date(this.#endDateTs * 1000);
		const now = new Date();

		return endDate <= now;
	}

	getButtons(): Array
	{
		const buttons = [
			this.btnFactory.createEnableBtn(),
		];

		if (!this.isTimeEnd())
		{
			buttons.push(this.btnFactory.createLaterBtn());
		}

		return buttons;
	}

	getAnalyticsType(): string
	{
		return 'renew_2fa';
	}

	getAnalyticsCategory(): string
	{
		return 'push_2fa_period';
	}
}
