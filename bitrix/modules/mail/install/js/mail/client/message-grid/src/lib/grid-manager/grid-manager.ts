import { Reflection, Type } from 'main.core';

/** One record of the registry, in the shape the screen destructures it (`{ id, instance }`). */
type GridRecord = {
	id: string,
	instance: unknown,
	old: null,
};

type GridRegistry = {
	data: GridRecord[],
	push(id: string, instance: unknown): void,
	getById(id: string): GridRecord | null,
	getInstanceById(id: string): unknown,
};

type MainNamespace = {
	gridManager?: GridRegistry,
};

/**
 * The registry of grids of the platform, `BX.Main.gridManager` - the one place the screen looks a
 * grid up in, and none of those call sites is ours to change.
 *
 * The registry ships with the template of the platform grid, which the new path renders no more, so
 * it is built here when the page has none. The definition of the platform guards itself the same
 * way (`main.ui.grid/templates/.default/src/js/manager.js:11`).
 */
function resolveRegistry(): GridRegistry
{
	const main = Reflection.namespace('BX.Main') as MainNamespace;
	if (main.gridManager)
	{
		return main.gridManager;
	}

	const registry: GridRegistry = {
		data: [],

		push(id: string, instance: unknown): void
		{
			if (Type.isStringFilled(id) && instance && this.getById(id) === null)
			{
				this.data.push({ id, instance, old: null });
			}
		},

		getById(id: string): GridRecord | null
		{
			const found = this.data.filter((record: GridRecord): boolean => {
				return record.id === id || record.id.replace('main_grid_', '') === id;
			});

			return found.length === 1 ? found[0] : null;
		},

		getInstanceById(id: string): unknown
		{
			return this.getById(id)?.instance ?? null;
		},
	};

	main.gridManager = registry;

	return registry;
}

export function registerGrid(gridId: string, grid: unknown): void
{
	resolveRegistry().push(gridId, grid);
}
