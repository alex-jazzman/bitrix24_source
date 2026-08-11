import { Dom, Event, Type, Text } from 'main.core';
import { Popup, type PopupOptions } from 'main.popup';
import { Icon, Outline, Main } from 'ui.icon-set.api.core';
import 'ui.icon-set.main';
import 'ui.icon-set.outline';
import './style.css';

const POPUP_ANGLE_HALF_WIDTH = 17;
const SCROLLABLE_OVERFLOW_VALUES = new Set(['auto', 'scroll', 'overlay']);

export type CursorPosition = {
	x: number,
	y: number,
};

export type ManagerParams = {
	id?: string,
	attributeName?: string,
	attributeInitName?: string,
	classNameIcon?: string,
	className?: string,
	content?: HTMLElement,
	popup?: Popup,
	popupParameters?: PopupOptions,
	icon?: string,
	iconResolver?: (node: HTMLElement) => string | null,
};

const isHovered = (cursorPosition: CursorPosition, element: HTMLElement): boolean => {
	const rect = element.getBoundingClientRect();
	const xMin = rect.x;
	const xMax = rect.x + rect.width;
	const yMin = rect.y;
	const yMax = rect.y + rect.height;

	return (
		cursorPosition.x >= xMin
		&& cursorPosition.x <= xMax
		&& cursorPosition.y >= yMin
		&& cursorPosition.y <= yMax
	);
};

const getAnchorWidth = (anchorNode: HTMLElement): number => {
	const rect = anchorNode.getBoundingClientRect();

	return rect.width || anchorNode.offsetWidth;
};

const getCenteredAngleOffset = (anchorNode: HTMLElement): number | false => {
	const anchorWidth = getAnchorWidth(anchorNode);

	return anchorWidth
		? Popup.getOption('angleLeftOffset') - POPUP_ANGLE_HALF_WIDTH + anchorWidth / 2
		: false
	;
};

const getCenteredAngleOffsetByPosition = (
	anchorNode: HTMLElement,
	popupContainer: HTMLElement,
): number | false => {
	const anchorRect = anchorNode.getBoundingClientRect();
	const popupRect = popupContainer.getBoundingClientRect();

	return anchorRect.width
		? anchorRect.left + anchorRect.width / 2 - popupRect.left - POPUP_ANGLE_HALF_WIDTH
		: false
	;
};

// the arrow must stay on the straight segment of the popup edge, between the rounded corners
const getAngleOffsetRange = (
	popupContainer: HTMLElement,
	angleElement: HTMLElement,
	anglePosition: string,
): { min: number, max: number } => {
	const styles = getComputedStyle(popupContainer);
	const isBottom = anglePosition === 'bottom';
	const leftRadius = parseFloat(isBottom ? styles.borderBottomLeftRadius : styles.borderTopLeftRadius) || 0;
	const rightRadius = parseFloat(isBottom ? styles.borderBottomRightRadius : styles.borderTopRightRadius) || 0;
	const angleWidth = angleElement.offsetWidth || POPUP_ANGLE_HALF_WIDTH * 2;
	const max = popupContainer.offsetWidth - angleWidth - rightRadius;

	return { min: leftRadius, max: Math.max(max, leftRadius) };
};

// shifts the popup horizontally, but keeps it inside the viewport; returns the applied shift
const shiftPopupHorizontally = (popupContainer: HTMLElement, desiredShift: number): number => {
	const popupRect = popupContainer.getBoundingClientRect();
	const viewportWidth = popupContainer.ownerDocument.documentElement.clientWidth;
	const shift = desiredShift > 0
		? Math.min(desiredShift, Math.max(0, viewportWidth - popupRect.right))
		: Math.max(desiredShift, Math.min(0, -popupRect.left))
	;

	if (shift !== 0)
	{
		const popupLeft = parseFloat(Dom.style(popupContainer, 'left')) || 0;
		Dom.style(popupContainer, 'left', `${popupLeft + shift}px`);
	}

	return shift;
};

