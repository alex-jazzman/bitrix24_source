import { Dictionary } from '../../../dictionary';
import { filterOutNilValues, getCrmMode } from '../../../helpers';
import type { RepeatSaleBannerCloseEvent } from '../../../types';

/**
 * @memberof BX.Crm.Integration.Analytics.Builder.RepeatSale.Banner
 */
export class CloseEvent
{
	#type: RepeatSaleBannerCloseEvent['type'];
	#subSection: RepeatSaleBannerCloseEvent['c_sub_section'] = Dictionary.SUB_SECTION_KANBAN;
	#element: RepeatSaleBannerCloseEvent['c_element'] = Dictionary.ELEMENT_CLOSE_BUTTON;

	static createDefault(
		type: RepeatSaleBannerCloseEvent['type'],
		subSection: RepeatSaleBannerCloseEvent['subSection'],
	): CloseEvent
	{
		const self: CloseEvent = new CloseEvent();

		self.#type = type;
		self.#subSection = subSection;

		return self;
	}

	buildData(): ?RepeatSaleBannerCloseEvent
	{
		return filterOutNilValues({
			tool: Dictionary.TOOL_CRM,
			category: Dictionary.CATEGORY_BANNERS,
			event: Dictionary.EVENT_REPEAT_SALE_BANNER_VIEW,
			type: this.#type,
			c_section: Dictionary.SECTION_DEAL,
			c_sub_section: this.#subSection,
			c_element: this.#element,
			p1: getCrmMode(),
		});
	}
}
