import { Dictionary } from '../../../dictionary';
import { filterOutNilValues, getCrmMode } from '../../../helpers';
import type { RepeatSaleBannerViewEvent } from '../../../types';

/**
 * @memberof BX.Crm.Integration.Analytics.Builder.RepeatSale.Banner
 */
export class ViewEvent
{
	#type: RepeatSaleBannerViewEvent['type'];
	#subSection: RepeatSaleBannerViewEvent['c_sub_section'] = Dictionary.SUB_SECTION_KANBAN;

	static createDefault(
		type: RepeatSaleBannerViewEvent['type'],
		subSection: RepeatSaleBannerViewEvent['subSection'],
	): ViewEvent
	{
		const self: ViewEvent = new ViewEvent();

		self.#type = type;
		self.#subSection = subSection;

		return self;
	}

	buildData(): ?RepeatSaleBannerViewEvent
	{
		return filterOutNilValues({
			tool: Dictionary.TOOL_CRM,
			category: Dictionary.CATEGORY_BANNERS,
			event: Dictionary.EVENT_REPEAT_SALE_BANNER_VIEW,
			type: this.#type,
			c_section: Dictionary.SECTION_DEAL,
			c_sub_section: this.#subSection,
			p1: getCrmMode(),
		});
	}
}
