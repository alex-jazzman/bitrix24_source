import { EventEmitter, type BaseEvent } from 'main.core.events';
import { PopupManager, type Popup } from 'main.popup';
import { type Slider } from 'main.sidepanel';

const SLIDER_OPEN_EVENT = 'SidePanel.Slider:onOpenStart';
const SLIDER_CLOSE_EVENTS = [
	'SidePanel.Slider:onCloseComplete',
	'SidePanel.Slider:onDestroyComplete',
];

type CatalogPopupSliderGuardOptions = {
	getRootNode: () => HTMLElement | null,
};

/**
 * While a slider covers the catalog, a click inside it is a click outside the dialog and Esc
 * belongs to the slider, so both closing paths of the dialog are switched off until the last
 * slider opened above the catalog is gone.
 */
export class CatalogPopupSliderGuard
{
	#getRootNode: () => HTMLElement | null;
	#openSliders: Set<Slider> = new Set();
	#isBound: boolean = false;
	#isClosingDisabled: boolean = false;

	constructor(options: CatalogPopupSliderGuardOptions)
	{
		this.#getRootNode = options.getRootNode;
	}

	bind(): void
	{
		if (this.#isBound)
		{
			return;
		}

		this.#isBound = true;
		EventEmitter.subscribe(SLIDER_OPEN_EVENT, this.#handleSliderOpen);

		for (const eventName of SLIDER_CLOSE_EVENTS)
		{
			EventEmitter.subscribe(eventName, this.#handleSliderClose);
		}
	}

	reset(): void
	{
		if (!this.#isBound)
		{
			return;
		}

		EventEmitter.unsubscribe(SLIDER_OPEN_EVENT, this.#handleSliderOpen);

		for (const eventName of SLIDER_CLOSE_EVENTS)
		{
			EventEmitter.unsubscribe(eventName, this.#handleSliderClose);
		}

		this.#openSliders.clear();
		this.#isBound = false;
		this.#isClosingDisabled = false;
	}

	#handleSliderOpen = (event: BaseEvent): void => {
		const slider = getEventSlider(event);

		if (slider === null)
		{
			return;
		}

		this.#openSliders.add(slider);

		if (this.#openSliders.size === 1)
		{
			this.#setClosingEnabled(false);
		}
	};

	#handleSliderClose = (event: BaseEvent): void => {
		const slider = getEventSlider(event);

		// a closed slider is destroyed right after, so the same slider arrives twice
		if (slider !== null)
		{
			this.#openSliders.delete(slider);
		}

		// an event that names no slider would otherwise leave the catalog locked for good, so
		// the page is asked whether anything is still open - it may only release the lock,
		// never take the tracked sliders away
		if (this.#openSliders.size > 0 && !noSlidersLeft())
		{
			return;
		}

		this.#openSliders.clear();
		this.#setClosingEnabled(true);
	};

	#setClosingEnabled(enabled: boolean): void
	{
		if (this.#isClosingDisabled === !enabled)
		{
			return;
		}

		const popup = this.#getPopup();

		if (!popup)
		{
			console.error('[vibecodeconnector.catalog] the dialog popup is out of reach, the catalog will close under the slider');

			return;
		}

		popup.setAutoHide(enabled);
		popup.setClosingByEsc(enabled);
		this.#isClosingDisabled = !enabled;
	}

	// the dialog keeps its popup private, and the container id is the popup id
	#getPopup(): Popup | null
	{
		const container = this.#getRootNode()?.closest('.popup-window') ?? null;

		return container instanceof HTMLElement ? PopupManager.getPopupById(container.id) : null;
	}
}

function noSlidersLeft(): boolean
{
	const sliders = window.BX?.SidePanel?.Instance?.getOpenSliders?.();

	return Array.isArray(sliders) && sliders.length === 0;
}

function getEventSlider(event: BaseEvent): Slider | null
{
	const [sliderEvent] = event.getData() ?? [];

	return sliderEvent?.getSlider?.() ?? null;
}
