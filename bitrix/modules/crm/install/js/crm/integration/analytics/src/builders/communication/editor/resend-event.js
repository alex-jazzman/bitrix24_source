import { Type } from 'main.core';
import { Dictionary } from '../../../dictionary';
import { filterOutNilValues, getCrmMode, normalizeChannelId } from '../../../helpers';
import type { CommunicationEditorResendEvent } from '../../../types';

/**
 * @memberof BX.Crm.Integration.Analytics.Builder.Communication.Editor
 */
export class ResendEvent
{
	#section: ?CommunicationEditorResendEvent['c_section'];
	#subSection: ?CommunicationEditorResendEvent['c_sub_section'];
	#templateId: ?number;
	#channelId: ?string;

	static createDefault(channelId: string): ResendEvent
	{
		const self = new ResendEvent();

		self.#channelId = channelId;

		return self;
	}

	setSection(section: ?CommunicationEditorResendEvent['c_section']): ResendEvent
	{
		this.#section = section;

		return this;
	}

	setSubSection(subSection: ?CommunicationEditorResendEvent['c_sub_section']): ResendEvent
	{
		this.#subSection = subSection;

		return this;
	}

	setTemplateId(templateId: ?number): ResendEvent
	{
		this.#templateId = templateId;

		return this;
	}

	buildData(): ?CommunicationEditorResendEvent
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
			event: Dictionary.EVENT_RESEND,
			type: Dictionary.TYPE_MESSAGE,
			c_section: this.#section,
			c_sub_section: this.#subSection,
			p1: getCrmMode(),
			p3,
			p5,
		});
	}
}
