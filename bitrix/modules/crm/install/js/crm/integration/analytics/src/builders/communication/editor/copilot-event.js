import { Dictionary } from '../../../dictionary';
import { filterOutNilValues, getCrmMode } from '../../../helpers';
import type { CommunicationEditorCopilotEvent } from '../../../types';

/**
 * @memberof BX.Crm.Integration.Analytics.Builder.Communication.Editor
 */
export class CopilotEvent
{
	#section: ?CommunicationEditorCopilotEvent['c_section'];
	#subSection: ?CommunicationEditorCopilotEvent['c_sub_section'];

	setSection(section: ?CommunicationEditorCopilotEvent['c_section']): CopilotEvent
	{
		this.#section = section;

		return this;
	}

	setSubSection(subSection: ?CommunicationEditorCopilotEvent['c_sub_section']): CopilotEvent
	{
		this.#subSection = subSection;

		return this;
	}

	buildData(): ?CommunicationEditorCopilotEvent
	{
		return filterOutNilValues({
			tool: Dictionary.TOOL_CRM,
			category: Dictionary.CATEGORY_COMMUNICATION_OPERATIONS,
			event: Dictionary.EVENT_COPILOT,
			type: Dictionary.TYPE_MESSAGE,
			c_section: this.#section,
			c_sub_section: this.#subSection,
			p1: getCrmMode(),
		});
	}
}
