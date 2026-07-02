import { Dom, Reflection } from 'main.core';
import { EventEmitter, type BaseEvent } from 'main.core.events';
import { type Slider, SidePanel } from 'main.sidepanel';

export class ChatMenuBar
{
	#slider: Slider = null;
	#container: HTMLElement = null;
	#loaded: boolean = false;

	#onZIndexChangeHandler: Function | null = null;
	#onOpeningSliderHandler: Function | null = null;
	#onClosingSliderHandler: Function | null = null;
	#onImLayoutChange: Function | null = null;

	constructor(slider: Slider)
	{
		this.#slider = slider;

		this.#container = document.getElementById('im-chat-menu');
		if (!this.#container)
		{
			console.warn('ChatMenu: container not found');

			return;
		}

		Dom.append(this.#container, document.body);

		EventEmitter.subscribeOnce(this.#slider, 'SidePanel.Slider:onOpenStart', this.#handleSliderOpenStartOnce.bind(this));
		EventEmitter.subscribe(this.#slider, 'SidePanel.Slider:onOpening', this.#handleSliderOpening.bind(this));
		EventEmitter.subscribe(this.#slider, 'SidePanel.Slider:onClosing', this.#handleSliderClosing.bind(this));
		EventEmitter.subscribe(this.#slider, 'SidePanel.Slider:onCloseComplete', this.#handleSliderCloseComplete.bind(this));
		EventEmitter.subscribe(this.#slider, 'SidePanel.Slider:onDestroy', this.#handleSliderDestroy.bind(this));
		EventEmitter.subscribe(this.#slider, 'SidePanel.Slider:onLayout', this.#handleSliderLayout.bind(this));

		this.#onOpeningSliderHandler = (event: BaseEvent) => {
			const [sliderEvent] = event.getData();
			if (sliderEvent.getSlider() !== this.#slider)
			{
				Dom.style(this.getContainer(), 'background', this.#slider.getOverlayBgColor());
				Dom.style(this.getContainer(), 'box-shadow', `-10px 0px 10px 3px ${this.#slider.getOverlayBgColor()}`);
				Dom.attr(this.getContainer(), 'inert', 'true');
			}
		};

		this.#onClosingSliderHandler = () => {
			if (this.#slider === SidePanel.Instance.getPreviousSlider())
			{
				Dom.style(this.getContainer(), 'background', null);
				Dom.style(this.getContainer(), 'box-shadow', null);
				Dom.attr(this.getContainer(), 'inert', null);
			}
		};

		this.#onImLayoutChange = () => {
			if (!this.#loaded)
			{
				this.#loaded = true;
				Dom.addClass(this.getContainer(), '--loaded');
			}
		};

		EventEmitter.subscribe('SidePanel.Slider:onOpening', this.#onOpeningSliderHandler);
		EventEmitter.subscribe('SidePanel.Slider:onClosing', this.#onClosingSliderHandler);
		EventEmitter.subscribe('IM.Layout:onLayoutChange', this.#onImLayoutChange);
	}

	getContainer(): HTMLElement
	{
		return this.#container;
	}

	setZIndex(zIndex: number): void
	{
		Dom.style(this.getContainer(), 'z-index', zIndex);
	}

	reset(): void
	{
		this.getMenu()?.reset();
	}

	getMenu(): typeof(BX.Main.interfaceButtons) | null
	{
		/**
		 *
		 * @type {BX.Main.interfaceButtonsManager}
		 */
		const menuManager = Reflection.getClass('BX.Main.interfaceButtonsManager');
		if (menuManager)
		{
			return menuManager.getById('chat-menu');
		}

		return null;
	}

	#handleSliderOpenStartOnce(): void
	{
		const zIndexComponent = this.#slider.getZIndexComponent();
		if (zIndexComponent && this.#onZIndexChangeHandler === null)
		{
			this.#onZIndexChangeHandler = this.#handleZIndexChange.bind(this);
			EventEmitter.subscribe(zIndexComponent, 'onZIndexChange', this.#onZIndexChangeHandler);
		}
	}

	#handleSliderOpening(): void
	{
		const zIndexComponent = this.#slider.getZIndexComponent();
		if (zIndexComponent)
		{
			this.setZIndex(zIndexComponent.getZIndex() + 1);
		}

		Dom.style(this.getContainer(), 'display', 'block');
		Dom.style(this.getContainer(), 'background', null);
		Dom.style(this.getContainer(), 'box-shadow', null);
		Dom.attr(this.getContainer(), 'inert', null);

		requestAnimationFrame(() => {
			Dom.addClass(this.getContainer(), '--open');
		});
	}

	#handleSliderClosing(): void
	{
		this.reset();
		Dom.removeClass(this.getContainer(), '--open');
	}

	#handleSliderCloseComplete(): void
	{
		Dom.style(this.getContainer(), 'display', 'none');
		Dom.style(this.getContainer(), 'background', null);
		Dom.style(this.getContainer(), 'box-shadow', null);
		Dom.attr(this.getContainer(), 'inert', null);
	}

	#handleSliderDestroy(): void
	{
		this.reset();

		EventEmitter.unsubscribe('SidePanel.Slider:onOpening', this.#onOpeningSliderHandler);
		EventEmitter.unsubscribe('SidePanel.Slider:onClosing', this.#onClosingSliderHandler);
		EventEmitter.unsubscribe('IM.Layout:onLayoutChange', this.#onImLayoutChange);

		const zIndexComponent = this.#slider.getZIndexComponent();
		if (zIndexComponent)
		{
			EventEmitter.unsubscribe(zIndexComponent, 'onZIndexChange', this.#onZIndexChangeHandler);
		}

		this.#onZIndexChangeHandler = null;
	}

	#handleZIndexChange(): void
	{
		const zIndexComponent = this.#slider.getZIndexComponent();
		if (zIndexComponent)
		{
			this.setZIndex(zIndexComponent.getZIndex() + 1);
		}
	}

	#handleSliderLayout(): void
	{
		Dom.style(this.getContainer(), 'width', `${this.#slider.getOverlay().offsetWidth}px`);
	}
}
