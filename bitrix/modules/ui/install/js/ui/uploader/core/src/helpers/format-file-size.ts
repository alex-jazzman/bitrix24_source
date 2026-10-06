import { Loc, Type } from 'main.core';

export const formatFileSize = (size: number, base: number = 1024): string => {
	let i = 0;
	const units = getUnits();
	let currentSize = size;
	while (currentSize >= base && units[i + 1])
	{
		currentSize /= base;
		i++;
	}

	const formattedSize: number | string = Type.isInteger(currentSize)
		? currentSize
		: (currentSize as number).toFixed(1);

	return formattedSize + units[i];
};

let fileSizeUnits: Array<string> | null = null;
const getUnits = (): Array<string> => {
	if (fileSizeUnits !== null)
	{
		return fileSizeUnits;
	}

	const units = Loc.getMessage('UPLOADER_FILE_SIZE_POSTFIXES')!.split(/\|/);
	fileSizeUnits = Type.isArrayFilled(units) ? units : ['B', 'kB', 'MB', 'GB', 'TB'];

	return fileSizeUnits;
};
