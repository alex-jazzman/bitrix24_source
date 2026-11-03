export type ClientToggleRecord = {
	id: string;
	valueKey: string;
};

export type ClientToggleUpdate = ClientToggleRecord & {
	value: boolean;
};

export function emitClientToggle(
	record: ClientToggleRecord | null,
	checked: boolean,
	emit: (update: ClientToggleUpdate) => void,
): void
{
	if (record)
	{
		emit({ id: record.id, valueKey: record.valueKey, value: checked });
	}
}
