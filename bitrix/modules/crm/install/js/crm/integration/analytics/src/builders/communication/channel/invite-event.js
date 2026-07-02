import { Type } from 'main.core';
import { Dictionary } from '../../../dictionary';
import { filterOutNilValues, getCrmMode, normalizeChannelId } from '../../../helpers';
import type { CommunicationChannelInviteEvent } from '../../../types';

/**
 * @memberof BX.Crm.Integration.Analytics.Builder.Communication.Channel
 */
export class InviteEvent
{
	#section: ?CommunicationChannelInviteEvent['c_section'];
	#subSection: ?CommunicationChannelInviteEvent['c_sub_section'];
	#element: ?CommunicationChannelInviteEvent['c_element'];
	#channelId: ?string;

	setSection(section: ?CommunicationChannelInviteEvent['c_section']): InviteEvent
	{
		this.#section = section;

		return this;
	}

	setSubSection(subSection: ?CommunicationChannelInviteEvent['c_sub_section']): InviteEvent
	{
		this.#subSection = subSection;

		return this;
	}

	setElement(element: ?CommunicationChannelInviteEvent['c_element']): InviteEvent
	{
		this.#element = element;

		return this;
	}

	setChannelId(channelId: string): InviteEvent
	{
		this.#channelId = channelId;

		return this;
	}

	buildData(): ?CommunicationChannelInviteEvent
	{
		let p2 = null;
		if (Type.isStringFilled(this.#channelId))
		{
			p2 = `channel_${normalizeChannelId(this.#channelId)}`;
		}

		return filterOutNilValues({
			tool: Dictionary.TOOL_CRM,
			category: Dictionary.CATEGORY_COMMUNICATION_OPERATIONS,
			event: Dictionary.EVENT_INVITE,
			type: Dictionary.TYPE_CHANNEL,
			c_section: this.#section,
			c_sub_section: this.#subSection,
			c_element: this.#element,
			p1: getCrmMode(),
			p2,
		});
	}
}
