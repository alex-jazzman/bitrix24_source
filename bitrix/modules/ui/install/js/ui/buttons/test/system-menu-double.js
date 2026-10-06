import { Reflection } from 'main.core';

// ui.system.menu is not available in the ui.buttons test environment, so the menu class is replaced by a double.
const systemMenuNamespace = Reflection.namespace('BX.UI.System');

export const menuInstances = [];

export function createSystemMenuClass(): Function
{
	return class SystemMenuDouble {
		constructor(options)
		{
			this.options = options;
			this.popup = null;
			this.bindElement = null;
			this.destroyed = false;
			menuInstances.push(this);
		}

		show(bindElement)
		{
			// a destroyed popup is not shown again, as in main.popup
			if (this.destroyed)
			{
				return;
			}

			this.bindElement = bindElement;
			this.popup ??= { shown: false, isShown: () => this.popup.shown };
			this.popup.shown = true;
		}

		close()
		{
			this.popup.shown = false;
			this.options.events?.onClose?.();
		}

		destroy()
		{
			// main.popup ignores a repeated destroy, while ui.system.menu calls it again from its own onDestroy
			if (this.destroyed)
			{
				return;
			}

			this.destroyed = true;
			this.popup.shown = false;
			// a destroyed popup reports onDestroy only, onClose does not come after it
			this.options.events?.onDestroy?.();
		}

		getPopup()
		{
			return this.popup;
		}
	};
}

export function registerSystemMenuClass(): Function
{
	systemMenuNamespace.Menu = createSystemMenuClass();

	return systemMenuNamespace.Menu;
}

export function resetSystemMenuDouble(): void
{
	delete systemMenuNamespace.Menu;
	menuInstances.length = 0;
}
