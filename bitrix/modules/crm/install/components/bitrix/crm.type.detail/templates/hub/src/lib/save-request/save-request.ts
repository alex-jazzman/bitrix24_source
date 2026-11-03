export type SaveRequest<T> = {
	values: T;
	commit: () => void;
};

export function createSaveRequest<T>(
	getValues: () => T,
	commitSnapshot: (values: T) => void,
): SaveRequest<T>
{
	const values = getValues();

	return {
		values,
		commit: () => commitSnapshot(values),
	};
}
