type SliderData = {
	get: (key: string) => unknown,
};

type Slider = {
	getData: () => SliderData,
};

type SliderCloseEvent = {
	getSlider: () => Slider | null,
};

type SliderOptions = {
	width?: number,
};

export class SliderManager
{
	#onChanged: () => void;

	constructor(onChanged: () => void)
	{
		this.#onChanged = onChanged;
	}

	open(url: string, options: SliderOptions = {}): void
	{
		BX.SidePanel.Instance.open(url, {
			cacheable: false,
			data: {
				changed: false,
			},
			events: {
				onCloseComplete: (event: SliderCloseEvent) => {
					if (event.getSlider()?.getData().get('changed') === true)
					{
						this.#onChanged();
					}
				},
			},
			...options,
		});
	}
}
