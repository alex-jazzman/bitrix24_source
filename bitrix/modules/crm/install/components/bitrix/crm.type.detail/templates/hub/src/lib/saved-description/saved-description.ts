// The server keeps "no description" as null, the form holds a string only. This is the one place where null becomes
// '': both the description param of class.php and the description key of the save answer pass through it.
export function toDescriptionValue(raw: unknown): string
{
	return Object.prototype.toString.call(raw) === '[object String]' ? String(raw) : '';
}

// The description key of the add/update answer. No key means nothing to reconcile, null means "saved empty".
export function readSavedDescription(responseData: unknown): string | undefined
{
	if (responseData === null || responseData === undefined || !Object.hasOwn(responseData as object, 'description'))
	{
		return undefined;
	}

	return toDescriptionValue((responseData as { description: unknown }).description);
}

// `sent` is what was typed when the request left, before the field rule trimmed its copy. The snapshot takes the
// saved value; the live field takes it only if the user has not edited the description during the request.
export function reconcileSavedDescription(
	{ sent, saved, live }: { sent: string, saved: string, live: string },
): { snapshot: string, live: string }
{
	return {
		snapshot: saved,
		live: live === sent ? saved : live,
	};
}

// What the store's applySavedDescription action writes: the snapshot just committed from the sent values is the
// `sent` side. Only the description changes, in the live value and in a copy of the snapshot.
export function resolveSavedDescriptionState<T extends { description?: unknown }>(
	state: { description: unknown, snapshot: T },
	saved: string,
): { description: string, snapshot: T }
{
	const result = reconcileSavedDescription({
		sent: toDescriptionValue(state.snapshot.description),
		saved,
		live: toDescriptionValue(state.description),
	});

	return {
		description: result.live,
		snapshot: { ...state.snapshot, description: result.snapshot },
	};
}

type SavedInPlaceStore = {
	applySavedDescription: (saved: string) => void,
	readonly isDirty: boolean,
};

// First step of a save that keeps the screen open, before the isDirty check: the committed snapshot holds the typed
// description and the server saved it by the field rule, so without this step a trimmed save would look like an
// edit. True when the form is clean afterwards and may be re-seeded from the saved state.
export function settleSavedDescription(store: SavedInPlaceStore, responseData: unknown): boolean
{
	const saved = readSavedDescription(responseData);
	if (saved !== undefined)
	{
		store.applySavedDescription(saved);
	}

	return !store.isDirty;
}
