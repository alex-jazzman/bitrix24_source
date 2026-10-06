import { Tag, Loc } from 'main.core';

export function generateTileEmptyBlock()
{
	if (BX.Disk.Documents.isBoardsPage === true)
	{
		return generateBoardsEmptyBlock();
	}

	return generateDocumentsEmptyBlock();
}

export function generateDocumentsEmptyBlock()
{
	return Tag.render`
		<div class="disk-folder-list-no-data-inner">
			<div class="disk-folder-list-no-data-inner-message">
				${Loc.getMessage('DISK_DOCUMENTS_GRID_TILE_EMPTY_DOCUMENTS_TITLE')}
			</div>
		</div>`;
}

export function generateBoardsEmptyBlock()
{
	return Tag.render`
		<div class="disk-folder-list-no-data-inner">
			<div class="disk-folder-list-no-data-inner-message">
				${Loc.getMessage('DISK_DOCUMENTS_GRID_TILE_EMPTY_BOARDS_TITLE')}
			</div>
			<div class="disk-folder-list-no-data-inner-variable">
				<div class="disk-folder-list-no-data-inner-create-file" onclick="BX.Disk.Documents.Toolbar.createBoard('boards_page');">
					${Loc.getMessage('DISK_DOCUMENTS_GRID_TILE_EMPTY_BOARDS_CREATE')}</div>
			</div>
		</div>`;
}
