import { FeaturePromotersRegistry } from 'ui.info-helper';

import type { BaseAjaxError } from '../../types';
import { HandlerInterface } from './handler-interface';

export class TariffLimit implements HandlerInterface
{
	handle(error: BaseAjaxError): void
	{
		const tariffSliderCode = error?.customData?.tariffSliderCode;
		TariffLimit.showFeatureSlider(tariffSliderCode);
	}

	static showFeatureSlider(tariffSliderCode: ?string): void
	{
		if (!tariffSliderCode)
		{
			return;
		}

		FeaturePromotersRegistry.getPromoter({ code: tariffSliderCode }).show();
	}
}
