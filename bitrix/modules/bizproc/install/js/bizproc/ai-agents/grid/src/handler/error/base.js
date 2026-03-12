import { Loc, Text } from 'main.core';
import type { BaseAjaxError } from '../../types';
import { HandlerInterface } from './handler-interface';

export class Base implements HandlerInterface
{
	handle(error: BaseAjaxError): void
	{
		this.notifyUser(error);
	}

	notifyUser(error: BaseAjaxError)
	{
		BX.UI.Notification.Center.notify({
			content: this.getErrorMessageFromResult(error),
		});
	}

	getErrorMessageFromResult(error: BaseAjaxError): string
	{
		return Text.encode(error.message ?? Loc.getMessage('BIZPROC_AI_AGENTS_GRID_DEFAULT_AJAX_ERROR'));
	}
}
