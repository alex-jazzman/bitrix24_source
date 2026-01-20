import { Loc } from 'main.core';
import { BaseContent } from './base-content';

export class EnableOtp extends BaseContent
{
	getId(): string
	{
		return 'enable-otp';
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

	getButtons(): Array
	{
		return [
			this.btnFactory.createEnableBtn(),
			this.btnFactory.createLaterBtn(),
		];
	}

	getAnalyticsType(): string
	{
		return 'new_2fa';
	}

	getAnalyticsCategory(): string
	{
		return 'push_2fa';
	}
}
