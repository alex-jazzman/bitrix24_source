// The ringer is raised for a fresh event, or for a manual invitation (a direct human
// add to a running conference -- it rings even when stale). Card-only reconciliation
// and stale automatic events raise the recent card only, never the ringer.
export function shouldRaiseRinger(isStale, isCardOnly, isManualInvite, hasActiveCalls, canProcessEvent)
{
	return !hasActiveCalls && canProcessEvent && !isCardOnly && (!isStale || isManualInvite);
}
