export type ConfirmCloseDeps = {
	// Whether the form has unsaved changes (Vuex state.isModified).
	isDirty: () => boolean;
	// Synchronously cancels the slider's close (sliderEvent.denyAction()).
	denyClose: () => void;
	// Opens the single ConfirmationDialog; resolves true when the user confirms the close.
	openConfirm: () => Promise<boolean>;
	// Re-triggers slider close after a confirmed exit (slider.close()).
	closeSlider: () => void;
};

// Close interception, mirroring the SP hub and the CRM Import wizard: on a slider close
// while dirty and not yet confirmed, deny the close synchronously (before the async dialog) and open
// exactly one ConfirmationDialog. Repeat close events while the dialog is open keep denying but never
// spawn a second dialog. Confirming sets a one-shot flag and re-closes, so the following onClose passes
// through without a loop. Dependencies are injected, keeping the guard free of runtime imports and
// unit-testable.
export class ConfirmCloseGuard
{
	#deps: ConfirmCloseDeps;
	#isCloseConfirmed: boolean = false;
	#isDialogOpen: boolean = false;

	constructor(deps: ConfirmCloseDeps)
	{
		this.#deps = deps;
	}

	handleClose(): void
	{
		if (this.#isCloseConfirmed)
		{
			// The one confirmed close is allowed through.
			return;
		}

		if (!this.#deps.isDirty())
		{
			return;
		}

		// Deny first, synchronously, before the asynchronous dialog opens.
		this.#deps.denyClose();

		if (this.#isDialogOpen)
		{
			return;
		}

		this.#isDialogOpen = true;
		this.#deps.openConfirm()
			.then((confirmed: boolean) => {
				this.#isDialogOpen = false;

				if (confirmed)
				{
					this.#isCloseConfirmed = true;
					this.#deps.closeSlider();
				}
			})
			.catch(() => {
				this.#isDialogOpen = false;
			});
	}

	get isDialogOpen(): boolean
	{
		return this.#isDialogOpen;
	}

	get isCloseConfirmed(): boolean
	{
		return this.#isCloseConfirmed;
	}
}
