import { Dom, Loc, Type } from 'main.core';
import { FocusTrap, type RestoreFocus } from 'ui.a11y';

const DIALOG_CLASS = 'bizproc-a11y-dialog';

export type DialogOptions = {
	label?: string,
	restoreTo?: RestoreFocus,
	looped?: boolean,
};

export type DialogHandle = {
	destroy: () => void,
};

export function setupDialog(container: HTMLElement, options: DialogOptions = {}): DialogHandle
{
	const label = Type.isStringFilled(options.label)
		? options.label
		: Loc.getMessage('BIZPROC_JS_A11Y_DIALOG_DEFAULT_LABEL');

	Dom.attr(container, {
		role: 'dialog',
		'aria-modal': 'true',
		'aria-label': label,
	});
	Dom.addClass(container, DIALOG_CLASS);

	const focusTrap = new FocusTrap(container, {
		initialFocus: ['[data-autofocus]', 'container'],
		restoreFocus: options.restoreTo ?? true,
		looped: options.looped ?? true,
		isolateOutside: true,
	});
	focusTrap.activate();

	return {
		destroy(): void
		{
			focusTrap.destroy();
			Dom.attr(container, {
				role: null,
				'aria-modal': null,
				'aria-label': null,
			});
			Dom.removeClass(container, DIALOG_CLASS);
		},
	};
}

export function setBusy(container: HTMLElement, isBusy: boolean): void
{
	Dom.attr(container, 'aria-busy', isBusy ? 'true' : null);
}
