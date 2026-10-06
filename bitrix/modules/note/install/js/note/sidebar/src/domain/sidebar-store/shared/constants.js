export const PAGE_SIZE = 50;

// Debounce window for every re-read an access push asks for — collapses bursts of ACL updates on the
// same collection (or list-invalidations during a multi-step admin operation) and adds random jitter
// to desynchronise reconnecting clients. Shared by the readers of those pushes: the collection tree
// and the favorites block answer the same signals.
export const REFRESH_DEBOUNCE_MIN_MS = 80;
export const REFRESH_DEBOUNCE_JITTER_MS = 220;
