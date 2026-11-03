import { type HubBaseline } from '../hub-baseline/hub-baseline';

export type RevertibleStore = {
	revertToSnapshot: () => void;
};

// An imperative control (relation / custom-section) restores its own internal state (TagSelectors,
// section list) from the baseline it is handed; the store never drives their DOM.
export type ImperativeControl = {
	applySnapshot?: (baseline: HubBaseline) => void;
	reset?: (baseline: HubBaseline) => void;
};

// Cancel orchestration: revert the store to the saved snapshot, read the baseline back and hand it to
// every imperative control (applySnapshot preferred, reset as fallback). The baseline MUST be read after
// the revert and passed explicitly: the parent re-renders in a microtask, so a control reading its own
// `snapshot` prop inside the click handler would still restore itself from the pre-revert values. Pure so
// that ordering is unit-testable with fakes without a Vue runtime.
export function revertForm(
	store: RevertibleStore,
	controls: ImperativeControl[],
	readBaseline: () => HubBaseline,
): void
{
	store.revertToSnapshot();

	const baseline = readBaseline();

	controls.forEach((control) => {
		if (control.applySnapshot)
		{
			control.applySnapshot(baseline);

			return;
		}

		control.reset?.(baseline);
	});
}
