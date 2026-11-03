import { type RowAction } from '../../model/grid/types';

export type MigrationLockRegistry = {
	migrationLockedMailboxIds: number[],
	setMigrationLockedMailboxIds(ids: number[]): void,
};

/**
 * The mark is put on the descriptions where they are built (`RowActionsBuilder.php`), and the panel
 * of mass actions reads the same one (`list.es6.js:434`).
 */
function isDangerous(action: RowAction): boolean
{
	return action.dataset?.migrationDangerous === true;
}

/**
 * The mailboxes the screen says are being moved, as identifiers. The screen hands over a `Set` of
 * numbers (`list.es6.js:393`); anything that is not an identifier is dropped here, so a stray value
 * cannot lock the whole list.
 *
 * Answers whether the set is other than it was: the grid is told the same thing on every load of
 * the list, and then it has nothing to redraw.
 */
export function rememberLockedMailboxes(
	registry: MigrationLockRegistry,
	mailboxIds: Iterable<unknown>,
): boolean
{
	const ids = [...mailboxIds]
		.map((id: unknown): number => Number(id))
		.filter((id: number): boolean => Number.isInteger(id) && id > 0)
	;
	const kept = registry.migrationLockedMailboxIds;
	const same = ids.length === kept.length && ids.every((id: number): boolean => kept.includes(id));

	if (same)
	{
		return false;
	}

	registry.setMigrationLockedMailboxIds(ids);

	return true;
}

/**
 * The menu of a locked row: what the move refuses stands disabled. The descriptions themselves are
 * left where they are, so the lock is a view of them and the row gets its own menu back by being
 * drawn without it - the old wrapper had to keep the originals aside (`messagegrid.js:37`).
 */
export function lockDangerousActions(actions: RowAction[]): RowAction[]
{
	return actions.map((action: RowAction): RowAction => (
		isDangerous(action)
			? { ...action, disabled: true, onclick: undefined }
			: action
	));
}
