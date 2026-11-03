import { Dom, Type } from 'main.core';
// The recognition lives in the extension next to the formula model it parses with; taking it from the
// facade also keeps this module clear of the stores an editor barrel would pull in.
import { recognizeFieldValue } from 'bizprocdesigner.expression-builder';

// Mirrors (does not import) the target-input resolution and caret insertion of
// bp-selector-button.js: `findTargetInput` there is not exported, so the logic is
// duplicated intentionally to keep the additive expression-builder trigger independent
// of the existing selector button.

export const SELECTOR_BUTTON_ROLE = 'bp-selector-button';

/**
 * A selector button hidden by a stylesheet: a field where picking a value was switched off on
 * purpose. Neither the trigger of the builder nor the readable layer touches such a field — the
 * rules that hide the button match it as the next sibling of its input
 * (`input#id_message_from + input[data-role="bp-selector-button"]`), so anything inserted between
 * the two would break the match and bring the hidden button back on screen.
 *
 * `display` is read off the button itself: an element inside a hidden ancestor keeps its own computed
 * display, so a form that is merely not visible yet still gets its triggers.
 */
export function isSelectorButtonHidden(button: HTMLElement): boolean
{
	return Dom.style(button, 'display') === 'none';
}

function readControlId(button: ?HTMLElement): ?string
{
	const propsAttribute = button?.getAttribute?.('data-bp-selector-props');
	if (!propsAttribute)
	{
		return null;
	}

	try
	{
		return JSON.parse(propsAttribute)?.controlId ?? null;
	}
	catch
	{
		return null;
	}
}

/**
 * Resolve the text input/textarea of a field row the expression should be inserted into.
 * Prefers the control referenced by the selector button's `controlId`, falling back to the
 * first text input/textarea within the row.
 */
export function findTargetInput(fieldRow: ?HTMLElement, button: ?HTMLElement = null): ?HTMLElement
{
	if (!fieldRow)
	{
		return null;
	}

	const controlId = readControlId(button);
	if (controlId)
	{
		const controlById = fieldRow.querySelector(`#${CSS.escape(controlId)}`);
		if (controlById)
		{
			return controlById;
		}
	}

	return fieldRow.querySelector('input[type="text"], textarea') ?? null;
}

/**
 * Resolve the container the trigger belongs to. Node settings controls wrap every field in
 * `.field-row`, while the legacy property dialog lays fields out in nested tables, where the
 * selector button and its control live in sibling cells: there the host is the closest
 * ancestor of the button that already holds the control.
 */
export function resolveFieldHost(root: ?HTMLElement, button: ?HTMLElement): ?HTMLElement
{
	const fieldRow = button?.closest('.field-row');
	if (fieldRow)
	{
		return fieldRow;
	}

	let host = button?.parentElement ?? null;
	while (host && host !== root)
	{
		if (findTargetInput(host, button))
		{
			return host;
		}

		host = host.parentElement;
	}

	return null;
}

/**
 * Write a value into the input the way typing into it would: the text goes in, then bubbling
 * `input` and `change` events follow, since the form input tracker is bound to the form, while the
 * ordinary settings form binds `input` to the control itself.
 */
function writeValue(input: HTMLElement, value: string, caret: number): boolean
{
	const target = input;

	target.value = value;
	target.selectionEnd = caret;
	target.focus();
	target.dispatchEvent(new window.Event('input', { bubbles: true }));
	target.dispatchEvent(new window.Event('change', { bubbles: true }));

	return true;
}

/**
 * Insert a value at the caret position (selectionEnd) of the input, keeping the text before
 * and after the caret.
 * Returns true when the value was inserted.
 */
export function insertExpression(input: ?HTMLElement, value: string): boolean
{
	if (!input || !Type.isStringFilled(value))
	{
		return false;
	}

	const caret = input.selectionEnd || 0;
	const beforePart = input.value.slice(0, caret);
	const afterPart = input.value.slice(caret);

	return writeValue(input, beforePart + value + afterPart, beforePart.length + value.length);
}

/**
 * A value the window lifts into its own state whole: a chain of the flat model or a reference on its
 * own, both of which the calculator is prefilled with, or a reference carrying an output modifier,
 * which the modification mode is. These are what prefillFromValue reads back, so these are what the
 * user sees before Apply. Everything else - text around a formula, two formulas in a row, a function
 * call, a reference carrying a second modifier - the window shows as it is and never rewrites.
 */
function isBuilderValue(value: string): boolean
{
	const recognized = recognizeFieldValue(value);

	return recognized.kind === 'draft' || recognized.kind === 'reference';
}

/**
 * Write what the builder assembled into the field. The whole value is replaced when the window has
 * lifted both sides into its own state: applying a second time then leaves the field with the one
 * formula instead of appending another one after it, and a chain grown out of the reference the
 * value picker left in the field takes the place of that reference instead of standing next to it.
 * Both of those are values no mode could read back, and where the second one lands would be decided
 * by the caret of a field nobody has typed in.
 * Otherwise the value is inserted at the caret: a field holding text of its own must keep it, and
 * a function call of the Functions mode goes where the caret stands, wherever the field value came
 * from.
 * Returns true when the value was written.
 */
export function applyExpression(input: ?HTMLElement, value: string): boolean
{
	if (!input || !Type.isStringFilled(value))
	{
		return false;
	}

	return (isBuilderValue(input.value) && isBuilderValue(value))
		? writeValue(input, value, value.length)
		: insertExpression(input, value)
	;
}
