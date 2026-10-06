import { Dom, Type } from 'main.core';

const DEFAULT_CONTROL_SELECTOR = 'input:not([type="hidden"]), select, textarea';
// keeps the description the control had before it was marked, to restore it on cleanup
const KEPT_DESCRIPTION_ATTRIBUTE = 'data-bizproc-a11y-kept-describedby';

export type InvalidControl = {
	name: string,
	messageId?: string | null,
};

export type InvalidControlsOptions = {
	controlSelector?: string,
};

function collectControls(root: HTMLElement, options?: InvalidControlsOptions): HTMLElement[]
{
	const selector = Type.isStringFilled(options?.controlSelector)
		? (options?.controlSelector as string)
		: DEFAULT_CONTROL_SELECTOR;

	return [...root.querySelectorAll<HTMLElement>(selector)];
}

function isControlOfField(control: HTMLElement, name: string): boolean
{
	// a multiple field names its controls with brackets, a date field adds a timezone select
	// under another name
	const controlName = (control as HTMLInputElement).name;

	return controlName === name || controlName === `${name}[]`;
}

function describeWithMessage(control: HTMLElement, messageId: string): void
{
	const current = control.getAttribute('aria-describedby');
	if (current !== null && !control.hasAttribute(KEPT_DESCRIPTION_ATTRIBUTE))
	{
		Dom.attr(control, KEPT_DESCRIPTION_ATTRIBUTE, current);
	}

	const ids = (current ?? '').split(' ').filter((id) => id !== '');
	if (!ids.includes(messageId))
	{
		ids.push(messageId);
	}

	Dom.attr(control, 'aria-describedby', ids.join(' '));
}

/**
 * Marks controls of the given fields as invalid and binds each of them to its error message.
 * Returns the first marked control so the caller can move the focus to it.
 */
export function markInvalidControls(
	root: HTMLElement,
	fields: InvalidControl[],
	options?: InvalidControlsOptions,
): HTMLElement | null
{
	if (!Type.isDomNode(root) || !Type.isArrayFilled(fields))
	{
		return null;
	}

	const controls = collectControls(root, options);
	let first: HTMLElement | null = null;

	fields.forEach((field) => {
		if (!Type.isStringFilled(field?.name))
		{
			return;
		}

		controls
			.filter((control) => isControlOfField(control, field.name))
			.forEach((control) => {
				Dom.attr(control, 'aria-invalid', 'true');

				if (Type.isStringFilled(field.messageId))
				{
					describeWithMessage(control, field.messageId as string);
				}

				first ??= control;
			})
		;
	});

	return first;
}

export function clearInvalidControls(root: HTMLElement, options?: InvalidControlsOptions): void
{
	if (!Type.isDomNode(root))
	{
		return;
	}

	collectControls(root, options)
		.filter((control) => control.hasAttribute('aria-invalid'))
		.forEach((control) => {
			Dom.attr(control, 'aria-invalid', null);

			const kept = control.getAttribute(KEPT_DESCRIPTION_ATTRIBUTE);
			Dom.attr(control, 'aria-describedby', kept === '' ? null : kept);
			Dom.attr(control, KEPT_DESCRIPTION_ATTRIBUTE, null);
		})
	;
}

/**
 * Fallback for errors that came without a field key: the first required control left empty.
 */
export function findUnfilledRequiredControl(root: HTMLElement, options?: InvalidControlsOptions): HTMLElement | null
{
	if (!Type.isDomNode(root))
	{
		return null;
	}

	return collectControls(root, options).find((control) => (
		control.getAttribute('aria-required') === 'true'
		&& (control as HTMLInputElement).value === ''
	)) ?? null;
}