const isScrollableY = (element: HTMLElement): boolean => {
	const { overflowY } = getComputedStyle(element);

	return (
		SCROLLABLE_OVERFLOW_VALUES.has(overflowY)
		&& element.scrollHeight > element.clientHeight
	);
};

export default class Manager
{
	id: string;
	attributeName = 'data-hint';
	attributeHtmlName = 'data-hint-html';
	attributeInitName = 'data-hint-init';
	attributeInteractivityName = 'data-hint-interactivity';
	classNameContent = 'ui-hint-content';
	#className = 'ui-hint';
	#classNameIcon = 'ui-hint-icon';
	#classNamePopup = 'ui-hint-popup';
	#classNamePopupInteractivity = 'ui-hint-popup-interactivity';
	#attributeSizeName = 'data-hint-size';

	#popup: Popup | null = null;
	#content: HTMLElement | null = null;
	#popupParameters: PopupOptions | null = null;
	#ownerDocument: Document | null = null;
	#cursorPosition: CursorPosition = { x: 0, y: 0 };

	#attributeIconName = 'data-hint-icon';
	#defaultIcon: string = Main.HELP;
	#iconResolver: ((node: HTMLElement) => string | null) | null = null;

	constructor(params: ManagerParams = {})
	{
		this.id = params.id || `ui-hint-popup-${Date.now()}`;
		if (params.attributeName)
		{
			this.attributeName = params.attributeName;
		}

		if (params.attributeInitName)
		{
			this.attributeInitName = params.attributeInitName;
		}

		if (params.classNameIcon)
		{
			this.#classNameIcon = params.classNameIcon;
		}

		if (params.className)
		{
			this.#className = params.className;
		}

		if (params.content)
		{
			if (!Type.isDomNode(params.content))
			{
				throw new Error('Parameter `content` should be a DOM Node.');
			}
			this.#content = params.content;
		}

		if (params.popup)
		{
			if (!(params.popup instanceof Popup))
			{
				throw new TypeError('Parameter `popup` should be an instance of Popup.');
			}
			this.#popup = params.popup;
		}

		if (params.popupParameters)
		{
			this.#popupParameters = params.popupParameters;
		}

		if (params.icon)
		{
			this.#defaultIcon = params.icon;
		}

		if (params.iconResolver)
		{
			this.#iconResolver = params.iconResolver;
		}
	}

