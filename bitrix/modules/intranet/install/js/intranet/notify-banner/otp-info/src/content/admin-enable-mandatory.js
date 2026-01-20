import { Loc, Tag } from 'main.core';
import { BaseContent } from './base-content';

export class AdminEnableMandatory extends BaseContent
{
	getId(): string
	{
		return 'admin-enable-mandatory';
	}

	getTitle(): string
	{
		return Loc.getMessage('NOTIFY_BANNER_INFO_DEF_TITLE');
	}

	getFirstContentBlock(): string
	{
		return Loc.getMessage('NOTIFY_BANNER_INFO_ALL_EMPLOYEE_BLOCK');
	}

	getSecondContentBlock(): string
	{
		return Loc.getMessage('NOTIFY_BANNER_INFO_IS_PROJECT_BLOCK');
	}

	getMiddleBlock(): string
	{
		return Tag.render`
			<ul class="intranet-otp-motivating-popup__list ui-text --md">
				<li class="intranet-otp-motivating-popup__list-item">
					<span class="ui-icon-set --lock-l"></span>
					${Loc.getMessage('NOTIFY_BANNER_INFO_LEAK_OPT')}
				</li>
				<li class="intranet-otp-motivating-popup__list-item">
					<span class="ui-icon-set --o-trend-down"></span>
					${Loc.getMessage('NOTIFY_BANNER_INFO_FIN_OPT')}
				</li>
				<li class="intranet-otp-motivating-popup__list-item">
					<span class="ui-icon-set --o-suitcase"></span>
					${Loc.getMessage('NOTIFY_BANNER_INFO_LEGAL_OPT')}
				</li>
			</ul>
		`;
	}

	getButtons(): Array
	{
		return [
			this.btnFactory.createEnableMandatoryBtn(),
			this.btnFactory.createLaterBtn(),
		];
	}

	getAnalyticsCategory(): string
	{
		return 'push_2fa_all';
	}
}
