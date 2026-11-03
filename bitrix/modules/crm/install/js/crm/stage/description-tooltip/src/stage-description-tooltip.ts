import { Text, Type } from 'main.core';
import { Popup, type PopupOptions } from 'main.popup';
import { FocusNavigator } from 'ui.a11y';
import { type NodeFormatter } from 'ui.bbcode.formatter';
import { HtmlFormatter } from 'ui.bbcode.formatter.html-formatter';
import { type BBCodeNode } from 'ui.bbcode.model';
import { Hint } from 'ui.hint';

import { activeTooltipRegistry } from './active-tooltip-registry';
import { isPopupContainerMouseLeave } from './popup-mouse-leave';
import { isSameVisibleTooltip } from './visible-tooltip';

export type StageDescriptionTooltipShowOptions = {
	bindElement: HTMLElement,
	focusElement?: HTMLElement,
	name: string,
	description: string,
	showName: boolean,
};

type StageDescriptionTooltipContent = Pick<
	StageDescriptionTooltipShowOptions,
	'name' | 'description' | 'showName'
>;

const allowedDescriptionNodeNames = new Set([
	'#root',
	'#text',
	'#tab',
	'#linebreak',
	'p',
	'b',
	'i',
	'u',
	's',
	'url',
]);

const allowedDescriptionHtmlTags = new Set([
	'A',
	'B',
	'BR',
	'I',
	'P',
	'S',
	'U',
]);

class StageDescriptionHtmlFormatter extends HtmlFormatter
{
	getNodeFormatter(node: BBCodeNode): NodeFormatter | null
	{
		if (allowedDescriptionNodeNames.has(node.getName()))
		{
			return super.getNodeFormatter(node);
		}

		return this.runOnUnknown({ node, formatter: this, data: this.getData() ?? {} });
	}
}

const formatter = new StageDescriptionHtmlFormatter();
const tooltipIdPrefix = `crm-stage-description-tooltip-${Text.getRandom()}`;
const tooltipHideDelay = 700;
let tooltipIdCounter = 0;

type DescriptionFormatter = {
	format: (options: { source: string }) => Node | null,
};

export function centerStageDescriptionPopup(popup: Popup, bindElement: HTMLElement | null): void
{
	const popupContainer = popup.getPopupContainer();
	const anchorWidth = Type.isElementNode(bindElement) ? bindElement.offsetWidth : null;
	const popupWidth = popupContainer.offsetWidth;
	const angleElement = popupContainer.querySelector<HTMLElement>('.popup-window-angly');
	const angleWidth = angleElement?.offsetWidth;
	const angleLeftOffset = Popup.getOption('angleLeftOffset');

	if (
		!Type.isNumber(anchorWidth)
		|| !Type.isNumber(popupWidth)
		|| popupWidth <= 0
		|| !Type.isNumber(angleWidth)
		|| !Type.isNumber(angleLeftOffset)
	)
	{
		return;
	}

	popup.setOffset({ offsetLeft: angleLeftOffset + (anchorWidth - popupWidth) / 2 });
	popup.setAngle({ offset: (popupWidth - angleWidth) / 2 });
}

export function adjustStageDescriptionPopup(popup: Popup, bindElement: HTMLElement | null): void
{
	centerStageDescriptionPopup(popup, bindElement);
	popup.adjustPosition({ forceBindPosition: true });
}

export function getNextStageDescriptionTooltipId(): string
{
	tooltipIdCounter++;

	return `${tooltipIdPrefix}-${tooltipIdCounter}`;
}

function formatDescription(description: string, descriptionFormatter: DescriptionFormatter): string
{
	if (!Type.isStringFilled(description))
	{
		return '';
	}

	try
	{
		const formattedDescription = descriptionFormatter.format({ source: description });
		if (!formattedDescription)
		{
			throw new Error('Stage description formatter returned empty content');
		}

		return sanitizeFormattedDescription(formattedDescription);
	}
	catch
	{
		return Text.encode(description).trim().replaceAll(/\r?\n/g, '<br>');
	}
}

