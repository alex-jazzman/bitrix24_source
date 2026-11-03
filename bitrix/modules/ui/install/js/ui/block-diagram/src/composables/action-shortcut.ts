import { computed } from 'ui.vue3';

import { useBlockDiagram } from './block-diagram';
import { formatComboCaption } from '../utils';

/**
 * The caption of the combo an action runs, spelled for the current platform. The single place where
 * "read the combo of an action, format it" lives: a place of display asks by action id and gets a
 * string ready for the screen.
 *
 * The caption follows a replacement of the set of bindings - reading the combo makes the computed a
 * follower of it - and an action holding no combo reads as an empty string. That is a regular path,
 * not a failure: the map of the canvas ships without a combo on macOS, where the system takes the
 * one it would use.
 *
 * Call it from `setup()`: it stands on the context of `useBlockDiagram()`, which is looked up
 * through the instance of the Vue application.
 *
 * @param {string} actionId id of the action, an unknown one included: it reads as no combo
 * @returns {ComputedRef<string>}
 */
export function useActionShortcut(actionId)
{
	const { actionRegistry } = useBlockDiagram();

	return computed(() => formatComboCaption(actionRegistry.getCombo(actionId)));
}
