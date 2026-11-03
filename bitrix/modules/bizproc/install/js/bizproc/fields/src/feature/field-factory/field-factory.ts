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
 * Insertion is off unless a caller asks for it by name - the permanent rule, not a wait for
 * something unfinished. The designer provider lives in bizprocdesigner, which bizproc does not
 * depend on, so the only adapter the framework could reach for on its own is the automation one -
 * and NewDesigner, the default render mode, is exactly what that adapter is wrong for.
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
