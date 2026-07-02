/**
 * Patch flush: sending local text changes to the server.
 *
 * FLUSH_DEBOUNCE_MS — delay after the last keystroke before sending.
 * FLUSH_MAX_INTERVAL_MS — max wait during continuous typing; forces send even if user keeps typing.
 * Patches travel: AJAX savePatch → server DB + P&P broadcast → other clients.
 */
export const FLUSH_DEBOUNCE_MS = 500; // 500 ms
export const FLUSH_MAX_INTERVAL_MS = 2000; // 2 s

/**
 * Compaction: merging accumulated patches into a single yjsState snapshot.
 *
 * Runs periodically while the document is open.
 * Reduces the number of rows in b_note_document_updates and keeps yjsState fresh.
 * Also updates the markdown (ProseMirror JSON) in b_note_document for search/preview.
 */
export const COMPACT_INTERVAL_MS = 5 * 60 * 1000; // 5 min

/**
 * Awareness: presence and cursor sharing between users.
 *
 * HEARTBEAT_INTERVAL_MS — how often to broadcast "I'm still here" to other clients.
 * STALE_CHECK_INTERVAL_MS — how often to check if remote users stopped sending heartbeats.
 * STALE_TIMEOUT_S — if no heartbeat received within this time, the user is considered gone.
 * CURSOR_THROTTLE_MS — throttle for sending cursor position on click (without typing).
 *   During typing, cursor is sent together with the patch (no separate request).
 *   This throttle only applies when user clicks/moves cursor without editing.
 * SYNTHETIC_CLIENT_ID_OFFSET — offset added to userId to create a fake Yjs clientID
 *   for remote users in the local Awareness state. Ensures no collision with real Yjs clientIDs.
 */
export const HEARTBEAT_INTERVAL_MS = 20000; // 20 s
export const STALE_CHECK_INTERVAL_MS = 5000; // 5 s
export const STALE_TIMEOUT_S = 30; // 30 s
export const CURSOR_THROTTLE_MS = 700; // 700 ms
export const SYNTHETIC_CLIENT_ID_OFFSET = 0x40000000;

/**
 * Idle detection: disconnect after prolonged inactivity.
 *
 * After this timeout with no pointer/keyboard/scroll activity,
 * the provider disconnects (stops P&P, awareness, flush).
 * On next user action — full reconnect with fresh data from the server.
 */
export const IDLE_TIMEOUT_MS = 10 * 60 * 1000; // 10 min

/**
 * Offline patch persistence: localStorage backup for unsent patches.
 *
 * When savePatch fails (network error) or page closes mid-edit,
 * pending patches are saved to localStorage.
 * On next connect — they are sent to the server and applied to Y.Doc.
 * This limit prevents localStorage overflow.
 */
export const PATCH_PERSISTENCE_MAX_SIZE = 5 * 1024 * 1024; // 5 MB

/**
 * File upload size limits.
 */
export const MAX_IMAGE_SIZE = 5 * 1024 * 1024 * 1024; // 5 GB
export const MAX_FILE_SIZE = 5 * 1024 * 1024 * 1024; // 5 GB
