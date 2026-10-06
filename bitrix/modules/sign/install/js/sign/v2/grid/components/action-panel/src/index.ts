import { Dom, Type } from 'main.core';

export class ActionPanel
{
	#storedOnClick = new Map<string, HTMLElement['onclick']>();

	toggleActionButton(id: string, enabled: boolean, title = ''): void
	{
		const button = document.getElementById(id);
		if (button === null)
		{
			return;
		}

		if (!enabled && !Dom.hasClass(button, 'ui-action-panel-item-is-disabled'))
		{
			Dom.addClass(button, 'ui-action-panel-item-is-disabled');
			Dom.attr(button, 'title', title);
			Dom.style(button, 'user-select', 'none');
			this.#storedOnClick.set(id, button.onclick);
			button.onclick = () => false;

			return;
		}

		if (enabled && Dom.hasClass(button, 'ui-action-panel-item-is-disabled'))
		{
			Dom.removeClass(button, 'ui-action-panel-item-is-disabled');
			Dom.attr(button, 'title', '');
			Dom.style(button, 'user-select', 'auto');
			button.onclick = this.#storedOnClick.get(id) ?? null;
		}
	}

	// Shows or hides a mass-action button by id. Used for actions that must not merely
	// be disabled but removed from the panel for the current selection (e.g. a bulk
	// action that does not apply to the selected row types). The grid rebuilds the
	// group panel on every selection change, so callers reapply this on selection.
	toggleActionButtonVisibility(id: string, visible: boolean): void
	{
		const button = document.getElementById(id);
		if (!Type.isElementNode(button))
		{
			return;
		}

		Dom.style(button, 'display', visible ? null : 'none');
	}
}
