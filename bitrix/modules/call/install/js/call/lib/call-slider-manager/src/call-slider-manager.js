import { EventEmitter } from 'main.core.events';
import { showCloseWithActiveCallConfirm } from 'im.v2.lib.confirm';
import { CallManager } from 'call.lib.call-manager';

export class CallSliderManager
{
	static instance: CallSliderManager;
	#sliderIdWithCall: string;

	static getInstance(): CallSliderManager
	{
		if (!this.instance)
		{
			this.instance = new this();
		}

		return this.instance;
	}

	constructor()
	{
		this.#sliderIdWithCall = '';

		this.#subscribeToEvents();
	}

	#subscribeToEvents()
	{
		EventEmitter.subscribe('SidePanel.Slider:onClose', this.#onCloseSliderWithCall.bind(this));
	}

	setTopSliderId(): void
	{
		if (!BX.SidePanel.Instance.isOpen())
		{
			return;
		}

		this.#sliderIdWithCall = BX.SidePanel.Instance.getTopSlider().getUrl().toString();
	}

	clearSliderId(): void
	{
		this.#sliderIdWithCall = '';
	}

	async #onCloseSliderWithCall({ data: event })
	{
		[event] = event;
		const sliderId = event.getSlider().getUrl().toString();

		if (sliderId !== this.#sliderIdWithCall || sliderId.startsWith('im:slider'))
		{
			return;
		}

		const hasCall = CallManager.getInstance().hasCurrentCall();
		if (hasCall)
		{
			event.denyAction();

			const result = await showCloseWithActiveCallConfirm();
			if (result)
			{
				CallManager.getInstance().leaveCurrentCall();
				event.slider.close();
			}
		}
	}
}
