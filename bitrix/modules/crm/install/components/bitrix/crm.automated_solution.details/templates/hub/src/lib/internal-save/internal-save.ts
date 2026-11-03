export type InternalSaveDeps = {
	// Dispatches the store `save` action (the request, the error banner and the promo-slider all live
	// inside it).
	dispatchSave: () => Promise<void>;
	// Refreshes the App baseline snapshot: the saved state becomes the new revert target (AC-02.8),
	// otherwise Cancel would roll the form back past this save.
	commitSnapshot: () => void;
	reportSuccess: () => void;
	reportError: () => void;
};

// Save triggered from inside a form control (the "save is required to proceed" popup): on success the
// baseline snapshot is refreshed and only then the analytics is sent; on failure the error is
// re-thrown, so the caller does not continue with the flow that required the save. Pure, so the
// ordering and the snapshot contract are unit-testable without a Vue/Vuex runtime.
export function runInternalSave(deps: InternalSaveDeps): Promise<void>
{
	return deps.dispatchSave()
		.then(() => {
			deps.commitSnapshot();
			deps.reportSuccess();
		})
		.catch((error: unknown) => {
			deps.reportError();

			throw error;
		});
}
