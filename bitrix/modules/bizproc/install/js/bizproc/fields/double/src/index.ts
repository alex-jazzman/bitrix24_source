import 'ui.design-tokens';
import 'ui.icon-set.outline';

import './style.css';

import { Loc } from 'main.core';
import { BaseField, FieldRegistry, type RenderedControl } from 'bizproc.fields';

const VALUE_INPUT_SELECTOR: string = '.bizproc-fields-double__input';

/**
 * Reduces an arbitrary string to a decimal representation: an optional single leading `-`,
 * digits and at most one fractional separator. Both `.` and `,` are accepted verbatim - the
 * first one encountered wins and any later separator is stripped.
 */
function sanitizeDecimal(raw: string): string
{
	const negative = raw.startsWith('-');
	const rest = negative ? raw.slice(1) : raw;

	let digits = '';
	let separatorUsed = false;

	for (const char of rest)
	{
		if (char >= '0' && char <= '9')
		{
			digits += char;
		}
		else if ((char === '.' || char === ',') && !separatorUsed)
		{
			digits += char;
			separatorUsed = true;
		}
	}

	return (negative ? '-' : '') + digits;
}

class DoubleField extends BaseField
{
	protected getDefaultPlaceholder(): string
	{
		return Loc.getMessage('BIZPROC_FIELDS_DOUBLE_PLACEHOLDER') ?? '';
	}

	/**
	 * A comma is the decimal separator here (see sanitizeDecimal), so a scalar value is one
	 * number and never a comma-separated list: `1,5` is a single value, not `1` and `5`.
	 */
	protected splitsScalarValue(): boolean
	{
		return false;
	}

	renderControl(value: string | string[] | null): RenderedControl
	{
		const control = this.renderTextControl({
			blockClass: 'bizproc-fields-double',
			value,
			inputMode: 'decimal',
		});

		this.bindInputFilter(control.root, VALUE_INPUT_SELECTOR, sanitizeDecimal);

		return control;
	}
}

FieldRegistry.register('double', DoubleField);

export { DoubleField };
