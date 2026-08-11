import { EventEmitter } from 'main.core.events';
import { showCloseWithActiveCallConfirm } from 'im.v2.lib.confirm';

interface SidePanelCloseEvent {
	getSlider(): { getUrl(): { toString(): string } };
	denyAction(): void;
	slider: { close(): void };
}

interface CallSliderManagerCallbacks {
	hasCurrentCall: () => boolean;
	leaveCurrentCall: () => void;
}

export class CallSliderManager
{
	#sliderIdWithCall: string;
	#callbacks: CallSliderManagerCallbacks;

	constructor(callbacks: CallSliderManagerCallbacks)
	{
		this.#sliderIdWithCall = '';
		this.#callbacks = callbacks;

		this.#subscribeToEvents();
	}

	#subscribeToEvents()
	{
		EventEmitter.subscribe('SidePanel.Slider:onClose', this.#onCloseSliderWithCall.bind(this));
	}

	setTopSliderId(): void
	{
		// @ts-expect-error [call-ts] wait BX.SidePanel to ts
		if (!BX.SidePanel.Instance.isOpen())
		{
			return;
		}

		// @ts-expect-error [call-ts] wait BX.SidePanel to ts
		this.#sliderIdWithCall = BX.SidePanel.Instance.getTopSlider().getUrl().toString();
	}

	clearSliderId(): void
	{
		this.#sliderIdWithCall = '';
	}

	async #onCloseSliderWithCall({ data: events }: { data: SidePanelCloseEvent[] })
	{
		const [event] = events;
		const sliderId = event.getSlider().getUrl().toString();

		if (sliderId !== this.#sliderIdWithCall || sliderId.startsWith('im:slider'))
		{
			return;
		}

		const hasCall = this.#callbacks.hasCurrentCall();
		if (hasCall)
		{
			event.denyAction();

			const result = await showCloseWithActiveCallConfirm();
			if (result)
			{
				this.#callbacks.leaveCurrentCall();
				event.slider.close();
			}
		}
	}
}
