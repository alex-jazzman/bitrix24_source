import { Loc } from 'main.core';
import { BaseContent } from './base-content';
import { DateTimeFormat } from 'main.date';

export class MandatoryEnableOtp extends BaseContent
{
	#endDateTs: number;
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
		return 'mandatory-enable-otp';
	}

	getTitle(): string
	{
		return Loc.getMessage('NOTIFY_BANNER_INFO_DEF_COMPANY_DATA_TITLE');
	}

	getFirstContentBlock(): string
	{
		return Loc.getMessage('NOTIFY_BANNER_INFO_WARNING_BLOCK');
	}

	getSecondContentBlock(): string
	{
		return Loc.getMessage('NOTIFY_BANNER_INFO_DESC_BLOCK');
	}

	getAlertContentBlock(): string
	{
		if (!this.#endDateTs)
		{
			return '';
		}

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

		if (!this.isTimeEnd() || !this.#endDateTs)
		{
			buttons.push(this.btnFactory.createLaterBtn());
		}

		return buttons;
	}

	getAnalyticsType(): string
	{
		return 'new_2fa';
	}

	getAnalyticsCategory(): string
	{
		return 'push_2fa_period';
	}
}
