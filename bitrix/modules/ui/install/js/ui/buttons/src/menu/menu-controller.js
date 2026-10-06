import { Type } from 'main.core';

export type MenuControllerCallbacks = {
	getBindElement: () => HTMLElement,
	onShow: () => void,
	onClose: () => void,
};

/**
 * The single criterion of a menu being set: a button and ButtonManager must not diverge here.
 */
export function hasMenuItems(options: Object | false): boolean
{
	return Type.isPlainObject(options) && Type.isArray(options.items) && options.items.length > 0;
}

/**
 * A contract between a button and its menu implementation.
 * The button owns the click handler and its own state, the controller owns the menu instance.
 *
 * @namespace {BX.UI}
 */
export default class MenuController
{
	#options: Object;
	#callbacks: MenuControllerCallbacks;

	constructor(options: Object, callbacks: MenuControllerCallbacks)
	{
		this.#options = options;
		this.#callbacks = callbacks;
	}

	/**
	 * An implementation may be asynchronous, then the returned promise is fulfilled when the opening is over
	 * and rejected with a reason when it has failed. A fulfilled promise does not mean the menu is open: an
	 * implementation skips the opening when the menu is already shown, is already opening or is destroyed.
	 */
	show(): Promise<void> | void
	{
		throw new Error('BX.UI.MenuController: Must be implemented by a subclass');
	}

	close(): void
	{
		throw new Error('BX.UI.MenuController: Must be implemented by a subclass');
	}

	isShown(): boolean
	{
		throw new Error('BX.UI.MenuController: Must be implemented by a subclass');
	}

	destroy(): void
	{
		throw new Error('BX.UI.MenuController: Must be implemented by a subclass');
	}

	getMenu(): Object | null
	{
		throw new Error('BX.UI.MenuController: Must be implemented by a subclass');
	}

	/**
	 * @protected
	 */
	getOptions(): Object
	{
		return this.#options;
	}

	/**
	 * @protected
	 */
	getBindElement(): HTMLElement
	{
		return this.#callbacks.getBindElement();
	}

	/**
	 * @protected
	 */
	notifyShow(): void
	{
		this.#callbacks.onShow();
	}

	/**
	 * @protected
	 */
	notifyClose(): void
	{
		this.#callbacks.onClose();
	}
}
