import { Type } from 'main.core';
import { Slider } from './slider';

export class SliderEvent
{
	protected slider: Slider | null = null;
	private action: boolean = true;
	private name: string | null = null;

	constructor()
	{
		this.slider = null;
		this.action = true;
		this.name = null;
	}

	allowAction(): void
	{
		this.action = true;
	}

	denyAction(): void
	{
		this.action = false;
	}

	isActionAllowed(): boolean
	{
		return this.action;
	}

	/**
	 * @deprecated use getSlider method
	 */
	getSliderPage(): Slider | null
	{
		return this.slider;
	}

	getSlider(): Slider | null
	{
		return this.slider;
	}

	setSlider(slider: Slider): void
	{
		if (slider instanceof Slider)
		{
			this.slider = slider;
		}
	}

	getName(): string | null
	{
		return this.name;
	}

	setName(name: string): void
	{
		if (Type.isStringFilled(name))
		{
			this.name = name;
		}
	}

	getFullName(): string
	{
		return Slider.getEventFullName(this.getName() as string);
	}
}
