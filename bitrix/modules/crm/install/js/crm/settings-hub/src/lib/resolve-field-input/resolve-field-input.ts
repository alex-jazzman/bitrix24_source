import { type ScalarRecord } from '../../const/record';

export type FieldInputType = 'text' | 'number';

// The default field control renders a plain text input unless the record declares an input type:
// that restores the numeric input of the legacy days-before-close field.
export function resolveFieldInputType(descriptor: ScalarRecord): FieldInputType
{
	return descriptor.field?.inputType ?? 'text';
}
