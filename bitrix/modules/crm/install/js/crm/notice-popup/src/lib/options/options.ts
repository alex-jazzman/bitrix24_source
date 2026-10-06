import { Loc, Type } from 'main.core';

import {
	DEFAULT_OPTIONS,
	type NoticePopupButtonOptions,
	type NoticePopupOptions,
	type PreparedNoticePopupOptions,
} from '../../const/options';

export function prepareOptions(options: NoticePopupOptions = {}): PreparedNoticePopupOptions
{
	return {
		...DEFAULT_OPTIONS,
		...options,
	};
}

export function resolveButtons(preparedOptions: PreparedNoticePopupOptions): NoticePopupButtonOptions[]
{
	if (Type.isArrayFilled(preparedOptions.buttons))
	{
		return preparedOptions.buttons;
	}

	return [
		{
			text: Loc.getMessage('CRM_NOTICE_POPUP_BTN_GOT_IT') ?? '',
			style: 'filled',
		},
	];
}
