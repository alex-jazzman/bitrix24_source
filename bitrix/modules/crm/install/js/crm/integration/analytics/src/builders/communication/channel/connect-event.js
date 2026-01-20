import { Type } from 'main.core';
import { Dictionary } from '../../../dictionary';
import { filterOutNilValues, getCrmMode, normalizeChannelId } from '../../../helpers';
import type { CommunicationChannelConnectEvent } from '../../../types';

/**
 * @memberof BX.Crm.Integration.Analytics.Builder.Communication.Channel
 */
export class ConnectEvent
{
	#section: ?CommunicationChannelConnectEvent['c_section'];
	#subSection: ?CommunicationChannelConnectEvent['c_sub_section'];
	#element: ?CommunicationChannelConnectEvent['c_element'];
	#channelId: ?string;
	#connectStatus: ?string;

	setSection(section: ?CommunicationChannelConnectEvent['c_section']): ConnectEvent
	{
		this.#section = section;

		return this;
	}

	setSubSection(subSection: ?CommunicationChannelConnectEvent['c_sub_section']): ConnectEvent
	{
		this.#subSection = subSection;

		return this;
	}

	setElement(element: ?CommunicationChannelConnectEvent['c_element']): ConnectEvent
	{
		this.#element = element;

		return this;
	}

	setChannelId(channelId: string): ConnectEvent
	{
		this.#channelId = channelId;

		return this;
	}

	setConnectStatus(connectStatus: string): ConnectEvent
	{
		this.#connectStatus = connectStatus;

		return this;
	}

	buildData(): ?CommunicationChannelConnectEvent
	{
		let p2 = null;
		if (Type.isStringFilled(this.#channelId))
		{
			p2 = `channel_${normalizeChannelId(this.#channelId)}`;
		}

		let p3 = null;
		if (Type.isStringFilled(this.#connectStatus))
		{
			p3 = `connectStatus_${this.#connectStatus}`;
		}

		return filterOutNilValues({
			tool: Dictionary.TOOL_CRM,
			category: Dictionary.CATEGORY_COMMUNICATION_OPERATIONS,
			event: Dictionary.EVENT_CONNECT,
			type: Dictionary.TYPE_CHANNEL,
			c_section: this.#section,
			c_sub_section: this.#subSection,
			c_element: this.#element,
			p1: getCrmMode(),
			p2,
			p3,
		});
	}
}
