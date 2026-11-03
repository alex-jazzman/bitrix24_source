/**
 * The registry arrives as an argument rather than being resolved here: two grids share the screen
 * and the one that started last owns the global resolution, so a rule that asked for it by itself
 * would take a row out of the list of messages while the reader was deleting a draft.
 */
export type HiddenRowsRegistry = {
	hiddenIds: string[],
	setHiddenIds(ids: string[]): void,
};

/**
 * The rows an action was aimed at leave the list before the server answers, and the answer arrives
 * as a reload of the table: a row the reload still holds comes back by itself, because a fresh page
 * knows nothing of what was hidden. A hidden row is still drawn - the screen goes on asking the grid
 * about it while the request is in flight (`list.es6.js:1583`).
 */
export function hideRows(registry: HiddenRowsRegistry, ids: string[]): void
{
	registry.setHiddenIds([...new Set([...registry.hiddenIds, ...ids])]);
}

/**
 * The rows the reader can see. A hidden row is still drawn and still answered for, but takes no part
 * in what the list counts and marks, the way the platform grid left it out of "select all"
 * (`rows.js:348`), of the marked rows (`rows.js:232`) and of the number of displayed ones
 * (`rows.js:183`).
 */
export function shownRows<Row extends { id: string }>(
	registry: { rows: Row[], hiddenIds: string[] },
): Row[]
{
	const hidden = new Set(registry.hiddenIds);

	return registry.rows.filter((row: Row): boolean => !hidden.has(row.id));
}
