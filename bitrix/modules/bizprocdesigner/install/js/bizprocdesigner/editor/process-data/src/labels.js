import { Loc, Type } from 'main.core';

import { type Purpose } from 'bizprocdesigner.editor.chart';

export function purposeLabel(purpose: Purpose): string
{
	return Loc.getMessage(`BIZPROCDESIGNER_EDITOR_PROCESS_DATA_PURPOSE_${purpose.toUpperCase()}`) ?? '';
}

// A template older than the window may carry a type the form does not offer; its own name says more
// than an empty cell.
export function typeLabel(type: ?string): string
{
	if (!Type.isStringFilled(type))
	{
		return '';
	}

	return Loc.getMessage(`BIZPROCDESIGNER_EDITOR_PROCESS_DATA_FORM_TYPE_${type.toUpperCase()}`) ?? type;
}
