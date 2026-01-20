import { Loc } from 'main.core';
import { BaseContent } from './base-content';

export class EnablePushOtp extends BaseContent
{
	getId(): string
	{
		return 'enable-push-otp';
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

	getButtons(): Array
	{
		return [
			this.btnFactory.createEnableBtn(),
			this.btnFactory.createLaterBtn(),
		];
	}

	getAnalyticsType(): string
	{
		return 'renew_2fa';
	}

	getAnalyticsCategory(): string
	{
		return 'push_2fa';
	}
}
