import type { BaseAjaxError } from '../../types';

export interface HandlerInterface
{
	handle(error: BaseAjaxError): void;
}
