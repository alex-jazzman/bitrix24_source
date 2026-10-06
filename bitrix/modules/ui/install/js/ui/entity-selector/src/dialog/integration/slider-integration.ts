import { type BaseEvent } from 'main.core.events';
import { type Dialog } from '../dialog';

type SidePanelSlider = {
	getFrameWindow(): Window | null;
	getContainer(): HTMLElement;
};

type WindowWithBX = Window & {
	BX?: {
		Event: {
			EventEmitter: {
				subscribe(eventName: string, handler: (event: BaseEvent) => void): void;
				unsubscribe(eventName: string, handler: (event: BaseEvent) => void): void;
			};
		};
	};
};

export class SliderIntegration
{
	dialog: Dialog;
	sliders: Set<SidePanelSlider> = new Set();

	constructor(dialog: Dialog)
	{
		this.dialog = dialog;

		this.dialog.subscribe('onShow', this.handleDialogShow.bind(this));
		this.dialog.subscribe('onHide', this.handleDialogHide.bind(this));
		this.dialog.subscribe('onDestroy', this.handleDialogDestroy.bind(this));

		this.handleSliderOpen = this.handleSliderOpen.bind(this);
		this.handleSliderClose = this.handleSliderClose.bind(this);
		this.handleSliderDestroy = this.handleSliderDestroy.bind(this);
	}

	getDialog(): Dialog
	{
		return this.dialog;
	}

	bindEvents(): void
	{
		this.unbindEvents();

		const topWindow = top as WindowWithBX;
		if (topWindow.BX)
		{
			topWindow.BX.Event.EventEmitter.subscribe('SidePanel.Slider:onOpen', this.handleSliderOpen);
			topWindow.BX.Event.EventEmitter.subscribe('SidePanel.Slider:onCloseComplete', this.handleSliderClose);
			topWindow.BX.Event.EventEmitter.subscribe('SidePanel.Slider:onDestroy', this.handleSliderDestroy);
		}
	}

	unbindEvents(): void
	{
		const topWindow = top as WindowWithBX;
		if (topWindow.BX)
		{
			topWindow.BX.Event.EventEmitter.unsubscribe('SidePanel.Slider:onOpen', this.handleSliderOpen);
			topWindow.BX.Event.EventEmitter.unsubscribe('SidePanel.Slider:onCloseComplete', this.handleSliderClose);
			topWindow.BX.Event.EventEmitter.unsubscribe('SidePanel.Slider:onDestroy', this.handleSliderDestroy);
		}
	}

	isDialogInSlider(slider: SidePanelSlider): boolean
	{
		if (slider.getFrameWindow())
		{
			return slider.getFrameWindow()!.document.contains(this.getDialog().getContainer());
		}
		else
		{
			return slider.getContainer().contains(this.getDialog().getContainer());
		}
	}

	handleDialogShow(): void
	{
		this.bindEvents();
	}

	handleDialogHide(): void
	{
		this.sliders.clear();
		this.unbindEvents();
		this.getDialog().unfreeze();
	}

	handleDialogDestroy(): void
	{
		this.sliders.clear();
		this.unbindEvents();
	}

	handleSliderOpen(event: BaseEvent): void
	{
		const [sliderEvent] = event.getData();
		const slider = sliderEvent.getSlider();

		if (!this.isDialogInSlider(slider))
		{
			this.sliders.add(slider);
			this.getDialog().freeze();
		}
	}

	handleSliderClose(event: BaseEvent): void
	{
		const [sliderEvent] = event.getData();
		const slider = sliderEvent.getSlider();

		this.sliders.delete(slider);
		this.#unfreezeDialog();
	}

	handleSliderDestroy(event: BaseEvent): void
	{
		const [sliderEvent] = event.getData();
		const slider = sliderEvent.getSlider();

		if (this.isDialogInSlider(slider))
		{
			this.unbindEvents();
			this.dialog.destroy();
		}
		else
		{
			this.sliders.delete(slider);
			this.#unfreezeDialog();
		}
	}

	#unfreezeDialog(): void
	{
		if (this.sliders.size > 0)
		{
			return;
		}

		// The slider's focus trap releases `inert` on the dialog popup after this event
		// within the same call stack. Defer unfreezing so the keyboard navigation focus zone
		// initializes on the focusable elements, not on the still-inert ones.
		setTimeout(() => {
			if (this.sliders.size === 0 && this.getDialog().destroyed !== true)
			{
				this.getDialog().unfreeze();
			}
		}, 0);
	}
}
