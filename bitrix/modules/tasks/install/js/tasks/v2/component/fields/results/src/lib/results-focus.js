import { Type } from 'main.core';
import { FocusMonitor } from 'ui.a11y';

export function captureFocusTrigger(): HTMLElement | null
{
	const active = document.activeElement;

	return (active && active !== document.body) ? active : null;
}

export function restoreFocusTrigger(trigger: HTMLElement | null): void
{
	if (trigger && trigger.isConnected && Type.isFunction(trigger.focus))
	{
		trigger.focus();

		return;
	}

	FocusMonitor.Instance.restoreFocus();
}
