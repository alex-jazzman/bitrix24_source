import { Type, type JsonObject } from 'main.core';
import { isSlider } from './is-slider';

import { SliderEvent } from './slider-event';
import { type Slider } from './slider';

type MessageEventOptions = {
	sender: Slider;
	slider?: Slider | null;
	data?: JsonObject;
	eventId?: string;
};

export class MessageEvent extends SliderEvent
{
	private sender: Slider;
	private data: JsonObject | null = null;
	private eventId: string | null = null;

	constructor(eventOptions: MessageEventOptions)
	{
		super();

		const options = (Type.isPlainObject(eventOptions) ? eventOptions : {}) as MessageEventOptions;

		if (!isSlider(options.sender))
		{
			throw new TypeError("'sender' is not an instance of BX.SidePanel.Slider");
		}

		this.setName('onMessage');
		this.setSlider(options.slider as Slider);

		this.sender = options.sender;
		this.data = ('data' in options ? options.data : null) as JsonObject | null;
		this.eventId = Type.isStringFilled(options.eventId) ? options.eventId : null;
	}

	getSlider(): Slider | null
	{
		return this.slider;
	}

	getSender(): Slider
	{
		return this.sender;
	}

	getData(): JsonObject | null
	{
		return this.data;
	}

	getEventId(): string | null
	{
		return this.eventId;
	}
}
