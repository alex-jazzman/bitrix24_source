class CellService
{
	generateId(resourceId: number, fromTs: number, toTs: number): string
	{
		return `${resourceId}-${fromTs}-${toTs}`;
	}
}

export const cellService: CellService = new CellService();
