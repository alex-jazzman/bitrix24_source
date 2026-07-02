import { Color } from '../../../../../../../dev/janative/types/enum/color';

declare type UserTheme = {
	id: string,
	title: string,
	previewImage: string,
	prefetchImages: string[],
	height: number,
	width: number,
	new: boolean,
	removable: boolean,
	resizable: boolean,
};

declare type TextColors = {
	light: Color,
	dark: Color,
	unknown: Color,
};
