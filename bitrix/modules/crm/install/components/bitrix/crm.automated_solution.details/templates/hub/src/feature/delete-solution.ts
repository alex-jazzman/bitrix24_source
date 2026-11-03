import { Builder, Dictionary } from 'crm.integration.analytics';
import { sendData as sendAnalyticsData } from 'ui.analytics';

import { closeSliderOrRedirect } from './save-solution';

export type DeleteSolutionDeps = {
	getStore: () => any;
	setWaiting: (waiting: boolean) => void;
	markCancelEventRegistered: () => void;
	unmarkCancelEventRegistered: () => void;
};

// Delete flow, parity with prod Main.delete(): NO client confirmation. The
// cancel-dedup flag is set BEFORE the request (the slider starts to close before the promise resolves)
// and rolled back on failure. The store `delete` action shows the sliderCode promo AND the error banner
// (potential double show, carried as-is). Analytics: DeleteEvent success/error with element
// = ELEMENT_DELETE_BUTTON; HAS_BOUND_TYPES rejection surfaces as the text error banner.
export class DeleteSolution
{
	#deps: DeleteSolutionDeps;

	constructor(deps: DeleteSolutionDeps)
	{
		this.#deps = deps;
	}

	execute(): void
	{
		const store = this.#deps.getStore();
		const builder: any = (new Builder.Automation.AutomatedSolution.DeleteEvent())
			.setId(store.state.automatedSolution.id)
			.setElement(Dictionary.ELEMENT_DELETE_BUTTON);

		// Set here because the slider starts to close before the promise resolves (prod comment).
		this.#deps.markCancelEventRegistered();
		this.#deps.setWaiting(true);

		store.dispatch('delete')
			.then(() => {
				sendAnalyticsData(builder.setStatus(Dictionary.STATUS_SUCCESS).buildData());

				closeSliderOrRedirect();
			})
			.catch(() => {
				sendAnalyticsData(builder.setStatus(Dictionary.STATUS_ERROR).buildData());

				// Errors are displayed reactively via the store banner; the slider may not close after all.
				this.#deps.unmarkCancelEventRegistered();
			})
			.finally(() => this.#deps.setWaiting(false));
	}
}
