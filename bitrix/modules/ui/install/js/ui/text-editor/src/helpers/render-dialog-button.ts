import { Dom, Tag } from 'main.core';

export type DialogButtonOptions = {
	className: string,
	icon: string,
	ariaLabel: string | null,
	testId: string,
	onClick: (event: MouseEvent) => void,
};

/**
 * An icon-only action button of an editor dialog: save, cancel, edit, unlink.
 *
 * The icon carries no text, so the accessible name comes from aria-label alone — which is why
 * every such button goes through here instead of being written out at each call site. The name
 * is written with Dom.attr rather than interpolated: it may be absent on a portal without the
 * phrase, and only Dom.attr leaves the attribute out instead of writing the word "undefined".
 */
export function renderDialogButton(options: DialogButtonOptions): HTMLButtonElement
{
	const button: HTMLButtonElement = Tag.render`
		<button
			type="button"
			class="${options.className}"
			onclick="${options.onClick}"
			data-testid="${options.testId}"
		>
			<span class="ui-icon-set --${options.icon}"></span>
		</button>
	`;

	Dom.attr(button, 'aria-label', options.ariaLabel);

	return button;
}
