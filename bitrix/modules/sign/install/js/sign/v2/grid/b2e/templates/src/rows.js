export type GridRow = BX.Grid.Row;

export type GridRowMetadata = {
	id: number,
	entityType: ?string,
	initiatedByType: ?string,
	canEdit: mixed,
	canDelete: mixed,
	canEditAccess(): boolean,
	canDeleteAccess(): boolean,
};

const DEFAULT_METADATA_SELECTOR = '.sign-grid-template__cell-metadata';

function buildMetadataFromElement(element: HTMLElement): GridRowMetadata
{
	return {
		id: Number(element.dataset.id),
		entityType: element.dataset.entityType,
		initiatedByType: element.dataset.initiatedByType,
		canEdit: element.dataset.canEdit,
		canDelete: element.dataset.canDelete,
		canEditAccess(): boolean
		{
			return Boolean(this.canEdit);
		},
		canDeleteAccess(): boolean
		{
			return Boolean(this.canDelete);
		},
	};
}

export function extractRowMetadata(
	row: GridRow,
	metadataSelector: string = DEFAULT_METADATA_SELECTOR,
): GridRowMetadata | null
{
	const cellWithMetadataElement = [...row.getCells()]
		.map((cell: HTMLElement) => cell.querySelector(metadataSelector))
		.find((element) => element)
	;
	if (!cellWithMetadataElement)
	{
		return null;
	}

	return buildMetadataFromElement(cellWithMetadataElement);
}
