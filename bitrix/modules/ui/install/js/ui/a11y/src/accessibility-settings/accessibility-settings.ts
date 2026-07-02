import { Extension } from 'main.core';

export class AccessibilitySettings
{
	static useFocusTrapInDialogs(): boolean
	{
		const settings = Extension.getSettings('ui.a11y');

		return settings.get('useFocusTrapInDialogs') === true;
	}

	static restoreLostFocus(): boolean
	{
		const settings = Extension.getSettings('ui.a11y');

		return settings.get('restoreLostFocus') === true;
	}

	static suppressFocusOnRestore(): boolean
	{
		const settings = Extension.getSettings('ui.a11y');

		return settings.get('suppressFocusOnRestore') === true;
	}
}
