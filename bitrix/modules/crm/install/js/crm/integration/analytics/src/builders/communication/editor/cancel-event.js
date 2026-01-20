import { Dictionary } from '../../../dictionary';
import { filterOutNilValues, getCrmMode } from '../../../helpers';
import type { CommunicationEditorCancelEvent } from '../../../types';

/**
 * @memberof BX.Crm.Integration.Analytics.Builder.Communication.Editor
 */
export class CancelEvent
{
	#section: ?CommunicationEditorCancelEvent['c_section'];
	#subSection: ?CommunicationEditorCancelEvent['c_sub_section'];

	setSection(section: ?CommunicationEditorCancelEvent['c_section']): CancelEvent
	{
		this.#section = section;

		return this;
	}

	setSubSection(subSection: ?CommunicationEditorCancelEvent['c_sub_section']): CancelEvent
	{
		this.#subSection = subSection;

		return this;
	}

	buildData(): ?CommunicationEditorCancelEvent
	{
		return filterOutNilValues({
			tool: Dictionary.TOOL_CRM,
			category: Dictionary.CATEGORY_COMMUNICATION_OPERATIONS,
			event: Dictionary.EVENT_CANCEL,
			type: Dictionary.TYPE_MESSAGE,
			c_section: this.#section,
			c_sub_section: this.#subSection,
			p1: getCrmMode(),
		});
	}
}
