// The cancel event is reported only on the actual close path: immediately when the form is clean, or
// on the re-close that follows a confirmed exit. While the confirmation dialog is pending, the close
// was denied and nothing is reported yet.
export function canRegisterCancelEvent(isDirty: boolean, isCloseConfirmed: boolean): boolean
{
	return !isDirty || isCloseConfirmed;
}

// The slider fires onCloseByEsc right before onClose, so a dirty form loses the Esc attribution: the
// close is intercepted by the dialog, and the event that actually reports the cancel is the re-close,
// which knows no element. The Esc element is deferred until then and wins over the element of that
// close (null). Prod always reported ELEMENT_ESC_BUTTON (LBS 5.4).
export function resolveCancelElement(deferredElement: string | null, element: string | null): string | null
{
	return deferredElement ?? element;
}
