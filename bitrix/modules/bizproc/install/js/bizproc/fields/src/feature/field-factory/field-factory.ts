import { Type } from 'main.core';
import { type BaseField, type BaseFieldParams } from '../../model/base-field/base-field';
import { FieldRegistry } from '../field-registry/field-registry';
import { type RenderFieldParams } from '../../const/type';
import { type SelectionProvider } from '../../model/selection/selection';
import { NullSelectionProvider } from '../../model/selection/null-selection-provider';

/**
 * Field params plus the caller's say on value insertion: a provider is taken as given,
 * `null` and an omitted field both mean "insert nothing" - see resolveSelectionProvider().
 */
export type CreateFieldParams = RenderFieldParams & {
	selectionProvider?: SelectionProvider | null,
};

/**
 * The single place where "insertion provider or no-op" is decided. The domain must not reach
 * for the automation extension and infrastructure must not reach for the domain, so the choice
 * lives in the only layer allowed to see both.
 *
 * Insertion is off unless a caller asks for it by name. The automation adapter is wired but
 * unfinished - it carries none of the target attributes the inline selector filters values by,
 * and the value it inserts reaches neither the select nor a backend-rendered control - so a
 * field that picked it up on its own would offer a `...` button that quietly loses what the
 * user chose. Until insertion is implemented the button stays a stub that does nothing, and
 * whoever finishes it turns the default back on here.
 */
export function resolveSelectionProvider(provider?: SelectionProvider | null): SelectionProvider
{
	// Nil covers both the omitted field and an explicit null: neither asks for insertion.
	if (Type.isNil(provider))
	{
		return new NullSelectionProvider();
	}

	return provider;
}

export class FieldFactory
{
	static create(type: string, params: CreateFieldParams): BaseField | null
	{
		const FieldClass = FieldRegistry.get(type);

		if (Type.isNull(FieldClass))
		{
			return null;
		}

		const fieldParams: BaseFieldParams = {
			...params,
			selectionProvider: resolveSelectionProvider(params.selectionProvider),
		};

		return new (FieldClass as new (params: BaseFieldParams) => BaseField)(fieldParams);
	}
}
