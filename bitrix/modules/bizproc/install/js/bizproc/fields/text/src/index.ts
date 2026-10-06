import 'ui.design-tokens';
import 'ui.icon-set.outline';

import './style.css';

import { Loc } from 'main.core';
import { BaseField, FieldRegistry, type RenderedControl } from 'bizproc.fields';

class TextField extends BaseField
{
	protected getDefaultPlaceholder(): string
	{
		return Loc.getMessage('BIZPROC_FIELDS_TEXT_PLACEHOLDER') ?? '';
	}

	renderControl(value: string | string[] | null): RenderedControl
	{
		return this.renderTextControl({
			blockClass: 'bizproc-fields-text',
			value,
			multiline: true,
		});
	}
}

FieldRegistry.register('text', TextField);

export { TextField };
