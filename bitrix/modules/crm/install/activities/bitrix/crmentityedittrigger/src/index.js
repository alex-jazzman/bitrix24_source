import { Type } from 'main.core';

const CURRENT_RENDERER_NAME = 'CrmEntityFieldChangedTriggerRenderer';

/**
 * Alias of the current trigger renderer. The server builds the form of a node of this legacy type
 * from the current activity class, so the same renderer has to serve it: the editor resolves the
 * renderer by the node type of its own state and knows nothing about the substitution.
 *
 * The name is resolved on instantiation, not on load: the editor page attaches the renderers of the
 * whole node catalog in no guaranteed order. Instantiating the current renderer here keeps the alias
 * free of any logic of its own, so a change of behaviour stays a change of a single file.
 *
 * With the current renderer unavailable the alias degrades to "no renderer at all" instead of
 * raising: the form keeps its standard controls and stays fully usable.
 */
export class CrmEntityEditTriggerRenderer
{
	constructor()
	{
		const CurrentRenderer = window[CURRENT_RENDERER_NAME];

		return Type.isFunction(CurrentRenderer) ? new CurrentRenderer() : this;
	}
}
