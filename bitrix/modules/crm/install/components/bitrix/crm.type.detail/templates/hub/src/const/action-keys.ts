// Action keys the cards of the hub emit to the app, in one place. Four of them are the wire keys of
// the server address contract, so renaming any of them on the client alone breaks the map the
// component hands down (class.php builds it under the very same keys).

// Funnels and tunnels editor. Its address comes from the client-side crm.router, not from the
// server, which is why it stays out of SERVER_ADDRESSED_ACTION_KEYS below.
export const CATEGORY_LIST_ACTION = 'categoryList';

export const PERMISSIONS_ACTION = 'permissions';

export const BIZ_PROC_DESIGNER_ACTION = 'bizProcDesigner';

export const DOCUMENT_TEMPLATES_ACTION = 'documentTemplates';

export const REQUISITES_ACTION = 'requisites';

export const RECYCLE_BIN_ACTION = 'recycleBin';

// Keys the server sends an address for.
export const SERVER_ADDRESSED_ACTION_KEYS: ReadonlySet<string> = new Set([
	BIZ_PROC_DESIGNER_ACTION,
	DOCUMENT_TEMPLATES_ACTION,
	REQUISITES_ACTION,
	RECYCLE_BIN_ACTION,
]);

// Keys that obey "no address, no button", whoever built the address. The four above get theirs
// from the server; the funnels editor gets its own from the client-side crm.router, which app.ts
// resolves into the very same map, so a portal where that route is not registered draws no button
// instead of one that does nothing when clicked.
export const ADDRESSED_ACTION_KEYS: ReadonlySet<string> = new Set([
	...SERVER_ADDRESSED_ACTION_KEYS,
	CATEGORY_LIST_ACTION,
]);

// The gate app.ts::handleAction dispatches through: the two keys above with a destination of their
// own, plus the server-addressed family, which all reach app.ts::openServerAddressedAction and part
// ways inside it - the designer and the recycle bin open in a browser tab, documents and requisites
// in a slider. A key outside this set reaches no branch there.
export const HANDLED_ACTION_KEYS: ReadonlySet<string> = new Set([
	PERMISSIONS_ACTION,
	CATEGORY_LIST_ACTION,
	...SERVER_ADDRESSED_ACTION_KEYS,
]);
