import { Dom, Tag, Type } from 'main.core';

/** The controls holding text of their own, as against a dropdown holding options. */
type TextWriteTarget = HTMLInputElement | HTMLTextAreaElement;

/** The control an inserted value is written into: the node the type of the field declared for it. */
export type WriteTarget = TextWriteTarget | HTMLSelectElement;

/**
 * The option a dropdown carries an inserted expression in. The role is the one the automation
 * selector writes and reads it under (InlineSelector.onFieldSelect), so a control decorated by
 * either provider answers with the same single option.
 */
const EXPRESSION_OPTION_ROLE = 'expression';

/**
 * Whether the control says of itself that an inserted value takes the place of what it holds. The
 * attribute is the one the automation selector reads under the same name
 * (InlineSelector.parseTargetProperties), so a control declares the mode once for every provider.
 */
export function declaresWriteOver(target: WriteTarget): boolean
{
	return target.getAttribute('data-select-mode') === 'replace';
}

/**
 * Insert at the caret, keeping the text on both sides of it: a field holding text of its own has to
 * keep it, and the caret is where the user left off. A selected range is what the insertion takes
 * the place of - selecting text is how the user says which of it to write over.
 *
 * A dropdown has neither caret nor text to keep, so the mode makes no difference there and the
 * value goes in the one way it can (see selectExpression).
 */
export function insertAtCaret(target: WriteTarget, value: string): void
{
	if (target instanceof HTMLSelectElement)
	{
		selectExpression(target, value);

		return;
	}

	const end = target.selectionEnd ?? target.value.length;
	const start = target.selectionStart ?? end;
	const before = target.value.slice(0, start);
	const after = target.value.slice(end);

	write(target, before + value + after, before.length + value.length);
}

/** Write over whatever the control holds. */
export function writeOver(target: WriteTarget, value: string): void
{
	if (target instanceof HTMLSelectElement)
	{
		selectExpression(target, value);

		return;
	}

	write(target, value, value.length);
}

/**
 * The value goes in, the caret lands after what was inserted, and the field is told about it (see
 * announce).
 */
function write(target: TextWriteTarget, value: string, caret: number): void
{
	// eslint-disable-next-line no-param-reassign -- writing into the passed control is the purpose of the helper
	target.value = value;
	// eslint-disable-next-line no-param-reassign -- the caret belongs to the control just written into
	target.selectionEnd = caret;
	announce(target);
}

/**
 * The expression becomes the option that stands selected: a dropdown holds options and not text, so
 * this is the whole of what a write into one can be, and it is what the automation selector does
 * with such a control too (InlineSelector.onFieldSelect). The option is rewritten and not added
 * again, so an insertion repeated over the same control leaves the list the same length.
 */
function selectExpression(target: HTMLSelectElement, value: string): void
{
	const option = expressionOption(target);
	option.value = value;
	option.textContent = value;
	option.selected = true;

	announce(target);
}

/** The option of the dropdown an inserted expression lives in, added on the first insertion. */
function expressionOption(target: HTMLSelectElement): HTMLOptionElement
{
	const found = target.querySelector<HTMLOptionElement>(`option[data-role="${EXPRESSION_OPTION_ROLE}"]`);

	if (!Type.isNull(found))
	{
		return found;
	}

	const option: HTMLOptionElement = Tag.render`<option data-role="${EXPRESSION_OPTION_ROLE}"></option>`;
	Dom.append(option, target);

	return option;
}

/**
 * The field is told about the write with `change` alone - the way the automation provider announces
 * an insertion and the way the types listen for one. No `input`: a type that filters typing does it
 * on `input` (BaseField.bindInputFilter), and that filter over an inserted expression would strip it
 * down to what the type accepts typed by hand.
 */
function announce(target: WriteTarget): void
{
	target.focus();
	target.dispatchEvent(new globalThis.Event('change', { bubbles: true }));
}
