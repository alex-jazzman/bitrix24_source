import { Event, Tag, Type } from 'main.core';
import { Popup } from 'main.popup';
import { type App, BitrixVue, type Component } from 'ui.vue3';

type PopupTrigger = 'hover' | 'click';

type PopupOptions = {
	width: number;
	className: string;
	closeByEsc?: boolean;
	autoHide?: boolean;
	closeDelayOnMouseLeave?: number;
};

type PopupControllerOptions = {
	bindElement: HTMLElement;
	trigger: PopupTrigger;
	component: Component;
	props?: Record<string, unknown>;
	popupOptions: PopupOptions;
};

export class PopupController
{
	#options: PopupControllerOptions;
	#popup: Popup | null = null;
	#application: App | null = null;
	#container: HTMLElement | null = null;
	#closeTimeoutId: null | number = null;

	constructor(options: PopupControllerOptions)
	{
		this.#options = options;
		this.#bindEvents();
	}

	destroy(): void
	{
		this.#cancelClosing();

		if (this.#isClickTrigger())
		{
			Event.unbind(this.#options.bindElement, 'click', this.#handleTriggerClick);
		}
		else
		{
			Event.unbind(this.#options.bindElement, 'mouseenter', this.#handleMouseEnter);
			Event.unbind(this.#options.bindElement, 'mouseleave', this.#handleMouseLeave);
			Event.unbind(this.#options.bindElement, 'click', this.#handleBindElementClick);
		}

		if (this.#popup)
		{
			const popupContainer = this.#popup.getPopupContainer();
			if (!this.#isClickTrigger())
			{
				Event.unbind(popupContainer, 'mouseenter', this.#handleMouseEnter);
				Event.unbind(popupContainer, 'mouseleave', this.#handleMouseLeave);
			}

			this.#popup.destroy();
			this.#popup = null;
		}

		this.#application?.unmount();
		this.#application = null;
		this.#container = null;
	}

	#bindEvents(): void
	{
		if (this.#isClickTrigger())
		{
			Event.bind(this.#options.bindElement, 'click', this.#handleTriggerClick);

			return;
		}

		Event.bind(this.#options.bindElement, 'mouseenter', this.#handleMouseEnter);
		Event.bind(this.#options.bindElement, 'mouseleave', this.#handleMouseLeave);
		Event.bind(this.#options.bindElement, 'click', this.#handleBindElementClick);
	}

	#isClickTrigger(): boolean
	{
		return this.#options.trigger === 'click';
	}

	#handleTriggerClick = (): void => {
		if (!document.body.contains(this.#options.bindElement))
		{
			return;
		}

		const popup = this.#getPopup();
		if (popup.isShown())
		{
			popup.close();
		}
		else
		{
			popup.show();
		}
	};

	#handleMouseEnter = (): void => {
		this.#cancelClosing();

		if (document.body.contains(this.#options.bindElement))
		{
			this.#getPopup().show();
		}
	};

	#handleMouseLeave = (event: MouseEvent): void => {
		if (this.#shouldKeepPopupOpened(event))
		{
			return;
		}

		this.#scheduleClosing();
	};

	#handleBindElementClick = (): void => {
		this.#cancelClosing();
		this.#popup?.close();
	};

	#shouldKeepPopupOpened(event: MouseEvent): boolean
	{
		const nextTarget = event.relatedTarget;
		if (!Type.isDomNode(nextTarget))
		{
			return false;
		}

		const popupContainer = this.#popup?.getPopupContainer();

		return this.#options.bindElement.contains(nextTarget) || popupContainer?.contains(nextTarget) === true;
	}

	#cancelClosing(): void
	{
		if (!Type.isNumber(this.#closeTimeoutId))
		{
			return;
		}

		clearTimeout(this.#closeTimeoutId);
		this.#closeTimeoutId = null;
	}

	#scheduleClosing(): void
	{
		this.#cancelClosing();

		const closeDelay = this.#options.popupOptions.closeDelayOnMouseLeave ?? 150;
		if (closeDelay <= 0)
		{
			this.#popup?.close();

			return;
		}

		this.#closeTimeoutId = window.setTimeout(() => {
			this.#popup?.close();
			this.#closeTimeoutId = null;
		}, closeDelay);
	}

	#getPopup(): Popup
	{
		if (this.#popup === null)
		{
			this.#popup = new Popup(({
				bindElement: this.#options.bindElement,
				className: `${this.#options.popupOptions.className} ui-icon-set__scope`,
				content: this.#getContainer(),
				width: this.#options.popupOptions.width,
				noAllPaddings: true,
				autoHide: this.#options.popupOptions.autoHide ?? this.#isClickTrigger(),
				closeByEsc: this.#options.popupOptions.closeByEsc ?? this.#isClickTrigger(),
				closeIcon: false,
				cacheable: false,
				angle: { position: 'top', offset: 0 },
				animation: 'fading-slide',
				events: {
					onDestroy: () => {
						this.#cancelClosing();
						this.#application?.unmount();
						this.#application = null;
						this.#container = null;
						this.#popup = null;
					},
				},
			}) as any);

			this.#popup.setOffset({
				offsetLeft: Math.round(this.#options.bindElement.offsetWidth / 2),
				offsetTop: 0,
			});

			if (!this.#isClickTrigger())
			{
				const popupContainer = this.#popup.getPopupContainer();
				Event.bind(popupContainer, 'mouseenter', this.#handleMouseEnter);
				Event.bind(popupContainer, 'mouseleave', this.#handleMouseLeave);
			}
		}

		return this.#popup;
	}

	#getContainer(): HTMLElement
	{
		if (!Type.isElementNode(this.#container))
		{
			this.#container = Tag.render`<div class="crm-ai-report-drawer__popup-container"></div>`;
			this.#application = this.#createApplication();
			this.#application.mount(this.#container);
		}

		return this.#container as HTMLElement;
	}

	#createApplication(): App
	{
		return BitrixVue.createApp(this.#options.component, this.#options.props ?? null);
	}
}
