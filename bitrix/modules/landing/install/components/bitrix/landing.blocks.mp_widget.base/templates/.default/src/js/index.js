import { Dom, Event } from 'main.core';

const EXTEND_ANIMATION_DELAY = 300;

/**
 * The collapsed grid clips its content, so the first element the extended class reveals
 * is the first child the collapsed grid cuts off. Must be called before the class is added.
 * @return {?Element}
 */
const findFirstRevealedElement = (grid) => {
	const collapsedBottom = grid.getBoundingClientRect().bottom;

	return [...grid.children].find((child) => child.getBoundingClientRect().bottom > collapsedBottom) ?? null;
};

const focusRevealedElement = (element) => {
	if (!element)
	{
		return;
	}

	element.setAttribute('tabindex', '-1');
	element.focus();
};

/**
 * What the reader is put on when the view all button takes over. The widgets of the feed carry the
 * address on the button itself, but kb and bp still wrap a link into it: focus on the wrapper there
 * is focus on a control that does nothing, with the link one stop further.
 * @return {Element}
 */
const entryOf = (button) => button.querySelector('a[href]') ?? button;

export class Base
{
	constructor(widgetElement)
	{
		this.element = widgetElement;
	}

	deleteContextDependentContainer(options)
	{
		if (!options)
		{
			return;
		}

		this.mainContainer = options.mainContainer ?? null;
		this.sidebarContainer = options.sidebarContainer ?? null;
		const sidebarElements = document.querySelectorAll('.landing-sidebar');
		let isInsideSidebar = false;
		sidebarElements.forEach((sidebarElement) => {
			if (sidebarElement.contains(this.element))
			{
				isInsideSidebar = true;
			}
		});

		if (isInsideSidebar && this.mainContainer)
		{
			this.mainContainer.remove();
		}

		if (!isInsideSidebar && this.sidebarContainer)
		{
			this.sidebarContainer.remove();
		}
	}

	toggleExtendViewButtonBehavior(options)
	{
		if (!options)
		{
			return;
		}

		this.extendButton = options.extendButton ?? null;
		this.viewAllButton = options.viewAllButton ?? null;
		this.isShowExtendButton = options.isShowExtendButton ?? null;
		this.grid = options.grid ?? null;
		this.gridExtendedClass = options.gridExtendedClass ?? null;
		this.buttonHideClass = options.buttonHideClass ?? null;

		if (!this.extendButton || !this.viewAllButton)
		{
			return;
		}

		if (!this.isShowExtendButton)
		{
			Dom.addClass(this.extendButton, this.buttonHideClass);
			Dom.removeClass(this.viewAllButton, this.buttonHideClass);

			return;
		}

		this.extendButton.setAttribute('aria-expanded', 'false');
		Event.bind(this.extendButton, 'click', () => {
			this.#extendView();
		});
	}

	#extendView()
	{
		if (!this.grid)
		{
			return;
		}

		// the button hides itself when the animation ends and takes the focus with it,
		// so the focus moves onto the revealed content first
		const firstRevealed = findFirstRevealedElement(this.grid);

		Dom.addClass(this.grid, this.gridExtendedClass);
		this.extendButton.setAttribute('aria-expanded', 'true');
		focusRevealedElement(firstRevealed);

		setTimeout(() => {
			// read before the class hides the button: nothing was revealed to take the focus off it,
			// and a focus left on a hidden element falls to the body
			const focusStaysOnTheButton = document.activeElement === this.extendButton;

			Dom.addClass(this.extendButton, this.buttonHideClass);
			Dom.removeClass(this.viewAllButton, this.buttonHideClass);

			if (focusStaysOnTheButton)
			{
				entryOf(this.viewAllButton).focus();
			}
		}, EXTEND_ANIMATION_DELAY);
	}
}
