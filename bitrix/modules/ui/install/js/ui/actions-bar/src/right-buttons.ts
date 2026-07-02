import { Dom, Extension } from 'main.core';
import { AirButtonStyle, type Button, ButtonColor, ButtonManager, ButtonSize } from 'ui.buttons';

export type RightButtonsOptions = {
	buttonsContainer: HTMLElement,
	collapsable?: boolean,
};

const instanceMap: WeakMap<HTMLElement, RightButtons> = new WeakMap();

export class RightButtons
{
	static getInstanceByNode(node: HTMLElement): RightButtons | null
	{
		return instanceMap.get(node) ?? null;
	}

	#buttonsContainer: HTMLElement;
	#buttons: Button[] = [];
	#resizeObserver: ResizeObserver | null = null;
	#mutationObserver: MutationObserver | null = null;
	#deltas: number[] = [];
	#collapsable: boolean;

	static #shift = 32;

	constructor(options: RightButtonsOptions)
	{
		this.#buttonsContainer = options.buttonsContainer;
		this.#collapsable = options.collapsable === true;
		instanceMap.set(this.#buttonsContainer, this);
	}

	getContainer(): HTMLElement
	{
		return this.#buttonsContainer;
	}

	getButtonCount(): number
	{
		return this.#buttons.length;
	}

	getCollapsedCount(): number
	{
		return this.#buttons.filter((button) => button.isCollapsed()).length;
	}

	setCollapsedCount(k: number): void
	{
		// Collapse the last k buttons, expand the rest. Mirrors the original
		// right-to-left collapse order from the auto-managed mode.
		const total = this.#buttons.length;
		const clamped = Math.max(0, Math.min(k, total));
		const firstCollapsedIdx = total - clamped;

		for (let i = 0; i < total; i++)
		{
			const shouldCollapse = i >= firstCollapsedIdx;
			if (this.#buttons[i].isCollapsed() !== shouldCollapse)
			{
				this.#buttons[i].setCollapsed(shouldCollapse);
			}
		}
	}

	collapse(): void
	{
		this.setCollapsedCount(this.#buttons.length);
	}

	expand(): void
	{
		this.setCollapsedCount(0);
	}

	isCollapsed(): boolean
	{
		return this.#buttons.length > 0 && this.getCollapsedCount() === this.#buttons.length;
	}

	disableAutoCollapse(): void
	{
		this.#resizeObserver?.disconnect();
		this.#resizeObserver = null;
	}

	init(): void
	{
		if (this.#useAirDesign() === false)
		{
			return;
		}

		this.#initButtons();

		if (this.#collapsable)
		{
			this.#handleContainerWidthUpdate();
			this.#initResizeObserver();
		}

		this.#initMutationObserver();

		this.#observe();
	}

	#initButtons(): void
	{
		const buttonElements = this.#buttonsContainer.querySelectorAll<HTMLElement>('.ui-btn, .ui-btn-split');

		this.#buttons = [...buttonElements].map((button) => {
			const btn = ButtonManager.createFromNode(button as HTMLButtonElement) as Button;
			this.#styleButton(btn);

			return btn;
		});

		this.#deltas = this.#buttons.map(() => 0);
	}

	#initResizeObserver(): void
	{
		this.#resizeObserver = new ResizeObserver(() => {
			this.#handleContainerWidthUpdate();
		});
	}

	#initMutationObserver(): void
	{
		this.#mutationObserver = new MutationObserver((mutationsList) => {
			mutationsList.forEach((mutation) => {
				if (mutation.type !== 'childList')
				{
					return;
				}

				mutation.addedNodes.forEach((node) => {
					if (node.nodeType !== Node.ELEMENT_NODE)
					{
						return;
					}

					const element = node as HTMLElement;
					if (Dom.hasClass(element, 'ui-btn') || Dom.hasClass(element, 'ui-btn-split'))
					{
						this.#initButtons();
					}

					const foundButtons = element.querySelectorAll('.ui-btn, .ui-btn-split');

					if (foundButtons.length > 0)
					{
						this.#initButtons();
					}
				});
			});
		});
	}

	#observe(): void
	{
		this.#resizeObserver?.observe(this.#buttonsContainer);
		this.#mutationObserver?.observe(this.#buttonsContainer, {
			childList: true,
			subtree: true,
		});
	}

	#handleContainerWidthUpdate(): void
	{
		if (this.#isButtonsOverflowContainer())
		{
			this.#collapseOneMoreButton();
		}
		else if (this.#isEnoughSpaceForExpandedButton())
		{
			this.#expandOneMoreButton();
		}
	}

	#isButtonsOverflowContainer(): boolean
	{
		return this.#getButtonRelativePositionLeft() + RightButtons.#shift >= 0;
	}

	#isEnoughSpaceForExpandedButton(): boolean
	{
		return this.#getButtonRelativePositionLeft() + this.#getDelta() + RightButtons.#shift < 0;
	}

	#getButtonRelativePositionLeft(): number
	{
		return Dom.getRelativePosition(this.#buttonsContainer, this.#buttons[0].getContainer()).left;
	}

	#expandOneMoreButton(): void
	{
		const collapsedButtonIndex = this.#buttons.findIndex((button) => button.isCollapsed());

		if (collapsedButtonIndex < 0)
		{
			return;
		}

		const collapsedButton = this.#buttons[collapsedButtonIndex];

		collapsedButton.setCollapsed(false);
		this.#deltas[collapsedButtonIndex] = 0;

		if (this.#isEnoughSpaceForExpandedButton())
		{
			this.#expandOneMoreButton();
		}
	}

	#collapseOneMoreButton(): void
	{
		const notCollapsedButtonIndex = this.#buttons.findLastIndex((button) => button.isCollapsed() === false);

		if (notCollapsedButtonIndex < 0)
		{
			return;
		}

		const notCollapsedButton = this.#buttons[notCollapsedButtonIndex];

		this.#deltas[notCollapsedButtonIndex] += notCollapsedButton.getContainer().offsetWidth;
		notCollapsedButton.setCollapsed(true);
		this.#deltas[notCollapsedButtonIndex] -= notCollapsedButton.getContainer().offsetWidth;

		if (this.#isButtonsOverflowContainer())
		{
			this.#collapseOneMoreButton();
		}
	}

	#getDelta(): number
	{
		return this.#deltas.find((delta) => delta > 0) ?? 0;
	}

	#useAirDesign(): boolean
	{
		return Boolean(Extension.getSettings('ui.actions-bar').get('useAirDesign'));
	}

	#styleButton(button: Button): void
	{
		const isButtonHasAirDesign = button.hasAirDesign();

		button.setAirDesign(true);
		button.setSize(ButtonSize.SMALL);
		if (isButtonHasAirDesign === false)
		{
			button.setStyle(this.#buttonColorStyleMap(button.getColor()));
		}
		button.setNoCaps(true);
	}

	#buttonColorStyleMap(color: ButtonColor | null): string
	{
		if (color === ButtonColor.PRIMARY)
		{
			return AirButtonStyle.FILLED;
		}

		return AirButtonStyle.OUTLINE;
	}
}
