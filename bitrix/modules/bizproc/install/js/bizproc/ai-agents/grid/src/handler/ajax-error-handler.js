import type { GridApiAction, BaseAjaxResponse, BaseAjaxError } from '../types';

import type { HandlerInterface } from './error/handler-interface';
import { ErrorCode } from './error/error-codes';
import { TariffLimit } from './error/tariff-limit';
import { UndefinedError } from './error/undefined-error';
import { Base } from './error/base';

export class AjaxErrorHandler
{
	/**
	* Tries to handle by code, if code empty, tries handle by message
	*/
	handle(action: GridApiAction, response: BaseAjaxResponse): void
	{
		const errors = response.errors;

		if (!errors?.length || errors?.length === 0)
		{
			return;
		}

		errors.forEach((error: BaseAjaxError): void => {
			const errorCode = error?.code;
			const errorMessage = error?.message;

			if (errorCode)
			{
				this.getHandlerByCode(errorCode).handle(error);

				return;
			}

			this.getHandlerByMessage(errorMessage).handle(error);
		});
	}

	getHandlerByCode(errorCode: string | number): HandlerInterface
	{
		switch (errorCode)
		{
			case ErrorCode.TARIFF_LIMIT:
			{
				return new TariffLimit();
			}

			default:
			{
				return new UndefinedError();
			}
		}
	}

	getHandlerByMessage(errorMessage: ?string): HandlerInterface
	{
		return new Base();
	}
}
