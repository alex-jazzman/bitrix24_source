import { type RelationRow } from '../relation-rows/relation-rows';

// Which "other smart process" rows the section keeps on screen.
//
// The picker only ADDS rows; a row already on screen behaves like every CRM row above it — its switch
// turns the link off and leaves the row in place, so it can be turned back on before saving (PM). That
// is why the visible set cannot be `rows.filter(checked)`: with that, switching a process off deleted
// its row mid-edit, and there was no way back except reopening the picker.
//
// The set is session state, not stored state: a save leaves the slider open and re-seeds the form from
// the saved state (handleSavedInPlace in the app) through the registry hook the imperative controls
// use, so a process left switched off drops off screen exactly then, which is the behaviour asked for.
// "Отменить" re-seeds it through the same hook, so a process picked and then cancelled leaves too.

export function seedRevealedSmartProcessIds(rows: RelationRow[]): number[]
{
	return rows.filter((row) => row.checked).map((row) => row.entityTypeId);
}

export function withRevealedSmartProcessId(revealed: number[], entityTypeId: number): number[]
{
	return revealed.includes(entityTypeId) ? revealed : [...revealed, entityTypeId];
}

// `checked` is unioned in rather than trusted alone: a row can be switched on from outside this set
// (the dialog toggles by item id, and a future caller might too), and a checked row must never be
// invisible — an enabled link the user cannot see is worse than a stale empty row.
export function filterRevealedSmartProcessRows(rows: RelationRow[], revealed: number[]): RelationRow[]
{
	return rows.filter((row) => row.checked || revealed.includes(row.entityTypeId));
}
