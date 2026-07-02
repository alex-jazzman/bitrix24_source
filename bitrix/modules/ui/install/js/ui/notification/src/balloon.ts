import {
	Type,
	Text,
	Dom,
	Tag,
	Event,
	ZIndexManager,
	addCustomEvent,
	onCustomEvent,
	removeCustomEvent,
} from 'main.core';

import { NotificationEvent } from './event';
import { Action } from './action';
import { Stack } from './stack';
import { State, type BalloonOptions, type StateValue, type BalloonRender, type BalloonEventHandler } from './types';

// Fields and methods on Balloon are intentionally public (not `#private`) so that
// existing subclasses such as ui.notification-manager's BrowserNotification and
// intranet's PushInvitations — which write to `this.container`, `this.actions`,
// `this.animationClassName` and read `balloon.category` directly — keep working.
export class Balloon
{
	id: string;
	stack: Stack;
	state: StateValue = State.INIT;

	showOnTopWindow: boolean;
	container: HTMLElement | null = null;
	content: string | Element | null = null;
	actions: Action[] = [];
	animationClassName = 'ui-notification-balloon-animate';
	customRender: BalloonRender | null = null;
	category: string | null = null;

	autoHide = true;
	autoHideDelay = 8000;
	autoHideTimeout: ReturnType<typeof setTimeout> | null = null;

	useAirDesign: boolean;
	data: Record<string, unknown> = {};
	width: number | 'auto' = 400;

	closeButton: HTMLElement | null = null;
	closeButtonVisibility = true;

	constructor(options: BalloonOptions = {})
	{
		const opts = Type.isPlainObject(options) ? options : ({} as BalloonOptions);

		if (!(opts.stack instanceof Stack))
		{
			throw new TypeError("BX.UI.Notification.Balloon: 'stack' parameter is required.");
		}

		this.id = Type.isStringFilled(opts.id) ? (opts.id as string) : Text.getRandom(8).toLowerCase();
		this.stack = opts.stack;

		this.showOnTopWindow = opts.showOnTopWindow === true;
		this.useAirDesign = opts.useAirDesign === true;

		if (this.useAirDesign)
		{
			this.width = 339;
		}

		if (Type.isPlainObject(opts.events))
		{
			for (const [eventName, handler] of Object.entries(opts.events!))
			{
				this.addEvent(eventName, handler);
			}
		}

		this.setOptions(opts);
	}

	show(): void
	{
		if (this.getState() === State.OPENING)
		{
			return;
		}

		if (this.getState() === State.OPEN)
		{
			this.activateAutoHide();

			return;
		}

		let firstLaunch = false;
		if (!this.getContainer().parentNode)
		{
			firstLaunch = true;
			const target = this.showOnTopWindow ? window.top!.document.body : document.body;
			Dom.append(this.getContainer(), target);

			ZIndexManager.register(this.getContainer(), { alwaysOnTop: true });

			this.getStack().add(this);
			if (this.getState() === State.QUEUED)
			{
				return;
			}
		}

		const paused = this.getState() === State.PAUSED;
		this.setState(State.OPENING);
		this.adjustPosition();
		ZIndexManager.bringToFront(this.getContainer());

		this.animateIn(() => {
			if (this.getState() !== State.OPENING)
			{
				return;
			}

			this.setState(State.OPEN);

			if (firstLaunch)
			{
				this.fireEvent('onOpen');
			}

			if (!paused)
			{
				this.activateAutoHide();
			}
		});
	}

	setOptions(options: BalloonOptions | null): void
	{
		if (!Type.isPlainObject(options))
		{
			return;
		}

		const opts = options as BalloonOptions;
		this.setContent(opts.content);
		this.setWidth(opts.width);
		this.setData(opts.data);
		this.setCloseButtonVisibility(opts.closeButton);
		this.setActions(opts.actions);
		this.setCategory(opts.category ?? undefined);
		this.setAutoHide(opts.autoHide);
		this.setCustomRender(opts.render);
		this.setAutoHideDelay(opts.autoHideDelay);
	}

	update(options: BalloonOptions | null): void
	{
		this.setOptions(options);

		Dom.clean(this.getContainer());
		Dom.append(this.render(), this.getContainer());

		this.deactivateAutoHide();
		this.activateAutoHide();
	}

