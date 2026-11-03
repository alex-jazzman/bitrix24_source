type PassportRecord = {
	id: string,
	valueKey?: string,
};

export type HubUpdate = {
	id: string,
	valueKey: string,
	value: string,
};

// Store actions of the update events app.ts handles; a field without one is not stored by the hub yet.
const UPDATE_ACTIONS: Readonly<Record<string, string>> = Object.freeze({
	title: 'setTitle',
	description: 'setDescription',
	isVibeEnabled: 'setIsVibeEnabled',
});

// The update event of a passport field carries its record's id and valueKey, the same shape the shell emits for a
// section field. Without the record there is nothing to route.
export function buildPassportUpdate(
	records: ReadonlyArray<PassportRecord>,
	recordId: string,
	value: string,
): HubUpdate | null
{
	const record = records.find((item) => item.id === recordId);
	if (!record || !record.valueKey)
	{
		return null;
	}

	return { id: record.id, valueKey: record.valueKey, value };
}

export function resolveUpdateAction(valueKey: string): string | null
{
	return Object.hasOwn(UPDATE_ACTIONS, valueKey) ? UPDATE_ACTIONS[valueKey] : null;
}