function sanitizeFormattedDescription(formattedDescription: Node): string
{
	const container = document.createElement('div');
	container.appendChild(formattedDescription);

	[...container.querySelectorAll<HTMLElement>('*')].forEach((element) => {
		if (!allowedDescriptionHtmlTags.has(element.tagName))
		{
			element.replaceWith(...element.childNodes);

			return;
		}

		const className = element.getAttribute('class');
		const href = element.tagName === 'A' ? element.getAttribute('href') ?? '' : '';
		[...element.attributes].forEach((attribute) => element.removeAttribute(attribute.name));
		if (className)
		{
			element.className = className;
		}
		if (element.tagName !== 'A')
		{
			return;
		}

		if (!/^https?:\/\//i.test(href))
		{
			element.replaceWith(...element.childNodes);

			return;
		}

		element.setAttribute('href', href);
	});

	return container.innerHTML.trim();
}

export function getStageDescriptionTooltipContent(
	options: Omit<StageDescriptionTooltipShowOptions, 'bindElement'>,
	descriptionFormatter: DescriptionFormatter = formatter,
): string
{
	const name = options.showName && Type.isStringFilled(options.name)
		? Text.encode(options.name).trim()
		: ''
	;
	const description = formatDescription(options.description, descriptionFormatter);
	if (!Type.isStringFilled(name) && !Type.isStringFilled(description))
	{
		return '';
	}

	return `
		<div class="crm-stage-description-tooltip" data-testid="crm-stage-description-tooltip">
			${Type.isStringFilled(name) ? `<p class="crm-stage-description-tooltip__name">${name}</p>` : ''}
			${Type.isStringFilled(description) ? `<div class="crm-stage-description-tooltip__description">${description}</div>` : ''}
		</div>
	`;
}

export class StageDescriptionTooltip
{
	#hideTimeout: number | null = null;

	#popupContainer: HTMLElement | null = null;

	#resizeObserver: ResizeObserver | null = null;

	#hint = Hint.createInstance({
		id: getNextStageDescriptionTooltipId(),
		popupParameters: ({
			angle: true,
			className: 'ui-hint-popup crm-stage-description-tooltip-popup',
			darkMode: false,
			offsetTop: 2,
			maxWidth: 340,
			background: 'var(--ui-color-bg-content-inapp, #0056bf)',
			padding: 6,
			targetContainer: document.body,
			events: {
				// PopupOptions is typed for BaseEvent, but legacy popup events pass Popup directly at runtime.
				onPopupShow: (popup) => this.#handlePopupShow(popup as unknown as Popup),
				onPopupClose: () => this.#handlePopupClose(),
			},
		} as PopupOptions & { offsetTop: number }),
	});

	#bindElement: HTMLElement | null = null;

	#focusElement: HTMLElement | null = null;

	#visibleContent: StageDescriptionTooltipContent | null = null;

	#handlePopupMouseEnter = (): void => {
		this.#cancelScheduledHide();
	};

	#handlePopupMouseLeave = (event: MouseEvent): void => {
		if (!isPopupContainerMouseLeave(event.target, this.#popupContainer))
		{
			return;
		}

		// ui.hint has its own immediate mouseleave handler. Capture is required to stop it before the target phase.
		event.stopImmediatePropagation();
		if (this.#isFocusWithinTooltip())
		{
			return;
		}
		this.hide();
	};

	#handleFocusIn = (): void => {
		this.#cancelScheduledHide();
	};

	#handleFocusOut = (event: FocusEvent): void => {
		if (this.#isWithinTooltip(event.relatedTarget))
		{
			this.#cancelScheduledHide();

			return;
		}

		this.hide();
	};

	#handleBindElementKeyDown = (event: KeyboardEvent): void => {
		if (event.key === 'Escape')
		{
			this.#closeFromKeyboard(event);

			return;
		}

		if (event.key !== 'Tab' || event.shiftKey || !this.#popupContainer)
		{
			return;
		}

		const firstPopupTarget = FocusNavigator.getFirst(this.#popupContainer, { tabbableOnly: true });
		if (firstPopupTarget)
		{
			event.preventDefault();
			FocusNavigator.focusTarget(firstPopupTarget, { focusVisible: true });
		}
	};

	#handlePopupKeyDown = (event: KeyboardEvent): void => {
		if (event.key === 'Escape')
		{
			this.#closeFromKeyboard(event);

			return;
		}

		if (event.key !== 'Tab' || !this.#popupContainer)
		{
			return;
		}

		const activeElement = FocusNavigator.getActiveElement(this.#popupContainer);
		const firstPopupTarget = FocusNavigator.getFirst(this.#popupContainer, { tabbableOnly: true });
		const lastPopupTarget = FocusNavigator.getLast(this.#popupContainer, { tabbableOnly: true });

		if (event.shiftKey && activeElement === firstPopupTarget)
		{
			event.preventDefault();
			FocusNavigator.restoreFocus(this.#focusElement, { focusVisible: true });

			return;
		}

		if (!event.shiftKey && activeElement === lastPopupTarget && this.#focusElement)
		{
			const focusElement = this.#focusElement;
			const nextTarget = FocusNavigator.getNext(document.body, {
				from: focusElement,
				tabbableOnly: true,
				accept: (element) => !this.#popupContainer?.contains(element),
			});
			event.preventDefault();
			this.hideImmediately();
			if (nextTarget)
			{
				FocusNavigator.focusTarget(nextTarget, { focusVisible: true });
			}
			else
			{
				FocusNavigator.restoreFocus(focusElement, { focusVisible: true });
			}
		}
	};

	#closeFromKeyboard(event: KeyboardEvent): void
	{
		event.preventDefault();
		event.stopPropagation();
		const focusElement = this.#focusElement;
		this.hideImmediately();
		FocusNavigator.restoreFocus(focusElement, { focusVisible: true });
	}

	#handlePopupShow(popup: Popup): void
	{
		adjustStageDescriptionPopup(popup, this.#bindElement);
		this.#observeBindElementResize(popup, this.#bindElement);
		this.#bindPopupContainer(popup.getPopupContainer());
	}

	#handlePopupClose(): void
	{
		activeTooltipRegistry.deactivate(this);
		this.#cancelScheduledHide();
		this.#unbindPopupContainer();
		this.#unbindBindElement();
		this.#disconnectResizeObserver();
		this.#bindElement = null;
		this.#focusElement = null;
		this.#visibleContent = null;
	}

	#bindPopupContainer(popupContainer: HTMLElement): void
	{
		this.#unbindPopupContainer();
		this.#popupContainer = popupContainer;
		this.#popupContainer.classList.add('ui-hint-popup-interactivity');
		this.#popupContainer.addEventListener('mouseenter', this.#handlePopupMouseEnter);
		this.#popupContainer.addEventListener('mouseleave', this.#handlePopupMouseLeave, true);
		this.#popupContainer.addEventListener('focusin', this.#handleFocusIn);
		this.#popupContainer.addEventListener('focusout', this.#handleFocusOut);
		this.#popupContainer.addEventListener('keydown', this.#handlePopupKeyDown);
		this.#bindBindElement();
	}

	#unbindPopupContainer(): void
	{
		if (!this.#popupContainer)
		{
			return;
		}

		this.#popupContainer.removeEventListener('mouseenter', this.#handlePopupMouseEnter);
		this.#popupContainer.removeEventListener('mouseleave', this.#handlePopupMouseLeave, true);
		this.#popupContainer.removeEventListener('focusin', this.#handleFocusIn);
		this.#popupContainer.removeEventListener('focusout', this.#handleFocusOut);
		this.#popupContainer.removeEventListener('keydown', this.#handlePopupKeyDown);
		this.#popupContainer.classList.remove('ui-hint-popup-interactivity');
		this.#popupContainer = null;
	}

	#bindBindElement(): void
	{
		if (!this.#focusElement)
		{
			return;
		}

		this.#focusElement.addEventListener('focusin', this.#handleFocusIn);
		this.#focusElement.addEventListener('focusout', this.#handleFocusOut);
		this.#focusElement.addEventListener('keydown', this.#handleBindElementKeyDown);
	}

	#unbindBindElement(): void
	{
		if (!this.#focusElement)
		{
			return;
		}

		this.#focusElement.removeEventListener('focusin', this.#handleFocusIn);
		this.#focusElement.removeEventListener('focusout', this.#handleFocusOut);
		this.#focusElement.removeEventListener('keydown', this.#handleBindElementKeyDown);
	}

	#isWithinTooltip(target: EventTarget | null): boolean
	{
		return Boolean(Type.isElementNode(target) && (
			this.#focusElement?.contains(target as Node)
			|| this.#popupContainer?.contains(target as Node)
		));
	}

	#isFocusWithinTooltip(): boolean
	{
		return this.#isWithinTooltip(FocusNavigator.getActiveElement(this.#popupContainer));
	}

	#observeBindElementResize(popup: Popup, bindElement: HTMLElement | null): void
	{
		this.#disconnectResizeObserver();

		if (!Type.isFunction(window.ResizeObserver) || !Type.isElementNode(bindElement))
		{
			return;
		}

		this.#resizeObserver = new window.ResizeObserver(() => {
			if (popup.isShown())
			{
				adjustStageDescriptionPopup(popup, bindElement);
				this.#hint.fixPopupAngle(bindElement);
			}
		});
		this.#resizeObserver.observe(bindElement);
	}

	#disconnectResizeObserver(): void
	{
		this.#resizeObserver?.disconnect();
		this.#resizeObserver = null;
	}

	show(options: StageDescriptionTooltipShowOptions): void
	{
		this.#cancelScheduledHide();

		if (!Type.isElementNode(options.bindElement))
		{
			this.hideImmediately();

			return;
		}

		if (
			isSameVisibleTooltip(this.#bindElement, this.#popupContainer, options.bindElement)
			&& this.#hasSameVisibleContent(options)
		)
		{
			return;
		}

		const content = getStageDescriptionTooltipContent(options);
		if (!Type.isStringFilled(content))
		{
			this.hideImmediately();

			return;
		}

		if (!activeTooltipRegistry.activate(this))
		{
			return;
		}

		this.#unbindBindElement();
		this.#bindElement = options.bindElement;
		this.#focusElement = Type.isElementNode(options.focusElement)
			? options.focusElement
			: options.bindElement
		;
		this.#visibleContent = {
			name: options.name,
			description: options.description,
			showName: options.showName,
		};
		this.#hint.show(this.#bindElement, content, true);
		this.#hint.fixPopupAngle(this.#bindElement);
	}

	#hasSameVisibleContent(options: StageDescriptionTooltipShowOptions): boolean
	{
		return (
			this.#visibleContent?.name === options.name
			&& this.#visibleContent.description === options.description
			&& this.#visibleContent.showName === options.showName
		);
	}

	hide(): void
	{
		this.#cancelScheduledHide();

		if (!this.#bindElement)
		{
			return;
		}

		this.#hideTimeout = window.setTimeout(() => this.hideImmediately(), tooltipHideDelay);
	}

	hideImmediately(): void
	{
		activeTooltipRegistry.deactivate(this);
		this.#cancelScheduledHide();
		this.#unbindPopupContainer();
		this.#unbindBindElement();
		this.#disconnectResizeObserver();
		this.#visibleContent = null;

		if (this.#bindElement)
		{
			this.#hint.hide(this.#bindElement);
			this.#bindElement = null;
		}
		this.#focusElement = null;
	}

	#cancelScheduledHide(): void
	{
		if (this.#hideTimeout === null)
		{
			return;
		}

		clearTimeout(this.#hideTimeout);
		this.#hideTimeout = null;
	}
}
