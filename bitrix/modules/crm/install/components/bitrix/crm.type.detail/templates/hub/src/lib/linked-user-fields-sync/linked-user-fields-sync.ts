export type LinkedUserFieldsState = {
	master: boolean;
	items: Record<string, boolean>;
};

function hasAnyChecked(items: Record<string, boolean>): boolean
{
	return Object.values(items).some(Boolean);
}

// Master toggled: turning the master OFF force-clears every child; turning it ON on its
// own changes nothing.
export function applyMasterToggle(state: LinkedUserFieldsState): LinkedUserFieldsState
{
	if (state.master)
	{
		return { master: true, items: { ...state.items } };
	}

	const items: Record<string, boolean> = {};
	Object.keys(state.items).forEach((name) => {
		items[name] = false;
	});

	return { master: false, items };
}

// A child toggled: if the master is off but at least one child is now on, force the
// master on. The asymmetry: unchecking the last child does NOT turn the master off.
export function applyChildToggle(state: LinkedUserFieldsState): LinkedUserFieldsState
{
	if (!state.master && hasAnyChecked(state.items))
	{
		return { master: true, items: { ...state.items } };
	}

	return { master: state.master, items: { ...state.items } };
}
