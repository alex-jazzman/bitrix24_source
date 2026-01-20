import { Type } from 'main.core';
import { Dictionary } from '../../../dictionary';
import { filterOutNilValues, getCrmMode, normalizeChannelId } from '../../../helpers';
import type { CommunicationEditorSendEvent } from '../../../types';

/**
 * @memberof BX.Crm.Integration.Analytics.Builder.Communication.Editor
 */
export class SendEvent
{
	#section: ?CommunicationEditorSendEvent['c_section'];
	#subSection: ?CommunicationEditorSendEvent['c_sub_section'];
	#templateId: ?number;
	#channelId: ?string;

	static createDefault(channelId: string): SendEvent
	{
		const self = new SendEvent();

		self.#channelId = channelId;

		return self;
	}

	setSection(section: ?CommunicationEditorSendEvent['c_section']): SendEvent
	{
		this.#section = section;

		return this;
	}

	setSubSection(subSection: ?CommunicationEditorSendEvent['c_sub_section']): SendEvent
	{
		this.#subSection = subSection;

		return this;
	}

	setTemplateId(templateId: ?number): SendEvent
	{
		this.#templateId = templateId;

		return this;
	}

	buildData(): ?CommunicationEditorSendEvent
	{
		let p3 = null;
		if (this.#templateId)
		{
			p3 = `template_${this.#templateId}`;
		}

		let p5 = null;
		if (!Type.isNil(this.#channelId))
		{
			p5 = `channel_${normalizeChannelId(this.#channelId)}`;
		}

		return filterOutNilValues({
			tool: Dictionary.TOOL_CRM,
			category: Dictionary.CATEGORY_COMMUNICATION_OPERATIONS,
			event: Dictionary.EVENT_SEND,
			type: Dictionary.TYPE_MESSAGE,
			c_section: this.#section,
			c_sub_section: this.#subSection,
			p1: getCrmMode(),
			p3,
			p5,
		});
	}
}
