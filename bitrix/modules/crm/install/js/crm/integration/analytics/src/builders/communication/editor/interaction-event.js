import { Type } from 'main.core';
import { Dictionary } from '../../../dictionary';
import { filterOutNilValues, getCrmMode, normalizeChannelId } from '../../../helpers';
import type { CommunicationEditorInteractionEvent } from '../../../types';

/**
 * @memberof BX.Crm.Integration.Analytics.Builder.Communication.Editor
 */
export class InteractionEvent
{
	#section: ?CommunicationEditorInteractionEvent['c_section'];
	#subSection: ?CommunicationEditorInteractionEvent['c_sub_section'];
	#element: ?CommunicationEditorInteractionEvent['c_element'];
	#addedElement: ?string;
	#channelId: ?string;

	static createDefault(channelId: string): InteractionEvent
	{
		const self = new InteractionEvent();

		self.#channelId = channelId;

		return self;
	}

	setSection(section: ?CommunicationEditorInteractionEvent['c_section']): InteractionEvent
	{
		this.#section = section;

		return this;
	}

	setSubSection(subSection: ?CommunicationEditorInteractionEvent['c_sub_section']): InteractionEvent
	{
		this.#subSection = subSection;

		return this;
	}

	setElement(element: ?CommunicationEditorInteractionEvent['c_element']): InteractionEvent
	{
		this.#element = element;

		return this;
	}

	setAddedElement(addedElement: ?string): InteractionEvent
	{
		this.#addedElement = addedElement;

		return this;
	}

	buildData(): ?CommunicationEditorInteractionEvent
	{
		let p2 = null;
		if (this.#addedElement)
		{
			p2 = `element_${this.#addedElement}`;
		}

		let p5 = null;
		if (!Type.isNil(this.#channelId))
		{
			p5 = `channel_${normalizeChannelId(this.#channelId)}`;
		}

		return filterOutNilValues({
			tool: Dictionary.TOOL_CRM,
			category: Dictionary.CATEGORY_COMMUNICATION_OPERATIONS,
			event: Dictionary.EVENT_EDIT,
			type: Dictionary.TYPE_MESSAGE,
			c_section: this.#section,
			c_sub_section: this.#subSection,
			c_element: this.#element,
			p1: getCrmMode(),
			p2,
			p5,
		});
	}
}
