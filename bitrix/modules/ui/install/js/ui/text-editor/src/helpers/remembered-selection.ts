import { type RangeSelection } from 'ui.lexical.core';

import { $restoreSelection } from './restore-selection';

/**
 * The caret a popup was opened on, kept while the popup holds the keyboard focus.
 *
 * Both users of this -- DialogPlugin and CopilotPlugin -- used to carry their own copy, and the
 * copies drifted. The one rule that is easy to get wrong is in restore(): $restoreSelection
 * declines whenever the editor still holds a live RangeSelection, and forgetting the remembered
 * caret on that answer throws away a caret nothing has consumed.
 */
export class RememberedSelection
{
	#selection: RangeSelection | null = null;

	remember(selection: RangeSelection): void
	{
		this.#selection = selection.clone();
	}

	forget(): void
	{
		this.#selection = null;
	}

	/** Puts the caret back, and forgets it only if it was actually used. */
	restore(): boolean
	{
		// $restoreSelection guards against a null argument internally
		const success: boolean = $restoreSelection(this.#selection as RangeSelection);
		if (success)
		{
			this.#selection = null;
		}

		return success;
	}
}