	close(): void
	{
		const startState = this.getState();
		if (startState === State.CLOSING || startState === State.CLOSED)
		{
			return;
		}

		this.setState(State.CLOSING);
		this.deactivateAutoHide();

		const finalize = () => {
			if (this.getState() !== State.CLOSING)
			{
				return;
			}

			this.setState(State.CLOSED);

			ZIndexManager.unregister(this.getContainer());
			Dom.remove(this.getContainer());
			this.container = null;

			this.fireEvent('onClose');
		};

		if (startState === State.OPENING)
		{
			finalize();
		}
		else
		{
			this.animateOut(() => finalize());
		}
	}

	blink(): void
	{
		this.animateOut(() => {
			setTimeout(() => {
				this.update(null);
				this.animateIn(() => {});
			}, 200);
		});
	}

	adjustPosition(): void
	{
		if (this.getStack().isNewestOnTop())
		{
			this.getStack().adjustPosition();
		}
		else
		{
			this.getStack().adjustPosition(this);
		}
	}

	getId(): string
	{
		return this.id;
	}

	getCloseButton(): HTMLElement
	{
		if (this.closeButton !== null)
		{
			return this.closeButton;
		}

		this.closeButton = Tag.render`<div class="ui-notification-balloon-close-btn"></div>`;
		Event.bind(this.closeButton!, 'click', () => this.handleCloseBtnClick());

		return this.closeButton!;
	}

	setCloseButtonVisibility(visibility: unknown): void
	{
		this.closeButtonVisibility = visibility !== false;
	}

	isCloseButtonVisible(): boolean
	{
		return this.closeButtonVisibility;
	}

	getContent(): string | Element | null
	{
		return this.content;
	}

	setContent(content: unknown): void
	{
		if (Type.isString(content) || Type.isDomNode(content))
		{
			this.content = content as string | Element;
		}
	}

	getWidth(): number | 'auto'
	{
		return this.width;
	}

	setWidth(width: unknown): void
	{
		if (Type.isNumber(width) || width === 'auto')
		{
			this.width = width as number | 'auto';
		}
	}

	getZIndex(): number
	{
		const component = ZIndexManager.getComponent(this.getContainer());

		return component ? component.getZIndex() : 0;
	}

	/**
	 * @deprecated
	 */
	setZIndex(_zIndex: number): void
	{
		// Intentionally a no-op for backward compatibility.
	}

	getHeight(): number
	{
		return this.getContainer().offsetHeight;
	}

	getCategory(): string | null
	{
		return this.category;
	}

	setCategory(category: unknown): void
	{
		if (Type.isStringFilled(category) || category === null)
		{
			this.category = category as string | null;
		}
	}

	setActions(actions: unknown): void
	{
		if (Type.isArray(actions))
		{
			this.actions = [];
			(actions as Array<Record<string, unknown>>).forEach((action) => {
				this.actions.push(new Action(this, action));
			});
		}
		else if (actions === null)
		{
			this.actions = [];
		}
	}

	getActions(): Action[]
	{
		return this.actions;
	}

	getAction(id: string): Action | null
	{
		for (const action of this.actions)
		{
			if (action.getId() === id)
			{
				return action;
			}
		}

		return null;
	}

	getContainer(): HTMLElement
	{
		if (this.container !== null)
		{
			return this.container;
		}

		this.container = Tag.render`<div class="ui-notification-balloon" data-a11y-ignore-inert="true"></div>`;
		Dom.append(this.render(), this.container!);
		Event.bind(this.container!, 'mouseenter', () => this.handleMouseEnter());
		Event.bind(this.container!, 'mouseleave', () => this.handleMouseLeave());

		return this.container!;
	}

	render(): HTMLElement
	{
		const customRender = this.getCustomRender();
		if (customRender !== null)
		{
			return customRender.call(this, this);
		}

		const content = this.getContent();
		const width = this.getWidth();
		const widthStyle = Type.isNumber(width) ? `${width}px` : width;

		const message: HTMLElement = Type.isDomNode(content)
			? Tag.render`<div class="ui-notification-balloon-message"></div>`
			: Tag.render`<div class="ui-notification-balloon-message">${content ?? ''}</div>`;

		if (Type.isDomNode(content))
		{
			Dom.append(content as HTMLElement, message);
		}

		const actionsContainer: HTMLElement = Tag.render`<div class="ui-notification-balloon-actions"></div>`;
		this.getActions().forEach((action) => Dom.append(action.getContainer(), actionsContainer));

		const wrapper: HTMLElement = Tag.render`<div class="ui-notification-balloon-content"></div>`;
		Dom.style(wrapper, 'width', widthStyle as string);
		Dom.append(message, wrapper);
		Dom.append(actionsContainer, wrapper);

		if (this.isCloseButtonVisible())
		{
			Dom.append(this.getCloseButton(), wrapper);
		}

		return wrapper;
	}

