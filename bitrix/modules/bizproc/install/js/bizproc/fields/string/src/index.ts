import 'ui.design-tokens';
import 'ui.icon-set.outline';

import './style.css';

import { Loc } from 'main.core';
import { BaseField, FieldRegistry, type RenderedControl } from 'bizproc.fields';

/**
 * Concrete string field type.
 *
 * Renders an editable single-line text control through the base field's default text
 * control, styled by its own `bizproc-fields-string*` classes.
 *
 * Value handling (getValue/setValue), multiple cloning and the selection provider are
 * inherited from BaseField: the inner `<input>` is the value node of the returned pair,
 * so the base machinery reads/writes its `.value` transparently.
 */
class StringField extends BaseField
{
	protected getDefaultPlaceholder(): string
	{
		return Loc.getMessage('BIZPROC_FIELDS_STRING_PLACEHOLDER') ?? '';
	}

	renderControl(value: string | string[] | null): RenderedControl
	{
		return this.renderTextControl({
			blockClass: 'bizproc-fields-string',
			value,
			rowTestId: false,
		});
	}
}

FieldRegistry.register('string', StringField);

export { StringField };
