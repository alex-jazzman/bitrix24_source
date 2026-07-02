import Type from '../type';
import EventEmitter from '../event/event-emitter';

import type ZIndexStack from './z-index-stack';
import type { ZIndexComponentOptions } from './z-index-component-options';

export default class ZIndexComponent extends EventEmitter
{
	sort: number = 0;
	alwaysOnTop: boolean | number = false;
	zIndex: number = 0;
	element: HTMLElement | null = null;
	overlay: HTMLElement | null = null;
	overlayGap: number = -5;
	stack: ZIndexStack | null = null;

	constructor(element: HTMLElement, componentOptions: ZIndexComponentOptions = {})
	{
		super();
		this.setEventNamespace('BX.Main.ZIndexManager.Component');

		if (!Type.isElementNode(element))
		{
			throw new Error("ZIndexManager.Component: The argument 'element' must be a DOM element.");
		}

		this.element = element;

		const options = Type.isPlainObject(componentOptions)
			? componentOptions as Record<string, any>
			: {} as Record<string, any>;

		this.setAlwaysOnTop(options.alwaysOnTop as boolean | number);
		this.setOverlay(options.overlay as HTMLElement);
		this.setOverlayGap(options.overlayGap as number);

		this.subscribeFromOptions(options.events as { [eventName: string]: Function });
	}

	getSort(): number
	{
		return this.sort;
	}

	/**
	 * @internal
	 * @param sort
	 */
	setSort(sort: number): void
	{
		if (Type.isNumber(sort))
		{
			this.sort = sort;
		}
	}

	/**
	 * @internal
	 * @param stack
	 */
	setStack(stack: ZIndexStack): void
	{
		this.stack = stack;
	}

	getStack(): ZIndexStack | null | undefined
	{
		return this.stack;
	}

	getZIndex(): number
	{
		return this.zIndex;
	}

	/**
	 * @internal
	 */
	setZIndex(zIndex: number): void
	{
		const changed = this.getZIndex() !== zIndex;

		this.getElement()!.style.setProperty('z-index', String(zIndex), 'important');
		this.zIndex = zIndex;

		if (this.getOverlay() !== null)
		{
			this.getOverlay()!.style.setProperty('z-index', String(zIndex + this.getOverlayGap()), 'important');
		}

		if (changed)
		{
			this.emit('onZIndexChange', { component: this });
		}
	}

	getAlwaysOnTop(): boolean | number
	{
		return this.alwaysOnTop;
	}

	setAlwaysOnTop(value: boolean | number): void
	{
		if (Type.isNumber(value) || Type.isBoolean(value))
		{
			this.alwaysOnTop = value;
		}
	}

	getElement(): HTMLElement | null
	{
		return this.element;
	}

	setOverlay(overlay: HTMLElement, gap?: number): void
	{
		if (Type.isElementNode(overlay) || overlay === null)
		{
			this.overlay = overlay;
			this.setOverlayGap(gap as number);

			if (this.getStack())
			{
				this.getStack()!.sort();
			}
		}
	}

	getOverlay(): HTMLElement | null | undefined
	{
		return this.overlay;
	}

	setOverlayGap(gap: number): void
	{
		if (Type.isNumber(gap))
		{
			this.overlayGap = gap;
		}
	}

	getOverlayGap(): number
	{
		return this.overlayGap;
	}
}
