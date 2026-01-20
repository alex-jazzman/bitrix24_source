import { Dictionary } from '../../../dictionary';
import { filterOutNilValues, getCrmMode } from '../../../helpers';
import type { CommunicationEditorViewEvent } from '../../../types';

/**
 * @memberof BX.Crm.Integration.Analytics.Builder.Communication.Editor
 */
export class ViewEvent
{
	#section: ?CommunicationEditorViewEvent['c_section'];
	#subSection: ?CommunicationEditorViewEvent['c_sub_section'];

	setSection(section: ?CommunicationEditorViewEvent['c_section']): ViewEvent
	{
		this.#section = section;

		return this;
	}

	setSubSection(subSection: ?CommunicationEditorViewEvent['c_sub_section']): ViewEvent
	{
		this.#subSection = subSection;

		return this;
	}

	buildData(): ?CommunicationEditorViewEvent
	{
		return filterOutNilValues({
			tool: Dictionary.TOOL_CRM,
			category: Dictionary.CATEGORY_COMMUNICATION_OPERATIONS,
			event: Dictionary.EVENT_VIEW,
			c_section: this.#section,
			c_sub_section: this.#subSection,
			p1: getCrmMode(),
		});
	}
}
