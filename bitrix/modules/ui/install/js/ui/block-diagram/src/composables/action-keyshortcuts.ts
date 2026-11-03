import { computed } from 'ui.vue3';

import { useBlockDiagram } from './block-diagram';
import { formatComboKeyshortcuts } from '../utils';

/**
 * The combo an action runs, spelled the way `aria-keyshortcuts` declares it. The counterpart of
 * `useActionShortcut()`: the same combo, addressed to a screen reader instead of to the eye.
 *
 * The announcement follows a replacement of the set of bindings, and an action holding no combo reads
 * as null - that is what leaves the attribute off the element.
 *
 * Call it from `setup()`: it stands on the context of `useBlockDiagram()`, which is looked up
 * through the instance of the Vue application.
 *
 * @param {string} actionId id of the action, an unknown one included: it reads as no combo
 * @returns {ComputedRef<string | null>}
 */
export function useActionKeyshortcuts(actionId)
{
	const { actionRegistry } = useBlockDiagram();

	return computed(() => formatComboKeyshortcuts(actionRegistry.getCombo(actionId)));
}
