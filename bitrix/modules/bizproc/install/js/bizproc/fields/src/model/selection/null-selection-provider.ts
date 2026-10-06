import {type Property} from '../../const/type';
import {type SelectionContext, type SelectionProvider} from './selection';

export class NullSelectionProvider implements SelectionProvider
{
	isAvailable(): boolean
	{
		return false;
	}

	supports(_property: Property): boolean
	{
		return false;
	}

	decorate(
		controlNode: HTMLElement,
		_property: Property,
		_context: SelectionContext,
	): HTMLElement
	{
		return controlNode;
	}

	decorateByRole(
		_role: string,
		controlNode: HTMLElement,
		_property: Property,
		_context: SelectionContext,
	): HTMLElement
	{
		return controlNode;
	}
}