	setCustomRender(render: unknown): void
	{
		if (Type.isFunction(render))
		{
			this.customRender = render as BalloonRender;
		}
	}

	getCustomRender(): BalloonRender | null
	{
		return this.customRender;
	}

	getStack(): Stack
	{
		return this.stack;
	}

	setState(state: unknown): void
	{
		const code = this.getStateCode(state as StateValue);
		if (code !== null)
		{
			this.state = state as StateValue;
		}
	}

	getState(): StateValue
	{
		return this.state;
	}

	getStateCode(mode: unknown): string | null
	{
		const entry = Object.entries(State).find(([, value]) => value === mode);

		return entry ? entry[0] : null;
	}

	activateAutoHide(): void
	{
		if (!this.getAutoHide())
		{
			return;
		}

		this.deactivateAutoHide();

		this.autoHideTimeout = setTimeout(() => this.close(), this.getAutoHideDelay());
	}

	deactivateAutoHide(): void
	{
		if (this.autoHideTimeout !== null)
		{
			clearTimeout(this.autoHideTimeout);
			this.autoHideTimeout = null;
		}
	}

	setAutoHide(autoHide: unknown): void
	{
		this.autoHide = autoHide !== false;
	}

	getAutoHide(): boolean
	{
		return this.autoHide;
	}

	setAutoHideDelay(delay: unknown): void
	{
		if (Type.isNumber(delay) && (delay as number) > 0)
		{
			this.autoHideDelay = delay as number;
		}
	}

	getAutoHideDelay(): number
	{
		return this.autoHideDelay;
	}

	animateIn(callback: () => void): void
	{
		const container = this.getContainer();
		if (Dom.hasClass(container, this.animationClassName))
		{
			callback();

			return;
		}

		const handleTransitionEnd = (): void => {
			Event.unbind(container, 'transitionend', handleTransitionEnd);
			callback();
		};
		Event.bind(container, 'transitionend', handleTransitionEnd);

		Dom.addClass(container, this.animationClassName);

		if (this.useAirDesign === true)
		{
			// Preserve the original (pre-migration) class names including the em-dash
			// in '—ui-context-content-dark' — changing it would alter visual styling.
			Dom.addClass(container, ['--air', '—ui-context-content-dark']);
		}
	}

	animateOut(callback: () => void): void
	{
		const container = this.getContainer();
		if (!Dom.hasClass(container, this.animationClassName))
		{
			callback();

			return;
		}

		const handleTransitionEnd = (): void => {
			Event.unbind(container, 'transitionend', handleTransitionEnd);
			callback();
		};
		Event.bind(container, 'transitionend', handleTransitionEnd);

		Dom.removeClass(container, this.animationClassName);
	}

	handleCloseBtnClick(): void
	{
		this.close();
	}

	handleMouseEnter(): void
	{
		this.fireEvent('onMouseEnter');
		this.deactivateAutoHide();
		this.setState(State.PAUSED);
		this.show();
	}

	handleMouseLeave(): void
	{
		this.fireEvent('onMouseLeave');
		this.activateAutoHide();
	}

	fireEvent(eventName: string): NotificationEvent
	{
		const event = this.getEvent(eventName);
		onCustomEvent(this, event.getFullName(), [event]);

		return event;
	}

	addEvent(eventName: string, fn: BalloonEventHandler): void
	{
		if (Type.isFunction(fn))
		{
			addCustomEvent(this, NotificationEvent.getFullName(eventName), fn);
		}
	}

	removeEvent(eventName: string, fn: BalloonEventHandler): void
	{
		if (Type.isFunction(fn))
		{
			removeCustomEvent(this, NotificationEvent.getFullName(eventName), fn);
		}
	}

	getEvent(eventName: string): NotificationEvent
	{
		const event = new NotificationEvent();
		event.setBalloon(this);
		event.setName(eventName);

		return event;
	}

	getData(): Record<string, unknown>
	{
		return this.data;
	}

	setData(data: unknown): void
	{
		if (Type.isPlainObject(data))
		{
			this.data = data as Record<string, unknown>;
		}
	}
}
