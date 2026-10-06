import { Type } from 'main.core';
import { DiskIconType } from 'ui.icon-set.api.disk';

import { FileTypeFilter } from '../../const/picker';

type IconTypeInput = {
	isFolder: boolean,
	extension: string | null,
	fileType: string | null,
};

// The product has no ready extension-or-category to icon-type mapping, so the
// picker builds its own. A known extension wins (it carries the exact glyph);
// otherwise the file-type category picks a representative icon; folders always
// use the folder glyph. Every returned value is a valid `DiskIconType`, so
// `BDiskIcon` never falls back with a console warning.
const CATEGORY_FALLBACK: { [key: string]: string } = Object.freeze({
	[FileTypeFilter.Image]: DiskIconType.jpg,
	[FileTypeFilter.Video]: DiskIconType.video,
	[FileTypeFilter.Board]: DiskIconType.board,
	[FileTypeFilter.Document]: DiskIconType.doc,
	[FileTypeFilter.Spreadsheet]: DiskIconType.xls,
	[FileTypeFilter.Presentation]: DiskIconType.ppt,
});

export function resolveIconType(input: IconTypeInput): string
{
	if (input.isFolder)
	{
		return DiskIconType.folder;
	}

	const iconTypes = DiskIconType as { [key: string]: string };
	const extension = Type.isString(input.extension) ? input.extension.toLowerCase() : '';
	if (extension !== '' && Object.prototype.hasOwnProperty.call(iconTypes, extension))
	{
		return iconTypes[extension];
	}

	const byCategory = input.fileType === null ? undefined : CATEGORY_FALLBACK[input.fileType];

	return byCategory ?? DiskIconType.file;
}