	#getIconForNode(node: HTMLElement): string
	{
		if (this.#iconResolver)
		{
			const resolved = this.#iconResolver(node);

			if (Type.isString(resolved) && resolved !== '')
			{
				return resolved;
			}
		}

		const attributeIcon = node.getAttribute(this.#attributeIconName);

		if (Type.isString(attributeIcon) && attributeIcon !== '')
		{
			return attributeIcon;
		}

		if (node.hasAttribute('data-hint-outline'))
		{
			return Outline.QUESTION;
		}

		return this.#defaultIcon;
	}

	initPage(): void
	{
		if (document.body)
		{
			this.initByClassName();
		}

		Event.ready(() => this.initByClassName());
	}

	createInstance(params?: ManagerParams): Manager
	{
		return new Manager(params || {});
	}

	initByClassName(context?: HTMLElement): void
	{
		const root = context || document.body;
		if (!root)
		{
			return;
		}

		const nodes = [...root.getElementsByClassName(this.#className)];
		nodes.forEach((node) => this.initNode(node));

		this.#initOwnerDocument(root);
	}

	init(context?: HTMLElement): void
	{
		const root = context || document.body;
		if (!root)
		{
			return;
		}

		const nodes = [...root.querySelectorAll(`[${this.attributeName}]`)];
		nodes.forEach((node) => this.initNode(node));
		this.#initOwnerDocument(root);
	}

	initOwnerDocument(element: HTMLElement): void
	{
		if (!element)
		{
			return;
		}

		this.#initOwnerDocument(element);
	}

	#initOwnerDocument(element: HTMLElement): void
	{
		if (element.ownerDocument === this.#ownerDocument)
		{
			return;
		}
		this.#ownerDocument = element.ownerDocument;
		Event.bind(this.#ownerDocument, 'mousemove', (e) => {
			this.#cursorPosition = { x: e.x, y: e.y };
		});
	}

	createNode(text: string): HTMLElement
	{
		const node = document.createElement('span');
		node.setAttribute(this.attributeName, text);
		this.initNode(node);

		return node;
	}

	initNode(node: HTMLElement): void
	{
		if (node.getAttribute(this.attributeInitName))
		{
			return;
		}

		node.setAttribute(this.attributeInitName, 'y');

		let text = node.getAttribute(this.attributeName);

		if (!Type.isString(text) || text.trim() === '')
		{
			return;
		}

		if (!node.hasAttribute(this.attributeHtmlName))
		{
			text = Text.encode(text);
		}

		text = text.trim().replaceAll(/\r?\n/g, '<br>');

		const hasIcon = !node.hasAttribute('data-hint-no-icon');

		if (hasIcon)
		{
			this.#renderIcon(node);
		}

		const center = node.hasAttribute('data-hint-center');

		Event.bind(node, 'mouseenter', () => this.show(node, text || '', center, true));
		Event.bind(node, 'mouseleave', () => this.hide(node));
	}

	#renderIcon(node: HTMLElement): void
	{
		Dom.addClass(node, this.#className);

		const iconName = this.#getIconForNode(node);
		const iconInstance = new Icon({
			icon: iconName,
		});
		const iconElement = iconInstance.render();
		Dom.addClass(iconElement, this.#classNameIcon);

		const existingIconNode = node.querySelector(`.${this.#classNameIcon}`);
		if (existingIconNode)
		{
			Dom.replace(existingIconNode, iconElement);
		}
		else
		{
			node.prepend(iconElement);
		}

		const size = node.getAttribute(this.#attributeSizeName);

		if (size)
		{
			Dom.addClass(node, `--ui-hint-size-${size.toLowerCase()}`);
		}
	}

	#getTargetContainer(node: HTMLElement): HTMLElement
	{
		let parent = node.parentElement;
		const ownerDocument = node.ownerDocument;

		while (parent && parent !== ownerDocument.body)
		{
			if (isScrollableY(parent))
			{
				const style = getComputedStyle(parent);
				if (style.position === 'static')
				{
					Dom.style(parent, 'position', 'relative');
				}

				return parent;
			}

			parent = parent.parentElement;
		}

		return ownerDocument.body;
	}

	#validateAnchor(anchorNode: HTMLElement, check: boolean): boolean
	{
		if (!check)
		{
			return true;
		}

		const value = anchorNode.getAttribute(this.attributeName);

		return Type.isString(value);
	}

	#ensurePopup(anchorNode: HTMLElement, centerPos: boolean): void
	{
		const targetContainer = this.#getTargetContainer(anchorNode);

		if (
			this.#popup
			&& (
				this.#popup.bindElement !== anchorNode
				|| this.#popup.getTargetContainer() !== targetContainer
			)
		)
		{
			this.#popup.destroy();
			this.#popup = null;
		}

		if (!this.#content)
		{
			this.#content = document.createElement('div');
			Dom.addClass(this.#content, this.classNameContent);
		}

		if (!this.#popup)
		{
			const popupParams = {
				...this.#buildPopupParams(anchorNode, centerPos),
				targetContainer,
			};

			this.#popup = new Popup(this.id, anchorNode, popupParams);

			Event.bind(
				this.#popup.getPopupContainer(),
				'mouseleave',
				() => this.hide(this.#popup.getPopupContainer()),
			);
		}
	}

	#buildPopupParams(anchorNode: HTMLElement, centerPos: boolean): PopupOptions
	{
		const base = this.#applyBasePopupParams(this.#popupParameters, anchorNode);

		return this.#applyAnglePopupParams(base, anchorNode, centerPos);
	}

	#applyBasePopupParams(params?: PopupOptions, anchorNode: HTMLElement): PopupOptions
	{
		return {
			content: this.#content,
			className: this.#classNamePopup,
			zIndex: 1000,
			darkMode: true,
			focusTrap: false,
			animation: 'fading-slide',
			...params,
		};
	}

	#applyAnglePopupParams(
		params: PopupOptions,
		anchorNode: HTMLElement,
		centerPos: boolean,
	): PopupOptions
	{
		const result: PopupOptions = { ...params };

		if (centerPos)
		{
			result.offsetLeft ??= 0;

			result.angle ??= { offset: 0 };

			result.events ??= {
				onPopupShow: () => {
					this.fixPopupAngle();
				},
			};
		}
		else if (!result.angle)
		{
			result.angle = {
				offset: getCenteredAngleOffset(anchorNode),
			};
		}

		return result;
	}

	fixPopupAngle(anchorNode?: HTMLElement): void
	{
		if (!this.#popup || !this.#popup.angle)
		{
			return;
		}

		const popupContainer = this.#popup.getPopupContainer();

		if (!popupContainer)
		{
			return;
		}

		setTimeout(() => {
			const popupWidth = popupContainer.offsetWidth;
			let offset = anchorNode
				? getCenteredAngleOffsetByPosition(anchorNode, popupContainer)
				: (
					popupWidth
						? popupWidth / 2 - POPUP_ANGLE_HALF_WIDTH
						: false
				)
			;

			if (offset !== false)
			{
				const range = getAngleOffsetRange(popupContainer, this.#popup.angle.element, this.#popup.angle.position);
				const clampedOffset = Math.min(Math.max(offset, range.min), range.max);

				// keep the arrow pointed at the anchor: shift the popup instead of the arrow
				const popupShift = anchorNode && clampedOffset !== offset
					? shiftPopupHorizontally(popupContainer, offset - clampedOffset)
					: 0
				;

				offset = Math.min(Math.max(offset - popupShift, range.min), range.max);
			}

			this.#popup.angle.offset = offset;

			if (this.#popup.angle.position === 'bottom')
			{
				Dom.style(this.#popup.angle.element, 'left', '0');
				Dom.style(
					this.#popup.angle.element,
					'marginLeft',
					offset === false ? '' : `${offset}px`,
				);
			}
			else
			{
				Dom.style(this.#popup.angle.element, 'marginLeft', '0');
				Dom.style(
					this.#popup.angle.element,
					'left',
					offset === false ? '' : `${offset}px`,
				);
			}
		}, 0);
	}

	#applyInteractivity(anchorNode: HTMLElement): void
	{
		const popupContainer = this.#popup.getPopupContainer();

		if (anchorNode.hasAttribute(this.attributeInteractivityName))
		{
			Dom.addClass(popupContainer, this.#classNamePopupInteractivity);
		}
		else
		{
			Dom.removeClass(popupContainer, this.#classNamePopupInteractivity);
		}
	}

	#renderContent(html: string): void
	{
		this.#content.innerHTML = html;
	}

	#fixCenterVisibility(): void
	{
		const cont = this.#popup.getPopupContainer();

		Dom.style(cont, 'visibility', 'hidden');
		setTimeout(() => {
			Dom.style(cont, 'visibility', '');
		}, 10);
	}

	show(
		anchorNode: HTMLElement,
		html: string,
		centerPos: boolean,
		checkAttribute: boolean = false,
	): void
	{
		if (!this.#validateAnchor(anchorNode, checkAttribute))
		{
			return;
		}

		this.#ensurePopup(anchorNode, centerPos);

		if (!this.#popup)
		{
			return;
		}

		this.#applyInteractivity(anchorNode);

		this.#renderContent(html);

		this.#popup.show();

		if (centerPos)
		{
			this.#fixCenterVisibility();
		}
		else
		{
			this.fixPopupAngle(anchorNode);
		}
	}

	hide(anchorNode?: HTMLElement): void
	{
		if (!this.#popup)
		{
			return;
		}

		if (anchorNode && anchorNode.hasAttribute(this.attributeInteractivityName))
		{
			setTimeout(() => {
				if (this.#popup && !isHovered(this.#cursorPosition, this.#popup.getPopupContainer()))
				{
					this.#popup.close();
				}
			}, 100);
		}
		else
		{
			this.#popup.close();
		}
	}
}
