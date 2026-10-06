import 'ui.design-tokens';
import 'ui.icon-set.outline';

import './style.css';

import { Loc } from 'main.core';
import { BaseField, FieldRegistry, type RenderedControl } from 'bizproc.fields';

const VALUE_INPUT_SELECTOR: string = '.bizproc-fields-int__input';

/**
 * Reduces an arbitrary string to an integer representation: an optional single leading `-`
 * followed by digits. Everything else - a `-` in the middle, letters, dots, spaces and
 * separators - is stripped.
 */
function sanitizeInteger(raw: string): string
{
	const negative = raw.startsWith('-');
	const digits = raw.replace(/\D/g, '');

	return (negative ? '-' : '') + digits;
}

/**
 * Concrete integer field type.
 *
 * Renders an editable single-line numeric control through the base field's default text
 * control, styled by its own `bizproc-fields-int*` classes. Structurally identical to
 * StringField (a single `<input type="text">`), but the interactive input is filtered to
 * an integer while typing/pasting: only digits and one leading `-` survive.
 *
 * Value handling (getValue/setValue), multiple cloning and the selection provider are
 * inherited from BaseField: the inner `<input>` is the value node of the returned pair, so
 * the base machinery reads/writes its `.value` transparently.
 *
 * The integer rule is attached through bindInputFilter(), which listens on the interactive
 * `input` event only. That is what keeps the value model tolerant of strings: setValue()
 * writes `.value` without dispatching `input`, so programmatic values (e.g. future macro-string
 * insertion like `{{Document:PROPERTY}}`) pass through unfiltered. setValue/getValue are
 * intentionally NOT overridden.
 */
class IntField extends BaseField
{
	protected getDefaultPlaceholder(): string
	{
		return Loc.getMessage('BIZPROC_FIELDS_INT_PLACEHOLDER') ?? '';
	}

	/**
	 * `inputmode="numeric"` requests a numeric keyboard on mobile.
	 */
	renderControl(value: string | string[] | null): RenderedControl
	{
		const control = this.renderTextControl({
			blockClass: 'bizproc-fields-int',
			value,
			inputMode: 'numeric',
		});

		this.bindInputFilter(control.root, VALUE_INPUT_SELECTOR, sanitizeInteger);

		return control;
	}
}

FieldRegistry.register('int', IntField);

export { IntField };
